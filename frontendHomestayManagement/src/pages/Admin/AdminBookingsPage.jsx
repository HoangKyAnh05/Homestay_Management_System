import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminBookingsPage.css'

const API = 'http://localhost:8080/api/admin/bookings/schedule'
const PAGE_SIZE_OPTIONS = [6, 8, 12]

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function toDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay() || 7
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - day + 1)
  return result
}

function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function formatShortDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] || status || 'Chưa rõ'
}

function bookingStatusClass(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'CANCELLED') return 'abk-booking abk-booking--cancelled'
  if (normalized === 'COMPLETED') return 'abk-booking abk-booking--completed'
  if (normalized === 'PENDING') return 'abk-booking abk-booking--pending'
  if (normalized === 'CHECKED_IN') return 'abk-booking abk-booking--active'
  return 'abk-booking'
}

function overlapsDay(booking, day) {
  const start = new Date(booking.checkInTarget)
  const end = new Date(booking.checkOutTarget)
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = addDays(dayStart, 1)
  return start < dayEnd && end > dayStart
}

function roomMatchesSearch(room, bookings, keyword) {
  if (!keyword) return true
  const roomText = `${room.roomNumber || ''} ${room.roomTypeName || ''}`.toLowerCase()
  if (roomText.includes(keyword)) return true
  return bookings.some(booking =>
    booking.roomId === room.id &&
    `${booking.customerName || ''} ${booking.customerPhone || ''} ${booking.bookingId || ''}`.toLowerCase().includes(keyword)
  )
}

function BookingCard({ booking }) {
  const totalGuests = Number(booking.numberOfAdults || 0) + Number(booking.numberOfChildren || 0)
  return (
    <article className={bookingStatusClass(booking.detailStatus || booking.bookingStatus)}>
      <div className="abk-booking-main">
        <strong>{booking.customerName || 'Khách hàng'}</strong>
        <span>#{booking.bookingId} · {statusLabel(booking.detailStatus || booking.bookingStatus)}</span>
      </div>
      <div className="abk-booking-meta">
        <span>{formatTime(booking.checkInTarget)} - {formatTime(booking.checkOutTarget)}</span>
        <span>{totalGuests} khách · {booking.rentType}</span>
      </div>
    </article>
  )
}

function AdminBookingsPage() {
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek()))
  const [schedule, setSchedule] = useState({ rooms: [], bookings: [], weekStart, weekEnd: weekStart })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetch(`${API}?weekStart=${weekStart}`, { headers: authHeaders(), signal: controller.signal })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tải được lịch đặt phòng')
        return data
      })
      .then(data => {
        setSchedule({
          rooms: Array.isArray(data.rooms) ? data.rooms : [],
          bookings: Array.isArray(data.bookings) ? data.bookings : [],
          weekStart: data.weekStart || weekStart,
          weekEnd: data.weekEnd || weekStart,
          today: data.today,
        })
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Không tải được lịch đặt phòng')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [weekStart])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, pageSize, weekStart])

  const weekDays = useMemo(() => {
    const start = toDate(schedule.weekStart || weekStart)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [schedule.weekStart, weekStart])

  const visibleBookings = useMemo(() => {
    if (!statusFilter) return schedule.bookings
    return schedule.bookings.filter(booking =>
      [booking.bookingStatus, booking.detailStatus].some(status => String(status || '').toUpperCase() === statusFilter)
    )
  }, [schedule.bookings, statusFilter])

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return schedule.rooms.filter(room => roomMatchesSearch(room, visibleBookings, keyword))
  }, [schedule.rooms, visibleBookings, search])

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRooms = filteredRooms.slice((safePage - 1) * pageSize, safePage * pageSize)

  const todayKey = toDateKey(new Date())
  const todayBookings = schedule.bookings.filter(booking => overlapsDay(booking, new Date()))
  const activeRoomsToday = new Set(todayBookings.map(booking => booking.roomId)).size
  const pendingCount = schedule.bookings.filter(booking =>
    [booking.bookingStatus, booking.detailStatus].some(status => String(status || '').toUpperCase() === 'PENDING')
  ).length
  const weekRevenue = schedule.bookings.reduce((sum, booking) => sum + Number(booking.priceAtBooking || 0), 0)

  const shiftWeek = amount => {
    setWeekStart(toDateKey(addDays(toDate(weekStart), amount * 7)))
  }

  return (
    <AdminLayout activePage="booking-orders">
      <div className="abk-header">
        <div>
          <h1>Đơn Đặt Phòng</h1>
          <p>Lịch tuần từ {formatShortDate(schedule.weekStart)} đến {formatShortDate(schedule.weekEnd)}.</p>
        </div>
        <div className="abk-week-controls">
          <button type="button" className="abk-icon-btn" onClick={() => shiftWeek(-1)} aria-label="Tuần trước">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" className="abk-today-btn" onClick={() => setWeekStart(toDateKey(startOfWeek()))}>Hôm nay</button>
          <button type="button" className="abk-icon-btn" onClick={() => shiftWeek(1)} aria-label="Tuần sau">
            <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div className="abk-stats">
        <div><span>Phòng trong hệ thống</span><strong>{schedule.rooms.length}</strong></div>
        <div><span>Phòng có khách hôm nay</span><strong>{activeRoomsToday}</strong></div>
        <div><span>Đơn trong tuần</span><strong>{schedule.bookings.length}</strong></div>
        <div><span>Đang chờ</span><strong>{pendingCount}</strong></div>
        <div><span>Giá trị đặt phòng</span><strong>{formatMoney(weekRevenue)}</strong></div>
      </div>

      <div className="abk-toolbar">
        <input
          className="abk-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm phòng, loại phòng, khách hàng, số điện thoại..."
        />
        <input
          className="abk-date"
          type="date"
          value={weekStart}
          onChange={e => setWeekStart(toDateKey(startOfWeek(toDate(e.target.value))))}
        />
        <select className="abk-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Đang lưu trú</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <select className="abk-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size} phòng/trang</option>)}
        </select>
      </div>

      <section className="abk-schedule">
        {loading ? (
          <div className="abk-empty">Đang tải lịch đặt phòng...</div>
        ) : error ? (
          <div className="abk-empty abk-empty--error">{error}</div>
        ) : filteredRooms.length === 0 ? (
          <div className="abk-empty">Không có phòng hoặc đơn đặt phòng phù hợp.</div>
        ) : (
          <div className="abk-grid-wrap">
            <div className="abk-grid" style={{ '--abk-days': weekDays.length }}>
              <div className="abk-room-head">Phòng</div>
              {weekDays.map((day, index) => {
                const key = toDateKey(day)
                return (
                  <div className={`abk-day-head${key === todayKey ? ' abk-day-head--today' : ''}`} key={key}>
                    <span>{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</span>
                    <strong>{formatShortDate(day)}</strong>
                  </div>
                )
              })}

              {pagedRooms.map(room => (
                <div className="abk-row" key={room.id}>
                  <div className="abk-room-cell">
                    <strong>Phòng {room.roomNumber}</strong>
                    <span>{room.roomTypeName || 'Chưa phân loại'}</span>
                  </div>
                  {weekDays.map(day => {
                    const dayBookings = visibleBookings
                      .filter(booking => booking.roomId === room.id && overlapsDay(booking, day))
                      .sort((a, b) => new Date(a.checkInTarget) - new Date(b.checkInTarget))
                    return (
                      <div className="abk-day-cell" key={`${room.id}-${toDateKey(day)}`}>
                        {dayBookings.length ? (
                          dayBookings.map(booking => <BookingCard key={booking.bookingDetailId} booking={booking} />)
                        ) : (
                          <span className="abk-free">Trống</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="abk-footer">
        <span>
          Hiển thị {pagedRooms.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredRooms.length)} / {filteredRooms.length} phòng
        </span>
        <div className="abk-pagination">
          <button type="button" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Trước</button>
          <strong>{safePage} / {totalPages}</strong>
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Sau</button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminBookingsPage
