'use client'

import { motion } from 'framer-motion'
import RpgCard from '@/components/ui/rpg-card'
import { cn } from '@/lib/utils'
import type { Quest, QuestType, LifeDomain } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuestCardProps {
  quest: Quest
  onComplete?: (questId: string) => void
  onDelete?: (questId: string) => void
  isCompleting?: boolean
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

// ─── Quest type badge config ───────────────────────────────────────────────────

const QUEST_TYPE_STYLE: Record<QuestType, { label: string; color: string; bg: string; border: string }> = {
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
  main: {
    label: 'MAIN',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.30)',
  },
  side: {
    label: 'SIDE',
    color: '#8888aa',
    bg: 'rgba(136,136,170,0.08)',
    border: 'rgba(136,136,170,0.20)',
  },
  boss: {
    label: 'BOSS ☠',
    color: '#FF4444',
    bg: 'rgba(255,68,68,0.10)',
    border: 'rgba(255,68,68,0.30)',
  },
}

// ─── QuestCard ────────────────────────────────────────────────────────────────

export default function QuestCard({
  quest,
  onComplete,
  onDelete,
  isCompleting = false,
}: QuestCardProps) {
  const isCompleted = quest.status === 'completed'
  const isActive = quest.status === 'active'
  const domainCfg = DOMAIN_CONFIG[quest.domain]
  const typeCfg = QUEST_TYPE_STYLE[quest.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      whileHover={!isCompleted ? { y: -2 } : undefined}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <RpgCard
        glow={isCompleted ? 'none' : domainCfg.rpgGlow}
        padding="sm"
        className={cn(
          'relative flex flex-col gap-2.5 pl-5 transition-opacity duration-300',
          isCompleted && 'opacity-55'
        )}
      >
        {/* Domain color left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{
            backgroundColor: isCompleted
              ? 'rgba(136,136,170,0.25)'
              : domainCfg.color,
            boxShadow: isCompleted
              ? 'none'
              : `0 0 10px rgba(${domainCfg.glowRgb},0.6), 0 0 20px rgba(${domainCfg.glowRgb},0.2)`,
          }}
          aria-hidden="true"
        />

        {/* Header row: domain icon + type badge + active dot | XP badge right */}
        <div className="flex items-center gap-2 pr-2">
          {/* Domain icon */}
          <span
            className="text-sm leading-none select-none flex-shrink-0"
            role="img"
            aria-label={domainCfg.label}
          >
            {domainCfg.icon}
          </span>

          {/* Quest type badge */}
          <span
            className="font-display text-[9px] tracking-[0.25em] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              color: typeCfg.color,
              background: typeCfg.bg,
              border: `1px solid ${typeCfg.border}`,
            }}
          >
            {typeCfg.label}
          </span>

          {/* Active glow indicator */}
          {isActive && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
              style={{
                backgroundColor: domainCfg.color,
                boxShadow: `0 0 6px rgba(${domainCfg.glowRgb},0.9)`,
              }}
              aria-label="Active"
            />
          )}

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* XP badge — inline right of header */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(251,191,36,0.10)',
              border: '1px solid rgba(251,191,36,0.28)',
            }}
            aria-label={`${quest.xpReward} XP reward`}
          >
            <span
              className="font-display text-[9px] font-bold tabular-nums leading-none"
              style={{
                color: '#fbbf24',
                textShadow: '0 0 8px rgba(251,191,36,0.6)',
              }}
            >
              +{quest.xpReward} XP
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-1.5 pr-2">
          {isCompleted && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="text-xs leading-[1.4] flex-shrink-0 mt-px"
              style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.7)' }}
              aria-hidden="true"
            >
              ✓
            </motion.span>
          )}
          <h3
            className={cn(
              'font-display text-sm font-bold leading-snug flex-1 min-w-0',
              isCompleted ? 'line-through text-text-disabled' : 'text-white'
            )}
          >
            {quest.title}
          </h3>
        </div>

        {/* Description */}
        {quest.description && (
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pr-2">
            {quest.description}
          </p>
        )}

        {/* Deadline */}
        {quest.deadline && !isCompleted && (
          <p className="font-display text-[9px] tracking-wider text-text-disabled uppercase flex items-center gap-1">
            <span aria-hidden="true" className="opacity-60">◷</span>
            Due: {quest.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}

        {/* Actions row */}
        {!isCompleted && (
          <div className="flex items-center gap-2 pt-0.5">
            {onComplete && (
              <button
                onClick={() => onComplete(quest.id)}
                disabled={isCompleting}
                aria-label={`Complete quest: ${quest.title}`}
                className={cn(
                  'flex-1 py-2 rounded-lg font-display text-[10px] tracking-[0.25em] uppercase font-bold',
                  'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                  isCompleting
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:brightness-110 active:scale-[0.98]'
                )}
                style={{
                  background: isCompleting
                    ? 'rgba(255,255,255,0.04)'
                    : `linear-gradient(135deg, rgba(${domainCfg.glowRgb},0.18), rgba(${domainCfg.glowRgb},0.08))`,
                  border: `1px solid rgba(${domainCfg.glowRgb},${isCompleting ? '0.20' : '0.45'})`,
                  color: isCompleting ? '#444466' : domainCfg.color,
                  textShadow: isCompleting ? 'none' : `0 0 8px rgba(${domainCfg.glowRgb},0.4)`,
                }}
              >
                {isCompleting ? '...' : 'Complete'}
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(quest.id)}
                disabled={isCompleting}
                aria-label={`Delete quest: ${quest.title}`}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  'border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                  isCompleting
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
        )}

        {/* Completed timestamp */}
        {isCompleted && quest.completedAt && (
          <p className="font-display text-[9px] tracking-wider text-neon-green/50 uppercase flex items-center gap-1">
            <span aria-hidden="true">✓</span>
            Completed {quest.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}

        {/* Completed muted overlay */}
        {isCompleted && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'rgba(10,10,15,0.25)' }}
            aria-hidden="true"
          />
        )}
      </RpgCard>
    </motion.div>
  )
}
