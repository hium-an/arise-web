/**
 * NOTE: Packages cần cài đặt nếu chưa có:
 *   npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
 *   npm install -D @types/jest
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import type { User } from 'firebase/auth'

// ─── Mock: firebase/auth — onAuthStateChanged ─────────────────────────────────
const mockOnAuthStateChanged = jest.fn()
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  getAuth: jest.fn(() => ({ name: 'mock-auth' })),
  GoogleAuthProvider: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}))

// ─── Mock: @/lib/firebase/config ─────────────────────────────────────────────
jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-app' },
}))

// ─── Mock: @/lib/firebase/auth — expose auth instance ────────────────────────
jest.mock('@/lib/firebase/auth', () => ({
  auth: { name: 'mock-auth-instance' },
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}))

// ─── Mock: firebase/firestore ─────────────────────────────────────────────────
const mockGetDoc = jest.fn()
const mockDoc = jest.fn(() => 'mock-doc-ref')
jest.mock('firebase/firestore', () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getFirestore: jest.fn(() => ({ name: 'mock-db' })),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 0 })),
}))

// ─── Mock: @/lib/firebase/firestore ──────────────────────────────────────────
const mockCreateUserProfile = jest.fn()
jest.mock('@/lib/firebase/firestore', () => ({
  db: { name: 'mock-db' },
  createUserProfile: (...args: unknown[]) => mockCreateUserProfile(...args),
}))

// ─── Mock: zustand authStore ──────────────────────────────────────────────────
const mockSetAuthState = jest.fn()
jest.mock('@/lib/store/authStore', () => ({
  useAuthStore: (selector: (s: { setAuthState: typeof mockSetAuthState }) => unknown) =>
    selector({ setAuthState: mockSetAuthState }),
}))

import AuthProvider from '@/components/providers/AuthProvider'

// ─── Helper: fake User ────────────────────────────────────────────────────────
function makeFakeUser(): User {
  return { uid: 'uid-abc', email: 'hunter@arise.io' } as User
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gọi onAuthStateChanged khi component mount', () => {
    // Arrange: trả về unsubscribe function giả
    mockOnAuthStateChanged.mockReturnValueOnce(jest.fn())

    // Act
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    )

    // Assert
    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1)
  })

  it('truyền auth instance làm argument đầu tiên cho onAuthStateChanged', () => {
    mockOnAuthStateChanged.mockReturnValueOnce(jest.fn())

    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    // Argument đầu tiên phải là auth object từ @/lib/firebase/auth
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
      { name: 'mock-auth-instance' },
      expect.any(Function)
    )
  })

  it('gọi setAuthState với User object khi người dùng đăng nhập', () => {
    const fakeUser = makeFakeUser()
    let capturedCallback: ((user: User | null) => void) | null = null

    mockOnAuthStateChanged.mockImplementationOnce(
      (_auth: unknown, callback: (user: User | null) => void) => {
        capturedCallback = callback
        return jest.fn() // unsubscribe
      }
    )

    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    // Kích hoạt callback với user đã đăng nhập
    act(() => {
      capturedCallback!(fakeUser)
    })

    expect(mockSetAuthState).toHaveBeenCalledWith(fakeUser)
  })

  it('gọi setAuthState với null khi người dùng đăng xuất', () => {
    let capturedCallback: ((user: User | null) => void) | null = null

    mockOnAuthStateChanged.mockImplementationOnce(
      (_auth: unknown, callback: (user: User | null) => void) => {
        capturedCallback = callback
        return jest.fn()
      }
    )

    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    act(() => {
      capturedCallback!(null)
    })

    expect(mockSetAuthState).toHaveBeenCalledWith(null)
  })

  it('gọi unsubscribe function khi component unmount (ngăn memory leak)', () => {
    const mockUnsubscribe = jest.fn()
    mockOnAuthStateChanged.mockReturnValueOnce(mockUnsubscribe)

    const { unmount } = render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    // Trước khi unmount: chưa gọi unsubscribe
    expect(mockUnsubscribe).not.toHaveBeenCalled()

    // Unmount → cleanup effect → phải gọi unsubscribe
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('render children thành công', () => {
    mockOnAuthStateChanged.mockReturnValueOnce(jest.fn())

    const { getByText } = render(
      <AuthProvider>
        <span>Hello Hunter</span>
      </AuthProvider>
    )

    expect(getByText('Hello Hunter')).toBeInTheDocument()
  })

  it('gọi setAuthState ngay lập tức khi onAuthStateChanged kích hoạt lần đầu', () => {
    const fakeUser = makeFakeUser()

    // Simulate Firebase gọi callback ngay khi đăng ký listener
    mockOnAuthStateChanged.mockImplementationOnce(
      (_auth: unknown, callback: (user: User | null) => void) => {
        callback(fakeUser) // immediate fire
        return jest.fn()
      }
    )

    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    expect(mockSetAuthState).toHaveBeenCalledWith(fakeUser)
    expect(mockSetAuthState).toHaveBeenCalledTimes(1)
  })

  // ─── ensureUserProfile ────────────────────────────────────────────────────
  describe('ensureUserProfile', () => {
    it('không gọi createUserProfile nếu Firestore profile đã tồn tại', async () => {
      const fakeUser = makeFakeUser()
      // getDoc trả về document đã tồn tại
      mockGetDoc.mockResolvedValueOnce({ exists: () => true })

      let capturedCallback: ((user: User | null) => void) | null = null
      mockOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, callback: (user: User | null) => void) => {
          capturedCallback = callback
          return jest.fn()
        }
      )

      render(<AuthProvider><div /></AuthProvider>)
      await act(async () => { capturedCallback!(fakeUser) })

      expect(mockCreateUserProfile).not.toHaveBeenCalled()
    })

    it('gọi createUserProfile nếu Firestore profile chưa tồn tại (Google Sign-In)', async () => {
      const fakeUser = { uid: 'google-uid', email: 'user@gmail.com', displayName: 'Google User' } as User
      // getDoc trả về document không tồn tại
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      mockCreateUserProfile.mockResolvedValueOnce(undefined)

      let capturedCallback: ((user: User | null) => void) | null = null
      mockOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, callback: (user: User | null) => void) => {
          capturedCallback = callback
          return jest.fn()
        }
      )

      render(<AuthProvider><div /></AuthProvider>)
      await act(async () => { capturedCallback!(fakeUser) })

      expect(mockCreateUserProfile).toHaveBeenCalledWith(
        'google-uid',
        'user@gmail.com',
        'Google User',
      )
    })

    it('dùng email prefix làm displayName nếu user không có displayName', async () => {
      const fakeUser = { uid: 'uid-x', email: 'hunter@arise.io', displayName: null } as unknown as User
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      mockCreateUserProfile.mockResolvedValueOnce(undefined)

      let capturedCallback: ((user: User | null) => void) | null = null
      mockOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, callback: (user: User | null) => void) => {
          capturedCallback = callback
          return jest.fn()
        }
      )

      render(<AuthProvider><div /></AuthProvider>)
      await act(async () => { capturedCallback!(fakeUser) })

      expect(mockCreateUserProfile).toHaveBeenCalledWith('uid-x', 'hunter@arise.io', 'hunter')
    })

    it('không gọi ensureUserProfile khi user là null (logout)', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })

      let capturedCallback: ((user: User | null) => void) | null = null
      mockOnAuthStateChanged.mockImplementationOnce(
        (_auth: unknown, callback: (user: User | null) => void) => {
          capturedCallback = callback
          return jest.fn()
        }
      )

      render(<AuthProvider><div /></AuthProvider>)
      await act(async () => { capturedCallback!(null) })

      expect(mockGetDoc).not.toHaveBeenCalled()
      expect(mockCreateUserProfile).not.toHaveBeenCalled()
    })
  })
})
