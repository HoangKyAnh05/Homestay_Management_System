import React from 'react';
import { calculateDistanceMeters, formatDistance, estimateWalkingTime } from '../../utils/geoUtils';
import { HOMESTAY_LOCATION } from '../../data/places';
import './PlaceCard.css';

// SVG Category Pin Indicator
function CategoryBadgeIcon({ category }) {
  switch (category) {
    case 'tham-quan':
      return (
        <span className="place-category-badge place-category-badge--purple" title="Tham quan">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"></path>
          </svg>
        </span>
      );
    case 'cafe':
      return (
        <span className="place-category-badge place-category-badge--brown" title="Cafe">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          </svg>
        </span>
      );
    case 'vui-choi':
      return (
        <span className="place-category-badge place-category-badge--orange" title="Vui chơi">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </span>
      );
    case 'mua-sam':
      return (
        <span className="place-category-badge place-category-badge--red" title="Mua sắm">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          </svg>
        </span>
      );
    case 'thien-nhien':
      return (
        <span className="place-category-badge place-category-badge--green" title="Thiên nhiên">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 4 14 9 14 6 20 18 20 15 14 20 14 12 2"></polygon>
          </svg>
        </span>
      );
    default:
      return (
        <span className="place-category-badge place-category-badge--slate" title="Địa điểm">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </span>
      );
  }
}

export default function PlaceCard({
  place,
  isSelected,
  onSelect,
  onHover,
  onLeave
}) {
  const distanceMeters = calculateDistanceMeters(
    HOMESTAY_LOCATION.lat,
    HOMESTAY_LOCATION.lng,
    place.latitude,
    place.longitude
  );

  const formattedDistance = formatDistance(distanceMeters);
  const walkingTime = estimateWalkingTime(distanceMeters);

  return (
    <article
      id={`place-card-${place.id}`}
      className={`place-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(place)}
      onMouseEnter={() => onHover && onHover(place.id)}
      onMouseLeave={() => onLeave && onLeave()}
      tabIndex={0}
      role="button"
      aria-label={`Xem thông tin ${place.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(place);
        }
      }}
    >
      {/* Thumbnail Image */}
      <div className="place-card-image-wrap">
        <img
          src={place.image}
          alt={place.name}
          className="place-card-img"
          loading="lazy"
        />
      </div>

      {/* Info Body */}
      <div className="place-card-body">
        <div className="place-card-title-row">
          <CategoryBadgeIcon category={place.category} />
          <h3 className="place-card-name" title={place.name}>{place.name}</h3>
        </div>

        {/* Rating & Reviews */}
        <div className="place-card-rating-row">
          <span className="place-star-icon">⭐</span>
          <strong className="place-star-score">{place.rating?.toFixed(1) || '4.8'}</strong>
          <span className="place-review-count">
            ({place.reviewCount >= 1000 ? `${(place.reviewCount / 1000).toFixed(1)}k` : place.reviewCount} đánh giá)
          </span>
        </div>

        {/* Distance & Walking Time */}
        <div className="place-card-meta-row">
          <span className="place-meta-item">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{formattedDistance}</span>
          </span>

          <span className="place-meta-divider">•</span>

          <span className="place-meta-item">
            <span className="walking-icon">🚶</span>
            <span>{walkingTime}</span>
          </span>
        </div>

        {/* Tags / Subcategory */}
        <div className="place-card-tags">
          <span className="place-tag">{place.categoryName || place.tags?.[0]}</span>
        </div>
      </div>

      {/* Right Arrow */}
      <div className="place-card-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </article>
  );
}
