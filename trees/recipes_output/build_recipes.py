# -*- coding: utf-8 -*-
"""
Извлечение рецептов скрещивания деревьев из декомпилированных классов.

Forestry  : d3/forestry/arboriculture/genetics/TreeDefinition.java
            this.registerMutation(Parent1, Parent2, chance)[.restrictTemperature(...)
            .restrictHumidity(...)] в теле enum-константы (= результат).
            Имена родителей — «голые» имена констант TreeDefinition.
ExtraTrees: d3/binnie/extratrees/genetics/ExtraTreeMutation.java
            static init(): new ExtraTreeMutation(p0, p1, result, chance)[.setHeight(h)]
            p/result = ExtraTreeSpecies.X | getVanilla("ForestryConst") | локальная переменная.

Имена видов:
  Forestry  : for.trees.species.<ключ>        (ключ = 2-й аргумент конструктора TreeDefinition)
  ExtraTrees: extratrees.species.<имя.lower>.name
И en_US, и ru_RU.

Выход: recipes.json, recipes.md, recipes.js, verify.txt
"""
import os, re, json, glob, subprocess, traceback

ROOT = os.path.dirname(os.path.abspath(__file__)); os.chdir(ROOT)

P_TDEF = "d3/forestry/arboriculture/genetics/TreeDefinition.java"
P_BMUT = "d3/binnie/extratrees/genetics/ExtraTreeMutation.java"
CLASSES = [
    ("extract/forestry/forestry/arboriculture/genetics/TreeDefinition.class", P_TDEF),
    ("extract/binnie/binnie/extratrees/genetics/ExtraTreeMutation.class",     P_BMUT),
]

def ensure():
    for cls, jp in CLASSES:
        if not os.path.exists(jp):
            subprocess.run(["java", "-jar", "cfr.jar", cls, "--outputdir", "d3"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def read(p):
    return open(p, encoding="utf-8", errors="replace").read()

# ----------------------------------------------------------- lang
def load_lang():
    f_en, f_ru, b_en, b_ru = {}, {}, {}, {}
    pf = re.compile(r'^for\.trees\.species\.([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$')
    pb = re.compile(r'^extratrees\.species\.([A-Za-z0-9_]+)\.name\s*=\s*(.+?)\s*$')
    for fp in (glob.glob("extract/forestry/**/*.lang", recursive=True) +
               glob.glob("extract/binnie/**/*.lang", recursive=True)):
        ru = fp.endswith("ru_RU.lang"); en = fp.endswith("en_US.lang")
        if not (ru or en):
            continue
        for ln in read(fp).splitlines():
            mf = pf.match(ln)
            if mf:
                (f_ru if ru else f_en).setdefault(mf.group(1), mf.group(2)); continue
            mb = pb.match(ln)
            if mb:
                (b_ru if ru else b_en).setdefault(mb.group(1), mb.group(2))
    return f_en, f_ru, b_en, b_ru

# ----------------------------------------------------------- forestry def map
def forestry_def_map():
    """TreeDefinition.NAME -> ключ для lang (2-й строковый аргумент конструктора)."""
    out = {}
    for ln in read(P_TDEF).splitlines():
        m = re.match(r'^\s*([A-Z][A-Za-z0-9_]*)\(TreeBranchDefinition\.[A-Za-z0-9_]+,\s*"([A-Za-z0-9_]+)"', ln.strip())
        if m:
            out[m.group(1)] = m.group(2)
    return out

# ----------------------------------------------------------- Forestry mutations
def parse_forestry():
    lines = read(P_TDEF).splitlines()
    cur = None; res = []
    for l in lines:
        m = re.match(r'^\s{0,8}([A-Z][A-Za-z0-9_]*)\(TreeBranchDefinition\.', l)
        if m:
            cur = m.group(1); continue
        mm = re.search(r'\.registerMutation\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*(\d+)\s*\)(.*)$', l)
        if mm and cur:
            tail = mm.group(4); conds = []
            t = re.search(r'restrictTemperature\(\s*EnumTemperature\.([A-Z]+)(?:,\s*EnumTemperature\.([A-Z]+))?', tail)
            if t:
                conds.append("температура: " + t.group(1) + (("–" + t.group(2)) if t.group(2) else ""))
            h = re.search(r'restrictHumidity\(\s*EnumHumidity\.([A-Z]+)', tail)
            if h:
                conds.append("влажность: " + h.group(1))
            res.append((cur, mm.group(1), mm.group(2), int(mm.group(3)), conds))
    return res

# ----------------------------------------------------------- ExtraTrees mutations
def parse_binnie():
    s = read(P_BMUT)
    varmap = {}
    for m in re.finditer(r'(\w+)\s*=\s*(?:\([^)]*\)\s*)?ExtraTreeMutation\.getVanilla\("([A-Za-z0-9_]+)"\)', s):
        varmap.setdefault(m.group(1), ("F", m.group(2)))

    def ref(token):
        token = token.strip()
        m = re.search(r'ExtraTreeSpecies\.([A-Za-z0-9_]+)', token)
        if m: return ("B", m.group(1))
        m = re.search(r'getVanilla\("([A-Za-z0-9_]+)"\)', token)
        if m: return ("F", m.group(1))
        m = re.match(r'(?:\([^)]*\)\s*)?([A-Za-z_]\w*)$', token)
        if m and m.group(1) in varmap: return varmap[m.group(1)]
        return ("?", token)

    res = []
    for m in re.finditer(r'new\s+ExtraTreeMutation\(', s):
        i = m.end(); d = 1; j = i
        while j < len(s) and d:
            d += (s[j] == '('); d -= (s[j] == ')'); j += 1
        inside = s[i:j-1]; tail = s[j:j+40]
        parts, depth, buf = [], 0, ""
        for c in inside:
            if c == '(': depth += 1
            if c == ')': depth -= 1
            if c == ',' and depth == 0:
                parts.append(buf); buf = ""
            else:
                buf += c
        parts.append(buf)
        if len(parts) < 4: continue
        p0, p1, rr = ref(parts[0]), ref(parts[1]), ref(parts[2])
        try: chance = int(re.search(r'\d+', parts[3]).group())
        except Exception: chance = None
        hh = re.search(r'setHeight\((\d+)\)', tail)
        conds = [f"мин. высота {hh.group(1)}"] if hh else []
        res.append((p0, p1, rr, chance, conds))
    return res

# ----------------------------------------------------------- main
def main():
    ensure()
    f_en, f_ru, b_en, b_ru = load_lang()
    fdef = forestry_def_map()

    def disp(ref, lang):
        kind, val = ref
        if kind == "F":
            key = fdef.get(val, val[0].lower() + val[1:])
            d = f_ru if lang == "ru" else f_en
            return d.get(key) or f_en.get(key) or val
        if kind == "B":
            key = val.lower()
            d = b_ru if lang == "ru" else b_en
            return d.get(key) or b_en.get(key) or val
        return val

    muts = []
    for cur, x, y, ch, conds in parse_forestry():
        muts.append({"source": "Forestry", "_res": ("F", cur), "_p1": ("F", x), "_p2": ("F", y),
                     "chance": ch, "conditions": conds})
    for p0, p1, rr, ch, conds in parse_binnie():
        muts.append({"source": "ExtraTrees", "_res": rr, "_p1": p0, "_p2": p1,
                     "chance": ch, "conditions": conds})

    for m in muts:
        for role, tag in (("result", "_res"), ("p1", "_p1"), ("p2", "_p2")):
            m[role + "_en"] = disp(m[tag], "en")
            m[role + "_ru"] = disp(m[tag], "ru")
            m[role + "_ref"] = m[tag][0] + ":" + m[tag][1]
        del m["_res"], m["_p1"], m["_p2"]

    f_muts = [m for m in muts if m["source"] == "Forestry"]
    b_muts = [m for m in muts if m["source"] == "ExtraTrees"]

    json.dump({"count": len(muts), "forestry": len(f_muts), "extratrees": len(b_muts),
               "mutations": muts}, open("recipes.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    def cell(m, role):
        e, r = m[role + "_en"], m[role + "_ru"]
        return f"{r} ({e})" if (r and e and r != e) else (r or e or "?")
    md = ["# Рецепты скрещивания деревьев", "",
          f"Извлечено из jar: **Forestry** ({len(f_muts)}) + **Binnie ExtraTrees** ({len(b_muts)}). "
          f"Всего: **{len(muts)}**.", "",
          "«Шанс» — базовый шанс мутации (%). Имена: RU (EN) из lang-файлов мода. Порядок родителей роли не играет.", ""]
    for src, grp in (("Forestry", f_muts), ("Binnie ExtraTrees", b_muts)):
        md += [f"## {src}", "", "| Результат | Родитель 1 | Родитель 2 | Шанс | Условия |", "|---|---|---|---|---|"]
        for m in sorted(grp, key=lambda x: x["result_ru"] or x["result_en"] or ""):
            md.append("| {} | {} | {} | {} | {} |".format(
                cell(m, "result"), cell(m, "p1"), cell(m, "p2"),
                m["chance"] if m["chance"] is not None else "?",
                ", ".join(m["conditions"]) or "—"))
        md.append("")
    open("recipes.md", "w", encoding="utf-8").write("\n".join(md))

    js = ["// Авто-извлечено из jar Forestry + Binnie ExtraTrees (ragu.html НЕ редактируется).",
          "// id = результат; parents=[[p1,p2]]; chance — базовый шанс (%). Имена русские из lang.",
          "const RECIPES = ["]
    for m in muts:
        rr = m["result_ru"] or m["result_en"]; a = m["p1_ru"] or m["p1_en"]; b = m["p2_ru"] or m["p2_en"]
        cond = (", cond:" + json.dumps(", ".join(m["conditions"]), ensure_ascii=False)) if m["conditions"] else ""
        js.append("  {{ id:{}, parents:[[{}, {}]], chance:{}, source:{}{} }},".format(
            json.dumps(rr, ensure_ascii=False), json.dumps(a, ensure_ascii=False),
            json.dumps(b, ensure_ascii=False),
            m["chance"] if m["chance"] is not None else "null",
            json.dumps(m["source"]), cond))
    js.append("];")
    open("recipes.js", "w", encoding="utf-8").write("\n".join(js))

    unres = [m for m in muts if "?" in (m["result_ref"] + m["p1_ref"] + m["p2_ref"])
             or not (m["result_en"] and m["p1_en"] and m["p2_en"])]
    v = [f"forestry_defs={len(fdef)} f_en={len(f_en)} f_ru={len(f_ru)} b_en={len(b_en)} b_ru={len(b_ru)}",
         f"MUT forestry={len(f_muts)} extratrees={len(b_muts)} total={len(muts)} unresolved={len(unres)}"]
    for m in f_muts[:12]:
        v.append("  [F] %s = %s x %s @%s%s" % (
            m["result_ru"] or m["result_en"], m["p1_ru"] or m["p1_en"], m["p2_ru"] or m["p2_en"],
            m["chance"], (" {" + ",".join(m["conditions"]) + "}") if m["conditions"] else ""))
    if unres:
        v.append("UNRES " + json.dumps([m["result_ref"] + "<=" + m["p1_ref"] + "+" + m["p2_ref"] for m in unres][:25], ensure_ascii=False))
    open("verify.txt", "w", encoding="utf-8").write("\n".join(v))

if __name__ == "__main__":
    try:
        main()
    except Exception:
        open("verify.txt", "w", encoding="utf-8").write("CRASH\n" + traceback.format_exc())
