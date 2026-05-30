/** Человекочитаемая сетка посадки по числу саженцев (перенос из ragu.html plantGrid). */
export function plantGrid(n: number): string {
  if (n === 4) return '2×2'
  if (n === 9) return '3×3'
  if (n === 16) return '4×4'
  return `${n} шт`
}
