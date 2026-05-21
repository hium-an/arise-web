'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCreateHabit } from '@/lib/queries/useHabits'
import { STAT_CODES } from '@/lib/rpg/stats'
import type { StatCode, StatsMap } from '@/lib/rpg/stats'
import type { LifeDomain, HabitFrequency, CreateHabitInput } from '@/types'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitCreateModalProps {
  open: boolean
  uid: string
  currentHabitCount: number
  onClose: () => void
}

// ─── Domain config ────────────────────────────────────────────────────────────

const DOMAIN_OPTIONS: { value: LifeDomain; label: string; icon: string; color: string; glowRgb: string }[] = [
  { value: 'physical', label: 'Physical', icon: '💪', color: '#FF4444', glowRgb: '255,68,68' },
  { value: 'mental', label: 'Mental', icon: '🧠', color: '#a855f7', glowRgb: '168,85,247' },
  { value: 'financial', label: 'Financial', icon: '💰', color: '#fbbf24', glowRgb: '251,191,36' },
  { value: 'social', label: 'Social', icon: '🤝', color: '#22c55e', glowRgb: '34,197,94' },
  { value: 'discipline', label: 'Discipline', icon: '🔥', color: '#00d4ff', glowRgb: '0,212,255' },
]

// ─── Frequency options ────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string; color: string; bg: string; border: string }[] = [
  { value: 'daily', label: 'Daily', color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)' },
  { value: 'weekly', label: 'Weekly', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)' },
]

// ─── Stat group config ────────────────────────────────────────────────────────

interface StatGroupDef {
  label: string
  color: string
  glowRgb: string
  codes: StatCode[]
}

const STAT_GROUPS: StatGroupDef[] = [
  { label: 'Physical', color: '#FF4444', glowRgb: '255,68,68', codes: ['STR', 'VIT', 'AGI'] },
  { label: 'Mental', color: '#a855f7', glowRgb: '168,85,247', codes: ['INT', 'WIS', 'FOC'] },
  { label: 'Financial', color: '#fbbf24', glowRgb: '251,191,36', codes: ['WLT', 'SAV', 'INV'] },
  { label: 'Social', color: '#22c55e', glowRgb: '34,197,94', codes: ['CHA', 'EMP', 'NET'] },
  { label: 'Discipline', color: '#00d4ff', glowRgb: '0,212,255', codes: ['WIL', 'PER', 'CON'] },
]

const STAT_FULL_NAME: Record<StatCode, string> = {
  STR: 'Strength', VIT: 'Vitality', AGI: 'Agility',
  INT: 'Intelligence', WIS: 'Wisdom', FOC: 'Focus',
  WLT: 'Wealth', SAV: 'Savings', INV: 'Investment',
  CHA: 'Charisma', EMP: 'Empathy', NET: 'Network',
  WIL: 'Willpower', PER: 'Persistence', CON: 'Consistency',
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string
  description: string
  domain: LifeDomain
  frequency: HabitFrequency
  statGains: Partial<Record<StatCode, number>>
}

function initialForm(): FormState {
  return {
    title: '',
    description: '',
    domain: 'discipline',
    frequency: 'daily',
    statGains: {},
  }
}

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputBase =
  'w-full px-3 py-2.5 rounded-lg text-sm placeholder:text-text-disabled outline-none focus:ring-2 focus:ring-neon-blue/40 transition-all'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#e2e8f0',
}

// ─── Animation variants ───────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.25, delay: 0.05 } },
}

const dialogVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: { duration: 0.25, ease: 'easeIn' as const },
  },
}

// ─── Section label ────────────────────────────────────────────────────────────

function FieldLabel({ children, htmlFor, optional }: {
  children: React.ReactNode
  htmlFor?: string
  optional?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 font-display text-[10px] tracking-[0.3em] uppercase text-text-secondary"
    >
      {children}
      {optional && (
        <span className="font-display text-[9px] tracking-normal text-text-disabled normal-case">(optional)</span>
      )}
    </label>
  )
}

// ─── HabitCreateModal ─────────────────────────────────────────────────────────

export default function HabitCreateModal({
  open,
  uid,
  currentHabitCount,
  onClose,
}: HabitCreateModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description', string>>>({})
  const [showStatsSection, setShowStatsSection] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)
  const [limitError, setLimitError] = useState(false)

  const createHabit = useCreateHabit()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const previousActiveRef = useRef<Element | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAtLimit = currentHabitCount >= 5

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement
      const t = setTimeout(() => titleInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    } else {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setForm(initialForm())
      setErrors({})
      setShowStatsSection(false)
      setSuccessFlash(false)
      setLimitError(false)
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
    }
  }, [open])

  // ESC to close + Tab focus trap
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<Record<'title' | 'description', string>> = {}
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (form.title.trim().length > 100) {
      newErrors.title = 'Max 100 characters'
    }
    if (form.description.length > 300) {
      newErrors.description = 'Max 300 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isAtLimit) return
    if (!validate()) return

    const statGains: StatsMap = {}
    for (const code of STAT_CODES) {
      const val = form.statGains[code]
      if (val !== undefined && val !== 0) {
        statGains[code] = val
      }
    }

    const input: CreateHabitInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      domain: form.domain,
      frequency: form.frequency,
      statGains,
    }

    try {
      await createHabit.mutateAsync({ uid, data: input, currentCount: currentHabitCount })
      setSuccessFlash(true)
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null
        onClose()
      }, 600)
    } catch (err) {
      if (err instanceof Error && err.message === 'HABIT_LIMIT_REACHED') {
        setLimitError(true)
      }
    }
  }

  function setStatGain(code: StatCode, value: number) {
    setForm((prev) => ({
      ...prev,
      statGains: { ...prev.statGains, [code]: value },
    }))
  }

  const selectedDomain = DOMAIN_OPTIONS.find((d) => d.value === form.domain)!
  const domainColor = selectedDomain.color
  const domainGlowRgb = selectedDomain.glowRgb
  const activeStatCount = STAT_CODES.filter((c) => (form.statGains[c] ?? 0) !== 0).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="habit-modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
          aria-hidden="true"
        >
          {/* Dialog panel */}
          <motion.div
            key="habit-modal-dialog"
            ref={dialogRef}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-modal-title"
            className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(240 10% 7%)',
              border: '1px solid rgba(255,255,255,0.09)',
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar — animates color with domain */}
            <motion.div
              className="h-[2px] w-full flex-shrink-0"
              animate={{
                background: `linear-gradient(90deg, transparent, ${domainColor}, transparent)`,
                boxShadow: `0 0 20px rgba(${domainGlowRgb},0.85)`,
              }}
              transition={{ duration: 0.35 }}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <motion.span
                  key={form.domain}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="text-lg leading-none select-none"
                  aria-hidden="true"
                >
                  {selectedDomain.icon}
                </motion.span>
                <h2
                  id="habit-modal-title"
                  className="font-display text-sm font-bold tracking-[0.2em] uppercase"
                  style={{
                    color: '#ffffff',
                    textShadow: `0 0 16px rgba(${domainGlowRgb},0.45)`,
                  }}
                >
                  New Habit
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close habit creation dialog"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-disabled hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Free tier limit warning */}
            {isAtLimit && (
              <div
                className="flex items-center gap-2 mx-5 mb-1 px-3 py-2.5 rounded-lg flex-shrink-0"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.30)',
                  boxShadow: '0 0 12px rgba(251,191,36,0.08)',
                }}
                role="alert"
              >
                <span className="text-[#fbbf24] text-xs" aria-hidden="true">⚠</span>
                <p className="text-[11px]" style={{ color: '#fbbf24' }}>
                  Free tier limit reached (5/5 habits). Remove an existing habit to add a new one.
                </p>
              </div>
            )}

            {/* Success flash */}
            <AnimatePresence>
              {successFlash && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 44 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-2 flex-shrink-0"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    borderBottom: '1px solid rgba(34,197,94,0.22)',
                    boxShadow: '0 0 16px rgba(34,197,94,0.10)',
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                    style={{ color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.8)' }}
                    aria-hidden="true"
                  >
                    ✓
                  </motion.span>
                  <span
                    className="font-display text-xs tracking-widest"
                    style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.5)' }}
                  >
                    Habit Created!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable form body */}
            <form
              id="habit-create-form"
              onSubmit={(e) => { void handleSubmit(e) }}
              className="overflow-y-auto flex-1 px-5 pt-1 pb-5 space-y-4"
              style={{ overscrollBehavior: 'contain' }}
              noValidate
            >
              {/* Title */}
              <div className="space-y-1.5">
                <FieldLabel htmlFor="habit-title">
                  Title <span className="text-red-400/80" aria-hidden="true">*</span>
                </FieldLabel>
                <input
                  id="habit-title"
                  ref={titleInputRef}
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={100}
                  placeholder="Enter habit title..."
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'habit-title-error' : undefined}
                  className={inputBase}
                  style={inputStyle}
                  disabled={isAtLimit}
                />
                <div className="flex items-center justify-between">
                  {errors.title ? (
                    <p id="habit-title-error" className="text-[10px] text-red-400" role="alert">
                      {errors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[10px] text-text-disabled tabular-nums">
                    {form.title.length}/100
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <FieldLabel htmlFor="habit-description" optional>
                  Description
                </FieldLabel>
                <textarea
                  id="habit-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  maxLength={300}
                  rows={2}
                  placeholder="Optional description..."
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'habit-desc-error' : undefined}
                  className={cn(inputBase, 'resize-none')}
                  style={inputStyle}
                  disabled={isAtLimit}
                />
                <div className="flex items-center justify-between">
                  {errors.description ? (
                    <p id="habit-desc-error" className="text-[10px] text-red-400" role="alert">
                      {errors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[10px] text-text-disabled tabular-nums">
                    {form.description.length}/300
                  </p>
                </div>
              </div>

              {/* Frequency — toggle: Daily | Weekly */}
              <div className="space-y-2">
                <FieldLabel>Frequency</FieldLabel>
                <div className="flex gap-2" role="group" aria-label="Habit frequency">
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const isSelected = form.frequency === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, frequency: opt.value }))}
                        aria-pressed={isSelected}
                        disabled={isAtLimit}
                        className="px-4 py-1.5 rounded-full font-display text-[9px] tracking-[0.25em] uppercase font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          color: isSelected ? opt.color : '#666688',
                          background: isSelected ? opt.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.07)'}`,
                          textShadow: isSelected ? `0 0 8px ${opt.color}80` : 'none',
                          boxShadow: isSelected ? `0 0 10px rgba(${opt.value === 'daily' ? '0,212,255' : '168,85,247'},0.14)` : 'none',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Domain — color swatch picker */}
              <div className="space-y-2">
                <FieldLabel>Domain</FieldLabel>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
                  role="group"
                  aria-label="Life domain"
                >
                  {DOMAIN_OPTIONS.map((opt) => {
                    const isSelected = form.domain === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, domain: opt.value }))}
                        aria-pressed={isSelected}
                        aria-label={opt.label}
                        title={opt.label}
                        disabled={isAtLimit}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: isSelected
                            ? `rgba(${opt.glowRgb},0.15)`
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? `rgba(${opt.glowRgb},0.50)` : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: isSelected ? `0 0 16px rgba(${opt.glowRgb},0.28)` : 'none',
                        }}
                      >
                        <span className="text-base leading-none select-none" aria-hidden="true">
                          {opt.icon}
                        </span>
                        <span
                          className="font-display text-[8px] tracking-wider uppercase leading-none"
                          style={{ color: isSelected ? opt.color : '#555577' }}
                        >
                          {opt.label.slice(0, 4)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Stat Gains — collapsible */}
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Toggle header */}
                <button
                  type="button"
                  onClick={() => setShowStatsSection((v) => !v)}
                  disabled={isAtLimit}
                  className="flex items-center gap-2 w-full px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-expanded={showStatsSection}
                  aria-controls="habit-stat-gains-section"
                >
                  <span className="font-display text-[10px] tracking-[0.3em] uppercase text-text-secondary flex-1 text-left">
                    Stat Gains
                  </span>
                  {activeStatCount > 0 && (
                    <span
                      className="font-display text-[9px] px-1.5 py-0.5 rounded-full tabular-nums"
                      style={{
                        background: 'rgba(0,212,255,0.12)',
                        border: '1px solid rgba(0,212,255,0.25)',
                        color: '#00d4ff',
                      }}
                    >
                      {activeStatCount}
                    </span>
                  )}
                  <span className="font-display text-[10px] text-text-disabled">(optional)</span>
                  <motion.span
                    animate={{ rotate: showStatsSection ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-text-disabled text-xs leading-none"
                    aria-hidden="true"
                  >
                    ▾
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showStatsSection && (
                    <motion.div
                      id="habit-stat-gains-section"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-3 pb-3 space-y-3.5"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {STAT_GROUPS.map((group) => (
                          <div key={group.label} className="pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-1 h-3 rounded-full"
                                style={{
                                  backgroundColor: group.color,
                                  boxShadow: `0 0 6px rgba(${group.glowRgb},0.6)`,
                                }}
                                aria-hidden="true"
                              />
                              <p
                                className="font-display text-[9px] tracking-widest uppercase"
                                style={{ color: group.color }}
                              >
                                {group.label}
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {group.codes.map((code) => {
                                const val = form.statGains[code] ?? 0
                                return (
                                  <div key={code} className="space-y-1">
                                    <label
                                      htmlFor={`habit-stat-${code}`}
                                      className="font-display text-[9px] tracking-wider text-text-disabled uppercase flex items-center gap-1"
                                    >
                                      {code}
                                      <span className="sr-only"> — {STAT_FULL_NAME[code]}</span>
                                      {val !== 0 && (
                                        <span
                                          className="w-1 h-1 rounded-full flex-shrink-0"
                                          style={{
                                            backgroundColor: val > 0 ? '#22c55e' : '#ef4444',
                                          }}
                                          aria-hidden="true"
                                        />
                                      )}
                                    </label>
                                    <input
                                      id={`habit-stat-${code}`}
                                      type="number"
                                      min={0}
                                      max={5}
                                      value={val}
                                      onChange={(e) =>
                                        setStatGain(code, Math.max(0, Math.min(5, Number(e.target.value))))
                                      }
                                      className="w-full px-2 py-1.5 rounded-md text-xs text-center focus:ring-1 focus:ring-neon-blue/50 transition-all"
                                      style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${
                                          val > 0
                                            ? 'rgba(34,197,94,0.35)'
                                            : 'rgba(255,255,255,0.08)'
                                        }`,
                                        color: val > 0 ? '#22c55e' : '#666688',
                                        outline: 'none',
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Limit error (from server) */}
              {limitError && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                  }}
                  role="alert"
                >
                  <span className="text-[#fbbf24] text-xs" aria-hidden="true">⚠</span>
                  <p className="text-[11px]" style={{ color: '#fbbf24' }}>Habit limit reached. Remove an existing habit first.</p>
                </div>
              )}

              {/* Mutation error */}
              {createHabit.isError && !limitError && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                  role="alert"
                >
                  <span className="text-red-400 text-xs" aria-hidden="true">⚠</span>
                  <p className="text-[11px] text-red-400">Failed to create habit. Please try again.</p>
                </div>
              )}
            </form>

            {/* Footer — submit */}
            <div
              className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-[0.25em] uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)] hover:text-text-secondary"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#555577',
                }}
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                form="habit-create-form"
                disabled={createHabit.isPending || successFlash || isAtLimit}
                className={cn(
                  'flex-[2] py-3 rounded-xl font-display text-xs tracking-[0.25em] uppercase font-bold',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]',
                  (createHabit.isPending || successFlash || isAtLimit)
                    ? 'cursor-not-allowed opacity-60'
                    : 'active:scale-[0.98]'
                )}
                whileHover={createHabit.isPending || successFlash || isAtLimit ? undefined : { filter: 'brightness(1.1)' }}
                animate={{
                  background: successFlash
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : `linear-gradient(135deg, ${domainColor}d0, ${domainColor}90)`,
                  boxShadow: successFlash
                    ? '0 0 24px rgba(34,197,94,0.55)'
                    : `0 0 20px rgba(${domainGlowRgb},0.42)`,
                }}
                transition={{ duration: 0.35 }}
                style={{ color: '#0A0A0F' }}
              >
                {createHabit.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                      aria-hidden="true"
                    />
                    Creating...
                  </span>
                ) : successFlash ? (
                  'Created!'
                ) : (
                  'Create Habit'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
