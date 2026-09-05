import React from 'react';

export interface TikTokTextEffectItem {
  id: string;
  name: string;
  category: 'trending' | 'hits' | 'manuscript' | 'neon' | 'metal' | 'cartoon';
  applyStyle: (text: string) => React.ReactNode;
}

export const TIKTOK_TEXT_EFFECTS: TikTokTextEffectItem[] = [
  // ==========================================
  // NHÓM 1: TRENDING (Ảnh 1 lần trước)
  // ==========================================
  {
    id: 'tfx_golden_glow',
    name: 'Golden Glow (Vàng Cam Hạt Bụi)',
    category: 'trending',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 50%, #ea580c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 2px 0 #7f1d1d) drop-shadow(0 5px 0 #450a0a) drop-shadow(0 0 20px rgba(245,158,11,0.8))'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },
  {
    id: 'tfx_fire_inferno',
    name: 'Fire Inferno (Lửa Bốc Cháy)',
    category: 'trending',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#ffffff',
          WebkitTextStroke: '3.5px #000000',
          textShadow: '0 0 10px #ffedd5, 0 0 20px #f97316, 0 0 35px #ef4444, 0 0 60px #b91c1c, 0 -8px 25px #ea580c'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },
  {
    id: 'tfx_warm_gold_aura',
    name: 'Warm Gold Aura (Đỏ Hào Quang Vàng)',
    category: 'trending',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#881337',
          WebkitTextStroke: '3px #ffffff',
          textShadow: '0 0 15px #facc15, 0 0 30px #eab308, 0 0 50px #ca8a04, 0 6px 0 #000'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },
  {
    id: 'tfx_cute_pastel',
    name: 'Pastel Cloud (Mây Vàng Kèm Nơ)',
    category: 'cartoon',
    applyStyle: (text) => (
      <div className="relative inline-block select-none">
        <div className="absolute inset-0 -inset-x-3 -inset-y-1.5 bg-yellow-300 rounded-full border-4 border-yellow-200 shadow-md filter drop-shadow-[0_6px_0px_#000]" />
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block relative z-10"
          style={{
            fontFamily: "'Bangers', cursive",
            color: '#06b6d4',
            WebkitTextStroke: '2.5px #f43f5e',
            textShadow: '2px 2px 0px #be123c'
          }}
        >
          {text || 'ART'}
        </span>
        <span className="absolute -top-3 -right-2 text-xl z-20">✨</span>
      </div>
    )
  },

  // ==========================================
  // NHÓM 2: HITS (Từ Ảnh 1 bạn vừa gửi)
  // ==========================================
  // 1. Chữ đen viền vàng phát quang tỏa sáng
  {
    id: 'tfx_golden_aura_black',
    name: 'Golden Aura Black (Chữ Đen Tỏa Sáng Vàng)',
    category: 'hits',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#111827',
          WebkitTextStroke: '2.5px #fef08a',
          textShadow: '0 0 15px #facc15, 0 0 35px #eab308, 0 0 60px #ca8a04, 0 0 90px #a16207'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },

  // 2. Chữ trên vệt cọ sơn vàng rực
  {
    id: 'tfx_yellow_paint_stroke',
    name: 'Yellow Paint Stroke (Vệt Cọ Sơn Vàng)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg shadow-xl border-2 border-yellow-300 transform rotate-[-2deg]">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-black"
          style={{
            fontFamily: "'Anton', sans-serif",
            textShadow: '2px 2px 0px rgba(255,255,255,0.4)'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 3. Chữ trên vệt cọ sơn đỏ xước
  {
    id: 'tfx_red_brush_stroke',
    name: 'Red Brush Stroke (Vệt Cọ Sơn Đỏ Xước)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-md shadow-2xl border-y-2 border-black">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-white"
          style={{
            fontFamily: "'Anton', sans-serif",
            WebkitTextStroke: '1.5px #000',
            textShadow: '3px 3px 0 #000'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 4. Chữ xanh lá phát quang gai nhọn sấm sét
  {
    id: 'tfx_green_electric_spike',
    name: 'Green Electric Spike (Tia Gai Xanh Lá)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none">
        <div className="absolute inset-0 -inset-x-2 -inset-y-1 bg-lime-500 rounded-xl filter blur-sm opacity-80 animate-pulse" />
        <span
          className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block relative z-10"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: '#111827',
            WebkitTextStroke: '2.5px #86efac',
            textShadow: '0 0 15px #4ade80, 0 0 35px #22c55e'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 5. Mảnh giấy xé trắng đen phong cách báo chí
  {
    id: 'tfx_torn_paper_mono',
    name: 'Torn Paper Mono (Mảnh Giấy Xé Trắng)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2.5 bg-neutral-100 rounded-sm shadow-2xl border-x-4 border-dashed border-gray-400 rotate-[-1deg]">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-black font-mono"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            letterSpacing: '0.05em'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 6. Chữ trắng viền hồng kẹo ngọt bong bóng
  {
    id: 'tfx_pink_bubble_gum',
    name: 'Pink Bubble Gum (Bong Bóng Kẹo Hồng)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2 bg-pink-400 rounded-full shadow-lg border-2 border-pink-200">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block text-white"
          style={{
            fontFamily: "'Bangers', cursive",
            WebkitTextStroke: '2px #db2777',
            textShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 7. Chữ 3D nhiều tầng xanh dương - đỏ
  {
    id: 'tfx_layered_blue_red',
    name: 'Layered Blue-Red 3D (Đùn 3D Xanh Đỏ)',
    category: 'hits',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Russo One', sans-serif",
          color: '#38bdf8',
          WebkitTextStroke: '2px #0284c7',
          textShadow: `
            0 2px 0 #ea580c,
            0 4px 0 #dc2626,
            0 7px 0 #991b1b,
            0 12px 25px rgba(0,0,0,0.95)
          `
        }}
      >
        {text || 'ART'}
      </span>
    )
  },

  // 8. Chữ chữ nâu trên tấm gỗ mộc
  {
    id: 'tfx_wooden_board',
    name: 'Wooden Board (Tấm Gỗ Cổ Điển)',
    category: 'hits',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-7 py-2 bg-amber-100 rounded-md border-4 border-amber-800 shadow-2xl">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block text-amber-950"
          style={{
            fontFamily: "'Anton', sans-serif",
            textShadow: '1px 1px 0px #fff, 0 4px 8px rgba(0,0,0,0.5)'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 9. Xanh neon phát sáng kép viền trắng
  {
    id: 'tfx_cyan_double_glow',
    name: 'Cyan Double Glow (Viền Trắng Neon Xanh)',
    category: 'hits',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-wider block select-none"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: '#06b6d4',
          WebkitTextStroke: '2.5px #ffffff',
          textShadow: '0 0 15px #38bdf8, 0 0 35px #0284c7, 0 0 60px #0369a1'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },

  // 10. Chữ cháy nung đỏ than hồng
  {
    id: 'tfx_burning_fire_coal',
    name: 'Burning Fire Coal (Nung Đỏ Than Hồng)',
    category: 'hits',
    applyStyle: (text) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          background: 'linear-gradient(180deg, #fef08a 0%, #ea580c 40%, #7f1d1d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px #ef4444) drop-shadow(0 -5px 15px #f97316)'
        }}
      >
        {text || 'ART'}
      </span>
    )
  },

  // ==========================================
  // NHÓM 3: MANUSCRIPT & SỔ TAY (Ảnh 2 bạn vừa gửi)
  // ==========================================
  // 11. Giấy xé ô ly học sinh
  {
    id: 'tfx_grid_notebook',
    name: 'Grid Notebook Paper (Giấy Ô Ly Học Sinh)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div
        className="relative inline-block select-none px-6 py-2 bg-white rounded shadow-2xl border-2 border-gray-300 rotate-[-1.5deg]"
        style={{
          backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '15px 15px'
        }}
      >
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block"
          style={{
            fontFamily: "'Permanent Marker', cursive",
            color: '#dc2626',
            textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 12. Giấy Kraft có ghim vàng
  {
    id: 'tfx_pinned_kraft',
    name: 'Pinned Kraft Paper (Giấy Xi Măng Ghim Vàng)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-7 py-2.5 bg-amber-200/90 rounded-sm shadow-xl border-x-4 border-amber-400">
        <span className="absolute -top-2 left-2 text-sm text-yellow-600">📌</span>
        <span className="absolute -top-2 right-2 text-sm text-yellow-600">📌</span>
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-neutral-900"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 13. Hoa lá mùa xuân nở rộ
  {
    id: 'tfx_spring_floral',
    name: 'Spring Floral Bloom (Hoa Lá Mùa Xuân)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div className="relative inline-block select-none">
        <span className="absolute -top-3 left-0 text-xl">🌸</span>
        <span className="absolute -bottom-2 right-1 text-xl">🌼</span>
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block"
          style={{
            fontFamily: "'Bangers', cursive",
            color: '#38bdf8',
            WebkitTextStroke: '2px #ec4899',
            textShadow: '0 3px 0 #be185d'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 14. Vết sơn đen có trái tim đỏ
  {
    id: 'tfx_heart_paint_black',
    name: 'Heart Paint Black (Vệt Sơn Đen Trái Tim Đỏ)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-7 py-2 bg-black rounded-lg shadow-2xl border-2 border-red-500">
        <span className="absolute -top-2 -left-2 text-xl">❤️</span>
        <span className="absolute -bottom-2 -right-2 text-xl">❤️</span>
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-white"
          style={{
            fontFamily: "'Anton', sans-serif",
            letterSpacing: '0.04em'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 15. Hoa Tulip nở rộ
  {
    id: 'tfx_tulip_garden',
    name: 'Tulip Flower Garden (Vườn Hoa Tulip)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2 bg-neutral-100 rounded-xl shadow-lg border-2 border-green-500">
        <span className="absolute -top-3 left-1 text-xl">🌷</span>
        <span className="absolute -bottom-3 right-1 text-xl">🌷</span>
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight block text-black"
          style={{
            fontFamily: "'Anton', sans-serif"
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  },

  // 16. Kẹo mút cầu vồng ngọt ngào
  {
    id: 'tfx_rainbow_candy',
    name: 'Rainbow Candy Pop (Kẹo Mút Cầu Vồng)',
    category: 'manuscript',
    applyStyle: (text) => (
      <div className="relative inline-block select-none px-6 py-2 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 rounded-full shadow-lg border-2 border-white">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block"
          style={{
            fontFamily: "'Bangers', cursive",
            color: '#a855f7',
            WebkitTextStroke: '2px #ffffff',
            textShadow: '0 3px 0 #7e22ce'
          }}
        >
          {text || 'ART'}
        </span>
      </div>
    )
  }
];

export function getTikTokTextEffectById(id?: string): TikTokTextEffectItem | undefined {
  if (!id) return undefined;
  return TIKTOK_TEXT_EFFECTS.find((e) => e.id === id);
}
