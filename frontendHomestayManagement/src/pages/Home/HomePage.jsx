import { useEffect, useMemo, useState } from 'react'
import HomeSearch from '../../components/HomeSearch/HomeSearch'
import { getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import './HomePage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function roomPrice(room) {
  return Number(room.price ?? room.basePrice ?? 0)
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: 'đêm',
    NIGHTLY: 'đêm',
    BY_NIGHT: 'đêm',
    DAILY: 'ngày',
    BY_DAY: 'ngày',
    HOURLY: 'giờ',
    COMBO: 'lượt',
  }
  return labels[String(rentType || '').toUpperCase()] || 'đêm'
}

function UserAvatar({ user }) {
  const avatarUrl = resolveImageUrl(user?.avatarUrl)
  return (
    <span className="home-user-avatar" aria-hidden="true">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" />
      ) : (
        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
      )}
    </span>
  )
}

function useRoomTypes() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/rooms/types`)
      .then((r) => r.json())
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [])

  return { rooms, loading }
}

// Section: Các phòng nổi bật
function buildBookingUrl(room, criteria) {
  const roomId = room.roomId || room.id
  if (!criteria) return `/rooms/${roomId}`

  const params = new URLSearchParams({
    checkInDate: criteria.checkInDate,
    checkOutDate: criteria.checkOutDate,
    rooms: String(criteria.rooms),
    adults: String(criteria.adults),
    children: String(criteria.children),
    focusRoomId: String(roomId),
  })
  return `/rooms?${params.toString()}`
}

function RoomCard({ room, criteria }) {
  const [priceMode, setPriceMode] = useState('weekday')
  const title = room.name || room.roomTypeName || `Phòng ${room.roomNumber}`
  const description = room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'
  const hasRotatingPrice = Number(room.weekdayPrice || 0) > 0 && Number(room.weekendPrice || 0) > 0
  const price = hasRotatingPrice
    ? Number(priceMode === 'weekday' ? room.weekdayPrice : room.weekendPrice)
    : roomPrice(room)
  const priceNote = hasRotatingPrice
    ? (priceMode === 'weekday' ? 'ngày thường' : 'cuối tuần')
    : null

  useEffect(() => {
    if (!hasRotatingPrice) return undefined
    const intervalId = window.setInterval(() => {
      setPriceMode(current => current === 'weekday' ? 'weekend' : 'weekday')
    }, 3000)
    return () => window.clearInterval(intervalId)
  }, [hasRotatingPrice])

  return (
    <article className="room-card">
      <div className="room-card-img">
        {room.primaryImageUrl ? (
          <img src={resolveImageUrl(room.primaryImageUrl)} alt={title} loading="lazy" />
        ) : (
          <div className="room-card-img-placeholder" />
        )}
        <span className="room-card-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          4.9
        </span>
      </div>
      <div className="room-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        {room.roomNumber && (
          <div className="room-card-meta">
            <span>Phòng {room.roomNumber}</span>
            <span>{room.maxAdults || 0} người lớn · {room.maxChildren || 0} trẻ em</span>
          </div>
        )}
        <div className="room-card-footer">
          <span className="room-card-price">
            <span className="room-card-price-ticker" aria-live="polite">
              <span className="room-card-price-slide" key={`${priceMode}-${price}`}>
                <strong>{formatPrice(price)}</strong>
                <small>/{rentTypeLabel(room.rentType)}{priceNote ? ` - ${priceNote}` : ''}</small>
              </span>
            </span>
          </span>
          <button
            className="room-card-btn"
            type="button"
            onClick={() => window.location.assign(buildBookingUrl(room, criteria))}
          >
            Đặt ngay
          </button>
        </div>
      </div>
    </article>
  )
}

function SearchResultsSection({ criteria, rooms, loading, error, maxPrice, onMaxPriceChange }) {
  const highestPrice = useMemo(() => {
    const max = Math.max(...rooms.map(room => roomPrice(room)), 0)
    return Math.max(max, 100000)
  }, [rooms])

  const visibleRooms = useMemo(() => {
    return rooms
      .filter(room => roomPrice(room) <= maxPrice)
      .sort((a, b) => roomPrice(a) - roomPrice(b))
  }, [rooms, maxPrice])

  if (!criteria && !loading && !error) return null

  return (
    <section className="home-section search-results-section" id="search-results">
      <div className="home-section-inner">
        <div className="home-section-head">
          <div>
            <h2>Phòng trống phù hợp</h2>
            <p>
              {criteria
                ? `Từ ${criteria.checkInDate} đến ${criteria.checkOutDate} · ${criteria.adults} người lớn · ${criteria.rooms} phòng`
                : 'Kết quả tìm kiếm phòng trống.'}
            </p>
          </div>
          <span className="search-result-count">{visibleRooms.length} phòng</span>
        </div>

        <div className="search-results-layout">
          <aside className="search-filter-panel">
            <div className="search-filter-head">
              <strong>Lọc theo giá</strong>
              <span>{formatPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={highestPrice}
              step="50000"
              value={Math.min(maxPrice, highestPrice)}
              onChange={event => onMaxPriceChange(Number(event.target.value))}
            />
            <div className="search-filter-range">
              <span>0đ</span>
              <span>{formatPrice(highestPrice)}</span>
            </div>
          </aside>

          <div className="search-results-content">
            {loading ? (
              <div className="rooms-loading">Đang tìm phòng trống...</div>
            ) : error ? (
              <div className="rooms-loading rooms-loading--error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="rooms-grid search-results-grid">
                {visibleRooms.map(room => <RoomCard key={room.roomId || room.id} room={room} criteria={criteria} />)}
              </div>
            ) : (
              <div className="rooms-loading">Không có phòng trống phù hợp với bộ lọc hiện tại.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function RoomsSection({ rooms, loading }) {
  const carouselRooms = rooms.length > 3 ? [...rooms, ...rooms] : rooms

  return (
    <section className="home-section home-rooms" id="rooms" aria-labelledby="rooms-title">
      <div className="home-section-inner">
        <div className="home-section-head">
          <div>
            <h2 id="rooms-title">Phòng nổi bật</h2>
            <p>Không gian nghỉ dưỡng được chọn lọc dành cho bạn.</p>
          </div>
          <a href="/rooms" className="home-view-all">Xem tất cả phòng →</a>
        </div>

        {loading ? (
          <div className="rooms-loading">Đang tải...</div>
        ) : rooms.length === 0 ? (
          <div className="rooms-loading">Chưa có phòng để hiển thị.</div>
        ) : (
          <div className={`rooms-carousel${rooms.length > 3 ? ' rooms-carousel--animated' : ''}`}>
            <div className="rooms-carousel-track" style={{ '--room-count': rooms.length }}>
              {carouselRooms.map((room, index) => (
                <div className="rooms-carousel-item" key={`${room.id}-${index}`}>
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// Section: Tiện ích nổi bật
function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      ),
      title: 'Thiên nhiên',
      desc: 'Đắm mình trong không gian xanh mát, yên bình giữa lòng thiên nhiên.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
      title: 'Hỗ trợ 24/7',
      desc: 'Đội ngũ nhân viên tận tâm luôn sẵn sàng phục vụ mọi nhu cầu của bạn.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ),
      title: 'Đặt phòng nhanh',
      desc: 'Xác nhận đặt phòng ngay lập tức, không chờ đợi.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      ),
      title: 'Thanh toán an toàn',
      desc: 'Giao dịch bảo mật qua VNPay, MoMo và nhiều phương thức khác.',
    },
  ]

  return (
    <section className="home-section home-features" aria-label="Tiện ích nổi bật">
      <div className="home-section-inner">
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section: Đánh giá khách hàng
function ReviewsSection() {
  const reviews = [
    {
      initials: 'NV',
      name: 'Nguyễn Văn A',
      text: '"Không gian tuyệt đẹp, phòng rộng rãi và sạch sẽ. Nhân viên rất nhiệt tình. Chắc chắn sẽ quay lại lần sau."',
    },
    {
      initials: 'TH',
      name: 'Trần Thị Hoa',
      text: '"View từ phòng rất đẹp, buổi sáng ngắm sương mù trên đồi thực sự tuyệt vời. Đồ ăn sáng ngon."',
    },
    {
      initials: 'LM',
      name: 'Lê Minh Đức',
      text: '"Homestay ấm cúng, cảm giác như ở nhà. Giá cả hợp lý, vị trí thuận tiện. Rất đáng để trải nghiệm."',
    },
  ]

  return (
    <section className="home-section home-reviews" aria-labelledby="reviews-title">
      <div className="home-section-inner">
        <h2 id="reviews-title">Khách hàng nói gì</h2>
        <div className="reviews-grid">
          {reviews.map((r) => (
            <div key={r.name} className="review-card">
              <div className="review-stars" aria-label="5 sao">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg key={index} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p>{r.text}</p>
              <div className="review-author">
                <span className="review-avatar">{r.initials}</span>
                <strong>{r.name}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section: Gallery ảnh
function GallerySection({ rooms }) {
  const images = rooms.flatMap((r) => r.imageUrls || []).slice(0, 9)

  if (images.length === 0) return null

  return (
    <section className="home-gallery" aria-label="Thư viện ảnh">
      <div className="home-section-inner">
        <div className="gallery-grid">
          {images.map((url, i) => (
            <div key={i} className="gallery-item">
              <img src={resolveImageUrl(url)} alt={`Ảnh homestay ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer
function HomeFooter() {
  return (
    <footer className="home-footer" id="contact">
      <div className="home-footer-inner">
        <div className="footer-brand">
          <h3>Home Stays</h3>
          <p>Mang tâm hồn của kiến trúc truyền thống Việt Nam vào cuộc sống hiện đại. Ngôi nhà thứ hai của bạn.</p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>QUICK LINKS</h4>
          <ul>
            <li><a href="/rooms">Phòng &amp; Suites</a></li>
            <li><a href="#about">Về chúng tôi</a></li>
            <li><a href="#amenities">Tiện nghi</a></li>
            <li><a href="#contact">Liên hệ</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>CHÍNH SÁCH</h4>
          <ul>
            <li><a href="#">Điều khoản đặt phòng</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Chính sách hủy phòng</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>LIÊN HỆ</h4>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            123 Đường Homestay, Đà Lạt, Lâm Đồng
          </p>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
            0968311855
          </p>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            homestay.work1@gmail.com
          </p>
        </div>
      </div>

      <div className="home-footer-bottom">
        <p>© 2026 Home Stays. All rights reserved.</p>
      </div>
    </footer>
  )
}

function HomePage() {
  const currentUser = getStoredUser()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [maxPrice, setMaxPrice] = useState(10000000)
  const { rooms, loading } = useRoomTypes()

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  const handleSearch = async (criteria) => {
    setSearchCriteria(criteria)
    setSearchLoading(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({
        checkInDate: criteria.checkInDate,
        checkOutDate: criteria.checkOutDate,
        rooms: String(criteria.rooms),
        adults: String(criteria.adults),
        children: String(criteria.children),
      })
      const response = await fetch(`${API_BASE_URL}/rooms/search?${params}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể tìm phòng trống')
      const results = Array.isArray(data) ? data : []
      setSearchResults(results)
      const highest = Math.max(...results.map(room => roomPrice(room)), 0)
      setMaxPrice(Math.max(highest, 100000))
      setTimeout(() => {
        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } catch (err) {
      setSearchResults([])
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <a className="home-logo" href="/home">Home Stays</a>
        <nav className="home-nav" aria-label="Điều hướng chính">
          <a href="/home" className="home-nav-active">Trang chủ</a>
          <a href="/rooms">Phòng</a>
          <a href="#amenities">Tiện nghi</a>
          <a href="#contact">Liên hệ</a>
          <a href="#about">Giới thiệu</a>
        </nav>

        {currentUser ? (
          <div className="home-user-menu">
            <button
              className="home-user"
              type="button"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((c) => !c)}
            >
              <UserAvatar user={currentUser} />
              <span>{currentUser.fullName || currentUser.email}</span>
              <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isUserMenuOpen && (
              <div className="home-user-dropdown">
                {currentUser.role === 'ROLE_ADMIN' && (
                  <a href="/admin">Quản lí Home Stays</a>
                )}
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

      <section className="home-hero" aria-label="Home Stays">
        <img src="/banner.png" alt="Không gian nghỉ dưỡng Home Stays" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p>Nghỉ dưỡng cân bằng</p>
          <h1>Home Stays</h1>
        </div>
      </section>

      <HomeSearch onSearch={handleSearch} isSearching={searchLoading} />

      <SearchResultsSection
        criteria={searchCriteria}
        rooms={searchResults}
        loading={searchLoading}
        error={searchError}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
      />

      <RoomsSection rooms={rooms} loading={loading} />
      <FeaturesSection />
      <ReviewsSection />
      <GallerySection rooms={rooms} />
      <HomeFooter />
    </div>
  )
}

export default HomePage

