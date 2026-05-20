/**
 * Tests for components/rpg/QuestCreateModal.tsx
 *
 * Strategy:
 *   - Mock framer-motion (same pattern as home/page.test.tsx)
 *   - Mock @/lib/queries/useQuests — control mutation states
 *   - Mock @/lib/rpg/stats for STAT_CODES
 *   - Mock @/lib/utils cn helper
 *
 * NOTE: The modal backdrop div has aria-hidden="true", which causes all role
 * queries to fail unless { hidden: true } is passed. We use { hidden: true }
 * consistently for ALL getByRole / queryByRole calls in this suite.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

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

// ─── Mock: @/lib/rpg/stats ────────────────────────────────────────────────────

jest.mock('@/lib/rpg/stats', () => ({
  STAT_CODES: [
    'STR', 'VIT', 'AGI',
    'INT', 'WIS', 'FOC',
    'WLT', 'SAV', 'INV',
    'CHA', 'EMP', 'NET',
    'WIL', 'PER', 'CON',
  ],
}))

// ─── Mock: @/lib/queries/useQuests ───────────────────────────────────────────

const mockMutateAsync = jest.fn()
const mockCreateQuestState = {
  isPending: false,
  isError: false,
  mutateAsync: mockMutateAsync,
}

jest.mock('@/lib/queries/useQuests', () => ({
  useCreateQuest: () => mockCreateQuestState,
}))

// ─── Import component under test ──────────────────────────────────────────────

import QuestCreateModal from '@/components/rpg/QuestCreateModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_UID = 'uid-hunter-001'

function renderModal(
  props: { open?: boolean; uid?: string; onClose?: () => void } = {}
) {
  const defaults = {
    open: true,
    uid: MOCK_UID,
    onClose: jest.fn(),
  }
  return render(<QuestCreateModal {...defaults} {...props} />)
}

// Shorthand helpers for { hidden: true } queries (needed due to aria-hidden backdrop)
function getBtn(name: RegExp | string) {
  return screen.getByRole('button', { name, hidden: true })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuestCreateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateQuestState.isPending = false
    mockCreateQuestState.isError = false
    mockMutateAsync.mockResolvedValue({})
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ── Visibility ─────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('does NOT render the dialog when open=false', () => {
      // Arrange & Act
      renderModal({ open: false })

      // Assert
      expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
    })

    it('renders the dialog when open=true', () => {
      // Arrange & Act
      renderModal({ open: true })

      // Assert
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    })

    it('has aria-modal="true" on the dialog', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-modal', 'true')
    })

    it('renders the "New Quest" heading', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByText('New Quest')).toBeInTheDocument()
    })
  })

  // ── Form fields ────────────────────────────────────────────────────────────

  describe('form fields', () => {
    it('renders the title input', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByPlaceholderText(/enter quest title/i)).toBeInTheDocument()
    })

    it('renders the description textarea', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByPlaceholderText(/optional description/i)).toBeInTheDocument()
    })

    it('renders the quest type selector group', () => {
      // Arrange & Act
      renderModal()

      // Assert — group is inside aria-hidden backdrop
      expect(screen.getByRole('group', { name: /quest type/i, hidden: true })).toBeInTheDocument()
    })

    it('renders the domain selector group', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByRole('group', { name: /life domain/i, hidden: true })).toBeInTheDocument()
    })

    it('renders the XP reward input', () => {
      // Arrange & Act
      renderModal()

      // Assert — label has htmlFor="quest-xp"
      expect(screen.getByLabelText(/xp reward/i)).toBeInTheDocument()
    })

    it('renders the deadline input', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument()
    })

    it('renders the Cancel button', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/cancel/i)).toBeInTheDocument()
    })

    it('renders the Create Quest submit button', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/create quest/i)).toBeInTheDocument()
    })

    it('renders all five quest type option buttons', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/^daily$/i)).toBeInTheDocument()
      expect(getBtn(/^weekly$/i)).toBeInTheDocument()
      expect(getBtn(/^main$/i)).toBeInTheDocument()
      expect(getBtn(/^side$/i)).toBeInTheDocument()
      expect(getBtn(/^boss$/i)).toBeInTheDocument()
    })
  })

  // ── Validation — title ─────────────────────────────────────────────────────

  describe('validation — title', () => {
    it('shows validation error when title is empty and form is submitted', async () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/create quest/i))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })
    })

    it('does not call mutateAsync when title is empty', async () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/create quest/i))
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })

      // Assert
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('title error has role="alert"', async () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/create quest/i))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert', { hidden: true })).toBeInTheDocument()
      })
    })
  })

  // ── Validation — XP reward ─────────────────────────────────────────────────

  describe('validation — XP reward', () => {
    it('XP input has min=1 and max=500 constraints', () => {
      // Arrange & Act
      renderModal()

      // Assert — verify the input has correct HTML constraints
      // The component clamps via onChange (Math.max(1, Math.min(500, ...))),
      // so the HTML input constraints reflect the allowed range.
      const xpInput = screen.getByLabelText(/xp reward/i) as HTMLInputElement
      expect(xpInput.min).toBe('1')
      expect(xpInput.max).toBe('500')
      expect(xpInput.type).toBe('number')
    })

    it('XP input default value is 50', () => {
      // Arrange & Act
      renderModal()

      // Assert
      const xpInput = screen.getByLabelText(/xp reward/i) as HTMLInputElement
      expect(xpInput.value).toBe('50')
    })

    it('does not show XP error when value is within valid range (1-500)', async () => {
      // Arrange
      renderModal()
      const titleInput = screen.getByPlaceholderText(/enter quest title/i)
      const xpInput = screen.getByLabelText(/xp reward/i)

      fireEvent.change(titleInput, { target: { value: 'Run 5km' } })
      fireEvent.change(xpInput, { target: { value: '100' } })

      // Act
      fireEvent.click(getBtn(/create quest/i))

      // Assert — no XP validation error (validation passes for this field)
      await waitFor(() => {
        expect(screen.queryByText(/must be between 1 and 500/i)).not.toBeInTheDocument()
      })
    })
  })

  // ── Validation — deadline ─────────────────────────────────────────────────

  describe('validation — deadline', () => {
    it('shows validation error when deadline is in the past', async () => {
      // Arrange
      renderModal()
      const titleInput = screen.getByPlaceholderText(/enter quest title/i)
      fireEvent.change(titleInput, { target: { value: 'Valid Quest Title' } })

      // Find the date input by its id directly since label matching may be unreliable
      // for inputs inside aria-hidden containers
      const deadlineInput = document.getElementById('quest-deadline') as HTMLInputElement

      // Simulate a past date by patching the native value descriptor (React reads
      // nativeInputValueSetter for controlled inputs to detect actual value changes)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!
      nativeInputValueSetter.call(deadlineInput, '2020-01-01')
      fireEvent.change(deadlineInput)

      // Act
      fireEvent.click(getBtn(/create quest/i))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/deadline cannot be in the past/i)).toBeInTheDocument()
      })
    })

    it('does not show deadline error when deadline is in the future', async () => {
      // Arrange
      renderModal()
      const titleInput = screen.getByPlaceholderText(/enter quest title/i)
      const deadlineInput = screen.getByLabelText(/deadline/i)

      fireEvent.change(titleInput, { target: { value: 'Valid Quest Title' } })
      fireEvent.change(deadlineInput, { target: { value: '2099-12-31' } })

      // Act
      fireEvent.click(getBtn(/create quest/i))

      // Assert — future deadline should NOT trigger an error
      await waitFor(() => {
        expect(screen.queryByText(/deadline cannot be in the past/i)).not.toBeInTheDocument()
      })
    })
  })

  // ── ESC key closes modal ───────────────────────────────────────────────────

  describe('ESC key', () => {
    it('calls onClose when ESC is pressed', () => {
      // Arrange
      const onClose = jest.fn()
      renderModal({ onClose })

      // Act
      fireEvent.keyDown(window, { key: 'Escape' })

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose for other key presses', () => {
      // Arrange
      const onClose = jest.fn()
      renderModal({ onClose })

      // Act
      fireEvent.keyDown(window, { key: 'Enter' })

      // Assert
      expect(onClose).not.toHaveBeenCalled()
    })

    it('does not attach ESC handler when modal is closed', () => {
      // Arrange
      const onClose = jest.fn()
      renderModal({ open: false, onClose })

      // Act
      fireEvent.keyDown(window, { key: 'Escape' })

      // Assert
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ── Cancel button ──────────────────────────────────────────────────────────

  describe('Cancel button', () => {
    it('calls onClose when Cancel button is clicked', () => {
      // Arrange
      const onClose = jest.fn()
      renderModal({ onClose })

      // Act
      fireEvent.click(getBtn(/cancel/i))

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when the X close button is clicked', () => {
      // Arrange
      const onClose = jest.fn()
      renderModal({ onClose })

      // Act
      fireEvent.click(getBtn(/close quest creation dialog/i))

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // ── Successful submission ──────────────────────────────────────────────────

  describe('successful submission', () => {
    it('calls mutateAsync with correct data when form is valid', async () => {
      // Arrange
      jest.useFakeTimers()
      renderModal()

      const titleInput = screen.getByPlaceholderText(/enter quest title/i)
      fireEvent.change(titleInput, { target: { value: 'Morning Run' } })

      // Act
      await act(async () => {
        fireEvent.click(getBtn(/create quest/i))
        await Promise.resolve()
      })

      // Assert
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      })

      // mock.calls is [[arg0, arg1, ...], [...]] — get first call's first argument
      const firstCallArgs = (mockMutateAsync.mock.calls[0] as [{ uid: string; data: { title: string } }])[0]
      expect(firstCallArgs.uid).toBe(MOCK_UID)
      expect(firstCallArgs.data.title).toBe('Morning Run')
    })

    it('shows "Quest Created!" success state after successful creation', async () => {
      // Arrange
      jest.useFakeTimers()
      renderModal()

      const titleInput = screen.getByPlaceholderText(/enter quest title/i)
      fireEvent.change(titleInput, { target: { value: 'Morning Run' } })

      // Act
      await act(async () => {
        fireEvent.click(getBtn(/create quest/i))
        await Promise.resolve()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Quest Created!')).toBeInTheDocument()
      })
    })

    it('submit button shows "Creating..." text while mutation is pending', () => {
      // Arrange
      mockCreateQuestState.isPending = true

      // Act
      renderModal()

      // Assert
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })

    it('submit button is disabled while mutation is pending', () => {
      // Arrange
      mockCreateQuestState.isPending = true

      // Act
      renderModal()

      // Assert — submit button type="submit" form="quest-create-form", disabled
      // Use form attribute to find the submit button specifically
      const submitBtn = screen.getByText('Creating...').closest('button')
      expect(submitBtn).toBeDisabled()
    })
  })

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error banner when mutation fails', () => {
      // Arrange
      mockCreateQuestState.isError = true

      // Act
      renderModal()

      // Assert — error div has role="alert"
      expect(screen.getByRole('alert', { hidden: true })).toBeInTheDocument()
      expect(screen.getByText(/failed to create quest/i)).toBeInTheDocument()
    })
  })

  // ── Stat gains section (collapsible) ───────────────────────────────────────

  describe('stat gains section', () => {
    it('renders the "Stat Gains" toggle button', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/stat gains/i)).toBeInTheDocument()
    })

    it('stat section is collapsed by default (aria-expanded=false)', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/stat gains/i)).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands stat section when toggle is clicked', () => {
      // Arrange
      renderModal()
      const toggleBtn = getBtn(/stat gains/i)

      // Act
      fireEvent.click(toggleBtn)

      // Assert
      expect(getBtn(/stat gains/i)).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows individual stat inputs when section is expanded', () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/stat gains/i))

      // Assert — STR input label
      expect(screen.getByLabelText(/^str/i)).toBeInTheDocument()
    })
  })

  // ── Type selection ─────────────────────────────────────────────────────────

  describe('quest type selection', () => {
    it('Daily is selected by default (aria-pressed=true)', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/^daily$/i)).toHaveAttribute('aria-pressed', 'true')
    })

    it('marks the clicked type as selected', () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/^weekly$/i))

      // Assert
      expect(getBtn(/^weekly$/i)).toHaveAttribute('aria-pressed', 'true')
      expect(getBtn(/^daily$/i)).toHaveAttribute('aria-pressed', 'false')
    })
  })

  // ── Domain selection ───────────────────────────────────────────────────────

  describe('life domain selection', () => {
    it('Discipline domain is selected by default (aria-pressed=true)', () => {
      // Arrange & Act
      renderModal()

      // Assert
      expect(getBtn(/^discipline$/i)).toHaveAttribute('aria-pressed', 'true')
    })

    it('marks the clicked domain as selected', () => {
      // Arrange
      renderModal()

      // Act
      fireEvent.click(getBtn(/^physical$/i))

      // Assert
      expect(getBtn(/^physical$/i)).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
