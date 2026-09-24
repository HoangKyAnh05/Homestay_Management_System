import { useCallback, useEffect, useState } from 'react'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { navigate } from './AdminLayout'
import AdminLayout from './AdminLayout'
import { formatExtensionTime, formatExtensionTitle } from '../../utils/stayOverdue'
import './ReceptionistOverviewPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/bookings'

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

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
  const [incidentSummary, setIncidentSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate: today, toDate: today })
      const [logsRes, incRes] = await Promise.all([
        fetch(`${API_BASE}/check-in-logs?${params}`, { headers: authHeaders() }),
        fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/incidents/summary', { headers: authHeaders() }).catch(() => null),
      ])
      const data = await logsRes.json().catch(() => ({}))
      if (!logsRes.ok) throw new Error(data.message || 'Không thể tải dữ liệu')
      setLogs(Array.isArray(data) ? data : [])

      if (incRes && incRes.ok) {
        const incData = await incRes.json().catch(() => null)
        setIncidentSummary(incData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const allDetails = logs.flatMap(b => (b.details || []).map(d => ({ ...d, booking: b })))

  const stayingCount   = allDetails.filter(d => d.checkInRecord?.actualCheckIn && !d.checkInRecord?.actualCheckOut).length
  const waitingCount   = allDetails.filter(d => !d.checkInRecord?.actualCheckIn && String(d.detailStatus || '').toUpperCase() !== 'CANCELLED').length
  const completedToday = allDetails.filter(d => d.checkInRecord?.actualCheckOut).length
  const totalToday     = logs.length

  const activeBookings = logs
    .filter(b => ['CHECKED_IN', 'CONFIRMED', 'PENDING'].includes(String(b.bookingStatus || '').toUpperCase()))
    .slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <AdminLayout activePage="receptionist-overview">
      <div className="rcp-page">
        <div className="rcp-hello">
          <div>
            <h1>{greeting}, {user?.fullName?.split(' ').pop() || 'Lễ tân'} </h1>
            <p>
              Hôm nay {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}.
              Dưới đây là tổng quan lưu trú trong ngày.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" className="rcp-refresh" onClick={loadLogs} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* ── Incident alert banner for Receptionist ── */}
        {incidentSummary && incidentSummary.reported > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 20,
            boxShadow: '0 1px 3px rgba(225, 29, 72, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <strong style={{ color: '#be123c', fontSize: 14 }}>
                  Có {incidentSummary.reported} sự cố đồ đạc hỏng / mất đang chờ Quản trị viên xử lý
                </strong>
                <div style={{ color: '#881337', fontSize: 12.5, marginTop: 2 }}>
                  Nhân viên Housekeeping đã báo cáo đồ cần thay thế hoặc bồi thường. Lễ tân có thể xem chi tiết để nắm tình hình phòng.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/housekeeping/incidents')}
              style={{
                background: '#e11d48',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(225, 29, 72, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              Xem danh sách sự cố →
            </button>
          </div>
        )}

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
                      <td><strong>{bookingDisplay(booking)}</strong></td>
                      <td>
                        <strong>{booking.customer?.fullName || '—'}</strong>
                        <span>{booking.customer?.phone || ''}</span>
                      </td>
                      <td>
                        {(booking.details || []).map(d => d.roomNumber).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td>{formatDateTime((booking.details || [])[0]?.checkInTarget)}</td>
                      <td>
                        {formatDateTime((booking.details || [])[0]?.checkOutTarget)}
                        {(() => {
                          const totalExt = (booking.details || []).reduce((sum, d) => sum + (Number(d.extensionHours) || 0), 0)
                          if (totalExt <= 0) return null
                          return (
                            <span style={{ display: 'inline-block', marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 600 }} title={formatExtensionTitle(totalExt)}>
                              {formatExtensionTime(totalExt)}
                            </span>
                          )
                        })()}
                      </td>
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
          <button type="button" className="rcp-quick-item" onClick={() => navigate('/admin/housekeeping/incidents')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 11h3"/></svg>
            <span>Đồ hỏng & mất</span>
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
