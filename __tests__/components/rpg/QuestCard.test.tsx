/**
 * Tests for components/rpg/QuestCard.tsx
 *
 * Strategy:
 *   - Mock framer-motion (same pattern as home/page.test.tsx)
 *   - Mock @/components/ui/rpg-card to a plain div
 *   - Mock @/lib/utils cn helper
 *   - Test render, interactions, and state-based styling
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Quest } from '@/types'

// ─── Mock: framer-motion ──────────────────────────────────────────────────────

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

// ─── Mock: @/components/ui/rpg-card ──────────────────────────────────────────

jest.mock('@/components/ui/rpg-card', () => {
  const RpgCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="rpg-card" className={className}>{children}</div>
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

import QuestCard from '@/components/rpg/QuestCard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest-001',
    userId: 'uid-001',
    title: 'Train for 30 Minutes',
    description: 'Daily physical training',
    type: 'daily',
    domain: 'physical',
    xpReward: 50,
    statGains: { STR: 2 },
    status: 'pending',
    deadline: undefined,
    completedAt: undefined,
    aiGenerated: false,
    parentGoalId: undefined,
    parentMilestoneId: undefined,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

function renderCard(props: Partial<React.ComponentProps<typeof QuestCard>> = {}) {
  const defaultQuest = makeQuest()
  return render(
    <QuestCard
      quest={defaultQuest}
      onComplete={jest.fn()}
      onDelete={jest.fn()}
      isCompleting={false}
      {...props}
    />
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuestCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Renders basic content ──────────────────────────────────────────────────

  describe('renders basic content', () => {
    it('renders the quest title', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ title: 'Shadow Monarch Trial' }) })

      // Assert
      expect(screen.getByText('Shadow Monarch Trial')).toBeInTheDocument()
    })

    it('shows the XP reward badge with correct value', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ xpReward: 150 }) })

      // Assert
      expect(screen.getByLabelText(/150 XP reward/i)).toBeInTheDocument()
      expect(screen.getByText('+150 XP')).toBeInTheDocument()
    })

    it('shows the domain icon with accessible label', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ domain: 'physical' }) })

      // Assert — physical domain icon is 💪
      expect(screen.getByRole('img', { name: /physical/i })).toBeInTheDocument()
    })

    it('shows the mental domain icon', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ domain: 'mental' }) })

      // Assert
      expect(screen.getByRole('img', { name: /mental/i })).toBeInTheDocument()
    })

    it('shows the DAILY type badge', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ type: 'daily' }) })

      // Assert
      expect(screen.getByText('DAILY')).toBeInTheDocument()
    })

    it('shows the WEEKLY type badge', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ type: 'weekly' }) })

      // Assert
      expect(screen.getByText('WEEKLY')).toBeInTheDocument()
    })

    it('shows the MAIN type badge', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ type: 'main' }) })

      // Assert
      expect(screen.getByText('MAIN')).toBeInTheDocument()
    })

    it('shows the SIDE type badge', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ type: 'side' }) })

      // Assert
      expect(screen.getByText('SIDE')).toBeInTheDocument()
    })

    it('shows the BOSS type badge', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ type: 'boss' }) })

      // Assert
      expect(screen.getByText('BOSS ☠')).toBeInTheDocument()
    })

    it('renders the description when provided', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ description: 'Complete all training modules' }) })

      // Assert
      expect(screen.getByText('Complete all training modules')).toBeInTheDocument()
    })

    it('does not render a description section when description is absent', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ description: undefined }) })

      // Assert
      expect(screen.queryByText('Daily physical training')).not.toBeInTheDocument()
    })

    it('shows deadline when provided and quest is pending', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({
          status: 'pending',
          deadline: new Date('2030-06-15'),
        }),
      })

      // Assert — locale-formatted date string contains "Jun" and "15"
      expect(screen.getByText(/due:/i)).toBeInTheDocument()
    })
  })

  // ── Complete button — pending state ───────────────────────────────────────

  describe('Complete button — pending quest', () => {
    it('is visible when status is "pending"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'pending' }) })

      // Assert
      expect(screen.getByRole('button', { name: /complete quest/i })).toBeInTheDocument()
    })

    it('is visible when status is "active"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'active' }) })

      // Assert
      expect(screen.getByRole('button', { name: /complete quest/i })).toBeInTheDocument()
    })

    it('calls onComplete with the quest id when clicked', () => {
      // Arrange
      const onComplete = jest.fn()
      renderCard({
        quest: makeQuest({ id: 'quest-xyz', status: 'pending' }),
        onComplete,
      })

      // Act
      fireEvent.click(screen.getByRole('button', { name: /complete quest/i }))

      // Assert
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(onComplete).toHaveBeenCalledWith('quest-xyz')
    })

    it('does not render the Complete button when onComplete is not provided', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        onComplete: undefined,
      })

      // Assert
      expect(screen.queryByRole('button', { name: /complete quest/i })).not.toBeInTheDocument()
    })
  })

  // ── Complete button — completed state ─────────────────────────────────────

  describe('Complete button — completed quest', () => {
    it('is NOT shown when status is "completed"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'completed' }) })

      // Assert
      expect(screen.queryByRole('button', { name: /complete quest/i })).not.toBeInTheDocument()
    })

    it('does not show the actions row when status is "completed"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'completed' }), onComplete: jest.fn() })

      // Assert — actions row with complete button is hidden for completed quests
      expect(screen.queryByRole('button', { name: /complete quest/i })).not.toBeInTheDocument()
    })
  })

  // ── isCompleting state ────────────────────────────────────────────────────

  describe('isCompleting state', () => {
    it('disables the Complete button when isCompleting=true', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        isCompleting: true,
      })

      // Assert
      expect(screen.getByRole('button', { name: /complete quest/i })).toBeDisabled()
    })

    it('shows "..." text on Complete button while completing', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        isCompleting: true,
      })

      // Assert
      expect(screen.getByRole('button', { name: /complete quest/i })).toHaveTextContent('...')
    })

    it('shows "Complete" text when not completing', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        isCompleting: false,
      })

      // Assert
      expect(screen.getByRole('button', { name: /complete quest/i })).toHaveTextContent('Complete')
    })

    it('disables the Delete button when isCompleting=true', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        isCompleting: true,
        onDelete: jest.fn(),
      })

      // Assert
      expect(screen.getByRole('button', { name: /delete quest/i })).toBeDisabled()
    })
  })

  // ── Completed styling ─────────────────────────────────────────────────────

  describe('completed quest styling', () => {
    it('renders the title with line-through class when completed', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'completed' }) })

      // Assert — h3 should have line-through in its class
      const title = screen.getByRole('heading', { level: 3 })
      expect(title.className).toContain('line-through')
    })

    it('shows the checkmark indicator when completed', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'completed' }) })

      // Assert — the ✓ span is aria-hidden but still in the DOM
      // It appears in the title row (not the timestamp)
      const checkmarks = document.querySelectorAll('[aria-hidden="true"]')
      const checkmarkTexts = Array.from(checkmarks).map((el) => el.textContent)
      expect(checkmarkTexts.some((t) => t?.includes('✓'))).toBe(true)
    })

    it('shows completedAt timestamp when completed and completedAt is set', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({
          status: 'completed',
          completedAt: new Date('2024-03-15'),
        }),
      })

      // Assert — "Completed Mar 15"
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('does not show deadline when quest is completed', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({
          status: 'completed',
          deadline: new Date('2030-06-15'),
        }),
      })

      // Assert
      expect(screen.queryByText(/due:/i)).not.toBeInTheDocument()
    })
  })

  // ── Delete button ─────────────────────────────────────────────────────────

  describe('Delete button', () => {
    it('renders when onDelete is provided and quest is pending', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        onDelete: jest.fn(),
      })

      // Assert
      expect(screen.getByRole('button', { name: /delete quest/i })).toBeInTheDocument()
    })

    it('calls onDelete with the quest id when clicked', () => {
      // Arrange
      const onDelete = jest.fn()
      renderCard({
        quest: makeQuest({ id: 'quest-to-delete', status: 'pending' }),
        onDelete,
      })

      // Act
      fireEvent.click(screen.getByRole('button', { name: /delete quest/i }))

      // Assert
      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith('quest-to-delete')
    })

    it('does not render when onDelete is not provided', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'pending' }),
        onDelete: undefined,
      })

      // Assert
      expect(screen.queryByRole('button', { name: /delete quest/i })).not.toBeInTheDocument()
    })

    it('is not rendered for completed quests (actions row is hidden)', () => {
      // Arrange & Act
      renderCard({
        quest: makeQuest({ status: 'completed' }),
        onDelete: jest.fn(),
      })

      // Assert
      expect(screen.queryByRole('button', { name: /delete quest/i })).not.toBeInTheDocument()
    })
  })

  // ── Active glow indicator ─────────────────────────────────────────────────

  describe('active status indicator', () => {
    it('shows the active glow dot when status is "active"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'active' }) })

      // Assert
      expect(screen.getByLabelText('Active')).toBeInTheDocument()
    })

    it('does not show the active glow dot when status is "pending"', () => {
      // Arrange & Act
      renderCard({ quest: makeQuest({ status: 'pending' }) })

      // Assert
      expect(screen.queryByLabelText('Active')).not.toBeInTheDocument()
    })
  })
})
