import { useEffect, useState } from 'react'
import AdminRoomsPage from './pages/Admin/AdminRoomsPage'
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminInvoicesPage from './pages/Admin/AdminInvoicesPage'
import AdminBookingsPage from './pages/Admin/AdminBookingsPage'
import AdminCancellationsPage from './pages/Admin/AdminCancellationsPage'
import AdminCheckInLogsPage from './pages/Admin/AdminCheckInLogsPage'
import AdminHousekeepingChecklistsPage from './pages/Admin/AdminHousekeepingChecklistsPage'
import AdminHousekeepingCalendarPage from './pages/Admin/AdminHousekeepingCalendarPage'
import AdminRulesPenaltiesPage from './pages/Admin/AdminRulesPenaltiesPage'
import AdminServiceCategoriesPage from './pages/Admin/AdminServiceCategoriesPage'
import AdminSurchargesPage from './pages/Admin/AdminSurchargesPage'
import AdminUsersPage from './pages/Admin/AdminUsersPage'
import AdminReviewsPage from './pages/Admin/AdminReviewsPage'
import CustomerAiChat from './components/CustomerAiChat/CustomerAiChat'
import DashboardPage from './pages/Admin/DashboardPage'
import HousekeepingPage from './pages/Admin/HousekeepingPage'
import AdminIncidentsPage from './pages/Admin/AdminIncidentsPage'
import AdminShiftHandoversPage from './pages/Admin/AdminShiftHandoversPage'
import { MarketingAIAgentPage, MarketingPostLogsPage, MarketingVouchersPage } from './pages/Admin/MarketingPages'
import ReceptionistOverviewPage from './pages/Admin/ReceptionistOverviewPage'
import BookingHistoryPage from './pages/BookingHistory/BookingHistoryPage'
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage'
import HomePage from './pages/Home/HomePage'
import AmenitiesPage from './pages/Amenities/AmenitiesPage'
import LoginPage from './pages/Login/LoginPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RegisterPage from './pages/Register/RegisterPage'
import RoomDetailPage from './pages/Rooms/RoomDetailPage'
import RoomsPage from './pages/Rooms/RoomsPage'
import StayPage from './pages/Stay/StayPage'
import StayActivationPage from './pages/Stay/StayActivationPage'
import WishlistPage from './pages/Wishlist/WishlistPage'
import LandingPage from './pages/Landing/LandingPage'
import { getStoredUser } from './services/authService'
import { STAFF_ROLES, roleCanAccess, roleDefaultPath } from './utils/roleUtils'

const AUTH_STORAGE_KEYS = new Set(['homeStayAccessToken', 'homeStayUser'])

function CustomerSurface({ children }) {
  return (
    <>
      {children}
      {/* <CustomerAiChat /> */}
    </>
  )
}

function normalizePath() {
  if (window.location.pathname === '/') {
    window.history.replaceState(null, '', '/home')
    return '/home'
  }
  return window.location.pathname
}

function App() {
  const [currentPath, setCurrentPath] = useState(normalizePath)
  const [, setAuthVersion] = useState(0)

  useEffect(() => {
    const handleRouteChange = () => setCurrentPath(normalizePath())
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  useEffect(() => {
    const handleSharedAuthChange = (event) => {
      if (AUTH_STORAGE_KEYS.has(event.key)) {
        setAuthVersion((version) => version + 1)
      }
    }

    window.addEventListener('storage', handleSharedAuthChange)
    return () => window.removeEventListener('storage', handleSharedAuthChange)
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

  if (currentPath === '/landing' || currentPath === '/sanctuary' || currentPath === '/komorebi') {
    return <LandingPage />
  }
  if (currentPath === '/login') return <LoginPage />
  if (currentPath === '/register') return <RegisterPage />
  if (currentPath === '/forgot') return <ForgotPasswordPage />
  if (currentPath === '/profile') return <CustomerSurface><ProfilePage /></CustomerSurface>
  if (currentPath === '/booking-history') return <CustomerSurface><BookingHistoryPage /></CustomerSurface>
  if (currentPath === '/amenities') return <CustomerSurface><AmenitiesPage /></CustomerSurface>
  if (currentPath === '/wishlist') return <CustomerSurface><WishlistPage /></CustomerSurface>
  if (currentPath === '/stay/activate') return <StayActivationPage />
  if (currentPath === '/stay') return <CustomerSurface><StayPage /></CustomerSurface>
  if (currentPath === '/rooms') return <CustomerSurface><RoomsPage /></CustomerSurface>
  if (currentPath.startsWith('/rooms/')) {
    const roomId = currentPath.split('/').filter(Boolean).at(-1)
    return <CustomerSurface><RoomDetailPage roomId={roomId} /></CustomerSurface>
  }
  if (currentPath === '/admin/login') {
    const user = getStoredUser()
    if (user && STAFF_ROLES.has(user.role)) {
      window.location.replace(roleDefaultPath(user.role))
      return null
    }
    return <AdminLoginPage />
  }

  if (currentPath.startsWith('/admin')) {
    const user = getStoredUser()
    if (!user || !STAFF_ROLES.has(user.role)) {
      return <AdminLoginPage />
    }

    const role = user.role

    // Nếu vào /admin (root) → redirect đến trang mặc định theo role
    if (currentPath === '/admin' && role !== 'ROLE_ADMIN') {
      window.location.replace(roleDefaultPath(role))
      return null
    }

    // Kiểm tra quyền truy cập route — non-admin không được vào route ngoài phạm vi
    if (role !== 'ROLE_ADMIN' && !roleCanAccess(role, currentPath)) {
      window.location.replace(roleDefaultPath(role))
      return null
    }

    if (currentPath === '/admin/users' || currentPath === '/admin/users/employees') {
      return <AdminUsersPage userType="employees" />
    }
    if (currentPath === '/admin/users/customers') return <AdminUsersPage userType="customers" />
    if (currentPath === '/admin/rooms') return <AdminRoomsPage />
    if (currentPath === '/admin/bookings') return <AdminBookingsPage />
    if (currentPath === '/admin/check-in-logs') return <AdminCheckInLogsPage />
    if (currentPath === '/admin/cancellations') return <AdminCancellationsPage />
    if (currentPath === '/admin/services/categories') return <AdminServiceCategoriesPage />
    if (currentPath === '/admin/services/surcharges') return <AdminSurchargesPage />
    if (currentPath === '/admin/rules-penalties') return <AdminRulesPenaltiesPage />
    if (currentPath === '/admin/invoices') return <AdminInvoicesPage />
    if (currentPath === '/admin/shifts') return <AdminShiftHandoversPage />
    if (currentPath === '/admin/reviews') return <AdminReviewsPage />
    if (currentPath === '/admin/housekeeping') {
      window.location.replace('/admin/housekeeping/tasks')
      return null
    }
    if (currentPath === '/admin/housekeeping/tasks') return <HousekeepingPage />
    if (currentPath === '/admin/housekeeping/room-calendar') {
      return <AdminHousekeepingCalendarPage />
    }
    if (currentPath === '/admin/housekeeping/checklists') {
      return <AdminHousekeepingChecklistsPage />
    }
    if (currentPath === '/admin/housekeeping/incidents' || currentPath === '/admin/incidents') {
      return <AdminIncidentsPage />
    }
    if (currentPath === '/admin/receptionist') return <ReceptionistOverviewPage />
    if (currentPath === '/admin/marketing/ai-agent') return <MarketingAIAgentPage />
    if (currentPath === '/admin/marketing/post-logs') return <MarketingPostLogsPage />
    if (currentPath === '/admin/marketing/vouchers') return <MarketingVouchersPage />

    return <DashboardPage />
  }

  return <CustomerSurface><HomePage /></CustomerSurface>
}

export default App
