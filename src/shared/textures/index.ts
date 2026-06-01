export type Img = HTMLImageElement | null

/** Загрузка изображения в промис (resolve(null) при ошибке — чтобы Promise.all не падал). */
export function loadImage(src: string): Promise<Img> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Перерисовать canvas-иконки по CSS-селектору внутри root. */
export function paintCanvasIcons(
  root: ParentNode,
  selector: string,
  paint: (cv: HTMLCanvasElement) => void,
): void {
  root.querySelectorAll<HTMLCanvasElement>(selector).forEach(paint)
}
