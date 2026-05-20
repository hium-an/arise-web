import { act, render, screen } from '@testing-library/react'
import XPProgress from '@/components/rpg/XPProgress'

// XPProgress uses double requestAnimationFrame inside useEffect to animate.
// jsdom's rAF stub doesn't auto-flush in act(), so we mock it to be synchronous.
beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('XPProgress', () => {
  // -------------------------------------------------------------------------
  // Text rendering
  // -------------------------------------------------------------------------

  it('renders the current XP value', async () => {
    await act(async () => {
      render(<XPProgress currentXP={500} xpToNextLevel={1000} />)
    })
    // toLocaleString() in jsdom for 500 → "500"
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('renders the xpToNextLevel value', async () => {
    await act(async () => {
      render(<XPProgress currentXP={200} xpToNextLevel={800} />)
    })
    // The max is rendered inside the secondary span as "/ 800 XP"
    expect(screen.getByText(/800 XP/)).toBeInTheDocument()
  })

  it('renders the "Experience" label', async () => {
    await act(async () => {
      render(<XPProgress currentXP={0} xpToNextLevel={100} />)
    })
    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('renders large XP numbers formatted with toLocaleString', async () => {
    await act(async () => {
      render(<XPProgress currentXP={1000000} xpToNextLevel={2000000} />)
    })
    // toLocaleString for 1_000_000 in jsdom en-US → "1,000,000"
    expect(screen.getByText(/1[,.]?000[,.]?000/)).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Accessibility — progressbar
  // -------------------------------------------------------------------------

  it('renders an element with role="progressbar"', async () => {
    await act(async () => {
      render(<XPProgress currentXP={300} xpToNextLevel={1000} />)
    })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar has aria-valuenow equal to currentXP', async () => {
    await act(async () => {
      render(<XPProgress currentXP={350} xpToNextLevel={1000} />)
    })
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '350',
    )
  })

  it('progressbar has aria-valuemin of 0', async () => {
    await act(async () => {
      render(<XPProgress currentXP={100} xpToNextLevel={500} />)
    })
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemin',
      '0',
    )
  })

  it('progressbar has aria-valuemax equal to xpToNextLevel', async () => {
    await act(async () => {
      render(<XPProgress currentXP={100} xpToNextLevel={750} />)
    })
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemax',
      '750',
    )
  })

  it('progressbar aria-label contains current and max XP', async () => {
    await act(async () => {
      render(<XPProgress currentXP={200} xpToNextLevel={1000} />)
    })
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('200'))
    expect(bar).toHaveAttribute('aria-label', expect.stringContaining('1,000'))
  })

  // -------------------------------------------------------------------------
  // Fill percentage clamping — overflow guard
  // -------------------------------------------------------------------------

  it('does not overflow when currentXP exceeds xpToNextLevel', async () => {
    // targetPercent is clamped to 100 — the fill bar width must not exceed 100%
    await act(async () => {
      render(<XPProgress currentXP={2000} xpToNextLevel={1000} />)
    })
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    // After rAF the width should be "100%" not "200%"
    expect(fillBar.style.width).toBe('100%')
  })

  it('shows 0% fill when currentXP is 0', async () => {
    await act(async () => {
      render(<XPProgress currentXP={0} xpToNextLevel={1000} />)
    })
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('0%')
  })

  it('shows 0% fill when xpToNextLevel is 0 (guard against division-by-zero)', async () => {
    await act(async () => {
      render(<XPProgress currentXP={500} xpToNextLevel={0} />)
    })
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('0%')
  })

  it('clamps to 0% when currentXP is negative', async () => {
    await act(async () => {
      render(<XPProgress currentXP={-100} xpToNextLevel={1000} />)
    })
    const progressbar = screen.getByRole('progressbar')
    const fillBar = progressbar.firstElementChild as HTMLElement
    expect(fillBar.style.width).toBe('0%')
  })

  // -------------------------------------------------------------------------
  // Optional className prop
  // -------------------------------------------------------------------------

  it('accepts custom className without crashing', async () => {
    await act(async () => {
      render(
        <XPProgress
          currentXP={100}
          xpToNextLevel={200}
          className="xp-custom"
        />,
      )
    })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
