import React, { useState, useMemo } from 'react';
import { ITINERARIES_DATA, ITINERARY_VIBES, getGoogleMapsMultiStopUrl, getGoogleMapsPlaceUrl } from '../../data/places';
import './ItinerarySection.css';

// SVG Icon for stops
function StopIcon({ type }) {
  switch (type) {
    case 'coffee':
      return (
        <span className="stop-icon-bullet stop-icon--brown" title="Cafe">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          </svg>
        </span>
      );
    case 'sparkles':
      return (
        <span className="stop-icon-bullet stop-icon--orange" title="Vui chơi">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </span>
      );
    case 'utensils':
      return (
        <span className="stop-icon-bullet stop-icon--red" title="Ẩm thực">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v18M5 2v5a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2M8 2v18"></path>
          </svg>
        </span>
      );
    case 'home':
      return (
        <span className="stop-icon-bullet stop-icon--crimson" title="Lá Đỏ">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </span>
      );
    case 'shopping-bag':
      return (
        <span className="stop-icon-bullet stop-icon--pink" title="Mua sắm">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          </svg>
        </span>
      );
    case 'trees':
    case 'mountain':
      return (
        <span className="stop-icon-bullet stop-icon--green" title="Thiên nhiên">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 4 14 9 14 6 20 18 20 15 14 20 14 12 2"></polygon>
          </svg>
        </span>
      );
    default:
      return (
        <span className="stop-icon-bullet stop-icon--purple" title="Địa điểm">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </span>
      );
  }
}

export default function ItinerarySection({
  onSelectItinerary = () => {},
  activeItineraryId = null,
  isLandingPageMode = false,
}) {
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [activeModalItinerary, setActiveModalItinerary] = useState(null);

  // Custom Quick Planner State
  const [planTime, setPlanTime] = useState('half-day'); // '2-3h', 'half-day', 'full-day'
  const [planTransport, setPlanTransport] = useState('motor'); // 'walk', 'motor', 'taxi'
  const [planVibe, setPlanVibe] = useState('san-may'); // 'san-may', 'food', 'healing', 'trekking'
  const [customPlanResult, setCustomPlanResult] = useState(null);

  // Filtered Itineraries list based on tab
  const filteredItineraries = useMemo(() => {
    if (selectedVibe === 'all') return ITINERARIES_DATA;
    return ITINERARIES_DATA.filter((item) => item.vibe === selectedVibe);
  }, [selectedVibe]);

  // Handle Quick Planner Generate - Smart Recommendation Logic
  const handleGenerateCustomPlan = () => {
    let matchedId = 'san-may-song-ao';
    // 1. Primary priority: User's selected Vibe / Experiential Intent
    if (planVibe === 'food') {
      matchedId = 'food-tour-tay-bac';
    } else if (planVibe === 'healing') {
      matchedId = 'healing-cap-doi';
    } else if (planVibe === 'trekking') {
      matchedId = 'trekking-ban-lang';
    } else if (planVibe === 'san-may') {
      if (planTime === '2-3h') {
        matchedId = 'chi-co-3-tieng';
      } else {
        matchedId = 'san-may-song-ao';
      }
    } else {
      // 2. Secondary priority: Time-based matching
      if (planTime === '2-3h') {
        matchedId = 'chi-co-3-tieng';
      } else if (planTime === 'full-day') {
        matchedId = 'buoi-chieu';
      } else {
        matchedId = 'buoi-sang';
      }
    }

    const matched = ITINERARIES_DATA.find((i) => i.id === matchedId) || ITINERARIES_DATA[0];
    setCustomPlanResult(matched);
  };


  const handleViewOnMap = (itinerary) => {
    onSelectItinerary(itinerary);
    // Smooth scroll up to map if element exists
    const mapEl = document.getElementById('explore-map-canvas') || document.querySelector('.explore-map-area');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className={`itinerary-section ${isLandingPageMode ? 'is-landing' : ''}`} id="itinerary-section" aria-labelledby="itinerary-section-title">
      <div className="itinerary-container">
        
        {/* Header Block */}
        <div className="itinerary-header-block">
          <div className="itinerary-header-badge">
            <span className="itinerary-badge-icon">🗺️</span>
            <span>HÀNH TRÌNH TỐI ƯU TỪ LÁ ĐỎ HOMESTAY</span>
          </div>
          <h2 id="itinerary-section-title" className="itinerary-main-title">
            Gợi Ý Lịch Trình Khám Phá Sa Pa
          </h2>
          <p className="itinerary-subtitle-desc">
            Được thiết kế tinh gọn xuất phát ngay từ cửa Lá Đỏ Homestay (31A Hoàng Liên), tối ưu từng phút di chuyển để bạn trọn vẹn từng khoảnh khắc.
          </p>
        </div>

        {/* 1. Interactive 1-Minute Quick Planner Box */}
        <div className="quick-planner-card animate-fade-in">
          <div className="quick-planner-head">
            <div className="quick-planner-title-group">
              <span className="quick-planner-sparkle">✨</span>
              <div>
                <h3 className="quick-planner-title">Tự Tạo Lịch Trình Trong 1 Phút</h3>
                <p className="quick-planner-desc">Chọn nhanh thời gian, phương tiện & sở thích – Nhận ngay lộ trình hoàn hảo nhất</p>
              </div>
            </div>
            <span className="quick-planner-pill">Tối Ưu Bản Đồ</span>
          </div>

          <div className="quick-planner-grid">
            {/* Step 1: Time */}
            <div className="planner-option-col">
              <label className="planner-col-label">
                <span className="planner-col-num">1</span>
                <span>Bạn có bao nhiêu thời gian?</span>
              </label>
              <div className="planner-btn-group">
                <button
                  type="button"
                  className={`planner-chip ${planTime === '2-3h' ? 'is-active' : ''}`}
                  onClick={() => setPlanTime('2-3h')}
                >
                  ⚡ 2 – 3 Tiếng
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planTime === 'half-day' ? 'is-active' : ''}`}
                  onClick={() => setPlanTime('half-day')}
                >
                  ☀️ Nửa ngày (~5h)
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planTime === 'full-day' ? 'is-active' : ''}`}
                  onClick={() => setPlanTime('full-day')}
                >
                  🌄 Cả ngày trọn vẹn
                </button>
              </div>
            </div>

            {/* Step 2: Transport */}
            <div className="planner-option-col">
              <label className="planner-col-label">
                <span className="planner-col-num">2</span>
                <span>Phương tiện di chuyển?</span>
              </label>
              <div className="planner-btn-group">
                <button
                  type="button"
                  className={`planner-chip ${planTransport === 'walk' ? 'is-active' : ''}`}
                  onClick={() => setPlanTransport('walk')}
                >
                  🚶 Đi bộ thư thái
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planTransport === 'motor' ? 'is-active' : ''}`}
                  onClick={() => setPlanTransport('motor')}
                >
                  🛵 Xe máy phượt gió
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planTransport === 'taxi' ? 'is-active' : ''}`}
                  onClick={() => setPlanTransport('taxi')}
                >
                  🚗 Taxi & Xe riêng
                </button>
              </div>
            </div>

            {/* Step 3: Vibe */}
            <div className="planner-option-col">
              <label className="planner-col-label">
                <span className="planner-col-num">3</span>
                <span>Gu trải nghiệm yêu thích?</span>
              </label>
              <div className="planner-btn-group">
                <button
                  type="button"
                  className={`planner-chip ${planVibe === 'san-may' ? 'is-active' : ''}`}
                  onClick={() => setPlanVibe('san-may')}
                >
                  📸 Săn mây check-in
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planVibe === 'food' ? 'is-active' : ''}`}
                  onClick={() => setPlanVibe('food')}
                >
                  🍲 Food Tour ẩm thực
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planVibe === 'healing' ? 'is-active' : ''}`}
                  onClick={() => setPlanVibe('healing')}
                >
                  💑 Chữa lành thư thái
                </button>
                <button
                  type="button"
                  className={`planner-chip ${planVibe === 'trekking' ? 'is-active' : ''}`}
                  onClick={() => setPlanVibe('trekking')}
                >
                  🏃 Khám phá bản làng
                </button>
              </div>
            </div>
          </div>

          <div className="quick-planner-action-bar">
            <button
              type="button"
              className="quick-planner-generate-btn"
              onClick={handleGenerateCustomPlan}
            >
              <span>Tạo Lịch Trình May Đo Riêng Cho Bạn</span>
              <span className="planner-btn-arrow">✨</span>
            </button>
          </div>

          {/* Planner Result Box */}
          {customPlanResult && (
            <div className="planner-result-box animate-scale-in">
              <div className="planner-result-header">
                <div className="planner-result-meta-top">
                  <span className="planner-match-tag">🎯 Phù Hợp Nhất Với Bạn</span>
                  <span className="planner-time-tag">⏱️ {customPlanResult.duration}</span>
                  <span className="planner-dist-tag">📏 {customPlanResult.distance}</span>
                </div>
                <h4 className="planner-result-title">{customPlanResult.title}</h4>
                <p className="planner-result-summary">{customPlanResult.summary}</p>
              </div>

              {/* Step Sequence Bar */}
              <div className="planner-result-steps-bar">
                {customPlanResult.stops.map((stop, sIdx) => (
                  <a
                    key={sIdx}
                    href={getGoogleMapsPlaceUrl(stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="planner-result-step-item is-clickable"
                    title={`Bấm để mở địa điểm "${stop.name}" trên Google Maps`}
                  >
                    <span className="planner-step-idx">{sIdx + 1}</span>
                    <span className="planner-step-text">{stop.name}</span>
                    <span className="planner-step-ext">↗</span>
                    {sIdx < customPlanResult.stops.length - 1 && (
                      <span className="planner-step-arrow">➔</span>
                    )}
                  </a>
                ))}
              </div>

              {/* Actions for generated route */}
              <div className="planner-result-actions">
                <button
                  type="button"
                  className="planner-btn-map"
                  onClick={() => handleViewOnMap(customPlanResult)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                  <span>Xem tuyến đường vẽ trên bản đồ</span>
                </button>
                <a
                  href={getGoogleMapsMultiStopUrl(customPlanResult.stops)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="planner-btn-gmaps"
                  title="Mở Google Maps dẫn đường từng điểm trên điện thoại"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                  <span>Mở Google Maps dẫn đường</span>
                </a>
                <a href="/rooms" className="planner-btn-book">
                  🍁 Đặt phòng Lá Đỏ
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 2. Category & Vibe Tab Filter Bar */}
        <div className="itinerary-tabs-bar" role="tablist">
          {ITINERARY_VIBES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selectedVibe === tab.id}
              className={`itinerary-tab-btn ${selectedVibe === tab.id ? 'is-active' : ''}`}
              onClick={() => setSelectedVibe(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 3. Cards Grid */}
        <div className="itinerary-grid">
          {filteredItineraries.map((item) => {
            const isRouteActive = activeItineraryId === item.id;
            return (
              <article
                key={item.id}
                className={`itinerary-card ${isRouteActive ? 'is-active-route' : ''}`}
              >
                {/* Image Banner */}
                <div className="itinerary-card-img-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="itinerary-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/landing/images/sapa_real/la_do_cafe_balcony.jpg';
                    }}
                  />
                  <div className="itinerary-card-overlay"></div>
                  <div className="itinerary-badge-time">
                    <span>⏱️ {item.timeRange}</span>
                  </div>
                  {item.distance && (
                    <div className="itinerary-badge-dist">
                      <span>📏 {item.distance}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="itinerary-card-body">
                  <h3 className="itinerary-card-title">{item.title}</h3>
                  <p className="itinerary-card-subtitle">{item.subtitle}</p>

                  {/* Trip Highlights Badges */}
                  <div className="itinerary-highlights-bar">
                    <div className="highlight-pill" title="Phương tiện">
                      <span className="hl-icon">🛵</span>
                      <span>{item.transport || 'Linh hoạt'}</span>
                    </div>
                    <div className="highlight-pill" title="Chi phí dự tính">
                      <span className="hl-icon">💰</span>
                      <span>{item.estimatedCost || 'Chi phí linh hoạt'}</span>
                    </div>
                    <div className="highlight-pill" title="Thời điểm đẹp nhất">
                      <span className="hl-icon">☀️</span>
                      <span>{item.bestTime || 'Cả ngày'}</span>
                    </div>
                  </div>

                  {/* Timeline Step-by-Step UI */}
                  <div className="itinerary-timeline-mini">
                    {item.stops.map((stop, sIdx) => (
                      <div key={sIdx} className="itinerary-stop-step">
                        <div className="itinerary-stop-left">
                          <span className="itinerary-step-circle">{sIdx + 1}</span>
                          {sIdx < item.stops.length - 1 && <span className="itinerary-step-line" />}
                        </div>
                        <div className="itinerary-stop-right">
                          <div className="itinerary-stop-head-box">
                            <a
                              href={getGoogleMapsPlaceUrl(stop)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="itinerary-stop-header-link"
                              title={`Bấm để mở địa điểm "${stop.name}" trên Google Maps`}
                            >
                              <StopIcon type={stop.icon} />
                              <strong className="itinerary-stop-name">{stop.name}</strong>
                              <span className="itinerary-stop-link-icon">↗</span>
                            </a>
                            {stop.phone && (
                              <a
                                href={`tel:${stop.phone.replace(/\s+/g, '')}`}
                                className="itinerary-stop-phone-btn"
                                title={`Gọi ngay ${stop.phone}`}
                              >
                                📞 {stop.phone}
                              </a>
                            )}
                          </div>
                          {stop.note && <p className="itinerary-stop-note">{stop.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hotline Bar */}
                  {item.hotline && (
                    <div className="itinerary-hotline-strip">
                      <span className="itinerary-hotline-icon">📞 Hotline hỗ trợ:</span>
                      <a href={`tel:${item.hotline.replace(/\s+/g, '')}`} className="itinerary-hotline-btn">
                        <strong>{item.hotline}</strong> (Gọi ngay)
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="itinerary-card-actions">
                    <button
                      type="button"
                      className="itinerary-btn-map"
                      onClick={() => handleViewOnMap(item)}
                      title="Vẽ tuyến đường trên bản đồ Leaflet"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                      </svg>
                      <span>Xem trên bản đồ</span>
                    </button>

                    <a
                      href={getGoogleMapsMultiStopUrl(item.stops)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="itinerary-btn-gmaps"
                      title="Mở Google Maps dẫn đường từng điểm trên điện thoại"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                      </svg>
                      <span>Dẫn đường</span>
                    </a>

                    <button
                      type="button"
                      className="itinerary-btn-detail"
                      onClick={() => setActiveModalItinerary(item)}
                      title="Xem chi tiết lộ trình"
                    >
                      <span>Chi tiết</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Itinerary Expanded Modal */}
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
              <img
                src={activeModalItinerary.image}
                alt={activeModalItinerary.title}
                onError={(e) => {
                  e.currentTarget.src = '/landing/images/sapa_real/la_do_cafe_balcony.jpg';
                }}
              />
              <div className="itinerary-modal-badge">{activeModalItinerary.timeRange}</div>
            </div>
            <div className="itinerary-modal-body">
              <h3 className="itinerary-modal-title">{activeModalItinerary.title}</h3>
              <p className="itinerary-modal-summary">{activeModalItinerary.summary}</p>
              
              {/* Trip Badges in modal */}
              <div className="itinerary-modal-highlights">
                <span>⏱️ {activeModalItinerary.duration}</span>
                <span>📏 {activeModalItinerary.distance}</span>
                <span>🛵 {activeModalItinerary.transport}</span>
                <span>💰 {activeModalItinerary.estimatedCost}</span>
              </div>

              <h4 className="itinerary-modal-step-title">Lộ trình chi tiết từng điểm:</h4>
              <div className="itinerary-modal-timeline">
                {activeModalItinerary.stops.map((stop, idx) => (
                  <div key={idx} className="itinerary-timeline-step">
                    <div className="itinerary-timeline-num">{idx + 1}</div>
                    <div className="itinerary-timeline-text">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <a
                          href={getGoogleMapsPlaceUrl(stop)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="itinerary-timeline-stop-head-link"
                          title={`Bấm để mở địa điểm "${stop.name}" trên Google Maps`}
                        >
                          <StopIcon type={stop.icon} />
                          <strong>{stop.name}</strong>
                          <span className="itinerary-stop-link-icon">↗</span>
                        </a>
                        {stop.phone && (
                          <a
                            href={`tel:${stop.phone.replace(/\s+/g, '')}`}
                            className="itinerary-stop-phone-btn"
                            title={`Gọi ngay ${stop.phone}`}
                          >
                            📞 {stop.phone}
                          </a>
                        )}
                      </div>
                      <p>{stop.note || 'Điểm dừng chân tham quan trải nghiệm'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activeModalItinerary.hotline && (
                <div className="itinerary-hotline-strip" style={{ margin: '14px 0 6px' }}>
                  <span className="itinerary-hotline-icon">📞 Hotline hỗ trợ lịch trình:</span>
                  <a href={`tel:${activeModalItinerary.hotline.replace(/\s+/g, '')}`} className="itinerary-hotline-btn">
                    <strong>{activeModalItinerary.hotline}</strong> (Bấm để gọi ngay)
                  </a>
                </div>
              )}

              <div className="itinerary-modal-actions">
                <button
                  type="button"
                  className="itinerary-modal-btn-map"
                  onClick={() => {
                    handleViewOnMap(activeModalItinerary);
                    setActiveModalItinerary(null);
                  }}
                >
                  🗺️ Xem tuyến đường trên bản đồ
                </button>
                <a
                  href={getGoogleMapsMultiStopUrl(activeModalItinerary.stops)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="itinerary-modal-btn-gmaps"
                >
                  🧭 Mở Google Maps dẫn đường
                </a>
                <a
                  href="/rooms"
                  className="itinerary-modal-btn-book"
                >
                  🍁 Đặt phòng tại Lá Đỏ Homestay
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
