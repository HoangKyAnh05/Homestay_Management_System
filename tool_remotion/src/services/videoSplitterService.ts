import { VideoSegment, TrimOverflowOption, Scene } from '../types/video';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  url: string;
  name: string;
  sizeMb: number;
}

/**
 * Trích xuất siêu dữ liệu (thời lượng, kích thước, khung hình) từ file video tải lên
 */
export async function inspectVideoFile(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve({
        duration: Number(video.duration.toFixed(2)),
        width: video.videoWidth || 1080,
        height: video.videoHeight || 1920,
        url: videoUrl,
        name: file.name,
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(2))
      });
    };

    video.onerror = () => {
      reject(new Error('Không thể đọc file video. Vui lòng kiểm tra định dạng MP4, MOV, WEBM.'));
    };
  });
}

/**
 * Chụp ảnh thumbnail tại một mốc giây cụ thể trong video
 */
export async function captureVideoThumbnail(videoUrl: string, timeInSeconds: number): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.max(0, timeInSeconds);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 480, 480);
        const aspect = (video.videoHeight || 854) / (video.videoWidth || 480);
        canvas.height = Math.round(canvas.width * aspect);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Lỗi khi chụp thumbnail canvas:', err);
      }
      resolve('');
    };

    video.onerror = () => {
      resolve('');
    };

    // Timeout phòng trường hợp seeked không kích hoạt
    setTimeout(() => resolve(''), 3000);
  });
}

/**
 * Tự động chia video dài thành các phân đoạn (Segments) theo mốc giây (ví dụ: 5s, 10s, 15s)
 */
export function splitVideoIntoSegments(
  sourceUrl: string,
  totalDuration: number,
  intervalSeconds: number
): VideoSegment[] {
  const safeInterval = Math.max(1, intervalSeconds);
  const segments: VideoSegment[] = [];
  let currentStart = 0;
  let index = 1;

  while (currentStart < totalDuration) {
    const nextEnd = Math.min(currentStart + safeInterval, totalDuration);
    const duration = Number((nextEnd - currentStart).toFixed(2));

    // Bỏ qua đoạn vụn cực nhỏ dưới 0.4s nếu đã có ít nhất 1 segment (gộp vào đoạn trước)
    if (duration < 0.4 && segments.length > 0) {
      const prev = segments[segments.length - 1];
      prev.endOffset = totalDuration;
      prev.duration = Number((totalDuration - prev.startOffset).toFixed(2));
      break;
    }

    segments.push({
      id: `seg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      order: index,
      title: `Clip #${index} (${duration}s)`,
      sourceUrl,
      startOffset: Number(currentStart.toFixed(2)),
      endOffset: Number(nextEnd.toFixed(2)),
      duration
    });

    currentStart = nextEnd;
    index++;
  }

  return segments;
}

/**
 * Xử lý kéo co ngắn lại đoạn video thừa với 2 Option:
 * - 'shift_to_next': Chuyển đoạn thừa (delta) sang video tiếp theo (dời startOffset của clip sau về trước)
 * - 'discard': Cắt bỏ hoàn toàn đoạn thừa
 */
export function trimSegmentWithOption(
  segments: VideoSegment[],
  targetIndex: number,
  newDuration: number,
  overflowMode: TrimOverflowOption
): {
  updatedSegments: VideoSegment[];
  message: string;
} {
  if (targetIndex < 0 || targetIndex >= segments.length) {
    return { updatedSegments: segments, message: 'Vị trí clip không hợp lệ' };
  }

  const updated = segments.map((seg) => ({ ...seg }));
  const target = updated[targetIndex];
  const oldDuration = target.duration;
  const safeNewDuration = Math.max(1, Number(newDuration.toFixed(2)));
  const delta = Number((oldDuration - safeNewDuration).toFixed(2));

  // Cập nhật mốc kết thúc mới cho clip hiện tại
  const newEndOffset = Number((target.startOffset + safeNewDuration).toFixed(2));
  target.endOffset = newEndOffset;
  target.duration = safeNewDuration;
  target.title = `Clip #${target.order} (${safeNewDuration}s)`;

  if (delta > 0) {
    // Trường hợp co ngắn lại (thừa delta giây)
    if (overflowMode === 'shift_to_next') {
      if (targetIndex + 1 < updated.length) {
        const next = updated[targetIndex + 1];
        // Clip tiếp theo nhận đoạn thừa bằng cách dời mốc bắt đầu về newEndOffset
        next.startOffset = newEndOffset;
        next.duration = Number((next.endOffset - next.startOffset).toFixed(2));
        next.title = `Clip #${next.order} (${next.duration}s)`;

        return {
          updatedSegments: updated,
          message: `Đã co Clip #${target.order} còn ${safeNewDuration}s. Đoạn thừa ${delta}s đã chuyển trọn vẹn sang Clip #${next.order}!`
        };
      } else {
        return {
          updatedSegments: updated,
          message: `Clip #${target.order} là clip cuối cùng, đoạn thừa ${delta}s đã được cắt bỏ.`
        };
      }
    } else {
      // Option 'discard': Xóa bỏ đoạn thừa
      return {
        updatedSegments: updated,
        message: `Đã co Clip #${target.order} còn ${safeNewDuration}s và xóa bỏ ${delta}s đoạn thừa.`
      };
    }
  } else if (delta < 0) {
    // Trường hợp kéo dài ra (tăng thời lượng)
    const extra = Math.abs(delta);
    if (targetIndex + 1 < updated.length && overflowMode === 'shift_to_next') {
      const next = updated[targetIndex + 1];
      // Nếu kéo dài clip 1 lấn sang clip 2, clip 2 bắt đầu muộn hơn
      next.startOffset = Math.min(newEndOffset, next.endOffset - 1);
      next.duration = Number((next.endOffset - next.startOffset).toFixed(2));
      next.title = `Clip #${next.order} (${next.duration}s)`;
    }
    return {
      updatedSegments: updated,
      message: `Đã mở rộng Clip #${target.order} thêm ${extra}s.`
    };
  }

  return { updatedSegments: updated, message: 'Thời lượng không đổi.' };
}

/**
 * Chuyển đổi danh sách VideoSegment thành các Scene tương thích hoàn toàn với Remotion Storyboard
 */
export function convertSegmentsToScenes(segments: VideoSegment[]): Scene[] {
  return segments.map((seg, idx) => ({
    id: `scene-split-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    narration: seg.narration || `Phân đoạn ${idx + 1}: Thưởng thức không gian homestay (${seg.duration}s)`,
    searchKeyword: `Phân cảnh video homestay ${idx + 1}`,
    mediaType: 'video',
    mediaUrl: seg.sourceUrl,
    localMediaPath: seg.sourceUrl,
    sourceVideoUrl: seg.sourceUrl,
    videoStartOffset: seg.startOffset,
    videoEndOffset: seg.endOffset,
    audioDuration: seg.duration,
    words: [],
    transition: 'fade',
    kenBurns: 'none',
    headerBadge: `📍 CLIP ${idx + 1} (${seg.duration}s)`
  }));
}

/**
 * Định dạng số giây thành chuỗi hiển thị mm:ss
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}
