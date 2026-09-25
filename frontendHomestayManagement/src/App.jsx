import { useEffect, useState, lazy, Suspense } from 'react'
import FloatingContactWidget from './components/FloatingContact/FloatingContactWidget'
import { getStoredUser } from './services/authService'
import { STAFF_ROLES, roleCanAccess, roleDefaultPath } from './utils/roleUtils'

// Eagerly loaded primary customer pages for instant first paint
import HomePage from './pages/Home/HomePage'

// Lazy loaded customer & shared pages (Loaded on demand)
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'))
const GiveawayLuckyWheelPage = lazy(() => import('./pages/Giveaway/GiveawayLuckyWheelPage'))
const LoginPage = lazy(() => import('./pages/Login/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))
const BookingHistoryPage = lazy(() => import('./pages/BookingHistory/BookingHistoryPage'))
const AmenitiesPage = lazy(() => import('./pages/Amenities/AmenitiesPage'))
const WishlistPage = lazy(() => import('./pages/Wishlist/WishlistPage'))
const CustomerVouchersPage = lazy(() => import('./pages/Vouchers/CustomerVouchersPage'))
const CalendarShowcasePage = lazy(() => import('./pages/Test/CalendarShowcasePage'))
const ExplorePage = lazy(() => import('./pages/Explore/ExplorePage'))
const StayActivationPage = lazy(() => import('./pages/Stay/StayActivationPage'))
const StayPage = lazy(() => import('./pages/Stay/StayPage'))
const RoomsPage = lazy(() => import('./pages/Rooms/RoomsPage'))
const RoomDetailPage = lazy(() => import('./pages/Rooms/RoomDetailPage'))

// Lazy loaded admin & staff pages (Zero weight on customer page load)
const AdminRoomsPage = lazy(() => import('./pages/Admin/AdminRoomsPage'))
const AdminLoginPage = lazy(() => import('./pages/Admin/AdminLoginPage'))
const AdminInvoicesPage = lazy(() => import('./pages/Admin/AdminInvoicesPage'))
const AdminBookingsPage = lazy(() => import('./pages/Admin/AdminBookingsPage'))
const AdminCancellationsPage = lazy(() => import('./pages/Admin/AdminCancellationsPage'))
const AdminCheckInLogsPage = lazy(() => import('./pages/Admin/AdminCheckInLogsPage'))
const AdminHousekeepingChecklistsPage = lazy(() => import('./pages/Admin/AdminHousekeepingChecklistsPage'))
const AdminHousekeepingCalendarPage = lazy(() => import('./pages/Admin/AdminHousekeepingCalendarPage'))
const AdminRulesPenaltiesPage = lazy(() => import('./pages/Admin/AdminRulesPenaltiesPage'))
const AdminServiceCategoriesPage = lazy(() => import('./pages/Admin/AdminServiceCategoriesPage'))
const AdminSurchargesPage = lazy(() => import('./pages/Admin/AdminSurchargesPage'))
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'))
const AdminReviewsPage = lazy(() => import('./pages/Admin/AdminReviewsPage'))
const DashboardPage = lazy(() => import('./pages/Admin/DashboardPage'))
const HousekeepingPage = lazy(() => import('./pages/Admin/HousekeepingPage'))
const AdminIncidentsPage = lazy(() => import('./pages/Admin/AdminIncidentsPage'))
const AdminTravelArticlesPage = lazy(() => import('./pages/Admin/AdminTravelArticlesPage'))
const AdminGiveawayLeadsPage = lazy(() => import('./pages/Admin/AdminGiveawayLeadsPage'))
const ReceptionistOverviewPage = lazy(() => import('./pages/Admin/ReceptionistOverviewPage'))
const ReceptionistSheetsPage = lazy(() => import('./pages/Admin/ReceptionistSheetsPage'))

const MarketingAIAgentPage = lazy(() => import('./pages/Admin/MarketingPages').then(m => ({ default: m.MarketingAIAgentPage })))
const MarketingPostLogsPage = lazy(() => import('./pages/Admin/MarketingPages').then(m => ({ default: m.MarketingPostLogsPage })))
const MarketingVouchersPage = lazy(() => import('./pages/Admin/MarketingPages').then(m => ({ default: m.MarketingVouchersPage })))
const MarketingEngagementInboxPage = lazy(() => import('./pages/Admin/MarketingEngagementInboxPage'))

function PageLoadingFallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#64748b',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#b91c1c',
        borderRadius: '50%',
        animation: 'appSpin 0.7s linear infinite'
      }} />
      <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.02em' }}>Đang tải trải nghiệm Lá Đỏ...</span>
      <style>{`
        @keyframes appSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const AUTH_STORAGE_KEYS = new Set(['homeStayAccessToken', 'homeStayUser'])

function CustomerSurface({ children }) {
  return (
    <>
      {children}
      <FloatingContactWidget />
    </>
  )
}

function normalizePath() {
  let path = window.location.pathname || '/'
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  if (path === '/') {
    window.history.replaceState(null, '', '/home')
    return '/home'
  }
  return path
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
        const currentUser = getStoredUser()
        const path = window.location.pathname
        if (path.startsWith('/admin') && path !== '/admin/login') {
          if (!currentUser || !STAFF_ROLES.has(currentUser.role)) {
            window.location.replace('/admin/login')
          }
        }
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

  const renderContent = () => {
    if (currentPath === '/landing' || currentPath === '/sanctuary' || currentPath === '/komorebi') {
      return <LandingPage />
    }
    if (currentPath === '/giveaway' || currentPath === '/minigame' || currentPath === '/vong-quay-may-man') {
      return <GiveawayLuckyWheelPage />
    }
    if (currentPath === '/login') return <LoginPage />
    if (currentPath === '/register') return <RegisterPage />
    if (currentPath === '/forgot') return <ForgotPasswordPage />
    if (currentPath === '/profile') return <CustomerSurface><ProfilePage /></CustomerSurface>
    if (currentPath === '/booking-history') return <CustomerSurface><BookingHistoryPage /></CustomerSurface>
    if (currentPath === '/amenities') return <CustomerSurface><AmenitiesPage /></CustomerSurface>
    if (currentPath === '/wishlist') return <CustomerSurface><WishlistPage /></CustomerSurface>
    if (currentPath === '/vouchers' || currentPath === '/my-vouchers') {
      return <CustomerSurface><CustomerVouchersPage /></CustomerSurface>
    }
    if (currentPath === '/test-calendars') {
      return <CalendarShowcasePage />
    }
    if (currentPath === '/explore' || currentPath === '/kham-pha' || currentPath === '/map') {
      return <CustomerSurface><ExplorePage /></CustomerSurface>
    }
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
      if (currentPath === '/admin/sheets') return <ReceptionistSheetsPage />
      if (currentPath === '/admin/marketing/engagement-inbox') return <MarketingEngagementInboxPage />
      if (currentPath === '/admin/marketing/ai-agent') return <MarketingAIAgentPage />
      if (currentPath === '/admin/marketing/post-logs') return <MarketingPostLogsPage />
      if (currentPath === '/admin/marketing/vouchers') return <MarketingVouchersPage />
      if (currentPath === '/admin/marketing/travel-articles') return <AdminTravelArticlesPage />
      if (currentPath === '/admin/marketing/giveaway-leads') return <AdminGiveawayLeadsPage />

      return <DashboardPage />
    }

    return <CustomerSurface><HomePage /></CustomerSurface>
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      {renderContent()}
    </Suspense>
  )
}

export default App
