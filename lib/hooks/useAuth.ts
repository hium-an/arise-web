import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/lib/store/authStore'
import type { User } from 'firebase/auth'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export default function useAuth(): UseAuthReturn {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      loading: state.loading,
      isAuthenticated: !state.loading && state.user !== null,
    }))
  )
}
