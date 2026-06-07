import type { StylesheetStyle } from 'cytoscape'

/**
 * Стиль графа исследований. canvas-нода невидима (только якорь рёбер и хит-бокс);
 * видимая нода — HTML-метка .rnode (см. nodeLabel.ts). Цвет/состояние задаются
 * классами на HTML-карточке, поэтому здесь правим только рёбра и геометрию ноды.
 */
export const RESEARCH_GRAPH_STYLE: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-opacity': 0,
      'background-opacity': 0,
      'border-width': 0,
      'font-size': 11,
      'line-height': 1.25,
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': 180,
      width: 'label',
      height: 'label',
      padding: '10px',
      shape: 'round-rectangle',
    },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1,
      'line-color': '#a98bff',
      'target-arrow-color': '#a98bff',
      width: 4,
      opacity: 0.8,
      'transition-property': 'line-color, target-arrow-color, width, opacity',
      'transition-duration': '0.3s',
      'transition-timing-function': 'ease-in-out',
    },
  },
  // ребро, ведущее к выбранной/целевой ноде — ярче
  {
    selector: 'edge.hl',
    style: { 'line-color': '#c9a3ff', 'target-arrow-color': '#c9a3ff', opacity: 0.95, width: 3 },
  },
] as StylesheetStyle[]
