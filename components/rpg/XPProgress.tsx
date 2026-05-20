'use client'

import { useEffect, useState } from 'react'

interface XPProgressProps {
  currentXP: number
  xpToNextLevel: number
  className?: string
}

export default function XPProgress({
  currentXP,
  xpToNextLevel,
  className = '',
}: XPProgressProps) {
  const targetPercent = Math.min(
    100,
    Math.max(0, xpToNextLevel > 0 ? (currentXP / xpToNextLevel) * 100 : 0),
  )
  const [fillPercent, setFillPercent] = useState(0)

  useEffect(() => {
    // Double rAF ensures browser has painted once before triggering transition
    let raf2: number
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setFillPercent(targetPercent)
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [targetPercent])

  const displayXP = currentXP.toLocaleString()
  const displayMax = xpToNextLevel.toLocaleString()

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] uppercase tracking-widest text-text-secondary">
          Experience
        </span>
        <span className="font-display text-[10px] tabular-nums text-neon-blue">
          {displayXP} <span className="text-text-secondary">/ {displayMax} XP</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`XP progress: ${displayXP} of ${displayMax}`}
        aria-valuenow={currentXP}
        aria-valuemin={0}
        aria-valuemax={xpToNextLevel}
        className="h-2 w-full rounded-full bg-surface-variant overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: '#00D4FF',
            boxShadow:
              '0 0 10px rgba(0,212,255,0.5), 0 0 4px rgba(0,212,255,0.8)',
          }}
        />
      </div>
    </div>
  )
}
