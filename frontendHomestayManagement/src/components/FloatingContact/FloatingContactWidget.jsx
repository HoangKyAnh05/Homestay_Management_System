import React from 'react'
import './FloatingContactWidget.css'

export default function FloatingContactWidget() {
  const phone = '0941186699'
  const zaloUrl = `https://zalo.me/${phone}`
  const fbUrl = 'https://www.facebook.com/ladohomestaysapa'

  return (
    <aside className="floating-contact-widget" aria-label="Liên hệ nhanh Lá Đỏ Homestay">
      {/* Nút Facebook Messenger */}
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fcw-btn fcw-btn--facebook"
        aria-label="Liên hệ qua Facebook Messenger"
      >
        <span className="fcw-tooltip">Facebook Lá Đỏ</span>
        <svg viewBox="0 0 24 24" className="fcw-icon" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.51 3.736 7.15V22l3.433-1.884c.907.251 1.867.388 2.831.388 5.523 0 10-4.145 10-9.246C22 6.145 17.523 2 12 2zm1.066 12.457l-2.724-2.906-5.313 2.906 5.845-6.205 2.787 2.906 5.25-2.906-5.845 6.205z" />
        </svg>
      </a>

      {/* Nút Zalo */}
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fcw-btn fcw-btn--zalo"
        aria-label="Chat qua Zalo"
      >
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
    </aside>
  )
}
