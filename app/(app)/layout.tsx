'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils'
import NavSidebar from '@/components/nav/NavSidebar'
import NavBottom from '@/components/nav/NavBottom'
import NavTopBar from '@/components/nav/NavTopBar'
import LevelUpOverlay from '@/components/rpg/LevelUpOverlay'
import useLevelUp from '@/lib/hooks/useLevelUp'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { levelUpEvent, dismissLevelUp } = useLevelUp()

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Close sidebar overlay on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-5"
        role="status"
        aria-label="Đang tải"
      >
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

  // ── App Shell ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Desktop sidebar — always visible on lg+ */}
      <NavSidebar className="hidden lg:flex" />

      {/* Mobile / Tablet topbar — hidden on lg+ */}
      <NavTopBar
        onMenuClick={() => setSidebarOpen(true)}
        className="flex lg:hidden"
      />

      {/* Tablet / Mobile: sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tablet / Mobile: collapsible sidebar — slides in from left */}
      <NavSidebar
        className={cn(
          'flex lg:hidden z-50',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      />

      {/* Main content area */}
      <div
        className={cn(
          'min-h-screen',
          'lg:ml-[240px]',      // offset for desktop sidebar
          'pt-[56px] lg:pt-0',  // offset for mobile/tablet topbar
          'pb-[60px] lg:pb-0'   // offset for mobile/tablet bottom nav
        )}
      >
        {children}
      </div>

      {/* Mobile / Tablet bottom nav — hidden on lg+ */}
      <NavBottom className="flex lg:hidden" />

      {/* Level-up overlay — rendered at app-shell level so it appears on any page */}
      <LevelUpOverlay event={levelUpEvent} onDismiss={dismissLevelUp} />

    </div>
  )
}
