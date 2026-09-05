import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, interpolate } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface MathGridSceneProps {
  badgeText?: string;
  headline?: string;
  punchline?: string;
}

export const MathGridScene: React.FC<MathGridSceneProps> = ({
  badgeText = '👀 XEM NGAY ĐÂY',
  headline = 'FLEX HIỆU ỨNG VISUAL',
  punchline = 'CỰC ĐỈNH'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 190 }
  });

  // Animation values for each card
  // 1. Parabola dot position along curve
  const tParabola = (Math.sin(frame * 0.08) + 1) / 2; // 0 to 1
  const dotX = interpolate(tParabola, [0, 1], [20, 160]);
  const normX = (dotX - 90) / 70; // -1 to 1
  const dotY = 140 - normX * normX * 80;

  // 2. Checkerboard animated glowing blocks
  const pulseGrid = Math.floor((frame / 8) % 4);

  // 3. Number axis bouncing balls
  const ballJump1 = Math.abs(Math.sin(frame * 0.15)) * 30;
  const ballJump2 = Math.abs(Math.cos(frame * 0.12)) * 25;

  // 4. Polar rose flower rotation & trail
  const flowerAngle = (frame * 3) % 360;

  return (
    <AbsoluteFill className="bg-[#090A10]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      {/* 1. Header Badge */}
      <HeaderBadge text={badgeText} variant="cyan" />

      {/* 2. Headline & Punchline */}
      <div className="text-center flex flex-col items-center mt-5 max-w-lg px-2">
        <h2 className="text-lg md:text-xl font-black text-gray-300 tracking-wider uppercase">
          {headline}
        </h2>
        <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.7)] line-clamp-2">
          {punchline}
        </h1>
      </div>

      {/* 3. 2x2 Animated Visual Cards Grid - Wide (w-[94%] max-w-xl) */}
      <div
        className="grid grid-cols-2 gap-4 w-[94%] max-w-xl my-auto"
        style={{ transform: `scale(${introSpring})` }}
      >
        {/* CARD 1: Parabol */}
        <div className="rounded-2xl bg-gray-950/90 border border-cyan-500/30 p-3.5 flex flex-col h-56 shadow-xl shadow-cyan-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Parabol
          </span>
          <div className="w-full flex-1 flex items-center justify-center relative">
            {/* Axis Lines */}
            <div className="absolute w-full h-[1px] bg-gray-800" />
            <div className="absolute h-full w-[1px] bg-gray-800" />

            {/* SVG Parabola Curve */}
            <svg className="w-full h-full" viewBox="0 0 180 160">
              <path
                d="M 20 60 Q 90 150 160 60"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3.5"
                style={{ filter: 'drop-shadow(0 0 8px #22D3EE)' }}
              />
              {/* Bouncing Dot on Curve */}
              <circle
                cx={dotX}
                cy={dotY}
                r="6"
                fill="#38BDF8"
                style={{ filter: 'drop-shadow(0 0 10px #38BDF8)' }}
              />
            </svg>
          </div>
        </div>

        {/* CARD 2: Bàn cờ 8x8 */}
        <div className="rounded-2xl bg-gray-950/80 border border-pink-500/30 p-3 flex flex-col h-44 shadow-lg shadow-pink-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-pink-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Bàn cờ 8×8
          </span>
          <div className="w-full flex-1 grid grid-cols-6 grid-rows-6 gap-1 p-2 bg-gray-900/60 rounded-xl border border-gray-800">
            {Array.from({ length: 36 }).map((_, idx) => {
              const isGlowing =
                (idx === 34 || idx === 35 || idx === 29) && pulseGrid >= 1;
              const isSecondary =
                (idx === 22 || idx === 23) && pulseGrid === 2;

              return (
                <div
                  key={idx}
                  className={`rounded-sm transition-all ${
                    isGlowing
                      ? 'bg-pink-500 shadow-[0_0_12px_#EC4899]'
                      : isSecondary
                      ? 'bg-purple-500 shadow-[0_0_8px_#A855F7]'
                      : idx % 2 === 0
                      ? 'bg-gray-800/80'
                      : 'bg-gray-900/80'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CARD 3: Trục số */}
        <div className="rounded-2xl bg-gray-950/80 border border-amber-500/30 p-3 flex flex-col h-44 shadow-lg shadow-amber-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Trục số
          </span>
          <div className="w-full flex-1 flex flex-col justify-center items-center relative">
            {/* Axis with tick marks */}
            <div className="w-full h-[2px] bg-gray-700 relative flex justify-between px-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-[2px] h-3 bg-gray-600 -translate-y-1" />
              ))}
            </div>

            {/* Bouncing Dots */}
            <div
              className="absolute left-8 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]"
              style={{ bottom: `${45 + ballJump1}px` }}
            />
            <div
              className="absolute left-20 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_#34D399]"
              style={{ bottom: `${45 + ballJump2}px` }}
            />
            <div
              className="absolute right-6 w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_12px_#FBBF24]"
              style={{ bottom: '40px' }}
            />
          </div>
        </div>

        {/* CARD 4: Hoa toán học */}
        <div className="rounded-2xl bg-gray-950/80 border border-purple-500/30 p-3 flex flex-col h-44 shadow-lg shadow-purple-500/10 relative overflow-hidden">
          <span className="text-[11px] font-bold text-purple-400 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Hoa toán học
          </span>
          <div className="w-full flex-1 flex items-center justify-center relative">
            <svg
              className="w-28 h-28"
              viewBox="0 0 100 100"
              style={{ transform: `rotate(${flowerAngle}deg)` }}
            >
              {/* Polar rose flower petals */}
              <path
                d="M 50 50 C 65 20, 85 35, 50 50 C 80 65, 65 85, 50 50 C 35 80, 20 65, 50 50 C 20 35, 35 20, 50 50"
                fill="none"
                stroke="#FACC15"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 0 10px #FACC15)' }}
              />
              <circle
                cx="50"
                cy="50"
                r="4"
                fill="#C084FC"
                style={{ filter: 'drop-shadow(0 0 8px #C084FC)' }}
              />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
