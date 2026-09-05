import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface ExtendedVisualOverlayProps {
  visualType: string;
  badgeText?: string;
  narration?: string;
}

export const ExtendedVisualOverlay: React.FC<ExtendedVisualOverlayProps> = ({
  visualType,
  badgeText = '',
  narration = ''
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 130, mass: 0.7 }
  });

  const floatY = Math.sin((frame / fps) * Math.PI * 1.6) * 6;
  const floatScale = 1.0 + Math.sin((frame / fps) * Math.PI * 1.2) * 0.02;

  // 1. Vương Miện Hoàng Gia 3D (Ảnh 1)
  if (visualType === 'crown_youtube' || visualType.includes('crown')) {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-between p-8 select-none">
        {/* Lưới Cyber Grid nền mờ phía sau */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(37, 99, 235, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Vương miện 3D trên đầu */}
        <div
          className="relative top-6 transition-transform"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring * floatScale}) translateY(${floatY}px)`
          }}
        >
          <div className="text-7xl filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] drop-shadow-[0_0_30px_rgba(250,204,21,0.9)] animate-pulse">
            👑
          </div>
        </div>

        {/* Badge chữ phía dưới */}
        {badgeText && (
          <div
            className="px-5 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-yellow-400/60 shadow-2xl"
            style={{ opacity: enterSpring }}
          >
            <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
              {badgeText}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. 2 Đồng Hồ 3D Bay 2 Bên (Ảnh 2)
  if (visualType === 'floating_clocks' || visualType.includes('clock')) {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between p-6 select-none">
        {/* Đồng hồ trái */}
        <div
          className="text-6xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${-floatY * 1.5}px) rotate(-12deg)`
          }}
        >
          ⏰
        </div>

        {/* Đồng hồ phải */}
        <div
          className="text-6xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${floatY * 1.5}px) rotate(12deg)`
          }}
        >
          ⏰
        </div>

        {/* Badge chữ phía trên */}
        {badgeText && (
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-green-400/50 shadow-2xl"
            style={{ opacity: enterSpring }}
          >
            <span className="text-xs font-black uppercase tracking-wider text-green-300">
              {badgeText}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. Hộp Kính Mờ Phim Tài Liệu Netflix (Ảnh 3)
  if (visualType === 'frosted_glass_pro' || visualType.includes('glass')) {
    return (
      <div className="absolute inset-x-4 sm:inset-x-12 bottom-12 z-20 pointer-events-none select-none flex justify-center">
        <div
          className="w-full max-w-2xl px-8 py-6 rounded-3xl backdrop-blur-2xl bg-black/65 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.1)] text-center"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${interpolate(enterSpring, [0, 1], [30, 0])}px)`
          }}
        >
          <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-widest leading-relaxed">
            {narration || badgeText || 'PHÂN ĐOẠN ĐẶC BIỆT'}
          </h3>
        </div>
      </div>
    );
  }

  // 4. Các Viên Thuốc Neon Nổi Bật (Ảnh 4)
  if (visualType === 'viral_callout_pills' || visualType.includes('pill')) {
    const words = narration ? narration.split(/\s+/).slice(0, 4) : ['ĐIỂM NHẤN', 'QUAN TRỌNG'];
    const p1 = words.slice(0, 2).join(' ') || 'MOTION GFX';
    const p2 = words.slice(2).join(' ') || 'HOT TREND';

    return (
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-end pr-8 z-20">
        <div
          className="flex flex-col gap-3 max-w-xs"
          style={{
            opacity: enterSpring,
            transform: `scale(${enterSpring}) translateY(${floatY}px)`
          }}
        >
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border-2 border-orange-400 bg-gradient-to-r from-orange-500 to-amber-600 shadow-xl shadow-orange-500/30">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-black uppercase text-white tracking-wider">{p1}</span>
          </div>

          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-500 to-yellow-600 shadow-xl shadow-yellow-500/30 ml-4">
            <span className="text-xl">📱</span>
            <span className="text-sm font-black uppercase text-white tracking-wider">{p2}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
