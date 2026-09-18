# 🔴 Lá Đỏ Homestay - Trợ lý AI YouTube Auto Reply Extension

Tiện ích mở rộng Chrome chuyên biệt dành riêng cho việc **Quét bình luận** và **Tự động trả lời bằng Trợ lý AI trên YouTube (Video, Shorts, Community)** cho **Lá Đỏ Homestay Sa Pa**.

---

## 📂 Cấu trúc thư mục độc lập

```text
lado-youtube-extension/
├── manifest.json         # Cấu hình Manifest V3 Chrome Extension dành riêng cho YouTube
├── background.js        # Service Worker xử lý AI Groq (Llama-3.3 70B & DeepSeek R1) & Backend API
├── content-youtube.js   # Script quét DOM YouTube, chèn nút ✨ AI Lá Đỏ, định vị & highlight bình luận
├── popup.html           # Giao diện điều khiển chính của Extension
├── popup.css            # Giao diện hiện đại tông màu Lá Đỏ & YouTube Ruby Red
├── popup.js             # Logic quét tab YouTube, sinh AI hàng loạt, gửi trả lời tự động
├── styles.css           # CSS inject hiệu ứng viền phát sáng & thông báo nổi trong trang YouTube
├── icons/               # Bộ icon tiện ích (16px, 48px, 128px)
└── README.md            # Tài liệu hướng dẫn sử dụng
```

---

## 🚀 Cách mở làm việc riêng trong Antigravity IDE (Cửa sổ mới)

Để mở riêng workspace này trong một cửa sổ Antigravity IDE khác độc lập với dự án Homestay chính:

1. Trong Antigravity IDE, chọn **File** > **New Window** (hoặc phím tắt `Ctrl + Shift + N`).
2. Ở cửa sổ mới mở ra, chọn **File** > **Open Folder...** (hoặc `Ctrl + K Ctrl + O`).
3. Chọn đường dẫn:
   ```text
   D:\Work_Code_22_26\SEP490\Homestay_Management_System\lado-youtube-extension
   ```
4. Giờ bạn có một không gian làm việc hoàn toàn độc lập, nhẹ nhàng, chuyên biệt để phát triển tiện ích YouTube!

---

## 💻 Cách cài đặt vào Trình duyệt (Chrome / Brave / Edge / Cốc Cốc)

1. Mở trình duyệt Chrome và truy cập: `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
3. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.
4. Chọn thư mục:
   ```text
   D:\Work_Code_22_26\SEP490\Homestay_Management_System\lado-youtube-extension
   ```
5. Ghim (Pin) icon tiện ích **Lá Đỏ Homestay** lên thanh công cụ của trình duyệt.

---

## ✨ Các tính năng nổi bật

### 1. Quét bình luận trên YouTube
- Mở bất kỳ video nào trên YouTube (hoặc video Shorts).
- Bấm vào icon tiện ích > Bấm **"🔍 Quét video YouTube"**.
- Extension sẽ quét toàn bộ bình luận của khán giả, hiển thị avatar, tên người xem, nội dung bình luận và tiêu đề video.

### 2. Trả lời trực tiếp ngay trên trang YouTube
- Dưới mỗi bình luận trên YouTube sẽ tự động xuất hiện nút **"✨ AI Lá Đỏ"**.
- Bấm nút này: AI sẽ tự động hiểu ngữ cảnh video và bình luận, viết câu trả lời chuẩn xác và tự điền + gửi phản hồi!

### 3. Tùy chọn nhiều phong cách AI (Tones)
- 🌿 **Thân thiện & Lịch thiệp**: Giọng điệu ấm áp, mến khách của người làm du lịch Sa Pa.
- 📅 **Tư vấn phòng & Báo giá**: Hướng dẫn các hạng phòng view thung lũng Mường Hoa, hotline/zalo.
- ❤️ **Cảm ơn & Tri ân**: Lời cảm ơn chân thành tới người xem.
- 🎁 **Tặng mã ưu đãi 10%**: Giới thiệu khuyến mãi và combo nướng BBQ.

### 4. Định vị & Highlight bình luận thông minh
- Bấm nút **"🔗 Xem video / vị trí"** hoặc **"👀 Kiểm tra"** trong danh sách:
- Tiện ích sẽ mở video YouTube và tự động cuộn đến đúng bình luận mục tiêu, viền sáng màu cam rực rỡ kèm thông báo nổi xác nhận!
