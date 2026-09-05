import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, interpolate } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface OrbitalGlowSceneProps {
  badgeText?: string;
  title?: string;
  centerIcon?: string;
  pipelineSteps?: string[];
}

export const OrbitalGlowScene: React.FC<OrbitalGlowSceneProps> = ({
  badgeText = '🔑 HÔM NAY BẬT MÍ',
  title = 'ỨNG DỤNG AI',
  centerIcon = '🤖',
  pipelineSteps = ['Ý TƯỞNG', 'KỊCH BẢN', 'THỰC THI']
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 180 }
  });

  // Continuous rotation for satellites
  const rotationAngle = (frame * 2.2) % 360;
  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.96, 1.04]);

  // Radius for wide, bold orbit (radius = 210px -> diameter ~440px)
  const radius = 210;

  // Generate 8 orbiting satellite dots around the ring
  const satellites = [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
    const rad = ((deg + rotationAngle) * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const isCyan = i % 2 === 0;

    return {
      id: i,
      x,
      y,
      color: isCyan ? '#22D3EE' : '#EC4899'
    };
  });

  return (
    <AbsoluteFill className="bg-[#090A10]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      {/* 1. Header Badge */}
      <HeaderBadge text={badgeText} variant="gold" />

      {/* 2. Headline Title placed AT TOP (under badge, away from bottom subtitles to prevent overlap) */}
      {title && (
        <div className="text-center mt-6 px-4">
          <h1
            className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white"
            style={{
              textShadow: '0 0 35px #C084FC, 0 0 70px #9333EA, 0 4px 15px rgba(0,0,0,0.9)'
            }}
          >
            {title}
          </h1>
        </div>
      )}

      {/* 3. Large, Bold Glowing Orbit Core (fills screen width ~85%) */}
      <div
        className="relative my-auto flex items-center justify-center"
        style={{ transform: `scale(${introSpring * pulse})` }}
      >
        {/* Outer Orbit Path Ring - 460px wide */}
        <div className="w-[460px] h-[460px] rounded-full border-2 border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.3)] flex items-center justify-center relative">
          {/* Orbiting Satellite Dots */}
          {satellites.map((s) => (
            <div
              key={s.id}
              className="absolute w-5 h-5 rounded-full"
              style={{
                backgroundColor: s.color,
                boxShadow: `0 0 20px ${s.color}, 0 0 40px ${s.color}`,
                transform: `translate(${s.x}px, ${s.y}px)`
              }}
            />
          ))}

          {/* Secondary Concentric Glow Ring */}
          <div className="w-[340px] h-[340px] rounded-full border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.2)] flex items-center justify-center">
            {/* Inner Glowing Core Aura */}
            <div className="w-60 h-60 rounded-full bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 p-2 shadow-[0_0_80px_rgba(236,72,153,0.8)] flex items-center justify-center">
              {/* Center Core Circle with Big Icon */}
              <div className="w-full h-full rounded-full bg-[#11131F] flex items-center justify-center text-8xl filter drop-shadow-2xl">
                <span>{centerIcon}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Optional Pipeline tags in upper area if present, leaving bottom 30% totally clear for subtitles */}
      {pipelineSteps && pipelineSteps.length > 0 && (
        <div className="flex items-center gap-2 mb-10">
          {pipelineSteps.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="px-3.5 py-1.5 rounded-xl bg-gray-900/90 border border-purple-500/40 text-purple-200 text-xs font-black tracking-wider shadow-lg">
                {step}
              </div>
              {idx < pipelineSteps.length - 1 && (
                <span className="text-purple-400 font-bold text-xs">›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
