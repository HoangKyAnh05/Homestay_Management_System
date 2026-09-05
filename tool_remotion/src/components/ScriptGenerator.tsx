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

const DEFAULT_SCRIPT = `Sa Pa sáng nay mây tràn qua ô cửa sổ, không gian tĩnh lặng chỉ có tiếng chim hót và hương núi rừng thoang thoảng.
Tự thưởng cho bản thân một buổi sáng thong thả: nhấp ngụm cà phê phin đậm đà, cuộn mình trong chăn ấm và ngắm nhìn từng dải mây lững lờ trôi.
Nếu bạn đang tìm một nơi để chữa lành và tạm gác lại những bộn bề nơi phố thị, Lá Đỏ Homestay luôn sẵn sàng mở cửa chào đón bạn.
Hãy đến và cảm nhận sự bình yên trọn vẹn giữa mây trời Tây Bắc!`;

const SCRIPT_PRESETS = [
  {
    title: '🌲 Săn Mây & Nghỉ Dưỡng',
    desc: 'Biển mây bồng bềnh, không gian tĩnh lặng & thư thái',
    script: `Sa Pa sáng nay mây tràn qua ô cửa sổ, không gian tĩnh lặng chỉ có tiếng chim hót và hương núi rừng thoang thoảng.
Tự thưởng cho bản thân một buổi sáng thong thả: nhấp ngụm cà phê phin đậm đà, cuộn mình trong chăn ấm và ngắm nhìn từng dải mây lững lờ trôi.
Nếu bạn đang tìm một nơi để chữa lành và tạm gác lại những bộn bề nơi phố thị, Lá Đỏ Homestay luôn sẵn sàng mở cửa chào đón bạn.
Hãy đến và cảm nhận sự bình yên trọn vẹn giữa mây trời Tây Bắc!`
  },
  {
    title: '☕ Góc Chill Thung Lũng Mường Hoa',
    desc: 'View ngắm trọn thung lũng, trà nóng & bình yên',
    script: `Một sớm mai thức dậy giữa biển mây bồng bềnh tại Lá Đỏ Homestay Sa Pa.
Thưởng thức tách trà ấm nóng, hít hà không khí trong lành và ngắm trọn vẻ đẹp kỳ vĩ của thung lũng Mường Hoa.
Từng nếp nhà gỗ mộc mạc nép mình bên sườn đồi, đem lại cảm giác bình yên đến lạ kỳ.
Đặt phòng ngay hôm nay để nhận ưu đãi trải nghiệm đặc biệt bạn nhé!`
  },
  {
    title: '🍲 Ẩm Thực Tây Bắc',
    desc: 'Lẩu cá tầm, thịt nướng thơm lừng bên bếp lửa',
    script: `Giữa tiết trời se lạnh của Sa Pa, còn gì tuyệt vời hơn khi quây quần bên nồi lẩu cá tầm nghi ngút khói.
Từng lát cá tươi ngon đậm đà hòa quyện cùng các loại rau rừng tươi xanh bản địa.
Bên bếp lửa hồng ấm áp, cùng bạn bè và người thân chia sẻ những câu chuyện thật rôm rả.
Đừng quên ghé gian bếp Lá Đỏ để thưởng thức trọn vị ẩm thực Tây Bắc!`
  },
  {
    title: '🏡 Check-in & Trải Nghiệm Bản Địa',
    desc: 'Kiến trúc mộc mạc, góc sống ảo cực thơ',
    script: `Khám phá vẻ đẹp Sa Pa qua những góc check-in siêu thơ mộng tại Lá Đỏ Homestay.
Từ ban công săn mây ngút ngàn đến lối đi lát đá ngập tràn sắc hoa cỏ.
Mỗi góc nhỏ tại homestay đều được chăm chút tỉ mỉ để mang đến cho bạn những khung hình lung linh nhất.
Lên lịch trình khám phá Sa Pa cùng Lá Đỏ Homestay ngay thôi nào!`
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
    <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col gap-4 shadow-sm">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          {/* Tab 1: Dán kịch bản có sẵn */}
          <button
            type="button"
            onClick={() => setActiveTab('paste_script')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'paste_script'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Kịch Bản Video</span>
          </button>

          {/* Tab 2: Tạo từ chủ đề */}
          <button
            type="button"
            onClick={() => setActiveTab('ai_topic')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ai_topic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Gợi Ý Kịch Bản Từ Chủ Đề</span>
          </button>
        </div>

        {/* Voice Selector Header Compact */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span>Giọng Thuyết Minh:</span>
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
      {/* TAB 1: PASTE YOUR SCRIPT */}
      {/* ================================================================= */}
      {activeTab === 'paste_script' && (
        <div className="flex flex-col gap-3.5">
          {/* Quick Script Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Nội dung kịch bản video:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 hidden sm:inline">Mẫu Homestay:</span>
                {SCRIPT_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => setUserScript(preset.script)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
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
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed resize-y"
                placeholder="Nhập hoặc dán nội dung kịch bản video homestay của bạn vào đây..."
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-xs">
                  {detectedScenesCount} phân cảnh
                </span>
              </div>
            </div>
          </div>

          {/* Feature Highlights Note */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Rocket className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold text-blue-950 text-xs">
                Tự Động Tạo Phân Cảnh & Lồng Tiếng:
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                Hệ thống sẽ tự động tách từng câu thành các phân cảnh độc lập, tạo giọng thuyết minh tiếng Việt chuẩn và đồng bộ phụ đề chạy chữ theo từng khung hình.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-medium animate-pulse">{statusText}</span>
                </>
              ) : statusText ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">{statusText}</span>
                </>
              ) : (
                <span className="text-slate-500">
                  Sẵn sàng tạo toàn bộ video phân cảnh và lồng tiếng.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {onOpenBatchVocab && (
                <button
                  onClick={onOpenBatchVocab}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition-all cursor-pointer"
                  title="Nạp nhiều câu kịch bản từ tệp hoặc JSON"
                >
                  <ListPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Nạp file / JSON</span>
                </button>
              )}

              {/* GENERATE BUTTON */}
              <button
                onClick={handleGenerateFromUserScript}
                disabled={isGenerating || !userScript.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Tạo Phân Cảnh & Lồng Tiếng...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tạo Phân Cảnh & Lồng Tiếng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: AI TOPIC WRITER */}
      {/* ================================================================= */}
      {activeTab === 'ai_topic' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Chủ đề / Ý tưởng video homestay:</span>
              <span className="text-slate-500 text-[11px]">Hỗ trợ tiếng Việt hoặc tiếng Anh</span>
            </label>
            <div className="relative">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                placeholder="Nhập chủ đề video bạn muốn tạo (Ví dụ: Săn mây Sa Pa, Thưởng thức lẩu cá tầm Tây Bắc...)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
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
