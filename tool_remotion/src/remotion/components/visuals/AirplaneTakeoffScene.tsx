import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface AirplaneTakeoffSceneProps {
  badgeText?: string;
  headline?: string;
  punchline?: string;
}

export const AirplaneTakeoffScene: React.FC<AirplaneTakeoffSceneProps> = ({
  badgeText = '✈️ CẤT CÁNH THÀNH CÔNG',
  headline = 'VƯƠN TẦM CAO MỚI',
  punchline = 'CHẠM ĐẾN ĐỈNH CAO'
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Floating Clouds drifting
  const cloudSpeed = frame * 2.5;
  const clouds = [
    { id: 1, top: '15%', base: 100, scale: 1.1, opacity: 0.6 },
    { id: 2, top: '28%', base: 450, scale: 1.3, opacity: 0.75 },
    { id: 3, top: '42%', base: 800, scale: 0.9, opacity: 0.5 }
  ].map((c) => {
    const x = ((c.base - cloudSpeed) % (width + 300)) - 100;
    const finalX = x < -200 ? x + (width + 300) : x;
    return { ...c, x: finalX };
  });

  // Aircraft climbing trajectory
  const planeY = interpolate(frame, [0, 150], [80, -40], { extrapolateRight: 'clamp' });
  const planeTilt = -16 + Math.sin(frame * 0.2) * 1.5; // Pitch up angle with aerodynamic float

  return (
    <AbsoluteFill className="bg-[#080912] flex flex-col justify-between items-center py-16 px-6 select-none overflow-hidden">
      {/* Top Header Badge */}
      <HeaderBadge text={badgeText} variant="cyan" />

      {/* Top Title */}
      <div className="text-center flex flex-col items-center z-20">
        <h2 className="text-2xl font-black text-gray-400 tracking-wider uppercase">
          {headline}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.8)]">
          {punchline}
        </h1>
      </div>

      {/* Sky Canvas Container */}
      <div className="w-full h-96 relative flex items-center justify-center my-auto overflow-hidden">
        {/* Night Clouds */}
        {clouds.map((c) => (
          <div
            key={c.id}
            className="absolute"
            style={{
              top: c.top,
              left: `${c.x}px`,
              transform: `scale(${c.scale})`,
              opacity: c.opacity
            }}
          >
            {/* SVG Puffy Cloud */}
            <svg width="180" height="90" viewBox="0 0 180 90">
              <path
                d="M 30 65 Q 10 65 15 45 Q 20 25 45 30 Q 60 10 90 15 Q 120 10 135 30 Q 165 30 160 55 Q 165 65 140 65 Z"
                fill="#1E2235"
                stroke="#2B304A"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.8))' }}
              />
            </svg>
          </div>
        ))}

        {/* Runway Horizon Line */}
        <div className="absolute bottom-20 w-full h-[1.5px] bg-indigo-900/40" />

        {/* Jet Airplane Ascending */}
        <div
          className="absolute left-24 z-30"
          style={{
            transform: `translateY(${planeY}px) rotate(${planeTilt}deg)`
          }}
        >
          {/* Contrail / Engine Jet Vapor Trail */}
          <div className="absolute top-14 -left-36 w-36 h-2 bg-gradient-to-r from-transparent via-cyan-400/30 to-white/70 blur-sm rounded-full pointer-events-none" />

          {/* Jet Airplane SVG Graphic */}
          <svg width="260" height="110" viewBox="0 0 260 110">
            <defs>
              <linearGradient id="jetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#93C5FD" />
              </linearGradient>
            </defs>

            {/* Jet Fuselage */}
            <path
              d="M 20 55 L 45 20 L 70 20 L 55 55 L 180 55 Q 230 55 245 70 Q 230 85 180 85 L 60 85 L 20 55 Z"
              fill="url(#jetGrad)"
              stroke="#60A5FA"
              strokeWidth="2.5"
            />
            {/* Jet Cockpit Windows */}
            <path d="M 215 65 L 235 68 L 225 73 Z" fill="#0EA5E9" />
            {/* Passenger Cabin Windows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <circle key={i} cx={90 + i * 11} cy="68" r="2.5" fill="#E0F2FE" />
            ))}
            {/* Wing */}
            <polygon points="110,75 140,105 165,105 155,75" fill="#1D4ED8" stroke="#3B82F6" strokeWidth="1.5" />
            {/* Jet Engine Turbine */}
            <ellipse cx="130" cy="85" rx="14" ry="7" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />
            <circle cx="140" cy="85" r="4" fill="#38BDF8" style={{ filter: 'drop-shadow(0 0 8px #38BDF8)' }} />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
