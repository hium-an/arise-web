import type { StatsMap } from '@/lib/rpg/stats'

export type QuestType = 'daily' | 'weekly' | 'main' | 'side' | 'boss'
export type QuestStatus = 'pending' | 'active' | 'completed' | 'failed'
export type LifeDomain = 'physical' | 'mental' | 'financial' | 'social' | 'discipline'
export type HabitFrequency = 'daily' | 'weekly'

export interface CreateQuestInput {
  title: string
  description?: string
  type: QuestType
  domain: LifeDomain
  xpReward: number
  statGains: StatsMap
  deadline?: Date
}

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  photoUrl?: string
  level: number
  xp: number
  xpToNextLevel: number
  playerClass: string
  activeTitle: string
  unlockedTitles: string[]
  stats: StatsMap
  credits: number
  totalQuestsCompleted: number
  currentStreak: number
  createdAt: Date
  lastActiveAt: Date
}

export interface Quest {
  id: string
  userId: string
  title: string
  description?: string
  type: QuestType
  domain: LifeDomain
  xpReward: number
  statGains: StatsMap
  status: QuestStatus
  deadline?: Date
  completedAt?: Date
  aiGenerated: boolean
  parentGoalId?: string
  parentMilestoneId?: string
  createdAt: Date
}

export interface Habit {
  id: string
  userId: string
  title: string
  description?: string
  domain: LifeDomain
  frequency: HabitFrequency
  statGains: StatsMap
  streak: number
  longestStreak: number
  completionLog: string[]
  isActive: boolean
  createdAt: Date
}

export interface CreateHabitInput {
  title: string
  description?: string
  domain: LifeDomain
  frequency: HabitFrequency
  statGains: StatsMap
}
