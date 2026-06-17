import AdminLayout from './AdminLayout'

function HousekeepingPage() {
  return (
    <AdminLayout activePage="housekeeping">
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#9ca3af' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <path d="M9 17h6M12 13v4"/>
          <circle cx="12" cy="10" r="1.5"/>
        </svg>
        <h2 style={{ margin: '0 0 8px', color: '#374151', fontSize: '20px', fontWeight: 800 }}>
          Housekeeping
        </h2>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Tính năng đang được phát triển. Vui lòng quay lại sau.
        </p>
      </div>
    </AdminLayout>
  )
}

export default HousekeepingPage
