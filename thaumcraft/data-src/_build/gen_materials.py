# -*- coding: utf-8 -*-
"""Thaumcraft ecosystem materials: tool/armor materials + wand caps/rods.

Parses EnumHelper.addToolMaterial / addArmorMaterial and Thaumcraft WandCap/WandRod
registrations across all decompiled mods.
Output: thaumcraft/data-src/materials.json
"""
import re, json, os, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
DEC = r"C:\Users\pheezz\Desktop\pricoli-jar"
DECDIRS = {"decompTC":"Thaumcraft","decompMB2":"MagicBees","decompFM":"ForbiddenMagic",
           "decompTM":"TaintedMagic","decompTT":"ThaumicTinkerer","decompAE2":"AppliedEnergistics2",
           "decompBA":"BloodArsenal","decompAV":"Avaritia","decompAL":"Alfheim","decompLM":"LoliMagically"}

N = r'(?:\([\w\[\]]+\)\s*)?'   # optional cast prefix
TOOL = re.compile(r'(?:(\w+)\s*=\s*)?EnumHelper\.addToolMaterial\(\s*'+N+r'"([^"]+)"\s*,\s*'+N+r'(\d+)\s*,\s*'+N+r'(-?\d+)\s*,\s*'+N+r'(-?[\d.]+)f?\s*,\s*'+N+r'(-?[\d.]+)f?\s*,\s*'+N+r'(\d+)')
ARMOR = re.compile(r'(?:(\w+)\s*=\s*)?EnumHelper\.addArmorMaterial\(\s*'+N+r'"([^"]+)"\s*,\s*'+N+r'(\d+)\s*,\s*'+N+r'new int\[\]\s*\{([^}]*)\}\s*,\s*'+N+r'(\d+)')

tools, armors = [], []
seen_t, seen_a = set(), set()
for dec, mod in DECDIRS.items():
    for jf in glob.glob(os.path.join(DEC, dec, "**", "*.java"), recursive=True):
        try: t = open(jf, encoding="utf-8", errors="replace").read()
        except: continue
        if "addToolMaterial" in t:
            for m in TOOL.finditer(t):
                key = m.group(2)
                if key in seen_t: continue
                seen_t.add(key)
                tools.append({"name": key, "field": m.group(1), "mod": mod,
                              "harvestLevel": int(m.group(3)), "durability": int(m.group(4)),
                              "efficiency": float(m.group(5)), "damage": float(m.group(6)),
                              "enchantability": int(m.group(7))})
        if "addArmorMaterial" in t:
            for m in ARMOR.finditer(t):
                key = m.group(2)
                if key in seen_a: continue
                seen_a.add(key)
                red = [int(x) for x in re.findall(r'-?\d+', m.group(4))]
                armors.append({"name": key, "field": m.group(1), "mod": mod,
                               "durabilityFactor": int(m.group(3)),
                               "damageReduction": red,  # [helmet, chestplate, leggings, boots]
                               "enchantability": int(m.group(5))})

# wand caps / rods (Thaumcraft)
caps, rods = [], []
cfg = os.path.join(DEC, "decompTC", "thaumcraft", "common", "config", "ConfigItems.java")
if os.path.exists(cfg):
    ct = open(cfg, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r'new WandCap\("([^"]+)",\s*([\d.]+)f?\s*,.*?\)\s*,\s*(\d+)\)', ct):
        caps.append({"tag": m.group(1), "visDiscount": float(m.group(2)), "craftCost": int(m.group(3))})
    for m in re.finditer(r'new WandRod\("([^"]+)",\s*(\d+)\s*,\s*new ItemStack\([^)]*\)\s*,\s*(\d+)', ct):
        rods.append({"tag": m.group(1), "visCapacity": int(m.group(2)), "craftCost": int(m.group(3))})

out = {"_meta": {"server": "LoliLand", "generated": "2026-06-07",
                 "counts": {"toolMaterials": len(tools), "armorMaterials": len(armors),
                            "wandCaps": len(caps), "wandRods": len(rods)},
                 "notes": "tool: harvestLevel, durability(maxUses), efficiency, damage(bonus), enchantability. "
                          "armor: durabilityFactor, damageReduction[helmet,chest,legs,boots], enchantability. "
                          "wandCap.visDiscount = vis cost multiplier (lower=cheaper). wandRod.visCapacity = max vis."},
       "toolMaterials": tools, "armorMaterials": armors, "wandCaps": caps, "wandRods": rods}
json.dump(out, open(os.path.join(PROJ, "thaumcraft", "data-src", "materials.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("tools:", len(tools), "armors:", len(armors), "wandCaps:", len(caps), "wandRods:", len(rods))
