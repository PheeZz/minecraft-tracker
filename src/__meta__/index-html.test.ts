import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const html = readFileSync('index.html', 'utf8')

describe('index.html мета-теги', () => {
  it('бренд в title', () => {
    expect(html).toContain('Катализатор бесконечности')
  })
  it('description со словами пчёлы и деревья', () => {
    expect(html).toMatch(/<meta name="description"[^>]*пчёл/i)
    expect(html).toContain('Forestry')
  })
  it('canonical и OG с абсолютным прод-URL', () => {
    expect(html).toContain('<link rel="canonical" href="https://pheezz.github.io/minecraft-tracker/"')
    expect(html).toContain('property="og:image" content="https://pheezz.github.io/minecraft-tracker/og-cover.png"')
    expect(html).toContain('property="og:title"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
  })
  it('favicon — svg + apple-touch, без старого emoji', () => {
    expect(html).toContain('rel="icon" href="%BASE_URL%favicon.svg"')
    expect(html).toContain('rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png"')
    expect(html).not.toContain("text y='.9em'")
  })
})
