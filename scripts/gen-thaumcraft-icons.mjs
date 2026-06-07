// Запекает цветные иконки аспектов Thaumcraft: монохромный шаблон × цвет аспекта
// (как делает движок игры), nearest ×2 для резкости. Чистый Node (zlib), без зависимостей.
// Вход: thaumcraft/textures/aspects/<tag>.png + цвет из data-src/aspects.json
// Выход: public/thaumcraft/aspects/<tag>.png. Запуск: node scripts/gen-thaumcraft-icons.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import zlib from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ASP = JSON.parse(
  readFileSync(resolve(root, 'thaumcraft/data-src/aspects.json'), 'utf8'),
).aspects
const FALLBACK = '#c9a3ff'
const srcDir = resolve(root, 'thaumcraft/textures/aspects')
const outDir = resolve(root, 'public/thaumcraft/aspects')
mkdirSync(outDir, { recursive: true })

// ---- минимальный PNG decode/encode (8-bit, без interlace) ----
function parsePNG(buf) {
  let p = 8
  const ch = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    ch.push({ type: buf.toString('ascii', p + 4, p + 8), data: buf.subarray(p + 8, p + 8 + len) })
    p += 12 + len
  }
  const ihdr = ch.find((c) => c.type === 'IHDR')?.data
  if (!ihdr) throw new Error('нет IHDR')
  // декодер поддерживает только 8-битные неинтерлейсные PNG — иначе тихо испортили бы пиксели
  if (ihdr[8] !== 8 || ihdr[12] !== 0)
    throw new Error(`неподдерживаемый PNG (битность ${ihdr[8]}, interlace ${ihdr[12]})`)
  return {
    width: ihdr.readUInt32BE(0),
    height: ihdr.readUInt32BE(4),
    colorType: ihdr[9],
    raw: zlib.inflateSync(Buffer.concat(ch.filter((c) => c.type === 'IDAT').map((c) => c.data))),
    plte: ch.find((c) => c.type === 'PLTE')?.data || null,
    trns: ch.find((c) => c.type === 'tRNS')?.data || null,
  }
}
const bppOf = (ct) => (ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1)
function unfilter(raw, w, h, bpp) {
  const st = w * bpp,
    o = Buffer.alloc(h * st)
  let p = 0
  for (let y = 0; y < h; y++) {
    const ft = raw[p++]
    for (let i = 0; i < st; i++) {
      const x = raw[p++]
      const a = i >= bpp ? o[y * st + i - bpp] : 0
      const b = y > 0 ? o[(y - 1) * st + i] : 0
      const c = i >= bpp && y > 0 ? o[(y - 1) * st + i - bpp] : 0
      let v
      switch (ft) {
        case 1:
          v = x + a
          break
        case 2:
          v = x + b
          break
        case 3:
          v = x + ((a + b) >> 1)
          break
        case 4: {
          const pp = a + b - c,
            pa = Math.abs(pp - a),
            pb = Math.abs(pp - b),
            pc = Math.abs(pp - c)
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
          break
        }
        default:
          v = x
      }
      o[y * st + i] = v & 255
    }
  }
  return o
}
function toRGBA(px, info) {
  const { width: w, height: h, colorType: ct, plte, trns } = info,
    n = w * h,
    o = Buffer.alloc(n * 4)
  if (ct === 6) return Buffer.from(px)
  if (ct === 2) {
    for (let i = 0; i < n; i++) {
      o[i * 4] = px[i * 3]
      o[i * 4 + 1] = px[i * 3 + 1]
      o[i * 4 + 2] = px[i * 3 + 2]
      o[i * 4 + 3] = 255
    }
    return o
  }
  if (ct === 3) {
    for (let i = 0; i < n; i++) {
      const x = px[i]
      o[i * 4] = plte[x * 3]
      o[i * 4 + 1] = plte[x * 3 + 1]
      o[i * 4 + 2] = plte[x * 3 + 2]
      o[i * 4 + 3] = trns && x < trns.length ? trns[x] : 255
    }
    return o
  }
  if (ct === 0) {
    for (let i = 0; i < n; i++) {
      o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = px[i]
      o[i * 4 + 3] = 255
    }
    return o
  }
  if (ct === 4) {
    for (let i = 0; i < n; i++) {
      const v = px[i * 2]
      o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = v
      o[i * 4 + 3] = px[i * 2 + 1]
    }
    return o
  }
  return o
}
const CRC = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (b) => {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function encodePNG(w, h, rgba) {
  const st = w * 4,
    raw = Buffer.alloc(h * (st + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (st + 1)] = 0
    rgba.copy(raw, y * (st + 1) + 1, y * st, y * st + st)
  }
  const idat = zlib.deflateSync(raw)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const chunk = (type, data) => {
    const l = Buffer.alloc(4)
    l.writeUInt32BE(data.length, 0)
    const t = Buffer.from(type, 'ascii')
    const cr = Buffer.alloc(4)
    cr.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
    return Buffer.concat([l, t, data, cr])
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
function scale2x(rgba, w, h) {
  const o = Buffer.alloc(w * 2 * h * 2 * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const d = ((y * 2 + dy) * w * 2 + (x * 2 + dx)) * 4
          o[d] = rgba[s]
          o[d + 1] = rgba[s + 1]
          o[d + 2] = rgba[s + 2]
          o[d + 3] = rgba[s + 3]
        }
    }
  return o
}

let baked = 0,
  skipped = 0,
  failed = 0
for (const a of ASP) {
  const file = resolve(srcDir, `${a.tag}.png`)
  if (!existsSync(file)) {
    skipped++
    continue
  }
  // одна битая текстура не должна валить весь билд — логируем тег и продолжаем
  try {
    const info = parsePNG(readFileSync(file))
    const rgba = toRGBA(unfilter(info.raw, info.width, info.height, bppOf(info.colorType)), info)
    const col = a.color || FALLBACK
    const cr = parseInt(col.slice(1, 3), 16),
      cg = parseInt(col.slice(3, 5), 16),
      cb = parseInt(col.slice(5, 7), 16)
    for (let i = 0; i < info.width * info.height; i++) {
      rgba[i * 4] = Math.round((rgba[i * 4] * cr) / 255)
      rgba[i * 4 + 1] = Math.round((rgba[i * 4 + 1] * cg) / 255)
      rgba[i * 4 + 2] = Math.round((rgba[i * 4 + 2] * cb) / 255)
    }
    writeFileSync(
      resolve(outDir, `${a.tag}.png`),
      encodePNG(info.width * 2, info.height * 2, scale2x(rgba, info.width, info.height)),
    )
    baked++
  } catch (e) {
    failed++
    console.warn(`thaumcraft icons: пропущен ${a.tag} — ${e.message}`)
  }
}
console.log(`thaumcraft icons: запечено ${baked}, без текстуры ${skipped}, ошибок ${failed}`)

// ---- цветные шарды стихий ----
// shard.png — серый шаблон (игра красит его цветом стихии при отрисовке, как
// аспекты); запекаем 6 вариантов цветом праймала в public/.../tex. balanced —
// отдельная готовая текстура, не трогаем.
const SHARD_COLORS = {
  air: '#FFFF7E',
  fire: '#FF5A01',
  water: '#3CD4FC',
  earth: '#56C000',
  order: '#D5D4EC',
  entropy: '#404040',
}
const shardSrc = resolve(root, 'thaumcraft/textures/items/thaumcraft/shard.png')
const shardOut = resolve(root, 'public/thaumcraft/tex/items/thaumcraft')
let shardBaked = 0
if (existsSync(shardSrc)) {
  try {
    mkdirSync(shardOut, { recursive: true })
    const info = parsePNG(readFileSync(shardSrc))
    const base = toRGBA(unfilter(info.raw, info.width, info.height, bppOf(info.colorType)), info)
    for (const [el, col] of Object.entries(SHARD_COLORS)) {
      const rgba = Buffer.from(base)
      const cr = parseInt(col.slice(1, 3), 16),
        cg = parseInt(col.slice(3, 5), 16),
        cb = parseInt(col.slice(5, 7), 16)
      for (let i = 0; i < info.width * info.height; i++) {
        rgba[i * 4] = Math.round((rgba[i * 4] * cr) / 255)
        rgba[i * 4 + 1] = Math.round((rgba[i * 4 + 1] * cg) / 255)
        rgba[i * 4 + 2] = Math.round((rgba[i * 4 + 2] * cb) / 255)
      }
      writeFileSync(
        resolve(shardOut, `shard_${el}.png`),
        encodePNG(info.width * 2, info.height * 2, scale2x(rgba, info.width, info.height)),
      )
      shardBaked++
    }
  } catch (e) {
    console.warn(`thaumcraft icons: шарды не запеклись — ${e.message}`)
  }
}
console.log(`thaumcraft icons: цветных шардов ${shardBaked}`)
