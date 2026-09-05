import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Upload,
  Video,
  Image as ImageIcon,
  Play,
  CheckCircle2,
  Circle,
  FileJson,
  Download,
  Trash2,
  Maximize2,
  Film,
  FolderOpen
} from 'lucide-react';
import { RoadmapDayItem, Roadmap100Data } from '../types/roadmap100';
import { roadmap100Service } from '../services/roadmap100Service';
import { PasteRoadmapJsonModal } from './PasteRoadmapJsonModal';
import { DayScriptPromptModal } from './DayScriptPromptModal';
import { SavedRoadmapsModal } from './SavedRoadmapsModal';
import { VideoProject, Scene } from '../types/video';

interface Roadmap100CanvasProps {
  project?: VideoProject;
  setProject?: React.Dispatch<React.SetStateAction<VideoProject>>;
  onSwitchToStudio?: () => void;
}

export const Roadmap100Canvas: React.FC<Roadmap100CanvasProps> = ({
  project,
  setProject,
  onSwitchToStudio
}) => {
  // Main Data State
  const [roadmapData, setRoadmapData] = useState<Roadmap100Data>(() => roadmap100Service.loadRoadmap());
  const [topicInput, setTopicInput] = useState<string>(() => roadmapData.topic || '100 Ngày Xây Kênh Marketing Homestay Lá Đỏ Sa Pa');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<'all' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'todo' | 'completed'>('all');
  
  // Modals & Popups
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<{ url: string; type: 'image' | 'video'; title: string } | null>(null);
  const [activeScriptDay, setActiveScriptDay] = useState<RoadmapDayItem | null>(null);
  const [copiedStudioDay, setCopiedStudioDay] = useState<number | null>(null);
  const [justSavedTopic, setJustSavedTopic] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedProjectsCount, setSavedProjectsCount] = useState<number>(() => roadmap100Service.getAllProjects().length);

  // Hidden File Inputs for Center Media & BTS
  const centerFileInputRef = useRef<HTMLInputElement | null>(null);
  const btsFileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadDay, setTargetUploadDay] = useState<number | null>(null);

  // Helper to update a specific day item
  const updateDay = (dayNum: number, updater: (prev: RoadmapDayItem) => RoadmapDayItem) => {
    const newDays = roadmapData.days.map((item) => (item.day === dayNum ? updater(item) : item));
    const updatedData = {
      ...roadmapData,
      days: newDays,
      updatedAt: new Date().toISOString()
    };
    setRoadmapData(updatedData);
    roadmap100Service.saveRoadmap(updatedData);
  };

  // Toggle Day Completed Status
  const handleToggleStatus = (dayNum: number) => {
    updateDay(dayNum, (prev) => ({
      ...prev,
      status: prev.status === 'completed' ? 'todo' : 'completed'
    }));
  };

  // Handle Center Media Upload (Image or Video)
  const handleTriggerUpload = (dayNum: number) => {
    setTargetUploadDay(dayNum);
    centerFileInputRef.current?.click();
  };

  const handleCenterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetUploadDay === null) return;

    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      updateDay(targetUploadDay, (prev) => ({
        ...prev,
        centerMedia: {
          type: isVideo ? 'video' : 'image',
          url: resultUrl,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle BTS Image Upload
  const handleTriggerBtsUpload = (dayNum: number) => {
    setTargetUploadDay(dayNum);
    btsFileInputRef.current?.click();
  };

  const handleBtsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetUploadDay === null) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      updateDay(targetUploadDay, (prev) => ({
        ...prev,
        bts: {
          ...prev.bts,
          imageUrl: resultUrl
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Copy AI Prompt
  const handleCopyPrompt = () => {
    const prompt = roadmap100Service.generatePrompt100Days(topicInput);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Apply JSON from Modal
  const handleApplyJsonDays = (newDays: RoadmapDayItem[]) => {
    const updated: Roadmap100Data = {
      ...roadmapData,
      topic: topicInput,
      days: newDays,
      updatedAt: new Date().toISOString()
    };
    setRoadmapData(updated);
    roadmap100Service.saveRoadmap(updated);
  };

  // Reset to auto-generated sample
  const handleRegenerateSample = () => {
    if (window.confirm('Bạn có muốn tạo mới toàn bộ 100 ngày mẫu theo chủ đề hiện tại không?')) {
      const sample = roadmap100Service.generateSample100Days(topicInput);
      setRoadmapData(sample);
      roadmap100Service.saveRoadmap(sample);
    }
  };

  // Export JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(roadmapData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lo-trinh-100-ngay-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Studio button click: copy 3 scripts prompt and open preview modal
  const handleStudioClick = (item: RoadmapDayItem) => {
    const prompt = roadmap100Service.generateDayScriptPrompt(item, topicInput);
    navigator.clipboard.writeText(prompt);
    setCopiedStudioDay(item.day);
    setActiveScriptDay(item);
    setTimeout(() => setCopiedStudioDay(null), 2500);
  };

  // Convert Day to Remotion Video Scene
  const handleSendToRemotionStudio = (item: RoadmapDayItem) => {
    if (!setProject) return;

    const newScene: Scene = {
      id: `scene-day-${item.day}-${Date.now()}`,
      order: (project?.scenes.length || 0) + 1,
      narration: `${item.title}. ${item.taskAction}`,
      searchKeyword: item.title,
      mediaType: item.centerMedia.type === 'video' ? 'video' : 'image',
      mediaUrl: item.centerMedia.url || '',
      visualType: 'media',
      kenBurns: 'zoom_in',
      transition: 'fade',
      audioDuration: 4.5,
      words: []
    };

    setProject((prev) => ({
      ...prev,
      title: `Ngày ${item.day}: ${item.title}`,
      scenes: [...prev.scenes, newScene]
    }));

    if (onSwitchToStudio) {
      onSwitchToStudio();
    }
  };

  // Filter items based on active stage and search term
  const filteredDays = useMemo(() => {
    return roadmapData.days.filter((item) => {
      // Stage filter
      if (selectedStage === 'stage1' && (item.day < 1 || item.day > 25)) return false;
      if (selectedStage === 'stage2' && (item.day < 26 || item.day > 50)) return false;
      if (selectedStage === 'stage3' && (item.day < 51 || item.day > 75)) return false;
      if (selectedStage === 'stage4' && (item.day < 76 || item.day > 100)) return false;
      if (selectedStage === 'todo' && item.status === 'completed') return false;
      if (selectedStage === 'completed' && item.status !== 'completed') return false;

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.taskAction.toLowerCase().includes(q) ||
          item.benefit.toLowerCase().includes(q) ||
          item.day.toString().includes(q)
        );
      }
      return true;
    });
  }, [roadmapData.days, selectedStage, searchTerm]);

  // Group items into rows of 3 for zigzag winding track
  const rows = useMemo(() => {
    const chunked: RoadmapDayItem[][] = [];
    for (let i = 0; i < filteredDays.length; i += 3) {
      chunked.push(filteredDays.slice(i, i + 3));
    }
    return chunked;
  }, [filteredDays]);

  // Overall Statistics
  const completedCount = roadmapData.days.filter((d) => d.status === 'completed').length;
  const totalDays = roadmapData.days.length;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f0f2f5] text-slate-800 p-4 sm:p-6 select-none relative font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={centerFileInputRef}
        onChange={handleCenterFileChange}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={btsFileInputRef}
        onChange={handleBtsFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR: Input Topic & Actions */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 pb-5 border-b border-slate-200 relative z-10 max-w-[1600px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shadow-xs">
              🛣️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Lộ Trình Sáng Tạo Nội Dung 100 Ngày</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {roadmapData.days.length} NGÀY • {rows.length} TẦNG RAY
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Kế hoạch từng ngày: Nhiệm vụ quay/chụp • Đẩy ảnh/video • Hậu trường & Lợi ích truyền thông
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Prompt AI */}
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Copy Prompt tạo 100 ngày"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedPrompt ? 'Đã copy Prompt!' : 'Copy Prompt'}</span>
            </button>

            {/* Paste JSON */}
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Dán kết quả JSON vào ứng dụng"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>Dán JSON</span>
            </button>

            {/* Regenerate Sample */}
            <button
              onClick={handleRegenerateSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Tạo lại 100 ngày mẫu"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tạo Mẫu</span>
            </button>

            {/* Kho Dự Án Đã Lưu */}
            <button
              onClick={() => {
                setSavedProjectsCount(roadmap100Service.getAllProjects().length);
                setIsSavedModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Xem lại và quản lý các dự án đã lưu"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Kho Dự Án ({savedProjectsCount})</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Tải file JSON lộ trình về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất File</span>
            </button>
          </div>
        </div>

        {/* Topic Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700 px-2 shrink-0 flex items-center gap-1.5">
            <span>🎯 Chủ đề lộ trình:</span>
          </span>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Nhập chủ đề công việc, video, ảnh cần làm trong 100 ngày..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const updated = { ...roadmapData, topic: topicInput, updatedAt: new Date().toISOString() };
                setRoadmapData(updated);
                roadmap100Service.saveRoadmap(updated);
                setSavedProjectsCount(roadmap100Service.getAllProjects().length);
                setJustSavedTopic(true);
                setTimeout(() => setJustSavedTopic(false), 2000);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                justSavedTopic
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
              }`}
            >
              {justSavedTopic ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{justSavedTopic ? 'Đã Lưu!' : 'Lưu Chủ Đề'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          {/* Progress percentage */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Tiến độ:</span>
              <span className="text-blue-600 font-mono font-semibold">{completedCount}/{totalDays} Ngày ({progressPercent}%)</span>
            </div>
            <div className="w-36 sm:w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stage Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Tất cả 100 Ngày' },
              { id: 'stage1', label: 'GĐ 1 (1-25)' },
              { id: 'stage2', label: 'GĐ 2 (26-50)' },
              { id: 'stage3', label: 'GĐ 3 (51-75)' },
              { id: 'stage4', label: 'GĐ 4 (76-100)' },
              { id: 'todo', label: 'Chưa làm' },
              { id: 'completed', label: 'Đã xong' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStage(tab.id as any)}
                className={`px-3 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                  selectedStage === tab.id
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SERPENTINE ROADMAP TRACK */}
      {/* ========================================================================= */}
      <div className="py-6 flex flex-col gap-10 relative z-10 max-w-[1600px] mx-auto">
        {/* Start Station */}
        <div className="w-full flex items-center justify-center">
          <div className="px-5 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center gap-2 shadow-xs">
            <span>🏁</span>
            <span>KHỞI ĐẦU HÀNH TRÌNH 100 NGÀY • START LINE</span>
            <span className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded font-mono font-semibold">
              Day 01 Baseline
            </span>
          </div>
        </div>

        {/* Winding Rows */}
        {rows.map((rowItems, rowIndex) => {
          const isEven = rowIndex % 2 === 0;
          const isLastRow = rowIndex === rows.length - 1;
          const displayItems = isEven ? rowItems : [...rowItems].reverse();

          return (
            <div key={rowIndex} className="relative py-4">
              {/* Central Track Spine Beam */}
              <div
                className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 rounded-full z-0 bg-blue-200"
              />

              {/* Connecting Track Curve */}
              {!isLastRow &&
                (isEven ? (
                  <div className="absolute -right-2 top-1/2 w-12 h-36 border-r-2 border-t-2 border-b-2 border-blue-300 rounded-r-full pointer-events-none z-0" />
                ) : (
                  <div className="absolute -left-2 top-1/2 w-12 h-36 border-l-2 border-t-2 border-b-2 border-blue-300 rounded-l-full pointer-events-none z-0" />
                ))}

              {/* Items in this row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 px-2 sm:px-4">
                {displayItems.map((item) => {
                  const isCompleted = item.status === 'completed';

                  return (
                    <div
                      key={item.day}
                      className="flex flex-col items-center group relative transition-transform duration-200"
                    >
                      {/* 1. TOP CARD: Nhiệm vụ quay/chụp */}
                      <div className="w-full mb-3 flex flex-col items-center">
                        <div className={`w-full bg-white border ${
                          isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200 group-hover:border-blue-400'
                        } rounded-xl p-3.5 shadow-sm transition`}>
                          {/* Header */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              <span>NGÀY {item.day.toString().padStart(2, '0')}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.category || 'Video ngắn'}
                              </span>

                              {/* Studio Button */}
                              <button
                                onClick={() => handleSendToRemotionStudio(item)}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 cursor-pointer"
                                title="Đưa nội dung này vào Studio Video để dựng thành clip"
                              >
                                <Film className="w-3 h-3" />
                                <span>Studio</span>
                              </button>
                            </div>
                          </div>

                          {/* Title & Task Action */}
                          <div className="text-xs font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed">
                            <span className="font-bold text-blue-600">🎯 Cần quay/chụp: </span>
                            {item.taskAction}
                          </div>
                        </div>

                        {/* Link Bone */}
                        <div className="w-0.5 h-3 bg-blue-300" />
                      </div>

                      {/* 2. CENTRAL NODE: Đẩy file ảnh hoặc video */}
                      <div className="relative z-10 w-full flex flex-col items-center my-1">
                        {/* Status Checkbox Button */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs mb-2">
                          <button
                            onClick={() => handleToggleStatus(item.day)}
                            className="flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400" />
                            )}
                            <span className={isCompleted ? 'text-emerald-700' : 'text-slate-600'}>
                              {isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                            </span>
                          </button>
                        </div>

                        {/* Media Upload Box */}
                        <div className="w-full max-w-[280px] bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col items-center">
                          {item.centerMedia && item.centerMedia.url ? (
                            <div className="w-full relative rounded-lg overflow-hidden group/media aspect-video bg-slate-900 flex items-center justify-center">
                              {item.centerMedia.type === 'video' ? (
                                <video
                                  src={item.centerMedia.url}
                                  className="w-full h-full object-cover"
                                  controls={false}
                                />
                              ) : (
                                <img
                                  src={item.centerMedia.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              )}

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/media:opacity-100 flex items-center justify-center gap-2 transition">
                                <button
                                  onClick={() =>
                                    setActiveMediaModal({
                                      url: item.centerMedia.url,
                                      type: item.centerMedia.type === 'video' ? 'video' : 'image',
                                      title: `Ngày ${item.day}: ${item.title}`
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold transition"
                                  title="Xem toàn màn hình"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleTriggerUpload(item.day)}
                                  className="p-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold transition"
                                  title="Thay đổi file"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateDay(item.day, (prev) => ({
                                      ...prev,
                                      centerMedia: { type: 'none', url: '', name: '' }
                                    }))
                                  }
                                  className="p-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold transition"
                                  title="Xóa file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white flex items-center gap-1">
                                {item.centerMedia.type === 'video' ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                                <span>{item.centerMedia.type === 'video' ? 'VIDEO' : 'ẢNH'}</span>
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleTriggerUpload(item.day)}
                              className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            >
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span className="text-[11px] font-semibold">+ Đẩy file ảnh hoặc video</span>
                              <span className="text-[9px] text-slate-400">(MP4, PNG, JPG)</span>
                            </button>
                          )}
                        </div>

                        {/* Bottom Link Bone */}
                        <div className="w-0.5 h-3 bg-blue-300" />
                      </div>

                      {/* 3. WINGS: Lợi ích & Hậu trường */}
                      <div className="w-full grid grid-cols-2 gap-2 mt-1">
                        {/* LỢI ÍCH */}
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mb-1">
                              <span>💎</span>
                              <span>LỢI ÍCH:</span>
                            </div>
                            <div className="text-[10px] text-slate-600 leading-snug line-clamp-3">
                              {item.benefit}
                            </div>
                          </div>
                        </div>

                        {/* HẬU TRƯỜNG */}
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="text-[10px] font-bold text-blue-700 flex items-center justify-between gap-1 mb-1">
                              <span className="flex items-center gap-1">
                                <span>🎬</span>
                                <span>HẬU TRƯỜNG:</span>
                              </span>
                              <button
                                onClick={() => handleTriggerBtsUpload(item.day)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition cursor-pointer"
                                title="Đẩy ảnh hậu trường"
                              >
                                + Ảnh BTS
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-600 leading-snug line-clamp-3 mb-1">
                              {item.bts.description}
                            </div>
                          </div>

                          {item.bts.imageUrl && (
                            <div className="mt-1 relative rounded overflow-hidden h-10 bg-slate-100 border border-slate-200">
                              <img
                                src={item.bts.imageUrl}
                                alt="Hậu trường"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <PasteRoadmapJsonModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onApplyDays={handleApplyJsonDays}
        currentTopic={topicInput}
      />

      <DayScriptPromptModal
        isOpen={Boolean(activeScriptDay)}
        onClose={() => setActiveScriptDay(null)}
        dayItem={activeScriptDay}
        generalTopic={topicInput}
        onSendToStudio={handleSendToRemotionStudio}
      />

      <SavedRoadmapsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currentProjectId={roadmapData.id || ''}
        onSelectProject={(loadedData: Roadmap100Data) => {
          setRoadmapData(loadedData);
          setTopicInput(loadedData.topic);
          setSavedProjectsCount(roadmap100Service.getAllProjects().length);
        }}
      />

      {/* Fullscreen Media Modal */}
      {activeMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 border border-slate-200 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">{activeMediaModal.title}</h4>
              <button
                onClick={() => setActiveMediaModal(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {activeMediaModal.type === 'video' ? (
                <video src={activeMediaModal.url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img src={activeMediaModal.url} alt="Media" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
