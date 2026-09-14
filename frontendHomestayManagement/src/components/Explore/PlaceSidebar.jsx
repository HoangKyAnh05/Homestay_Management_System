import React, { useEffect, useRef } from 'react';
import CategoryFilter from './CategoryFilter';
import PlaceSearch from './PlaceSearch';
import PlaceCard from './PlaceCard';
import './PlaceSidebar.css';

export default function PlaceSidebar({
  places,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedPlace,
  onSelectPlace,
  hoveredPlaceId,
  onHoverPlace,
  onLeavePlace,
  countsByCategory,
  onResetFilters
}) {
  const sidebarListRef = useRef(null);

  // Auto-scroll sidebar list to the selected card when selected from map
  useEffect(() => {
    if (selectedPlace?.id && sidebarListRef.current) {
      const cardEl = document.getElementById(`place-card-${selectedPlace.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedPlace]);

  return (
    <aside className="explore-sidebar" aria-label="Danh sách địa điểm quanh Lá Đỏ">
      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        countsByCategory={countsByCategory}
      />

      {/* Realtime Search Box */}
      <PlaceSearch
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalFound={places.length}
      />

      {/* Header Title with Count */}
      <div className="explore-sidebar-head">
        <h2 className="explore-sidebar-title">Địa điểm nổi bật gần Lá Đỏ</h2>
        <span className="explore-sidebar-count">{places.length} địa điểm</span>
      </div>

      {/* Places Scroll List */}
      <div className="explore-sidebar-list" ref={sidebarListRef}>
        {places.length > 0 ? (
          places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSelected={selectedPlace?.id === place.id}
              onSelect={onSelectPlace}
              onHover={onHoverPlace}
              onLeave={onLeavePlace}
            />
          ))
        ) : (
          <div className="explore-empty-state">
            <div className="explore-empty-icon">🔍</div>
            <p className="explore-empty-title">Không tìm thấy địa điểm phù hợp</p>
            <p className="explore-empty-desc">
              Vui lòng thử từ khóa tìm kiếm khác hoặc chuyển sang danh mục khác.
            </p>
            {onResetFilters && (
              <button
                type="button"
                className="explore-empty-reset-btn"
                onClick={onResetFilters}
              >
                Xem tất cả địa điểm
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
