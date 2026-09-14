import React, { useState } from 'react';
import { getStoredUser, logout } from '../../services/authService';
import './ExploreHeader.css';

export default function ExploreHeader() {
  const currentUser = getStoredUser();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.assign('/home');
  };

  return (
    <header className="explore-header" role="banner">
      <div className="explore-header-inner">
        {/* Brand Logo */}
        <a href="/home" className="explore-logo" title="Lá Đỏ Homestay & Coffee">
          <span className="explore-logo-leaf">🍁</span>
          <div className="explore-logo-text">
            <span className="explore-brand-title">Lá Đỏ</span>
            <span className="explore-brand-subtitle">HOMESTAY & COFFEE</span>
          </div>
        </a>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="explore-mobile-toggle"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-label={isMobileNavOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
          aria-expanded={isMobileNavOpen}
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        {/* Desktop Navigation */}
        <nav className={`explore-nav ${isMobileNavOpen ? 'is-open' : ''}`} aria-label="Điều hướng chính">
          <a href="/home" className="explore-nav-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Trang chủ</span>
          </a>

          <a href="/rooms" className="explore-nav-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <span>Phòng & Giá</span>
          </a>

          <a href="/explore" className="explore-nav-link explore-nav-link--active" aria-current="page">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span>Khám phá xung quanh</span>
          </a>

          <a href="/landing" className="explore-nav-link explore-nav-link--3d" title="Khám phá không gian 3D Sanctuary">
            <span>🍁 Lá Đỏ 3D</span>
          </a>

          <a href="/home#reviews" className="explore-nav-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Đánh giá</span>
          </a>

          <a href="/home#about" className="explore-nav-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Liên hệ</span>
          </a>
        </nav>

        {/* Header Right Actions */}
        <div className="explore-header-actions">
          <div className="explore-lang-pill" title="Ngôn ngữ: Tiếng Việt">
            <span className="flag-vn">🇻🇳</span>
            <span>VN</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <a href="/rooms" className="explore-btn-book">
            <span>Đặt phòng</span>
          </a>

          {/* User Account / Profile */}
          {currentUser ? (
            <div className="explore-user-menu">
              <button
                type="button"
                className="explore-user-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
              >
                <div className="explore-avatar-circle">
                  {(currentUser.fullName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="explore-user-name">{currentUser.fullName || currentUser.email}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="explore-user-dropdown" role="menu">
                  {currentUser.role === 'ROLE_ADMIN' && (
                    <a href="/admin" role="menuitem">Quản lý Lá Đỏ Homestay</a>
                  )}
                  <a href="/wishlist" role="menuitem">Danh sách yêu thích</a>
                  <a href="/vouchers" role="menuitem">Kho mã giảm giá</a>
                  <a href="/booking-history" role="menuitem">Lịch sử đặt phòng</a>
                  <a href="/profile" role="menuitem">Thông tin cá nhân</a>
                  <button type="button" onClick={handleLogout} role="menuitem">Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="explore-btn-login">
              <span>Đăng nhập</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
