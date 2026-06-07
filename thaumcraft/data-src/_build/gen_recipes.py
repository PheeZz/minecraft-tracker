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
# ---- vanilla SRG field -> {reg,name_en,name_ru}
VANILLA = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","vanilla-names.json"),encoding="utf-8"))["fields"]
# ---- mod field name -> {name_en,name_ru}
FIELDNAMES = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","field-names.json"),encoding="utf-8"))["fields"]

# aspect field -> tag
field_tag = {}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Aspect(" not in t: continue
        for m in re.finditer(r'(\w+)\s*=\s*new (?:Rainbow)?Aspect\("(\w+)"',t):
            field_tag.setdefault(m.group(1),m.group(2))

def name_bases(fld):
    bases = list(FIELDNAMES.get(fld, {}).get("bases", []))   # raw unloc/registry ids (e.g. WandRod)
    for b in (fld, fld[0].upper()+fld[1:] if fld else fld):
        if b not in bases: bases.append(b)
    for pre in ("item", "Item", "block", "Block"):           # itemWandRod -> WandRod
        if fld.startswith(pre) and len(fld) > len(pre):
            b = fld[len(pre):]
            if b not in bases: bases.append(b)
    return bases

def name_for(fld, meta):
    bases = name_bases(fld)
    if meta is not None:
        for b in bases:
            for k in ("item.%s.%s.name"%(b,meta), "tile.%s.%s.name"%(b,meta)):
                if k in NAME: return NAME[k]["name_en"], NAME[k]["name_ru"]
    for b in bases:
        for k in ("item.%s.name"%b, "tile.%s.name"%b):
            if k in NAME: return NAME[k]["name_en"], NAME[k]["name_ru"]
    fn = FIELDNAMES.get(fld)
    if fn and "name_en" in fn: return fn["name_en"], fn["name_ru"]
    return None

def meta_of(tok):
    mm = re.search(r'new ItemStack\([^,)]+,\s*\w+\s*,\s*(\d+)', tok)
    return int(mm.group(1)) if mm else None

def resolve_item(tok):
    tok = tok.strip()
    if tok.startswith('"'):
        return {"oredict": tok.strip('"')}
    meta = meta_of(tok)
    m = re.search(r'(?:ConfigItems|ConfigBlocks)\.(\w+)', tok)
    if m:
        fld = m.group(1); out = {"ref": fld, "meta": meta}
        r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        return out
    m = re.search(r'(?<![A-Za-z])(?:Items|Blocks)\.(\w+)', tok)
    if m:
        fld = m.group(1); v = VANILLA.get(fld)
        if v: return {"vanilla":fld,"reg":v["reg"],"name_en":v["name_en"],"name_ru":v["name_ru"]}
        return {"vanilla": fld}
    m = re.search(r'new ItemStack\(\s*([\w.]+)', tok)
    if m:
        ref = m.group(1); fld = ref.split(".")[-1]; out = {"ref": ref, "meta": meta}
        r = name_for(fld, meta)
        if r: out["name_en"], out["name_ru"] = r
        return out
    return {"raw": tok[:60]}

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
                elif rtype=="arcane":
                    # shaped: rows (1-3 short strings) then Character/ingredient pairs
                    spec=args[(al_idx+1):] if al_idx is not None else args[2:]
                    rows=[]; i=0
                    while i<len(spec) and re.fullmatch(r'"[A-Za-z0-9 ._]{1,3}"', spec[i].strip()):
                        rows.append(spec[i].strip().strip('"')); i+=1
                    key={}
                    while i<len(spec):
                        cm=re.search(r"Character\.valueOf\('(.)'\)|^'(.)'$", spec[i].strip())
                        if cm and i+1<len(spec):
                            ch=cm.group(1) or cm.group(2)
                            key[ch]=resolve_item(spec[i+1]); i+=2
                        else: i+=1
                    if rows: rec["shape"]=rows
                    if key: rec["key"]=key
                else:
                    # shapeless arcane: flat ingredient list
                    ins=[]
                    tail=args[(al_idx+1):] if al_idx is not None else args[2:]
                    for a in tail:
                        for it in re.findall(r'new ItemStack\([^)]*\)|"[a-z][\w]*"',a):
                            r=resolve_item(it)
                            if r not in ins: ins.append(r)
                    if ins: rec["inputs"]=ins
                recipes.append(rec)

# ---- item warp: addWarpToItem(itemstack, n)
warp_items=[]
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "addWarpToItem" not in t: continue
        for m in re.finditer(r'addWarpToItem\(\s*(?:\(ItemStack\)\s*)?(new ItemStack\([^;]*?\)|\w[\w.]*)\s*,\s*(?:\(int\)\s*)?(\d+)\s*\)',t):
            warp_items.append({"item":resolve_item(m.group(1)),"warp":int(m.group(2)),"mod":MODNAME[dec]})

# ---- infernal furnace smelting bonus + loot bags
smelting=[]; loot=[]
LOOTBAG={0:"common",1:"uncommon",2:"rare"}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        for m in re.finditer(r'addSmeltingBonus\(\s*((?:new ItemStack\([^)]*\))|"[^"]+")\s*,\s*((?:new ItemStack\([^)]*\))|"[^"]+")',t):
            smelting.append({"input":resolve_item(m.group(1)),"output":resolve_item(m.group(2)),"mod":MODNAME[dec]})
        for m in re.finditer(r'addLootBagItem\(\s*(new ItemStack\([^)]*\))\s*,\s*(\d+)\s*((?:,\s*\d+\s*)*)\)',t):
            bags=[int(x) for x in re.findall(r'\d+',m.group(3))]
            loot.append({"item":resolve_item(m.group(1)),"weight":int(m.group(2)),
                         "rarities":[LOOTBAG.get(b,b) for b in bags],"mod":MODNAME[dec]})
import collections as _c
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(smelting),
                    "notes":"Infernal Furnace bonus drops: smelting `input` (ore/item) yields a chance of bonus `output`."},
           "smeltingBonus":smelting},
          open(os.path.join(PROJ,"thaumcraft","data-src","smelting-bonus.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(loot),
                    "rarityLevels":LOOTBAG,
                    "notes":"Eldritch loot bag contents. weight = relative drop weight; rarities = which bag tiers (common/uncommon/rare) contain it."},
           "lootBags":loot},
          open(os.path.join(PROJ,"thaumcraft","data-src","loot-bags.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("smelting bonus:",len(smelting),"| loot bag items:",len(loot))

by_type=collections.Counter(r["type"] for r in recipes)
by_mod=collections.Counter(r["mod"] for r in recipes)
named=sum(1 for r in recipes if r.get("output",{}) and ("name_en" in (r["output"] or {})))
json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(recipes),
                    "byType":dict(by_type),"byMod":dict(by_mod),
                    "outputsNamed":named,"warpItems":len(warp_items),
                    "notes":"aspects = essentia/vis cost (null value = computed at runtime, see aspectsComputed). output/input/central/components/inputs/key resolved to EN/RU names where the item ref maps to a lang key; otherwise {ref,meta} or {vanilla:srgName} or {oredict}. research = linked research key. arcane has shape[] (grid rows) + key{char:ingredient}. infusion has instability + central + components[]. warpItems = sanity (warp) gained from holding/crafting items."},
           "recipes":recipes,"warpItems":warp_items},
          open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("recipes:",len(recipes),"| byType:",dict(by_type))
print("byMod:",dict(by_mod),"| outputs named:",named)
