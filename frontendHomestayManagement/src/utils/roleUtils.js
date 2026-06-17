/**
 * Tiện ích phân quyền role-based cho staff/admin.
 * Mỗi role có menu riêng và trang mặc định sau khi đăng nhập.
 */

export const STAFF_ROLES = new Set([
  'ROLE_ADMIN',
  'ROLE_RECEPTIONIST',
  'ROLE_HOUSEKEEPING',
  'ROLE_MARKETING',
])

/**
 * Trả về đường dẫn mặc định khi role đó đăng nhập thành công.
 */
export function roleDefaultPath(role) {
  switch (role) {
    case 'ROLE_ADMIN':        return '/admin'
    case 'ROLE_RECEPTIONIST': return '/admin/receptionist'
    case 'ROLE_HOUSEKEEPING': return '/admin/housekeeping'
    case 'ROLE_MARKETING':    return '/admin/marketing/ai-agent'
    default:                  return '/admin'
  }
}

/**
 * Định nghĩa nav menu cho từng role dưới dạng key string.
 * AdminLayout sẽ dùng key này để lấy icon + label từ NAV_ITEMS gốc.
 *
 * null = dùng toàn bộ menu gốc (ROLE_ADMIN)
 */
export const NAV_KEYS_BY_ROLE = {
  ROLE_ADMIN: null,

  ROLE_RECEPTIONIST: [
    'receptionist-overview',        // Tổng quan lễ tân
    'bookings',                      // Quản lý Đặt & Trả phòng
    'invoices',                      // Quản lý Hóa đơn
  ],

  ROLE_HOUSEKEEPING: [
    'housekeeping',
  ],

  ROLE_MARKETING: [
    'marketing',
  ],
}

/**
 * Kiểm tra role có được phép truy cập path không.
 * Admin được phép tất cả.
 */
export function roleCanAccess(role, path) {
  if (role === 'ROLE_ADMIN') return true

  const ALLOWED_PATHS = {
    ROLE_RECEPTIONIST: [
      '/admin/receptionist',
      '/admin/bookings',
      '/admin/check-in-logs',
      '/admin/invoices',
    ],
    ROLE_HOUSEKEEPING: [
      '/admin/housekeeping',
    ],
    ROLE_MARKETING: [
      '/admin/marketing/ai-agent',
      '/admin/marketing/post-logs',
      '/admin/marketing/vouchers',
    ],
  }

  const allowed = ALLOWED_PATHS[role] || []
  return allowed.some(p => path === p || path.startsWith(p + '/'))
}
