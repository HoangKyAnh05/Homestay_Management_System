import React from 'react';

export interface TikTokFilterItem {
  id: string;
  name: string;
  previewColor: string;
  description: string;
  cssFilter: string;
  overlayStyle?: React.CSSProperties;
}

export const TIKTOK_FILTERS: TikTokFilterItem[] = [
  {
    id: 'filter_none',
    name: 'Gốc (Không Lọc Màu)',
    previewColor: '#6b7280',
    description: 'Giữ nguyên màu sắc chân thực ban đầu của video',
    cssFilter: 'none'
  },
  {
    id: 'filter_teal_orange',
    name: '1. Teal & Orange (Hollywood Điện Ảnh)',
    previewColor: '#0284c7',
    description: 'Tương phản xanh cam kinh điển của các phim bom tấn Hollywood',
    cssFilter: 'contrast(1.15) saturate(1.25)',
    overlayStyle: {
      background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(249,115,22,0.18))',
      mixBlendMode: 'color'
    }
  },
  {
    id: 'filter_vintage_film',
    name: '2. Vintage 90s Film (Phim Nhựa Cổ Điển)',
    previewColor: '#d97706',
    description: 'Màu phim ấm áp, hoài niệm với độ tương phản mềm mại',
    cssFilter: 'sepia(0.25) contrast(0.95) brightness(1.05) saturate(1.1)',
    overlayStyle: {
      background: 'rgba(245, 158, 11, 0.08)',
      mixBlendMode: 'multiply'
    }
  },
  {
    id: 'filter_fresh_glow',
    name: '3. Fresh TikTok Glow (Sáng Mịn Tươi Tắn)',
    previewColor: '#ec4899',
    description: 'Làm sáng trong veo, tôn màu da mặt và phong cảnh rạng rỡ',
    cssFilter: 'brightness(1.08) contrast(1.05) saturate(1.15)',
    overlayStyle: {
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(244,114,182,0.06) 100%)',
      mixBlendMode: 'screen'
    }
  },
  {
    id: 'filter_cyberpunk_neon',
    name: '4. Cyberpunk Neon (Tím Dạ Quang Tương Lai)',
    previewColor: '#a855f7',
    description: 'Đậm chất viễn tưởng cyberpunk với ánh tím huyền ảo',
    cssFilter: 'contrast(1.3) saturate(1.4) hue-rotate(-15deg)',
    overlayStyle: {
      background: 'linear-gradient(180deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))',
      mixBlendMode: 'color-dodge'
    }
  },
  {
    id: 'filter_noir_bw',
    name: '5. Black & White Noir (Đen Trắng Điện Ảnh)',
    previewColor: '#1f2937',
    description: 'Đen trắng chiều sâu tương phản cao của các phim tài liệu',
    cssFilter: 'grayscale(1) contrast(1.4) brightness(0.95)'
  },
  {
    id: 'filter_golden_hour',
    name: '6. Golden Hour (Hoàng Hôn Rực Rỡ)',
    previewColor: '#ea580c',
    description: 'Ánh nắng hoàng hôn ấm áp đổ bóng dài lãng mạn',
    cssFilter: 'sepia(0.18) saturate(1.3) brightness(1.02)',
    overlayStyle: {
      background: 'linear-gradient(to top, rgba(234,88,12,0.18), transparent 70%)',
      mixBlendMode: 'screen'
    }
  },
  {
    id: 'filter_horror_dark',
    name: '7. Horror Moody Dark (U Tối Kịch Tính)',
    previewColor: '#0f172a',
    description: 'Lạnh lẽo, u ám, kéo mood nghẹt thở cho các video giật gân',
    cssFilter: 'brightness(0.85) contrast(1.35) saturate(0.7) hue-rotate(180deg)'
  },
  {
    id: 'filter_retro_vhs',
    name: '8. Retro VHS 80s (Băng Từ Thập Niên 80)',
    previewColor: '#14b8a6',
    description: 'Màu băng đĩa từ cũ thập niên 80 với viền RGB mờ ảo',
    cssFilter: 'contrast(1.1) saturate(1.2)',
    overlayStyle: {
      background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
      backgroundSize: '100% 4px',
      mixBlendMode: 'overlay'
    }
  }
];

export function getTikTokFilterById(id?: string): TikTokFilterItem | undefined {
  if (!id) return undefined;
  return TIKTOK_FILTERS.find((f) => f.id === id);
}
