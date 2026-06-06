import AdminLayout from './AdminLayout'

function AdminUsersPage() {
  return (
    <AdminLayout activePage="users">
      <h1 style={{ margin: '0 0 28px', color: '#111827', fontSize: 26, fontWeight: 800 }}>
        Quản lí User
      </h1>
      <div className="admin-placeholder">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <h2>Quản lí User</h2>
        <p>Nội dung sẽ được bổ sung sau.</p>
      </div>
    </AdminLayout>
  )
}

export default AdminUsersPage
