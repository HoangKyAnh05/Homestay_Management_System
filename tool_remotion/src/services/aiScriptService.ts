import axios from 'axios';
import { Scene, AspectRatio, TransitionType, KenBurnsEffect } from '../types/video';

export interface ScriptGenerationParams {
  topic: string;
  niche: 'science' | 'finance' | 'motivation' | 'history' | 'tech' | 'custom';
  sceneCount: number;
  aspectRatio: AspectRatio;
  language: 'vi' | 'en';
  apiKey?: string; // OpenAI or Gemini API Key
  provider?: 'gemini' | 'openai' | 'builtin';
}

const TEMPLATE_SCRIPTS: Record<string, Array<{ narration: string; keyword: string; prompt: string }>> = {
  science: [
    {
      narration: "Vũ trụ bao la rộng lớn chứa đựng vô vàn bí ẩn kỳ vĩ mà khoa học hiện đại vẫn đang từng bước khám phá.",
      keyword: "deep space galaxy nebula stars universe cinematic",
      prompt: "cinematic mesmerizing view of deep space with glowing colorful nebula and stars 8k"
    },
    {
      narration: "Các nhà thiên văn học đã phát hiện ra những hành tinh đặc biệt, nơi bề mặt được bao phủ bởi kim cương nguyên chất lấp lánh.",
      keyword: "sparkling crystal diamond planet in galaxy space",
      prompt: "stunning diamond crystal planet sparkling in space galaxy backdrop hyperrealistic"
    },
    {
      narration: "Tại chân trời sự kiện của hố đen, lực hấp dẫn mạnh đến mức bẻ cong không gian và làm thời gian trôi chậm lại đáng kể.",
      keyword: "massive black hole gravitational lens event horizon glowing",
      prompt: "majestic glowing black hole with accretion disk bending space and light ultra detailed"
    },
    {
      narration: "Mỗi giây trôi qua, vũ trụ của chúng ta lại tiếp tục giãn nở không ngừng vào khoảng không vô tận với tốc độ ánh sáng!",
      keyword: "universe expansion quantum light burst glowing particles",
      prompt: "epic explosion of light and quantum particles expanding in cosmos"
    }
  ],
  finance: [
    {
      narration: "Đây là 3 thói quen quản lý tài chính kinh điển giúp những người thành công tạo dựng sự giàu có bền vững theo thời gian.",
      keyword: "wealth luxury city modern skyscraper financial district",
      prompt: "successful businessman looking over modern financial district at sunset cinematic"
    },
    {
      narration: "Quy tắc cốt lõi đầu tiên: Luôn ưu tiên trích một phần thu nhập để đầu tư vào tài sản sinh lời trước khi chi tiêu cho nhu cầu cá nhân.",
      keyword: "stock market trading chart growth investment",
      prompt: "glowing holographic stock market graph with rising green arrow high tech"
    },
    {
      narration: "Tận dụng tối đa sức mạnh của lãi suất kép – đòn bẩy tài chính kỳ diệu giúp dòng tiền tự động nhân bản theo năm tháng.",
      keyword: "gold coins stacking compound interest growth vault",
      prompt: "tower of glowing gold coins growing dynamically in a futuristic vault"
    },
    {
      narration: "Hãy bắt đầu kiểm soát tài chính cá nhân ngay từ hôm nay để sớm chạm tới mục tiêu tự do tài chính mà bạn hằng mong ước!",
      keyword: "freedom lifestyle luxury travel sunset success",
      prompt: "young entrepreneur on luxury yacht enjoying financial freedom sunset 8k"
    }
  ],
  motivation: [
    {
      narration: "Đừng bao giờ từ bỏ mục tiêu của cuộc đời chỉ vì chặng đường phía trước đang đầy rẫy những thử thách và chông gai.",
      keyword: "mountain peak climber sunrise triumph dramatic",
      prompt: "dramatic silhouette of a person standing on high mountain peak looking at sunrise"
    },
    {
      narration: "Mỗi cú vấp ngã ngày hôm nay chính là bài học kinh nghiệm quý giá giúp bạn tôi luyện ý chí kiên cường và bản lĩnh vững vàng.",
      keyword: "athlete training determination discipline running",
      prompt: "intense determined athlete running in rain slow motion dramatic lighting"
    },
    {
      narration: "Kỷ luật thép trong từng hành động nhỏ mỗi ngày chính là cây cầu vững chắc nhất kết nối giữa ước mơ và thành tựu rực rỡ.",
      keyword: "clock time focus productivity golden light",
      prompt: "golden pocket watch and focused workspace with glowing inspiration"
    },
    {
      narration: "Hãy dũng cảm bước về phía trước và hành động quyết liệt ngay bây giờ, vì thời điểm hoàn hảo nhất chính là giây phút này!",
      keyword: "victory celebration success golden rays confetti",
      prompt: "epic victory moment with golden light rays and confetti celebration"
    }
  ]
};

const TRANSITIONS: TransitionType[] = ['fade', 'zoom_in', 'slide_left', 'zoom_out'];
const KEN_BURNS_EFFECTS: KenBurnsEffect[] = ['zoom_in', 'pan_left', 'zoom_out', 'pan_right', 'subtle_float'];

export async function generateAiScript(params: ScriptGenerationParams): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const { topic, niche, sceneCount, provider = 'builtin', apiKey } = params;

  if (provider === 'gemini' && apiKey) {
    try {
      return await generateWithGemini(topic, sceneCount, apiKey);
    } catch (e) {
      console.warn('Gemini generation failed, falling back to smart template:', e);
    }
  }

  // Smart Built-in Template Generator based on Topic & Niche (Pacing: 4s-7s per scene)
  const selectedTemplate = TEMPLATE_SCRIPTS[niche] || TEMPLATE_SCRIPTS.science;
  const scenes: Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const templateItem = selectedTemplate[i % selectedTemplate.length];
    const narration = topic
      ? `${templateItem.narration}`
      : templateItem.narration;

    scenes.push({
      id: `scene-${Date.now()}-${i + 1}`,
      order: i + 1,
      narration: narration,
      searchKeyword: templateItem.keyword,
      imagePrompt: templateItem.prompt,
      mediaType: i % 2 === 0 ? 'video' : 'image',
      mediaUrl: '',
      transition: TRANSITIONS[i % TRANSITIONS.length],
      kenBurns: KEN_BURNS_EFFECTS[i % KEN_BURNS_EFFECTS.length]
    });
  }

  return scenes;
}

async function generateWithGemini(topic: string, count: number, apiKey: string): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const prompt = `Bạn là đạo diễn và biên kịch video ngắn chuyên nghiệp cho nội dung kiến thức, tài chính, khoa học và tin tức.
Hãy tạo một kịch bản gồm chính xác ${count} phân cảnh (scenes) cho chủ đề: "${topic}".
Quy tắc:
- Mỗi phân cảnh có câu lồng tiếng tiếng Việt hoàn chỉnh, độ dài từ 25 - 40 từ (đọc trong khoảng 4 đến 6 giây).
- Ưu tiên từ khóa tìm kiếm B-roll video tiếng Anh chất lượng cao.
- Trả về đúng định dạng JSON thuần túy (không kèm markdown \`\`\`json):
[
  {
    "order": 1,
    "narration": "Câu lồng tiếng hấp dẫn tiếng Việt truyền tải trọn vẹn 1 ý",
    "searchKeyword": "English keyword for b-roll stock video footage",
    "imagePrompt": "Detailed English prompt for AI photorealistic image generation",
    "mediaType": "video",
    "transition": "fade",
    "kenBurns": "zoom_in"
  }
]`;

  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];

  const apiVersions = ['v1beta', 'v1'];
  let parsed: any = null;

  for (const model of candidateModels) {
    for (const apiVer of apiVersions) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7
            }
          },
          { timeout: 25000 }
        );

        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          text = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
          parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            break;
          }
        }
      } catch {
        // Thử tiếp
      }
    }
    if (parsed) break;
  }

  if (!parsed || !Array.isArray(parsed)) throw new Error('No valid content returned from Gemini');

  return parsed.map((s: any, idx: number) => ({
    id: `scene-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    narration: s.narration || '',
    searchKeyword: s.searchKeyword || topic,
    imagePrompt: s.imagePrompt || topic,
    mediaType: s.mediaType === 'video' ? 'video' : 'image',
    mediaUrl: '',
    transition: s.transition || TRANSITIONS[idx % TRANSITIONS.length],
    kenBurns: s.kenBurns || KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
  }));
}
