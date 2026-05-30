# -*- coding: utf-8 -*-
"""
Извлечение рецептов скрещивания пчёл и их продукции.

Forestry  : forestry/apiculture/genetics/BeeDefinition  (enum)
ExtraBees : binnie/extrabees/genetics/ExtraBeeDefinition (enum)

В теле каждой enum-константы:
  registerMutations(): this.registerMutation(Parent1, Parent2, chance)  -> результат = эта пчела
  setSpeciesProperties(s): s.addProduct(<item>, Float.valueOf(c)).addSpecialty(<item>, c)...
Родители — «голые» имена (свой enum) либо BeeDefinition.X / ExtraBeeDefinition.X,
а также спец-токены hiveBee*/parent2.
Продукция — соты (EnumHoneyComb / ItemHoneyComb.VanillaComb) и обычные предметы.

Имена — из lang (en/ru) + ручная таблица для не-сотовых предметов.

Выход: bees.json, bees.md, bees.js, verify_bees.txt
"""
import os, re, json, glob, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__)); os.chdir(ROOT)

P_FBEE = "d3/forestry/apiculture/genetics/BeeDefinition.java"
P_EBEE = "d3/binnie/extrabees/genetics/ExtraBeeDefinition.java"
CLASSES = [
    ("extract/forestry/forestry/apiculture/genetics/BeeDefinition.class", P_FBEE),
    ("extract/binnie/binnie/extrabees/genetics/ExtraBeeDefinition.class", P_EBEE),
]

def ensure():
    for cls, jp in CLASSES:
        if not os.path.exists(jp):
            subprocess.run(["java","-jar","cfr.jar",cls,"--outputdir","d3"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def read(p): return open(p, encoding="utf-8", errors="replace").read()

# ----------------------------------------------------------- lang (generic)
def load_lang():
    en, ru = {}, {}
    for fp in (glob.glob("extract/forestry/**/*.lang", recursive=True) +
               glob.glob("extract/binnie/**/*.lang", recursive=True)):
        d = ru if fp.endswith("ru_RU.lang") else (en if fp.endswith("en_US.lang") else None)
        if d is None: continue
        for ln in read(fp).splitlines():
            if "=" in ln and not ln.lstrip().startswith("#"):
                k, _, v = ln.partition("=")
                d.setdefault(k.strip(), v.strip())
    return en, ru

# ----------------------------------------------------------- parse enum bodies
CONST_RE = re.compile(r'^\s{0,8}([A-Z][A-Z0-9_]*)\([A-Za-z]\w*BranchDefinition\.')

def parse_def(path, origin):
    s = read(path); lines = s.splitlines()
    cur = None; muts, prods = [], []
    for raw in lines:
        l = raw.strip()
        m = CONST_RE.match(raw)
        if m:
            cur = m.group(1); continue
        if cur is None: continue
        for mm in re.finditer(r'\.registerMutation\(\s*([A-Za-z][\w.]*)\s*,\s*([A-Za-z][\w.]*)\s*,\s*(\d+)', l):
            muts.append((cur, mm.group(1), mm.group(2), int(mm.group(3))))
        for kind in ("addProduct", "addSpecialty"):
            for mm in re.finditer(kind + r'\(([^;]*?),\s*Float\.valueOf\(([0-9.]+)f?\)\)', l):
                prods.append((cur, origin, re.sub(r'\s+', ' ', mm.group(1).strip()),
                              float(mm.group(2)),
                              "specialty" if kind == "addSpecialty" else "product"))
    return muts, prods

# ----------------------------------------------------------- main
def main():
    ensure()
    en, ru = load_lang()

    def lang(keys, lng):
        d = ru if lng == "ru" else en
        for k in keys:
            if k in d: return d[k]
        if lng == "ru":
            for k in keys:
                if k in en: return en[k]
        return None

    SPECIAL = {
        "hivebee":  ("wild hive bee", "дикая пчела (из улья)"),
        "hivebee0": ("wild hive bee", "дикая пчела (из улья)"),
        "hivebee1": ("wild hive bee", "дикая пчела (из улья)"),
        "parent2":  ("config species (sinister)", "особый вид (задаётся конфигом)"),
    }

    def bee_name(kind, token, lng):
        t = token.split(".")[-1]; low = t.lower()
        if low in SPECIAL:
            return SPECIAL[low][1 if lng == "ru" else 0]
        keys = (["for.bees.species."+low] if kind == "F"
                else ["extrabees.species."+low+".name", "extrabees.species."+low])
        return lang(keys, lng) or t.title()

    # не-сотовые предметы (порядок важен: специфичное раньше общего)
    ITEM_MAP = [
        (r'field_151144_bL,\s*1,\s*0', "Skeleton Skull", "Череп скелета"),
        (r'field_151144_bL,\s*1,\s*1', "Wither Skeleton Skull", "Череп визер-скелета"),
        (r'field_151144_bL,\s*1,\s*2', "Zombie Head", "Голова зомби"),
        (r'field_151144_bL,\s*1,\s*3', "Steve Head", "Голова игрока"),
        (r'field_151144_bL,\s*1,\s*4', "Creeper Head", "Голова крипера"),
        (r'field_151102_aT', "Sugar", "Сахар"),
        (r'field_151106_aX', "Cookie", "Печенье"),
        (r'field_151110_aK', "Egg", "Яйцо"),
        (r'field_151100_aR', "Ink Sac / Dye", "Краситель"),
        (r'pollenCluster', "Pollen Cluster", "Комок пыльцы"),
        (r'royalJelly', "Royal Jelly", "Маточное молочко"),
        (r'\.ash\.', "Ash", "Зола"),
        (r'getIceShard', "Ice Shard", "Осколок льда"),
        (r'\.peat\.', "Peat", "Торф"),
        (r'GLOWSTONE_DUST', "Glowstone Dust", "Светящаяся пыль"),
        (r'stack\(\s*"pollen"\s*\)', "Pollen", "Пыльца"),
    ]
    miss = set()

    def product_name(raw, porigin, lng):
        # сота?
        m = re.search(r'ItemHoneyComb\.VanillaComb\.([A-Z0-9_]+)', raw)
        if m:
            ck, tok = "F", m.group(1).lower()
        else:
            m = re.search(r'EnumHoneyComb\.([A-Z0-9_]+)', raw)
            ck, tok = ((porigin, m.group(1).lower()) if m else (None, None))
        if ck:
            keys = (["item.for.beeCombs."+tok+".name", "for.item.beeCombs."+tok] if ck == "F"
                    else ["extrabees.item.comb."+tok, "extrabees.item.comb."+tok+".name"])
            v = lang(keys, lng)
            if v: return v
            COMB_OVERRIDE = {"quartz": ("Quartz Comb", "Кварцевые соты")}
            if tok in COMB_OVERRIDE:
                return COMB_OVERRIDE[tok][1 if lng == "ru" else 0]
            miss.add("comb:"+tok)
            return tok.title() + (" соты" if lng == "ru" else " Comb")
        # обычный предмет
        for rx, en_, ru_ in ITEM_MAP:
            if re.search(rx, raw):
                return ru_ if lng == "ru" else en_
        miss.add("item:"+raw[:48])
        return (raw[:36] + "…") if len(raw) > 36 else raw

    fmut, fprod = parse_def(P_FBEE, "F")
    emut, eprod = parse_def(P_EBEE, "E")

    def parent_kind(tok, origin):
        if tok.startswith("BeeDefinition."): return "F"
        if tok.startswith("ExtraBeeDefinition."): return "E"
        return origin

    bees = {}
    def rec(kind, const):
        key = kind + ":" + const
        if key not in bees:
            bees[key] = {"id_en": bee_name(kind, const, "en"),
                         "id_ru": bee_name(kind, const, "ru"),
                         "source": "Forestry" if kind == "F" else "ExtraBees",
                         "parents": [], "products": []}
        return bees[key]

    for origin, muts in (("F", fmut), ("E", emut)):
        for cur, p1, p2, ch in muts:
            r = rec(origin, cur)
            k1, k2 = parent_kind(p1, origin), parent_kind(p2, origin)
            r["parents"].append({
                "p1_en": bee_name(k1, p1, "en"), "p1_ru": bee_name(k1, p1, "ru"),
                "p2_en": bee_name(k2, p2, "en"), "p2_ru": bee_name(k2, p2, "ru"),
                "chance": ch})
    for origin, prods in (("F", fprod), ("E", eprod)):
        for cur, porigin, raw, c, typ in prods:
            r = rec(origin, cur)
            r["products"].append({"comb_en": product_name(raw, porigin, "en"),
                                  "comb_ru": product_name(raw, porigin, "ru"),
                                  "chance": c, "type": typ})

    # дедуп продукции и родителей
    for b in bees.values():
        seen = set(); uniq = []
        for p in b["products"]:
            k = (p["comb_en"], p["chance"], p["type"])
            if k in seen: continue
            seen.add(k); uniq.append(p)
        b["products"] = uniq
        seen = set(); uniq = []
        for p in b["parents"]:
            k = (p["p1_en"], p["p2_en"], p["chance"])
            if k in seen: continue
            seen.add(k); uniq.append(p)
        b["parents"] = uniq

    allbees = list(bees.values())
    fb = [b for b in allbees if b["source"] == "Forestry"]
    eb = [b for b in allbees if b["source"] == "ExtraBees"]

    json.dump({"bees": len(allbees), "forestry": len(fb), "extrabees": len(eb),
               "data": allbees}, open("bees.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    def nm(b): return b["id_ru"] if (b["id_ru"] and b["id_ru"] != b["id_en"]) else b["id_en"]
    def pair(p):
        a = p["p1_ru"] or p["p1_en"]; b = p["p2_ru"] or p["p2_en"]; return f"{a} × {b}"
    def prod(p):
        c = p["comb_ru"] or p["comb_en"]
        return f"{c} ({int(round(p['chance']*100))}%{'*' if p['type']=='specialty' else ''})"
    md = ["# Пчёлы: скрещивание и продукция", "",
          f"**Forestry**: {len(fb)} · **ExtraBees**: {len(eb)} · всего: {len(allbees)}.", "",
          "Шанс мутации — %. Продукция: предмет (шанс), `*` = спец-продукт (specialty). "
          "«дикая пчела (из улья)» — любой дикий вид из улья.", ""]
    for src, grp in (("Forestry", fb), ("ExtraBees", eb)):
        md += [f"## {src}", "",
               "| Пчела | Скрещивание (родители @шанс) | Продукция |", "|---|---|---|"]
        for b in sorted(grp, key=lambda x: x["id_ru"] or x["id_en"] or ""):
            recs = "; ".join(f"{pair(p)} @{p['chance']}%" for p in b["parents"]) or "— (дикая/из улья)"
            pr = ", ".join(prod(p) for p in b["products"]) or "—"
            md.append(f"| {nm(b)} ({b['id_en']}) | {recs} | {pr} |")
        md.append("")
    open("bees.md", "w", encoding="utf-8").write("\n".join(md))

    js = ["// Авто-извлечено из jar Forestry + Binnie ExtraBees (ragu.html не трогается).",
          "const BEES = ["]
    for b in allbees:
        parents = [[p["p1_ru"] or p["p1_en"], p["p2_ru"] or p["p2_en"], p["chance"]] for p in b["parents"]]
        products = [[p["comb_ru"] or p["comb_en"], p["chance"], p["type"]] for p in b["products"]]
        js.append("  {{ id:{}, source:{}, parents:{}, products:{} }},".format(
            json.dumps(b["id_ru"] or b["id_en"], ensure_ascii=False),
            json.dumps(b["source"]),
            json.dumps(parents, ensure_ascii=False),
            json.dumps(products, ensure_ascii=False)))
    js.append("];")
    open("bees.js", "w", encoding="utf-8").write("\n".join(js))

    v = [f"BEES forestry={len(fb)} extrabees={len(eb)} total={len(allbees)}",
         f"mutations: F={len(fmut)} E={len(emut)}  products(raw): F={len(fprod)} E={len(eprod)}",
         f"TRULY_UNRESOLVED ({len(miss)}): " + json.dumps(sorted(miss), ensure_ascii=False)]
    for b in (fb[:4] + eb[:5]):
        recs = "; ".join(f"{pair(p)}@{p['chance']}" for p in b["parents"]) or "—"
        pr = ", ".join(prod(p) for p in b["products"]) or "—"
        v.append(f"  [{b['source'][0]}] {nm(b)}: {recs} || {pr}")
    open("verify_bees.txt", "w", encoding="utf-8").write("\n".join(v))

if __name__ == "__main__":
    import traceback
    try:
        main()
    except Exception:
        open("verify_bees.txt", "w", encoding="utf-8").write("CRASH\n" + traceback.format_exc())
