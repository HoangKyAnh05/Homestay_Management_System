import React from 'react';
import { HOMESTAY_LOCATION } from '../../data/places';
import './ExploreFooter.css';

export default function ExploreFooter() {
  return (
    <footer className="explore-footer" role="contentinfo">
      <div className="explore-footer-inner">
        {/* Left: Brand & Address */}
        <div className="explore-footer-col">
          <div className="explore-footer-brand">
            <span className="explore-footer-leaf">🍁</span>
            <strong>{HOMESTAY_LOCATION.name}</strong>
          </div>
          <p className="explore-footer-text">{HOMESTAY_LOCATION.address}</p>
        </div>

        {/* Center: Hotline & Email */}
        <div className="explore-footer-col explore-footer-contact">
          <div className="explore-footer-contact-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Hotline: <a href={`tel:${HOMESTAY_LOCATION.phone}`}>{HOMESTAY_LOCATION.phone}</a></span>
          </div>

          <div className="explore-footer-contact-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Email: <a href={`mailto:${HOMESTAY_LOCATION.email}`}>{HOMESTAY_LOCATION.email}</a></span>
          </div>
        </div>

        {/* Right: Slogan & Signature */}
        <div className="explore-footer-col explore-footer-slogan">
          <span className="explore-footer-signature">
            “Lá Đỏ – Chạm đến những điều đẹp nhất của Sa Pa 🍁”
          </span>
          <p className="explore-footer-copy">© 2026 Lá Đỏ Homestay & Coffee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
