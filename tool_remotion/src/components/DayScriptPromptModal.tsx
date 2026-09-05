import React, { useState } from 'react';
import { Sparkles, Copy, Check, X, Film, Clapperboard, Video, Compass, Layers } from 'lucide-react';
import { RoadmapDayItem } from '../types/roadmap100';
import { roadmap100Service } from '../services/roadmap100Service';

interface DayScriptPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayItem: RoadmapDayItem | null;
  generalTopic: string;
  onSendToStudio?: (item: RoadmapDayItem) => void;
}

export const DayScriptPromptModal: React.FC<DayScriptPromptModalProps> = ({
  isOpen,
  onClose,
  dayItem,
  generalTopic,
  onSendToStudio
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dayItem) return null;

  const promptText = roadmap100Service.generateDayScriptPrompt(dayItem, generalTopic);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-indigo-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 border border-pink-400/40 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Bộ 3 Kịch Bản Video 2 Phút • Ngày {dayItem.day}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  3 SCRIPTS • 2 MINS
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Prompt chuẩn nghiệp vụ điện ảnh, quay phim, góc máy, SFX & quảng cáo thôi miên (không cần JSON)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight Highlights */}
        <div className="bg-gray-950/60 px-6 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">Nhiệm vụ Ngày {dayItem.day}:</span>
            <span className="text-cyan-300 font-medium truncate max-w-md">{dayItem.taskAction}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
              🎬 1. Kể Chuyện Điện Ảnh
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              🔥 2. Chuyên Gia Bẻ Định Kiến
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              🚀 3. Quảng Cáo Viral CTA
            </span>
          </div>
        </div>

        {/* Prompt Content Preview */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          <div className="relative">
            <textarea
              readOnly
              rows={14}
              value={promptText}
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs font-mono text-cyan-100 placeholder:text-gray-600 focus:outline-none resize-none transition shadow-inner leading-relaxed select-all"
            />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <b>Hướng dẫn:</b> Bấm <b>"Sao Chép Prompt"</b> rồi gửi cho ChatGPT, Claude hoặc Gemini. Bạn sẽ nhận được ngay 3 kịch bản hoàn chỉnh từng giây kèm chỉ đạo góc quay, nhạc nền SFX và lời thoại đọc truyền cảm!
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between gap-3">
          {onSendToStudio && (
            <button
              type="button"
              onClick={() => {
                onSendToStudio(dayItem);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-bold transition"
              title="Đưa nội dung ngày này thành cảnh trong Studio Remotion"
            >
              <Film className="w-3.5 h-3.5 text-pink-400" />
              <span>Đưa Vào Studio Remotion</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-pink-600/30 transition transform active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã Sao Chép Prompt 3 Kịch Bản!' : '📋 Sao Chép Prompt 3 Kịch Bản (2 Phút)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
