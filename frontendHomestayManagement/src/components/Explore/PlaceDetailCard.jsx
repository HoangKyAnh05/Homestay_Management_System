import React from 'react';
import { calculateDistanceMeters, formatDistance, estimateWalkingTime, generateGoogleMapsDirectionsUrl } from '../../utils/geoUtils';
import { HOMESTAY_LOCATION } from '../../data/places';
import './PlaceDetailCard.css';

export default function PlaceDetailCard({
  place,
  onClose,
  onOpenDetailModal
}) {
  if (!place) return null;

  const distanceMeters = calculateDistanceMeters(
    HOMESTAY_LOCATION.lat,
    HOMESTAY_LOCATION.lng,
    place.latitude,
    place.longitude
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
