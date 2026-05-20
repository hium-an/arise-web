interface LevelBadgeProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CONFIG = {
  sm: { outer: 'w-10 h-10', text: 'text-xs', innerOffset: 3 },
  md: { outer: 'w-16 h-16', text: 'text-lg', innerOffset: 3 },
  lg: { outer: 'w-24 h-24', text: 'text-2xl', innerOffset: 4 },
} as const

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

export default function LevelBadge({
  level,
  size = 'md',
  className = '',
}: LevelBadgeProps) {
  const config = SIZE_CONFIG[size]

  return (
    <div
      role="img"
      aria-label={`Level ${level}`}
      className={`relative flex items-center justify-center flex-shrink-0 ${config.outer} ${className}`}
      style={{
        clipPath: HEX_CLIP,
        background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
        filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))',
      }}
    >
      <div
        className="absolute flex items-center justify-center bg-surface-variant"
        style={{
          clipPath: HEX_CLIP,
          inset: `${config.innerOffset}px`,
        }}
      >
        <span
          className={`font-display font-black text-neon-blue text-glow-blue select-none ${config.text}`}
          aria-hidden="true"
        >
          {level}
        </span>
      </div>
    </div>
  )
}
