import { useState } from 'react'
import HomeSearch from '../../components/HomeSearch/HomeSearch'
import { getStoredUser, logout } from '../../services/authService'
import './HomePage.css'

function HomePage() {
  const currentUser = getStoredUser()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <a className="home-logo" href="/home">
          Home Stays
        </a>
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
              onClick={() => setIsUserMenuOpen((current) => !current)}
            >
              <span className="home-user-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="5" />
                </svg>
              </span>
              <span>{currentUser.fullName || currentUser.email}</span>
              <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="home-user-dropdown">
                <a href="/profile">Thông tin cá nhân</a>
                <button type="button" onClick={handleLogout}>
                  Đăng xuất
                </button>
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
    </main>
  )
}

export default HomePage
