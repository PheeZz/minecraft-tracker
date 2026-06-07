# BloodMagic extraction report

**Source:** `BloodMagic-1.7.10-1.3.3-17.jar` (modid `AWWayofTime`, package `WayofTime.alchemicalWizardry`), as shipped on the **LoliLand** `techno_magic_rpg` modpack.
**Generated:** 2026-06-07 · decompiler CFR 0.152.

Every dataset carries a machine-readable `_meta.server = "LoliLand"` flag (not in any description, not surfaced in UI) so the data can later be re-actualised for other servers. Display names come from the mod's own `en_US.lang` / `ru_RU.lang`; `name_ru` falls back to `name_en` only when the mod ships no Russian string. Nothing is invented.

## Datasets (`data-src/*.json`)

| file | count | contents |
|------|------:|----------|
| `items.json` | 160 | every item lang key → EN/RU; sub-items (`baseItems`, `baseAlchemyItems`, `activationCrystal`) expanded per meta |
| `blocks.json` | 39 | every block; `unlocalized` from `func_149663_c` |
| `blood-orbs.json` | 6 | LP storage capacity + altar tier + fill consumption rate per orb |
| `altar-recipes.json` | 25 | Blood Altar: input → result, minTier, LP required, consumption/drain rate, fillable flag |
| `alchemy-recipes.json` | 59 | Alchemic Chemistry Set: inputs[], LP per craft, min orb tier |
| `binding-recipes.json` | 6 | Ritual of Binding transmutations (Unbinding = reverse) |
| `crafting-recipes.json` | 90 | vanilla-grid recipes (shaped/shapeless + blood-orb variants) with `shape[]` + `key{}` |
| `rituals.json` | 36 | all rituals: crystal level, LP cost (activation + upkeep), **rune layout / схемы**, guidebook description |
| `reagents.json` | 15 | item → reagent type + mB produced |
| `summoning.json` | 14 | demon/elemental Blood Altar summons, escalating ingredient tiers |
| `sigils.json` | 20 | sigils + LP cost per use + kind (placement/activated/passive) |
| `altar-structure.json` | 6 | **Blood Altar multiblock per tier** (every rune/pillar/beacon offset; cumulative) |
| `guidebook.json` | 141 | full in-game guidebook (Sanguine Scientiem) lore, by chapter/entry (EN) |

### Ritual rune layouts (схемы)
Each ritual in `rituals.json` includes `layout[]` — the rune schematic relative to the Master Ritual Stone at `(0,0)`: `x`/`z` are horizontal offsets, `y` vertical, `rune` is the stone type (`blank/water/fire/earth/air/dusk/dawn`). `runeCount` includes the central master stone; `runeBreakdown` tallies stones by type. Ritual `cost` is the **mod default** LP (the server may override it via config — flagged by `_meta.server`).

## Assets
- **Textures** (`textures/`): 192 item + 56 block PNGs under `*/alchemicalwizardry/`, plus `textures-manifest.json` and `item-icon-map.json` (display name → texture path, **114/186 ≈ 61 %** auto-matched; remainder are activated/deactivated armor & focus variants whose icon names diverge from display names — not matched rather than guessed).
- **Raw lang** (`_assets/lang/`): `en_US.lang`, `ru_RU.lang` straight from the jar.

## Coverage / honesty notes
- **1 unresolved vanilla ref** total: `Blocks.field_150429_aA` (lit redstone torch) — a gap in the shared `vanilla-names.json`, kept verbatim under `raw`.
- All 36 rituals, all 25 altar / 59 alchemy / 6 binding / 90 crafting / 14 summoning recipes resolved their items to EN/RU names (aside from the single ref above).
- `crystalLevel` 1 = Weak Activation Crystal, 2 = Awakened; demon rituals shown at their non-creative tier.
- Build scripts: `_build/gen_bloodmagic.py` (data), `_build/gen_textures.py` (manifest/icon-map). Re-runnable against the decompiled source.
