<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SMELTING,
  LOOT,
  TOOL_MATERIALS,
  ARMOR_MATERIALS,
  WAND_CAPS,
  WAND_RODS,
} from '../data/reference.data'
import ItemIcon from './ItemIcon.vue'

type Sub = 'materials' | 'wands' | 'smelting' | 'loot'
const SUBS: { id: Sub; label: string }[] = [
  { id: 'materials', label: 'Материалы' },
  { id: 'wands', label: 'Палочки' },
  { id: 'smelting', label: 'Плавка' },
  { id: 'loot', label: 'Лут' },
]
const sub = ref<Sub>('materials')

// калькулятор палочки: навершие даёт скидку (множитель к стоимости вис),
// стержень задаёт ёмкость вис
const capTag = ref<string>(WAND_CAPS[0]?.tag ?? 'iron')
const rodTag = ref<string>(WAND_RODS[0]?.tag ?? 'wood')
const selCap = computed(() => WAND_CAPS.find((c) => c.tag === capTag.value))
const selRod = computed(() => WAND_RODS.find((r) => r.tag === rodTag.value))
const discountPct = computed(() =>
  selCap.value ? Math.round((1 - selCap.value.visDiscount) * 100) : 0,
)
</script>

<template>
  <section class="ref">
    <header class="ref__top">
      <div class="ref__subs" role="group" aria-label="Разделы справочника">
        <button
          v-for="s in SUBS"
          :key="s.id"
          type="button"
          class="ref__sub"
          :class="{ on: sub === s.id }"
          :aria-pressed="sub === s.id"
          @click="sub = s.id"
        >
          {{ s.label }}
        </button>
      </div>
    </header>

    <!-- Материалы -->
    <div v-if="sub === 'materials'" class="ref__body">
      <h3 class="ref__h">Инструменты</h3>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Материал</th>
              <th>Мод</th>
              <th>Уровень добычи</th>
              <th>Прочность</th>
              <th>Скорость</th>
              <th>Урон</th>
              <th>Зачаровываемость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in TOOL_MATERIALS" :key="i">
              <td class="nm">{{ t.name }}</td>
              <td class="dim">{{ t.mod }}</td>
              <td class="num">{{ t.harvestLevel }}</td>
              <td class="num">{{ t.durability }}</td>
              <td class="num">{{ t.efficiency }}</td>
              <td class="num">{{ t.damage }}</td>
              <td class="num">{{ t.enchantability }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="ref__h">Броня</h3>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Материал</th>
              <th>Мод</th>
              <th>Фактор прочности</th>
              <th>Шлем</th>
              <th>Нагрудник</th>
              <th>Поножи</th>
              <th>Ботинки</th>
              <th>Зачаровываемость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in ARMOR_MATERIALS" :key="i">
              <td class="nm">{{ a.name }}</td>
              <td class="dim">{{ a.mod }}</td>
              <td class="num">{{ a.durabilityFactor }}</td>
              <td class="num">{{ a.damageReduction[0] }}</td>
              <td class="num">{{ a.damageReduction[1] }}</td>
              <td class="num">{{ a.damageReduction[2] }}</td>
              <td class="num">{{ a.damageReduction[3] }}</td>
              <td class="num">{{ a.enchantability }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Палочки -->
    <div v-else-if="sub === 'wands'" class="ref__body">
      <div class="calc">
        <div class="ref__h2">Калькулятор палочки</div>
        <div class="calc__row">
          <label class="calc__field">
            <span>Навершие</span>
            <select v-model="capTag" class="sel">
              <option v-for="c in WAND_CAPS" :key="c.tag" :value="c.tag">{{ c.tag }}</option>
            </select>
          </label>
          <label class="calc__field">
            <span>Стержень</span>
            <select v-model="rodTag" class="sel">
              <option v-for="r in WAND_RODS" :key="r.tag" :value="r.tag">{{ r.tag }}</option>
            </select>
          </label>
        </div>
        <div v-if="selCap && selRod" class="calc__out">
          <div class="calc__metric">
            <span class="calc__big">{{ selRod.visCapacity }}</span>
            <span class="calc__lab">ёмкость вис</span>
          </div>
          <div class="calc__metric">
            <span class="calc__big" :class="{ pos: discountPct > 0, neg: discountPct < 0 }">
              {{ discountPct > 0 ? '−' : discountPct < 0 ? '+' : '' }}{{ Math.abs(discountPct) }}%
            </span>
            <span class="calc__lab">к стоимости вис</span>
          </div>
        </div>
        <p class="calc__note">
          Навершие — множитель стоимости (×{{ selCap?.visDiscount }}): &lt;1 удешевляет, &gt;1
          удорожает. Стержень задаёт ёмкость вис.
        </p>
      </div>

      <h3 class="ref__h">Навершия</h3>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Навершие</th>
              <th>Множитель стоимости</th>
              <th>Стоимость крафта</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in WAND_CAPS" :key="c.tag">
              <td class="nm">{{ c.tag }}</td>
              <td class="num">×{{ c.visDiscount }}</td>
              <td class="num">{{ c.craftCost }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="ref__h">Стержни</h3>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Стержень</th>
              <th>Ёмкость вис</th>
              <th>Стоимость крафта</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in WAND_RODS" :key="r.tag">
              <td class="nm">{{ r.tag }}</td>
              <td class="num">{{ r.visCapacity }}</td>
              <td class="num">{{ r.craftCost }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Плавка -->
    <div v-else-if="sub === 'smelting'" class="ref__body">
      <p class="ref__intro">Бонусные дропы Адской печи при переплавке.</p>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Вход</th>
              <th>Выход</th>
              <th>Мод</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in SMELTING" :key="i">
              <td class="nm">{{ s.input }}</td>
              <td :title="s.output.en">
                <span class="nmcell"><ItemIcon :item="s.output" />{{ s.output.ru }}</span>
              </td>
              <td class="dim">{{ s.mod }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Лут -->
    <div v-else class="ref__body">
      <p class="ref__intro">Содержимое мешков с эльдрическим лутом.</p>
      <div class="twrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Вес</th>
              <th>Редкость</th>
              <th>Мод</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(l, i) in LOOT" :key="i">
              <td class="nm" :title="l.item.en">
                <span class="nmcell"><ItemIcon :item="l.item" />{{ l.item.ru }}</span>
              </td>
              <td class="num">{{ l.weight }}</td>
              <td>
                <span v-for="r in l.rarities" :key="r" class="rarity" :data-r="r">{{ r }}</span>
              </td>
              <td class="dim">{{ l.mod }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ref {
  padding: 16px 18px;
}
.ref__top {
  margin-bottom: 16px;
}
.ref__subs {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 3px;
  flex-wrap: wrap;
}
.ref__sub {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.ref__sub:hover:not(.on) {
  color: var(--ink);
  background: rgba(160, 107, 255, 0.08);
}
.ref__sub.on {
  background: linear-gradient(180deg, #a06bff, var(--solid));
  color: var(--solid-ink);
}
.ref__sub:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.ref__h {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  margin: 18px 0 8px;
}
.ref__h:first-child {
  margin-top: 0;
}
.ref__h2 {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 10px;
}
.ref__intro {
  color: var(--muted);
  font-size: 12.5px;
  margin: 0 0 12px;
}
.twrap {
  overflow-x: auto;
  border: 1px solid var(--cardln);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--card2), var(--card));
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.tbl th {
  text-align: left;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--honey-dk);
  padding: 9px 12px;
  border-bottom: 1px solid var(--cardln);
  white-space: nowrap;
}
.tbl td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--ink2);
}
.tbl tbody tr:last-child td {
  border-bottom: 0;
}
.tbl tbody tr:hover {
  background: rgba(160, 107, 255, 0.06);
}
.nm {
  font-weight: 700;
  color: var(--ink);
}
.nmcell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.num {
  font-family: var(--font-mono);
  text-align: right;
}
.dim {
  color: var(--muted);
  font-size: 11.5px;
}
.rarity {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  border-radius: 5px;
  padding: 1px 6px;
  margin-right: 4px;
  color: var(--solid-ink);
  background: var(--solid);
}
.rarity[data-r='uncommon'] {
  background: var(--src-f);
  color: #062018;
}
.rarity[data-r='rare'] {
  background: var(--honey-dk);
  color: #1a1206;
}
.calc {
  border: 1px solid var(--cardln);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  padding: 14px 16px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-card);
}
.calc__row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.calc__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11.5px;
  color: var(--muted);
}
.sel {
  font: inherit;
  font-size: 13px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 7px 10px;
  color: var(--ink);
}
.calc__out {
  display: flex;
  gap: 28px;
  margin-bottom: 10px;
}
.calc__metric {
  display: flex;
  flex-direction: column;
}
.calc__big {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 26px;
  color: var(--ink);
}
.calc__big.pos {
  color: var(--src-f);
}
.calc__big.neg {
  color: var(--rust);
}
.calc__lab {
  font-size: 11px;
  color: var(--muted);
}
.calc__note {
  font-size: 11.5px;
  color: var(--muted);
  margin: 0;
  line-height: 1.4;
}
</style>
