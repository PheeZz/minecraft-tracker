# -*- coding: utf-8 -*-
"""
BloodArsenal (BloodMagic addon) own-recipe extractor.

Pulls BloodArsenal's Blood Altar / binding / blood-orb / oredict crafting recipes
from BloodArsenalRecipes.java. Item names resolve from:
  - BloodArsenal items/blocks -> thaumcraft/data-src/item-names.json (EN/RU, already merged)
  - BloodMagic refs (WayofTime.alchemicalWizardry.Mod*) -> bloodmagic/data-src/{items,blocks}.json
  - vanilla Items/Blocks.field_ -> thaumcraft/data-src/vanilla-names.json
  - LoliLand mctags (Tags.*) -> vanilla by registry id
Carries _meta.server = "LoliLand". Nothing invented; unresolved kept under "raw".
"""
import os, re, json, collections

ROOT   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo/bloodarsenal
REPO   = os.path.dirname(ROOT)
BA     = r"C:/Users/pheezz/Desktop/pricoli-jar/decompBA/com/arc/bloodarsenal/common"
RECIPES= os.path.join(BA, "BloodArsenalRecipes.java")
OUT    = os.path.join(ROOT, "data-src")
GEN_DATE, SERVER = "2026-06-07", "LoliLand"

def read(p):
    with open(p, encoding="utf-8") as f: return f.read()
def meta(c, note, **x):
    m = {"server": SERVER, "generated": GEN_DATE, "count": c, "notes": note}; m.update(x); return m
def write(name, payload):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print("wrote", name, "->", payload["_meta"]["count"])

# -------- name sources --------
ITEMNAMES = {x["key"]: (x["name_en"], x["name_ru"]) for x in
    json.load(open(os.path.join(REPO, "thaumcraft", "data-src", "item-names.json"), encoding="utf-8"))["items"]}
VN = json.load(open(os.path.join(REPO, "thaumcraft", "data-src", "vanilla-names.json"), encoding="utf-8"))["fields"]
def bm_load(fn, key):
    return json.load(open(os.path.join(REPO, "bloodmagic", "data-src", fn), encoding="utf-8"))[key]
BM_ITEMS = bm_load("items.json", "items")
BM_BLOCKS = bm_load("blocks.json", "blocks")
BM_ITEM = {}                       # field -> {en,ru}; field+meta -> {en,ru}
for x in BM_ITEMS:
    BM_ITEM.setdefault(x["field"], (x["name_en"], x["name_ru"]))
    if "meta" in x:
        BM_ITEM["%s#%s" % (x["field"], x["meta"])] = (x["name_en"], x["name_ru"])
BM_BLOCK = {x["field"]: (x["name_en"], x["name_ru"]) for x in BM_BLOCKS}

TAG2REG = {"GLOWSTONE": "glowstone", "OBSIDIAN": "obsidian", "BLAZE_ROD": "blaze_rod",
           "GLOWSTONE_DUST": "glowstone_dust", "NETHER_STAR": "nether_star", "GHAST_TEAR": "ghast_tear",
           "BLAZE_POWDER": "blaze_powder", "MAGMA_CREAM": "magma_cream"}
REG2NAME = {v["reg"]: (v.get("name_en", ""), v.get("name_ru", "")) for v in VN.values()}

# -------- BA field -> registry id --------
BA_ITEM_REG, BA_BLOCK_REG = {}, {}
for m in re.finditer(r"(\w+)\s*=\s*ModItems\.registerItem\(.*?,\s*\"([^\"]+)\"\)", read(os.path.join(BA, "items", "ModItems.java"))):
    BA_ITEM_REG[m.group(1)] = m.group(2)
for m in re.finditer(r"(\w+)\s*=\s*ModBlocks\.registerBlock\(.*?,\s*\"([^\"]+)\"\)", read(os.path.join(BA, "block", "ModBlocks.java"))):
    BA_BLOCK_REG[m.group(1)] = m.group(2)

unresolved = collections.Counter()

def from_key(key, ref, meta_i):
    en_ru = ITEMNAMES.get(key)
    d = {"ref": ref}
    if meta_i: d["meta"] = meta_i
    if en_ru: d["name_en"], d["name_ru"] = en_ru
    else: unresolved[key] += 1; d["raw"] = True
    return d

def resolve_ref(ref, meta_i=0):
    ref = ref.strip()
    # BloodMagic fully-qualified
    m = re.fullmatch(r"WayofTime\.alchemicalWizardry\.ModItems\.(\w+)", ref)
    if m:
        f = m.group(1); key = "%s#%s" % (f, meta_i)
        en_ru = BM_ITEM.get(key) or BM_ITEM.get(f)
        d = {"ref": "BM:" + f}
        if meta_i: d["meta"] = meta_i
        if en_ru: d["name_en"], d["name_ru"] = en_ru
        else: unresolved["BM:" + f] += 1; d["raw"] = True
        return d
    m = re.fullmatch(r"WayofTime\.alchemicalWizardry\.ModBlocks\.(\w+)", ref)
    if m:
        en_ru = BM_BLOCK.get(m.group(1)); d = {"ref": "BM:" + m.group(1)}
        if en_ru: d["name_en"], d["name_ru"] = en_ru
        else: unresolved["BM:" + m.group(1)] += 1; d["raw"] = True
        return d
    # BloodArsenal items/blocks
    m = re.fullmatch(r"ModItems\.(\w+)", ref)
    if m:
        f = m.group(1); reg = BA_ITEM_REG.get(f)
        if reg == "blood_money":                       # meta -> 4^meta naming
            reg_key = "item.blood_money%d.name" % (4 ** meta_i if meta_i else 1)
            return from_key(reg_key, f, meta_i)
        if reg:
            return from_key("item.%s.name" % reg, f, meta_i)
        unresolved["ModItems." + f] += 1
        return {"ref": f, "raw": True}
    m = re.fullmatch(r"ModBlocks\.(\w+)", ref)
    if m:
        f = m.group(1); reg = BA_BLOCK_REG.get(f)
        if reg == "blood_stone":                       # meta -> _N+1 naming
            return from_key("tile.blood_stone_%d.name" % (meta_i + 1), f, meta_i)
        return from_key("tile.%s.name" % reg, f, meta_i) if reg else {"ref": f, "raw": True}
    # vanilla
    m = re.fullmatch(r"Items\.(field_\w+)", ref) or re.fullmatch(r"Blocks\.(field_\w+)", ref)
    if m:
        v = VN.get(m.group(1)); d = {}
        if v:
            d = {"vanilla": v["reg"], "name_en": v.get("name_en", ""), "name_ru": v.get("name_ru", "")}
        else:
            unresolved[m.group(1)] += 1; d = {"vanilla": m.group(1), "raw": True}
        if meta_i: d["meta"] = meta_i
        return d
    unresolved[ref[:40]] += 1
    return {"raw": ref[:60]}

def split_top(s):
    out, depth, cur, q = [], 0, "", None
    for c in s:
        if q:
            cur += c
            if c == q: q = None
            continue
        if c in "\"'": q = c; cur += c; continue
        if c in "([{": depth += 1
        elif c in ")]}": depth -= 1
        if c == "," and depth == 0: out.append(cur.strip()); cur = ""
        else: cur += c
    if cur.strip(): out.append(cur.strip())
    return out

TXT = read(RECIPES)
# local ItemStack vars across the file
VARMAP = {}
for m in re.finditer(r"ItemStack\s+(\w+)\s*=\s*(.+?);", TXT, re.S):
    VARMAP[m.group(1)] = m.group(2).strip()

def resolve(expr):
    e = expr.strip()
    e = re.sub(r"^\((?:ItemStack|Item|Block|Object\[\])\)\s*", "", e).strip()
    tm = re.match(r"Tags\.(?:Items|Blocks)\.([A-Z_]+)\.makeStack", e)
    if tm:
        reg = TAG2REG.get(tm.group(1)); en, ru = REG2NAME.get(reg, (tm.group(1).title(), ""))
        return {"vanilla": reg or tm.group(1).lower(), "name_en": en, "name_ru": ru or en}
    nm = re.match(r"new\s+ItemStack\((.*)\)\s*$", e, re.S)
    if nm:
        a = split_top(nm.group(1))
        meta_i = 0
        if len(a) >= 3 and a[2].strip().lstrip("-").isdigit(): meta_i = int(a[2])
        return resolve_ref(re.sub(r"^\((?:Item|Block)\)\s*", "", a[0].strip()), meta_i)
    if e in VARMAP:
        return resolve(VARMAP[e])
    return resolve_ref(e)

def method(name):
    m = re.search(r"\b" + name + r"\s*\([^)]*\)\s*\{", TXT)
    if not m: return ""
    i = m.end() - 1; depth = 0
    for j in range(i, len(TXT)):
        if TXT[j] == "{": depth += 1
        elif TXT[j] == "}":
            depth -= 1
            if depth == 0: return TXT[i + 1:j]
    return ""

# ---- altar recipes ----
altar = []
for m in re.finditer(r"registerAltarRecipe\((.+?)\);", method("registerAltarRecipes"), re.S):
    a = split_top(m.group(1))
    if len(a) < 7: continue
    altar.append({"result": resolve(a[0]), "input": resolve(a[1]),
                  "minTier": int(re.sub(r"\D", "", a[2])), "liquidRequired_LP": int(re.sub(r"\D", "", a[3])),
                  "consumptionRate": int(re.sub(r"\D", "", a[4])), "drainRate": int(re.sub(r"\D", "", a[5])),
                  "canBeFilled": "true" in a[6]})
write("altar-recipes.json", {"_meta": meta(len(altar),
     "BloodArsenal Blood Altar recipes (registered into BloodMagic's altar). Same fields as BloodMagic altar recipes."),
     "recipes": altar})

# ---- binding recipes ----
binding = []
btext = method("registerBindingRecipes")
hallow = False
for ln in btext.splitlines():
    if "isHalloween" in ln: hallow = True
    bm = re.search(r"registerRecipe\((.+?)\);", ln)
    if bm:
        a = split_top(bm.group(1))
        if len(a) >= 2:
            binding.append({"output": resolve(a[0]), "input": resolve(a[1]),
                            **({"seasonal": "halloween"} if hallow else {})})
write("binding-recipes.json", {"_meta": meta(len(binding),
     "BloodArsenal Ritual of Binding recipes. seasonal=halloween entries only register during the Halloween event."),
     "recipes": binding})

# ---- crafting (shaped oredict / shaped blood-orb / shapeless) ----
CHAR = re.compile(r"Character\.valueOf\('(.)'\)")
def parse_grid(tokens):
    shape, key, i = [], {}, 0
    while i < len(tokens):
        t = tokens[i].strip()
        sm = re.fullmatch(r'"([^"]*)"', t)
        if sm and not key: shape.append(sm.group(1)); i += 1; continue
        cm = CHAR.fullmatch(t)
        if cm and i + 1 < len(tokens): key[cm.group(1)] = resolve(tokens[i + 1]); i += 2; continue
        i += 1
    return shape, key

craft = []
body = method("registerRecipes") + "\n" + method("addBaublesRecipe")
for m in re.finditer(r"addOreDictBloodOrbRecipe\((.+?)\);", body, re.S):
    toks = split_top(m.group(1)); shape, key = parse_grid(toks[1:])
    craft.append({"type": "shaped_bloodorb", "result": resolve(toks[0]), "shape": shape, "key": key})
for m in re.finditer(r"addOreDictRecipe\((.+?)\);", body, re.S):
    toks = split_top(m.group(1)); shape, key = parse_grid(toks[1:])
    craft.append({"type": "shaped", "result": resolve(toks[0]), "shape": shape, "key": key})
for m in re.finditer(r"addShapelessOreDictRecipe\((.+?)\);", body, re.S):
    toks = split_top(m.group(1))
    craft.append({"type": "shapeless", "result": resolve(toks[0]),
                  "inputs": [resolve(t) for t in toks[1:]]})
write("crafting-recipes.json", {"_meta": meta(len(craft),
     "BloodArsenal crafting-grid recipes. shaped/shaped_bloodorb: shape[]=rows + key{char->ingredient}; "
     "shaped_bloodorb requires a blood orb in the grid. Oredict ingredients resolved to a representative item."),
     "recipes": craft})

print("\nunresolved:", sum(unresolved.values()))
for k, c in unresolved.most_common(20): print("  %3d %s" % (c, k))
