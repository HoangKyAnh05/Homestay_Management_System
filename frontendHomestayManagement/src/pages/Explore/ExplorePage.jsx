import React, { useState, useMemo, useEffect } from 'react';
import ExploreHeader from '../../components/Explore/ExploreHeader';
import ExploreHero from '../../components/Explore/ExploreHero';
import PlaceSidebar from '../../components/Explore/PlaceSidebar';
import ExploreMap from '../../components/Explore/ExploreMap';
import PlaceDetailCard from '../../components/Explore/PlaceDetailCard';
import PlaceDetailModal from '../../components/Explore/PlaceDetailModal';
import ItinerarySection from '../../components/Explore/ItinerarySection';
import ExploreFooter from '../../components/Explore/ExploreFooter';
import { PLACES_DATA, PLACE_CATEGORIES, HOMESTAY_LOCATION } from '../../data/places';
import './ExplorePage.css';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('tat-ca');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [detailModalPlace, setDetailModalPlace] = useState(null);

  // SEO: Page Title & Meta description
  useEffect(() => {
    document.title = 'Khám phá Sa Pa | Lá Đỏ Homestay & Coffee';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Khám phá những địa điểm vui chơi, tham quan, ăn uống và cafe gần Lá Đỏ Homestay tại Sa Pa.';
  }, []);

  // Compute category counts
  const countsByCategory = useMemo(() => {
    const counts = { 'tat-ca': PLACES_DATA.length };
    PLACE_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'tat-ca') {
        counts[cat.id] = PLACES_DATA.filter((p) => p.category === cat.id).length;
      }
    });
    return counts;
  }, []);

  // Filter places based on Category & Search Query
  const filteredPlaces = useMemo(() => {
    return PLACES_DATA.filter((place) => {
      // 1. Category Filter
      const matchCategory =
        selectedCategory === 'tat-ca' || place.category === selectedCategory;

      // 2. Search Query Filter (name, tags, description, categoryName)
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        place.name.toLowerCase().includes(query) ||
        (place.categoryName && place.categoryName.toLowerCase().includes(query)) ||
        (place.tags && place.tags.some((t) => t.toLowerCase().includes(query))) ||
        (place.description && place.description.toLowerCase().includes(query));

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handler: Select Place
  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
  };

  // Handler: Close Detail Card
  const handleCloseDetailCard = () => {
    setSelectedPlace(null);
  };

  // Handler: Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory('tat-ca');
    setSearchQuery('');
  };

  return (
    <div className="explore-page-root">
      {/* 1. Header */}
      <ExploreHeader />

      {/* 2. Hero Section */}
      <ExploreHero />

      {/* 3. Main Map & Explorer Section */}
      <main className="explore-main-section">
        <div className="explore-main-container">
          <div className="explore-layout-card">
            {/* Left Sidebar */}
            <PlaceSidebar
              places={filteredPlaces}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedPlace={selectedPlace}
              onSelectPlace={handleSelectPlace}
              hoveredPlaceId={hoveredPlaceId}
              onHoverPlace={setHoveredPlaceId}
              onLeavePlace={() => setHoveredPlaceId(null)}
              countsByCategory={countsByCategory}
              onResetFilters={handleResetFilters}
            />

            {/* Right Map Canvas Area */}
            <div className="explore-map-area">
              <ExploreMap
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onSelectPlace={handleSelectPlace}
                hoveredPlaceId={hoveredPlaceId}
              />

              {/* Floating Place Detail Card on Top Right of Map */}
              {selectedPlace && (
                <PlaceDetailCard
                  place={selectedPlace}
                  onClose={handleCloseDetailCard}
                  onOpenDetailModal={(place) => setDetailModalPlace(place)}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Recommendation Itinerary Section */}
      <ItinerarySection />

      {/* 5. Footer */}
      <ExploreFooter />

      {/* 6. Place Detail Expanded Modal */}
      <PlaceDetailModal
        place={detailModalPlace}
        isOpen={Boolean(detailModalPlace)}
        onClose={() => setDetailModalPlace(null)}
      />
    </div>
  );
}
