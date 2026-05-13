'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'

export default function Home() {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home')
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

  // Logged-in users are being redirected — render nothing while in-flight
  if (user) return null

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm w-full">
        {/* ARISE title with cyan glow */}
        <div className="space-y-2">
          <h1 className="font-display text-6xl font-black tracking-[0.3em] text-neon-blue [text-shadow:0_0_20px_rgba(0,212,255,0.8),0_0_60px_rgba(0,212,255,0.4)] select-none">
            ARISE
          </h1>
          <div
            aria-hidden="true"
            className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent"
          />
        </div>

        {/* Tagline */}
        <p className="text-text-secondary text-sm tracking-widest font-display">
          Gamify your life.{' '}
          <span className="text-neon-blue/80 font-medium">Rise, Hunter.</span>
        </p>

        {/* Decorative divider */}
        <div aria-hidden="true" className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-neon-blue/20" />
          <span className="text-neon-blue/30 text-xs font-display">◆</span>
          <div className="h-px w-12 bg-neon-blue/20" />
        </div>

        {/* CTA button */}
        <Link
          href="/login"
          prefetch={false}
          className="inline-flex items-center justify-center w-full h-12 rounded-md
            font-display text-sm tracking-[0.2em] font-bold
            bg-neon-blue text-background
            shadow-[0_0_20px_rgba(0,212,255,0.35),0_0_4px_rgba(0,212,255,0.6)]
            hover:bg-neon-blue/90 hover:shadow-[0_0_28px_rgba(0,212,255,0.55),0_0_6px_rgba(0,212,255,0.8)]
            active:scale-[0.98] transition-all duration-200"
        >
          BẮT ĐẦU HÀNH TRÌNH
        </Link>
      </div>
    </main>
  )
}
