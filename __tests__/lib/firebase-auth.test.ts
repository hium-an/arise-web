/**
 * NOTE: Packages cần cài đặt nếu chưa có:
 *   npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
 *   npm install -D @types/jest
 */

import type { UserCredential } from 'firebase/auth'

// ─── Mock toàn bộ module firebase/auth ───────────────────────────────────────
const mockSignInWithEmailAndPassword = jest.fn()
const mockCreateUserWithEmailAndPassword = jest.fn()
const mockSignInWithPopup = jest.fn()
const mockSignOut = jest.fn()
const mockGetAuth = jest.fn(() => ({ name: 'mock-auth-instance' }))
const mockGoogleAuthProvider = jest.fn()

jest.mock('firebase/auth', () => ({
  getAuth: () => mockGetAuth(),
  GoogleAuthProvider: mockGoogleAuthProvider,
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

// ─── Mock firebase config để tránh validate env vars ─────────────────────────
jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-firebase-app' },
}))

// Import SAU khi mock đã được thiết lập
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
} from '@/lib/firebase/auth'
import { FirebaseError } from 'firebase/app'

// ─── Fake UserCredential ─────────────────────────────────────────────────────
function makeFakeCredential(email = 'hunter@arise.io'): UserCredential {
  return {
    user: { uid: 'uid-123', email } as UserCredential['user'],
    providerId: null,
    operationType: 'signIn',
  } as UserCredential
}

// ─── Fake FirebaseError ──────────────────────────────────────────────────────
function makeFirebaseError(code: string, message = 'Firebase error'): FirebaseError {
  const err = new Error(message) as FirebaseError
  // FirebaseError có thuộc tính `code`
  Object.assign(err, { code, name: 'FirebaseError' })
  return err
}

describe('lib/firebase/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── signInWithEmail ────────────────────────────────────────────────────────
  describe('signInWithEmail', () => {
    it('gọi signInWithEmailAndPassword với đúng email và password', async () => {
      const fakeCredential = makeFakeCredential()
      mockSignInWithEmailAndPassword.mockResolvedValueOnce(fakeCredential)

      await signInWithEmail('hunter@arise.io', 'password123')

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledTimes(1)
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(), // auth instance
        'hunter@arise.io',
        'password123'
      )
    })

    it('trả về UserCredential khi đăng nhập thành công', async () => {
      const fakeCredential = makeFakeCredential()
      mockSignInWithEmailAndPassword.mockResolvedValueOnce(fakeCredential)

      const result = await signInWithEmail('hunter@arise.io', 'password123')

      expect(result).toEqual(fakeCredential)
    })

    it('ném lỗi Firebase khi credentials không đúng (auth/wrong-password)', async () => {
      const firebaseError = makeFirebaseError('auth/wrong-password', 'Wrong password')
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      await expect(signInWithEmail('hunter@arise.io', 'wrongpass')).rejects.toMatchObject({
        code: 'auth/wrong-password',
      })
    })

    it('ném lỗi Firebase khi tài khoản không tồn tại (auth/user-not-found)', async () => {
      const firebaseError = makeFirebaseError('auth/user-not-found')
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      await expect(signInWithEmail('ghost@arise.io', 'pass')).rejects.toMatchObject({
        code: 'auth/user-not-found',
      })
    })

    it('ném lỗi Firebase khi email không hợp lệ (auth/invalid-email)', async () => {
      const firebaseError = makeFirebaseError('auth/invalid-email')
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      await expect(signInWithEmail('not-an-email', 'pass')).rejects.toMatchObject({
        code: 'auth/invalid-email',
      })
    })
  })

  // ─── signUpWithEmail ────────────────────────────────────────────────────────
  describe('signUpWithEmail', () => {
    it('gọi createUserWithEmailAndPassword với đúng email và password', async () => {
      const fakeCredential = makeFakeCredential('new@arise.io')
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce(fakeCredential)

      await signUpWithEmail('new@arise.io', 'securepass')

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledTimes(1)
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(), // auth instance
        'new@arise.io',
        'securepass'
      )
    })

    it('trả về UserCredential khi tạo tài khoản thành công', async () => {
      const fakeCredential = makeFakeCredential('new@arise.io')
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce(fakeCredential)

      const result = await signUpWithEmail('new@arise.io', 'securepass')

      expect(result).toEqual(fakeCredential)
    })

    it('ném lỗi Firebase khi email đã được đăng ký (auth/email-already-in-use)', async () => {
      const firebaseError = makeFirebaseError('auth/email-already-in-use')
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      await expect(signUpWithEmail('existing@arise.io', 'pass123')).rejects.toMatchObject({
        code: 'auth/email-already-in-use',
      })
    })

    it('ném lỗi Firebase khi mật khẩu quá yếu (auth/weak-password)', async () => {
      const firebaseError = makeFirebaseError('auth/weak-password')
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      await expect(signUpWithEmail('new@arise.io', '123')).rejects.toMatchObject({
        code: 'auth/weak-password',
      })
    })
  })

  // ─── signInWithGoogle ───────────────────────────────────────────────────────
  describe('signInWithGoogle', () => {
    it('gọi signInWithPopup với auth instance và GoogleAuthProvider', async () => {
      const fakeCredential = makeFakeCredential('google@gmail.com')
      mockSignInWithPopup.mockResolvedValueOnce(fakeCredential)

      await signInWithGoogle()

      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1)
      // Argument đầu là auth instance, argument thứ hai là googleProvider instance
      expect(mockSignInWithPopup).toHaveBeenCalledWith(
        expect.anything(), // auth
        expect.anything()  // googleProvider
      )
    })

    it('trả về UserCredential khi đăng nhập Google thành công', async () => {
      const fakeCredential = makeFakeCredential('google@gmail.com')
      mockSignInWithPopup.mockResolvedValueOnce(fakeCredential)

      const result = await signInWithGoogle()

      expect(result).toEqual(fakeCredential)
    })

    it('ném lỗi Firebase khi người dùng đóng popup (auth/popup-closed-by-user)', async () => {
      const firebaseError = makeFirebaseError('auth/popup-closed-by-user')
      mockSignInWithPopup.mockRejectedValueOnce(firebaseError)

      await expect(signInWithGoogle()).rejects.toMatchObject({
        code: 'auth/popup-closed-by-user',
      })
    })

    it('ném lỗi Firebase khi popup bị chặn (auth/popup-blocked)', async () => {
      const firebaseError = makeFirebaseError('auth/popup-blocked')
      mockSignInWithPopup.mockRejectedValueOnce(firebaseError)

      await expect(signInWithGoogle()).rejects.toMatchObject({
        code: 'auth/popup-blocked',
      })
    })
  })

  // ─── signOut ────────────────────────────────────────────────────────────────
  describe('signOut', () => {
    it('gọi firebase signOut với auth instance', async () => {
      mockSignOut.mockResolvedValueOnce(undefined)

      await signOut()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockSignOut).toHaveBeenCalledWith(expect.anything())
    })

    it('resolve void khi đăng xuất thành công', async () => {
      mockSignOut.mockResolvedValueOnce(undefined)

      const result = await signOut()

      expect(result).toBeUndefined()
    })

    it('ném lỗi Firebase nếu signOut thất bại', async () => {
      const firebaseError = makeFirebaseError('auth/network-request-failed')
      mockSignOut.mockRejectedValueOnce(firebaseError)

      await expect(signOut()).rejects.toMatchObject({
        code: 'auth/network-request-failed',
      })
    })
  })
})
