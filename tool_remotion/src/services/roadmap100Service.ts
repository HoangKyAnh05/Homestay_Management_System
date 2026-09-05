import { RoadmapDayItem, Roadmap100Data } from '../types/roadmap100';

const STORAGE_KEY = 'remotion_roadmap_100_data';

export const roadmap100Service = {
  /**
   * Tạo AI Prompt chuẩn JSON Schema cho 100 ngày dựa trên chủ đề
   */
  generatePrompt100Days(topic: string): string {
    const cleanTopic = (topic || 'Xây kênh TikTok bán hàng triệu view từ số 0').trim();
    return `Bạn là một Chuyên Gia Chiến Lược Nội Dung & Đạo Diễn Sản Xuất hàng đầu thế giới.
Hãy xây dựng cho tôi một LỘ TRÌNH 100 NGÀY CHI TIẾT TỪNG NGÀY (Từ Ngày 1 đến Ngày 100) theo đúng chủ đề sau:
👉 CHỦ ĐỀ: "${cleanTopic}"

Lộ trình 100 ngày cần được phân chia khoa học theo 4 giai đoạn tiến hóa:
- Giai đoạn 1 (Ngày 1 - 25): Đặt nền móng, định vị nhân hiệu, giải quyết nỗi đau cốt lõi, thấu hiểu tệp khách hàng.
- Giai đoạn 2 (Ngày 26 - 50): Tăng tốc nội dung, chủ đề tranh luận đa chiều, mở rộng tiếp cận, kéo tương tác mạnh.
- Giai đoạn 3 (Ngày 51 - 75): Bứt phá với nội dung viral, bắt trend thịnh hành, câu chuyện truyền cảm hứng sâu sắc.
- Giai đoạn 4 (Ngày 76 - 100): Chuyển đổi đỉnh cao, khai thác đơn hàng, tri ân khách hàng và xây dựng cộng đồng trung thành.

YÊU CẦU BẮT BUỘC VỀ KẾT QUẢ ĐẦU RA:
- Trả về KẾT QUẢ DUY NHẤT LÀ MỘT MẢNG JSON HỢP LỆ (Valid JSON Array), tuyệt đối không thêm lời chào, không thêm markdown ngoài khối json.
- Mảng gồm đúng 100 phần tử (từ day = 1 đến day = 100).
- Mỗi phần tử tuân thủ chính xác cấu trúc JSON sau:
[
  {
    "day": 1,
    "title": "Tiêu đề ngắn gọn, cuốn hút của ngày",
    "taskAction": "Hôm nay cần quay, chụp, làm gì cụ thể (Kịch bản hook 3 giây đầu, hành động chính, góc quay)",
    "category": "Video ngắn",
    "btsDescription": "Mô tả hậu trường làm việc: cách chuẩn bị đạo cụ, góc máy, ánh sáng, tâm lý, lưu ý khi thực hiện",
    "benefit": "Lợi ích sau khi hoàn thành việc/video/ảnh: tăng follow, kéo tương tác, tăng uy tín nhân hiệu, chốt đơn"
  },
  ... tiếp tục đủ 100 ngày ...
]
`;
  },

  /**
   * Tạo Prompt AI chuyên sâu để viết 3 kịch bản video chuẩn điện ảnh & quảng cáo (2 phút, không cần JSON)
   */
  generateDayScriptPrompt(item: RoadmapDayItem, generalTopic: string): string {
    return `Bạn là một ĐẠO DIỄN SẢN XUẤT VIDEO & BẬC THẦY QUẢNG CÁO NỘI DUNG (Content Creative Director) hàng đầu.
Hãy dựa vào thông tin của Ngày ${item.day} dưới đây để sáng tạo ngay BỘ 3 KỊCH BẢN VIDEO THẬT HAY, ĐẦY ĐỦ VÀ CUỐN HÚT (Thời lượng mỗi kịch bản khoảng 2 PHÚT, tương đương 280 - 350 từ đọc truyền cảm):

==================================================
THÔNG TIN NGÀY ${item.day}:
- CHỦ ĐỀ CHUNG: "${generalTopic}"
- TIÊU ĐỀ NGÀY: "${item.title}"
- NHIỆM VỤ QUAY / CHỤP: "${item.taskAction}"
- THỂ LOẠI: "${item.category || 'Video ngắn'}"
- HẬU TRƯỜNG & SETUP: "${item.bts.description}"
- LỢI ÍCH & MỤC TIÊU ĐẠT ĐƯỢC: "${item.benefit}"
==================================================

YÊU CẦU ĐỊNH DẠNG:
- TUYỆT ĐỐI KHÔNG TRẢ VỀ DẠNG JSON.
- Trả về dạng VĂN BẢN ĐẠO DIỄN MARKDOWN RÕ RÀNG, phân tách theo từng mốc thời gian (0-15s, 15-45s, 45-80s, 80-120s), có chỉ đạo nghiệp vụ làm phim chi tiết.

HÃY VIẾT ĐỦ 3 PHONG CÁCH KỊCH BẢN KHÁC NHAU:

---
🎬 KỊCH BẢN 1: PHONG CÁCH KỂ CHUYỆN ĐIỆN ẢNH (Cinematic Storytelling & Emotional Hook)
- Mở đầu bằng một xung đột, tình huống đời thực hoặc bí mật ít ai dám nói.
- Chi tiết nghiệp vụ:
  + Góc máy & Thị giác (Visual & Camera Movement): Cận cảnh (Close-up), Góc nhìn thứ nhất (POV), Toàn cảnh không gian, Chuyển động lia máy (Pan/Tilt).
  + Thiết kế âm thanh (Sound Design): Nhạc nền (BGM) trầm lắng rồi cao trào, tiếng SFX (Whoosh, tiếng tim đập, bass drop).
  + Lời thoại / Voiceover: Câu từ xúc động, tự nhiên, kết nối tâm can người xem.
  + Chỉ đạo diễn xuất: Ánh mắt, tông giọng thì thầm chuyển sang quyết liệt.
  + Đúc kết bài học & Kêu gọi hành động tự nhiên.

---
🔥 KỊCH BẢN 2: PHONG CÁCH CHUYÊN GIA THỰC CHIẾN & BẺ GÃY ĐỊNH KIẾN (Expert Myth-Busters & Deep Value)
- Đi thẳng vào vấn đề, đập tan 1 sai lầm tai hại mà 90% mọi người đang mắc phải.
- Chi tiết nghiệp vụ:
  + Góc máy & Thị giác: Góc chính diện uy lực (Direct to camera), chèn B-roll thao tác thực tế, zoom crash nhấn mạnh từ khóa đắt giá.
  + Thiết kế âm thanh: Nhịp điệu sôi động, tiếng click chuột, tiếng ting thông báo, âm thanh lật sách/gõ bàn phím.
  + Lời thoại / Voiceover: Lập luận sắc bén, dẫn chứng số liệu/kết quả thực tế, nhịp nói dứt khoát, chắc chắn.
  + Đồ họa màn hình: Vị trí xuất hiện Text Motion, Callout, mũi tên chỉ dẫn.
  + Lời kêu gọi hành động: Thách thức khán giả áp dụng ngay trong 24h tới.

---
🚀 KỊCH BẢN 3: PHONG CÁCH QUẢNG CÁO VIRAL GIỮ CHÂN CAO (High-Converting Viral Retention & CTA)
- Hook 3 giây "giật nổ" khiến người xem không thể lướt qua (Pattern Interrupt).
- Chi tiết nghiệp vụ:
  + Góc máy & Thị giác: Nhịp cắt nhanh (Fast-paced editing 2-3s đổi cảnh), hiệu ứng thị giác tương phản mạnh, cận cảnh sản phẩm/kết quả.
  + Thiết kế âm thanh: Nhạc nền bắt trend nhịp nhanh, âm thanh Risers tăng kịch tính.
  + Lời thoại / Voiceover: Ngôn từ thôi miên, dùng công thức PAS (Problem - Agitate - Solution) hoặc AIDA.
  + Tâm lý khán giả: Đánh trúng nỗi sợ bỏ lỡ (FOMO) và lòng khao khát nâng cấp bản thân.
  + Kêu gọi hành động (CTA) bùng nổ: Kích thích để lại bình luận để nhận tài liệu/ưu đãi đặc biệt.

Hãy viết chi tiết từng câu thoại, từng giây hành động của cả 3 kịch bản để tôi chỉ cần cầm máy lên là quay được ngay!`;
  },

  /**
   * Sinh thuật toán 100 ngày mẫu sinh động theo chủ đề người dùng nhập
   */
  generateSample100Days(topic: string): Roadmap100Data {
    const cleanTopic = (topic || '100 ngày xây dựng thương hiệu cá nhân & sáng tạo nội dung triệu view').trim();
    const days: RoadmapDayItem[] = [];

    const categories = ['Video ngắn', 'Bộ ảnh Concept', 'Video ngắn', 'Livestream', 'Bộ ảnh Hậu trường', 'Video ngắn', 'Thử thách 24h'];

    for (let d = 1; d <= 100; d++) {
      let stageTitle = '';
      let actionFocus = '';
      let btsFocus = '';
      let benefitFocus = '';
      const cat = categories[(d - 1) % categories.length];

      if (d <= 25) {
        stageTitle = 'Khởi Động Nền Móng & Định Vị';
        actionFocus = `Quay video/chụp ảnh chủ đề "${cleanTopic}": Chia sẻ lý do vì sao bắt đầu và giải quyết sai lầm phổ biến số ${d} mà 90% người mới mắc phải.`;
        btsFocus = `Setup góc quay tự nhiên tại bàn làm việc, ánh sáng đèn softbox 45 độ, thu âm micro cài áo không dây, chuẩn bị 3 câu hook mở đầu.`;
        benefitFocus = `Xác lập vị thế chuyên gia ngay từ đầu, thu hút tệp khán giả chất lượng đầu tiên, rèn luyện sự tự tin trước ống kính.`;
      } else if (d <= 50) {
        stageTitle = 'Tăng Tốc & Kéo Tương Tác';
        actionFocus = `Thực hiện nội dung tương tác chuyên sâu ngày ${d}: Đặt câu hỏi phản biện, so sánh 2 góc nhìn đối lập về "${cleanTopic}" để kích thích bình luận.`;
        btsFocus = `Ghi hình ngoại cảnh hoặc không gian mở, dùng gimbal chống rung, quay cận cảnh thao tác thực tế để tạo sự chân thực và cuốn hút.`;
        benefitFocus = `Tăng tỷ lệ bình luận và chia sẻ lên gấp 3 lần, thuật toán đẩy video vào luồng đề xuất, mở rộng tệp follower mới.`;
      } else if (d <= 75) {
        stageTitle = 'Bứt Phá & Nội Dung Viral';
        actionFocus = `Sản xuất siêu phẩm nội dung ngày ${d}: Kể một câu chuyện thất bại rồi vượt qua ngoạn mục liên quan đến "${cleanTopic}", lồng nhạc cao trào.`;
        btsFocus = `Chia kịch bản làm 4 phân đoạn (Hook - Cao trào - Bài học - Kêu gọi), dùng ánh sáng tương phản cinematic, dựng video nhịp cắt nhanh.`;
        benefitFocus = `Chạm vào cảm xúc sâu sắc của khán giả, tạo sự đồng cảm lớn, tăng lượng lưu video và viral mạnh mẽ sang các nền tảng khác.`;
      } else {
        stageTitle = 'Chuyển Đổi Doanh Thu & Cộng Đồng';
        actionFocus = `Nội dung giá trị cao ngày ${d}: Đúc kết trọn bộ cẩm nang / quy trình thực chiến "${cleanTopic}" và hướng dẫn khán giả hành động ngay.`;
        btsFocus = `Setup góc quay chuyên nghiệp, bảng ghi chú mindmap phía sau, chuẩn bị tài liệu quà tặng để gửi tặng khán giả theo dõi.`;
        benefitFocus = `Chuyển đổi khán giả theo dõi thành khách hàng trung thành, xây dựng cộng đồng fan cứng, tạo nguồn thu nhập bền vững.`;
      }

      days.push({
        day: d,
        title: `Ngày ${d}: ${stageTitle} (Bài ${d})`,
        taskAction: actionFocus,
        category: cat,
        centerMedia: {
          type: 'none',
          url: '',
          name: ''
        },
        bts: {
          description: btsFocus,
          imageUrl: ''
        },
        benefit: benefitFocus,
        status: d <= 3 ? 'completed' : d === 4 ? 'in_progress' : 'todo'
      });
    }

    return {
      id: `roadmap-${Date.now()}`,
      topic: cleanTopic,
      days,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Lưu trữ lộ trình hiện tại vào localStorage
   */
  saveRoadmap(data: Roadmap100Data): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.saveProjectToList(data);
    } catch (e) {
      console.error('Failed to save roadmap to localStorage', e);
    }
  },

  /**
   * Lấy lộ trình hiện tại từ localStorage hoặc nạp mặc định
   */
  loadRoadmap(): Roadmap100Data {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored roadmap, generating default', e);
    }
    const defaultData = this.generateSample100Days('100 ngày học bán hàng online từ số 0');
    this.saveRoadmap(defaultData);
    return defaultData;
  },

  /**
   * Lấy danh sách tất cả các dự án 100 ngày đã lưu
   */
  getAllProjects(): Roadmap100Data[] {
    const PROJECTS_LIST_KEY = 'remotion_roadmap_100_projects_v1';
    try {
      const raw = localStorage.getItem(PROJECTS_LIST_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {
      console.warn('Failed to load projects list', e);
    }

    // Nếu chưa có danh sách, đưa active project vào làm dự án đầu tiên
    const current = this.loadRoadmap();
    const initialList = [current];
    try {
      localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(initialList));
    } catch {}
    return initialList;
  },

  /**
   * Lưu hoặc cập nhật một dự án vào kho danh sách
   */
  saveProjectToList(data: Roadmap100Data): Roadmap100Data[] {
    const PROJECTS_LIST_KEY = 'remotion_roadmap_100_projects_v1';
    const list = this.getAllProjects();
    const index = list.findIndex((p) => p.id === data.id);

    const updatedProject = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    let nextList: Roadmap100Data[];
    if (index >= 0) {
      nextList = [...list];
      nextList[index] = updatedProject;
    } else {
      nextList = [updatedProject, ...list];
    }

    try {
      localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage limit reached while saving project list', e);
    }
    return nextList;
  },

  /**
   * Xóa một dự án khỏi kho danh sách
   */
  deleteProject(id: string): Roadmap100Data[] {
    const PROJECTS_LIST_KEY = 'remotion_roadmap_100_projects_v1';
    const list = this.getAllProjects();
    const nextList = list.filter((p) => p.id !== id);
    try {
      localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('Failed to save project list after delete', e);
    }
    return nextList;
  },

  /**
   * Nhân bản một dự án
   */
  duplicateProject(project: Roadmap100Data): Roadmap100Data {
    const cloned: Roadmap100Data = {
      ...project,
      id: `roadmap-${Date.now()}`,
      topic: `${project.topic} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveProjectToList(cloned);
    return cloned;
  },

  /**
   * Parse chuỗi JSON dán vào từ ChatGPT/Gemini
   */
  parseRoadmapJson(jsonStr: string, currentTopic?: string): RoadmapDayItem[] {
    let clean = jsonStr.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch (err: any) {
      throw new Error('Định dạng JSON không hợp lệ! Vui lòng kiểm tra lại dấu ngoặc và dấu phẩy.');
    }

    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.days)) {
      rawList = parsed.days;
    } else if (parsed && Array.isArray(parsed.roadmap)) {
      rawList = parsed.roadmap;
    } else if (parsed && Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else {
      throw new Error('JSON không chứa mảng danh sách ngày!');
    }

    if (rawList.length === 0) {
      throw new Error('Danh sách ngày trong JSON rỗng!');
    }

    const normalizedDays: RoadmapDayItem[] = rawList.map((item, idx) => {
      const dayNum = Number(item.day || item.ngay || idx + 1);
      return {
        day: dayNum,
        title: String(item.title || item.tieuDe || item.name || `Ngày ${dayNum}`),
        taskAction: String(item.taskAction || item.action || item.task || item.nhiemVu || item.quayChup || 'Quay video/chụp ảnh theo chủ đề trong ngày'),
        category: String(item.category || item.theLoai || 'Video ngắn'),
        centerMedia: {
          type: (item.centerMedia?.type || item.mediaType || 'none') as any,
          url: String(item.centerMedia?.url || item.mediaUrl || ''),
          name: String(item.centerMedia?.name || '')
        },
        bts: {
          description: String(item.btsDescription || item.bts?.description || item.hauTruong || 'Chuẩn bị góc máy, ánh sáng và kịch bản'),
          imageUrl: String(item.bts?.imageUrl || item.btsImageUrl || '')
        },
        benefit: String(item.benefit || item.loiIch || item.ketQua || 'Nâng cao kỹ năng và kéo thêm lượng người theo dõi mới'),
        status: (item.status === 'completed' ? 'completed' : item.status === 'in_progress' ? 'in_progress' : 'todo') as any
      };
    });

    return normalizedDays;
  }
};
