'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home')
    }
  }, [user, loading, router])

  // While checking auth state show a full-screen spinner to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-neon-blue border-t-transparent animate-spin"
          role="status"
          aria-label="Đang kiểm tra phiên đăng nhập"
        />
      </div>
    )
  }

  // Already logged in — render nothing while redirect is in-flight
  if (user) return null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-8 px-4">

      {/* ── Background: subtle grid ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* ── Ambient glow orbs ── */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -left-24 w-[480px] h-[480px] bg-neon-blue/10 rounded-full blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 -right-24 w-[480px] h-[480px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-3/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon-blue/5 rounded-full blur-[80px] pointer-events-none"
      />

      {/* ── Form card ── */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
