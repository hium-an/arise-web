'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scroll, CheckSquare, Target, User } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',    label: 'Home',    icon: Home },
  { href: '/quests',  label: 'Quests',  icon: Scroll },
  { href: '/habits',  label: 'Habits',  icon: CheckSquare },
  { href: '/goals',   label: 'Goals',   icon: Target },
  { href: '/profile', label: 'Profile', icon: User },
] as const

interface NavSidebarProps {
  className?: string
}

export default function NavSidebar({ className }: NavSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const initial =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?'

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 z-30',
        'flex flex-col w-[240px] h-screen',
        'bg-surface border-r border-surface-variant',
        className
      )}
      aria-label="Main navigation"
    >
      {/* ── Brand ── */}
      <div className="flex items-center px-6 h-16 border-b border-surface-variant flex-shrink-0">
        <span
          className="font-display text-xl font-black tracking-[0.25em] text-neon-blue"
          style={{ textShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)' }}
        >
          ARISE
        </span>
      </div>

      {/* ── Nav links ── */}
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" role="list">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-surface-variant text-neon-blue'
                    : 'text-text-secondary hover:bg-surface-variant/50 hover:text-text-primary'
                )}
              >
                {/* Active left indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-blue rounded-full"
                    style={{ boxShadow: '0 0 8px rgba(0,212,255,0.9)' }}
                    aria-hidden="true"
                  />
                )}

                <Icon
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    'flex-shrink-0 transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]'
                  )}
                />
                <span className="text-sm font-display tracking-wide">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* ── User info ── */}
      <div className="flex-shrink-0 border-t border-surface-variant px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'Avatar'}
              className="w-8 h-8 rounded-full flex-shrink-0 border border-neon-blue/30"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-full flex-shrink-0 bg-surface-variant border border-neon-blue/30 flex items-center justify-center"
            >
              <span className="font-display text-xs text-neon-blue">{initial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-medium truncate">
              {user?.displayName ?? 'Hunter'}
            </p>
            <p className="text-text-disabled text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </nav>
  )
}
