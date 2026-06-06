# Отчёт об извлечении данных генетики (MC 1.7.10)

Дата: 2026-06-06. Все выходные данные — в `genetics/data-src/` и `genetics/textures/`.
Файлы трекера (`bees/i18n/genetics-i18n.json`, код) **не изменялись**.

## Использованные JAR и инструменты

| Мод | JAR | modid'ы |
|---|---|---|
| Forestry | `forestry_1.7.10-4.2.16.64.jar` | forestry |
| Binnie (ExtraBees) | `binnie-mods-1.7.10-2.0.22.7.jar` | extrabees, genetics, binniecore |
| Gendustry | `gendustry-1.6.4.135-mc1.7.10.jar` | gendustry |
| MagicBees | `magicbees-1.7.10-2.4.4.jar` | magicbees |

- **Декомпилятор:** CFR 0.152 (вывод уже был в `~/Desktop/pricoli-jar/decomp*`).
- **Генераторы (воспроизводимо):** `genetics/data-src/_build/gen_genomes.py`, `gen_lang_recon.py`.
- **Промежуточные lang-файлы:** `genetics/_assets/**/lang/*.lang` (извлечены из JAR, нужны генераторам).

## Задача 1 — датасет геномов  →  `species-genomes.json`

Геном вычислен **детерминированно из исходников** (не угадан), по модели наследования:

- **Forestry / ExtraBees:** `defaultTemplate` → `branch.setBranchProperties` → `species.setAlleles`
  (см. `BeeBranchDefinition.getDefaultTemplate()` и enum-константы `BeeDefinition`/`ExtraBeeDefinition`).
- **MagicBees:** `getTemplateModBase` → цепочка базовых шаблонов → пер-вид override
  (`BeeGenomeManager.getTemplate*`), вид→шаблон из `BeeSpecies.setupBeeSpecies()`.

Значения аллелей нормализованы к каноническим `alleleEN`. Сопоставление имён аллель/эффект/цветок —
через официальные in-game display-имена из `en_US.lang` (например `effectMiasmic`→`Poison`,
`effectMisanthrope`→`Ends`, `effectGlacial`→`Freezing`).

### Покрытие

| | извлечено | полный геном (13) |
|---|---|---|
| Forestry | 44 | 36 |
| ExtraBees | 107 | 38 |
| MagicBees | 124 | 118 |
| **Всего** | **275** | **192** |

- **Whitelist (`genetics-i18n.json`, 256 видов): сопоставлено 256/256 (100 %).** Из них полный
  геном у **182**, частичный у **74**.
- `_meta.whitelistNotExtracted` пуст. `_meta.extractedNotInWhitelist` — 19 «бонусных» видов
  (варианты ExtraBees/MagicBees, которых нет в whitelist: Osmium, Silicon, Certus, Fluix,
  Hazardous, Farmed и т.д.) — данные есть, можно добавить в трекер при желании.

### Почему 74 генома частичные (честные пробелы)

Частичность почти всегда — это **один-два** признака (`flowers` и/или `effect`), у которых
**нет канонического значения** в трекере. Остальные 11 признаков заполнены. Причины:

- **`flowers` (ExtraBees):** свои провайдеры цветов — Rocks, Dead Bushes, Lily Pads, Reeds,
  Redstone, Mystical, … — отсутствуют в каноне (`flowers` = только 8 forestry-значений).
- **`flowers` = Snow** (Forestry FROZEN-ветка: Wintry/Icy/Glacial/Merry/Tipsy; часть MagicBees) —
  «Snow» не входит в канон.
- **`effect` (ExtraBees):** свои эффекты (Unstable, Meteor, Ectoplasm, Acidic, Lightning,
  Darkness, Gravity, Hunger, Zombies, …) — не в каноне.
- **`effect` (Forestry, не в каноне):** Festive (Leporine), Snow (Merry), Resurrection
  (Phantasmal), Fertile (Agrarian), Mycophilic (Boggy).
- **`flowering` = Maximum** — встречается у пары MagicBees (FTB-подобные шаблоны), нет в каноне.

Полный перечень — в `_meta.coverageGaps` (построчно `Вид (Мод): trait=значение`) и
`_meta.nonCanonicalAlleles` (уникальные неканонические значения по признакам).

> **Рекомендация разработчику:** чтобы поднять полноту до ~100 %, расширить канон трекера:
> `flowers` += Snow, Rocks, Dead Bushes, Lily Pads, Reeds, Redstone, Mystical (+ остальные из
> `nonCanonicalAlleles.flowers`); `effect` += Festive, Snowing, Resurrection, Fertile, Mycophilic
> и эффекты ExtraBees; `flowering` += Maximum. После этого перегенерировать `gen_genomes.py`.

### Формат `species-genomes.json`

`species[]`: `{ en (официальное in-game имя), mod, whitelistEn?, genome{...} }`.
`whitelistEn` присутствует, только если ключ в i18n отличается от официального имени
(в основном MagicBees-плейсхолдеры, см. Задачу 3) — это «мост» для join с i18n.

## Задача 2 — текстуры  →  `genetics/textures/`

- **36** item-PNG (`textures/items/`), **42** machine/block-PNG (`textures/blocks/`).
- Манифест `textures/manifest.json`: 12 ключей `items`, 18 `machines` (помечены `needsIsoRender`),
  все пути проверены на существование.
- **Binnie-машины** рендерятся не как кубы, а из единого tile-атласа
  `assets/genetics/textures/tile/<Machine>.png` (Isolator, Sequencer, Polymeriser(брит. написание),
  Inoculator, Splicer, Incubator, Genepool, Analyser). Gendustry-машины — обычные кубы (top/side/bottom).
- `manifest._missing` (4): **Acclimatiser**, **Lab Stand** (нет своих текстур — общий атлас/процедурно),
  **Ethanol** (нет иконки в JAR), **Bacteria Vector** (нет файла «vector», приближённо `bacteriaDNA.png`).

## Задача 3 — сверка локализации  →  `lang-reconciliation.md`

Сравнение `genetics-i18n.json` с официальными `ru_RU/en_US.lang`. i18n не переписывался.

Главные находки:
- **Виды, расхождение EN — 53 (все MagicBees):** в i18n `en` — плейсхолдеры из enum
  (`TcAir`, `AmEssence`, `TeBronze`, `Earthy`, `Bigbad`, `Chicken`, `Beef`, `Pork`, …),
  а реальные in-game имена другие (`Aer`, `Essence`, `Bronzed`, `Earthen`, `Big Bad`,
  `Poultry`, `Beefy`, `Porcine`, …). Рекомендуется поправить `en` в i18n по столбцу «офиц. en_US».
- **Виды, расхождение RU — 52:** часть `ru_RU.lang` MagicBees сама непереведена (английский/немецкий:
  `Tinker`, `Dante`, `Electrum`, `Luft`, `Wasser`). Наши RU-имена часто *лучше* официальных — это
  отчёт, а не указание перезаписать.
- **Признаки/аллели:** наши RU отличаются от официальных (Speed → офиц. «Скорость производства»/
  *Production*; Flowering → офиц. «Скорость опыления»/*Pollination*; speed-аллели у нас в ж.р.
  «Очень медленная», офиц. в м.р. «Самый медленный»). Согласуется с пометкой в i18n, что
  `alleles/traits` — черновик.
- **Дубль `en="Mystical"`** в i18n (ExtraBees Mystical и MagicBees Mystical ✦ имеют одинаковый `en`).

## Нерешённое / на усмотрение разработчика

1. Канон `flowers`/`effect`/`flowering` уже канона мода → 74 частичных генома (см. выше).
2. MagicBees `en`-плейсхолдеры в i18n → поправить по `lang-reconciliation.md`.
3. Дубль `en="Mystical"` в whitelist (нужен уникальный ключ для двух видов).
4. Текстуры Acclimatiser / Lab Stand / Ethanol / Bacteria Vector — нет в JAR.
5. Изо-рендер машин — отдельная задача (грани/атласы извлечены, помечены `needsIsoRender`).
