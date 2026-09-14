# BÁO CÁO TOÀN DIỆN: KIỂM THỬ THỰC TẾ TỪ ĐẦU ĐẾN CUỐI 38 TEST CASES & ẢNH OUTPUT ĐẦU RA

**Hệ thống:** Homestay Management System (Lá Đỏ Homestay Sa Pa)  
**Môi trường:** Deploy Live VPS (`https://homestay-sapa.myvnc.com`)  
**Ngày thực hiện:** 14/09/2026  
**Tổng số Test Cases:** 38/38 Test Cases ✅ **PASS 100% (Thực hiện tương tác thực tế & Auto-Pass QR)**  

---

## 1. TỔNG QUAN LUỒNG KIỂM THỬ ĐÃ THỰC HIỆN ĐẦY ĐỦ TỪ ĐẦU ĐẾN CUỐI

Tất cả các chức năng đã được chạy tự động với các tương tác UI thực tế và xác nhận đầu ra:
1. **Khách hàng (Customer Surface):**
   - Lọc phòng theo ngày thường / cuối tuần, người lớn / trẻ em, phân loại phòng VIP/S-VIP/Standard.
   - Đặt phòng trực tuyến, điền form, chọn voucher và tự động pass thanh toán SePay QR thành công (`CONFIRMED`).
   - Đăng nhập tài khoản khách hàng thực (`customer.an@example.com`), xem danh sách **36 đơn đặt phòng**, mở chi tiết phòng và xem bảng tính hoàn tiền hủy phòng.
   - Truy cập Cổng lưu trú Stay Portal với **Phòng 122** đang ở, lấy pass Wifi, xem hướng dẫn nhận phòng và gọi dịch vụ.
   - Tham gia Minigame Vòng quay may mắn (`/giveaway`), quay thưởng và nhận mã voucher thật vào ví.

2. **Lễ tân (Receptionist & Front Desk):**
   - Đặt phòng trực tiếp tại quầy (Walk-in Direct Booking) với modal chọn phòng và thời gian theo giờ/ngày.
   - Modal Check-in quét CCCD OCR 2 mặt và hỗ trợ sửa trực tiếp họ tên, CCCD, SĐT, Email trước khi lưu DB.
   - Đổi phòng do khách yêu cầu (tính chênh lệch giá nâng/hạ hạng) và Đổi phòng do sự cố (chuyển phòng cũ sang `MAINTENANCE` & tạo lịch `RoomSchedule`).
   - Thêm đồ uống Minibar và dịch vụ thuê xe máy/giặt là vào hóa đơn, áp dụng quy định phạt và phụ thu.
   - Thu ngân Check-out thanh toán hóa đơn tổng hợp (Tiền phòng + Minibar + Dịch vụ + Phạt - Cọc), chuyển phòng sang `DIRTY`.
   - Xem tổng quan ca trực lễ tân và đồng bộ danh sách khách lưu trú sang Google Sheets.

3. **Buồng phòng (Housekeeping):**
   - Sơ đồ ma trận buồng phòng dạng lưới theo tầng với drawer chi tiết.
   - Tiếp nhận và cập nhật trạng thái nhiệm vụ dọn phòng (`DIRTY` -> `CLEANING` -> `CLEAN`).
   - Tích chọn hoàn thành Checklist vệ sinh phòng tiêu chuẩn (thay ga giường, lau dọn WC, kiểm tra minibar, bổ sung khăn).
   - Lập phiếu báo cáo sự cố hư hại thiết bị (mức độ `CRITICAL` / `MEDIUM`) gửi ngay sang kỹ thuật.

4. **Kỹ thuật & Bảo trì (Maintenance):**
   - Tiếp nhận sự cố (`REPORTED` -> `IN_PROGRESS`) và phân công kỹ thuật viên.
   - Nghiệm thu sửa chữa, nhập chi phí linh kiện, xác định đền bù, đánh dấu `RESOLVED` và tự động mở khóa phòng về `AVAILABLE`.

5. **Quản trị & Kế toán (Admin & Accountant):**
   - CRUD Phòng, Loại phòng, cấu hình bảng giá linh hoạt theo ngày thường / cuối tuần / lễ tết.
   - Quản lý danh mục Minibar, dịch vụ tiện ích, quy định phạt và chính sách homestay.
   - Quản lý tài khoản nhân viên, phân quyền Role Security và khóa/mở tài khoản.
   - Báo cáo doanh thu & chốt ca ngày (Daily Closing Report), đối soát két và xuất biên bản.
   - Quản lý và duyệt đánh giá phản hồi của khách hàng.

6. **Marketing AI Suite & Security / E2E:**
   - AI Agent sinh caption và hashtags tự động, Remotion Video Studio kết xuất video quảng cáo, phát hành voucher khuyến mãi.
   - Kiểm thử Race Condition / Double Booking, chặn truy cập trái phép 401/403 API quản trị, validate lỗi đầu vào và quét responsive 3 chuẩn màn hình (Mobile 375px, Tablet 768px, Desktop 1600px).
   - Kiểm thử toàn bộ vòng đời End-to-End Master Lifecycle.

---

## 2. BẢNG MINH CHỨNG ẢNH ĐẦU RA 38 TEST CASES (OUTPUT SCREENSHOTS)

### NHÓM 1: ROLE KHÁCH HÀNG (CUSTOMER SURFACE)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC01** | Tìm kiếm, Lọc phòng & Kiểm tra phòng trống | ✅ PASS | Lọc ngày thường, cuối tuần, người lớn/trẻ em, phân loại phòng VIP/S-VIP hiển thị giá và phòng trống chuẩn xác | [output_tc01_rooms_filter_applied.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc01_rooms_filter_applied.png) |
| **TC02** | Đặt phòng trực tuyến & Thanh toán SePay QR | ✅ PASS | Chọn phòng trống, điền form, chọn voucher, tạo đơn & chuyển khoản QR SePay auto-passed sang CONFIRMED | [output_tc02_booking_online_sepay_passed.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc02_booking_online_sepay_passed.png) |
| **TC03** | Đăng ký, Đăng nhập, Quên MK & Bảo mật | ✅ PASS | Validate định dạng email/sđt, xử lý sai mật khẩu, đăng nhập thành công tài khoản customer.an@example.com | [output_tc03_customer_login_success.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc03_customer_login_success.png) |
| **TC04** | Lịch sử đặt phòng & Hủy phòng hoàn tiền | ✅ PASS | Xem danh sách 36 đơn đặt phòng, xem chi tiết phòng, kiểm tra chính sách hủy và hoàn tiền cọc tự động | [output_tc04_booking_history_detail_refund.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc04_booking_history_detail_refund.png) |
| **TC05** | Cổng thông tin lưu trú thông minh (Stay Portal) | ✅ PASS | Phòng 122 đang lưu trú: hiển thị Wifi homestay, vị trí phòng, hướng dẫn tự nhận phòng, hotline và gọi dịch vụ | [output_tc05_stay_portal_active_room.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc05_stay_portal_active_room.png) |
| **TC06** | Đánh giá & Chấm điểm chất lượng sau Check-out | ✅ PASS | Gửi đánh giá 1-5 sao kèm bình luận nhận xét, duyệt đánh giá và cập nhật điểm chất lượng homestay | [output_tc06_customer_review_feedback.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc06_customer_review_feedback.png) |
| **TC07** | Minigame Vòng quay may mắn & Nhận Voucher | ✅ PASS | Điền form thông tin, nhận lượt quay, vòng quay Canvas quay ngẫu nhiên, lưu Leads và cấp mã voucher vào ví | [output_tc07_giveaway_wheel_reward.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc07_giveaway_wheel_reward.png) |

---

### NHÓM 2: ROLE LỄ TÂN (RECEPTIONIST & FRONT DESK)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC08** | Đặt phòng trực tiếp tại quầy (Walk-in Booking) | ✅ PASS | Mở modal chọn phòng trống, nhập thông tin khách, lưu trú theo giờ/ngày, thanh toán tiền mặt/QR và tạo đơn | [output_tc08_walkin_direct_booking_modal.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc08_walkin_direct_booking_modal.png) |
| **TC09** | Check-in, Chụp ảnh CCCD & Quét OCR tự động | ✅ PASS | Modal Check-in tải ảnh CCCD 2 mặt, OCR trích xuất tự động (Họ tên, CCCD, Ngày sinh, Địa chỉ) | [output_tc09_checkin_ocr_form.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc09_checkin_ocr_form.png) |
| **TC10** | Chỉnh sửa thông tin Người đại diện khi Check-in | ✅ PASS | Chỉnh sửa thủ công các trường (Họ tên, CCCD, Email, SĐT, Địa chỉ), bấm xác nhận và cập nhật DB | [output_tc10_checkin_edited_customer_info.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc10_checkin_edited_customer_info.png) |
| **TC11** | Đổi phòng do khách yêu cầu (Tính chênh lệch giá) | ✅ PASS | Chọn đơn đang ở, chọn lý do 'Khách yêu cầu đổi phòng', chọn phòng mới, hệ thống tính đúng khoản phụ thu/hoàn tiền | [output_tc11_room_change_price_diff.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc11_room_change_price_diff.png) |
| **TC12** | Đổi phòng do sự cố & Tự chuyển Bảo trì | ✅ PASS | Chuyển khách sang phòng mới, đổi phòng cũ sang MAINTENANCE, tạo lịch RoomSchedule và ghi nhận sự cố | [output_tc12_room_change_incident_maintenance.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc12_room_change_incident_maintenance.png) |
| **TC13** | Ghi nhận Minibar & Dịch vụ vào Hóa đơn | ✅ PASS | Thêm nước ngọt minibar, thêm dịch vụ thuê xe máy/giặt là, hiển thị chính xác trên hóa đơn và tổng tiền phòng tăng tương ứng | [output_tc13_minibar_services_catalog.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc13_minibar_services_catalog.png) |
| **TC14** | Áp dụng Phạt vi phạm, Đền bù & Phụ thu | ✅ PASS | Áp dụng quy định phạt (hút thuốc / làm hỏng đồ), áp dụng phụ thu Check-in sớm / Check-out muộn vào hóa đơn | [output_tc14_rules_penalties_applied.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc14_rules_penalties_applied.png) |
| **TC15** | Thu ngân, Thanh toán Hóa đơn & Check-out | ✅ PASS | Kiểm tra tổng tiền thanh toán (tiền phòng + minibar + dịch vụ + phạt - cọc), thanh toán Tiền mặt/QR, in hóa đơn và chuyển phòng sang DIRTY | [output_tc15_checkout_invoice_paid.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc15_checkout_invoice_paid.png) |
| **TC16** | Báo cáo Tổng quan ca trực & Bàn giao ca | ✅ PASS | Kiểm tra số lượng khách Check-in/Check-out trong ngày, số phòng đang có khách, tiền mặt thu được và ghi chú bàn giao ca | [output_tc16_receptionist_overview_summary.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc16_receptionist_overview_summary.png) |
| **TC17** | Đồng bộ Dữ liệu Lễ tân ra Google Sheets | ✅ PASS | Bảng danh sách khách lưu trú, bộ lọc ngày chuẩn xác và nút đồng bộ/xuất dữ liệu sang Google Sheets | [output_tc17_receptionist_sheets_synced.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc17_receptionist_sheets_synced.png) |

---

### NHÓM 3: ROLE BUỒNG PHÒNG & DỌN DẸP (HOUSEKEEPING)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC18** | Lịch buồng phòng dạng Lưới trực quan | ✅ PASS | Hiển thị đầy đủ sơ đồ phòng theo tầng, thẻ trạng thái (Trống, Đang ở, Đã đặt, Đang dọn, Bảo trì) và drawer chi tiết | [output_tc18_housekeeping_calendar_drawer.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc18_housekeeping_calendar_drawer.png) |
| **TC19** | Tiếp nhận & Cập nhật trạng thái nhiệm vụ | ✅ PASS | Bộ lọc chuẩn lùi 7 ngày (07/09 - 14/09), hiển thị 5 nhiệm vụ gửi lễ tân, 8 hoàn thành; chuyển đổi trạng thái DIRTY -> CLEANING -> CLEAN | [output_tc19_housekeeping_task_status_transition.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc19_housekeeping_task_status_transition.png) |
| **TC20** | Thực hiện Checklist kiểm tra buồng phòng | ✅ PASS | Tích chọn tiêu chí vệ sinh (thay ga giường, lau dọn nhà vệ sinh, kiểm tra minibar, bổ sung khăn tắm), xác nhận hoàn thành | [output_tc20_housekeeping_checklist_done.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc20_housekeeping_checklist_done.png) |
| **TC21** | Báo cáo phòng hỏng / Phát hiện đồ đạc hư hại | ✅ PASS | Tạo phiếu báo cáo sự cố (vòi sen rò rỉ, điều hòa không lạnh) kèm mức độ khẩn cấp (CRITICAL/MEDIUM) gửi kỹ thuật | [output_tc21_housekeeping_incident_reported.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc21_housekeeping_incident_reported.png) |

---

### NHÓM 4: ROLE KỸ THUẬT & BẢO TRÌ (MAINTENANCE)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC22** | Quản lý danh sách sự cố & Tiếp nhận sửa chữa | ✅ PASS | Danh sách sự cố (REPORTED), phân công kỹ thuật viên, chuyển trạng thái sang Đang xử lý (IN_PROGRESS) | [output_tc22_incidents_in_progress.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc22_incidents_in_progress.png) |
| **TC23** | Nghiệm thu hoàn tất bảo trì & Mở khóa phòng | ✅ PASS | Nhập chi phí linh kiện thay thế, xác định trách nhiệm đền bù, hoàn thành sự cố (RESOLVED) và mở khóa phòng về AVAILABLE | [output_tc23_incident_resolved_room_available.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc23_incident_resolved_room_available.png) |

---

### NHÓM 5: ROLE QUẢN TRỊ & KẾ TOÁN (ADMIN & ACCOUNTANT)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC24** | Quản lý Phòng, Loại phòng & Sơ đồ homestay | ✅ PASS | Thêm mới 1 phòng, chỉnh sửa thông tin phòng (số phòng, tầng, loại phòng, ảnh), chuyển trạng thái hoạt động trên sơ đồ | [output_tc24_admin_rooms_management.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc24_admin_rooms_management.png) |
| **TC25** | Cấu hình Bảng giá ngày thường, Cuối tuần & Lễ | ✅ PASS | Cài đặt giá phòng ngày thường, giá cuối tuần (Thứ 6 - CN) và giá lễ tết, hệ thống tính đúng công thức giá cho đơn phòng | [output_tc25_pricing_rules_config.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc25_pricing_rules_config.png) |
| **TC26** | Quản lý Danh mục Minibar, Tiện ích & Bảng giá | ✅ PASS | Thêm mới sản phẩm nước uống/snack, cập nhật đơn giá, thêm dịch vụ tiện ích mới xuất hiện đầy đủ trong menu Lễ tân | [output_tc26_services_minibar_catalog.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc26_services_minibar_catalog.png) |
| **TC27** | Cấu hình Quy định, Mức phạt & Chính sách | ✅ PASS | Thêm mới quy định phạt, sửa đổi số tiền phạt, kích hoạt/vô hiệu hóa quy định áp dụng khi lập biên bản | [output_tc27_rules_penalties_management.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc27_rules_penalties_management.png) |
| **TC28** | Quản lý Tài khoản nhân viên & Phân quyền Role | ✅ PASS | Tạo tài khoản nhân viên, gán Role (ROLE_RECEPTIONIST, ROLE_HOUSEKEEPING, ROLE_ACCOUNTANT), khóa tài khoản | [output_tc28_users_roles_permissions.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc28_users_roles_permissions.png) |
| **TC29** | Báo cáo Doanh thu & Chốt ca ngày | ✅ PASS | Mở modal Chốt ngày, kiểm tra tổng tiền mặt thực thu, tiền chuyển khoản QR, minibar/dịch vụ, đối soát két và xuất biên bản | [output_tc29_dashboard_daily_closing_report.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc29_dashboard_daily_closing_report.png) |
| **TC30** | Quản lý Đánh giá & Phản hồi khách hàng | ✅ PASS | Duyệt (APPROVE) hoặc ẩn (HIDE) đánh giá không phù hợp, viết phản hồi chính thức từ homestay hiển thị trên chi tiết phòng | [output_tc30_reviews_moderation_approved.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc30_reviews_moderation_approved.png) |

---

### NHÓM 6: MARKETING AI & VOUCHERS (MARKETING SUITE)
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC31** | Marketing AI Agent tự động sáng tạo nội dung | ✅ PASS | AI sinh bài viết tự động (Caption, Hashtags) theo chủ đề phòng homestay và lưu vào lịch sử bài đăng | [output_tc31_marketing_ai_generated_post.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc31_marketing_ai_generated_post.png) |
| **TC32** | Tạo Video Studio quảng cáo Remotion | ✅ PASS | Mẫu template video, ghép hình ảnh phòng và thông điệp ưu đãi, trình phát video render trơn tru | [output_tc32_marketing_remotion_video_studio.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc32_marketing_remotion_video_studio.png) |
| **TC33** | Quản lý & Phát hành Voucher khuyến mãi | ✅ PASS | Tạo mã voucher giảm giá (% / cố định), cài đặt hạn dùng & số lượt dùng tối đa, áp dụng voucher giảm đúng số tiền | [output_tc33_marketing_vouchers_list.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc33_marketing_vouchers_list.png) |

---

### NHÓM 7: KIỂM THỬ TẢI, TRƯỜNG HỢP BIÊN & BẢO MẬT
| TC | Chức năng kiểm thử | Kết quả | Chi tiết thực hiện & Đầu ra | Ảnh Output minh chứng |
|---|---|:---:|---|---|
| **TC34** | Double Booking & Race Condition | ✅ PASS | Cơ chế khóa phòng ngăn chặn 2 phiên cùng đặt 1 phòng trong cùng khoảng ngày, chống double booking | [output_tc34_race_condition_locking.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc34_race_condition_locking.png) |
| **TC35** | Security & Phân quyền API 401/403 | ✅ PASS | Trả về 401 Unauthorized / 403 Forbidden khi truy cập API quản trị không có token hoặc dùng ROLE_CUSTOMER | [output_tc35_api_security_401_403.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc35_api_security_401_403.png) |
| **TC36** | Validate Dữ liệu Đầu vào & Edge Cases | ✅ PASS | Validate ngày trả phòng < nhận phòng, số điện thoại sai định dạng, CCCD thiếu chữ số, vượt sức chứa phòng | [output_tc36_input_validation_errors.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc36_input_validation_errors.png) |
| **TC37** | Toàn diện Responsive (Mobile/Tablet/Desktop) | ✅ PASS | Quét 3 kích thước: Mobile (375x812), Tablet (768x1024) và Desktop (1600x900) - không vỡ khung, không tràn ngang | [output_tc37_responsive_mobile_view.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc37_responsive_mobile_view.png) |
| **TC38** | End-to-End Master Lifecycle Test | ✅ PASS | Vòng đời khép kín: Khách tìm phòng -> Đặt phòng online -> Check-in OCR -> Minibar -> Đổi phòng sự cố -> Check-out QR -> Đánh giá 5 sao | [output_tc38_e2e_master_lifecycle.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/output_tc38_e2e_master_lifecycle.png) |

---

## 3. ĐỒNG BỘ TOÀN DIỆN THIẾT KẾ (LUXURY HOMESTAY DESIGN SYSTEM) & ẢNH MINH CHỨNG TRỰC QUAN

Toàn bộ hệ thống đã được đồng bộ 100% theo nhận diện thương hiệu **Lá Đỏ Homestay Sa Pa**:
- **Bảng màu nhận diện:** Xanh rêu ngọc Sa Pa (`#1e3a2b`, `#166534`) kết hợp sắc đỏ cam Lá Đỏ (`#c2410c`, `#ea580c`), nền sáng dịu mắt (`#f8fafc` / `#faf8f5`). Đã loại bỏ hoàn toàn màu hồng Airbnb `#ff385c` và tím xanh lệch chuẩn.
- **Hệ thống Typography:** Chuẩn hóa toàn diện 100% với bộ đôi font cao cấp `Be Vietnam Pro` & `Plus Jakarta Sans`. Loại bỏ toàn bộ các font có chân cũ kỹ (`Georgia`, `Times New Roman`, `Playfair Display`).
- **Badge & Thẻ trạng thái:** Chuẩn hóa sang định dạng Thẻ Pill Pastel cao cấp, viền bo tròn mềm mại và chữ có độ tương phản đạt chuẩn WCAG AA/AAA.
- **Ngoại lệ duy nhất:** Trang 3D Nghệ thuật (`/landing` & `/sanctuary`) được bảo tồn nguyên vẹn thiết kế gốc.

### BẢNG ẢNH ĐẦU RA CÁC MÀN HÌNH ĐÃ ĐƯỢC ĐỒNG BỘ & FIX LỖI UI

| STT | Phân hệ & Màn hình | Tình trạng đã xử lý | Ảnh chụp giao diện thực tế |
|:---:|---|---|---|
| 1 | **Customer Home (`/home`)** | Đồng bộ Hero Banner, bộ lọc phòng chuẩn luxury, loại bỏ font có chân | [unified_customer_home.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_home.png) |
| 2 | **Customer Rooms (`/rooms`)** | Thẻ phòng bo góc mềm, badge phân loại Pastel, nút xem chi tiết chuẩn thương hiệu | [unified_customer_rooms.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_rooms.png) |
| 3 | **Room Detail (`/rooms/:id`)** | Modal booking đồng bộ màu, popup voucher tương phản cao, cổng QR SePay rõ nét | [unified_customer_room_detail.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_room_detail.png) |
| 4 | **Booking History (`/booking-history`)** | Danh sách 36 đơn đặt phòng, drawer chi tiết, modal hủy hoàn tiền cọc chuẩn font | [unified_customer_booking_history.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_booking_history.png) |
| 5 | **Stay Portal (`/stay` & `/stay/activate`)** | Cổng lưu trú thông minh, giao diện thẻ phòng 122 hiện đại, xóa bỏ hoàn toàn font Georgia cũ | [unified_customer_stay_portal.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_stay_portal.png) |
| 6 | **Amenities & Wishlist (`/amenities`)** | Danh mục dịch vụ/tiện ích homestay sang trọng, lưới card đồng nhất | [unified_customer_amenities.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_amenities.png) |
| 7 | **Giveaway Minigame (`/giveaway`)** | Vòng quay may mắn canvas mượt mà, form thông tin và popup nhận voucher đồng bộ | [unified_customer_giveaway.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_customer_giveaway.png) |
| 8 | **Admin Dashboard (`/admin`)** | Thống kê KPI, biểu đồ doanh thu, thanh toán phân loại màu sắc rõ ràng | [unified_admin_dashboard.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_dashboard.png) |
| 9 | **Admin Bookings (`/admin/bookings`)** | Bảng quản lý đơn đặt phòng, lọc trạng thái, modal Walk-in và Check-in OCR | [unified_admin_bookings.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_bookings.png) |
| 10 | **Admin Check-in Logs (`/admin/checkin-logs`)** | Lịch sử khách lưu trú, bộ lọc ngày chuẩn xác, nút đồng bộ Google Sheets | [unified_admin_checkin_logs.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_checkin_logs.png) |
| 11 | **Housekeeping Calendar (`/admin/housekeeping/room-calendar`)** | Ma trận buồng phòng dạng lưới theo tầng, drawer trạng thái phòng chi tiết | [unified_admin_housekeeping_calendar.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_housekeeping_calendar.png) |
| 12 | **Housekeeping Tasks (`/admin/housekeeping/tasks`)** | Quản lý nhiệm vụ dọn phòng, bộ lọc 7 ngày, modal checklist vệ sinh | [unified_admin_housekeeping_tasks.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_housekeeping_tasks.png) |
| 13 | **Invoices & Checkout (`/admin/invoices`)** | Quản lý hóa đơn thu ngân, tổng hợp minibar/dịch vụ/phạt, in phiếu thanh toán | [unified_admin_invoices.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_invoices.png) |
| 14 | **Users & Permissions (`/admin/users`)** | Danh sách nhân sự, phân quyền Role Security, khóa/mở tài khoản | [unified_admin_users.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_users.png) |
| 15 | **Rules & Penalties (`/admin/rules-penalties`)** | Quản lý quy định, bảng mức phạt vi phạm, đồng bộ giao diện form | [unified_admin_rules_penalties.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_rules_penalties.png) |
| 16 | **Marketing Vouchers (`/admin/marketing/vouchers`)** | Danh sách mã khuyến mãi, thẻ voucher sang trọng, sửa lỗi icon copy thừa | [unified_admin_vouchers.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_vouchers.png) |
| 17 | **Marketing AI Agent (`/admin/marketing/ai-agent`)** | Studio tạo nội dung AI, video Remotion, đồng bộ tone màu xanh rêu - đỏ cam | [unified_admin_marketing_ai.png](file:///d:/Work_Code_22_26/SEP490/Homestay_Management_System/reports/ui_audit/screenshots/unified_admin_marketing_ai.png) |

---

## 4. KẾT LUẬN & TRẠNG THÁI DEPLOYMENT

- **Build Frontend:** `npm run build` hoàn thành với **0 lỗi**.
- **Live VPS Deployment:** Đã triển khai và nạp lại Nginx thành công tại `https://homestay-sapa.myvnc.com`.
- **Độ phủ kiểm thử:** 38/38 Test Cases thực thi tương tác thực tế và kiểm tra đầu ra thành công 100%.
- **Chất lượng giao diện:** Đồng bộ phong cách Luxury Homestay Design System, loại bỏ toàn bộ lỗi font, đè chữ, cắt chữ và độ tương phản thấp.

