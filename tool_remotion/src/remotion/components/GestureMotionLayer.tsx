import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MotionEditConfig, MotionWordTag } from '../../types/video';

interface GestureMotionLayerProps {
  config: MotionEditConfig;
  durationInFrames: number;
  narration?: string;
  isBehindLayer?: boolean; // true nếu đang render ở layer sau lưng người, false nếu ở layer trước mặt
}

export const GestureMotionLayer: React.FC<GestureMotionLayerProps> = ({
  config,
  durationInFrames,
  narration = '',
  isBehindLayer = false
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!config || !config.enabled) return null;

  const style = config.motionStyle || 'mrbeast_tycoon';

  // Phân tầng layer logic
  // Với mrbeast_tycoon và golden_cinematic: Chữ chính nằm ở BEHIND layer (sau lưng), các props/vương miện nằm ở IN FRONT layer
  // Với netflix_glass và callout_pills: Nằm ở IN FRONT layer (trước mặt)
  if (style === 'mrbeast_tycoon' || style === 'golden_cinematic') {
    if (config.layerOrder === 'behind_person' && !isBehindLayer) return null;
    if (config.layerOrder === 'in_front' && isBehindLayer) return null;
  } else {
    // netflix_glass và callout_pills luôn là in_front layer
    if (isBehindLayer) return null;
  }

  // Hiệu ứng nảy lò xo điện ảnh
  const enterSpring = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 130,
      mass: 0.7
    }
  });

  // Nhịp thở và uốn lượn nhẹ
  const floatY = Math.sin((frame / fps) * Math.PI * 1.6) * 7;
  const floatScale = 1.0 + Math.sin((frame / fps) * Math.PI * 1.2) * 0.025;

  // Lấy toàn bộ từ khóa câu thoại
  const allWords: MotionWordTag[] =
    config.words && config.words.length > 0
      ? config.words
      : narration
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w, idx) => ({
            text: w.replace(/[.,!?;:"'()]/g, ''),
            size: idx === 0 ? 'huge' : 'large',
            color: idx === 0 ? '#facc15' : '#ffffff',
            highlight: idx === 0
          }));

  // =========================================================================
  // PHONG CÁCH 1: MR BEAST / YOUTUBE TYCOON (ẢNH 1 THAM CHIẾU)
  // Lưới Cyber Grid xanh sau lưng + Chữ 2 tầng khổng lồ (Trắng & Vàng Cam Gradient) + Vương miện
  // =========================================================================
  if (style === 'mrbeast_tycoon') {
    // Tách từ thành 2 cụm: Cụm 1 (Top Line: Trắng) và Cụm 2 (Bottom Line: Vàng Cam Khổng Lồ)
    const midPoint = Math.max(1, Math.ceil(allWords.length / 2));
    const topWords = allWords.slice(0, midPoint);
    const bottomWords = allWords.slice(midPoint);

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
        {/* 1. Lưới Cyber Grid Xanh Neon Sau Lưng (Blue Grid Backdrop) */}
        {isBehindLayer && (
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(37, 99, 235, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(37, 99, 235, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              transform: `scale(${floatScale})`
            }}
          />
        )}

        {/* 2. Ánh Hào Quang Viền Xanh & Vàng (Blue & Gold Rim Backlight) */}
        {isBehindLayer && (
          <div
            className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, rgba(245, 158, 11, 0.4) 45%, transparent 75%)',
              transform: `scale(${enterSpring * floatScale}) translateY(${floatY}px)`
            }}
          />
        )}

        {/* 3. Chữ 2 Tầng Khổng Lồ Sau Lưng Người (Giant 2-Tier Typography) */}
        {isBehindLayer && (
          <div
            className="relative z-10 flex flex-col items-center justify-center w-full px-4 text-center"
            style={{
              opacity: enterSpring,
              transform: `scale(${enterSpring * floatScale}) translateY(${floatY - 20}px) rotate(-1.5deg)`
            }}
          >
            {/* DÒNG TRÊN: CHỮ TRẮNG TUYẾT KHỔNG LỒ (CUSTOM YOUTUBE) */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {topWords.map((w, idx) => (
                <span
                  key={`top-${idx}`}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter inline-block text-white"
                  style={{
                    WebkitTextStroke: '3px #000000',
                    textShadow:
                      '0 2px 0 #000, 0 4px 0 #000, 0 6px 0 #000, 0 8px 0 #111, 0 12px 25px rgba(0,0,0,0.95), 0 0 35px rgba(255,255,255,0.7)',
                    transform: 'skewX(-4deg)'
                  }}
                >
                  {w.text}
                </span>
              ))}
            </div>

            {/* DÒNG DƯỚI: CHỮ VÀNG CAM GRADIENT CỰC ĐẠI (THUMBNAIL) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
              {(bottomWords.length > 0 ? bottomWords : topWords).map((w, idx) => (
                <span
                  key={`bot-${idx}`}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter inline-block"
                  style={{
                    background: 'linear-gradient(180deg, #fff000 0%, #ff8800 50%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '3px #000000',
                    filter: 'drop-shadow(0 4px 0 #000) drop-shadow(0 8px 0 #000) drop-shadow(0 14px 20px rgba(0,0,0,0.95)) drop-shadow(0 0 40px rgba(255,136,0,0.8))',
                    transform: 'skewX(-4deg)'
                  }}
                >
                  {w.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Vương Miện Vàng Hoàng Gia Trên Đầu (Golden Crown Prop) */}
        {!isBehindLayer && config.showCrownProp !== false && (
          <div
            className="absolute top-12 z-40 pointer-events-none transition-transform"
            style={{
              opacity: enterSpring,
              transform: `scale(${enterSpring * floatScale}) translateY(${floatY}px)`
            }}
          >
            <div className="relative text-6xl sm:text-7xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] drop-shadow-[0_0_25px_rgba(250,204,21,0.8)] animate-pulse">
              👑
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PHONG CÁCH 2: GOLDEN 3D CINEMATIC (ẢNH 2 THAM CHIẾU)
  // Chữ vàng 3D ánh kim sang trọng (FROM ZERO) + 2 Đồng hồ 3D bay 2 bên
  // =========================================================================
  if (style === 'golden_cinematic') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
        {/* Rèm sân khấu xanh đậm viền 2 bên */}
        {isBehindLayer && (
          <>
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-blue-950/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-blue-950/80 to-transparent pointer-events-none" />
            {/* Luồng sáng vàng ấm sau lưng người */}
            <div
              className="absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-65 mix-blend-screen pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(250,204,21,0.7) 0%, rgba(217,119,6,0.4) 45%, transparent 70%)',
                transform: `scale(${enterSpring}) translateY(${floatY}px)`
              }}
            />
          </>
        )}

        {/* Chữ Vàng Kim 3D Nổi Khối (3D Golden Metallic Emboss) */}
        {isBehindLayer && (
          <div
            className="relative z-10 flex flex-wrap items-center justify-center gap-4 px-6 text-center max-w-5xl"
            style={{
              opacity: enterSpring,
              transform: `scale(${enterSpring * floatScale}) translateY(${floatY - 30}px)`
            }}
          >
            {allWords.map((w, idx) => (
              <span
                key={idx}
                className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight inline-block"
                style={{
                  background: 'linear-gradient(180deg, #fffbeb 0%, #fef08a 25%, #eab308 60%, #ca8a04 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '2.5px #78350f',
                  filter:
                    'drop-shadow(0 2px 0 #78350f) drop-shadow(0 5px 0 #451a03) drop-shadow(0 10px 20px rgba(0,0,0,0.9)) drop-shadow(0 0 35px rgba(250,204,21,0.85))'
                }}
              >
                {w.text}
              </span>
            ))}
          </div>
        )}

        {/* 2 Chiếc Đồng Hồ 3D Bay 2 Bên (Dual Floating 3D Clocks) */}
        {!isBehindLayer && config.showFloatingProps !== false && (
          <>
            {/* Đồng hồ bên trái */}
            <div
              className="absolute left-6 top-1/4 z-30 pointer-events-none transition-transform"
              style={{
                opacity: enterSpring,
                transform: `scale(${enterSpring}) translateY(${-floatY * 1.5}px) rotate(-12deg)`
              }}
            >
              <div className="text-6xl sm:text-7xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]">
                ⏰
              </div>
            </div>

            {/* Đồng hồ bên phải */}
            <div
              className="absolute right-6 top-1/4 z-30 pointer-events-none transition-transform"
              style={{
                opacity: enterSpring,
                transform: `scale(${enterSpring}) translateY(${floatY * 1.5}px) rotate(12deg)`
              }}
            >
              <div className="text-6xl sm:text-7xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]">
                ⏰
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // =========================================================================
  // PHONG CÁCH 3: NETFLIX / DOCUMENTARY FROSTED GLASS (ẢNH 3 THAM CHIẾU)
  // Hộp kính mờ Frosted Glass khổng lồ chuẩn phim tài liệu cao cấp
  // =========================================================================
  if (style === 'netflix_glass') {
    const fullSentence = allWords.map((w) => w.text).join(' ');

    return (
      <div className="absolute inset-x-4 sm:inset-x-12 bottom-12 z-30 pointer-events-none select-none flex justify-center">
        {/* Hộp Kính Mờ Frosted Glass Bo Góc Khổng Lồ */}
        <div
          className="w-full max-w-2xl px-8 py-7 rounded-3xl backdrop-blur-2xl bg-black/60 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center text-center"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${interpolate(enterSpring, [0, 1], [40, 0])}px)`
          }}
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider leading-relaxed"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.4)',
              letterSpacing: '0.04em'
            }}
          >
            {fullSentence || 'HOW TO CREATE ADVANCE LEVEL MOTION GRAPHICS'}
          </h2>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHONG CÁCH 4: CALLOUT PILLS & PROJECTOR BEAM (ẢNH 4 THAM CHIẾU)
  // Các viên thuốc Gradient Cam Neon 3D trôi nổi phát sáng bên cạnh người
  // =========================================================================
  if (style === 'callout_pills') {
    const defaultPills = [
      { icon: '🔥', text: allWords[0]?.text || 'MOTION GFX' },
      { icon: '📱', text: allWords.slice(1).map((w) => w.text).join(' ') || 'MOBILE ??' }
    ];

    const pills = config.pillBadges && config.pillBadges.length > 0 ? config.pillBadges : defaultPills;

    return (
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-end pr-8 sm:pr-16 z-30">
        {/* Luồng sáng Projector Beam chiếu từ trái sang phải */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse at 25% 50%, rgba(245, 158, 11, 0.45) 0%, rgba(234, 88, 12, 0.2) 40%, transparent 70%)'
          }}
        />

        {/* Danh sách các Viên Thuốc Pill Badges */}
        <div
          className="relative z-10 flex flex-col gap-4 max-w-sm"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${floatY}px)`
          }}
        >
          {pills.map((pill, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-orange-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_30px_rgba(249,115,22,0.65)] backdrop-blur-md transition-transform"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                transform: `translateX(${idx * 15}px)`
              }}
            >
              <span className="text-2xl filter drop-shadow-md">{pill.icon}</span>
              <span className="text-lg sm:text-xl font-black uppercase tracking-wider text-white drop-shadow-md">
                {pill.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: Chế độ thông thường
  return null;
};
