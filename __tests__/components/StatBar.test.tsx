import { render, screen } from '@testing-library/react'
import StatBar from '@/components/rpg/StatBar'
import type { StatCode } from '@/lib/rpg/stats'

// StatBar is a 'use client' component but has no async / hooks that need special
// treatment — render() from @testing-library/react handles it synchronously.

describe('StatBar', () => {
  const defaultProps = {
    statCode: 'STR' as StatCode,
    value: 50,
    maxValue: 100,
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('renders the stat code abbreviation', () => {
    render(<StatBar {...defaultProps} />)
    expect(screen.getByText('STR')).toBeInTheDocument()
  })

  it('renders the numeric value', () => {
    render(<StatBar {...defaultProps} value={72} />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders all valid stat codes without crashing', () => {
    const statCodes: StatCode[] = [
      'STR', 'VIT', 'AGI',
      'INT', 'WIS', 'FOC',
      'WLT', 'SAV', 'INV',
      'CHA', 'EMP', 'NET',
      'WIL', 'PER', 'CON',
    ]
    for (const code of statCodes) {
      const { unmount } = render(
        <StatBar statCode={code} value={10} maxValue={100} />,
      )
      expect(screen.getByText(code)).toBeInTheDocument()
      unmount()
    }
  })

  // -------------------------------------------------------------------------
  // Accessibility — progressbar
  // -------------------------------------------------------------------------

  it('renders an element with role="progressbar"', () => {
    render(<StatBar {...defaultProps} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar has aria-valuenow equal to value prop', () => {
    render(<StatBar {...defaultProps} value={42} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '42',
    )
  })

  it('progressbar has aria-valuemin of 0', () => {
    render(<StatBar {...defaultProps} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemin',
      '0',
    )
  })

  it('progressbar has aria-valuemax equal to maxValue prop', () => {
    render(<StatBar {...defaultProps} maxValue={200} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemax',
      '200',
    )
  })

  it('progressbar aria-label includes the full stat name and values', () => {
    render(<StatBar statCode="INT" value={30} maxValue={100} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute(
      'aria-label',
      'Intelligence: 30 out of 100',
    )
  })

  it('abbr element has aria-label with full stat name', () => {
    render(<StatBar statCode="WIL" value={10} maxValue={100} />)
    // The <abbr> has aria-label set to the full name
    expect(screen.getByLabelText('Willpower')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Fill percentage clamping
  // -------------------------------------------------------------------------

  it('fill bar width is clamped to 100% when value exceeds maxValue', () => {
    render(<StatBar statCode="STR" value={150} maxValue={100} />)
    // The inner fill div should have width 100% — not 150%
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('100%')
  })

  it('fill bar width is 0% when value is 0', () => {
    render(<StatBar statCode="STR" value={0} maxValue={100} />)
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('0%')
  })

  it('fill bar width is clamped to 0% when value is negative', () => {
    render(<StatBar statCode="AGI" value={-10} maxValue={100} />)
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('0%')
  })

  it('fill bar width is 50% for value 50 out of 100', () => {
    render(<StatBar statCode="VIT" value={50} maxValue={100} />)
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('50%')
  })

  // -------------------------------------------------------------------------
  // Default props
  // -------------------------------------------------------------------------

  it('uses 100 as default maxValue when maxValue prop is omitted', () => {
    render(<StatBar statCode="FOC" value={25} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemax',
      '100',
    )
  })

  it('accepts custom glowColor and applies it without crashing', () => {
    render(
      <StatBar statCode="CHA" value={60} maxValue={100} glowColor="#FF4444" />,
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('accepts custom className without crashing', () => {
    render(
      <StatBar
        statCode="NET"
        value={10}
        maxValue={100}
        className="my-custom-class"
      />,
    )
    expect(screen.getByText('NET')).toBeInTheDocument()
  })
})
