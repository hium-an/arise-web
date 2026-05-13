/**
 * NOTE: Packages cần cài đặt nếu chưa có:
 *   npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
 *   npm install -D @types/jest
 */

import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from '@/lib/store/authStore'
import type { User } from 'firebase/auth'

// Reset store về initial state sau mỗi test
afterEach(() => {
  useAuthStore.setState({ user: null, loading: true })
})

// Helper tạo fake User object
function makeFakeUser(overrides?: Partial<User>): User {
  return {
    uid: 'test-uid-123',
    email: 'hunter@arise.io',
    displayName: 'Test Hunter',
    emailVerified: true,
    ...overrides,
  } as User
}

describe('useAuthStore', () => {
  describe('trạng thái khởi tạo', () => {
    it('user ban đầu phải là null', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.user).toBeNull()
    })

    it('loading ban đầu phải là true', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.loading).toBe(true)
    })
  })

  describe('setUser', () => {
    it('cập nhật user thành công khi truyền vào User object', () => {
      const { result } = renderHook(() => useAuthStore())
      const fakeUser = makeFakeUser()

      act(() => {
        result.current.setAuthState(fakeUser)
      })

      expect(result.current.user).toEqual(fakeUser)
    })

    it('xóa user về null khi truyền null', () => {
      const fakeUser = makeFakeUser()
      useAuthStore.setState({ user: fakeUser, loading: false })
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthState(null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('cập nhật loading thành false', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('cập nhật loading thành true', () => {
      useAuthStore.setState({ loading: false })
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)
    })
  })

  describe('setAuthState — cập nhật nguyên tử (atomic)', () => {
    it('đặt user và loading=false cùng lúc khi truyền User', () => {
      const { result } = renderHook(() => useAuthStore())
      const fakeUser = makeFakeUser()

      act(() => {
        result.current.setAuthState(fakeUser)
      })

      // Cả hai phải được cập nhật cùng một lần render
      expect(result.current.user).toEqual(fakeUser)
      expect(result.current.loading).toBe(false)
    })

    it('đặt user=null và loading=false khi đăng xuất', () => {
      const fakeUser = makeFakeUser()
      useAuthStore.setState({ user: fakeUser, loading: true })
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthState(null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('cho phép override loading=true nếu được chỉ định', () => {
      const { result } = renderHook(() => useAuthStore())
      const fakeUser = makeFakeUser()

      act(() => {
        result.current.setAuthState(fakeUser, true)
      })

      expect(result.current.user).toEqual(fakeUser)
      expect(result.current.loading).toBe(true)
    })

    it('giữ nguyên uid và email của user sau khi setAuthState', () => {
      const { result } = renderHook(() => useAuthStore())
      const fakeUser = makeFakeUser({ uid: 'uid-xyz', email: 'xyz@test.com' })

      act(() => {
        result.current.setAuthState(fakeUser)
      })

      expect(result.current.user?.uid).toBe('uid-xyz')
      expect(result.current.user?.email).toBe('xyz@test.com')
    })
  })
})
