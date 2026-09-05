import React, { useState } from 'react';
import { VideoProject, VIETNAMESE_VOICES, Scene } from '../types/video';
import { generateAiScript } from '../services/aiScriptService';
import { searchWebMedia, generateAiImageUrl } from '../services/mediaService';
import { synthesizeEdgeTTS } from '../services/edgeTtsService';
import { buildMotionScenesFromScript, splitScriptIntoSentences } from '../services/scriptToMotionEngine';
import {
  Sparkles,
  Wand2,
  Mic,
  Sliders,
  Layers,
  Flame,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ListPlus,
  FileText,
  Play,
  Zap,
  TrendingUp,
  Cpu,
  Rocket
} from 'lucide-react';

interface ScriptGeneratorProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  apiKeyGemini?: string;
  apiKeyPexels?: string;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  statusText: string;
  setStatusText: (val: string) => void;
  onOpenBatchVocab?: () => void;
}

const DEFAULT_SCRIPT = `Bún cá cay Hải Phòng là món ăn đặc sản nức tiếng đậm đà khó quên.
Từng miếng cá rô phi được chiên vàng ươm giòn rụm trong miệng.
Rất nhiều thực khách đã tìm kiếm công thức nấu nước dùng thanh ngọt này trên Google.
Doanh thu của quán đã bùng nổ tăng trưởng hơn 320% sau khi lên xu hướng.
Hãy bắt đầu hành trình trải nghiệm ẩm thực đỉnh cao ngay hôm nay!`;

const SCRIPT_PRESETS = [
  {
    title: '🍜 Review Ẩm Thực',
    desc: 'Món ngon, đặc sản, tìm kiếm & tăng trưởng',
    script: `Bún cá cay Hải Phòng là món ăn đặc sản nức tiếng đậm đà khó quên.
Từng miếng cá rô phi được chiên vàng ươm giòn rụm trong miệng.
Rất nhiều thực khách đã tìm kiếm công thức nấu nước dùng thanh ngọt này trên Google.
Doanh thu của quán đã bùng nổ tăng trưởng hơn 320% sau khi lên xu hướng.
Hãy bắt đầu hành trình trải nghiệm ẩm thực đỉnh cao ngay hôm nay!`
  },
  {
    title: '💰 Tài Chính & Đầu Tư',
    desc: 'Cổ phiếu, tài sản, ngân hàng & tự do tài chính',
    script: `Đây là 3 thói quen quản lý tài chính giúp người giàu ngày càng giàu hơn.
Thay vì tiêu hết thu nhập hàng tháng vào những thứ tiêu sản vô bổ.
Họ luôn ưu tiên trích 30% để đầu tư vào cổ phiếu và tài sản sinh lời.
Thông báo số dư tài khoản ngân hàng sẽ liên tục tăng trưởng theo thời gian.
Lãi suất kép chính là chìa khóa kỳ diệu giúp bạn chạm tới tự do tài chính!`
  },
  {
    title: '💻 Công Nghệ & AI',
    desc: 'Trí tuệ nhân tạo, code tự động & bứt phá',
    script: `Trí tuệ nhân tạo đang làm thay đổi hoàn toàn cuộc chơi của thế giới hiện đại.
Làm sao để ứng dụng AI tự động hóa toàn bộ công việc của bạn?
Bằng cách kết hợp các dòng code tự động và mô hình ngôn ngữ lớn siêu tốc.
Tốc độ xử lý công việc của bạn sẽ nhanh hơn gấp 10 lần bình thường.
Hãy nắm bắt cơ hội để bứt phá dẫn đầu tương lai công nghệ!`
  },
  {
    title: '🔥 Động Lực Phát Triển',
    desc: 'Bứt phá giới hạn, kỷ luật & thành công',
    script: `Đừng bao giờ từ bỏ ước mơ chỉ vì chặng đường phía trước đang đầy gian nan.
Mỗi cú vấp ngã ngày hôm nay chính là bài học giúp bạn tôi luyện ý chí kiên cường.
Kỷ luật thép mỗi ngày chính là cây cầu vững chắc nhất kết nối bạn tới thành công.
Hãy hành động quyết liệt ngay bây giờ vì thời điểm hoàn hảo nhất chính là giây phút này!`
  }
];

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  project,
  setProject,
  apiKeyGemini,
  apiKeyPexels,
  isGenerating,
  setIsGenerating,
  statusText,
  setStatusText,
  onOpenBatchVocab
}) => {
  // Mode selection: 'paste_script' (User script -> 1-Click Video) or 'ai_topic' (AI writes script from topic)
  const [activeTab, setActiveTab] = useState<'paste_script' | 'ai_topic'>('paste_script');

  // Tab 1 State: User's Own Script
  const [userScript, setUserScript] = useState(DEFAULT_SCRIPT);
  const detectedScenesCount = splitScriptIntoSentences(userScript).length;

  // Tab 2 State: AI Topic Generator
  const [topic, setTopic] = useState(project.topic || '5 Sự thật kinh ngạc về Vũ Trụ bao la');
  const [niche, setNiche] = useState<'science' | 'finance' | 'motivation' | 'tech'>('science');
  const [sceneCount, setSceneCount] = useState(4);

  // Common Voice
  const [selectedVoice, setSelectedVoice] = useState(project.voice.name || 'vi-VN-HoaiMyNeural');

  // =========================================================================
  // 1-CLICK WORKFLOW: PASTE SCRIPT -> AUTO MOTION & IMAGE VIDEO (NO MANUAL SELECTION)
  // =========================================================================
  const handleGenerateFromUserScript = async () => {
    if (!userScript.trim()) return;

    setIsGenerating(true);
    setStatusText('Đang phân tích kịch bản & tự động nhận diện Motion Graphic...');

    try {
      const { scenes, totalDuration } = await buildMotionScenesFromScript(userScript, {
        voiceName: selectedVoice,
        voiceRate: project.voice.rate,
        voicePitch: project.voice.pitch,
        aspectRatio: project.aspectRatio,
        onProgress: (text, current, total) => {
          setStatusText(`[${current}/${total}] ${text}`);
        }
      });

      // Lấy câu đầu tiên làm tiêu đề video tóm tắt
      const firstSentence = scenes[0]?.narration || 'Video Motion Graphic';
      const cleanTitle = firstSentence.slice(0, 45) + (firstSentence.length > 45 ? '...' : '');

      setProject((prev) => ({
        ...prev,
        title: cleanTitle,
        topic: cleanTitle,
        voice: {
          ...prev.voice,
          name: selectedVoice
        },
        scenes,
        totalDuration
      }));

      setStatusText(`Hoàn tất! Đã tạo thành công ${scenes.length} phân cảnh Motion Graphic & Ảnh.`);
    } catch (err: any) {
      console.error('Script-to-Motion error:', err);
      setStatusText(`Có lỗi xảy ra: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusText(''), 4000);
    }
  };

  // =========================================================================
  // TOPIC GENERATOR WORKFLOW: AI CREATES SCRIPT FROM TOPIC PROMPT
  // =========================================================================
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setStatusText('Đang tạo kịch bản & phân cảnh từ chủ đề...');

    try {
      const rawScenes = await generateAiScript({
        topic,
        niche,
        sceneCount,
        aspectRatio: project.aspectRatio,
        language: 'vi',
        apiKey: apiKeyGemini,
        provider: apiKeyGemini ? 'gemini' : 'builtin'
      });

      setStatusText(`Đang tìm kiếm media & tổng hợp giọng đọc cho ${rawScenes.length} phân cảnh...`);

      const fullScenes: Scene[] = [];
      let totalAudioDuration = 0;

      for (let i = 0; i < rawScenes.length; i++) {
        const raw = rawScenes[i];
        setStatusText(`Đang xử lý phân cảnh ${i + 1}/${rawScenes.length}: Giọng đọc & Media...`);

        let audioData;
        try {
          audioData = await synthesizeEdgeTTS(
            raw.narration,
            selectedVoice,
            project.voice.rate,
            project.voice.pitch
          );
        } catch (e) {
          console.warn('TTS fallback for scene', i, e);
          audioData = {
            audioUrl: '',
            duration: 4.0,
            words: []
          };
        }

        let mediaUrl = '';
        let mediaType: 'image' | 'video' = raw.mediaType;

        try {
          const mediaList = await searchWebMedia(raw.searchKeyword, project.aspectRatio);

          if (mediaList && mediaList.length > 0) {
            mediaUrl = mediaList[0].url || mediaList[0].thumbnail;
            mediaType = mediaList[0].type || 'image';
          } else {
            mediaUrl = generateAiImageUrl(raw.imagePrompt || raw.searchKeyword, project.aspectRatio);
            mediaType = 'image';
          }
        } catch (err) {
          mediaUrl = generateAiImageUrl(raw.imagePrompt || raw.searchKeyword, project.aspectRatio);
          mediaType = 'image';
        }

        totalAudioDuration += audioData.duration;

        fullScenes.push({
          id: raw.id,
          order: raw.order,
          narration: raw.narration,
          searchKeyword: raw.searchKeyword,
          imagePrompt: raw.imagePrompt,
          mediaType,
          mediaUrl,
          audioUrl: audioData.audioUrl,
          audioDuration: audioData.duration,
          words: audioData.words,
          transition: raw.transition,
          kenBurns: raw.kenBurns
        });
      }

      setProject((prev) => ({
        ...prev,
        title: topic,
        topic,
        voice: {
          ...prev.voice,
          name: selectedVoice
        },
        scenes: fullScenes,
        totalDuration: totalAudioDuration
      }));

      setStatusText('Hoàn tất tạo video!');
    } catch (err: any) {
      console.error('Topic generation error:', err);
      setStatusText(`Có lỗi xảy ra: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  return (
    <div className="bg-gray-900/70 rounded-2xl p-5 border border-gray-800 glass-panel flex flex-col gap-4 shadow-xl">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Tab 1: Dán kịch bản có sẵn (Active by default) */}
          <button
            type="button"
            onClick={() => setActiveTab('paste_script')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'paste_script'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>🎬 Dán Kịch Bản (Auto 100% Motion & Ảnh)</span>
            <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-400 text-black uppercase tracking-wider">
              1-Click
            </span>
          </button>

          {/* Tab 2: Tạo từ chủ đề */}
          <button
            type="button"
            onClick={() => setActiveTab('ai_topic')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ai_topic'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Viết Kịch Bản Từ Chủ Đề</span>
          </button>
        </div>

        {/* Voice Selector Header Compact */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Giọng:</span>
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {VIETNAMESE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: PASTE YOUR SCRIPT (AUTO MOTION & IMAGE 1-CLICK) */}
      {/* ================================================================= */}
      {activeTab === 'paste_script' && (
        <div className="flex flex-col gap-3.5">
          {/* Quick Script Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nhập kịch bản video của bạn:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 hidden sm:inline">Mẫu thử nhanh:</span>
                {SCRIPT_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => setUserScript(preset.script)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-800/80 hover:bg-indigo-600/30 text-gray-300 hover:text-white border border-gray-700/50 transition-all"
                    title={preset.desc}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Script Textarea */}
            <div className="relative">
              <textarea
                value={userScript}
                onChange={(e) => setUserScript(e.target.value)}
                rows={5}
                className="w-full bg-gray-950/90 border border-indigo-500/30 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed resize-y"
                placeholder="Dán toàn bộ kịch bản của bạn vào đây (hỗ trợ văn bản tự do, ngắt câu bằng dấu chấm, xuống dòng, hoặc số thứ tự 1. 2. 3.)..."
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold">
                  {detectedScenesCount} phân cảnh tự động
                </span>
              </div>
            </div>
          </div>

          {/* Feature Highlights & AI Intelligence Badge */}
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-200">
            <Rocket className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="font-bold text-white text-[12px]">
                Tự Động 100% - Không Cần Chọn Gì Nữa:
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Hệ thống tự phân tích từng câu để gán{' '}
                <span className="text-pink-300 font-semibold">Motion Graphics</span> (Biểu đồ tăng trưởng +320%, Google Search, Terminal Code, VS Battle, Ting Ting, Quỹ đạo AI...) kết hợp{' '}
                <span className="text-cyan-300 font-semibold">Ảnh nền mờ Cinematic</span> và{' '}
                <span className="text-amber-300 font-semibold">Giọng đọc Edge-TTS chuẩn tiếng Việt</span> có phụ đề nhảy chữ.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-indigo-300 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="font-medium animate-pulse">{statusText}</span>
                </>
              ) : statusText ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{statusText}</span>
                </>
              ) : (
                <span className="text-gray-400">
                  Sẵn sàng tạo toàn bộ video từ kịch bản trên với 1 cú click.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {onOpenBatchVocab && (
                <button
                  onClick={onOpenBatchVocab}
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-all shadow-md active:scale-95"
                  title="Nạp nhiều câu kịch bản hoặc danh sách từ vựng từ tệp hoặc dán JSON"
                >
                  <ListPlus className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Nạp file / JSON</span>
                </button>
              )}

              {/* GIANT 1-CLICK GENERATE BUTTON */}
              <button
                onClick={handleGenerateFromUserScript}
                disabled={isGenerating || !userScript.trim()}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 glow-primary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Tạo Toàn Bộ Video...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>TẠO VIDEO MOTION GRAPHIC TỰ ĐỘNG (1-CLICK)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: AI TOPIC WRITER (CREATE SCRIPT FROM TOPIC PROMPT) */}
      {/* ================================================================= */}
      {activeTab === 'ai_topic' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Chủ đề / Ý tưởng video bạn muốn AI viết:</span>
              <span className="text-gray-500 text-[11px]">Hỗ trợ tiếng Việt hoặc tiếng Anh</span>
            </label>
            <div className="relative">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                placeholder="Nhập chủ đề video bạn muốn tạo (Ví dụ: 3 Bí quyết sống khỏe mỗi ngày, Sự thật về kim tự tháp Ai Cập...)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Chủ đề / Phong cách:</span>
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value as any)}
                className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="science">🌌 Bí ẩn Vũ trụ & Khoa học</option>
                <option value="finance">💰 Tài chính & Kinh doanh</option>
                <option value="motivation">🔥 Động lực & Phát triển</option>
                <option value="tech">⚡ Công nghệ & AI</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  <span>Số phân cảnh:</span>
                </span>
                <span className="font-bold text-indigo-400">{sceneCount} cảnh (~{sceneCount * 4}s)</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={sceneCount}
                onChange={(e) => setSceneCount(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-gray-800 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-indigo-300 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="font-medium animate-pulse">{statusText}</span>
                </>
              ) : (
                <span className="text-gray-400">AI sẽ tự viết kịch bản và dựng phân cảnh</span>
              )}
            </div>

            <button
              onClick={handleGenerateFromTopic}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Viết Kịch Bản & Tạo Video</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
