'use client'

import { useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/firestore'
import useAuth from '@/lib/hooks/useAuth'
import { useUIStore } from '@/lib/store/uiStore'
import type { LevelUpEvent } from '@/lib/store/uiStore'

interface UseLevelUpReturn {
  levelUpEvent: LevelUpEvent | null
  dismissLevelUp: () => void
}

export default function useLevelUp(): UseLevelUpReturn {
  const { user } = useAuth()
  const dismissLevelUp = useUIStore((s) => s.dismissLevelUp)
  const levelUpEvent = useUIStore((s) => s.levelUpEvent)

  // Track previous level across renders without causing re-renders
  const prevLevelRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) return

        const data = snapshot.data()
        const currentLevel = typeof data.level === 'number' ? data.level : 1

        if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
          // Level increased — fire the overlay
          const statsGained: LevelUpEvent['statsGained'] = {}

          // Firestore may store stats gained in a `lastLevelStatsGained` field,
          // but since that's not part of the current schema we pass an empty object.
          // When stat-gain-on-level-up is implemented, read from snapshot here.
          useUIStore.getState().triggerLevelUp({ newLevel: currentLevel, statsGained })
        }

        prevLevelRef.current = currentLevel
      },
      (error) => { console.error('[useLevelUp] Firestore snapshot error:', error) }
    )

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // triggerLevelUp is a stable Zustand action — accessed via getState() to avoid dep churn
  }, [user])

  return { levelUpEvent, dismissLevelUp }
}
