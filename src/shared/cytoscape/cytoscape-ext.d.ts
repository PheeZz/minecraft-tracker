// Декларации для cytoscape-расширений без собственных типов.
// ВАЖНО: файл без top-level import/export — ambient-объявления для нетипизированных
// пакетов. НЕ объявляем здесь 'cytoscape', чтобы не перетереть @types/cytoscape.
declare module 'cytoscape-dagre' {
  const ext: unknown
  export default ext
}
declare module 'cytoscape-node-html-label' {
  const ext: unknown
  export default ext
}
