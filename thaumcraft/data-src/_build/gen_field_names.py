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
for fld in set(strong) | set(weak):
    bases = []
    for c in strong.get(fld, []) + weak.get(fld, []):
        if c not in bases: bases.append(c)
    rec = {"bases": bases}            # raw unloc/registry candidates (for base.meta.name resolution)
    r = resolve(fld)
    if r:
        rec["name_en"], rec["name_ru"], rec["via"] = r
    out[fld] = rec

# ---- sub-item engine: field -> class -> meta -> name (string-suffix & separate-registry subtypes)
# 1) field -> constructed class name
field_class = {}
# 2) class -> (kind, array, literal)   kind A: base + "." + arr[meta]; kind B: "literal" + arr[meta]
class_meta = {}
for dec in DECDIRS:
    for jf in glob.glob(os.path.join(DEC,dec,"**","*.java"),recursive=True):
        try: t=open(jf,encoding="utf-8",errors="replace").read()
        except: continue
        for ln in t.splitlines():
            m = re.search(r'\b(\w+)\s*=\s*[^;=]*?\bnew (\w+)\(', ln)
            if m: field_class.setdefault(m.group(1), []).append(m.group(2))
        cm = re.search(r'\bclass (\w+)\b', t)
        if not cm or "func_77667_c" not in t: continue
        cls = cm.group(1)
        arrays = {}
        for am in re.finditer(r'String\[\]\s+(\w+)\s*=\s*(?:new String\[\]\s*)?\{([^}]*)\}', t):
            arrays[am.group(1)] = [s.strip().strip('"') for s in am.group(2).split(",") if s.strip()]
        fm = re.search(r'func_77667_c\([^)]*\)\s*\{(.*?)\n    \}', t, re.S)
        body = fm.group(1) if fm else ""
        rm = re.search(r'return\s+(.+?);', body, re.S)
        ret = rm.group(1) if rm else ""
        arr_ref = re.search(r'(\w+)\s*\[', ret)
        if not arr_ref or arr_ref.group(1) not in arrays: continue
        arr = arrays[arr_ref.group(1)]
        litm = re.search(r'"((?:item|tile)\.[^"]*)"\s*\+', ret)
        if "func_77658_a()" in ret or "func_77658_a ()" in ret:
            class_meta[cls] = ("A", arr, None)
        elif litm:
            class_meta[cls] = ("B", arr, litm.group(1))

def base_of(fld):
    bs = out.get(fld, {}).get("bases", [])
    return bs[0] if bs else (fld[0].upper()+fld[1:] if fld else fld)

subcount = 0
for fld, rec in out.items():
    cm = next((class_meta[c] for c in field_class.get(fld, []) if c in class_meta), None)
    if not cm: continue
    kind, arr, lit = cm
    metas = {}
    for i, suf in enumerate(arr):
        if kind == "A":
            keys = ["item.%s.%s.name"%(base_of(fld), suf), "tile.%s.%s.name"%(base_of(fld), suf)]
        else:
            keys = ["%s%s.name"%(lit, suf)]
        for k in keys:
            if k in NAME:
                metas[str(i)] = {"name_en": NAME[k]["name_en"], "name_ru": NAME[k]["name_ru"]}
                break
    if metas:
        rec["metas"] = metas; subcount += 1
print("sub-item fields with per-meta names:", subcount)

json.dump({"_meta":{"server":"LoliLand","generated":"2026-06-07","count":len(out),
                    "scanned_fields":len(cand),
                    "notes":"fieldName -> resolved display name via the mod's unlocalized/registry id and merged lang. Keyed by the bare field identifier (last segment of e.g. ForbiddenItems.deadlyShards)."},
           "fields":out},
          open(os.path.join(PROJ,"thaumcraft","data-src","field-names.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)
print("scanned fields:",len(cand),"| resolved:",len(out))
for f in ("deadlyShards","singularity","itemShard","itemWandRod"):
    print(" ",f,"->",out.get(f))
