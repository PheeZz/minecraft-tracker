# Промпт-задача: извлечение данных генетики из JAR модов (1.7.10)

> Готовый промпт для агента-экстрактора. Цель — разблокировать трекер генетики:
> датасет геномов видов, текстуры, сверка локализации. Передавать агенту целиком.

---

## Роль и контекст

Ты — инженер-экстрактор данных. Есть веб-трекер генетики пчёл (Vue 3, MC 1.7.10, моды Forestry + Binnie's Mods (ExtraBees/Genetics) + Gendustry + MagicBees). Трекер уже умеет учитывать собранные гены и собирать целевые геномы, но ему не хватает **датасета геномов видов** (какой вид какие аллели несёт), **текстур** предметов/машин и сверки **локализации**. Твоя задача — добыть это из JAR-файлов модов.

Модель данных трекера (важно для совместимости вывода):
- Атом — **ген** = `(trait, alleleEN)`. Ключ: `` `${trait}|${alleleEN}` ``.
- 13 признаков (trait-ключи): `species, speed, lifespan, fertility, tempTol, humidTol, nocturnal, flyer, cave, flowering, territory, effect, flowers`.
- Канонические значения аллелей (alleleEN) — строго эти строки:
  - `speed`: Slowest, Slower, Slow, Normal, Fast, Faster, Fastest, Blinding(MagicBees)
  - `lifespan`: Shortest, Shorter, Short, Shortened, Normal, Elongated, Long, Longer, Longest, Eon(MagicBees)
  - `fertility`: 1, 2, 3, 4
  - `tempTol`/`humidTol`: None, Up 1, Up 2, Up 3, Down 1, Down 2, Down 3, Both 1, Both 2, Both 3, Both 5
  - `nocturnal`/`flyer`/`cave`: Yes, No
  - `flowering`: Slowest, Slower, Slow, Average, Fast, Faster, Fastest
  - `territory`: Average, Large, Larger, Largest
  - `effect`: None, Aggressive, Beatific, Creeper, Explorer, Freezing, Heroic, Flammable, Poison, Ends, Radioactive, Drunkard, Repulsion, Reanimation
  - `flowers`: Flowers, Nether, Cacti, Jungle, End, Wheat, Mushrooms, Gourds
- Список видов (en) — в файле `bees/i18n/genetics-i18n.json` (поле `species[]`, 257 шт., с `mod`). Используй его как whitelist: геномы нужны для этих видов.
- Существующая локализация/глоссарий — там же (`machines`, `resources`, `traits`, `alleles`).

## Входные данные

JAR-файлы модов под MC 1.7.10 (предоставлены в каталоге, путь укажет вызывающий):
`forestry-*.jar`, `binnie-mods-*.jar` (или раздельно extrabees/genetics/extratrees/botany), `gendustry-*.jar`, `magicbees-*.jar`. Modid'ы для путей внутри JAR: `forestry`, `extrabees`, `genetics`, `extratrees`, `binniecore`, `gendustry`, `magicbees`.

JAR — это zip: `unzip -o <jar> -d <dir>` или `jar xf`.

---

## Задача 1 — ДАТАСЕТ ГЕНОМОВ ВИДОВ (главное, трудное)

Нужно: для каждого вида пчелы — его **дефолтный геном** (значение по каждому из 13 признаков).

⚠️ Геномы видов заданы в **скомпилированном Java-коде**, а не в ресурсах JAR. Поэтому:

1. **Основной путь — декомпиляция.** Распакуй JAR, прогони `.class` через декомпилятор (CFR: `java -jar cfr.jar <jar> --outputdir <dir>`). Ищи классы определения видов и шаблоны аллелей:
   - Forestry: `forestry/apiculture/genetics/BeeDefinition` (enum со species + `setAllele(...)`/template-массивы), `EnumBeeChromosome`, `Allele*`.
   - ExtraBees/Binnie: `binnie/extrabees/genetics/*`, `ExtraBeeDefinition`/`ExtraBeesSpecies`, `binnie/core/genetics/*`.
   - MagicBees: `magicbees/main/Config`/`BeeManager`/`EnumBeeSpecies` (часто species + branches заданы в одном классе).
   Распарси, какой аллель ставится в какую хромосому для каждого species. Сопоставь имена аллелей/хромосом к каноническим значениям из контекста (таблица выше). Forestry-перечисления вроде `speedFastest`, `lifespanShortened`, `toleranceBoth2`, `floweringFast`, `territoryLarge` маппятся очевидно; зафиксируй маппинг в коде-нормализаторе.
2. **Фолбэк/сверка** (если декомпиляция не покрывает или для проверки): NEI-дамп предметов с генами, in-game Beealyzer, либо таблицы на ru.minecraft.wiki/ftbwiki по конкретным видам. Помечай источник.

Не выдумывай значения. Если для вида геном не извлёкся — внеси его в `coverageGaps`, а не угадывай.

**Выходной файл:** `genetics/data-src/species-genomes.json`
```json
{
  "_meta": { "source": "decompiled forestry-x / extrabees-y ...", "generated": "<дата>", "coverageGaps": ["<species en, для которых не нашли>"] },
  "species": [
    {
      "en": "Industrious",
      "mod": "Forestry",
      "genome": {
        "species": "Industrious",
        "speed": "Fastest",
        "lifespan": "Shorter",
        "fertility": "2",
        "tempTol": "None",
        "humidTol": "None",
        "nocturnal": "No",
        "flyer": "No",
        "cave": "No",
        "flowering": "Slowest",
        "territory": "Average",
        "effect": "None",
        "flowers": "Flowers"
      }
    }
  ]
}
```
Требования к значениям: строго канонические alleleEN (см. таблицу). `en` вида должен присутствовать в `species[]` из `genetics-i18n.json`. Частичный геном допустим (отсутствующий признак — пропусти ключ + отметь в `coverageGaps`), но стремись к полноте.

---

## Задача 2 — ТЕКСТУРЫ

Извлеки 16×16 PNG из `assets/<modid>/textures/`:
- **Предметы/ресурсы** (`textures/items/*.png`): серум/генетическая посуда, массив сывороток, бланк секвенсора, генетический шаблон, образец гена, светящийся краситель, бактериальный фермент, этанол, лабораторная посуда, протеин, питательная среда.
- **Машины** (`textures/blocks/*.png`): Изолятор, Секвенсор, Полимеризатор, Инокулятор, Сплайсер, Инкубатор, Сборщик ДНК, Анализатор, Лабораторная стойка (Binnie); Пробоотборник, Транспозер, Импринтер, Мутатрон, Мутагенный производитель, Репликатор, Промышленная пасека (Gendustry). ⚠️ Машины — 3D-блоки с несколькими гранями; единой иконки нет. Извлеки все грани блока и **пометь**, что нужен изометрический рендер (его сделаем отдельно).

**Куда:** `genetics/textures/items/*.png`, `genetics/textures/blocks/*.png` (сохраняй оригинальные имена файлов).
**Манифест:** `genetics/textures/manifest.json` — соответствие наших ключей путям:
```json
{
  "items": { "Serum": "items/serum.png", "Genetic Template": "items/genetic_template.png", "Fluorescent Dye": "items/fluorescent_dye.png" },
  "machines": { "Isolator": { "faces": ["blocks/isolator_top.png","blocks/isolator_side.png"], "needsIsoRender": true } }
}
```
Ключи `items`/`machines` бери из `genetics-i18n.json` (английские оригиналы машин/ресурсов). Чего не нашёл — в `manifest.json._missing`.

---

## Задача 3 — СВЕРКА ЛОКАЛИЗАЦИИ

Из `assets/<modid>/lang/ru_RU.lang` и `en_US.lang` собери официальные RU/EN названия для: машин, ресурсов, признаков, значений аллелей (speed/lifespan/effect/flowers/tolerance/territory), видов. Сверь с текущим `genetics-i18n.json` и выдай **отчёт расхождений** (наше значение vs официальное), НЕ переписывая i18n самостоятельно.

**Выход:** `genetics/data-src/lang-reconciliation.md` — таблицы «ключ · наше · официальное ru_RU · en_US · совпадает?».

---

## Критерии приёмки

- `species-genomes.json` валиден; значения только из канонических alleleEN; виды — из whitelist; пробелы честно в `coverageGaps` с указанием причины.
- Текстуры извлечены, `manifest.json` ссылается на реально существующие файлы; машины помечены `needsIsoRender`.
- `lang-reconciliation.md` покрывает машины/ресурсы/признаки/аллели/виды с явными расхождениями.
- В финальном отчёте: какие JAR/версии использованы, инструмент декомпиляции, % покрытия геномов (видов с полным геномом / всего), список нерешённого.

## Что НЕ делать

- Не угадывать геномы/значения; неизвестное → `coverageGaps`.
- Не переписывать `genetics-i18n.json` и код трекера — только выдать данные в `genetics/data-src/` и `genetics/textures/`. Интеграцию (генераторы, derive «вид→аллель → носители») сделает основной разработчик.
- Не нормализовать значения «по смыслу» к несуществующим строкам — только к канону из таблицы; что не маппится — отметить.
```
