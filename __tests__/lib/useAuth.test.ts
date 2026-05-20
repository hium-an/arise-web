/**
 * Tests for lib/hooks/useAuth.ts
 *
 * useAuth là một custom hook đọc từ Zustand authStore và tính isAuthenticated.
 * Strategy: mock toàn bộ @/lib/store/authStore, điều khiển state trả về
 * trực tiếp để test logic `isAuthenticated = !loading && user !== null`.
 */

import { renderHook } from '@testing-library/react'
import type { User } from 'firebase/auth'

// ─── Mock: @/lib/store/authStore ──────────────────────────────────────────────
// useAuth gọi useAuthStore(selector), nên mock phải cho phép selector chạy
// trên object state mà ta kiểm soát.

let mockState: { user: User | null; loading: boolean } = {
  user: null,
  loading: true,
}

jest.mock('@/lib/store/authStore', () => ({
  useAuthStore: (selector: (s: typeof mockState) => unknown) =>
    selector(mockState),
}))

// ─── Mock: zustand/react/shallow ─────────────────────────────────────────────
// useShallow trong môi trường test chỉ cần pass-through selector
jest.mock('zustand/react/shallow', () => ({
  useShallow: (selector: unknown) => selector,
}))

import useAuth from '@/lib/hooks/useAuth'

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeFakeUser(uid = 'uid-001'): User {
  return { uid, email: 'hunter@arise.io', displayName: 'Test Hunter' } as User
}

describe('useAuth', () => {
  afterEach(() => {
    // Reset về trạng thái mặc định sau mỗi test
    mockState = { user: null, loading: true }
  })

  // ─── isAuthenticated ──────────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('phải là false khi loading=true và user=null', () => {
      // Arrange
      mockState = { user: null, loading: true }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('phải là false khi loading=false và user=null', () => {
      // Arrange
      mockState = { user: null, loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('phải là true khi loading=false và user khác null', () => {
      // Arrange
      mockState = { user: makeFakeUser(), loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('phải là false khi loading=true và user khác null (vẫn đang load)', () => {
      // Arrange — user đã có nhưng auth state chưa confirm xong
      mockState = { user: makeFakeUser(), loading: true }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  // ─── Passthrough: user và loading ─────────────────────────────────────────

  describe('return values', () => {
    it('trả về đúng user từ store khi user khác null', () => {
      // Arrange
      const fakeUser = makeFakeUser('uid-xyz')
      mockState = { user: fakeUser, loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.user).toBe(fakeUser)
      expect(result.current.user?.uid).toBe('uid-xyz')
    })

    it('trả về user=null khi chưa đăng nhập', () => {
      // Arrange
      mockState = { user: null, loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.user).toBeNull()
    })

    it('trả về loading=true khi store đang trong trạng thái khởi tạo', () => {
      // Arrange
      mockState = { user: null, loading: true }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.loading).toBe(true)
    })

    it('trả về loading=false sau khi store xác nhận xong auth state', () => {
      // Arrange
      mockState = { user: makeFakeUser(), loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert
      expect(result.current.loading).toBe(false)
    })

    it('trả về cả 3 field: user, loading, isAuthenticated', () => {
      // Arrange
      mockState = { user: makeFakeUser(), loading: false }

      // Act
      const { result } = renderHook(() => useAuth())

      // Assert — kiểm tra shape của return value
      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('isAuthenticated')
    })
  })
})
