import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setAuthState: (user: User | null, loading?: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  // Atomic update: prevents an intermediate render where user is already
  // resolved but loading is still true, which causes redirect flicker in
  // both auth-guard layouts.
  setAuthState: (user, loading = false) => set({ user, loading }),
  setLoading: (loading) => set({ loading }),
}))
