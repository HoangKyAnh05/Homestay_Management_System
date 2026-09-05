import { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { LandingApp, VILLAS_DATA } from './LandingController';
import { resolveImageUrl } from '../../utils/imageUrl';
import FloatingContactWidget from '../../components/FloatingContact/FloatingContactWidget';
import ArticleReviewModal from './ArticleReviewModal';
import { SCENERY_ARTICLES } from './sceneryArticles';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

function formatVND(num) {
  return new Intl.NumberFormat('vi-VN').format(Number(num) || 0) + '₫';
}

function getFallbackRoomImage(roomTypeName, roomTypeId) {
  const name = String(roomTypeName || '').toLowerCase();
  if (name.includes('studio')) return '/home_1/image.png';
  if (name.includes('vip') || name.includes('suite')) return '/home_2/image_1.jpg';
  if (name.includes('deluxe')) return '/home_3/image_3.jpg';
  if (name.includes('family') || name.includes('gia đình')) return '/home_4/image_1.jpg';
  if (name.includes('connecting') || name.includes('kết nối')) return '/home_5/image_1.jpg';

  const fallbacks = [
    '/landing/images/homestay/homestay-quan-1-2.png',
    '/landing/images/homestay/homestay-vinh-hy-2.png',
    '/landing/images/homestay/images-2.jpg',
    '/landing/images/homestay/mau-nha-homestay-dep-22.jpg',
  ];
  const idNum = Math.max(1, Number(roomTypeId) || 1);
  const idx = (idNum - 1) % fallbacks.length;
  return fallbacks[idx];
}

function getRoomPrice(room) {
  if (room.price != null && Number(room.price) > 0) return Number(room.price);
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) return Number(room.weekdayPrice);
  if (room.weekendPrice != null && Number(room.weekendPrice) > 0) return Number(room.weekendPrice);
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const validPrices = room.prices.map((p) => Number(p.price || 0)).filter((p) => p > 0);
    if (validPrices.length > 0) return Math.min(...validPrices);
  }
  return 3850000;
}

function LandingPage() {
  const [dbRooms, setDbRooms] = useState([]);
  const dbRoomsRef = useRef([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [liveArticles, setLiveArticles] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => {
    dbRoomsRef.current = dbRooms;
  }, [dbRooms]);

  const [publicReviews, setPublicReviews] = useState([]);

  // Fetch real rooms only once
  useEffect(() => {
    fetch(`${API_BASE_URL}/rooms/types`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbRooms(data);
          dbRoomsRef.current = data;
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRooms(false));

    fetch(`${API_BASE_URL}/public/reviews/featured`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPublicReviews(data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/public/travel-articles`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item) => {
            let highlights = []
            try {
              highlights = JSON.parse(item.highlightsJson || '[]')
            } catch {
              highlights = []
            }
            let sections = []
            try {
              sections = JSON.parse(item.sectionsJson || '[]')
            } catch {
              sections = []
            }
            return {
              id: item.articleKey || item.id,
              title: item.title,
              subtitle: item.subtitle,
              tag: item.tag,
              category: item.category,
              readTime: item.readTime,
              author: item.author,
              date: item.dateTag,
              coverImage: item.coverImageUrl,
              rating: item.rating,
              location: item.location,
              distance: item.distance,
              bestTime: item.bestTime,
              cost: item.cost,
              highlights,
              intro: item.intro,
              sections,
              homestayAdvice: item.homestayAdvice,
            }
          })
          setLiveArticles(formatted);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Set theme attribute
    document.documentElement.setAttribute('data-theme', 'night');

    // Global navigation to main booking page /rooms
    window.goToBookingPage = (options = {}) => {
      const checkinVal = options.checkIn || document.getElementById('dock-checkin')?.value || '';
      const checkoutVal = options.checkOut || document.getElementById('dock-checkout')?.value || '';
      const guestsVal = options.guests || document.getElementById('dock-guests')?.value || '2';
      const villaSelectEl = document.getElementById('dock-villa');
      const villaSelectVal = options.roomTypeId || villaSelectEl?.value || '';
      const selectedRoomName = options.roomTypeName || (villaSelectEl?.selectedOptions?.[0]?.text?.split('(')[0]?.trim() || '');

      const params = new URLSearchParams();
      if (checkinVal) params.set('checkInDate', checkinVal);
      if (checkoutVal) params.set('checkOutDate', checkoutVal);
      if (guestsVal) params.set('adults', String(guestsVal));

      if (villaSelectVal && !isNaN(Number(villaSelectVal))) {
        params.set('roomTypeId', String(villaSelectVal));
        params.set('focusRoomId', String(villaSelectVal));
      }
      if (selectedRoomName) {
        params.set('roomTypeName', selectedRoomName);
      }

      const query = params.toString();
      window.location.assign(query ? `/rooms?${query}` : '/rooms');
    };

    // Global helpers for inline click handlers
    window.openBookingDrawer = (villaId = 'glass-pine') => {
      const overlay = document.getElementById('booking-drawer-overlay');
      const select = document.getElementById('b-villa-select');
      if (select && villaId && villaId !== 'all') {
        select.value = villaId;
      }
      window.onDrawerVillaChange();
      overlay?.classList.add('active');
    };

    window.onDrawerVillaChange = () => {
      const select = document.getElementById('b-villa-select');
      const titleEl = document.getElementById('drawer-villa-title');
      if (!select) return;
      const villaKey = select.value;
      const villa = VILLAS_DATA[villaKey];
      if (villa && titleEl) {
        titleEl.textContent = villa.name;
      } else if (titleEl && select.selectedOptions?.[0]) {
        titleEl.textContent = select.selectedOptions[0].text.split('(')[0].trim();
      }
      window.calculateBookingTotal();
    };

    window.calculateBookingTotal = () => {
      const checkinVal = document.getElementById('b-checkin')?.value;
      const checkoutVal = document.getElementById('b-checkout')?.value;
      const select = document.getElementById('b-villa-select');
      if (!checkinVal || !checkoutVal || !select) return;

      const d1 = new Date(checkinVal);
      const d2 = new Date(checkoutVal);
      let nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      if (nights < 1) nights = 1;

      const opt = select.selectedOptions?.[0];
      const optPrice = opt ? Number(opt.getAttribute('data-price') || 0) : 0;
      const villa = VILLAS_DATA[select.value] || VILLAS_DATA['glass-pine'];
      const pricePerNight = optPrice > 0 ? optPrice : (villa?.price || 3850000);
      const roomSubtotal = pricePerNight * nights;

      let addonSubtotal = 0;
      if (document.getElementById('addon-dinner')?.checked) addonSubtotal += 650000;
      if (document.getElementById('addon-shuttle')?.checked) addonSubtotal += 900000;

      const discount = Math.round(roomSubtotal * 0.15);
      const total = roomSubtotal + addonSubtotal - discount;

      const nightsEl = document.getElementById('summary-nights');
      const roomSubtotalEl = document.getElementById('summary-room-subtotal');
      const addonRow = document.getElementById('summary-addon-row');
      const addonSubtotalEl = document.getElementById('summary-addon-subtotal');
      const discountEl = document.getElementById('summary-discount');
      const totalEl = document.getElementById('summary-total');

      if (nightsEl) nightsEl.textContent = `${nights} đêm x ${formatVND(pricePerNight)}:`;
      if (roomSubtotalEl) roomSubtotalEl.textContent = formatVND(roomSubtotal);
      if (discountEl) discountEl.textContent = '-' + formatVND(discount);
      if (totalEl) totalEl.textContent = formatVND(total);

      if (addonRow && addonSubtotalEl) {
        if (addonSubtotal > 0) {
          addonRow.style.display = 'flex';
          addonSubtotalEl.textContent = '+' + formatVND(addonSubtotal);
        } else {
          addonRow.style.display = 'none';
        }
      }
    };

    window.submitBooking = () => {
      const select = document.getElementById('b-villa-select');
      const selectedVal = select?.value;
      window.goToBookingPage({ roomTypeId: selectedVal });
    };

    window.openVillaModal = (villaOrId) => {
      let villa = typeof villaOrId === 'object' ? villaOrId : VILLAS_DATA[villaOrId];
      if (!villa) {
        const found = dbRoomsRef.current.find((r) => String(r.id || r.roomTypeId) === String(villaOrId));
        if (found) {
          const img = resolveImageUrl(found.primaryImageUrl) || getFallbackRoomImage(found.name, found.id);
          villa = {
            id: found.id || found.roomTypeId,
            name: found.name || `Căn ${found.id}`,
            tagline: 'Phòng NghI Dưỡng Sang Trọng',
            price: getRoomPrice(found),
            area: `${found.area || 85}m²`,
            guests: `${found.maxAdults || 2} Người lớn, ${found.maxChildren || 0} Trẻ em`,
            view: 'View Rừng Thông & Thung Lũng Mây',
            images: [img, img, img],
            description: found.description || 'Không gian nghỉ dưỡng tuyệt hảo giữa thiên nhiên Sa Pa trong lành.',
            features: ['Điều hòa 2 chiều', 'Wifi Starlink tốc độ cao', 'Nước khoáng & Trà thảo mộc', 'Bữa sáng bản địa'],
          };
        } else {
          villa = VILLAS_DATA['glass-pine'];
        }
      }

      const contentEl = document.getElementById('villa-modal-content');
      const overlay = document.getElementById('villa-modal-overlay');

      contentEl.innerHTML = `
        <div class="modal-gallery" style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.8rem; margin-bottom: 1.8rem; border-radius: 16px; overflow: hidden; height: 320px;">
          <img src="${villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="display: flex; flex-direction: column; gap: 0.8rem; height: 100%;">
            <img src="${villa.images[1] || villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 50%; object-fit: cover;" />
            <img src="${villa.images[2] || villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 50%; object-fit: cover;" />
          </div>
        </div>
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h2 style="font-family: var(--font-serif-display); font-size: 1.8rem;">${villa.name}</h2>
          <span style="font-size: 1.4rem; font-weight: 700; color: #f5cf9e;">${formatVND(villa.price)} <small style="font-size: 0.82rem; color: var(--text-muted); font-weight: normal;">/ đêm</small></span>
        </div>
        <div style="display: flex; gap: 1.5rem; color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap;">
          <span><strong>Diện tích:</strong> ${villa.area}</span>
          <span><strong>Sức chứa:</strong> ${villa.guests}</span>
          <span><strong>Tầm nhìn:</strong> ${villa.view}</span>
        </div>
        <p style="color: var(--text-secondary); line-height: 1.75; margin-bottom: 1.8rem;">${villa.description}</p>
        <h4 style="font-family: var(--font-serif-display); font-size: 1.05rem; margin-bottom: 1rem; color: #f5cf9e;">Tiện Nghi Độc Quyền & Dịch Vụ</h4>
        <ul style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 2.2rem; list-style: none; padding: 0;">
          ${(villa.features || []).map((f) => `<li style="font-size: 0.88rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="check" style="width: 14px; height: 14px; color: #5cd29b;"></i> ${f}</li>`).join('')}
        </ul>
        <div style="display: flex; justify-content: flex-end; gap: 1rem; flex-wrap: wrap;">
          <button class="ghost-btn" onclick="document.getElementById('villa-modal-overlay').classList.remove('active')">Đóng</button>
          <button class="liquid-btn" onclick="document.getElementById('villa-modal-overlay').classList.remove('active'); window.goToBookingPage({ roomTypeId: '${villa.id}' });">
            <span class="btn-text">Tiến Hành Đặt Phòng Ngay</span>
            <span class="liquid-glow"></span>
          </button>
        </div>
      `;

      if (window.lucide) {
        try {
          window.lucide.createIcons();
        } catch (e) {}
      }
      overlay?.classList.add('active');
    };

    // Instantiate LandingApp controller only once
    const app = new LandingApp();

    return () => {
      // Cleanup on unmount
      app.destroy();
      document.documentElement.removeAttribute('data-theme');
      delete window.goToBookingPage;
      delete window.openBookingDrawer;
      delete window.onDrawerVillaChange;
      delete window.calculateBookingTotal;
      delete window.submitBooking;
      delete window.openVillaModal;
    };
  }, []);

  // Merge default luxury villas with real rooms from API if available
  const defaultVillas = Object.values(VILLAS_DATA);
  const displayVillas = dbRooms.length > 0
    ? dbRooms.slice(0, 6).map((room, idx) => {
        const fallback = defaultVillas[idx % defaultVillas.length];
        const img = resolveImageUrl(room.primaryImageUrl) || getFallbackRoomImage(room.name, room.id);
        return {
          id: room.id || room.roomTypeId,
          dbId: room.id || room.roomTypeId,
          name: room.name || fallback.name,
          tagline: room.roomTypeName || fallback.tagline,
          price: getRoomPrice(room),
          area: `${room.area || (85 + idx * 25)}m²`,
          guests: `${room.maxAdults || 2} - ${(room.maxAdults || 2) + (room.maxChildren || 2)} Khách`,
          view: fallback.view || 'View Thung Lũng Mây',
          image: img,
          images: [img, fallback.images[1], fallback.images[2]],
          description: room.description || fallback.description,
          features: fallback.features || ['Onsen Khoáng Nóng', 'Wifi Starlink', 'Loa Marshall', 'Bữa Sáng Bản Địa'],
          badge: idx === 0 ? 'Phổ Biến Nhất' : idx === 1 ? 'View Đẹp Nhất' : 'Không Gian Yên Tĩnh',
          category: (room.maxAdults || 2) > 2 ? 'family' : 'couple luxury',
        };
      })
    : defaultVillas.map((v) => ({ ...v, image: v.images[0], badge: v.tagline, category: 'couple luxury' }));

  return (
    <div className="landing-page-root">
      {/* Countdown Preloader */}
      <div className="site-preloader" id="preloader">
        <div className="preloader-curtain curtain-left"></div>
        <div className="preloader-curtain curtain-right"></div>
        <div className="preloader-content">
          <span className="preloader-leaf">🍁</span>
          <div className="preloader-counter" id="preloader-counter">00%</div>
          <span className="preloader-status" id="preloader-status">KHỞI ĐỘNG KHÔNG GIAN 3D & SƯƠNG MÙ...</span>
          <div className="preloader-bar"><div className="preloader-bar-fill" id="preloader-bar-fill"></div></div>
        </div>
      </div>

      {/* Custom Magnetic Cursor */}
      <div className="custom-cursor" id="custom-cursor">
        <span className="cursor-text" id="cursor-text"></span>
      </div>
      <div className="cursor-dot" id="cursor-dot"></div>

      {/* Global Scroll Progress Indicator */}
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" id="scroll-progress"></div>
      </div>

      {/* Image Trail Hover Layer */}
      <div className="image-trail-container" id="image-trail-container"></div>

      {/* Three.js 3D WebGL Canvas Layer */}
      <div className="webgl-canvas-container" id="canvas-container">
        <canvas id="webgl-canvas"></canvas>
        <div className="mist-overlay"></div>
        <div className="vignette-overlay"></div>
      </div>

      {/* Noise Texture Filter for Film Grain */}
      <div className="grain-overlay" aria-hidden="true"></div>

      {/* Top Navigation Header */}
      <header className="site-header" id="site-header">
        <div className="nav-container">
          <div className="header-left">
            <a href="/home" className="landing-back-btn" title="Quay lại trang chủ Lá Đỏ Homestay">
              ← Trang Chủ
            </a>
            <a href="#hero" className="brand-logo">
              <span className="logo-leaf">🍁</span>
              <div className="logo-text">
                <span className="brand-name">LÁ ĐỎ HOMESTAY</span>
                <span className="brand-tagline">MIST SANCTUARY • SAPA</span>
              </div>
            </a>
          </div>

          <nav className="nav-links" id="nav-links">
            <a href="#about" className="nav-link">Triết Lý</a>
            <a href="#villas" className="nav-link">Các Căn Villa</a>
            <a href="#experiences" className="nav-link">Trải Nghiệm</a>
            <a href="#sensory" className="nav-link">Thính Âm Tự Nhiên</a>
            <a href="#reviews" className="nav-link">Đánh Giá</a>
            <a href="#location" className="nav-link">Vị Trí</a>
          </nav>

          <div className="nav-actions">
            {/* Mood Switcher */}
            <div className="mood-selector" title="Thay đổi bầu không khí">
              <button className="mood-btn active" data-mood="night" id="mood-night" aria-label="Đêm trăng sao">
                <i data-lucide="moon"></i>
              </button>
              <button className="mood-btn" data-mood="sunset" id="mood-sunset" aria-label="Hoàng hôn mây vàng">
                <i data-lucide="sunset"></i>
              </button>
              <button className="mood-btn" data-mood="dawn" id="mood-dawn" aria-label="Bình minh sương sớm">
                <i data-lucide="sun"></i>
              </button>
            </div>

            {/* Ambient Sound Toggle */}
            <button className="sound-toggle-btn" id="sound-toggle" title="Bật/Tắt âm thanh rừng thông & suối reo">
              <span className="sound-icon-wrap">
                <i data-lucide="volume-2" className="sound-icon-on"></i>
                <i data-lucide="volume-x" className="sound-icon-off"></i>
              </span>
              <span className="sound-label">Suối Rừng</span>
              <div className="sound-wave-visualizer" id="sound-bars">
                <span></span><span></span><span></span><span></span>
              </div>
            </button>

            <button className="liquid-btn nav-cta-btn" id="header-book-btn" onClick={() => window.goToBookingPage()}>
              <span className="btn-text">Đặt Phòng</span>
              <span className="liquid-glow"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <main className="page-main">
        
        {/* Hero Section */}
        <section className="hero-section" id="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">22°20'N 103°50'E • ĐỘ CAO 1,650M TRÊN MỰC NƯỚC BIỂN</span>
              <span className="live-weather" id="live-weather">
                <i data-lucide="cloud-rain" className="weather-icon"></i>
                <span>17°C • Sương Phủ Rừng Thông</span>
              </span>
            </div>

            <h1 className="hero-title">
              <span className="title-sub">Nơi Chạm Vào Mây Ngàn</span>
              <span className="title-main">TỊNH TẠI GIỮA RỪNG THÔNG</span>
            </h1>

            <p className="hero-description">
              Lấy cảm hứng từ triết lý <em>Komorebi</em> — những vệt nắng lung linh lọc qua kẽ lá râm ran. Khu nghỉ dưỡng homestay sinh thái với vật liệu gỗ tuyết tùng, đá bazan tự nhiên và suối khoáng nóng ôm trọn thung lũng Mường Hoa.
            </p>

            <div className="hero-actions">
              <button className="liquid-btn primary-hero-btn" id="hero-explore-btn">
                <span className="btn-text">Khám Phá Các Căn Villa</span>
                <i data-lucide="arrow-down" className="btn-icon"></i>
                <span className="liquid-glow"></span>
              </button>
              
              <button className="ghost-btn virtual-tour-btn" id="virtual-tour-btn">
                <i data-lucide="compass" className="btn-icon"></i>
                <span>Trải Nghiệm 3D View</span>
              </button>

              <a href="/rooms" className="ghost-btn" style={{ border: '1.5px solid rgba(226, 177, 115, 0.5)' }}>
                <i data-lucide="list"></i>
                <span>Xem Toàn Bộ Phòng</span>
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">{dbRooms.length > 0 ? `0${dbRooms.length}`.slice(-2) : '04'}</span>
                <span className="stat-lbl">Biệt Thự Biệt Lập</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-lbl">View Mây & Rừng Thông</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">4.98 ★</span>
                <span className="stat-lbl">Đánh Giá Từ 480+ Du Khách</span>
              </div>
            </div>
          </div>

          {/* Floating Quick Booking Bar */}
          <div className="booking-dock" id="booking-dock">
            <div className="booking-dock-inner">
              <div className="dock-col">
                <label htmlFor="dock-checkin"><i data-lucide="calendar"></i> Ngày Đến</label>
                <input type="date" id="dock-checkin" defaultValue={today} />
              </div>
              <div className="dock-divider"></div>
              <div className="dock-col">
                <label htmlFor="dock-checkout"><i data-lucide="calendar-check"></i> Ngày Đi</label>
                <input type="date" id="dock-checkout" defaultValue={tomorrow} />
              </div>
              <div className="dock-divider"></div>
              <div className="dock-col">
                <label htmlFor="dock-villa"><i data-lucide="home"></i> Hạng Phòng</label>
                <select id="dock-villa">
                  {dbRooms.length > 0 ? (
                    dbRooms.map((room) => (
                      <option key={room.id || room.roomTypeId} value={room.id || room.roomTypeId}>
                        {room.name || `Căn ${room.id}`} ({formatVND(getRoomPrice(room))}/đêm)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="glass-pine">The Glass Pine Pavilion</option>
                      <option value="cloud-crest">Cloud Crest Loft</option>
                      <option value="mizu-stream">Mizu Stream Retreat</option>
                      <option value="aether-dome">Aether Star Observatory</option>
                    </>
                  )}
                </select>
              </div>
              <div className="dock-divider"></div>
              <div className="dock-col">
                <label htmlFor="dock-guests"><i data-lucide="users"></i> Số Khách</label>
                <select id="dock-guests">
                  <option value="2">2 Người Lớn (Cặp đôi)</option>
                  <option value="4">4 Người (Gia đình)</option>
                  <option value="1">1 Người (Solo Retreat)</option>
                  <option value="6">6 Người (Nhóm bạn)</option>
                </select>
              </div>
              <div className="dock-action">
                <button className="liquid-btn dock-btn" id="dock-submit-btn" onClick={() => window.goToBookingPage()}>
                  <span className="btn-text">Kiểm Tra Trống & Đặt</span>
                  <i data-lucide="sparkles"></i>
                  <span className="liquid-glow"></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Infinite Kinetic Marquee Banner */}
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-track" id="marquee-track">
            <span className="marquee-item">LÁ ĐỎ SANCTUARY</span><span className="marquee-star">✦</span>
            <span className="marquee-item">MÂY NGÀN HOÀNG LIÊN SƠN</span><span className="marquee-star">✦</span>
            <span className="marquee-item">ONSEN KHOÁNG NÓNG BẢN ĐỊA</span><span className="marquee-star">✦</span>
            <span className="marquee-item">TRIẾT LÝ WABI-SABI NGUYÊN BẢN</span><span className="marquee-star">✦</span>
            <span className="marquee-item">ẨM THỰC FARM-TO-TABLE HỮU CƠ</span><span className="marquee-star">✦</span>
            <span className="marquee-item">LÁ ĐỎ SANCTUARY</span><span className="marquee-star">✦</span>
            <span className="marquee-item">MÂY NGÀN HOÀNG LIÊN SƠN</span><span className="marquee-star">✦</span>
            <span className="marquee-item">ONSEN KHOÁNG NÓNG BẢN ĐỊA</span><span className="marquee-star">✦</span>
            <span className="marquee-item">TRIẾT LÝ WABI-SABI NGUYÊN BẢN</span><span className="marquee-star">✦</span>
            <span className="marquee-item">ẨM THỰC FARM-TO-TABLE HỮU CƠ</span><span className="marquee-star">✦</span>
          </div>
        </div>

        {/* Philosophy & Architecture Section */}
        <section className="section philosophy-section" id="about">
          <div className="container">
            <div className="section-badge">
              <i data-lucide="leaf"></i>
              <span>TRIẾT LÝ KIẾN TRÚC & NGHỈ DƯỠNG</span>
            </div>
            <h2 className="section-title">
              Khi Thiên Nhiên Là Bức Tranh Tường Đẹp Nhất
            </h2>
            <p className="section-subtitle">
              Chúng tôi không xây khách sạn trên sườn núi; chúng tôi đan cài các gian nhà gỗ thông vào lòng địa hình, tôn trọng từng gốc thông cổ thụ và dòng suối ngầm.
            </p>

            <div className="philosophy-grid">
              <div className="philo-card" data-tilt>
                <div className="card-icon-wrap">
                  <i data-lucide="droplet"></i>
                </div>
                <h3>Onsen Khoáng Nóng Tự Nhiên</h3>
                <p>Mỗi căn villa đều sở hữu bồn ngâm gỗ Pơ-mu ngoài trời dẫn trực tiếp mạch nước khoáng thảo dược từ lòng núi Fansipan.</p>
                <div className="card-glow"></div>
              </div>

              <div className="philo-card" data-tilt>
                <div className="card-icon-wrap">
                  <i data-lucide="eye"></i>
                </div>
                <h3>Kiến Trúc Kính Panorama 360°</h3>
                <p>Hệ thống vách kính Low-E cản nhiệt mở rộng tầm nhìn vô cực xuống thung lũng mây, để bạn thức giấc cùng biển mây tràn qua ô cửa.</p>
                <div className="card-glow"></div>
              </div>

              <div className="philo-card" data-tilt>
                <div className="card-icon-wrap">
                  <i data-lucide="coffee"></i>
                </div>
                <h3>Ẩm Thực Farm-to-Table & Trà Đạo</h3>
                <p>Thực đơn hữu cơ thu hoạch trong ngày từ vườn rau bậc thang bản địa, kết hợp văn hóa thưởng trà Shan Tuyết cổ thụ 300 năm.</p>
                <div className="card-glow"></div>
              </div>

              <div className="philo-card" data-tilt>
                <div className="card-icon-wrap">
                  <i data-lucide="wind"></i>
                </div>
                <h3>Thanh Âm Yên Ả Tuyệt Đối</h3>
                <p>Không khói bụi, không tiếng còi xe. Chỉ có tiếng gió reo qua tán kim thông, tiếng róc rách của thác nước và tiếng chim rừng ríu rít.</p>
                <div className="card-glow"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Villas & Cabins Showcase Section */}
        <section className="section villas-section" id="villas">
          <div className="container">
            <div className="section-header-row">
              <div>
                <div className="section-badge">
                  <i data-lucide="sparkles"></i>
                  <span>KHÔNG GIAN NGHỈ DƯỠNG BIỆT LẬP</span>
                </div>
                <h2 className="section-title">Các Dinh Thự Ẩn Mình Trong Mây</h2>
              </div>
              <div className="villa-filter-tabs" id="villa-tabs">
                <button className="tab-btn active" data-filter="all">Tất Cả ({displayVillas.length})</button>
                <button className="tab-btn" data-filter="couple">Cặp Đôi</button>
                <button className="tab-btn" data-filter="family">Gia Đình</button>
                <button className="tab-btn" data-filter="luxury">Cao Cấp Nhất</button>
              </div>
            </div>

            <div className="villas-stack-container" id="villas-stack-container">
              {displayVillas.map((villa, idx) => (
                <article
                  className="villa-card stack-card"
                  data-category={villa.category}
                  data-index={idx + 1}
                  style={{ '--card-index': idx + 1 }}
                  data-cursor="XEM VILLA"
                  key={villa.id || idx}
                >
                  <div className="stack-card-header-bar">
                    <div className="stack-card-identity">
                      <span className="stack-number">{`0${idx + 1}`.slice(-2)}</span>
                      <span className="stack-villa-name">{villa.name.toUpperCase()}</span>
                    </div>
                    <span className="stack-pill-tag">{villa.badge || 'Biệt Thự Sang Trọng'}</span>
                  </div>
                  <div className="stack-card-inner">
                    <div className="villa-image-wrapper">
                      <img src={villa.image} alt={villa.name} className="villa-img" loading="lazy" />
                      <div className="villa-price-tag">
                        <span className="price">{formatVND(villa.price)}</span>
                        <span className="unit">/ đêm</span>
                      </div>
                    </div>
                    <div className="villa-body">
                      <div className="villa-meta">
                        <span><i data-lucide="maximize"></i> {villa.area}</span>
                        <span><i data-lucide="users"></i> {villa.guests}</span>
                        <span><i data-lucide="sun"></i> {villa.view}</span>
                      </div>
                      <h3 className="villa-title">{villa.name}</h3>
                      <p className="villa-excerpt">{villa.description}</p>
                      <div className="villa-amenities">
                        {villa.features.slice(0, 3).map((feat, fIdx) => (
                          <span className="amenity-chip" key={fIdx}>
                            <i data-lucide="sparkles"></i> {feat}
                          </span>
                        ))}
                      </div>
                      <div className="villa-footer">
                        <button className="detail-btn" onClick={() => window.openVillaModal(villa)}>
                          Chi Tiết Căn <i data-lucide="arrow-right"></i>
                        </button>
                        <button
                          className="liquid-btn book-villa-btn"
                          onClick={() => window.goToBookingPage({ roomTypeId: villa.dbId || villa.id })}
                        >
                          <span className="btn-text">Đặt Căn Này</span>
                          <span className="liquid-glow"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Sensory Soundscape Section */}
        <section className="section sensory-section" id="sensory">
          <div className="container">
            <div className="sensory-box">
              <div className="sensory-content">
                <div className="section-badge">
                  <i data-lucide="headphones"></i>
                  <span>TRỊ LIỆU ÂM THANH THIÊN NHIÊN</span>
                </div>
                <h2 className="sensory-title">Thính Âm Hoàng Liên Sơn</h2>
                <p className="sensory-desc">
                  Thư giãn tâm trí với âm thanh được thu âm trực tiếp đa hướng từ rừng thông nguyên sinh Sa Pa: tiếng suối róc rách, tiếng lá thông xào xạc trong gió chiều và ngọn lửa sưởi ấm đêm đông.
                </p>

                <div className="sound-tracks-controls">
                  <button className="track-btn active" data-sound="breeze">
                    <i data-lucide="wind"></i> Gió Rừng Thông
                  </button>
                  <button className="track-btn" data-sound="fire">
                    <i data-lucide="flame"></i> Lò Sưởi Đêm
                  </button>
                  <button className="track-btn" data-sound="rain">
                    <i data-lucide="cloud-rain"></i> Mưa Thung Lũng
                  </button>
                </div>

                <div className="volume-slider-wrap">
                  <i data-lucide="volume-1"></i>
                  <input type="range" id="sensory-volume" min="0" max="100" defaultValue="45" aria-label="Âm lượng" />
                  <i data-lucide="volume-2"></i>
                </div>
              </div>

              <div className="sensory-visual">
                <div className="zen-circle" id="zen-circle" title="Bấm để Bật/Tắt âm thanh thư giãn">
                  <div className="zen-ripple ripple-1"></div>
                  <div className="zen-ripple ripple-2"></div>
                  <div className="zen-center-orb">
                    <i data-lucide="play" id="zen-play-icon"></i>
                  </div>
                </div>
                <span className="zen-caption">Chạm vào vòng tròn để lắng nghe tiếng suối rừng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Experiences Section */}
        <section className="section experiences-section" id="experiences">
          <div className="container">
            <div className="section-header-row">
              <div>
                <div className="section-badge">
                  <i data-lucide="compass"></i>
                  <span>HÀNH TRÌNH CHỮA LÀNH TÂM HỒN</span>
                </div>
                <h2 className="section-title">Những Trải Nghiệm Độc Bản</h2>
              </div>
              <p className="section-subtitle">
                Mỗi khoảnh khắc tại Komorebi được thiết kế để kết nối bạn sâu sắc hơn với thiên nhiên và văn hóa bản địa vùng cao.
              </p>
            </div>

            <div className="exp-grid">
              <div className="exp-card" data-tilt>
                <div className="exp-img-wrap">
                  <img src="/landing/images/thien-nhien-kham-pha/images.jpg" alt="Tắm Khoáng Onsen" loading="lazy" />
                  <span className="exp-tag">Chữa Lành Cơ Thể</span>
                </div>
                <div className="exp-content">
                  <h3>Tắm Khoáng Thảo Dược Người Dao Đỏ</h3>
                  <p>Bài thuốc ngâm thảo dược gia truyền với hơn 30 vị thuốc rừng quý hiếm thu hái từ đại ngàn, giúp đả thông kinh mạch và xua tan mệt mỏi.</p>
                </div>
              </div>

              <div className="exp-card" data-tilt>
                <div className="exp-img-wrap">
                  <img src="/landing/images/an-uong-thu-gian/du-lich-am-thuc-1.jpg" alt="Thưởng Trà" loading="lazy" />
                  <span className="exp-tag">Văn Hóa Bản Địa</span>
                </div>
                <div className="exp-content">
                  <h3>Trà Đạo Shan Tuyết Trên Đỉnh Mây</h3>
                  <p>Nghi thức pha trà cổ truyền cùng chuyên gia bản địa, thưởng thức những búp trà phủ tuyết trắng xóa từ thân cây cổ thụ hàng trăm năm tuổi.</p>
                </div>
              </div>

              <div className="exp-card" data-tilt>
                <div className="exp-img-wrap">
                  <img src="/landing/images/van-hoa-trai-nghiem/du-lich-trai-nghiem-6.jpg" alt="Trekking Rừng Trúc" loading="lazy" />
                  <span className="exp-tag">Khám Phá Thiên Nhiên</span>
                </div>
                <div className="exp-content">
                  <h3>Trekking Rừng Trúc & Cơm Lam Rừng</h3>
                  <p>Hành trình đi bộ băng qua thung lũng hoa tam giác mạch, khám phá rừng trúc bí ẩn và thưởng thức bữa trưa đậm đà phong vị núi rừng.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Asymmetric Scenery Gallery Grid Section */}
        <section className="section scenery-section-new" id="panorama-section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <div className="section-badge">
                  <i data-lucide="compass"></i>
                  <span>ĐỊA ĐIỂM ĂN CHƠI & PHONG CẢNH SA PA</span>
                </div>
                <h2 className="section-title">Hành Trình Khám Phá & Ăn Chơi Sa Pa</h2>
              </div>
              <p className="section-subtitle">
                Bấm vào từng địa điểm bên dưới để xem bài viết review chi tiết, cẩm nang ẩm thực & kinh nghiệm check-in từ Lá Đỏ Homestay.
              </p>
            </div>

            <div className="scenery-grid">
              {(liveArticles.length > 0 ? liveArticles : SCENERY_ARTICLES).map((article, idx) => (
                <div
                  key={article.id || idx}
                  className={`scenery-card ${idx === 0 || idx === 3 ? 'large' : 'small'}`}
                  data-cursor="ĐỌC REVIEW"
                  onClick={() => setSelectedArticle(article)}
                  title={`Xem bài review: ${article.title}`}
                >
                  <div className="scenery-img-wrap">
                    <img src={article.coverImage} alt={article.title} loading="lazy" />
                    <div className="scenery-overlay"></div>
                    <div className="scenery-badge-action">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                      <span>Đọc bài review</span>
                    </div>
                    <div className="scenery-info">
                      <span className="scenery-tag">{article.tag}</span>
                      <h4>{article.title.split(':')[0]}</h4>
                      <p>{article.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guest Reviews Section */}
        <section className="section reviews-section" id="reviews">
          <div className="container">
            <div className="section-badge">
              <i data-lucide="heart"></i>
              <span>ĐÁNH GIÁ TỪ GOOGLE MAPS & KHÁCH LƯU TRÚ</span>
            </div>
            <h2 className="section-title">Cảm Nhận Chân Thực Tại Lá Đỏ Homestay</h2>

            <div className="reviews-slider">
              {(publicReviews.length > 0 ? publicReviews : [
                {
                  reviewId: 1,
                  customerName: 'Nguyễn Khánh Linh',
                  customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  roomTypeName: 'Phòng Panorama View Thung Lũng',
                  ratingStars: 5,
                  comment: 'Lá Đỏ Homestay view đỉnh nóc kịch trần luôn mọi người ơi! Ngồi ban công vừa nhâm nhi tách cà phê nóng vừa ngắm trọn đoàn tàu Mường Hoa màu đỏ chạy qua thung lũng giữa biển mây Hoàng Liên Sơn siêu đẹp. Phòng ốc bằng gỗ pơ-mu thơm dịu, chăn đệm sưởi ấm cúng, nước nóng cực mạnh.',
                },
                {
                  reviewId: 2,
                  customerName: 'Trần Đức Minh',
                  customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                  roomTypeName: 'Phòng Đôi Ban Công Mây',
                  ratingStars: 5,
                  comment: 'Homestay nằm ở số 31 Hoàng Liên, không gian yên tĩnh và mộc mạc. Buổi sáng thức dậy kéo rèm ra là mây tràn vào sát cửa kính. Đồ ăn sáng và cà phê ở quán Lá Đỏ ngon, giá cả rất hợp lý so với mặt bằng Sa Pa. Chắc chắn sẽ quay lại!',
                },
                {
                  reviewId: 3,
                  customerName: 'Lê Anh Khoa',
                  customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
                  roomTypeName: 'Phòng Gia Đình Hoàng Liên',
                  ratingStars: 5,
                  comment: 'Vị trí đắc địa cách Nhà thờ Đá và Sun Plaza chỉ 5-7 phút đi bộ. Bờ kè đá trước homestay chụp ảnh sống ảo góc nào cũng ra ảnh thơ mộng. Tối đến homestay hỗ trợ set up tiệc nướng BBQ ngoài trời ngắm thung lũng về đêm lung linh ánh đèn.',
                }
              ]).slice(0, 6).map((rev) => (
                <div className="review-card" key={rev.reviewId || rev.id} data-tilt>
                  <div className="review-stars">
                    {'★'.repeat(Math.max(1, Math.min(5, Math.round(rev.ratingStars || 5))))}
                  </div>
                  <blockquote className="review-quote">
                    "{rev.comment}"
                  </blockquote>
                  <div className="reviewer-info">
                    <img
                      src={resolveImageUrl(rev.customerAvatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                      alt={rev.customerName}
                      className="reviewer-avatar"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div>
                      <span className="reviewer-name">{rev.customerName || 'Khách lưu trú'}</span>
                      <span className="reviewer-role">
                        {rev.roomTypeName ? `${rev.roomTypeName} • ` : ''}Đánh giá đã xác thực ✓
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location & Directions Section */}
        <section className="section location-section" id="location">
          <div className="container">
            <div className="location-container">
              <div className="location-content">
                <div className="section-badge">
                  <i data-lucide="map-pin"></i>
                  <span>ĐỊA ĐIỂM & ĐƯỜNG ĐI</span>
                </div>
                <h2 className="section-title">Ẩn Mình Giữa Thung Lũng Mây Mường Hoa</h2>
                <p className="section-subtitle">
                  Komorebi Sanctuary tọa lạc tại mỏm đồi biệt lập cao 1,650m, cách trung tâm thị xã Sa Pa khoảng 8.5km về phía Đông Nam.
                </p>

                <div className="location-details-grid">
                  <div className="location-detail-card">
                    <i data-lucide="navigation"></i>
                    <div>
                      <h4>Tọa Độ Bản Đồ</h4>
                      <p>22°20'08.4"N 103°50'42.1"E • Thôn Hầu Thào, Sa Pa, Lào Cai</p>
                    </div>
                  </div>

                  <div className="location-detail-card">
                    <i data-lucide="car"></i>
                    <div>
                      <h4>Xe Đón Tận Nơi</h4>
                      <p>Dịch vụ xe riêng Limousine đón trả tận sân bay Nội Bài hoặc trung tâm Sa Pa.</p>
                    </div>
                  </div>

                  <div className="location-detail-card">
                    <i data-lucide="mountain"></i>
                    <div>
                      <h4>Khí Hậu & Nhiệt Độ</h4>
                      <p>Quanh năm se lạnh 15°C – 22°C, sương phủ sáng sớm và chiều tà.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="location-map-card">
                <iframe
                  title="Google Map Komorebi Sanctuary"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118598.63664797816!2d103.78453488667537!3d22.336362547141517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x36cd410c59e74249%3A0xbbe0a7fb0d63ba42!2zU2EgUGEsIEzDoG8gQ2FpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* Pre-Footer Call to Action Banner */}
        <section className="cta-banner-section">
          <div className="container">
            <div className="cta-banner-card">
              <div className="cta-banner-content">
                <span className="cta-pretitle">KHỞI ĐẦU HÀNH TRÌNH TĨNH TẠI</span>
                <h2 className="cta-banner-title">Hãy Để Cơ Thể & Tâm Hồn Bạn Được Nghỉ Ngơi</h2>
                <p className="cta-banner-desc">
                  Đặt phòng trực tuyến ngay hôm nay để nhận ưu đãi giảm 15% gói Onsen khoáng nóng thảo dược và xe Limousine khứ hồi miễn phí.
                </p>
                <div className="cta-banner-btns">
                  <button className="liquid-btn cta-large-btn" onClick={() => window.goToBookingPage()}>
                    <span className="btn-text">Đặt Chỗ Trực Tuyến Ngay</span>
                    <i data-lucide="sparkles"></i>
                    <span className="liquid-glow"></span>
                  </button>
                  <a href="tel:0869544586" className="ghost-btn call-concierge-btn">
                    <i data-lucide="phone-call"></i>
                    <span>Tư Vấn Trực Tiếp Quản Gia</span>
                  </a>
                </div>
              </div>
              <div className="cta-banner-badge">
                <div className="badge-ring">
                  <span>ĐẶT TRỰC TIẾP GIẢM 15% • TẶNG NƯỚC TẮM THẢO DƯỢC</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-container">
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="footer-leaf">🍁</span>
              <span className="brand-name">LÁ ĐỎ HOMESTAY SAPA</span>
            </div>
            <p className="footer-bio">
              Khu nghỉ dưỡng sinh thái biệt lập giữa thung lũng Mường Hoa, Sa Pa, Lào Cai. Điểm đến cho những tâm hồn kiếm tìm sự thanh lọc và bình yên nguyên bản.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram"><i data-lucide="instagram"></i></a>
              <a href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
              <a href="#" aria-label="Youtube"><i data-lucide="youtube"></i></a>
              <a href="#" aria-label="Mail"><i data-lucide="mail"></i></a>
              <a
                href={import.meta.env.VITE_DEPLOY_URL || 'https://reminder-strife-awoke.ngrok-free.dev'}
                target="_blank"
                rel="noreferrer"
                aria-label="Deploy Link Co Dinh"
                title="Truy cập hệ thống Online (Link Cố Định Vĩnh Viễn)"
              >
                <i data-lucide="cloud"></i>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Khám Phá</h4>
            <ul className="footer-links">
              <li><a href="#villas">The Glass Pine Pavilion</a></li>
              <li><a href="#villas">Cloud Crest Loft</a></li>
              <li><a href="#villas">Mizu Stream Retreat</a></li>
              <li><a href="#villas">Aether Star Observatory</a></li>
              <li><a href="#experiences">Tắm Khoáng Onsen Thảo Dược</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Thông Tin Lưu Trú</h4>
            <ul className="footer-links">
              <li><a href="/home">Về Trang Chủ Lá Đỏ Homestay</a></li>
              <li><a href="/rooms">Danh Sách Tất Cả Phòng</a></li>
              <li><a href="/amenities">Dịch Vụ & Tiện Nghi</a></li>
              <li><a href="/booking-history">Tra Cứu Đặt Phòng</a></li>
              <li><a href="#">Chính Sách Nhận & Trả Phòng</a></li>
            </ul>
          </div>

          <div className="footer-col contact-col">
            <h4 className="footer-heading">Liên Hệ & Đặt Chỗ</h4>
            <p><i data-lucide="map-pin"></i> Số 031 Hoàng Liên, Phường Sa Pa, Thị xã Sa Pa, Lào Cai</p>
            <p><i data-lucide="phone"></i> Hotline / Zalo: 0941 186 699 (Lễ tân Sa Pa)</p>
            <p><i data-lucide="mail"></i> ladohomestaysapa@gmail.com</p>
            <div className="shuttle-info-box">
              <i data-lucide="car"></i> Xe limousine cao cấp đón trả tận nơi từ trung tâm Hà Nội hoặc Sa Pa.
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p>© 2026 Lá Đỏ Homestay • Komorebi Sanctuary Retreat. Mọi quyền được bảo lưu.</p>
            <p className="design-credit">Thiết kế & Tương tác 3D WebGL theo chuẩn ThreeUI & GSAP</p>
          </div>
        </div>
      </footer>

      {/* Booking Drawer / Modal */}
      <div className="booking-drawer-overlay" id="booking-drawer-overlay">
        <div className="booking-drawer" id="booking-drawer">
          <div className="drawer-header">
            <div>
              <span className="drawer-pretitle">ĐẶT PHÒNG TRỰC TIẾP</span>
              <h3 className="drawer-title" id="drawer-villa-title">The Glass Pine Pavilion</h3>
            </div>
            <button className="drawer-close-btn" id="drawer-close-btn" aria-label="Đóng">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form className="drawer-form" id="booking-form" onSubmit={(e) => { e.preventDefault(); window.submitBooking(); }}>
            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="b-checkin">Ngày Nhận Phòng</label>
                <input type="date" id="b-checkin" required defaultValue={today} onChange={() => window.calculateBookingTotal()} />
              </div>
              <div className="form-group">
                <label htmlFor="b-checkout">Ngày Trả Phòng</label>
                <input type="date" id="b-checkout" required defaultValue={tomorrow} onChange={() => window.calculateBookingTotal()} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="b-villa-select">Lựa Chọn Hạng Villa / Phòng</label>
              <select id="b-villa-select" onChange={() => window.onDrawerVillaChange()}>
                {dbRooms.length > 0 ? (
                  dbRooms.map((room) => (
                    <option key={room.id || room.roomTypeId} value={room.id || room.roomTypeId} data-price={getRoomPrice(room)}>
                      {room.name || `Căn ${room.id}`} ({formatVND(getRoomPrice(room))}/đêm)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="glass-pine" data-price="3850000">The Glass Pine Pavilion (3.850.000₫/đêm)</option>
                    <option value="cloud-crest" data-price="4200000">Cloud Crest Loft (4.200.000₫/đêm)</option>
                    <option value="mizu-stream" data-price="4650000">Mizu Stream Retreat (4.650.000₫/đêm)</option>
                    <option value="aether-dome" data-price="5200000">Aether Star Observatory (5.200.000₫/đêm)</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="b-guests">Số Khách</label>
                <select id="b-guests">
                  <option value="2">2 Người lớn</option>
                  <option value="1">1 Khách</option>
                  <option value="3">3 Khách</option>
                  <option value="4">4 Khách</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="b-phone">Số Điện Thoại / Zalo</label>
                <input type="tel" id="b-phone" placeholder="09xx xxx xxx" />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="price-summary-card">
              <div className="summary-row">
                <span id="summary-nights">1 đêm x 3.850.000₫:</span>
                <span id="summary-room-subtotal">3.850.000₫</span>
              </div>
              <div className="summary-row discount-row">
                <span>Ưu đãi đặt trực tiếp (-15%):</span>
                <span id="summary-discount">-577.500₫</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>TỔNG THANH TOÁN DỰ KIẾN:</span>
                <strong id="summary-total">3.272.500₫</strong>
              </div>
            </div>

            <button type="submit" className="liquid-btn drawer-submit-btn" id="confirm-booking-btn">
              <span className="btn-text">Chuyển Sang Giao Diện Đặt Phòng Web</span>
              <i data-lucide="arrow-right"></i>
              <span className="liquid-glow"></span>
            </button>

            <p className="drawer-policy">
              <i data-lucide="shield-check"></i> Bạn sẽ được chuyển tới giao diện đặt phòng chính thức của Lá Đỏ Homestay để chọn phòng & thanh toán trực tuyến an toàn.
            </p>
          </form>
        </div>
      </div>

      {/* Villa Detail Modal */}
      <div className="modal-overlay" id="villa-modal-overlay">
        <div className="modal-card" id="villa-modal-card">
          <button className="modal-close-btn" id="modal-close-btn"><i data-lucide="x"></i></button>
          <div className="modal-inner" id="villa-modal-content"></div>
        </div>
      </div>

      {/* Virtual 3D Tour Modal */}
      <div className="modal-overlay" id="tour-modal-overlay">
        <div className="modal-card tour-modal-card" id="tour-modal-card">
          <button className="modal-close-btn" id="tour-modal-close-btn"><i data-lucide="x"></i></button>
          <div className="tour-header">
            <span className="badge-dot"></span>
            <h3>Trải Nghiệm Toàn Cảnh 3D Komorebi Sanctuary</h3>
            <p>Di chuột hoặc kéo thả để tương tác với bầu không khí và sương mù 3D thực tế ảo.</p>
          </div>
          <div className="tour-canvas-wrap" id="tour-canvas-wrap">
            <div className="tour-controls-hud">
              <button className="hud-btn" id="hud-camera-toggle"><i data-lucide="rotate-3d"></i> Đổi Góc Nhìn</button>
              <span className="hud-info">Kéo thả chuột để quay 360°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className="toast-notification" id="toast">
        <i data-lucide="check" className="toast-icon"></i>
        <span className="toast-message" id="toast-msg">Thành công!</span>
      </div>

      {/* Travel Scenery & Food Article Review Modal */}
      {selectedArticle && (
        <ArticleReviewModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onBookRoom={() => {
            setSelectedArticle(null);
            window.goToBookingPage();
          }}
        />
      )}

      {/* Floating 3 Contact Buttons */}
      <FloatingContactWidget />
    </div>
  );
}

export default LandingPage;
