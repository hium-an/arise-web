import { FirebaseError } from 'firebase/app'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'Tài khoản không tồn tại.',
  'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
  'auth/too-many-requests': 'Quá nhiều lần thử.',
  'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối internet.',
  'auth/popup-closed-by-user': 'Đăng nhập bị hủy.',
  'auth/popup-blocked': 'Popup bị chặn. Vui lòng cho phép popup.',
  'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu. Cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.',
  'auth/operation-not-allowed': 'Phương thức đăng ký này chưa được bật.',
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? 'Đã xảy ra lỗi. Vui lòng thử lại.'
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}
