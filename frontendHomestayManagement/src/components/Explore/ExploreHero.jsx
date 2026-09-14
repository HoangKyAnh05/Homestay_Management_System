import React from 'react';
import './ExploreHero.css';

export default function ExploreHero() {
  return (
    <section className="explore-hero" aria-label="Khám phá Sa Pa xung quanh Lá Đỏ">
      <div className="explore-hero-bg">
        <img
          src="/landing/images/banner/anh-dep-sapa-hung-vi-ky-ao.webp"
          alt="Phong cảnh Sa Pa hùng vĩ quanh Lá Đỏ Homestay"
          loading="eager"
        />
        <div className="explore-hero-overlay"></div>
      </div>

      <div className="explore-hero-content">
        <div className="explore-hero-left">
          <div className="explore-hero-icon-title">
            <div className="explore-hero-pin" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="#e11d48">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h1 className="explore-hero-title">Khám phá xung quanh Lá Đỏ</h1>
          </div>
          <p className="explore-hero-subtitle">
            Những địa điểm vui chơi, ăn uống và tham quan hấp dẫn chỉ cách bạn vài phút!
          </p>
        </div>

        <div className="explore-hero-right">
          <span className="explore-hero-location-brand">Sapa</span>
          <p className="explore-hero-tagline">
            Không chỉ là một chuyến đi mà là một trải nghiệm...
          </p>
        </div>
      </div>
    </section>
  );
}
