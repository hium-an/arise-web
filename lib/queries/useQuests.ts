'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuests,
  createQuest,
  deleteQuest,
  completeQuestWithReward,
  completeQuest as _completeQuest,
  applyQuestReward as _applyQuestReward,
} from '@/lib/firebase/firestore'
import { useUIStore } from '@/lib/store/uiStore'
import type { CreateQuestInput } from '@/types'

// Re-export legacy functions so external test files can still import them
export { _completeQuest as completeQuest, _applyQuestReward as applyQuestReward }

// ─── Query key factory ────────────────────────────────────────────────────────

export const questKeys = {
  all: (uid: string) => ['quests', uid] as const,
  profile: (uid: string) => ['userProfile', uid] as const,
}

// ─── useQuests — fetch all quests ─────────────────────────────────────────────

export function useQuests(uid: string | null) {
  return useQuery({
    queryKey: uid ? questKeys.all(uid) : ['quests', null],
    queryFn: () => {
      if (!uid) throw new Error('No user ID')
      return getQuests(uid)
    },
    enabled: uid !== null,
    staleTime: 30_000, // 30s — quests don't change that often
  })
}

// ─── useCreateQuest ───────────────────────────────────────────────────────────

interface CreateQuestVariables {
  uid: string
  data: CreateQuestInput
}

export function useCreateQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, data }: CreateQuestVariables) => createQuest(uid, data),
    onSuccess: (_newQuest, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: questKeys.all(uid) })
    },
  })
}

// ─── useCompleteQuest ─────────────────────────────────────────────────────────

interface CompleteQuestVariables {
  uid: string
  questId: string
  xpReward: number
  statGains: import('@/lib/rpg/stats').StatsMap
}

export function useCompleteQuest() {
  const queryClient = useQueryClient()
  const triggerLevelUp = useUIStore((s) => s.triggerLevelUp)

  return useMutation({
    mutationFn: async ({ uid, questId, xpReward, statGains }: CompleteQuestVariables) => {
      const result = await completeQuestWithReward(uid, questId, xpReward, statGains)
      return { uid, result }
    },
    onSuccess: ({ uid, result }) => {
      // Invalidate both quests list and user profile
      void queryClient.invalidateQueries({ queryKey: questKeys.all(uid) })
      void queryClient.invalidateQueries({ queryKey: questKeys.profile(uid) })

      // Trigger level-up overlay if level changed
      if (result.newLevel > result.prevLevel) {
        triggerLevelUp({
          newLevel: result.newLevel,
          statsGained: result.newStats,
        })
      }
    },
    onError: (error) => {
      console.error('[useCompleteQuest] failed:', error)
    },
  })
}

// ─── useDeleteQuest ───────────────────────────────────────────────────────────

interface DeleteQuestVariables {
  uid: string
  questId: string
}

export function useDeleteQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, questId }: DeleteQuestVariables) => deleteQuest(uid, questId),
    onSuccess: (_data, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: questKeys.all(uid) })
    },
    onError: (error) => {
      console.error('[useDeleteQuest] failed:', error)
    },
  })
}
