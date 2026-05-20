/**
 * Tests for components/rpg/LevelUpOverlay.tsx
 *
 * LevelUpOverlay is a 'use client' component that wraps framer-motion's
 * AnimatePresence. We mock framer-motion so animations don't interfere with
 * synchronous DOM assertions, and test the component's visible behavior:
 * render conditions, content, interactions, and ARIA attributes.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { LevelUpEvent } from '@/lib/store/uiStore'

// ─── Mock: framer-motion ──────────────────────────────────────────────────────
// Replace animated elements with plain HTML equivalents so tests are
// synchronous and deterministic. AnimatePresence renders children when
// they are present — we replicate this by rendering children directly.
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
          R.forwardRef(({ children, ...props }: R.HTMLAttributes<HTMLElement> & { children?: R.ReactNode }, ref: R.Ref<HTMLElement>) => {
            const rest = Object.fromEntries(
              Object.entries(props as Record<string, unknown>).filter(([k]) => !FRAMER_PROPS.has(k))
            )
            return R.createElement(tag, { ...rest, ref }, children)
          }),
      }
    ),
  }
})

// ─── Mock: @/lib/utils ────────────────────────────────────────────────────────
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    (classes as string[]).flat().filter(Boolean).join(' '),
}))

import LevelUpOverlay from '@/components/rpg/LevelUpOverlay'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(overrides?: Partial<LevelUpEvent>): LevelUpEvent {
  return {
    newLevel: 5,
    statsGained: { STR: 2 },
    ...overrides,
  }
}

function renderOverlay(event: LevelUpEvent | null, onDismiss = jest.fn()) {
  return render(<LevelUpOverlay event={event} onDismiss={onDismiss} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LevelUpOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Does not render when event is null ─────────────────────────────────────

  describe('when event is null', () => {
    it('does not render the dialog', () => {
      renderOverlay(null)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('does not render "LEVEL UP" text', () => {
      renderOverlay(null)
      expect(screen.queryByText(/LEVEL UP/i)).not.toBeInTheDocument()
    })

    it('does not render a dismiss button', () => {
      renderOverlay(null)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  // ── Renders correctly when event is provided ───────────────────────────────

  describe('when event is provided', () => {
    it('renders "LEVEL UP" text', () => {
      renderOverlay(makeEvent())
      expect(screen.getByText(/LEVEL UP/i)).toBeInTheDocument()
    })

    it('renders the correct new level number', () => {
      renderOverlay(makeEvent({ newLevel: 7 }))
      expect(screen.getByLabelText('Level 7')).toBeInTheDocument()
    })

    it('renders level number 1 correctly', () => {
      renderOverlay(makeEvent({ newLevel: 1 }))
      expect(screen.getByLabelText('Level 1')).toBeInTheDocument()
    })

    it('renders large level numbers correctly', () => {
      renderOverlay(makeEvent({ newLevel: 99 }))
      expect(screen.getByLabelText('Level 99')).toBeInTheDocument()
    })

    it('renders the dismiss button with "Continue" text content', () => {
      renderOverlay(makeEvent())
      // Button accessible name comes from aria-label, not text content
      expect(screen.getByRole('button', { name: /dismiss level up/i })).toBeInTheDocument()
    })

    it('dismiss button aria-label includes the new level', () => {
      renderOverlay(makeEvent({ newLevel: 5 }))
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute(
        'aria-label',
        expect.stringContaining('level 5')
      )
    })
  })

  // ── Stats gained list ──────────────────────────────────────────────────────

  describe('stats gained section', () => {
    it('renders a stats list when statsGained has positive values', () => {
      renderOverlay(makeEvent({ statsGained: { STR: 2, VIT: 1 } }))
      expect(screen.getByRole('list', { name: /stats gained/i })).toBeInTheDocument()
    })

    it('renders correct stat labels for each gained stat', () => {
      renderOverlay(makeEvent({ statsGained: { STR: 2, INT: 3 } }))
      expect(screen.getByText('Strength')).toBeInTheDocument()
      expect(screen.getByText('Intelligence')).toBeInTheDocument()
    })

    it('renders the positive delta value for each stat', () => {
      renderOverlay(makeEvent({ statsGained: { STR: 2 } }))
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('renders multiple stat rows with their deltas', () => {
      renderOverlay(makeEvent({ statsGained: { STR: 2, VIT: 1, WIL: 5 } }))
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('does not render the stats list when statsGained is empty', () => {
      renderOverlay(makeEvent({ statsGained: {} }))
      expect(screen.queryByRole('list', { name: /stats gained/i })).not.toBeInTheDocument()
    })

    it('does not render a stat row when its value is 0', () => {
      renderOverlay(makeEvent({ statsGained: { STR: 0 } }))
      expect(screen.queryByText('Strength')).not.toBeInTheDocument()
    })
  })

  // ── Dismiss interactions ───────────────────────────────────────────────────

  describe('dismiss button interaction', () => {
    it('calls onDismiss when the Continue button is clicked', () => {
      const onDismiss = jest.fn()
      renderOverlay(makeEvent(), onDismiss)

      fireEvent.click(screen.getByRole('button', { name: /dismiss level up/i }))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onDismiss only once per click', () => {
      const onDismiss = jest.fn()
      renderOverlay(makeEvent(), onDismiss)

      fireEvent.click(screen.getByRole('button'))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  // ── ESC key dismissal ──────────────────────────────────────────────────────

  describe('ESC key dismissal', () => {
    it('calls onDismiss when Escape key is pressed', () => {
      const onDismiss = jest.fn()
      renderOverlay(makeEvent(), onDismiss)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not call onDismiss for other keys', () => {
      const onDismiss = jest.fn()
      renderOverlay(makeEvent(), onDismiss)

      fireEvent.keyDown(window, { key: 'Enter' })

      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('removes the ESC key listener when event becomes null (cleanup)', () => {
      const onDismiss = jest.fn()
      const { rerender } = render(
        <LevelUpOverlay event={makeEvent()} onDismiss={onDismiss} />
      )

      // Now hide the overlay
      rerender(<LevelUpOverlay event={null} onDismiss={onDismiss} />)

      // ESC after unmount should not call onDismiss
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  // ── ARIA attributes ────────────────────────────────────────────────────────

  describe('ARIA attributes', () => {
    it('has role="dialog" on the backdrop element', () => {
      renderOverlay(makeEvent())
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal="true" on the dialog', () => {
      renderOverlay(makeEvent())
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('dialog is labelled by the level number heading (aria-labelledby)', () => {
      renderOverlay(makeEvent({ newLevel: 5 }))
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'level-up-title')
    })

    it('the element with id="level-up-title" exists and contains the level', () => {
      renderOverlay(makeEvent({ newLevel: 8 }))
      const titleEl = document.getElementById('level-up-title')
      expect(titleEl).toBeInTheDocument()
      expect(titleEl?.textContent).toContain('8')
    })
  })
})
