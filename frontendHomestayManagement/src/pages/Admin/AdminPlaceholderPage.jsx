import AdminLayout from './AdminLayout'

function AdminPlaceholderPage({ activePage, title }) {
  return (
    <AdminLayout activePage={activePage}>
      <h1 style={{ margin: '0 0 8px', color: '#111827', fontSize: 26, fontWeight: 800 }}>
        {title}
      </h1>
      <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>
        Chức năng này sẽ được xử lý ở bước tiếp theo.
      </p>

      <div className="admin-placeholder">
        <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
        <h2>{title}</h2>
        <p>Đã tạo nút menu và route tạm thời.</p>
      </div>
    </AdminLayout>
  )
}

export default AdminPlaceholderPage
