'use client'

import { Menu } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils'

interface NavTopBarProps {
  onMenuClick: () => void
  className?: string
}

export default function NavTopBar({ onMenuClick, className }: NavTopBarProps) {
  const { user } = useAuthStore()

  const initial =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-30',
        'h-[56px] bg-surface/95 backdrop-blur-sm border-b border-surface-variant',
        'flex items-center justify-between px-4',
        className
      )}
    >
      {/* Hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Mở menu điều hướng"
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          'text-text-secondary hover:text-text-primary hover:bg-surface-variant'
        )}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Brand */}
      <span
        className="font-display text-lg font-black tracking-[0.25em] text-neon-blue"
        style={{ textShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)' }}
      >
        ARISE
      </span>

      {/* Avatar */}
      {user?.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoURL}
          alt={user.displayName ?? 'Avatar'}
          className="w-8 h-8 rounded-full border border-neon-blue/30"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-surface-variant border border-neon-blue/30 flex items-center justify-center"
        >
          <span className="font-display text-xs text-neon-blue">{initial}</span>
        </div>
      )}
    </header>
  )
}
