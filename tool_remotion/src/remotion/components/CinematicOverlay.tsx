import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const CinematicOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Generate fixed random particle positions and speeds
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (i * 47) % width,
      baseY: (i * 83) % height,
      size: 2 + (i % 4) * 2.5,
      speed: 0.8 + (i % 3) * 0.4,
      opacity: 0.25 + (i % 5) * 0.12
    }));
  }, [width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Floating Dust Particles */}
      {particles.map((p) => {
        const y = (p.baseY - frame * p.speed) % height;
        const currentY = y < 0 ? y + height : y;
        const shimmer = interpolate(Math.sin((frame + p.id * 10) * 0.1), [-1, 1], [0.4, 1]);

        return (
          <div
            key={p.id}
            className="absolute rounded-full bg-white/70"
            style={{
              left: `${p.x}px`,
              top: `${currentY}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity * shimmer,
              boxShadow: `0 0 ${p.size * 2}px rgba(255, 255, 255, 0.8)`
            }}
          />
        );
      })}

      {/* Cinematic subtle anamorphic light leak in corners */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl" />
    </div>
  );
};
