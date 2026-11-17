import { describe, expect, it } from 'vitest'
import { visitVars } from './stats'

describe('visitVars', () => {
  it('counts a plain visit as the start page with the browser referrer', () => {
    expect(visitVars('', 'https://www.reddit.com/')).toEqual({ path: '/', referrer: 'https://www.reddit.com/' })
  })

  it('counts a visit from a preview page as that page, with its source', () => {
    expect(visitVars('?from=ru%2F&ref=https%3A%2F%2Fvk.com%2F', 'https://example.org/ru/')).toEqual({
      path: '/ru/',
      referrer: 'https://vk.com/',
    })
  })

  it("keeps an empty source from a preview page instead of the preview page's address", () => {
    expect(visitVars('?from=r%2Fde%2Fbran-stark%2F&ref=', 'https://example.org/r/de/bran-stark/')).toEqual({
      path: '/r/de/bran-stark/',
      referrer: '',
    })
  })

  it('takes a community tag from ?ref= or ?utm_source=', () => {
    expect(visitVars('?ref=pikabu', '').referrer).toBe('pikabu')
    expect(visitVars('?utm_source=telegram', '').referrer).toBe('telegram')
  })
})
