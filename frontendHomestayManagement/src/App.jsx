import { useEffect, useState } from 'react'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Login/LoginPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RegisterPage from './pages/Register/RegisterPage'

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

  if (currentPath === '/login') {
    return <LoginPage />
  }

  if (currentPath === '/register') {
    return <RegisterPage />
  }

  if (currentPath === '/profile') {
    return <ProfilePage />
  }

  return <HomePage />
}

export default App
