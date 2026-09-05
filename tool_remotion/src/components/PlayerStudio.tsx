import React, { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { MainComposition } from '../remotion/Composition';
import { VideoProject, SubtitleStyle, WatermarkConfig, SoundFxConfig, ElementPosition } from '../types/video';
import { InteractiveCanvasOverlay } from './InteractiveCanvasOverlay';
import {
  Type,
  Palette,
  Music,
  Sliders,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Tag,
  Volume2,
  Activity,
  FolderOpen,
  Move,
  Layers,
  Play
} from 'lucide-react';

interface PlayerStudioProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

const BGM_OPTIONS = [
  {
    id: 'bgm-lofi-1',
    name: '🎵 Lo-Fi Chill & Study (Nhẹ nhàng, thư thái)',
    url: '/audio/bgm-lofi.wav'
  },
  {
    id: 'bgm-tech-1',
    name: '⚡ Công nghệ & Hiện đại (Futuristic Tech)',
    url: '/audio/bgm-tech.wav'
  },
  {
    id: 'bgm-cinematic-1',
    name: '🌌 Điện ảnh & Bí ẩn (Cinematic Mystery)',
    url: '/audio/bgm-cinematic.wav'
  },
  {
    id: 'bgm-none',
    name: '🔇 Không nhạc nền (Chỉ giọng đọc Voiceover)',
    url: ''
  }
];

const PRESET_FONTS = [
  { name: 'Montserrat (Đậm nét, Hiện đại)', value: 'Montserrat, sans-serif' },
  { name: 'Inter (Sạch sẽ, Tinh gọn)', value: 'Inter, sans-serif' },
  { name: 'Be Vietnam Pro (Việt hoá chuẩn)', value: 'Be Vietnam Pro, sans-serif' },
  { name: 'Impact (Mạnh mẽ TikTok)', value: 'Impact, sans-serif' }
];

const PRESET_HIGHLIGHT_COLORS = [
  { name: 'Vàng Neon', color: '#FACC15' },
  { name: 'Xanh Lá Neon', color: '#4ADE80' },
  { name: 'Xanh Cyan', color: '#22D3EE' },
  { name: 'Hồng Hot Pink', color: '#F43F5E' },
  { name: 'Trắng Sáng', color: '#FFFFFF' }
];

export const PlayerStudio: React.FC<PlayerStudioProps> = ({ project, setProject }) => {
  // Calculate total frames exactly matching Series.Sequence
  const totalFrames = useMemo(() => {
    const fps = project.fps || 30;
    const frames = project.scenes.reduce(
      (acc, s) => acc + Math.max(Math.round((s.audioDuration || 4) * fps), Math.round(2 * fps)),
      0
    );
    return Math.max(frames, 30);
  }, [project.scenes, project.fps]);

  const compositionWidth = project.aspectRatio === '9:16' ? 1080 : 1920;
  const compositionHeight = project.aspectRatio === '9:16' ? 1920 : 1080;

  const [studioMode, setStudioMode] = useState<'preview' | 'interactive_canvas'>('preview');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);

  const handleUpdatePositions = (sceneId: string, positions: Record<string, ElementPosition>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, elementPositions: positions } : s))
    }));
  };

  const handleUpdateNarration = (sceneId: string, text: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, narration: text } : s))
    }));
  };

  const handleUpdateScene = (sceneId: string, updates: any) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s))
    }));
  };

  const updateSubtitleStyle = (updates: Partial<SubtitleStyle>) => {
    setProject((prev) => ({
      ...prev,
      subtitleStyle: {
        ...prev.subtitleStyle,
        ...updates
      }
    }));
  };

  const updateWatermark = (updates: Partial<WatermarkConfig>) => {
    setProject((prev) => ({
      ...prev,
      watermark: {
        ...prev.watermark,
        ...updates
      }
    }));
  };

  const updateSoundFx = (updates: Partial<SoundFxConfig>) => {
    setProject((prev) => ({
      ...prev,
      soundFx: {
        ...prev.soundFx,
        ...updates
      }
    }));
  };

  const handleSelectBgm = (url: string) => {
    setProject((prev) => ({
      ...prev,
      bgm: {
        ...prev.bgm,
        url
      }
    }));
  };

  const handleSelectCustomBgmFile = async () => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file nhạc MP3/WAV từ máy tính làm nhạc nền',
          filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const audioUrl = `file://${filePath.replace(/\\/g, '/')}`;
          setProject((prev) => ({
            ...prev,
            bgm: {
              ...prev.bgm,
              url: audioUrl,
              localPath: filePath
            }
          }));
        }
      } catch (err) {
        console.error('BGM select error:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Player Frame Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col items-center shadow-sm">
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          {/* Mode Switcher: Xem Video vs Kéo Thả Chuột */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setStudioMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                studioMode === 'preview'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Xem Video</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioMode('interactive_canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                studioMode === 'interactive_canvas'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Click và kéo di chuyển các ô chữ, icon, sticker tự do bằng chuột"
            >
              <Move className="w-3.5 h-3.5 text-blue-600" />
              <span>Kéo Thả Vị Trí</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {totalFrames} Frames • {(totalFrames / (project.fps || 30)).toFixed(1)}s
          </span>
        </div>

        {/* Chế độ 1: Kéo thả vị trí bằng chuột */}
        {studioMode === 'interactive_canvas' ? (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Bộ chọn phân cảnh để kéo thả */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Chọn cảnh:</span>
              {project.scenes.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedSceneIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cảnh {s.order || idx + 1}
                </button>
              ))}
            </div>

            {/* Interactive Canvas Drag Frame */}
            {project.scenes[selectedSceneIndex] ? (
              <InteractiveCanvasOverlay
                scene={project.scenes[selectedSceneIndex]}
                aspectRatio={project.aspectRatio}
                onUpdatePositions={handleUpdatePositions}
                onUpdateNarration={handleUpdateNarration}
                onUpdateScene={handleUpdateScene}
              />
            ) : null}
          </div>
        ) : (
          /* Chế độ 2: Remotion Live Player thông thường */
          <div
            className="relative shadow-md rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-300"
            style={{
              width: '100%',
              maxWidth: project.aspectRatio === '9:16' ? '270px' : '100%',
              aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: '480px'
            }}
          >
            {project.scenes.length > 0 ? (
              <Player
                component={MainComposition}
                inputProps={{ project }}
                durationInFrames={totalFrames}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                fps={project.fps || 30}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                controls
                autoPlay={false}
                loop
              />
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">
                Chưa có phân cảnh nào. Hãy nhấn tạo kịch bản ở trên!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retention Elements Customizer (Watermark, Progress Bar) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Activity className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Thương Hiệu & Tiến Trình Video
          </h4>
        </div>

        {/* Watermark Branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Logo / Tên thương hiệu góc video:</span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={project.watermark?.enabled ?? true}
                onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {project.watermark?.enabled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={project.watermark.text || ''}
                onChange={(e) => updateWatermark({ text: e.target.value })}
                placeholder="@LáĐỏHomestaySaPa"
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <select
                value={project.watermark.position}
                onChange={(e) => updateWatermark({ position: e.target.value as any })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="top-right">Góc trên bên phải</option>
                <option value="top-left">Góc trên bên trái</option>
                <option value="bottom-right">Góc dưới bên phải</option>
                <option value="bottom-left">Góc dưới bên trái</option>
              </select>
            </div>
          )}
        </div>

        {/* Progress Bar Toggle & Sound FX */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={project.showProgressBar ?? true}
              onChange={(e) => setProject((prev) => ({ ...prev, showProgressBar: e.target.checked }))}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>Thanh Progress Bar đáy</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={project.soundFx?.enableWhoosh ?? true}
              onChange={(e) => updateSoundFx({ enableWhoosh: e.target.checked })}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>Âm thanh chuyển cảnh</span>
          </label>
        </div>
      </div>

      {/* Subtitle & Audio Styling Customizer */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Type className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Tùy Chỉnh Phụ Đề Chạy Chữ & Âm Nhạc
          </h4>
        </div>

        {/* Subtitle font & color controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Font Family */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium">Kiểu Font chữ:</label>
            <select
              value={project.subtitleStyle.fontFamily}
              onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {PRESET_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Highlight Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium">Màu chữ Highlight:</label>
            <div className="flex items-center gap-2">
              {PRESET_HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => updateSubtitleStyle({ highlightColor: c.color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    project.subtitleStyle.highlightColor === c.color
                      ? 'border-slate-900 scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Background Music Selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhạc nền BGM:</span>
            </label>
            <button
              onClick={handleSelectCustomBgmFile}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 py-0.5 px-2 rounded bg-blue-50 border border-blue-200 cursor-pointer"
              title="Chọn file MP3 từ máy tính"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Tải file MP3 riêng</span>
            </button>
          </div>

          <select
            value={project.bgm?.url || ''}
            onChange={(e) => handleSelectBgm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          >
            {BGM_OPTIONS.map((b) => (
              <option key={b.name} value={b.url}>
                {b.name}
              </option>
            ))}
            {project.bgm?.localPath && (
              <option value={project.bgm.url}>
                📂 {project.bgm.localPath.split('\\').pop() || 'Nhạc từ máy tính'}
              </option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};
