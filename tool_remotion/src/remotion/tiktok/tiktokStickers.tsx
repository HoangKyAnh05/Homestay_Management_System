import React from 'react';

export interface TikTokStickerItem {
  id: string;
  name: string;
  category: 'trending' | 'animal_meme' | 'classic' | 'censor_props';
  previewIcon: string;
  render: (scale?: number) => React.ReactNode;
}

export const TIKTOK_STICKERS: TikTokStickerItem[] = [
  // ==========================================
  // NHÓM 1: TRENDING & NÚT HÀNH ĐỘNG
  // ==========================================
  {
    id: 'stk_like_follow',
    name: 'LIKE & FOLLOW (Nút 3D Đỏ Xanh)',
    category: 'trending',
    previewIcon: '👍',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transform hover:scale-105 transition-transform">
        <div className="px-6 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-xl text-white text-xs font-black uppercase flex items-center gap-1.5 border border-blue-400">
          <span>👍</span>
          <span>LIKE</span>
        </div>
        <div className="px-8 py-2 bg-gradient-to-r from-red-600 to-rose-500 rounded-b-xl text-white text-base font-black uppercase tracking-wider border border-red-400">
          FOLLOW
        </div>
      </div>
    )
  },
  {
    id: 'stk_subscribe_bell',
    name: 'SUBSCRIBE (Kèm Chuông & Nút Like)',
    category: 'trending',
    previewIcon: '🔔',
    render: () => (
      <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-black/90 border border-white/30 shadow-2xl backdrop-blur-md select-none">
        <span className="text-lg">👍</span>
        <div className="px-3.5 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wide shadow-md">
          SUBSCRIBE
        </div>
        <span className="text-base animate-swing">🔔</span>
      </div>
    )
  },

  // ==========================================
  // NHÓM 2: CLASSIC ICONS (Từ Ảnh 4 bạn gửi)
  // ==========================================
  // 1. Bàn tay chỉ 3D 👆
  {
    id: 'stk_hand_pointer_3d',
    name: 'Bàn Tay Chỉ 3D Phóng To',
    category: 'classic',
    previewIcon: '👆',
    render: () => (
      <div className="text-7xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none animate-bounce">
        👆
      </div>
    )
  },

  // 2. Mũi tên pixel hồng chỉ xuống ⬇️
  {
    id: 'stk_pixel_pink_arrow',
    name: 'Mũi Tên Pixel Hồng Chỉ Xuống',
    category: 'classic',
    previewIcon: '⬇️',
    render: () => (
      <div className="select-none animate-bounce-arrow filter drop-shadow-[0_8px_15px_rgba(244,114,182,0.9)]">
        <svg width="55" height="70" viewBox="0 0 60 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 5H40V40H55L30 70L5 40H20V5Z"
            fill="#F43F5E"
            stroke="#000000"
            strokeWidth="5"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    )
  },

  // 3. Đinh ghim đỏ 3D 📌
  {
    id: 'stk_red_pushpin_3d',
    name: 'Đinh Ghim Đỏ 3D',
    category: 'classic',
    previewIcon: '📌',
    render: () => (
      <div className="text-7xl filter drop-shadow-[0_12px_20px_rgba(239,68,68,0.7)] select-none rotate-[-15deg]">
        📌
      </div>
    )
  },

  // 4. Mũi tên cong vàng ↩️
  {
    id: 'stk_curved_yellow_arrow',
    name: 'Mũi Tên Cong Vàng Chỉ Điểm',
    category: 'classic',
    previewIcon: '↩️',
    render: () => (
      <div className="text-6xl filter drop-shadow-[0_6px_15px_rgba(250,204,21,0.9)] select-none animate-pulse">
        ↩️
      </div>
    )
  },

  // 5. Dấu tích tròn xanh ✔️
  {
    id: 'stk_green_checkmark_circle',
    name: 'Dấu Tích Tròn Xanh Hoàn Thành',
    category: 'classic',
    previewIcon: '✔️',
    render: () => (
      <div className="w-16 h-16 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-2xl select-none">
        <span className="text-white text-3xl font-black">✓</span>
      </div>
    )
  },

  // 6. Nhịp tim ECG neon 📈
  {
    id: 'stk_neon_heartbeat',
    name: 'Nhịp Tim ECG Neon Nhiều Màu',
    category: 'classic',
    previewIcon: '📈',
    render: () => (
      <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-black/80 border border-cyan-400 shadow-xl select-none">
        <span className="text-2xl animate-pulse">📈</span>
        <span className="text-cyan-400 font-mono text-sm font-black">LIVE PULSE</span>
      </div>
    )
  },

  // 7. Thỏ hồng ôm tim 🐰
  {
    id: 'stk_cute_pink_bunny',
    name: 'Thỏ Hồng Dễ Thương Ôm Tim',
    category: 'classic',
    previewIcon: '🐰',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl animate-bounce-gentle">
        <span className="text-7xl">🐰</span>
        <span className="text-2xl -mt-3">💖</span>
      </div>
    )
  },

  // 8. Trái tim bay 3D hồng 💕
  {
    id: 'stk_floating_hearts_3d',
    name: 'Trái Tim Bay 3D Bồng Bềnh',
    category: 'classic',
    previewIcon: '💕',
    render: () => (
      <div className="flex items-center gap-2 select-none filter drop-shadow-[0_0_15px_rgba(244,114,182,0.9)] animate-pulse">
        <span className="text-6xl">💖</span>
        <span className="text-4xl -translate-y-4">💕</span>
      </div>
    )
  },

  // 9. Chữ Happy Day 3D
  {
    id: 'stk_happy_day_3d',
    name: 'Happy Day (Chữ 3D Vui Tươi)',
    category: 'classic',
    previewIcon: '🎉',
    render: () => (
      <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-sky-400 to-pink-400 border-2 border-white shadow-2xl select-none rotate-[-2deg]">
        <span className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md">
          HAPPY DAY ✨
        </span>
      </div>
    )
  },

  // ==========================================
  // NHÓM 3: ANIMAL MEME (Từ Ảnh 5 bạn gửi)
  // ==========================================
  // 10. Chó Chihuahua hét toang mồm
  {
    id: 'stk_screaming_chihuahua',
    name: 'Chó Chihuahua Hét Toang Mồm (Aaaa!)',
    category: 'animal_meme',
    previewIcon: '🐕',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-2xl">
        <div className="relative">
          <span className="text-8xl">🐶</span>
          <span className="absolute -top-3 -right-2 text-2xl font-black text-yellow-300 animate-ping">
            💥
          </span>
        </div>
        <span className="px-3 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase -mt-2 shadow-lg">
          AAAAAA!!!
        </span>
      </div>
    )
  },

  // 11. Chó đội mũ đỏ đeo kính ngầu
  {
    id: 'stk_cool_dog_cap',
    name: 'Chó Đội Mũ Đỏ Kính Ngầu Swag',
    category: 'animal_meme',
    previewIcon: '😎',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl">
        <div className="relative text-7xl">
          🐶
          <span className="absolute -top-3 left-1 text-4xl">🧢</span>
          <span className="absolute top-4 left-3 text-3xl">🕶️</span>
        </div>
        <span className="text-xs font-black text-yellow-400 tracking-wider">SWAG 100%</span>
      </div>
    )
  },

  // 12. Mèo bắn tim hai tay
  {
    id: 'stk_cat_heart_hands',
    name: 'Mèo Bắn Tim Hai Tay Cưng Xỉu',
    category: 'animal_meme',
    previewIcon: '🫶',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl animate-pulse">
        <div className="text-7xl relative">
          🐱
          <span className="absolute -top-3 -right-2 text-3xl animate-bounce">💖</span>
        </div>
        <span className="text-3xl -mt-2">🫶</span>
      </div>
    )
  },

  // 13. Mèo chỉ 2 tay xuống
  {
    id: 'stk_cat_pointing_down',
    name: 'Mèo Chỉ 2 Tay Xuống (Xem Bên Dưới)',
    category: 'animal_meme',
    previewIcon: '👇',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl">
        <span className="text-7xl">🐱</span>
        <div className="flex items-center gap-4 text-3xl -mt-2 animate-bounce">
          <span>👇</span>
          <span>👇</span>
        </div>
      </div>
    )
  },

  // 14. Mèo tức giận bốc khói
  {
    id: 'stk_cat_angry_rage',
    name: 'Mèo Tức Giận Bốc Khói Đầu (Rage)',
    category: 'animal_meme',
    previewIcon: '💢',
    render: () => (
      <div className="relative select-none filter drop-shadow-xl">
        <span className="text-7xl">😾</span>
        <span className="absolute -top-3 -left-2 text-3xl animate-spin-slow">💢</span>
        <span className="absolute -top-3 -right-2 text-3xl">💨</span>
      </div>
    )
  },

  // 15. Mèo chỉ tay cười hả hê
  {
    id: 'stk_cat_pointing_laugh',
    name: 'Mèo Chỉ Tay Cười Hả Hê Meme',
    category: 'animal_meme',
    previewIcon: '🫵',
    render: () => (
      <div className="flex items-center gap-1 select-none filter drop-shadow-xl animate-wiggle">
        <span className="text-7xl">😹</span>
        <span className="text-4xl">🫵</span>
      </div>
    )
  },

  // 16. Mèo cầm loa phóng thanh
  {
    id: 'stk_cat_megaphone',
    name: 'Mèo Cầm Loa Phóng Thanh (Chú Ý!)',
    category: 'animal_meme',
    previewIcon: '📢',
    render: () => (
      <div className="flex items-center select-none filter drop-shadow-xl">
        <span className="text-7xl">🐱</span>
        <span className="text-4xl -ml-3 animate-pulse">📢</span>
      </div>
    )
  },

  // 17. Mèo cầm bó hoa hồng
  {
    id: 'stk_cat_holding_flowers',
    name: 'Mèo Cầm Bó Hoa Tặng Bạn',
    category: 'animal_meme',
    previewIcon: '💐',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl">
        <span className="text-7xl">😻</span>
        <span className="text-4xl -mt-4">💐</span>
      </div>
    )
  },

  // 18. Mèo đeo kính học sinh chăm chỉ
  {
    id: 'stk_cat_nerd_glasses',
    name: 'Mèo Đeo Kính Học Bài Chăm Chỉ',
    category: 'animal_meme',
    previewIcon: '🤓',
    render: () => (
      <div className="flex flex-col items-center select-none filter drop-shadow-xl">
        <div className="relative text-7xl">
          🐱
          <span className="absolute top-4 left-3 text-3xl">👓</span>
        </div>
        <span className="text-2xl -mt-2">📚</span>
      </div>
    )
  },

  // 19. Mèo giơ tay Shaka 🤙
  {
    id: 'stk_cat_shaka',
    name: 'Mèo Giơ Tay Shaka Chill Hết Nấc',
    category: 'animal_meme',
    previewIcon: '🤙',
    render: () => (
      <div className="flex items-center select-none filter drop-shadow-xl">
        <span className="text-7xl">😺</span>
        <span className="text-4xl -ml-2">🤙</span>
      </div>
    )
  }
];

export function getTikTokStickerById(id?: string): TikTokStickerItem | undefined {
  if (!id) return undefined;
  
  const found = TIKTOK_STICKERS.find((s) => s.id === id);
  if (found) return found;

  // Hỗ trợ Sticker Tùy Chỉnh do người dùng tải ảnh lên (Base64 data URL hoặc link ảnh)
  if (id.startsWith('data:image/') || id.startsWith('http://') || id.startsWith('https://') || id.startsWith('blob:') || id.startsWith('custom_stk_')) {
    const imageUrl = id.startsWith('custom_stk_') ? id.replace('custom_stk_', '') : id;
    return {
      id,
      name: 'Sticker Meme Nhân Vật (Đã Cắt Nền)',
      category: 'trending',
      previewIcon: '🐶',
      render: () => (
        <div className="relative inline-block select-none transform hover:scale-105 transition-transform">
          {/* Lớp viền trắng Die-Cut Sticker bám sát đường cong viền nhân vật bằng CSS Drop Shadow đa hướng */}
          <img
            src={imageUrl}
            alt="Custom Sticker Meme"
            className="max-w-[220px] max-h-[220px] object-contain"
            style={{
              filter: 'drop-shadow(2px 0 0 white) drop-shadow(-2px 0 0 white) drop-shadow(0 2px 0 white) drop-shadow(0 -2px 0 white) drop-shadow(0 8px 16px rgba(0,0,0,0.65))'
            }}
            crossOrigin="anonymous"
          />
        </div>
      )
    };
  }

  return undefined;
}
