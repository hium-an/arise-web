/**
 * Tests for app/(app)/quests/page.tsx
 *
 * Strategy:
 *   - Mock @/lib/queries/useQuests — control loading/error/data states
 *   - Mock @/lib/hooks/useAuth — return fake user
 *   - Mock framer-motion (same pattern as home/page.test.tsx)
 *   - Mock child components (QuestCard, QuestCreateModal) tested separately
 *   - Mock @/lib/utils cn
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// ─── Mock: @/lib/utils ────────────────────────────────────────────────────────

jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    (classes as string[]).flat().filter(Boolean).join(' '),
}))

// ─── Mock: @/lib/hooks/useAuth ────────────────────────────────────────────────

const mockAuthReturn = {
  user: { uid: 'uid-hunter-001', email: 'hunter@arise.io', displayName: 'Sung Jinwoo' },
  loading: false,
  isAuthenticated: true,
}

jest.mock('@/lib/hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthReturn,
}))

// ─── Mock: @/lib/queries/useQuests ───────────────────────────────────────────

const mockMutateAsync = jest.fn()

const mockUseQuests = jest.fn()
const mockUseCompleteQuest = jest.fn(() => ({ mutateAsync: mockMutateAsync }))
const mockUseDeleteQuest = jest.fn(() => ({ mutateAsync: mockMutateAsync }))

jest.mock('@/lib/queries/useQuests', () => ({
  useQuests: (...args: unknown[]) => mockUseQuests(...args),
  useCompleteQuest: () => mockUseCompleteQuest(),
  useDeleteQuest: () => mockUseDeleteQuest(),
}))

// ─── Mock: QuestCard ──────────────────────────────────────────────────────────

jest.mock('@/components/rpg/QuestCard', () => {
  const QuestCard = ({
    quest,
    onComplete,
    onDelete,
  }: {
    quest: Quest
    onComplete?: (id: string) => void
    onDelete?: (id: string) => void
  }) => (
    <div data-testid={`quest-card-${quest.id}`}>
      <span>{quest.title}</span>
      <span data-testid={`quest-type-${quest.id}`}>{quest.type}</span>
      {onComplete && (
        <button onClick={() => onComplete(quest.id)}>
          Complete {quest.title}
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(quest.id)}>
          Delete {quest.title}
        </button>
      )}
    </div>
  )
  QuestCard.displayName = 'QuestCard'
  return QuestCard
})

// ─── Mock: QuestCreateModal ───────────────────────────────────────────────────

jest.mock('@/components/rpg/QuestCreateModal', () => {
  const QuestCreateModal = ({
    open,
    onClose,
  }: {
    open: boolean
    uid: string
    onClose: () => void
  }) =>
    open ? (
      <div role="dialog" aria-modal="true" data-testid="quest-create-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  QuestCreateModal.displayName = 'QuestCreateModal'
  return QuestCreateModal
})

// ─── Import page under test ───────────────────────────────────────────────────

import QuestsPage from '@/app/(app)/quests/page'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest-001',
    userId: 'uid-hunter-001',
    title: 'Morning Training',
    description: 'Daily training',
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

function setQuestsLoading() {
  mockUseQuests.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() })
}

function setQuestsError() {
  mockUseQuests.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: jest.fn() })
}

function setQuestsData(quests: Quest[]) {
  mockUseQuests.mockReturnValue({ data: quests, isLoading: false, isError: false, refetch: jest.fn() })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({})
    mockUseCompleteQuest.mockReturnValue({ mutateAsync: mockMutateAsync })
    mockUseDeleteQuest.mockReturnValue({ mutateAsync: mockMutateAsync })
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows the quest list skeleton while loading', () => {
      // Arrange & Act
      setQuestsLoading()
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('status', { name: /loading quests/i })).toBeInTheDocument()
    })

    it('shows the screen-reader loading text during loading', () => {
      // Arrange & Act
      setQuestsLoading()
      render(<QuestsPage />)

      // Assert
      expect(screen.getByText(/loading quests/i)).toBeInTheDocument()
    })

    it('does not render quest cards while loading', () => {
      // Arrange & Act
      setQuestsLoading()
      render(<QuestsPage />)

      // Assert
      expect(screen.queryByTestId(/^quest-card-/)).not.toBeInTheDocument()
    })
  })

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows the error message when fetch fails', () => {
      // Arrange & Act
      setQuestsError()
      render(<QuestsPage />)

      // Assert
      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
      expect(screen.getByText(/failed to retrieve quest data/i)).toBeInTheDocument()
    })

    it('shows a Retry button in the error state', () => {
      // Arrange & Act
      setQuestsError()
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('calls refetch when Retry button is clicked', () => {
      // Arrange
      const mockRefetch = jest.fn()
      mockUseQuests.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
      })
      render(<QuestsPage />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))

      // Assert
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  // ── Data loaded state ──────────────────────────────────────────────────────

  describe('data loaded state', () => {
    it('renders the Quest Log heading', () => {
      // Arrange & Act
      setQuestsData([makeQuest()])
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('heading', { name: /quest log/i })).toBeInTheDocument()
    })

    it('renders a QuestCard for each quest in the data', () => {
      // Arrange
      const quests = [
        makeQuest({ id: 'q1', title: 'Quest One' }),
        makeQuest({ id: 'q2', title: 'Quest Two' }),
        makeQuest({ id: 'q3', title: 'Quest Three' }),
      ]
      setQuestsData(quests)

      // Act
      render(<QuestsPage />)

      // Assert
      expect(screen.getByTestId('quest-card-q1')).toBeInTheDocument()
      expect(screen.getByTestId('quest-card-q2')).toBeInTheDocument()
      expect(screen.getByTestId('quest-card-q3')).toBeInTheDocument()
    })

    it('shows the active quest count in the header', () => {
      // Arrange — 2 pending quests
      const quests = [
        makeQuest({ id: 'q1', status: 'pending' }),
        makeQuest({ id: 'q2', status: 'pending' }),
        makeQuest({ id: 'q3', status: 'completed' }),
      ]
      setQuestsData(quests)

      // Act
      render(<QuestsPage />)

      // Assert — header paragraph contains "2 active quests"
      // The header <p> element has the count as a nested <span>
      const headerPara = screen.getByRole('paragraph')
      expect(headerPara.textContent).toMatch(/2.*active quests/i)
    })

    it('shows "No active quests" when all quests are completed', () => {
      // Arrange
      const quests = [makeQuest({ id: 'q1', status: 'completed' })]
      setQuestsData(quests)

      // Act
      render(<QuestsPage />)

      // Assert — header paragraph shows "No active quests"
      const headerPara = screen.getByRole('paragraph')
      expect(headerPara.textContent).toMatch(/no active quests/i)
    })

    it('renders the quest list with correct aria-label', () => {
      // Arrange
      setQuestsData([makeQuest({ id: 'q1' })])

      // Act
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('list', { name: /all quests/i })).toBeInTheDocument()
    })
  })

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows the "No Active Quests" empty state when quest list is empty', () => {
      // Arrange & Act
      setQuestsData([])
      render(<QuestsPage />)

      // Assert — the empty-state title has uppercase tracking style text
      // EMPTY_STATE['all'].title = 'No Active Quests'
      const emptyTitles = screen.getAllByText(/no active quests/i)
      expect(emptyTitles.length).toBeGreaterThanOrEqual(1)
    })

    it('shows the empty state message', () => {
      // Arrange & Act
      setQuestsData([])
      render(<QuestsPage />)

      // Assert
      expect(screen.getByText(/your quest log is empty/i)).toBeInTheDocument()
    })

    it('shows a "+ New Quest" button in the empty state', () => {
      // Arrange & Act
      setQuestsData([])
      render(<QuestsPage />)

      // Assert
      expect(screen.getAllByRole('button', { name: /new quest/i })).not.toHaveLength(0)
    })
  })

  // ── Tab filtering ──────────────────────────────────────────────────────────

  describe('tab filtering', () => {
    it('renders the tab bar', () => {
      // Arrange & Act
      setQuestsData([])
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('"All" tab is active by default', () => {
      // Arrange & Act
      setQuestsData([makeQuest()])
      render(<QuestsPage />)

      // Assert — tab label is "All" followed by optional count badge
      // getByRole with partial name match using regex
      const allTab = screen.getByRole('tab', { name: /^all/i })
      expect(allTab).toHaveAttribute('aria-selected', 'true')
    })

    it('shows only DAILY quests after clicking the Daily tab', () => {
      // Arrange
      const quests = [
        makeQuest({ id: 'q-daily', title: 'Daily Quest', type: 'daily' }),
        makeQuest({ id: 'q-weekly', title: 'Weekly Quest', type: 'weekly' }),
        makeQuest({ id: 'q-boss', title: 'Boss Quest', type: 'boss' }),
      ]
      setQuestsData(quests)
      render(<QuestsPage />)

      // Act — find daily tab by partial name (tab text is "Daily" + count badge)
      fireEvent.click(screen.getByRole('tab', { name: /^daily/i }))

      // Assert — only the daily quest card is shown
      expect(screen.getByTestId('quest-card-q-daily')).toBeInTheDocument()
      expect(screen.queryByTestId('quest-card-q-weekly')).not.toBeInTheDocument()
      expect(screen.queryByTestId('quest-card-q-boss')).not.toBeInTheDocument()
    })

    it('marks the selected tab as active', () => {
      // Arrange
      setQuestsData([makeQuest({ type: 'weekly' })])
      render(<QuestsPage />)

      // Act
      fireEvent.click(screen.getByRole('tab', { name: /^weekly/i }))

      // Assert
      expect(screen.getByRole('tab', { name: /^weekly/i })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    it('shows empty state for the selected tab when no quests match', () => {
      // Arrange — only daily quests, no boss quests
      const quests = [makeQuest({ id: 'q1', type: 'daily' })]
      setQuestsData(quests)
      render(<QuestsPage />)

      // Act — "Boss" tab has no count badge so name is just "Boss"
      fireEvent.click(screen.getByRole('tab', { name: /^boss/i }))

      // Assert
      expect(screen.getByText(/no boss quests/i)).toBeInTheDocument()
    })

    it('clicking All tab shows all quests', () => {
      // Arrange
      const quests = [
        makeQuest({ id: 'q-daily', type: 'daily' }),
        makeQuest({ id: 'q-weekly', type: 'weekly' }),
      ]
      setQuestsData(quests)
      render(<QuestsPage />)

      // Switch to Daily
      fireEvent.click(screen.getByRole('tab', { name: /^daily/i }))
      // Switch back to All
      fireEvent.click(screen.getByRole('tab', { name: /^all/i }))

      // Assert — both cards visible
      expect(screen.getByTestId('quest-card-q-daily')).toBeInTheDocument()
      expect(screen.getByTestId('quest-card-q-weekly')).toBeInTheDocument()
    })
  })

  // ── FAB button opens modal ─────────────────────────────────────────────────

  describe('FAB button and create modal', () => {
    it('renders the FAB button', () => {
      // Arrange & Act
      setQuestsData([])
      render(<QuestsPage />)

      // Assert
      expect(screen.getByRole('button', { name: /create new quest/i })).toBeInTheDocument()
    })

    it('opens the create modal when FAB button is clicked', async () => {
      // Arrange
      setQuestsData([])
      render(<QuestsPage />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: /create new quest/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('quest-create-modal')).toBeInTheDocument()
      })
    })

    it('closes the create modal when onClose is called', async () => {
      // Arrange
      setQuestsData([])
      render(<QuestsPage />)

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /create new quest/i }))
      await waitFor(() => {
        expect(screen.getByTestId('quest-create-modal')).toBeInTheDocument()
      })

      // Act — click Close Modal button inside the mock
      fireEvent.click(screen.getByRole('button', { name: /close modal/i }))

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('quest-create-modal')).not.toBeInTheDocument()
      })
    })

    it('opens the create modal when "New Quest" button in empty state is clicked', async () => {
      // Arrange
      setQuestsData([])
      render(<QuestsPage />)

      // Act — click the empty state "+ New Quest" button
      const newQuestBtns = screen.getAllByRole('button', { name: /new quest/i })
      fireEvent.click(newQuestBtns[0])

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('quest-create-modal')).toBeInTheDocument()
      })
    })
  })

  // ── Quest list aria ────────────────────────────────────────────────────────

  describe('quest list ARIA', () => {
    it('quest list items have role="listitem"', () => {
      // Arrange
      setQuestsData([makeQuest({ id: 'q1' }), makeQuest({ id: 'q2' })])

      // Act
      render(<QuestsPage />)

      // Assert
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThanOrEqual(2)
    })
  })
})
