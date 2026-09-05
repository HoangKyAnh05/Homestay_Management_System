import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = Math.min(100, (frame / durationInFrames) * 100);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/40 z-30 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-pink-500/50 transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
