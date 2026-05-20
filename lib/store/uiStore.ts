import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StatCode } from '@/lib/rpg/stats'

export interface LevelUpEvent {
  newLevel: number
  statsGained: Partial<Record<StatCode, number>>
}

interface UIState {
  levelUpEvent: LevelUpEvent | null
  triggerLevelUp: (event: LevelUpEvent) => void
  dismissLevelUp: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      levelUpEvent: null,
      triggerLevelUp: (event) => set({ levelUpEvent: event }, false, 'triggerLevelUp'),
      dismissLevelUp: () => set({ levelUpEvent: null }, false, 'dismissLevelUp'),
    }),
    { name: 'UIStore' }
  )
)
