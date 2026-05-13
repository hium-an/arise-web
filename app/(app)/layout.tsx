'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-5"
        role="status"
        aria-label="Đang tải"
      >
        {/* Spinner with cyan glow */}
        <div className="relative">
          <div className="w-10 h-10 border-2 border-neon-blue/20 rounded-full" aria-hidden="true" />
          <div
            className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-neon-blue rounded-full animate-spin"
            style={{ boxShadow: '0 0 12px rgba(0,212,255,0.5)' }}
            aria-hidden="true"
          />
        </div>
        <p className="font-display text-[11px] tracking-[0.4em] text-text-disabled animate-pulse select-none">
          LOADING...
        </p>
      </div>
    )
  }

  // Not logged in — render nothing while redirect is in-flight
  if (!user) return null

  return <>{children}</>
}
