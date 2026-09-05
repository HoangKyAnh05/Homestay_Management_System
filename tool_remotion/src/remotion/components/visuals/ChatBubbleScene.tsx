import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

interface ChatBubbleSceneProps {
  badgeText?: string;
  messages?: Array<{ sender: 'left' | 'right'; text: string }>;
  headline?: string;
  punchline?: string;
}

export const ChatBubbleScene: React.FC<ChatBubbleSceneProps> = ({
  badgeText = '💬 INBOX MỖI NGÀY',
  messages = [
    { sender: 'left', text: 'Làm video kiểu gì mà đẹp thế ạ? 😍' },
    { sender: 'right', text: 'Đồ họa trực quan quá!' },
    { sender: 'left', text: 'Cuốn hút thật sự luôn 🔥' }
  ],
  headline = 'Bí quyết nằm ở',
  punchline = 'ĐẸP TRỰC QUAN CUỐN HÚT'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance springs for each bubble with staggered timing
  const bubbleDelays = [8, 26, 44];

  // Entrance spring for bottom punchline
  const punchlineSpring = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 11, stiffness: 190 }
  });

  return (
    <AbsoluteFill className="bg-[#090A10] flex flex-col justify-between items-center py-20 px-8 select-none">
      {/* 1. Header Badge */}
      <HeaderBadge text={badgeText} variant="purple" />

      {/* 2. Chat Dialogue Feed */}
      <div className="w-full max-w-lg flex flex-col gap-5 my-auto">
        {messages.map((msg, i) => {
          const delay = bubbleDelays[i] || (i + 1) * 20;
          const isVisible = frame >= delay;
          if (!isVisible) return null;

          const bubbleSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 220, mass: 0.5 }
          });

          const isRight = msg.sender === 'right';

          return (
            <div
              key={i}
              className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}
              style={{
                transform: `scale(${bubbleSpring}) translateY(${(1 - bubbleSpring) * 25}px)`,
                transformOrigin: isRight ? 'right center' : 'left center'
              }}
            >
              {isRight ? (
                // Right sender: Vibrant Hot Pink Neon Bubble
                <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xl shadow-[0_0_35px_rgba(244,63,94,0.6)] border border-pink-400/50">
                  {msg.text}
                </div>
              ) : (
                // Left sender: Dark Sleek Glassmorphism Bubble
                <div className="px-6 py-4 rounded-2xl bg-gray-900/90 border border-gray-700/80 text-gray-100 font-bold text-lg shadow-2xl backdrop-blur-md">
                  {msg.text}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Punchline Callout */}
      {frame >= 50 && (
        <div
          className="text-center flex flex-col items-center gap-2"
          style={{
            transform: `scale(${punchlineSpring})`,
            opacity: punchlineSpring
          }}
        >
          <span className="text-gray-400 font-semibold text-2xl tracking-wide">
            {headline}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 drop-shadow-[0_0_35px_rgba(192,132,252,0.8)]">
            {punchline}
          </h1>
        </div>
      )}
    </AbsoluteFill>
  );
};
