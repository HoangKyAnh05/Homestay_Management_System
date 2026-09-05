import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface NightHighwaySceneProps {
  badgeText?: string;
  headline?: string;
  punchline?: string;
}

export const NightHighwayScene: React.FC<NightHighwaySceneProps> = ({
  badgeText = '🏎️ BỨT PHÁ TỐC ĐỘ',
  headline = 'TỰ ĐỘNG HÓA SIÊU TỐC',
  punchline = 'TĂNG TỐC VỀ ĐÍCH'
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Speed calculation
  const roadSpeed = frame * 22;
  const lightSpeed = frame * 12;
  const wheelRotation = frame * 25;
  const carBounce = Math.sin(frame * 0.4) * 2.5;

  // Streetlights array
  const streetlights = Array.from({ length: 4 }).map((_, i) => {
    const baseX = (i * 320 - lightSpeed) % 1200;
    const x = baseX < -200 ? baseX + 1200 : baseX;
    return { id: i, x };
  });

  // Road dashed lines
  const roadStripes = Array.from({ length: 8 }).map((_, i) => {
    const baseX = (i * 180 - roadSpeed) % 1400;
    const x = baseX < -100 ? baseX + 1400 : baseX;
    return { id: i, x };
  });

  return (
    <AbsoluteFill className="bg-[#0A0B14] flex flex-col justify-between items-center py-16 px-6 select-none overflow-hidden">
      {/* Top Header Badge */}
      <HeaderBadge text={badgeText} variant="gold" />

      {/* Top Title */}
      <div className="text-center flex flex-col items-center z-20">
        <h2 className="text-2xl font-black text-gray-400 tracking-wider uppercase">
          {headline}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 drop-shadow-[0_0_35px_rgba(244,63,94,0.8)]">
          {punchline}
        </h1>
      </div>

      {/* Highway Landscape Container */}
      <div className="w-full h-80 relative flex items-center justify-center my-auto overflow-hidden">
        {/* Distant Speed Lines */}
        <div className="absolute top-10 left-0 w-full flex flex-col gap-2 opacity-70">
          {[
            { color: '#22D3EE', w: '180px', speed: 30, top: 0 },
            { color: '#F43F5E', w: '240px', speed: 38, top: 12 },
            { color: '#FBBF24', w: '140px', speed: 25, top: 24 }
          ].map((line, idx) => {
            const lineX = ((frame * line.speed) % (width + 300)) - 200;
            return (
              <div
                key={idx}
                className="h-[3px] rounded-full"
                style={{
                  width: line.w,
                  backgroundColor: line.color,
                  boxShadow: `0 0 10px ${line.color}`,
                  transform: `translateX(${-lineX}px)`
                }}
              />
            );
          })}
        </div>

        {/* Streetlight Poles Scrolling */}
        {streetlights.map((l) => (
          <div
            key={l.id}
            className="absolute bottom-28"
            style={{ left: `${l.x}px` }}
          >
            {/* Pole */}
            <div className="w-2 h-44 bg-indigo-950 border-r border-indigo-800 rounded-t-lg relative">
              {/* Lamp head curve */}
              <div className="absolute top-0 right-0 w-8 h-3 rounded-t-full bg-indigo-800" />
              {/* Glowing Warm Lantern Bulb */}
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 shadow-[0_0_25px_#F59E0B]" />
              <div className="absolute top-4 right-1 w-12 h-28 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none rounded-full blur-md" />
            </div>
          </div>
        ))}

        {/* Highway Barrier Rail */}
        <div className="absolute bottom-24 w-full h-[2px] bg-purple-900/60" />

        {/* Highway Road Surface */}
        <div className="absolute bottom-6 w-full h-20 bg-gradient-to-b from-[#141624] to-[#0A0B14] flex items-center overflow-hidden">
          {/* Scrolling White Dashed Stripes */}
          {roadStripes.map((s) => (
            <div
              key={s.id}
              className="absolute w-16 h-2 rounded-full bg-gray-500/80 shadow-md"
              style={{ left: `${s.x}px` }}
            />
          ))}
        </div>

        {/* Animated Sports Car */}
        <div
          className="absolute bottom-12 flex flex-col items-center z-30"
          style={{ transform: `translateY(${carBounce}px)` }}
        >
          {/* Car Body SVG */}
          <div className="relative">
            {/* Front Headlight Beam */}
            <div className="absolute top-6 left-52 w-48 h-20 bg-gradient-to-r from-cyan-400/40 via-cyan-400/10 to-transparent blur-md pointer-events-none rounded-r-full" />

            {/* Sparkle Flares on Hood & Spoiler */}
            <div className="absolute top-2 left-16 text-white text-xl animate-spin">✨</div>
            <div className="absolute top-3 left-44 text-cyan-300 text-sm">✦</div>

            {/* Red Sports Car Chassis */}
            <svg width="240" height="90" viewBox="0 0 240 90">
              {/* Body Gradient */}
              <defs>
                <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="60%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
              </defs>

              {/* Chassis Outline */}
              <path
                d="M 15 65 L 35 65 Q 45 45 65 45 Q 85 45 95 65 L 145 65 Q 155 45 175 45 Q 195 45 205 65 L 230 60 Q 235 48 215 42 L 180 32 L 130 18 L 75 18 L 40 35 L 20 45 Z"
                fill="url(#carGrad)"
                stroke="#B91C1C"
                strokeWidth="2"
              />
              {/* Windows Tint */}
              <path
                d="M 80 22 L 125 22 L 170 34 L 135 34 L 80 34 Z"
                fill="#38BDF8"
                opacity="0.85"
              />
              {/* Rear Spoiler */}
              <path d="M 15 45 L 25 35 L 35 35" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
            </svg>

            {/* Spinning Alloy Wheels */}
            {/* Rear Wheel */}
            <div
              className="absolute bottom-1 left-9 w-12 h-12 rounded-full bg-black border-4 border-gray-700 flex items-center justify-center shadow-lg"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="w-6 h-6 rounded-full bg-gray-400 border border-gray-900" />
              <div className="absolute w-full h-[2px] bg-gray-400" />
              <div className="absolute h-full w-[2px] bg-gray-400" />
            </div>

            {/* Front Wheel */}
            <div
              className="absolute bottom-1 left-36 w-12 h-12 rounded-full bg-black border-4 border-gray-700 flex items-center justify-center shadow-lg"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="w-6 h-6 rounded-full bg-gray-400 border border-gray-900" />
              <div className="absolute w-full h-[2px] bg-gray-400" />
              <div className="absolute h-full w-[2px] bg-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
