/**
 * Набор inline-SVG иконок (перенос из ragu.html). Значения — строки SVG,
 * пригодные для вставки в innerHTML (в т.ч. в HTML-метки нод Cytoscape).
 * Для Vue-компонентов используйте IconBase.vue, который рендерит эти строки.
 */
const STROKE =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
const FILL = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"'

export const ICONS = {
  leaf: `<svg ${STROKE}><path d="M11 20.5A8 8 0 0 1 9.8 5.6C15.5 4.4 17 3.9 19.5 1.5c1 2.3 1.9 4.7 1.9 8.6 0 6-5 10.4-10.4 10.4Z"/><path d="M2 22c0-3.5 2.2-6.2 6-7"/></svg>`,
  fruit: `<svg ${STROKE}><path d="M12 7.5c-2.6 0-3.7 2-3.7 3.6 0 1.5-1.6 2.6-2.3 4.4-.9 2.3.4 5 3.2 5.4 1.7.2 2.1.2 2.8.2s1.1 0 2.8-.2c2.8-.4 4.1-3.1 3.2-5.4-.7-1.8-2.3-2.9-2.3-4.4 0-1.6-1.1-3.6-3.7-3.6Z"/><path d="M12 7.5V5a2.5 2.5 0 0 1 2.5-2.5"/></svg>`,
  sprout: `<svg ${STROKE}><path d="M12 21v-9"/><path d="M12 12C12 8.5 9.2 6.5 5 6.7c-.2 4 2.6 6.3 7 6.3Z"/><path d="M12 13.5c0-3 2.4-5 6.5-5 .2 3.4-2.4 5.3-6.5 5Z"/></svg>`,
  pollen: `<svg ${FILL}><circle cx="12" cy="10" r="2.6"/><circle cx="6" cy="14.5" r="1.5"/><circle cx="18" cy="14" r="1.5"/><circle cx="9.5" cy="18" r="1.3"/><circle cx="15" cy="18.5" r="1.1"/><circle cx="8.5" cy="6" r="1.1"/><circle cx="16" cy="6.5" r="1.1"/></svg>`,
  bolt: `<svg ${STROKE}><path d="M13 2 4.5 13.2c-.4.5 0 1.3.7 1.3H11l-1 7.5 8.8-11.2c.4-.5 0-1.3-.7-1.3H13Z"/></svg>`,
  list: `<svg ${STROKE}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9.5 4V3.2A1.2 1.2 0 0 1 10.7 2h2.6a1.2 1.2 0 0 1 1.2 1.2V4"/><path d="M9 10h6M9 13.5h6M9 17h3.5"/></svg>`,
  check: `<svg ${STROKE}><circle cx="12" cy="12" r="9.2"/><path d="m8.3 12.2 2.6 2.6 4.8-5.3"/></svg>`,
  checkPlain: `<svg ${STROKE}><path d="m5 12.5 4.5 4.5L19 7"/></svg>`,
  ban: `<svg ${STROKE}><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>`,
  plus: `<svg ${STROKE}><path d="M12 6v12M6 12h12"/></svg>`,
  minus: `<svg ${STROKE}><path d="M6 12h12"/></svg>`,
  close: `<svg ${STROKE}><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  search: `<svg ${STROKE}><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-3.8-3.8"/></svg>`,
  target: `<svg ${STROKE}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5"/></svg>`,
  fit: `<svg ${STROKE}><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/></svg>`,
  branch: `<svg ${STROKE}><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="9" r="2.4"/><path d="M6 8.4v7.2M8.2 7.2 15.8 8.7M8 16.8 15.8 10"/></svg>`,
  box: `<svg ${STROKE}><path d="M3.5 8 12 3l8.5 5v8L12 21l-8.5-5V8Z"/><path d="m3.5 8 8.5 5 8.5-5M12 21v-8"/></svg>`,
  download: `<svg ${STROKE}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>`,
  upload: `<svg ${STROKE}><path d="M12 21V9m0 0 4 4m-4-4-4 4M4 5h16"/></svg>`,
  reset: `<svg ${STROKE}><path d="M3 12a9 9 0 1 1 2.6 6.3M3 18v-4h4"/></svg>`,
  warn: `<svg ${STROKE}><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4M12 17.5v.5"/></svg>`,
  undo: `<svg ${STROKE}><path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/></svg>`,
  redo: `<svg ${STROKE}><path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h2"/></svg>`,
} as const

export type IconName = keyof typeof ICONS
