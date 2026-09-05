import { spring, interpolate } from 'remotion';

export interface MotionEffectContext {
  frame: number;
  startFrame: number;
  fps: number;
  wordIndex: number;
  totalWords: number;
}

export interface MotionStyleResult {
  transform: string;
  opacity: number;
  filter?: string;
  color?: string;
  textShadow?: string;
  WebkitTextStroke?: string;
  background?: string;
}

export interface TypographyEffectPreset {
  id: string;
  name: string;
  category: 'spring' | 'kinetic' | 'digital' | 'radiance' | 'matter' | 'depth3d' | 'art';
  icon: string;
  desc: string;
  computeStyle: (ctx: MotionEffectContext, baseColor: string) => MotionStyleResult;
}

export const TYPOGRAPHY_EFFECT_PRESETS: TypographyEffectPreset[] = [
  // =========================================================================
  // NHÓM 1: BUNG NỔ, ĐÀN HỒI & VẬT LÝ NẨY (SPRING & ELASTIC)
  // =========================================================================
  {
    id: 'eff_spring_pop',
    name: '1. Spring Pop-in (Bung Nảy Lò Xo)',
    category: 'spring',
    icon: '⚡',
    desc: 'Chữ phóng từ 0% vượt ngưỡng 120% rồi giật nảy đàn hồi về 100%',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 9, stiffness: 180, mass: 0.5 } });
      return {
        transform: `scale(${s})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: `0 4px 20px rgba(0,0,0,0.9), 0 0 30px ${baseColor}88`
      };
    }
  },
  {
    id: 'eff_rubber_squish',
    name: '2. Rubber Squish (Cao Su Bẹp - Phình)',
    category: 'spring',
    icon: '🎈',
    desc: 'Rơi xuống nén bẹp dí theo trục dọc rồi bật căng theo trục ngang',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 7, stiffness: 140, mass: 0.6 } });
      const scaleX = interpolate(s, [0, 0.7, 1], [0.3, 1.4, 1]);
      const scaleY = interpolate(s, [0, 0.7, 1], [1.8, 0.7, 1]);
      return {
        transform: `scale(${scaleX}, ${scaleY})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: `0 4px 15px rgba(0,0,0,0.9)`
      };
    }
  },
  {
    id: 'eff_heavy_slam',
    name: '4. Heavy Impact Slam (Rơi Sập Búa Tạ)',
    category: 'spring',
    icon: '🔨',
    desc: 'Chữ từ vũ trụ dập sầm xuống mặt đất kèm rung màn hình dữ dội',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 14, stiffness: 260, mass: 1.2 } });
      const scale = interpolate(s, [0, 1], [3.5, 1], { extrapolateRight: 'clamp' });
      return {
        transform: `scale(${scale})`,
        opacity: frame >= startFrame ? Math.min(1, age * 0.3) : 0,
        color: baseColor,
        textShadow: `0 8px 30px rgba(0,0,0,0.95), 0 0 50px ${baseColor}`
      };
    }
  },

  // =========================================================================
  // NHÓM 2: TRƯỢT TỐC ĐỘ & LƯỚT ĐIỆN ẢNH (SLIDE & KINETIC SPEED)
  // =========================================================================
  {
    id: 'eff_whip_blur',
    name: '16. Whip Pan Blur (Vút Nhòe Tốc Độ Cao)',
    category: 'kinetic',
    icon: '🏎️',
    desc: 'Chữ lướt ngang với vệt nhòe chuyển động cực mạnh xé toạc khung hình',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 12, stiffness: 220 } });
      const translateX = interpolate(s, [0, 1], [-250, 0], { extrapolateRight: 'clamp' });
      const blur = interpolate(s, [0, 0.8, 1], [15, 2, 0]);
      return {
        transform: `translateX(${translateX}px) skewX(${interpolate(s, [0, 1], [-25, 0])}deg)`,
        opacity: frame >= startFrame ? 1 : 0,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        color: baseColor,
        textShadow: `0 4px 20px rgba(0,0,0,0.9)`
      };
    }
  },
  {
    id: 'eff_crash_zoom',
    name: '20. Crash Zoom Push (Phóng Thẳng Vào Mắt)',
    category: 'kinetic',
    icon: '🎯',
    desc: 'Phóng từ chấm nhỏ xíu lao thẳng sát ống kính trong vỏn vẹn 4 frame',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 10, stiffness: 300, mass: 0.3 } });
      return {
        transform: `scale(${s * 1.05})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: `0 6px 25px rgba(0,0,0,0.9)`
      };
    }
  },

  // =========================================================================
  // NHÓM 3: KỸ XẢO KỸ THUẬT SỐ, CODE & GLITCH (DIGITAL REVEALS)
  // =========================================================================
  {
    id: 'eff_rgb_glitch',
    name: '33. RGB Split Glitch (Lệch Kênh Màu Đỏ-Lam)',
    category: 'digital',
    icon: '👾',
    desc: 'Kênh màu Red và Blue bị tách rời nhau giật cục trong 3 nhịp',
    computeStyle: ({ frame, startFrame }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const isGlitch = age < 8 && age % 2 === 0;
      const offset = isGlitch ? 6 : 0;
      return {
        transform: isGlitch ? `translate(${Math.sin(age) * 8}px, ${Math.cos(age) * 4}px)` : 'none',
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: isGlitch
          ? `${-offset}px 0 #ef4444, ${offset}px 0 #06b6d4, 0 4px 15px rgba(0,0,0,0.9)`
          : `0 4px 20px rgba(0,0,0,0.9), 0 0 25px ${baseColor}`
      };
    }
  },
  {
    id: 'eff_hologram_flicker',
    name: '34. Hologram Flickering (Chiếu 3D Chập Chờn)',
    category: 'digital',
    icon: '🛸',
    desc: 'Tia sáng xanh lơ nhấp nháy chập chờn như hình chiếu không gian',
    computeStyle: ({ frame, startFrame }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const flicker = age < 12 ? (age % 3 === 0 ? 0.3 : 1) : 1;
      return {
        transform: 'none',
        opacity: frame >= startFrame ? flicker : 0,
        color: '#38bdf8',
        filter: 'drop-shadow(0 0 15px #0284c7)',
        textShadow: `0 0 10px #38bdf8, 0 0 25px #0284c7`
      };
    }
  },

  // =========================================================================
  // NHÓM 4: ÁNH SÁNG, NEON & NĂNG LƯỢNG (LIGHT & RADIANCE)
  // =========================================================================
  {
    id: 'eff_neon_flicker',
    name: '46. Neon Flicker Ignite (Đèn Neon Chớp Sáng)',
    category: 'radiance',
    icon: '💡',
    desc: 'Ống đèn neon nhấp nháy "tạch tạch" rồi bừng sáng rực rỡ',
    computeStyle: ({ frame, startFrame }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      let op = 0;
      if (frame >= startFrame) {
        if (age === 1 || age === 3) op = 0.2;
        else if (age === 2 || age === 4) op = 0.8;
        else if (age === 5) op = 0.1;
        else op = 1;
      }
      return {
        transform: 'none',
        opacity: op,
        color: baseColor,
        textShadow: `0 0 10px #fff, 0 0 20px ${baseColor}, 0 0 40px ${baseColor}, 0 0 70px ${baseColor}`
      };
    }
  },
  {
    id: 'eff_gold_shimmer',
    name: '48. Gold Metallic Shimmer (Ánh Kim Vàng Quý Tộc)',
    category: 'radiance',
    icon: '✨',
    desc: 'Dải phản chiếu ánh sáng trắng lướt qua mặt chữ mạ vàng xa xỉ',
    computeStyle: ({ frame, startFrame }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      return {
        transform: 'none',
        opacity: frame >= startFrame ? 1 : 0,
        color: '#facc15',
        textShadow: `0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 20px rgba(0,0,0,0.9), 0 0 35px #fef08a`
      };
    }
  },
  {
    id: 'eff_inferno_flame',
    name: '49. Inferno Flame (Bốc Cháy Rực Lửa)',
    category: 'radiance',
    icon: '🔥',
    desc: 'Chữ bùng cháy từ tàn đóm đỏ rực thành ngọn lửa cuồn cuộn',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 9, stiffness: 160 } });
      const heatWave = Math.sin(frame * 0.4) * 3;
      return {
        transform: `scale(${s}) translateY(${heatWave}px)`,
        opacity: frame >= startFrame ? 1 : 0,
        color: '#fb923c',
        textShadow: `0 0 15px #ea580c, 0 0 30px #ef4444, 0 0 50px #f59e0b`
      };
    }
  },

  // =========================================================================
  // NHÓM 5: 3D KHÔNG GIAN, LẬN KHỐI HỘP (DEPTH 3D)
  // =========================================================================
  {
    id: 'eff_cube_tumble',
    name: '76. 3D Cube Tumble (Lăn Khối Hộp 3D)',
    category: 'depth3d',
    icon: '🎲',
    desc: 'Chữ lộn 3 vòng trên mặt phẳng sàn 3D rồi dừng lại chính diện',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 10, stiffness: 150 } });
      const rotateX = interpolate(s, [0, 1], [-90, 0]);
      return {
        transform: `perspective(800px) rotateX(${rotateX}deg) scale(${s})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: `0 10px 25px rgba(0,0,0,0.9)`
      };
    }
  },
  {
    id: 'eff_coin_flip',
    name: '79. Coin Flip Spin (Tung Đồng Xu Xoay Tít)',
    category: 'depth3d',
    icon: '🪙',
    desc: 'Chữ xoay tròn theo trục dọc tốc độ cao rồi dừng lại ở mặt ngửa',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 9, stiffness: 160 } });
      const rotateY = interpolate(s, [0, 1], [270, 0]);
      return {
        transform: `perspective(800px) rotateY(${rotateY}deg) scale(${s})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: baseColor,
        textShadow: `0 6px 20px rgba(0,0,0,0.9)`
      };
    }
  },

  // =========================================================================
  // NHÓM 6: NGHỆ THUẬT & TYPOGRAPHIC HACKS
  // =========================================================================
  {
    id: 'eff_highlighter_marker',
    name: '91. Highlighter Marker (Bút Dạ Quang Tô Màu)',
    category: 'art',
    icon: '🖍️',
    desc: 'Vệt bút dạ quang vàng chanh quét qua làm chữ sáng bừng lên',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 12, stiffness: 180 } });
      return {
        transform: `scale(${s})`,
        opacity: frame >= startFrame ? 1 : 0,
        color: '#000000',
        background: 'linear-gradient(90deg, #facc15 0%, #fef08a 100%)',
        textShadow: 'none'
      };
    }
  },
  {
    id: 'eff_stamp_approval',
    name: '93. Stamp of Approval (Đóng Dấu Mộc Đỏ)',
    category: 'art',
    icon: '🔴',
    desc: 'Con dấu mộc đỏ dập sầm xuống làm chữ rung rinh bốc khói',
    computeStyle: ({ frame, startFrame, fps }, baseColor) => {
      const age = Math.max(0, frame - startFrame);
      const s = spring({ frame: age, fps, config: { damping: 8, stiffness: 240, mass: 0.8 } });
      const scale = interpolate(s, [0, 1], [2.2, 1], { extrapolateRight: 'clamp' });
      return {
        transform: `scale(${scale}) rotate(-6deg)`,
        opacity: frame >= startFrame ? 1 : 0,
        color: '#ef4444',
        textShadow: `0 0 10px rgba(239,68,68,0.5), 0 4px 20px rgba(0,0,0,0.9)`
      };
    }
  }
];

export function getEffectPresetById(id?: string): TypographyEffectPreset {
  if (!id) return TYPOGRAPHY_EFFECT_PRESETS[0];
  const found = TYPOGRAPHY_EFFECT_PRESETS.find((p) => p.id === id);
  return found || TYPOGRAPHY_EFFECT_PRESETS[0];
}
