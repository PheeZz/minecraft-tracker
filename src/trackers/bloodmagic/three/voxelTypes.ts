/** Текстурный набор для одного вокселя (пути к PNG-файлам). */
export interface VoxelTextures {
  top: string
  bottom?: string
  sides: string
}

/** Один воксель в 3D-сцене алтаря / ритуала. */
export interface VoxelBlock {
  x: number
  y: number
  z: number
  textures: VoxelTextures
  /** Отображаемое имя на русском (для тултипа при hover). */
  label: string
  /** Слот апгрейда — подсвечивается золотым emissive-намёком. */
  upgrade?: boolean
}
