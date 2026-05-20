/**
 * Tests for components/ui/rpg-card.tsx
 *
 * RpgCard là một pure presentational component — không có hook, không có side effects.
 * Các test tập trung vào:
 *   - render children
 *   - accent line div có xuất hiện đúng theo glow prop không
 *   - padding variant apply đúng class
 *   - className prop được merge vào root element
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// ─── Mock: @/lib/utils (cn) ───────────────────────────────────────────────────
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    classes
      .flat()
      .filter(Boolean)
      .join(' '),
}))

import RpgCard from '@/components/ui/rpg-card'

describe('RpgCard', () => {
  // ─── Children ────────────────────────────────────────────────────────────────

  describe('render children', () => {
    it('hiển thị text children', () => {
      render(<RpgCard>Hello Hunter</RpgCard>)
      expect(screen.getByText('Hello Hunter')).toBeInTheDocument()
    })

    it('hiển thị nhiều children cùng lúc', () => {
      render(
        <RpgCard>
          <span>Child One</span>
          <span>Child Two</span>
        </RpgCard>
      )
      expect(screen.getByText('Child One')).toBeInTheDocument()
      expect(screen.getByText('Child Two')).toBeInTheDocument()
    })

    it('hiển thị children là element React', () => {
      render(
        <RpgCard>
          <button>Click me</button>
        </RpgCard>
      )
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })
  })

  // ─── Glow: accent line div ────────────────────────────────────────────────

  describe('glow prop — accent line div', () => {
    it('không render accent line khi glow="none" (default)', () => {
      const { container } = render(<RpgCard>Content</RpgCard>)
      // accent line có aria-hidden="true" và class bg-gradient-to-r
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).not.toBeInTheDocument()
    })

    it('không render accent line khi glow="none" được chỉ định tường minh', () => {
      const { container } = render(<RpgCard glow="none">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).not.toBeInTheDocument()
    })

    it('render accent line khi glow="blue"', () => {
      const { container } = render(<RpgCard glow="blue">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).toBeInTheDocument()
    })

    it('render accent line khi glow="purple"', () => {
      const { container } = render(<RpgCard glow="purple">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).toBeInTheDocument()
    })

    it('render accent line khi glow="gold"', () => {
      const { container } = render(<RpgCard glow="gold">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).toBeInTheDocument()
    })

    it('render accent line khi glow="green"', () => {
      const { container } = render(<RpgCard glow="green">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine).toBeInTheDocument()
    })

    it('accent line của glow="blue" chứa class via-neon-blue/60', () => {
      const { container } = render(<RpgCard glow="blue">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine?.className).toContain('via-neon-blue/60')
    })

    it('accent line của glow="purple" chứa class via-neon-purple/60', () => {
      const { container } = render(<RpgCard glow="purple">Content</RpgCard>)
      const accentLine = container.querySelector('[aria-hidden="true"].bg-gradient-to-r')
      expect(accentLine?.className).toContain('via-neon-purple/60')
    })
  })

  // ─── Padding variants ─────────────────────────────────────────────────────

  describe('padding prop — class trên root element', () => {
    it('áp dụng p-6 khi padding="md" (default)', () => {
      const { container } = render(<RpgCard>Content</RpgCard>)
      expect(container.firstChild).toHaveClass('p-6')
    })

    it('áp dụng p-4 khi padding="sm"', () => {
      const { container } = render(<RpgCard padding="sm">Content</RpgCard>)
      expect(container.firstChild).toHaveClass('p-4')
    })

    it('áp dụng p-6 khi padding="md" được chỉ định tường minh', () => {
      const { container } = render(<RpgCard padding="md">Content</RpgCard>)
      expect(container.firstChild).toHaveClass('p-6')
    })

    it('áp dụng p-8 khi padding="lg"', () => {
      const { container } = render(<RpgCard padding="lg">Content</RpgCard>)
      expect(container.firstChild).toHaveClass('p-8')
    })
  })

  // ─── className prop merge ─────────────────────────────────────────────────

  describe('className prop', () => {
    it('merge className vào root element', () => {
      const { container } = render(
        <RpgCard className="my-custom-class">Content</RpgCard>
      )
      expect(container.firstChild).toHaveClass('my-custom-class')
    })

    it('giữ nguyên base classes khi thêm className', () => {
      const { container } = render(
        <RpgCard className="extra-class">Content</RpgCard>
      )
      expect(container.firstChild).toHaveClass('relative')
      expect(container.firstChild).toHaveClass('rounded-xl')
      expect(container.firstChild).toHaveClass('extra-class')
    })

    it('render bình thường khi không truyền className', () => {
      const { container } = render(<RpgCard>Content</RpgCard>)
      expect(container.firstChild).toBeInTheDocument()
      expect(container.firstChild).toHaveClass('relative')
    })

    it('merge nhiều class trong className', () => {
      const { container } = render(
        <RpgCard className="class-a class-b">Content</RpgCard>
      )
      expect(container.firstChild).toHaveClass('class-a')
      expect(container.firstChild).toHaveClass('class-b')
    })
  })

  // ─── Root element structure ───────────────────────────────────────────────

  describe('root element', () => {
    it('root element là một div', () => {
      const { container } = render(<RpgCard>Content</RpgCard>)
      expect(container.firstChild?.nodeName).toBe('DIV')
    })

    it('root element có class bg-surface và border-border', () => {
      const { container } = render(<RpgCard>Content</RpgCard>)
      expect(container.firstChild).toHaveClass('bg-surface')
      expect(container.firstChild).toHaveClass('border-border')
    })
  })
})
