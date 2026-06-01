import type cytoscape from 'cytoscape'

/** Стиль графа цепочек пчёл (ноды-пчёлы с HTML-метками, ромбы-рецепты, рёбра). */
export const BEE_GRAPH_STYLE = [
  {
    selector: 'node[kind="bee"]',
    style: {
      label: 'data(label)',
      'text-opacity': 0,
      'background-opacity': 0,
      'border-width': 0,
      width: 'label',
      height: 'label',
      padding: '16px',
      shape: 'round-rectangle',
      'font-size': 13,
      'font-weight': 700,
      'text-wrap': 'wrap',
      'text-max-width': 120,
      'text-valign': 'center',
      'text-halign': 'center',
    },
  },
  {
    selector: 'node[kind="recipe"]',
    style: {
      shape: 'diamond',
      'background-color': '#f4c452',
      'border-width': 1.5,
      'border-color': '#bf821a',
      label: 'data(label)',
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 10,
      'min-zoomed-font-size': 8,
      'font-weight': 700,
      color: '#3a2a08',
      'text-valign': 'center',
      'text-halign': 'center',
      width: 36,
      height: 36,
    },
  },
  {
    selector: 'edge',
    style: { width: 1.8, 'line-color': '#cbb78f', 'curve-style': 'straight' },
  },
  {
    selector: 'edge[kind="out"]',
    style: {
      'line-color': '#b89a64',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#b89a64',
      'arrow-scale': 1,
    },
  },
  {
    selector: 'edge[kind="in"]',
    style: { 'line-color': '#cbb78f', width: 1.5, 'target-arrow-shape': 'none' },
  },
] as cytoscape.StylesheetStyle[]
