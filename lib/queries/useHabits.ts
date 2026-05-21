'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHabits,
  createHabit,
  deleteHabit,
  toggleHabitCompletion,
} from '@/lib/firebase/firestore'
import type { CreateHabitInput } from '@/types'
import type { StatsMap } from '@/lib/rpg/stats'

// ─── Query key factory ────────────────────────────────────────────────────────

export const habitKeys = {
  all: (uid: string) => ['habits', uid] as const,
  profile: (uid: string) => ['userProfile', uid] as const,
}

// ─── useHabits ─────────────────────────────────────────────────────────────────

export function useHabits(uid: string | null) {
  return useQuery({
    queryKey: uid ? habitKeys.all(uid) : ['habits', null],
    queryFn: () => {
      if (!uid) throw new Error('No user ID')
      return getHabits(uid)
    },
    enabled: uid !== null,
    staleTime: 30_000,
  })
}

// ─── useCreateHabit ───────────────────────────────────────────────────────────

interface CreateHabitVariables {
  uid: string
  data: CreateHabitInput
  currentCount: number
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, data, currentCount }: CreateHabitVariables) =>
      createHabit(uid, data, currentCount),
    onSuccess: (_newHabit, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all(uid) })
    },
    onError: (error) => {
      console.error('[useCreateHabit] failed:', error)
    },
  })
}

// ─── useToggleHabit ───────────────────────────────────────────────────────────

interface ToggleHabitVariables {
  uid: string
  habitId: string
  statGains: StatsMap
}

export function useToggleHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, habitId, statGains }: ToggleHabitVariables) =>
      toggleHabitCompletion(uid, habitId, statGains),
    onSuccess: (_result, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all(uid) })
      void queryClient.invalidateQueries({ queryKey: habitKeys.profile(uid) })
    },
    onError: (error) => {
      console.error('[useToggleHabit] failed:', error)
    },
  })
}

// ─── useDeleteHabit ───────────────────────────────────────────────────────────

interface DeleteHabitVariables {
  uid: string
  habitId: string
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, habitId }: DeleteHabitVariables) => deleteHabit(uid, habitId),
    onSuccess: (_data, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all(uid) })
    },
    onError: (error) => {
      console.error('[useDeleteHabit] failed:', error)
    },
  })
}
