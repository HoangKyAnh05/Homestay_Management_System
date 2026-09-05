import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, interpolate } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface RadarTechSceneProps {
  badgeText?: string;
  headline?: string;
  punchline?: string;
}

export const RadarTechScene: React.FC<RadarTechSceneProps> = ({
  badgeText = '📊 PHÂN TÍCH CHỈ SỐ',
  headline = 'DỮ LIỆU & ĐỒ HỌA',
  punchline = 'TRỰC QUAN ĐỈNH CAO'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 190 }
  });

  // 1. Bar Chart heights (Equalizer wave animation)
  const barHeights = [45, 65, 95, 110, 85, 55, 90].map((base, i) => {
    const wave = Math.sin(frame * 0.15 + i * 0.8);
    return Math.max(25, base + wave * 20);
  });

  // 2. Dual Sine Wave offset
  const waveOffset = frame * 0.08;

  // 3. Orbiting Planets
  const orbitAngle1 = (frame * 2.2) % 360;
  const orbitAngle2 = (frame * 1.5 + 120) % 360;
  const orbitAngle3 = (frame * 1.0 + 240) % 360;

  // 4. Radar Sweep Angle (360 deg sweep)
  const radarAngle = (frame * 3.5) % 360;

  return (
    <AbsoluteFill className="bg-[#090A10]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      {/* Top Header Badge */}
      <HeaderBadge text={badgeText} variant="cyan" />

      {/* Headline & Punchline */}
      <div className="text-center flex flex-col items-center mt-5">
        <h2 className="text-xl md:text-2xl font-black text-gray-300 tracking-wider uppercase">
          {headline}
        </h2>
        <h1 className="text-3xl md:text-4xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.7)]">
          {punchline}
        </h1>
      </div>

      {/* 2x2 Tech & Data Visual Grid - Wide (w-[94%] max-w-xl) */}
      <div
        className="grid grid-cols-2 gap-4 w-[94%] max-w-xl my-auto"
        style={{ transform: `scale(${introSpring})` }}
      >
        {/* CARD 1: Biểu đồ (Bar Chart) */}
        <div className="rounded-2xl bg-gray-950/90 border border-purple-500/30 p-3 flex flex-col h-48 shadow-lg shadow-purple-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Biểu đồ
          </span>
          <div className="w-full flex-1 flex items-end justify-center gap-2 pb-2 px-1">
            {barHeights.map((h, idx) => {
              const isLast = idx === barHeights.length - 1;
              return (
                <div
                  key={idx}
                  className={`w-3.5 rounded-t-lg transition-all ${
                    isLast
                      ? 'bg-emerald-400 shadow-[0_0_15px_#34D399]'
                      : 'bg-purple-600 shadow-[0_0_10px_#9333EA]'
                  }`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
          <div className="w-full h-[1px] bg-purple-500/40" />
        </div>

        {/* CARD 2: Sóng (Sine & Cosine Interference Waves) */}
        <div className="rounded-2xl bg-gray-950/90 border border-cyan-500/30 p-3 flex flex-col h-48 shadow-lg shadow-cyan-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Sóng
          </span>
          <div className="w-full flex-1 flex items-center justify-center relative">
            <svg className="w-full h-32" viewBox="0 0 200 100">
              {/* Cyan Wave */}
              <path
                d={`M 0 ${50 + Math.sin(waveOffset) * 30} Q 50 ${
                  50 + Math.sin(waveOffset + 1.5) * 45
                }, 100 ${50 + Math.sin(waveOffset + 3.0) * 30} T 200 ${
                  50 + Math.sin(waveOffset + 4.5) * 30
                }`}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3.5"
                style={{ filter: 'drop-shadow(0 0 8px #22D3EE)' }}
              />
              {/* Hot Pink Intersecting Wave */}
              <path
                d={`M 0 ${50 + Math.cos(waveOffset) * 30} Q 50 ${
                  50 + Math.cos(waveOffset + 1.5) * 45
                }, 100 ${50 + Math.cos(waveOffset + 3.0) * 30} T 200 ${
                  50 + Math.cos(waveOffset + 4.5) * 30
                }`}
                fill="none"
                stroke="#EC4899"
                strokeWidth="3.5"
                style={{ filter: 'drop-shadow(0 0 8px #EC4899)' }}
              />
            </svg>
          </div>
        </div>

        {/* CARD 3: Quỹ đạo (Concentric Planetary Orbits) */}
        <div className="rounded-2xl bg-gray-950/90 border border-pink-500/30 p-3 flex flex-col h-48 shadow-lg shadow-pink-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-pink-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Quỹ đạo
          </span>
          <div className="w-full flex-1 flex items-center justify-center relative">
            {/* Center Sun/Planet */}
            <div className="w-8 h-8 rounded-full bg-purple-500 shadow-[0_0_20px_#A855F7] z-10" />

            {/* Orbit 1 */}
            <div className="absolute w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center">
              <div
                className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#FBBF24]"
                style={{
                  transform: `rotate(${orbitAngle1}deg) translate(40px)`
                }}
              />
            </div>

            {/* Orbit 2 */}
            <div className="absolute w-32 h-32 rounded-full border border-gray-700 flex items-center justify-center">
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]"
                style={{
                  transform: `rotate(${orbitAngle2}deg) translate(64px)`
                }}
              />
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-pink-500 shadow-[0_0_12px_#EC4899]"
                style={{
                  transform: `rotate(${orbitAngle3}deg) translate(64px)`
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: Radar (Circular Sweeping Scanner Beam) */}
        <div className="rounded-2xl bg-gray-950/90 border border-amber-500/30 p-3 flex flex-col h-48 shadow-lg shadow-amber-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Radar
          </span>
          <div className="w-full flex-1 flex items-center justify-center relative">
            {/* Radar Circular Grid */}
            <div className="w-32 h-32 rounded-full border border-emerald-500/30 relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-emerald-500/30" />
              <div className="absolute w-full h-[1px] bg-emerald-500/20" />
              <div className="absolute h-full w-[1px] bg-emerald-500/20" />

              {/* Sweeping Cone Beam */}
              <div
                className="absolute w-16 h-16 origin-bottom-right"
                style={{
                  top: 0,
                  left: 0,
                  transform: `rotate(${radarAngle}deg)`,
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.6), transparent 70%)',
                  borderRight: '2px solid #34D399'
                }}
              />

              {/* Blip Target Dots */}
              <div className="absolute top-8 left-12 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34D399] animate-ping" />
              <div className="absolute bottom-6 right-8 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
              <div className="absolute top-14 right-10 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
