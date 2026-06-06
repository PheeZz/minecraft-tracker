import { GENOMES } from './genomes.data'
import { buildCarrierIndex } from '../domain/genetics'

/** Индекс «ген → виды-носители», построенный один раз из геномов видов. */
export const CARRIERS = buildCarrierIndex(GENOMES)
