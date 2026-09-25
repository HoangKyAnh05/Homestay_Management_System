import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()
    
    # Page setup - Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Style definitions
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_title.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO - ĐỒ ÁN TỐT NGHIỆP SEP490\n")
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    
    run_title = p_title.add_run("TÀI LIỆU KỊCH BẢN & ĐẶC TẢ NGHIỆP VỤ BẢO VỆ ĐỒ ÁN\n")
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    run_name = p_title.add_run("ĐỀ TÀI: HỆ THỐNG QUẢN LÝ & VẬN HÀNH LÁ ĐỎ HOMESTAY SA PA")
    run_name.font.size = Pt(13)
    run_name.font.bold = True
    run_name.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)

    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(12)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_div = p_div.add_run("══════════════════════════════════════════════════════════════")
    r_div.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    # Rule Box
    table_rule = doc.add_table(rows=1, cols=1)
    table_rule.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_rule = table_rule.cell(0, 0)
    set_cell_background(cell_rule, "F4F6F9")
    set_cell_margins(cell_rule, top=140, bottom=140, left=200, right=200)
    
    p_rule = cell_rule.paragraphs[0]
    p_rule.paragraph_format.space_after = Pt(2)
    r_rhead = p_rule.add_run("📌 QUY ƯỚC MỨC ĐỘ THUYẾT TRÌNH THEO MÀU SẮC:\n")
    r_rhead.font.bold = True
    r_rhead.font.size = Pt(10.5)
    r_rhead.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_r1 = cell_rule.add_paragraph()
    p_r1.paragraph_format.space_after = Pt(2)
    r1 = p_r1.add_run("🔴 NHÓM MÀU ĐỎ (NÓI DÀI NHẤT / CỐT LÕI): ")
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_r1.add_run("Thời lượng 3.5 – 5.0 phút/luồng. Phân tích sâu toàn diện: Luồng nghiệp vụ, Logic xử lý, State Machine, CSDL & DTO, Giao diện/Nút bấm, Ca kiểm thử/Ngoại lệ và Kịch bản nói từng câu.")

    p_r2 = cell_rule.add_paragraph()
    p_r2.paragraph_format.space_after = Pt(2)
    r2 = p_r2.add_run("🟡 NHÓM MÀU VÀNG (NÓI VỪA PHẢI / ĐẶC THÙ): ")
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)
    p_r2.add_run("Thời lượng 2.5 – 3.5 phút/luồng. Nêu bật giá trị thực tế, logic kết nối nghiệp vụ và ứng dụng công nghệ.")

    p_r3 = cell_rule.add_paragraph()
    p_r3.paragraph_format.space_after = Pt(4)
    r3 = p_r3.add_run("🟢 NHÓM MÀU XANH (NÓI NGẮN GỌN / TIỆN ÍCH): ")
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)
    p_r3.add_run("Thời lượng 1.5 – 2.0 phút/luồng. Đi thẳng vào chức năng, kết quả vận hành và công nghệ sử dụng.")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper function to add speech box
    def add_speech_box(speech_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = tbl.cell(0, 0)
        set_cell_background(c, "FFFBEB") # Light warm yellow
        set_cell_margins(c, top=120, bottom=120, left=180, right=180)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_head = p.add_run("🗣️ KỊCH BẢN NÓI MẪU CHO THÀNH VIÊN:\n")
        r_head.font.bold = True
        r_head.font.size = Pt(10)
        r_head.font.color.rgb = RGBColor(0x92, 0x40, 0x0E)
        r_body = p.add_run(f'"{speech_text}"')
        r_body.font.italic = True
        r_body.font.size = Pt(10.5)
        r_body.font.color.rgb = RGBColor(0x45, 0x1A, 0x03)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # SECTION 1: RED GROUP
    # -------------------------------------------------------------
    p_h1 = doc.add_paragraph()
    p_h1.paragraph_format.space_before = Pt(14)
    p_h1.paragraph_format.space_after = Pt(6)
    r_h1 = p_h1.add_run("🔴 PHẦN I: CÁC LUỒNG TRỌNG TÂM CỐT LÕI (NÓI CHI TIẾT NHẤT)")
    r_h1.font.bold = True
    r_h1.font.size = Pt(14)
    r_h1.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)

    # --- TOPIC 1 ---
    p_t1 = doc.add_paragraph()
    p_t1.paragraph_format.space_before = Pt(8)
    r_t1 = p_t1.add_run("1. Quy trình Đăng ký tài khoản, Đăng nhập & Khôi phục mật khẩu\n")
    r_t1.font.bold = True
    r_t1.font.size = Pt(12.5)
    r_t1.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t1.add_run("👤 Người trình bày: Quang  |  ⏱️ Thời lượng: 4:30 - 5:00 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Quản lý toàn bộ vòng đời tài khoản định danh người dùng. Đảm bảo an toàn tuyệt đối qua mã hóa mật khẩu một chiều, cơ chế xác thực tài khoản qua OTP Email (chặn tài khoản ảo) và mang lại sự tiện lợi tối đa cho khách hàng thông qua đăng nhập một chạm với Google OAuth 2.0.")
    
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Đăng ký: Khách gửi Họ tên, Email, SĐT, Mật khẩu -> Backend kiểm tra trùng lặp -> Mã hóa mật khẩu bằng BCryptPasswordEncoder -> Tạo bản ghi Account (INACTIVE) + mã OTP 6 số trong AccountActivationToken (hạn 5 phút) -> JavaMailSender gửi OTP -> Khách nhập OTP kích hoạt sang ACTIVE (ROLE_CUSTOMER).\n"
                      "  2. Đăng nhập truyền thống: Xác thực Email/Password qua AuthenticationManager -> Sinh JWT Token (userId, role, hạn 24h) lưu LocalStorage.\n"
                      "  3. Đăng nhập Google OAuth2: Nhận ID Token từ Google -> Backend verify chữ ký với Google -> Tự tạo hồ sơ Customer nếu lần đầu -> Cấp JWT Token.\n"
                      "  4. Quên mật khẩu: Nhập Email -> Sinh OTP 6 số gửi về Email -> Xác thực OTP -> Cấp Reset Token dùng 1 lần -> Đổi mật khẩu mới -> Cập nhật hash.")

    doc.add_paragraph("• Nút bấm & Giao diện UI: [Đăng ký ngay], [Tạo tài khoản], Modal [Nhập mã OTP kích hoạt], [Đăng nhập], [Đăng nhập bằng Google], [Quên mật khẩu?], [Đặt lại mật khẩu].")
    doc.add_paragraph("• Trường hợp xử lý (Edge cases): Trùng email báo HTTP 400; Nhập sai OTP quá 3 lần ném OtpLockedException; Sai mật khẩu báo lỗi chung chống dò quét tài khoản.")
    doc.add_paragraph("• Công nghệ & API: Spring Security, JWT, BCrypt, JavaMailSender (Gmail SMTP), Google Identity API, POST /api/auth/register, POST /api/auth/verify-otp, POST /api/auth/login, POST /api/auth/google-login, POST /api/auth/forgot-password.")
    
    add_speech_box("Kính thưa Hội đồng, em xin phép trình bày phân hệ Xác thực và Phân quyền người dùng. Hệ thống của chúng em được xây dựng trên nền tảng Spring Security kết hợp JSON Web Token. Điểm mấu chốt đầu tiên là tính an toàn: khi khách hàng đăng ký, hệ thống không kích hoạt tài khoản ngay mà bắt buộc gửi một mã OTP 6 số qua email bằng JavaMailSender với hạn sử dụng 5 phút để chặn triệt để tài khoản rác. Mật khẩu được mã hóa BCrypt một chiều. Điểm mấu chốt thứ hai là tối ưu trải nghiệm: chúng em tích hợp Google OAuth 2.0 giúp khách hàng đăng nhập 1-Click mà không cần gõ mật khẩu. Toàn bộ API đều được chuẩn hóa và kiểm soát ngoại lệ chặt chẽ, ngăn chặn tấn công brute-force.")

    # --- TOPIC 2 ---
    p_t2 = doc.add_paragraph()
    p_t2.paragraph_format.space_before = Pt(8)
    r_t2 = p_t2.add_run("2. Quy trình Đặt phòng Online (Online Booking Flow)\n")
    r_t2.font.bold = True
    r_t2.font.size = Pt(12.5)
    r_t2.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t2.add_run("👤 Người trình bày: Kỳ Anh  |  ⏱️ Thời lượng: 4:30 - 5:00 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Cho phép khách hàng tra cứu phòng trống theo thời gian thực, xem hình ảnh phòng (view thung lũng Mường Hoa, săn mây), tiện ích đi kèm, áp dụng chính sách giá linh động (ngày thường, cuối tuần, ngày lễ) và giữ phòng an toàn trong 15 phút.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Tra cứu phòng trống: Khách chọn ngày Check-in/Check-out, số khách -> Backend truy vấn Room & BookingDetail bằng điều kiện phủ định trùng lịch NOT EXISTS (Booking.checkIn < RequestedCheckOut AND Booking.checkOut > RequestedCheckIn AND Status IN ['CONFIRMED', 'CHECKED_IN', 'PENDING']).\n"
                      "  2. Tính giá tự động (PricePolicy & RoomPriceConfig): Tự động nhân hệ số cuối tuần (Thứ 6, 7) và biểu giá Lễ/Tết; cộng phụ phí thêm người nếu vượt sức chứa tiêu chuẩn.\n"
                      "  3. Áp dụng Voucher: Kiểm tra hạn dùng, đơn hàng tối thiểu, số lượt còn lại (remaining_usage > 0) -> Trừ tiền % hoặc số tiền cố định.\n"
                      "  4. Khởi tạo Booking & Giữ chỗ: Tạo Booking (PENDING), lưu BookingDetail, khóa lịch phòng tạm thời 15 phút.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: [Tìm phòng trống], Thẻ phòng [Xem chi tiết], Form đặt phòng, Khung Voucher [Áp dụng], Nút [Xác nhận đặt phòng & Sang thanh toán].")
    doc.add_paragraph("• Trường hợp xử lý: Xung đột đặt phòng đồng thời (Concurrency) được xử lý bằng @Transactional và Optimistic Locking; Ngày Check-out <= Check-in bị chặn; Quá 15 phút Scheduler tự động hủy đơn PENDING mở lại phòng.")
    doc.add_paragraph("• Công nghệ & API: React 19, Spring Data JPA, Hibernate Optimistic Locking, Date Picker, GET /api/bookings/check-availability, POST /api/bookings/calculate-price, POST /api/bookings/create-online-booking.")
    
    add_speech_box("Tiếp theo, em xin trình bày Quy trình Đặt phòng Online - trái tim của trải nghiệm khách hàng. Khi khách truy cập và chọn ngày, hệ thống sẽ thực thi thuật toán kiểm tra phòng trống thông minh dựa trên bảng RoomSchedule và BookingDetail, đảm bảo không bao giờ xảy ra tình trạng Double-Booking. Về mặt giá cả, chúng em cài đặt hệ thống định giá động: giá phòng tự động thay đổi theo ngày thường, ngày cuối tuần và các dịp Lễ Tết theo cấu hình của Admin. Sau khi nhấn xác nhận, hệ thống tạo bản ghi Booking ở trạng thái PENDING và giữ phòng trong đúng 15 phút, vừa bảo vệ quyền lợi của khách đang quét mã, vừa tránh tình trạng giữ chỗ ảo.")

    # --- TOPIC 3 ---
    p_t3 = doc.add_paragraph()
    p_t3.paragraph_format.space_before = Pt(8)
    r_t3 = p_t3.add_run("3. Quy trình Thanh toán trực tuyến tự động (SePay VietQR)\n")
    r_t3.font.bold = True
    r_t3.font.size = Pt(12.5)
    r_t3.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t3.add_run("👤 Người trình bày: Kỳ Anh  |  ⏱️ Thời lượng: 4:00 - 4:30 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Tự động hóa 100% quy trình thanh toán không tiền mặt bằng mã QR Ngân hàng (VietQR). Loại bỏ hoàn toàn thao tác chụp màn hình, kiểm tra sao kê thủ công của nhân viên lễ tân, xác thực giao dịch thời gian thực chỉ sau 1–3 giây.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Sinh mã VietQR động: Backend tạo mã QR chuẩn NAPAS 247 với cú pháp nội dung duy nhất: LADO <MÃ_BOOKING> (Ví dụ: LADO BK98231) và số tiền chính xác.\n"
                      "  2. Khách quét mã & Chuyển khoản: Mở App ngân hàng bất kỳ quét mã -> Chuyển tiền.\n"
                      "  3. SePay Webhook xử lý thời gian thực: Tiền vào tài khoản -> Cổng SePay bắt biến động số dư -> Bắn Webhook POST về /api/payments/sepay-webhook -> Backend verify API-Key -> Dùng Regex bóc tách mã BK98231 -> Đối soát số tiền -> Cập nhật Payment (SUCCESS) và Booking (CONFIRMED) -> Tự động gửi Email xác nhận vé đặt phòng cho khách.\n"
                      "  4. Polling UI: React Frontend polling nhẹ 2s/lần -> Tự động chuyển sang trang Đặt phòng thành công ngay khi Webhook hoàn tất.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: Modal VietQR lớn, Bộ đếm lùi 15:00, [Sao chép STK], [Sao chép số tiền], [Sao chép nội dung CK], [Tôi đã hoàn tất chuyển khoản], [Hủy đơn].")
    doc.add_paragraph("• Trường hợp xử lý: Chuyển thiếu tiền -> cập nhật PARTIALLY_PAID yêu cầu bù; Chuyển sai nội dung -> lưu UnmatchedPaymentLog để lễ tân đối soát 1-Click; Mất mạng Client -> Webhook máy chủ vẫn kích hoạt và gửi email bình thường.")
    doc.add_paragraph("• Công nghệ & API: SePay Webhook Engine, VietQR API, Spring Security Signature Verification, JavaMailSender, POST /api/payments/create-vietqr, POST /api/payments/sepay-webhook, GET /api/payments/check-status/{bookingCode}.")
    
    add_speech_box("Kính thưa Thầy Cô, thanh toán trực tuyến là một trong những điểm đột phá nhất của dự án. Thay vì dùng các cổng thanh toán phức tạp đòi hỏi mở thẻ quốc tế, chúng em tích hợp Cổng thanh toán SePay VietQR. Khi khách quét mã và chuyển khoản, cổng SePay sẽ bắt biến động số dư và bắn một Webhook về Backend. Hệ thống tự động kiểm tra chữ ký bảo mật, bóc tách mã đơn hàng, đối soát số tiền khớp 100% và cập nhật trạng thái đơn sang CONFIRMED chỉ trong vòng 1 đến 2 giây. Đồng thời, một email vé điện tử tự động gửi về cho khách, loại bỏ hoàn toàn sai sót và thời gian chờ đợi của con người.")

    # --- TOPIC 4 ---
    p_t4 = doc.add_paragraph()
    p_t4.paragraph_format.space_before = Pt(8)
    r_t4 = p_t4.add_run("4. Quy trình Nhận phòng (Check-in) & Trả phòng (Check-out)\n")
    r_t4.font.bold = True
    r_t4.font.size = Pt(12.5)
    r_t4.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t4.add_run("👤 Người trình bày: Nguyên  |  ⏱️ Thời lượng: 4:30 - 5:00 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Số hóa nghiệp vụ quầy lễ tân: Đón tiếp khách, nhận diện thông tin Căn cước công dân tự động bằng OCR.space, quản lý danh sách khách lưu trú, kích hoạt cổng Stay Portal và tổng hợp toàn bộ chi phí (phòng, minibar, dịch vụ, tiền phạt) vào một Hóa đơn duy nhất khi trả phòng.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Check-in & OCR CCCD: Lễ tân mở Room Matrix -> Chọn phòng -> Bấm Check-in -> Tải ảnh chụp CCCD của khách -> Backend gọi API OCR.space bóc tách Họ tên, Số CCCD (12 số), Ngày sinh, Địa chỉ -> Tự động điền Form lưu vào BookingGuest & CheckInRecord -> Cập nhật Room (OCCUPIED), Booking (CHECKED_IN) -> Cấp quyền truy cập Stay Portal cho khách.\n"
                      "  2. Check-out & Quyết toán: Bấm Check-out -> Hệ thống tính Tổng Hóa Đơn = Tiền phòng còn lại + Tổng Minibar + Tổng Dịch vụ + Tổng Tiền phạt - Tiền cọc -> Sinh bản ghi Invoice -> Thu tiền chốt đơn -> Cập nhật Booking (CHECKED_OUT), Room (DIRTY) để báo buồng phòng.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: [Làm thủ tục Check-in], [Chụp ảnh / Tải CCCD], [Trích xuất OCR], [Lưu thông tin lưu trú], [Thủ tục Check-out], [Xem trước Hóa đơn], [In Hóa đơn PDF], [Xác nhận Trả phòng].")
    doc.add_paragraph("• Trường hợp xử lý: Ảnh mờ thì OCR cảnh báo cho sửa tay; Quét nhiều CCCD cho đoàn đông; Check-in sớm/Check-out trễ tự động tính phụ thu theo cấu hình AdminPriceConfig.")
    doc.add_paragraph("• Công nghệ & API: OCR.space REST API, Spring Data JPA, React Matrix Room Visualizer, JSPDF, POST /api/receptionist/ocr-cccd, POST /api/receptionist/check-in, POST /api/receptionist/check-out, GET /api/receptionist/invoice-preview/{bookingId}.")
    
    add_speech_box("Em xin phép trình bày Phân hệ Vận hành Lễ tân với hai nghiệp vụ sống còn: Nhận phòng và Trả phòng. Điểm nâng cấp lớn nhất ở khâu Nhận phòng là chúng em tích hợp API OCR.space. Thay vì lễ tân phải gõ tay từng dòng thông tin CCCD của khách vừa lâu vừa dễ sai sót, nay chỉ cần 1 thao tác tải ảnh, hệ thống tự động bóc tách chính xác Họ tên, Số CCCD, Ngày sinh và Địa chỉ để lưu hồ sơ lưu trú theo đúng quy định. Tại khâu Trả phòng, hệ thống tự động tổng hợp toàn bộ chi phí: từ tiền phòng, nước uống minibar, dịch vụ giặt là đến các khoản phạt hư hỏng nếu có để xuất ra một Hóa đơn duy nhất. Ngay sau khi hoàn tất, trạng thái phòng lập tức chuyển sang DIRTY để thông báo cho nhân viên buồng phòng.")

    # --- TOPIC 5 ---
    p_t5 = doc.add_paragraph()
    p_t5.paragraph_format.space_before = Pt(8)
    r_t5 = p_t5.add_run("5. Quy trình Dọn phòng / Dịch vụ buồng phòng (Housekeeping)\n")
    r_t5.font.bold = True
    r_t5.font.size = Pt(12.5)
    r_t5.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t5.add_run("👤 Người trình bày: Nguyên  |  ⏱️ Thời lượng: 3:30 - 4:00 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Quản lý và đồng bộ toàn bộ luồng công việc của nhân viên buồng phòng (Housekeeping), bảo đảm quy chuẩn vệ sinh 5 sao trước khi đón khách mới thông qua bảng lịch Calendar trực quan và danh sách kiểm tra (Checklist) tiêu chuẩn hóa.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Tự động kích hoạt: Sau khi phòng Check-out, phòng sang DIRTY -> Tự động sinh HousekeepingTask.\n"
                      "  2. Phân công: Quản lý xem Housekeeping Calendar -> Phân công nhân viên phụ trách.\n"
                      "  3. Thực hiện & Checklist: Nhân viên mở điện thoại bấm [Bắt đầu dọn] (phòng sang CLEANING) -> Tích Checklist 5 tiêu chuẩn: Thay ga gối, bổ sung đồ amenities, châm minibar, lau dọn sàn/toilet, kiểm tra điều hòa/nước nóng.\n"
                      "  4. Nghiệm thu: Bấm [Báo hoàn thành] (sang INSPECTING) -> Lễ tân/Quản lý nghiệm thu bấm [Duyệt đạt] -> Phòng chuyển sang AVAILABLE / CLEAN sẵn sàng đón khách.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: [Nhận việc], [Bắt đầu dọn], Bộ Checkbox Checklist tiêu chuẩn, [Báo hoàn tất dọn], [Báo sự cố hỏng hóc], [Duyệt hoàn thành].")
    doc.add_paragraph("• Trường hợp xử lý: Phát hiện đồ hỏng bấm [Báo sự cố] lập tức tạo RoomIncident; Phòng có khách sắp đến trong 1h mà vẫn DIRTY sẽ gắn nhãn đỏ cảnh báo khẩn cấp.")
    doc.add_paragraph("• Công nghệ & API: React Responsive UI, FullCalendar Component, Spring Boot Service Layer, GET /api/admin/housekeeping/tasks, POST /api/admin/housekeeping/assign, PUT /api/admin/housekeeping/tasks/{id}/start, POST /api/admin/housekeeping/tasks/{id}/submit-checklist.")
    
    add_speech_box("Quy trình Dọn phòng và Buồng phòng giúp giải quyết bài toán giao tiếp rời rạc giữa Lễ tân và Lao công. Ngay khi khách trả phòng, hệ thống tự động sinh nhiệm vụ dọn dẹp. Nhân viên buồng phòng nhận việc trên điện thoại, thực hiện kiểm tra theo từng tiêu chí trong Checklist quy chuẩn từ thay ga gối, châm nước minibar đến kiểm tra thiết bị. Sau khi nghiệm thu xong, trạng thái phòng lập tức đồng bộ về hệ thống sang AVAILABLE. Nhờ đó, lễ tân không cần phải gọi điện hỏi han hay chạy lên tận phòng kiểm tra, giúp tối ưu 50% thời gian chuẩn bị phòng đón khách mới.")

    # --- TOPIC 6 ---
    p_t6 = doc.add_paragraph()
    p_t6.paragraph_format.space_before = Pt(8)
    r_t6 = p_t6.add_run("6. Quy trình Hủy phòng & Hoàn tiền (Cancellation & Refund)\n")
    r_t6.font.bold = True
    r_t6.font.size = Pt(12.5)
    r_t6.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t6.add_run("👤 Người trình bày: Tiến  |  ⏱️ Thời lượng: 3:30 - 4:00 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Xử lý yêu cầu hủy phòng từ phía khách hàng dựa trên chính sách hủy phòng (DepositPolicy) được cấu hình minh bạch, tự động tính tỷ lệ hoàn tiền theo mốc ngày và cung cấp luồng duyệt hoàn tiền chặt chẽ cho Quản lý.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Gửi yêu cầu: Khách vào BookingHistoryPage -> Bấm [Yêu cầu hủy phòng] -> Nhập lý do + STK nhận tiền.\n"
                      "  2. Tính tỷ lệ hoàn tiền tự động theo DepositPolicy: So sánh ngày hủy với ngày Check-in dự kiến (delta t):\n"
                      "     - Hủy trước >= 7 ngày: Hoàn 100% tiền đã đóng.\n"
                      "     - Hủy từ 3 đến 6 ngày: Hoàn 50% tiền đã đóng.\n"
                      "     - Hủy dưới 3 ngày: Hoàn 0% (Không hoàn cọc).\n"
                      "     Đơn chuyển trạng thái CANCELLATION_REQUESTED.\n"
                      "  3. Phê duyệt & Mở phòng: Admin kiểm tra trên AdminCancellationsPage -> Bấm [Duyệt hoàn tiền] -> Cập nhật Booking sang CANCELLED -> Tự động xóa khóa lịch trong RoomSchedule, phòng lập tức trống trở lại trên website bán phòng.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: [Yêu cầu hủy phòng], Modal nhập STK/Ngân hàng, [Xác nhận gửi], [Phê duyệt hoàn tiền], [Từ chối hủy đơn].")
    doc.add_paragraph("• Trường hợp xử lý: Đơn PENDING chưa trả tiền thì hủy ngay lập tức; Đơn đang ở hoặc đã qua ngày nhận phòng thì khóa nút hủy.")
    doc.add_paragraph("• Công nghệ & API: Spring Policy Engine, MySQL Transaction Management, POST /api/bookings/{id}/cancel-request, GET /api/admin/cancellations/pending, POST /api/admin/cancellations/{id}/approve.")
    
    add_speech_box("Về quy trình Hủy phòng và Hoàn tiền, hệ thống bảo đảm tính minh bạch tuyệt đối thông qua bảng chính sách DepositPolicy. Tỷ lệ hoàn tiền được hệ thống tự động tính toán dựa trên khoảng thời gian từ lúc hủy đến ngày nhận phòng: hủy trước 7 ngày hoàn 100%, từ 3 đến 6 ngày hoàn 50%, và dưới 3 ngày sẽ không hoàn tiền. Điều này giúp bảo vệ doanh thu cho Homestay trước các trường hợp hủy sát giờ. Khi Admin duyệt hoàn tiền, hệ thống sẽ mở khóa lịch phòng ngay lập tức trên hệ thống bán online để tối đa hóa tỷ lệ lấp đầy phòng trống.")

    # --- TOPIC 7 ---
    p_t7 = doc.add_paragraph()
    p_t7.paragraph_format.space_before = Pt(8)
    r_t7 = p_t7.add_run("7. Quy trình Đặt phòng trực tiếp (Walk-in) & Quản lý tiền mặt tự động\n")
    r_t7.font.bold = True
    r_t7.font.size = Pt(12.5)
    r_t7.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    p_t7.add_run("👤 Người trình bày: Kỳ Anh  |  ⏱️ Thời lượng: 4:00 - 4:30 phút")

    doc.add_paragraph("• Mô tả nghiệp vụ: Giải quyết trường hợp khách vãng lai đến thuê phòng trực tiếp tại quầy. Lễ tân thao tác nhanh trong 30 giây và hệ thống tự động quản lý dòng tiền mặt thực tế tại quầy, tự động cân đối quỹ mà không cần sổ sách thủ công.")
    doc.add_paragraph("• Logic xử lý chi tiết:\n"
                      "  1. Tạo đơn Walk-in: Lễ tân nhấp vào ô phòng trống trên Room Matrix -> Bấm [Đặt phòng tại quầy (Walk-in)] -> Chọn số đêm, nhập Tên, SĐT -> Tính giá phòng tự động.\n"
                      "  2. Quản lý tiền mặt tự động (Automated Cash Ledger): Lễ tân chọn '(•) Thu tiền mặt tại quầy' -> Backend tạo bản ghi FundAdjustmentLog trong sổ quỹ: Số dư mới = Số dư hiện tại + Số tiền thu -> Phân loại nguồn thu 'Thu tiền phòng Walk-in #WI123'.\n"
                      "  3. Check-in ngay: Tạo Booking trạng thái CHECKED_IN, phòng chuyển OCCUPIED tức thì.")
    doc.add_paragraph("• Nút bấm & Giao diện UI: [Đặt phòng Walk-in], Nút chuyển đổi [Tiền mặt] / [Chuyển khoản QR], [Xác nhận thu tiền & Nhận phòng ngay], Widget [Số dư tiền mặt trong két].")
    doc.add_paragraph("• Trường hợp xử lý: Nếu phòng có khách online đặt ngày mai thì chỉ cho thuê 1 đêm; Khách cọc một phần thì số tiền thiếu tự động chuyển thành công nợ phòng để thu lúc Check-out.")
    doc.add_paragraph("• Công nghệ & API: Spring Data JPA, Automated Ledger Transaction, POST /api/receptionist/walk-in-booking, GET /api/admin/cash-fund/balance, POST /api/admin/cash-fund/log.")
    
    add_speech_box("Để phục vụ các khách hàng vãng lai tới trực tiếp homestay, chúng em phát triển quy trình Walk-in Booking kết hợp Quản lý tiền mặt tự động. Lễ tân chỉ cần bấm vào phòng trống trên sơ đồ, nhập số đêm và bấm thu tiền mặt. Điểm ưu việt ở đây là hệ thống loại bỏ hoàn toàn việc ghi chép sổ sách thủ công. Mỗi đồng tiền mặt lễ tân thu từ khách đều được hệ thống tự động ghi nhật ký vào sổ quỹ két tiền. Cuối ngày, chủ homestay chỉ cần mở Báo cáo quỹ là biết chính xác từng khoản thu chi tiền mặt khớp chuẩn 100% với số tiền thực tế trong két.")

    # -------------------------------------------------------------
    # SECTION 2: YELLOW GROUP
    # -------------------------------------------------------------
    p_h2 = doc.add_paragraph()
    p_h2.paragraph_format.space_before = Pt(14)
    p_h2.paragraph_format.space_after = Pt(6)
    r_h2 = p_h2.add_run("🟡 PHẦN II: CÁC LUỒNG TÍNH NĂNG ĐẶC THÙ (NÓI VỪA PHẢI)")
    r_h2.font.bold = True
    r_h2.font.size = Pt(14)
    r_h2.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)

    # --- TOPIC 8 ---
    p_t8 = doc.add_paragraph()
    p_t8.paragraph_format.space_before = Pt(8)
    r_t8 = p_t8.add_run("8. Quy trình Lưu trú, Book thêm ngày & Đổi phòng\n")
    r_t8.font.bold = True
    r_t8.font.size = Pt(12)
    r_t8.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)
    p_t8.add_run("👤 Người trình bày: Quân  |  ⏱️ Thời lượng: 2:30 - 3:00 phút")

    doc.add_paragraph("• Mô tả & Logic: Hỗ trợ khách hàng đang ở homestay có nhu cầu gia hạn thêm ngày nghỉ hoặc nâng cấp/chuyển đổi sang hạng phòng khác.\n"
                      "  - Gia hạn ngày: Khách/Lễ tân chọn ngày Check-out mới -> Hệ thống kiểm tra phòng trống -> Tính tiền phòng phát sinh -> Cập nhật BookingDetail.checkOutDate.\n"
                      "  - Đổi phòng: Khách chọn phòng mới -> Hệ thống tính chênh lệch giá (Giá phòng mới - Giá phòng cũ còn lại) -> Cập nhật chuyển phòng, phòng cũ sang DIRTY, phòng mới sang OCCUPIED.")
    doc.add_paragraph("• Nút bấm UI: [Gia hạn lưu trú], [Yêu cầu đổi phòng], [Tính chênh lệch giá], [Xác nhận chuyển phòng].")
    doc.add_paragraph("• Công nghệ & API: POST /api/bookings/extend-stay, POST /api/bookings/change-room.")
    add_speech_box("Trong quá trình lưu trú, nếu khách muốn ở thêm hoặc đổi phòng view mây đẹp hơn, hệ thống hỗ trợ tính toán tức thì tiền chênh lệch giá và tự động điều phối trạng thái phòng cũ sang dọn dẹp và phòng mới sang có khách, giúp việc phục vụ linh hoạt và liền mạch.")

    # --- TOPIC 9 ---
    p_t9 = doc.add_paragraph()
    p_t9.paragraph_format.space_before = Pt(8)
    r_t9 = p_t9.add_run("9. Quy trình Xử lý Hư hỏng & Sự cố phòng\n")
    r_t9.font.bold = True
    r_t9.font.size = Pt(12)
    r_t9.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)
    p_t9.add_run("👤 Người trình bày: Quân  |  ⏱️ Thời lượng: 2:30 - 3:00 phút")

    doc.add_paragraph("• Mô tả & Logic: Ghi nhận các sự cố hỏng hóc thiết bị trong phòng (vỡ cốc, hỏng điều hòa, rách ga) do khách làm hỏng hoặc hỏng tự nhiên, tính phí phạt đền bù theo quy định minh bạch.\n"
                      "  - Tạo phiếu RoomIncident kèm ảnh chụp hiện trường.\n"
                      "  - Hệ thống tra cứu bảng phí đền bù RulesPenalty niêm yết -> Tự động đưa khoản phí phạt vào Hóa đơn Invoice lúc Check-out của phòng đó. Nếu phòng hỏng nặng -> Chuyển trạng thái sang MAINTENANCE (Bảo trì).")
    doc.add_paragraph("• Nút bấm UI: [Báo cáo sự cố], [Tải ảnh hiện trường], [Áp dụng phí đền bù], [Chuyển phòng bảo trì].")
    doc.add_paragraph("• Công nghệ & API: POST /api/receptionist/incidents, GET /api/admin/rules-penalties, PUT /api/admin/incidents/{id}/resolve.")
    add_speech_box("Quy trình xử lý sự cố giúp giải quyết văn minh và minh bạch các vấn đề hỏng hóc đồ đạc. Mọi mức phạt đều được định nghĩa sẵn theo danh mục RulesPenalty có hình ảnh chứng minh, tự động cộng vào hóa đơn thanh toán, tránh tranh cãi giữa nhân viên và khách hàng.")

    # --- TOPIC 10 ---
    p_t10 = doc.add_paragraph()
    p_t10.paragraph_format.space_before = Pt(8)
    r_t10 = p_t10.add_run("10. Quy trình Khách hàng thân thiết, Vòng quay may mắn & Tiếp thị AI\n")
    r_t10.font.bold = True
    r_t10.font.size = Pt(12)
    r_t10.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)
    p_t10.add_run("👤 Người trình bày: Kỳ Anh  |  ⏱️ Thời lượng: 3:00 - 3:30 phút")

    doc.add_paragraph("• Mô tả & Logic: Tích điểm hội viên, minigame Vòng quay may mắn trúng voucher và bộ công cụ Marketing Extension tự động hóa đăng bài, lên lịch và quét bình luận mạng xã hội.\n"
                      "  1. Vòng quay may mắn (GiveawayLuckyWheelPage): Khách quay thưởng trúng Voucher 10%, 20% -> Lưu thông tin khách tiềm năng (GiveawayLead).\n"
                      "  2. Tiện ích Social Extension (lado-social-extension):\n"
                      "     - Tự động đăng bài từ Google Drive: Tự lấy ảnh/video từ Drive để đăng lên mạng xã hội.\n"
                      "     - Lên lịch đăng bài (Content Scheduling) theo khung giờ vàng.\n"
                      "     - Quét bình luận & AI Auto-reply: Quét comment trên mạng xã hội, dùng AI Groq (Llama-3.3 70B) phân loại nhu cầu và tự động trả lời, điều hướng khách về website đặt phòng.")
    doc.add_paragraph("• Nút bấm UI: [Quay thưởng ngay], [Nhận mã Voucher], [Lên lịch đăng bài], [Đồng bộ Google Drive], [Quét bình luận AI].")
    doc.add_paragraph("• Công nghệ & API: Chrome Extension Manifest V3, Groq LLM API, Google Drive API, React Canvas Wheel.")
    add_speech_box("Để chủ động tìm kiếm và giữ chân khách hàng, hệ thống trang bị Minigame Vòng quay may mắn và đặc biệt là Tiện ích Chrome Extension lado-social-extension. Tiện ích này tích hợp AI Groq và Google Drive, cho phép tự động lấy ảnh từ Drive để lên lịch đăng bài và tự động quét bình luận của khách trên mạng xã hội để trả lời bằng AI, giúp tăng 40% hiệu quả tiếp thị số.")

    # -------------------------------------------------------------
    # SECTION 3: GREEN GROUP
    # -------------------------------------------------------------
    p_h3 = doc.add_paragraph()
    p_h3.paragraph_format.space_before = Pt(14)
    p_h3.paragraph_format.space_after = Pt(6)
    r_h3 = p_h3.add_run("🟢 PHẦN III: CÁC LUỒNG TIỆN ÍCH & QUẢN TRỊ (NÓI NGẮN GỌN)")
    r_h3.font.bold = True
    r_h3.font.size = Pt(14)
    r_h3.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)

    # --- TOPIC 11 ---
    p_t11 = doc.add_paragraph()
    p_t11.paragraph_format.space_before = Pt(8)
    r_t11 = p_t11.add_run("11. Quy trình Đánh giá & Kiểm duyệt (Review & Moderation)\n")
    r_t11.font.bold = True
    r_t11.font.size = Pt(11.5)
    r_t11.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)
    p_t11.add_run("👤 Người trình bày: Quân  |  ⏱️ Thời lượng: 1:30 - 2:00 phút")

    doc.add_paragraph("• Mô tả & Logic: Sau khi trả phòng, khách hàng gửi đánh giá (1-5 sao, nhận xét, ảnh trải nghiệm). Đánh giá được chuyển về danh sách chờ duyệt của Admin (AdminReviewsPage). Admin bấm [Duyệt] để hiển thị công khai trên trang chủ hoặc [Ẩn] các đánh giá có nội dung spam/tiêu cực.\n"
                      "• Nút bấm UI: [Gửi đánh giá], [Duyệt hiển thị], [Ẩn đánh giá].\n"
                      "• Công nghệ & API: POST /api/customer/reviews, GET /api/admin/reviews, PUT /api/admin/reviews/{id}/status.")
    add_speech_box("Hệ thống cho phép khách hàng gửi đánh giá kèm hình ảnh thực tế sau chuyến đi. Admin có bảng kiểm duyệt tập trung để phê duyệt trước khi công khai lên website, đảm bảo tính chân thực và uy tín thương hiệu của homestay.")

    # --- TOPIC 12 ---
    p_t12 = doc.add_paragraph()
    p_t12.paragraph_format.space_before = Pt(8)
    r_t12 = p_t12.add_run("12. Quy trình Book dịch vụ qua mail & Phiếu giảm giá\n")
    r_t12.font.bold = True
    r_t12.font.size = Pt(11.5)
    r_t12.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)
    p_t12.add_run("👤 Người trình bày: Nguyên  |  ⏱️ Thời lượng: 1:30 - 2:00 phút")

    doc.add_paragraph("• Mô tả & Logic: Khách hàng nhận được email xác nhận hoặc email tri ân chứa liên kết đặt thêm dịch vụ (thuê xe máy, tiệc BBQ, tour trekking) và mã Voucher giảm giá độc quyền. Khách chỉ cần nhấp link trong mail để tự động áp dụng mã giảm giá và kích hoạt dịch vụ lưu trú.\n"
                      "• Nút bấm UI: [Đặt dịch vụ trong mail], [Nhập mã Voucher], [Áp dụng ưu đãi].\n"
                      "• Công nghệ & API: Thymeleaf / HTML Email Templates, JavaMailSender, POST /api/vouchers/validate.")
    add_speech_box("Chúng em xây dựng luồng tiếp thị tự động qua email: khi có voucher mới hoặc trước ngày nhận phòng, hệ thống tự động gửi email kèm nút đặt dịch vụ 1-Click giúp gia tăng doanh thu từ các dịch vụ phụ trợ như thuê xe hay ăn uống.")

    # --- TOPIC 13 ---
    p_t13 = doc.add_paragraph()
    p_t13.paragraph_format.space_before = Pt(8)
    r_t13 = p_t13.add_run("13. Dữ liệu gốc & Quản trị hệ thống\n")
    r_t13.font.bold = True
    r_t13.font.size = Pt(11.5)
    r_t13.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)
    p_t13.add_run("👤 Người trình bày: Kỳ Anh  |  ⏱️ Thời lượng: 1:30 - 2:00 phút")

    doc.add_paragraph("• Mô tả & Logic: Cung cấp cho Quản trị viên khả năng quản lý toàn diện: danh mục phòng (AdminRoomsPage), tài khoản phân quyền nhân viên (AdminUsersPage), cấu hình bảng giá mùa cao điểm (AdminPriceConfig), và xuất báo cáo tài chính hàng ngày đồng bộ trực tiếp lên Google Sheets.\n"
                      "• Nút bấm UI: [Thêm phòng mới], [Cấu hình giá mùa lễ], [Phân quyền nhân viên], [Đồng bộ Google Sheets].\n"
                      "• Công nghệ & API: Spring Data JPA, Google Sheets API v4, Dynamic Role-Based Access Control (RBAC).")
    add_speech_box("Cuối cùng, phân hệ Quản trị hệ thống là đầu não quản lý toàn bộ dữ liệu gốc, phân quyền nhân viên và tự động đồng bộ doanh thu lên Google Sheets, giúp ban quản lý theo dõi kinh doanh mọi lúc mọi nơi.")

    # -------------------------------------------------------------
    # SECTION 4: SUMMARY TABLE
    # -------------------------------------------------------------
    doc.add_page_break()
    p_sum_head = doc.add_paragraph()
    r_sh = p_sum_head.add_run("📊 BẢNG TỔNG HỢP PHÂN CÔNG & THỜI LƯỢNG THUYẾT TRÌNH TOÀN ĐỘI")
    r_sh.font.bold = True
    r_sh.font.size = Pt(13)
    r_sh.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    summary_data = [
        ("STT", "Luồng Nghiệp Vụ", "Mức Độ / Màu", "Người Trình Bày", "Thời Lượng Dự Kiến"),
        ("1", "Đăng ký, Đăng nhập & Khôi phục mật khẩu", "🔴 Đỏ (Dài nhất)", "Quang", "4:45 phút"),
        ("2", "Đặt phòng Online & Giữ chỗ 15 phút", "🔴 Đỏ (Dài nhất)", "Kỳ Anh", "4:45 phút"),
        ("3", "Thanh toán trực tuyến SePay VietQR", "🔴 Đỏ (Dài nhất)", "Kỳ Anh", "4:15 phút"),
        ("4", "Nhận phòng (OCR.space) & Trả phòng", "🔴 Đỏ (Dài nhất)", "Nguyên", "4:45 phút"),
        ("5", "Dọn phòng & Buồng phòng Checklist", "🔴 Đỏ (Dài)", "Nguyên", "3:45 phút"),
        ("6", "Hủy phòng & Hoàn tiền theo mốc ngày", "🔴 Đỏ (Dài)", "Tiến", "3:45 phút"),
        ("7", "Đặt phòng Walk-in & Quản lý tiền mặt", "🔴 Đỏ (Dài)", "Kỳ Anh", "4:15 phút"),
        ("8", "Lưu trú, Book thêm ngày & Đổi phòng", "🟡 Vàng (Vừa)", "Quân", "2:45 phút"),
        ("9", "Xử lý Hư hỏng & Sự cố phòng", "🟡 Vàng (Vừa)", "Quân", "2:45 phút"),
        ("10", "Khách hàng thân thiết & Social AI Extension", "🟡 Vàng (Vừa)", "Kỳ Anh", "3:15 phút"),
        ("11", "Đánh giá & Kiểm duyệt Review", "🟢 Xanh (Ngắn)", "Quân", "1:45 phút"),
        ("12", "Book dịch vụ qua mail & Phiếu giảm giá", "🟢 Xanh (Ngắn)", "Nguyên", "1:45 phút"),
        ("13", "Dữ liệu gốc & Đồng bộ Google Sheets", "🟢 Xanh (Ngắn)", "Kỳ Anh", "1:45 phút"),
        ("🏁", "TỔNG THỜI LƯỢNG TOÀN ĐỘI", "13 Luồng Toàn Diện", "Cả 4 Thành Viên", "~44 Phút")
    ]

    tbl_sum = doc.add_table(rows=len(summary_data), cols=5)
    tbl_sum.alignment = WD_TABLE_ALIGNMENT.CENTER

    for row_idx, row_data in enumerate(summary_data):
        for col_idx, text in enumerate(row_data):
            cell = tbl_sum.cell(row_idx, col_idx)
            cell.text = text
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 2, 4] else WD_ALIGN_PARAGRAPH.LEFT
            if row_idx == 0:
                set_cell_background(cell, "1B365D")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            elif row_idx == len(summary_data) - 1:
                set_cell_background(cell, "FEF3C7")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0x92, 0x40, 0x0E)
            else:
                bg = "F9FAFB" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    # Save to Root project directory
    out_path = r"d:\Work_Code_22_26\SEP490\Homestay_Management_System\KICH_BAN_THUYET_TRINH_SEP490_LA_DO_HOMESTAY.docx"
    doc.save(out_path)
    print(f"SUCCESS: Document generated at {out_path}")

if __name__ == '__main__':
    create_document()
