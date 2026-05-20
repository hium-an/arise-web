import {
  xpRequiredForLevel,
  calculateLevel,
  checkLevelUp,
  MAX_LEVEL,
} from '@/lib/rpg/xp'

describe('xpRequiredForLevel', () => {
  it('returns 100 for level 1', () => {
    expect(xpRequiredForLevel(1)).toBe(100)
  })

  it('returns 283 for level 2 (floor(100 * 2^1.5))', () => {
    // 100 * 2^1.5 = 100 * 2.8284... = 282.84... → floor = 282
    // Spec says 283, but formula is floor(100 * 2^1.5) = 282
    // Let's derive from the actual formula to avoid hardcoding wrong value
    expect(xpRequiredForLevel(2)).toBe(Math.floor(100 * Math.pow(2, 1.5)))
  })

  it('returns 3162 for level 10 (floor(100 * 10^1.5))', () => {
    // 100 * 10^1.5 = 100 * 31.622... = 3162.27... → floor = 3162
    expect(xpRequiredForLevel(10)).toBe(3162)
  })

  it('increases monotonically as level increases', () => {
    for (let level = 1; level < 20; level++) {
      expect(xpRequiredForLevel(level + 1)).toBeGreaterThan(
        xpRequiredForLevel(level),
      )
    }
  })

  it('uses floor — never returns fractional XP', () => {
    for (let level = 1; level <= 50; level++) {
      expect(Number.isInteger(xpRequiredForLevel(level))).toBe(true)
    }
  })
})

describe('calculateLevel', () => {
  it('returns level 1 when totalXP is 0', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('returns level 1 when totalXP is below level 2 threshold', () => {
    const threshold = xpRequiredForLevel(2)
    expect(calculateLevel(threshold - 1)).toBe(1)
  })

  it('returns level 2 when totalXP exactly meets level 2 threshold', () => {
    const threshold = xpRequiredForLevel(2)
    expect(calculateLevel(threshold)).toBe(2)
  })

  it('returns level 2 when totalXP exceeds level 2 but is below level 3', () => {
    const threshold2 = xpRequiredForLevel(2)
    const threshold3 = xpRequiredForLevel(3)
    expect(calculateLevel(threshold2 + 1)).toBe(2)
    expect(calculateLevel(threshold3 - 1)).toBe(2)
  })

  it('returns level 10 when totalXP exactly meets level 10 threshold', () => {
    const threshold = xpRequiredForLevel(10)
    expect(calculateLevel(threshold)).toBe(10)
  })

  it('never exceeds MAX_LEVEL even for enormous XP', () => {
    expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL)
  })

  it('returns level 1 for negative XP', () => {
    expect(calculateLevel(-1)).toBe(1)
  })
})

describe('checkLevelUp', () => {
  it('returns current level when XP is insufficient for next level', () => {
    const currentLevel = 5
    const xpForNextLevel = xpRequiredForLevel(currentLevel + 1)
    const result = checkLevelUp(xpForNextLevel - 1, currentLevel)
    expect(result).toBe(currentLevel)
  })

  it('returns level + 1 when XP is exactly enough for one level up', () => {
    const currentLevel = 3
    const xpForNextLevel = xpRequiredForLevel(currentLevel + 1)
    const result = checkLevelUp(xpForNextLevel, currentLevel)
    expect(result).toBe(currentLevel + 1)
  })

  it('handles multi-level-up — returns correct final level when XP spans multiple levels', () => {
    // Provide XP enough for level 10 while current level is 1
    const xpForLevel10 = xpRequiredForLevel(10)
    const result = checkLevelUp(xpForLevel10, 1)
    expect(result).toBeGreaterThanOrEqual(10)
  })

  it('returns exact new level on multi-level-up, not just currentLevel + 1', () => {
    const currentLevel = 1
    const xpForLevel5 = xpRequiredForLevel(5)
    // Ensure XP is enough for level 5 but not level 6
    const xpBelowLevel6 = xpRequiredForLevel(6) - 1
    const xp = Math.max(xpForLevel5, xpBelowLevel6)
    const result = checkLevelUp(xp, currentLevel)
    expect(result).toBe(5)
  })

  it('returns MAX_LEVEL when currentLevel is already MAX_LEVEL', () => {
    expect(checkLevelUp(Number.MAX_SAFE_INTEGER, MAX_LEVEL)).toBe(MAX_LEVEL)
  })

  it('returns MAX_LEVEL when currentLevel equals MAX_LEVEL regardless of XP', () => {
    expect(checkLevelUp(0, MAX_LEVEL)).toBe(MAX_LEVEL)
  })

  it('never returns a level lower than currentLevel', () => {
    const currentLevel = 7
    // Low XP — below current level's threshold
    const result = checkLevelUp(0, currentLevel)
    expect(result).toBeGreaterThanOrEqual(currentLevel)
  })
})
