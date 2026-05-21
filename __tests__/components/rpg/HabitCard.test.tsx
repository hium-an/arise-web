/**
 * Tests for components/rpg/HabitCard.tsx
 *
 * Strategy:
 *   - Mock framer-motion with a Proxy (same pattern as QuestCard.test.tsx)
 *   - Mock @/components/ui/rpg-card to a plain div with data-testid
 *   - Mock @/lib/utils cn
 *   - Test render, interactions, state-based content and accessibility
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Habit } from '@/types'

// ─── Mock: framer-motion ──────────────────────────────────────────────────────
// Strips animation props so the underlying HTML elements render cleanly in jsdom.

const FRAMER_PROPS = new Set([
  'variants', 'initial', 'animate', 'exit', 'custom',
  'transition', 'whileHover', 'whileTap', 'whileInView', 'layoutId', 'layout',
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
            (
              { children, ...props }: R.HTMLAttributes<HTMLElement> & { children?: R.ReactNode },
              ref: R.Ref<HTMLElement>
            ) => {
              const rest = Object.fromEntries(
                Object.entries(props as Record<string, unknown>).filter(
                  ([k]) => !FRAMER_PROPS.has(k)
                )
              )
              return R.createElement(tag, { ...rest, ref }, children)
            }
          ),
      }
    ),
  }
})

// ─── Mock: @/components/ui/rpg-card ──────────────────────────────────────────

jest.mock('@/components/ui/rpg-card', () => {
  const RpgCard = ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
    glow?: string
    padding?: string
  }) => (
    <div data-testid="rpg-card" className={className}>
      {children}
    </div>
  )
  RpgCard.displayName = 'RpgCard'
  return RpgCard
})

// ─── Mock: @/lib/utils ────────────────────────────────────────────────────────

jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    (classes as string[]).flat().filter(Boolean).join(' '),
}))

// ─── Import component under test ──────────────────────────────────────────────

import HabitCard from '@/components/rpg/HabitCard'

// ─── Date helpers ─────────────────────────────────────────────────────────────
// Use ISO slice (YYYY-MM-DD) to match the component's own todayStr logic.

const TODAY     = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

// ─── Habit factory ────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    title: 'Morning Run',
    domain: 'physical',
    frequency: 'daily',
    statGains: { STR: 1 },
    streak: 3,
    longestStreak: 5,
    completionLog: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// ─── Render helper ────────────────────────────────────────────────────────────

function renderCard(
  habitOverrides: Partial<Habit> = {},
  props: Partial<React.ComponentProps<typeof HabitCard>> = {}
) {
  const habit = makeHabit(habitOverrides)
  return render(
    <HabitCard
      habit={habit}
      onToggle={jest.fn()}
      onDelete={jest.fn()}
      isToggling={false}
      {...props}
    />
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HabitCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Renders basic content ──────────────────────────────────────────────────

  describe('renders basic content', () => {
    it('renders the habit title', () => {
      // Arrange & Act
      renderCard({ title: 'Read 30 Pages' })

      // Assert
      expect(screen.getByText('Read 30 Pages')).toBeInTheDocument()
    })

    it('renders the rpg-card container', () => {
      // Arrange & Act
      renderCard()

      // Assert
      expect(screen.getByTestId('rpg-card')).toBeInTheDocument()
    })

    it('renders the description when provided', () => {
      // Arrange & Act
      renderCard({ description: 'Every morning before breakfast' })

      // Assert
      expect(screen.getByText('Every morning before breakfast')).toBeInTheDocument()
    })

    it('does not render a description element when description is absent', () => {
      // Arrange & Act
      renderCard({ description: undefined })

      // Assert
      expect(screen.queryByText('Every morning before breakfast')).not.toBeInTheDocument()
    })
  })

  // ── Frequency badge ────────────────────────────────────────────────────────

  describe('frequency badge', () => {
    it('renders "DAILY" badge when frequency is "daily"', () => {
      // Arrange & Act
      renderCard({ frequency: 'daily' })

      // Assert
      expect(screen.getByText('DAILY')).toBeInTheDocument()
    })

    it('renders "WEEKLY" badge when frequency is "weekly"', () => {
      // Arrange & Act
      renderCard({ frequency: 'weekly' })

      // Assert
      expect(screen.getByText('WEEKLY')).toBeInTheDocument()
    })
  })

  // ── Streak counter ─────────────────────────────────────────────────────────

  describe('streak counter', () => {
    it('renders the streak number', () => {
      // Arrange & Act
      renderCard({ streak: 7 })

      // Assert — the streak number must appear as text content
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('renders streak=0 when habit has no streak', () => {
      // Arrange & Act
      renderCard({ streak: 0 })

      // Assert
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('has aria-label containing the streak count', () => {
      // Arrange & Act
      renderCard({ streak: 5 })

      // Assert — the wrapper div has aria-label="Streak: 5 days"
      expect(screen.getByLabelText(/streak: 5/i)).toBeInTheDocument()
    })

    it('uses "day" (singular) in aria-label when streak is 1', () => {
      // Arrange & Act
      renderCard({ streak: 1 })

      // Assert
      expect(screen.getByLabelText(/streak: 1 day$/i)).toBeInTheDocument()
    })

    it('uses "days" (plural) in aria-label when streak is 2 or more', () => {
      // Arrange & Act
      renderCard({ streak: 2 })

      // Assert
      expect(screen.getByLabelText(/streak: 2 days/i)).toBeInTheDocument()
    })
  })

  // ── Domain icon ────────────────────────────────────────────────────────────

  describe('domain icon', () => {
    it('renders the physical domain icon with correct aria-label', () => {
      // Arrange & Act
      renderCard({ domain: 'physical' })

      // Assert
      expect(screen.getByRole('img', { name: /physical/i })).toBeInTheDocument()
    })

    it('renders the mental domain icon with correct aria-label', () => {
      // Arrange & Act
      renderCard({ domain: 'mental' })

      // Assert
      expect(screen.getByRole('img', { name: /mental/i })).toBeInTheDocument()
    })

    it('renders the financial domain icon with correct aria-label', () => {
      // Arrange & Act
      renderCard({ domain: 'financial' })

      // Assert
      expect(screen.getByRole('img', { name: /financial/i })).toBeInTheDocument()
    })

    it('renders the social domain icon with correct aria-label', () => {
      // Arrange & Act
      renderCard({ domain: 'social' })

      // Assert
      expect(screen.getByRole('img', { name: /social/i })).toBeInTheDocument()
    })

    it('renders the discipline domain icon with correct aria-label', () => {
      // Arrange & Act
      renderCard({ domain: 'discipline' })

      // Assert
      expect(screen.getByRole('img', { name: /discipline/i })).toBeInTheDocument()
    })
  })

  // ── Check In button — not yet completed ───────────────────────────────────

  describe('Check In button — habit not completed today', () => {
    it('shows the "Check In" button when habit is not completed today', () => {
      // Arrange — completionLog has no entry for today
      renderCard({ completionLog: [YESTERDAY] })

      // Assert
      expect(screen.getByText('Check In')).toBeInTheDocument()
    })

    it('calls onToggle with the habit id when "Check In" is clicked', () => {
      // Arrange
      const onToggle = jest.fn()
      renderCard(
        { id: 'habit-abc', completionLog: [] },
        { onToggle }
      )

      // Act
      fireEvent.click(screen.getByText('Check In'))

      // Assert
      expect(onToggle).toHaveBeenCalledTimes(1)
      expect(onToggle).toHaveBeenCalledWith('habit-abc')
    })

    it('does not render the Check In button when onToggle is not provided', () => {
      // Arrange & Act
      const habit = makeHabit({ completionLog: [] })
      render(<HabitCard habit={habit} />)

      // Assert
      expect(screen.queryByText('Check In')).not.toBeInTheDocument()
    })

    it('has aria-label containing the habit title on the Check In button', () => {
      // Arrange & Act
      renderCard({ title: 'Morning Run', completionLog: [] })

      // Assert
      expect(
        screen.getByRole('button', { name: /check in habit: morning run/i })
      ).toBeInTheDocument()
    })

    it('disables the Check In button when isToggling=true', () => {
      // Arrange & Act
      renderCard(
        { completionLog: [] },
        { isToggling: true }
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /check in habit/i })
      ).toBeDisabled()
    })

    it('does not call onToggle when the button is disabled (isToggling=true)', () => {
      // Arrange
      const onToggle = jest.fn()
      renderCard(
        { completionLog: [] },
        { onToggle, isToggling: true }
      )

      // Act
      fireEvent.click(screen.getByRole('button', { name: /check in habit/i }))

      // Assert
      expect(onToggle).not.toHaveBeenCalled()
    })
  })

  // ── "Done Today" state — already completed ─────────────────────────────────

  describe('"Done Today" state — habit already completed today', () => {
    it('shows the "Done Today" button when today is in completionLog', () => {
      // Arrange — today already logged
      renderCard({ completionLog: [TODAY] })

      // Assert
      expect(screen.getByText(/done today/i)).toBeInTheDocument()
    })

    it('"Done Today" button is disabled (cannot re-check-in)', () => {
      // Arrange & Act
      renderCard({ completionLog: [TODAY] })

      // Assert
      expect(
        screen.getByRole('button', { name: /already completed today/i })
      ).toBeDisabled()
    })

    it('does not show the "Check In" button text when completed today', () => {
      // Arrange & Act
      renderCard({ completionLog: [TODAY] })

      // Assert
      expect(screen.queryByText('Check In')).not.toBeInTheDocument()
    })

    it('does not call onToggle when "Done Today" button is present', () => {
      // Arrange
      const onToggle = jest.fn()
      renderCard({ completionLog: [TODAY] }, { onToggle })

      // Act — click the disabled Done Today button (no-op)
      const doneBtn = screen.getByRole('button', { name: /already completed today/i })
      fireEvent.click(doneBtn)

      // Assert
      expect(onToggle).not.toHaveBeenCalled()
    })
  })

  // ── Delete button ─────────────────────────────────────────────────────────

  describe('Delete button', () => {
    it('renders the delete button when onDelete is provided', () => {
      // Arrange & Act
      renderCard({ title: 'Read' }, { onDelete: jest.fn() })

      // Assert
      expect(screen.getByRole('button', { name: /delete habit: read/i })).toBeInTheDocument()
    })

    it('calls onDelete with the habit id when delete button is clicked', () => {
      // Arrange
      const onDelete = jest.fn()
      renderCard(
        { id: 'habit-xyz', title: 'Run' },
        { onDelete }
      )

      // Act
      fireEvent.click(screen.getByRole('button', { name: /delete habit: run/i }))

      // Assert
      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith('habit-xyz')
    })

    it('does not render the delete button when onDelete is not provided', () => {
      // Arrange & Act
      const habit = makeHabit({ title: 'Meditate' })
      render(<HabitCard habit={habit} onToggle={jest.fn()} />)

      // Assert
      expect(
        screen.queryByRole('button', { name: /delete habit/i })
      ).not.toBeInTheDocument()
    })

    it('disables the delete button when isToggling=true', () => {
      // Arrange & Act
      renderCard(
        { title: 'Yoga' },
        { onDelete: jest.fn(), isToggling: true }
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /delete habit: yoga/i })
      ).toBeDisabled()
    })

    it('does not call onDelete when button is disabled due to isToggling', () => {
      // Arrange
      const onDelete = jest.fn()
      renderCard(
        { title: 'Yoga' },
        { onDelete, isToggling: true }
      )

      // Act
      fireEvent.click(screen.getByRole('button', { name: /delete habit: yoga/i }))

      // Assert
      expect(onDelete).not.toHaveBeenCalled()
    })
  })

  // ── Completed-today visual state ───────────────────────────────────────────

  describe('completed-today visual state', () => {
    it('the rpg-card gets the opacity class when completed today', () => {
      // Arrange & Act
      renderCard({ completionLog: [TODAY] })

      // Assert — opacity-55 class applied to the inner RpgCard wrapper
      const card = screen.getByTestId('rpg-card')
      expect(card.className).toContain('opacity-55')
    })

    it('the rpg-card does not have the opacity class when not completed today', () => {
      // Arrange & Act
      renderCard({ completionLog: [] })

      // Assert
      const card = screen.getByTestId('rpg-card')
      expect(card.className).not.toContain('opacity-55')
    })
  })
})
