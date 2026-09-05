import { VideoProject, DEFAULT_SUBTITLE_STYLE, DEFAULT_WATERMARK, DEFAULT_SOUND_FX } from '../types/video';

export const maxShowcaseProject: VideoProject = {
  id: 'lado-homestay-showcase',
  title: '🌲 Lá Đỏ Homestay Sa Pa - Săn Mây & Nghỉ Dưỡng',
  topic: 'Video giới thiệu trải nghiệm nghỉ dưỡng săn mây ngắm thung lũng Mường Hoa tại Lá Đỏ Homestay Sa Pa',
  aspectRatio: '9:16',
  fps: 30,
  totalDuration: 21.0,
  voice: {
    name: 'vi-VN-HoaiMyNeural',
    rate: '+0%',
    pitch: '+0Hz'
  },
  subtitleStyle: {
    ...DEFAULT_SUBTITLE_STYLE,
    fontFamily: 'Inter, sans-serif',
    fontSize: 40,
    highlightColor: '#2563eb',
    textColor: '#FFFFFF',
    strokeWidth: 2,
    strokeColor: '#000000',
    positionY: 82,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  watermark: {
    ...DEFAULT_WATERMARK,
    enabled: true,
    text: '@LaDoHomestaySaPa',
    position: 'top-right'
  },
  showProgressBar: true,
  soundFx: DEFAULT_SOUND_FX,
  bgm: {
    url: '/audio/bgm-lofi.wav',
    volume: 0.28,
    duckingVolume: 0.10
  },
  status: 'idle',
  scenes: [
    // Scene 1
    {
      id: 'lado-scene-1',
      order: 1,
      narration: 'Chào mừng bạn đến với Lá Đỏ Homestay Sa Pa, nơi đón trọn vẻ đẹp hùng vĩ của thung lũng Mường Hoa.',
      searchKeyword: 'sapa mountains valley clouds landscape nature vietnam',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 5.2,
      words: [
        { word: 'Chào', start: 0.1, end: 0.35 },
        { word: 'mừng', start: 0.35, end: 0.65 },
        { word: 'bạn', start: 0.65, end: 0.9 },
        { word: 'đến', start: 0.9, end: 1.15 },
        { word: 'với', start: 1.15, end: 1.4 },
        { word: 'Lá', start: 1.4, end: 1.7 },
        { word: 'Đỏ', start: 1.7, end: 2.0 },
        { word: 'Homestay', start: 2.0, end: 2.5 },
        { word: 'Sa', start: 2.5, end: 2.8 },
        { word: 'Pa,', start: 2.8, end: 3.1 },
        { word: 'nơi', start: 3.2, end: 3.45 },
        { word: 'đón', start: 3.45, end: 3.7 },
        { word: 'trọn', start: 3.7, end: 3.95 },
        { word: 'vẻ', start: 3.95, end: 4.2 },
        { word: 'đẹp', start: 4.2, end: 4.45 },
        { word: 'hùng', start: 4.45, end: 4.7 },
        { word: 'vĩ', start: 4.7, end: 4.95 },
        { word: 'Mường', start: 4.95, end: 5.2 }
      ],
      textLayerMode: 'front',
      transition: 'fade',
      kenBurns: 'zoom_in'
    },

    // Scene 2
    {
      id: 'lado-scene-2',
      order: 2,
      narration: 'Mỗi sớm thức dậy, bạn sẽ được ngắm nhìn biển mây bồng bềnh trôi ngay trước hiên ban công gỗ.',
      searchKeyword: 'fog clouds misty mountain morning coffee wooden balcony',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 5.0,
      words: [
        { word: 'Mỗi', start: 0.1, end: 0.35 },
        { word: 'sớm', start: 0.35, end: 0.65 },
        { word: 'thức', start: 0.65, end: 0.95 },
        { word: 'dậy,', start: 0.95, end: 1.25 },
        { word: 'bạn', start: 1.35, end: 1.6 },
        { word: 'sẽ', start: 1.6, end: 1.85 },
        { word: 'được', start: 1.85, end: 2.1 },
        { word: 'ngắm', start: 2.1, end: 2.35 },
        { word: 'nhìn', start: 2.35, end: 2.6 },
        { word: 'biển', start: 2.6, end: 2.9 },
        { word: 'mây', start: 2.9, end: 3.2 },
        { word: 'bồng', start: 3.2, end: 3.5 },
        { word: 'bềnh', start: 3.5, end: 3.8 },
        { word: 'trôi', start: 3.8, end: 4.1 },
        { word: 'ban', start: 4.1, end: 4.4 },
        { word: 'công.', start: 4.4, end: 5.0 }
      ],
      textLayerMode: 'front',
      transition: 'fade',
      kenBurns: 'pan_right'
    },

    // Scene 3
    {
      id: 'lado-scene-3',
      order: 3,
      narration: 'Buổi tối, cùng người thương thưởng thức lẩu cá tầm nóng hổi và ly trà ấm giữa núi rừng Tây Bắc.',
      searchKeyword: 'hot pot asian delicious dinner cozy warm lights tea',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 5.5,
      words: [
        { word: 'Buổi', start: 0.1, end: 0.35 },
        { word: 'tối,', start: 0.35, end: 0.7 },
        { word: 'cùng', start: 0.8, end: 1.05 },
        { word: 'người', start: 1.05, end: 1.35 },
        { word: 'thương', start: 1.35, end: 1.65 },
        { word: 'thưởng', start: 1.65, end: 1.95 },
        { word: 'thức', start: 1.95, end: 2.25 },
        { word: 'lẩu', start: 2.25, end: 2.55 },
        { word: 'cá', start: 2.55, end: 2.85 },
        { word: 'tầm', start: 2.85, end: 3.15 },
        { word: 'nóng', start: 3.15, end: 3.45 },
        { word: 'hổi', start: 3.45, end: 3.75 },
        { word: 'núi', start: 4.2, end: 4.5 },
        { word: 'rừng.', start: 4.5, end: 5.5 }
      ],
      textLayerMode: 'front',
      transition: 'fade',
      kenBurns: 'zoom_in'
    },

    // Scene 4
    {
      id: 'lado-scene-4',
      order: 4,
      narration: 'Hãy để Lá Đỏ Homestay đồng hành cùng kỳ nghỉ an yên và đáng nhớ nhất của bạn tại Sa Pa!',
      searchKeyword: 'wooden cozy homestay room window mountains sapa resort',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 5.3,
      words: [
        { word: 'Hãy', start: 0.1, end: 0.35 },
        { word: 'để', start: 0.35, end: 0.65 },
        { word: 'Lá', start: 0.65, end: 0.95 },
        { word: 'Đỏ', start: 0.95, end: 1.25 },
        { word: 'Homestay', start: 1.25, end: 1.75 },
        { word: 'đồng', start: 1.75, end: 2.05 },
        { word: 'hành', start: 2.05, end: 2.35 },
        { word: 'cùng', start: 2.35, end: 2.65 },
        { word: 'kỳ', start: 2.65, end: 2.95 },
        { word: 'nghỉ', start: 2.95, end: 3.25 },
        { word: 'an', start: 3.25, end: 3.55 },
        { word: 'yên', start: 3.55, end: 3.85 },
        { word: 'nhất', start: 4.2, end: 4.5 },
        { word: 'Sa', start: 4.5, end: 4.8 },
        { word: 'Pa!', start: 4.8, end: 5.3 }
      ],
      textLayerMode: 'front',
      transition: 'fade',
      kenBurns: 'zoom_out'
    }
  ]
};
