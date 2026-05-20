'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCreateQuest } from '@/lib/queries/useQuests'
import { STAT_CODES } from '@/lib/rpg/stats'
import type { StatCode, StatsMap } from '@/lib/rpg/stats'
import type { QuestType, LifeDomain, CreateQuestInput } from '@/types'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuestCreateModalProps {
  open: boolean
  uid: string
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

// ─── Quest type config ────────────────────────────────────────────────────────

interface QuestTypeOption {
  value: QuestType
  label: string
  color: string
  bg: string
  border: string
}

const QUEST_TYPE_OPTIONS: QuestTypeOption[] = [
  { value: 'daily', label: 'Daily', color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)' },
  { value: 'weekly', label: 'Weekly', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)' },
  { value: 'main', label: 'Main', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  { value: 'side', label: 'Side', color: '#8888aa', bg: 'rgba(136,136,170,0.06)', border: 'rgba(136,136,170,0.18)' },
  { value: 'boss', label: 'Boss', color: '#FF4444', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.25)' },
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
  type: QuestType
  domain: LifeDomain
  xpReward: number
  statGains: Partial<Record<StatCode, number>>
  deadline: string
}

function initialForm(): FormState {
  return {
    title: '',
    description: '',
    type: 'daily',
    domain: 'discipline',
    xpReward: 50,
    statGains: {},
    deadline: '',
  }
}

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputBase =
  'w-full px-3 py-2.5 rounded-lg text-sm placeholder:text-text-disabled focus:ring-2 focus:ring-neon-blue/40 transition-all'

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#e2e8f0',
  outline: 'none',
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

// ─── QuestCreateModal ─────────────────────────────────────────────────────────

export default function QuestCreateModal({ open, uid, onClose }: QuestCreateModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [showStatsSection, setShowStatsSection] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)

  const createQuest = useCreateQuest()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const previousActiveRef = useRef<Element | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement
      const t = setTimeout(() => titleInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    } else {
      setForm(initialForm())
      setErrors({})
      setShowStatsSection(false)
      setSuccessFlash(false)
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
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (form.title.trim().length > 100) {
      newErrors.title = 'Max 100 characters'
    }
    if (form.description.length > 300) {
      newErrors.description = 'Max 300 characters'
    }
    if (form.xpReward < 1 || form.xpReward > 500) {
      newErrors.xpReward = 'Must be between 1 and 500'
    }
    if (form.deadline) {
      const deadlineDate = new Date(form.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const statGains: StatsMap = {}
    for (const code of STAT_CODES) {
      const val = form.statGains[code]
      if (val !== undefined && val !== 0) {
        statGains[code] = val
      }
    }

    const input: CreateQuestInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      domain: form.domain,
      xpReward: form.xpReward,
      statGains,
      deadline: form.deadline ? new Date(form.deadline) : undefined,
    }

    try {
      await createQuest.mutateAsync({ uid, data: input })
      setSuccessFlash(true)
      setTimeout(() => {
        onClose()
      }, 600)
    } catch {
      // error shown in mutation error banner
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
  // Count how many stat gains are non-zero
  const activeStatCount = STAT_CODES.filter((c) => (form.statGains[c] ?? 0) !== 0).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="quest-modal-backdrop"
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
            key="quest-modal-dialog"
            ref={dialogRef}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quest-modal-title"
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
                boxShadow: `0 0 16px rgba(${domainGlowRgb},0.7)`,
              }}
              transition={{ duration: 0.35 }}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Domain icon — animated */}
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
                  id="quest-modal-title"
                  className="font-display text-sm font-bold tracking-[0.2em] uppercase text-white"
                >
                  New Quest
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close quest creation dialog"
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

            {/* Success flash */}
            <AnimatePresence>
              {successFlash && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 40 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-2 flex-shrink-0"
                  style={{
                    background: 'rgba(34,197,94,0.10)',
                    borderBottom: '1px solid rgba(34,197,94,0.18)',
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <span style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.7)' }} aria-hidden="true">✓</span>
                  <span className="font-display text-xs tracking-widest text-neon-green">Quest Created!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable form body */}
            <form
              id="quest-create-form"
              onSubmit={(e) => { void handleSubmit(e) }}
              className="overflow-y-auto flex-1 px-5 pt-1 pb-5 space-y-4"
              style={{ overscrollBehavior: 'contain' }}
              noValidate
            >
              {/* Title */}
              <div className="space-y-1.5">
                <FieldLabel htmlFor="quest-title">
                  Title <span className="text-red-400/80" aria-hidden="true">*</span>
                </FieldLabel>
                <input
                  id="quest-title"
                  ref={titleInputRef}
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={100}
                  placeholder="Enter quest title..."
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'quest-title-error' : undefined}
                  className={inputBase}
                  style={inputStyle}
                />
                <div className="flex items-center justify-between">
                  {errors.title ? (
                    <p id="quest-title-error" className="text-[10px] text-red-400" role="alert">
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
                <FieldLabel htmlFor="quest-description" optional>
                  Description
                </FieldLabel>
                <textarea
                  id="quest-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  maxLength={300}
                  rows={2}
                  placeholder="Optional description..."
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'quest-desc-error' : undefined}
                  className={cn(inputBase, 'resize-none')}
                  style={inputStyle}
                />
                <div className="flex items-center justify-between">
                  {errors.description ? (
                    <p id="quest-desc-error" className="text-[10px] text-red-400" role="alert">
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

              {/* Type — pill selector */}
              <div className="space-y-2">
                <FieldLabel>Type</FieldLabel>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Quest type">
                  {QUEST_TYPE_OPTIONS.map((opt) => {
                    const isSelected = form.type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, type: opt.value }))}
                        aria-pressed={isSelected}
                        className="px-3 py-1.5 rounded-full font-display text-[9px] tracking-[0.25em] uppercase font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]"
                        style={{
                          color: isSelected ? opt.color : '#666688',
                          background: isSelected ? opt.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.07)'}`,
                          textShadow: isSelected ? `0 0 8px ${opt.color}80` : 'none',
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
                        className="flex flex-col items-center gap-1 py-2 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]"
                        style={{
                          background: isSelected
                            ? `rgba(${opt.glowRgb},0.14)`
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? `rgba(${opt.glowRgb},0.45)` : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: isSelected ? `0 0 12px rgba(${opt.glowRgb},0.25)` : 'none',
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

              {/* XP Reward + Deadline row */}
              <div className="grid grid-cols-2 gap-3">
                {/* XP Reward */}
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="quest-xp">XP Reward</FieldLabel>
                  <div className="relative">
                    <input
                      id="quest-xp"
                      type="number"
                      min={1}
                      max={500}
                      value={form.xpReward}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, xpReward: Math.max(1, Math.min(500, Number(e.target.value))) }))
                      }
                      aria-invalid={!!errors.xpReward}
                      aria-describedby={errors.xpReward ? 'quest-xp-error' : undefined}
                      className={inputBase}
                      style={{ ...inputStyle, color: '#fbbf24', paddingRight: '2.5rem' }}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[9px] font-bold text-text-disabled pointer-events-none"
                      aria-hidden="true"
                    >
                      XP
                    </span>
                  </div>
                  {errors.xpReward && (
                    <p id="quest-xp-error" className="text-[10px] text-red-400" role="alert">
                      {errors.xpReward}
                    </p>
                  )}
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="quest-deadline" optional>Deadline</FieldLabel>
                  <input
                    id="quest-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                    aria-invalid={!!errors.deadline}
                    aria-describedby={errors.deadline ? 'quest-deadline-error' : undefined}
                    className={inputBase}
                    style={inputStyle}
                  />
                  {errors.deadline && (
                    <p id="quest-deadline-error" className="text-[10px] text-red-400" role="alert">
                      {errors.deadline}
                    </p>
                  )}
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
                  className="flex items-center gap-2 w-full px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon-blue/50"
                  aria-expanded={showStatsSection}
                  aria-controls="stat-gains-section"
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
                      id="stat-gains-section"
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
                                      htmlFor={`stat-${code}`}
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
                                      id={`stat-${code}`}
                                      type="number"
                                      min={-10}
                                      max={10}
                                      value={val}
                                      onChange={(e) => setStatGain(code, Number(e.target.value))}
                                      className="w-full px-2 py-1.5 rounded-md text-xs text-center focus:ring-1 focus:ring-neon-blue/50 transition-all"
                                      style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${
                                          val > 0
                                            ? 'rgba(34,197,94,0.35)'
                                            : val < 0
                                              ? 'rgba(239,68,68,0.35)'
                                              : 'rgba(255,255,255,0.08)'
                                        }`,
                                        color:
                                          val > 0
                                            ? '#22c55e'
                                            : val < 0
                                              ? '#ef4444'
                                              : '#666688',
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

              {/* Mutation error */}
              {createQuest.isError && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                  role="alert"
                >
                  <span className="text-red-400 text-xs" aria-hidden="true">⚠</span>
                  <p className="text-[11px] text-red-400">Failed to create quest. Please try again.</p>
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
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-[0.25em] uppercase transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#666688',
                }}
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                form="quest-create-form"
                disabled={createQuest.isPending || successFlash}
                className={cn(
                  'flex-[2] py-3 rounded-xl font-display text-xs tracking-[0.25em] uppercase font-bold',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(240_10%_7%)]',
                  (createQuest.isPending || successFlash)
                    ? 'cursor-not-allowed opacity-60'
                    : 'active:scale-[0.98]'
                )}
                whileHover={createQuest.isPending || successFlash ? undefined : { filter: 'brightness(1.1)' }}
                animate={{
                  background: successFlash
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : `linear-gradient(135deg, ${domainColor}d0, ${domainColor}90)`,
                  boxShadow: successFlash
                    ? '0 0 20px rgba(34,197,94,0.45)'
                    : `0 0 20px rgba(${domainGlowRgb},0.35)`,
                }}
                transition={{ duration: 0.35 }}
                style={{ color: '#0A0A0F' }}
              >
                {createQuest.isPending
                  ? 'Creating...'
                  : successFlash
                    ? 'Created!'
                    : 'Create Quest'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
