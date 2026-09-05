import React from 'react';

export interface TikTokTextTemplate {
  id: string;
  name: string;
  category: 'trending' | 'new_pop' | 'minimal' | 'cartoon';
  previewText: string;
  fontFamily: string;
  render: (text: string) => React.ReactNode;
  renderWord?: (text: string, isSpoken?: boolean) => React.ReactNode;
}

export const TIKTOK_TEXT_TEMPLATES: TikTokTextTemplate[] = [
  // ==========================================
  // NHÓM 1: MẪU TRUYỀN THỐNG CAPCUT
  // ==========================================
  {
    id: 'tpl_di_nao',
    name: 'Đi nào (Vàng Hào Quang Đen)',
    category: 'trending',
    previewText: 'Đi nào',
    fontFamily: "'Montserrat', sans-serif",
    render: (text: string) => (
      <div className="relative inline-block select-none transform hover:scale-105 transition-transform">
        <span
          className="text-6xl sm:text-7xl md:text-8xl font-black italic tracking-wide block"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            color: '#fef08a',
            WebkitTextStroke: '4px #000000',
            textShadow: '0 0 10px #facc15, 0 0 25px #eab308, 0 0 45px #ca8a04, 0 6px 0 #000, 0 10px 25px rgba(0,0,0,0.9)'
          }}
        >
          {text || 'Đi nào'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <span
        className={`inline-block font-black italic tracking-wide ${isSpoken ? 'scale-110 drop-shadow-2xl' : 'opacity-90'}`}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 900,
          color: isSpoken ? '#ffffff' : '#fef08a',
          WebkitTextStroke: '3.5px #000000',
          textShadow: isSpoken
            ? '0 0 15px #facc15, 0 0 35px #eab308, 0 0 55px #ca8a04, 0 5px 0 #000, 0 8px 20px rgba(0,0,0,0.95)'
            : '0 0 8px #facc15, 0 4px 0 #000'
        }}
      >
        {text}
      </span>
    )
  },
  {
    id: 'tpl_nang_dong',
    name: 'NĂNG ĐỘNG (Đỏ Rực Neon)',
    category: 'trending',
    previewText: 'NĂNG ĐỘNG',
    fontFamily: "'Anton', sans-serif",
    render: (text: string) => (
      <div className="relative inline-block select-none">
        <span
          className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight block"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: '#ff2b54',
            WebkitTextStroke: '3.5px #000000',
            textShadow: '0 0 15px #ff0044, 0 0 35px #dc2626, 0 0 60px #991b1b, 0 8px 30px rgba(0,0,0,0.95)'
          }}
        >
          {text || 'NĂNG ĐỘNG'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <span
        className={`inline-block font-black uppercase tracking-tight ${isSpoken ? 'scale-110' : 'opacity-90'}`}
        style={{
          fontFamily: "'Anton', sans-serif",
          color: isSpoken ? '#ffffff' : '#ff2b54',
          WebkitTextStroke: '3.5px #000000',
          textShadow: isSpoken
            ? '0 0 20px #ff0044, 0 0 40px #dc2626, 0 0 70px #991b1b, 0 6px 20px rgba(0,0,0,0.95)'
            : '0 0 10px #dc2626, 0 4px 0 #000'
        }}
      >
        {text}
      </span>
    )
  },
  {
    id: 'tpl_location_pin',
    name: 'LOCATION (Ghim Bản Đồ Đỏ)',
    category: 'trending',
    previewText: 'LOCATION',
    fontFamily: "'Montserrat', sans-serif",
    render: (text: string) => (
      <div className="flex flex-col items-center gap-1 select-none animate-bounce-gentle">
        <div className="text-5xl filter drop-shadow-[0_8px_15px_rgba(239,68,68,0.8)]">📍</div>
        <div className="px-4 py-1 rounded-md bg-gradient-to-r from-red-600 to-rose-600 border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.8)]">
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            {text || 'LOCATION'}
          </span>
        </div>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-md bg-gradient-to-r from-red-600 to-rose-600 border-2 border-white shadow-[0_4px_15px_rgba(0,0,0,0.8)] ${isSpoken ? 'scale-110' : ''}`}>
        <span className="text-xs">📍</span>
        <span className="font-black uppercase tracking-wider text-white">
          {text}
        </span>
      </div>
    )
  },

  // ==========================================
  // NHÓM 2: MẪU MỚI THỊNH HÀNH
  // ==========================================
  // 1. Chapter One
  {
    id: 'tpl_chapter_one',
    name: 'Chapter One (Chương Mở Đầu Điện Ảnh)',
    category: 'minimal',
    previewText: 'Chapter One',
    fontFamily: "'Cinzel', serif",
    render: (text: string) => (
      <div className="relative inline-block select-none text-center">
        <span
          className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-widest block text-white"
          style={{
            fontFamily: "'Cinzel', serif",
            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.4)'
          }}
        >
          {text || 'Chapter One'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <span
        className={`inline-block font-serif tracking-widest ${isSpoken ? 'scale-110 text-amber-300' : 'text-white'}`}
        style={{
          fontFamily: "'Cinzel', serif",
          textShadow: isSpoken
            ? '0 0 20px rgba(251, 191, 36, 0.9), 0 4px 10px rgba(0,0,0,0.9)'
            : '0 2px 8px rgba(0,0,0,0.8)'
        }}
      >
        {text}
      </span>
    )
  },

  // 2. summer escape
  {
    id: 'tpl_summer_escape',
    name: 'Summer Escape (Mùa Hè Vàng Xanh)',
    category: 'new_pop',
    previewText: 'summer escape',
    fontFamily: "'Bangers', cursive",
    render: (text: string) => (
      <span
        className="text-5xl sm:text-6xl md:text-7xl font-black italic tracking-wide block select-none"
        style={{
          fontFamily: "'Bangers', cursive",
          color: '#fbbf24',
          WebkitTextStroke: '2.5px #1d4ed8',
          textShadow: '0 4px 0 #1e3a8a, 0 8px 15px rgba(0,0,0,0.8)'
        }}
      >
        {text || 'summer escape'}
      </span>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <span
        className={`inline-block font-black italic tracking-wide ${isSpoken ? 'scale-110' : ''}`}
        style={{
          fontFamily: "'Bangers', cursive",
          color: isSpoken ? '#ffffff' : '#fbbf24',
          WebkitTextStroke: '2.5px #1d4ed8',
          textShadow: '0 4px 0 #1e3a8a, 0 6px 12px rgba(0,0,0,0.8)'
        }}
      >
        {text}
      </span>
    )
  },

  // 3. MINI VLOG DAY
  {
    id: 'tpl_mini_vlog',
    name: 'MINI VLOG DAY (Nhật Ký Video Ngắn)',
    category: 'minimal',
    previewText: 'MINI VLOG DAY',
    fontFamily: "'Montserrat', sans-serif",
    render: (text: string) => (
      <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/80 border border-white/40 shadow-2xl backdrop-blur-md">
        <span className="text-white text-xs">●</span>
        <span className="text-lg sm:text-xl font-black uppercase tracking-widest text-white">
          {text || 'MINI VLOG DAY'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xl backdrop-blur-md transition-all ${
        isSpoken
          ? 'bg-white text-black border-white scale-110'
          : 'bg-black/80 text-white border-white/30'
      }`}>
        <span className="text-[10px]">●</span>
        <span className="font-black uppercase tracking-widest">
          {text}
        </span>
      </div>
    )
  },

  // 4. YEAH! (Truyện tranh bùng nổ)
  {
    id: 'tpl_yeah_comic',
    name: 'YEAH! (Truyện Tranh Bùng Nổ)',
    category: 'new_pop',
    previewText: 'YEAH!',
    fontFamily: "'Bangers', cursive",
    render: (text: string) => (
      <div className="relative inline-block select-none rotate-[-4deg]">
        <div className="absolute inset-0 -inset-x-4 -inset-y-2 bg-yellow-400 rounded-lg filter drop-shadow-[0_8px_0_#000]" />
        <span
          className="text-6xl sm:text-7xl font-black uppercase tracking-wider block relative z-10 text-white"
          style={{
            fontFamily: "'Bangers', cursive",
            WebkitTextStroke: '3.5px #ea580c',
            textShadow: '3px 3px 0 #000'
          }}
        >
          {text || 'YEAH!'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`relative inline-block px-3 py-0.5 rounded-lg border-2 border-black rotate-[-2deg] ${
        isSpoken ? 'bg-yellow-300 scale-110 shadow-[0_6px_0_#000]' : 'bg-yellow-400 shadow-[0_4px_0_#000]'
      }`}>
        <span
          className="font-black uppercase tracking-wider block text-white"
          style={{
            fontFamily: "'Bangers', cursive",
            WebkitTextStroke: '2.5px #ea580c',
            textShadow: '2px 2px 0 #000'
          }}
        >
          {text}
        </span>
      </div>
    )
  },

  // 5. wow! (Màu cam nổi khối)
  {
    id: 'tpl_wow_orange',
    name: 'wow! (Cam Đùn Khối Vui Nhộn)',
    category: 'new_pop',
    previewText: 'wow!',
    fontFamily: "'Anton', sans-serif",
    render: (text: string) => (
      <span
        className="text-6xl sm:text-7xl font-black tracking-tight block select-none"
        style={{
          fontFamily: "'Anton', sans-serif",
          color: '#fb923c',
          WebkitTextStroke: '3px #000',
          textShadow: '0 6px 0 #000, 0 12px 25px rgba(0,0,0,0.8)'
        }}
      >
        {text || 'wow!'}
      </span>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <span
        className={`inline-block font-black tracking-tight ${isSpoken ? 'scale-110' : ''}`}
        style={{
          fontFamily: "'Anton', sans-serif",
          color: isSpoken ? '#ffffff' : '#fb923c',
          WebkitTextStroke: '2.5px #000',
          textShadow: '0 5px 0 #000, 0 8px 15px rgba(0,0,0,0.8)'
        }}
      >
        {text}
      </span>
    )
  },

  // 6. EMERGENCY MEETING (Dải băng cam cảnh báo)
  {
    id: 'tpl_emergency_meeting',
    name: 'EMERGENCY MEETING (Cảnh Báo Khẩn Cấp)',
    category: 'new_pop',
    previewText: 'EMERGENCY MEETING',
    fontFamily: "'Anton', sans-serif",
    render: (text: string) => (
      <div className="inline-block select-none px-6 py-2 bg-amber-500 rounded-none shadow-2xl border-y-4 border-black">
        <span
          className="text-3xl sm:text-4xl font-black uppercase tracking-wider block text-black"
          style={{ fontFamily: "'Anton', sans-serif" }}
        >
          {text || 'EMERGENCY MEETING'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`inline-block px-3 py-1 bg-amber-500 border-y-2 border-black ${isSpoken ? 'scale-110 bg-amber-400 shadow-xl' : ''}`}>
        <span
          className="font-black uppercase tracking-wider block text-black"
          style={{ fontFamily: "'Anton', sans-serif" }}
        >
          {text}
        </span>
      </div>
    )
  },

  // 7. OMG! (Bong bóng hội thoại truyện tranh)
  {
    id: 'tpl_omg_bubble',
    name: 'OMG! (Bong Bóng Truyện Tranh)',
    category: 'new_pop',
    previewText: 'OMG!',
    fontFamily: "'Bangers', cursive",
    render: (text: string) => (
      <div className="relative inline-block select-none px-8 py-3 bg-white rounded-[40px] shadow-2xl border-4 border-black rotate-[-2deg]">
        <span
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider block text-red-600"
          style={{
            fontFamily: "'Bangers', cursive",
            WebkitTextStroke: '2px #000'
          }}
        >
          {text || 'OMG!'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`relative inline-block px-4 py-1.5 bg-white rounded-full shadow-lg border-2 border-black rotate-[-1deg] ${isSpoken ? 'scale-110 ring-2 ring-red-500' : ''}`}>
        <span
          className="font-black uppercase tracking-wider block text-red-600"
          style={{
            fontFamily: "'Bangers', cursive",
            WebkitTextStroke: '1.5px #000'
          }}
        >
          {text}
        </span>
      </div>
    )
  },

  // 8. MỚI! (Tia chớp cam Việt Nam)
  {
    id: 'tpl_moi_lightning',
    name: 'MỚI! (Tia Chớp Cam Nổi Bật)',
    category: 'new_pop',
    previewText: 'MỚI!',
    fontFamily: "'Anton', sans-serif",
    render: (text: string) => (
      <div className="relative inline-block select-none px-7 py-2 bg-orange-600 rounded-lg shadow-2xl border-2 border-black rotate-[3deg]">
        <span
          className="text-4xl sm:text-5xl font-black uppercase tracking-wider block text-white"
          style={{
            fontFamily: "'Anton', sans-serif",
            textShadow: '2px 2px 0 #000'
          }}
        >
          {text || 'MỚI!'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`relative inline-block px-3 py-1 bg-orange-600 rounded-md shadow-lg border border-black rotate-[2deg] ${isSpoken ? 'scale-110 bg-orange-500 ring-2 ring-yellow-300' : ''}`}>
        <span
          className="font-black uppercase tracking-wider block text-white"
          style={{
            fontFamily: "'Anton', sans-serif",
            textShadow: '1.5px 1.5px 0 #000'
          }}
        >
          {text}
        </span>
      </div>
    )
  },

  // 9. VINTAGE VIBES
  {
    id: 'tpl_vintage_vibes',
    name: 'VINTAGE VIBES (Cổ Điển Thập Niên 90)',
    category: 'trending',
    previewText: 'VINTAGE VIBES',
    fontFamily: "'Anton', sans-serif",
    render: (text: string) => (
      <div className="relative inline-block select-none px-6 py-2 bg-black/90 rounded-xl border-2 border-amber-500 shadow-2xl">
        <span
          className="text-4xl sm:text-5xl font-black uppercase tracking-widest block"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: '#f59e0b',
            WebkitTextStroke: '1px #000',
            textShadow: '0 3px 0 #b45309'
          }}
        >
          {text || 'VINTAGE VIBES'}
        </span>
      </div>
    ),
    renderWord: (text: string, isSpoken?: boolean) => (
      <div className={`relative inline-block px-3 py-1 bg-black/90 rounded-lg border border-amber-500 shadow-xl ${isSpoken ? 'scale-110 ring-2 ring-amber-400' : ''}`}>
        <span
          className="font-black uppercase tracking-widest block"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: isSpoken ? '#fbbf24' : '#f59e0b',
            WebkitTextStroke: '1px #000',
            textShadow: '0 2px 0 #b45309'
          }}
        >
          {text}
        </span>
      </div>
    )
  }
];

export function getTikTokTemplateById(id?: string): TikTokTextTemplate | undefined {
  if (!id) return undefined;
  return TIKTOK_TEXT_TEMPLATES.find((t) => t.id === id);
}

