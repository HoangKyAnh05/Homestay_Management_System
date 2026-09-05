import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, interpolate } from 'remotion';
import { HeaderBadge } from './HeaderBadge';

// 1. Stock Chart Breakout (+320% Green Candle) - Wide & Bold
export const StockChartScene: React.FC<{ badgeText?: string; punchline?: string }> = ({
  badgeText = '📈 BÙNG NỔ LỢI NHUẬN',
  punchline = 'TĂNG TRƯỞNG ĐỘT BIẾN'
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  const percentNumber = Math.round(progress * 328);

  return (
    <AbsoluteFill className="bg-[#080A12]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      <HeaderBadge text={badgeText} variant="cyan" />
      
      <div className="text-center mt-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white drop-shadow-[0_0_30px_#10B981]">
          {punchline}
        </h1>
        <div className="text-6xl md:text-7xl font-black text-emerald-400 font-mono mt-2 tracking-wider animate-pulse">
          +{percentNumber}%
        </div>
      </div>

      {/* Stock Candlestick Chart SVG - Wide & Prominent (w-[92%]) */}
      <div className="w-[92%] max-w-xl h-80 bg-gray-950/90 rounded-3xl border-2 border-emerald-500/40 p-5 flex flex-col justify-end relative shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden my-auto">
        <div className="flex items-end justify-between h-56 gap-2 sm:gap-3">
          {[
            { h: 50, green: true },
            { h: 75, green: true },
            { h: 55, green: false },
            { h: 100, green: true },
            { h: 130, green: true },
            { h: 110, green: false },
            { h: 160, green: true },
            { h: 210, green: true }
          ].map((bar, i) => {
            const currentH = Math.min(bar.h, bar.h * (progress * 1.4));
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className={`w-6 sm:w-8 rounded-lg shadow-lg ${
                    bar.green ? 'bg-emerald-400 shadow-emerald-500/60' : 'bg-red-500 shadow-red-500/40'
                  }`}
                  style={{ height: `${currentH}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="w-full h-[2px] bg-emerald-500/50 mt-2" />
      </div>
    </AbsoluteFill>
  );
};

// 2. Google Search Typing Bar - Wide & Bold
export const GoogleSearchScene: React.FC<{ badgeText?: string; query?: string }> = ({
  badgeText = '🔍 TÌM KIẾM BÍ QUYẾT',
  query = 'Làm sao để tạo video AI triệu view?'
}) => {
  const frame = useCurrentFrame();
  const charsCount = Math.min(query.length, Math.floor(frame * 0.9));
  const displayText = query.slice(0, charsCount);
  const showCursor = frame % 10 < 5;

  return (
    <AbsoluteFill className="bg-[#090A14]/95 flex flex-col justify-start items-center pt-16 pb-28 px-6 select-none overflow-hidden">
      <HeaderBadge text={badgeText} variant="purple" />

      {/* Google Logo & Search Box - Wide (w-[94%] max-w-xl) */}
      <div className="w-[94%] max-w-xl flex flex-col items-center gap-6 my-auto">
        {/* Google Stylized Logo */}
        <div className="text-6xl font-black tracking-tight drop-shadow-lg">
          <span className="text-blue-500">G</span>
          <span className="text-red-500">o</span>
          <span className="text-amber-400">o</span>
          <span className="text-blue-500">g</span>
          <span className="text-emerald-500">l</span>
          <span className="text-red-500">e</span>
        </div>

        {/* Search Input Bar */}
        <div className="w-full p-4 rounded-full bg-gray-900/95 border-2 border-indigo-500/70 shadow-[0_0_45px_rgba(99,102,241,0.4)] flex items-center gap-3">
          <span className="text-gray-400 text-2xl pl-2">🔍</span>
          <span className="text-white font-bold text-xl flex-1 truncate">
            {displayText}
            {showCursor && <span className="text-indigo-400 font-normal">|</span>}
          </span>
          <span className="text-2xl pr-2">🎙️</span>
        </div>

        {/* Suggestions Pop */}
        {charsCount > 8 && (
          <div className="w-full bg-gray-900/95 border border-gray-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5">
            <div className="text-sm text-gray-300 flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg font-medium">
              <span>🔍</span> <span>{query} <b>ngay hôm nay</b></span>
            </div>
            <div className="text-sm text-gray-300 flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg font-medium">
              <span>🔍</span> <span>công thức bí truyền triệu view</span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 3. Bank Ting Ting Notification - Wide & Bold
export const BankNotificationScene: React.FC<{ badgeText?: string; punchline?: string }> = ({
  badgeText = '💵 THÔNG BÁO BIẾN ĐỘNG SỐ DƯ',
  punchline = 'TIỀN VỀ LIÊN TỤC'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const notifications = [
    { bank: 'MB BANK', amount: '+50.000.000 VND', time: 'Vừa xong', delay: 10 },
    { bank: 'VIETCOMBANK', amount: '+128.500.000 VND', time: '1 phút trước', delay: 28 },
    { bank: 'TECHCOMBANK', amount: '+75.000.000 VND', time: '3 phút trước', delay: 46 }
  ];

  return (
    <AbsoluteFill className="bg-[#070913]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      <HeaderBadge text={badgeText} variant="gold" />

      <h1 className="text-3xl md:text-4xl font-black uppercase text-amber-300 drop-shadow-[0_0_25px_#F59E0B] text-center mt-6">
        {punchline}
      </h1>

      <div className="w-[94%] max-w-xl flex flex-col gap-4 my-auto">
        {notifications.map((notif, idx) => {
          if (frame < notif.delay) return null;
          const s = spring({
            frame: frame - notif.delay,
            fps,
            config: { damping: 11, stiffness: 220 }
          });

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gray-900/95 border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center justify-between"
              style={{ transform: `scale(${s}) translateY(${(1 - s) * 20}px)` }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl">
                  🔔
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 tracking-wider">{notif.bank}</div>
                  <div className="text-2xl font-black text-emerald-400 tracking-wider">
                    {notif.amount}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono">{notif.time}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 4. Split-Screen VS Battle - Wide & Bold
export const VsBattleScene: React.FC<{ badgeText?: string; punchline?: string }> = ({
  badgeText = '⚡ SO SÁNH ĐỐI ĐẦU',
  punchline = 'LỰA CHỌN KHÔN NGOAN'
}) => {
  return (
    <AbsoluteFill className="bg-black flex flex-col justify-start items-center pt-14 pb-28 select-none overflow-hidden">
      <HeaderBadge text={badgeText} variant="purple" />

      <h1 className="text-3xl md:text-4xl font-black uppercase text-white drop-shadow-[0_0_25px_#22D3EE] text-center mt-5">
        {punchline}
      </h1>

      {/* Split Screen 50 / 50 */}
      <div className="w-full flex-1 flex items-stretch relative my-6">
        {/* Left Side: Old / Red */}
        <div className="w-1/2 bg-gradient-to-br from-red-950/90 to-gray-950 flex flex-col items-center justify-center p-6 text-center border-r-2 border-red-500/60">
          <span className="text-5xl mb-3">❌</span>
          <h3 className="text-2xl font-black text-red-400 uppercase">CÁCH LÀM CŨ</h3>
          <p className="text-sm text-gray-300 mt-2 font-medium leading-relaxed">Mất 6-8 tiếng dựng thủ công, tốn kém công sức</p>
        </div>

        {/* VS Central Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-cyan-500 border-2 border-white shadow-[0_0_30px_white] flex items-center justify-center font-black text-white text-2xl z-20 animate-bounce">
          VS
        </div>

        {/* Right Side: New AI / Cyan */}
        <div className="w-1/2 bg-gradient-to-bl from-cyan-950/90 to-gray-950 flex flex-col items-center justify-center p-6 text-center border-l-2 border-cyan-500/60">
          <span className="text-5xl mb-3">⚡</span>
          <h3 className="text-2xl font-black text-cyan-400 uppercase">REMOTION AI</h3>
          <p className="text-sm text-gray-300 mt-2 font-medium leading-relaxed">1-Click tạo trọn vẹn toàn bộ video trong 10 giây</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 5. Code Terminal / Hacker Matrix - Wide & Bold
export const CodeTerminalScene: React.FC<{ badgeText?: string; punchline?: string }> = ({
  badgeText = '💻 TỰ ĐỘNG HÓA BẰNG CODE',
  punchline = 'LẬP TRÌNH VIDEO ĐỈNH CAO'
}) => {
  const codeLines = [
    'import { Composition, Audio, Series } from "remotion";',
    'export const MainVideo = () => {',
    '  const { fps } = useVideoConfig();',
    '  // Tự động hóa video bằng trí tuệ nhân tạo',
    '  return <RemotionAutoEditor aiModel="Gemini-2.0" />;',
    '};'
  ];

  return (
    <AbsoluteFill className="bg-[#0A0D18]/95 flex flex-col justify-start items-center pt-14 pb-28 px-6 select-none overflow-hidden">
      <HeaderBadge text={badgeText} variant="cyan" />

      <h1 className="text-3xl md:text-4xl font-black uppercase text-cyan-300 drop-shadow-[0_0_25px_#22D3EE] text-center mt-5">
        {punchline}
      </h1>

      {/* VS Code IDE Terminal Window - Wide (w-[94%] max-w-2xl) */}
      <div className="w-[94%] max-w-2xl bg-[#0F1423]/95 rounded-3xl border-2 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.35)] overflow-hidden my-auto">
        {/* Terminal Header */}
        <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-gray-400 ml-2">VideoGenerator.tsx</span>
        </div>

        {/* Code Content */}
        <div className="p-6 font-mono text-sm text-indigo-200 space-y-2.5">
          {codeLines.map((line, idx) => (
            <div key={idx} className="flex gap-4">
              <span className="text-gray-600 select-none w-5">{idx + 1}</span>
              <span className={idx === 4 ? 'text-pink-400 font-bold' : idx === 3 ? 'text-emerald-400 italic' : ''}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
