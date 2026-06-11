import { useEffect, useState } from 'react'
import HomeSearch from '../../components/HomeSearch/HomeSearch'
import { getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import './HomePage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
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
function RoomCard({ room }) {
  return (
    <article className="room-card">
      <div className="room-card-img">
        {room.primaryImageUrl ? (
          <img src={resolveImageUrl(room.primaryImageUrl)} alt={room.name} loading="lazy" />
        ) : (
          <div className="room-card-img-placeholder" />
        )}
        <span className="room-card-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          4.9
        </span>
      </div>
      <div className="room-card-body">
        <h3>{room.name}</h3>
        <p>{room.description}</p>
        <div className="room-card-footer">
          <span className="room-card-price">
            {formatPrice(room.basePrice)}<small>/đêm</small>
          </span>
          <button className="room-card-btn" type="button">Đặt ngay</button>
        </div>
      </div>
    </article>
  )
}

function RoomsSection({ rooms, loading }) {

  return (
    <section className="home-section home-rooms" id="rooms" aria-labelledby="rooms-title">
      <div className="home-section-inner">
        <div className="home-section-head">
          <div>
            <h2 id="rooms-title">Phòng Nổi Bật</h2>
            <p>Không gian nghỉ dưỡng được chọn lọc dành cho bạn.</p>
          </div>
          <a href="#rooms" className="home-view-all">Xem tất cả phòng →</a>
        </div>

        {loading ? (
          <div className="rooms-loading">Đang tải...</div>
        ) : (
          <div className="rooms-grid">
            {rooms.slice(0, 3).map((room) => <RoomCard key={room.id} room={room} />)}
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
      title: 'Thiên Nhiên',
      desc: 'Đắm mình trong không gian xanh mát, yên bình giữa lòng thiên nhiên.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
      title: 'Hỗ Trợ 24/7',
      desc: 'Đội ngũ nhân viên tận tâm luôn sẵn sàng phục vụ mọi nhu cầu của bạn.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ),
      title: 'Đặt Phòng Nhanh',
      desc: 'Xác nhận đặt phòng ngay lập tức, không chờ đợi.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      ),
      title: 'Thanh Toán An Toàn',
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
        <h2 id="reviews-title">Khách Hàng Nói Gì</h2>
        <div className="reviews-grid">
          {reviews.map((r) => (
            <div key={r.name} className="review-card">
              <div className="review-stars" aria-label="5 sao">★★★★★</div>
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
            <li><a href="#rooms">Phòng &amp; Suites</a></li>
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
  const { rooms, loading } = useRoomTypes()

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <a className="home-logo" href="/home">Home Stays</a>
        <nav className="home-nav" aria-label="Điều hướng chính">
          <a href="/home">Trang Chủ</a>
          <a href="#rooms">Phòng</a>
          <a href="#amenities">Tiện Nghi</a>
          <a href="#contact">Liên Hệ</a>
          <a href="#about">Giới Thiệu</a>
        </nav>

        {currentUser ? (
          <div className="home-user-menu">
            <button
              className="home-user"
              type="button"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((c) => !c)}
            >
              <span className="home-user-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
              </span>
              <span>{currentUser.fullName || currentUser.email}</span>
              <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isUserMenuOpen && (
              <div className="home-user-dropdown">
                {currentUser.role === 'ROLE_ADMIN' && (
                  <a href="/admin">Quản lí Home Stays</a>
                )}
                <a href="/profile">Thông tin cá nhân</a>
                <button type="button" onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        ) : (
          <div className="home-actions">
            <a href="/login">Đăng Nhập</a>
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

      <HomeSearch />

      <RoomsSection rooms={rooms} loading={loading} />
      <FeaturesSection />
      <ReviewsSection />
      <GallerySection rooms={rooms} />
      <HomeFooter />
    </div>
  )
}

export default HomePage
