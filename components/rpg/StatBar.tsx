'use client'

import type { StatCode } from '@/lib/rpg/stats'

const STAT_LABEL_MAP: Record<StatCode, string> = {
  STR: 'Strength',
  VIT: 'Vitality',
  AGI: 'Agility',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  FOC: 'Focus',
  WLT: 'Wealth',
  SAV: 'Savings',
  INV: 'Investment',
  CHA: 'Charisma',
  EMP: 'Empathy',
  NET: 'Network',
  WIL: 'Willpower',
  PER: 'Persistence',
  CON: 'Consistency',
}

interface StatBarProps {
  statCode: StatCode
  value: number
  maxValue?: number
  glowColor?: string
  className?: string
}

export default function StatBar({
  statCode,
  value,
  maxValue = 100,
  glowColor = '#00D4FF',
  className = '',
}: StatBarProps) {
  const fillPercent = Math.min(100, Math.max(0, (value / maxValue) * 100))
  const fullName = STAT_LABEL_MAP[statCode]

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <abbr
          className="font-display text-[10px] uppercase tracking-widest text-text-secondary no-underline cursor-default"
          title={fullName}
          aria-label={fullName}
        >
          {statCode}
        </abbr>
        <span
          className="font-display text-[10px] tabular-nums"
          style={{ color: glowColor }}
          aria-hidden="true"
        >
          {value}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${fullName}: ${value} out of ${maxValue}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        className="h-1.5 w-full rounded-full bg-surface-variant overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: glowColor,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
      </div>
    </div>
  )
}
