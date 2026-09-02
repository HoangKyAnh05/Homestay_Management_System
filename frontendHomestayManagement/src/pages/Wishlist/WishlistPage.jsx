import { useEffect, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './WishlistPage.css'

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
    '/home_1/image.png',   // index 0 -> roomTypeId 1 (Studio)
    '/home_2/image_1.jpg', // index 1 -> roomTypeId 2 (VIP Suite)
    '/home_3/image_3.jpg', // index 2 -> roomTypeId 3 (Deluxe)
    '/home_4/image_1.jpg', // index 3 -> roomTypeId 4 (Family)
    '/home_5/image_1.jpg'  // index 4 -> roomTypeId 5 (Connecting Room)
  ]
  const idNum = Math.max(1, Number(roomTypeId) || 1)
  const idx = (idNum - 1) % fallbacks.length
  return fallbacks[idx]
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
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Komorebi Sanctuary">✨ Komorebi 3D</a>
        <a href="/rooms">Phòng</a>
        <a href="/wishlist" className="home-nav-active">Yêu thích</a>
        <a href="/amenities">Tiện nghi</a>
        <a href="/home#contact">Liên hệ</a>
        <a href="/home#about">Giới thiệu</a>
      </nav>

      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            <UserAvatar user={currentUser} />
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
              <a href="/booking-history" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/booking-history'); }}>Lịch sử đặt phòng</a>
              <a href="/profile" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/profile'); }}>Thông tin cá nhân</a>
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

export default function WishlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = getStoredToken()

  useEffect(() => {
    if (!token) {
      window.location.assign('/login')
      return
    }

    fetch(`${API_BASE_URL}/customer/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách yêu thích')
        return Array.isArray(data) ? data : []
      })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleRemove = async (roomTypeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/wishlist/toggle/${roomTypeId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setItems((current) => current.filter((item) => item.roomTypeId !== roomTypeId))
      }
    } catch {
      // Error handling
    }
  }

  return (
    <div className="wishlist-page">
      <PublicHeader />
      <main className="wishlist-main">
        <section className="wishlist-heading">
          <div>
            <p>Tài khoản của tôi</p>
            <h1>Danh sách loại phòng yêu thích ❤️</h1>
          </div>
          <span>{items.length} loại phòng đã lưu</span>
        </section>

        {loading ? (
          <div className="wishlist-state">Đang tải danh sách yêu thích...</div>
        ) : error ? (
          <div className="wishlist-state wishlist-state--error">{error}</div>
        ) : items.length === 0 ? (
          <div className="wishlist-state">
            <p>Bạn chưa lưu loại phòng yêu thích nào.</p>
            <a href="/rooms" className="wishlist-browse-btn">Khám phá các loại phòng ngay</a>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((item) => (
              <article key={item.wishlistId} className="wishlist-card">
                <div className="wishlist-photo">
                  <img
                    src={resolveImageUrl(item.primaryImageUrl || item.imageUrls?.[0]) || getFallbackRoomImage(item.roomTypeName, item.roomTypeId)}
                    alt={houseTypeName(item)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFallbackRoomImage(item.roomTypeName, item.roomTypeId);
                    }}
                  />
                  <button
                    type="button"
                    className="wishlist-remove-heart"
                    title="Bỏ yêu thích"
                    onClick={() => handleRemove(item.roomTypeId)}
                  >
                    ❤️
                  </button>
                </div>

                <div className="wishlist-card-body">
                  <div className="wishlist-card-title">
                    <h3>{houseTypeName(item)}</h3>
                    <span>⭐ {item.averageRating || 5.0} ({item.totalReviews || 0})</span>
                  </div>
                  <p>{item.description || 'Không gian nghỉ dưỡng tiện nghi, ấm cúng.'}</p>
                  <div className="wishlist-card-meta">
                    <span>Sức chứa: {item.maxAdults} NL · {item.maxChildren} TE</span>
                  </div>
                  <div className="wishlist-card-actions">
                    <a href={`/rooms?roomTypeId=${item.roomTypeId}`} className="wishlist-book-btn">
                      Đặt ngay
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
