import React from 'react';
import { WatermarkConfig } from '../../types/video';

interface WatermarkProps {
  watermark: WatermarkConfig;
}

export const Watermark: React.FC<WatermarkProps> = ({ watermark }) => {
  if (!watermark.enabled || (!watermark.text && !watermark.logoUrl)) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-8 left-6',
    'bottom-right': 'bottom-8 right-6'
  }[watermark.position] || 'top-right';

  return (
    <div
      className={`absolute ${positionClasses} z-30 pointer-events-none flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg`}
      style={{ opacity: watermark.opacity ?? 0.85 }}
    >
      {watermark.logoUrl && (
        <img
          src={watermark.logoUrl}
          alt="Brand Logo"
          className="w-5 h-5 rounded-full object-cover"
        />
      )}
      {watermark.text && (
        <span className="text-white text-xs font-bold tracking-wider font-sans drop-shadow-md">
          {watermark.text}
        </span>
      )}
    </div>
  );
};
