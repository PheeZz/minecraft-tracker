import type { StylesheetStyle } from 'cytoscape'

/**
 * Стиль графа. canvas-нода невидима (только якорь рёбер и хит-бокс);
 * видимая нода — HTML-метка .node. Перенос из ragu.html.
 */
export const GRAPH_STYLE: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-opacity': 0,
      'background-opacity': 0,
      'border-width': 0,
      'font-size': 10,
      'line-height': 1.3,
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': 150,
      width: 'label',
      height: 'label',
      padding: '11px',
      shape: 'round-rectangle',
    },
  },
  { selector: 'node.hidden', style: { display: 'none' } },
  { selector: 'node.filtered', style: { events: 'no' } },
  {
    selector: 'edge',
    style: {
      'curve-style': 'taxi',
      'taxi-direction': 'horizontal',
      'taxi-turn': '50%',
      'taxi-turn-min-distance': '8px',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.7,
      'line-color': 'data(col)',
      'target-arrow-color': 'data(col)',
      width: 1.6,
      opacity: 0.16,
      // Плавные переходы стиля рёбер: при выборе/подсветке/затемнении цвет, толщина и
      // прозрачность меняются мягко, а не скачком. Анимация идёт только в момент смены
      // стиля (нет постоянной нагрузки на кадр).
      'transition-property': 'line-color, target-arrow-color, width, opacity',
      'transition-duration': '0.38s',
      'transition-timing-function': 'ease-in-out',
    },
  },
  { selector: 'edge.show', style: { opacity: 0.5 } },
  { selector: 'edge.dim', style: { opacity: 0.03 } },
  { selector: 'edge.hl', style: { opacity: 1, width: 2.6 } },
  { selector: 'edge.hidden', style: { display: 'none' } },
] as StylesheetStyle[]
