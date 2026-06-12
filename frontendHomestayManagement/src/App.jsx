import { useEffect, useState } from 'react'
import AdminRoomsPage from './pages/Admin/AdminRoomsPage'
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminInvoicesPage from './pages/Admin/AdminInvoicesPage'
import AdminBookingsPage from './pages/Admin/AdminBookingsPage'
import AdminCheckInLogsPage from './pages/Admin/AdminCheckInLogsPage'
import AdminPlaceholderPage from './pages/Admin/AdminPlaceholderPage'
import AdminRulesPenaltiesPage from './pages/Admin/AdminRulesPenaltiesPage'
import AdminServiceCategoriesPage from './pages/Admin/AdminServiceCategoriesPage'
import AdminSurchargesPage from './pages/Admin/AdminSurchargesPage'
import AdminUsersPage from './pages/Admin/AdminUsersPage'
import DashboardPage from './pages/Admin/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Login/LoginPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RegisterPage from './pages/Register/RegisterPage'
import RoomDetailPage from './pages/Rooms/RoomDetailPage'
import RoomsPage from './pages/Rooms/RoomsPage'
import { getStoredUser } from './services/authService'

const STAFF_ROLES = new Set(['ROLE_ADMIN', 'ROLE_RECEPTIONIST', 'ROLE_HOUSEKEEPING', 'ROLE_MARKETING'])

function normalizePath() {
  if (window.location.pathname === '/') {
    window.history.replaceState(null, '', '/home')
    return '/home'
  }
  return window.location.pathname
}

function App() {
  const [currentPath, setCurrentPath] = useState(normalizePath)

  useEffect(() => {
    const handleRouteChange = () => setCurrentPath(normalizePath())
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  useEffect(() => {
    const handleInternalLink = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target instanceof Element ? event.target : event.target.parentElement
      const link = target?.closest('a[href]')
      if (!link || link.target || link.hasAttribute('download')) return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return

      event.preventDefault()
      const nextUrl = `${url.pathname}${url.search}${url.hash}`
      if (!url.hash) {
        window.scrollTo(0, 0)
      }
      window.history.pushState(null, '', nextUrl)
      setCurrentPath(normalizePath())

      if (url.hash) {
        window.setTimeout(() => {
          document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
      }
    }

    document.addEventListener('click', handleInternalLink)
    return () => document.removeEventListener('click', handleInternalLink)
  }, [])

  if (currentPath === '/login') return <LoginPage />
  if (currentPath === '/register') return <RegisterPage />
  if (currentPath === '/forgot') return <ForgotPasswordPage />
  if (currentPath === '/profile') return <ProfilePage />
  if (currentPath === '/rooms') return <RoomsPage />
  if (currentPath.startsWith('/rooms/')) {
    const roomId = currentPath.split('/').filter(Boolean).at(-1)
    return <RoomDetailPage roomId={roomId} />
  }
  if (currentPath === '/admin/login') return <AdminLoginPage />

  if (currentPath.startsWith('/admin')) {
    const user = getStoredUser()
    if (!user || !STAFF_ROLES.has(user.role)) {
      window.location.replace('/admin/login')
      return null
    }

    if (currentPath === '/admin/users' || currentPath === '/admin/users/employees') {
      return <AdminUsersPage userType="employees" />
    }
    if (currentPath === '/admin/users/customers') return <AdminUsersPage userType="customers" />
    if (currentPath === '/admin/rooms') return <AdminRoomsPage />
    if (currentPath === '/admin/bookings') return <AdminBookingsPage />
    if (currentPath === '/admin/check-in-logs') return <AdminCheckInLogsPage />
    if (currentPath === '/admin/check-in-logs') return <AdminPlaceholderPage activePage="check-in-logs" title="Nhật ký Lưu trú (Check-in)" />
    if (currentPath === '/admin/services/categories') return <AdminServiceCategoriesPage />
    if (currentPath === '/admin/services/surcharges') return <AdminSurchargesPage />
    if (currentPath === '/admin/rules-penalties') return <AdminRulesPenaltiesPage />
    if (currentPath === '/admin/invoices') return <AdminInvoicesPage />
    if (currentPath === '/admin/marketing/ai-agent') return <AdminPlaceholderPage activePage="ai-post-agent" title="AI Agent Đăng bài" />
    if (currentPath === '/admin/marketing/post-logs') return <AdminPlaceholderPage activePage="post-logs" title="Nhật ký Bài đăng" />
    if (currentPath === '/admin/marketing/vouchers') return <AdminPlaceholderPage activePage="vouchers" title="Mã giảm giá (Vouchers)" />

    return <DashboardPage />
  }

  return <HomePage />
}

export default App
