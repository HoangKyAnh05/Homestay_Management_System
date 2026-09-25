import React from 'react';
import { calculateDistanceMeters, formatDistance, estimateWalkingTime, generateGoogleMapsDirectionsUrl, getPlaceDistanceMeters } from '../../utils/geoUtils';
import { HOMESTAY_LOCATION } from '../../data/places';
import './PlaceDetailCard.css';

export default function PlaceDetailCard({
  place,
  onClose,
  onOpenDetailModal
}) {
  if (!place) return null;

  const distanceMeters = getPlaceDistanceMeters(
    place,
    HOMESTAY_LOCATION.lat,
    HOMESTAY_LOCATION.lng
  );

  const formattedDistance = formatDistance(distanceMeters);
  const walkingTime = estimateWalkingTime(distanceMeters);
  const directionsUrl = generateGoogleMapsDirectionsUrl(
    HOMESTAY_LOCATION,
    { lat: place.latitude, lng: place.longitude, name: place.name },
    'walking'
  );

  return (
    <div className="place-detail-floating-card" role="dialog" aria-label={`Chi tiết ${place.name}`}>
      {/* Close button */}
      <button
        type="button"
        className="place-detail-close-btn"
        onClick={onClose}
        aria-label="Đóng bảng thông tin"
      >
        ✕
      </button>

      {/* Hero Image */}
      <div className="place-detail-img-wrap">
        <img
          src={place.image}
          alt={place.name}
          className="place-detail-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/home_1/image.png';
          }}
        />
        <div className="place-detail-category-badge">
          <span>{place.categoryName || place.tags?.[0]}</span>
        </div>
      </div>

      {/* Content */}
      <div className="place-detail-body">
        <div className="place-detail-header-row">
          <h3 className="place-detail-title">{place.name}</h3>
        </div>

        {/* Rating & Reviews */}
        <div className="place-detail-rating-row">
          <span className="place-detail-star">⭐</span>
          <strong className="place-detail-score">{place.rating?.toFixed(1) || '4.8'}</strong>
          <span className="place-detail-reviews">
            ({place.reviewCount >= 1000 ? `${(place.reviewCount / 1000).toFixed(1)}k` : place.reviewCount} đánh giá)
          </span>
        </div>

        {/* Distance & Time */}
        <div className="place-detail-meta-row">
          <span className="place-detail-meta-item">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{formattedDistance}</span>
          </span>

          <span className="place-detail-meta-divider">•</span>

          <span className="place-detail-meta-item">
            <span>🚶</span>
            <span>{walkingTime} đi bộ</span>
          </span>
        </div>

        {/* Contact Hotline */}
        {place.phone && (
          <div className="place-detail-phone-row">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Hotline / ĐT:</span>
            <a href={`tel:${place.phone.replace(/\s+/g, '')}`} className="place-detail-phone-link" title={`Bấm để gọi ngay ${place.phone}`}>
              <strong>{place.phone}</strong> (Gọi ngay)
            </a>
          </div>
        )}

        {/* Short Description */}
        <p className="place-detail-desc">{place.description}</p>

        {/* Action Buttons */}
        <div className="place-detail-actions">
          <button
            type="button"
            className="place-detail-btn-view"
            onClick={() => onOpenDetailModal && onOpenDetailModal(place)}
          >
            Xem chi tiết
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="place-detail-btn-directions"
            title="Mở chỉ đường trên Google Maps từ Lá Đỏ"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            <span>Chỉ đường</span>
          </a>
        </div>
      </div>
    </div>
  );
}
