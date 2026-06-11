

PHÂN HỆ 1: TÀI KHOẢN & PHÂN QUYỀN (RBAC)
Phân hệ này chịu trách nhiệm cho các tính năng: Đăng nhập, đăng ký, xác thực tài khoản qua email, xem profile cá nhân và quản lý (CRUD) tài khoản nhân viên/khách hàng.
1. Bảng roles (Vai trò/Quyền hạn)
   Ý nghĩa: Lưu trữ danh sách các quyền cố định để phân chia không gian làm việc trên giao diện React và chặn API bảo mật ở Spring Security.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã định danh quyền.
   name (varchar(20), Duy nhất, Bắt buộc): Tên quyền (ROLE_ADMIN, ROLE_CUSTOMER, ROLE_RECEPTIONIST, ROLE_HOUSEKEEPING, ROLE_MARKETING).
   description (varchar(200)): Mô tả phạm vi quyền hạn.
2. Bảng accounts (Tài khoản đăng nhập chung)
   Ý nghĩa: Lưu thông tin bảo mật cốt lõi để chạy luồng Login/Logout bằng JWT Token. Cả nhân viên và khách hàng đều dùng chung bảng này để đăng nhập.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã tài khoản.
   email (varchar(50), Duy nhất, Bắt buộc): Email đăng nhập (Username).
   password (varchar(255), Bắt buộc): Mật khẩu đã mã hóa (BCrypt).
   role_id (bigint, Khóa ngoại - FK): Trỏ về roles(id) để xác định quyền.
   is_active (boolean, Bắt buộc): Trạng thái hoạt động (true là đang chạy, false là bị Admin khóa tài khoản).
   created_at (datetime): Thời gian tạo tài khoản.
3. Bảng customers (Thông tin Profile Khách hàng)
   Ý nghĩa: Lưu thông tin cá nhân đặc thù của Khách hàng, phục vụ luồng đặt phòng, tích điểm và marketing.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã khách hàng.
   account_id (bigint, Khóa ngoại - FK): Trỏ về tài khoản đăng nhập accounts(id).
   full_name (varchar(100), Bắt buộc): Họ và tên khách hàng.
   phone (varchar(10)): Số điện thoại liên lạc.
   address (varchar(255)): Địa chỉ thường trú.
   avatar_url (varchar(255)): Link ảnh đại diện lưu trên Cloudinary.
   date_of_birth (date): Ngày tháng năm sinh.
4. Bảng employees (Thông tin Profile Nhân viên)
   Ý nghĩa: Quản lý hồ sơ nhân sự nội bộ, tính toán bảng lương và gán trách nhiệm công việc (buồng phòng, tiếp tân).
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã nhân viên.
   account_id (bigint, Khóa ngoại - FK): Trỏ về tài khoản đăng nhập accounts(id).
   full_name (varchar(100), Bắt buộc): Họ và tên nhân viên.
   phone (varchar(15)): Số điện thoại.
   address (varchar(255)): Địa chỉ.
   avatar_url (varchar(255)): Link ảnh đại diện của nhân viên.
   status (varchar(20)): Trạng thái lao động (WORKING - đang làm, RESIGNED - đã nghỉ việc).
   date_of_birth (date): Ngày sinh của nhân viên.
   PHÂN HỆ 2: QUẢN LÝ PHÒNG VÀ LỊCH TRÌNH (ROOM & SCHEDULE)
   Phân hệ quản lý 15 phòng thực tế, album ảnh và lịch trình trạng thái động của phòng theo thời gian để thuật toán check phòng trống chạy chính xác.
5. Bảng room_types (Cấu hình Loại phòng)
   Ý nghĩa: Quản lý thông tin định giá và sức chứa tiêu chuẩn của nhóm phòng.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã loại phòng.
   name (varchar(100), Bắt buộc): Tên loại phòng (Studio, Deluxe, Family...).
   base_price (decimal(10,2), Bắt buộc): Giá thuê tiêu chuẩn.
   max_adults (int, Bắt buộc): Số người lớn tối đa ở trong phòng.
   max_children (int, Bắt buộc): Số trẻ em tối đa ở trong phòng.
   description (text): Bài viết mô tả chi tiết phòng.
6. Bảng rooms (Phòng vật lý thực tế)
   Ý nghĩa: Định danh 15 phòng có thực trong homestay (Trường status đã được bốc tách ra bảng lịch trình theo góp ý của Thầy).
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã phòng thực tế.
   room_number (varchar(10), Duy nhất, Bắt buộc): Số phòng (101, 102, 201...).
   room_type_id (bigint, Khóa ngoại - FK): Thuộc nhóm loại phòng nào, trỏ về room_types(id).
7. Bảng room_images (Bộ sưu tập ảnh phòng)
   Ý nghĩa: Cho phép mỗi phòng vật lý sở hữu một bộ ảnh riêng biệt, độc lập không trùng nhau.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã ảnh.
   room_id (bigint, Khóa ngoại - FK): Thuộc về phòng nào, trỏ về rooms(id).
   image_url (varchar(255), Bắt buộc): Link ảnh lưu trên Cloudinary.
   is_primary (boolean, Bắt buộc): Đánh dấu ảnh đại diện chính của phòng đó.
8. Bảng room_schedules (Lịch trình & Trạng thái phòng theo thời gian)
   Ý nghĩa: Quản lý trạng thái động của phòng biến thiên theo giờ/ngày, phục vụ tính năng đặt phòng theo giờ và dọn phòng.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã lịch trình.
   room_id (bigint, Khóa ngoại - FK): Phòng nào đang chạy lịch trình này, trỏ về rooms(id).
   start_time (datetime, Bắt buộc): Thời gian bắt đầu trạng thái.
   end_time (datetime, Bắt buộc): Thời gian kết thúc trạng thái.
   status (varchar(20), Bắt buộc): Trạng thái phòng trong khoảng thời gian đó (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE).
   note (varchar(255)): Ghi chú lý do (Ví dụ: "Hỏng điều hòa", "Lịch dọn dẹp phòng 101").
   PHÂN HỆ 3: ĐẶT PHÒNG & NHẬT KÝ CHECK-IN THEO PHÒNG
   Cụm bảng cốt lõi giải quyết bài toán đặt phòng theo giờ và nghiệp vụ đoàn đến rải rác, thực hiện thủ tục Check-in độc lập theo từng phòng.
9. Bảng bookings (Đơn đặt phòng tổng)
   Ý nghĩa: Quản lý thông tin hành chính của chuyến đi. Không chứa thời gian và số lượng người vì đã bốc tách xuống chi tiết phòng đặt.
   Các thuộc tính:
   id (bigint, Khóa chính - PK, Tự tăng): Mã đơn đặt phòng tổng (Booking ID).
   customer_id (bigint, Khóa ngoại - FK): Khách hàng chủ đơn đặt, trỏ về customers(id).
   booking_date (datetime, Bắt buộc): Ngày giờ khách thực hiện đặt đơn trên web.
   status (varchar(20), Bắt buộc): Trạng thái đơn tổng (PENDING, CONFIRMED, COMPLETED, CANCELLED).
10. Bảng booking_details (Chi tiết phòng trong đơn đặt)
    Ý nghĩa: Quản lý thời gian dự kiến và số lượng người phân bổ cho từng phòng riêng biệt trong đơn đặt.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã chi tiết đơn.
    booking_id (bigint, Khóa ngoại - FK): Thuộc đơn đặt nào, trỏ về bookings(id).
    room_id (bigint, Khóa ngoại - FK): Thuộc phòng vật lý nào, trỏ về rooms(id).
    check_in_target (datetime, Bắt buộc): Giờ dự kiến khách vào phòng (Hỗ trợ đặt theo giờ).
    check_out_target (datetime, Bắt buộc): Giờ dự kiến khách trả phòng.
    number_of_adults (int, Bắt buộc): Số người lớn ở phòng này.
    number_of_children (int, Bắt buộc): Số trẻ em ở phòng này.
    price_at_booking (decimal(10,2), Bắt buộc): Chốt giá thuê phòng tại thời điểm đặt.
    rent_type (varchar(20), Bắt buộc): Hình thức thuê (BY_HOUR - theo giờ, BY_NIGHT - theo đêm).
    status (varchar(20), Bắt buộc): Trạng thái riêng của phòng này (CONFIRMED, CANCELLED - Phục vụ luồng hủy lẻ phòng trong đoàn).
11. Bảng check_in_records (Nhật ký nhận/trả phòng thực tế từng phòng)
    Ý nghĩa: Ghi nhận mốc thời gian thực tế khách vào ở để so sánh với mốc tiêu chuẩn, phục vụ tính tiền phạt quá giờ, tính phí vào sớm và gán trách nhiệm nhân viên.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã nhật ký.
    booking_detail_id (bigint, Khóa ngoại - FK): Nối thẳng với phòng đặt cụ thể trong bảng booking_details(id).
    customer_id (bigint, Khóa ngoại - FK): Khách hàng đại diện ở thực tế tại phòng này, trỏ về customers(id).
    housekeeping_id (bigint, Khóa ngoại - FK): Nhân viên buồng phòng dọn dẹp và nghiệm thu phòng sạch trước khi khách vào, trỏ về employees(id).
    receptionist_id (bigint, Khóa ngoại - FK): Nhân viên tiếp tân làm thủ tục Check-in/out, trỏ về employees(id).
    actual_check_in (datetime, Bắt buộc): Giờ thực tế khách vào phòng.
    actual_check_out (datetime, Khả dụng Null): Giờ thực tế khách bàn giao lại phòng.
    early_check_in_fee (decimal(10,2), Mặc định 0.00): Tiền phạt nhận phòng sớm (Spring Boot tự tính).
    late_check_out_fee (decimal(10,2), Mặc định 0.00): Tiền phạt trả phòng muộn (% theo quy định trong ảnh).
    PHÂN HỆ 4: DỊCH VỤ, TIỂU HAO & PHỤ PHÍ MINI-BAR
    Phân hệ bốc tách rõ ràng giữa dịch vụ tiện ích không lo hết hàng và dịch vụ thuê đồ/bán đồ có kiểm soát tồn kho, phụ phí đồ ăn sẵn trong phòng.
12. Bảng facility_services (Dịch vụ tiện ích dùng chung)
    Ý nghĩa: Quản lý các dịch vụ vô hình, dùng chung không giới hạn số lượng trong kho (Ví dụ: Vé bể bơi, Vé phòng gym, Sử dụng sân nướng BBQ...).
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã dịch vụ.
    name (varchar(100), Bắt buộc): Tên dịch vụ tiện ích.
    price (decimal(10,2), Bắt buộc): Giá vé/Lượt sử dụng.
    is_active (boolean, Bắt buộc): Trạng thái còn cung cấp dịch vụ hay không.
13. Bảng inventory_services (Dịch vụ tiêu hao / Thuê đồ - Có kho)
    Ý nghĩa: Quản lý hàng hóa, đồ đạc hữu hình có số lượng giới hạn trong kho hàng của Homestay (Ví dụ: Thuê xe đạp, Thuê xe máy, Dịch vụ giặt ủi đồ tính theo kg...).
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã dịch vụ kho.
    name (varchar(100), Bắt buộc): Tên đồ dùng/dịch vụ.
    price (decimal(10,2), Bắt buộc): Đơn giá thuê hoặc bán.
    quantity_in_stock (int, Bắt buộc): Số lượng hàng thực tế còn trong kho để Spring Boot làm logic trừ kho khi có người sử dụng.
14. Bảng room_mini_bar_items (Danh mục đồ phụ phí đặt sẵn tại phòng)
    Ý nghĩa: Danh sách đồ ăn nhẹ, đồ uống đặt sẵn trong tủ lạnh (Mini-bar) của mỗi phòng để khách tự lấy dùng (Ví dụ: Mì tôm, Bim bim, Lon Coca, Nước suối bổ sung...).
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã mặt hàng phụ phí.
    name (varchar(100), Bắt buộc): Tên mặt hàng.
    price (decimal(10,2), Bắt buộc): Đơn giá tính tiền khi khách bóc vỏ sử dụng.
    quantity_in_stock (int, Bắt buộc): Số lượng tồn kho tổng của mặt hàng này để tiếp tế cho các phòng.
15. Bảng service_usages (Nhật ký khách gọi dịch vụ chung + thuê đồ)
    Ý nghĩa: Lưu vết chi tiết đợt lưu trú nào đã gọi những dịch vụ tiện ích hoặc thuê đồ gì, số lượng bao nhiêu.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã lượt dùng.
    check_in_record_id (bigint, Khóa ngoại - FK): Gắn trực tiếp vào phòng lưu trú nào, trỏ về check_in_records(id).
    facility_service_id (bigint, Khóa ngoại - FK, Khả dụng Null): Mã dịch vụ tiện ích (để trống nếu khách dùng dịch vụ kho).
    inventory_service_id (bigint, Khóa ngoại - FK, Khả dụng Null): Mã dịch vụ kho (để trống nếu khách dùng tiện ích).
    quantity (int, Bắt buộc): Số lượng gọi/thuê.
    price_at_use (decimal(10,2), Bắt buộc): Chốt giá dịch vụ tại thời điểm gọi để lưu vào hóa đơn.
16. Bảng room_amenities_usage (Nhật ký khách dùng đồ Mini-bar phát sinh)
    Ý nghĩa: Ghi nhận số lượng mì tôm, bim bim, nước ngọt... mà khách thực tế đã ăn uống trong phòng để tính tiền phụ phí tủ lạnh khi làm thủ tục dọn phòng/check-out.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã lượt dùng đồ tại phòng.
    check_in_record_id (bigint, Khóa ngoại - FK): Thuộc đợt lưu trú của phòng nào, trỏ về check_in_records(id).
    item_id (bigint, Khóa ngoại - FK): Mặt hàng phụ phí nào bị sử dụng, trỏ về room_mini_bar_items(id).
    quantity_used (int, Bắt buộc): Số lượng thực tế khách đã dùng.
    PHÂN HỆ 5: QUẢN LÝ NỘI QUY & PHÍ PHẠT ĐỘNG (DÂN SỰ)
    Phân hệ quản lý danh mục nội quy giúp Admin cấu hình động các mức tiền phạt trên giao diện React thay vì fix cứng trong code Java.
17. Bảng rules_penalties (Danh mục nội quy và Khung phí phạt)
    Ý nghĩa: Lưu danh sách các quy định của Homestay và số tiền phạt tương ứng khi khách làm hỏng đồ hoặc vi phạm.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã lỗi quy định.
    title (varchar(255), Bắt buộc): Tên nội quy/lỗi vi phạm (Ví dụ: Hút thuốc trong phòng, Làm hỏng xe đạp, Làm rách/loang bẩn chăn ga gối...).
    penalty_amount (decimal(10,2), Bắt buộc): Số tiền phạt mặc định theo quy định (Ví dụ: 200.000đ).
18. Bảng applied_penalties (Biên bản phạt thực tế lúc Check-out)
    Ý nghĩa: Ghi nhận biên bản phạt thực tế áp dụng cho phòng khi làm thủ tục Check-out bàn giao phòng.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã biên bản phạt.
    check_record_id (bigint, Khóa ngoại - FK): Phạt trên đợt lưu trú của phòng nào, trỏ về check_in_records(id).
    rules_penalty_id (bigint, Khóa ngoại - FK): Vi phạm lỗi gì trong danh mục, trỏ về rules_penalties(id).
    actual_fine (decimal(10,2), Bắt buộc): Số tiền phạt thực tế áp dụng (Nhân viên có quyền gia giảm dựa trên mức độ hỏng hóc).
    description (varchar(255)): Ghi chú chi tiết hiện trạng vi phạm (Ví dụ: "Hỏng xích xe đạp số 2", "Hút thuốc ở ban công phòng 101").
    PHÂN HỆ 6: TÀI CHÍNH HÓA ĐƠN & MARKETING AI AGENT
19. Bảng invoices (Hóa đơn tài chính tổng)
    Ý nghĩa: Nối thẳng với bookings để tổng hợp mọi chi phí (Tiền tất cả các phòng + Tiền tất cả dịch vụ + Phí phạt nội quy + Phí phạt giờ) của toàn bộ chuyến đi thành một hóa đơn thanh toán duy nhất.
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã hóa đơn.
    booking_id (bigint, Duy nhất, Khóa ngoại - FK): Nối thẳng sang Đơn đặt tổng bookings(id) để thanh toán trọn gói cho toàn bộ chuyến đi.
    employee_id (bigint, Khóa ngoại - FK): Tiếp tân lập hóa đơn, trỏ về employees(id).
    room_charge (decimal(10,2), Bắt buộc): Tổng tiền thuê phòng gốc.
    penalty_charge (decimal(10,2), Bắt buộc): Tổng tiền phạt (Cộng dồn tiền phạt giờ từ check_in_records + tiền phạt nội quy từ applied_penalties).
    service_charge (decimal(10,2), Bắt buộc): Tổng tiền dịch vụ gọi thêm và phụ phí đồ ăn uống mini-bar.
    total_amount (decimal(10,2), Bắt buộc): Số tiền khách thực tế phải trả sau cùng (room_charge + penalty_charge + service_charge).
    created_at (datetime): Ngày giờ xuất hóa đơn.
20. Bảng payments (Lịch sử giao dịch thanh toán)
    Ý nghĩa: Quản lý dòng tiền thanh toán thực tế (Tiền mặt, VNPay/MoMo Sandbox).
    Các thuộc tính:
    id (bigint, Khóa chính - PK, Tự tăng): Mã giao dịch.
    invoice_id (bigint, Khóa ngoại - FK): Thuộc hóa đơn nào, trỏ về invoices(id).
    payment_method (varchar(20), Bắt buộc): Phương thức (CASH, VNPAY, MOMO, BANK_TRANSFER).
    transaction_no (varchar(100)): Mã đối soát giao dịch của cổng thanh toán online trả về.
    amount (decimal(10,2), Bắt buộc): Số tiền đổ vào hệ thống.
    status (varchar(20), Bắt buộc): Trạng thái (PENDING, SUCCESS, FAILED).
    payment_time (datetime): Thời gian giao dịch thành công.
21. Bảng vouchers (Mã giảm giá Khuyến mãi)
    Các thuộc tính: id (bigint, PK), code (varchar(20), Duy nhất), discount_type (varchar(20)), min_order_value (decimal(10,2)), max_discount_amount (decimal(10,2)), start_date (datetime), end_date (datetime), usage_limit (int), used_count (int), discount_value (decimal(10,2)).
22. Bảng customer_loyalty (Ví tích điểm của khách)
    Các thuộc tính: id (bigint, PK), current_points (int), total_earned_points (int). Bảng này có quan hệ 1-1 nối với bảng customers để theo dõi điểm.
23. Bảng ai_agent_configs (Cấu hình AI Agent - BẢNG ĐỘC LẬP SYSTEM)
    Các thuộc tính: id (bigint, PK), agent_name (varchar(50)), system_prompt (text), posting_interval_hours (int), is_active (boolean).
24. Bảng marketing_posts (Bài viết tự động của AI Agent)
    Các thuộc tính: id (bigint, PK), platform (varchar(20)), generated_content (text), media_url (varchar(255)), scheduled_at (datetime), posted_at (datetime), status (varchar(20)), external_post_id (varchar(100)), creator_id (bigint, FK), agent_config_id (bigint, Khóa ngoại - FK trỏ về ai_agent_configs(id) để biết bài đăng do agent nào sinh ra).
    III. TỔNG HỢP MỐI QUAN HỆ ĐƯỜNG NỐI TRÊN ERD (CHO TEAM VẼ HÌNH)
    Khi các bạn dùng Draw.io hoặc Lucichart nối các bảng bằng ký hiệu chân chim (Crow's Foot), hãy thực hiện nối các cặp khóa chính - khóa ngoại theo đúng logic này:
    roles(id) $\rightarrow$ 1 : N $\rightarrow$ accounts(role_id)
    accounts(id) $\rightarrow$ 1 : 1 $\rightarrow$ customers(account_id)
    accounts(id) $\rightarrow$ 1 : 1 $\rightarrow$ employees(account_id)
    room_types(id) $\rightarrow$ 1 : N $\rightarrow$ rooms(room_type_id)
    rooms(id) $\rightarrow$ 1 : N $\rightarrow$ room_images(room_id)
    rooms(id) $\rightarrow$ 1 : N $\rightarrow$ room_schedules(room_id)
    customers(id) $\rightarrow$ 1 : N $\rightarrow$ bookings(customer_id)
    bookings(id) $\rightarrow$ 1 : N $\rightarrow$ booking_details(booking_id)
    rooms(id) $\rightarrow$ 1 : N $\rightarrow$ booking_details(room_id)
    booking_details(id) $\rightarrow$ 1 : 1 $\rightarrow$ check_in_records(booking_detail_id) (Trọng tâm check-in lẻ theo phòng của Thầy)
    customers(id) $\rightarrow$ 1 : N $\rightarrow$ check_in_records(customer_id)
    employees(id) $\rightarrow$ 1 : N $\rightarrow$ check_in_records(housekeeping_id) (Gán trách nhiệm dọn phòng)
    employees(id) $\rightarrow$ 1 : N $\rightarrow$ check_in_records(receptionist_id)
    check_in_records(id) $\rightarrow$ 1 : N $\rightarrow$ service_usages(check_in_record_id)
    facility_services(id) $\rightarrow$ 1 : N $\rightarrow$ service_usages(facility_service_id)
    inventory_services(id) $\rightarrow$ 1 : N $\rightarrow$ service_usages(inventory_service_id)
    check_in_records(id) $\rightarrow$ 1 : N $\rightarrow$ room_amenities_usage(check_in_record_id)
    room_mini_bar_items(id) $\rightarrow$ 1 : N $\rightarrow$ room_amenities_usage(item_id)
    check_in_records(id) $\rightarrow$ 1 : N $\rightarrow$ applied_penalties(check_record_id)
    rules_penalties(id) $\rightarrow$ 1 : N $\rightarrow$ applied_penalties(rules_penalty_id)
    bookings(id) $\rightarrow$ 1 : 1 $\rightarrow$ invoices(booking_id) (Trọng tâm hóa đơn trọn gói chuyến đi của Thầy)
    employees(id) $\rightarrow$ 1 : N $\rightarrow$ invoices(employee_id)
    invoices(id) $\rightarrow$ 1 : N $\rightarrow$ payments(invoice_id)
    ai_agent_configs(id) $\rightarrow$ 1 : N $\rightarrow$ marketing_posts(agent_config_id)
