# 🧪 Lá Đỏ Homestay - Form Auto Tester Chrome Extension

Extension hỗ trợ kiểm thử và tự động điền form (Đặt phòng, Multi-room, Check-in, CCCD, Login, Register) cho hệ thống Lá Đỏ Homestay.

---

## 🚀 Hướng dẫn cài đặt vào Google Chrome (10 giây)

1. Mở trình duyệt Google Chrome, truy cập: `chrome://extensions/`
2. Bật công tắc **Developer mode (Chế độ dành cho nhà phát triển)** ở góc trên bên phải.
3. Bấm nút **Load unpacked (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn đúng thư mục:
   `D:\Work_Code_22_26\SEP490\Homestay_Management_System\lado-form-tester-extension`
5. Tiện ích **"Lá Đỏ Homestay - Form Auto Tester"** sẽ xuất hiện trên thanh công cụ Chrome!

---

## ✨ Tính năng nổi bật

1. **⚡ Điền Nhanh Hợp Lệ (Mặc định chuẩn 100% đúng validate)**:
   * Chỉ cần 1 click (nút lớn trên popup hoặc widget nổi trên trang web).
   * Tự động nhận diện form đang mở và điền:
     * **Họ tên**: `Nguyễn Văn An`
     * **Số điện thoại**: `0912345678` (10 chữ số chuẩn regex `^0\d{9}$`)
     * **Email**: `nguyenvanan.test@gmail.com`
     * **CCCD**: `001200012345` (12 số chuẩn CCCD)
     * **Địa chỉ**: `031 Hoàng Liên, TT. Sa Pa, Lào Cai`
     * **Khách đại diện từng phòng (Multi-Room)**: Điền đầy đủ tên và email cho Phòng 1, Phòng 2, Phòng 3...
2. **🧪 Danh sách Test Cases kiểm thử Validation**:
   * **Lỗi SĐT**: SĐT ngắn (8 số), SĐT không có số 0 đầu, SĐT chứa chữ cái.
   * **Lỗi Email**: Email thiếu `@`, Email thiếu domain `.com/.vn`.
   * **Lỗi CCCD**: CCCD thiếu số (9 số), CCCD chứa ký tự chữ.
   * **Lỗi Họ tên**: Tên chứa ký tự đặc biệt `@#$`.
   * **Giá trị biên**: Tên & Email dài 80+ ký tự để test layout.
3. **🪄 Widget Nổi (Floating Widget) tiện lợi ngay trên trang web**:
   * Khi mở trang web homestay (Local hay Ngrok), ở góc dưới màn hình sẽ có sẵn thanh công cụ nổi với các nút:
     * `⚡ Điền Hợp Lệ`
     * `📋 Test Cases ▾`
     * `🧹 Xóa`
     * Thu nhỏ / Mở rộng tiện lợi.
4. **🔒 Không can thiệp code dự án**:
   * Tương thích 100% với React state thông qua cơ chế dispatch native input events chuẩn.
