import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminCheckInLogsPage.css'

const API_BASE = 'http://localhost:8080/api/admin/bookings'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function toDateInputValue(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFromDate() {
  const date = new Date()
  date.setDate(date.getDate() - 14)
  return toDateInputValue(date)
}

function defaultToDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return toDateInputValue(date)
}

function formatDateTime(value) {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || 'Chưa rõ'
}

function rentTypeLabel(rentType) {
  const labels = {
    HOURLY: 'Theo giờ',
    BY_HOUR: 'Theo giờ',
    DAILY: 'Theo ngày',
    BY_DAY: 'Theo ngày',
    NIGHTLY: 'Theo đêm',
    BY_NIGHT: 'Theo đêm',
  }
  return labels[String(rentType || '').toUpperCase()] || rentType || 'Chưa rõ'
}

function detailStage(detail) {
  if (detail.checkInRecord?.actualCheckOut) return 'completed'
  if (detail.checkInRecord?.actualCheckIn) return 'staying'
  if (String(detail.detailStatus || '').toUpperCase() === 'CANCELLED') return 'cancelled'
  return 'waiting'
}

function stageLabel(stage) {
  return {
    waiting: 'Chưa check-in',
    staying: 'Đang lưu trú',
    completed: 'Đã trả phòng',
    cancelled: 'Đã hủy',
  }[stage]
}

function bookingMatches(booking, keyword) {
  if (!keyword) return true
  const customer = booking.customer || {}
  const haystack = [
    booking.bookingId,
    booking.bookingStatus,
    customer.fullName,
    customer.phone,
    customer.email,
    ...booking.details.flatMap(detail => [
      detail.roomNumber,
      detail.roomTypeName,
      detail.detailStatus,
      detail.bookingDetailId,
    ]),
  ].join(' ').toLowerCase()
  return haystack.includes(keyword)
}

function bookingHasStatus(booking, status) {
  if (!status) return true
  return booking.details.some(detail => detailStage(detail) === status)
}

function BookingListItem({ booking, active, onSelect }) {
  const customer = booking.customer || {}
  const progress = booking.totalDetails ? Math.round((booking.checkedInDetails / booking.totalDetails) * 100) : 0
  const isCompleted = String(booking.bookingStatus || '').toUpperCase() === 'COMPLETED'
    || (booking.totalDetails > 0 && booking.completedDetails === booking.totalDetails)

  return (
    <button type="button" className={`acl-booking${active ? ' acl-booking--active' : ''}`} onClick={onSelect}>
      <span className="acl-booking-top">
        <strong>Booking #{booking.bookingId}</strong>
        <span className={`acl-pill acl-pill--${String(booking.bookingStatus || '').toLowerCase()}`}>
          {statusLabel(booking.bookingStatus)}
        </span>
      </span>
      <span className="acl-booking-customer">{customer.fullName || 'Khách chưa có tên'}</span>
      <span className="acl-booking-meta">
        <span>{booking.totalDetails} phòng</span>
        <span>{formatMoney(booking.totalAmount)}</span>
      </span>
      <span className={`acl-progress${isCompleted ? ' acl-progress--completed' : ''}`} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </span>
    </button>
  )
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`acl-summary-card${tone ? ` acl-summary-card--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DetailCard({ detail, actionLoading, onAction }) {
  const stage = detailStage(detail)
  const canCheckIn = stage === 'waiting'
  const canCheckOut = stage === 'staying'
  const loading = actionLoading === detail.bookingDetailId

  return (
    <article className={`acl-detail acl-detail--${stage}`}>
      <div className="acl-detail-main">
        <div className="acl-room-badge">
          <strong>{detail.roomNumber}</strong>
          <span>{detail.roomTypeName || 'Chưa phân loại'}</span>
        </div>
        <div>
          <div className="acl-detail-title">
            <h3>Phòng {detail.roomNumber}</h3>
            <span className={`acl-stage acl-stage--${stage}`}>{stageLabel(stage)}</span>
          </div>
          <div className="acl-detail-grid">
            <div><span>Nhận phòng dự kiến</span><strong>{formatDateTime(detail.checkInTarget)}</strong></div>
            <div><span>Trả phòng dự kiến</span><strong>{formatDateTime(detail.checkOutTarget)}</strong></div>
            <div><span>Check-in thực tế</span><strong>{formatDateTime(detail.checkInRecord?.actualCheckIn)}</strong></div>
            <div><span>Check-out thực tế</span><strong>{formatDateTime(detail.checkInRecord?.actualCheckOut)}</strong></div>
          </div>
        </div>
      </div>

      <div className="acl-detail-bottom">
        <div className="acl-detail-tags">
          <span>{detail.numberOfAdults || 0} người lớn</span>
          <span>{detail.numberOfChildren || 0} trẻ em</span>
          <span>{rentTypeLabel(detail.rentType)}</span>
          <span>{formatMoney(detail.priceAtBooking)}</span>
        </div>
        <div className="acl-detail-actions">
          <button type="button" disabled={!canCheckIn || loading} onClick={() => onAction(detail.bookingDetailId, 'check-in')}>
            {loading && canCheckIn ? 'Đang xử lý...' : 'Check-in'}
          </button>
          <button type="button" disabled={!canCheckOut || loading} onClick={() => onAction(detail.bookingDetailId, 'check-out')}>
            {loading && canCheckOut ? 'Đang xử lý...' : 'Check-out'}
          </button>
        </div>
      </div>
    </article>
  )
}

function AdminCheckInLogsPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const loadLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate, toDate })
      const response = await fetch(`${API_BASE}/check-in-logs?${params}`, { headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể tải nhật ký lưu trú')
      const nextBookings = Array.isArray(data) ? data : []
      setBookings(nextBookings)
      setSelectedBookingId(current => {
        if (current && nextBookings.some(booking => booking.bookingId === current)) return current
        return nextBookings[0]?.bookingId || null
      })
    } catch (err) {
      setError(err.message)
      setBookings([])
      setSelectedBookingId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [fromDate, toDate])

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return bookings.filter(booking => bookingMatches(booking, keyword) && bookingHasStatus(booking, stageFilter))
  }, [bookings, search, stageFilter])

  const selectedBooking = useMemo(() => {
    return filteredBookings.find(booking => booking.bookingId === selectedBookingId) || filteredBookings[0] || null
  }, [filteredBookings, selectedBookingId])

  useEffect(() => {
    if (selectedBooking && selectedBooking.bookingId !== selectedBookingId) {
      setSelectedBookingId(selectedBooking.bookingId)
    }
  }, [selectedBooking, selectedBookingId])

  const allDetails = bookings.flatMap(booking => booking.details)
  const waitingCount = allDetails.filter(detail => detailStage(detail) === 'waiting').length
  const stayingCount = allDetails.filter(detail => detailStage(detail) === 'staying').length
  const completedCount = allDetails.filter(detail => detailStage(detail) === 'completed').length

  const runAction = async (bookingDetailId, action) => {
    setActionLoading(bookingDetailId)
    setActionError('')
    try {
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể cập nhật lưu trú')
      await loadLogs()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout activePage="check-in-logs">
      <div className="acl-header">
        <div>
          <h1>Nhật ký lưu trú</h1>
          <p>Quản lí check-in theo booking, mỗi booking hiển thị toàn bộ lưu trú theo từng booking detail.</p>
        </div>
        <button type="button" className="acl-refresh" onClick={loadLogs} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <section className="acl-summary">
        <SummaryCard label="Booking trong kỳ" value={bookings.length} />
        <SummaryCard label="Chưa check-in" value={waitingCount} tone="waiting" />
        <SummaryCard label="Đang lưu trú" value={stayingCount} tone="staying" />
        <SummaryCard label="Đã trả phòng" value={completedCount} tone="completed" />
      </section>

      <section className="acl-toolbar">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm booking, khách hàng, số phòng, số điện thoại..." />
        <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
        <select value={stageFilter} onChange={event => setStageFilter(event.target.value)}>
          <option value="">Tất cả lưu trú</option>
          <option value="waiting">Chưa check-in</option>
          <option value="staying">Đang lưu trú</option>
          <option value="completed">Đã trả phòng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </section>

      {error ? <div className="acl-message acl-message--error">{error}</div> : null}
      {actionError ? <div className="acl-message acl-message--error">{actionError}</div> : null}

      <section className="acl-workspace">
        <aside className="acl-booking-panel">
          <div className="acl-panel-title">
            <strong>Danh sách booking</strong>
            <span>{filteredBookings.length} kết quả</span>
          </div>
          {loading ? (
            <div className="acl-empty">Đang tải nhật ký...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="acl-empty">Không có booking phù hợp.</div>
          ) : (
            <div className="acl-booking-list">
              {filteredBookings.map(booking => (
                <BookingListItem
                  key={booking.bookingId}
                  booking={booking}
                  active={selectedBooking?.bookingId === booking.bookingId}
                  onSelect={() => setSelectedBookingId(booking.bookingId)}
                />
              ))}
            </div>
          )}
        </aside>

        <div className="acl-detail-panel">
          {selectedBooking ? (
            <>
              <div className="acl-selected-head">
                <div>
                  <span>Booking #{selectedBooking.bookingId}</span>
                  <h2>{selectedBooking.customer?.fullName || 'Khách chưa có tên'}</h2>
                  <p>
                    Đặt ngày {formatDate(selectedBooking.bookingDate)}
                    {selectedBooking.customer?.phone ? ` · ${selectedBooking.customer.phone}` : ''}
                  </p>
                </div>
                <div className="acl-selected-total">
                  <span>Tổng tiền phòng</span>
                  <strong>{formatMoney(selectedBooking.totalAmount)}</strong>
                </div>
              </div>

              <div className="acl-detail-list">
                {selectedBooking.details.map(detail => (
                  <DetailCard
                    key={detail.bookingDetailId}
                    detail={detail}
                    actionLoading={actionLoading}
                    onAction={runAction}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="acl-empty acl-empty--panel">Chọn một booking để xem lưu trú.</div>
          )}
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminCheckInLogsPage
