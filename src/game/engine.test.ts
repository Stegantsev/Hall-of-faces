import { describe, expect, it } from 'vitest'
import sample from '../data/characters.sample.json'
import ladderJson from '../data/results.json'
import { extraSigils } from '../data/model'
import type { Character, LadderStep } from '../data/schema'
import {
  MAX_SCORE,
  QUESTIONS_PER_GAME,
  buildQuestions,
  fiftyFifty,
  pickDistractors,
  pointsFor,
  poolFor,
  verdictFor,
} from './engine'

const characters = sample as Character[]
const ladder = ladderJson as LadderStep[]

// Deterministic PRNG (mulberry32) so failures are reproducible.
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('buildQuestions', () => {
  for (const level of ['show', 'book', 'fanfic'] as const) {
    it(`builds ${QUESTIONS_PER_GAME} unique questions for ${level}`, () => {
      const pool = poolFor(characters, level)
      for (let seed = 1; seed <= 50; seed++) {
        const qs = buildQuestions(pool, seeded(seed))
        expect(qs).toHaveLength(QUESTIONS_PER_GAME)
        expect(new Set(qs.map((q) => q.answerId)).size).toBe(QUESTIONS_PER_GAME)
        for (const q of qs) {
          expect(q.options).toHaveLength(4)
          expect(new Set(q.options).size).toBe(4)
          expect(q.options).toContain(q.answerId)
          expect(q.options.every((id) => pool.some((c) => c.id === id))).toBe(true)
        }
      }
    })
  }

  it('picks a portrait index within the character portraits', () => {
    const arya = characters.filter((c) => c.id === 'arya-stark')
    const seen = new Set<number>()
    for (let seed = 1; seed <= 40; seed++) seen.add(buildQuestions(arya, seeded(seed))[0].portraitIndex)
    expect([...seen].sort()).toEqual([0, 1])
  })
})

describe('pickDistractors', () => {
  const pool = poolFor(characters, 'fanfic')

  it('uses the same race for non-humans', () => {
    const drogon = pool.find((c) => c.id === 'drogon')!
    for (let seed = 1; seed <= 30; seed++) {
      const ds = pickDistractors(drogon, pool, seeded(seed))
      expect(ds.every((c) => c.race === 'dragon')).toBe(true)
    }
  })

  it('tops up with other races when the same race is scarce', () => {
    const leaf = pool.find((c) => c.id === 'leaf')!
    const ds = pickDistractors(leaf, pool, seeded(7))
    expect(ds).toHaveLength(3)
    expect(ds.map((c) => c.id)).not.toContain('leaf')
  })

  it('uses the same gender for humans', () => {
    const showPool = poolFor(characters, 'show')
    for (const answer of showPool.filter((c) => c.gender !== '-')) {
      const ds = pickDistractors(answer, showPool, seeded(5))
      expect(ds.every((c) => c.gender === answer.gender)).toBe(true)
    }
  })

  it('never offers two options with the same displayed name', () => {
    const base = pool.find((c) => c.gender === 'm' && c.race !== 'dragon')!
    const twin = (id: string, name: Character['name']): Character => ({ ...base, id, name })
    const freys = [
      twin('walder-frey', { ru: 'Уолдер Фрей', en: 'Walder Frey' }),
      twin('big-walder-frey', { ru: 'Уолдер Фрей', en: 'Walder Frey' }),
      twin('little-walder-frey', { ru: 'Уолдер Фрей', en: 'Walder Frey' }),
      twin('brandon-stark', { ru: 'Брандон Старк', en: 'Brandon Stark' }),
      twin('bran-stark', { ru: 'Брандон Старк', en: 'Bran Stark' }),
      twin('hodor', { ru: 'Ходор', en: 'Hodor' }),
      twin('hot-pie', { ru: 'Пирожок', en: 'Hot Pie' }),
    ]
    for (let seed = 1; seed <= 30; seed++) {
      const ds = pickDistractors(freys[0], freys, seeded(seed))
      const all = [freys[0], ...ds]
      expect(ds).toHaveLength(3)
      expect(new Set(all.map((c) => c.name.ru)).size).toBe(all.length)
      expect(new Set(all.map((c) => c.name.en)).size).toBe(all.length)
    }
  })
})

describe('fiftyFifty', () => {
  it('hides two wrong options and never the answer', () => {
    const [q] = buildQuestions(poolFor(characters, 'show'), seeded(3))
    for (let seed = 1; seed <= 20; seed++) {
      const hidden = fiftyFifty(q, seeded(seed))
      expect(hidden).toHaveLength(2)
      expect(hidden).not.toContain(q.answerId)
    }
  })
})

describe('pointsFor', () => {
  it('gives 3 minus hints, at least 1 when correct, 0 when wrong', () => {
    expect(pointsFor(true, 0)).toBe(3)
    expect(pointsFor(true, 1)).toBe(2)
    expect(pointsFor(true, 2)).toBe(1)
    expect(pointsFor(true, 3)).toBe(1)
    expect(pointsFor(false, 0)).toBe(0)
  })
})

describe('verdictFor', () => {
  it('maps every score to its own ladder step', () => {
    expect(verdictFor(0, ladder).characterId).toBe('hodor')
    expect(verdictFor(1, ladder).characterId).toBe('hot-pie')
    expect(verdictFor(2, ladder).characterId).toBe('grenn')
    expect(verdictFor(23, ladder).characterId).toBe('jon-snow')
    expect(verdictFor(29, ladder).characterId).toBe('balerion')
    expect(verdictFor(MAX_SCORE, ladder).characterId).toBe('bran-stark')
    const ids = new Set(Array.from({ length: MAX_SCORE + 1 }, (_, s) => verdictFor(s, ladder).characterId))
    expect(ids.size).toBe(MAX_SCORE + 1)
  })

  it('gives Jon Snow a fixed caption', () => {
    expect(verdictFor(23, ladder).fixedCaption?.ru).toBe('Ничего ты не знаешь, Джон Сноу.')
  })
})

describe('extraSigils', () => {
  it('drops the primary house sigil and keeps the rest', () => {
    const tyrion = characters.find((c) => c.id === 'tyrion-lannister')!
    expect(extraSigils(tyrion).map((s) => s.kind)).toEqual(['personal'])
    expect(extraSigils(characters.find((c) => c.id === 'varys')!)).toEqual([])
  })
})
