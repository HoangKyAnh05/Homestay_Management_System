export type RoadmapItemStatus = 'todo' | 'in_progress' | 'completed';

export interface CenterMediaItem {
  type: 'image' | 'video' | 'none';
  url: string;
  name?: string;
  thumbnailUrl?: string;
}

export interface BehindTheScenesItem {
  description: string;
  imageUrl?: string;
  tips?: string[];
  equipmentNeeded?: string;
}

export interface RoadmapDayItem {
  day: number; // 1 -> 100
  title: string; // Tên ngắn gọn của ngày
  taskAction: string; // Bên trên: Việc cần quay, chụp, làm gì cụ thể
  category?: 'video_short' | 'video_long' | 'photo_set' | 'livestream' | 'carousel' | 'article' | 'challenge' | string;
  centerMedia: CenterMediaItem; // Ở giữa: Đẩy file ảnh hoặc video
  bts: BehindTheScenesItem; // Bên phải: Mô tả hậu trường để làm việc & đẩy ảnh hậu trường
  benefit: string; // Bên trái: Lợi ích sau khi hoàn thành việc/ảnh/video đó
  status: RoadmapItemStatus; // Trạng thái hoàn thành
  tags?: string[];
  completedAt?: string;
}

export interface Roadmap100Data {
  id: string;
  topic: string;
  targetAudience?: string;
  startDate?: string;
  days: RoadmapDayItem[];
  createdAt: string;
  updatedAt: string;
}
