'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firestore'
import useAuth from '@/lib/hooks/useAuth'
import StatBar from '@/components/rpg/StatBar'
import LevelBadge from '@/components/rpg/LevelBadge'
import RpgCard from '@/components/ui/rpg-card'
import type { UserProfile } from '@/types'
import type { StatCode } from '@/lib/rpg/stats'
import { STAT_CODES } from '@/lib/rpg/stats'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayQuestsSummary {
  total: number
  completed: number
}

interface DashboardData {
  profile: UserProfile
  todayQuests: TodayQuestsSummary
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date()
}

async function fetchDashboardData(uid: string): Promise<DashboardData> {
  // 1. User profile
  const profileSnap = await getDoc(doc(db, 'users', uid))
  if (!profileSnap.exists()) {
    throw new Error('User profile not found')
  }
  const raw = profileSnap.data()
  const profile: UserProfile = {
    id: uid,
    email: raw.email ?? '',
    displayName: raw.displayName ?? undefined,
    photoUrl: raw.photoUrl ?? undefined,
    level: raw.level ?? 1,
    xp: raw.xp ?? 0,
    xpToNextLevel: raw.xpToNextLevel ?? 100,
    playerClass: raw.playerClass ?? 'Novice Hunter',
    activeTitle: raw.activeTitle ?? 'Novice Hunter',
    unlockedTitles: raw.unlockedTitles ?? [],
    stats: raw.stats ?? {},
    credits: raw.credits ?? 0,
    totalQuestsCompleted: raw.totalQuestsCompleted ?? 0,
    currentStreak: raw.currentStreak ?? 0,
    createdAt: toDate(raw.createdAt),
    lastActiveAt: toDate(raw.lastActiveAt),
  }

  // 2. Today quests — query where dueDate falls within today (UTC)
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const questsRef = collection(db, 'users', uid, 'quests')
  const questsQuery = query(
    questsRef,
    where('deadline', '>=', Timestamp.fromDate(startOfDay)),
    where('deadline', '<=', Timestamp.fromDate(endOfDay))
  )
  const questsSnap = await getDocs(questsQuery)

  let completed = 0
  questsSnap.forEach((d) => {
    if (d.data().status === 'completed') completed++
  })

  return {
    profile,
    todayQuests: { total: questsSnap.size, completed },
  }
}

// ─── Top-3 stats helper ───────────────────────────────────────────────────────

interface TopStat {
  code: StatCode
  value: number
  glowColor: string
}

const STAT_GLOW: Record<StatCode, string> = {
  STR: '#FF4444', VIT: '#FF4444', AGI: '#FF4444',
  INT: '#8B5CF6', WIS: '#8B5CF6', FOC: '#8B5CF6',
  WLT: '#FFD700', SAV: '#FFD700', INV: '#FFD700',
  CHA: '#00FF88', EMP: '#00FF88', NET: '#00FF88',
  WIL: '#00D4FF', PER: '#00D4FF', CON: '#00D4FF',
}

function getTop3Stats(stats: UserProfile['stats']): TopStat[] {
  return STAT_CODES
    .map((code) => ({ code, value: stats[code] ?? 0, glowColor: STAT_GLOW[code] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// ─── Skeleton components ──────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded animate-pulse', className)}
      style={{ background: 'rgba(255,255,255,0.06)' }}
      aria-hidden="true"
    />
  )
}

function DashboardSkeleton() {
  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      aria-label="Loading dashboard"
      role="status"
    >
      {/* Greeting skeleton */}
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <SkeletonBlock className="h-5 w-40 sm:w-56" />
          <SkeletonBlock className="h-3 w-28 sm:w-36" />
        </div>
        {/* Credits pill skeleton */}
        <SkeletonBlock className="h-7 w-16 rounded-full flex-shrink-0" />
      </div>

      {/* XP bar skeleton */}
      <SkeletonBlock className="h-5 rounded-full" />

      {/* Widgets row */}
      <div className="grid grid-cols-2 gap-4">
        <SkeletonBlock className="h-32 rounded-xl" />
        <SkeletonBlock className="h-32 rounded-xl" />
      </div>

      {/* Stats */}
      <SkeletonBlock className="h-40 rounded-xl" />

      {/* Quick action */}
      <SkeletonBlock className="h-12 rounded-xl" />

      <span className="sr-only">Loading dashboard data...</span>
    </div>
  )
}

// ─── XP Bar (inline, lighter than the full XPProgress component) ──────────────

function XPBar({ xp, xpToNextLevel, level }: { xp: number; xpToNextLevel: number; level: number }) {
  const percent = xpToNextLevel > 0 ? Math.min(100, Math.round((xp / xpToNextLevel) * 100)) : 0
  return (
    <div className="flex flex-col gap-1.5" aria-label="Experience progress">
      <div className="flex items-center justify-between">
        <span className="font-display text-[9px] uppercase tracking-[0.4em] text-text-secondary">
          XP — Level {level}
        </span>
        <span
          className="font-display text-[10px] tabular-nums text-neon-blue"
          style={{ textShadow: '0 0 8px rgba(0,212,255,0.6)' }}
          aria-hidden="true"
        >
          {xp} / {xpToNextLevel}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${xp} of ${xpToNextLevel} XP toward level ${level + 1}`}
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={xpToNextLevel}
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
            boxShadow: '0 0 10px rgba(0,212,255,0.5)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Widget: Today Quests ─────────────────────────────────────────────────────

function TodayQuestsWidget({ summary }: { summary: TodayQuestsSummary }) {
  const { total, completed } = summary
  const hasQuests = total > 0
  const allDone = hasQuests && completed === total
  const percent = hasQuests ? Math.round((completed / total) * 100) : 0

  return (
    <RpgCard glow="blue" padding="sm" className="flex flex-col gap-3 min-h-[7.5rem]">
      <p className="font-display text-[9px] uppercase tracking-[0.4em] text-text-secondary">
        Today&apos;s Quests
      </p>
      {hasQuests ? (
        <>
          <div className="flex items-end gap-1">
            <span
              className="font-display text-3xl font-black text-neon-blue leading-none"
              style={{ textShadow: '0 0 14px rgba(0,212,255,0.7)' }}
              aria-label={`${completed} of ${total} quests completed today`}
            >
              {completed}
            </span>
            <span className="font-display text-sm text-text-disabled pb-0.5 leading-none">
              /{total}
            </span>
          </div>
          {/* Mini progress bar */}
          <div
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`Quest progress: ${percent}%`}
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                backgroundColor: allDone ? '#22c55e' : '#00d4ff',
                boxShadow: allDone
                  ? '0 0 8px rgba(34,197,94,0.7)'
                  : '0 0 8px rgba(0,212,255,0.6)',
              }}
            />
          </div>
          {allDone && (
            <p
              className="font-display text-[9px] text-neon-green tracking-widest"
              style={{ textShadow: '0 0 8px rgba(34,197,94,0.6)' }}
            >
              ALL DONE
            </p>
          )}
        </>
      ) : (
        /* Empty state — no quests today */
        <div className="flex flex-col gap-1.5 mt-1">
          <span
            className="text-2xl leading-none select-none"
            aria-hidden="true"
          >
            📋
          </span>
          <p className="font-display text-[10px] text-text-disabled leading-relaxed">
            No quests<br />scheduled
          </p>
        </div>
      )}
    </RpgCard>
  )
}

// ─── Widget: Streak ───────────────────────────────────────────────────────────

function StreakWidget({ streak }: { streak: number }) {
  const isActive = streak > 0
  return (
    <RpgCard glow={isActive ? 'gold' : 'none'} padding="sm" className="flex flex-col gap-3 min-h-[7.5rem]">
      <p className="font-display text-[9px] uppercase tracking-[0.4em] text-text-secondary">
        Daily Streak
      </p>
      {isActive ? (
        <>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl leading-none select-none">
              🔥
            </span>
            <span
              className="font-display text-3xl font-black leading-none"
              style={{
                color: '#fbbf24',
                textShadow: '0 0 14px rgba(251,191,36,0.7)',
              }}
              aria-label={`${streak} day streak`}
            >
              {streak}
            </span>
          </div>
          <p
            className="font-display text-[9px] tracking-wider"
            style={{ color: 'rgba(251,191,36,0.6)' }}
          >
            {streak === 1 ? '1 DAY' : `${streak} DAYS`}
          </p>
        </>
      ) : (
        /* Empty state — streak broken */
        <div className="flex flex-col gap-1.5 mt-1">
          <span
            className="text-2xl leading-none select-none"
            aria-hidden="true"
          >
            💤
          </span>
          <p className="font-display text-[10px] text-text-disabled leading-relaxed">
            Start your<br />streak today
          </p>
        </div>
      )}
    </RpgCard>
  )
}

// ─── Widget: Top Stats ────────────────────────────────────────────────────────

function TopStatsWidget({ stats }: { stats: UserProfile['stats'] }) {
  const top3 = getTop3Stats(stats)
  return (
    <RpgCard glow="purple" padding="sm" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-[9px] uppercase tracking-[0.4em] text-text-secondary">
          Top Stats
        </p>
        <Link
          href="/profile"
          className="font-display text-[9px] uppercase tracking-widest text-neon-blue/70 hover:text-neon-blue transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neon-blue rounded"
          aria-label="View all stats on profile page"
        >
          View All
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {top3.map(({ code, value, glowColor }) => (
          <StatBar
            key={code}
            statCode={code}
            value={value}
            maxValue={100}
            glowColor={glowColor}
          />
        ))}
      </div>
    </RpgCard>
  )
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─── Credits pill ─────────────────────────────────────────────────────────────

function CreditsPill({ credits }: { credits: number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border flex-shrink-0"
      style={{
        borderColor: 'rgba(255,215,0,0.35)',
        background: 'rgba(255,215,0,0.07)',
      }}
      aria-label={`${credits} credits`}
    >
      <span className="text-xs leading-none select-none" aria-hidden="true">
        ✦
      </span>
      <span
        className="font-display text-[10px] font-bold tabular-nums"
        style={{ color: '#FFD700', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}
      >
        {credits}
      </span>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
      <span className="text-4xl select-none" aria-hidden="true">⚠</span>
      <p className="font-display text-sm tracking-widest text-text-secondary uppercase">
        Failed to load dashboard
      </p>
      <button
        onClick={onRetry}
        className="font-display text-xs tracking-[0.3em] uppercase px-6 py-2.5 rounded-xl border border-neon-blue/40 text-neon-blue hover:border-neon-blue/80 hover:bg-neon-blue/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Retry
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    if (!uid) return
    if (isMountedRef.current) setLoading(true)
    if (isMountedRef.current) setError(null)
    try {
      const result = await fetchDashboardData(uid)
      if (isMountedRef.current) setData(result)
    } catch (err) {
      if (isMountedRef.current) setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorState onRetry={() => void load()} />
  if (!data) return null

  const { profile, todayQuests } = data
  const displayName = profile.displayName ?? user?.displayName ?? 'Hunter'
  const firstName = displayName.split(' ')[0]
  const greeting = getGreeting()

  return (
    <motion.main
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <motion.section variants={itemVariants} aria-label="Player greeting">
        <div className="flex items-center gap-4">
          <LevelBadge level={profile.level} size="md" />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-white truncate">
              {greeting},{' '}
              <span
                className="text-neon-blue"
                style={{ textShadow: '0 0 14px rgba(0,212,255,0.55)' }}
              >
                {firstName}
              </span>
            </h1>
            <p className="font-display text-[10px] tracking-widest text-text-secondary uppercase truncate">
              {profile.activeTitle}
            </p>
          </div>
          <CreditsPill credits={profile.credits} />
        </div>
      </motion.section>

      {/* ── XP Bar ────────────────────────────────────────────────────────── */}
      <motion.section variants={itemVariants} aria-label="Experience progress">
        <XPBar xp={profile.xp} xpToNextLevel={profile.xpToNextLevel} level={profile.level} />
      </motion.section>

      {/* ── Widgets row ───────────────────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        aria-label="Activity summary"
        className="grid grid-cols-2 gap-4"
      >
        <TodayQuestsWidget summary={todayQuests} />
        <StreakWidget streak={profile.currentStreak} />
      </motion.section>

      {/* ── Top stats ─────────────────────────────────────────────────────── */}
      <motion.section variants={itemVariants} aria-label="Top character stats">
        <TopStatsWidget stats={profile.stats} />
      </motion.section>

      {/* ── Quick action ──────────────────────────────────────────────────── */}
      <motion.section variants={itemVariants} aria-label="Quick actions">
        <NewQuestButton />
      </motion.section>

    </motion.main>
  )
}

// ─── New Quest Button ─────────────────────────────────────────────────────────
// Route /quests/new does not exist yet — rendered as a disabled button with
// a tooltip so the user understands it is coming soon.

function NewQuestButton() {
  // TODO (W5): replace with <Link href="/quests/new"> once the quest builder route exists
  return (
    <div className="relative group">
      <button
        disabled
        aria-disabled="true"
        aria-describedby="new-quest-tooltip"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-display text-xs tracking-[0.3em] uppercase font-bold cursor-not-allowed select-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#444466',
        }}
      >
        <span aria-hidden="true">+</span>
        New Quest
      </button>
      {/* Tooltip */}
      <div
        id="new-quest-tooltip"
        role="tooltip"
        className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg',
          'font-display text-[10px] tracking-wide text-text-secondary whitespace-nowrap',
          'opacity-0 pointer-events-none transition-opacity duration-200',
          'group-hover:opacity-100 group-focus-within:opacity-100'
        )}
        style={{
          background: 'hsl(240 10% 10%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Quest builder coming in W5
        {/* Tooltip arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid rgba(255,255,255,0.1)',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
