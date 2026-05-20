/**
 * Tests for lib/store/uiStore.ts
 *
 * useUIStore is a Zustand store with devtools middleware.
 * Strategy: use the store directly via renderHook and Zustand's setState API.
 * We test observable state transitions, not internal devtools plumbing.
 */

import { act, renderHook } from '@testing-library/react'
import { useUIStore } from '@/lib/store/uiStore'
import type { LevelUpEvent } from '@/lib/store/uiStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLevelUpEvent(overrides?: Partial<LevelUpEvent>): LevelUpEvent {
  return {
    newLevel: 5,
    statsGained: { STR: 2 },
    ...overrides,
  }
}

// Reset store to initial state after every test so tests stay independent
afterEach(() => {
  useUIStore.setState({ levelUpEvent: null })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useUIStore', () => {
  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('levelUpEvent is null on first render', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.levelUpEvent).toBeNull()
    })

    it('exposes triggerLevelUp action', () => {
      const { result } = renderHook(() => useUIStore())
      expect(typeof result.current.triggerLevelUp).toBe('function')
    })

    it('exposes dismissLevelUp action', () => {
      const { result } = renderHook(() => useUIStore())
      expect(typeof result.current.dismissLevelUp).toBe('function')
    })
  })

  // ── triggerLevelUp ─────────────────────────────────────────────────────────

  describe('triggerLevelUp', () => {
    it('sets levelUpEvent with the provided newLevel', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp({ newLevel: 5, statsGained: { STR: 2 } })
      })

      expect(result.current.levelUpEvent?.newLevel).toBe(5)
    })

    it('sets levelUpEvent with the provided statsGained', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp({ newLevel: 5, statsGained: { STR: 2 } })
      })

      expect(result.current.levelUpEvent?.statsGained).toEqual({ STR: 2 })
    })

    it('stores the entire LevelUpEvent object correctly', () => {
      const event = makeLevelUpEvent({ newLevel: 10, statsGained: { STR: 3, VIT: 1 } })
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp(event)
      })

      expect(result.current.levelUpEvent).toEqual(event)
    })

    it('overwrites a previous event when triggered again', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp({ newLevel: 3, statsGained: {} })
      })
      act(() => {
        result.current.triggerLevelUp({ newLevel: 7, statsGained: { INT: 5 } })
      })

      expect(result.current.levelUpEvent?.newLevel).toBe(7)
      expect(result.current.levelUpEvent?.statsGained).toEqual({ INT: 5 })
    })

    it('works with an empty statsGained object', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp({ newLevel: 2, statsGained: {} })
      })

      expect(result.current.levelUpEvent).toEqual({ newLevel: 2, statsGained: {} })
    })

    it('works with multiple stat gains simultaneously', () => {
      const { result } = renderHook(() => useUIStore())
      const statsGained = { STR: 2, VIT: 1, WIL: 3 }

      act(() => {
        result.current.triggerLevelUp({ newLevel: 6, statsGained })
      })

      expect(result.current.levelUpEvent?.statsGained).toEqual(statsGained)
    })
  })

  // ── dismissLevelUp ─────────────────────────────────────────────────────────

  describe('dismissLevelUp', () => {
    it('resets levelUpEvent to null', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.triggerLevelUp({ newLevel: 5, statsGained: { STR: 2 } })
      })
      act(() => {
        result.current.dismissLevelUp()
      })

      expect(result.current.levelUpEvent).toBeNull()
    })

    it('is a no-op when levelUpEvent is already null', () => {
      const { result } = renderHook(() => useUIStore())

      // Should not throw
      act(() => {
        result.current.dismissLevelUp()
      })

      expect(result.current.levelUpEvent).toBeNull()
    })
  })

  // ── trigger/dismiss cycles ─────────────────────────────────────────────────

  describe('multiple trigger/dismiss cycles', () => {
    it('can trigger, dismiss, then trigger again correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // First cycle
      act(() => {
        result.current.triggerLevelUp({ newLevel: 5, statsGained: { STR: 2 } })
      })
      expect(result.current.levelUpEvent?.newLevel).toBe(5)

      act(() => {
        result.current.dismissLevelUp()
      })
      expect(result.current.levelUpEvent).toBeNull()

      // Second cycle
      act(() => {
        result.current.triggerLevelUp({ newLevel: 6, statsGained: { INT: 1 } })
      })
      expect(result.current.levelUpEvent?.newLevel).toBe(6)

      act(() => {
        result.current.dismissLevelUp()
      })
      expect(result.current.levelUpEvent).toBeNull()
    })

    it('handles three consecutive cycles without state leakage', () => {
      const { result } = renderHook(() => useUIStore())
      const levels = [2, 5, 9]

      for (const level of levels) {
        act(() => {
          result.current.triggerLevelUp({ newLevel: level, statsGained: {} })
        })
        expect(result.current.levelUpEvent?.newLevel).toBe(level)

        act(() => {
          result.current.dismissLevelUp()
        })
        expect(result.current.levelUpEvent).toBeNull()
      }
    })
  })

  // ── Selector API ───────────────────────────────────────────────────────────

  describe('selector-based access', () => {
    it('levelUpEvent selector returns null initially', () => {
      const { result } = renderHook(() => useUIStore((s) => s.levelUpEvent))
      expect(result.current).toBeNull()
    })

    it('levelUpEvent selector returns event after triggerLevelUp', () => {
      const event = makeLevelUpEvent()
      // Trigger from the full store hook, read via selector hook
      const { result: fullStore } = renderHook(() => useUIStore())
      const { result: selector } = renderHook(() => useUIStore((s) => s.levelUpEvent))

      act(() => {
        fullStore.current.triggerLevelUp(event)
      })

      expect(selector.current).toEqual(event)
    })
  })
})
