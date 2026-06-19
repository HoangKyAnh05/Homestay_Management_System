import { useEffect, useMemo, useState } from 'react'
import { getStoredUser, logout } from '../../services/authService'
import { NAV_KEYS_BY_ROLE } from '../../utils/roleUtils'
import './AdminLayout.css'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  rooms: (
    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  bookings: (
    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>
  ),
  services: (
    <svg viewBox="0 0 24 24"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 11h3"/></svg>
  ),
  invoices: (
    <svg viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>
  ),
  marketing: (
    <svg viewBox="0 0 24 24"><path d="M3 11v3a2 2 0 0 0 2 2h2l4 4v-4h4l6-4V7l-6-4H5a2 2 0 0 0-2 2v3"/><path d="M3 8h8"/></svg>
  ),
  housekeeping: (
    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 17h6M12 13v4"/><circle cx="12" cy="10" r="1.5"/></svg>
  ),
  receptionist: (
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  ),
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Tổng quan', path: '/admin', icon: ICONS.dashboard },
  { key: 'receptionist-overview', label: 'Tổng quan', path: '/admin/receptionist', icon: ICONS.receptionist },
  {
    key: 'users',
    label: 'Quản lí người dùng',
    icon: ICONS.users,
    children: [
      { key: 'employees', label: 'Nhân viên', path: '/admin/users/employees' },
      { key: 'customers', label: 'Khách hàng', path: '/admin/users/customers' },
    ],
  },
  {
    key: 'rooms',
    label: 'Quản lí phòng',
    path: '/admin/rooms',
    icon: ICONS.rooms,
  },
  {
    key: 'bookings',
    label: 'Quản lý Đặt & Trả phòng',
    icon: ICONS.bookings,
    children: [
      { key: 'booking-orders', label: 'Đơn Đặt Phòng', path: '/admin/bookings' },
      { key: 'check-in-logs', label: 'Nhật ký Lưu trú (Check-in)', path: '/admin/check-in-logs' },
    ],
  },
  {
    key: 'services',
    label: 'Quản lý Dịch vụ',
    icon: ICONS.services,
    children: [
      { key: 'service-categories', label: 'Danh mục Dịch vụ', path: '/admin/services/categories' },
      { key: 'surcharges', label: 'Phụ phí', path: '/admin/services/surcharges' },
    ],
  },
  { key: 'rules', label: 'Cấu hình Nội quy & Phạt', path: '/admin/rules-penalties', icon: ICONS.rules },
  { key: 'invoices', label: 'Quản lý Hóa đơn', path: '/admin/invoices', icon: ICONS.invoices },
  {
    key: 'housekeeping',
    label: 'Quản lý Housekeeping',
    icon: ICONS.housekeeping,
    children: [
      { key: 'housekeeping-overview', label: 'Tổng quan', path: '/admin/housekeeping/overview', adminOnly: true },
      { key: 'housekeeping-room-calendar', label: 'Lịch trạng thái phòng', path: '/admin/housekeeping/room-calendar', adminOnly: true },
      { key: 'housekeeping-tasks', label: 'Công việc vệ sinh', path: '/admin/housekeeping/tasks' },
      { key: 'housekeeping-checklists', label: 'Cấu hình checklist', path: '/admin/housekeeping/checklists', adminOnly: true },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & AI Agent',
    icon: ICONS.marketing,
    children: [
      { key: 'ai-post-agent', label: 'AI Agent Đăng bài', path: '/admin/marketing/ai-agent' },
      { key: 'post-logs', label: 'Nhật ký Bài đăng', path: '/admin/marketing/post-logs' },
      { key: 'vouchers', label: 'Mã giảm giá (Vouchers)', path: '/admin/marketing/vouchers' },
    ],
  },
]

const ADMIN_HIDDEN_NAV_KEYS = new Set(['receptionist-overview'])

export function navigate(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function roleBadgeLabel(role) {
  const labels = {
    ROLE_ADMIN: 'Quản trị viên',
    ROLE_RECEPTIONIST: 'Lễ tân',
    ROLE_HOUSEKEEPING: 'Housekeeping',
    ROLE_MARKETING: 'Marketing',
  }
  return labels[role] || role || 'Nhân viên'
}

function isGroupActive(item, activePage) {
  return item.key === activePage || item.children?.some(child => child.key === activePage)
}

function getActiveGroupKey(activePage, navItems) {
  return navItems.find(item => item.children && isGroupActive(item, activePage))?.key || null
}

function AdminLayout({ activePage, children }) {
  const user = getStoredUser()
  const role = user?.role || 'ROLE_ADMIN'
  const [collapsed, setCollapsed] = useState(false)

  // Lọc menu theo role: null = toàn bộ (admin)
  // Dùng useMemo để tránh tạo array mới mỗi render (gây reset openGroupKey)
  const navItems = useMemo(() => {
    const allowedKeys = NAV_KEYS_BY_ROLE[role]
    if (!allowedKeys) {
      return NAV_ITEMS.filter(item => !ADMIN_HIDDEN_NAV_KEYS.has(item.key))
    }
    return NAV_ITEMS
      .filter(item => allowedKeys.includes(item.key))
      .map(item => item.children
        ? { ...item, children: item.children.filter(child => !child.adminOnly) }
        : item)
  }, [role])

  const [openGroupKey, setOpenGroupKey] = useState(() => getActiveGroupKey(activePage, navItems))

  useEffect(() => {
    setOpenGroupKey(prev => {
      const next = getActiveGroupKey(activePage, navItems)
      // Chỉ set lại nếu có nhóm active và chưa mở
      return next || prev
    })
  }, [activePage, navItems])

  const handleLogout = () => {
    logout()
    window.location.assign('/admin/login')
  }

  const toggleGroup = (key) => {
    setOpenGroupKey(prev => prev === key ? null : key)
  }

  return (
    <div className={`admin-shell${collapsed ? ' admin-shell--collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          {!collapsed && <span className="admin-sidebar-logo-text">Home Stays</span>}
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const active = isGroupActive(item, activePage)

            if (item.children) {
              const open = openGroupKey === item.key
              return (
                <div key={item.key} className="admin-nav-group">
                  <button
                    type="button"
                    className={`admin-nav-item admin-nav-group-trigger${open ? ' admin-nav-item--active' : ''}`}
                    onClick={() => toggleGroup(item.key)}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={open}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="admin-nav-label">{item.label}</span>
                        <span className={`admin-nav-chevron${open ? ' admin-nav-chevron--open' : ''}`}>
                          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </>
                    )}
                  </button>

                  {!collapsed && open && (
                    <div className="admin-nav-submenu">
                      {item.children.map(child => (
                        <button
                          key={child.key}
                          type="button"
                          className={`admin-nav-subitem${activePage === child.key ? ' admin-nav-subitem--active' : ''}`}
                          onClick={() => navigate(child.path)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                className={`admin-nav-item${activePage === item.key ? ' admin-nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-nav-item admin-nav-item--home"
            onClick={() => navigate('/home')}
            title={collapsed ? 'Home Stays' : undefined}
          >
            <span className="admin-nav-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </span>
            {!collapsed && <span>Home Stays</span>}
          </button>

          <button
            type="button"
            className="admin-nav-item admin-nav-item--logout"
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
          >
            <span className="admin-nav-icon">
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-topbar-toggle"
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <div className="admin-topbar-time" suppressHydrationWarning>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {new Date().toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
          </div>

          <div className="admin-topbar-right">
            <button className="admin-topbar-bell" type="button" aria-label="Thông báo">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="admin-topbar-user">
              <span className="admin-topbar-avatar">
                {user?.fullName?.split(' ').pop()?.[0]?.toUpperCase() || 'A'}
              </span>
              <div>
                <strong>{user?.fullName || user?.email}</strong>
                <span className="admin-topbar-role">{roleBadgeLabel(role)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
