'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scroll, CheckSquare, Target, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',    label: 'Home',    icon: Home },
  { href: '/quests',  label: 'Quests',  icon: Scroll },
  { href: '/habits',  label: 'Habits',  icon: CheckSquare },
  { href: '/goals',   label: 'Goals',   icon: Target },
  { href: '/profile', label: 'Profile', icon: User },
] as const

interface NavBottomProps {
  className?: string
}

export default function NavBottom({ className }: NavBottomProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30',
        'h-[60px] bg-surface/95 backdrop-blur-sm border-t border-surface-variant',
        className
      )}
      aria-label="Bottom navigation"
    >
      <ul className="flex h-full w-full" role="list">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center gap-0.5',
                  'transition-all duration-200',
                  isActive
                    ? 'text-neon-blue'
                    : 'text-text-disabled hover:text-text-secondary'
                )}
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className={cn(
                    'transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]'
                  )}
                />
                <span className="text-[9px] font-display tracking-wider uppercase">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
