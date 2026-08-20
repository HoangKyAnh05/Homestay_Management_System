import { useEffect, useMemo, useState } from 'react'
import HomeSearch from '../../components/HomeSearch/HomeSearch'
import { getStoredUser, getStoredToken, logout } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import './HomePage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function getFallbackRoomImage(roomTypeName, roomTypeId) {
  const name = String(roomTypeName || '').toLowerCase()
  if (name.includes('studio')) return '/home_1/image.png'
  if (name.includes('vip') || name.includes('suite')) return '/home_2/image_1.jpg'
  if (name.includes('deluxe')) return '/home_3/image_3.jpg'
  if (name.includes('family') || name.includes('gia đình')) return '/home_4/image_1.jpg'
  if (name.includes('connecting') || name.includes('kết nối')) return '/home_5/image_1.jpg'

  const fallbacks = [
    '/home_1/image.png',
    '/home_2/image_1.jpg',
    '/home_3/image_3.jpg',
    '/home_4/image_1.jpg',
    '/home_5/image_1.jpg'
  ]
  const idNum = Math.max(1, Number(roomTypeId) || 1)
  const idx = (idNum - 1) % fallbacks.length
  return fallbacks[idx]
}

function formatVoucherMoney(value) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value || 0)) + 'đ'
}

function voucherDiscountText(voucher) {
  if (!voucher) return ''
  if (String(voucher.discountType).toUpperCase() === 'PERCENT') {
    return `giảm ${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}%`
  }
  return `giảm ${formatVoucherMoney(voucher.discountValue)}`
}

function voucherConditionText(voucher) {
  if (!voucher?.minOrderValue || Number(voucher.minOrderValue) <= 0) {
    return 'Áp dụng cho kỳ nghỉ của bạn tại Nhà Ba Gian.'
  }
  return `Cho đơn từ ${formatVoucherMoney(voucher.minOrderValue)}.`
}

function roomPrice(room) {
  if (room.price != null && Number(room.price) > 0) return Number(room.price)
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) return Number(room.weekdayPrice)
  if (room.weekendPrice != null && Number(room.weekendPrice) > 0) return Number(room.weekendPrice)
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const validPrices = room.prices.map(p => Number(p.price || 0)).filter(p => p > 0)
    if (validPrices.length > 0) return Math.min(...validPrices)
  }
  return 0
}

function roomTypeIdOf(room) {
  return room.roomTypeId || room.id
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
  const roomTypeId = roomTypeIdOf(room)
  if (!criteria) return `/rooms?roomTypeId=${roomTypeId}`

  const params = new URLSearchParams({
    checkInDate: criteria.checkInDate,
    checkOutDate: criteria.checkOutDate,
    rooms: String(criteria.rooms),
    adults: String(criteria.adults),
    children: String(criteria.children),
    roomTypeId: String(roomTypeId),
  })
  return `/rooms?${params.toString()}`
}

function RoomCard({ room, criteria }) {
  const [priceMode, setPriceMode] = useState('weekday')
  const [isLiked, setIsLiked] = useState(false)
  const token = getStoredToken()
  const roomTypeId = roomTypeIdOf(room)

  useEffect(() => {
    if (!token || !roomTypeId) return
    fetch(`${API_BASE_URL}/customer/wishlist/check/${roomTypeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : false))
      .then(setIsLiked)
      .catch(() => {})
  }, [roomTypeId, token])

  const toggleHeart = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!token) {
      window.location.assign('/login')
      return
    }
    const nextState = !isLiked
    setIsLiked(nextState)
    try {
      const res = await fetch(`${API_BASE_URL}/customer/wishlist/toggle/${roomTypeId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.isWishlisted === 'boolean') {
        setIsLiked(data.isWishlisted)
      }
    } catch {
      // Retain optimistic UI state
    }
  }

  const title = houseTypeName(room)
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
        <img
          src={resolveImageUrl(room.primaryImageUrl) || getFallbackRoomImage(title, roomTypeId)}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getFallbackRoomImage(title, roomTypeId);
          }}
        />
        <span className="room-card-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          4.9
        </span>
        <button
          type="button"
          className={`public-room-heart-btn${isLiked ? ' is-liked' : ''}`}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, border: 0, borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', background: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          onClick={toggleHeart}
        >
          {isLiked ? '❤️' : '♡'}
        </button>
      </div>
      <div className="room-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="room-card-meta">
          <span>{room.maxAdults || 0} người lớn · {room.maxChildren || 0} trẻ em</span>
          {Number.isFinite(Number(room.availableRooms)) && (
            <span>Còn {room.availableRooms} phòng</span>
          )}
        </div>
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
            {criteria ? 'Đặt phòng' : 'Xem phòng'}
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
            <h2>Loại nhà còn trống</h2>
            <p>
              {criteria
                ? `Từ ${criteria.checkInDate} đến ${criteria.checkOutDate} · ${criteria.adults} người lớn · ${criteria.rooms} phòng`
                : 'Kết quả tìm kiếm theo loại nhà.'}
            </p>
          </div>
          <span className="search-result-count">{visibleRooms.length} loại nhà</span>
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
              <div className="rooms-loading">Đang tìm loại nhà còn trống...</div>
            ) : error ? (
              <div className="rooms-loading rooms-loading--error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="rooms-grid search-results-grid">
                {visibleRooms.map(room => <RoomCard key={room.roomTypeId || room.id} room={room} criteria={criteria} />)}
              </div>
            ) : (
              <div className="rooms-loading">Không có loại nhà đủ số lượng và sức chứa trong thời gian này.</div>
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
            <h2 id="rooms-title">Loại nhà nổi bật</h2>
            <p>Không gian nghỉ dưỡng được chọn lọc dành cho bạn.</p>
          </div>
          <a href="/rooms" className="home-view-all">Xem tất cả loại nhà →</a>
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
          <h3>Nhà Ba Gian</h3>
          <p style={{ fontStyle: 'italic', fontWeight: 600, color: '#1f4328', marginBottom: '6px', fontSize: '13px' }}>
            Garden Villa in Tiến Xuân
          </p>
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
          <h4>VỊ TRÍ</h4>
          <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 12px' }}>
            📍 Thung lũng Ngọc Linh, Trại Mới, Tiến Xuân, Thạch Thất, Hà Nội
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ background: '#e2e8f0', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#1e293b', width: 'fit-content' }}>
              🚗 35km - Cách Hà Nội
            </span>
            <span style={{ background: '#e2e8f0', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#1e293b', width: 'fit-content' }}>
              ⏱️ 40' - Thời gian di chuyển từ nội thành
            </span>
          </div>
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
          <h4>LIÊN HỆ ĐẶT PHÒNG</h4>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Thung lũng Ngọc Linh, Trại Mới, Tiến Xuân, Thạch Thất, Hà Nội
          </p>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
            0869 544 586 - Cô Hải
          </p>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            thungsimngoclinh@gmail.com
          </p>
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            Nhà ba gian.
          </p>
        </div>
      </div>

      <div className="home-footer-bottom">
        <p>© 2026 Nhà Ba Gian - Garden Villa in Tiến Xuân. All rights reserved.</p>
      </div>
    </footer>
  )
}

function FloatingVoucherCard() {
  const [vouchers, setVouchers] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('homeVoucherPromoClosed') === '1')
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    if (hidden) return undefined
    let active = true
    fetch(`${API_BASE_URL}/vouchers/active`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (active) setVouchers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setVouchers([])
      })
    return () => { active = false }
  }, [hidden])

  useEffect(() => {
    if (vouchers.length <= 1) return undefined
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % vouchers.length)
      setCopiedCode('')
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [vouchers.length])

  if (hidden || vouchers.length === 0) return null

  const voucher = vouchers[activeIndex % vouchers.length]

  const closePromo = () => {
    sessionStorage.setItem('homeVoucherPromoClosed', '1')
    setHidden(true)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard?.writeText(voucher.code)
      setCopiedCode(voucher.code)
    } catch {
      setCopiedCode('')
    }
  }

  return (
    <aside className="home-voucher-float" aria-live="polite" aria-label="Ưu đãi đang diễn ra">
      <img src="/banner.png" alt="" aria-hidden="true" />
      <div className="home-voucher-overlay" />
      <button className="home-voucher-close" type="button" onClick={closePromo} aria-label="Đóng ưu đãi">×</button>
      <div className="home-voucher-content" key={voucher.id}>
        <span className="home-voucher-kicker">Ưu đãi hôm nay</span>
        <strong>Nhập mã {voucher.code}</strong>
        <p>{voucherDiscountText(voucher)}. {voucherConditionText(voucher)}</p>
        <button className="home-voucher-copy" type="button" onClick={copyCode}>
          {copiedCode === voucher.code ? 'Đã sao chép' : 'Sao chép mã'}
        </button>
      </div>
    </aside>
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
        <a className="home-logo" href="/home">Nhà Ba Gian</a>
        <nav className="home-nav" aria-label="Điều hướng chính">
          <a href="/home" className="home-nav-active">Trang chủ</a>
          <a href="/rooms">Phòng</a>
          <a href="/wishlist">Yêu thích</a>
          <a href="/amenities">Tiện nghi</a>
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
                  <a href="/admin">Quản lý Nhà Ba Gian</a>
                )}
                <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
                <a href="/booking-history" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/booking-history'); }}>Lịch sử đặt phòng</a>
                <a href="/profile" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/profile'); }}>Thông tin cá nhân</a>
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

      <section className="home-hero" aria-label="Nhà Ba Gian">
        <img src="/banner.png" alt="Không gian nghỉ dưỡng Nhà Ba Gian" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p>Nghỉ dưỡng cân bằng</p>
          <h1>Nhà Ba Gian</h1>
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
      <FloatingVoucherCard />
    </div>
  )
}

export default HomePage

