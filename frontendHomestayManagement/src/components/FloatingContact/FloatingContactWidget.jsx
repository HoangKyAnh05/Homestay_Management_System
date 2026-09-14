import React, { useState } from 'react'
import './FloatingContactWidget.css'

export default function FloatingContactWidget() {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const phone = '0941186699'
  const zaloUrl = `https://zalo.me/${phone}`
  const fbUrl = 'https://www.facebook.com/ladohomestaysapa'

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
        {/* Nút Vòng Quay May Mắn */}
        <a
          href="/giveaway"
          className="fcw-btn fcw-btn--wheel"
          aria-label="Vòng quay may mắn trúng thưởng"
          title="Vòng quay may mắn nhận voucher"
        >
          <div className="fcw-pulse-ring fcw-pulse-ring--wheel"></div>
          <span className="fcw-tooltip">Vòng quay may mắn</span>
          <svg viewBox="0 0 24 24" className="fcw-icon fcw-wheel-icon-svg" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" stroke="#ffffff" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="2.8" fill="#fef08a" stroke="#ffffff" strokeWidth="1.2" />
            <line x1="12" y1="2.5" x2="12" y2="9.2" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="12" y1="14.8" x2="12" y2="21.5" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="2.5" y1="12" x2="9.2" y2="12" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="14.8" y1="12" x2="21.5" y2="12" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="5.28" y1="5.28" x2="10.02" y2="10.02" stroke="#fef08a" strokeWidth="1.4" />
            <line x1="13.98" y1="13.98" x2="18.72" y2="18.72" stroke="#fef08a" strokeWidth="1.4" />
            <line x1="5.28" y1="18.72" x2="10.02" y2="13.98" stroke="#fef08a" strokeWidth="1.4" />
            <line x1="13.98" y1="10.02" x2="18.72" y2="5.28" stroke="#fef08a" strokeWidth="1.4" />
            <circle cx="12" cy="3.8" r="0.9" fill="#fef08a" />
            <circle cx="12" cy="20.2" r="0.9" fill="#fef08a" />
            <circle cx="3.8" cy="12" r="0.9" fill="#fef08a" />
            <circle cx="20.2" cy="12" r="0.9" fill="#fef08a" />
          </svg>
        </a>

        {/* Nút Chat / Messenger Tư Vấn */}
        <button
          type="button"
          className="fcw-btn fcw-btn--facebook"
          aria-label="Nhắn tin tư vấn trực tiếp với Lá Đỏ Homestay"
          title="Nhắn tin tư vấn trực tiếp"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-customer-ai-chat'))
          }}
        >
          <div className="fcw-pulse-ring fcw-pulse-ring--facebook"></div>
          <span className="fcw-tooltip">Nhắn tin tư vấn</span>
          <svg viewBox="0 0 24 24" className="fcw-icon" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.51 3.736 7.15V22l3.433-1.884c.907.251 1.867.388 2.831.388 5.523 0 10-4.145 10-9.246C22 6.145 17.523 2 12 2zm1.066 12.457l-2.724-2.906-5.313 2.906 5.845-6.205 2.787 2.906 5.25-2.906-5.845 6.205z" />
          </svg>
        </button>

        {/* Nút Zalo */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fcw-btn fcw-btn--zalo"
          aria-label="Chat qua Zalo"
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
