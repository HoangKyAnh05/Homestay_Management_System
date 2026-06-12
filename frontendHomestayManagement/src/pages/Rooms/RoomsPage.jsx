import { useEffect, useMemo, useState } from 'react'
import { getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './RoomsPage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: 'đêm',
    NIGHTLY: 'đêm',
    BY_NIGHT: 'đêm',
    DAILY: 'ngày',
    BY_DAY: 'ngày',
    HOURLY: 'giờ',
    COMBO: 'combo',
  }
  return labels[String(rentType || '').toUpperCase()] || 'đêm'
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

function RoomCard({ room }) {
  const title = `${room.roomTypeName || 'Phòng'} ${room.roomNumber || ''}`.trim()
  const imageUrl = room.primaryImageUrl || room.imageUrls?.[0]

  return (
    <a className="public-room-card" href={`/rooms/${room.roomId}`}>
      <div className="public-room-photo">
        {imageUrl ? (
          <img src={resolveImageUrl(imageUrl)} alt={title} loading="lazy" />
        ) : (
          <div className="public-room-photo-empty">Home Stays</div>
        )}
        <span className="public-room-badge">Phòng {room.roomNumber}</span>
      </div>
      <div className="public-room-body">
        <div className="public-room-title-row">
          <h3>{title}</h3>
          <span>4.9</span>
        </div>
        <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
        <div className="public-room-meta">
          <span>{room.maxAdults || 0} người lớn</span>
          <span>{room.maxChildren || 0} trẻ em</span>
        </div>
        <div className="public-room-price-row">
          <strong>{formatPrice(room.weekdayPrice)}</strong>
          <span>/{rentTypeLabel(room.rentType)} ngày thường</span>
        </div>
        <div className="public-room-weekend">
          Cuối tuần: {formatPrice(room.weekendPrice)}
        </div>
      </div>
    </a>
  )
}

function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [capacity, setCapacity] = useState('all')
  const [maxPrice, setMaxPrice] = useState(10000000)

  useEffect(() => {
    fetch(`${API_BASE_URL}/rooms`)
      .then((response) => response.json())
      .then((data) => {
        const nextRooms = Array.isArray(data) ? data : []
        setRooms(nextRooms)
        const highest = Math.max(...nextRooms.map((room) => Number(room.weekdayPrice || room.weekendPrice || 0)), 0)
        setMaxPrice(Math.max(highest, 100000))
      })
      .catch(() => setError('Không thể tải danh sách phòng.'))
      .finally(() => setLoading(false))
  }, [])

  const highestPrice = useMemo(() => {
    const highest = Math.max(...rooms.map((room) => Number(room.weekdayPrice || room.weekendPrice || 0)), 0)
    return Math.max(highest, 100000)
  }, [rooms])

  const visibleRooms = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return rooms
      .filter((room) => {
        const price = Number(room.weekdayPrice || room.weekendPrice || 0)
        const matchesPrice = price <= maxPrice
        const matchesKeyword = !normalizedKeyword
          || `${room.roomNumber} ${room.roomTypeName} ${room.description}`.toLowerCase().includes(normalizedKeyword)
        const totalCapacity = Number(room.maxAdults || 0) + Number(room.maxChildren || 0)
        const matchesCapacity = capacity === 'all' || totalCapacity >= Number(capacity)
        return matchesPrice && matchesKeyword && matchesCapacity
      })
      .sort((a, b) => Number(a.weekdayPrice || 0) - Number(b.weekdayPrice || 0))
  }, [rooms, keyword, capacity, maxPrice])

  return (
    <div className="rooms-page">
      <PublicHeader />

      <main>
        <div className="rooms-shell">
          <aside className="rooms-sidebar" aria-label="Bộ lọc phòng">
            <div className="rooms-sidebar-head">
              <p>Không gian lưu trú</p>
              <h1>Chọn phòng theo nhu cầu nghỉ, combo hoặc theo giờ</h1>
            </div>

            <div className="rooms-hero-panel">
              <strong>{rooms.length}</strong>
              <span>phòng trong hệ thống</span>
            </div>

            <div className="rooms-toolbar">
              <label className="rooms-search-field">
                <span>Tìm phòng</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Số phòng, loại phòng..."
                />
              </label>
              <label>
                <span>Sức chứa</span>
                <select value={capacity} onChange={(event) => setCapacity(event.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="2">Từ 2 khách</option>
                  <option value="4">Từ 4 khách</option>
                  <option value="6">Từ 6 khách</option>
                </select>
              </label>
              <label className="rooms-price-filter">
                <span>Giá tối đa: {formatPrice(maxPrice)}</span>
                <input
                  type="range"
                  min="0"
                  max={highestPrice}
                  step="50000"
                  value={Math.min(maxPrice, highestPrice)}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </label>
            </div>
          </aside>

          <section className="rooms-results-panel">
            <div className="rooms-results-head">
              <div>
                <h2>Tất cả phòng</h2>
                <p>Sắp xếp giá ngày thường thấp lên trước.</p>
              </div>
              <span>{visibleRooms.length} phù hợp</span>
            </div>

            {loading ? (
              <div className="rooms-state">Đang tải danh sách phòng...</div>
            ) : error ? (
              <div className="rooms-state rooms-state-error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="public-rooms-grid" aria-label="Danh sách phòng">
                {visibleRooms.map((room) => (
                  <RoomCard key={room.roomId} room={room} />
                ))}
              </div>
            ) : (
              <div className="rooms-state">Không tìm thấy phòng phù hợp với bộ lọc hiện tại.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default RoomsPage
