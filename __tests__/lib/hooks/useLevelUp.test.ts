/**
 * Tests for lib/hooks/useLevelUp.ts
 *
 * useLevelUp listens to Firestore for level changes and calls triggerLevelUp
 * via the UIStore when the level increases.
 *
 * Strategy:
 *   - Mock firebase/firestore: onSnapshot, doc
 *   - Mock @/lib/firebase/firestore: db
 *   - Mock @/lib/hooks/useAuth to control the user
 *   - Mock @/lib/store/uiStore to spy on triggerLevelUp
 *   - Simulate snapshot callbacks manually for full control
 */

import { renderHook, act } from '@testing-library/react'
import type { User } from 'firebase/auth'

// ─── Mock: @/lib/firebase/config ─────────────────────────────────────────────
jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-firebase-app' },
}))

// ─── Mock: firebase/firestore ─────────────────────────────────────────────────
// We capture the snapshot callback so tests can fire it manually
let capturedSnapshotCallback: ((snap: MockSnapshot) => void) | null = null
const mockUnsubscribe = jest.fn()
const mockOnSnapshot = jest.fn()
const mockDoc = jest.fn(() => 'mock-doc-ref')

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getFirestore: jest.fn(() => ({ name: 'mock-db' })),
}))

// ─── Mock: @/lib/firebase/firestore ───────────────────────────────────────────
jest.mock('@/lib/firebase/firestore', () => ({
  db: { name: 'mock-db' },
}))

// ─── Mock: @/lib/hooks/useAuth ────────────────────────────────────────────────
type AuthReturn = { user: User | null; loading: boolean; isAuthenticated: boolean }
let mockAuthValue: AuthReturn = {
  user: { uid: 'uid-hunter-001', email: 'x@arise.io', displayName: 'Hunter' } as User,
  loading: false,
  isAuthenticated: true,
}

jest.mock('@/lib/hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthValue,
}))

// ─── Mock: @/lib/store/uiStore ────────────────────────────────────────────────
const mockTriggerLevelUp = jest.fn()
const mockDismissLevelUp = jest.fn()
let mockLevelUpEvent: unknown = null

// The hook calls useUIStore.getState().triggerLevelUp(...) to avoid dep churn.
// We must expose getState as a static method on the useUIStore mock function.
jest.mock('@/lib/store/uiStore', () => {
  // Build the hook function — called as useUIStore(selector)
  const useUIStore = (selector: (s: { dismissLevelUp: typeof mockDismissLevelUp; levelUpEvent: unknown }) => unknown) => {
    if (typeof selector === 'function') {
      return selector({ dismissLevelUp: mockDismissLevelUp, levelUpEvent: mockLevelUpEvent })
    }
    return { dismissLevelUp: mockDismissLevelUp, levelUpEvent: mockLevelUpEvent }
  }

  // Attach getState as a static method (Zustand store API)
  useUIStore.getState = () => ({ triggerLevelUp: mockTriggerLevelUp })

  return { useUIStore }
})

// ─── Type helpers ─────────────────────────────────────────────────────────────

interface MockSnapshot {
  exists: () => boolean
  data: () => Record<string, unknown>
}

function makeSnapshot(level: number): MockSnapshot {
  return {
    exists: () => true,
    data: () => ({ level, xp: 0 }),
  }
}

function makeEmptySnapshot(): MockSnapshot {
  return {
    exists: () => false,
    data: () => ({}),
  }
}

// ─── Import after mocks ────────────────────────────────────────────────────────
import useLevelUp from '@/lib/hooks/useLevelUp'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  capturedSnapshotCallback = null
  mockLevelUpEvent = null
  mockAuthValue = {
    user: { uid: 'uid-hunter-001', email: 'x@arise.io', displayName: 'Hunter' } as User,
    loading: false,
    isAuthenticated: true,
  }

  // Configure onSnapshot to capture the callback and return the unsubscribe mock
  mockOnSnapshot.mockImplementation(
    (_ref: unknown, successCb: (snap: MockSnapshot) => void) => {
      capturedSnapshotCallback = successCb
      return mockUnsubscribe
    }
  )
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useLevelUp', () => {
  // ── Initial snapshot — must NOT trigger level-up ───────────────────────────

  describe('initial snapshot (first load)', () => {
    it('does not call triggerLevelUp on the first snapshot', () => {
      renderHook(() => useLevelUp())

      // Fire first snapshot
      act(() => {
        capturedSnapshotCallback?.(makeSnapshot(4))
      })

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })

    it('sets the internal prevLevelRef to the initial level on first snapshot', () => {
      renderHook(() => useLevelUp())

      act(() => {
        capturedSnapshotCallback?.(makeSnapshot(4))
      })

      // No trigger yet — the ref was just initialized
      expect(mockTriggerLevelUp).not.toHaveBeenCalled()

      // Second snapshot with same level → still no trigger
      act(() => {
        capturedSnapshotCallback?.(makeSnapshot(4))
      })

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })
  })

  // ── Level increases ────────────────────────────────────────────────────────

  describe('when level increases', () => {
    it('calls triggerLevelUp when level increases from 4 to 5', () => {
      renderHook(() => useLevelUp())

      // First snapshot — set initial level
      act(() => {
        capturedSnapshotCallback?.(makeSnapshot(4))
      })

      // Second snapshot — level increased
      act(() => {
        capturedSnapshotCallback?.(makeSnapshot(5))
      })

      expect(mockTriggerLevelUp).toHaveBeenCalledTimes(1)
    })

    it('calls triggerLevelUp with the correct newLevel', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(5)) })

      expect(mockTriggerLevelUp).toHaveBeenCalledWith(
        expect.objectContaining({ newLevel: 5 })
      )
    })

    it('calls triggerLevelUp with statsGained as an object', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(5)) })

      expect(mockTriggerLevelUp).toHaveBeenCalledWith(
        expect.objectContaining({ statsGained: expect.any(Object) })
      )
    })

    it('triggers for a large level jump (e.g. 1 to 10)', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(1)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(10)) })

      expect(mockTriggerLevelUp).toHaveBeenCalledWith(
        expect.objectContaining({ newLevel: 10 })
      )
    })
  })

  // ── Level stays the same ───────────────────────────────────────────────────

  describe('when level does not increase', () => {
    it('does not call triggerLevelUp when level stays the same', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })

    it('does not call triggerLevelUp when level decreases', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(5)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) }) // level went down

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })
  })

  // ── Multiple level-up events ───────────────────────────────────────────────

  describe('multiple snapshots', () => {
    it('triggers triggerLevelUp for each level increase in sequence', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(3)) }) // initial
      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) }) // +1 → trigger
      act(() => { capturedSnapshotCallback?.(makeSnapshot(5)) }) // +1 → trigger

      expect(mockTriggerLevelUp).toHaveBeenCalledTimes(2)
    })

    it('correctly reports newLevel=4 then newLevel=5', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(3)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })
      act(() => { capturedSnapshotCallback?.(makeSnapshot(5)) })

      expect(mockTriggerLevelUp).toHaveBeenNthCalledWith(
        1, expect.objectContaining({ newLevel: 4 })
      )
      expect(mockTriggerLevelUp).toHaveBeenNthCalledWith(
        2, expect.objectContaining({ newLevel: 5 })
      )
    })
  })

  // ── Empty / non-existent snapshot ─────────────────────────────────────────

  describe('when snapshot does not exist', () => {
    it('does not trigger when snapshot.exists() is false', () => {
      renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeEmptySnapshot()) })
      act(() => { capturedSnapshotCallback?.(makeEmptySnapshot()) })

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })
  })

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  describe('cleanup on unmount', () => {
    it('calls unsubscribe when the component unmounts', () => {
      const { unmount } = renderHook(() => useLevelUp())

      // Fire initial snapshot to confirm listener is registered
      act(() => { capturedSnapshotCallback?.(makeSnapshot(3)) })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes exactly once on unmount', () => {
      const { unmount } = renderHook(() => useLevelUp())

      act(() => { capturedSnapshotCallback?.(makeSnapshot(4)) })

      unmount()

      // Only one unsubscribe call, not multiple
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  // ── No user ───────────────────────────────────────────────────────────────

  describe('when user is not authenticated', () => {
    it('does not subscribe to Firestore when user is null', () => {
      mockAuthValue = { user: null, loading: false, isAuthenticated: false }

      renderHook(() => useLevelUp())

      expect(mockOnSnapshot).not.toHaveBeenCalled()
    })

    it('does not call triggerLevelUp when user is null', () => {
      mockAuthValue = { user: null, loading: false, isAuthenticated: false }

      renderHook(() => useLevelUp())

      expect(mockTriggerLevelUp).not.toHaveBeenCalled()
    })
  })

  // ── Return value ──────────────────────────────────────────────────────────

  describe('return value', () => {
    it('returns levelUpEvent from the store', () => {
      const { result } = renderHook(() => useLevelUp())

      expect(result.current.levelUpEvent).toBe(mockLevelUpEvent)
    })

    it('returns dismissLevelUp function from the store', () => {
      const { result } = renderHook(() => useLevelUp())

      expect(result.current.dismissLevelUp).toBe(mockDismissLevelUp)
    })
  })

  // ── Firestore subscription ────────────────────────────────────────────────

  describe('Firestore subscription setup', () => {
    it('calls onSnapshot with the user doc ref when user is present', () => {
      renderHook(() => useLevelUp())

      expect(mockOnSnapshot).toHaveBeenCalledTimes(1)
    })

    it('passes the user uid to the doc reference', () => {
      renderHook(() => useLevelUp())

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'uid-hunter-001'
      )
    })
  })
})
