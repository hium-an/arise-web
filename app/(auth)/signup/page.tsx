'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteUser } from 'firebase/auth'
import { signUpWithEmail } from '@/lib/firebase/auth'
import { createUserProfile } from '@/lib/firebase/firestore'
import { getAuthErrorMessage } from '@/lib/firebase/authErrors'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'


export default function SignupPage() {
  const router = useRouter()
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!displayName.trim()) {
      setErrorField('displayName')
      return 'Vui lòng nhập tên hiển thị.'
    }
    if (displayName.trim().length > 50) {
      setErrorField('displayName')
      return 'Tên hiển thị không được vượt quá 50 ký tự.'
    }
    if (!/^[\p{L}\p{N}\s._\-]+$/u.test(displayName.trim())) {
      setErrorField('displayName')
      return 'Tên hiển thị chứa ký tự không hợp lệ.'
    }
    if (!email.trim()) {
      setErrorField('email')
      return 'Vui lòng nhập email.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorField('email')
      return 'Email không hợp lệ.'
    }
    if (!password) {
      setErrorField('password')
      return 'Vui lòng nhập mật khẩu.'
    }
    if (password.length < 8) {
      setErrorField('password')
      return 'Mật khẩu phải có ít nhất 8 ký tự.'
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErrorField('password')
      return 'Mật khẩu cần chứa chữ hoa, chữ thường và số.'
    }
    if (!confirmPassword) {
      setErrorField('confirmPassword')
      return 'Vui lòng xác nhận mật khẩu.'
    }
    if (password !== confirmPassword) {
      setErrorField('confirmPassword')
      return 'Mật khẩu xác nhận không khớp.'
    }
    setErrorField(null)
    return null
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const result = await signUpWithEmail(email.trim(), password)
      try {
        await createUserProfile(result.user.uid, email.trim(), displayName.trim())
      } catch (firestoreErr) {
        // Rollback: xóa Auth user để tránh orphaned account
        await deleteUser(result.user).catch((deleteErr) => {
          console.error('[signup] Failed to rollback Auth user:', deleteErr)
        })
        throw firestoreErr
      }
      if (mountedRef.current) router.replace('/home')
    } catch (err) {
      if (mountedRef.current) setError(getAuthErrorMessage(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const errorId = 'signup-error'
  const passwordMismatch = !!confirmPassword && password !== confirmPassword
  const passwordMatch = !!confirmPassword && password === confirmPassword

  // Shared base input styles
  const inputBase = cn(
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

      {/* ── Header ── */}
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
          Bắt đầu hành trình của{' '}
          <span className="text-neon-blue/80 font-medium">Hunter</span>
        </p>
        <div aria-hidden="true" className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px w-8 bg-neon-blue/25" />
          <span className="text-neon-blue/35 text-xs font-display">◆</span>
          <div className="h-px w-8 bg-neon-blue/25" />
        </div>
      </header>

      {/* ── Error alert ── */}
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

      <form onSubmit={handleSignup} noValidate aria-label="Tạo tài khoản mới" className="space-y-5">

        {/* Display name */}
        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-text-secondary text-[11px] font-display uppercase tracking-widest"
          >
            Tên hiển thị
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            placeholder="Tên của bạn"
            aria-required="true"
            aria-invalid={errorField === 'displayName'}
            aria-describedby={error ? errorId : undefined}
            className={inputBase}
          />
        </div>

        {/* Email */}
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
            disabled={loading}
            placeholder="hunter@arise.io"
            aria-required="true"
            aria-invalid={errorField === 'email'}
            aria-describedby={error ? errorId : undefined}
            className={inputBase}
          />
        </div>

        {/* Password */}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Ít nhất 8 ký tự, chữ hoa, số"
              aria-required="true"
              aria-invalid={errorField === 'password'}
              aria-describedby={error ? errorId : undefined}
              className={cn(inputBase, 'pr-10')}
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

        {/* Confirm password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="confirmPassword"
              className="block text-text-secondary text-[11px] font-display uppercase tracking-widest"
            >
              Xác nhận mật khẩu
            </label>
            {/* Inline feedback badge */}
            {passwordMatch && (
              <span className="text-neon-green text-[10px] font-display tracking-wider flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <path d="M10.28 2.28a.75.75 0 0 0-1.06 0L4.5 7 2.78 5.28a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l5.25-5.25a.75.75 0 0 0 0-1.06z"/>
                </svg>
                KHỚP
              </span>
            )}
            {passwordMismatch && (
              <span className="text-destructive text-[10px] font-display tracking-wider">
                CHƯA KHỚP
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Nhập lại mật khẩu"
              aria-required="true"
              aria-invalid={passwordMismatch}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                inputBase,
                'pr-10',
                passwordMismatch &&
                  'border-destructive/60 focus:border-destructive focus:ring-destructive/30 focus:shadow-[0_0_12px_rgba(239,68,68,0.15)]',
                passwordMatch &&
                  'border-neon-green/50 focus:border-neon-green/80 focus:ring-neon-green/20'
              )}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
            >
              {showConfirm ? (
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
          disabled={loading}
          aria-busy={loading}
          className={cn(
            'w-full h-12 font-display text-sm tracking-[0.2em] font-bold mt-1',
            'bg-neon-blue text-background',
            'shadow-[0_0_20px_rgba(0,212,255,0.35),0_0_4px_rgba(0,212,255,0.6)]',
            'hover:bg-neon-blue/90 hover:shadow-[0_0_28px_rgba(0,212,255,0.55),0_0_6px_rgba(0,212,255,0.8)]',
            'active:scale-[0.98] transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              ĐANG TẠO TÀI KHOẢN...
            </span>
          ) : (
            'TẠO TÀI KHOẢN'
          )}
        </Button>
      </form>

      {/* ── Login link ── */}
      <p className="mt-7 text-center text-text-secondary text-sm">
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="text-neon-blue hover:text-neon-blue/80 transition-colors font-semibold underline-offset-2 hover:underline"
        >
          Đăng nhập
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
