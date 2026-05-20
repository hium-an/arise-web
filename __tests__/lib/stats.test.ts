import {
  applyStatGains,
  computePlayerClass,
  STAT_CODES,
  type StatsMap,
} from '@/lib/rpg/stats'

// ---------------------------------------------------------------------------
// applyStatGains
// ---------------------------------------------------------------------------

describe('applyStatGains', () => {
  it('adds gain values to the corresponding stat', () => {
    const stats: StatsMap = { STR: 10, INT: 20 }
    const gains: StatsMap = { STR: 5, INT: 3 }
    const result = applyStatGains(stats, gains)
    expect(result.STR).toBe(15)
    expect(result.INT).toBe(23)
  })

  it('does not mutate the original stats object', () => {
    const stats: StatsMap = { STR: 10 }
    const gains: StatsMap = { STR: 5 }
    applyStatGains(stats, gains)
    expect(stats.STR).toBe(10)
  })

  it('does not mutate the gains object', () => {
    const stats: StatsMap = { STR: 10 }
    const gains: StatsMap = { STR: 5 }
    applyStatGains(stats, gains)
    expect(gains.STR).toBe(5)
  })

  it('ignores NaN gain values — stat remains unchanged', () => {
    const stats: StatsMap = { STR: 10 }
    const gains: StatsMap = { STR: NaN }
    const result = applyStatGains(stats, gains)
    expect(result.STR).toBe(10)
  })

  it('ignores NaN even when stat did not exist before', () => {
    const stats: StatsMap = {}
    const gains: StatsMap = { VIT: NaN }
    const result = applyStatGains(stats, gains)
    expect(result.VIT).toBeUndefined()
  })

  it('clamps result to 0 when gain makes stat go negative', () => {
    const stats: StatsMap = { STR: 3 }
    const gains: StatsMap = { STR: -10 }
    const result = applyStatGains(stats, gains)
    expect(result.STR).toBe(0)
  })

  it('allows negative gains that reduce without going below 0', () => {
    const stats: StatsMap = { AGI: 20 }
    const gains: StatsMap = { AGI: -5 }
    const result = applyStatGains(stats, gains)
    expect(result.AGI).toBe(15)
  })

  it('applies gain to stat that was not previously defined (treats missing as 0)', () => {
    const stats: StatsMap = {}
    const gains: StatsMap = { WIL: 7 }
    const result = applyStatGains(stats, gains)
    expect(result.WIL).toBe(7)
  })

  it('preserves stats that have no corresponding gain entry', () => {
    const stats: StatsMap = { STR: 10, INT: 20 }
    const gains: StatsMap = { STR: 5 }
    const result = applyStatGains(stats, gains)
    expect(result.INT).toBe(20)
  })

  it('returns a new object reference — not the same as input', () => {
    const stats: StatsMap = { STR: 10 }
    const gains: StatsMap = { STR: 1 }
    const result = applyStatGains(stats, gains)
    expect(result).not.toBe(stats)
  })

  it('handles all 15 stat codes simultaneously', () => {
    const stats: StatsMap = {}
    const gains: StatsMap = {}
    for (const code of STAT_CODES) {
      gains[code] = 1
    }
    const result = applyStatGains(stats, gains)
    for (const code of STAT_CODES) {
      expect(result[code]).toBe(1)
    }
  })

  it('returns 0 when both stat and negative gain sum to exactly zero', () => {
    const stats: StatsMap = { FOC: 5 }
    const gains: StatsMap = { FOC: -5 }
    const result = applyStatGains(stats, gains)
    expect(result.FOC).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computePlayerClass
// ---------------------------------------------------------------------------

describe('computePlayerClass', () => {
  it('returns Novice Hunter when stats map is empty', () => {
    expect(computePlayerClass({})).toBe('Novice Hunter')
  })

  it('returns Novice Hunter when all stats are zero', () => {
    const allZero: StatsMap = {
      STR: 0, VIT: 0, AGI: 0,
      INT: 0, WIS: 0, FOC: 0,
      WLT: 0, SAV: 0, INV: 0,
      CHA: 0, EMP: 0, NET: 0,
      WIL: 0, PER: 0, CON: 0,
    }
    expect(computePlayerClass(allZero)).toBe('Novice Hunter')
  })

  it('returns Iron Body when physical cluster (STR + VIT + AGI) is dominant', () => {
    const stats: StatsMap = { STR: 50, VIT: 40, AGI: 30, INT: 5 }
    expect(computePlayerClass(stats)).toBe('Iron Body')
  })

  it('returns Shadow Scholar when mental cluster (INT + WIS + FOC) is dominant', () => {
    const stats: StatsMap = { INT: 60, WIS: 50, FOC: 40, STR: 10 }
    expect(computePlayerClass(stats)).toBe('Shadow Scholar')
  })

  it('returns Silver Tongue when social cluster (CHA + EMP + NET) is dominant', () => {
    const stats: StatsMap = { CHA: 70, EMP: 60, NET: 50, STR: 5 }
    expect(computePlayerClass(stats)).toBe('Silver Tongue')
  })

  it('returns Iron Will when discipline cluster (WIL + PER + CON) is dominant', () => {
    const stats: StatsMap = { WIL: 80, PER: 70, CON: 60, INT: 10 }
    expect(computePlayerClass(stats)).toBe('Iron Will')
  })

  it('returns Coin Sovereign when financial cluster (WLT + SAV + INV) is dominant', () => {
    const stats: StatsMap = { WLT: 90, SAV: 80, INV: 70, STR: 5 }
    expect(computePlayerClass(stats)).toBe('Coin Sovereign')
  })

  it('uses the cluster with the highest sum — not the single highest individual stat', () => {
    // Mental total: 30+30+30 = 90; Physical: 80+0+0 = 80
    const stats: StatsMap = { INT: 30, WIS: 30, FOC: 30, STR: 80 }
    expect(computePlayerClass(stats)).toBe('Shadow Scholar')
  })

  it('returns one of the known classes even when stats are partially filled', () => {
    const stats: StatsMap = { WIL: 100 }
    expect(computePlayerClass(stats)).toBe('Iron Will')
  })

  it('handles ties deterministically — picks the first dominant cluster found', () => {
    // Both physical and mental at 100 — should return whichever Object.entries finds first
    const stats: StatsMap = { STR: 100, INT: 100 }
    const result = computePlayerClass(stats)
    expect(['Iron Body', 'Shadow Scholar']).toContain(result)
  })
})
