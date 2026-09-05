import React from 'react';
import { Key, Mic, Sliders, FolderOpen, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeyGemini: string;
  setApiKeyGemini: (key: string) => void;
  apiKeyPexels: string;
  setApiKeyPexels: (key: string) => void;
  voiceRate: string;
  setVoiceRate: (rate: string) => void;
  voicePitch: string;
  setVoicePitch: (pitch: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeyGemini,
  setApiKeyGemini,
  apiKeyPexels,
  setApiKeyPexels,
  voiceRate,
  setVoiceRate,
  voicePitch,
  setVoicePitch
}) => {
  if (!isOpen) return null;

  const [githubPageUrl, setGithubPageUrl] = React.useState(
    () => localStorage.getItem('GITHUB_PAGE_URL') || 'https://hoangkyanh05.github.io/Tool_Report/'
  );

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKeyGemini);
    localStorage.setItem('PEXELS_API_KEY', apiKeyPexels);
    localStorage.setItem('VOICE_RATE', voiceRate);
    localStorage.setItem('VOICE_PITCH', voicePitch);
    localStorage.setItem('GITHUB_PAGE_URL', githubPageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Cấu Hình Dịch Vụ & API Keys</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold px-2">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* GitHub Page URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Đường dẫn GitHub Pages:</span>
              <a
                href={githubPageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Mở thử
              </a>
            </label>
            <input
              type="text"
              value={githubPageUrl}
              onChange={(e) => setGithubPageUrl(e.target.value)}
              placeholder="https://hoangkyanh05.github.io/Tool_Report/"
              className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none font-mono"
            />
          </div>

          {/* Pexels API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Pexels API Key (Kho video/ảnh HD miễn phí):</span>
              <a
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Lấy key miễn phí
              </a>
            </label>
            <input
              type="password"
              value={apiKeyPexels}
              onChange={(e) => setApiKeyPexels(e.target.value)}
              placeholder="Nhập Pexels API Key..."
              className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none"
            />
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Google Gemini API Key (Tùy chọn - AI sinh kịch bản):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Lấy API key
              </a>
            </label>
            <input
              type="password"
              value={apiKeyGemini}
              onChange={(e) => setApiKeyGemini(e.target.value)}
              placeholder="Nhập Gemini API Key (Không bắt buộc)..."
              className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none"
            />
          </div>

          {/* Voice Speech Rate & Pitch */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Mic className="w-3 h-3 text-indigo-400" />
                <span>Tốc độ đọc (Rate):</span>
              </label>
              <select
                value={voiceRate}
                onChange={(e) => setVoiceRate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="-20%">Chậm (-20%)</option>
                <option value="-10%">Hơi chậm (-10%)</option>
                <option value="+0%">Bình thường (Chuẩn 1.0x)</option>
                <option value="+10%">Nhanh nhẹ (+10%)</option>
                <option value="+20%">Nhanh TikTok (+20%)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Cao độ giọng (Pitch):</span>
              </label>
              <select
                value={voicePitch}
                onChange={(e) => setVoicePitch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="-10Hz">Trầm hơn (-10Hz)</option>
                <option value="+0Hz">Mặc định (+0Hz)</option>
                <option value="+10Hz">Thanh hơn (+10Hz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
