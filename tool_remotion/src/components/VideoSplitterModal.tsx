import React, { useState, useRef } from 'react';
import {
  Scissors,
  Upload,
  Play,
  Pause,
  Clock,
  Sparkles,
  Check,
  X,
  Film,
  Layers,
  ArrowRight,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { VideoProject, VideoSegment, TrimOverflowOption } from '../types/video';
import {
  inspectVideoFile,
  splitVideoIntoSegments,
  trimSegmentWithOption,
  convertSegmentsToScenes,
  formatTimeDisplay,
  VideoMetadata
} from '../services/videoSplitterService';

interface VideoSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const VideoSplitterModal: React.FC<VideoSplitterModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject
}) => {
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [splitInterval, setSplitInterval] = useState<number>(10);
  const [customInterval, setCustomInterval] = useState<string>('10');
  const [overflowMode, setOverflowMode] = useState<TrimOverflowOption>('shift_to_next');
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Tải lên video dài
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const meta = await inspectVideoFile(file);
      setVideoMeta(meta);

      // Tự động chia theo splitInterval hiện tại
      const initialSegments = splitVideoIntoSegments(meta.url, meta.duration, splitInterval);
      setSegments(initialSegments);
      showNotification(`Đã tải video "${file.name}" (${formatTimeDisplay(meta.duration)}) và tự động chia thành ${initialSegments.length} clip (${splitInterval}s/clip)!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc file video');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Chia lại theo khoảng thời gian mới
  const handleReSplit = (seconds: number) => {
    if (!videoMeta) return;
    setSplitInterval(seconds);
    const newSegments = splitVideoIntoSegments(videoMeta.url, videoMeta.duration, seconds);
    setSegments(newSegments);
    showNotification(`Đã chia lại video thành ${newSegments.length} clip (mỗi clip ${seconds} giây)`);
  };

  // 3. Kéo co ngắn thời lượng của 1 segment
  const handleDurationChange = (index: number, newDur: number, specificMode?: TrimOverflowOption) => {
    const mode = specificMode || overflowMode;
    const { updatedSegments, message } = trimSegmentWithOption(segments, index, newDur, mode);
    setSegments(updatedSegments);
    showNotification(message);
  };

  // 4. Phát thử từng đoạn clip
  const handleTogglePlaySegment = (seg: VideoSegment) => {
    const videoEl = previewVideoRefs.current[seg.id];
    if (!videoEl) return;

    if (playingSegmentId === seg.id) {
      videoEl.pause();
      setPlayingSegmentId(null);
    } else {
      // Dừng các clip khác nếu đang chạy
      Object.entries(previewVideoRefs.current).forEach(([id, el]) => {
        if (id !== seg.id && el) el.pause();
      });

      videoEl.currentTime = seg.startOffset;
      videoEl.play();
      setPlayingSegmentId(seg.id);

      // Tự động dừng khi hết đoạn endOffset
      const checkEnd = () => {
        if (videoEl.currentTime >= seg.endOffset) {
          videoEl.pause();
          videoEl.currentTime = seg.startOffset;
          setPlayingSegmentId(null);
          videoEl.removeEventListener('timeupdate', checkEnd);
        }
      };
      videoEl.addEventListener('timeupdate', checkEnd);
    }
  };

  // 5. Xóa 1 segment
  const handleDeleteSegment = (id: string) => {
    const filtered = segments.filter((s) => s.id !== id).map((s, idx) => ({
      ...s,
      order: idx + 1,
      title: `Clip #${idx + 1} (${s.duration}s)`
    }));
    setSegments(filtered);
    showNotification('Đã xóa 1 clip khỏi danh sách.');
  };

  // 6. Cập nhật kịch bản / ghi chú cho từng clip
  const handleUpdateNarration = (index: number, text: string) => {
    const copy = [...segments];
    copy[index].narration = text;
    setSegments(copy);
  };

  // 7. Hoàn tất: Chuyển tất cả clip thành Scene trong Remotion Storyboard
  const handleApplyToStoryboard = () => {
    if (segments.length === 0) {
      alert('Chưa có clip nào được tạo. Vui lòng tải video lên trước.');
      return;
    }

    const newScenes = convertSegmentsToScenes(segments);
    const totalDuration = Number(segments.reduce((sum, s) => sum + s.duration, 0).toFixed(2));

    setProject((prev) => ({
      ...prev,
      scenes: newScenes,
      totalDuration
    }));

    alert(`🎉 Thành công! Đã chuyển ${newScenes.length} đoạn video ngắn vào Storyboard phân cảnh của Remotion Studio! Bạn có thể thêm phụ đề, lồng tiếng AI hoặc xuất video ngay.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bộ Chia Video Dài Thành Video Ngắn
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  Tự Động & Kéo Co Ngắn
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Chia video thành các đoạn 5s, 10s, 15s. Kéo co ngắn đoạn thừa với 2 lựa chọn: chuyển sang video sau hoặc xóa bỏ.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo nổi (Notification banner) */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Khu vực Upload Video */}
          {!videoMeta ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-slate-800 group-hover:bg-rose-600/20 border border-slate-700 group-hover:border-rose-500 flex items-center justify-center text-slate-400 group-hover:text-rose-400 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Nhấn để tải lên hoặc kéo thả video dài vào đây
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Hỗ trợ định dạng MP4, MOV, WEBM. Thích hợp cho video quay Homestay, flycam, tour phòng, review toàn cảnh.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white truncate max-w-sm">
                    {videoMeta.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-rose-300 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Tổng: {formatTimeDisplay(videoMeta.duration)} ({videoMeta.duration}s)
                    </span>
                    <span>• {videoMeta.width}x{videoMeta.height}</span>
                    <span>• {videoMeta.sizeMb} MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đổi video khác
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Thanh công cụ chia giây & Chế độ đoạn thừa */}
          {videoMeta && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Chọn mốc giây */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-rose-400" />
                    Chia video theo khoảng thời gian:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[5, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleReSplit(sec)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          splitInterval === sec
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-900/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        ⚡ {sec} Giây / Clip
                      </button>
                    ))}

                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                      <input
                        type="number"
                        min="1"
                        max={Math.floor(videoMeta.duration)}
                        value={customInterval}
                        onChange={(e) => setCustomInterval(e.target.value)}
                        placeholder="Số giây..."
                        className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(customInterval);
                          if (val > 0) handleReSplit(val);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        Chia
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option đoạn thừa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Khi kéo co ngắn lại đoạn thừa:
                  </label>
                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOverflowMode('shift_to_next')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        overflowMode === 'shift_to_next'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Đoạn cắt thừa sẽ tự động được gộp sang bắt đầu của clip tiếp theo để không mất nội dung"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Chuyển sang video sau
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverflowMode('discard')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        overflowMode === 'discard'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Cắt bỏ vĩnh viễn đoạn thừa"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa bỏ đoạn thừa
                    </button>
                  </div>
                </div>
              </div>

              {/* Thông tin thống kê */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span>
                  Đã tạo <strong className="text-white font-bold">{segments.length}</strong> video ngắn
                </span>
                <span>
                  Tổng thời lượng phân đoạn:{' '}
                  <strong className="text-emerald-400 font-bold">
                    {formatTimeDisplay(segments.reduce((acc, s) => acc + s.duration, 0))}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Danh sách các phân đoạn con (Clip Segments) */}
          {segments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                Danh Sách Phân Đoạn Video Ngắn ({segments.length} Clips):
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map((seg, idx) => {
                  const isPlaying = playingSegmentId === seg.id;
                  const isLast = idx === segments.length - 1;

                  return (
                    <div
                      key={seg.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 relative group transition-all"
                    >
                      {/* Tiêu đề clip + Thứ tự */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center">
                            {seg.order}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {seg.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                            {formatTimeDisplay(seg.startOffset)} - {formatTimeDisplay(seg.endOffset)}
                          </span>
                          <button
                            onClick={() => handleDeleteSegment(seg.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Xóa clip này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Video Player Mini Preview */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800">
                        <video
                          ref={(el) => { previewVideoRefs.current[seg.id] = el; }}
                          src={seg.sourceUrl}
                          className="w-full h-full object-cover"
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            (e.target as HTMLVideoElement).currentTime = seg.startOffset;
                          }}
                        />

                        {/* Nút Play/Pause Overlay */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlaySegment(seg)}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-105 border border-white/20"
                          title={isPlaying ? 'Tạm dừng' : 'Xem thử đoạn này'}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                        </button>

                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[11px] text-white font-mono">
                          ⏱️ Thời lượng: {seg.duration}s
                        </div>
                      </div>

                      {/* Thanh Trượt Kéo Co Ngắn Thời Lượng (Duration Slider) */}
                      <div className="space-y-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-850">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Kéo co ngắn lại:</span>
                          <span className="text-white font-bold">{seg.duration} giây</span>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max={Math.max(1, Math.min(60, Number((videoMeta?.duration || 60).toFixed(1))))}
                          step="0.5"
                          value={seg.duration}
                          onChange={(e) => handleDurationChange(idx, parseFloat(e.target.value))}
                          className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />

                        {/* Quick action options cho đoạn thừa */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-500">Thao tác đoạn thừa:</span>
                          <div className="flex items-center gap-1.5">
                            {!isLast && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (seg.duration > 2) {
                                    handleDurationChange(idx, seg.duration - 2, 'shift_to_next');
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                                title="Co bớt 2s và đẩy 2s đó sang clip tiếp theo"
                              >
                                🔄 Co 2s (Đẩy sang sau)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (seg.duration > 2) {
                                  handleDurationChange(idx, seg.duration - 2, 'discard');
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors"
                              title="Co bớt 2s và xóa hẳn 2s đoạn thừa đó"
                            >
                              ✂️ Co 2s (Xóa bỏ)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Ghi chú / Lời thuyết minh phân cảnh */}
                      <div>
                        <input
                          type="text"
                          value={seg.narration || ''}
                          onChange={(e) => handleUpdateNarration(idx, e.target.value)}
                          placeholder={`Ghi chú kịch bản clip #${seg.order} (vd: Giới thiệu phòng ngủ, ban công săn mây...)`}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {segments.length > 0 && (
              <span>
                💡 Khi bấm <strong>"Đưa Vào Storyboard Phân Cảnh"</strong>, Remotion sẽ tự động cấu hình video gốc với mốc thời gian của từng đoạn clip con.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={handleApplyToStoryboard}
              disabled={segments.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Đưa Vào Storyboard Phân Cảnh ({segments.length} Clips)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
