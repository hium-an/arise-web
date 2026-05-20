'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuests, useCompleteQuest, useDeleteQuest } from '@/lib/queries/useQuests'
import QuestCard from '@/components/rpg/QuestCard'
import QuestCreateModal from '@/components/rpg/QuestCreateModal'
import useAuth from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Quest, QuestType } from '@/types'

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'all' | QuestType

interface TabConfig {
  id: TabId
  label: string
}

const TABS: TabConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'main', label: 'Main' },
  { id: 'side', label: 'Side' },
  { id: 'boss', label: 'Boss' },
]

// ─── Empty state per tab ──────────────────────────────────────────────────────

interface EmptyStateDef {
  icon: string
  title: string
  message: string
}

const EMPTY_STATE: Record<TabId, EmptyStateDef> = {
  all: {
    icon: '⚔',
    title: 'No Active Quests',
    message: 'Your quest log is empty.\nCreate your first quest to begin your journey.',
  },
  daily: {
    icon: '◎',
    title: 'No Daily Quests',
    message: 'Daily quests reset each dawn.\nAdd tasks to grind XP consistently.',
  },
  weekly: {
    icon: '◈',
    title: 'No Weekly Quests',
    message: 'Weekly challenges await.\nSet goals that push your limits.',
  },
  main: {
    icon: '◆',
    title: 'No Main Quests',
    message: 'Define your primary objectives.\nEvery hunter needs a guiding mission.',
  },
  side: {
    icon: '◇',
    title: 'No Side Quests',
    message: 'Side quests build versatility.\nExplore optional challenges.',
  },
  boss: {
    icon: '☠',
    title: 'No Boss Quests',
    message: 'Boss encounters are coming.\nAre you strong enough to face them?',
  },
}

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

/**
 * Matches QuestCard actual rendered height (~130-140px with actions).
 * pl-5 accounts for domain bar; internal structure mirrors real card.
 */
function QuestCardSkeleton() {
  return (
    <div
      className="relative rounded-xl pl-5 pr-4 py-4 space-y-3"
      style={{
        background: '#12121A',
        border: '1px solid rgba(255,255,255,0.07)',
        minHeight: 132,
      }}
      aria-hidden="true"
    >
      {/* Fake domain bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      {/* Header row */}
      <div className="flex items-center gap-2">
        <SkeletonBlock className="w-5 h-5 rounded-md flex-shrink-0" />
        <SkeletonBlock className="w-14 h-4 rounded-full" />
        <div className="flex-1" />
        <SkeletonBlock className="w-16 h-4 rounded-full" />
      </div>
      {/* Title */}
      <SkeletonBlock className="h-4 w-3/4 rounded" />
      {/* Description line */}
      <SkeletonBlock className="h-3 w-1/2 rounded" />
      {/* Action button */}
      <SkeletonBlock className="h-8 w-full rounded-lg mt-1" />
    </div>
  )
}

function QuestListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading quests">
      <QuestCardSkeleton />
      <QuestCardSkeleton />
      <QuestCardSkeleton />
      <span className="sr-only">Loading quests...</span>
    </div>
  )
}

// ─── XP Float Toast ───────────────────────────────────────────────────────────

interface XpToast {
  id: string
  xp: number
}

function XpFloatToast({ xp, onComplete }: { xp: number; onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.75 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.75, 1.1, 1, 0.9] }}
      transition={{
        duration: 1.6,
        times: [0, 0.12, 0.7, 1],
        ease: 'easeOut',
      }}
      onAnimationComplete={onComplete}
      className="pointer-events-none fixed z-[300] font-display text-base font-black"
      style={{
        color: '#fbbf24',
        textShadow: '0 0 14px rgba(251,191,36,1), 0 0 28px rgba(251,191,36,0.5)',
        left: '50%',
        bottom: '6rem',
        transform: 'translateX(-50%)',
        letterSpacing: '0.1em',
      }}
      role="status"
      aria-live="polite"
    >
      +{xp} XP
    </motion.div>
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
        isActive
          ? 'text-neon-blue'
          : 'text-text-disabled hover:text-text-secondary'
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

// ─── Empty state component ────────────────────────────────────────────────────

function EmptyState({ tabId, onNew }: { tabId: TabId; onNew: () => void }) {
  const { icon, title, message } = EMPTY_STATE[tabId]
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-16 rounded-xl text-center"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px dashed rgba(255,255,255,0.08)',
      }}
    >
      {/* RPG icon — large, glowing */}
      <span
        className="font-display text-5xl leading-none select-none"
        style={{
          color: 'rgba(255,255,255,0.12)',
          textShadow: '0 0 24px rgba(255,255,255,0.06)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="space-y-2">
        <p className="font-display text-xs font-bold tracking-[0.25em] uppercase text-text-secondary">
          {title}
        </p>
        <p className="font-display text-[10px] tracking-wider text-text-disabled leading-relaxed whitespace-pre-line max-w-[240px]">
          {message}
        </p>
      </div>

      <button
        onClick={onNew}
        className="font-display text-[10px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{
          background: 'rgba(0,212,255,0.09)',
          border: '1px solid rgba(0,212,255,0.30)',
          color: '#00d4ff',
          textShadow: '0 0 8px rgba(0,212,255,0.4)',
        }}
      >
        + New Quest
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [xpToasts, setXpToasts] = useState<XpToast[]>([])

  const { data: quests, isLoading, isError, refetch } = useQuests(uid)
  const completeQuest = useCompleteQuest()
  const deleteQuest = useDeleteQuest()

  // ─── Filter quests by tab ──────────────────────────────────────────────────

  const filteredQuests = useMemo<Quest[]>(() => {
    if (!quests) return []
    if (activeTab === 'all') return quests
    return quests.filter((q) => q.type === activeTab)
  }, [quests, activeTab])

  function getTabCount(tabId: TabId): number {
    if (!quests) return 0
    const pool = tabId === 'all' ? quests : quests.filter((q) => q.type === tabId)
    return pool.filter((q) => q.status !== 'completed').length
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const completeQuestMutate = completeQuest.mutateAsync
  const handleComplete = useCallback(
    async (questId: string) => {
      if (!uid) return
      const quest = quests?.find((q) => q.id === questId)
      if (!quest) return

      setCompletingId(questId)
      try {
        await completeQuestMutate({
          uid,
          questId,
          xpReward: quest.xpReward,
          statGains: quest.statGains,
        })
        const toastId = `${questId}-${Date.now()}`
        setXpToasts((prev) => [...prev, { id: toastId, xp: quest.xpReward }])
      } finally {
        setCompletingId(null)
      }
    },
    [uid, quests, completeQuestMutate]
  )

  const handleDelete = useCallback(
    async (questId: string) => {
      if (!uid) return
      await deleteQuest.mutateAsync({ uid, questId })
    },
    [uid, deleteQuest]
  )

  const removeToast = useCallback((id: string) => {
    setXpToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-6 w-36 rounded" />
            <SkeletonBlock className="h-3 w-24 rounded" />
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
        <QuestListSkeleton />
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
            Failed to retrieve quest data
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

  const activeQuestCount = quests?.filter((q) => q.status !== 'completed').length ?? 0

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-xl font-bold text-white tracking-wide">
            Quest Log
          </h1>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-text-secondary mt-0.5">
            {activeQuestCount > 0 ? (
              <>
                <span
                  className="text-neon-blue"
                  style={{ textShadow: '0 0 8px rgba(0,212,255,0.5)' }}
                >
                  {activeQuestCount}
                </span>{' '}
                active {activeQuestCount === 1 ? 'quest' : 'quests'}
              </>
            ) : (
              'No active quests'
            )}
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
          role="tablist"
          aria-label="Filter quests by type"
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

        {/* Quest list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filteredQuests.length === 0 ? (
              <EmptyState tabId={activeTab} onNew={() => setModalOpen(true)} />
            ) : (
              <div
                className="space-y-3"
                role="list"
                aria-label={`${activeTab === 'all' ? 'All' : activeTab} quests`}
              >
                <AnimatePresence>
                  {filteredQuests.map((quest) => (
                    <div key={quest.id} role="listitem">
                      <QuestCard
                        quest={quest}
                        onComplete={quest.status !== 'completed' ? handleComplete : undefined}
                        onDelete={handleDelete}
                        isCompleting={completingId === quest.id}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Spacer for FAB */}
        <div className="h-24" aria-hidden="true" />
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 22 }}
        onClick={() => setModalOpen(true)}
        aria-label="Create new quest"
        className={cn(
          'fixed z-[100]',
          // Mobile: sit above bottom nav (4.5rem) + safe area
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
          // Desktop: simple 2rem from bottom
          'lg:bottom-8',
          'right-4 lg:right-8',
          'w-14 h-14 rounded-full flex items-center justify-center',
          'font-display text-2xl font-black text-background leading-none',
          'hover:brightness-115 hover:scale-105 active:scale-95 transition-transform',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
        style={{
          background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
          boxShadow:
            '0 0 0 1px rgba(0,212,255,0.3), 0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(168,85,247,0.2), 0 4px 16px rgba(0,0,0,0.6)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <span aria-hidden="true" style={{ marginTop: '-1px' }}>+</span>
      </motion.button>

      {/* XP float toasts */}
      <AnimatePresence>
        {xpToasts.map((toast) => (
          <XpFloatToast
            key={toast.id}
            xp={toast.xp}
            onComplete={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>

      {/* Quest creation modal */}
      {uid && (
        <QuestCreateModal
          open={modalOpen}
          uid={uid}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
