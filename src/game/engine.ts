import { allPortraits, isNonHuman } from '../data/model'
import type { Character, LadderStep, Level } from '../data/schema'

export const QUESTIONS_PER_GAME = 10
export const OPTIONS_PER_QUESTION = 4
export const HINTS_PER_GAME = 3
export const POINTS_PER_QUESTION = 3
export const MAX_SCORE = QUESTIONS_PER_GAME * POINTS_PER_QUESTION

export const HINT_KINDS = ['house', 'fact', 'fifty'] as const
export type HintKind = (typeof HINT_KINDS)[number]
export const HINT_ICONS: Record<HintKind, string> = { house: '🛡', fact: '📜', fifty: '✂️' }

export type Rng = () => number

export interface Question {
  answerId: string
  /** Character ids in display order; always contains answerId. */
  options: string[]
  /** Index into allPortraits(answer). */
  portraitIndex: number
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const randomItem = <T>(items: readonly T[], rng: Rng = Math.random): T =>
  items[Math.floor(rng() * items.length)]

export const poolFor = (characters: readonly Character[], level: Level): Character[] =>
  characters.filter((c) => c.level === level)

/**
 * Three random wrong options from the same level. Distractors that look like the answer come
 * first, otherwise it would be obvious: the same race for non-humans (dragons, direwolves…),
 * the same gender for humans. Options never share a displayed name in either language
 * (four Walder Freys would be indistinguishable).
 */
export function pickDistractors(answer: Character, pool: readonly Character[], rng: Rng = Math.random): Character[] {
  const others = pool.filter((c) => c.id !== answer.id)
  const alike = isNonHuman(answer.race)
    ? (c: Character) => c.race === answer.race
    : (c: Character) => c.gender === answer.gender && !isNonHuman(c.race)
  const candidates = [...shuffle(others.filter(alike), rng), ...shuffle(others.filter((c) => !alike(c)), rng)]

  const names = new Set([answer.name.ru, answer.name.en])
  const picked: Character[] = []
  for (const c of candidates) {
    if (picked.length === OPTIONS_PER_QUESTION - 1) break
    if (names.has(c.name.ru) || names.has(c.name.en)) continue
    names.add(c.name.ru).add(c.name.en)
    picked.push(c)
  }
  return picked
}

export function buildQuestions(pool: readonly Character[], rng: Rng = Math.random): Question[] {
  return shuffle(pool, rng)
    .slice(0, QUESTIONS_PER_GAME)
    .map((answer) => ({
      answerId: answer.id,
      options: shuffle([answer, ...pickDistractors(answer, pool, rng)], rng).map((c) => c.id),
      portraitIndex: Math.floor(rng() * allPortraits(answer).length),
    }))
}

/** Two wrong options to hide for the 50/50 hint. */
export function fiftyFifty(question: Question, rng: Rng = Math.random): string[] {
  return shuffle(
    question.options.filter((id) => id !== question.answerId),
    rng,
  ).slice(0, 2)
}

export const pointsFor = (correct: boolean, hintsUsed: number): number =>
  correct ? Math.max(1, POINTS_PER_QUESTION - hintsUsed) : 0

/** The ladder step for a score: the highest step whose score does not exceed it. */
export function verdictFor(score: number, ladder: readonly LadderStep[]): LadderStep {
  const sorted = [...ladder].sort((a, b) => a.score - b.score)
  return sorted.filter((s) => s.score <= score).at(-1) ?? sorted[0]
}
