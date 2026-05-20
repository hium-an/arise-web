'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth'
import { getAuthErrorMessage } from '@/lib/firebase/authErrors'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Vui lòng nhập email.')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }

    setLoadingEmail(true)
    try {
      await signInWithEmail(email.trim(), password)
      if (mountedRef.current) router.replace('/home')
    } catch (err) {
      if (mountedRef.current) setError(getAuthErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoadingEmail(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoadingGoogle(true)
    try {
      await signInWithGoogle()
      if (mountedRef.current) router.replace('/home')
    } catch (err) {
      if (mountedRef.current) setError(getAuthErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoadingGoogle(false)
    }
  }

  const isLoading = loadingEmail || loadingGoogle

  const errorId = 'login-error'

  // Shared input styling — cyan focus ring via globals.css `.input-glow`
  const inputClass = cn(
    'w-full px-4 py-3 rounded-md text-sm',
    'bg-surface border border-border',
    'text-foreground placeholder:text-text-disabled',
    'outline-none transition-all duration-200',
    'hover:border-neon-blue/30',
    'focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/25 focus:shadow-[0_0_12px_rgba(0,212,255,0.15)]',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  )

  return (
    <div className="relative bg-card border border-border rounded-lg p-8 sm:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]">

      {/* Top cyan accent line */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-neon-blue/60 to-transparent rounded-full"
      />

      {/* -- Header -- */}
      <header className="text-center mb-8">
        <div className="inline-block relative mb-3">
          <h1 className="font-display text-5xl font-black tracking-[0.25em] text-neon-blue [text-shadow:0_0_20px_rgba(0,212,255,0.8),0_0_40px_rgba(0,212,255,0.4)] select-none">
            ARISE
          </h1>
          <div
            aria-hidden="true"
            className="absolute -bottom-1 inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-blue/70 to-transparent"
          />
        </div>
        <p className="text-text-secondary text-sm tracking-wide">
          Chào mừng trở lại,{' '}
          <span className="text-neon-blue/80 font-medium">Hunter</span>
        </p>
        <div aria-hidden="true" className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px w-8 bg-neon-blue/25" />
          <span className="text-neon-blue/35 text-xs font-display">◆</span>
          <div className="h-px w-8 bg-neon-blue/25" />
        </div>
      </header>

      {/* -- Error alert -- */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mb-5 flex items-start gap-3 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/40 text-destructive text-sm"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
          </svg>
          {error}
        </div>
      )}

      {/* -- Email / Password form -- */}
      <form onSubmit={handleEmailLogin} noValidate aria-label="Đăng nhập bằng email" className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-text-secondary text-[11px] font-display uppercase tracking-widest"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="hunter@arise.io"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-text-secondary text-[11px] font-display uppercase tracking-widest"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className={cn(inputClass, 'pr-10')}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.3 4.4C3 5.3 1.5 8 1.5 8s3 5 6.5 5c1.3 0 2.5-.4 3.5-1M6.5 3.1C7 3 7.5 3 8 3c3.5 0 6.5 5 6.5 5s-.7 1.3-1.8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={loadingEmail}
          className={cn(
            'w-full h-12 font-display text-sm tracking-[0.2em] font-bold mt-1',
            'bg-neon-blue text-background',
            'shadow-[0_0_20px_rgba(0,212,255,0.35),0_0_4px_rgba(0,212,255,0.6)]',
            'hover:bg-neon-blue/90 hover:shadow-[0_0_28px_rgba(0,212,255,0.55),0_0_6px_rgba(0,212,255,0.8)]',
            'active:scale-[0.98] transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          {loadingEmail ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              ĐANG ĐĂNG NHẬP...
            </span>
          ) : (
            'ĐĂNG NHẬP'
          )}
        </Button>
      </form>

      {/* -- Divider -- */}
      <div aria-hidden="true" className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-disabled text-[10px] font-display uppercase tracking-[0.3em]">
          hoặc
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* -- Google sign-in -- */}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        aria-busy={loadingGoogle}
        onClick={handleGoogleLogin}
        className={cn(
          'w-full h-12 gap-3 text-sm',
          'border-border bg-surface text-text-secondary',
          'hover:border-neon-blue/40 hover:bg-surface-variant hover:text-foreground',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {loadingGoogle ? (
          <span className="flex items-center justify-center gap-2 w-full">
            <span
              className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Đang kết nối...
          </span>
        ) : (
          <>
            <GoogleIcon />
            Tiếp tục với Google
          </>
        )}
      </Button>

      {/* -- Sign-up link -- */}
      <p className="mt-7 text-center text-text-secondary text-sm">
        Chưa có tài khoản?{' '}
        <Link
          href="/signup"
          className="text-neon-blue hover:text-neon-blue/80 transition-colors font-semibold underline-offset-2 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>

      {/* Bottom purple accent line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-neon-purple/35 to-transparent rounded-full"
      />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
