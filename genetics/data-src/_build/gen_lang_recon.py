# -*- coding: utf-8 -*-
"""Task 3: localisation reconciliation.

Compares bees/i18n/genetics-i18n.json against the official ru_RU/en_US .lang files
extracted from the mod JARs, and writes genetics/data-src/lang-reconciliation.md.
Does NOT modify the i18n file.
"""
import os, json, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
ASSETS = os.path.join(PROJ, "genetics", "_assets")
I18N = os.path.join(PROJ, "bees", "i18n", "genetics-i18n.json")
GENOMES = os.path.join(PROJ, "genetics", "data-src", "species-genomes.json")
OUT = os.path.join(PROJ, "genetics", "data-src", "lang-reconciliation.md")

def lang(modpath):
    d = {}
    p = os.path.join(ASSETS, modpath)
    if not os.path.exists(p):
        return d
    for line in open(p, encoding="utf-8"):
        line = line.rstrip("\n")
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            d[k.strip()] = v.strip()
    return d

L = {}
for modid, sub in [("forestry","forestry/assets/forestry/lang"),
                   ("extrabees","binnie/assets/extrabees/lang"),
                   ("genetics","binnie/assets/genetics/lang"),
                   ("binniecore","binnie/assets/binniecore/lang"),
                   ("gendustry","gendustry/assets/gendustry/lang"),
                   ("magicbees","magicbees/assets/magicbees/lang")]:
    L[modid] = {"en": lang(sub + "/en_US.lang"), "ru": lang(sub + "/ru_RU.lang")}

i18n = json.load(open(I18N, encoding="utf-8"))
genomes = json.load(open(GENOMES, encoding="utf-8"))

def mark(a, b):
    return "✅" if (a or "").strip() == (b or "").strip() else "❌"

def esc(s):
    return (s or "—").replace("|", "\\|")

rows_out = []
def table(title, headers, rows):
    rows_out.append("\n## " + title + "\n")
    rows_out.append("| " + " | ".join(headers) + " |")
    rows_out.append("|" + "|".join(["---"]*len(headers)) + "|")
    for r in rows:
        rows_out.append("| " + " | ".join(esc(c) for c in r) + " |")

# ---------------------------------------------------------------- TRAITS
trait_keys = {
    "Species":None, "Speed":"for.gui.speed", "Lifespan":"for.gui.lifespan",
    "Fertility":"for.gui.fertility", "Temperature Tolerance":"for.gui.temperature",
    "Humidity Tolerance":"for.gui.humidity", "Nocturnal":"for.gui.nocturnal",
    "Tolerant Flyer":"for.gui.flyer", "Cave Dwelling":"for.gui.cave",
    "Flowering":"for.gui.pollination", "Territory":"for.gui.area",
    "Effect":"for.gui.effect", "Flower Provider":"for.gui.flowers",
}
rows = []
for en, key in trait_keys.items():
    our_ru = i18n["traits"].get(en, "")
    off_en = L["forestry"]["en"].get(key, "") if key else ""
    off_ru = L["forestry"]["ru"].get(key, "") if key else ""
    rows.append([en, our_ru, off_ru, off_en, mark(our_ru, off_ru) if off_ru else "—"])
table("Признаки (traits)  ·  forestry for.gui.*",
      ["i18n EN-ключ","наше RU","офиц. ru_RU","офиц. en_US","RU совпадает?"], rows)

# ---------------------------------------------------------------- ALLELES (generic)
allele_simple = {
    "speed": ("forestry.allele.{}", {"Slowest":"slowest","Slower":"slower","Slow":"slow",
        "Normal":"normal","Fast":"fast","Faster":"faster","Fastest":"fastest"}),
    "lifespan": ("forestry.allele.lifespan.{}", {"Shortest":"shortest","Shorter":"shorter",
        "Short":"short","Shortened":"shortened","Normal":"normal","Elongated":"elongated",
        "Long":"long","Longer":"longer","Longest":"longest"}),
    "flowering": ("forestry.allele.{}", {"Slowest":"slowest","Slower":"slower","Slow":"slow",
        "Average":"average","Fast":"fast","Faster":"faster","Fastest":"fastest"}),
}
for cat,(tpl,m) in allele_simple.items():
    rows = []
    src = {x["en"]: x.get("ru","") for x in i18n["alleles"].get(cat,[]) if isinstance(x,dict)}
    for en, suff in m.items():
        key = tpl.format(suff)
        off_en = L["forestry"]["en"].get(key,"")
        off_ru = L["forestry"]["ru"].get(key,"")
        our_ru = src.get(en,"")
        rows.append([en, our_ru, off_ru, off_en, mark(our_ru, off_ru) if off_ru else "—"])
    table("Аллели · %s · forestry.allele.*" % cat,
          ["EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# tolerance
rows = []
tolmap = {"None":"none","Up 1":"up1","Up 2":"up2","Up 3":"up3","Down 1":"down1","Down 2":"down2",
          "Down 3":"down3","Both 1":"both1","Both 2":"both2","Both 3":"both3","Both 5":"both5"}
for en, suff in tolmap.items():
    key = "forestry.allele.tolerance."+suff
    rows.append([en, "(нет в i18n)", L["forestry"]["ru"].get(key,""), L["forestry"]["en"].get(key,""), "—"])
table("Аллели · tolerance (tempTol/humidTol) · forestry.allele.tolerance.*",
      ["EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# territory (generic allele names)
rows = []
src = {x["en"]: x.get("ru","") for x in i18n["alleles"].get("territory",[]) if isinstance(x,dict)}
for en, suff in {"Average":"average","Large":"large","Larger":"larger","Largest":"largest"}.items():
    key = "forestry.allele."+suff
    rows.append([en, src.get(en,""), L["forestry"]["ru"].get(key,""), L["forestry"]["en"].get(key,""),
                 mark(src.get(en,""), L["forestry"]["ru"].get(key,""))])
table("Аллели · territory · forestry.allele.*",
      ["EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# effect
rows = []
eff_keys = {"None":"none","Aggressive":"aggressive","Beatific":"beatific","Creeper":"creeper",
    "Explorer":"exploration","Freezing":"glacial","Heroic":"heroic","Flammable":"ignition",
    "Poison":"miasmic","Ends":"misanthrope","Radioactive":"radioactive","Drunkard":"drunkard",
    "Repulsion":"repulsion","Reanimation":"reanimation"}
src = {x["en"]: x.get("ru","") for x in i18n["alleles"].get("effect",[]) if isinstance(x,dict)}
for en, suff in eff_keys.items():
    key = "forestry.allele.effect."+suff
    rows.append([en, src.get(en,""), L["forestry"]["ru"].get(key,""), L["forestry"]["en"].get(key,""),
                 mark(src.get(en,""), L["forestry"]["ru"].get(key,""))])
table("Аллели · effect · forestry.allele.effect.*  (наш EN-ключ → офиц. allele)",
      ["i18n EN","наше RU","офиц. ru_RU","офиц. en_US (display)","RU?"], rows)

# flowers (flower provider)
rows = []
fl_keys = {"Flowers":"vanilla","Nether":"nether","Cacti":"cacti","Jungle":"jungle","End":"end",
           "Wheat":"wheat","Mushrooms":"mushrooms","Gourds":"gourd"}
src = {x["en"]: x.get("ru","") for x in i18n["alleles"].get("flowers",[]) if isinstance(x,dict)}
for en, suff in fl_keys.items():
    key = "for.flowers."+suff
    rows.append([en, src.get(en,""), L["forestry"]["ru"].get(key,""), L["forestry"]["en"].get(key,""),
                 mark(src.get(en,""), L["forestry"]["ru"].get(key,""))])
table("Аллели · flowers (опыляемые цветы) · for.flowers.*",
      ["i18n EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# ---------------------------------------------------------------- MACHINES (binnie)
rows = []
binnie_keys = {"Incubator":"incubator","Genepool":"genepool","Isolator":"isolator","Analyser":"analyser",
    "Polymerizer":"polymeriser","Sequencer":"sequencer","Inoculator":"inoculator","Splicer":"splicer",
    "Acclimatiser":"acclimatiser","Lab Stand":"labMachine"}
for en, suff in binnie_keys.items():
    key = "genetics.machine.machine."+suff
    off_en = L["genetics"]["en"].get(key,"")
    off_ru = L["genetics"]["ru"].get(key,"")
    our = i18n["machines"]["binnie"].get(en,"")
    note = "" if off_en else "(ключ не найден — иное имя/процедурно)"
    rows.append([en, our, off_ru, off_en or note, mark(our, off_ru) if off_ru else "—"])
table("Машины · Binnie (genetics) · genetics.machine.machine.*",
      ["i18n EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# resources (binnie items + genetics resources)
rows = []
res_keys = [  # (i18n section, en, lang modid, key)
    ("binnie_items","Gene Database","genetics","genetics.item.database.bees"),
    ("binnie_items","Blank Sequence","genetics","genetics.item.sequence"),
    ("binnie_items","Serum","genetics","genetics.item.serum"),
]
# generic resources block compared against best-effort keys
for sec, en, mod, key in res_keys:
    our = i18n["machines"].get(sec,{}).get(en,"")
    rows.append([en, our, L[mod]["ru"].get(key,""), L[mod]["en"].get(key,""), "—"])
table("Ресурсы/предметы · Binnie (best-effort ключи)",
      ["i18n EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# ---------------------------------------------------------------- MACHINES (gendustry)
rows = []
gd_keys = {"Genetic Sampler":"tile.gendustry.sampler.name","Genetic Imprinter":"tile.gendustry.imprinter.name",
    "Genetic Transposer":"tile.gendustry.transposer.name","Genetic Replicator":"tile.gendustry.replicator.name",
    "Genetic Template":"item.gendustry.GeneTemplate.name","Genetic Sample":"item.gendustry.GeneSample.name",
    "Mutatron":"tile.gendustry.mutatron.name","Mutagen Producer":"tile.gendustry.mutagen_producer.name",
    "Industrial Apiary":"tile.gendustry.apiary.name","Protein":"tile.gendustry.protein.name"}
for en, key in gd_keys.items():
    our = i18n["machines"]["gendustry"].get(en,"")
    off_en = L["gendustry"]["en"].get(key,"")
    off_ru = L["gendustry"]["ru"].get(key,"")
    rows.append([en, our, off_ru, off_en, mark(our, off_ru) if off_ru else "—"])
table("Машины/предметы · Gendustry · tile/item.gendustry.*",
      ["i18n EN","наше RU","офиц. ru_RU","офиц. en_US","RU?"], rows)

# ---------------------------------------------------------------- SPECIES (the big one)
# official en->ru per mod from lang
off_sp = {}   # official_en -> (ru, mod)
for k,v in L["forestry"]["en"].items():
    if k.startswith("for.bees.species."):
        off_sp[v] = (L["forestry"]["ru"].get(k,""), "Forestry")
for k,v in L["extrabees"]["en"].items():
    if k.startswith("extrabees.species.") and k.endswith(".name"):
        off_sp[v] = (L["extrabees"]["ru"].get(k,""), "ExtraBees")
for k,v in L["magicbees"]["en"].items():
    if k.startswith("magicbees.species") and ".desc" not in k and not k.endswith("Flavor"):
        off_sp[v] = (L["magicbees"]["ru"].get(k,""), "MagicBees")

i18n_by_en = {s["en"]: s for s in i18n["species"]}
# join via genome file: each genome species has official en + (whitelistEn = i18n key)
rows = []
en_mismatch = []
ru_mismatch = []
seen_keys = set()
for g in sorted(genomes["species"], key=lambda s:(s["mod"], s["en"])):
    off_en = g["en"]
    i18n_key = g.get("whitelistEn", off_en)
    seen_keys.add(i18n_key)
    rec = i18n_by_en.get(i18n_key)
    our_ru = rec["ru"] if rec else "(нет в i18n)"
    off_ru, _ = off_sp.get(off_en, ("",""))
    en_ok = "✅" if i18n_key == off_en else "❌"
    if i18n_key != off_en:
        en_mismatch.append([g["mod"], i18n_key, off_en, off_ru])
    ru_ok = mark(our_ru, off_ru) if off_ru else "—"
    if off_ru and our_ru not in ("(нет в i18n)",) and our_ru.strip() != off_ru.strip():
        ru_mismatch.append([g["mod"], off_en, our_ru, off_ru])
    rows.append([g["mod"], i18n_key, off_en, en_ok, our_ru, off_ru, ru_ok])

table("Виды — сводка (i18n EN-ключ ↔ официальный in-game EN ↔ RU)",
      ["mod","i18n EN","офиц. en_US","EN?","наше RU","офиц. ru_RU","RU?"], rows)

# Focus tables
table("⚠️ Виды: расхождение EN (i18n использует имя ≠ официальному in-game)",
      ["mod","i18n EN (наш ключ)","официальный en_US","официальный ru_RU"], en_mismatch)
table("⚠️ Виды: расхождение RU (наш перевод ≠ официальному ru_RU)",
      ["mod","офиц. en_US","наше RU","офиц. ru_RU"], ru_mismatch)

# species present in i18n but with no genome/lang match
i18n_unmatched = [s["en"] for s in i18n["species"] if s["en"] not in seen_keys]

# header
hdr = []
hdr.append("# Сверка локализации генетики — i18n ↔ официальные .lang\n")
hdr.append("> Источник офиц.: ru_RU/en_US.lang из JAR (forestry 4.2.16.64, binnie 2.0.22.7, gendustry 1.6.4.135, magicbees 2.4.4).")
hdr.append("> Файл `bees/i18n/genetics-i18n.json` НЕ изменялся — это только отчёт расхождений.\n")
hdr.append("**Итоги по видам:** EN-расхождений: %d · RU-расхождений (где есть офиц. RU): %d · видов i18n без сопоставления: %d\n"
           % (len(en_mismatch), len(ru_mismatch), len(i18n_unmatched)))
hdr.append("Главное наблюдение: для **MagicBees** в i18n многие `en` — это плейсхолдеры из enum (`TcAir`, `AmEssence`, `TeBronze`, `Earthy`, `Bigbad`, `Chicken`…), а не реальные in-game названия (`Aer`, `Essence`, `Bronzed`, `Earthen`, `Big Bad`, `Poultry`…). См. таблицу «расхождение EN».\n")
if i18n_unmatched:
    hdr.append("Виды i18n без генома/совпадения (вероятно дубль-`en` или иная версия мода): " + ", ".join("`%s`"%x for x in i18n_unmatched) + "\n")

open(OUT, "w", encoding="utf-8").write("\n".join(hdr) + "\n".join(rows_out) + "\n")
print("wrote", OUT)
print("EN mismatches:", len(en_mismatch), "| RU mismatches:", len(ru_mismatch), "| i18n unmatched:", len(i18n_unmatched))
print("i18n unmatched:", i18n_unmatched)
