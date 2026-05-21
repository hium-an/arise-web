'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHabits, useToggleHabit, useDeleteHabit } from '@/lib/queries/useHabits'
import HabitCard from '@/components/rpg/HabitCard'
import HabitCreateModal from '@/components/rpg/HabitCreateModal'
import useAuth from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Habit, HabitFrequency } from '@/types'

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'all' | HabitFrequency

interface TabConfig {
  id: TabId
  label: string
}

const TABS: TabConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('rounded animate-pulse', className)}
      style={{ background: 'rgba(255,255,255,0.06)', ...style }}
      aria-hidden="true"
    />
  )
}

function HabitCardSkeleton() {
  return (
    <div
      className="relative rounded-xl pl-5 pr-4 py-4 space-y-3"
      style={{
        background: '#12121A',
        border: '1px solid rgba(255,255,255,0.07)',
        minHeight: 120,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      <div className="flex items-center gap-2">
        <SkeletonBlock className="w-5 h-5 rounded-md flex-shrink-0" />
        <SkeletonBlock className="w-14 h-4 rounded-full" />
        <div className="flex-1" />
        <SkeletonBlock className="w-16 h-5 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-3/4 rounded" />
      <SkeletonBlock className="h-3 w-1/2 rounded" />
      <SkeletonBlock className="h-9 w-full rounded-lg mt-1" />
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  tab,
  isActive,
  count,
  onClick,
}: {
  tab: TabConfig
  isActive: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-200 flex-shrink-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        isActive ? 'text-neon-blue' : 'text-text-disabled hover:text-text-secondary'
      )}
      style={
        isActive
          ? {
              background: 'rgba(0,212,255,0.09)',
              border: '1px solid rgba(0,212,255,0.28)',
              boxShadow: '0 0 14px rgba(0,212,255,0.18)',
            }
          : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }
      }
    >
      {tab.label}
      {count > 0 && (
        <span
          className="font-display text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center tabular-nums leading-none"
          style={
            isActive
              ? {
                  background: 'rgba(0,212,255,0.18)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.25)',
                }
              : {
                  background: 'rgba(255,255,255,0.06)',
                  color: '#555577',
                  border: '1px solid rgba(255,255,255,0.05)',
                }
          }
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center gap-5 py-16 rounded-xl text-center"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px dashed rgba(255,255,255,0.08)',
      }}
    >
      {/* Atmospheric RPG icon */}
      <motion.span
        className="font-display text-5xl leading-none select-none"
        animate={{
          textShadow: [
            '0 0 16px rgba(0,212,255,0.12)',
            '0 0 32px rgba(0,212,255,0.24)',
            '0 0 16px rgba(0,212,255,0.12)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ color: 'rgba(0,212,255,0.20)' }}
        aria-hidden="true"
      >
        🔄
      </motion.span>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.25em] uppercase text-text-secondary">
          No Active Habits
        </p>
        <p className="font-display text-[10px] tracking-wider text-text-disabled leading-relaxed whitespace-pre-line max-w-[240px]">
          {'Build consistent routines.\nTrack daily habits to grow your stats.'}
        </p>
      </div>

      <button
        onClick={onNew}
        className="font-display text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-xl transition-all hover:brightness-115 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{
          background: 'rgba(0,212,255,0.09)',
          border: '1px solid rgba(0,212,255,0.35)',
          color: '#00d4ff',
          textShadow: '0 0 8px rgba(0,212,255,0.4)',
          boxShadow: '0 0 12px rgba(0,212,255,0.10)',
        }}
      >
        + New Habit
      </button>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: habits, isLoading, isError, refetch } = useHabits(uid)
  const toggleMutation = useToggleHabit()
  const deleteMutation = useDeleteHabit()

  // ─── Active habit count (not completed today) ─────────────────────────────

  const activeHabitCount = useMemo(() => {
    if (!habits) return 0
    const todayStr = new Date().toLocaleDateString('en-CA')
    return habits.filter((h) => !h.completionLog.includes(todayStr)).length
  }, [habits])

  // ─── Filtered + sorted habits ──────────────────────────────────────────────

  const filteredHabits = useMemo<Habit[]>(() => {
    if (!habits) return []
    const pool = activeTab === 'all' ? habits : habits.filter((h) => h.frequency === activeTab)
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
    // Completed today → end of list
    return [...pool].sort((a, b) => {
      const aCompleted = a.completionLog.includes(todayStr) ? 1 : 0
      const bCompleted = b.completionLog.includes(todayStr) ? 1 : 0
      return aCompleted - bCompleted
    })
  }, [habits, activeTab])

  function getTabCount(tabId: TabId): number {
    if (!habits) return 0
    const pool = tabId === 'all' ? habits : habits.filter((h) => h.frequency === tabId)
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
    return pool.filter((h) => !h.completionLog.includes(todayStr)).length
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    async (habitId: string) => {
      if (!uid) return
      const habit = habits?.find((h) => h.id === habitId)
      if (!habit) return
      setTogglingId(habitId)
      try {
        await toggleMutation.mutateAsync({ uid, habitId, statGains: habit.statGains })
      } finally {
        setTogglingId(null)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, habits]
  )

  const handleDelete = useCallback(
    async (habitId: string) => {
      if (!uid) return
      try {
        await deleteMutation.mutateAsync({ uid, habitId })
      } catch (err) {
        console.error('[handleDelete] failed:', err)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid]
  )

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton — matches real header structure */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-6 w-28 rounded" />
            <SkeletonBlock className="h-3 w-20 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-7 w-10 rounded-full" />
            <SkeletonBlock className="h-9 w-20 rounded-xl" />
          </div>
        </div>
        {/* Tab bar skeleton */}
        <div className="flex gap-2 overflow-x-hidden pb-1">
          {TABS.map((t) => (
            <SkeletonBlock
              key={t.id}
              className={cn('h-8 rounded-lg flex-shrink-0', t.id === 'all' ? 'w-12' : 'w-16')}
            />
          ))}
        </div>
        {/* Card skeletons */}
        <div className="space-y-3" role="status" aria-label="Loading habits">
          <HabitCardSkeleton />
          <HabitCardSkeleton />
          <HabitCardSkeleton />
          <span className="sr-only">Loading habits...</span>
        </div>
      </main>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-5 text-center">
        <span
          className="font-display text-5xl leading-none select-none"
          style={{ color: 'rgba(255,68,68,0.5)', textShadow: '0 0 20px rgba(255,68,68,0.3)' }}
          aria-hidden="true"
        >
          ⚠
        </span>
        <div className="space-y-1">
          <p className="font-display text-sm tracking-[0.25em] text-text-secondary uppercase">
            Connection Lost
          </p>
          <p className="font-display text-[10px] text-text-disabled tracking-wider">
            Failed to retrieve habit data
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          className="font-display text-xs tracking-[0.3em] uppercase px-6 py-2.5 rounded-xl border border-neon-blue/40 text-neon-blue hover:border-neon-blue/70 hover:bg-neon-blue/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Retry
        </button>
      </main>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const habitCount = habits?.length ?? 0

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1
              className="font-display text-xl font-bold tracking-[0.25em] uppercase"
              style={{
                color: '#00d4ff',
                textShadow: '0 0 24px rgba(0,212,255,0.5), 0 0 48px rgba(0,212,255,0.15)',
              }}
            >
              Habit Log
            </h1>
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-text-secondary mt-0.5">
              {activeHabitCount > 0 ? (
                <>
                  <span
                    className="text-neon-blue"
                    style={{ textShadow: '0 0 8px rgba(0,212,255,0.5)' }}
                  >
                    {activeHabitCount}
                  </span>{' '}
                  remaining today
                </>
              ) : habitCount > 0 ? (
                <span style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.5)' }}>
                  All done today ✓
                </span>
              ) : (
                'No active habits'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Habit count badge — RPG stat badge style */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0"
              style={{
                background: habitCount >= 5
                  ? 'rgba(251,191,36,0.10)'
                  : 'rgba(0,212,255,0.08)',
                border: habitCount >= 5
                  ? '1px solid rgba(251,191,36,0.35)'
                  : '1px solid rgba(0,212,255,0.25)',
                boxShadow: habitCount >= 5
                  ? '0 0 10px rgba(251,191,36,0.15)'
                  : '0 0 10px rgba(0,212,255,0.08)',
              }}
              aria-label={`${habitCount} of 5 habits`}
            >
              <span
                className="font-display text-[10px] font-bold tabular-nums leading-none"
                style={{
                  color: habitCount >= 5 ? '#fbbf24' : '#00d4ff',
                  textShadow: habitCount >= 5
                    ? '0 0 8px rgba(251,191,36,0.6)'
                    : '0 0 8px rgba(0,212,255,0.4)',
                }}
              >
                {habitCount}
              </span>
              <span
                className="font-display text-[10px] leading-none"
                style={{ color: habitCount >= 5 ? 'rgba(251,191,36,0.55)' : 'rgba(0,212,255,0.45)' }}
              >
                /5
              </span>
            </div>

            {/* Create button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 22 }}
              onClick={() => setIsModalOpen(true)}
              aria-label="Create new habit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-display text-[10px] tracking-[0.25em] uppercase font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.20), rgba(0,212,255,0.08))',
                border: '1px solid rgba(0,212,255,0.45)',
                color: '#00d4ff',
                textShadow: '0 0 10px rgba(0,212,255,0.5)',
                boxShadow: '0 0 16px rgba(0,212,255,0.12)',
              }}
              whileHover={{ scale: 1.04, filter: 'brightness(1.12)' }}
              whileTap={{ scale: 0.96 }}
            >
              <span aria-hidden="true" className="text-sm font-black leading-none">+</span>
              New
            </motion.button>
          </div>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
          role="tablist"
          aria-label="Filter habits by frequency"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              count={getTabCount(tab.id)}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </motion.div>

        {/* Habit list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filteredHabits.length === 0 ? (
              <EmptyState onNew={() => setIsModalOpen(true)} />
            ) : (
              <div
                className="space-y-3"
                role="list"
                aria-label={`${activeTab === 'all' ? 'All' : activeTab} habits`}
              >
                <AnimatePresence>
                  {filteredHabits.map((habit) => (
                    <div key={habit.id} role="listitem">
                      <HabitCard
                        habit={habit}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        isToggling={togglingId === habit.id}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Spacer */}
        <div className="h-24" aria-hidden="true" />
      </main>

      {/* Habit creation modal */}
      {uid && (
        <HabitCreateModal
          open={isModalOpen}
          uid={uid}
          currentHabitCount={habits?.length ?? 0}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
