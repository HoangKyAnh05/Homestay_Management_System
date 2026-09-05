import React from 'react';
import { VideoProject, AspectRatio } from '../types/video';
import {
  Smartphone,
  Tv,
  Settings,
  Sparkles,
  Film,
  Download,
  RotateCcw,
  Compass,
  LayoutGrid
} from 'lucide-react';
import { maxShowcaseProject } from '../remotion/sampleShowcaseProject';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings: () => void;
  onOpenRender: () => void;
  isGenerating: boolean;
  activeView: 'editor' | 'roadmap100';
  setActiveView: React.Dispatch<React.SetStateAction<'editor' | 'roadmap100'>>;
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
    if (window.confirm('Bạn có chắc muốn tải lại trình biên tập không?')) {
      if (window.electronAPI?.restartApp) {
        window.electronAPI.restartApp();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <header className="h-16 px-5 border-b border-slate-200 bg-white flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                Lá Đỏ Video Studio
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                Homestay
              </span>
            </div>
            <p className="text-xs text-slate-500">Biên tập video & xuất bản đa kênh</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* View Switcher: Studio Video vs Đường Ray 100 Ngày */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>🎬 Studio Video</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('roadmap100')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'roadmap100'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>🛣️ Đường Ray 100 Ngày</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
              HOT
            </span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Switch & Actions */}
      <div className="flex items-center gap-3">
        {/* Nút Nạp Mẫu Homestay Sa Pa */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Bạn có muốn nạp kịch bản mẫu Homestay Sa Pa để chỉnh sửa không?')) {
              setProject(maxShowcaseProject);
              localStorage.setItem('CURRENT_PROJECT', JSON.stringify(maxShowcaseProject));
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition active:scale-95 cursor-pointer"
          title="Nạp kịch bản mẫu Homestay Sa Pa"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Mẫu Homestay Sa Pa</span>
        </button>

        {/* Aspect Ratio Toggle */}
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              project.aspectRatio === '9:16'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Shorts, TikTok, Reels (9:16 Dọc)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Dọc</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              project.aspectRatio === '16:9'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="YouTube, Facebook (16:9 Ngang)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>16:9 Ngang</span>
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRestartApp}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all group cursor-pointer"
          title="Tải lại trình biên tập"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-300" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
          title="Cài đặt cấu hình"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Render Video Button */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Video MP4</span>
        </button>
      </div>
    </header>
  );
};
