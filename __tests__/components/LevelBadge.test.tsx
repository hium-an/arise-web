import { render, screen } from '@testing-library/react'
import LevelBadge from '@/components/rpg/LevelBadge'

// LevelBadge is a pure server-compatible component (no 'use client', no hooks).
// @testing-library/react handles it synchronously.

describe('LevelBadge', () => {
  // -------------------------------------------------------------------------
  // Core rendering
  // -------------------------------------------------------------------------

  it('renders the level number', () => {
    render(<LevelBadge level={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders level 1', () => {
    render(<LevelBadge level={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders large level numbers', () => {
    render(<LevelBadge level={999} />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('has aria-label "Level {n}" matching the level prop', () => {
    render(<LevelBadge level={7} />)
    // The root div has role="img" and aria-label
    expect(screen.getByLabelText('Level 7')).toBeInTheDocument()
  })

  it('aria-label updates when level prop changes', () => {
    const { rerender } = render(<LevelBadge level={1} />)
    expect(screen.getByLabelText('Level 1')).toBeInTheDocument()

    rerender(<LevelBadge level={25} />)
    expect(screen.getByLabelText('Level 25')).toBeInTheDocument()
  })

  it('the level number span is aria-hidden to avoid duplicate announcement', () => {
    render(<LevelBadge level={10} />)
    const span = screen.getByText('10')
    expect(span).toHaveAttribute('aria-hidden', 'true')
  })

  // -------------------------------------------------------------------------
  // Size variants
  // -------------------------------------------------------------------------

  it('renders size "sm" without crashing', () => {
    render(<LevelBadge level={5} size="sm" />)
    expect(screen.getByLabelText('Level 5')).toBeInTheDocument()
  })

  it('renders size "md" (default) without crashing', () => {
    render(<LevelBadge level={5} size="md" />)
    expect(screen.getByLabelText('Level 5')).toBeInTheDocument()
  })

  it('renders size "lg" without crashing', () => {
    render(<LevelBadge level={5} size="lg" />)
    expect(screen.getByLabelText('Level 5')).toBeInTheDocument()
  })

  it('renders with default size when size prop is omitted', () => {
    render(<LevelBadge level={3} />)
    expect(screen.getByLabelText('Level 3')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // className passthrough
  // -------------------------------------------------------------------------

  it('accepts a custom className without crashing', () => {
    render(<LevelBadge level={8} className="my-badge" />)
    expect(screen.getByLabelText('Level 8')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Role
  // -------------------------------------------------------------------------

  it('root element has role="img"', () => {
    render(<LevelBadge level={20} />)
    expect(screen.getByRole('img', { name: 'Level 20' })).toBeInTheDocument()
  })
})
