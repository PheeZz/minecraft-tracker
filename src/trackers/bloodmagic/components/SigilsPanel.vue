<script setup lang="ts">
// Панель сигилов BloodMagic — сетка 20 сигилов с иконками, стоимостью и бейджем вида.
import { computed } from 'vue'
import { SIGILS } from '../data/sigils.data'
import type { Sigil } from '../domain/types'
import ItemIcon from './ItemIcon.vue'
import IconBase from '@/shared/ui/IconBase.vue'

// Маппинг field → путь к текстуре (относительно public/).
// Приоритет: deactivated (базовый вид); если нет — activated; если нет — только имя.
// Сигилы без текстуры (itemFluidSigil) получат текстовый fallback из ItemIcon.
const SIGIL_ICON: Record<string, string> = {
  airSigil: 'bloodmagic/items/alchemicalwizardry/AirSigil.png',
  itemBloodLightSigil: 'bloodmagic/items/alchemicalwizardry/BloodLightSigil.png',
  divinationSigil: 'bloodmagic/items/alchemicalwizardry/DivinationSigil.png',
  itemHarvestSigil: 'bloodmagic/items/alchemicalwizardry/HarvestGoddessSigil_deactivated.png',
  lavaSigil: 'bloodmagic/items/alchemicalwizardry/LavaSigil.png',
  sigilOfElementalAffinity: 'bloodmagic/items/alchemicalwizardry/ElementalSigil_deactivated.png',
  itemSigilOfEnderSeverance: 'bloodmagic/items/alchemicalwizardry/SigilOfSeverance_deactivated.png',
  growthSigil: 'bloodmagic/items/alchemicalwizardry/GrowthSigil_deactivated.png',
  sigilOfHaste: 'bloodmagic/items/alchemicalwizardry/HasteSigil_deactivated.png',
  sigilOfMagnetism: 'bloodmagic/items/alchemicalwizardry/SigilOfMagnetism_deactivated.png',
  itemSigilOfSupression: 'bloodmagic/items/alchemicalwizardry/SigilOfSupression_deactivated.png',
  // itemAssassinSigil — текстура Assassin Sigil отсутствует; fallback через ItemIcon (текстовый)
  sigilOfTheBridge: 'bloodmagic/items/alchemicalwizardry/BridgeSigil_deactivated.png',
  sigilOfTheFastMiner: 'bloodmagic/items/alchemicalwizardry/MiningSigil_deactivated.png',
  sigilOfWind: 'bloodmagic/items/alchemicalwizardry/WindSigil_deactivated.png',
  itemCompressionSigil: 'bloodmagic/items/alchemicalwizardry/CompressionSigil_deactivated.png',
  itemSeerSigil: 'bloodmagic/items/alchemicalwizardry/SeerSigil.png',
  voidSigil: 'bloodmagic/items/alchemicalwizardry/VoidSigil.png',
  waterSigil: 'bloodmagic/items/alchemicalwizardry/WaterSigil.png',
  // itemFluidSigil — текстура отсутствует, fallback через ItemIcon
}

const KIND_LABELS: Record<string, string> = {
  activated: 'Активный',
  passive: 'Пассивный',
  placement: 'Размещение',
}

// Сортировка: сначала по стоимости (по возрастанию), пассивные (null) — в конец
const sorted = computed(() =>
  [...SIGILS].sort((a, b) => {
    if (a.cost_LP_per_use === null && b.cost_LP_per_use === null) return 0
    if (a.cost_LP_per_use === null) return 1
    if (b.cost_LP_per_use === null) return -1
    return a.cost_LP_per_use - b.cost_LP_per_use
  }),
)

const sigilIcon = (s: Sigil): string | undefined => SIGIL_ICON[s.field]

const costLabel = (s: Sigil): string =>
  s.cost_LP_per_use !== null ? `${s.cost_LP_per_use.toLocaleString()} LP / исп.` : 'пассивный'
</script>

<template>
  <section class="sp">
    <header class="sp__header">
      <h2 class="sp__title">Сигилы</h2>
      <span class="sp__count">{{ SIGILS.length }} сигилов</span>
    </header>

    <div class="sp__grid" role="list">
      <div v-for="s in sorted" :key="s.field" class="sc" role="listitem" :title="s.name_en">
        <div class="sc__icon-wrap bm-glint">
          <ItemIcon
            :item="{ icon: sigilIcon(s), name_ru: s.name_ru, name_en: s.name_en }"
            :size="36"
          />
        </div>
        <div class="sc__body">
          <span class="sc__name">{{ s.name_ru }}</span>
          <span class="sc__cost" :class="{ 'sc__cost--passive': s.cost_LP_per_use === null }">
            <IconBase v-if="s.cost_LP_per_use !== null" name="lp" class="sc__lp-ic" />
            {{ costLabel(s) }}
          </span>
        </div>
        <span class="sc__badge" :data-kind="s.kind">
          {{ KIND_LABELS[s.kind] ?? s.kind }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sp {
  padding: 14px 16px;
}

.sp__header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}

.sp__title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}

.sp__count {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
}

.sp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.sc {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s ease;
}

/* Hover-glow на карточке сигила — едва заметная кровавая аура */
.sc:hover {
  box-shadow: var(--shadow-card-glow), var(--glow-card-hover);
  border-color: rgba(138, 16, 32, 0.45);
}

.sc__icon-wrap {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(138, 16, 32, 0.18);
  border: 1px solid var(--cardln);
  border-radius: 8px;
}

.sc__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.sc__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sc__cost {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--honey-dk);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* LP-иконка рядом со стоимостью сигила */
.sc__lp-ic {
  color: var(--honey-dk);
  opacity: 0.75;
  display: inline-flex;
  align-items: center;
  flex: none;
}

.sc__lp-ic :deep(svg) {
  width: 10px;
  height: 10px;
}

.sc__cost--passive {
  color: var(--muted);
  font-style: italic;
}

.sc__badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  border-radius: 5px;
  padding: 2px 6px;
  white-space: nowrap;
  flex: none;
  align-self: flex-start;
  background: rgba(138, 16, 32, 0.22);
  color: var(--alt);
  border: 1px solid var(--cardln);
}

.sc__badge[data-kind='activated'] {
  background: rgba(224, 52, 74, 0.16);
  color: var(--honey-dk);
  border-color: rgba(224, 52, 74, 0.3);
}

.sc__badge[data-kind='passive'] {
  background: rgba(100, 100, 140, 0.18);
  color: #b0aacc;
  border-color: rgba(100, 100, 140, 0.3);
}

.sc__badge[data-kind='placement'] {
  background: rgba(82, 224, 160, 0.12);
  color: var(--src-f);
  border-color: rgba(82, 224, 160, 0.24);
}
</style>
