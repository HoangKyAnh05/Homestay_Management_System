import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HOMESTAY_LOCATION, getGoogleMapsMultiStopUrl } from '../../data/places';
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
  places = [],
  selectedPlace,
  onSelectPlace,
  hoveredPlaceId,
  activeItinerary = null,
  onClearItinerary = () => {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const routeGroupRef = useRef(null);
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

      // Add OpenStreetMap Standard tiles (Optimized caching & clean view)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      // Group layer for place markers & routes
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      const routeGroup = L.layerGroup().addTo(map);
      routeGroupRef.current = routeGroup;

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

  // Update Standard Place Markers (when no itinerary active)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // If an itinerary is active, we render dimmed standard markers or hide them
    const isRouteActive = Boolean(activeItinerary);

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
        className: `custom-leaflet-place-pin ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''} ${isRouteActive ? 'is-dimmed' : ''}`,
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
        zIndexOffset: isSelected ? 900 : isHovered ? 800 : (isRouteActive ? 200 : 500),
      });

      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      markersGroupRef.current.addLayer(marker);
    });
  }, [places, selectedPlace, hoveredPlaceId, onSelectPlace, activeItinerary]);

  // Handle Active Itinerary: Draw Polyline & Numbered Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !routeGroupRef.current) return;

    routeGroupRef.current.clearLayers();

    if (!activeItinerary || !activeItinerary.stops || activeItinerary.stops.length === 0) {
      return;
    }

    const map = mapInstanceRef.current;
    const validStops = activeItinerary.stops.filter((s) => s.lat && s.lng);
    if (validStops.length === 0) return;

    // Collect latlngs for polyline
    const latLngs = validStops.map((s) => [s.lat, s.lng]);

    // 1. Draw glowing background shadow line
    const glowLine = L.polyline(latLngs, {
      color: '#fb7185',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeGroupRef.current.addLayer(glowLine);

    // 2. Draw active polyline with crimson theme & animated dash
    const mainLine = L.polyline(latLngs, {
      color: '#881337',
      weight: 4.5,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeGroupRef.current.addLayer(mainLine);

    // 3. Add Numbered Markers for each stop
    validStops.forEach((stop, index) => {
      const isStart = index === 0;
      const isEnd = index === validStops.length - 1;
      const stopNumber = index + 1;

      const stopIcon = L.divIcon({
        className: 'custom-leaflet-itinerary-pin',
        html: `
          <div class="itinerary-pin-bubble ${isStart ? 'is-start' : isEnd ? 'is-end' : ''}">
            <span class="itinerary-pin-num">${isStart ? '🏠' : stopNumber}</span>
            <div class="itinerary-pin-tooltip">
              <strong>${stopNumber}. ${stop.name}</strong>
              ${stop.note ? `<p>${stop.note}</p>` : ''}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([stop.lat, stop.lng], {
        icon: stopIcon,
        zIndexOffset: 1200 + index,
      });

      marker.bindPopup(`
        <div class="itinerary-stop-popup">
          <div class="itinerary-stop-badge">Điểm dừng ${stopNumber}/${validStops.length}</div>
          <h4 class="itinerary-stop-title">${stop.name}</h4>
          ${stop.note ? `<p class="itinerary-stop-desc">${stop.note}</p>` : ''}
        </div>
      `, { maxWidth: 260 });

      routeGroupRef.current.addLayer(marker);
    });

    // 4. Smoothly fit bounds
    try {
      const bounds = L.latLngBounds(latLngs);
      map.flyToBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15.5,
        duration: 0.9,
      });
    } catch (e) {
      console.warn('Could not fit bounds:', e);
    }
  }, [activeItinerary]);

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
    if (!mapInstanceRef.current) return;
    if (activeItinerary && activeItinerary.stops) {
      const validStops = activeItinerary.stops.filter(s => s.lat && s.lng);
      if (validStops.length > 0) {
        const bounds = L.latLngBounds(validStops.map(s => [s.lat, s.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
        return;
      }
    }

    if (places.length === 0) return;
    const bounds = L.latLngBounds([
      [HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng],
      ...places.map((p) => [p.latitude, p.longitude]),
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isFullscreen) {
        document.body.classList.add('map-fullscreen-active');
      } else {
        document.body.classList.remove('map-fullscreen-active');
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 250);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('map-fullscreen-active');
      }
    };
  }, [isFullscreen]);

  if (mapError) {
    return (
      <div className="explore-map-error-state">
        <p>Không thể tải bản đồ. Vui lòng kiểm tra kết nối mạng.</p>
        <button onClick={() => window.location.reload()}>Tải lại trang</button>
      </div>
    );
  }

  return (
    <div className={`explore-map-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="explore-map-canvas" id="explore-map-canvas" />

      {/* Active Itinerary Overlay Banner */}
      {activeItinerary && (
        <div className="map-itinerary-floating-bar animate-fade-in">
          <div className="map-itinerary-info">
            <span className="map-itinerary-tag">🗺️ Đang hiển thị tuyến đường</span>
            <h4 className="map-itinerary-name">{activeItinerary.title}</h4>
            <div className="map-itinerary-meta">
              <span>⏱️ {activeItinerary.duration || activeItinerary.timeRange}</span>
              <span>📏 {activeItinerary.distance || '~3.5 km'}</span>
              <span>🛵 {activeItinerary.transport || 'Linh hoạt'}</span>
            </div>
          </div>
          <div className="map-itinerary-actions">
            <a
              href={getGoogleMapsMultiStopUrl(activeItinerary.stops)}
              target="_blank"
              rel="noopener noreferrer"
              className="map-itinerary-btn-gmaps"
              title="Mở Google Maps dẫn đường từng điểm trên điện thoại"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              <span>Dẫn đường toàn bộ</span>
            </a>
            <button
              type="button"
              className="map-itinerary-btn-close"
              onClick={onClearItinerary}
              title="Đóng tuyến đường"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Pill Button */}
      {isFullscreen && (
        <button
          type="button"
          className="map-fullscreen-exit-pill"
          onClick={toggleFullscreen}
          title="Thu nhỏ bản đồ (hoặc bấm phím Esc)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14h6v6m10-10h-6V4m0 6l7-7M10 14l-7 7"></path>
          </svg>
          <span>Thu nhỏ bản đồ</span>
          <span className="map-exit-kbd">Esc</span>
        </button>
      )}

      {/* Floating Control Buttons */}
      <div className="explore-map-controls">
        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomIn}
          title="Phóng to"
          aria-label="Phóng to"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={handleZoomOut}
          title="Thu nhỏ"
          aria-label="Thu nhỏ"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <div className="map-control-divider" />

        <button
          type="button"
          className="map-control-btn map-control-btn--homestay"
          onClick={handleCenterHomestay}
          title="Vị trí Lá Đỏ Homestay"
          aria-label="Vị trí Lá Đỏ Homestay"
        >
          <span className="map-btn-leaf-icon">🍁</span>
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={handleFitBounds}
          title="Xem toàn cảnh tất cả địa điểm"
          aria-label="Xem toàn cảnh tất cả địa điểm"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to toàn màn hình'}
          aria-label="Toàn màn hình"
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14h6v6m10-10h-6V4m0 6l7-7M10 14l-7 7"></path>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Distance Legend Badge */}
      <div className="explore-map-legend">
        <span className="legend-dot legend-dot--homestay"></span>
        <span>Lá Đỏ Homestay</span>
        <span className="legend-divider">|</span>
        <span className="legend-dot legend-dot--place"></span>
        <span>Điểm tham quan & ăn chơi</span>
      </div>
    </div>
  );
}
