import { cn } from '@/lib/utils'

interface RpgCardProps {
  children: React.ReactNode
  className?: string
  glow?: 'blue' | 'purple' | 'gold' | 'green' | 'none'
  padding?: 'sm' | 'md' | 'lg'
}

const glowAccentClass: Record<NonNullable<RpgCardProps['glow']>, string> = {
  blue: 'from-transparent via-neon-blue/60 to-transparent',
  purple: 'from-transparent via-neon-purple/60 to-transparent',
  gold: 'from-transparent via-[rgba(255,215,0,0.6)] to-transparent',
  green: 'from-transparent via-[rgba(0,255,136,0.6)] to-transparent',
  none: '',
}

const glowShadowClass: Record<NonNullable<RpgCardProps['glow']>, string> = {
  blue: 'shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(0,212,255,0.3),0_0_4px_rgba(0,212,255,0.15)]',
  purple: 'shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(139,92,246,0.3),0_0_4px_rgba(139,92,246,0.15)]',
  gold: 'shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(255,215,0,0.3),0_0_4px_rgba(255,215,0,0.15)]',
  green: 'shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(0,255,136,0.3),0_0_4px_rgba(0,255,136,0.15)]',
  none: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
}

const paddingClass: Record<NonNullable<RpgCardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function RpgCard({
  children,
  className,
  glow = 'none',
  padding = 'md',
}: RpgCardProps) {
  return (
    <div
      className={cn(
        'relative bg-surface border border-border rounded-xl',
        glowShadowClass[glow],
        paddingClass[padding],
        className
      )}
    >
      {glow !== 'none' && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r',
            glowAccentClass[glow]
          )}
        />
      )}
      {children}
    </div>
  )
}
