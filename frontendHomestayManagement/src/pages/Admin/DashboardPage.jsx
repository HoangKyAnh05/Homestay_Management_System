import AdminLayout from './AdminLayout'

function DashboardPage() {
  return (
    <AdminLayout activePage="dashboard">
      <h1 style={{ margin: '0 0 8px', color: '#111827', fontSize: 26, fontWeight: 800 }}>
        Tổng quan hệ thống
      </h1>
      <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>Chào mừng trở lại.</p>

      <div className="admin-placeholder">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        <h2>Dashboard</h2>
        <p>Nội dung sẽ được bổ sung sau.</p>
      </div>
    </AdminLayout>
  )
}

export default DashboardPage
