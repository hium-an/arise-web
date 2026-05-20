import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore'
import app from './config'
import { STAT_CODES } from '@/lib/rpg/stats'
import { xpRequiredForLevel, calculateLevel } from '@/lib/rpg/xp'
import { applyStatGains, computePlayerClass } from '@/lib/rpg/stats'
import type { StatsMap } from '@/lib/rpg/stats'
import type { Quest, QuestStatus, CreateQuestInput } from '@/types'

export const db = getFirestore(app)

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const initialStats = Object.fromEntries(STAT_CODES.map((code) => [code, 0]))

  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email,
    displayName,
    photoUrl: null,
    level: 1,
    xp: 0,
    xpToNextLevel: xpRequiredForLevel(2),
    playerClass: 'Novice Hunter',
    activeTitle: 'Novice Hunter',
    unlockedTitles: ['Novice Hunter'],
    stats: initialStats,
    credits: 0,
    totalQuestsCompleted: 0,
    currentStreak: 0,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  })
}

// ─── Firestore → Quest mapper ─────────────────────────────────────────────────

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date()
}

function rawToQuest(id: string, raw: Record<string, unknown>): Quest {
  return {
    id,
    userId: typeof raw.userId === 'string' ? raw.userId : '',
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : undefined,
    type: typeof raw.type === 'string' ? (raw.type as Quest['type']) : 'side',
    domain: typeof raw.domain === 'string' ? (raw.domain as Quest['domain']) : 'discipline',
    xpReward: typeof raw.xpReward === 'number' ? raw.xpReward : 0,
    statGains: (raw.statGains && typeof raw.statGains === 'object' ? raw.statGains : {}) as Quest['statGains'],
    status: typeof raw.status === 'string' ? (raw.status as Quest['status']) : 'pending',
    deadline: raw.deadline ? toDate(raw.deadline) : undefined,
    completedAt: raw.completedAt ? toDate(raw.completedAt) : undefined,
    aiGenerated: typeof raw.aiGenerated === 'boolean' ? raw.aiGenerated : false,
    parentGoalId: typeof raw.parentGoalId === 'string' ? raw.parentGoalId : undefined,
    parentMilestoneId: typeof raw.parentMilestoneId === 'string' ? raw.parentMilestoneId : undefined,
    createdAt: toDate(raw.createdAt),
  }
}

// ─── Quest CRUD ───────────────────────────────────────────────────────────────

export async function getQuests(uid: string): Promise<Quest[]> {
  const questsRef = collection(db, 'users', uid, 'quests')
  const snapshot = await getDocs(questsRef)
  return snapshot.docs.map((d) => rawToQuest(d.id, d.data() as Record<string, unknown>))
}

export async function createQuest(uid: string, data: CreateQuestInput): Promise<Quest> {
  const questsRef = collection(db, 'users', uid, 'quests')

  const payload: Record<string, unknown> = {
    userId: uid,
    title: data.title,
    description: data.description ?? null,
    type: data.type,
    domain: data.domain,
    xpReward: data.xpReward,
    statGains: data.statGains,
    status: 'pending' as QuestStatus,
    deadline: data.deadline ? Timestamp.fromDate(data.deadline) : null,
    completedAt: null,
    aiGenerated: false,
    parentGoalId: null,
    parentMilestoneId: null,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(questsRef, payload)

  return {
    id: docRef.id,
    userId: uid,
    title: data.title,
    description: data.description,
    type: data.type,
    domain: data.domain,
    xpReward: data.xpReward,
    statGains: data.statGains,
    status: 'pending',
    deadline: data.deadline,
    completedAt: undefined,
    aiGenerated: false,
    parentGoalId: undefined,
    parentMilestoneId: undefined,
    createdAt: new Date(),
  }
}

export async function updateQuestStatus(
  uid: string,
  questId: string,
  status: QuestStatus
): Promise<void> {
  const questRef = doc(db, 'users', uid, 'quests', questId)
  await updateDoc(questRef, { status })
}

export async function completeQuest(uid: string, questId: string): Promise<void> {
  const questRef = doc(db, 'users', uid, 'quests', questId)
  await updateDoc(questRef, {
    status: 'completed' as QuestStatus,
    completedAt: serverTimestamp(),
  })
}

export async function deleteQuest(uid: string, questId: string): Promise<void> {
  const questRef = doc(db, 'users', uid, 'quests', questId)
  await deleteDoc(questRef)
}

// ─── Apply Quest Reward (atomic transaction) ──────────────────────────────────

export interface ApplyQuestRewardResult {
  newXp: number
  newLevel: number
  prevLevel: number
  newStats: StatsMap
}

// ─── Atomic: complete quest + apply reward in one transaction ─────────────────

export async function completeQuestWithReward(
  uid: string,
  questId: string,
  xpGain: number,
  statGains: StatsMap
): Promise<ApplyQuestRewardResult> {
  const userRef = doc(db, 'users', uid)
  const questRef = doc(db, 'users', uid, 'quests', questId)

  return runTransaction(db, async (transaction) => {
    const [userSnap, questSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(questRef),
    ])

    if (!userSnap.exists()) {
      throw new Error('User profile not found')
    }

    if (questSnap.exists() && questSnap.data().status === 'completed') {
      throw new Error('Quest already completed')
    }

    const raw = userSnap.data()
    const prevLevel: number = typeof raw.level === 'number' ? raw.level : 1
    const prevTotalXp: number = typeof raw.totalXp === 'number' ? raw.totalXp : 0
    const prevStats: StatsMap = (raw.stats && typeof raw.stats === 'object' ? raw.stats : {}) as StatsMap
    const prevTotalQuestsCompleted: number =
      typeof raw.totalQuestsCompleted === 'number' ? raw.totalQuestsCompleted : 0

    const newTotalXp = prevTotalXp + xpGain
    const newLevel = calculateLevel(newTotalXp)

    const levelStartXp = newLevel > 1 ? xpRequiredForLevel(newLevel) : 0
    const levelEndXp = xpRequiredForLevel(newLevel + 1)
    const withinLevelXp = newTotalXp - levelStartXp
    const xpToNextLevel = levelEndXp - levelStartXp

    const newStats = applyStatGains(prevStats, statGains)
    const newPlayerClass = computePlayerClass(newStats)

    transaction.update(questRef, {
      status: 'completed' as QuestStatus,
      completedAt: serverTimestamp(),
    })

    transaction.update(userRef, {
      totalXp: newTotalXp,
      xp: withinLevelXp,
      xpToNextLevel,
      level: newLevel,
      playerClass: newPlayerClass,
      stats: newStats,
      totalQuestsCompleted: prevTotalQuestsCompleted + 1,
      lastActiveAt: serverTimestamp(),
    })

    return {
      newXp: withinLevelXp,
      newLevel,
      prevLevel,
      newStats,
    }
  })
}

export async function applyQuestReward(
  uid: string,
  xpGain: number,
  statGains: StatsMap
): Promise<ApplyQuestRewardResult> {
  const userRef = doc(db, 'users', uid)

  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists()) {
      throw new Error('User profile not found')
    }

    const raw = userSnap.data()
    const prevLevel: number = raw.level ?? 1
    const prevTotalXp: number = raw.totalXp ?? 0
    const prevStats: StatsMap = raw.stats ?? {}
    const prevTotalQuestsCompleted: number = raw.totalQuestsCompleted ?? 0

    const newTotalXp = prevTotalXp + xpGain
    const newLevel = calculateLevel(newTotalXp)

    // XP within current level (for progress bar)
    const levelStartXp = newLevel > 1 ? xpRequiredForLevel(newLevel) : 0
    const levelEndXp = xpRequiredForLevel(newLevel + 1)
    const withinLevelXp = newTotalXp - levelStartXp
    const xpToNextLevel = levelEndXp - levelStartXp

    const newStats = applyStatGains(prevStats, statGains)
    const newPlayerClass = computePlayerClass(newStats)

    transaction.update(userRef, {
      totalXp: newTotalXp,
      xp: withinLevelXp,
      xpToNextLevel,
      level: newLevel,
      playerClass: newPlayerClass,
      stats: newStats,
      totalQuestsCompleted: prevTotalQuestsCompleted + 1,
      lastActiveAt: serverTimestamp(),
    })

    return {
      newXp: withinLevelXp,
      newLevel,
      prevLevel,
      newStats,
    }
  })
}

// ─── User Profile reader (for TanStack Query) ────────────────────────────────

export async function getUserProfile(uid: string) {
  const userSnap = await getDoc(doc(db, 'users', uid))
  if (!userSnap.exists()) throw new Error('User profile not found')
  return userSnap.data()
}
