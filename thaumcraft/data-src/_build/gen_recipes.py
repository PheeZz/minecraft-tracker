# -*- coding: utf-8 -*-
"""Thaumcraft recipe extractor (crucible / arcane / infusion / enchantment).

Parses ThaumcraftApi.add*Recipe(...) calls across Thaumcraft core + addons,
resolving item refs to display names (EN/RU) via item-names.json where possible,
and capturing aspect costs (the high-value data) + research links + instability.
Output: thaumcraft/data-src/recipes.json
"""
import re, json, os, glob, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
OUT = os.path.join(PROJ, "thaumcraft", "data-src", "recipes.json")

DECDIRS = ["decompTC","decompMB2","decompFM","decompTM","decompTT","decompAE2","decompBA","decompAV","decompAL"]

# ---- item-name lang (from generated item-names.json) : lang-key -> {en,ru}
names = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","item-names.json"),encoding="utf-8"))
NAME = {i["key"]: i for i in names["items"]}

# aspect field -> tag
field_tag = {}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Aspect(" not in t: continue
        for m in re.finditer(r'(\w+)\s*=\s*new (?:Rainbow)?Aspect\("(\w+)"',t):
            field_tag.setdefault(m.group(1),m.group(2))

def resolve_item(tok):
    tok = tok.strip()
    if tok.startswith('"'):
        return {"oredict": tok.strip('"')}
    m = re.search(r'(?:ConfigItems|ConfigBlocks)\.(\w+)', tok)
    if m:
        fld = m.group(1)
        # meta = the 3rd positional int in new ItemStack(field, count, meta)
        mm = re.search(r'(?:ConfigItems|ConfigBlocks)\.\w+\s*,\s*\w+\s*,\s*(\d+)', tok)
        meta = mm.group(1) if mm else None
        cands = []
        cap = fld[0].upper()+fld[1:]
        for pre,base in (("item",cap),("item",fld),("tile",fld),("tile",cap)):
            if meta is not None:
                cands.append("%s.%s.%s.name"%(pre,base,meta))
            cands.append("%s.%s.name"%(pre,base))
        for c in cands:
            if c in NAME:
                return {"ref":fld,"meta":(int(meta) if meta else None),
                        "name_en":NAME[c]["name_en"],"name_ru":NAME[c]["name_ru"]}
        return {"ref":fld,"meta":(int(meta) if meta else None)}
    m = re.search(r'(?<![A-Za-z])(?:Items|Blocks)\.(\w+)', tok)
    if m:
        return {"vanilla":m.group(1)}
    m = re.search(r'new ItemStack\(\s*(\w+)', tok)
    if m:
        return {"ref":m.group(1)}
    return {"raw":tok[:60]}

def balanced(s,start):
    depth=0
    for i in range(start,len(s)):
        if s[i]=="(":depth+=1
        elif s[i]==")":
            depth-=1
            if depth==0:return s[start+1:i],i
    return None,-1
def split_top(s):
    out,depth,cur,instr,esc=[],0,"",False,False
    for ch in s:
        if instr:
            cur+=ch
            if esc:esc=False
            elif ch=="\\":esc=True
            elif ch=='"':instr=False
            continue
        if ch=='"':instr=True;cur+=ch;continue
        if ch in "([{":depth+=1
        elif ch in ")]}":depth-=1
        if ch=="," and depth==0:out.append(cur);cur=""
        else:cur+=ch
    if cur.strip():out.append(cur)
    return [x.strip() for x in out]

def parse_aspects(s):
    d={}; computed=False
    for m in re.finditer(r'\.(?:add|merge)\(\s*(?:\w+\.)?(\w+),\s*([^),]+)\)',s):
        tag=field_tag.get(m.group(1),m.group(1).lower())
        val=m.group(2).strip()
        if re.fullmatch(r'\d+',val): d[tag]=int(val)
        else: d[tag]=None; computed=True
    return d,computed

TYPES = {
    "addCrucibleRecipe":"crucible",
    "addArcaneCraftingRecipe":"arcane",
    "addShapelessArcaneCraftingRecipe":"arcane_shapeless",
    "addInfusionCraftingRecipe":"infusion",
    "addInfusionEnchantmentRecipe":"infusion_enchantment",
}
MODNAME = {"decompTC":"Thaumcraft","decompMB2":"MagicBees","decompFM":"ForbiddenMagic",
           "decompTM":"TaintedMagic","decompTT":"ThaumicTinkerer","decompAE2":"AppliedEnergistics2",
           "decompBA":"BloodArsenal","decompAV":"Avaritia","decompAL":"Alfheim"}

recipes=[]
for dec in DECDIRS:
    mod=MODNAME[dec]
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Recipe(" not in t: continue
        for meth,rtype in TYPES.items():
            for m in re.finditer(r'ThaumcraftApi\.'+meth+r'\(',t):
                inner,end=balanced(t,m.end()-1)
                if end<0: continue
                args=split_top(inner)
                if len(args)<3: continue
                research=args[0].strip().strip('"')
                al_idx=next((i for i,a in enumerate(args) if "AspectList" in a),None)
                aspects,computed=({},False)
                if al_idx is not None:
                    aspects,computed=parse_aspects(args[al_idx])
                rec={"research":research,"type":rtype,"mod":mod}
                # output = first arg that is an item (usually arg1)
                out_idx=1 if rtype not in ("crucible",) else 1
                rec["output"]=resolve_item(args[1]) if len(args)>1 else None
                rec["aspects"]=aspects
                if computed: rec["aspectsComputed"]=True
                if rtype=="crucible" and len(args)>=3:
                    # addCrucibleRecipe(research, output, input, aspectList)
                    rec["input"]=resolve_item(args[2])
                if rtype in ("infusion","infusion_enchantment"):
                    # ...(research, output, instability:int, aspectList, central, components[])
                    if al_idx and al_idx>=3:
                        mm=re.search(r'-?\d+',args[al_idx-1]); rec["instability"]=int(mm.group()) if mm else None
                    if al_idx is not None and al_idx+1<len(args):
                        rec["central"]=resolve_item(args[al_idx+1])
                        comps=[]
                        for a in args[al_idx+2:]:
                            for it in re.findall(r'new ItemStack\([^)]*\)|"[a-zA-Z][\w]*"',a):
                                comps.append(resolve_item(it))
                        if comps: rec["components"]=comps
                else:
                    # crafting inputs: item/oredict tokens after aspectList (skip layout chars)
                    ins=[]
                    tail=args[(al_idx+1):] if al_idx is not None else args[2:]
                    for a in tail:
                        for it in re.findall(r'new ItemStack\([^)]*\)|"[a-z][\w]*"',a):
                            r=resolve_item(it)
                            if r not in ins: ins.append(r)
                    if ins: rec["inputs"]=ins
                recipes.append(rec)

by_type=collections.Counter(r["type"] for r in recipes)
by_mod=collections.Counter(r["mod"] for r in recipes)
named=sum(1 for r in recipes if r.get("output",{}) and ("name_en" in (r["output"] or {})))
json.dump({"_meta":{"generated":"2026-06-07","count":len(recipes),
                    "byType":dict(by_type),"byMod":dict(by_mod),
                    "outputsNamed":named,
                    "notes":"aspects = essentia/vis cost (null value = computed at runtime, see aspectsComputed). output/input/central/components/inputs resolved to EN/RU names where the item ref maps to a lang key; otherwise {ref,meta} (ConfigItems/ConfigBlocks field) or {vanilla:srgName} or {oredict}. research = linked research key. infusion has instability + central + components."},
           "recipes":recipes},
          open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("recipes:",len(recipes),"| byType:",dict(by_type))
print("byMod:",dict(by_mod),"| outputs named:",named)
