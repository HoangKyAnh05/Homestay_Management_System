import React from 'react';
import { VideoProject, AspectRatio } from '../types/video';
import {
  Smartphone,
  Tv,
  Settings,
  Sparkles,
  Play,
  Film,
  Download,
  FolderOpen,
  RotateCcw
} from 'lucide-react';
import { maxShowcaseProject } from '../remotion/sampleShowcaseProject';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings: () => void;
  onOpenRender: () => void;
  isGenerating: boolean;
  activeView: 'editor' | 'roadmap100';
  setActiveView: (view: 'editor' | 'roadmap100') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  setProject,
  onOpenSettings,
  onOpenRender,
  isGenerating,
  activeView,
  setActiveView
}) => {
  const handleRatioChange = (ratio: AspectRatio) => {
    setProject((prev) => ({
      ...prev,
      aspectRatio: ratio
    }));
  };

  const handleTitleChange = (title: string) => {
    setProject((prev) => ({
      ...prev,
      title
    }));
  };

  const handleRestartApp = () => {
    if (window.confirm('Bạn có chắc muốn khởi động lại ứng dụng không?')) {
      if (window.electronAPI?.restartApp) {
        window.electronAPI.restartApp();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <header className="h-16 px-5 border-b border-gray-800/80 glass-panel flex items-center justify-between z-30 sticky top-0">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-indigo-300 text-lg tracking-tight">
                Remotion AI
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Studio
              </span>
            </div>
            <p className="text-xs text-gray-400">Tạo & Tự động biên tập Video AI</p>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-800 mx-1 hidden sm:block" />

        {/* Project Name editable */}
        <input
          type="text"
          value={project.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-gray-800/40 hover:bg-gray-800/70 focus:bg-gray-800 border border-transparent focus:border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-200 focus:outline-none transition-all w-52 sm:w-64"
          placeholder="Tên dự án video..."
        />
      </div>

      {/* Aspect Ratio Switch & Actions */}
      <div className="flex items-center gap-3">
        {/* View Switcher: Studio Video AI vs Đường Ray 100 Ngày */}
        <div className="bg-gray-900/90 p-1 rounded-xl border border-gray-800 flex items-center shadow-inner">
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'editor'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Giao diện Studio biên tập Video Remotion"
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Studio Video</span>
          </button>
          <button
            onClick={() => setActiveView('roadmap100')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'roadmap100'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Đường ray xương cá lộ trình 100 ngày uốn lượn"
          >
            <span>🛣️ Đường Ray 100 Ngày</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              HOT
            </span>
          </button>
        </div>

        {/* Nút Nạp Mẫu Trình Diễn Đỉnh Cao (Max Showcase) */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Bạn có muốn nạp Mẫu Trình Diễn Đỉnh Cao (Showcase Max Level) để xem trọn bộ hiệu ứng, chữ 3D phông xanh, âm thanh SFX và meme triệu view không?')) {
              setProject(maxShowcaseProject);
              localStorage.setItem('CURRENT_PROJECT', JSON.stringify(maxShowcaseProject));
              setActiveView('editor');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-black shadow-lg shadow-rose-500/25 transition active:scale-95 cursor-pointer animate-pulse"
          title="Nạp kịch bản 4 phân cảnh đỉnh cao phô diễn toàn bộ tính năng CapCut Motion"
        >
          <span>🔥</span>
          <span>Mẫu Đỉnh Cao (Showcase)</span>
        </button>

        {/* Aspect Ratio Toggle */}
        <div className="bg-gray-900/80 p-1 rounded-xl border border-gray-800 flex items-center">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Shorts, TikTok, Reels (9:16 Dọc)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Shorts</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="YouTube, Facebook (16:9 Ngang)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>16:9 YouTube</span>
          </button>
        </div>

        {/* Open on GitHub Pages Button */}
        <button
          onClick={() => {
            const url = localStorage.getItem('GITHUB_PAGE_URL') || 'https://hoangkyanh05.github.io/Tool_Report/';
            if (window.electronAPI?.openPath) {
              window.electronAPI.openPath(url);
            } else {
              window.open(url, '_blank');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
          title="Mở ứng dụng trên GitHub Pages"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GitHub Page</span>
        </button>

        {/* Restart App Button */}
        <button
          onClick={handleRestartApp}
          className="p-2.5 rounded-xl bg-gray-800/60 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 transition-all group"
          title="Khởi động lại ứng dụng (Restart App)"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-300" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 transition-all"
          title="Cài đặt API & Cấu hình"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Render Video Button */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 glow-primary"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Video MP4</span>
        </button>
      </div>
    </header>
  );
};
