import { useCallback, useEffect, useState } from 'react'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { navigate } from './AdminLayout'
import AdminLayout from './AdminLayout'
import './ReceptionistOverviewPage.css'

const API_BASE = 'http://localhost:8080/api/admin/bookings'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function toDateInput(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || '—'
}

function statusClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'CHECKED_IN') return 'rcp-badge rcp-badge--staying'
  if (s === 'COMPLETED') return 'rcp-badge rcp-badge--done'
  if (s === 'CONFIRMED') return 'rcp-badge rcp-badge--confirmed'
  if (s === 'CANCELLED') return 'rcp-badge rcp-badge--cancelled'
  return 'rcp-badge'
}

function SummaryCard({ icon, label, value, sub, tone }) {
  return (
    <div className={`rcp-card${tone ? ` rcp-card--${tone}` : ''}`}>
      <div className="rcp-card-icon">{icon}</div>
      <div className="rcp-card-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  )
}

function ReceptionistOverviewPage() {
  const user = getStoredUser()
  const today = toDateInput(new Date())
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate: today, toDate: today })
      const res = await fetch(`${API_BASE}/check-in-logs?${params}`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể tải dữ liệu')
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { loadLogs() }, [loadLogs])

  // Tổng hợp tất cả details từ tất cả bookings hôm nay
  const allDetails = logs.flatMap(b => (b.details || []).map(d => ({ ...d, booking: b })))

  const stayingCount   = allDetails.filter(d => d.checkInRecord?.actualCheckIn && !d.checkInRecord?.actualCheckOut).length
  const waitingCount   = allDetails.filter(d => !d.checkInRecord?.actualCheckIn && String(d.detailStatus || '').toUpperCase() !== 'CANCELLED').length
  const completedToday = allDetails.filter(d => d.checkInRecord?.actualCheckOut).length
  const totalToday     = logs.length

  // Top 5 booking đang lưu trú hoặc chờ check-in
  const activeBookings = logs
    .filter(b => ['CHECKED_IN', 'CONFIRMED', 'PENDING'].includes(String(b.bookingStatus || '').toUpperCase()))
    .slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <AdminLayout activePage="receptionist-overview">
      <div className="rcp-page">

        {/* ── Chào ── */}
        <div className="rcp-hello">
          <div>
            <h1>{greeting}, {user?.fullName?.split(' ').pop() || 'Lễ tân'} 👋</h1>
            <p>
              Hôm nay {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}.
              Dưới đây là tổng quan lưu trú trong ngày.
            </p>
          </div>
          <button type="button" className="rcp-refresh" onClick={loadLogs} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="rcp-summary">
          <SummaryCard
            tone="staying"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            label="Đang lưu trú"
            value={stayingCount}
            sub="khách đang trong phòng"
          />
          <SummaryCard
            tone="waiting"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            label="Chờ check-in"
            value={waitingCount}
            sub="hôm nay"
          />
          <SummaryCard
            tone="done"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            label="Đã trả phòng"
            value={completedToday}
            sub="hôm nay"
          />
          <SummaryCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
            label="Tổng booking hôm nay"
            value={totalToday}
            sub="booking trong ngày"
          />
        </div>

        {error && <div className="rcp-error">{error}</div>}

        {/* ── Booking list ── */}
        <div className="rcp-section">
          <div className="rcp-section-head">
            <h2>Booking hôm nay</h2>
            <button type="button" className="rcp-link" onClick={() => navigate('/admin/check-in-logs')}>
              Xem tất cả →
            </button>
          </div>

          {loading ? (
            <div className="rcp-state">Đang tải danh sách booking...</div>
          ) : activeBookings.length === 0 ? (
            <div className="rcp-state">Không có booking nào hôm nay.</div>
          ) : (
            <div className="rcp-table-wrap">
              <table className="rcp-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Khách hàng</th>
                    <th>Phòng</th>
                    <th>Nhận phòng</th>
                    <th>Trả phòng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activeBookings.map(booking => (
                    <tr key={booking.bookingId}>
                      <td><strong>#{booking.bookingId}</strong></td>
                      <td>
                        <strong>{booking.customer?.fullName || '—'}</strong>
                        <span>{booking.customer?.phone || ''}</span>
                      </td>
                      <td>
                        {(booking.details || []).map(d => d.roomNumber).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td>{formatDateTime((booking.details || [])[0]?.checkInTarget)}</td>
                      <td>{formatDateTime((booking.details || [])[0]?.checkOutTarget)}</td>
                      <td><strong>{formatMoney(booking.totalAmount)}</strong></td>
                      <td><span className={statusClass(booking.bookingStatus)}>{statusLabel(booking.bookingStatus)}</span></td>
                      <td>
                        <button
                          type="button"
                          className="rcp-action-btn"
                          onClick={() => navigate('/admin/check-in-logs')}
                        >
                          Check-in/out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick links ── */}
        <div className="rcp-quick">
          <button type="button" className="rcp-quick-item" onClick={() => navigate('/admin/bookings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>
            <span>Đơn Đặt Phòng</span>
          </button>
          <button type="button" className="rcp-quick-item" onClick={() => navigate('/admin/check-in-logs')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Nhật ký Lưu trú</span>
          </button>
          <button type="button" className="rcp-quick-item" onClick={() => navigate('/admin/invoices')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
            <span>Hóa đơn</span>
          </button>
        </div>

      </div>
    </AdminLayout>
  )
}

export default ReceptionistOverviewPage
