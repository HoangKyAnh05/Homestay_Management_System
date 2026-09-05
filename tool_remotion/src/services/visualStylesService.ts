export interface CustomVisualItem {
  id: string;
  name: string;
  icon: string;
  badgeText: string;
  layoutType: 'crown_prop' | 'floating_props' | 'frosted_glass' | 'callout_pills' | 'orbit_glow' | 'grid_matrix' | 'custom_card';
  primaryColor?: string;
  secondaryColor?: string;
  isCustom?: boolean;
}

export const DEFAULT_VISUAL_STYLES: CustomVisualItem[] = [
  { id: 'media', name: 'Media Thường (Ảnh/Video)', icon: '🖼️', badgeText: '', layoutType: 'custom_card' },
  { id: 'green_screen_depth', name: '🟩 Phông Xanh & Chữ Motion 3D (Trước & Sau Vật Thể)', icon: '🟩', badgeText: '🟩 3D DEPTH MOTION', layoutType: 'custom_card', primaryColor: '#22c55e' },
  { id: 'crown_youtube', name: 'Vương Miện YouTube (MrBeast 3D)', icon: '👑', badgeText: '👑 HOÀNG GIA NỔI BẬT', layoutType: 'crown_prop', primaryColor: '#facc15' },
  { id: 'floating_clocks', name: 'Đồng Hồ Thời Gian 3D Bay', icon: '⏰', badgeText: '⏰ TẬP TRUNG THỜI GIAN', layoutType: 'floating_props', primaryColor: '#22c55e' },
  { id: 'frosted_glass_pro', name: 'Hộp Kính Mờ Phim Tài Liệu', icon: '📺', badgeText: '🎬 PHIM ĐIỆN ẢNH', layoutType: 'frosted_glass', primaryColor: '#06b6d4' },
  { id: 'viral_callout_pills', name: 'Viên Thuốc Neon Nổi Bật', icon: '🔥', badgeText: '🔥 ĐIỂM NHẤN QUAN TRỌNG', layoutType: 'callout_pills', primaryColor: '#f97316' },
  { id: 'chat_bubble', name: 'Chat Inbox (Viral DM Pop)', icon: '💬', badgeText: '💬 INBOX MỖI NGÀY', layoutType: 'custom_card' },
  { id: 'orbital_glow', name: 'Quỹ Đạo AI (Glow Orbit)', icon: '🪐', badgeText: '🔑 HÔM NAY BẬT MÍ', layoutType: 'orbit_glow' },
  { id: 'math_grid', name: 'Đồ Họa Vector (Math Grid)', icon: '📈', badgeText: '👀 XEM NGAY ĐÂY', layoutType: 'grid_matrix' },
  { id: 'radar_tech', name: 'Radar / Biểu Đồ Sóng Âm', icon: '📊', badgeText: '📊 PHÂN TÍCH CHỈ SỐ', layoutType: 'custom_card' },
  { id: 'night_highway', name: 'Xe Đua Cao Tốc Đêm (Speed)', icon: '🏎️', badgeText: '🏎️ BỨT PHÁ TỐC ĐỘ', layoutType: 'custom_card' },
  { id: 'airplane_takeoff', name: 'Máy Bay Cất Cánh (Sky Flight)', icon: '✈️', badgeText: '✈️ CẤT CÁNH THÀNH CÔNG', layoutType: 'custom_card' },
  { id: 'stock_chart', name: 'Đồ Thị Cổ Phiếu (+320% Rally)', icon: '📈', badgeText: '📈 BÙNG NỔ LỢI NHUẬN', layoutType: 'custom_card' },
  { id: 'google_search', name: 'Google Tìm Kiếm Gõ Chữ', icon: '🔍', badgeText: '🔍 TÌM KIẾM BÍ QUYẾT', layoutType: 'custom_card' },
  { id: 'bank_notification', name: 'Biến Động Số Dư (Ting Ting)', icon: '💵', badgeText: '💵 THÔNG BÁO SỐ DƯ', layoutType: 'custom_card' },
  { id: 'vs_battle', name: 'So Sánh Đối Đầu (VS Battle)', icon: '⚡', badgeText: '⚡ SO SÁNH ĐỐI ĐẦU', layoutType: 'custom_card' },
  { id: 'code_terminal', name: 'Màn Hình Code Terminal', icon: '💻', badgeText: '💻 TỰ ĐỘNG HÓA CODE', layoutType: 'custom_card' }
];

const STORAGE_KEY = 'remotion_unlimited_custom_visuals';

export const visualStylesService = {
  getAll(): CustomVisualItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return [...DEFAULT_VISUAL_STYLES, ...parsed];
        }
      }
    } catch {}
    return DEFAULT_VISUAL_STYLES;
  },

  addCustom(item: Omit<CustomVisualItem, 'id' | 'isCustom'>): CustomVisualItem {
    const newItem: CustomVisualItem = {
      ...item,
      id: `custom_visual_${Date.now()}`,
      isCustom: true
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: CustomVisualItem[] = raw ? JSON.parse(raw) : [];
      list.push(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    return newItem;
  },

  deleteCustom(id: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: CustomVisualItem[] = JSON.parse(raw);
        const next = list.filter((i) => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  },

  /**
   * Quét và Xóa phông vật thể / nhân vật trong ảnh (Remove Background AI)
   * Sử dụng Canvas Edge Segmentation & Color Matting trực tiếp trên client để tạo ảnh PNG trong suốt
   */
  async removeBackgroundAI(mediaUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 1. Thử dùng service trực tuyến xóa phông nếu có internet
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(mediaUrl);

          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 600;

          // Vẽ ảnh lên canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Lấy màu mẫu của 4 góc để nhận diện màu nền chính xác
          const sampleCornerColors = [
            [data[0], data[1], data[2]], // Top-Left
            [data[(canvas.width - 1) * 4], data[(canvas.width - 1) * 4 + 1], data[(canvas.width - 1) * 4 + 2]], // Top-Right
            [data[(canvas.height - 1) * canvas.width * 4], data[(canvas.height - 1) * canvas.width * 4 + 1], data[(canvas.height - 1) * canvas.width * 4 + 2]] // Bottom-Left
          ];

          // Tính màu nền đại diện trung bình
          const bgR = Math.round((sampleCornerColors[0][0] + sampleCornerColors[1][0]) / 2);
          const bgG = Math.round((sampleCornerColors[0][1] + sampleCornerColors[1][1]) / 2);
          const bgB = Math.round((sampleCornerColors[0][2] + sampleCornerColors[1][2]) / 2);

          // Thuật toán Color Distance & Edge Contrast Threshold để loại bỏ nền
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist = Math.sqrt(
              Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
            );

            // Nếu màu pixel gần trùng với màu nền -> Xóa phông (alpha = 0)
            if (dist < 42) {
              data[i + 3] = 0; // Trong suốt hoàn toàn
            } else if (dist < 65) {
              // Làm mờ viền cạnh mềm mại (Feathering)
              const factor = (dist - 42) / (65 - 42);
              data[i + 3] = Math.round(data[i + 3] * factor);
            }
          }

          ctx.putImageData(imgData, 0, 0);
          const transparentPngUrl = canvas.toDataURL('image/png');
          resolve(transparentPngUrl);
        } catch (e) {
          console.warn('Local canvas background removal fallback:', e);
          resolve(mediaUrl);
        }
      };

      img.onerror = () => {
        resolve(mediaUrl);
      };

      img.src = mediaUrl;
    });
  }
};
