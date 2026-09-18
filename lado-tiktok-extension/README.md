# 🎵 Lá Đỏ Homestay - Trợ lý AI TikTok Auto Reply Extension

Tiện ích mở rộng Chrome chuyên biệt dành riêng cho việc **Quét bình luận** và **Tự động trả lời bằng Trợ lý AI trên TikTok (Video, Photo, Feed, Creator Center)** cho **Lá Đỏ Homestay Sa Pa**.

---

## 📂 Cấu trúc thư mục độc lập

```text
lado-tiktok-extension/
├── manifest.json         # Cấu hình Manifest V3 Chrome Extension dành riêng cho TikTok
├── background.js        # Service Worker xử lý AI Groq (Llama-3.3 70B & DeepSeek R1) phong cách TikTok
├── content-tiktok.js    # Script quét DOM TikTok, chèn nút ✨ AI Lá Đỏ, định vị & highlight bình luận
├── popup.html           # Giao diện điều khiển chính của Extension
├── popup.css            # Giao diện hiện đại tông màu Lá Đỏ & TikTok Neon Cyan/Pink
├── popup.js             # Logic quét tab TikTok, sinh AI hàng loạt, gửi phản hồi tự động
├── styles.css           # CSS inject hiệu ứng viền phát sáng & thông báo nổi trong trang TikTok
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
   D:\Work_Code_22_26\SEP490\Homestay_Management_System\lado-tiktok-extension
   ```
4. Giờ bạn có một không gian làm việc hoàn toàn độc lập, chuyên biệt để phát triển tiện ích TikTok!

---

## 💻 Cách cài đặt vào Trình duyệt (Chrome / Brave / Edge / Cốc Cốc)

1. Mở trình duyệt Chrome và truy cập: `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
3. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.
4. Chọn thư mục:
   ```text
   D:\Work_Code_22_26\SEP490\Homestay_Management_System\lado-tiktok-extension
   ```
5. Ghim (Pin) icon tiện ích **Lá Đỏ Homestay** lên thanh công cụ của trình duyệt.

---

## ✨ Các tính năng nổi bật

### 1. Quét bình luận trên TikTok
- Mở bất kỳ video nào trên TikTok (web hoặc creator center).
- Mở bảng bình luận của video > Bấm icon tiện ích > Bấm **"🔍 Quét video TikTok"**.
- Extension sẽ quét toàn bộ bình luận, hiển thị avatar, tên người dùng, nội dung bình luận và caption video.

### 2. Trả lời trực tiếp ngay trên trang TikTok
- Dưới mỗi bình luận trên TikTok sẽ tự động xuất hiện nút **"✨ AI Lá Đỏ"**.
- Bấm nút này: AI sẽ tự động hiểu ngữ cảnh video TikTok và bình luận, viết câu trả lời trẻ trung, đúng phong cách TikTok và tự động điền + đăng phản hồi!

### 3. Tùy chọn nhiều phong cách AI (Tones)
- 🌿 **Trẻ trung & Bắt trend**: Giọng điệu thân thiện, dễ thương, dùng emoji sinh động.
- 📅 **Báo giá & Tư vấn phòng Bio**: Hướng dẫn nhắn tin qua Bio/Zalo để nhận giá hạt dẻ và giữ phòng view mây.
- ❤️ **Thả tim & Cảm ơn**: Lời cảm ơn chân thành, dễ thương tới người xem TikTok.
- 🎁 **Ưu đãi 10% TikTok**: Tặng mã giảm giá 10% và voucher cafe săn mây độc quyền cho follower TikTok.

### 4. Định vị & Highlight bình luận thông minh
- Bấm nút **"🔗 Xem video / vị trí"** hoặc **"👀 Kiểm tra"** trong danh sách:
- Tiện ích sẽ mở video TikTok và tự động cuộn đến đúng bình luận mục tiêu, viền sáng màu cam rực rỡ kèm thông báo nổi xác nhận!
