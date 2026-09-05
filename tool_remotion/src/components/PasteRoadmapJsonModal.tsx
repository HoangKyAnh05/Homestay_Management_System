import React, { useState } from 'react';
import { FileJson, Clipboard, Check, AlertCircle, Sparkles, X } from 'lucide-react';
import { roadmap100Service } from '../services/roadmap100Service';
import { RoadmapDayItem } from '../types/roadmap100';

interface PasteRoadmapJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDays: (days: RoadmapDayItem[]) => void;
  currentTopic: string;
}

export const PasteRoadmapJsonModal: React.FC<PasteRoadmapJsonModalProps> = ({
  isOpen,
  onClose,
  onApplyDays,
  currentTopic
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      validateJson(text);
    } catch {
      setErrorMsg('Không thể đọc clipboard tự động. Vui lòng bấm Ctrl + V vào ô bên dưới!');
    }
  };

  const validateJson = (text: string) => {
    setErrorMsg(null);
    setDetectedCount(null);
    if (!text.trim()) return;

    try {
      const days = roadmap100Service.parseRoadmapJson(text, currentTopic);
      setDetectedCount(days.length);
    } catch (err: any) {
      setErrorMsg(err.message || 'JSON không đúng định dạng!');
    }
  };

  const handleApply = () => {
    try {
      const days = roadmap100Service.parseRoadmapJson(jsonInput, currentTopic);
      if (days.length === 0) {
        setErrorMsg('Không có ngày nào trong dữ liệu JSON!');
        return;
      }
      onApplyDays(days);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi phân tích JSON!');
    }
  };

  const handleLoadSample = () => {
    const sample = roadmap100Service.generateSample100Days(currentTopic);
    const sampleJson = JSON.stringify(
      sample.days.slice(0, 10).map((d) => ({
        day: d.day,
        title: d.title,
        taskAction: d.taskAction,
        category: d.category,
        btsDescription: d.bts.description,
        benefit: d.benefit
      })),
      null,
      2
    );
    setJsonInput(sampleJson);
    validateJson(sampleJson);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Dán Mã JSON Lộ Trình 100 Ngày</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI IMPORT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dán kết quả JSON tạo từ ChatGPT, Gemini hoặc Claude để tự động nạp 100 ngày lên đường ray
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Dán từ Clipboard</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem JSON mẫu</span>
              </button>
            </div>

            {detectedCount !== null && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Nhận diện: {detectedCount} ngày</span>
              </span>
            )}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={12}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                validateJson(e.target.value);
              }}
              placeholder='[
  {
    "day": 1,
    "title": "Khai màn hành trình",
    "taskAction": "Quay video 45s nói về lý do tại sao bắt đầu...",
    "category": "Video ngắn",
    "btsDescription": "Góc máy góc rộng, đèn softbox vàng ấm...",
    "benefit": "Thu hút 500 follower đầu tiên có cùng mối quan tâm..."
  }
]'
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 resize-none transition shadow-inner"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Guide Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>💡 Mẹo hữu ích:</span>
            </div>
            <p>
              1. Bấm nút <b>"Copy Prompt AI"</b> trên thanh công cụ ngoài màn hình chính để lấy câu lệnh prompt tối ưu cho ChatGPT / Claude.
            </p>
            <p>
              2. Gửi prompt cho AI và yêu cầu xuất ra đủ 100 ngày (hoặc từng đợt 25 ngày nếu văn bản quá dài).
            </p>
            <p>
              3. Copy toàn bộ đoạn JSON AI trả về và dán vào ô trên, sau đó bấm <b>"Áp Dụng Lộ Trình"</b> để nạp ngay vào đường ray uốn lượn!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!jsonInput.trim() || !!errorMsg}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-lg shadow-cyan-600/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Áp Dụng Lộ Trình 100 Ngày</span>
          </button>
        </div>
      </div>
    </div>
  );
};
