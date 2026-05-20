import { render, screen } from '@testing-library/react'
import ClassBadge from '@/components/rpg/ClassBadge'

// ClassBadge is a pure presentational component with no hooks.

describe('ClassBadge', () => {
  // -------------------------------------------------------------------------
  // Core rendering — known classes
  // -------------------------------------------------------------------------

  it('renders the player class name for Iron Body', () => {
    render(<ClassBadge playerClass="Iron Body" />)
    expect(screen.getByText('Iron Body')).toBeInTheDocument()
  })

  it('renders the player class name for Shadow Scholar', () => {
    render(<ClassBadge playerClass="Shadow Scholar" />)
    expect(screen.getByText('Shadow Scholar')).toBeInTheDocument()
  })

  it('renders the player class name for Silver Tongue', () => {
    render(<ClassBadge playerClass="Silver Tongue" />)
    expect(screen.getByText('Silver Tongue')).toBeInTheDocument()
  })

  it('renders the player class name for Iron Will', () => {
    render(<ClassBadge playerClass="Iron Will" />)
    expect(screen.getByText('Iron Will')).toBeInTheDocument()
  })

  it('renders the player class name for Coin Sovereign', () => {
    render(<ClassBadge playerClass="Coin Sovereign" />)
    expect(screen.getByText('Coin Sovereign')).toBeInTheDocument()
  })

  it('renders the player class name for Novice Hunter', () => {
    render(<ClassBadge playerClass="Novice Hunter" />)
    expect(screen.getByText('Novice Hunter')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Fallback behaviour — unknown class
  // -------------------------------------------------------------------------

  it('falls back to "Novice Hunter" when playerClass is not in the config', () => {
    render(<ClassBadge playerClass="Unknown Class" />)
    expect(screen.getByText('Novice Hunter')).toBeInTheDocument()
  })

  it('falls back to "Novice Hunter" when playerClass is an empty string', () => {
    render(<ClassBadge playerClass="" />)
    expect(screen.getByText('Novice Hunter')).toBeInTheDocument()
  })

  it('does not render the unknown class name when falling back', () => {
    render(<ClassBadge playerClass="Dragon Slayer" />)
    expect(screen.queryByText('Dragon Slayer')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Icon rendering
  // -------------------------------------------------------------------------

  it('renders the class icon for Iron Body', () => {
    render(<ClassBadge playerClass="Iron Body" />)
    expect(screen.getByText('⚔️')).toBeInTheDocument()
  })

  it('renders the fallback icon (Novice Hunter) for unknown classes', () => {
    render(<ClassBadge playerClass="Alien Class" />)
    expect(screen.getByText('🗡️')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // title attribute — description tooltip
  // -------------------------------------------------------------------------

  it('title attribute contains the class description for Iron Body', () => {
    render(<ClassBadge playerClass="Iron Body" />)
    // The <span> element has title={config.description}
    expect(screen.getByTitle('Thống trị thể chất')).toBeInTheDocument()
  })

  it('title attribute falls back to Novice Hunter description for unknown class', () => {
    render(<ClassBadge playerClass="???Unknown???" />)
    expect(
      screen.getByTitle('Đang hình thành con đường'),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // className passthrough
  // -------------------------------------------------------------------------

  it('accepts a custom className without crashing', () => {
    render(<ClassBadge playerClass="Iron Will" className="my-class" />)
    expect(screen.getByText('Iron Will')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Rendering all known classes without crash
  // -------------------------------------------------------------------------

  const KNOWN_CLASSES = [
    'Iron Body',
    'Shadow Scholar',
    'Silver Tongue',
    'Iron Will',
    'Coin Sovereign',
    'Novice Hunter',
  ] as const

  it.each(KNOWN_CLASSES)(
    'renders "%s" without crashing',
    (playerClass) => {
      const { unmount } = render(<ClassBadge playerClass={playerClass} />)
      expect(screen.getByText(playerClass)).toBeInTheDocument()
      unmount()
    },
  )
})
