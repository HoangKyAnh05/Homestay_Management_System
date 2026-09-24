# BỘ 200 CÂU HỎI & ĐÁP ÁN VẤN ĐÁP DỄ NHỚ BẢO VỆ ĐỒ ÁN SEP490
## HỆ THỐNG QUẢN LÝ VÀ ĐẶT PHÒNG HOMESTAY (HOMESTAY MANAGEMENT SYSTEM)
*(Dành riêng cho sinh viên thuyết trình - Trả lời trực diện, dễ nhớ, tập trung vào nghiệp vụ thực tế, chức năng và cách sử dụng AI)*

---

## MỤC LỤC 8 NHÓM CÂU HỎI TRỌNG TÂM

| Nhóm | Chủ đề chính | Số lượng câu hỏi |
|---|---|---|
| **Nhóm 1** | **NHÓM 1: GIỚI THIỆU ĐỀ TÀI, VAI TRÒ & CÁCH ỨNG DỤNG AI (CÂU 001 - 025)** | 25 câu |
| **Nhóm 2** | **NHÓM 2: CHỨC NĂNG DÀNH CHO KHÁCH HÀNG & NGƯỜI DÙNG (CÂU 026 - 050)** | 25 câu |
| **Nhóm 3** | **NHÓM 3: CHỨC NĂNG DÀNH CHO ADMIN & LỄ TÂN (STAFF) (CÂU 051 - 075)** | 25 câu |
| **Nhóm 4** | **NHÓM 4: LUỒNG ĐẶT PHÒNG, GIỮ CHỖ & HỦY PHÒNG (CÂU 076 - 100)** | 25 câu |
| **Nhóm 5** | **NHÓM 5: LUỒNG CHECK-IN QUÉT CCCD AI & CHECK-OUT HÓA ĐƠN (CÂU 101 - 125)** | 25 câu |
| **Nhóm 6** | **NHÓM 6: THANH TOÁN VNPAY, MOMO, TIỀN MẶT & GỬI EMAIL OTP (CÂU 126 - 150)** | 25 câu |
| **Nhóm 7** | **NHÓM 7: CƠ SỞ DỮ LIỆU, BẢNG & MỐI QUAN HỆ (CÂU 151 - 175)** | 25 câu |
| **Nhóm 8** | **NHÓM 8: CẤU TRÚC THƯ MỤC, CÁCH CHẠY DEMO & XỬ LÝ LỖI (CÂU 176 - 200)** | 25 câu |

---

## NHÓM 1: GIỚI THIỆU ĐỀ TÀI, VAI TRÒ & CÁCH ỨNG DỤNG AI (CÂU 001 - 025)

#### Câu 001: Mục tiêu chính của đề tài Homestay Management System là gì?
- **Trả lời:** Xây dựng hệ thống website hỗ trợ khách hàng tìm kiếm, đặt phòng và thanh toán homestay trực tuyến; đồng thời cung cấp cho chủ homestay và nhân viên công cụ quản lý phòng, check-in số hóa eKYC bằng CCCD và marketing tự động.

#### Câu 002: Hệ thống có bao nhiêu nhóm người dùng chính?
- **Trả lời:** Hệ thống có 3 nhóm người dùng (Role): 1. Customer (Khách hàng) - tìm phòng, đặt và thanh toán. 2. Staff (Lễ tân/Nhân viên) - quét CCCD check-in, check-out, thêm dịch vụ phụ. 3. Admin (Quản trị viên) - xem doanh thu, quản lý phòng, nhân sự và cấu hình.

#### Câu 003: Dự án sử dụng công nghệ chính nào cho Frontend và Backend?
- **Trả lời:** Frontend sử dụng React 19 + Vite. Backend sử dụng Spring Boot (Java 21). Cơ sở dữ liệu sử dụng MySQL 8.0.

#### Câu 004: Bạn đã ứng dụng AI như thế nào để phát triển dự án này?
- **Trả lời:** Nhóm sử dụng AI (như Antigravity/Claude/ChatGPT) làm trợ lý lập trình để sinh khung mã nguồn DTO, Service, Controller, viết test script và tối ưu giao diện; sau đó nhóm trực tiếp kiểm thử (manual test + automation script), sửa lỗi và tích hợp vào hệ thống.

#### Câu 005: Trong website có những tính năng AI nào chạy thực tế?
- **Trả lời:** Có 2 tính năng AI thực tế: 1. AI Chatbot tư vấn khách hàng (dùng LLM trả lời phòng trống, giá cả). 2. Viettel AI CCCD OCR tự động quét ảnh căn cước công dân điền form khi check-in.

#### Câu 006: Tại sao bạn chọn công nghệ Spring Boot cho backend?
- **Trả lời:** Spring Boot là framework Java chuẩn doanh nghiệp, chạy rất ổn định, hỗ trợ sẵn kết nối CSDL (Spring Data JPA) và bảo mật (Spring Security) mạnh mẽ, cộng đồng hỗ trợ lớn.

#### Câu 007: Tại sao bạn chọn React kết hợp Vite cho frontend?
- **Trả lời:** React giúp chia giao diện thành các Component tái sử dụng; Vite giúp tốc độ khởi động server và cập nhật code (Hot Reload) cực nhanh chỉ trong vài mili-giây.

#### Câu 008: Để chạy được toàn bộ dự án trên máy tính cần bật những dịch vụ nào?
- **Trả lời:** Cần bật 3 dịch vụ: 1. MySQL Server (Port 3306). 2. Backend Spring Boot (Port 8080). 3. Frontend React Vite (Port 5173). Ngoài ra có thể bật thêm AI Python Sidecar (Port 8001).

#### Câu 009: Khi thầy cô muốn xem demo thì em sẽ bắt đầu từ trang nào?
- **Trả lời:** Bắt đầu từ Trang chủ khách hàng (Landing Page) -> Thực hiện tìm kiếm phòng -> Đặt phòng -> Sang trang Admin/Staff để thực hiện duyệt đơn và Check-in.

#### Câu 010: Dự án có file hướng dẫn chạy nhanh chỉ bằng 1 cú click không?
- **Trả lời:** Có, trong thư mục gốc có file `CHAY_HE_THONG_1_CLICK.bat` và `start_all_system.bat` tự động khởi động cả Backend và Frontend cùng lúc.

#### Câu 011: Website có chạy được trên điện thoại di động không?
- **Trả lời:** Có, toàn bộ giao diện Frontend được thiết kế Responsive (co giãn linh hoạt) tương thích tốt từ màn hình máy tính bàn, laptop đến điện thoại thông minh.

#### Câu 012: Thông tin bảo mật nhạy cảm (như mật khẩu DB, mã bí mật VNPay) được lưu ở đâu?
- **Trả lời:** Được lưu trong file cấu hình môi trường riêng (`application-local.properties` cho Backend và `.env` cho Frontend) và được đưa vào `.gitignore` để không bị lộ lên GitHub.

#### Câu 013: Nếu AI viết sai một đoạn code thì bạn phát hiện và sửa như thế nào?
- **Trả lời:** Nhóm phát hiện lỗi qua việc chạy thử giao diện, kiểm tra log ở console F12 hoặc log backend Spring Boot, sau đó debug từng dòng code và chỉnh sửa lại logic cho đúng nghiệp vụ.

#### Câu 014: Dự án có hỗ trợ đăng nhập nhanh bằng tài khoản Google không?
- **Trả lời:** Có, hệ thống tích hợp Google OAuth 2.0 (Google Identity Services) cho phép người dùng đăng nhập chỉ với 1 click bằng tài khoản Gmail.

#### Câu 015: Hình ảnh phòng homestay tải lên được lưu trữ ở đâu?
- **Trả lời:** Lưu trữ trên dịch vụ đám mây Cloudinary CDN, trong CSDL MySQL chỉ lưu đường link URL dạng HTTPS để web load ảnh nhanh và nhẹ database.

#### Câu 016: Khi khách quên mật khẩu thì làm thế nào để lấy lại?
- **Trả lời:** Khách bấm 'Quên mật khẩu' -> Nhập Email -> Hệ thống gửi mã OTP 6 chữ số qua Gmail -> Khách nhập đúng OTP thì được đặt mật khẩu mới.

#### Câu 017: Mất bao lâu để hoàn thành dự án này cùng với sự hỗ trợ của AI?
- **Trả lời:** Nhóm hoàn thành trong khoảng 8 - 10 tuần, nhờ AI hỗ trợ nên tiến độ nhanh gấp 2-3 lần so với viết code thủ công từ đầu.

#### Câu 018: Phần khó nhất mà nhóm phải tự giải quyết bằng tay là gì?
- **Trả lời:** Là luồng kiểm tra lịch phòng không bị trùng ngày (Overlap Booking), xử lý chữ ký số bảo mật thanh toán VNPay và map dữ liệu CCCD từ API Viettel AI vào form lưu trú.

#### Câu 019: Hệ thống có thể cài đặt trên máy chủ thực tế (Cloud/VPS) được không?
- **Trả lời:** Hoàn toàn được. Dự án đã được kiểm thử chạy qua Cloudflare Tunnel và đóng gói Maven JAR sẵn sàng deploy lên VPS Ubuntu hoặc Render/Railway.

#### Câu 020: Nếu không có mạng Internet thì hệ thống có chạy được không?
- **Trả lời:** Các chức năng quản lý nội bộ, đặt phòng tại quầy bằng tiền mặt vẫn chạy được qua mạng LAN nội bộ; riêng thanh toán VNPay và quét AI OCR thì cần kết nối Internet.

#### Câu 021: Khách hàng có cần tạo tài khoản mới được xem danh sách phòng không?
- **Trả lời:** Không cần. Khách vãng lai có thể tự do xem danh sách homestay, xem ảnh phòng, xem giá và tiện ích; chỉ khi tiến hành Đặt phòng mới cần đăng nhập hoặc điền thông tin.

#### Câu 022: Điểm khác biệt giữa Homestay và Khách sạn thông thường trong hệ thống là gì?
- **Trả lời:** Homestay cho phép thuê theo từng căn villa nguyên căn hoặc thuê từng phòng lẻ, có kèm các dịch vụ trải nghiệm đặc thù như: Tiệc nướng BBQ sân vườn, thuê xe máy tự lái, câu cá...

#### Câu 023: Ai là người tạo tài khoản cho nhân viên lễ tân?
- **Trả lời:** Quản trị viên (Admin) tạo tài khoản cho nhân viên trong trang Quản lý tài khoản và cấp vai trò là `ROLE_STAFF`.

#### Câu 024: Dự án có bao nhiêu màn hình giao diện chính?
- **Trả lời:** Khoảng 15 màn hình chính: Trang chủ, Chi tiết phòng, Đặt phòng & Thanh toán, Lịch sử đặt phòng, Hồ sơ cá nhân, Đăng nhập/Đăng ký, Dashboard Admin, Quản lý phòng, Sơ đồ lịch phòng (Matrix Calendar), Lễ tân Check-in/Check-out, Báo cáo doanh thu...

#### Câu 025: Bạn tự tin nhất với tính năng nào của hệ thống khi trình bày trước hội đồng?
- **Trả lời:** Tính năng Check-in tự động quét CCCD bằng AI (eKYC) và Sơ đồ lịch phòng trực quan (Room Matrix Calendar) giúp lễ tân quản lý phòng nhanh chóng và không bao giờ bị nhầm lẫn.

---

## NHÓM 2: CHỨC NĂNG DÀNH CHO KHÁCH HÀNG & NGƯỜI DÙNG (CÂU 026 - 050)

#### Câu 026: Khách hàng tìm kiếm phòng theo những tiêu chí nào?
- **Trả lời:** Khách tìm theo: Ngày nhận phòng (Check-in), Ngày trả phòng (Check-out), Số lượng khách (Người lớn, trẻ em), Khoảng giá tiền và Tiện ích mong muốn (Bể bơi, bếp, view biển...).

#### Câu 027: Khi khách chọn ngày Check-in là ngày trong quá khứ thì web xử lý sao?
- **Trả lời:** Ô chọn ngày trên giao diện tự động khóa các ngày trong quá khứ, backend cũng validate báo lỗi không cho phép đặt ngày quá khứ.

#### Câu 028: Một khách hàng có thể đặt nhiều phòng trong cùng một chuyến đi không?
- **Trả lời:** Có, khách có thể chọn đặt cả căn homestay gồm nhiều phòng hoặc chọn từng phòng và gộp chung vào 1 đơn đặt phòng duy nhất.

#### Câu 029: Khách hàng có thể hủy đơn đặt phòng của mình không?
- **Trả lời:** Có, khách vào mục 'Lịch sử đặt phòng' và bấm nút 'Hủy đơn'. Hệ thống sẽ tự động tính toán số tiền được hoàn trả dựa trên chính sách hủy phòng.

#### Câu 030: Khách có thể xem lại lịch sử các chuyến đi đã từng ở không?
- **Trả lời:** Có, mục 'Đơn đặt của tôi' hiển thị danh sách tất cả các đơn: Đang chờ thanh toán, Đã xác nhận, Đang lưu trú, Đã hoàn thành và Đã hủy.

#### Câu 031: Sau khi trả phòng, khách hàng đánh giá (Review) homestay ở đâu?
- **Trả lời:** Trong mục chi tiết đơn phòng đã hoàn thành (`COMPLETED`), hệ thống hiện nút 'Đánh giá': Khách chấm từ 1 đến 5 sao và viết bình luận cảm nghĩ.

#### Câu 032: Khách chưa từng ở homestay có đánh giá bừa được không?
- **Trả lời:** Không được. Hệ thống chỉ mở quyền đánh giá cho những tài khoản có đơn phòng đã ở thực tế và đã check-out thành công.

#### Câu 033: Khách hàng có thể cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar) ở đâu?
- **Trả lời:** Khách vào trang 'Hồ sơ cá nhân' (Profile) để cập nhật thông tin và upload ảnh đại diện mới lên Cloudinary.

#### Câu 034: Khách đổi mật khẩu tài khoản như thế nào?
- **Trả lời:** Tại trang Hồ sơ cá nhân, chọn tab 'Đổi mật khẩu' -> Nhập mật khẩu cũ, mật khẩu mới và xác nhận lại mật khẩu mới.

#### Câu 035: Mã giảm giá (Voucher/Coupon) được áp dụng ở bước nào?
- **Trả lời:** Được áp dụng tại màn hình Xác nhận Đặt phòng (Checkout): Khách nhập mã code -> Bấm 'Áp dụng' -> Hệ thống trừ tiền trực tiếp vào tổng bill.

#### Câu 036: Khách có nhận được thông báo sau khi đặt phòng thành công không?
- **Trả lời:** Có, hệ thống tự động gửi 1 email xác nhận chi tiết chứa Mã đơn phòng, ngày giờ, địa chỉ homestay và mã QR Code check-in về hòm thư của khách.

#### Câu 037: Khách hàng có thể nhắn tin hỏi đáp trực tiếp với ai trên web?
- **Trả lời:** Khách có thể chat với Trợ lý ảo AI (Chatbot) ở góc dưới màn hình để được giải đáp 24/7 về giá phòng, nội quy và tiện ích.

#### Câu 038: Khách có thể chọn dịch vụ phụ (Thuê xe máy, BBQ) lúc nào?
- **Trả lời:** Khách có thể chọn ngay lúc đặt phòng trên web hoặc yêu cầu lễ tân thêm vào lúc đang ở homestay.

#### Câu 039: Nếu khách nhập số điện thoại không đúng định dạng thì sao?
- **Trả lời:** Form đăng ký/đặt phòng sẽ báo lỗi đỏ ngay tại ô nhập: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'.

#### Câu 040: Khách hàng có thể xem vị trí Homestay trên bản đồ không?
- **Trả lời:** Có, trang chi tiết homestay có tích hợp bản đồ Google Maps hiển thị đúng tọa độ vị trí của homestay.

#### Câu 041: Chính sách đặt cọc phòng có bắt buộc phải trả 100% không?
- **Trả lời:** Không bắt buộc. Khách có thể chọn thanh toán trước 30% (hoặc 50%) tiền cọc, số còn lại sẽ thanh toán khi đến nhận phòng.

#### Câu 042: Khách xem nội quy của homestay (Giờ giấc, thú cưng, hút thuốc) ở đâu?
- **Trả lời:** Mục 'Nội quy homestay' được hiển thị rõ ràng ở cuối trang chi tiết phòng và trong email xác nhận đặt phòng.

#### Câu 043: Làm sao khách biết phòng đó còn trống hay đã hết?
- **Trả lời:** Khi khách chọn ngày tìm kiếm, những phòng đã có người đặt trong ngày đó sẽ không hiển thị, hoặc hiện nhãn 'Hết phòng'.

#### Câu 044: Khách có thể tải file Hóa đơn điện tử về máy không?
- **Trả lời:** Có, khi đơn phòng ở trạng thái `COMPLETED`, khách bấm nút 'Xem hóa đơn' và có thể in hoặc lưu file PDF về máy.

#### Câu 045: Tài khoản khách hàng có bị lộ mật khẩu cho nhân viên xem được không?
- **Trả lời:** Tuyệt đối không. Mật khẩu được mã hóa một chiều bằng thuật toán BCrypt trong CSDL, kể cả Admin hay nhân viên kỹ thuật cũng không đọc được.

#### Câu 046: Khách có thể chia sẻ link phòng homestay cho bạn bè xem cùng không?
- **Trả lời:** Có, mỗi phòng có một đường link URL riêng (vd: `/rooms/101`), khách chỉ cần copy link gửi qua Zalo/Facebook.

#### Câu 047: Trẻ em đi cùng có bị tính thêm phí không?
- **Trả lời:** Hệ thống có cấu hình số lượng trẻ em đi kèm miễn phí (dưới 6 tuổi) và phụ thu cho trẻ em trên 6 tuổi theo quy định của từng phòng.

#### Câu 048: Khách có thể hủy tài khoản của mình không?
- **Trả lời:** Khách có thể gửi yêu cầu hỗ trợ khóa tài khoản trong trang Quản lý thông tin cá nhân.

#### Câu 049: Nếu khách đang đặt phòng mà bị mất điện/mất mạng thì đơn có bị mất không?
- **Trả lời:** Đơn đã tạo sẽ được lưu ở trạng thái `PENDING_PAYMENT` trong vòng 15 phút. Khi có mạng lại, khách vào 'Lịch sử đặt phòng' bấm thanh toán tiếp.

#### Câu 050: Giao diện khách hàng được thiết kế theo tông màu chủ đạo nào?
- **Trả lời:** Tông màu chủ đạo là màu đỏ cam san hô (#ff385c) ấm cúng, lấy cảm hứng từ phong cách du lịch nghỉ dưỡng hiện đại của Airbnb.

---

## NHÓM 3: CHỨC NĂNG DÀNH CHO ADMIN & LỄ TÂN (STAFF) (CÂU 051 - 075)

#### Câu 051: Trang Dashboard của Admin hiển thị những thông tin quan trọng nào?
- **Trả lời:** Hiển thị: Tổng doanh thu theo tháng, Tỷ lệ lấp đầy phòng (Occupancy Rate), Số lượng đơn đặt phòng mới hôm nay, Số khách đang lưu trú và Biểu đồ doanh thu.

#### Câu 052: Admin thêm một phòng mới vào hệ thống như thế nào?
- **Trả lời:** Admin vào mục 'Quản lý phòng' -> Bấm 'Thêm phòng mới' -> Điền số phòng, loại phòng, giá theo đêm, sức chứa, tiện ích và upload ảnh phòng lên Cloudinary.

#### Câu 053: Lễ tân xem tình trạng phòng của toàn bộ homestay ở đâu nhanh nhất?
- **Trả lời:** Xem trên màn hình **Sơ đồ lịch phòng (Room Matrix Calendar)**: Hiển thị dạng bảng lưới các phòng và các ngày trong tháng với màu sắc trực quan.

#### Câu 054: Ý nghĩa các màu sắc trên Sơ đồ lịch phòng (Room Matrix Calendar) là gì?
- **Trả lời:** Màu vàng: Đang chờ thanh toán (`PENDING`); Màu xanh lá: Đã xác nhận (`CONFIRMED`); Màu xanh dương: Khách đang ở (`CHECKED_IN`); Màu xám: Đang bảo trì/dọn dẹp.

#### Câu 055: Lễ tân thực hiện thao tác Check-in cho khách như thế nào?
- **Trả lời:** Lễ tân tìm đơn theo Tên/Mã đơn -> Bấm 'Check-in' -> Tải ảnh CCCD khách lên để AI tự điền thông tin -> Kiểm tra lại thông tin và bấm 'Xác nhận Check-in'.

#### Câu 056: Lễ tân thực hiện thao tác Check-out cho khách như thế nào?
- **Trả lời:** Lễ tân bấm 'Check-out' -> Nhập các dịch vụ phụ phát sinh (nước uống, thuê xe, giặt là) -> Thu số tiền còn lại của khách -> Bấm 'Hoàn tất trả phòng'.

#### Câu 057: Khi khách trả phòng xong thì phòng chuyển sang trạng thái gì?
- **Trả lời:** Chuyển sang trạng thái `NEED_CLEANING` (Cần dọn dẹp) để thông báo cho nhân viên buồng phòng vào vệ sinh trước khi đón khách mới.

#### Câu 058: Nhân viên buồng phòng cập nhật trạng thái phòng đã dọn xong ở đâu?
- **Trả lời:** Nhân viên vào danh sách phòng cần dọn -> Sau khi dọn sạch sẽ, bấm 'Hoàn thành dọn phòng' -> Phòng tự động chuyển về trạng thái `AVAILABLE` (Sẵn sàng đón khách).

#### Câu 059: Admin có thể tạm khóa phòng để sửa chữa (Bảo trì) không?
- **Trả lời:** Có, Admin chọn phòng và bấm 'Khóa bảo trì' (chọn từ ngày A đến ngày B), phòng sẽ không xuất hiện trên trang tìm kiếm của khách hàng.

#### Câu 060: Lễ tân có thể đặt phòng trực tiếp cho khách đến tại quầy (Walk-in Guest) không?
- **Trả lời:** Có, lễ tân bấm nút 'Tạo đơn tại quầy' trên Matrix Calendar -> Chọn phòng trống -> Điền tên, SĐT khách -> Thu tiền mặt và bấm xác nhận.

#### Câu 061: Admin quản lý danh sách nhân viên ở màn hình nào?
- **Trả lời:** Trang 'Quản lý người dùng/Nhân viên': Admin có thể thêm nhân viên mới, cấp tài khoản, đổi mật khẩu hoặc khóa tài khoản nhân viên khi nghỉ việc.

#### Câu 062: Lễ tân có quyền xem báo cáo doanh thu tài chính tổng của cả năm không?
- **Trả lời:** Không. Hệ thống phân quyền chặt chẽ: Chỉ có tài khoản `ROLE_ADMIN` mới xem được báo cáo doanh thu tài chính; Lễ tân (`ROLE_STAFF`) chỉ quản lý đơn và phòng.

#### Câu 063: Admin cấu hình giá phòng cuối tuần và ngày lễ ở đâu?
- **Trả lời:** Trong mục 'Cấu hình giá phòng' (Pricing Settings): Admin nhập % phụ thu cho thứ 6, thứ 7 và danh sách các ngày lễ tết trong năm.

#### Câu 064: Hệ thống có quản lý danh mục đồ uống Minibar và dịch vụ phụ không?
- **Trả lời:** Có, mục 'Quản lý Dịch vụ': Cho phép thêm/sửa/xóa các dịch vụ như Nước suối, Mì tôm, Thuê xe tay ga, Thuê lò nướng BBQ kèm theo đơn giá.

#### Câu 065: Lễ tân có thể đổi phòng cho khách nếu điều hòa bị hỏng không?
- **Trả lời:** Có, lễ tân chọn đơn khách đang ở -> Bấm 'Đổi phòng' -> Chọn phòng trống cùng hạng tương đương -> Hệ thống tự động chuyển số phòng.

#### Câu 066: Admin có thể xuất danh sách khách lưu trú ra file Excel để báo cáo công an phường không?
- **Trả lời:** Có, hệ thống có nút 'Xuất danh sách lưu trú Excel' chứa đầy đủ thông tin: Họ tên, Số CCCD, Ngày sinh, Quê quán đã quét bằng AI.

#### Câu 067: Lễ tân ghi nhận tiền khách thanh toán bằng tiền mặt như thế nào?
- **Trả lời:** Khi thanh toán, lễ tân chọn phương thức 'Tiền mặt' -> Nhập số tiền thực nhận -> Hệ thống tự tính tiền thừa trả lại và lưu bản ghi thanh toán.

#### Câu 068: Admin có thể tạo mã giảm giá khuyến mãi (Voucher) không?
- **Trả lời:** Có, Admin vào mục 'Khuyến mãi' -> Nhập Mã code (vd: `HE2026`), Số tiền giảm (hoặc %), Ngày bắt đầu, Ngày hết hạn và Số lượng mã phát hành.

#### Câu 069: Lễ tân có xóa vĩnh viễn được lịch sử đơn đặt phòng của khách không?
- **Trả lời:** Không. Để chống gian lận thất thoát tiền, lễ tân không thể xóa đơn; mọi đơn chỉ có thể đổi trạng thái và đều được ghi nhật ký hệ thống.

#### Câu 070: Admin có thể xem lại lịch sử thao tác của nhân viên (Audit Log) không?
- **Trả lời:** Có, trang 'Nhật ký hệ thống' ghi lại chi tiết: Nhân viên A đã check-in cho đơn X lúc mấy giờ, Nhân viên B đã sửa giá phòng lúc nào.

#### Câu 071: Khi có khách đặt phòng online mới, Admin/Lễ tân có thấy thông báo không?
- **Trả lời:** Có, biểu tượng chuông thông báo trên thanh tiêu đề Admin sẽ nhấp nháy đỏ và hiển thị danh sách các đơn đặt phòng mới phát sinh.

#### Câu 072: Admin thay đổi thông tin Homestay (Tên, Địa chỉ, SĐT hotline) ở đâu?
- **Trả lời:** Trong mục 'Cài đặt Homestay' (Homestay Settings): Cập nhật địa chỉ, tọa độ bản đồ, quy định chung và thông tin ngân hàng nhận chuyển khoản.

#### Câu 073: Lễ tân có thể in hóa đơn thanh toán ra máy in nhiệt hoặc máy in A4 không?
- **Trả lời:** Có, giao diện hóa đơn có nút 'In hóa đơn' tích hợp sẵn lệnh in chuẩn trình duyệt (Ctrl + P) căn chỉnh vừa khổ giấy.

#### Câu 074: Admin có thể xem danh sách đánh giá của khách hàng và phản hồi lại không?
- **Trả lời:** Có, mục 'Quản lý Đánh giá': Admin xem các bình luận của khách và có ô 'Trả lời của chủ homestay' hiển thị công khai dưới đánh giá.

#### Câu 075: Lễ tân bàn giao ca làm việc (Handover) như thế nào trên phần mềm?
- **Trả lời:** Cuối ca, lễ tân mở 'Báo cáo ca làm việc': Xem tổng tiền mặt đã thu trong ca, tổng tiền chuyển khoản, ký xác nhận và bàn giao tiền cho ca sau.

---

## NHÓM 4: LUỒNG ĐẶT PHÒNG, GIỮ CHỖ & HỦY PHÒNG (CÂU 076 - 100)

#### Câu 076: Trình bày các bước từ lúc khách chọn phòng đến khi đặt xong?
- **Trả lời:** Bước 1: Chọn ngày & số lượng người -> Bước 2: Chọn phòng ưng ý -> Bước 3: Điền thông tin cá nhân -> Bước 4: Chọn phương thức thanh toán (VNPay/Tiền mặt) -> Bước 5: Thanh toán và nhận email xác nhận.

#### Câu 077: Khi khách bấm nút 'Thanh toán', phòng được giữ trong bao lâu?
- **Trả lời:** Phòng được giữ tạm thời trong vòng **15 phút** (ở trạng thái `PENDING_PAYMENT`) để khách hoàn tất giao dịch trên VNPay/MoMo.

#### Câu 078: Nếu sau 15 phút khách không thanh toán thì hệ thống làm gì?
- **Trả lời:** Hệ thống có bộ hẹn giờ tự động (Cron Job chạy mỗi phút): Tự động chuyển đơn quá 15 phút sang trạng thái `CANCELLED` và nhả phòng cho người khác đặt.

#### Câu 079: Hai khách cùng chọn 1 phòng trong cùng ngày thì ai sẽ được phòng?
- **Trả lời:** Khách nào bấm 'Thanh toán' trước và hệ thống tạo đơn `PENDING_PAYMENT` trước thì sẽ giữ được phòng; khách thứ hai sẽ nhận được thông báo phòng vừa có người giữ chỗ.

#### Câu 080: Trạng thái `CONFIRMED` có ý nghĩa là gì?
- **Trả lời:** Nghĩa là đơn đã được đặt thành công (Khách đã thanh toán trực tuyến qua VNPay hoặc lễ tân đã xác nhận thu tiền cọc). Phòng chắc chắn dành cho khách đó.

#### Câu 081: Trạng thái `CHECKED_IN` có ý nghĩa là gì?
- **Trả lời:** Nghĩa là khách đã có mặt tại homestay, đã được lễ tân quét giấy tờ tùy thân và đang lưu trú trong phòng.

#### Câu 082: Trạng thái `COMPLETED` có ý nghĩa là gì?
- **Trả lời:** Nghĩa là khách đã trả phòng, thanh toán hết các chi phí phát sinh, nhận hóa đơn và kết thúc chuyến đi.

#### Câu 083: Chính sách hoàn tiền khi khách hủy phòng trước 3 ngày là bao nhiêu %?
- **Trả lời:** Nếu hủy trước ngày check-in từ 3 ngày trở lên: Khách được hoàn lại **100%** số tiền đặt cọc.

#### Câu 084: Nếu khách hủy phòng sát giờ (trong vòng 24 giờ trước khi nhận phòng) thì sao?
- **Trả lời:** Theo quy định, hủy trong vòng 24 giờ trước check-in sẽ không được hoàn cọc để bảo vệ quyền lợi doanh thu cho chủ homestay.

#### Câu 085: Khách bấm hủy đơn thì phòng có được mở lại cho người khác đặt ngay không?
- **Trả lời:** Có, ngay khi trạng thái chuyển sang `CANCELLED`, phòng đó lập tức trở lại trạng thái trống và hiển thị trên kết quả tìm kiếm của khách khác.

#### Câu 086: Làm sao hệ thống tính đúng số đêm khách ở?
- **Trả lời:** Hệ thống tính bằng công thức: `Số đêm = Ngày trả phòng (Check-out) - Ngày nhận phòng (Check-in)`.

#### Câu 087: Khách đặt từ ngày 20 đến ngày 22 thì tính là mấy đêm?
- **Trả lời:** Tính là 2 đêm (Đêm ngày 20 và đêm ngày 21). Trả phòng vào 12h trưa ngày 22.

#### Câu 088: Giờ nhận phòng (Check-in) và trả phòng (Check-out) chuẩn là mấy giờ?
- **Trả lời:** Giờ Check-in chuẩn là **14:00** chiều; Giờ Check-out chuẩn là **12:00** trưa ngày hôm sau.

#### Câu 089: Nếu khách muốn nhận phòng sớm lúc 8h sáng thì xử lý thế nào?
- **Trả lời:** Lễ tân kiểm tra phòng có trống không, nếu có thì chọn mục 'Check-in sớm' và hệ thống tự cộng phụ thu (thường là 30% - 50% tiền ngày).

#### Câu 090: Khách có thể ghi chú yêu cầu đặc biệt (như giường phụ, tầng thấp) lúc đặt phòng không?
- **Trả lời:** Có, trong form đặt phòng có ô 'Ghi chú cho Homestay' để khách điền các yêu cầu đặc biệt gửi tới lễ tân.

#### Câu 091: Mã đặt phòng (Booking Code) trông như thế nào?
- **Trả lời:** Có dạng chuỗi ngắn gọn dễ đọc, ví dụ: `HS20260923-8K9P`.

#### Câu 092: Khách có thể đặt phòng hộ cho người khác đi ở không?
- **Trả lời:** Được. Khách chỉ cần điền Họ tên và Số điện thoại của người ở thực tế vào phần Thông tin khách lưu trú.

#### Câu 093: Tổng tiền của một đơn đặt phòng gồm những khoản nào?
- **Trả lời:** `Tổng tiền = (Giá phòng * Số đêm) + Phí dịch vụ phụ + Thuế/Phụ phí (nếu có) - Tiền giảm giá Voucher`.

#### Câu 094: Khách có thể thay đổi ngày đi sau khi đã đặt phòng thành công không?
- **Trả lời:** Khách có thể liên hệ hotline hoặc lễ tân để điều chỉnh ngày trên hệ thống nếu khoảng ngày mới phòng đó còn trống.

#### Câu 095: Nếu chủ homestay đột xuất phải sửa chữa cả căn nhà thì hủy đơn của khách thế nào?
- **Trả lời:** Admin thực hiện hủy đơn với lý do 'Bảo trì khẩn cấp', hệ thống tự động hoàn 100% tiền và gửi email xin lỗi kèm bồi hoàn cho khách.

#### Câu 096: Khách có thể chọn thanh toán trước 100% tiền phòng không?
- **Trả lời:** Có, khách có thể chọn 'Thanh toán 100%' để khi đến nơi chỉ cần nhận chìa khóa vào ở mà không cần thanh toán thêm tiền phòng.

#### Câu 097: Nếu khách không đến nhận phòng (No-Show) thì đơn sẽ chuyển sang trạng thái gì?
- **Trả lời:** Sau 24h kể từ giờ check-in nếu khách không đến và không liên lạc được, lễ tân chuyển đơn sang trạng thái `NO_SHOW` (Hủy không hoàn tiền).

#### Câu 098: Hệ thống có gửi email nhắc nhở khách trước ngày nhận phòng không?
- **Trả lời:** Có, hệ thống tự động gửi email nhắc trước 1 ngày thông báo giờ check-in, vị trí và số hotline đón tiếp.

#### Câu 099: Một đơn đặt phòng có thể hủy bao nhiêu lần?
- **Trả lời:** Chỉ hủy đúng 1 lần duy nhất, khi đã chuyển sang `CANCELLED` thì không thể hủy tiếp.

#### Câu 100: Làm sao phân biệt đơn do khách tự đặt online với đơn lễ tân tạo tại quầy?
- **Trả lời:** Trong bảng `bookings` có trường `booking_source`: Ghi nhận `ONLINE_WEB` (khách tự đặt) hoặc `WALK_IN_DESK` (lễ tân tạo).

---

## NHÓM 5: LUỒNG CHECK-IN QUÉT CCCD AI & CHECK-OUT HÓA ĐƠN (CÂU 101 - 125)

#### Câu 101: Tính năng quét CCCD bằng AI (OCR) mang lại lợi ích gì?
- **Trả lời:** Giúp lễ tân không phải gõ tay từng dòng thông tin của khách; chỉ cần chụp ảnh CCCD trong 2 giây là AI tự động điền Số CCCD, Họ tên, Ngày sinh, Địa chỉ, tiết kiệm 90% thời gian.

#### Câu 102: Dự án sử dụng dịch vụ OCR của nhà cung cấp nào?
- **Trả lời:** Sử dụng dịch vụ **Viettel AI CCCD OCR** chính hãng, chuyên biệt nhận diện căn cước công dân Việt Nam.

#### Câu 103: Cần tải mấy ảnh của thẻ CCCD để quét?
- **Trả lời:** Tải 2 ảnh: Mặt trước (chứa Tên, Số CCCD, Ngày sinh) và Mặt sau (chứa Quê quán, Đặc điểm nhận dạng, Ngày cấp).

#### Câu 104: Nếu ảnh CCCD bị mờ thì hệ thống xử lý sao?
- **Trả lời:** Hệ thống sẽ hiện thông báo 'Ảnh bị mờ, vui lòng chụp lại' hoặc cho phép lễ tân gõ tay trực tiếp vào các ô thông tin.

#### Câu 105: Nếu khách dùng Hộ chiếu (Passport) thì có quét được không?
- **Trả lời:** Có, hệ thống có tùy chọn 'Hộ chiếu' để lễ tân nhập thông tin khách quốc tế.

#### Câu 106: Một phòng có 4 người ở thì có quét được cả 4 CCCD không?
- **Trả lời:** Được. Lễ tân có thể bấm nút 'Thêm khách lưu trú' để quét và lưu thông tin của tất cả các thành viên trong đoàn.

#### Câu 107: Dữ liệu CCCD của khách có được bảo mật không?
- **Trả lời:** Có, dữ liệu được bảo vệ trong CSDL nội bộ có phân quyền và chỉ dùng cho mục đích khai báo tạm trú theo quy định của nhà nước.

#### Câu 108: Phiếu đăng ký lưu trú (`CheckInRegistration`) gồm những thông tin gì?
- **Trả lời:** Gồm: Mã đơn phòng, Số phòng bàn giao, Danh sách khách (Tên, Số CCCD, Ngày sinh, Quê quán), Thời gian check-in thực tế và Tên nhân viên tiếp đón.

#### Câu 109: Khi khách Check-out, những chi phí nào có thể phát sinh thêm?
- **Trả lời:** Chi phí đồ uống Minibar (nước suối, bia), Tiền thuê xe máy, Dịch vụ giặt sấy, Phụ thu check-out muộn hoặc Phí đền bù nếu làm vỡ/hỏng đồ đạc.

#### Câu 110: Lễ tân thêm phụ phí nước uống vào đơn như thế nào?
- **Trả lời:** Trong màn hình Check-out, lễ tân chọn dịch vụ 'Nước ngọt lon' -> Nhập số lượng: 3 -> Hệ thống tự nhân đơn giá và cộng vào tổng bill.

#### Câu 111: Nếu khách làm vỡ cốc hoặc hỏng điều khiển tivi thì xử lý thế nào?
- **Trả lời:** Lễ tân chọn mục 'Đền bù tài sản' -> Chọn món đồ bị hỏng từ danh mục tài sản có sẵn đơn giá niêm yết để tính tiền bồi thường.

#### Câu 112: Hóa đơn thanh toán (Invoice) hiển thị những thông tin gì?
- **Trả lời:** Hiển thị: Tên Homestay, Địa chỉ, Mã hóa đơn, Tên khách hàng, Bảng kê chi tiết tiền phòng + dịch vụ phụ, Tiền đã cọc trước, Số tiền còn phải trả.

#### Câu 113: Khách có thể nhận hóa đơn qua email không?
- **Trả lời:** Có, sau khi bấm hoàn tất Check-out, hệ thống tự động gửi file hóa đơn điện tử về địa chỉ email của khách hàng.

#### Câu 114: Hóa đơn có mã QR để quét thanh toán nhanh không?
- **Trả lời:** Có, trên hóa đơn có in sẵn mã VietQR chứa đúng số tiền còn thiếu để khách dùng App ngân hàng quét thanh toán trong 3 giây.

#### Câu 115: Ai là người ký duyệt hóa đơn?
- **Trả lời:** Hóa đơn thể hiện rõ tên Nhân viên lập hóa đơn (Lễ tân ca trực) và thông tin khách hàng.

#### Câu 116: Trạng thái của phòng trên màn hình sẽ đổi như thế nào trong suốt quá trình từ Check-in đến Check-out?
- **Trả lời:** Trước khi khách đến: `CONFIRMED` -> Lúc khách đến nhận phòng: `CHECKED_IN` -> Lúc khách trả phòng: `NEED_CLEANING` -> Sau khi dọn xong: `AVAILABLE`.

#### Câu 117: Nếu khách muốn gia hạn ở thêm 1 đêm nữa thì lễ tân làm thế nào?
- **Trả lời:** Lễ tân kiểm tra đêm hôm sau phòng có trống không -> Bấm 'Gia hạn lưu trú' -> Chọn ngày check-out mới -> Hệ thống tự cộng thêm tiền 1 đêm vào hóa đơn.

#### Câu 118: Nếu khách muốn trả phòng sớm hơn dự kiến thì có được giảm tiền không?
- **Trả lời:** Tùy theo sự thỏa thuận với chủ homestay; lễ tân có thể điều chỉnh số đêm thực tế và hệ thống tính lại tổng tiền.

#### Câu 119: Lễ tân có thể xem danh sách các phòng sắp đến giờ Check-in trong ngày hôm nay ở đâu?
- **Trả lời:** Tại mục 'Lịch đón khách hôm nay' (Today's Arrivals): Hiển thị danh sách khách dự kiến check-in để lễ tân chuẩn bị phòng chu đáo.

#### Câu 120: Lễ tân xem danh sách các phòng sắp trả trong hôm nay ở đâu?
- **Trả lời:** Tại mục 'Lịch trả phòng hôm nay' (Today's Departures) để chủ động kiểm tra phòng và hỗ trợ khách check-out.

#### Câu 121: Mỗi hóa đơn có một số seri (Mã hóa đơn) duy nhất không?
- **Trả lời:** Có, mã hóa đơn sinh tự động theo quy tắc, ví dụ: `INV-20260923-0001` không bao giờ trùng lặp.

#### Câu 122: Nếu khách làm mất thẻ phòng thì phụ thu bao nhiêu?
- **Trả lời:** Hệ thống có sẵn mục phụ thu 'Mất thẻ từ/chìa khóa' với mức phí định sẵn (ví dụ 100.000 VNĐ).

#### Câu 123: Sau khi check-out, khách có thể vào lại phòng được nữa không?
- **Trả lời:** Không. Khách đã trả lại chìa khóa/thẻ phòng và quyền truy cập phòng trên hệ thống đã đóng.

#### Câu 124: Có thể xem lại hóa đơn của một đơn phòng đã hoàn thành từ tháng trước không?
- **Trả lời:** Hoàn toàn được. Trong mục 'Quản lý Hóa đơn', có thể tra cứu và xem lại tất cả hóa đơn lịch sử bất kỳ lúc nào.

#### Câu 125: Hình ảnh CCCD sau khi quét có bị lưu mãi mãi không?
- **Trả lời:** Hệ thống có cơ chế tự động xóa ảnh gốc CCCD sau 30 ngày để tiết kiệm bộ nhớ và bảo vệ quyền riêng tư của khách hàng.

---

## NHÓM 6: THANH TOÁN VNPAY, MOMO, TIỀN MẶT & GỬI EMAIL OTP (CÂU 126 - 150)

#### Câu 126: Hệ thống tích hợp cổng thanh toán trực tuyến nào?
- **Trả lời:** Hệ thống tích hợp cổng thanh toán **VNPay** (hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa 40 ngân hàng, thẻ quốc tế Visa/Mastercard) và ví điện tử **MoMo**.

#### Câu 127: Khi chọn thanh toán VNPay, khách hàng thao tác như thế nào?
- **Trả lời:** Khách bấm 'Thanh toán VNPay' -> Trình duyệt chuyển sang cổng VNPay -> Khách mở App ngân hàng quét mã QR hoặc nhập số thẻ -> Nhập OTP ngân hàng -> Thành công và quay lại web.

#### Câu 128: Làm sao hệ thống biết được khách đã thanh toán tiền thành công bên VNPay?
- **Trả lời:** Khi thanh toán xong, máy chủ VNPay tự động gọi ngầm một tín hiệu thông báo (gọi là **IPN / Webhook**) về máy chủ Spring Boot để cập nhật đơn thành `CONFIRMED`.

#### Câu 129: Chữ ký bảo mật (Checksum) của VNPay dùng thuật toán gì?
- **Trả lời:** Sử dụng thuật toán băm bảo mật **HMAC-SHA512** kết hợp khóa bí mật `vnp_HashSecret` để đảm bảo số tiền và dữ liệu không bị sửa đổi trên đường truyền.

#### Câu 130: Để test thanh toán VNPay trong môi trường thử nghiệm (Sandbox) thì dùng tài khoản nào?
- **Trả lời:** Sử dụng thẻ test của VNPay Sandbox (Ngân hàng NCB, Số thẻ `9704198526191432198`, Tên `NGUYEN VAN A`, OTP `123456`).

#### Câu 131: Tại sao số tiền gửi sang VNPay lại phải nhân với 100?
- **Trả lời:** Vì quy định của cổng VNPay là không sử dụng dấu chấm thập phân; ví dụ 500.000 VNĐ sẽ gửi đi dưới dạng số nguyên `50000000`.

#### Câu 132: Nếu khách tắt trình duyệt lúc đang nhập mã OTP ngân hàng thì đơn có bị lỗi không?
- **Trả lời:** Không bị lỗi. Nếu chưa trừ tiền, đơn vẫn ở `PENDING_PAYMENT` và tự hủy sau 15 phút. Nếu đã trừ tiền, cổng VNPay gửi Webhook ngầm về thì đơn vẫn tự động kích hoạt thành công.

#### Câu 133: Hệ thống có hỗ trợ thanh toán trực tiếp bằng Tiền mặt không?
- **Trả lời:** Có, khách có thể chọn phương thức 'Thanh toán tiền mặt khi nhận phòng' hoặc chuyển khoản trực tiếp cho lễ tân tại quầy.

#### Câu 134: Gửi email OTP và email xác nhận đơn sử dụng dịch vụ gì?
- **Trả lời:** Sử dụng thư viện **JavaMailSender** của Spring Boot kết nối qua dịch vụ **Gmail SMTP Server** (Cổng 587 TLS).

#### Câu 135: Mã OTP gửi về email có thời hạn sử dụng trong bao lâu?
- **Trả lời:** Mã OTP gồm 6 chữ số ngẫu nhiên và có hiệu lực trong vòng **5 phút** kể từ lúc gửi.

#### Câu 136: Nếu nhập sai mã OTP quá 3 lần thì sao?
- **Trả lời:** Hệ thống sẽ báo lỗi và yêu cầu người dùng bấm nút 'Gửi lại mã OTP mới'.

#### Câu 137: Email xác nhận đặt phòng có đính kèm mã QR Code để làm gì?
- **Trả lời:** Để khi khách đến homestay, lễ tân chỉ cần dùng máy quét hoặc camera quét mã QR là mở ngay chi tiết đơn đặt phòng mà không cần hỏi tên tìm kiếm.

#### Câu 138: Làm sao để đảm bảo việc gửi email không làm đơ trang web của khách?
- **Trả lời:** Sử dụng tính năng chạy bất đồng bộ `@Async` trong Spring Boot: Lệnh gửi email được đẩy vào hàng đợi ngầm xử lý riêng, giao diện của khách phản hồi ngay lập tức.

#### Câu 139: Nếu khách nhập sai địa chỉ email lúc đăng ký thì sao?
- **Trả lời:** Khách sẽ không nhận được mã OTP kích hoạt tài khoản và hệ thống yêu cầu kiểm tra lại chính xác hòm thư email.

#### Câu 140: Mỗi giao dịch thanh toán thành công được lưu lại những thông tin gì?
- **Trả lời:** Bảng `payments` lưu: Mã giao dịch VNPay, Số tiền, Ngân hàng thanh toán (NCB, VCB...), Thời gian thanh toán, Phương thức và Mã đơn booking.

#### Câu 141: Có thể hoàn tiền tự động về tài khoản ngân hàng của khách khi hủy đơn không?
- **Trả lời:** Có, hệ thống tích hợp API Refund của VNPay/MoMo để gửi lệnh hoàn tiền về đúng thẻ/tài khoản khách đã dùng để thanh toán.

#### Câu 142: Đơn vị tiền tệ chính thức trên toàn hệ thống là gì?
- **Trả lời:** Đơn vị tiền tệ chính thức là Việt Nam Đồng (**VNĐ**), được định dạng hiển thị có dấu phẩy rõ ràng (vd: `1.250.000 ₫`).

#### Câu 143: Khi khách thanh toán thiếu tiền cọc thì hệ thống có cho qua không?
- **Trả lời:** Không. Backend kiểm tra chính xác số tiền VNPay báo về phải bằng đúng số tiền quy định của đơn mới chuyển trạng thái thành công.

#### Câu 144: Chuyển tiền qua mã VietQR hoạt động ra sao?
- **Trả lời:** Hệ thống sinh ảnh VietQR chứa sẵn Số tài khoản chủ homestay, Tên chủ tài khoản và Nội dung chuyển khoản là Mã đơn phòng để khách quét thanh toán nhanh.

#### Câu 145: Chủ homestay xem tổng số tiền đã thu qua VNPay và tiền mặt ở đâu?
- **Trả lời:** Trong trang 'Báo cáo tài chính': Hệ thống phân tích rõ biểu đồ cơ cấu doanh thu theo từng phương thức (VNPay, MoMo, Tiền mặt).

#### Câu 146: Có thể test gửi email OTP trên máy tính cá nhân (Localhost) được không?
- **Trả lời:** Được. Chỉ cần điền Gmail và App Password (Mật khẩu ứng dụng 16 ký tự của Google) vào file cấu hình là gửi email thực tế bình thường.

#### Câu 147: Nếu mạng bị chập chờn khiến VNPay gửi thông báo 2 lần thì tiền có bị nhân đôi không?
- **Trả lời:** Không. Backend có cơ chế kiểm tra (**Idempotency**): Nếu mã giao dịch đó đã được lưu thành công rồi thì lần gọi thứ hai sẽ bỏ qua.

#### Câu 148: Thẻ ATM nào có thể dùng để thanh toán trên VNPay?
- **Trả lời:** Tất cả các thẻ ATM nội địa có đăng ký Internet Banking của hơn 40 ngân hàng tại Việt Nam (Vietcombank, Techcombank, MBBank, BIDV, Agribank...).

#### Câu 149: Khách hàng có bị trừ phí khi thanh toán online trên web không?
- **Trả lời:** Không, toàn bộ phí giao dịch cổng thanh toán do chủ homestay chi trả, khách hàng thanh toán đúng số tiền phòng niêm yết.

#### Câu 150: Tại sao không lưu thông tin thẻ ngân hàng của khách trong database của mình?
- **Trả lời:** Để tuân thủ tiêu chuẩn an toàn bảo mật thanh toán quốc tế (PCI-DSS); thông tin thẻ chỉ được nhập trên trang bảo mật của VNPay/Ngân hàng.

---

## NHÓM 7: CƠ SỞ DỮ LIỆU, BẢNG & MỐI QUAN HỆ (CÂU 151 - 175)

#### Câu 151: CSDL của dự án gồm những bảng quan trọng nào nhất?
- **Trả lời:** Gồm các bảng: `users` (người dùng), `roles` (vai trò), `homestays` (homestay), `rooms` (phòng), `room_types` (hạng phòng), `bookings` (đơn đặt), `booking_details` (chi tiết phòng đặt), `payments` (thanh toán), `invoices` (hóa đơn), `checkin_registrations` (lưu trú CCCD).

#### Câu 152: Mối quan hệ giữa bảng `users` và `bookings` là gì?
- **Trả lời:** Mối quan hệ **1 - Nhiều (1-N)**: Một người dùng (`User`) có thể có nhiều đơn đặt phòng (`Bookings`), nhưng một đơn đặt phòng chỉ thuộc về một người dùng.

#### Câu 153: Mối quan hệ giữa bảng `bookings` và `booking_details` là gì?
- **Trả lời:** Mối quan hệ **1 - Nhiều (1-N)**: Một đơn đặt phòng (`Booking`) có thể chứa nhiều phòng (`BookingDetails`) cho chuyến đi.

#### Câu 154: Mối quan hệ giữa `rooms` và `room_types` là gì?
- **Trả lời:** Mối quan hệ **Nhiều - 1 (N-1)**: Nhiều phòng cụ thể (Phòng 101, 102, 103) cùng thuộc về một hạng phòng (`RoomType` ví dụ: Deluxe Hướng Biển).

#### Câu 155: Mối quan hệ giữa `users` và `roles` được thiết kế như thế nào?
- **Trả lời:** Mối quan hệ **Nhiều - Nhiều (N-N)** thông qua bảng trung gian `user_roles`: Một user có thể có nhiều role và một role có nhiều user.

#### Câu 156: Bảng `bookings` lưu trữ những cột thông tin chính nào?
- **Trả lời:** Gồm: `id`, `booking_code`, `user_id`, `total_amount`, `deposit_amount`, `status` (`PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`), `hold_expires_at`, `created_at`.

#### Câu 157: Bảng `rooms` lưu trữ những thông tin gì?
- **Trả lời:** Gồm: `id`, `room_number` (Số phòng), `room_type_id`, `homestay_id`, `price_per_night`, `status` (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `NEED_CLEANING`), `is_deleted`.

#### Câu 158: Khóa chính (Primary Key) của các bảng là gì?
- **Trả lời:** Hầu hết các bảng sử dụng khóa chính là cột `id` kiểu số nguyên tự tăng (`BIGINT AUTO_INCREMENT`).

#### Câu 159: Tại sao lại lưu giá phòng tại thời điểm đặt vào bảng `booking_details`?
- **Trả lời:** Để lưu giữ lịch sử giá (Snapshot Price); sau này nếu chủ homestay có tăng/giảm giá phòng thì đơn phòng đã đặt trước đó vẫn giữ nguyên giá cũ không bị sai lệch.

#### Câu 160: Bảng `payments` liên kết với bảng `bookings` qua cột nào?
- **Trả lời:** Liên kết qua khóa ngoại `booking_id` trỏ tới cột `id` của bảng `bookings`.

#### Câu 161: Cột `status` trong bảng `bookings` dùng kiểu dữ liệu gì?
- **Trả lời:** Dùng kiểu `VARCHAR(30)` hoặc `ENUM` ánh xạ với Java Enum `BookingStatus`.

#### Câu 162: Bảng `checkin_registrations` lưu những thông tin CCCD nào?
- **Trả lời:** Lưu: `id`, `booking_id`, `room_id`, `guest_name`, `id_card_number` (Số CCCD), `birth_date`, `gender`, `address`, `front_card_url`, `back_card_url`, `created_at`.

#### Câu 163: Xóa mềm (Soft Delete) trong bảng `rooms` hoạt động như thế nào?
- **Trả lời:** Khi bấm xóa phòng, hệ thống không chạy lệnh `DELETE` mà chỉ cập nhật `is_deleted = true`. Phòng sẽ ẩn khỏi web nhưng các đơn cũ trong lịch sử vẫn không bị lỗi.

#### Câu 164: Công cụ nào được dùng để quản lý và xem dữ liệu MySQL?
- **Trả lời:** Sử dụng công cụ đồ họa trực quan như **MySQL Workbench**, **DBeaver**, hoặc **Navicat** kết nối qua cổng 3306.

#### Câu 165: Tại sao cần tạo Index trên cột `room_id` và `check_in_date`?
- **Trả lời:** Để MySQL tìm kiếm phòng trống nhanh gấp hàng chục lần, không phải duyệt tuần tự qua toàn bộ các dòng của bảng.

#### Câu 166: Bảng `reviews` (Đánh giá) liên kết với những bảng nào?
- **Trả lời:** Liên kết với `users(id)` (người viết đánh giá), `rooms(id)` hoặc `homestays(id)` (phòng được đánh giá) và `bookings(id)` (đơn phòng tương ứng).

#### Câu 167: Cột `rating` trong bảng `reviews` nhận giá trị từ mấy đến mấy?
- **Trả lời:** Nhận giá trị số nguyên từ 1 đến 5 sao.

#### Câu 168: Bảng `coupons` (Mã giảm giá) gồm những cột nào?
- **Trả lời:** Gồm: `id`, `code`, `discount_type` (Phần trăm hoặc Tiền mặt), `discount_value`, `min_order_amount`, `max_discount`, `start_date`, `end_date`, `usage_limit`.

#### Câu 169: Làm sao để đảm bảo Số điện thoại hoặc Email không bị đăng ký trùng lặp?
- **Trả lời:** Đặt ràng buộc duy nhất **Unique Constraint** trên cột `email` và `phone_number` trong bảng `users` (`UNIQUE KEY`).

#### Câu 170: Bảng `services` lưu danh mục dịch vụ gồm những gì?
- **Trả lời:** Gồm: `id`, `service_name` (Thuê xe, BBQ, Giặt là), `unit_price`, `unit` (Chiếc/ngày, Lượt, Bộ), `description`, `icon_url`.

#### Câu 171: Bảng `booking_services` lưu thông tin gì?
- **Trả lời:** Lưu các dịch vụ khách gọi thêm trong đơn: `id`, `booking_id`, `service_id`, `quantity`, `unit_price`, `total_price`.

#### Câu 172: Cơ sở dữ liệu có tự động lưu thời gian tạo bản ghi không?
- **Trả lời:** Có, các bảng đều có cột `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` và `updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.

#### Câu 173: Khóa ngoại (Foreign Key) có tác dụng gì trong CSDL?
- **Trả lời:** Đảm bảo tính toàn vẹn dữ liệu: Không thể tạo một đơn booking trỏ tới một `user_id` không tồn tại trong hệ thống.

#### Câu 174: Để sao lưu (Backup) CSDL MySQL thì làm thế nào?
- **Trả lời:** Dùng tính năng 'Data Export' trong MySQL Workbench hoặc chạy lệnh `mysqldump -u root -p homestay_db > backup.sql` ra file `.sql`.

#### Câu 175: CSDL mẫu ban đầu của nhóm có sẵn bao nhiêu phòng để demo?
- **Trả lời:** Có sẵn khoảng 10 - 20 phòng mẫu đa dạng (Phòng đơn, phòng đôi, villa sân vườn, phòng view biển) với đầy đủ hình ảnh và tiện ích.

---

## NHÓM 8: CẤU TRÚC THƯ MỤC, CÁCH CHẠY DEMO & XỬ LÝ LỖI (CÂU 176 - 200)

#### Câu 176: Thư mục mã nguồn của dự án được chia thành những phần nào?
- **Trả lời:** Gồm 3 phần chính: 1. `homestayManagement/`: Backend Java Spring Boot. 2. `frontendHomestayManagement/`: Frontend React 19 + Vite. 3. `openchatbi/`: AI Chatbot Python Sidecar.

#### Câu 177: Trong Backend Spring Boot, các file code được tổ chức theo những package nào?
- **Trả lời:** Gồm: `controller/` (nhận API request), `service/` (xử lý logic), `repository/` (gọi CSDL JPA), `entity/` (định nghĩa bảng CSDL), `dto/` (dữ liệu truyền nhận), `config/` (cấu hình Security, CORS).

#### Câu 178: Trong Frontend React, các file code được chia như thế nào?
- **Trả lời:** Gồm: `src/pages/` (các trang như Home, Login, Admin), `src/components/` (các nút bấm, navbar, popup dùng chung), `src/services/` (các hàm gọi API axios).

#### Câu 179: Để khởi động Backend bằng dòng lệnh thì gõ lệnh gì?
- **Trả lời:** Mở terminal tại thư mục `homestayManagement` và gõ: `mvnw.cmd spring-boot:run` (trên Windows) hoặc `./mvnw spring-boot:run`.

#### Câu 180: Để khởi động Frontend bằng dòng lệnh thì gõ lệnh gì?
- **Trả lời:** Mở terminal tại thư mục `frontendHomestayManagement` và gõ: `npm run dev`.

#### Câu 181: Backend chạy mặc định ở cổng (Port) bao nhiêu?
- **Trả lời:** Backend chạy tại cổng **`8080`** (`http://localhost:8080`).

#### Câu 182: Frontend chạy mặc định ở cổng (Port) bao nhiêu?
- **Trả lời:** Frontend chạy tại cổng **`5173`** (`http://localhost:5173`).

#### Câu 183: Nếu cổng 8080 bị trùng (Port already in use) thì xử lý thế nào?
- **Trả lời:** Đổi port trong file `application.properties` thành `server.port=8081` hoặc mở Task Manager tắt tiến trình Java cũ đang chạy ngầm.

#### Câu 184: Làm sao để biết Backend đã khởi động thành công?
- **Trả lời:** Khi terminal backend hiện dòng chữ: `Started HomestayManagementApplication in X seconds` và không báo lỗi màu đỏ.

#### Câu 185: Tài khoản đăng nhập mặc định của Admin để thuyết trình là gì?
- **Trả lời:** Tài khoản Admin mẫu: Email `admin@homestay.com` (hoặc `admin`), Mật khẩu `123456`.

#### Câu 186: Tài khoản nhân viên lễ tân mẫu để demo là gì?
- **Trả lời:** Tài khoản Staff mẫu: Email `staff@homestay.com`, Mật khẩu `123456`.

#### Câu 187: File `package.json` trong thư mục frontend dùng để làm gì?
- **Trả lời:** Khai báo tên dự án, các thư viện JavaScript đã cài đặt (React, Axios, Lucide Icon, Tailwind...) và các lệnh chạy script (`npm run dev`, `npm run build`).

#### Câu 188: File `pom.xml` trong backend dùng để làm gì?
- **Trả lời:** Khai báo phiên bản Java, các dependency thư viện của Maven (Spring Web, Spring Security, MySQL Connector, Lombok, JavaMail...).

#### Câu 189: Thư mục `node_modules` có cần nộp lên cho thầy cô không?
- **Trả lời:** Không cần. Chỉ cần nộp file `package.json`, thầy cô chỉ cần gõ `npm install` là máy sẽ tự động tải lại đầy đủ thư viện.

#### Câu 190: Nếu bấm vào nút trên web mà không thấy phản hồi thì kiểm tra lỗi ở đâu đầu tiên?
- **Trả lời:** Nhấn phím **F12** trên bàn phím -> Mở tab **Console** và tab **Network** để xem mã lỗi đỏ (vd: 401 Unauthorized, 404 Not Found, hay 500 Server Error).

#### Câu 191: Mã lỗi HTTP 401 có nghĩa là gì?
- **Trả lời:** Nghĩa là `Unauthorized` - Người dùng chưa đăng nhập hoặc token đăng nhập đã hết hạn.

#### Câu 192: Mã lỗi HTTP 403 có nghĩa là gì?
- **Trả lời:** Nghĩa là `Forbidden` - Người dùng đã đăng nhập nhưng không đủ quyền truy cập (vd: Khách hàng cố tình vào trang Admin).

#### Câu 193: Mã lỗi HTTP 404 có nghĩa là gì?
- **Trả lời:** Nghĩa là `Not Found` - Sai đường dẫn URL hoặc tài nguyên/phòng cần tìm không tồn tại.

#### Câu 194: Mã lỗi HTTP 500 có nghĩa là gì?
- **Trả lời:** Nghĩa là `Internal Server Error` - Có lỗi xảy ra trong code xử lý bên trong Backend (cần mở terminal Java xem chi tiết ngoại lệ Exception).

#### Câu 195: Axios trong Frontend đóng vai trò gì?
- **Trả lời:** Là thư viện HTTP Client dùng để gửi các request `GET`, `POST`, `PUT`, `DELETE` từ giao diện React tới các API của Spring Boot Backend.

#### Câu 196: Token đăng nhập JWT được lưu ở đâu trên trình duyệt người dùng?
- **Trả lời:** Được lưu an toàn trong **LocalStorage** hoặc Cookie của trình duyệt.

#### Câu 197: Khi người dùng bấm 'Đăng xuất' (Logout) thì chuyện gì xảy ra?
- **Trả lời:** Frontend xóa token JWT khỏi LocalStorage và điều hướng người dùng quay trở về màn hình Đăng nhập.

#### Câu 198: Làm thế nào để trình bày phần Demo một cách trôi chảy và ấn tượng nhất trước hội đồng?
- **Trả lời:** Nên chuẩn bị sẵn 2 tab trình duyệt: 1 tab Khách hàng đặt phòng -> Điền thông tin -> Nhận email; 1 tab Admin/Lễ tân mở sẵn màn hình Sơ đồ phòng -> Thấy đơn mới xuất hiện -> Bấm Check-in quét CCCD -> Xuất hóa đơn Check-out.

#### Câu 199: Nếu thầy cô yêu cầu sửa nhanh một đoạn text trên giao diện thì bạn sửa ở file nào?
- **Trả lời:** Vào thư mục `frontendHomestayManagement/src/pages/` hoặc `components/`, tìm file JSX tương ứng (ví dụ `HomeSearch.jsx`, `RoomCard.jsx`), sửa text và lưu lại (Ctrl + S), web sẽ tự động cập nhật ngay.

#### Câu 200: Câu kết luận tóm tắt khi kết thúc bài thuyết trình đồ án là gì?
- **Trả lời:** 'Dạ thưa quý thầy cô, hệ thống Quản lý Homestay của nhóm em đã hoàn thiện đầy đủ luồng nghiệp vụ thực tế, áp dụng thành công AI vào thủ tục Check-in và tư vấn khách hàng, hệ thống hoạt động ổn định và sẵn sàng đưa vào áp dụng thực tế. Nhóm em xin chân thành cảm ơn và kính mong nhận được những nhận xét quý báu từ thầy cô!'

---
