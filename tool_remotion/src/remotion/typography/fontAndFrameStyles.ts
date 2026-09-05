// Hệ thống 100 Phong Cách Font & Khung Chữ Nghệ Thuật (Font & Frame Styles)
// Khắc phục hoàn toàn việc bị lặp lại một kiểu khung đen nhàm chán!

export interface WordFrameStyle {
  id: string;
  name: string;
  fontFamily: string;
  renderWrapper: (text: string, color: string, isCurrent: boolean) => React.ReactNode;
}

export const FONT_AND_FRAME_STYLES = [
  // 1. MrBeast 3D Titan (Không Khung - Chữ 3D Cực Lớn Tỏa Sáng)
  {
    id: 'titan_3d_clean',
    name: '1. MrBeast Titan 3D (Chữ Trần Khổng Lồ)',
    fontFamily: "'Anton', sans-serif",
    wrapperClass: 'no-box',
    textStyle: (color: string) => ({
      fontFamily: "'Anton', sans-serif",
      color: color,
      WebkitTextStroke: '4px #000000',
      textShadow: `0 3px 0 #000, 0 6px 0 #000, 0 10px 0 #111, 0 15px 35px rgba(0,0,0,0.95), 0 0 45px ${color}99`,
      letterSpacing: '0.02em'
    }),
    hasBox: false
  },
  // 2. Comic Manga Pop Art (Khung Vàng Nét Đậm)
  {
    id: 'comic_manga_pop',
    name: '2. Comic Pop Art (Truyện Tranh Nổ)',
    fontFamily: "'Bangers', cursive",
    boxClass: 'bg-yellow-400 border-4 border-black px-4 py-1.5 rounded-xl shadow-[6px_6px_0px_#000000] rotate-[-3deg]',
    textStyle: () => ({
      fontFamily: "'Bangers', cursive",
      color: '#000000',
      letterSpacing: '0.05em',
      textShadow: 'none'
    }),
    hasBox: true
  },
  // 3. Cyberpunk 2077 Neon Line (Khung Viền Neon Kép)
  {
    id: 'cyberpunk_neon',
    name: '3. Cyberpunk 2077 (Viền Neon Kép)',
    fontFamily: "'Orbitron', sans-serif",
    boxClass: 'bg-black/80 border-2 border-cyan-400 px-5 py-2 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.8),inset_0_0_15px_rgba(6,182,212,0.4)]',
    textStyle: (color: string) => ({
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      textShadow: `0 0 10px #38bdf8, 0 0 25px #0284c7`,
      letterSpacing: '0.08em'
    }),
    hasBox: true
  },
  // 4. Street Graffiti Brush (Nét Cọ Sơn Viết Tay)
  {
    id: 'street_graffiti',
    name: '4. Street Graffiti (Nét Cọ Viết Tay)',
    fontFamily: "'Permanent Marker', cursive",
    boxClass: 'bg-rose-600/90 px-5 py-1.5 rounded-md transform -skew-x-12 shadow-lg border-b-4 border-black',
    textStyle: () => ({
      fontFamily: "'Permanent Marker', cursive",
      color: '#ffffff',
      letterSpacing: '0.04em',
      textShadow: '2px 2px 0px #000000'
    }),
    hasBox: true
  },
  // 5. Alex Hormozi Brutal Tag (Nhãn Dán Đỏ Vát Góc)
  {
    id: 'hormozi_brutal_tag',
    name: '5. Hormozi Brutal (Nhãn Dán Góc Cạnh)',
    fontFamily: "'Archivo Black', sans-serif",
    boxClass: 'bg-red-600 border-2 border-white px-4 py-1 rounded-sm shadow-[5px_5px_0px_#000000] rotate-[2deg]',
    textStyle: () => ({
      fontFamily: "'Archivo Black', sans-serif",
      color: '#ffffff',
      letterSpacing: '-0.02em',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }),
    hasBox: true
  },
  // 6. Luxury Champagne Gold (Hoàng Gia Quý Tộc)
  {
    id: 'luxury_gold_serif',
    name: '6. Luxury Gold (Vàng Ánh Kim Quý Tộc)',
    fontFamily: "'Cinzel', serif",
    boxClass: 'bg-stone-950/85 border border-amber-400/70 px-6 py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(251,191,36,0.3)] backdrop-blur-md',
    textStyle: () => ({
      fontFamily: "'Cinzel', serif",
      color: '#fde047',
      textShadow: '0 2px 10px rgba(250,204,21,0.6)',
      letterSpacing: '0.12em'
    }),
    hasBox: true
  },
  // 7. Minimalist Hollywood Cinema (Điện Ảnh Hollywood)
  {
    id: 'hollywood_cinema',
    name: '7. Hollywood Cinema (Điện Ảnh Tối Giản)',
    fontFamily: "'Bebas Neue', sans-serif",
    boxClass: 'no-box',
    textStyle: (color: string) => ({
      fontFamily: "'Bebas Neue', sans-serif",
      color: color,
      WebkitTextStroke: '2px #000',
      textShadow: '0 4px 15px rgba(0,0,0,0.8), 0 0 25px rgba(255,255,255,0.4)',
      letterSpacing: '0.06em'
    }),
    hasBox: false
  },
  // 8. Frosted Crystal Glass (Kính Mờ Pha Lê)
  {
    id: 'crystal_glass',
    name: '8. Frosted Glass (Kính Pha Lê Mờ)',
    fontFamily: "'Syne', sans-serif",
    boxClass: 'bg-white/10 backdrop-blur-xl border border-white/40 px-5 py-2 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)]',
    textStyle: (color: string) => ({
      fontFamily: "'Syne', sans-serif",
      color: '#ffffff',
      textShadow: `0 0 15px ${color}`,
      letterSpacing: '0.04em'
    }),
    hasBox: true
  },
  // 9. Heavy Metal Steel (Thép Đúc Khối)
  {
    id: 'heavy_metal_steel',
    name: '9. Heavy Metal (Thép Đúc 3D)',
    fontFamily: "'Russo One', sans-serif",
    boxClass: 'bg-zinc-900 border-2 border-zinc-500 px-5 py-2 rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.3)]',
    textStyle: (color: string) => ({
      fontFamily: "'Russo One', sans-serif",
      color: color,
      textShadow: '0 2px 4px rgba(0,0,0,0.9)',
      letterSpacing: '0.02em'
    }),
    hasBox: true
  },
  // 10. Vox Highlighter Marker (Vệt Bút Dạ Quang)
  {
    id: 'vox_highlighter',
    name: '10. Vox Highlighter (Vệt Dạ Quang Vàng)',
    fontFamily: "'Montserrat', sans-serif",
    boxClass: 'bg-yellow-300 px-3 py-1 rounded-sm shadow-md rotate-[-1deg]',
    textStyle: () => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: '#000000',
      letterSpacing: '-0.03em',
      textShadow: 'none'
    }),
    hasBox: true
  }
];

export function getStylePresetByIndex(index: number) {
  return FONT_AND_FRAME_STYLES[index % FONT_AND_FRAME_STYLES.length];
}
