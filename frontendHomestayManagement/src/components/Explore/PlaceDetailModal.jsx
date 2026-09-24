import React, { useState } from 'react';
import { calculateDistanceMeters, formatDistance, estimateWalkingTime, estimateDrivingTime, generateGoogleMapsDirectionsUrl, getPlaceDistanceMeters } from '../../utils/geoUtils';
import { HOMESTAY_LOCATION } from '../../data/places';
import './PlaceDetailModal.css';

export default function PlaceDetailModal({
  place,
  isOpen,
  onClose,
  onSelectRelatedPlace
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !place) return null;

  const images = place.gallery && place.gallery.length > 0 ? place.gallery : [place.image];
  const distanceMeters = getPlaceDistanceMeters(
    place,
    HOMESTAY_LOCATION.lat,
    HOMESTAY_LOCATION.lng
  );
  const formattedDistance = formatDistance(distanceMeters);
  const walkingTime = estimateWalkingTime(distanceMeters);
  const drivingTime = estimateDrivingTime(distanceMeters);
  const directionsUrl = generateGoogleMapsDirectionsUrl(HOMESTAY_LOCATION, {
    lat: place.latitude,
    lng: place.longitude,
    name: place.name
  });

  return (
    <div className="place-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="place-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="place-modal-close-btn"
          onClick={onClose}
          aria-label="Đóng cửa sổ chi tiết"
        >
          ✕
        </button>

        {/* Modal Gallery */}
        <div className="place-modal-gallery">
          <div className="place-modal-main-img-wrap">
            <img
              src={images[activeImageIndex] || place.image}
              alt={place.name}
              className="place-modal-main-img"
            />
            <div className="place-modal-category-tag">
              {place.categoryName || place.tags?.[0]}
            </div>
          </div>

          {images.length > 1 && (
            <div className="place-modal-thumbs">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`place-modal-thumb ${idx === activeImageIndex ? 'is-active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="place-modal-content">
          <div className="place-modal-header">
            <h2 id="place-modal-title" className="place-modal-title">{place.name}</h2>
            
            <div className="place-modal-rating-badge">
              <span>⭐ {place.rating?.toFixed(1) || '4.8'}</span>
              <span className="place-modal-reviews">({place.reviewCount} đánh giá từ du khách)</span>
            </div>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="place-modal-metrics-grid">
            <div className="place-metric-card">
              <span className="place-metric-icon">📍</span>
              <div className="place-metric-info">
                <span className="place-metric-label">Khoảng cách từ Lá Đỏ</span>
                <strong className="place-metric-value">{formattedDistance}</strong>
              </div>
            </div>

            <div className="place-metric-card">
              <span className="place-metric-icon">🚶</span>
              <div className="place-metric-info">
                <span className="place-metric-label">Thời gian đi bộ</span>
                <strong className="place-metric-value">{walkingTime}</strong>
              </div>
            </div>

            <div className="place-metric-card">
              <span className="place-metric-icon">🚗</span>
              <div className="place-metric-info">
                <span className="place-metric-label">Thời gian đi xe máy/ô tô</span>
                <strong className="place-metric-value">{drivingTime}</strong>
              </div>
            </div>

            <div className="place-metric-card">
              <span className="place-metric-icon">⏰</span>
              <div className="place-metric-info">
                <span className="place-metric-label">Giờ mở cửa</span>
                <strong className="place-metric-value">{place.openingHours || 'Mở cửa cả ngày'}</strong>
              </div>
            </div>

            {place.phone && (
              <div className="place-metric-card place-metric-card--phone">
                <span className="place-metric-icon">📞</span>
                <div className="place-metric-info">
                  <span className="place-metric-label">Hotline / Liên hệ</span>
                  <a href={`tel:${place.phone.replace(/\s+/g, '')}`} className="place-metric-phone-link" title={`Gọi ngay ${place.phone}`}>
                    <strong>{place.phone}</strong> (Gọi ngay)
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="place-modal-section">
            <h3 className="place-modal-section-title">Giới thiệu địa điểm</h3>
            <p className="place-modal-desc-text">{place.description}</p>
          </div>

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="place-modal-tags-row">
              {place.tags.map((tag, i) => (
                <span key={i} className="place-modal-tag-pill">#{tag}</span>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="place-modal-footer">
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\s+/g, '')}`}
                className="place-modal-phone-btn"
                title={`Gọi hotline ${place.phone}`}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Gọi Hotline: {place.phone}</span>
              </a>
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="place-modal-directions-btn"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              <span>Chỉ đường trên Google Maps (từ Lá Đỏ)</span>
            </a>

            <button
              type="button"
              className="place-modal-cancel-btn"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
