import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HOMESTAY_LOCATION, PLACES_DATA } from '../../data/places';
import { calculateDistanceMeters, formatDistance } from '../../utils/geoUtils';
import './MiniMap.css';

export default function MiniMap({ height = '360px', showExpandBtn = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng],
        zoom: 14.5,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });

      // Standard OSM Tiles - Optimized caching, no watermark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }).addTo(map);

      // Custom Homestay Pin (🍁 Lá Đỏ Homestay)
      const homestayIcon = L.divIcon({
        className: 'custom-minimap-homestay-pin',
        html: `
          <div class="minimap-homestay-pin-wrap">
            <div class="minimap-pin-pulse"></div>
            <div class="minimap-pin-pulse delay"></div>
            <div class="minimap-pin-core">
              <span>🏠</span>
            </div>
            <div class="minimap-pin-title">
              <span>🍁 Lá Đỏ Homestay</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([HOMESTAY_LOCATION.lat, HOMESTAY_LOCATION.lng], {
        icon: homestayIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Top nearby key landmarks for visual context
      const keyPlaces = PLACES_DATA.slice(0, 6);
      keyPlaces.forEach((place) => {
        const distanceMeters = calculateDistanceMeters(
          HOMESTAY_LOCATION.lat,
          HOMESTAY_LOCATION.lng,
          place.latitude,
          place.longitude
        );
        const formattedDistance = formatDistance(distanceMeters);

        const placeIcon = L.divIcon({
          className: 'custom-minimap-place-pin',
          html: `
            <div class="minimap-place-chip" style="background: ${place.pinColor || '#0d9488'};">
              <span class="minimap-place-dot"></span>
              <span class="minimap-place-name">${place.name} · ${formattedDistance}</span>
            </div>
          `,
          iconSize: [140, 28],
          iconAnchor: [70, 14],
        });

        const marker = L.marker([place.latitude, place.longitude], {
          icon: placeIcon,
        }).addTo(map);

        marker.on('click', () => {
          window.location.assign('/explore');
        });
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 250);
    } catch (err) {
      console.error('Error initializing MiniMap:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mini-map-container" style={{ height }}>
      <div ref={mapContainerRef} className="mini-map-canvas" />

      {/* Floating CTA to open full Explore Page */}
      {showExpandBtn && (
        <a href="/explore" className="mini-map-expand-btn" title="Mở toàn bộ bản đồ khám phá xung quanh">
          <span>🗺️ Mở Bản Đồ Khám Phá Xung Quanh Lá Đỏ</span>
          <span className="mini-map-expand-arrow">→</span>
        </a>
      )}
    </div>
  );
}
