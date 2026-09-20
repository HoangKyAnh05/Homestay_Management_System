import { useState, useEffect, useRef, useMemo } from 'react';
import './LandingPage.css';
import { LandingApp, VILLAS_DATA } from './LandingController';
import { resolveImageUrl } from '../../utils/imageUrl';
import FloatingContactWidget from '../../components/FloatingContact/FloatingContactWidget';
import ArticleReviewModal from './ArticleReviewModal';
import RoomScheduleCalendarModal from '../../components/RoomScheduleCalendar/RoomScheduleCalendarModal';
import PolicyModal from '../../components/PolicyModal/PolicyModal';
import MiniMap from '../../components/MiniMap/MiniMap';
import { SCENERY_ARTICLES } from './sceneryArticles';
import CinemaZenMode from './CinemaZenMode';
import AmbientEffectsLayer from './AmbientEffectsLayer';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function buildMonth(baseDate, offset) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1)
  const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
  return {
    title: new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(firstDay),
    year: firstDay.getFullYear(),
    monthIndex: firstDay.getMonth(),
    leading: (firstDay.getDay() + 6) % 7,
    days: lastDay.getDate(),
  }
}

function formatMainDate(date) {
  if (!date) return 'Chọn ngày'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatWeekday(date) {
  if (!date) return 'Ngày lưu trú'
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date)
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

function isBetweenDates(date, startDate, endDate) {
  if (!startDate || !endDate) return false
  return date > startDate && date < endDate
}

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
    '/home_1/image.png',
    '/home_2/image_1.jpg',
    '/home_3/image_3.jpg',
    '/home_4/image_1.jpg',
    '/home_5/image_1.jpg'
  ];
  const idNum = Math.max(1, Number(roomTypeId) || 1);
  const idx = (idNum - 1) % fallbacks.length;
  return fallbacks[idx];
}

function getRoomPrice(room) {
  if (!room) return 3850000;
  if (room.price != null && Number(room.price) > 0) return Number(room.price);
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) return Number(room.weekdayPrice);
  if (room.weekendPrice != null && Number(room.weekendPrice) > 0) return Number(room.weekendPrice);
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const validPrices = room.prices.map((p) => Number(p.price || 0)).filter((p) => p > 0);
    if (validPrices.length > 0) return Math.min(...validPrices);
  }
  return 3850000;
}

const SHOWROOM_ITEMS = [
  {
    id: 'stone-ledge',
    title: 'Bờ Kè Đá Săn Mây',
    category: 'MÂY NGÀN MƯỜNG HOA',
    time: '05:45 - 07:00 Sáng',
    timeSlot: 'dawn',
    image: '/landing/images/sapa_real/la_do_homestay_real.jpg',
    badge: '✨ Giờ Vàng: 05:45 - 07:00 Sáng',
    desc: 'Độc check-in huyền thoại ôm trọn thung lũng Mường Hoa. Biển mây cuộn tràn sát bậc thềm đá tự nhiên ngay trước cửa homestay.',
    tips: 'Đứng nghiêng 45° đón tia nắng đầu tiên xuyên qua rặng thông Hoàng Liên Sơn.'
  },
  {
    id: 'cafe-sunset',
    title: 'Quán Cà Phê Lá Đỏ Sunset',
    category: 'HOÀNG HÔN TRIỆU VIEW',
    time: '16:45 - 17:45 Chiều',
    timeSlot: 'sunset',
    image: '/landing/images/sapa_real/la_do_cafe_balcony.jpg',
    badge: '✨ Giờ Vàng: 16:45 - 17:45 Chiều',
    desc: 'Thưởng thức ly cà phê mộc đậm đà trong lúc ngắm ráng chiều hoàng hôn tím phủ kín đỉnh Fansipan hùng vĩ.',
    tips: 'Chụp ngược sáng lấy bóng silhouette ly trà bốc khói mờ ảo bên khung cửa gỗ.'
  },
  {
    id: 'herbal-bath',
    title: 'Bồn Tắm Lá Thuốc Dao Đỏ',
    category: 'TRỊ LIỆU THẢO MỘC NÚI RỪNG',
    time: '18:00 - 21:00 Tối',
    timeSlot: 'night',
    image: '/landing/images/sapa_real/tam_la_thuoc_dao_do.jpg',
    badge: '🌿 Thư Giãn: 18:00 - 21:00 Tối',
    desc: 'Bồn gỗ Pơ-mu ngoài trời dẫn nước khoáng thảo dược từ 30 vị lá rừng Hoàng Liên Sơn, vừa ngâm mình thư thái vừa ngắm mây bay.',
    tips: 'Góc chụp cận làn khói thảo mộc bay trên mặt nước và bọt khoáng tự nhiên.'
  }
];

const MOODS_LIST = [
  { id: 'dawn', icon: '🌅', label: 'Bình Minh Biển Mây', shortLabel: 'Dawn' },
  { id: 'sunset', icon: '🌄', label: 'Hoàng Hôn Tím Fansipan', shortLabel: 'Sunset' },
  { id: 'night', icon: '🌌', label: 'Đêm Trăng & Sao Sa Pa', shortLabel: 'Night' },
  { id: 'mist', icon: '☁️', label: 'Rạng Đông Sương Mù', shortLabel: 'Mist' },
];

function LandingPage() {
  const [isZenCinemaOpen, setIsZenCinemaOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeShowroomTab, setActiveShowroomTab] = useState('all');
  const [dbRooms, setDbRooms] = useState([]);
  const dbRoomsRef = useRef([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [scheduleModalVilla, setScheduleModalVilla] = useState(null);
  const [policyModal, setPolicyModal] = useState({ isOpen: false, tab: 'checkin' });
  const [liveArticles, setLiveArticles] = useState([]);
  const [activeSeason, setActiveSeason] = useState('autumn');
  const [activeMood, setActiveMood] = useState('night');
  const moodTimerRef = useRef(null);

  // 5s Auto Cycle Atmosphere Mood Switcher with smooth animation
  const resetMoodAutoCycle = () => {
    if (moodTimerRef.current) clearInterval(moodTimerRef.current);
    moodTimerRef.current = setInterval(() => {
      setActiveMood((prev) => {
        const nextIdx = (MOODS_LIST.findIndex((m) => m.id === prev) + 1) % MOODS_LIST.length;
        const nextMood = MOODS_LIST[nextIdx].id;
        document.documentElement.setAttribute('data-theme', nextMood);
        return nextMood;
      });
    }, 5000);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeMood);
    resetMoodAutoCycle();
    return () => {
      if (moodTimerRef.current) clearInterval(moodTimerRef.current);
    };
  }, []);

  const handleSelectMood = (moodId) => {
    setActiveMood(moodId);
    document.documentElement.setAttribute('data-theme', moodId);
    resetMoodAutoCycle();
  };

  // Auto open Zen Cinema Mode on #zen or ?zen=true
  useEffect(() => {
    const handleCheckZenHash = () => {
      if (window.location.hash === '#zen' || window.location.search.includes('zen=true')) {
        setIsZenCinemaOpen(true);
      }
    };
    handleCheckZenHash();
    window.addEventListener('hashchange', handleCheckZenHash);
    return () => window.removeEventListener('hashchange', handleCheckZenHash);
  }, []);

  // Luxury Custom Date Picker State for Booking Dock
  const dockRef = useRef(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState('checkin');
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  });

  const visibleMonths = useMemo(() => {
    const baseDate = checkInDate || new Date();
    return [buildMonth(baseDate, 0), buildMonth(baseDate, 1)];
  }, [checkInDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleSelectDockDate = (date) => {
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    if (date < todayZero) return;

    if (activeDateField === 'checkin') {
      setCheckInDate(date);
      const nextOut = new Date(date);
      nextOut.setDate(nextOut.getDate() + 1);
      setCheckOutDate(nextOut);
      setActiveDateField('checkout');
    } else {
      if (date <= checkInDate) {
        setCheckInDate(date);
        const nextOut = new Date(date);
        nextOut.setDate(nextOut.getDate() + 1);
        setCheckOutDate(nextOut);
        setActiveDateField('checkout');
        return;
      }
      setCheckOutDate(date);
      setIsCalendarOpen(false);
      setActiveDateField('checkin');
    }
  };

  const today = toDateKey(checkInDate);
  const tomorrow = toDateKey(checkOutDate);

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

      if (nightsEl) nightsEl.textContent = `${nights === 1 ? '2 ngày 1 đêm' : `${nights + 1} ngày ${nights} đêm`} x ${formatVND(pricePerNight)}:`;
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
          const allImgs = Array.isArray(found.imageUrls) && found.imageUrls.length > 0
            ? found.imageUrls.map(resolveImageUrl)
            : [img, img, img];
          villa = {
            id: found.id || found.roomTypeId,
            name: found.name || `Căn ${found.id}`,
            tagline: 'Phòng Nghỉ Dưỡng Sang Trọng',
            price: getRoomPrice(found),
            area: `${found.area || 85}m²`,
            guests: `${found.maxAdults || 2} Người lớn, ${found.maxChildren || 0} Trẻ em`,
            view: 'View Rừng Thông & Thung Lũng Mây',
            images: allImgs,
            videoUrl: found.videoUrl,
            description: found.description || 'Không gian nghỉ dưỡng tuyệt hảo giữa thiên nhiên Sa Pa trong lành.',
            features: ['Điều hòa 2 chiều', 'Wifi Starlink tốc độ cao', 'Nước khoáng & Trà thảo mộc', 'Bữa sáng bản địa'],
          };
        } else {
          villa = VILLAS_DATA['glass-pine'];
        }
      }

      const contentEl = document.getElementById('villa-modal-content');
      const overlay = document.getElementById('villa-modal-overlay');

      const galleryHtml = villa.videoUrl
        ? `
          <div class="modal-gallery" style="margin-bottom: 1.8rem; border-radius: 16px; overflow: hidden; background: #000;">
            <video src="${resolveImageUrl(villa.videoUrl)}" controls autoplay playsinline loop style="width: 100%; max-height: 340px; object-fit: cover; border-radius: 16px; display: block;"></video>
          </div>
        `
        : `
          <div class="modal-gallery" style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.8rem; margin-bottom: 1.8rem; border-radius: 16px; overflow: hidden; height: 320px;">
            <img src="${villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="display: flex; flex-direction: column; gap: 0.8rem; height: 100%;">
              <img src="${villa.images[1] || villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 50%; object-fit: cover;" />
              <img src="${villa.images[2] || villa.images[0]}" alt="${villa.name}" style="width: 100%; height: 50%; object-fit: cover;" />
            </div>
          </div>
        `;

      contentEl.innerHTML = `
        ${galleryHtml}
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h2 style="font-family: var(--font-serif-display); font-size: 1.8rem;">${villa.name}</h2>
          <span style="font-size: 1.4rem; font-weight: 700; color: #f5cf9e;">${formatVND(villa.price)} <small style="font-size: 0.82rem; color: var(--text-muted); font-weight: normal;">/ 2 ngày 1 đêm</small></span>
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
        const resolvedImages = Array.isArray(room.imageUrls) && room.imageUrls.length > 0
          ? room.imageUrls.map(resolveImageUrl)
          : [img, fallback.images[1], fallback.images[2]];
        return {
          id: room.id || room.roomTypeId,
          dbId: room.id || room.roomTypeId,
          name: room.name || fallback.name,
          tagline: room.roomTypeName || fallback.tagline,
          price: getRoomPrice(room),
          weekdayPrice: room.weekdayPrice != null ? Number(room.weekdayPrice) : null,
          weekendPrice: room.weekendPrice != null ? Number(room.weekendPrice) : null,
          area: `${room.area || (85 + idx * 25)}m²`,
          guests: `${room.maxAdults || 2} - ${(room.maxAdults || 2) + (room.maxChildren || 2)} Khách`,
          view: fallback.view || 'View Thung Lũng Mây',
          image: img,
          images: resolvedImages,
          videoUrl: room.videoUrl,
          description: room.description || fallback.description,
          features: fallback.features || ['Onsen Khoáng Nóng', 'Wifi Starlink', 'Loa Marshall', 'Bữa Sáng Bản Địa'],
          badge: idx === 0 ? 'Phổ Biến Nhất' : idx === 1 ? 'View Đẹp Nhất' : 'Không Gian Yên Tĩnh',
          category: (room.maxAdults || 2) > 2 ? 'family' : 'couple luxury',
        };
      })
    : defaultVillas.map((v) => ({ ...v, image: v.images[0], badge: v.tagline, category: 'couple luxury' }));

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = '';
  };

  return (
    <div className="landing-page-root">
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

      {/* 4K Cinematic Backdrop + WebGL Layer with 5s Smooth Crossfade */}
      <div className="webgl-canvas-container" id="canvas-container">
        <div className={`scenic-backdrop-layer backdrop-dawn ${activeMood === 'dawn' ? 'active' : ''}`}></div>
        <div className={`scenic-backdrop-layer backdrop-sunset ${activeMood === 'sunset' ? 'active' : ''}`}></div>
        <div className={`scenic-backdrop-layer backdrop-night ${activeMood === 'night' ? 'active' : ''}`}></div>
        <div className={`scenic-backdrop-layer backdrop-mist ${activeMood === 'mist' ? 'active' : ''}`}></div>
        <canvas id="webgl-canvas"></canvas>
        <div className="mist-overlay"></div>
        <div className="vignette-overlay"></div>
      </div>

      {/* Rich Ambient Layer: Floating Golden Fireflies, Maple Leaves & Mist */}
      <AmbientEffectsLayer />

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
            <a href="#showroom" className="nav-link">Trải Nghiệm</a>
            <a href="/rooms" className="nav-link">Phòng & Giá</a>
            <a href="#showroom" className="nav-link">Góc Sống Ảo 3D</a>
            <a href="#seasons-radar" className="nav-link">4 Mùa Sa Pa</a>
            <a href="#location" className="nav-link">Vị Trí</a>
            <a href="#contact-footer" className="nav-link">Liên Hệ</a>
          </nav>

          <div className="nav-actions">
            {/* Mood Switcher with 5s Auto Cycle & Smooth Animation */}
            <div className="mood-selector" title="Tự động chuyển cảnh sau mỗi 5s">
              {MOODS_LIST.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`mood-btn ${activeMood === m.id ? 'active' : ''}`}
                  onClick={() => handleSelectMood(m.id)}
                  aria-label={m.label}
                  title={m.label}
                >
                  <span className="mood-btn-icon">{m.icon}</span>
                  <span className="mood-btn-text">{m.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* 4K Cinema Zen Sanctuary Trigger Button */}
            <button
              type="button"
              className="header-zen-button"
              id="header-zen-btn"
              onClick={() => setIsZenCinemaOpen(true)}
              title="Mở Chế Độ Thả Hồn 4K (Cinema Zen Sanctuary)"
            >
              <span className="zen-live-pulse-dot"></span>
              <span className="zen-btn-text">✨ Thả Hồn</span>
              <span className="zen-glow-ring"></span>
            </button>

            <button className="liquid-btn nav-cta-btn" id="header-book-btn" onClick={() => window.goToBookingPage()}>
              <span className="btn-text">Đặt Phòng Ngay</span>
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
              <span className="badge-text">22°20'N 103°50'E • 1,650M ALTITUDE</span>
              <span className="live-weather" id="live-weather">
                <i data-lucide="cloud-rain" className="weather-icon"></i>
                <span>17°C • Sương Phủ Rừng Thông</span>
              </span>
            </div>

            <h1 className="hero-title">
              <span className="title-main" style={{ display: 'block' }}>CHẠM VÀO BIỂN MÂY NGÀN</span>
              <span className="title-sub-gold">SA PA – VIRTUAL SANCTUARY</span>
              <span className="title-sub-white">& 3D CLOUD RETREAT</span>
            </h1>

            <div className="hero-actions">
              <a href="#showroom" className="liquid-btn primary-hero-btn" id="hero-showroom-btn">
                <span className="btn-text">Khám Phá Góc Sống Ảo 3D</span>
                <span className="liquid-glow"></span>
              </a>

              <button
                type="button"
                className="liquid-btn hero-zen-action-btn"
                id="hero-zen-trigger-btn"
                onClick={() => setIsZenCinemaOpen(true)}
                title="Trải nghiệm ngắm biển mây Sa Pa 4K trực tiếp"
              >
                <span className="btn-text">✨ Thả Hồn 4K</span>
                <span className="liquid-glow"></span>
              </button>

              <a href="/rooms" className="ghost-btn" style={{ border: '1.5px solid rgba(226, 177, 115, 0.5)' }}>
                <i data-lucide="list"></i>
                <span>Xem Toàn Bộ Phòng</span>
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">05</span>
                <span className="stat-lbl">GÓC SỐNG ẢO</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-lbl">VIEW MÂY</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">4.98 ★</span>
                <span className="stat-lbl">ĐÁNH GIÁ</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Check-in Showroom Section */}
        <section className="section showroom-section" id="showroom">
          <div className="container">
            <div className="showroom-head-card">
              <div className="section-badge" style={{ margin: '0 auto 12px', display: 'inline-flex' }}>
                <i data-lucide="camera"></i>
                <span>✨ VIRTUAL SHOWROOM 3D</span>
              </div>
              <h2 className="showroom-main-title">5 Góc Sống Ảo "Triệu View" Tại Lá Đỏ</h2>
              <p className="showroom-main-desc">
                Không chỉ là nơi nghỉ dưỡng — Mỗi góc ban công và bờ đá tại Lá Đỏ Homestay đều là một khung hình điện ảnh. Di chuyển chuột vào từng khung hình để trải nghiệm góc nhìn 3D & xem bí quyết chụp ảnh đẹp nhất.
              </p>

              <div className="showroom-time-label">
                <span>⏰ KHUNG GIỜ TRẢI NGHIỆM ĐẸP NHẤT:</span>
              </div>

              {/* Time Filter Pills */}
              <div className="showroom-filter-dock">
                <button
                  type="button"
                  className={`filter-pill ${activeShowroomTab === 'dawn' ? 'active' : ''}`}
                  onClick={() => setActiveShowroomTab(activeShowroomTab === 'dawn' ? 'all' : 'dawn')}
                >
                  🌄 05:45 Sáng
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeShowroomTab === 'sunset' ? 'active' : ''}`}
                  onClick={() => setActiveShowroomTab(activeShowroomTab === 'sunset' ? 'all' : 'sunset')}
                >
                  🌅 17:15 Chiều
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeShowroomTab === 'night' ? 'active' : ''}`}
                  onClick={() => setActiveShowroomTab(activeShowroomTab === 'night' ? 'all' : 'night')}
                >
                  🌙 20:30 Đêm
                </button>
              </div>
            </div>

            {/* Showroom Cards Grid */}
            <div className="showroom-grid">
              {SHOWROOM_ITEMS.filter((item) => activeShowroomTab === 'all' || item.timeSlot === activeShowroomTab).map((item) => (
                <div
                  key={item.id}
                  className="showroom-tilt-card"
                  onClick={() => setSelectedPhoto(item)}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="showroom-img-wrap">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <span className="showroom-time-badge">{item.badge}</span>
                  </div>
                  <div className="showroom-card-body">
                    <div>
                      <span className="showroom-cat-tag">{item.category}</span>
                      <h3 className="showroom-card-title">{item.title}</h3>
                      <p className="showroom-card-desc">{item.desc}</p>
                    </div>
                    <div className="showroom-tips-box">
                      <strong>📸 Tips Chụp: </strong>
                      <span>{item.tips}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Asymmetric Scenery Gallery Grid Section */}
        <section className="section scenery-section-new" id="panorama-section">
          <div className="container">
            <div className="scenery-header-center" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
              <div className="section-badge" style={{ margin: '0 auto 12px', display: 'inline-flex' }}>
                <i data-lucide="compass"></i>
                <span>📍 ĐỊA ĐIỂM ĂN CHƠI & PHONG CẢNH SA PA</span>
              </div>
              <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: '1rem', color: '#fff' }}>
                Hành Trình Khám Phá & Ăn Chơi Sa Pa
              </h2>
              <p className="section-subtitle" style={{ color: '#cbd5e1', fontSize: '0.96rem', lineHeight: '1.6' }}>
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
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
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

        {/* Sa Pa 4 Seasons & Cloud Hunter Radar Guide */}
        <section className="section seasons-radar-section" id="seasons-radar">
          <div className="container">
            <div className="scenery-header-center" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.8rem' }}>
              <div className="section-badge" style={{ margin: '0 auto 12px', display: 'inline-flex' }}>
                <i data-lucide="sun"></i>
                <span>☁️ SỔ TAY SĂN MÂY & 4 MÙA SA PA</span>
              </div>
              <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: '1rem', color: '#fff' }}>
                Sa Pa 4 Mùa & Cẩm Nang Săn Mây Toàn Diện
              </h2>
              <p className="section-subtitle" style={{ color: '#cbd5e1', fontSize: '0.96rem', lineHeight: '1.65' }}>
                Khám phá nhịp điệu đất trời Tây Bắc theo từng mùa, radar tỷ lệ biển mây, gợi ý phối đồ (OOTD) và bí kíp sống ảo độc quyền từ Lá Đỏ Homestay.
              </p>

              {/* Season Switcher Pills */}
              <div className="season-tabs-dock" style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '1.8rem' }}>
                {[
                  { id: 'spring', icon: '🌸', name: 'Mùa Xuân (T2 - T4)', label: 'Hoa Mận Trắng Rừng' },
                  { id: 'summer', icon: '🌿', name: 'Mùa Hè (T5 - T8)', label: 'Trốn Nóng & Nước Đổ' },
                  { id: 'autumn', icon: '🌾', name: 'Mùa Thu (T9 - T10)', label: 'Lúa Chín & Biển Mây' },
                  { id: 'winter', icon: '❄️', name: 'Mùa Đông (T11 - T1)', label: 'Băng Tuyết Hoàng Liên' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`season-tab-btn ${activeSeason === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSeason(s.id)}
                  >
                    <span className="season-icon">{s.icon}</span>
                    <span className="season-name">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Season Interactive Showcase Card */}
            {(() => {
              const SEASONS_INFO = {
                spring: {
                  title: 'Mùa Xuân Sa Pa: Ngàn Hoa Khoe Sắc & Mây Xuân Mờ Ảo',
                  badge: '🌸 Tháng 2 - Tháng 4',
                  image: '/landing/images/homestay/ava-mau-nha-homestay-dep-800x800.jpg',
                  temp: '12°C – 18°C • Nắng sớm dịu nhẹ, se lạnh về đêm',
                  cloudChance: '85% Tỷ Lệ Săn Mây Thung Lũng',
                  cloudTime: '06:00 - 08:30 Sáng sương mờ',
                  ootd: 'Áo len dệt kim mỏng, váy hoa Boho/Thổ cẩm, tone be - nâu - trắng kem vintage',
                  food: 'Thắng cố ngựa truyền thống, lợn cắp nách quay mật ong, rau mầm đá luộc chấm muối vừng',
                  spot: 'Đồi hoa mận Ô Long, bản Tả Phìn ngập sắc hoa đào rừng',
                  photoTip: 'Chụp góc ngược sáng lúc bình minh để cánh hoa mận nổi bật trên nền thung lũng mây trắng.',
                },
                summer: {
                  title: 'Mùa Hè Sa Pa: Trốn Nóng 20°C & Mùa Nước Đổ Lấp Lánh',
                  badge: '🌿 Tháng 5 - Tháng 8',
                  image: '/landing/images/rooftop/cinema_zen_balcony.jpg',
                  temp: '18°C – 24°C • Khí hậu ôn đới mát lạnh như Châu Âu',
                  cloudChance: '90% Mây Mưa Thác Bạc & Cầu Vồng',
                  cloudTime: 'Sau cơn mưa rào mùa hạ (15:00 - 17:00)',
                  ootd: 'Váy maxi dài màu nổi (đỏ, vàng mù tạt, xanh rêu), nón cói, kính râm thời thượng',
                  food: 'Cá hồi Sa Pa sashimi & gỏi chua, cá tầm nướng muối ớt, rau su su xào tỏi thơm giòn',
                  spot: 'Thung lũng Mường Hoa mùa nước đổ như gương trời, đèo Ô Quy Hồ ngắm hoàng hôn',
                  photoTip: 'Chụp góc toàn cảnh lấy trọn mặt nước ruộng bậc thang phản chiếu bầu trời mùa hạ.',
                },
                autumn: {
                  title: 'Mùa Thu Sa Pa: Mùa Lúa Chín Vàng Rực & Biển Mây Ngút Ngàn',
                  badge: '🌾 Tháng 9 - Tháng 10 (Mùa Đẹp Nhất)',
                  image: '/landing/images/rooftop/la_do_sunset.jpg',
                  temp: '14°C – 20°C • Trời trong xanh biếc, nắng vàng mật ong',
                  cloudChance: '98% Tỷ Lệ Săn Mây Vàng (Đỉnh Điểm)',
                  cloudTime: '05:30 - 08:00 Sáng & 17:00 Hoàng hôn',
                  ootd: 'Cardigan len tone cam đất/nâu caramel, khăn choàng thổ cẩm dệt tay, mũ nồi beret',
                  food: 'Cốm non Tây Bắc, gà đen nướng mắc khén ăn kèm xôi nếp nương ngũ sắc thơm dẻo',
                  spot: 'Bờ kè đá Lá Đỏ ngắm thung lũng vàng ruộm, bản Ý Linh Hồ & Tả Van mộng mơ',
                  photoTip: 'Căn góc máy 45° lúc 06:15 sáng khi tia nắng đầu tiên xuyên qua biển mây chiếu rọi ruộng bậc thang.',
                },
                winter: {
                  title: 'Mùa Đông Sa Pa: Săn Băng Tuyết Hoàng Liên & Biển Mây Bồng Bềnh',
                  badge: '❄️ Tháng 11 - Tháng 1 (Mùa Săn Mây & Tuyết)',
                  image: '/landing/images/homestay/homestay-quan-1-2.png',
                  temp: '3°C – 10°C • Lạnh buốt đặc trưng, có thể có băng tuyết',
                  cloudChance: '95% Biển Mây Cuộn Nghìn Lớp Dày Đặc',
                  cloudTime: 'Suốt cả ngày khi trời hửng nắng',
                  ootd: 'Áo măng-tô dạ dáng dài, áo phao lông vũ, găng tay & khăn len to bản, boot da ấm áp',
                  food: 'Lẩu cá hồi nghi ngút khói, hạt dẻ nướng bùi béo, ngô nướng than hoa, trà gừng nóng',
                  spot: 'Chóp đỉnh Fansipan 3.143m săn băng tuyết, ban công ấm áp bên lò sưởi Lá Đỏ',
                  photoTip: 'Chụp cận cảnh cốc cà phê/trà nóng bốc khói mờ ảo bên khung cửa sổ phủ sương lạnh ngắm biển mây.',
                },
              };

              const current = SEASONS_INFO[activeSeason] || SEASONS_INFO.autumn;

              return (
                <div
                  className="season-radar-card"
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="season-card-grid">
                    <div className="season-visual-pane">
                      <img src={current.image} alt={current.title} className="season-main-img" />
                      <div className="season-img-overlay"></div>
                      <span className="season-floating-badge">{current.badge}</span>
                      <div className="season-img-caption">
                        <h4>{current.title}</h4>
                      </div>
                    </div>

                    <div className="season-details-pane">
                      <div className="season-metrics-grid">
                        <div className="metric-tile">
                          <span className="metric-label">🌡️ KHÍ HẬU & NHIỆT ĐỘ</span>
                          <p className="metric-value">{current.temp}</p>
                        </div>

                        <div className="metric-tile highlight-gold">
                          <span className="metric-label">☁️ TỶ LỆ SĂN MÂY</span>
                          <p className="metric-value">{current.cloudChance}</p>
                          <small style={{ color: '#fbbf24', fontSize: '0.8rem', display: 'block', marginTop: '2px' }}>
                            ⏰ Giờ vàng: {current.cloudTime}
                          </small>
                        </div>

                        <div className="metric-tile">
                          <span className="metric-label">👗 GỢI Ý PHỐI ĐỒ (OOTD)</span>
                          <p className="metric-value">{current.ootd}</p>
                        </div>

                        <div className="metric-tile">
                          <span className="metric-label">🍲 MÓN NGON THEO MÙA</span>
                          <p className="metric-value">{current.food}</p>
                        </div>
                      </div>

                      <div className="season-tip-bar">
                        <div className="season-tip-content">
                          <strong>📸 Bí quyết chụp ảnh đẹp: </strong>
                          <span>{current.photoTip}</span>
                        </div>
                      </div>

                      <div className="season-action-row">
                        <button
                          type="button"
                          className="liquid-btn season-book-btn"
                          onClick={() => window.goToBookingPage()}
                        >
                          <span className="btn-text">Đặt Phòng Trải Nghiệm Mùa Này</span>
                          <span className="liquid-glow"></span>
                        </button>
                        <a href="#panorama-section" className="ghost-btn" style={{ padding: '0.65rem 1.4rem' }}>
                          <span>Xem Cẩm Nang Du Lịch</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
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
                <h2 className="section-title">Vị Trí Đắc Địa Tại Thị Trấn Sa Pa</h2>
                <p className="section-subtitle">
                  Lá Đỏ Homestay & Coffee tọa lạc tại số 31A Hoàng Liên, ngay trung tâm thị xã Sa Pa, ngắm trọn thung lũng mây và thuận tiện kết nối tới tất cả các điểm tham quan nổi tiếng.
                </p>

                <div className="location-details-grid">
                  <div className="location-detail-card">
                    <i data-lucide="navigation"></i>
                    <div>
                      <h4>Tọa Độ & Địa Chỉ</h4>
                      <p>22°20'01.7"N 103°50'39.1"E • 31A Hoàng Liên, Sa Pa, Lào Cai</p>
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
                <MiniMap height="380px" showExpandBtn={true} />
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
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://www.facebook.com/ladohomestay" target="_blank" rel="noreferrer" aria-label="Facebook" title="Lá Đỏ Homestay Facebook Fanpage">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="Youtube" title="Youtube">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                </svg>
              </a>
              <a href="mailto:ladohomestaysapa@gmail.com" aria-label="Mail" title="Gửi Email">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
              <a
                href={import.meta.env.VITE_DEPLOY_URL || 'https://reminder-strife-awoke.ngrok-free.dev'}
                target="_blank"
                rel="noreferrer"
                aria-label="Deploy Link Co Dinh"
                title="Truy cập hệ thống Online (Link Cố Định Vĩnh Viễn)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  <polyline points="13 11 9 16 13 16 11 21 17 14 13 14 14 11" />
                </svg>
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
              <li>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'checkin' })}
                >
                  Chính Sách Nhận & Trả Phòng
                </button>
              </li>
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
            <p>© 2026 Lá Đỏ Homestay & Coffee • Mountain & Cloud Retreat in Sa Pa. Mọi quyền được bảo lưu.</p>
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
                      {room.name || `Căn ${room.id}`} ({formatVND(getRoomPrice(room))}/ 2 ngày 1 đêm)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="glass-pine" data-price="3850000">The Glass Pine Pavilion (3.850.000₫/ 2 ngày 1 đêm)</option>
                    <option value="cloud-crest" data-price="4200000">Cloud Crest Loft (4.200.000₫/ 2 ngày 1 đêm)</option>
                    <option value="mizu-stream" data-price="4650000">Mizu Stream Retreat (4.650.000₫/ 2 ngày 1 đêm)</option>
                    <option value="aether-dome" data-price="5200000">Aether Star Observatory (5.200.000₫/ 2 ngày 1 đêm)</option>
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
                <span id="summary-nights">2 ngày 1 đêm x 3.850.000₫:</span>
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
            <h3>Trải Nghiệm Toàn Cảnh 3D Lá Đỏ Sanctuary</h3>
            <p>Di chuột hoặc kéo thả để tương tác với bầu không khí và sương mù 3D thực tế ảo.</p>
          </div>
          <div className="tour-canvas-wrap" id="tour-canvas-wrap">
            <div className="tour-controls-hud">
              <button className="hud-btn" id="hud-camera-toggle"><i data-lucide="rotate-3d"></i> Đổi Góc Nhìn</button>
              <a
                href="/explore"
                className="hud-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #881337, #e11d48)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                }}
                title="Khám phá bản đồ xung quanh Lá Đỏ"
              >
                <i data-lucide="map-pin"></i>
                <span>🗺️ Khám Phá Xung Quanh</span>
              </a>
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

      {/* Room Schedule Calendar Modal */}
      {scheduleModalVilla && (
        <RoomScheduleCalendarModal
          room={{
            roomTypeId: scheduleModalVilla.dbId || scheduleModalVilla.id,
            roomTypeName: scheduleModalVilla.name,
            id: scheduleModalVilla.dbId || scheduleModalVilla.id,
          }}
          onClose={() => setScheduleModalVilla(null)}
        />
      )}

      {/* Policy Modal */}
      <PolicyModal
        isOpen={policyModal.isOpen}
        initialTab={policyModal.tab}
        onClose={() => setPolicyModal({ isOpen: false, tab: 'checkin' })}
      />

      {/* Showroom Photo Detail Modal */}
      {selectedPhoto && (
        <div className="photo-lightbox-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Đóng"
            >
              ✕
            </button>
            <div className="photo-lightbox-img-wrap">
              <img src={selectedPhoto.image} alt={selectedPhoto.title} />
            </div>
            <div className="photo-lightbox-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.45rem', color: '#fff', margin: 0, fontWeight: 700 }}>{selectedPhoto.title}</h3>
                <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                  {selectedPhoto.badge}
                </span>
              </div>
              <p style={{ color: '#d1d5db', fontSize: '1rem', lineHeight: 1.6, marginBottom: '14px' }}>
                {selectedPhoto.desc}
              </p>
              <div className="showroom-tips-box">
                <strong>📸 Bí Quyết Check-in: </strong>
                <span>{selectedPhoto.tips}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinema Zen Sanctuary Mode (Chế Độ Thả Hồn 4K) */}
      {isZenCinemaOpen && (
        <CinemaZenMode isOpen={isZenCinemaOpen} onClose={() => setIsZenCinemaOpen(false)} />
      )}

      {/* Floating 3 Contact Buttons */}
      <FloatingContactWidget />
    </div>
  );
}

export default LandingPage;
