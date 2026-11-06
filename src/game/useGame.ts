import { computed, reactive } from 'vue'
import { characters as allCharacters, ladder as defaultLadder } from '../data'
import type { Character, LadderStep, Level } from '../data/schema'
import {
  HINTS_PER_GAME,
  buildQuestions,
  fiftyFifty,
  pointsFor,
  poolFor,
  verdictFor,
  type HintKind,
  type Question,
  type Rng,
} from './engine'

export type Phase = 'start' | 'question' | 'reveal' | 'result'

export interface Turn {
  hints: HintKind[]
  /** Options hidden by 50/50. */
  hidden: string[]
  /** Fact shown by the fact hint. */
  factIndex: number | null
  pickedId: string | null
}

const newTurn = (): Turn => ({ hints: [], hidden: [], factIndex: null, pickedId: null })

export function createGame(characters: Character[], ladder: LadderStep[], rng: Rng = Math.random) {
  const byId = new Map(characters.map((c) => [c.id, c]))

  const state = reactive({
    phase: 'start' as Phase,
    level: null as Level | null,
    questions: [] as Question[],
    turns: [] as Turn[],
    index: 0,
    hintsLeft: HINTS_PER_GAME,
    captionSeed: 0,
  })

  const question = computed(() => state.questions[state.index])
  const turn = computed(() => state.turns[state.index])
  const answer = computed(() => (question.value ? byId.get(question.value.answerId) : undefined))
  const score = computed(() =>
    state.questions.reduce((sum, q, i) => {
      const t = state.turns[i]
      return t.pickedId ? sum + pointsFor(t.pickedId === q.answerId, t.hints.length) : sum
    }, 0),
  )
  const verdict = computed(() => verdictFor(score.value, ladder))

  function start(level: Level) {
    state.level = level
    state.questions = buildQuestions(poolFor(characters, level), rng)
    state.turns = state.questions.map(newTurn)
    state.index = 0
    state.hintsLeft = HINTS_PER_GAME
    state.captionSeed = rng()
    state.phase = 'question'
  }

  function isHintAvailable(kind: HintKind): boolean {
    const a = answer.value
    if (state.phase !== 'question' || state.hintsLeft <= 0 || !a || turn.value.hints.includes(kind)) return false
    if (kind === 'house') return Boolean(a.house || a.castle || a.serves || a.sigils?.length)
    if (kind === 'fact') return a.facts.length > 0
    return true
  }

  function useHint(kind: HintKind) {
    if (!isHintAvailable(kind)) return
    const t = turn.value
    t.hints.push(kind)
    state.hintsLeft--
    if (kind === 'fact') t.factIndex = Math.floor(rng() * answer.value!.facts.length)
    if (kind === 'fifty') t.hidden = fiftyFifty(question.value, rng)
  }

  function pick(id: string) {
    if (state.phase !== 'question' || turn.value.hidden.includes(id)) return
    turn.value.pickedId = id
    state.phase = 'reveal'
  }

  function next() {
    if (state.phase !== 'reveal') return
    if (state.index + 1 < state.questions.length) {
      state.index++
      state.phase = 'question'
    } else {
      state.phase = 'result'
    }
  }

  const restart = () => state.level && start(state.level)
  const toMenu = () => (state.phase = 'start')

  return { state, question, turn, answer, score, verdict, byId, start, isHintAvailable, useHint, pick, next, restart, toMenu }
}

export type Game = ReturnType<typeof createGame>

let game: Game | undefined
export const useGame = (): Game => (game ??= createGame(allCharacters, defaultLadder))
