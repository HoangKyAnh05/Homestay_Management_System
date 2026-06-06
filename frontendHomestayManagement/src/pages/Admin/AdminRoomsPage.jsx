import AdminLayout from './AdminLayout'

function AdminRoomsPage() {
  return (
    <AdminLayout activePage="rooms">
      <h1 style={{ margin: '0 0 28px', color: '#111827', fontSize: 26, fontWeight: 800 }}>
        Quản lí Phòng
      </h1>
      <div className="admin-placeholder">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <h2>Quản lí Phòng</h2>
        <p>Nội dung sẽ được bổ sung sau.</p>
      </div>
    </AdminLayout>
  )
}

export default AdminRoomsPage
