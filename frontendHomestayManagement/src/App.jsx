import { useEffect, useState } from 'react'
import AdminRoomsPage from './pages/Admin/AdminRoomsPage'
import AdminLoginPage from './pages/Admin/AdminLoginPage'
import AdminUsersPage from './pages/Admin/AdminUsersPage'
import DashboardPage from './pages/Admin/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Login/LoginPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RegisterPage from './pages/Register/RegisterPage'
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

  if (currentPath === '/login') return <LoginPage />
  if (currentPath === '/register') return <RegisterPage />
  if (currentPath === '/forgot') return <ForgotPasswordPage />
  if (currentPath === '/profile') return <ProfilePage />
  if (currentPath === '/admin/login') return <AdminLoginPage />

  // Admin routes
  if (currentPath.startsWith('/admin')) {
    const user = getStoredUser()
    if (!user || !STAFF_ROLES.has(user.role)) {
      window.location.replace('/admin/login')
      return null
    }
    if (currentPath === '/admin/users') return <AdminUsersPage />
    if (currentPath === '/admin/rooms') return <AdminRoomsPage />
    return <DashboardPage /> // /admin và /admin/dashboard
  }

  return <HomePage />
}

export default App
