# -*- coding: utf-8 -*-
"""Build textures-manifest.json + item-icon-map.json for BloodMagic.

Icon files are CamelCase (e.g. WaterSigil.png). Match them against item/block
display names by normalising both sides. Best-effort; unmatched are reported,
never invented.
"""
import os, re, json, glob

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo/bloodmagic
TEX  = os.path.join(ROOT, "textures")
DS   = os.path.join(ROOT, "data-src")
GEN_DATE, SERVER = "2026-06-07", "LoliLand"

def norm(s):
    s = re.sub(r"[^a-z0-9]", "", s.lower())
    return s

# gather textures
items = sorted(glob.glob(os.path.join(TEX, "items", "alchemicalwizardry", "*.png")))
blocks = sorted(glob.glob(os.path.join(TEX, "blocks", "alchemicalwizardry", "*.png")))
def rel(p): return os.path.relpath(p, ROOT).replace("\\", "/")

# index by normalised basename; also index a variant-stripped key (drop trailing
# _activated/_deactivated/_on/_off and trailing digits) so item variants collapse.
def index(paths):
    d = {}
    for p in paths:
        base = os.path.splitext(os.path.basename(p))[0]
        r = rel(p)
        d.setdefault(norm(base), r)
        stripped = re.sub(r"(_(activated|deactivated|on|off)|\d+)$", "", base)
        # prefer the _activated / base art for the collapsed key
        if stripped != base and ("activ" in base.lower() or not base[-1].isdigit() or base.endswith("1")):
            d.setdefault(norm(stripped), r)
    return d
ITEM_IDX, BLOCK_IDX = index(items), index(blocks)

# load names
def names(fn, k):
    return json.load(open(os.path.join(DS, fn), encoding="utf-8"))[k]
icon_map, matched, total = {}, 0, 0
for it in names("items.json", "items"):
    en = it.get("name_en")
    if not en: continue
    total += 1
    key = norm(en)
    sub = it.get("sub", "")
    # try display name, field name, sub name, and the "baseItem<Sub>" icon convention
    cand = (ITEM_IDX.get(key) or ITEM_IDX.get(norm(it.get("field", ""))) or
            (ITEM_IDX.get(norm(sub)) if sub else None) or
            (ITEM_IDX.get(norm("baseItem" + sub)) if sub else None) or
            (ITEM_IDX.get(norm("baseAlchemy" + sub)) if sub else None))
    if cand:
        icon_map[en] = cand; matched += 1
for bl in names("blocks.json", "blocks"):
    en = bl.get("name_en")
    if not en: continue
    total += 1
    cand = BLOCK_IDX.get(norm(en)) or BLOCK_IDX.get(norm(bl.get("unlocalized","")))
    if cand:
        icon_map[en] = cand; matched += 1

icon_map = dict(sorted(icon_map.items()))
with open(os.path.join(TEX, "item-icon-map.json"), "w", encoding="utf-8") as f:
    json.dump(icon_map, f, ensure_ascii=False, indent=2)

manifest = {
    "_meta": {"server": SERVER, "generated": GEN_DATE,
              "note": "BloodMagic (alchemicalwizardry) item/block textures extracted from the mod jar.",
              "iconMapMatchRate": "%d/%d" % (matched, total)},
    "byMod": {"alchemicalwizardry": {"items": len(items), "blocks": len(blocks)}},
    "total": {"items": len(items), "blocks": len(blocks)},
}
with open(os.path.join(TEX, "textures-manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print("items png:", len(items), "blocks png:", len(blocks))
print("icon-map matched: %d/%d" % (matched, total))
