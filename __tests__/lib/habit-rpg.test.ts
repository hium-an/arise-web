/**
 * Tests for lib/rpg/habit.ts — calculateStreak pure function
 *
 * Strategy:
 *   - No mocks needed — these are pure functions with no I/O.
 *   - All dates anchored to 2026-05-22 to match the task spec.
 *   - Each test follows strict AAA layout.
 */

import { calculateStreak } from '@/lib/rpg/habit'

// ─── Fixed date anchor ────────────────────────────────────────────────────────

const TODAY       = '2026-05-22'
const YESTERDAY   = '2026-05-21'
const TWO_AGO     = '2026-05-20'
const THREE_AGO   = '2026-05-19'
const FOUR_AGO    = '2026-05-18'
const FIVE_AGO    = '2026-05-17'
const SIX_AGO     = '2026-05-16'
const SEVEN_AGO   = '2026-05-15'

// ─── calculateStreak ──────────────────────────────────────────────────────────

describe('calculateStreak', () => {

  // ── First check-in (empty log) ─────────────────────────────────────────────

  describe('first check-in — empty completion log', () => {
    it('returns streak=1 when log is empty and currentStreak is 0', () => {
      // Arrange
      const completionLog: string[] = []
      const currentStreak = 0

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('returns wasFreezed=false on the very first check-in', () => {
      // Arrange & Act
      const result = calculateStreak([], TODAY, 0)

      // Assert
      expect(result.wasFreezed).toBe(false)
    })
  })

  // ── Consecutive day — streak increments ────────────────────────────────────

  describe('consecutive day — yesterday present in log', () => {
    it('increments streak by 1 when yesterday was completed', () => {
      // Arrange
      const completionLog = [YESTERDAY]
      const currentStreak = 1

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(2)
      expect(result.wasFreezed).toBe(false)
    })

    it('continues a long streak when all consecutive days are logged', () => {
      // Arrange
      const completionLog = [TWO_AGO, YESTERDAY]
      const currentStreak = 2

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(3)
      expect(result.wasFreezed).toBe(false)
    })

    it('increments a streak of 10 to 11', () => {
      // Arrange
      const completionLog = [YESTERDAY]
      const currentStreak = 10

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(11)
      expect(result.wasFreezed).toBe(false)
    })

    it('does not set wasFreezed when yesterday is present', () => {
      // Arrange & Act
      const result = calculateStreak([YESTERDAY], TODAY, 5)

      // Assert
      expect(result.wasFreezed).toBe(false)
    })
  })

  // ── Streak reset — more than one missed day ────────────────────────────────

  describe('streak reset — 2+ days missed', () => {
    it('resets streak to 1 when yesterday and day-before-yesterday are both missing', () => {
      // Arrange — last check-in was 3 days ago
      const completionLog = [THREE_AGO, FOUR_AGO]
      const currentStreak = 5

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('resets streak to 1 when 2 consecutive days missed in the 7-day window', () => {
      // Arrange — yesterday AND two-days-ago missing, older days present
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, THREE_AGO]
      const currentStreak = 4

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('resets to 1 even when currentStreak is large', () => {
      // Arrange
      const completionLog = [SEVEN_AGO] // 7 days ago — outside the 6-day window
      const currentStreak = 30

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('resets to 1 when the log is empty regardless of currentStreak', () => {
      // Arrange
      const currentStreak = 15

      // Act
      const result = calculateStreak([], TODAY, currentStreak)

      // Assert — no freeze because all 6 prior days are missed (missedDays.length !== 1)
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })
  })

  // ── Streak freeze — exactly 1 missed day in 7-day window ──────────────────

  describe('streak freeze — exactly 1 missed day in window', () => {
    it('applies freeze when yesterday is the only missed day in the 7-day window', () => {
      // Arrange — yesterday missed, all other 5 prior days present
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, THREE_AGO, TWO_AGO]
      const currentStreak = 5

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(6)
      expect(result.wasFreezed).toBe(true)
    })

    it('does NOT apply freeze path when yesterday is present (path 1 fires first)', () => {
      // Arrange — three_ago missing but yesterday IS present, so path 1 (consecutive day)
      // fires before the freeze check is ever reached.
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, TWO_AGO, YESTERDAY]
      const currentStreak = 5

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert — normal consecutive increment, wasFreezed is false because path 1 matched
      expect(result.newStreak).toBe(6)
      expect(result.wasFreezed).toBe(false)
    })

    it('does NOT apply freeze when currentStreak is 0 (no active streak to protect)', () => {
      // Arrange — exactly 1 day missed but streak is 0
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, THREE_AGO, TWO_AGO]
      const currentStreak = 0

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert — freeze requires an existing streak > 0
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('does NOT apply freeze when 2 days are missed in the window', () => {
      // Arrange — yesterday AND two-days-ago both missed
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, THREE_AGO]
      const currentStreak = 4

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })

    it('does NOT apply freeze when all 6 days in the window are missed', () => {
      // Arrange — only a day from 7 days ago; everything in the window is missed
      const completionLog = [SEVEN_AGO]
      const currentStreak = 1

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('ignores duplicate dates in completionLog when checking yesterday', () => {
      // Arrange — yesterday appears twice (defensive)
      const completionLog = [YESTERDAY, YESTERDAY]
      const currentStreak = 3

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert — yesterday is present so normal increment applies
      expect(result.newStreak).toBe(4)
      expect(result.wasFreezed).toBe(false)
    })

    it('treats currentStreak=1 as enough to enable freeze on exactly 1 missed day', () => {
      // Arrange — minimal active streak
      const completionLog = [SIX_AGO, FIVE_AGO, FOUR_AGO, THREE_AGO, TWO_AGO]
      const currentStreak = 1

      // Act
      const result = calculateStreak(completionLog, TODAY, currentStreak)

      // Assert
      expect(result.newStreak).toBe(2)
      expect(result.wasFreezed).toBe(true)
    })

    it('returns a plain object with exactly newStreak and wasFreezed fields', () => {
      // Arrange & Act
      const result = calculateStreak([], TODAY, 0)

      // Assert — shape check
      expect(typeof result.newStreak).toBe('number')
      expect(typeof result.wasFreezed).toBe('boolean')
    })

    it('handles a log with many old dates (older than the 7-day window) gracefully', () => {
      // Arrange — lots of old entries, none in the recent window
      const oldDates = ['2026-01-01', '2026-02-15', '2026-03-10']
      const currentStreak = 3

      // Act
      const result = calculateStreak(oldDates, TODAY, currentStreak)

      // Assert — no recent days in window, so streak resets
      expect(result.newStreak).toBe(1)
      expect(result.wasFreezed).toBe(false)
    })
  })
})
