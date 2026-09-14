import React, { useState } from 'react';
import { ITINERARIES_DATA } from '../../data/places';
import './ItinerarySection.css';

// SVG Icon for stops
function StopIcon({ type }) {
  switch (type) {
    case 'coffee':
      return (
        <span className="stop-icon-bullet stop-icon--brown" title="Cafe">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          </svg>
        </span>
      );
    case 'sparkles':
      return (
        <span className="stop-icon-bullet stop-icon--orange" title="Vui chơi">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </span>
      );
    case 'utensils':
      return (
        <span className="stop-icon-bullet stop-icon--red" title="Ẩm thực">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v18M5 2v5a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2M8 2v18"></path>
          </svg>
        </span>
      );
    case 'home':
      return (
        <span className="stop-icon-bullet stop-icon--crimson" title="Lá Đỏ">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </span>
      );
    case 'shopping-bag':
      return (
        <span className="stop-icon-bullet stop-icon--pink" title="Mua sắm">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          </svg>
        </span>
      );
    default:
      return (
        <span className="stop-icon-bullet stop-icon--purple" title="Địa điểm">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </span>
      );
  }
}

export default function ItinerarySection() {
  const [activeModalItinerary, setActiveModalItinerary] = useState(null);

  return (
    <section className="itinerary-section" aria-labelledby="itinerary-section-title">
      <div className="itinerary-container">
        {/* Header */}
        <div className="itinerary-header">
          <div className="itinerary-title-wrap">
            <span className="itinerary-pin-icon" aria-hidden="true">📍</span>
            <h2 id="itinerary-section-title" className="itinerary-title">Gợi ý lịch trình theo thời gian</h2>
          </div>
          <span className="itinerary-sublink">Lịch trình tối ưu từ Lá Đỏ Homestay</span>
        </div>

        {/* 4 Cards Grid */}
        <div className="itinerary-grid">
          {ITINERARIES_DATA.map((item) => (
            <article key={item.id} className="itinerary-card">
              {/* Card Image Banner */}
              <div className="itinerary-card-img-wrap">
                <img src={item.image} alt={item.title} className="itinerary-card-img" loading="lazy" />
                <div className="itinerary-card-overlay"></div>
                <span className="itinerary-badge-time">{item.timeRange}</span>
              </div>

              {/* Card Content */}
              <div className="itinerary-card-body">
                <h3 className="itinerary-card-title">{item.title}</h3>
                <p className="itinerary-card-subtitle">{item.subtitle}</p>

                {/* Stops List */}
                <div className="itinerary-stops-list">
                  {item.stops.map((stop, sIdx) => (
                    <div key={sIdx} className="itinerary-stop-item">
                      <StopIcon type={stop.icon} />
                      <div className="itinerary-stop-text">
                        <strong className="itinerary-stop-name">{stop.name}</strong>
                        {stop.note && <span className="itinerary-stop-note">{stop.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Button */}
                <button
                  type="button"
                  className="itinerary-btn-action"
                  onClick={() => setActiveModalItinerary(item)}
                >
                  <span>{item.id === 'chi-co-3-tieng' ? 'Xem chi tiết lộ trình' : 'Xem lịch trình chi tiết'}</span>
                  <span className="itinerary-btn-arrow">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Itinerary Modal Detail */}
      {activeModalItinerary && (
        <div className="itinerary-modal-backdrop" onClick={() => setActiveModalItinerary(null)}>
          <div className="itinerary-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="itinerary-modal-close"
              onClick={() => setActiveModalItinerary(null)}
              aria-label="Đóng"
            >
              ✕
            </button>
            <div className="itinerary-modal-img-wrap">
              <img src={activeModalItinerary.image} alt={activeModalItinerary.title} />
              <div className="itinerary-modal-badge">{activeModalItinerary.timeRange}</div>
            </div>
            <div className="itinerary-modal-body">
              <h3 className="itinerary-modal-title">{activeModalItinerary.title}</h3>
              <p className="itinerary-modal-summary">{activeModalItinerary.summary}</p>
              
              <h4 className="itinerary-modal-step-title">Lộ trình chi tiết từng điểm:</h4>
              <div className="itinerary-modal-timeline">
                {activeModalItinerary.stops.map((stop, idx) => (
                  <div key={idx} className="itinerary-timeline-step">
                    <div className="itinerary-timeline-num">{idx + 1}</div>
                    <div className="itinerary-timeline-text">
                      <strong>{stop.name}</strong>
                      <p>{stop.note || 'Điểm dừng chân tham quan trải nghiệm'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="itinerary-modal-actions">
                <a
                  href="/rooms"
                  className="itinerary-modal-btn-book"
                >
                  🍁 Đặt phòng tại Lá Đỏ để bắt đầu chuyến đi
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
