import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/AuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

// Toàn bộ app là user-specific — không prerender tĩnh
// Ngăn Firebase bị init trên server lúc build (thiếu env vars)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Arise — Solo Leveling Personal',
  description: 'Gamified personal development. Rise, Hunter.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
