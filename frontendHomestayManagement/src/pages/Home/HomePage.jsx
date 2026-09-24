import { useEffect, useMemo, useRef, useState } from 'react'
import HomeSearch from '../../components/HomeSearch/HomeSearch'
import { getStoredUser, getStoredToken, logout } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import { STAFF_ROLES, roleDefaultPath } from '../../utils/roleUtils'
import PolicyModal from '../../components/PolicyModal/PolicyModal'
import MiniMap from '../../components/MiniMap/MiniMap'
import ItinerarySection from '../../components/Explore/ItinerarySection'
import './HomePage.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

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
  const type = String(voucher.discountType || '').toUpperCase()
  if (type === 'PERCENT' || type === 'PERCENTAGE') {
    return `giảm ${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}%`
  }
  return `giảm ${formatVoucherMoney(voucher.discountValue)}`
}

function voucherConditionText(voucher) {
  if (!voucher?.minOrderValue || Number(voucher.minOrderValue) <= 0) {
    return 'Áp dụng cho kỳ nghỉ của bạn tại Lá Đỏ Homestay.'
  }
  return `Cho đơn từ ${formatVoucherMoney(voucher.minOrderValue)}.`
}

function isWeekendDay(targetDate) {
  let date = null
  if (targetDate) {
    date = new Date(targetDate)
  } else {
    try {
      const params = new URLSearchParams(window.location.search)
      const checkInDate = params.get('checkInDate')
      if (checkInDate) {
        date = new Date(checkInDate)
      }
    } catch {}
  }
  if (!date || Number.isNaN(date.getTime())) {
    date = new Date()
  }
  const day = date.getDay()
  return day === 0 || day === 6
}

function roomPrice(room, targetDate) {
  if (!room) return 0
  const isWeekend = isWeekendDay(targetDate)

  if (isWeekend) {
    if (room.weekendPrice != null && Number(room.weekendPrice) > 0) {
      return Number(room.weekendPrice)
    }
    if (Array.isArray(room.prices) && room.prices.length > 0) {
      const weekendItem = room.prices.find(
        (p) => String(p.dayType || '').toUpperCase() === 'WEEKEND' && Number(p.price) > 0
      )
      if (weekendItem) return Number(weekendItem.price)
    }
  } else {
    if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) {
      return Number(room.weekdayPrice)
    }
    if (Array.isArray(room.prices) && room.prices.length > 0) {
      const weekdayItem = room.prices.find(
        (p) => String(p.dayType || '').toUpperCase() === 'WEEKDAY' && Number(p.price) > 0
      )
      if (weekdayItem) return Number(weekdayItem.price)
    }
  }

  if (room.price != null && Number(room.price) > 0) return Number(room.price)
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) return Number(room.weekdayPrice)
  if (room.weekendPrice != null && Number(room.weekendPrice) > 0) return Number(room.weekendPrice)
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const validPrices = room.prices.map((p) => Number(p.price || 0)).filter((p) => p > 0)
    if (validPrices.length > 0) return Math.min(...validPrices)
  }
  return 0
}

function roomTypeIdOf(room) {
  return room.roomTypeId || room.id
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: '2 ngày 1 đêm',
    NIGHTLY: '2 ngày 1 đêm',
    BY_NIGHT: '2 ngày 1 đêm',
    DAILY: '2 ngày 1 đêm',
    BY_DAY: '2 ngày 1 đêm',
    HOURLY: 'giờ',
    COMBO: 'lượt',
  }
  return labels[String(rentType || '').toUpperCase()] || '2 ngày 1 đêm'
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
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const activeRooms = list.filter((r) => {
          if (String(r.status || '').toUpperCase() === 'MAINTENANCE') return false
          return true
        })
        setRooms(activeRooms)
      })
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
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?redirect=${returnUrl}`)
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

  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef(null)

  const handleStartHold = () => {
    if (!room.videoUrl) return
    setIsVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleEndHold = () => {
    if (!room.videoUrl) return
    setIsVideoPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const isMaintenance = String(room.status || '').toUpperCase() === 'MAINTENANCE'
  const isSoldOut = room.availableRooms != null && Number(room.availableRooms) <= 0
  const isBooked = isSoldOut || String(room.status || '').toUpperCase() === 'BOOKED' || String(room.status || '').toUpperCase() === 'OCCUPIED'
  const isAvailable = !isMaintenance && !isBooked

  return (
    <article className="room-card">
      <div
        className="room-card-img"
        onMouseEnter={handleStartHold}
        onMouseLeave={handleEndHold}
        onPointerDown={handleStartHold}
        onPointerUp={handleEndHold}
        onTouchStart={handleStartHold}
        onTouchEnd={handleEndHold}
        style={{ position: 'relative', overflow: 'hidden', cursor: room.videoUrl ? 'pointer' : 'default' }}
      >
        <img
          src={resolveImageUrl(room.primaryImageUrl) || getFallbackRoomImage(title, roomTypeId)}
          alt={title}
          loading="lazy"
          style={{ opacity: isVideoPlaying ? 0 : 1, transition: 'opacity 0.3s ease' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getFallbackRoomImage(title, roomTypeId);
          }}
        />
        {room.videoUrl && (
          <video
            ref={videoRef}
            src={resolveImageUrl(room.videoUrl)}
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isVideoPlaying ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        <span className="room-card-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {room.averageRating ? Number(room.averageRating).toFixed(1) : '5.0'}
        </span>
        <button
          type="button"
          className={`public-room-heart-btn${isLiked ? ' is-liked' : ''}`}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, border: 0, borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', background: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
          title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          onClick={toggleHeart}
          aria-label={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          {isLiked ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#ef4444" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          )}
        </button>
      </div>
      <div className="room-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="room-card-meta">
          <span>{room.maxAdults || 0} người lớn · {room.maxChildren || 0} trẻ em</span>
          {Number.isFinite(Number(room.availableRooms)) && (
            <span className={Number(room.availableRooms) <= 0 ? 'is-out-of-stock' : ''}>
              {Number(room.availableRooms) <= 0 ? 'Còn 0 phòng' : `Còn ${room.availableRooms} phòng`}
            </span>
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
            disabled={!isAvailable}
            onClick={() => isAvailable && window.location.assign(buildBookingUrl(room, criteria))}
            style={!isAvailable ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.8 } : undefined}
          >
            {isMaintenance ? 'Đang bảo trì' : isBooked ? 'Đã kín lịch' : criteria ? 'Đặt phòng' : 'Xem phòng'}
          </button>
        </div>
      </div>
    </article>
  )
}

function SearchResultsSection({ criteria, rooms, loading, error, maxPrice, onMaxPriceChange }) {
  const highestPrice = useMemo(() => {
    const validPrices = rooms.map(room => roomPrice(room)).filter(p => p > 0)
    const max = validPrices.length > 0 ? Math.max(...validPrices) : 0
    if (max <= 0) return 5000000
    const rounded = Math.ceil(max / 1000000) * 1000000
    return Math.max(rounded, 5000000)
  }, [rooms])

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (String(room.status || '').toUpperCase() === 'MAINTENANCE') return false
        return roomPrice(room) <= maxPrice
      })
      .sort((a, b) => roomPrice(a) - roomPrice(b))
  }, [rooms, maxPrice])

  if (!criteria && !loading && !error) return null

  const pricePresets = [
    { label: 'Tất cả', value: highestPrice },
    { label: '≤ 1tr', value: 1000000 },
    { label: '≤ 2tr', value: 2000000 },
    { label: '≤ 3tr', value: 3000000 },
    { label: '≤ 5tr', value: 5000000 },
  ]

  return (
    <section className="home-section search-results-section" id="search-results">
      <div className="home-section-inner">
        <div className="home-section-head">
          <div>
            <h2>Loại phòng còn trống</h2>
            <p>
              {criteria
                ? `Từ ${criteria.checkInDate} đến ${criteria.checkOutDate} · ${criteria.adults} người lớn · ${criteria.rooms} phòng`
                : 'Kết quả tìm kiếm theo loại phòng.'}
            </p>
          </div>
          <span className="search-result-count">{visibleRooms.length} loại phòng</span>
        </div>

        <div className="search-results-layout">
          <aside className="search-filter-panel">
            <div className="search-filter-head">
              <strong>Lọc theo giá</strong>
              <span>{maxPrice >= highestPrice ? 'Tất cả mức giá' : `Tối đa: ${formatPrice(maxPrice)}`}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {pricePresets.map((preset) => {
                const isActive = preset.value === highestPrice ? maxPrice >= highestPrice : maxPrice === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onMaxPriceChange(preset.value)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #1f4328' : '1px solid #cbd5e1',
                      background: isActive ? '#1f4328' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            <input
              type="range"
              min="0"
              max={highestPrice}
              step="500000"
              value={Math.min(maxPrice, highestPrice)}
              onChange={event => onMaxPriceChange(Number(event.target.value))}
            />
            <div className="search-filter-range" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              <span>0đ</span>
              <span>1tr</span>
              <span>2tr</span>
              <span>3tr</span>
              <span>{highestPrice >= 5000000 ? `${highestPrice / 1000000}tr` : formatPrice(highestPrice)}</span>
            </div>
          </aside>

          <div className="search-results-content">
            {loading ? (
              <div className="rooms-loading">Đang tìm loại phòng còn trống...</div>
            ) : error ? (
              <div className="rooms-loading rooms-loading--error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="rooms-grid search-results-grid">
                {visibleRooms.map(room => <RoomCard key={room.roomTypeId || room.id} room={room} criteria={criteria} />)}
              </div>
            ) : (
              <div className="rooms-loading">Không có loại phòng đủ số lượng và sức chứa trong thời gian này.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function RoomsSection({ rooms, loading }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth >= 1024) return 3
    if (window.innerWidth >= 640) return 2
    return 1
  })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleCount(3)
      } else if (window.innerWidth >= 640) {
        setVisibleCount(2)
      } else {
        setVisibleCount(1)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const safeRooms = useMemo(() => {
    return (Array.isArray(rooms) ? rooms : []).filter((room) => {
      if (String(room.status || '').toUpperCase() === 'MAINTENANCE') return false
      return true
    })
  }, [rooms])

  const maxIndex = Math.max(0, safeRooms.length - visibleCount)

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex)
    }
  }, [maxIndex, currentIndex])

  // Tự động lướt sang phòng tiếp theo chậm rãi và siêu mượt (1.25s glide)
  useEffect(() => {
    if (isPaused || maxIndex <= 0) return undefined
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, maxIndex])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  return (
    <section className="home-section home-rooms" id="rooms" aria-labelledby="rooms-title">
      <div className="home-section-inner home-rooms-container max-w-7xl mx-auto px-6">
        <div className="home-section-head">
          <div>
            <h2 id="rooms-title">Loại phòng nổi bật</h2>
            <p>Không gian nghỉ dưỡng được chọn lọc dành cho bạn.</p>
          </div>
          <a href="/rooms" className="home-view-all">Xem tất cả loại phòng →</a>
        </div>

        {loading ? (
          <div className="rooms-loading">Đang tải...</div>
        ) : safeRooms.length === 0 ? (
          <div className="rooms-loading">Chưa có phòng để hiển thị.</div>
        ) : (
          <div
            className="rooms-slider-shell"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {safeRooms.length > visibleCount && (
              <button
                type="button"
                className="rooms-slider-btn rooms-slider-btn--prev"
                onClick={handlePrev}
                aria-label="Xem phòng trước"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div className="rooms-slider-viewport">
              <div
                className="rooms-slider-track"
                style={{
                  '--visible-count': visibleCount,
                  transform: `translateX(calc(-${currentIndex} * ((100% - (24px * (${visibleCount} - 1))) / ${visibleCount} + 24px)))`,
                }}
              >
                {safeRooms.map((room) => (
                  <div className="rooms-slider-item" key={room.id || room.roomTypeId}>
                    <RoomCard room={room} />
                  </div>
                ))}
              </div>
            </div>

            {safeRooms.length > visibleCount && (
              <button
                type="button"
                className="rooms-slider-btn rooms-slider-btn--next"
                onClick={handleNext}
                aria-label="Xem phòng tiếp theo"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {maxIndex > 0 && (
              <div className="rooms-slider-dots">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`rooms-slider-dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Trang ${idx + 1}`}
                  />
                ))}
              </div>
            )}
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

// Section: Giới thiệu Vị trí & Bản đồ Khám phá Xung quanh Lá Đỏ
function KomorebiSanctuarySection() {
  return (
    <section className="home-section komorebi-showcase-section" aria-label="Bản đồ khám phá Lá Đỏ Homestay">
      <div className="home-section-inner">
        <div className="komorebi-showcase-card" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '2.5rem', alignItems: 'center', padding: '2.5rem', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
          <div className="komorebi-showcase-content" style={{ padding: 0 }}>
            <div className="komorebi-badge" style={{ background: 'rgba(21, 87, 58, 0.08)', border: '1px solid rgba(21, 87, 58, 0.2)', color: '#15573a' }}>
              <span className="komorebi-badge-dot" style={{ background: '#15573a' }} />
              <span>✦ VỊ TRÍ ĐẮC ĐỊA • 31A HOÀNG LIÊN, SA PA</span>
            </div>
            <h2 className="komorebi-title" style={{ fontSize: '2rem', color: '#15191f', margin: '0.6rem 0' }}>
              <span className="komorebi-kanji" style={{ color: '#e11d48' }}>🍁</span>
              <span>Lá Đỏ Homestay & Coffee</span>
            </h2>
            <p className="komorebi-desc" style={{ fontSize: '0.925rem', lineHeight: '1.65', color: '#4b5563', margin: '0 0 1.25rem' }}>
              Tọa lạc tại vị trí trung tâm thị trấn Sa Pa, Lá Đỏ Homestay & Coffee là điểm xuất phát lý tưởng giúp bạn dễ dàng kết nối tới Nhà thờ Đá, Quảng trường Sa Pa, Cáp treo Fansipan, Bản Cát Cát và những quán cafe săn mây tuyệt đẹp.
            </p>
            <div className="komorebi-features-list" style={{ marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="komorebi-pill" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>📍 31A Hoàng Liên, Sa Pa</span>
              <span className="komorebi-pill" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>🚶 5 phút đi bộ ra Nhà thờ Đá</span>
              <span className="komorebi-pill" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>☕ Cafe ngắm thung lũng mây</span>
              <span className="komorebi-pill" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>🚗 Đón trả xe tận nơi</span>
            </div>
            <div className="komorebi-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a href="/explore" className="komorebi-cta-btn" style={{ background: 'linear-gradient(135deg, #15573a, #1f4328)', color: '#ffffff', padding: '0.75rem 1.4rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(21, 87, 58, 0.3)' }}>
                <span>🗺️ Khám Phá Xung Quanh</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="/rooms" className="komorebi-ghost-btn" style={{ padding: '0.75rem 1.4rem', border: '1.5px solid #d1d5db', borderRadius: '9999px', color: '#374151', textDecoration: 'none', fontWeight: 600 }}>
                Xem phòng nghỉ dưỡng
              </a>
            </div>
          </div>

          <div className="komorebi-minimap-wrap" style={{ width: '100%', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <MiniMap height="340px" showExpandBtn={true} />
          </div>
        </div>
      </div>
    </section>
  )
}

// Section: Đánh giá khách hàng (Đồng bộ dữ liệu thật)
function ReviewsSection() {
  const [realReviews, setRealReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/reviews/featured`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const approved = data.filter((r) => (r.status || 'APPROVED').toUpperCase() !== 'HIDDEN')
          setRealReviews(approved)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false))
  }, [])

  const displayReviews = useMemo(() => {
    if (realReviews.length > 0) {
      return realReviews.slice(0, 3).map((r) => {
        const name = r.customerName || 'Khách lưu trú'
        const initials = name.split(' ').map((w) => w[0]).join('').slice(-2).toUpperCase() || 'KH'
        return {
          id: r.reviewId,
          initials,
          avatar: r.customerAvatar,
          name,
          role: 'Du khách trải nghiệm thực tế',
          stay: r.roomTypeName ? `Nghỉ tại ${r.roomTypeName}` : 'Nghỉ tại Lá Đỏ Homestay',
          title: `Đánh giá ${r.ratingStars || 5}★ cho ${r.roomTypeName || 'Homestay'}`,
          text: `“${r.comment || 'Trải nghiệm tuyệt vời tại Lá Đỏ Homestay!'}”`,
          ratingStars: r.ratingStars || 5,
          imageUrls: r.imageUrls || [],
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '',
        }
      })
    }

    return [
      {
        id: 'fb1',
        initials: 'TT',
        name: 'Nguyễn Thanh Tùng',
        role: 'Kiến trúc sư • Hà Nội',
        stay: 'Nghỉ tại Nhà 7 · 3 ngày 2 đêm',
        title: 'Không gian tĩnh tại vượt mong đợi',
        text: '“Không gian tuyệt đẹp, phòng rộng rãi và sạch sẽ từng góc nhỏ. Buổi sáng mở cửa ban công thấy sương sớm bảng lảng luồn qua ngọn thông, cảm giác bình yên đến lạ. Chắc chắn tôi sẽ quay lại cùng gia đình.”',
        ratingStars: 5,
        imageUrls: [],
      },
      {
        id: 'fb2',
        initials: 'MA',
        name: 'Trần Thị Mai Anh',
        role: 'Nhiếp ảnh gia • TP. Hồ Chí Minh',
        stay: 'Nghỉ tại Nhà VIP · 2 ngày 1 đêm',
        title: 'Khoảnh khắc săn mây tuyệt diệu',
        text: '“View từ ban công ngắm bình minh và sương mờ trên thung lũng thực sự ngoạn mục. Đồ ăn sáng bản địa tươi ngon, nhân viên ấm áp chu đáo như người nhà. Một trải nghiệm chữa lành tâm hồn đúng nghĩa!”',
        ratingStars: 5,
        imageUrls: [],
      },
      {
        id: 'fb3',
        initials: 'MĐ',
        name: 'Lê Minh Đức',
        role: 'Kinh doanh tự do • Đà Nẵng',
        stay: 'Nghỉ tại Nhà 1 · 4 ngày 3 đêm',
        title: 'Ấm cúng như trở về ngôi nhà thứ hai',
        text: '“Homestay ấm cúng, thiết kế gỗ kết hợp đá bazan rất sang trọng mà vẫn gần gũi với thiên nhiên. Tắm suối khoáng thảo dược buổi tối giúp xua tan hết mệt mỏi. Giá cả hoàn toàn xứng đáng với chất lượng.”',
        ratingStars: 5,
        imageUrls: [],
      },
    ]
  }, [realReviews])

  const calculatedAvgRating = useMemo(() => {
    if (realReviews.length > 0) {
      const totalStars = realReviews.reduce((sum, r) => sum + (Number(r.ratingStars) || 5), 0)
      return (totalStars / realReviews.length).toFixed(1)
    }
    return '5.0'
  }, [realReviews])

  return (
    <section className="home-section home-reviews" aria-labelledby="reviews-title">
      <div className="home-section-inner">
        <div className="home-reviews-header">
          <div className="home-reviews-badge">
            <span className="badge-sparkle">✦</span>
            <span>TRẢI NGHIỆM THỰC TẾ TỪ DU KHÁCH</span>
          </div>
          <h2 id="reviews-title" className="home-reviews-heading">Những Câu Chuyện Thư Thái & Chữa Lành</h2>
          <p className="home-reviews-subtitle">
            Điểm đánh giá thực tế: <strong>★ {calculatedAvgRating}/5.0</strong> từ {realReviews.length > 0 ? realReviews.length : 'hàng trăm'} du khách thực tế đã lưu trú tại Lá Đỏ Homestay Sa Pa.
          </p>
        </div>

        <div className="reviews-grid">
          {displayReviews.map((r) => (
            <div key={r.id || r.name} className="home-review-card">
              <div className="review-card-top">
                <div className="review-stars" aria-label={`${r.ratingStars} sao`}>
                  {Array.from({ length: r.ratingStars || 5 }).map((_, index) => (
                    <svg key={index} viewBox="0 0 24 24" aria-hidden="true" fill="#f59e0b" stroke="#f59e0b" width="18" height="18">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="review-verified-badge">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Đã lưu trú {r.createdAt ? `· ${r.createdAt}` : ''}
                </span>
              </div>

              <h3 className="review-card-title">{r.title}</h3>
              <p className="review-card-text">{r.text}</p>

              {r.imageUrls && r.imageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {r.imageUrls.map((imgUrl, i) => (
                    <img
                      key={i}
                      src={resolveImageUrl(imgUrl)}
                      alt="Ảnh đánh giá thực tế"
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                  ))}
                </div>
              )}

              <div className="review-author">
                {r.avatar ? (
                  <img
                    src={resolveImageUrl(r.avatar)}
                    alt={r.name}
                    className="review-avatar-img"
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }}
                  />
                ) : (
                  <div className="review-avatar-initials">{r.initials}</div>
                )}
                <div className="review-author-info">
                  <strong className="review-author-name">{r.name}</strong>
                  <span className="review-author-role">{r.role}</span>
                  <span className="review-stay-pill">{r.stay}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FALLBACK_GALLERY = [
  '/home_1/image.png',
  '/home_1/image_2.jpg',
  '/home_2/image_1.jpg',
  '/home_2/image_2.jpg',
  '/home_3/image_3.jpg',
  '/home_4/image_1.jpg',
  '/home_4/image_2.jpg',
  '/home_5/image_1.jpg',
  '/home_5/image_2.jpg',
]

// Section: Gallery ảnh
function GallerySection({ rooms }) {
  const roomImages = (rooms || []).flatMap((r) => r.imageUrls || [r.primaryImageUrl]).filter(Boolean)
  const rawList = [...new Set([...roomImages, ...FALLBACK_GALLERY])].slice(0, 9)

  return (
    <section className="home-gallery" aria-label="Thư viện ảnh">
      <div className="home-section-inner">
        <div className="gallery-grid">
          {rawList.map((url, i) => (
            <div key={i} className="gallery-item">
              <img
                src={resolveImageUrl(url) || FALLBACK_GALLERY[i % FALLBACK_GALLERY.length]}
                alt={`Ảnh homestay ${i + 1}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = FALLBACK_GALLERY[i % FALLBACK_GALLERY.length]
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer
function HomeFooter() {
  const [policyModal, setPolicyModal] = useState({ open: false, tab: 'terms' })

  const openPolicy = (tabKey) => {
    setPolicyModal({ open: true, tab: tabKey })
  }

  return (
    <>
      <footer className="home-footer" id="about">
        <div id="footpage" style={{ position: 'relative', top: '-70px' }} />
        <div id="contact" style={{ position: 'relative', top: '-70px' }} />
        <div className="home-footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-header">
              <h3>Lá Đỏ Homestay</h3>
              <span className="footer-brand-tag">Mountain & Cloud Retreat in Sa Pa</span>
            </div>
            <p className="footer-brand-desc">
              Nằm nép mình bên triền núi Hoàng Liên Sơn với tầm nhìn ôm trọn thung lũng Mường Hoa bồng bềnh mây trắng. Chốn dừng chân mộc mạc, bình yên giữa lòng Sa Pa sương mờ.
            </p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram" className="footer-social-btn">
                <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://www.facebook.com/ladohomestay" target="_blank" rel="noreferrer" aria-label="Facebook Fanpage" title="Facebook Fanpage Lá Đỏ Homestay" className="footer-social-btn">
                <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="Youtube" title="Youtube" className="footer-social-btn">
                <svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/></svg>
              </a>
              <a href="mailto:ladohomestaysapa@gmail.com" aria-label="Mail" title="Gửi Email" className="footer-social-btn">
                <svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
              <a
                href={import.meta.env.VITE_DEPLOY_URL || 'https://reminder-strife-awoke.ngrok-free.dev'}
                target="_blank"
                rel="noreferrer"
                aria-label="Deploy Link Co Dinh"
                title="Truy cập hệ thống Online (Link Cố Định Vĩnh Viễn)"
                className="footer-social-btn footer-deploy-btn"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  <polyline points="13 11 9 16 13 16 11 21 17 14 13 14 14 11" />
                </svg>
                <span className="deploy-pulse" title="Trạng thái: Trực tuyến (Link Cố Định Vĩnh Viễn)" />
              </a>
            </div>
          </div>

          <div className="footer-col footer-col-location">
            <h4 className="footer-col-title">Vị Trí & Di Chuyển</h4>
            <div className="footer-location-address">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Số 031 Hoàng Liên, Phường Sa Pa, Thị xã Sa Pa, Lào Cai</span>
            </div>
            <div className="footer-location-stats">
              <div className="footer-stat-item">
                <span className="stat-emoji">📍</span>
                <div className="stat-info">
                  <strong>1.2 km</strong>
                  <span>Cách Nhà thờ đá Sa Pa</span>
                </div>
              </div>
              <div className="footer-stat-item">
                <span className="stat-emoji">🚕</span>
                <div className="stat-info">
                  <strong>5 phút</strong>
                  <span>Thời gian lái xe / taxi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-col footer-col-links">
            <h4 className="footer-col-title">Chính Sách & Quy Định</h4>
            <ul className="footer-nav-list">
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openPolicy('terms')}>
                  Điều khoản đặt phòng
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openPolicy('privacy')}>
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openPolicy('cancellation')}>
                  Chính sách hủy phòng
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => openPolicy('checkin')}>
                  Hướng dẫn nhận & trả phòng
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-col footer-col-contact">
            <h4 className="footer-col-title">Liên Hệ Đặt Phòng</h4>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
                </span>
                <div className="contact-info-text">
                  <span className="contact-label">Hotline tư vấn</span>
                  <a href="tel:0941186699" className="contact-value contact-value-highlight">0941 186 699 (Lễ tân Sa Pa)</a>
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <div className="contact-info-text">
                  <span className="contact-label">Email hỗ trợ</span>
                  <a href="mailto:ladohomestaysapa@gmail.com" className="contact-value">ladohomestaysapa@gmail.com</a>
                </div>
              </div>

              <div className="footer-contact-item">
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </span>
                <div className="contact-info-text">
                  <span className="contact-label">Facebook Fanpage</span>
                  <a href="https://www.facebook.com/ladohomestay" target="_blank" rel="noreferrer" className="contact-value">Lá Đỏ Homestay Sa Pa</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          <div className="home-footer-bottom-inner">
            <p>© 2026 Lá Đỏ Homestay - Mountain & Cloud Retreat in Sa Pa. All rights reserved.</p>
            <div className="footer-bottom-badge">
              <span className="status-dot"></span>
              <span>Hệ thống đặt phòng trực tuyến 24/7</span>
            </div>
          </div>
        </div>
      </footer>

      <PolicyModal
        isOpen={policyModal.open}
        initialTab={policyModal.tab}
        onClose={() => setPolicyModal({ open: false, tab: 'terms' })}
      />
    </>
  )
}

function FloatingVoucherCard() {
  return null
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

  const [activeNav, setActiveNav] = useState(() => (
    typeof window !== 'undefined' && ['#about', '#footpage', '#contact'].includes(window.location.hash) ? 'about' : 'home'
  ))

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash
      if (['#about', '#footpage', '#contact'].includes(hash)) {
        setActiveNav('about')
        setTimeout(() => {
          const target = document.getElementById('about') || document.getElementById('footpage')
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      } else if (!hash || hash === '#' || hash === '#home') {
        setActiveNav('home')
      }
    }

    checkHash()
    window.addEventListener('hashchange', checkHash)

    const handleScroll = () => {
      const aboutEl = document.getElementById('about')
      if (aboutEl) {
        const rect = aboutEl.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.65) {
          setActiveNav('about')
          return
        }
      }
      if (window.scrollY < 350) {
        setActiveNav('home')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('hashchange', checkHash)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

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
      const validPrices = results.map(room => roomPrice(room)).filter(p => p > 0)
      const highest = validPrices.length > 0 ? Math.max(...validPrices) : 0
      const maxCalculated = highest > 0 ? Math.max(Math.ceil(highest / 1000000) * 1000000, 5000000) : 10000000
      setMaxPrice(maxCalculated)
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
        <a className="home-logo" href="/home">Lá Đỏ Homestay</a>
        <nav className="home-nav" aria-label="Điều hướng chính">
          <a
            href="/home"
            className={activeNav === 'home' ? 'home-nav-active' : ''}
            onClick={(e) => {
              e.preventDefault()
              setActiveNav('home')
              window.history.replaceState(null, '', '/home')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Trang chủ
          </a>
          <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Lá Đỏ Tour & Săn Mây">🍁 Lá Đỏ 3D Tour</a>
          <a href="/explore" className="home-nav-explore-link" title="Khám phá xung quanh Lá Đỏ Homestay & Sa Pa">Khám phá xung quanh</a>
          <a href="/rooms">Phòng</a>
          <a href="/stay" title="Dịch vụ dành cho khách đang lưu trú">Dịch vụ lưu trú</a>
          <a href="/wishlist">Yêu thích</a>
          <a href="/amenities">Tiện nghi</a>
          <a
            href="/giveaway"
            className="home-nav-lucky-wheel"
            title="Vòng quay may mắn - Nhận ưu đãi nghỉ dưỡng!"
            aria-label="Vòng quay may mắn"
          >
            <svg className="lucky-wheel-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="7.5" />
              <path d="M12 2.5v15M4.5 10h15M6.7 4.7l10.6 10.6M6.7 15.3l10.6-10.6" />
              <circle cx="12" cy="10" r="2" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M8 21.5l2.5-4h3l2.5 4" />
              <line x1="6" y1="21.5" x2="18" y2="21.5" />
            </svg>
          </a>

          <a
            href="#about"
            className={activeNav === 'about' ? 'home-nav-active' : ''}
            title="Giới thiệu Lá Đỏ Homestay"
            onClick={(e) => {
              e.preventDefault()
              setActiveNav('about')
              const target = document.getElementById('about') || document.getElementById('footpage')
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                window.history.replaceState(null, '', '#about')
              }
            }}
          >
            Giới thiệu
          </a>
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
                {STAFF_ROLES.has(currentUser?.role) && (
                  <a href={roleDefaultPath(currentUser.role)}>
                    {currentUser.role === 'ROLE_ADMIN' ? 'Quản lý Lá Đỏ Homestay' : 'Bàn làm việc vận hành'}
                  </a>
                )}
                <a href="/stay" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/stay'); }}>Dịch vụ lưu trú</a>
                <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
                <a href="/vouchers" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/vouchers'); }}>Kho mã giảm giá</a>
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

      <section className="home-hero" aria-label="Lá Đỏ Homestay">
        <img src="/banner.png" alt="Không gian nghỉ dưỡng Lá Đỏ Homestay" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p>Nghỉ dưỡng săn mây đỉnh Fansipan</p>
          <h1>Lá Đỏ Homestay</h1>
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
      <KomorebiSanctuarySection />
      <ItinerarySection isLandingPageMode={false} onSelectItinerary={() => window.location.assign('/explore')} />
      <ReviewsSection />
      <GallerySection rooms={rooms} />
      <HomeFooter />
      <FloatingVoucherCard />
    </div>
  )
}

export default HomePage

