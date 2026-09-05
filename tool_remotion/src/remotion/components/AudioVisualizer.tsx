import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface AudioVisualizerProps {
  color?: string;
  barCount?: number;
  position?: 'bottom-center' | 'bottom-left' | 'top-right';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  color = '#22D3EE',
  barCount = 28,
  position = 'bottom-center'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = Array.from({ length: barCount }, (_, i) => {
    // Generate organic undulating audio waveform heights using multi-frequency harmonic sines
    const offset = i * 0.35;
    const speed = 0.22;
    const wave1 = Math.sin(frame * speed + offset);
    const wave2 = Math.cos(frame * speed * 0.7 + offset * 1.5);
    const wave3 = Math.sin(frame * speed * 1.3 - offset);

    const rawHeight = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
    const height = interpolate(rawHeight, [0, 1], [10, 85]);

    return { id: i, height };
  });

  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center items-end pointer-events-none z-20">
      <div className="flex items-end gap-1.5 px-5 py-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height: `${bar.height}px`,
              background: `linear-gradient(to top, ${color}, #A855F7, #EC4899)`,
              boxShadow: `0 0 12px ${color}80`
            }}
          />
        ))}
      </div>
    </div>
  );
};
