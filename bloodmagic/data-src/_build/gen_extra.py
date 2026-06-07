# -*- coding: utf-8 -*-
"""BloodMagic extras: sigils, Blood Altar multiblock tiers, and the full guidebook.

Run after gen_bloodmagic.py (reuses its lang/name helpers indirectly via re-parse).
All datasets carry _meta.server = "LoliLand".
"""
import os, re, json, glob, collections

ROOT     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo/bloodmagic
REPO     = os.path.dirname(ROOT)
DECOMP   = r"C:/Users/pheezz/Desktop/pricoli-jar/decompBM/WayofTime/alchemicalWizardry"
CONFIG   = os.path.join(DECOMP, "BloodMagicConfiguration.java")
LANG_DIR = os.path.join(ROOT, "_assets", "lang")
OUT      = os.path.join(ROOT, "data-src")
VANILLA  = os.path.join(REPO, "thaumcraft", "data-src", "vanilla-names.json")
GEN_DATE, SERVER = "2026-06-07", "LoliLand"

def meta(count, note, **extra):
    m = {"server": SERVER, "generated": GEN_DATE, "count": count, "notes": note}; m.update(extra); return m
def read(p):
    with open(p, encoding="utf-8") as f: return f.read()
def load_lang(p):
    d = {}
    for enc in ("utf-8", "utf-8-sig", "windows-1251", "latin-1"):
        try:
            lines = open(p, encoding=enc).read().splitlines(); break
        except (UnicodeDecodeError, OSError): continue
    else: return d
    for ln in lines:
        if "=" in ln and not ln.lstrip().startswith("#"):
            k, v = ln.split("=", 1); d[k.strip()] = re.sub(r"§.", "", v).strip()
    return d

LANG_EN = load_lang(os.path.join(LANG_DIR, "en_US.lang"))
LANG_RU = load_lang(os.path.join(LANG_DIR, "ru_RU.lang"))
GUIDE   = load_lang(os.path.join(LANG_DIR, "guidebook_en_US.lang"))
def lang(key):
    en = LANG_EN.get(key, ""); return en, (LANG_RU.get(key, "") or en)
with open(VANILLA, encoding="utf-8") as f:
    VN = json.load(f)["fields"]
REG = {v["reg"]: (v.get("name_en", ""), v.get("name_ru", "")) for v in VN.values()}

AWTEXT, MODITEMS, MODBLOCKS = read(os.path.join(DECOMP, "AlchemicalWizardry.java")), \
    read(os.path.join(DECOMP, "ModItems.java")), read(os.path.join(DECOMP, "ModBlocks.java"))
def write(name, payload):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print("wrote", name, "->", payload["_meta"]["count"])

# ---- maps reused from main extractor ----
ITEM_UNLOC = {m.group(1): m.group(2) for m in
    re.finditer(r"(\w+)\s*=\s*new\s+\w+\([^;]*?\.func_77655_b\(\"([^\"]+)\"\)", MODITEMS)}
ITEM_CLASS = {}
for m in re.finditer(r"(\w+)\s*=\s*new\s+(\w+)\(", MODITEMS):
    ITEM_CLASS.setdefault(m.group(1), m.group(2))
CLASS_FIELD = {c: f for f, c in ITEM_CLASS.items()}

# block field -> unlocalized (for altar multiblock block naming)
BLOCK_CLASS = {m.group(1): m.group(2) for m in re.finditer(r"(\w+)\s*=\s*new\s+(\w+)\(\)", MODBLOCKS)}
CLASS_UNLOC = {}
for path in glob.glob(os.path.join(DECOMP, "common", "block", "*.java")):
    txt = read(path); cm = re.search(r"public\s+class\s+(\w+)", txt); um = re.search(r'func_149663_c\("([^"]+)"\)', txt)
    if cm and um: CLASS_UNLOC[cm.group(1)] = um.group(1)
BLOCK_UNLOC = {f: CLASS_UNLOC.get(c) for f, c in BLOCK_CLASS.items()}

# ============================================================ SIGILS
# config default per sigilXxxCost var
SIGIL_COST = {m.group(1): int(m.group(2)) for m in
    re.finditer(r"(sigil\w+Cost)\s*=\s*config\.get\([^;]*?,\s*(\d+)\)\.getInt", read(CONFIG))}
SIGIL_FILES = glob.glob(os.path.join(DECOMP, "common", "items", "sigil", "Sigil*.java"))
sigils = []
for p in sorted(SIGIL_FILES):
    cls = os.path.splitext(os.path.basename(p))[0]
    field = CLASS_FIELD.get(cls)
    if not field:
        continue
    body = read(p)
    cm = re.search(r"setEnergyUsed\((\d+|AlchemicalWizardry\.(sigil\w+Cost))\)", body)
    cost = None
    if cm:
        cost = int(cm.group(1)) if cm.group(1).isdigit() else SIGIL_COST.get(cm.group(2))
    unloc = ITEM_UNLOC.get(field, "")
    en, ru = lang("item.%s.name" % unloc) if unloc else ("", "")
    if not en:   # mod ships an empty name for the Fluid Sigil — fall back to the code identifier
        en = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", re.sub(r"^item", "", field)).strip().title()
        ru = ru or en
    # toggle sigils keep state on right-click; placement sigils place a block; passive = no cost
    kind = "passive" if cost is None else ("placement" if re.search(r"super\((?:Blocks\.|null)", body) else "activated")
    sigils.append({"field": field, "class": cls, "name_en": en, "name_ru": ru,
                   "cost_LP_per_use": cost, "kind": kind})
write("sigils.json", {"_meta": meta(len(sigils),
     "Blood Magic sigils (Soul Network powered tools). cost_LP_per_use = mod-default LP drained per "
     "activation (server may override via config); kind: placement (places a block), activated "
     "(toggle/use effect), passive (divination/seer, no LP). Sigils also appear in items.json."),
     "sigils": sigils})

# ============================================================ BLOOD ALTAR MULTIBLOCK
# AltarComponent(x, y, z, Block block, int meta, boolean isBloodRune, boolean isUpgradeSlot)
def block_name(expr, meta_i):
    expr = expr.strip()
    mb = re.match(r"ModBlocks\.(\w+)", expr)
    if mb:
        u = BLOCK_UNLOC.get(mb.group(1))
        if u:
            en, ru = lang("tile.%s.name" % u); return {"ref": mb.group(1), "name_en": en, "name_ru": ru}
        return {"ref": mb.group(1)}
    bv = re.match(r"Blocks\.(field_\w+)", expr)
    if bv:
        v = VN.get(bv.group(1))
        if v: return {"vanilla": v["reg"], "name_en": v.get("name_en", ""), "name_ru": v.get("name_ru", "")}
    el = expr.lower()
    if "beacon" in el or "field_150461" in expr:
        return {"vanilla": "beacon", "name_en": "Beacon", "name_ru": REG.get("beacon", ("Beacon", ""))[1]}
    if "glowstone" in el or "field_150426" in expr:
        return {"vanilla": "glowstone", "name_en": "Glowstone", "name_ru": REG.get("glowstone", ("Glowstone", ""))[1]}
    if "BlockCrystal" in expr or "blockCrystal" in expr:
        en, ru = lang("tile.crystalBlock.fullCrystal.name"); return {"ref": "blockCrystal", "name_en": en, "name_ru": ru}
    return {"raw": expr[:50]}

TIER_VAR = {"secondTierAltar": 2, "thirdTierAltar": 3, "fourthTierAltar": 4,
            "fifthTierAltar": 5, "sixthTierAltar": 6}
# Mini-interpreter over UpgradedAltars.java: handles `for (i = A; i <= B; ++i)` loops
# (substituting the loop var into coords) and `X.addAll(Y)` cumulative copying.
UA = read(os.path.join(DECOMP, "common", "bloodAltarUpgrade", "UpgradedAltars.java"))
def coord(tok, ivar, ival):
    tok = tok.strip()
    if ivar and tok == ivar:
        return ival
    return int(tok)
tier_comps = collections.defaultdict(list)
loop = None  # (var, lo, hi) or None
for ln in UA.splitlines():
    s = ln.strip()
    lm = re.match(r"for\s*\(\s*(\w+)\s*=\s*(-?\d+);\s*\1\s*<=\s*(-?\d+);\s*\+\+\1\)", s)
    if lm:
        loop = (lm.group(1), int(lm.group(2)), int(lm.group(3))); continue
    if s == "}" and loop:
        loop = None; continue
    am = re.match(r"(\w+TierAltar)\.addAll\((\w+TierAltar)\)", s)
    if am and am.group(1) in TIER_VAR and am.group(2) in TIER_VAR:
        tier_comps[am.group(1)].extend(tier_comps[am.group(2)]); continue
    cm = re.match(r"(\w+TierAltar)\.add\(new AltarComponent\((.+?)\)\);", s)
    if not cm or cm.group(1) not in TIER_VAR:
        continue
    var = cm.group(1)
    a = [x.strip() for x in re.split(r",\s*(?![^()]*\))", cm.group(2))]
    if len(a) < 7:
        continue
    ivals = range(loop[1], loop[2] + 1) if (loop and any(loop[0] in t for t in a[:3])) else [None]
    iv = loop[0] if loop else None
    blk = block_name(a[3], a[4])
    meta_v = int(a[4]) if a[4].isdigit() else "placement"
    rune = a[5].strip() == "true"; slot = a[6].strip() == "true"
    for ival in ivals:
        tier_comps[var].append({"x": coord(a[0], iv, ival), "y": coord(a[1], iv, ival),
                                "z": coord(a[2], iv, ival), "block": blk, "meta": meta_v,
                                "isBloodRune": rune, "isUpgradeSlot": slot})
altar_tiers = [{"tier": 1, "components": [], "note": "Tier 1 = the Blood Altar alone (no surrounding structure)."}]
for var, t in sorted(TIER_VAR.items(), key=lambda kv: kv[1]):
    comps = tier_comps.get(var, [])
    runes = sum(1 for c in comps if c["isBloodRune"])
    altar_tiers.append({"tier": t, "componentCount": len(comps), "runeCount": runes,
                        "upgradeSlots": sum(1 for c in comps if c["isUpgradeSlot"]),
                        "components": comps})
write("altar-structure.json", {"_meta": meta(len(altar_tiers),
     "Blood Altar multiblock structures per tier. Each tier lists every block (offset x,y,z from the "
     "altar at 0,0,0) that must be present. isBloodRune = any blood rune accepted in that slot; "
     "isUpgradeSlot = a rune slot the player customises (capacity/speed/sacrifice runes). "
     "Tiers are cumulative (a tier-4 altar also satisfies lower tiers)."),
     "tiers": altar_tiers})

# ============================================================ GUIDEBOOK (full lore)
# group aw.entries.<chapter>.<entry>[.<n>] -> ordered text
chapters = collections.defaultdict(lambda: collections.defaultdict(dict))
for k, v in GUIDE.items():
    m = re.match(r"aw\.entries\.(\w+)\.(.+)", k)
    if not m:
        continue
    chap, rest = m.group(1), m.group(2)
    pm = re.match(r"(.+)\.(\d+)$", rest)
    if pm:
        chapters[chap][pm.group(1)][int(pm.group(2))] = v
    else:
        chapters[chap][rest][0] = v
entries = []
for chap in sorted(chapters):
    for entry in sorted(chapters[chap]):
        parts = chapters[chap][entry]
        text = "\n\n".join(parts[i] for i in sorted(parts))
        entries.append({"chapter": chap, "entry": entry,
                        "key": "aw.entries.%s.%s" % (chap, entry), "text_en": text})
write("guidebook.json", {"_meta": meta(len(entries),
     "Sanguine Scientiem in-game guidebook, full lore/instructions (EN only; mod ships no RU book). "
     "Grouped by chapter (architect/alchemy/rituals/...) and entry; multi-part entries joined in order. "
     "rituals chapter entries are cross-linked from rituals.json via guidebookKey.",
     chapters={c: len(chapters[c]) for c in sorted(chapters)}),
     "entries": entries})
