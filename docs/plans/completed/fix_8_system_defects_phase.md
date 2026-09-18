# Completed Plan: Khắc Phục 8 Lỗi Hệ Thống Quản Lý Homestay & Triển Khai Deploy

## Mục Tiêu & Yêu Cầu
- Thực hiện sửa tuần tự từng lỗi (1 lỗi / 1 bước), kiểm tra xác thực chặt chẽ (test / proof / output analysis) trước khi chuyển sang lỗi tiếp theo.
- Tuyệt đối không sửa gộp tất cả cùng lúc để tránh rủi ro phát sinh hồi quy (regression).
- Sau khi hoàn thành và nghiệm thu đầy đủ cả 8 lỗi, tiến hành build và đẩy code lên VPS deploy `14.225.253.234` (domain `https://homestay-sapa.myvnc.com`).

---

## Danh Sách 8 Lỗi Đã Khắc Phục & Nghiệm Thu

- [x] **Lỗi 1: Thanh toán tiền mặt / Check-out tiền mặt chưa lưu vào Invoice & chưa gen hóa đơn điện tử**
  - Backend: `AdminBookingServiceImpl.java`, `CheckoutInvoiceEmailServiceImpl.java`, `AdminInvoiceServiceImpl.java` - cập nhật/tạo Invoice khi thanh toán tiền mặt và hoàn tất check-out, gán `Payment` CASH, tính `paidAmount`, lưu snapshot hóa đơn điện tử vào hệ thống qua `InvoiceStorageService.saveInvoiceHtml`.
  - Frontend: `AdminInvoicesPage.jsx` - hiển thị chính xác các hóa đơn thanh toán bằng tiền mặt.
  - Proof & Test: Đã chạy test-compile và unit tests liên quan đến checkout và invoice storage.

- [x] **Lỗi 2: Overbooking do bỏ sót Unassigned Bookings - Phòng hết phòng nhưng web vẫn cho đặt**
  - Backend: `AdminCheckInRegistrationServiceImpl.java` - dùng `BookingInventoryPolicy::blocksInventory` tính toán chính xác phòng khả dụng theo khoảng thời gian thực, tính cả các đơn online đã xác nhận nhưng chưa gán phòng vật lý.
  - Proof & Test: Đã kiểm tra kiểm thử đơn vị `AdminCheckInRegistrationServiceImplTest` với 7/7 test passed.

- [x] **Lỗi 3: Giờ ở thêm / Quá hạn hiển thị `+X ngày` thay vì `+96h`**
  - Frontend: `stayOverdue.js`, `AdminCheckInLogsPage.jsx`, `ReceptionistOverviewPage.jsx` - chuẩn hóa hàm format giờ trễ/ở thêm: khi `>= 24h`, quy đổi thành `+X ngày` (hoặc `+X ngày Y giờ` / `+X ngày` gọn gàng).
  - Proof & Test: Build thành công, kiểm tra logic quy đổi giờ sang ngày.

- [x] **Lỗi 4: Bộ lọc ngày trong Nhật ký lưu trú & Hóa đơn**
  - Frontend: `AdminCheckInLogsPage.jsx`, `AdminInvoicesPage.jsx` - `fromDate` mặc định 7 ngày trước, `toDate` mặc định `null` / rỗng (không chặn ngày kết thúc khi chưa chọn).
  - Backend: `AdminBookingServiceImpl.java` - hỗ trợ lọc linh hoạt khi `toDate` rỗng.
  - Proof & Test: Build frontend thành công.

- [x] **Lỗi 5: Đổi email lúc check-in cho đơn nhiều phòng - Đồng bộ email**
  - Backend & Frontend: `AdminCheckInRegistrationServiceImpl.java`, `AdminBookingServiceImpl.java` - khi khách đổi email người đại diện tại thời điểm check-in cho một phòng trong đơn nhiều phòng, tự động đồng bộ email mới cho các `BookingDetail` còn lại chưa check-in và tài khoản khách hàng `Customer`.
  - Proof & Test: Đã chạy `AdminCheckInRegistrationServiceImplTest` pass 100%.

- [x] **Lỗi 6: Link dịch vụ / lưu trú gửi về email bị dính `localhost:5173`**
  - Backend: `StayAccessEmailListener.java`, `MarketingSocialAccountConnectorImpl.java`, `GiveawayServiceImpl.java`, `application.properties` - cấu hình `app.frontend.base-url` và `app.public-base-url` mặc định là `https://homestay-sapa.myvnc.com` thay vì localhost.
  - Proof & Test: Đã chạy `StayAccessEmailListenerTest` pass 100%.

- [x] **Lỗi 7: Người dùng chưa đăng nhập nhập 2 email cho 2 phòng bị gửi chung 1 email**
  - Frontend & Backend: `PublicBookingRoomRequest.java`, `PublicBookingServiceImpl.java`, `SePayPaymentServiceImpl.java`, `RoomsPage.jsx` - payload hỗ trợ gửi `customerEmail` riêng cho từng phòng trong danh sách đặt phòng và backend lưu chính xác vào từng `BookingDetail`.
  - Proof & Test: Đã chạy `PublicBookingServiceImplTest` & `SePayPaymentServiceImplTest` pass 21/21 tests.

- [x] **Lỗi 8: Bỏ "Dạng Thẻ Trực Quan", mặc định "Lịch Tuần" và hiện đúng đơn tương lai trên Lịch Tuần**
  - Frontend: `AdminBookingsPage.jsx` - loại bỏ toggle view mode, mặc định hiển thị Lịch Tuần (Timeline); dùng `overlapsDay` cho các ô ngày trong lưới phòng để đơn đặt phòng nhiều ngày hiển thị liên tục qua các ngày lưu trú thay vì hiển thị "Trống".
  - Proof & Test: Build Frontend Vite thành công với `npm run build`.

- [x] **Triển khai Deploy lên Server VPS (`14.225.253.234`)**
  - Đã đóng gói JAR `homestayManagement-0.0.1-SNAPSHOT.jar` và Frontend bundle `dist.tar.gz`.
  - Đã tải lên VPS `14.225.253.234`, giải nén vào `/var/www/homestay/dist/` và `/opt/homestay/app.jar`.
  - Đã khởi động lại `homestay.service` và `nginx`, xác nhận `active (running)`.
  - Đã kiểm tra trực tiếp domain `https://homestay-sapa.myvnc.com` và API `/api/rooms` phản hồi HTTP 200 thành công.
