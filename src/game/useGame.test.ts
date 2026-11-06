import { describe, expect, it } from 'vitest'
import sample from '../data/characters.sample.json'
import ladderJson from '../data/results.json'
import type { Character, LadderStep } from '../data/schema'
import { HINTS_PER_GAME, MAX_SCORE, QUESTIONS_PER_GAME } from './engine'
import { createGame } from './useGame'

const make = () => createGame(sample as Character[], ladderJson as LadderStep[])

function playAll(game: ReturnType<typeof make>, correct: (i: number) => boolean) {
  for (let i = 0; i < QUESTIONS_PER_GAME; i++) {
    const q = game.question.value
    game.pick(correct(i) ? q.answerId : q.options.find((id) => id !== q.answerId)!)
    game.next()
  }
}

describe('createGame', () => {
  it('allows only 3 hints per game', () => {
    const game = make()
    game.start('show')
    let used = 0
    for (let i = 0; i < QUESTIONS_PER_GAME; i++) {
      for (const kind of ['house', 'fact', 'fifty'] as const) {
        if (game.isHintAvailable(kind)) {
          game.useHint(kind)
          used++
        }
      }
      game.pick(game.question.value.answerId)
      game.next()
    }
    expect(used).toBe(HINTS_PER_GAME)
    expect(game.state.hintsLeft).toBe(0)
    // Each hint costs a point, but a correct answer is never worth less than 1.
    expect(game.score.value).toBeGreaterThanOrEqual(MAX_SCORE - HINTS_PER_GAME)
    expect(game.score.value).toBeLessThanOrEqual(MAX_SCORE - 2)
  })

  it('does not allow the same hint twice on one question', () => {
    const game = make()
    game.start('show')
    game.useHint('fifty')
    expect(game.isHintAvailable('fifty')).toBe(false)
    expect(game.turn.value.hidden).toHaveLength(2)
    expect(game.state.hintsLeft).toBe(HINTS_PER_GAME - 1)
  })

  it('scores a perfect game as Bran and a zero game as Hodor', () => {
    const perfect = make()
    perfect.start('book')
    playAll(perfect, () => true)
    expect(perfect.state.phase).toBe('result')
    expect(perfect.verdict.value.characterId).toBe('bran-stark')

    const zero = make()
    zero.start('fanfic')
    playAll(zero, () => false)
    expect(zero.score.value).toBe(0)
    expect(zero.verdict.value.characterId).toBe('hodor')
  })

  it('ignores clicks on options hidden by 50/50', () => {
    const game = make()
    game.start('show')
    game.useHint('fifty')
    game.pick(game.turn.value.hidden[0])
    expect(game.state.phase).toBe('question')
  })
})
