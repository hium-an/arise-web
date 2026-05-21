'use client'

import { motion, AnimatePresence } from 'framer-motion'
import RpgCard from '@/components/ui/rpg-card'
import { cn } from '@/lib/utils'
import type { Habit, LifeDomain } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HabitCardProps {
  habit: Habit
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
  isToggling?: boolean
}

// ─── Domain config ────────────────────────────────────────────────────────────

interface DomainConfig {
  color: string
  glowRgb: string
  icon: string
  label: string
  rpgGlow: 'blue' | 'purple' | 'gold' | 'green' | 'none'
}

const DOMAIN_CONFIG: Record<LifeDomain, DomainConfig> = {
  physical: {
    color: '#FF4444',
    glowRgb: '255,68,68',
    icon: '💪',
    label: 'Physical',
    rpgGlow: 'none',
  },
  mental: {
    color: '#a855f7',
    glowRgb: '168,85,247',
    icon: '🧠',
    label: 'Mental',
    rpgGlow: 'purple',
  },
  financial: {
    color: '#fbbf24',
    glowRgb: '251,191,36',
    icon: '💰',
    label: 'Financial',
    rpgGlow: 'gold',
  },
  social: {
    color: '#22c55e',
    glowRgb: '34,197,94',
    icon: '🤝',
    label: 'Social',
    rpgGlow: 'green',
  },
  discipline: {
    color: '#00d4ff',
    glowRgb: '0,212,255',
    icon: '🔥',
    label: 'Discipline',
    rpgGlow: 'blue',
  },
}

// ─── Frequency badge styles ───────────────────────────────────────────────────

const FREQUENCY_STYLE = {
  daily: {
    label: 'DAILY',
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.10)',
    border: 'rgba(0,212,255,0.30)',
  },
  weekly: {
    label: 'WEEKLY',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.10)',
    border: 'rgba(168,85,247,0.30)',
  },
}

// ─── Streak thresholds ────────────────────────────────────────────────────────

function getStreakStyle(streak: number) {
  if (streak >= 30) {
    return {
      color: '#fbbf24',
      shadow: '0 0 16px rgba(251,191,36,0.9), 0 0 32px rgba(251,191,36,0.4)',
      size: 'text-lg',
    }
  }
  if (streak >= 7) {
    return {
      color: '#fbbf24',
      shadow: '0 0 12px rgba(251,191,36,0.75)',
      size: 'text-base',
    }
  }
  if (streak >= 1) {
    return {
      color: '#00d4ff',
      shadow: '0 0 8px rgba(0,212,255,0.55)',
      size: 'text-sm',
    }
  }
  return {
    color: '#444466',
    shadow: 'none',
    size: 'text-sm',
  }
}

// ─── HabitCard ────────────────────────────────────────────────────────────────

export default function HabitCard({
  habit,
  onToggle,
  onDelete,
  isToggling = false,
}: HabitCardProps) {
  const domainCfg = DOMAIN_CONFIG[habit.domain]
  const freqCfg = FREQUENCY_STYLE[habit.frequency]

  const todayStr = new Date().toISOString().slice(0, 10)
  const isCompletedToday = habit.completionLog.includes(todayStr)

  const streakStyle = getStreakStyle(habit.streak)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      whileHover={!isCompletedToday ? { y: -2 } : undefined}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <RpgCard
        glow={isCompletedToday ? 'none' : domainCfg.rpgGlow}
        padding="sm"
        className={cn(
          'relative flex flex-col gap-3 pl-5 transition-opacity duration-300',
          isCompletedToday && 'opacity-55'
        )}
      >
        {/* Domain color left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{
            backgroundColor: isCompletedToday
              ? 'rgba(136,136,170,0.25)'
              : domainCfg.color,
            boxShadow: isCompletedToday
              ? 'none'
              : `0 0 10px rgba(${domainCfg.glowRgb},0.6), 0 0 20px rgba(${domainCfg.glowRgb},0.2)`,
          }}
          aria-hidden="true"
        />

        {/* Header row: domain icon + frequency badge + spacer + streak counter */}
        <div className="flex items-center gap-2 pr-2">
          {/* Domain icon */}
          <span
            className="text-sm leading-none select-none flex-shrink-0"
            role="img"
            aria-label={domainCfg.label}
          >
            {domainCfg.icon}
          </span>

          {/* Frequency badge — matches QuestCard type badge exactly */}
          <span
            className="font-display text-[9px] tracking-[0.25em] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              color: freqCfg.color,
              background: freqCfg.bg,
              border: `1px solid ${freqCfg.border}`,
            }}
          >
            {freqCfg.label}
          </span>

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Streak counter — focal point, scales with streak magnitude */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full"
            style={{
              background:
                habit.streak >= 1
                  ? habit.streak >= 7
                    ? 'rgba(251,191,36,0.10)'
                    : 'rgba(0,212,255,0.08)'
                  : 'rgba(255,255,255,0.03)',
              border:
                habit.streak >= 1
                  ? habit.streak >= 7
                    ? '1px solid rgba(251,191,36,0.30)'
                    : '1px solid rgba(0,212,255,0.22)'
                  : '1px solid rgba(255,255,255,0.06)',
            }}
            aria-label={`Streak: ${habit.streak} ${habit.streak === 1 ? 'day' : 'days'}`}
          >
            <span
              className={cn('leading-none select-none', habit.streak >= 7 ? 'text-sm' : 'text-xs')}
              aria-hidden="true"
            >
              🔥
            </span>
            <span
              className={cn(
                'font-display font-black tabular-nums leading-none',
                streakStyle.size
              )}
              style={{
                color: streakStyle.color,
                textShadow: streakStyle.shadow,
              }}
            >
              {habit.streak}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-sm font-bold leading-snug pr-2 text-white">
          {habit.title}
        </h3>

        {/* Description (optional) */}
        {habit.description && (
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pr-2 -mt-1">
            {habit.description}
          </p>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Check In / Done Today button */}
          {isCompletedToday ? (
            <motion.button
              disabled
              aria-label="Already completed today"
              className="flex-1 py-2.5 rounded-lg font-display text-[10px] tracking-[0.25em] uppercase font-bold flex items-center justify-center gap-2 cursor-not-allowed"
              animate={{
                boxShadow: [
                  '0 0 8px rgba(34,197,94,0.20)',
                  '0 0 16px rgba(34,197,94,0.40)',
                  '0 0 8px rgba(34,197,94,0.20)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#22c55e',
                textShadow: '0 0 10px rgba(34,197,94,0.6)',
              }}
            >
              <motion.span
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                className="text-base leading-none"
                aria-hidden="true"
              >
                ✓
              </motion.span>
              Done Today
            </motion.button>
          ) : (
            onToggle && (
              <button
                onClick={() => onToggle(habit.id)}
                disabled={isToggling}
                aria-label={`Check in habit: ${habit.title}`}
                className={cn(
                  'flex-1 py-2.5 rounded-lg font-display text-[10px] tracking-[0.25em] uppercase font-bold flex items-center justify-center gap-2',
                  'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                  isToggling
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:brightness-115 active:scale-[0.97]'
                )}
                style={{
                  background: isToggling
                    ? 'rgba(255,255,255,0.04)'
                    : `linear-gradient(135deg, rgba(${domainCfg.glowRgb},0.20), rgba(${domainCfg.glowRgb},0.08))`,
                  border: `1px solid rgba(${domainCfg.glowRgb},${isToggling ? '0.20' : '0.50'})`,
                  color: isToggling ? '#444466' : domainCfg.color,
                  textShadow: isToggling ? 'none' : `0 0 10px rgba(${domainCfg.glowRgb},0.5)`,
                  boxShadow: isToggling ? 'none' : `0 0 14px rgba(${domainCfg.glowRgb},0.12)`,
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isToggling ? (
                    <motion.span
                      key="spinner"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      Check In
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={() => onDelete(habit.id)}
              disabled={isToggling}
              aria-label={`Delete habit: ${habit.title}`}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                'border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                isToggling
                  ? 'cursor-not-allowed opacity-30 border-white/5 text-text-disabled'
                  : 'border-white/6 text-text-disabled hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
              )}
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                aria-hidden="true"
                className="flex-shrink-0"
              >
                <path
                  d="M1 1L10 10M10 1L1 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Completed today muted overlay */}
        {isCompletedToday && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'rgba(10,10,15,0.20)' }}
            aria-hidden="true"
          />
        )}
      </RpgCard>
    </motion.div>
  )
}
