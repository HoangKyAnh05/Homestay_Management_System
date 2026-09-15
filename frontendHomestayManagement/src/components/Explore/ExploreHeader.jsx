import React, { useState } from 'react';
import { getStoredUser, logout } from '../../services/authService';
import { resolveImageUrl } from '../../utils/imageUrl';
import './ExploreHeader.css';

function UserAvatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={resolveImageUrl(user.avatarUrl)} alt={user.fullName || 'User'} className="home-user-avatar-img" />;
  }
  const initial = (user?.fullName || user?.email || 'U').charAt(0).toUpperCase();
  return <span className="home-user-avatar-fallback">{initial}</span>;
}

export default function ExploreHeader() {
  const currentUser = getStoredUser();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.assign('/home');
  };

  return (
    <header className="home-header">
      <a className="home-logo" href="/home">Lá Đỏ Homestay</a>

      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Lá Đỏ Sanctuary">
          🍁 Lá Đỏ 3D
        </a>
        <a href="/explore" className="home-nav-active">
          Khám phá xung quanh
        </a>
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
        <a href="/home#about" title="Giới thiệu Lá Đỏ Homestay">
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
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isUserMenuOpen && (
            <div className="home-user-dropdown">
              {currentUser.role === 'ROLE_ADMIN' && (
                <a href="/admin">Quản lý Lá Đỏ Homestay</a>
              )}
              <a href="/stay" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/stay'); }}>
                Dịch vụ lưu trú
              </a>
              <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/wishlist'); }}>
                Danh sách yêu thích
              </a>
              <a href="/vouchers" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/vouchers'); }}>
                Kho mã giảm giá
              </a>
              <a href="/booking-history" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/booking-history'); }}>
                Lịch sử đặt phòng
              </a>
              <a href="/profile" onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); window.location.assign('/profile'); }}>
                Thông tin cá nhân
              </a>
              <button type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <a className="home-login" href="/login">
          Đăng nhập
        </a>
      )}
    </header>
  );
}
