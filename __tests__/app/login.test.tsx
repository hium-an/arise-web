/**
 * NOTE: Packages cần cài đặt nếu chưa có:
 *   npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
 *   npm install -D @types/jest
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FirebaseError } from 'firebase/app'

// ─── Mock: next/navigation ─────────────────────────────────────────────────
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

// ─── Mock: next/link ───────────────────────────────────────────────────────
jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

// ─── Mock: @/lib/firebase/auth ────────────────────────────────────────────
const mockSignInWithEmail = jest.fn()
const mockSignInWithGoogle = jest.fn()
jest.mock('@/lib/firebase/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
}))

// ─── Mock: @/lib/utils (cn) ───────────────────────────────────────────────
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    classes
      .flat()
      .filter(Boolean)
      .join(' '),
}))

import LoginPage from '@/app/(auth)/login/page'

// ─── Helper: tạo FirebaseError ────────────────────────────────────────────
function makeFirebaseError(code: string): FirebaseError {
  const err = new Error(code) as FirebaseError
  Object.assign(err, { code, name: 'FirebaseError' })
  // Đảm bảo instanceof FirebaseError check hoạt động qua duck-typing
  Object.setPrototypeOf(err, FirebaseError.prototype)
  return err
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Render ──────────────────────────────────────────────────────────────
  describe('render giao diện', () => {
    it('hiển thị input email', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('hiển thị input mật khẩu', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument()
    })

    it('hiển thị nút Đăng nhập', () => {
      render(<LoginPage />)
      expect(
        screen.getByRole('button', { name: /đăng nhập/i })
      ).toBeInTheDocument()
    })

    it('hiển thị nút Tiếp tục với Google', () => {
      render(<LoginPage />)
      expect(
        screen.getByRole('button', { name: /tiếp tục với google/i })
      ).toBeInTheDocument()
    })

    it('hiển thị link đăng ký', () => {
      render(<LoginPage />)
      expect(screen.getByRole('link', { name: /đăng ký ngay/i })).toBeInTheDocument()
    })
  })

  // ─── Validation ──────────────────────────────────────────────────────────
  describe('validation phía client', () => {
    it('hiển thị lỗi khi submit mà không nhập email', async () => {
      render(<LoginPage />)
      fireEvent.submit(screen.getByRole('form', { hidden: true }) ?? screen.getByLabelText(/đăng nhập bằng email/i))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập email.')
      })
    })

    it('hiển thị lỗi khi nhập email nhưng không nhập mật khẩu', async () => {
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      fireEvent.submit(screen.getByRole('form', { hidden: true }) ?? screen.getByLabelText(/đăng nhập bằng email/i))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập mật khẩu.')
      })
    })

    it('không gọi signInWithEmail khi form chưa hợp lệ', async () => {
      render(<LoginPage />)
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(mockSignInWithEmail).not.toHaveBeenCalled()
      })
    })
  })

  // ─── Submit thành công ───────────────────────────────────────────────────
  describe('submit thành công', () => {
    it('gọi signInWithEmail với đúng email và password', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({ user: { uid: '123' } })
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith('hunter@arise.io', 'password123')
      })
    })

    it('chuyển hướng đến /home sau khi đăng nhập thành công', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({ user: { uid: '123' } })
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/home')
      })
    })
  })

  // ─── Loading state ───────────────────────────────────────────────────────
  describe('trạng thái loading', () => {
    it('hiển thị text "ĐANG ĐĂNG NHẬP..." khi đang xử lý', async () => {
      // signInWithEmail không resolve ngay — giữ trạng thái loading
      mockSignInWithEmail.mockImplementationOnce(
        () => new Promise(() => {}) // never resolves
      )
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(screen.getByText(/đang đăng nhập/i)).toBeInTheDocument()
      })
    })

    it('vô hiệu hóa button khi đang loading', async () => {
      mockSignInWithEmail.mockImplementationOnce(() => new Promise(() => {}))
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /đang đăng nhập/i })
        ).toBeDisabled()
      })
    })
  })

  // ─── Lỗi Firebase ───────────────────────────────────────────────────────
  describe('xử lý lỗi Firebase', () => {
    it('hiển thị "Email hoặc mật khẩu không đúng." khi auth/invalid-credential', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/invalid-credential')
      )
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'wrongpass')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Email hoặc mật khẩu không đúng.'
        )
      })
    })

    it('hiển thị "Tài khoản không tồn tại." khi auth/user-not-found', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/user-not-found')
      )
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'ghost@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'pass123')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Tài khoản không tồn tại.')
      })
    })

    it('hiển thị "Quá nhiều lần thử." khi auth/too-many-requests', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/too-many-requests')
      )
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'pass')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Quá nhiều lần thử.')
      })
    })

    it('hiển thị thông báo lỗi chung khi gặp lỗi không xác định', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(new Error('Network error'))
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'pass')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Đã xảy ra lỗi. Vui lòng thử lại.'
        )
      })
    })

    it('không chuyển hướng khi đăng nhập thất bại', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/wrong-password')
      )
      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'wrongpass')
      fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled()
      })
    })
  })

  // ─── Google sign-in ──────────────────────────────────────────────────────
  describe('đăng nhập bằng Google', () => {
    it('gọi signInWithGoogle khi bấm nút Google', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce({ user: { uid: '456' } })
      render(<LoginPage />)

      fireEvent.click(screen.getByRole('button', { name: /tiếp tục với google/i }))

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
      })
    })

    it('chuyển hướng đến /home sau khi đăng nhập Google thành công', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce({ user: { uid: '456' } })
      render(<LoginPage />)

      fireEvent.click(screen.getByRole('button', { name: /tiếp tục với google/i }))

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/home')
      })
    })

    it('hiển thị lỗi khi popup Google bị đóng (auth/popup-closed-by-user)', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(
        makeFirebaseError('auth/popup-closed-by-user')
      )
      render(<LoginPage />)

      fireEvent.click(screen.getByRole('button', { name: /tiếp tục với google/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Đăng nhập bị hủy.')
      })
    })
  })
})
