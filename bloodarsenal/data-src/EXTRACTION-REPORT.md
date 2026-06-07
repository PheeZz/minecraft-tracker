# BloodArsenal recipe extraction report

**Source:** `BloodArsenal-1.7.10-1.2-5.jar` (modid `bloodarsenal`, BloodMagic addon), LoliLand `techno_magic_rpg` pack.
**Generated:** 2026-06-07 · CFR 0.152 (`BloodArsenalRecipes.java`).

BloodArsenal **items + textures** were already extracted in the Thaumcraft-ecosystem pass (100 items in `thaumcraft/data-src/item-names.json`; 86 item + 32 block PNGs in `thaumcraft/textures/.../bloodarsenal/`). This pass adds BloodArsenal's **own recipes**, which the earlier Thaumcraft sweep didn't cover (it only caught the 3 recipes registered through Thaumcraft infusion).

All datasets carry `_meta.server = "LoliLand"`. Names resolve from three sources, nothing invented:
- BloodArsenal items/blocks → `thaumcraft/data-src/item-names.json` (EN; RU falls back to EN — the mod ships no `ru_RU.lang`).
- BloodMagic refs (`WayofTime.alchemicalWizardry.Mod*`, tagged `ref:"BM:<field>"`) → `bloodmagic/data-src/{items,blocks}.json` (full EN/RU).
- Vanilla (`Items/Blocks.field_*`, `Tags.*`) → `thaumcraft/data-src/vanilla-names.json`.

## Datasets (`data-src/*.json`)

| file | count | contents |
|------|------:|----------|
| `altar-recipes.json` | 11 | BloodArsenal Blood Altar recipes (input → result, tier, LP, rates) |
| `binding-recipes.json` | 8 | Ritual of Binding recipes; 3 are `seasonal:"halloween"` (vampire armour, registers only during the event) |
| `crafting-recipes.json` | 68 | grid recipes: 39 blood-orb (`shaped_bloodorb`), 19 `shaped`, 10 `shapeless` |

## Coverage
- **301 item references resolved, 0 unresolved / 0 raw.** Cross-mod refs work: e.g. the Life Infuser recipe correctly mixes BloodArsenal Blood Infused Iron, BloodMagic Magician's Blood Orb (RU: Кровавый шар мага) and the Blood Altar.
- Meta'd items handled: `blood_stone` meta N → `tile.blood_stone_{N+1}.name`; `blood_money` meta N → `item.blood_money{4^N}.name`; BloodMagic `baseItems` meta 27 (Ethereal Slate) via the bloodmagic dataset.
- RU for BloodArsenal-native items equals EN by design (no Russian lang in the mod) — consistent with the Thaumcraft item-names fallback.
- Build script: `_build/gen_bloodarsenal.py` (re-runnable against the decompiled source + the bloodmagic/thaumcraft name datasets).
