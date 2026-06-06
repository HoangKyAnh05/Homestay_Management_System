import { useState } from 'react'
import { getStoredUser, logout } from '../../services/authService'
import './AdminLayout.css'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    ),
  },
  {
    key: 'users',
    label: 'Quản lí User',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    key: 'rooms',
    label: 'Quản lí Phòng',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ),
  },
]

export function navigate(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function AdminLayout({ activePage, children }) {
  const user = getStoredUser()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/login')
  }

  return (
    <div className={`admin-shell${collapsed ? ' admin-shell--collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          {!collapsed && (
            <span className="admin-sidebar-logo-text">
              Home Stays
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-nav-item${activePage === item.key ? ' admin-nav-item--active' : ''}`}
              onClick={() => navigate(`/admin/${item.key}`)}
              title={collapsed ? item.label : undefined}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: Home Stays link + logout */}
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

      {/* Main */}
      <div className="admin-main">
        {/* Topbar */}
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
              <strong>{user?.fullName || user?.email}</strong>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
