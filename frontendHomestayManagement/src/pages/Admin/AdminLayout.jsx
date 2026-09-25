import { useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { ShiftGuardProvider } from '../../context/ShiftGuardContext'
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
  sheets: (
    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
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
      { key: 'surcharges', label: 'Mini-bar', path: '/admin/services/surcharges' },
    ],
  },
  { key: 'rules', label: 'Cấu hình Nội quy & Phạt & Phụ thu', path: '/admin/rules-penalties', icon: ICONS.rules },
  { key: 'reviews', label: 'Quản lý Đánh giá', path: '/admin/reviews', icon: ICONS.rules },
  { key: 'invoices', label: 'Quản lý Hóa đơn', path: '/admin/invoices', icon: ICONS.invoices },
  { key: 'sheets', label: 'Bảng Tính & Sheet Homestay', path: '/admin/sheets', icon: ICONS.sheets },
  { key: 'incidents', label: 'Sự cố đồ hỏng & mất', path: '/admin/housekeeping/incidents', icon: ICONS.rules },
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
    label: 'Marketing',
    icon: ICONS.marketing,
    children: [
      { key: 'engagement-inbox', label: 'Tương tác & Bình luận', path: '/admin/marketing/engagement-inbox' },
      { key: 'ai-post-agent', label: 'Đăng bài', path: '/admin/marketing/ai-agent' },
      { key: 'post-logs', label: 'Nhật ký Bài đăng', path: '/admin/marketing/post-logs' },
      { key: 'vouchers', label: 'Mã giảm giá (Vouchers)', path: '/admin/marketing/vouchers' },
      { key: 'travel-articles', label: 'Điểm đến & Bài review Sa Pa', path: '/admin/marketing/travel-articles' },
      { key: 'giveaway-leads', label: ' Khách hàng tiềm năng & Minigame', path: '/admin/marketing/giveaway-leads' },
    ],
  },
]

const ADMIN_HIDDEN_NAV_KEYS = new Set(['receptionist-overview', 'incidents'])

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

function AdminLayoutInner({ activePage, children }) {
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
    const activeGroup = getActiveGroupKey(activePage, navItems)
    if (activeGroup) {
      setOpenGroupKey(activeGroup)
    }
  }, [activePage, navItems])
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

  const [bookingCounts, setBookingCounts] = useState({ todayCheckIns: 0, todayCheckOuts: 0 })
  const [checkoutAlerts, setCheckoutAlerts] = useState([])
  const [marketingUnreadCount, setMarketingUnreadCount] = useState(0)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [marketingNotifications, setMarketingNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notifDropdownRef = useRef(null)

  const maxBookingIdRef = useRef(0)
  const latestIncidentCountRef = useRef(0)
  const latestTaskCountRef = useRef(0)
  const latestReviewCountRef = useRef(0)

  const fetchMarketingNotifications = async () => {
    const token = getStoredToken()
    if (!token) return
    setLoadingNotifications(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/marketing/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const list = await res.json()
        setMarketingNotifications(Array.isArray(list) ? list : [])
      }
    } catch (_) {}
    finally {
      setLoadingNotifications(false)
    }
  }

  const markAllNotificationsAsRead = async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/marketing/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setMarketingUnreadCount(0)
      setMarketingNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setNavAlerts((prev) => ({ ...prev, marketing: false }))
    } catch (_) {}
  }

  const markNotificationAsRead = async (id) => {
    const token = getStoredToken()
    if (!token) return
    try {
      await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/marketing/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setMarketingNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setMarketingUnreadCount((prev) => {
        const next = Math.max(0, prev - 1)
        if (next === 0) setNavAlerts((a) => ({ ...a, marketing: false }))
        return next
      })
    } catch (_) {}
  }

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
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/bookings/check-in-logs', { headers })
      if (res.ok) {
        const bookings = await res.json()
        if (Array.isArray(bookings) && bookings.length > 0) {
          const maxId = Math.max(...bookings.map(b => Number(b.bookingId || b.id || 0)))
          maxBookingIdRef.current = maxId

          const now = new Date()
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

          let inCount = 0
          let outCount = 0
          const alertsList = []
          bookings.forEach(b => {
            const details = Array.isArray(b.details) && b.details.length > 0 ? b.details : [b]
            details.forEach(d => {
              const ci = String(d.checkInTarget || d.checkInDate || d.checkIn || b.checkInDate || b.checkIn || b.checkInTarget || '').slice(0, 10)
              const coStr = d.checkOutTarget || d.checkOutDate || d.checkOut || b.checkOutDate || b.checkOut || b.checkOutTarget || ''
              const co = String(coStr).slice(0, 10)
              const rec = d.checkInRecord || {}
              const hasIn = Boolean(rec.actualCheckIn)
              const hasOut = Boolean(rec.actualCheckOut)
              const detailSt = String(d.detailStatus || b.bookingStatus || b.status || '').toUpperCase()
              const bSt = String(b.bookingStatus || b.status || '').toUpperCase()
              const isCancelled = detailSt === 'CANCELLED' || detailSt === 'REJECTED' || detailSt === 'REFUNDED' || bSt === 'CANCELLED' || bSt === 'REJECTED'

              const stage = hasOut ? 'completed'
                : hasIn ? 'staying'
                : isCancelled ? 'cancelled'
                : 'waiting'

              // Cần check-in hôm nay: chưa nhận phòng và ngày đến đúng hôm nay
              if (stage === 'waiting' && ci === todayStr && !isCancelled && !hasIn) {
                inCount++
              }

              // Cần check-out & thông báo quá hạn check-out
              if (stage === 'staying' && coStr) {
                const checkOutDate = new Date(coStr)
                const roomName = d.roomNumber ? `Phòng ${d.roomNumber}` : (d.roomTypeName || b.roomTypeName || 'Phòng')
                const custName = b.customerName || d.customerName || 'Khách lưu trú'
                const bookingCode = b.bookingCode || `#${b.bookingId || b.id || ''}`

                if (now > checkOutDate) {
                  const diffMs = now - checkOutDate
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffDays = Math.floor(diffHours / 24)
                  const overdueText = diffDays > 0 ? `${diffDays} ngày` : `${Math.max(diffHours, 1)} giờ`

                  alertsList.push({
                    id: `overdue-${d.bookingDetailId || d.id || b.id || Math.random()}`,
                    type: 'CHECKOUT_OVERDUE',
                    title: `⚠️ Quá hạn trả phòng: ${roomName}`,
                    message: `${custName} (${bookingCode}) đã quá hạn trả phòng ${overdueText} (hạn: ${checkOutDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${checkOutDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}). Vui lòng xử lý trả phòng hoặc thu phụ phí!`,
                    severity: 'critical',
                    path: '/admin/check-in-logs',
                  })
                  outCount++
                } else if (co === todayStr) {
                  alertsList.push({
                    id: `due-today-${d.bookingDetailId || d.id || b.id || Math.random()}`,
                    type: 'CHECKOUT_TODAY',
                    title: `⏰ Đến hạn trả phòng hôm nay: ${roomName}`,
                    message: `${custName} (${bookingCode}) đến hạn trả phòng hôm nay (trước ${checkOutDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`,
                    severity: 'warning',
                    path: '/admin/check-in-logs',
                  })
                  outCount++
                }
              }
            })
          })
          setBookingCounts({ todayCheckIns: inCount, todayCheckOuts: outCount })
          setCheckoutAlerts(alertsList)

          updated['booking-orders'] = false
          updated['check-in-logs'] = inCount > 0
          updated.bookings = inCount > 0
        } else {
          setBookingCounts({ todayCheckIns: 0, todayCheckOuts: 0 })
          updated['booking-orders'] = false
          updated['check-in-logs'] = false
          updated.bookings = false
        }
      }
    } catch (_) {}

    // 2. Quản lý Housekeeping (Đồ hỏng & mất, Nhiệm vụ vệ sinh)
    try {
      const [incidentRes, taskRes] = await Promise.allSettled([
        fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/incidents/summary', { headers }),
        fetch((import.meta.env.VITE_API_URL || '') + '/api/housekeeping/tasks', { headers }),
      ])

      let hasIncidentAlert = false
      if (incidentRes.status === 'fulfilled' && incidentRes.value.ok) {
        const summary = await incidentRes.value.json()
        const pendingIncidents = Number(summary.reportedCount || 0) + Number(summary.inProgressCount || 0)
        hasIncidentAlert = pendingIncidents > 0
      }
      if (activePage === 'housekeeping-incidents') hasIncidentAlert = false
      updated['housekeeping-incidents'] = hasIncidentAlert

      let hasTaskAlert = false
      if (taskRes.status === 'fulfilled' && taskRes.value.ok) {
        const tasks = await taskRes.value.json()
        if (Array.isArray(tasks)) {
          // Chỉ hiện chấm đỏ khi còn công việc vệ sinh chưa hoàn thành (cleaningStatus !== 'COMPLETED')
          const pendingTasks = tasks.filter(t => t.cleaningStatus !== 'COMPLETED')
          hasTaskAlert = pendingTasks.length > 0
        }
      }
      if (activePage === 'housekeeping-tasks') hasTaskAlert = false
      updated['housekeeping-tasks'] = hasTaskAlert
      updated.housekeeping = hasIncidentAlert || hasTaskAlert
    } catch (_) {}

    // 4. Quản lý Đánh giá (Reviews) - Chỉ hiện khi có đánh giá chờ duyệt (PENDING)
    try {
      const reviewRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/reviews', { headers })
      if (reviewRes.ok) {
        const reviews = await reviewRes.json()
        if (Array.isArray(reviews)) {
          const pendingReviews = reviews.filter(r => String(r.status || '').toUpperCase() === 'PENDING')
          updated.reviews = activePage === 'reviews' ? false : (pendingReviews.length > 0)
        }
      }
    } catch (_) {}

    // 5. Quản lý Phòng (Phòng bảo trì / sự cố)
    try {
      const roomRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rooms', { headers })
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

    // 6. Thông báo tương tác Marketing & Hệ thống
    try {
      const notifRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/marketing/notifications/unread-count', { headers })
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        const count = Number(notifData?.count || 0)
        setMarketingUnreadCount(count)
        updated.marketing = count > 0
      }
      fetchMarketingNotifications()
    } catch (_) {}

    setNavAlerts(updated)
  }

  useEffect(() => {
    fetchAllAlerts()
    const timer = setInterval(fetchAllAlerts, 45000)
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

  useEffect(() => {
    if (!showNotificationDropdown) return
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotificationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationDropdown])

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
                      {collapsed && (
                        item.key === 'bookings' && bookingCounts.todayCheckIns > 0 ? (
                          <span className="admin-nav-count-badge" title="Khách cần check-in hôm nay">
                            {bookingCounts.todayCheckIns}
                          </span>
                        ) : hasParentAlert ? (
                          <span className="admin-nav-red-dot" title="Có thông báo cần xử lý" />
                        ) : null
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="admin-nav-label">{item.label}</span>
                        {item.key === 'bookings' && bookingCounts.todayCheckIns > 0 ? (
                          <span className="admin-nav-count-badge" title="Khách cần check-in hôm nay">
                            {bookingCounts.todayCheckIns}
                          </span>
                        ) : hasParentAlert ? (
                          <span className="admin-nav-badge-dot" title="Có thông báo cần xử lý" />
                        ) : null}
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
                        const isCheckInLogs = child.key === 'check-in-logs'
                        const isEngagementInbox = child.key === 'engagement-inbox'
                        const count = isCheckInLogs
                          ? bookingCounts.todayCheckIns
                          : isEngagementInbox
                          ? marketingUnreadCount
                          : 0

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
                            {count > 0 ? (
                              <span
                                className="admin-nav-count-badge"
                                title={
                                  isCheckInLogs
                                    ? `Khách cần check-in hôm nay: ${count}`
                                    : `Bình luận & tương tác mới: ${count}`
                                }
                              >
                                {count}
                              </span>
                            ) : hasChildAlert ? (
                              <span className="admin-nav-sub-dot" title="Có mục cần xử lý" />
                            ) : null}
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
                  {collapsed && hasParentAlert && <span className="admin-nav-red-dot" title="Có thông báo cần xem" />}
                </span>
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {hasParentAlert && <span className="admin-nav-badge-dot" title="Có thông báo cần xem" />}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-nav-item admin-nav-item--home"
            onClick={() => navigate('/home')}
            title={collapsed ? 'Lá Đỏ Homestay (Trang chủ)' : undefined}
          >
            <span className="admin-nav-icon">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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
            <div ref={notifDropdownRef} style={{ position: 'relative' }}>
              <button
                className="admin-topbar-bell"
                type="button"
                aria-label="Thông báo"
                onClick={() => {
                  setShowNotificationDropdown((prev) => {
                    const next = !prev
                    if (next) fetchMarketingNotifications()
                    return next
                  })
                }}
                title={
                  (checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length) > 0
                    ? `${checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length} thông báo mới`
                    : 'Thông báo phòng'
                }
              >
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {(checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length) > 0 && (
                  <span className="admin-bell-badge">
                    {(checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length) > 99
                      ? '99+'
                      : (checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length)}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="admin-notification-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="admin-notif-title">
                      <span>Trung tâm thông báo phòng & lưu trú</span>
                      {(checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length) > 0 && (
                        <span className="admin-notif-pill">
                          {checkoutAlerts.length + marketingNotifications.filter(n => !n.isRead).length} mới
                        </span>
                      )}
                    </div>
                    {marketingNotifications.some(n => !n.isRead) && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer', padding: '2px 6px', fontWeight: 600 }}
                      >
                        Đọc hết
                      </button>
                    )}
                  </div>

                  <div className="admin-notif-body">
                    {loadingNotifications ? (
                      <div className="admin-notif-empty">Đang tải thông báo...</div>
                    ) : checkoutAlerts.length === 0 && !hasPendingDailyReport && marketingNotifications.length === 0 ? (
                      <div className="admin-notif-empty">
                        Chưa có thông báo phòng hoặc lưu trú mới nào.
                      </div>
                    ) : (
                      <>
                        {/* Thông báo Yêu cầu đổi phòng & sự cố từ Khách hàng */}
                        {marketingNotifications.map((notif) => {
                          const isRoomChange = notif.type === 'ROOM_CHANGE_REQUEST'
                          return (
                            <div
                              key={`notif-${notif.id}`}
                              className={`admin-notif-item ${!notif.isRead ? 'admin-notif-item--unread' : ''}`}
                              style={{
                                background: !notif.isRead ? (isRoomChange ? '#fff1f2' : '#f0fdf4') : '#f8fafc',
                                borderColor: !notif.isRead ? (isRoomChange ? '#fecdd3' : '#bbf7d0') : '#e2e8f0',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                if (!notif.isRead) markNotificationAsRead(notif.id)
                                setShowNotificationDropdown(false)
                                if (isRoomChange) {
                                  navigate('/admin/check-in-logs')
                                } else {
                                  navigate('/admin/marketing')
                                }
                              }}
                            >
                              <span className="admin-notif-icon">{isRoomChange ? '🛎️' : '📢'}</span>
                              <div className="admin-notif-content">
                                <div className="admin-notif-item-title" style={{ color: isRoomChange ? '#be123c' : '#15803d', fontWeight: 700 }}>
                                  {notif.title}
                                </div>
                                <div className="admin-notif-item-message" style={{ color: '#334155' }}>
                                  {notif.message}
                                </div>
                                <div className="admin-notif-item-meta">
                                  <span style={{ color: isRoomChange ? '#e11d48' : '#16a34a', fontWeight: 600 }}>
                                    {isRoomChange ? 'YÊU CẦU ĐỔI PHÒNG' : 'THÔNG BÁO HỆ THỐNG'}
                                  </span>
                                  <span>•</span>
                                  <span style={{ color: '#2563eb', fontWeight: 600 }}>
                                    {isRoomChange ? 'Nhấn để mở Nhật ký check-in' : 'Xem chi tiết'}
                                  </span>
                                </div>
                              </div>
                              {!notif.isRead && (
                                <span className="admin-notif-dot" style={{ background: isRoomChange ? '#e11d48' : '#22c55e' }} />
                              )}
                            </div>
                          )
                        })}

                        {/* Thông báo Check-out & Quá hạn trả phòng cho Lễ tân & Admin */}
                        {checkoutAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="admin-notif-item admin-notif-item--unread"
                            style={{
                              background: alert.severity === 'critical' ? '#fff1f2' : '#fffbeb',
                              borderColor: alert.severity === 'critical' ? '#fecdd3' : '#fde68a',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setShowNotificationDropdown(false)
                              navigate(alert.path)
                            }}
                          >
                            <span className="admin-notif-icon">{alert.severity === 'critical' ? '⚠️' : '⏰'}</span>
                            <div className="admin-notif-content">
                              <div className="admin-notif-item-title" style={{ color: alert.severity === 'critical' ? '#be123c' : '#b45309', fontWeight: 700 }}>
                                {alert.title}
                              </div>
                              <div className="admin-notif-item-message" style={{ color: '#334155' }}>
                                {alert.message}
                              </div>
                              <div className="admin-notif-item-meta">
                                <span style={{ color: alert.severity === 'critical' ? '#e11d48' : '#d97706', fontWeight: 600 }}>QUẢN LÝ LƯU TRÚ</span>
                                <span>•</span>
                                <span style={{ color: '#2563eb', fontWeight: 600 }}>Nhấn để mở Nhật ký check-in</span>
                              </div>
                            </div>
                            <span className="admin-notif-dot" style={{ background: alert.severity === 'critical' ? '#e11d48' : '#f59e0b' }} />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
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

function AdminLayout({ activePage, activeKey, activeNav, children }) {
  const resolvedActivePage = activePage || activeKey || activeNav
  return (
    <ShiftGuardProvider>
      <AdminLayoutInner activePage={resolvedActivePage}>
        {children}
      </AdminLayoutInner>
    </ShiftGuardProvider>
  )
}

export default AdminLayout
