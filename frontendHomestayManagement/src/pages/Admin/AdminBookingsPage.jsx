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

function serviceTypeLabel(type) {
  if (type === 'FACILITY') return 'Tiện ích'
  if (type === 'INVENTORY') return 'Thuê đồ'
  if (type === 'MINI_BAR') return 'Mini-bar'
  return 'Dịch vụ'
}

function paymentStatusLabel(status) {
  if (status === 'SUCCESS') return 'Thành công'
  if (status === 'FAILED') return 'Thất bại'
  return 'Đang chờ'
}

function BookingCard({ booking, onOpenDetail }) {
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
      <button type="button" className="abk-detail-link" onClick={() => onOpenDetail(booking.bookingDetailId)}>
        Chi tiết
      </button>
    </article>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="abk-detail-field">
      <span>{label}</span>
      <strong>{value || 'Chưa có'}</strong>
    </div>
  )
}

function BookingDetailModal({ detail, loading, error, onClose }) {
  return (
    <div className="abk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="abk-modal">
        <div className="abk-modal-head">
          <div>
            <h3>Chi tiết đơn đặt phòng</h3>
            <p>{detail ? `Booking #${detail.bookingId} · Phòng ${detail.roomNumber}` : 'Đang tải thông tin...'}</p>
          </div>
          <button type="button" className="abk-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="abk-modal-body">
          {loading ? (
            <div className="abk-empty">Đang tải chi tiết...</div>
          ) : error ? (
            <div className="abk-empty abk-empty--error">{error}</div>
          ) : detail ? (
            <>
              <section className="abk-detail-section">
                <h4>Thông tin khách hàng</h4>
                <div className="abk-detail-grid">
                  <DetailField label="Họ tên" value={detail.customer?.fullName} />
                  <DetailField label="Số điện thoại" value={detail.customer?.phone} />
                  <DetailField label="Email" value={detail.customer?.email} />
                  <DetailField label="Địa chỉ" value={detail.customer?.address} />
                  <DetailField label="Ngày sinh" value={detail.customer?.dateOfBirth ? new Date(detail.customer.dateOfBirth).toLocaleDateString('vi-VN') : ''} />
                  <DetailField label="Mã khách hàng" value={detail.customer?.id ? `#${detail.customer.id}` : ''} />
                </div>
              </section>

              <section className="abk-detail-section">
                <h4>Thông tin đặt phòng</h4>
                <div className="abk-detail-grid">
                  <DetailField label="Phòng" value={`${detail.roomNumber} · ${detail.roomTypeName || 'Chưa phân loại'}`} />
                  <DetailField label="Ngày đặt" value={formatDateTime(detail.bookingDate)} />
                  <DetailField label="Nhận phòng dự kiến" value={formatDateTime(detail.checkInTarget)} />
                  <DetailField label="Trả phòng dự kiến" value={formatDateTime(detail.checkOutTarget)} />
                  <DetailField label="Người lớn" value={detail.numberOfAdults} />
                  <DetailField label="Trẻ em" value={detail.numberOfChildren} />
                  <DetailField label="Loại thuê" value={detail.rentType} />
                  <DetailField label="Trạng thái booking" value={statusLabel(detail.bookingStatus)} />
                  <DetailField label="Trạng thái phòng đặt" value={statusLabel(detail.detailStatus)} />
                  <DetailField label="Giá lúc đặt" value={formatMoney(detail.priceAtBooking)} />
                </div>
              </section>

              <section className="abk-detail-section">
                <h4>Lưu trú thực tế</h4>
                {detail.checkInRecords?.length ? (
                  <div className="abk-line-list">
                    {detail.checkInRecords.map(record => (
                      <div className="abk-line-row" key={record.id}>
                        <div>
                          <strong>Ca lưu trú #{record.id}</strong>
                          <span>Check-in {formatDateTime(record.actualCheckIn)} · Check-out {formatDateTime(record.actualCheckOut)}</span>
                          <span>Lễ tân: {record.receptionistName || 'Chưa có'} · Buồng phòng: {record.housekeepingName || 'Chưa có'}</span>
                        </div>
                        <strong>{formatMoney(Number(record.earlyCheckInFee || 0) + Number(record.lateCheckOutFee || 0))}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="abk-empty abk-empty--sm">Chưa có dữ liệu check-in/check-out thực tế.</div>
                )}
              </section>

              <section className="abk-detail-section">
                <h4>Dịch vụ và mini-bar</h4>
                {detail.serviceItems?.length ? (
                  <div className="abk-line-list">
                    {detail.serviceItems.map(item => (
                      <div className="abk-line-row" key={`${item.type}-${item.id}`}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{serviceTypeLabel(item.type)} · SL {item.quantity} × {formatMoney(item.unitPrice)}</span>
                        </div>
                        <strong>{formatMoney(item.totalPrice)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="abk-empty abk-empty--sm">Chưa ghi nhận dịch vụ phát sinh cho đơn này.</div>
                )}
              </section>

              <section className="abk-detail-section">
                <h4>Phụ phí và khoản phạt</h4>
                {detail.penaltyItems?.length ? (
                  <div className="abk-line-list">
                    {detail.penaltyItems.map(item => (
                      <div className="abk-line-row" key={item.id}>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.description || 'Không có ghi chú'}</span>
                        </div>
                        <strong>{formatMoney(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="abk-empty abk-empty--sm">Không có khoản phạt cho đơn này.</div>
                )}
              </section>

              <section className="abk-detail-section">
                <h4>Hóa đơn và thanh toán</h4>
                {detail.invoice ? (
                  <>
                    <div className="abk-detail-grid">
                      <DetailField label="Mã hóa đơn" value={`#${detail.invoice.id}`} />
                      <DetailField label="Tiền phòng" value={formatMoney(detail.invoice.roomCharge)} />
                      <DetailField label="Dịch vụ" value={formatMoney(detail.invoice.serviceCharge)} />
                      <DetailField label="Phạt" value={formatMoney(detail.invoice.penaltyCharge)} />
                      <DetailField label="Tổng tiền" value={formatMoney(detail.invoice.totalAmount)} />
                      <DetailField label="Người lập" value={detail.invoice.employeeName} />
                    </div>
                    {detail.payments?.length ? (
                      <div className="abk-line-list abk-line-list--mt">
                        {detail.payments.map(payment => (
                          <div className="abk-line-row" key={payment.id}>
                            <div>
                              <strong>{payment.paymentMethod || 'Chưa rõ phương thức'}</strong>
                              <span>{payment.transactionNo || 'Không có mã giao dịch'} · {formatDateTime(payment.paymentTime)}</span>
                            </div>
                            <strong>{formatMoney(payment.amount)} · {paymentStatusLabel(payment.status)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Hóa đơn chưa có giao dịch thanh toán.</div>
                    )}
                  </>
                ) : (
                  <div className="abk-empty abk-empty--sm">Chưa lập hóa đơn cho booking này.</div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
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
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [selectedDetail, setSelectedDetail] = useState(null)

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

  const openDetail = (bookingDetailId) => {
    setDetailModalOpen(true)
    setSelectedDetail(null)
    setDetailError('')
    setDetailLoading(true)

    fetch(`http://localhost:8080/api/admin/bookings/details/${bookingDetailId}`, { headers: authHeaders() })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tải được chi tiết đơn đặt phòng')
        return data
      })
      .then(data => setSelectedDetail(data))
      .catch(err => setDetailError(err.message || 'Không tải được chi tiết đơn đặt phòng'))
      .finally(() => setDetailLoading(false))
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
                          dayBookings.map(booking => (
                            <BookingCard key={booking.bookingDetailId} booking={booking} onOpenDetail={openDetail} />
                          ))
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

      {detailModalOpen && (
        <BookingDetailModal
          detail={selectedDetail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </AdminLayout>
  )
}

export default AdminBookingsPage
