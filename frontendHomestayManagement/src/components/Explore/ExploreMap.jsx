import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HOMESTAY_LOCATION } from '../../data/places';
import { calculateDistanceMeters, formatDistance } from '../../utils/geoUtils';
import './ExploreMap.css';

// Custom SVG Icons for Leaflet divIcons
function getCategorySvg(category) {
  switch (category) {
    case 'tham-quan':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"></path></svg>`;
    case 'cafe':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path></svg>`;
    case 'vui-choi':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    case 'mua-sam':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>`;
    case 'thien-nhien':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 4 14 9 14 6 20 18 20 15 14 20 14 12 2"></polygon></svg>`;
    case 'an-uong':
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v18M5 2v5a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2M8 2v18"></path></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
}

export default function ExploreMap({
  places,
  selectedPlace,
  onSelectPlace,
  hoveredPlaceId
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const homestayMarkerRef = useRef(null);
  const [mapError, setMapError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // Create Leaflet Map centered on Lá Đỏ (Optimized for weak machines & mobile)
      const map = L.map(mapContainerRef.current, {
        center: [HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng],
        zoom: 14.5,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        inertia: true,
        inertiaDeceleration: 3000,
      });

      // Add OpenStreetMap Standard tiles (Optimized caching & no watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      // Group layer for place markers
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      // Custom Homestay Pin (🍁 Lá Đỏ Homestay)
      const homestayIcon = L.divIcon({
        className: 'custom-leaflet-homestay-pin',
        html: `
          <div class="homestay-pin-container">
            <div class="homestay-pin-pulse"></div>
            <div class="homestay-pin-pulse delay"></div>
            <div class="homestay-pin-body">
              <span class="homestay-pin-icon">🏠</span>
            </div>
            <div class="homestay-pin-label">
              <span class="homestay-label-badge">🍁 Lá Đỏ Homestay</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24],
      });

      const homestayMarker = L.marker([HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng], {
        icon: homestayIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Homestay Popup
      const homestayPopupContent = `
        <div class="homestay-popup-card">
          <div class="homestay-popup-head">
            <span class="homestay-popup-leaf">🍁</span>
            <div>
              <strong class="homestay-popup-title">${HOMESTAY_LOCATION.name}</strong>
              <p class="homestay-popup-address">${HOMESTAY_LOCATION.address}</p>
            </div>
          </div>
          <p class="homestay-popup-desc">${HOMESTAY_LOCATION.description}</p>
          <div class="homestay-popup-actions">
            <a href="/rooms" class="homestay-popup-btn homestay-popup-btn--book">Đặt phòng ngay</a>
            <a href="/home" class="homestay-popup-btn homestay-popup-btn--view">Xem homestay</a>
          </div>
        </div>
      `;
      homestayMarker.bindPopup(homestayPopupContent, {
        className: 'custom-homestay-leaflet-popup',
        maxWidth: 320,
      });

      homestayMarkerRef.current = homestayMarker;
      mapInstanceRef.current = map;

      // Invalidate size on load
      setTimeout(() => map.invalidateSize(), 200);
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Place Markers when `places`, `selectedPlace`, or `hoveredPlaceId` change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isHovered = hoveredPlaceId === place.id;
      const pinColor = place.pinColor || '#7c3aed';
      const distanceMeters = calculateDistanceMeters(
        HOMESTAY_LOCATION.lat,
        HOMESTAY_LOCATION.lng,
        place.latitude,
        place.longitude
      );
      const formattedDistance = formatDistance(distanceMeters);

      const placeIcon = L.divIcon({
        className: `custom-leaflet-place-pin ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`,
        html: `
          <div class="place-pin-wrapper">
            <div class="place-pin-bubble" style="background: ${pinColor}">
              ${getCategorySvg(place.category)}
            </div>
            <div class="place-pin-label-tag">
              <span class="place-pin-name">${place.name}</span>
              <span class="place-pin-dist">${formattedDistance}</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.latitude, place.longitude], {
        icon: placeIcon,
        zIndexOffset: isSelected ? 900 : isHovered ? 800 : 500,
      });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersGroupRef.current.addLayer(marker);
    });
  }, [places, selectedPlace, hoveredPlaceId, onSelectPlace]);

  // Pan to selected place when selectedPlace changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace) return;

    mapInstanceRef.current.flyTo(
      [selectedPlace.latitude, selectedPlace.longitude],
      15.5,
      {
        animate: true,
        duration: 0.8,
      }
    );
  }, [selectedPlace]);

  // Map Controls Helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleCenterHomestay = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng], 14.5, {
        animate: true,
        duration: 0.8,
      });
      if (homestayMarkerRef.current) {
        homestayMarkerRef.current.openPopup();
      }
    }
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || places.length === 0) return;
    const bounds = L.latLngBounds([
      [HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng],
      ...places.map((p) => [p.latitude, p.longitude]),
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 250);
  };

  if (mapError) {
    return (
      <div className="explore-map-error-state">
        <p>Không thể tải bản đồ. Vui lòng kiểm tra kết nối mạng.</p>
        <button
          type="button"
          className="explore-map-retry-btn"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={`explore-map-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="explore-map-canvas" id="explore-map-leaflet" />

      {/* Floating Map Custom Controls */}
      <div className="explore-map-controls">
        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomIn}
          title="Phóng to"
          aria-label="Phóng to bản đồ"
        >
          +
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomOut}
          title="Thu nhỏ"
          aria-label="Thu nhỏ bản đồ"
        >
          −
        </button>
        <button
          type="button"
          className="map-control-btn map-control-btn--locate"
          onClick={handleCenterHomestay}
          title="Vị trí Lá Đỏ Homestay"
          aria-label="Trở về vị trí Lá Đỏ"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={handleFitBounds}
          title="Xem toàn bộ địa điểm"
          aria-label="Xem toàn bộ địa điểm"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          aria-label="Toàn màn hình"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </button>
      </div>
    </div>
  );
}
