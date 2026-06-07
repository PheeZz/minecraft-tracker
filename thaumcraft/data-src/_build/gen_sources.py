# -*- coding: utf-8 -*-
"""Thaumcraft ecosystem: item-name localization + aspect-source (scanning) data.

Outputs:
  thaumcraft/data-src/item-names.json   - every item/block/tile display name (EN/RU) per mod
  thaumcraft/data-src/aspect-sources.json - object/entity -> aspect tags (what gives each aspect)
"""
import re, json, os, glob, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
ASSETS = os.path.join(PROJ, "thaumcraft", "_assets")

MODS = [
    ("Thaumcraft","decompTC", os.path.join(ASSETS,"lang")),
    ("MagicBees","decompMB2", os.path.join(ASSETS,"lang_addons","magicbees")),
    ("ForbiddenMagic","decompFM", os.path.join(ASSETS,"lang_addons","forbidden")),
    ("TaintedMagic","decompTM", os.path.join(ASSETS,"lang_addons","taintedmagic")),
    ("ThaumicTinkerer","decompTT", os.path.join(ASSETS,"lang_addons","ttinkerer")),
    ("AppliedEnergistics2","decompAE2", os.path.join(ASSETS,"lang_addons","ae2")),
    ("BloodArsenal","decompBA", os.path.join(ASSETS,"lang_addons","bloodarsenal")),
    ("Avaritia","decompAV", os.path.join(ASSETS,"lang_addons","avaritia")),
    ("Alfheim","decompAL", os.path.join(ASSETS,"lang_addons","alfheim")),
    ("LoliMagically","decompLM", os.path.join(ASSETS,"lang_addons","lolimagically")),
]

SERVER = "LoliLand"   # data is specific to this server's modpack/versions; re-target by re-running per server

def load_lang(p):
    d={}
    if p and os.path.exists(p):
        for line in open(p,encoding="utf-8",errors="replace"):
            line=line.rstrip("\n")
            if "=" in line and not line.lstrip().startswith("#"):
                k,v=line.split("=",1); d[k.strip()]=v.strip()
    return d

# ---------------- item-names.json : tile.*.name / item.*.name across all mods
items_out=[]
seen=set()
for mod,_,langdir in MODS:
    en=load_lang(os.path.join(langdir,"en_US.lang"))
    ru=load_lang(os.path.join(langdir,"ru_RU.lang"))
    for k,v in en.items():
        if (k.startswith("item.") or k.startswith("tile.")) and k.endswith(".name"):
            if k in seen: continue
            seen.add(k)
            items_out.append({"key":k,"mod":mod,"name_en":v,"name_ru":ru.get(k,"")})
items_out.sort(key=lambda x:(x["mod"],x["key"]))
NAME = {i["key"]: i for i in items_out}   # lang-key -> {name_en,name_ru}
VANILLA = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","vanilla-names.json"),encoding="utf-8"))["fields"]
FIELDNAMES = json.load(open(os.path.join(PROJ,"thaumcraft","data-src","field-names.json"),encoding="utf-8"))["fields"]

def resolve_name(fld, meta):
    cap = fld[0].upper()+fld[1:]
    cands=[]
    for pre,base in (("item",cap),("item",fld),("tile",fld),("tile",cap)):
        if meta is not None: cands.append("%s.%s.%s.name"%(pre,base,meta))
        cands.append("%s.%s.name"%(pre,base))
    for c in cands:
        if c in NAME:
            return NAME[c]["name_en"], NAME[c]["name_ru"]
    return "", ""

json.dump({"_meta":{"server":SERVER,"generated":"2026-06-07","count":len(items_out),
                    "byMod":dict(collections.Counter(i["mod"] for i in items_out)),
                    "notes":"display names (EN/RU) for every item/block/tile lang key across the Thaumcraft ecosystem. key = vanilla unlocalized name + .name"},
           "items":items_out},
          open(os.path.join(PROJ,"thaumcraft","data-src","item-names.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)

# ---------------- aspect field -> tag (all mods, incl custom)
field_tag={}
for _,dec,_ in MODS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "Aspect(" not in t: continue
        for m in re.finditer(r'(\w+)\s*=\s*new (?:Rainbow)?Aspect\("(\w+)"',t):
            field_tag.setdefault(m.group(1),m.group(2))

# ---------------- aspect-sources.json : registerObjectTag / registerEntityTag
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

def parse_aspectlist(s):
    d={}
    for m in re.finditer(r'\.(?:add|merge)\(\s*(?:\w+\.)?(\w+),\s*(\d+)\)',s):
        d[field_tag.get(m.group(1),m.group(1).lower())]=int(m.group(2))
    return d

def subject(arg):
    arg=arg.strip()
    if arg.startswith('"'):
        return {"type":"oredict","id":arg.strip('"')}
    arg=re.sub(r'new ItemStack\(\s*\((?:Block|Item)\)\s*','new ItemStack(',arg)  # strip casts
    m=re.search(r'new ItemStack\(([^,)]+)(?:,\s*\d+\s*,\s*(\d+|Short\.MAX_VALUE))?',arg)
    if m:
        ref=m.group(1).strip()
        meta=m.group(2)
        meta=(None if meta in (None,"Short.MAX_VALUE") else int(meta))
        out={"type":"item","ref":ref,"meta":meta}
        fm=re.match(r'(?:ConfigItems|ConfigBlocks)\.(\w+)',ref)
        if fm:
            en,ru=resolve_name(fm.group(1),meta)
            if en: out["name_en"]=en; out["name_ru"]=ru
        vm=re.match(r'(?:Items|Blocks)\.(\w+)',ref)
        if vm and vm.group(1) in VANILLA:
            v=VANILLA[vm.group(1)]; out["reg"]=v["reg"]; out["name_en"]=v["name_en"]; out["name_ru"]=v["name_ru"]
        if "name_en" not in out:
            fn=FIELDNAMES.get(ref.split(".")[-1])
            if fn: out["name_en"]=fn["name_en"]; out["name_ru"]=fn["name_ru"]
        return out
    return {"type":"raw","ref":arg[:80]}

sources=[]
entities=[]
src_counts=collections.Counter()
for mod,dec,_ in MODS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        if "registerObjectTag" not in t and "registerEntityTag" not in t and "registerComplexObjectTag" not in t:
            continue
        for meth in ("registerComplexObjectTag","registerObjectTag","registerEntityTag"):
            for m in re.finditer(meth+r'\(',t):
                inner,end=balanced(t,m.end()-1)
                if end<0: continue
                args=split_top(inner)
                if not args: continue
                al_idx=next((i for i,a in enumerate(args) if "AspectList" in a),None)
                if al_idx is None: continue
                asp=parse_aspectlist(args[al_idx])
                if not asp: continue
                if meth=="registerEntityTag":
                    nm=args[0].strip().strip('"')
                    entities.append({"entity":nm,"mod":mod,"aspects":asp})
                else:
                    sub=subject(args[0])
                    sources.append({"subject":sub,"mod":mod,"aspects":asp,"complex":meth=="registerComplexObjectTag"})
                src_counts[mod]+=1

# aspect -> sources index (what gives aspect X): from oredict-string subjects (clean)
gives=collections.defaultdict(list)
for s in sources:
    if s["subject"]["type"]=="oredict":
        for tag in s["aspects"]:
            gives[tag].append(s["subject"]["id"])
gives={k:sorted(set(v)) for k,v in sorted(gives.items())}

json.dump({"_meta":{"server":SERVER,"generated":"2026-06-07",
                    "objectTags":len(sources),"entityTags":len(entities),
                    "byMod":dict(src_counts),
                    "notes":"object/entity scanning tags. subject.type: oredict (ore-dictionary id, directly usable) | item (ConfigItems/ConfigBlocks/Items/Blocks field ref + meta) | raw. 'aspectGivers' indexes aspect->oredict sources (item-ref sources omitted there since names need resolution)."},
           "objectTags":sources,"entityTags":entities,"aspectGivers":gives},
          open(os.path.join(PROJ,"thaumcraft","data-src","aspect-sources.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)

print("item-names:",len(items_out))
print("object tags:",len(sources),"| entity tags:",len(entities),"| byMod:",dict(src_counts))
print("aspectGivers (oredict) for",len(gives),"aspects")
