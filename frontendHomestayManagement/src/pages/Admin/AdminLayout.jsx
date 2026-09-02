import { useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import StaffAiChat from '../../components/StaffAiChat/StaffAiChat'
import ShiftHandoverModal from '../../components/ShiftHandover/ShiftHandoverModal'
import { ShiftGuardProvider, useShiftGuard } from '../../context/ShiftGuardContext'
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
  shifts: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
    label: 'Quản lý Phòng',
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
      { key: 'cancellations', label: 'Hủy phòng & Hoàn tiền', path: '/admin/cancellations', adminOnly: true },
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
  { key: 'rules', label: 'Cấu hình Nội quy & Phạt & Phụ thu', path: '/admin/rules-penalties', icon: ICONS.rules },
  { key: 'reviews', label: 'Quản lý Đánh giá', path: '/admin/reviews', icon: ICONS.rules },
  { key: 'invoices', label: 'Quản lý Hóa đơn', path: '/admin/invoices', icon: ICONS.invoices },
  { key: 'shifts', label: 'Quản lý Giao ca & Quỹ', path: '/admin/shifts', icon: ICONS.shifts },
  {
    key: 'housekeeping',
    label: 'Quản lý Housekeeping',
    icon: ICONS.housekeeping,
    children: [
      { key: 'housekeeping-room-calendar', label: 'Lịch trạng thái phòng', path: '/admin/housekeeping/room-calendar', adminOnly: true },
      { key: 'housekeeping-tasks', label: 'Công việc vệ sinh', path: '/admin/housekeeping/tasks' },
      { key: 'housekeeping-checklists', label: 'Cấu hình checklist', path: '/admin/housekeeping/checklists', adminOnly: true },
      { key: 'housekeeping-incidents', label: 'Đồ hỏng & mất', path: '/admin/housekeeping/incidents' },
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

function AdminLayoutInner({ activePage, children, onOpenShiftModal }) {
  const user = getStoredUser()
  const role = user?.role || 'ROLE_ADMIN'
  const [collapsed, setCollapsed] = useState(false)
  const { isReceptionist, isInShift, loadingShift, openHandoverModal, refreshShiftStatus } = useShiftGuard()

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
  const [navAlerts, setNavAlerts] = useState({
    bookings: false,
    'booking-orders': false,
    'check-in-logs': false,
    housekeeping: false,
    'housekeeping-incidents': false,
    'housekeeping-tasks': false,
    shifts: false,
    reviews: false,
    invoices: false,
    rooms: false,
    marketing: false,
    users: false,
  })

  const maxBookingIdRef = useRef(0)
  const latestIncidentCountRef = useRef(0)
  const latestTaskCountRef = useRef(0)
  const latestReviewCountRef = useRef(0)

  const clearAlert = (key) => {
    const maxId = maxBookingIdRef.current
    if (key === 'booking-orders' || key === 'bookings') {
      if (maxId > 0) localStorage.setItem('admin_seen_booking_orders_id', String(maxId))
    }
    if (key === 'check-in-logs' || key === 'bookings') {
      if (maxId > 0) localStorage.setItem('admin_seen_checkin_logs_id', String(maxId))
    }
    if (key === 'housekeeping-incidents' || key === 'housekeeping') {
      localStorage.setItem('admin_seen_incidents_count', String(latestIncidentCountRef.current))
    }
    if (key === 'housekeeping-tasks' || key === 'housekeeping') {
      localStorage.setItem('admin_seen_tasks_count', String(latestTaskCountRef.current))
    }
    if (key === 'reviews') {
      localStorage.setItem('admin_seen_reviews_count', String(latestReviewCountRef.current))
    }
    if (key === 'shifts') {
      localStorage.setItem('admin_seen_shifts_at', String(Date.now()))
    }
    if (key === 'rooms') {
      localStorage.setItem('admin_seen_rooms_at', String(Date.now()))
    }

    setNavAlerts(prev => {
      const next = { ...prev }
      next[key] = false
      if (key === 'bookings') {
        next['booking-orders'] = false
        next['check-in-logs'] = false
      }
      if (key === 'housekeeping') {
        next['housekeeping-incidents'] = false
        next['housekeeping-tasks'] = false
      }
      // Recompute parent group alerts
      next.bookings = Boolean(next['booking-orders'] || next['check-in-logs'])
      next.housekeeping = Boolean(next['housekeeping-incidents'] || next['housekeeping-tasks'])
      return next
    })
  }

  const fetchAllAlerts = async () => {
    const token = getStoredToken()
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    const updated = { ...navAlerts }

    // 1. Quản lý Đặt & Trả phòng (Bookings & Check-in logs)
    try {
      const res = await fetch('http://localhost:8080/api/admin/bookings/check-in-logs', { headers })
      if (res.ok) {
        const bookings = await res.json()
        if (Array.isArray(bookings) && bookings.length > 0) {
          const maxId = Math.max(...bookings.map(b => Number(b.bookingId || b.id || 0)))
          maxBookingIdRef.current = maxId

          const seenOrdersId = Number(localStorage.getItem('admin_seen_booking_orders_id') || 0)
          const seenCheckInId = Number(localStorage.getItem('admin_seen_checkin_logs_id') || 0)

          if (seenOrdersId === 0) {
            localStorage.setItem('admin_seen_booking_orders_id', String(maxId))
            updated['booking-orders'] = false
          } else {
            updated['booking-orders'] = maxId > seenOrdersId
          }

          if (seenCheckInId === 0) {
            localStorage.setItem('admin_seen_checkin_logs_id', String(maxId))
            updated['check-in-logs'] = false
          } else {
            updated['check-in-logs'] = maxId > seenCheckInId
          }

          // If user is currently on active page, don't show red dot
          if (activePage === 'booking-orders') updated['booking-orders'] = false
          if (activePage === 'check-in-logs') updated['check-in-logs'] = false

          updated.bookings = updated['booking-orders'] || updated['check-in-logs']
        } else {
          updated['booking-orders'] = false
          updated['check-in-logs'] = false
          updated.bookings = false
        }
      }
    } catch (_) {}

    // 2. Quản lý Housekeeping (Đồ hỏng & mất, Nhiệm vụ vệ sinh)
    try {
      const [incidentRes, taskRes] = await Promise.allSettled([
        fetch('http://localhost:8080/api/admin/incidents/summary', { headers }),
        fetch('http://localhost:8080/api/housekeeping/tasks', { headers }),
      ])

      let hasIncidentAlert = false
      if (incidentRes.status === 'fulfilled' && incidentRes.value.ok) {
        const summary = await incidentRes.value.json()
        const totalIncidents = Number(summary.totalIncidents || 0)
        latestIncidentCountRef.current = totalIncidents

        const seenIncidentsCount = Number(localStorage.getItem('admin_seen_incidents_count') ?? -1)
        if (seenIncidentsCount === -1) {
          localStorage.setItem('admin_seen_incidents_count', String(totalIncidents))
          hasIncidentAlert = false
        } else {
          hasIncidentAlert = totalIncidents > seenIncidentsCount
        }
      }
      if (activePage === 'housekeeping-incidents') hasIncidentAlert = false
      updated['housekeeping-incidents'] = hasIncidentAlert

      let hasTaskAlert = false
      if (taskRes.status === 'fulfilled' && taskRes.value.ok) {
        const tasks = await taskRes.value.json()
        if (Array.isArray(tasks)) {
          latestTaskCountRef.current = tasks.length
          const seenTasksCount = Number(localStorage.getItem('admin_seen_tasks_count') ?? -1)
          if (seenTasksCount === -1) {
            localStorage.setItem('admin_seen_tasks_count', String(tasks.length))
            hasTaskAlert = false
          } else {
            hasTaskAlert = tasks.length > seenTasksCount
          }
        }
      }
      if (activePage === 'housekeeping-tasks') hasTaskAlert = false
      updated['housekeeping-tasks'] = hasTaskAlert
      updated.housekeeping = hasIncidentAlert || hasTaskAlert
    } catch (_) {}

    // 3. Quản lý Giao ca & Quỹ (Shifts)
    try {
      const shiftRes = await fetch('http://localhost:8080/api/admin/shifts/current-status', { headers })
      if (shiftRes.ok) {
        const shiftData = await shiftRes.json()
        const hasPendingHandover = Boolean(shiftData?.pendingHandover || shiftData?.hasPendingApproval || shiftData?.requiresAction)
        const seenShiftsAt = Number(localStorage.getItem('admin_seen_shifts_at') || 0)
        const shiftAlert = hasPendingHandover && (Date.now() - seenShiftsAt > 300000)
        updated.shifts = activePage === 'shifts' ? false : shiftAlert
      }
    } catch (_) {}

    // 4. Quản lý Đánh giá (Reviews)
    try {
      const reviewRes = await fetch('http://localhost:8080/api/admin/reviews', { headers })
      if (reviewRes.ok) {
        const reviews = await reviewRes.json()
        if (Array.isArray(reviews)) {
          latestReviewCountRef.current = reviews.length
          const seenReviewsCount = Number(localStorage.getItem('admin_seen_reviews_count') ?? -1)
          if (seenReviewsCount === -1) {
            localStorage.setItem('admin_seen_reviews_count', String(reviews.length))
            updated.reviews = false
          } else {
            updated.reviews = activePage === 'reviews' ? false : (reviews.length > seenReviewsCount)
          }
        }
      }
    } catch (_) {}

    // 5. Quản lý Phòng (Phòng bảo trì / sự cố)
    try {
      const roomRes = await fetch('http://localhost:8080/api/rooms', { headers })
      if (roomRes.ok) {
        const rooms = await roomRes.json()
        if (Array.isArray(rooms)) {
          const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'REPAIRING')
          const seenRoomsAt = Number(localStorage.getItem('admin_seen_rooms_at') || 0)
          const roomAlert = maintenanceRooms.length > 0 && (Date.now() - seenRoomsAt > 300000)
          updated.rooms = activePage === 'rooms' ? false : roomAlert
        }
      }
    } catch (_) {}

    setNavAlerts(updated)
  }

  useEffect(() => {
    fetchAllAlerts()
    const timer = setInterval(fetchAllAlerts, 15000)
    const handleUpdate = () => fetchAllAlerts()
    window.addEventListener('booking_updated', handleUpdate)
    window.addEventListener('incident_updated', handleUpdate)
    window.addEventListener('shift_updated', handleUpdate)
    window.addEventListener('task_updated', handleUpdate)
    window.addEventListener('review_updated', handleUpdate)
    window.addEventListener('admin_notification_update', handleUpdate)
    window.addEventListener('focus', handleUpdate)
    return () => {
      clearInterval(timer)
      window.removeEventListener('booking_updated', handleUpdate)
      window.removeEventListener('incident_updated', handleUpdate)
      window.removeEventListener('shift_updated', handleUpdate)
      window.removeEventListener('task_updated', handleUpdate)
      window.removeEventListener('review_updated', handleUpdate)
      window.removeEventListener('admin_notification_update', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [])

  // Khi admin đang ở trang nào, tự động xóa chấm đỏ của trang đó
  useEffect(() => {
    if (activePage) {
      clearAlert(activePage)
    }
  }, [activePage])

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
    clearAlert(key)
    setOpenGroupKey(prev => prev === key ? null : key)
  }

  return (
    <div className={`admin-shell${collapsed ? ' admin-shell--collapsed' : ''}${role === 'ROLE_HOUSEKEEPING' ? ' admin-shell--housekeeping-role' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          {!collapsed && <span className="admin-sidebar-logo-text">Lá Đỏ Homestay</span>}
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const active = isGroupActive(item, activePage)
            const hasParentAlert = Boolean(navAlerts[item.key] || item.children?.some(c => navAlerts[c.key]))

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
                    <span className="admin-nav-icon">
                      {item.icon}
                      {hasParentAlert && <span className="admin-nav-red-dot" title="Có thông báo cần xử lý" />}
                    </span>
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
                      {item.children.map(child => {
                        const hasChildAlert = Boolean(navAlerts[child.key])
                        return (
                          <button
                            key={child.key}
                            type="button"
                            className={`admin-nav-subitem${activePage === child.key ? ' admin-nav-subitem--active' : ''}`}
                            onClick={() => {
                              clearAlert(child.key)
                              navigate(child.path)
                            }}
                          >
                            <span className="admin-nav-subitem-text">{child.label}</span>
                            {hasChildAlert && <span className="admin-nav-sub-dot" title="Có mục cần xử lý" />}
                          </button>
                        )
                      })}
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
                onClick={() => {
                  clearAlert(item.key)
                  navigate(item.path)
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="admin-nav-icon">
                  {item.icon}
                  {hasParentAlert && <span className="admin-nav-red-dot" title="Có thông báo cần xem" />}
                </span>
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
            title={collapsed ? 'Lá Đỏ Homestay' : undefined}
          >
            <span className="admin-nav-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </span>
            {!collapsed && <span>Lá Đỏ Homestay</span>}
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
            {role === 'ROLE_RECEPTIONIST' && (
              <button
                type="button"
                className={`admin-topbar-shift-btn ${isInShift ? 'admin-topbar-shift-btn--active' : 'admin-topbar-shift-btn--warning'}`}
                onClick={onOpenShiftModal}
                title={isInShift ? 'Bạn đang trong ca trực (Bấm để Giao ca)' : 'Bạn chưa nhận ca trực (Bấm để vào ca)'}
              >
                <span className="admin-shift-status-dot" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>{isInShift ? 'Đang trong ca (Giao ca)' : 'Chưa nhận ca (Vào ca ngay)'}</span>
              </button>
            )}

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
          {/* Banner chế độ chỉ xem khi Lễ tân chưa nhận ca */}
          {isReceptionist && !isInShift && !loadingShift && (
            <div className="admin-shift-locked-banner">
              <div className="admin-shift-locked-left">
                <span className="admin-shift-locked-icon">🔒</span>
                <div>
                  <strong>Chế độ Xem (Bạn chưa nhận ca làm việc)</strong>
                  <p>
                    Bạn chưa hoàn tất nhận bàn giao ca làm. Trong chế độ này bạn có thể xem tất cả dữ liệu nhưng <strong>không thể chỉnh sửa / tạo mới / check-in / check-out</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-shift-unlock"
                onClick={onOpenShiftModal}
              >
                <span>📝 Đối soát & Nhận ca ngay</span>
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* {['ROLE_ADMIN', 'ROLE_RECEPTIONIST'].includes(role) && <StaffAiChat />} */}
    </div>
  )
}

function AdminLayout({ activePage, children }) {
  const [showTopShiftModal, setShowTopShiftModal] = useState(false)

  return (
    <ShiftGuardProvider onOpenHandoverModal={() => setShowTopShiftModal(true)}>
      <AdminLayoutInner activePage={activePage} onOpenShiftModal={() => setShowTopShiftModal(true)}>
        {children}
      </AdminLayoutInner>

      <ShiftHandoverModal
        isOpen={showTopShiftModal}
        onClose={() => setShowTopShiftModal(false)}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </ShiftGuardProvider>
  )
}

export default AdminLayout
