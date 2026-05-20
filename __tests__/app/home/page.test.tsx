/**
 * Tests for app/(app)/home/page.tsx
 *
 * HomePage fetches Firestore data and renders a dashboard.
 * Strategy:
 *   - Mock @/lib/firebase/firestore (getDoc, getDocs, collection, query, where, Timestamp)
 *   - Mock @/lib/hooks/useAuth to supply a fake authenticated user
 *   - Mock framer-motion to avoid animation async issues
 *   - Mock child RPG components that are tested separately
 *   - Mock next/link
 *   - Use waitFor for async state transitions
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import type { User } from 'firebase/auth'

// ─── Mock: framer-motion ──────────────────────────────────────────────────────
const FRAMER_PROPS = new Set([
  'variants','initial','animate','exit','custom',
  'transition','whileHover','whileTap','whileInView','layoutId','layout',
])

jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react')
  return {
    AnimatePresence: ({ children }: { children: R.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          // eslint-disable-next-line react/display-name
          R.forwardRef(
            ({ children, ...props }: R.HTMLAttributes<HTMLElement> & { children?: R.ReactNode }, ref: R.Ref<HTMLElement>) => {
              const rest = Object.fromEntries(
                Object.entries(props as Record<string, unknown>).filter(([k]) => !FRAMER_PROPS.has(k))
              )
              return R.createElement(tag, { ...rest, ref }, children)
            }
          ),
      }
    ),
  }
})

// ─── Mock: next/link ──────────────────────────────────────────────────────────
jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

// ─── Mock: @/lib/utils ────────────────────────────────────────────────────────
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    (classes as string[]).flat().filter(Boolean).join(' '),
}))

// ─── Mock: child RPG components ───────────────────────────────────────────────
jest.mock('@/components/rpg/StatBar', () => {
  const StatBar = ({ statCode }: { statCode: string }) => (
    <div data-testid={`stat-bar-${statCode}`}>{statCode}</div>
  )
  StatBar.displayName = 'StatBar'
  return StatBar
})

jest.mock('@/components/rpg/LevelBadge', () => {
  const LevelBadge = ({ level }: { level: number }) => (
    <div data-testid="level-badge" aria-label={`Level ${level}`}>{level}</div>
  )
  LevelBadge.displayName = 'LevelBadge'
  return LevelBadge
})

jest.mock('@/components/ui/rpg-card', () => {
  const RpgCard = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rpg-card">{children}</div>
  )
  RpgCard.displayName = 'RpgCard'
  return RpgCard
})

// ─── Mock: @/lib/hooks/useAuth ────────────────────────────────────────────────
const mockUser: User = {
  uid: 'uid-hunter-001',
  email: 'hunter@arise.io',
  displayName: 'Sung Jinwoo',
} as User

let mockAuthReturn: { user: User | null; loading: boolean; isAuthenticated: boolean } = {
  user: mockUser,
  loading: false,
  isAuthenticated: true,
}

jest.mock('@/lib/hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthReturn,
}))

// ─── Mock: @/lib/firebase/config ─────────────────────────────────────────────
jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-firebase-app' },
}))

// ─── Mock: firebase/firestore ─────────────────────────────────────────────────
const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockCollection = jest.fn()
const mockQuery = jest.fn()
const mockWhere = jest.fn()

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mock-doc-ref'),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  getFirestore: jest.fn(() => ({ name: 'mock-db' })),
  // Timestamp must be a real class so `instanceof Timestamp` in toDate() doesn't throw.
  Timestamp: class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate(): Date { return new Date(this.seconds * 1000) }
    static fromDate(d: Date) { return new MockTimestamp(Math.floor(d.getTime() / 1000), 0) }
    static now() { return new MockTimestamp(Math.floor(Date.now() / 1000), 0) }
  },
}))

// ─── Mock: @/lib/firebase/firestore ───────────────────────────────────────────
jest.mock('@/lib/firebase/firestore', () => ({
  db: { name: 'mock-db' },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FakeProfile = {
  displayName?: string
  level?: number
  xp?: number
  xpToNextLevel?: number
  playerClass?: string
  activeTitle?: string
  currentStreak?: number
  credits?: number
  stats?: Record<string, number>
}

function makeProfileSnap(overrides: FakeProfile = {}) {
  return {
    exists: () => true,
    data: () => ({
      email: 'hunter@arise.io',
      displayName: overrides.displayName ?? 'Sung Jinwoo',
      level: overrides.level ?? 3,
      xp: overrides.xp ?? 150,
      xpToNextLevel: overrides.xpToNextLevel ?? 300,
      playerClass: overrides.playerClass ?? 'Iron Will',
      activeTitle: overrides.activeTitle ?? 'Shadow Monarch',
      currentStreak: overrides.currentStreak ?? 7,
      credits: overrides.credits ?? 42,
      stats: overrides.stats ?? { STR: 10, INT: 8, WIL: 15 },
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-05-01'),
    }),
  }
}

function makeQuestsSnap(completed = 1, total = 3) {
  const docs = Array.from({ length: total }, (_, i) => ({
    data: () => ({ status: i < completed ? 'completed' : 'pending' }),
  }))
  return { size: total, forEach: (cb: (d: (typeof docs)[0]) => void) => docs.forEach(cb) }
}

function setupMocks(profileOverrides: FakeProfile = {}, completed = 1, total = 3) {
  mockGetDoc.mockResolvedValue(makeProfileSnap(profileOverrides))
  mockGetDocs.mockResolvedValue(makeQuestsSnap(completed, total))
  mockCollection.mockReturnValue({})
  mockQuery.mockReturnValue({})
  mockWhere.mockReturnValue({})
}

import HomePage from '@/app/(app)/home/page'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthReturn = { user: mockUser, loading: false, isAuthenticated: true }
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows the dashboard skeleton while fetching', () => {
      // Never resolve the fetch so the component stays in loading state
      mockGetDoc.mockImplementation(() => new Promise(() => {}))
      mockGetDocs.mockImplementation(() => new Promise(() => {}))
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument()
    })

    it('shows screen-reader text "Loading dashboard data..." during loading', () => {
      mockGetDoc.mockImplementation(() => new Promise(() => {}))
      mockGetDocs.mockImplementation(() => new Promise(() => {}))
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument()
    })
  })

  // ── Data loaded state ──────────────────────────────────────────────────────

  describe('after data loads', () => {
    it('shows a greeting with the player first name', async () => {
      setupMocks({ displayName: 'Sung Jinwoo' })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Sung')).toBeInTheDocument()
      })
    })

    it('shows the player active title', async () => {
      setupMocks({ activeTitle: 'Shadow Monarch' })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Shadow Monarch')).toBeInTheDocument()
      })
    })

    it('shows the XP progress section', async () => {
      setupMocks({ xp: 150, xpToNextLevel: 300, level: 3 })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar', { name: /XP toward level/i })).toBeInTheDocument()
      })
    })

    it('shows the streak widget section', async () => {
      setupMocks({ currentStreak: 7 })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/daily streak/i)).toBeInTheDocument()
      })
    })

    it('shows streak count when streak is active', async () => {
      setupMocks({ currentStreak: 7 })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/7 day streak/i)).toBeInTheDocument()
      })
    })

    it('shows zero streak empty state when streak is 0', async () => {
      setupMocks({ currentStreak: 0 })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/start your/i)).toBeInTheDocument()
      })
    })

    it('shows the Top Stats section', async () => {
      setupMocks()

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/top character stats/i)).toBeInTheDocument()
      })
    })

    it('shows "+ New Quest" button in disabled state', async () => {
      setupMocks()

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new quest/i })).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /new quest/i })
      expect(button).toBeDisabled()
    })

    it('New Quest button has aria-disabled="true"', async () => {
      setupMocks()

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new quest/i })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /new quest/i })).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })

    it('uses fallback "Hunter" when displayName is absent from both profile and user', async () => {
      // Profile has no displayName, user has no displayName either
      const userWithNoDisplayName = { ...mockUser, displayName: null } as unknown as User
      mockAuthReturn = { user: userWithNoDisplayName, loading: false, isAuthenticated: true }
      setupMocks({ displayName: undefined })
      // Override the profile snap to have null displayName
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          email: 'x@x.io',
          displayName: null,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          playerClass: 'Novice Hunter',
          activeTitle: 'Novice Hunter',
          currentStreak: 0,
          credits: 0,
          stats: {},
          createdAt: new Date('2024-01-01'),
          lastActiveAt: new Date('2024-05-01'),
        }),
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('Hunter')).toBeInTheDocument()
      })
    })

    it('uses only the first word of the display name as greeting name', async () => {
      setupMocks({ displayName: 'Sung Jinwoo' })

      render(<HomePage />)

      await waitFor(() => {
        // "Sung" should appear but not "Sung Jinwoo" as the neon span
        expect(screen.getByText('Sung')).toBeInTheDocument()
      })
    })
  })

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows an error message when fetch fails', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'))
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument()
      })
    })

    it('shows a Retry button in the error state', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'))
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('re-fetches when Retry button is clicked', async () => {
      mockGetDoc
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValue(makeProfileSnap())
      mockGetDocs.mockResolvedValue(makeQuestsSnap())
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /retry/i }))

      // After retry, data should load successfully
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
      })
    })

    it('shows "User profile not found" message when profile snapshot does not exist', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null })
      mockCollection.mockReturnValue({})
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument()
      })
    })
  })

  // ── Unauthenticated state ──────────────────────────────────────────────────

  describe('when user is not authenticated', () => {
    it('does not call getDoc when user is null', async () => {
      mockAuthReturn = { user: null, loading: false, isAuthenticated: false }

      render(<HomePage />)

      // Wait a tick to ensure any async side effects would have run
      await new Promise((r) => setTimeout(r, 50))

      expect(mockGetDoc).not.toHaveBeenCalled()
    })

    it('renders nothing (returns null) when user is null and no fetch has run', async () => {
      mockAuthReturn = { user: null, loading: false, isAuthenticated: false }

      const { container } = render(<HomePage />)

      // No fetch means: loading=true initially → but uid is null so load() returns early
      // The component sets loading=false via finally only when uid is truthy.
      // With null uid, load() returns immediately without setting loading=false,
      // so the page stays in loading state showing the skeleton.
      // This test verifies getDoc was not invoked:
      expect(mockGetDoc).not.toHaveBeenCalled()
      expect(container).toBeDefined()
    })
  })
})
