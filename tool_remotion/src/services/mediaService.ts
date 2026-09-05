import axios from 'axios';
import { AspectRatio } from '../types/video';

export interface MediaAsset {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumbnail: string;
  previewUrl?: string; // Video preview 360p siêu nhẹ cho hover
  source: 'pexels' | 'pixabay' | 'ai' | 'local' | 'web';
  duration?: number; // for video in seconds
  author?: string;
  title?: string;
}

// Kho video ngắn B-Roll chất lượng cao bản quyền miễn phí theo chủ đề
export const BROLL_VIDEO_COLLECTION: Record<string, { url: string; thumb: string; title: string }[]> = {
  food: [
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-vegetables-being-poured-into-a-pot-of-boiling-water-43398-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85',
      title: 'Nước dùng sôi sùng sục'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-vegetables-in-a-pan-43400-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=85',
      title: 'Đầu bếp chế biến món ăn trên chảo'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-serving-food-in-a-bowl-43403-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=85',
      title: 'Bày tô bún phở thơm lừng'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-cutting-fresh-salmon-with-a-knife-43406-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=85',
      title: 'Chế biến cá tươi ngon giòn'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-friends-eating-and-chatting-at-a-restaurant-table-43410-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85',
      title: 'Thực khách thưởng thức ẩm thực'
    }
  ],
  finance: [
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-counting-a-stack-of-dollar-bills-41566-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=85',
      title: 'Đếm tiền bùng nổ lợi nhuận'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-stock-market-ticker-board-and-graphs-42994-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=85',
      title: 'Biểu đồ chứng khoán tăng vọt'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-a-metropolis-financial-district-42998-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=85',
      title: 'Tòa nhà tài chính hiện đại'
    }
  ],
  tech: [
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-42999-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=85',
      title: 'Gõ phím lập trình công nghệ'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-digital-lines-and-network-mesh-41548-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=85',
      title: 'Mạng lưới trí tuệ nhân tạo'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-server-room-with-blinking-led-lights-43000-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=85',
      title: 'Hệ thống máy chủ đám mây'
    }
  ],
  travel: [
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-cars-driving-on-a-highway-42995-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=85',
      title: 'Đường phố cao tốc nhộn nhịp'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-sunrise-over-a-mountain-valley-42996-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85',
      title: 'Bình minh trên núi ngoạn mục'
    },
    {
      url: 'https://assets.mixkit.co/videos/preview/mixkit-airplane-flying-over-clouds-during-sunset-42997-large.mp4',
      thumb: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=85',
      title: 'Chuyến bay cất cánh giữa mây trời'
    }
  ]
};

// Nhận diện chủ đề kịch bản
export function detectCategory(text: string): 'food' | 'finance' | 'tech' | 'travel' | 'general' {
  const t = text.toLowerCase();
  if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|hải phòng|đặc sản|cay|thực khách|bát|tô/i.test(t)) {
    return 'food';
  }
  if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|tỷ|triệu|ngân hàng|mb bank|vietcombank|giàu|đầu tư/i.test(t)) {
    return 'finance';
  }
  if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|thuật toán|robot|công nghệ|máy tính|developer|script/i.test(t)) {
    return 'tech';
  }
  if (/du lịch|máy bay|chuyến bay|thành phố|biển|núi|khám phá|cất cánh|đường phố|xe/i.test(t)) {
    return 'travel';
  }
  return 'general';
}

// Lấy video B-roll phù hợp chủ đề kịch bản
export function getTopicBrollVideo(category: string, index: number = 0): MediaAsset | null {
  const catVideos = BROLL_VIDEO_COLLECTION[category] || BROLL_VIDEO_COLLECTION.travel;
  if (!catVideos || catVideos.length === 0) return null;
  const picked = catVideos[index % catVideos.length];
  return {
    id: `broll-video-${category}-${index}-${Date.now()}`,
    type: 'video',
    url: picked.url,
    thumbnail: picked.thumb,
    source: 'web',
    title: picked.title,
    duration: 8
  };
}

// Fallback high-quality curated assets theo các chủ đề phổ biến
const CURATED_FOOD_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=85'
];

// Cache kết quả tìm kiếm video trong phiên làm việc để phản hồi tức thì 0ms
const videoSearchCache = new Map<string, MediaAsset[]>();

// Lấy video B-roll ngắn thực tế (100% video/mp4 200 OK từ Coverr API)
export async function searchStockVideos(keyword: string, page: number = 1): Promise<MediaAsset[]> {
  const cleanQuery = (keyword || '').trim();
  if (!cleanQuery) return [];

  const currentPage = Math.max(1, Number(page) || 1);
  const cacheKey = `${cleanQuery.toLowerCase()}_p${currentPage}`;
  if (videoSearchCache.has(cacheKey)) {
    return videoSearchCache.get(cacheKey)!;
  }

  // 1. Dùng Electron IPC video search nếu có
  if ((window as any).electronAPI?.searchWebVideos) {
    try {
      const results = await (window as any).electronAPI.searchWebVideos(cleanQuery, currentPage);
      if (results && results.length > 0) {
        videoSearchCache.set(cacheKey, results as MediaAsset[]);
        return results as MediaAsset[];
      }
    } catch (err) {
      console.warn('Electron video search error:', err);
    }
  }

  // 2. Fetch trực tiếp Coverr API từ renderer
  try {
    const removeAccents = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

    const qLower = cleanQuery.toLowerCase();
    let candidateKeywords: string[] = [];

    if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(qLower)) {
      candidateKeywords = ['school', 'student', 'classroom', 'campus', 'studying'];
    } else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(qLower)) {
      candidateKeywords = ['shower', 'bath', 'swimming pool', 'relaxing water'];
    } else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(qLower)) {
      candidateKeywords = ['galaxy', 'space', 'nebula', 'stars'];
    } else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(qLower)) {
      candidateKeywords = /cá/i.test(qLower) ? ['fish cooking', 'cooking', 'food'] : ['cooking', 'delicious food', 'kitchen'];
    } else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(qLower)) {
      candidateKeywords = ['waking up', 'morning', 'bed', 'sunrise'];
    } else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(qLower)) {
      candidateKeywords = ['shopping', 'fashion', 'store', 'clothes'];
    } else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(qLower)) {
      candidateKeywords = ['money', 'finance', 'business', 'growth'];
    } else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(qLower)) {
      candidateKeywords = ['technology', 'coding', 'artificial intelligence', 'programming'];
    } else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(qLower)) {
      candidateKeywords = ['airplane', 'flight', 'clouds', 'travel'];
    } else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(qLower)) {
      candidateKeywords = ['highway', 'driving', 'night drive', 'cars'];
    } else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(qLower)) {
      candidateKeywords = ['travel', 'nature', 'ocean', 'landscape'];
    } else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(qLower)) {
      candidateKeywords = ['city', 'urban', 'skyline', 'traffic'];
    } else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(qLower)) {
      candidateKeywords = ['fitness', 'workout', 'running', 'gym'];
    } else if (/^[a-zA-Z0-9\s\-',.]+$/.test(cleanQuery)) {
      const words = cleanQuery.split(/\s+/).filter(Boolean);
      candidateKeywords = [cleanQuery, words[0] || 'lifestyle', words[words.length - 1] || 'cinematic'];
    } else {
      const noAccent = removeAccents(cleanQuery).replace(/[^\w\s]/gi, ' ').trim();
      candidateKeywords = [noAccent, 'lifestyle', 'cinematic'];
    }

    // Chọn từ khóa tương ứng với page nếu query gốc ít kết quả
    const targetKwIndex = (currentPage - 1) % candidateKeywords.length;
    const orderedKws = [
      candidateKeywords[targetKwIndex],
      ...candidateKeywords.filter((_, idx) => idx !== targetKwIndex)
    ];

    for (const kw of orderedKws) {
      if (!kw) continue;
      try {
        const coverrPage = Math.floor((currentPage - 1) / candidateKeywords.length) + 1;
        const res = await fetch(`https://coverr.co/api/videos?query=${encodeURIComponent(kw)}&page=${coverrPage}&urls=true`);
        if (res.ok) {
          const json = await res.json();
          const hits = json.hits || [];
          if (hits.length > 0) {
            const mappedResults = hits.slice(0, 12).map((h: any, idx: number) => ({
              id: `coverr-video-${idx}-${Date.now()}`,
              type: 'video' as const,
              url: h.urls?.mp4 || h.urls?.mp4_preview,
              previewUrl: h.urls?.mp4_preview || h.urls?.mp4,
              thumbnail: h.thumbnail || h.poster,
              title: h.title || cleanQuery,
              source: 'web' as const,
              duration: Math.round(Number(h.duration || 8))
            }));

            videoSearchCache.set(cacheKey, mappedResults);
            return mappedResults;
          }
        }
      } catch (err) {
        console.warn(`Coverr fetch attempt failed for ${kw}:`, err);
      }
    }
  } catch (err) {
    console.warn('Direct coverr search error:', err);
  }

  return [];
}

export async function searchWebMedia(
  keyword: string,
  aspectRatio: AspectRatio = '9:16',
  allowVideo: boolean = false,
  sceneIndex: number = 0
): Promise<MediaAsset[]> {
  const cleanQuery = (keyword || '').trim();
  const category = detectCategory(cleanQuery);

  // 1. Electron IPC web search (Dùng Bing Async Image Search Full HD 1080p)
  if (window.electronAPI?.searchWebImages) {
    try {
      const results = await window.electronAPI.searchWebImages(cleanQuery);
      if (results && results.length > 0) {
        const validPhotos = results.filter((r: any) => r.url && !r.url.endsWith('.svg'));
        if (validPhotos.length > 0) {
          return validPhotos as MediaAsset[];
        }
      }
    } catch (err) {
      console.warn('Electron web image search error:', err);
    }
  }

  // 2. Vite API server endpoint search (nếu chạy dev server)
  try {
    const res = await fetch(`/api/search-media?q=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Vite /api/search-media error:', err);
  }

  // 3. Fallback: Ảnh ẩm thực sắc nét chuẩn xác theo index
  if (category === 'food') {
    const foodImg = CURATED_FOOD_IMAGES[sceneIndex % CURATED_FOOD_IMAGES.length];
    return [
      {
        id: `food-hd-${sceneIndex}-${Date.now()}`,
        type: 'image',
        url: foodImg,
        thumbnail: foodImg,
        source: 'web',
        title: `Món ngon ẩm thực: ${cleanQuery}`
      }
    ];
  }

  // 4. AI generated image matching the exact keyword
  return getSmartFallbackMedia(cleanQuery, aspectRatio);
}

export function generateAiImageUrl(prompt: string, aspectRatio: AspectRatio = '9:16'): string {
  const width = aspectRatio === '9:16' ? 1080 : 1920;
  const height = aspectRatio === '9:16' ? 1920 : 1080;
  const cleanPrompt = encodeURIComponent(`${prompt}, 8k resolution, cinematic lighting, ultra sharp, photorealistic, masterpiece`);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
}

export function getSmartFallbackMedia(keyword: string, aspectRatio: AspectRatio = '9:16'): MediaAsset[] {
  const aiImgUrl = generateAiImageUrl(keyword, aspectRatio);
  return [
    {
      id: `ai-gen-${Date.now()}-1`,
      type: 'image',
      url: aiImgUrl,
      thumbnail: aiImgUrl,
      source: 'ai',
      title: `Ảnh nét 4K: ${keyword}`
    }
  ];
}

export async function searchPexelsMedia(
  keyword: string,
  aspectRatio: AspectRatio = '9:16',
  apiKey?: string,
  type: 'all' | 'video' | 'photo' = 'all'
): Promise<MediaAsset[]> {
  const cleanKeyword = (keyword || '').trim();
  if (!cleanKeyword) return getSmartFallbackMedia('landscape', aspectRatio);

  const orientation = aspectRatio === '9:16' ? 'portrait' : 'landscape';

  if (!apiKey) {
    return searchWebMedia(cleanKeyword, aspectRatio, type !== 'photo');
  }

  const results: MediaAsset[] = [];
  try {
    if (type === 'all' || type === 'video') {
      const videoRes = await axios.get(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanKeyword)}&per_page=8&orientation=${orientation}`,
        { headers: { Authorization: apiKey } }
      );

      for (const v of videoRes.data.videos || []) {
        const file = v.video_files.find((f: any) => f.quality === 'hd') || v.video_files[0];
        if (file) {
          results.push({
            id: `pexels-video-${v.id}`,
            type: 'video',
            url: file.link,
            thumbnail: v.image,
            source: 'pexels',
            duration: v.duration,
            author: v.user?.name,
            title: cleanKeyword
          });
        }
      }
    }

    if (type === 'all' || type === 'photo') {
      const photoRes = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanKeyword)}&per_page=8&orientation=${orientation}`,
        { headers: { Authorization: apiKey } }
      );

      for (const p of photoRes.data.photos || []) {
        results.push({
          id: `pexels-photo-${p.id}`,
          type: 'image',
          url: p.src.large2x || p.src.large,
          thumbnail: p.src.medium,
          source: 'pexels',
          author: p.photographer,
          title: cleanKeyword
        });
      }
    }
  } catch (error) {
    console.warn('Pexels search error, fallback to web search:', error);
    return searchWebMedia(cleanKeyword, aspectRatio);
  }

  return results.length > 0 ? results : searchWebMedia(cleanKeyword, aspectRatio);
}

