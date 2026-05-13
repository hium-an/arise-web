'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import { useAuthStore } from '@/lib/store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuthState = useAuthStore((s) => s.setAuthState)

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current auth state, then
    // on every subsequent change. The returned function unsubscribes the
    // listener when the provider unmounts, preventing a memory leak.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Single atomic update: avoids a transient render where user is already
      // set but loading is still true (or vice-versa), which can cause both
      // auth-guard layouts to see an inconsistent state and trigger a flash.
      setAuthState(user)
    })

    return unsubscribe
  }, [setAuthState])

  return <>{children}</>
}
