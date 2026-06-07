# -*- coding: utf-8 -*-
"""Unified Thaumcraft 4 + addons extractor.

Scans decompiled Thaumcraft core and every Thaumcraft addon that registers
aspects/research, plus all their lang files, and produces:
  thaumcraft/data-src/aspects.json   (48 core + addon custom aspects)
  thaumcraft/data-src/research.json   (core + addon research, RU-priority descriptions)

Research descriptions are built from the thaumonomicon text pages (RU first,
EN fallback), cleaned of <BR>/§ formatting; raw page keys are kept too.
"""
import re, json, os, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
ASSETS = os.path.join(PROJ, "thaumcraft", "_assets")
OUT_A = os.path.join(PROJ, "thaumcraft", "data-src", "aspects.json")
OUT_R = os.path.join(PROJ, "thaumcraft", "data-src", "research.json")

# mod -> (decomp dir, lang dir, category-label-prefix)
MODS = [
    ("Thaumcraft",     "decompTC",  os.path.join(ASSETS, "lang")),
    ("MagicBees",      "decompMB2", os.path.join(ASSETS, "lang_addons", "magicbees")),
    ("ForbiddenMagic", "decompFM",  os.path.join(ASSETS, "lang_addons", "forbidden")),
    ("TaintedMagic",   "decompTM",  os.path.join(ASSETS, "lang_addons", "taintedmagic")),
    ("ThaumicTinkerer","decompTT",  os.path.join(ASSETS, "lang_addons", "ttinkerer")),
    ("AppliedEnergistics2","decompAE2", os.path.join(ASSETS, "lang_addons", "ae2")),
    ("BloodArsenal",   "decompBA",  os.path.join(ASSETS, "lang_addons", "bloodarsenal")),
    ("Avaritia",       "decompAV",  os.path.join(ASSETS, "lang_addons", "avaritia")),
    ("Alfheim",        "decompAL",  os.path.join(ASSETS, "lang_addons", "alfheim")),
    ("LoliMagically",  "decompLM",  os.path.join(ASSETS, "lang_addons", "lolimagically")),
]

# ---------------------------------------------------------------- lang (merged)
def load_lang(path):
    d = {}
    if path and os.path.exists(path):
        for line in open(path, encoding="utf-8", errors="replace"):
            line = line.rstrip("\n")
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                d[k.strip()] = v.strip()
    return d

EN, RU = {}, {}
for _, _, langdir in MODS:
    EN.update(load_lang(os.path.join(langdir, "en_US.lang")))
    RU.update(load_lang(os.path.join(langdir, "ru_RU.lang")))

# research-name index: trailing-key -> value (for resolving names regardless of prefix/ns)
def build_name_index(lang):
    idx = {}
    for k, v in lang.items():
        if "research_name" in k:
            tail = k.split("research_name.", 1)[1]
            idx[tail] = v                       # e.g. "appliedenergistics2.TECORES" or "MB_Root"
            idx[tail.split(".")[-1]] = v        # last segment
    return idx
NAME_EN, NAME_RU = build_name_index(EN), build_name_index(RU)

def clean(s):
    if not s: return s
    s = re.sub(r'<BR>|<br>', '\n', s)
    s = re.sub(r'§.', '', s)
    s = re.sub(r'<[^>]+>', '', s)
    return s.strip()

# ---------------------------------------------------------------- aspect field -> tag map (all mods)
field_tag = {}
for _, dec, _ in MODS:
    for jf in glob.glob(os.path.join(DEC, dec, "**", "*.java"), recursive=True):
        try: txt = open(jf, encoding="utf-8", errors="replace").read()
        except: continue
        if "new Aspect(" not in txt and "RainbowAspect(" not in txt:
            continue
        for m in re.finditer(r'(\w+)\s*=\s*new (?:Rainbow)?Aspect\("(\w+)"', txt):
            field_tag.setdefault(m.group(1), m.group(2))

# ---------------------------------------------------------------- ASPECTS
def hexcolor(tok):
    tok = tok.strip()
    v = int(tok, 16) if tok.lower().startswith("0x") else int(tok)
    return "#%06X" % (v & 0xFFFFFF)

def synonyms(v):
    return [s.strip() for s in v.split(",") if s.strip()] if v else []

aspects = {}
asp_order = []
asp_re = re.compile(r'new (Rainbow)?Aspect\("(\w+)"(.*?)\)\s*;', re.S)
for mod, dec, _ in MODS:
    for jf in glob.glob(os.path.join(DEC, dec, "**", "*.java"), recursive=True):
        try: txt = open(jf, encoding="utf-8", errors="replace").read()
        except: continue
        if 'new Aspect("' not in txt and 'RainbowAspect("' not in txt:
            continue
        for m in asp_re.finditer(txt):
            rainbow = bool(m.group(1)); tag = m.group(2); rest = m.group(3)
            if tag in aspects:
                continue
            color = None
            cm = re.search(r'^\s*,\s*(0x[0-9A-Fa-f]+|\d+)', rest)
            if cm: color = hexcolor(cm.group(1))
            comps = []
            am = re.search(r'new Aspect\[\]\{([^}]*)\}', rest)
            if am:
                for c in am.group(1).split(","):
                    c = c.strip()
                    if not c: continue
                    ident = c.split(".")[-1]
                    comps.append(field_tag.get(ident, ident.lower()))
            bm = re.search(r',\s*(\d+)\s*$', rest.strip())
            blend = int(bm.group(1)) if bm else 1
            # image
            im = re.search(r'new ResourceLocation\("(\w+)",\s*"([^"]+)"\)', rest)
            image_ns, image_path = (im.group(1), im.group(2)) if im else ("thaumcraft", "textures/aspects/%s.png" % tag)
            en_syn = synonyms(EN.get("tc.aspect." + tag, ""))
            ru_syn = synonyms(RU.get("tc.aspect." + tag, ""))
            aspects[tag] = {
                "tag": tag, "mod": mod,
                "name_en": en_syn[0] if en_syn else "",
                "name_ru": ru_syn[0] if ru_syn else "",
                "synonyms_en": en_syn, "synonyms_ru": ru_syn,
                "color": color, "primal": (not comps and not rainbow),
                "rainbow": rainbow, "components": comps, "blend": blend,
                "imageNs": image_ns, "imagePath": image_path,
                "texture": "aspects/%s.png" % tag,
            }
            asp_order.append(tag)

aspect_list = [aspects[t] for t in asp_order]
prim = [a["tag"] for a in aspect_list if a["primal"]]
TEXDIR = os.path.join(PROJ, "thaumcraft", "textures")
missing_tex = [a["tag"] for a in aspect_list if not os.path.exists(os.path.join(TEXDIR, a["texture"]))]
json.dump({
    "_meta": {
        "source": "decompiled (CFR 0.152) Thaumcraft 4.2.3.5 + addons; lang from same JARs",
        "generated": "2026-06-07",
        "count": len(aspect_list),
        "byMod": {m: sum(1 for a in aspect_list if a["mod"] == m) for m in {a["mod"] for a in aspect_list}},
        "primals": prim,
        "missingTextures": missing_tex,
        "notes": "color #RRGGBB (null for rainbow/Alfheim). components = parent aspects (empty for 6 primals). texture = path under thaumcraft/textures/. imageNs/imagePath = original location inside the mod assets.",
    },
    "aspects": aspect_list,
}, open(OUT_A, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# ---------------------------------------------------------------- RESEARCH
def split_top(s):
    out, depth, cur, instr, esc = [], 0, "", False, False
    for ch in s:
        if instr:
            cur += ch
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': instr = False
            continue
        if ch == '"': instr = True; cur += ch; continue
        if ch in "([{": depth += 1
        elif ch in ")]}": depth -= 1
        if ch == "," and depth == 0: out.append(cur); cur = ""
        else: cur += ch
    if cur.strip(): out.append(cur)
    return [x.strip() for x in out]

def balanced(s, start):
    depth = 0
    for i in range(start, len(s)):
        if s[i] == "(": depth += 1
        elif s[i] == ")":
            depth -= 1
            if depth == 0: return s[start+1:i], i
    return None, -1

FLAGS = ["setSpecial","setSecondary","setRound","setStub","setVirtual","setConcealed",
         "setHidden","setLost","setAutoUnlock"]
stmt_re = re.compile(r'new \w*ResearchItem\(')

def find_name(key, lang_idx):
    if key in lang_idx: return lang_idx[key]
    for tail, v in lang_idx.items():
        if tail.endswith("." + key): return v
    return ""

def page_keys_from_lang(key):
    """fallback: any lang key matching *.(research_page|text).<KEY>.<n> in order."""
    found = []
    pat = re.compile(r'\.(?:research_page|text)\.' + re.escape(key) + r'\.(\d+)$')
    keys = set(EN) | set(RU)
    for k in keys:
        m = pat.search(k)
        if m: found.append((int(m.group(1)), k))
    return [k for _, k in sorted(found)]

research = {}
res_order = []
for mod, dec, _ in MODS:
    for jf in glob.glob(os.path.join(DEC, dec, "**", "*.java"), recursive=True):
        try: txt = open(jf, encoding="utf-8", errors="replace").read()
        except: continue
        if "ResearchItem(" not in txt: continue
        # local string-constant map (for variable keys, e.g. Alfheim)
        varmap = {vm.group(1): vm.group(2)
                  for vm in re.finditer(r'String (\w+) = "([^"]+)"', txt)}
        for m in stmt_re.finditer(txt):
            p = m.end() - 1
            args_str, end = balanced(txt, p)
            if end < 0: continue
            semi = txt.find(";", end)
            stmt = txt[end:semi] if semi > 0 else txt[end:end+2000]
            args = split_top(args_str)
            if not args: continue
            a0 = args[0].strip()
            if a0.startswith('"'):
                key = a0.strip('"')
            elif a0.split(".")[-1] in varmap:           # variable key -> resolve
                key = varmap[a0.split(".")[-1]]
            else:
                continue
            if key in research: continue
            category = ""
            for a in args[1:3]:
                a2 = a.strip()
                if a2.startswith('"'):
                    category = a2.strip('"'); break
            entry = {"key": key, "mod": mod, "category": category}
            # locate AspectList arg
            asp_idx = next((i for i, a in enumerate(args) if "AspectList" in a), None)
            aspects_req = {}
            if asp_idx is not None:
                for am in re.finditer(r'\.add\(\s*(?:\w+\.)?(\w+),\s*(\d+)\)', args[asp_idx]):
                    aspects_req[field_tag.get(am.group(1), am.group(1).lower())] = int(am.group(2))
                ints = []
                for a in args[asp_idx+1:asp_idx+4]:
                    mm = re.search(r'-?\d+', a); ints.append(int(mm.group()) if mm else None)
                if len(ints) == 3:
                    entry["displayColumn"], entry["displayRow"], entry["complexity"] = ints
                if asp_idx + 4 < len(args):
                    entry["icon"] = args[asp_idx+4].strip()[:80]
            entry["aspects"] = aspects_req
            for meth, fld in [("setParents","parents"),("setParentsHidden","parentsHidden"),("setSiblings","siblings")]:
                cm = re.search(meth + r'\(([^)]*)\)', stmt)
                if cm:
                    entry[fld] = [x.strip().strip('"') for x in re.findall(r'"([^"]+)"', cm.group(1))]
            entry["flags"] = [f.replace("set","").lower() for f in FLAGS if (f + "(") in stmt]
            entry["autoUnlock"] = "setAutoUnlock(" in stmt
            # pages: string literals in statement that resolve to a lang text value
            page_keys = []
            for lit in re.findall(r'"([^"]+)"', stmt):
                if lit == key: continue
                if (lit in EN or lit in RU) and re.search(r'(research_page|\.text\.|page)', lit):
                    page_keys.append(lit)
            if not page_keys:
                page_keys = page_keys_from_lang(key)
            pages = []
            for pk in page_keys:
                pages.append({"key": pk, "text_en": EN.get(pk, ""), "text_ru": RU.get(pk, "")})
            entry["pages"] = pages
            # names
            entry["name_en"] = find_name(key, NAME_EN)
            entry["name_ru"] = find_name(key, NAME_RU)
            # description (RU priority), cleaned
            ru_desc = "\n\n".join(clean(p["text_ru"]) for p in pages if p["text_ru"]).strip()
            en_desc = "\n\n".join(clean(p["text_en"]) for p in pages if p["text_en"]).strip()
            entry["description_ru"] = ru_desc
            entry["description_en"] = en_desc
            entry["description"] = ru_desc or en_desc
            research[key] = entry
            res_order.append(key)

# ---- lang-only sweep: capture research that has lang entries but wasn't code-parsed
def guess_mod(full_key):
    if full_key.startswith("appliedenergistics2"): return "AppliedEnergistics2"
    if full_key.startswith("MB_"): return "MagicBees"
    return "Thaumcraft"

PREFIX_MOD = {"forbidden":"ForbiddenMagic","tm":"TaintedMagic","ttresearch":"ThaumicTinkerer"}
captured = set(research.keys())
for lang, name_idx in ((EN, NAME_EN), (RU, NAME_RU)):
    for k, v in lang.items():
        if "research_name" not in k: continue
        prefix = k.split(".research_name.", 1)[0].split(".")[-1] if ".research_name." in k else "tc"
        tail = k.split("research_name.", 1)[1]
        bare = tail.split(".")[-1]
        if bare in captured or tail in captured: continue
        pages_keys = page_keys_from_lang(tail) or page_keys_from_lang(bare)
        pages = [{"key": pk, "text_en": EN.get(pk, ""), "text_ru": RU.get(pk, "")} for pk in pages_keys]
        ru_desc = "\n\n".join(clean(p["text_ru"]) for p in pages if p["text_ru"]).strip()
        en_desc = "\n\n".join(clean(p["text_en"]) for p in pages if p["text_en"]).strip()
        mod = PREFIX_MOD.get(prefix) or guess_mod(tail)
        research[tail] = {
            "key": bare, "mod": mod, "category": "",
            "aspects": {}, "flags": [], "autoUnlock": False, "pages": pages,
            "name_en": find_name(tail, NAME_EN) or find_name(bare, NAME_EN),
            "name_ru": find_name(tail, NAME_RU) or find_name(bare, NAME_RU),
            "description_ru": ru_desc, "description_en": en_desc,
            "description": ru_desc or en_desc,
            "_langOnly": True,
        }
        res_order.append(tail)
        captured.add(bare); captured.add(tail)

res_list = [research[k] for k in res_order]
by_mod = {}
for r in res_list: by_mod[r["mod"]] = by_mod.get(r["mod"], 0) + 1
with_desc = sum(1 for r in res_list if r["description"])
with_ru = sum(1 for r in res_list if r["description_ru"])
json.dump({
    "_meta": {
        "source": "decompiled (CFR 0.152): Thaumcraft 4.2.3.5 + addons (MagicBees, ForbiddenMagic, TaintedMagic, ThaumicTinkerer, AE2, BloodArsenal, Avaritia, Alfheim, LoliMagically); lang from same JARs",
        "generated": "2026-06-07",
        "count": len(res_list),
        "byMod": by_mod,
        "withDescription": with_desc,
        "withRussianDescription": with_ru,
        "notes": "description = thaumonomicon text pages joined (RU priority, EN fallback), cleaned of <BR>/§ codes. pages[] keep raw EN/RU + lang key. aspects = aspect tags needed to unlock the research scroll. parents = prerequisite research keys. Non-text pages (recipes) are omitted.",
    },
    "research": res_list,
}, open(OUT_R, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("aspects:", len(aspect_list), "byMod:", {a["mod"] for a in aspect_list})
print("  primals:", len(prim), "| custom (non-TC):", sum(1 for a in aspect_list if a["mod"]!="Thaumcraft"))
print("research:", len(res_list), "byMod:", by_mod)
print("  with desc:", with_desc, "| with RU desc:", with_ru)
