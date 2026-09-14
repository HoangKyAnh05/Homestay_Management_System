import React, { useState } from 'react'
import './FloatingContactWidget.css'

export default function FloatingContactWidget() {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const phone = '0941186699'
  const zaloUrl = `https://zalo.me/${phone}`
  const facebookPageUrl = 'https://www.facebook.com/ladohomestay'

  return (
    <aside className={`floating-contact-widget ${mobileExpanded ? 'is-expanded' : ''}`} aria-label="Liên hệ nhanh Lá Đỏ Homestay">
      {/* Mobile Toggle Trigger Button */}
      <button
        type="button"
        className="fcw-mobile-trigger"
        onClick={() => setMobileExpanded((prev) => !prev)}
        aria-label={mobileExpanded ? 'Đóng menu liên hệ' : 'Mở liên hệ nhanh'}
      >
        {mobileExpanded ? (
          <span className="fcw-trigger-close">×</span>
        ) : (
          <>
            <div className="fcw-pulse-ring"></div>
            <svg viewBox="0 0 24 24" className="fcw-icon" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </>
        )}
      </button>

      {/* Buttons List */}
      <div className="fcw-buttons-list">
        {/* Nút Khám Phá Xung Quanh Lá Đỏ (Bản đồ Sa Pa tương tác) */}
        <a
          href="/explore"
          className="fcw-btn fcw-btn--explore fcw-btn--blinking"
          aria-label="Khám phá bản đồ xung quanh Lá Đỏ"
          title="Khám phá xung quanh Lá Đỏ Homestay"
        >
          <div className="fcw-pulse-ring fcw-pulse-ring--explore"></div>
          <span className="fcw-tooltip">Khám phá xung quanh Lá Đỏ</span>
          <svg viewBox="0 0 24 24" className="fcw-icon fcw-explore-icon-svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
        </a>

        {/* Nút Facebook Fanpage Lá Đỏ (Nhấp nháy & Chuyển hướng) */}
        <a
          href={facebookPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fcw-btn fcw-btn--facebook fcw-btn--blinking"
          aria-label="Truy cập Fanpage Facebook Lá Đỏ Homestay"
          title="Fanpage Facebook: Lá Đỏ Homestay"
        >
          <div className="fcw-pulse-ring fcw-pulse-ring--facebook"></div>
          <span className="fcw-tooltip">Fanpage Facebook: Lá Đỏ Homestay</span>
          <svg viewBox="0 0 24 24" className="fcw-icon fcw-facebook-svg" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* Nút Zalo */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fcw-btn fcw-btn--zalo"
          aria-label="Chat qua Zalo"
          title="Zalo: 0941.186.699"
        >
          <div className="fcw-pulse-ring fcw-pulse-ring--zalo"></div>
          <span className="fcw-tooltip">Zalo: 0941.186.699</span>
          <span className="fcw-zalo-text">Zalo</span>
        </a>

        {/* Nút Hotline Gọi Điện */}
        <a
          href={`tel:${phone}`}
          className="fcw-btn fcw-btn--phone"
          aria-label="Gọi điện hotline Lá Đỏ Homestay"
          title="Hotline: 0941.186.699"
        >
          <div className="fcw-pulse-ring"></div>
          <div className="fcw-pulse-ring fcw-pulse-ring--delay"></div>
          <span className="fcw-tooltip">Hotline: 0941.186.699</span>
          <svg viewBox="0 0 24 24" className="fcw-icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </a>
      </div>
    </aside>
  )
}
