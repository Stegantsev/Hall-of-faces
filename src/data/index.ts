import type { Character, House, LadderStep } from './schema'
import charactersJson from './characters.json'
import housesJson from './houses.json'
import ladderJson from './results.json'

export const characters: Character[] = charactersJson as Character[]
export const houses: House[] = housesJson as House[]
export const ladder: LadderStep[] = ladderJson as LadderStep[]

export const characterById = new Map(characters.map((c) => [c.id, c]))
export const houseById = new Map(houses.map((h) => [h.id, h]))
