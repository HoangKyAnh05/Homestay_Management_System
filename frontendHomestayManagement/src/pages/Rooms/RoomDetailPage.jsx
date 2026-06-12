import { useEffect, useMemo, useState } from 'react'
import { getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './RoomsPage.css'
import './RoomDetailPage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function formatMoney(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function formatDateTime(value, options) {
  return new Intl.DateTimeFormat('vi-VN', options).format(new Date(value))
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: 'Qua đêm',
    NIGHTLY: 'Qua đêm',
    BY_NIGHT: 'Qua đêm',
    DAILY: 'Theo ngày',
    BY_DAY: 'Theo ngày',
    HOURLY: 'Theo giờ',
    COMBO: 'Combo',
  }
  return labels[String(rentType || '').toUpperCase()] || rentType || 'Gói thuê'
}

function dayTypeLabel(dayType) {
  return String(dayType || '').toUpperCase() === 'WEEKEND' ? 'Cuối tuần' : 'Ngày thường'
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
        <a href="/rooms" className="home-nav-active">Phòng</a>
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

function groupSlotsByDate(slots) {
  return slots.reduce((groups, slot) => {
    const dateKey = formatDateTime(slot.checkInTarget, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return {
      ...groups,
      [dateKey]: [...(groups[dateKey] || []), slot],
    }
  }, {})
}

function RoomDetailPage({ roomId }) {
  const today = useMemo(() => new Date(), [])
  const [fromDate, setFromDate] = useState(formatDateInput(today))
  const [toDate, setToDate] = useState(formatDateInput(addDays(today, 14)))
  const [room, setRoom] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ fromDate, toDate })
    setLoading(true)
    setError('')
    fetch(`${API_BASE_URL}/rooms/${roomId}?${params}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết phòng.')
        setRoom(data)
        setSelectedImage(data.primaryImageUrl || data.imageUrls?.[0] || '')
      })
      .catch((err) => {
        setRoom(null)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [roomId, fromDate, toDate])

  const imageUrls = room?.imageUrls?.length ? room.imageUrls : []
  const groupedSlots = useMemo(() => groupSlotsByDate(room?.busySlots || []), [room])

  return (
    <div className="rooms-page room-detail-page">
      <PublicHeader />

      <main className="room-detail-main">
        <a className="room-back-link" href="/rooms">← Quay lại danh sách phòng</a>

        {loading ? (
          <div className="rooms-state">Đang tải chi tiết phòng...</div>
        ) : error ? (
          <div className="rooms-state rooms-state-error">{error}</div>
        ) : room ? (
          <>
            <section className="room-detail-heading">
              <div>
                <p>{room.roomTypeName}</p>
                <h1>Phòng {room.roomNumber}</h1>
              </div>
              <div className="room-detail-rating">★ 4.9</div>
            </section>

            <section className="room-detail-gallery" aria-label="Ảnh phòng">
              <div className="room-detail-main-photo">
                {selectedImage ? (
                  <img src={resolveImageUrl(selectedImage)} alt={`Phòng ${room.roomNumber}`} />
                ) : (
                  <div>Home Stays</div>
                )}
              </div>
              <div className="room-detail-thumbs">
                {imageUrls.slice(0, 5).map((url) => (
                  <button
                    key={url}
                    type="button"
                    className={selectedImage === url ? 'room-thumb-active' : ''}
                    onClick={() => setSelectedImage(url)}
                  >
                    <img src={resolveImageUrl(url)} alt="Ảnh phòng" />
                  </button>
                ))}
              </div>
            </section>

            <section className="room-detail-layout">
              <div className="room-detail-content">
                <section className="room-info-section">
                  <h2>Thông tin phòng</h2>
                  <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
                  <div className="room-info-chips">
                    <span>{room.maxAdults || 0} người lớn</span>
                    <span>{room.maxChildren || 0} trẻ em</span>
                    <span>Phòng {room.roomNumber}</span>
                  </div>
                </section>

                <section className="room-info-section">
                  <h2>Bảng giá theo gói</h2>
                  <div className="room-price-grid">
                    {(room.prices || []).map((price) => (
                      <article className="room-price-card" key={`${price.policyName}-${price.dayType}`}>
                        <span>{rentTypeLabel(price.rentType)}</span>
                        <h3>{price.policyName}</h3>
                        <p>{dayTypeLabel(price.dayType)}</p>
                        <strong>{formatMoney(price.price)}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="room-booking-panel">
                <h2>Lịch phòng đã đặt</h2>
                <p>Chọn khoảng ngày để kiểm tra các khung giờ bận trước khi đặt theo combo hoặc theo giờ.</p>
                <div className="room-date-fields">
                  <label>
                    <span>Từ ngày</span>
                    <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                  </label>
                  <label>
                    <span>Đến ngày</span>
                    <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                  </label>
                </div>

                <div className="room-busy-list">
                  {Object.keys(groupedSlots).length ? (
                    Object.entries(groupedSlots).map(([date, slots]) => (
                      <div className="room-busy-day" key={date}>
                        <h3>{date}</h3>
                        {slots.map((slot) => (
                          <div className="room-busy-slot" key={slot.bookingDetailId}>
                            <span>
                              {formatDateTime(slot.checkInTarget, { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {formatDateTime(slot.checkOutTarget, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <strong>Đã đặt</strong>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="room-free-state">
                      Chưa có khung giờ đã đặt trong khoảng ngày này.
                    </div>
                  )}
                </div>

                <a className="room-detail-cta" href="/home#search-results">Chọn lịch đặt phòng</a>
              </aside>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default RoomDetailPage
