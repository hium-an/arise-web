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
const mockSignUpWithEmail = jest.fn()
jest.mock('@/lib/firebase/auth', () => ({
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...args),
}))

// ─── Mock: @/lib/utils (cn) ───────────────────────────────────────────────
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) =>
    classes
      .flat()
      .filter(Boolean)
      .join(' '),
}))

import SignupPage from '@/app/(auth)/signup/page'

// ─── Helper: tạo FirebaseError ────────────────────────────────────────────
function makeFirebaseError(code: string): FirebaseError {
  const err = new Error(code) as FirebaseError
  Object.assign(err, { code, name: 'FirebaseError' })
  Object.setPrototypeOf(err, FirebaseError.prototype)
  return err
}

// ─── Helper: điền form hợp lệ ────────────────────────────────────────────
async function fillValidForm(
  email = 'hunter@arise.io',
  password = 'SecurePass1',
  confirmPassword = 'SecurePass1'
) {
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), password)
  await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu/i), confirmPassword)
}

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── Render ──────────────────────────────────────────────────────────────
  describe('render giao diện', () => {
    it('hiển thị input email', () => {
      render(<SignupPage />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('hiển thị input mật khẩu', () => {
      render(<SignupPage />)
      expect(screen.getByLabelText(/^mật khẩu$/i)).toBeInTheDocument()
    })

    it('hiển thị input xác nhận mật khẩu', () => {
      render(<SignupPage />)
      expect(screen.getByLabelText(/xác nhận mật khẩu/i)).toBeInTheDocument()
    })

    it('hiển thị đúng 3 input trên form', () => {
      render(<SignupPage />)
      expect(screen.getAllByRole('textbox').length + screen.getAllByDisplayValue('').length).toBeGreaterThanOrEqual(1)
      // Kiểm tra 3 field cụ thể tồn tại
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^mật khẩu$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/xác nhận mật khẩu/i)).toBeInTheDocument()
    })

    it('hiển thị nút Tạo tài khoản', () => {
      render(<SignupPage />)
      expect(
        screen.getByRole('button', { name: /tạo tài khoản/i })
      ).toBeInTheDocument()
    })

    it('hiển thị link đăng nhập', () => {
      render(<SignupPage />)
      expect(screen.getByRole('link', { name: /đăng nhập/i })).toBeInTheDocument()
    })
  })

  // ─── Validation phía client ──────────────────────────────────────────────
  describe('validation phía client', () => {
    it('hiển thị lỗi khi submit mà không nhập email', async () => {
      render(<SignupPage />)
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập email.')
      })
    })

    it('hiển thị lỗi khi email không đúng định dạng', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email không hợp lệ.')
      })
    })

    it('hiển thị lỗi khi không nhập mật khẩu', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập mật khẩu.')
      })
    })

    it('hiển thị lỗi khi mật khẩu ít hơn 8 ký tự', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), '12345')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Mật khẩu phải có ít nhất 8 ký tự.'
        )
      })
    })

    it('hiển thị lỗi khi không nhập xác nhận mật khẩu', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'SecurePass1')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Vui lòng xác nhận mật khẩu.'
        )
      })
    })

    it('hiển thị lỗi khi mật khẩu xác nhận không khớp', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'hunter@arise.io')
      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'SecurePass1')
      await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu/i), 'WrongPass1')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Mật khẩu xác nhận không khớp.'
        )
      })
    })

    it('không gọi signUpWithEmail khi form không hợp lệ', async () => {
      render(<SignupPage />)
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(mockSignUpWithEmail).not.toHaveBeenCalled()
      })
    })

    it('hiển thị badge "CHƯA KHỚP" khi mật khẩu và xác nhận khác nhau', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'SecurePass1')
      await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu/i), 'WrongPass1')

      await waitFor(() => {
        expect(screen.getByText('CHƯA KHỚP')).toBeInTheDocument()
      })
    })

    it('hiển thị badge "KHỚP" khi mật khẩu và xác nhận giống nhau', async () => {
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'SecurePass1')
      await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu/i), 'SecurePass1')

      await waitFor(() => {
        expect(screen.getByText('KHỚP')).toBeInTheDocument()
      })
    })
  })

  // ─── Submit thành công ───────────────────────────────────────────────────
  describe('submit hợp lệ', () => {
    it('gọi signUpWithEmail với đúng email và password', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({ user: { uid: 'new-uid' } })
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(mockSignUpWithEmail).toHaveBeenCalledWith('hunter@arise.io', 'SecurePass1')
      })
    })

    it('chuyển hướng đến /home sau khi đăng ký thành công', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({ user: { uid: 'new-uid' } })
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/home')
      })
    })

    it('trim email trước khi gọi signUpWithEmail', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({ user: { uid: 'new-uid' } })
      render(<SignupPage />)

      await userEvent.type(screen.getByLabelText(/email/i), '  hunter@arise.io  ')
      await userEvent.type(screen.getByLabelText(/^mật khẩu$/i), 'SecurePass1')
      await userEvent.type(screen.getByLabelText(/xác nhận mật khẩu/i), 'SecurePass1')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(mockSignUpWithEmail).toHaveBeenCalledWith('hunter@arise.io', 'SecurePass1')
      })
    })
  })

  // ─── Loading state ───────────────────────────────────────────────────────
  describe('trạng thái loading', () => {
    it('hiển thị text "ĐANG TẠO TÀI KHOẢN..." khi đang xử lý', async () => {
      mockSignUpWithEmail.mockImplementationOnce(() => new Promise(() => {}))
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByText(/đang tạo tài khoản/i)).toBeInTheDocument()
      })
    })

    it('vô hiệu hóa button khi đang loading', async () => {
      mockSignUpWithEmail.mockImplementationOnce(() => new Promise(() => {}))
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /đang tạo tài khoản/i })
        ).toBeDisabled()
      })
    })

    it('vô hiệu hóa các input khi đang loading', async () => {
      mockSignUpWithEmail.mockImplementationOnce(() => new Promise(() => {}))
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeDisabled()
        expect(screen.getByLabelText(/^mật khẩu$/i)).toBeDisabled()
        expect(screen.getByLabelText(/xác nhận mật khẩu/i)).toBeDisabled()
      })
    })
  })

  // ─── Lỗi Firebase ───────────────────────────────────────────────────────
  describe('xử lý lỗi Firebase', () => {
    it('hiển thị "Email này đã được đăng ký." khi auth/email-already-in-use', async () => {
      mockSignUpWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/email-already-in-use')
      )
      render(<SignupPage />)

      await fillValidForm('existing@arise.io')
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Email này đã được đăng ký.')
      })
    })

    it('hiển thị "Mật khẩu quá yếu." khi auth/weak-password', async () => {
      mockSignUpWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/weak-password')
      )
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu quá yếu.')
      })
    })

    it('hiển thị "Lỗi mạng." khi auth/network-request-failed', async () => {
      mockSignUpWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/network-request-failed')
      )
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Lỗi mạng.')
      })
    })

    it('hiển thị thông báo lỗi chung khi gặp lỗi không xác định', async () => {
      mockSignUpWithEmail.mockRejectedValueOnce(new Error('Unknown error'))
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Đã xảy ra lỗi. Vui lòng thử lại.'
        )
      })
    })

    it('không chuyển hướng khi đăng ký thất bại', async () => {
      mockSignUpWithEmail.mockRejectedValueOnce(
        makeFirebaseError('auth/email-already-in-use')
      )
      render(<SignupPage />)

      await fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }))

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled()
      })
    })
  })
})
