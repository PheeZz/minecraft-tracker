# -*- coding: utf-8 -*-
"""
BloodMagic (AWWayofTime 1.7.10-1.3.3-17) data extractor.

Parses CFR-decompiled Java + the mod's own en_US/ru_RU lang files and emits
JSON datasets (items, blocks, blood orbs, altar/alchemy/binding/crafting
recipes, rituals + rune layouts, reagents, summoning) under bloodmagic/data-src/.

All datasets carry a machine-readable _meta.server = "LoliLand" flag so the
data can later be re-actualised for other servers. Nothing is invented; refs
that cannot be resolved are kept verbatim under "raw" and counted in the report.
"""
import os, re, json, glob, collections

ROOT      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo/bloodmagic
REPO      = os.path.dirname(ROOT)
DECOMP    = r"C:/Users/pheezz/Desktop/pricoli-jar/decompBM/WayofTime/alchemicalWizardry"
AW        = os.path.join(DECOMP, "AlchemicalWizardry.java")
CONFIG    = os.path.join(DECOMP, "BloodMagicConfiguration.java")
LANG_DIR  = os.path.join(ROOT, "_assets", "lang")
OUT       = os.path.join(ROOT, "data-src")
VANILLA   = os.path.join(REPO, "thaumcraft", "data-src", "vanilla-names.json")
GEN_DATE  = "2026-06-07"
SERVER    = "LoliLand"

def meta(count, note, **extra):
    m = {"server": SERVER, "generated": GEN_DATE, "count": count, "notes": note}
    m.update(extra)
    return m

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

# ---------------------------------------------------------------- lang
def load_lang(p):
    d = {}
    for enc in ("utf-8", "utf-8-sig", "windows-1251", "latin-1"):
        try:
            with open(p, encoding=enc) as f:
                lines = f.read().splitlines()
            break
        except (UnicodeDecodeError, OSError):
            continue
    else:
        return d
    for ln in lines:
        ln = ln.rstrip()
        if "=" in ln and not ln.lstrip().startswith("#"):
            k, v = ln.split("=", 1)
            d[k.strip()] = re.sub(r"§.", "", v).strip()
    return d

LANG_EN = load_lang(os.path.join(LANG_DIR, "en_US.lang"))
LANG_RU = load_lang(os.path.join(LANG_DIR, "ru_RU.lang"))

def lang(key):
    en = LANG_EN.get(key, "")
    ru = LANG_RU.get(key, "") or en
    return en, ru

# ---------------------------------------------------------------- vanilla names
with open(VANILLA, encoding="utf-8") as f:
    VN = json.load(f)["fields"]            # field_xxx -> {reg, name_en, name_ru}
REG2NAME = {}
for fld, v in VN.items():
    REG2NAME[v["reg"]] = (v.get("name_en", ""), v.get("name_ru", ""))

def vanilla_field(fld):
    v = VN.get(fld)
    if v:
        return v.get("name_en", ""), v.get("name_ru", ""), v["reg"]
    return "", "", None

# LoliLand mctags constant -> vanilla registry id
TAG2REG = {
    "GLOWSTONE": "glowstone", "NETHER_RACK": "netherrack", "OBSIDIAN": "obsidian",
    "SOUL_SAND": "soul_sand", "BLAZE_POWDER": "blaze_powder", "GHAST_TEAR": "ghast_tear",
    "GLOWSTONE_DUST": "glowstone_dust", "MAGMA_CREAM": "magma_cream",
    "NETHER_STAR": "nether_star", "NETHER_WART": "nether_wart", "QUARTZ": "quartz",
    "WITHER_SKELETON_SKULL": "skull",
}
TAG_FALLBACK_EN = {
    "GLOWSTONE": "Glowstone", "NETHER_RACK": "Netherrack", "OBSIDIAN": "Obsidian",
    "SOUL_SAND": "Soul Sand", "BLAZE_POWDER": "Blaze Powder", "GHAST_TEAR": "Ghast Tear",
    "GLOWSTONE_DUST": "Glowstone Dust", "MAGMA_CREAM": "Magma Cream",
    "NETHER_STAR": "Nether Star", "NETHER_WART": "Nether Wart", "QUARTZ": "Nether Quartz",
    "WITHER_SKELETON_SKULL": "Wither Skeleton Skull",
}

AWTEXT = read(AW)

# ---------------------------------------------------------------- brace-matched method body
def method_body(name, src=AWTEXT):
    m = re.search(r"\b" + re.escape(name) + r"\s*\([^)]*\)\s*\{", src)
    if not m:
        return ""
    i = m.end() - 1
    depth = 0
    for j in range(i, len(src)):
        c = src[j]
        if c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return src[i + 1:j]
    return ""

# ---------------------------------------------------------------- ModItems / ModBlocks maps
MODITEMS = read(os.path.join(DECOMP, "ModItems.java"))
MODBLOCKS = read(os.path.join(DECOMP, "ModBlocks.java"))

# field -> unlocalized item name ("item.<X>.name")
ITEM_UNLOC = {}
for m in re.finditer(r"(\w+)\s*=\s*new\s+\w+\([^;]*?\.func_77655_b\(\"([^\"]+)\"\)", MODITEMS):
    ITEM_UNLOC[m.group(1)] = m.group(2)
# items with no func_77655_b chained (special-cased below)
ITEM_CLASS = {}
for m in re.finditer(r"(\w+)\s*=\s*new\s+(\w+)\(", method_body("init", MODITEMS)):
    ITEM_CLASS.setdefault(m.group(1), m.group(2))

# block field -> class (from ModBlocks.init)
BLOCK_CLASS = {}
for m in re.finditer(r"(\w+)\s*=\s*new\s+(\w+)\(\)", method_body("init", MODBLOCKS)):
    BLOCK_CLASS[m.group(1)] = m.group(2)
# class -> unlocalized (tile.<X>) from each block source file
CLASS_UNLOC = {}
for path in glob.glob(os.path.join(DECOMP, "common", "block", "*.java")) + \
            glob.glob(os.path.join(DECOMP, "common", "demonVillage", "tileEntity", "*.java")):
    txt = read(path)
    cm = re.search(r"public\s+class\s+(\w+)", txt)
    um = re.search(r'func_149663_c\("([^"]+)"\)', txt)
    if cm and um:
        CLASS_UNLOC[cm.group(1)] = um.group(1)
BLOCK_UNLOC = {f: CLASS_UNLOC.get(c) for f, c in BLOCK_CLASS.items()}

# sub-item meta arrays
def names_array(cls):
    txt = read(os.path.join(DECOMP, "common", "items", cls + ".java"))
    m = re.search(r"ITEM_NAMES\s*=\s*new\s+String\[\]\s*\{([^}]*)\}", txt)
    return re.findall(r'"([^"]+)"', m.group(1)) if m else []

BASEITEM_NAMES   = names_array("ItemComponents")     # baseItems
BASEALCHEMY_NAMES= names_array("ItemAlchemyBase")    # baseAlchemyItems
SUBITEM = {
    "baseItems":        ("item.bloodMagicBaseItem.{}.name", BASEITEM_NAMES),
    "baseAlchemyItems": ("item.bloodMagicAlchemyItem.{}.name", BASEALCHEMY_NAMES),
}
# activationCrystal has 3 meta variants (no chained name)
ACT_CRYSTAL = {0: "item.activationCrystalWeak.name", 1: "item.activationCrystalAwakened.name",
               2: "item.activationCrystalCreative.name"}

# ---------------------------------------------------------------- resolver
unresolved = collections.Counter()

def item_field_name(field, m_meta=0):
    if field in SUBITEM:
        tmpl, arr = SUBITEM[field]
        if 0 <= m_meta < len(arr):
            en, ru = lang(tmpl.format(arr[m_meta]))
            return {"ref": field, "meta": m_meta, "reg": arr[m_meta], "name_en": en, "name_ru": ru}
    if field == "activationCrystal":
        key = ACT_CRYSTAL.get(m_meta, ACT_CRYSTAL[0])
        en, ru = lang(key)
        return {"ref": field, "meta": m_meta, "name_en": en, "name_ru": ru}
    unloc = ITEM_UNLOC.get(field)
    if unloc:
        en, ru = lang("item.%s.name" % unloc)
        d = {"ref": field, "name_en": en, "name_ru": ru}
        if m_meta: d["meta"] = m_meta
        return d
    unresolved["ModItems.%s" % field] += 1
    return {"ref": "ModItems.%s" % field, "raw": True, **({"meta": m_meta} if m_meta else {})}

def block_field_name(field, m_meta=0):
    unloc = BLOCK_UNLOC.get(field)
    if unloc:
        en, ru = lang("tile.%s.name" % unloc)
        d = {"ref": field, "name_en": en, "name_ru": ru}
        if m_meta: d["meta"] = m_meta
        return d
    unresolved["ModBlocks.%s" % field] += 1
    return {"ref": "ModBlocks.%s" % field, "raw": True}

def split_top(s):
    out, depth, cur, q = [], 0, "", None
    for c in s:
        if q:
            cur += c
            if c == q: q = None
            continue
        if c in "\"'":
            q = c; cur += c; continue
        if c in "([{": depth += 1
        elif c in ")]}": depth -= 1
        if c == "," and depth == 0:
            out.append(cur.strip()); cur = ""
        else:
            cur += c
    if cur.strip(): out.append(cur.strip())
    return out

def resolve_new_itemstack(inner):
    args = split_top(inner)
    if not args:
        return {"raw": inner[:60]}
    ref = re.sub(r"^\((?:Block|Item|ItemStack)\)\s*", "", args[0].strip())
    m_meta = 0
    if len(args) >= 3:
        mm = re.fullmatch(r"\d+", args[2].strip())
        if mm: m_meta = int(args[2])
    mi = re.fullmatch(r"ModItems\.(\w+)", ref)
    if mi: return item_field_name(mi.group(1), m_meta)
    mb = re.fullmatch(r"ModBlocks\.(\w+)", ref)
    if mb: return block_field_name(mb.group(1), m_meta)
    iv = re.fullmatch(r"Items\.(field_\w+)", ref) or re.fullmatch(r"Blocks\.(field_\w+)", ref)
    if iv:
        en, ru, reg = vanilla_field(iv.group(1))
        d = {"vanilla": reg or iv.group(1), "name_en": en, "name_ru": ru}
        if m_meta: d["meta"] = m_meta
        if not en: unresolved[iv.group(1)] += 1; d["raw"] = True
        return d
    unresolved[ref[:40]] += 1
    return {"raw": ref[:60]}

def resolve(expr, varmap):
    e = expr.strip()
    e = re.sub(r"^\((?:ItemStack|Object\[\]|IRecipe|Block|Item)\)\s*", "", e).strip()
    # Tags.X.makeStack()
    tm = re.match(r"(?:\(ItemStack\))?\s*Tags\.(?:Items|Blocks)\.([A-Z_]+)\.makeStack", e)
    if tm:
        tag = tm.group(1); reg = TAG2REG.get(tag)
        en, ru = REG2NAME.get(reg, (TAG_FALLBACK_EN.get(tag, tag.title()), ""))
        if not en: en = TAG_FALLBACK_EN.get(tag, tag.title())
        ru = ru or en
        return {"vanilla": reg or tag.lower(), "name_en": en, "name_ru": ru}
    nm = re.match(r"new\s+ItemStack\((.*)\)\s*$", e, re.S)
    if nm:
        return resolve_new_itemstack(nm.group(1))
    if e in varmap:
        return varmap[e]
    # bare ModItems./ModBlocks.
    mi = re.fullmatch(r"ModItems\.(\w+)", e)
    if mi: return item_field_name(mi.group(1))
    mb = re.fullmatch(r"ModBlocks\.(\w+)", e)
    if mb: return block_field_name(mb.group(1))
    unresolved[e[:40]] += 1
    return {"raw": e[:60]}

# ---------------------------------------------------------------- build local varmap for load()
LOAD = method_body("load")
VARMAP = {}
for m in re.finditer(r"ItemStack\s+(\w+)\s*=\s*(.+?);", LOAD, re.S):
    VARMAP[m.group(1)] = None  # placeholder; resolve lazily (some reference earlier vars)
for m in re.finditer(r"ItemStack\s+(\w+)\s*=\s*(.+?);", LOAD, re.S):
    VARMAP[m.group(1)] = resolve(m.group(2), VARMAP)

# ============================================================ DATASETS
def write(name, payload):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print("wrote", name, "->", payload["_meta"]["count"])

# ---- items ----
items = []
for field, unloc in sorted(ITEM_UNLOC.items()):
    en, ru = lang("item.%s.name" % unloc)
    items.append({"field": field, "unlocalized": unloc, "name_en": en, "name_ru": ru})
for field, (tmpl, arr) in SUBITEM.items():
    for i, sub in enumerate(arr):
        en, ru = lang(tmpl.format(sub))
        items.append({"field": field, "meta": i, "sub": sub,
                      "unlocalized": tmpl.format(sub)[5:-5], "name_en": en, "name_ru": ru})
for mm, key in ACT_CRYSTAL.items():
    en, ru = lang(key)
    items.append({"field": "activationCrystal", "meta": mm, "unlocalized": key[5:-5],
                  "name_en": en, "name_ru": ru})
write("items.json", {"_meta": meta(len(items),
     "every BloodMagic item lang key -> EN/RU display name. field = ModItems field; "
     "sub-items (baseItems/baseAlchemyItems/activationCrystal) expanded per meta."),
     "items": items})

# ---- blocks ----
blocks = []
for field, unloc in sorted(BLOCK_UNLOC.items()):
    if not unloc:
        continue
    en, ru = lang("tile.%s.name" % unloc)
    blocks.append({"field": field, "class": BLOCK_CLASS.get(field), "unlocalized": unloc,
                   "name_en": en, "name_ru": ru})
write("blocks.json", {"_meta": meta(len(blocks),
     "every BloodMagic block. field = ModBlocks field; unlocalized from func_149663_c."),
     "blocks": blocks})

# ---- blood orbs ----
ORB_CAP = {}
for m in re.finditer(r"(\w+)\s*=\s*new\s+\w+\((\d+)\)\.func_77655_b\(\"(\w+Orb)\"\)", MODITEMS):
    ORB_CAP[m.group(1)] = int(m.group(2))
ORB_TIER = {}
for m in re.finditer(r"registerAltarOrbRecipe\(new ItemStack\(ModItems\.(\w+)\),\s*(\d+),\s*(\d+)\)", AWTEXT):
    ORB_TIER[m.group(1)] = {"tier": int(m.group(2)), "consumptionRate": int(m.group(3))}
orbs = []
for field in ["weakBloodOrb", "apprenticeBloodOrb", "magicianBloodOrb", "masterBloodOrb",
              "archmageBloodOrb", "transcendentBloodOrb"]:
    en, ru = lang("item.%s.name" % field)
    o = {"field": field, "name_en": en, "name_ru": ru, "capacity_LP": ORB_CAP.get(field)}
    o.update(ORB_TIER.get(field, {}))
    orbs.append(o)
write("blood-orbs.json", {"_meta": meta(len(orbs),
     "blood orbs: LP storage capacity + altar tier + altar fill consumption rate."),
     "orbs": orbs})

# ---- altar recipes ----
altar = []
for m in re.finditer(r"registerAltarRecipe\((.+?)\);", method_body("initAltarRecipes"), re.S):
    a = split_top(m.group(1))
    if len(a) < 7:
        continue
    altar.append({
        "result": resolve(a[0], {}), "input": resolve(a[1], {}),
        "minTier": int(a[2]), "liquidRequired_LP": int(a[3]),
        "consumptionRate": int(a[4]), "drainRate": int(a[5]),
        "canBeFilled": a[6].strip() == "true"})
write("altar-recipes.json", {"_meta": meta(len(altar),
     "Blood Altar recipes. input item -> result; minTier = altar tier; liquidRequired_LP = LP; "
     "consumptionRate/drainRate per tick; canBeFilled = orb-style fill."),
     "recipes": altar})

# ---- alchemy (chemistry set) recipes ----
alc = []
for m in re.finditer(r"AlchemyRecipeRegistry\.registerRecipe\((.+?)\);", LOAD, re.S):
    a = split_top(m.group(1))
    if len(a) < 4:
        continue
    out = resolve(a[0], VARMAP)
    amount = int(a[1]) if a[1].strip().isdigit() else a[1].strip()
    arr = re.match(r"new\s+ItemStack\[\]\s*\{(.*)\}\s*$", a[2].strip(), re.S)
    ings = [resolve(x, VARMAP) for x in split_top(arr.group(1))] if arr else []
    orblvl = int(a[3]) if a[3].strip().isdigit() else a[3].strip()
    alc.append({"output": out, "amountNeeded_LP": amount, "inputs": ings, "minOrbTier": orblvl})
write("alchemy-recipes.json", {"_meta": meta(len(alc),
     "Alchemic Chemistry Set recipes. inputs[] consumed; amountNeeded_LP = LP per craft; "
     "minOrbTier = required blood orb level."),
     "recipes": alc})

# ---- binding recipes ----
binding = []
for m in re.finditer(r"BindingRegistry\.registerRecipe\((.+?)\);", method_body("initBindingRecipes"), re.S):
    a = split_top(m.group(1))
    if len(a) < 2:
        continue
    binding.append({"output": resolve(a[0], {}), "input": resolve(a[1], {})})
write("binding-recipes.json", {"_meta": meta(len(binding),
     "Ritual of Binding recipes (held item transmuted via the binding ritual). "
     "Unbinding = reverse of each."),
     "recipes": binding})

# ---- reagents ----
reag = []
for m in re.finditer(r"registerItemAndReagent\((.+?)\);", method_body("initReagentRegistries"), re.S):
    a = split_top(m.group(1))
    rm = re.search(r"ReagentRegistry\.(\w+),\s*(\d+)", a[1]) if len(a) > 1 else None
    reag.append({"item": resolve(a[0], {}),
                 "reagent": rm.group(1) if rm else None,
                 "amount": int(rm.group(2)) if rm else None})
write("reagents.json", {"_meta": meta(len(reag),
     "Alchemic Chemistry Set reagents: item -> reagent type + mB produced."),
     "reagents": reag})

# ---- crafting recipes (shaped/shapeless + blood-orb variants) ----
CHAR = re.compile(r"Character\.valueOf\('(.)'\)")
def parse_grid(tokens):
    """tokens: list after result. returns (shape[], key{char->ingredient})."""
    shape, key, i = [], {}, 0
    while i < len(tokens):
        t = tokens[i].strip()
        sm = re.fullmatch(r'"([^"]*)"', t)
        if sm and not key:
            shape.append(sm.group(1)); i += 1; continue
        cm = CHAR.fullmatch(t)
        if cm and i + 1 < len(tokens):
            key[cm.group(1)] = resolve(tokens[i + 1], VARMAP); i += 2; continue
        i += 1
    return shape, key

craft = []
# shaped vanilla: GameRegistry.addRecipe((ItemStack)X, (Object[])new Object[]{...})
for m in re.finditer(r"GameRegistry\.addRecipe\(\(ItemStack\)([^,]+),\s*\(Object\[\]\)new Object\[\]\{(.*?)\}\);", LOAD, re.S):
    toks = split_top(m.group(2))
    shape, key = parse_grid(toks)
    craft.append({"type": "shaped", "result": resolve(m.group(1), VARMAP), "shape": shape, "key": key})
# shaped blood-orb: new ShapedBloodOrbRecipe(result, ...)
for m in re.finditer(r"new ShapedBloodOrbRecipe\((.*?)\)\);", LOAD, re.S):
    toks = split_top(m.group(1))
    if not toks: continue
    shape, key = parse_grid(toks[1:])
    craft.append({"type": "shaped_bloodorb", "result": resolve(toks[0], VARMAP), "shape": shape, "key": key})
# shapeless vanilla
for m in re.finditer(r"GameRegistry\.addShapelessRecipe\(\(ItemStack\)([^,]+),\s*\(Object\[\]\)new Object\[\]\{(.*?)\}\);", LOAD, re.S):
    toks = split_top(m.group(2))
    craft.append({"type": "shapeless", "result": resolve(m.group(1), VARMAP),
                  "inputs": [resolve(t, VARMAP) for t in toks]})
# shapeless blood-orb
for m in re.finditer(r"new ShapelessBloodOrbRecipe\((.*?)\)\);", LOAD, re.S):
    toks = split_top(m.group(1))
    if not toks: continue
    craft.append({"type": "shapeless_bloodorb", "result": resolve(toks[0], VARMAP),
                  "inputs": [resolve(t, VARMAP) for t in toks[1:]]})
write("crafting-recipes.json", {"_meta": meta(len(craft),
     "vanilla crafting-grid recipes added by BloodMagic. shaped: shape[]=rows, key{char->ingredient}; "
     "*_bloodorb variants require a blood orb of the embedded tier in the grid."),
     "recipes": craft})

# ---- rituals (with rune layout / схемы) ----
STONE = {0: "blank", 1: "water", 2: "fire", 3: "earth", 4: "air", 5: "dusk", 6: "dawn"}
# cost defaults keyed by display name
COST = {}
for m in re.finditer(r'config\.get\(lpCosts,\s*"([^"]+)",\s*new int\[\]\{(\d+),\s*(\d+)\}', read(CONFIG)):
    COST[m.group(1)] = {"activation_LP": int(m.group(2)), "upkeep_LP_per_tick": int(m.group(3))}
# layout per RitualEffect class
def ritual_layout(effect_cls):
    p = os.path.join(DECOMP, "common", "rituals", effect_cls + ".java")
    if not os.path.exists(p):
        return []
    body = method_body("getRitualComponentList", read(p))
    comps = []
    for m in re.finditer(r"new RitualComponent\((-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)", body):
        x, y, z, st = map(int, m.groups())
        comps.append({"x": x, "y": y, "z": z, "rune": STONE.get(st, str(st))})
    return comps

# guidebook (Sanguine Scientiem) ritual lore — EN only; the mod ships no RU book.
GUIDE = load_lang(os.path.join(LANG_DIR, "guidebook_en_US.lang"))
RIT_GUIDE = {   # ritual key -> aw.entries.rituals.<entry> guidebook key
    "AW001Water": "waterRitual", "AW002Lava": "lavaRitual", "AW003GreenGrove": "groveRitual",
    "AW004Interdiction": "interdictionRitual", "AW005Containment": "containmentRitual",
    "AW006Binding": "bindingRitual", "AW007Unbinding": "unbindingRitual", "AW008HighJump": "jumpRitual",
    "AW009Magnetism": "magnetismRitual", "AW010Crusher": "crusherRitual", "AW011Speed": "speedRitual",
    "AW012AnimalGrowth": "shepherdRitual", "AW013Suffering": "knifeAndSufferingRitual.2",
    "AW014Regen": "regenerationRitual", "AW015FeatheredKnife": "knifeAndSufferingRitual.1",
    "AW016FeatheredEarth": "featheredEarthRitual", "AW017Gaia": "gaiaRitual", "AW018Condor": "condorRitual",
    "AW019FallingTower": "meteorRitual", "AW020BalladOfAlchemy": "alchemyRitual",
    "AW021Expulsion": "expulsionRitual", "AW022Supression": "domeRitual", "AW023Zephyr": "zephyrRitual",
    "AW024Harvest": "harvestRitual", "AW025Conduit": "eternalSoulRitual", "AW026Ellipsoid": "ellipsoidRitual",
    "AW027Evaporation": "evaporationRitual", "AW028SpawnWard": "sacrosanctityRitual",
    "AW029VeilOfEvil": "evilRitual", "AW030FullStomach": "stomachRitual", "AW031Convocation": "convocationRitual",
    "AW032Symmetry": "symmetryRitual", "AW033Stalling": "stallingRitual", "AW034Crafting": "anvilRitual",
    "AW035PhantomHands": "phantomHandsRitual", "AW036SphereIsland": "newMoonRitual",
}
rituals = []
for m in re.finditer(
    r'Rituals\.registerRitual\("([^"]+)",\s*([^,]+),\s*ritualCost(\w+)\[0\],\s*new (\w+)\(\),\s*"([^"]+)"',
    method_body("initRituals")):
    key, clvl, costkey, effect, name = m.groups()
    clvl = clvl.strip()
    cl = 10 if "isDemon" in clvl else int(re.search(r"\d+", clvl).group())
    layout = ritual_layout(effect)
    runes = collections.Counter(c["rune"] for c in layout)
    gk = RIT_GUIDE.get(key)
    rituals.append({
        "key": key, "name_en": name, "crystalLevel": cl, "effect": effect,
        "cost": COST.get(name, COST.get(name.replace("Supression", "Suppression"))),
        "runeCount": len(layout) + 1,           # +1 master ritual stone
        "runeBreakdown": dict(runes),
        "description_en": GUIDE.get("aw.entries.rituals." + gk, "") if gk else "",
        "guidebookKey": ("aw.entries.rituals." + gk) if gk else None,
        "layout": layout})
write("rituals.json", {"_meta": meta(len(rituals),
     "Blood Magic rituals. crystalLevel = activation crystal tier (weak=1/awakened=2); "
     "cost = mod-default LP (activation + per-tick upkeep), server may override via config; "
     "layout = rune schematic (x,z offsets from master ritual stone at 0,0; y vertical; rune = stone type). "
     "runeCount includes the central master ritual stone. "
     "description_en = in-game guidebook (Sanguine Scientiem) lore for the ritual (EN only; no RU book shipped).",
     runeTypes=STONE), "rituals": rituals})

# ---- summoning ----
def call_args(src, callname):
    """yield the balanced-paren argument string of each callname( ... ) in src."""
    for m in re.finditer(re.escape(callname) + r"\(", src):
        i = m.end() - 1
        depth = 0
        for j in range(i, len(src)):
            if src[j] == "(": depth += 1
            elif src[j] == ")":
                depth -= 1
                if depth == 0:
                    yield src[i + 1:j]; break

def itemstack_array(tok):
    tok = tok.strip()
    if "new ItemStack[0]" in tok:
        return []
    am = re.match(r"new ItemStack\[\]\s*\{(.*)\}\s*$", tok, re.S)
    return [resolve(x, VARMAP) for x in split_top(am.group(1))] if am else []

summon = []
for argstr in call_args(LOAD, "SummoningRegistry.registerSummon"):
    a = split_top(argstr)
    if len(a) < 6:
        continue
    em = re.search(r"SummoningHelperAW\((\w+)\)", a[0])
    summon.append({"entityIdVar": em.group(1) if em else a[0].strip(),
                   "altarTier": int(a[5]) if a[5].strip().isdigit() else a[5].strip(),
                   "ingredients_main": itemstack_array(a[1]),
                   "ingredients_tier2": itemstack_array(a[2]),
                   "ingredients_tier3": itemstack_array(a[3])})
write("summoning.json", {"_meta": meta(len(summon),
     "demon/elemental summoning recipes (Blood Altar). altarTier = required tier; "
     "ingredient sets correspond to escalating summon tiers."),
     "summoning": summon})

# ---------------------------------------------------------------- report
print("\n=== UNRESOLVED refs (top 30) ===")
for k, c in unresolved.most_common(30):
    print("  %4d  %s" % (c, k))
print("total unresolved occurrences:", sum(unresolved.values()))
