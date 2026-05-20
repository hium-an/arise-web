'use client'

import { useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth } from '@/lib/firebase/auth'
import { db, createUserProfile } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/lib/store/authStore'

/**
 * Ensures a Firestore profile exists for the user.
 * Handles Google Sign-In and existing accounts created before Firestore was set up.
 * Fire-and-forget: does not block auth state update.
 */
async function ensureUserProfile(user: User): Promise<void> {
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (!snap.exists()) {
    await createUserProfile(
      user.uid,
      user.email ?? '',
      user.displayName ?? user.email?.split('@')[0] ?? 'Hunter',
    )
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuthState = useAuthStore((s) => s.setAuthState)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Immediate atomic update — no loading flicker
      setAuthState(user)

      if (user) {
        // Fire-and-forget: create Firestore profile if missing
        // Covers: Google Sign-In, existing accounts without profiles
        ensureUserProfile(user).catch((err) => {
          console.error('[AuthProvider] Failed to ensure user profile:', err)
        })
      }
    })

    return unsubscribe
  }, [setAuthState])

  return <>{children}</>
}
