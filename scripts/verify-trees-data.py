#!/usr/bin/env python3
"""
Сверка src/trackers/trees/data/trees.data.ts с каноном trees/recipes_output/recipes.js
(данные, извлечённые из jar мода). Запуск из корня репозитория:

    python3 scripts/verify-trees-data.py   (или: npm run verify:trees)

Проверяет: совпадение деревьев и рецептов (родительские пары без учёта порядка),
полноту покрытия канонических рецептов и наличие пометок об условиях (cond).
recipes.js использует смешанные RU-имена (genitive/nominative); ALIAS приводит их
к nominative-форме, принятой в наших данных.
"""
import re, json

# --- алиасы canonical(genitive/иное) -> nominative (как в моих данных) ---
ALIAS = {
 "липы пушистой":"Липа пушистая","обычного орехового дерева":"Обычное ореховое дерево",
 "каштана посевного":"Каштан посевной","сакуры":"Сакура","лимонного дерева":"Лимонное дерево",
 "сливового дерева":"Сливовое дерево","сахарного клёна":"Сахарный клён",
 "мировой лиственницы":"Мировая лиственница","жёлтой сосны":"Жёлтая сосна",
 "береговой секвойи":"Береговая секвойя","тикового дерева":"Тиковое дерево",
 "муравьиного дерева":"Муравьиное дерево","хлопкового дерева":"Хлопковое дерево",
 "мирта":"Мирт","зебрано":"Зебрано","жёлтого меранти":"Жёлтый меранти",
 "пустынной акации":"Пустынная акация","падука":"Падук","бальзы":"Бальза",
 "кокоболо":"Кокоболо","дерева Венге":"Венге","Адансонии Грандидье":"Адансония Грандидье",
 "синего гибискуса":"Синий гибискус","белой ивы":"Белая ива","Сипири":"Сипири",
 "дынного дерева":"Дынное дерево","финиковой пальмы":"Финиковая пальма","белого тополя":"Тополь",
 "белой берёзы":"Белая берёза","яблочного дуба":"Яблочный дуб","красной ели":"Красная ель",
 "тёмного дуба":"Тёмный дуб","дерева джунглей":"Дерево джунглей","акации":"Акация",
 "Вяз обыкновенный":"Вяз","Ясень обыкновенный":"Ясень","Боярышник однопестичный":"Боярышник",
 "Гинкго двулопастный":"Гинкго","Ликвидамбар смолоносный":"Ликвидамбар",
 "Робиния ложноакациевая":"Робиния","Умнини (розовая кость)":"Умнини",
 "Лумбанг (свечное дерево)":"Лумбанг",
}
def norm(n): return ALIAS.get(n, n)

# --- канонические рецепты из recipes.js ---
canon = {}  # tree -> set of frozenset(pair)
canon_cond = {}  # tree -> set of conds
js = open('trees/recipes_output/recipes.js', encoding='utf-8').read()
for m in re.finditer(r'\{\s*id:"([^"]+)",\s*parents:\[\["([^"]+)",\s*"([^"]+)"\]\],\s*chance:(\d+),\s*source:"[^"]+"(?:,\s*cond:"([^"]+)")?\s*\}', js):
    tid, p1, p2, ch, cond = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    t = norm(tid)
    canon.setdefault(t, set()).add(frozenset((norm(p1), norm(p2))))
    if cond: canon_cond.setdefault(t, set()).add(cond)

# --- мои данные из trees.data.ts ---
mine = {}      # tree -> set of frozenset(pair)
mine_tier = {}
mine_cond = {}
ts = open('src/trackers/trees/data/trees.data.ts', encoding='utf-8').read()
ts = re.sub(r'\s+', ' ', ts)  # схлопнуть многострочные объекты (после prettier)
# строки вида { id: 'X', tier: N, parents: [p('A', 'B')], cond: '...' }
for m in re.finditer(r"\{\s*id:\s*'([^']+)',\s*tier:\s*(\d+)(?:,\s*parents:\s*\[(.*?)\])?(?:,\s*cond:\s*'([^']+)')?,?\s*\}", ts):
    tid, tier, pblock, cond = m.group(1), int(m.group(2)), m.group(3), m.group(4)
    mine_tier[tid] = tier
    if pblock:
        for pm in re.finditer(r"p\('([^']+)',\s*'([^']+)'\)", pblock):
            mine.setdefault(tid, set()).add(frozenset((pm.group(1), pm.group(2))))
    if cond: mine_cond[tid] = cond

print(f"мои деревья: {len(mine_tier)} | с рецептом: {len(mine)} | канонических деревьев: {len(canon)}")
print(f"всего канон. рецептов: {sum(len(v) for v in canon.values())} | моих рецептов: {sum(len(v) for v in mine.values())}")
print()

# 1) деревья в каноне, которых нет у меня (по nominative)
missing = sorted(set(canon) - set(mine_tier))
if missing: print("❌ В каноне есть, у меня НЕТ дерева:", missing)

# 2) деревья у меня с рецептом, которых нет в каноне
extra = sorted(t for t in mine if t not in canon)
if extra: print("❌ У меня есть рецепт, в каноне НЕТ дерева:", extra)

# 3) мой рецепт НЕ входит в набор канонических (реальная ошибка родителей)
print("=== РАСХОЖДЕНИЯ РОДИТЕЛЕЙ (мой рецепт вне канона) ===")
bad = 0
for t, pairs in sorted(mine.items()):
    if t not in canon: continue
    for pr in pairs:
        if pr not in canon[t]:
            bad += 1
            print(f"  ❌ {t}: мой {sorted(pr)} ∉ канон {[sorted(x) for x in canon[t]]}")
if not bad: print("  ✅ все мои рецепты входят в канонические наборы")

# 4) канонические рецепты, которых у меня НЕТ (должно быть пусто)
print("\n=== КАНОНИЧЕСКИЕ РЕЦЕПТЫ, ОТСУТСТВУЮЩИЕ У МЕНЯ ===")
anydrop = False
for t in sorted(canon):
    if t not in mine: continue
    drop = [sorted(x) for x in canon[t] if x not in mine[t]]
    if drop:
        anydrop = True
        print(f"  ❌ {t}: не хватает {drop}")
if not anydrop: print("  ✅ все канонические рецепты присутствуют (полное покрытие)")

# 5) условия (cond) сверка — есть ли cond у меня для каждого дерева с канон-условием
print("\n=== УСЛОВИЯ (есть ли у меня пометка) ===")
for t in sorted(canon_cond):
    mark = "✅" if t in mine_cond else "❌ НЕТ cond у меня"
    print(f"  {mark} {t}: канон={sorted(canon_cond[t])} | моё='{mine_cond.get(t,'')}'")
