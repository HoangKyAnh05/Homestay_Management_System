import React from 'react';
import './PlaceSearch.css';

export default function PlaceSearch({ searchQuery, onSearchChange, totalFound }) {
  return (
    <div className="place-search-container">
      <div className="place-search-input-box">
        <svg
          className="place-search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          className="place-search-input"
          placeholder="Tìm kiếm địa điểm (Nhà thờ, Cafe, Fansipan, Chợ...)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm kiếm địa điểm xung quanh Lá Đỏ"
        />

        {searchQuery && (
          <button
            type="button"
            className="place-search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Xóa tìm kiếm"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
