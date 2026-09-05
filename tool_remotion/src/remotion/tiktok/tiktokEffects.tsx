import React from 'react';

export interface TikTokVideoEffect {
  id: string;
  name: string;
  category: 'trending' | 'lighting' | 'retro' | 'love';
  previewIcon: string;
  renderOverlay: (frame: number, fps: number) => React.ReactNode;
}

export const TIKTOK_VIDEO_EFFECTS: TikTokVideoEffect[] = [
  // 1. GLITCH SCAN (Quét Nhiễu Sóng)
  {
    id: 'fx_glitch_scan',
    name: 'Glitch Scan (Quét Nhiễu Sóng Laser)',
    category: 'trending',
    previewIcon: '📺',
    renderOverlay: (frame) => {
      const isGlitch = frame % 12 < 4;
      const scanY = (frame * 4) % 100;
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35">
          {/* Thanh quét laser ngang màu Cyan sáng rực */}
          <div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent blur-[2px] shadow-[0_0_25px_#22d3ee]"
            style={{ top: `${scanY}%` }}
          />
          {/* Lớp RGB Split & Scanlines */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 4px)'
            }}
          />
          {isGlitch && (
            <div
              className="absolute inset-0 bg-red-600/30 mix-blend-color-dodge"
              style={{ transform: `translateX(${Math.sin(frame * 2) * 15}px)` }}
            />
          )}
        </div>
      );
    }
  },

  // 2. SNAPSHOT 3X (Chớp Sáng Flash Chụp Ảnh)
  {
    id: 'fx_snapshot_3x',
    name: 'Snapshot 3x (Chớp Sáng Flash Máy Ảnh)',
    category: 'trending',
    previewIcon: '📸',
    renderOverlay: (frame) => {
      const cycle = frame % 45;
      const flash = cycle === 0 || cycle === 3 || cycle === 6 ? 0.95 : 0;
      return (
        <div
          className="absolute inset-0 pointer-events-none bg-white transition-opacity duration-75 z-35"
          style={{ opacity: flash }}
        />
      );
    }
  },

  // 3. GLITTERY LOVE (Trái Tim Lấp Lánh)
  {
    id: 'fx_glittery_love',
    name: 'Glittery Love (Trái Tim Lấp Lánh & Hạt Bụi)',
    category: 'love',
    previewIcon: '💖',
    renderOverlay: (frame, fps) => {
      const hearts = [
        { x: 15, y: 25, scale: 1.1, char: '💖' },
        { x: 80, y: 20, scale: 1.4, char: '✨' },
        { x: 30, y: 65, scale: 1.2, char: '💕' },
        { x: 85, y: 70, scale: 1.3, char: '💖' },
        { x: 50, y: 15, scale: 0.9, char: '✨' },
        { x: 20, y: 85, scale: 1.0, char: '💗' }
      ];
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35">
          {hearts.map((h, i) => {
            const float = Math.sin((frame / fps) * 3 + i * 1.5) * 20;
            const pulse = (Math.sin((frame / fps) * 4 + i) + 1) * 0.2 + 0.9;
            return (
              <div
                key={i}
                className="absolute text-4xl filter drop-shadow-[0_0_20px_rgba(244,114,182,0.9)]"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: `translateY(${float}px) scale(${h.scale * pulse})`
                }}
              >
                {h.char}
              </div>
            );
          })}
        </div>
      );
    }
  },

  // 4. PENTA DISCO (Ánh Đèn Vũ Trường)
  {
    id: 'fx_penta_disco',
    name: 'Penta Disco (Ánh Đèn Sân Khấu Vũ Trường)',
    category: 'lighting',
    previewIcon: '🪩',
    renderOverlay: (frame) => {
      const rot = (frame * 2.5) % 360;
      return (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 z-35"
          style={{
            background: `conic-gradient(from ${rot}deg at 50% 50%, #ec4899, #06b6d4, #facc15, #a855f7, #ec4899)`
          }}
        />
      );
    }
  },

  // 5. GRAINY SHOUT (Nhiễu Hạt Phim Vintage)
  {
    id: 'fx_grainy_shout',
    name: 'Grainy Shout (Hạt Phim & Viền Điện Ảnh Vintage)',
    category: 'retro',
    previewIcon: '🎞️',
    renderOverlay: (frame) => {
      const offsetX = (frame * 19) % 80;
      const offsetY = (frame * 31) % 80;
      return (
        <div className="absolute inset-0 pointer-events-none z-35">
          {/* Lớp hạt Noise */}
          <div
            className="absolute inset-0 opacity-45 mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(circle, #fff 15%, transparent 16%)`,
              backgroundSize: '10px 10px',
              backgroundPosition: `${offsetX}px ${offsetY}px`
            }}
          />
          {/* Lớp Vignette viền tối cổ điển */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.65) 100%)'
            }}
          />
        </div>
      );
    }
  },

  // 7. LASER NEON BEAMS (Tia Laser Neon)
  {
    id: 'fx_laser_neon',
    name: 'Laser Neon Beams (Chùm Tia Laser Cyber)',
    category: 'lighting',
    previewIcon: '⚡',
    renderOverlay: (frame) => {
      const beamX = (Math.sin(frame * 0.1) + 1) * 50;
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35 mix-blend-screen">
          <div
            className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-md transform -skew-x-12 opacity-70"
            style={{ left: `${beamX}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-pink-500 to-transparent blur-sm transform skew-x-12 opacity-60"
            style={{ right: `${beamX * 0.8}%` }}
          />
        </div>
      );
    }
  },

  // 8. FILM BURN & LIGHT LEAK (Vệt Cháy Phim Cam Đỏ)
  {
    id: 'fx_film_burn',
    name: 'Film Burn (Vệt Cháy Phim Cam Đỏ Vintage)',
    category: 'retro',
    previewIcon: '🔥',
    renderOverlay: (frame) => {
      const cycle = Math.sin(frame * 0.15);
      const leakPos = (frame * 3) % 120;
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35 mix-blend-screen">
          <div
            className="absolute -inset-10 bg-gradient-to-tr from-orange-600/40 via-amber-400/50 to-transparent blur-2xl transform"
            style={{
              transform: `translate(${Math.sin(frame * 0.05) * 40}px, ${Math.cos(frame * 0.05) * 30}px) scale(${1 + cycle * 0.15})`
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-48 bg-gradient-to-r from-transparent via-yellow-300/40 to-transparent blur-xl"
            style={{ left: `${leakPos}%` }}
          />
        </div>
      );
    }
  },

  // 9. CYBER DIGITAL GRID (Lưới Điện Tử 3D)
  {
    id: 'fx_cyber_grid',
    name: 'Cyber Grid (Lưới Không Gian Điện Tử)',
    category: 'trending',
    previewIcon: '🌐',
    renderOverlay: (frame) => {
      const offsetY = (frame * 2) % 40;
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35 opacity-40 mix-blend-screen">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: `0px ${offsetY}px`,
              transform: 'perspective(300px) rotateX(25deg)',
              transformOrigin: 'bottom center'
            }}
          />
        </div>
      );
    }
  },

  // 10. SNOW & MAGIC PARTICLES (Tuyết Rơi Băng Tuyết)
  {
    id: 'fx_snow_magic',
    name: 'Snow Magic (Hạt Tuyết Băng Bay)',
    category: 'lighting',
    previewIcon: '❄️',
    renderOverlay: (frame, fps) => {
      const flakes = [
        { x: 10, speed: 2, size: 14 },
        { x: 25, speed: 3.5, size: 20 },
        { x: 45, speed: 2.2, size: 16 },
        { x: 60, speed: 4, size: 24 },
        { x: 75, speed: 2.8, size: 18 },
        { x: 90, speed: 3.2, size: 15 }
      ];
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-35">
          {flakes.map((flk, i) => {
            const y = ((frame * flk.speed * 1.5) + i * 80) % 105;
            const sway = Math.sin((frame / fps) * 2 + i) * 15;
            return (
              <div
                key={i}
                className="absolute text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-80"
                style={{
                  left: `${flk.x}%`,
                  top: `${y}%`,
                  fontSize: `${flk.size}px`,
                  transform: `translateX(${sway}px)`
                }}
              >
                ❄️
              </div>
            );
          })}
        </div>
      );
    }
  },

  // 11. NEON EDGE GLOW (Viền Khung Neon Phát Sáng)
  {
    id: 'fx_edge_neon',
    name: 'Edge Neon Glow (Viền Khung Tỏa Sáng)',
    category: 'lighting',
    previewIcon: '🔲',
    renderOverlay: (frame) => {
      const glow = (Math.sin(frame * 0.15) + 1) * 0.3 + 0.4;
      return (
        <div
          className="absolute inset-2 rounded-3xl pointer-events-none border-2 border-cyan-400 z-35 transition-all"
          style={{
            boxShadow: `inset 0 0 30px rgba(6,182,212,${glow}), 0 0 35px rgba(236,72,153,${glow})`
          }}
        />
      );
    }
  },

  // 12. TV STATIC (Nhiễu Sóng Truyền Hình Cũ)
  {
    id: 'fx_tv_static',
    name: 'TV Static (Nhiễu Sóng Truyền Hình Analog)',
    category: 'retro',
    previewIcon: '📺',
    renderOverlay: (frame) => {
      const shift = (frame * 13) % 100;
      return (
        <div className="absolute inset-0 pointer-events-none z-35 opacity-30 mix-blend-screen overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, #fff 0, #000 2px, #fff 3px)',
              backgroundSize: '6px 6px',
              transform: `translateY(${shift}px)`
            }}
          />
        </div>
      );
    }
  }
];

export function getTikTokVideoEffectById(id?: string): TikTokVideoEffect | undefined {
  if (!id) return undefined;
  return TIKTOK_VIDEO_EFFECTS.find((e) => e.id === id);
}
