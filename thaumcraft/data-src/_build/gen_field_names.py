# -*- coding: utf-8 -*-
"""Resolve mod item/block FIELD names -> display names (EN/RU).

Scans all decompiled mods for the field's unlocalized/registry name
(`field = new ItemX().func_77655_b("Unloc")`, `func_149663_c` for blocks,
`GameRegistry.registerItem/Block(field, "RegName")`, `register(new X(), "Name")`)
and resolves each to a display name via the merged lang (item-names.json).
Output: thaumcraft/data-src/field-names.json  {fieldName: {name_en,name_ru,via}}
"""
import re, json, os, glob, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
DECDIRS = ["decompTC","decompMB2","decompFM","decompTM","decompTT","decompAE2","decompBA","decompAV","decompAL","decompLM"]

NAME = {i["key"]: i for i in json.load(open(os.path.join(PROJ,"thaumcraft","data-src","item-names.json"),encoding="utf-8"))["items"]}

# field -> ORDERED candidate unloc/registry strings (strong = explicit registration first)
strong = collections.defaultdict(list)   # registerItem/Block(field,"name")
weak = collections.defaultdict(list)      # field = new X().func_77655_b("U")
# CFR emits one statement per line -> scan line-by-line to avoid cross-statement contamination
P_UNLOC = re.compile(r'\b(\w+)\s*=\s*new\b.*?func_77655_b\("([^"]+)"')
P_BLOCK = re.compile(r'\b(\w+)\s*=\s*new\b.*?func_149663_c\("([^"]+)"')
P_REGITEM = re.compile(r'registerItem\(\s*\(?\s*Item\s*\)?\s*(\w+)\s*,\s*\(?\s*String\s*\)?\s*"([^"]+)"')
P_REGBLOCK = re.compile(r'registerBlock\(\s*\(?\s*Block\s*\)?\s*(\w+)\s*,\s*(?:[^,]*,\s*)?\(?\s*String\s*\)?\s*"([^"]+)"')
P_REGHELP = re.compile(r'\b(\w+)\s*=\s*\w+\.register\w*\(\s*new\b.*?,\s*"([^"]+)"\s*\)')

def addcand(d, fld, nm):
    nm = nm.split(":")[-1]
    if nm not in d[fld]: d[fld].append(nm)

for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: lines=open(jf,encoding="utf-8",errors="replace").read().splitlines()
        except: continue
        for ln in lines:
            for pat in (P_REGITEM, P_REGBLOCK):
                m = pat.search(ln)
                if m: addcand(strong, m.group(1), m.group(2))
            for pat in (P_UNLOC, P_BLOCK, P_REGHELP):
                m = pat.search(ln)
                if m: addcand(weak, m.group(1), m.group(2))

def lookup(c):
    for k in ("item.%s.name"%c, "tile.%s.name"%c):
        if k in NAME: return NAME[k]["name_en"], NAME[k]["name_ru"]
    return None

def resolve(fld):
    for src in (strong, weak):
        for c in src.get(fld, ()):
            r = lookup(c)
            if r: return r[0], r[1], c
    return None

cand = {f: (strong.get(f,[])+weak.get(f,[])) for f in set(strong)|set(weak)}

out = {}
for fld in cand:
    r = resolve(fld)
    if r:
        out[fld] = {"name_en": r[0], "name_ru": r[1], "via": r[2]}

json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(out),
                    "scanned_fields":len(cand),
                    "notes":"fieldName -> resolved display name via the mod's unlocalized/registry id and merged lang. Keyed by the bare field identifier (last segment of e.g. ForbiddenItems.deadlyShards)."},
           "fields":out},
          open(os.path.join(PROJ,"thaumcraft","data-src","field-names.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)
print("scanned fields:",len(cand),"| resolved:",len(out))
for f in ("deadlyShards","singularity","itemShard","itemWandRod"):
    print(" ",f,"->",out.get(f))
