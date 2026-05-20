'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LevelUpEvent } from '@/lib/store/uiStore'
import type { StatCode } from '@/lib/rpg/stats'

const STAT_LABEL: Record<StatCode, string> = {
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

interface LevelUpOverlayProps {
  event: LevelUpEvent | null
  onDismiss: () => void
}

// ─── Backdrop — fades in with a blue radial burst ─────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4, ease: 'easeIn' as const, delay: 0.05 },
  },
}

// ─── Radial burst — quick flash then settles ──────────────────────────────────

const burstVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: [0, 1, 0.7, 1],
    scale: [0.6, 1.15, 1.0, 1.0],
    transition: { duration: 0.6, times: [0, 0.25, 0.55, 1], ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    scale: 1.2,
    transition: { duration: 0.35 },
  },
}

// ─── Panel slides in from below with spring feel ─────────────────────────────

const panelVariants = {
  hidden: { opacity: 0, y: 72, scale: 0.93 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.2,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -24,
    scale: 0.97,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
}

// ─── Scanning line that sweeps down the panel once ───────────────────────────

const scanVariants = {
  hidden: { scaleX: 0, opacity: 0, top: 0 },
  visible: {
    scaleX: 1,
    opacity: [0, 0.8, 0],
    top: ['0%', '100%'],
    transition: { delay: 0.55, duration: 0.7, ease: 'easeInOut' as const },
  },
}

// ─── "LEVEL UP" label — scales in with a punch ───────────────────────────────

const labelVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.38,
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  },
}

// ─── Level number — punches in then pulses ────────────────────────────────────

const levelNumberVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: [0.5, 1.12, 0.96, 1.04, 1],
    transition: {
      delay: 0.5,
      duration: 0.7,
      times: [0, 0.45, 0.65, 0.82, 1],
      ease: 'easeOut' as const,
    },
  },
}

// ─── Subtle staggered text fade-up ───────────────────────────────────────────

const textVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.4, ease: 'easeOut' as const },
  }),
}

// ─── Stat rows slide in from left ────────────────────────────────────────────

const statRowVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.9 + i * 0.09,
      duration: 0.35,
      ease: 'easeOut' as const,
    },
  }),
}

// ─── Particle burst — 8 decorative sparks radiate outward ────────────────────

const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const SPARK_COLORS = ['#00d4ff', '#a855f7', '#00d4ff', '#ffffff', '#a855f7', '#00d4ff', '#ffffff', '#a855f7']

function SparkBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {SPARK_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const tx = Math.cos(rad) * 140
        const ty = Math.sin(rad) * 140
        return (
          <motion.div
            key={angle}
            className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: SPARK_COLORS[i], marginLeft: -2, marginTop: -2 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: tx,
              y: ty,
              opacity: [1, 1, 0],
              scale: [1, 1.5, 0],
            }}
            transition={{
              delay: 0.22 + i * 0.03,
              duration: 0.6,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}

export default function LevelUpOverlay({ event, onDismiss }: LevelUpOverlayProps) {
  const dismissButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveRef = useRef<Element | null>(null)

  // Focus management — trap focus in dialog when visible
  useEffect(() => {
    if (event) {
      previousActiveRef.current = document.activeElement
      const t = setTimeout(() => {
        dismissButtonRef.current?.focus()
      }, 500)
      return () => clearTimeout(t)
    } else {
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
    }
  }, [event])

  // ESC key dismissal + Tab focus trap
  useEffect(() => {
    if (!event) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
      if (e.key === 'Tab') {
        e.preventDefault()
        dismissButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [event, onDismiss])

  const gainedEntries = event
    ? (Object.entries(event.statsGained) as [StatCode, number][]).filter(([, val]) => val > 0)
    : []

  return (
    <AnimatePresence>
      {event && (
        // Full-screen backdrop
        <motion.div
          key="level-up-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,212,255,0.12) 0%, rgba(0,0,0,0.96) 65%)',
          }}
          onClick={onDismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-title"
        >
          {/* Radial burst — decorative atmosphere halo */}
          <motion.div
            variants={burstVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at center, rgba(0,212,255,0.18) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)',
            }}
          />

          {/* Content panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-[min(440px,92vw)] mx-4 rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(240 10% 8%)',
              border: '1px solid rgba(0,212,255,0.35)',
              boxShadow:
                '0 0 80px rgba(0,212,255,0.22), 0 0 160px rgba(138,92,246,0.12), inset 0 0 60px rgba(0,212,255,0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scanning sweep line (plays once on mount) */}
            <motion.div
              variants={scanVariants}
              initial="hidden"
              animate="visible"
              className="absolute left-0 right-0 h-px pointer-events-none z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.9), rgba(168,85,247,0.9), transparent)',
              }}
              aria-hidden="true"
            />

            {/* Top gradient bar */}
            <div
              className="h-[2px] w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #00d4ff, #a855f7, transparent)',
                boxShadow: '0 0 12px rgba(0,212,255,0.5)',
              }}
              aria-hidden="true"
            />

            <div className="px-8 py-10 flex flex-col items-center gap-5 text-center">
              {/* Spark burst (fires once) */}
              <SparkBurst />

              {/* "★ LEVEL UP ★" label */}
              <motion.p
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                className="font-display text-sm tracking-[0.55em] font-bold uppercase"
                style={{
                  color: '#00d4ff',
                  textShadow: '0 0 16px rgba(0,212,255,0.9), 0 0 32px rgba(0,212,255,0.5)',
                }}
                aria-hidden="true"
              >
                ★ &nbsp;LEVEL UP&nbsp; ★
              </motion.p>

              {/* Level number — visual centrepiece */}
              <motion.div
                variants={levelNumberVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center gap-2"
              >
                <span
                  id="level-up-title"
                  className="font-display font-black tracking-widest"
                  style={{
                    fontSize: 'clamp(4rem, 18vw, 6.5rem)',
                    lineHeight: 1,
                    background: 'linear-gradient(160deg, #ffffff 0%, #00d4ff 40%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 32px rgba(0,212,255,0.7)) drop-shadow(0 0 8px rgba(168,85,247,0.4))',
                  }}
                  aria-label={`Level ${event.newLevel}`}
                >
                  {event.newLevel}
                </span>
                <motion.span
                  custom={0.72}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="font-display text-[11px] tracking-[0.4em] uppercase"
                  style={{ color: 'rgba(136,136,170,0.9)' }}
                >
                  New Level Reached
                </motion.span>
              </motion.div>

              {/* Divider with neon glow */}
              <motion.div
                custom={0.75}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="w-32 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), rgba(168,85,247,0.6), transparent)',
                  boxShadow: '0 0 6px rgba(0,212,255,0.3)',
                }}
                aria-hidden="true"
              />

              {/* Stats gained */}
              {gainedEntries.length > 0 && (
                <div
                  className="w-full flex flex-col gap-2"
                  role="list"
                  aria-label="Stats gained"
                >
                  <p
                    className="font-display text-[9px] tracking-[0.45em] uppercase mb-0.5"
                    style={{ color: 'rgba(136,136,170,0.7)' }}
                  >
                    Stats Gained
                  </p>
                  {gainedEntries.map(([code, val], i) => (
                    <motion.div
                      key={code}
                      custom={i}
                      variants={statRowVariants}
                      initial="hidden"
                      animate="visible"
                      role="listitem"
                      className="flex items-center justify-between px-4 py-2 rounded-lg"
                      style={{
                        background: 'rgba(0,212,255,0.05)',
                        border: '1px solid rgba(0,212,255,0.12)',
                      }}
                    >
                      <span className="font-display text-xs" style={{ color: '#8888aa' }}>
                        {STAT_LABEL[code]}
                      </span>
                      <span
                        className="font-display text-sm font-bold"
                        style={{
                          color: '#22c55e',
                          textShadow: '0 0 10px rgba(34,197,94,0.8)',
                        }}
                      >
                        +{val}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Dismiss button */}
              <motion.button
                ref={dismissButtonRef}
                custom={gainedEntries.length > 0 ? 1.0 + gainedEntries.length * 0.09 : 0.82}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                onClick={onDismiss}
                className="mt-1 w-full py-3.5 rounded-xl font-display text-xs tracking-[0.35em] uppercase font-bold transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(240_10%_8%)]"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
                  color: '#0A0A0F',
                  boxShadow: '0 0 28px rgba(0,212,255,0.35), 0 0 8px rgba(168,85,247,0.2)',
                }}
                aria-label={`Dismiss level up notification — you are now level ${event.newLevel}`}
              >
                Continue
              </motion.button>
            </div>

            {/* Bottom gradient bar */}
            <div
              className="h-[2px] w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #a855f7, #00d4ff, transparent)',
                boxShadow: '0 0 12px rgba(168,85,247,0.5)',
              }}
              aria-hidden="true"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
