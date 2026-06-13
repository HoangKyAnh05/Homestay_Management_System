import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import '../Home/HomePage.css'
import './BookingHistoryPage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function formatDateTime(value) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ thanh toán/xác nhận',
    CONFIRMED: 'Đặt phòng thành công',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || 'Chưa rõ'
}

function serviceTypeLabel(type) {
  return type === 'FACILITY' ? 'Dịch vụ' : 'Thuê đồ'
}

function PublicHeader() {
  const currentUser = getStoredUser()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <header className="home-header">
      <a className="home-logo" href="/home">Home Stays</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/rooms">Phòng</a>
        <a href="/home#amenities">Tiện nghi</a>
        <a href="/home#contact">Liên hệ</a>
        <a href="/home#about">Giới thiệu</a>
      </nav>

      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            <span className="home-user-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
            </span>
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              <a href="/booking-history">Lịch sử đặt phòng</a>
              <a href="/profile">Thông tin cá nhân</a>
              <button type="button" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-actions">
          <a href="/login">Đăng nhập</a>
          <a href="/register">Đăng ký</a>
        </div>
      )}
    </header>
  )
}

function PaymentButton({ compact = false }) {
  return (
    <button className={compact ? 'history-pay-btn history-pay-btn--compact' : 'history-pay-btn'} type="button">
      Thanh toán
    </button>
  )
}

function BookingHistoryPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const token = getStoredToken()

  useEffect(() => {
    if (!token) {
      window.location.assign('/login')
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    fetch(`${API_BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải lịch sử đặt phòng')
        return Array.isArray(data) ? data : []
      })
      .then((data) => {
        setBookings(data)
        setSelectedBookingId((current) => current || data[0]?.bookingId || null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || !selectedBookingId) {
      setDetail(null)
      return undefined
    }
    const controller = new AbortController()
    setDetailLoading(true)
    fetch(`${API_BASE_URL}/bookings/my/${selectedBookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết đơn')
        return data
      })
      .then(setDetail)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setDetailLoading(false))

    return () => controller.abort()
  }, [selectedBookingId, token])

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.bookingId === selectedBookingId) || null,
    [bookings, selectedBookingId]
  )

  return (
    <div className="booking-history-page">
      <PublicHeader />
      <main className="booking-history-main">
        <section className="history-heading">
          <div>
            <p>Tài khoản của tôi</p>
            <h1>Lịch sử đặt phòng</h1>
          </div>
          <span>{bookings.length} booking</span>
        </section>

        {loading ? (
          <div className="history-state">Đang tải lịch sử đặt phòng...</div>
        ) : error ? (
          <div className="history-state history-state--error">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="history-state">Bạn chưa có booking nào.</div>
        ) : (
          <section className="history-layout">
            <div className="history-list">
              {bookings.map((booking) => (
                <article
                  key={booking.bookingId}
                  className={`history-booking-card${booking.bookingId === selectedBookingId ? ' is-active' : ''}`}
                  onClick={() => setSelectedBookingId(booking.bookingId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedBookingId(booking.bookingId)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div className="history-card-top">
                    <strong>Booking #{booking.bookingId}</strong>
                    <span className={`history-status history-status--${String(booking.status || '').toLowerCase()}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <h2>Phòng {booking.firstRoomNumber} · {booking.firstRoomTypeName}</h2>
                  <p>{formatDateTime(booking.checkInTarget)}</p>
                  <div className="history-card-bottom">
                    <span>{booking.roomCount} phòng · {formatMoney(booking.totalAmount)}</span>
                    {booking.requiresPayment && <PaymentButton compact />}
                  </div>
                </article>
              ))}
            </div>

            <aside className="history-detail">
              {detailLoading ? (
                <div className="history-state">Đang tải chi tiết...</div>
              ) : detail ? (
                <>
                  <div className="history-detail-head">
                    <div>
                      <span>Booking #{detail.bookingId}</span>
                      <h2>{statusLabel(detail.status)}</h2>
                    </div>
                    {detail.requiresPayment && <PaymentButton />}
                  </div>

                  {detail.requiresPayment && (
                    <div className="history-payment-alert">
                      <strong>Cần thanh toán trước {formatMoney(detail.depositAmount)}</strong>
                      <p>
                        {detail.depositCalculationType === 'PERCENTAGE'
                          ? `${Number(detail.depositPolicyValue || 0)}% tổng giá trị đơn`
                          : detail.depositPolicyName}
                      </p>
                    </div>
                  )}

                  <div className="history-summary-grid">
                    <div><span>Ngày đặt</span><strong>{formatDateTime(detail.bookingDate)}</strong></div>
                    <div><span>Tổng tiền phòng</span><strong>{formatMoney(detail.roomCharge)}</strong></div>
                    <div><span>Dịch vụ đi kèm</span><strong>{formatMoney(detail.serviceCharge)}</strong></div>
                    <div><span>Tổng thanh toán</span><strong>{formatMoney(detail.totalAmount)}</strong></div>
                  </div>

                  <section className="history-detail-section">
                    <h3>Phòng đã đặt</h3>
                    <div className="history-room-list">
                      {detail.rooms.map((room) => (
                        <article key={room.bookingDetailId}>
                          <div>
                            <strong>Phòng {room.roomNumber}</strong>
                            <span>{room.roomTypeName} · {room.numberOfAdults} NL · {room.numberOfChildren} TE</span>
                          </div>
                          <p>{formatDateTime(room.checkInTarget)} → {formatDateTime(room.checkOutTarget)}</p>
                          <b>{formatMoney(room.priceAtBooking)}</b>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="history-detail-section">
                    <h3>Dịch vụ đi kèm</h3>
                    {detail.services.length ? (
                      <div className="history-service-list">
                        {detail.services.map((service) => (
                          <div key={service.id}>
                            <span>{service.name} · {serviceTypeLabel(service.type)} × {service.quantity}</span>
                            <strong>{formatMoney(service.totalAmount)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="history-muted">Không có dịch vụ đi kèm.</p>
                    )}
                  </section>
                </>
              ) : selectedBooking ? (
                <div className="history-state">Chọn booking để xem chi tiết.</div>
              ) : null}
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}

export default BookingHistoryPage
