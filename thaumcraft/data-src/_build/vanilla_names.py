# -*- coding: utf-8 -*-
"""Build vanilla SRG-field -> {regName, name_en, name_ru} from the MC 1.7.10 client.

Source: decompiled net/minecraft/init/Items.java + Blocks.java (SRG names with the
registry-name string literal) and the vanilla en_US/ru_RU lang (from client.jar /
asset objects). Imported by gen_recipes.py and gen_sources.py to name vanilla items.
Output also dumped to vanilla-names.json for reference.
"""
import re, json, os

DEC = r"C:\Users\pheezz\Desktop\pricoli-jar\mcvanilla"
LANG = os.path.join(DEC, "lang")

def load_lang(fn):
    d = {}
    p = os.path.join(LANG, fn)
    if os.path.exists(p):
        for line in open(p, encoding="utf-8", errors="replace"):
            line = line.rstrip("\n")
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1); d[k.strip()] = v.strip()
    return d
VEN, VRU = load_lang("en_US.lang"), load_lang("ru_RU.lang")

def titlecase(reg):
    return reg.replace("_", " ").title()

EN_REV = {}   # english display -> lang key (to recover the unlocalized key when reg != unloc)
for k, v in VEN.items():
    EN_REV.setdefault(v, k)

def build():
    srg = {}   # field_XXXX -> regName
    for cls in ("Items.java", "Blocks.java"):
        p = os.path.join(DEC, "out", "net", "minecraft", "init", cls)
        if not os.path.exists(p): continue
        t = open(p, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r'(field_\d+_[A-Za-z]+)\s*=\s*[^;]*?func_82594_a\("([a-z0-9_]+)"', t):
            srg.setdefault(m.group(1), m.group(2))
    out = {}
    for fld, reg in srg.items():
        # direct: lang key == registry id
        key = next((k for k in ("item.%s.name" % reg, "tile.%s.name" % reg) if k in VEN), None)
        if key:
            en = VEN[key]; ru = VRU.get(key, en)
        else:
            en = titlecase(reg)
            key = EN_REV.get(en)          # recover real unlocalized key via EN display
            ru = VRU.get(key, en) if key else en
        out[fld] = {"reg": reg, "name_en": en, "name_ru": ru}
    return out

VANILLA = build()

if __name__ == "__main__":
    OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vanilla-names.json")
    json.dump({"_meta": {"server": "LoliLand", "generated": "2026-06-07",
                         "count": len(VANILLA),
                         "source": "MC 1.7.10 client.jar net/minecraft/init/{Items,Blocks} (SRG) + vanilla en/ru lang",
                         "notes": "field = SRG field name as used in decompiled mod code (Items.field_xxx / Blocks.field_xxx). reg = vanilla registry id. names fall back to title-cased reg when the lang key differs from the registry id."},
               "fields": VANILLA},
              open(os.path.abspath(OUT), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("vanilla fields:", len(VANILLA))
    for f in ("field_151044_h", "field_151042_j", "field_150347_e"):
        print(" ", f, VANILLA.get(f))
