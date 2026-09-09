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
  RotateCcw,
  Compass,
  Layers,
  Scissors
} from 'lucide-react';
import { maxShowcaseProject } from '../remotion/sampleShowcaseProject';
import { sampleHomestayProject } from '../remotion/sampleHomestayProject';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings: () => void;
  onOpenRender: () => void;
  onOpenVideoSplitter?: () => void;
  isGenerating: boolean;
  activeView: 'editor' | 'roadmap100';
  setActiveView: (view: 'editor' | 'roadmap100') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  setProject,
  onOpenSettings,
  onOpenRender,
  onOpenVideoSplitter,
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
    if (window.confirm('Bạn có chắc muốn làm mới/khởi động lại ứng dụng không?')) {
      if (window.electronAPI?.restartApp) {
        window.electronAPI.restartApp();
      } else {
        window.location.reload();
      }
    }
  };

  const handleLoadHomestaySample = () => {
    if (window.confirm('Tải mẫu video marketing chuẩn Lá Đỏ Homestay Sa Pa (Săn Mây & Nghỉ Dưỡng)?')) {
      setProject(sampleHomestayProject);
      localStorage.setItem('CURRENT_PROJECT', JSON.stringify(sampleHomestayProject));
      setActiveView('editor');
    }
  };

  const handleLoadShowcaseSample = () => {
    if (window.confirm('Tải mẫu kỹ xảo CapCut Motion 3D nâng cao?')) {
      setProject(maxShowcaseProject);
      localStorage.setItem('CURRENT_PROJECT', JSON.stringify(maxShowcaseProject));
      setActiveView('editor');
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-gray-800/80 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between z-30 sticky top-0 gap-3">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Film className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                Studio Marketing
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Lá Đỏ Sa Pa
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Biên tập video ngắn đa nền tảng</p>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-800 mx-1 hidden md:block" />

        {/* Project Name editable */}
        <input
          type="text"
          value={project.title}
          title={project.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-gray-800/60 hover:bg-gray-800/90 focus:bg-gray-800 border border-indigo-500/40 focus:border-indigo-400 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-indigo-200 focus:text-white focus:outline-none transition-all w-52 sm:w-80 md:w-96 lg:w-[420px] max-w-full shadow-inner"
          placeholder="Tên video: VD Săn mây Sa Pa 2N1Đ..."
        />
      </div>

      {/* Center & Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Aspect Ratio Switch */}
        <div className="bg-gray-900/90 p-0.5 sm:p-1 rounded-xl border border-gray-800 flex items-center shadow-inner">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Tỷ lệ 9:16 dọc (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Tỷ lệ 16:9 ngang (YouTube, Facebook)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>
        </div>

        {/* View Switcher: Studio Video vs Đường Ray 100 Ngày */}
        <div className="bg-gray-900/90 p-0.5 sm:p-1 rounded-xl border border-gray-800 flex items-center shadow-inner hidden md:flex">
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'editor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Giao diện Studio biên tập Video"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveView('roadmap100')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'roadmap100'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Lộ trình sáng tạo nội dung 100 ngày"
          >
            <span>Lộ trình 100N</span>
          </button>
        </div>

        {/* Nút Nạp Mẫu Homestay Nhanh */}
        <div className="flex items-center gap-1 bg-gray-900/80 p-0.5 rounded-xl border border-gray-800">
          <button
            type="button"
            onClick={handleLoadHomestaySample}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Nạp kịch bản mẫu: Giới thiệu phòng & Săn mây Lá Đỏ Sa Pa"
          >
            <span>🏔️</span>
            <span className="hidden sm:inline">Kịch bản mẫu Homestay</span>
          </button>

          <button
            type="button"
            onClick={handleLoadShowcaseSample}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 text-xs font-medium transition-all"
            title="Nạp mẫu kỹ xảo CapCut Motion 3D nâng cao"
          >
            <span>✨</span>
            <span className="hidden lg:inline">Showcase CapCut</span>
          </button>
        </div>

        {/* Nút Chia Video Dài Thành Video Ngắn (Smart Splitter) */}
        {onOpenVideoSplitter && (
          <button
            type="button"
            onClick={onOpenVideoSplitter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/25 to-pink-500/25 hover:from-rose-500/40 hover:to-pink-500/40 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Tải video dài lên & tự động chia 5s, 10s, 15s kèm tính năng co ngắn đoạn thừa"
          >
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Chia Video Dài</span>
          </button>
        )}

        {/* Settings & Restart icon buttons */}
        <button
          onClick={handleRestartApp}
          className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/40 transition-all"
          title="Làm mới trình biên tập"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/40 transition-all"
          title="Cài đặt API AI & Giọng đọc"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Render Video Button */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Video</span>
        </button>
      </div>
    </header>
  );
};
