// Парсер .lang файлов Minecraft (формат key=value) + утилиты обогащения имён предметов.
// Пустые строки и строки-комментарии (#) игнорируются.
import { readFileSync } from 'node:fs'

/**
 * Читает .lang файл и возвращает Map<ключ, значение>.
 * Пустые значения (после «=») сохраняются как пустая строка — это легитимно (баг мода).
 * @param {string} filePath — абсолютный путь к файлу
 * @returns {Map<string, string>}
 */
export function parseLang(filePath) {
  const lines = readFileSync(filePath, 'utf8').split('\n')
  const result = new Map()
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1)
    result.set(key, val)
  }
  return result
}

// Маппинг meta → суффикс lang-ключа для tile.bloodRune.*
// (из исходного кода мода: 0=blank, 1=fill, 2=empty, 3=orb, 4=betterCapacity, 5=acceleration)
export const BLOOD_RUNE_METAS = ['blank', 'fill', 'empty', 'orb', 'betterCapacity', 'acceleration']

// Реги bloodMagicBaseItem, которые РЕАЛЬНО встречаются в data-src
export const BASE_ITEM_REGS = new Set([
  'QuartzRod',
  'EmptyCore',
  'MagicalesCable',
  'WoodBrace',
  'StoneBrace',
  'ProjectileCore',
  'SelfCore',
  'MeleeCore',
  'ToolCore',
  'ParadigmBackPlate',
  'OutputCable',
  'InputCable',
  'FlameCore',
  'IcyCore',
  'GustCore',
  'EarthenCore',
  'CrackedRunicPlate',
  'RunicPlate',
  'ScribedRunicPlate',
  'DefaultCore',
  'OffensiveCore',
  'DefensiveCore',
  'EnvironmentalCore',
  'PowerCore',
  'CostCore',
  'PotencyCore',
  'ObsidianBrace',
  'EtherealSlate',
  'LifeShard',
  'SoulShard',
  'LifeBrace',
  'SoulRunicPlate',
  'EnderShard',
])

// Реги bloodMagicAlchemyItem, которые встречаются в data-src
export const BASE_ALCHEMY_REGS = new Set([
  'Offensa',
  'Praesidium',
  'OrbisTerrae',
  'StrengthenedCatalyst',
  'ConcentratedCatalyst',
  'FracturedBone',
  'Virtus',
  'Reductus',
  'Potentia',
])

/** Возвращает true если имя считается «сырым»: пустое, равно ref или выглядит как entityXxxID */
export function isRawName(name, ref) {
  if (!name) return true
  if (name === ref) return true
  if (/^entity\w+ID$/.test(name)) return true
  return false
}

/**
 * Дополняет объект предмета именами из lang-файлов и кюрированных оверрайдов.
 * НЕ трогает уже нормальные имена. Мутирует переданный объект.
 * Приоритет: NAMES_RU-оверрайд > lang > исходные данные.
 * @param {object} o — сырой объект предмета из data-src
 * @param {Map<string,string>} EN — parsed en_US.lang
 * @param {Map<string,string>} RU — parsed ru_RU.lang
 * @param {object} NAMES_RU — кюрированные оверрайды из names-ru.json
 */
export function applyLangNames(o, EN, RU, NAMES_RU) {
  if (!o || typeof o !== 'object') return o
  const ref = o.ref ?? ''

  // 1. Кюрированный оверрайд по ref#meta или ref
  const metaKey = o.meta != null ? `${ref}#${o.meta}` : null
  const override = (metaKey && NAMES_RU[metaKey]) ?? NAMES_RU[ref]
  if (override) {
    if (isRawName(o.name_en, ref)) o.name_en = override.name_en
    if (isRawName(o.name_ru, ref)) o.name_ru = override.name_ru
    return o
  }

  // 2. bloodRune: meta → lang-суффикс tile.bloodRune.<suffix>.name
  if (ref === 'bloodRune') {
    const suffix = BLOOD_RUNE_METAS[o.meta ?? 0] ?? 'blank'
    const lk = `tile.bloodRune.${suffix}.name`
    if (isRawName(o.name_en, ref)) o.name_en = EN.get(lk) ?? o.name_en
    if (isRawName(o.name_ru, ref)) o.name_ru = RU.get(lk) ?? o.name_ru
    return o
  }

  // 3. baseItems: reg → item.bloodMagicBaseItem.<reg>.name
  if (ref === 'baseItems' && BASE_ITEM_REGS.has(o.reg)) {
    const lk = `item.bloodMagicBaseItem.${o.reg}.name`
    if (isRawName(o.name_en, ref)) o.name_en = EN.get(lk) ?? o.name_en
    if (isRawName(o.name_ru, ref)) o.name_ru = RU.get(lk) ?? o.name_ru
    return o
  }

  // 4. baseAlchemyItems: reg → item.bloodMagicAlchemyItem.<reg>.name
  if (ref === 'baseAlchemyItems' && BASE_ALCHEMY_REGS.has(o.reg)) {
    const lk = `item.bloodMagicAlchemyItem.${o.reg}.name`
    if (isRawName(o.name_en, ref)) o.name_en = EN.get(lk) ?? o.name_en
    if (isRawName(o.name_ru, ref)) o.name_ru = RU.get(lk) ?? o.name_ru
    return o
  }

  // 5. itemFluidSigil: баг мода — пустое имя в lang, fallback прямо здесь
  if (ref === 'itemFluidSigil' && isRawName(o.name_en, ref)) {
    o.name_en = 'Fluid Sigil'
    o.name_ru = 'Сигил жидкости'
  }

  return o
}
