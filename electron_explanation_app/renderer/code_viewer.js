// CONFIGURATION FOR ALL CORE CODE FLOWS
window.FLOWS_CONFIG = {
  "auth_login": {
    "title": "STT 1: 3.2.1 Email & Password Login",
    "desc": "Hướng dẫn đăng nhập bằng email và mật khẩu, lưu token JWT, chuyển hướng theo role.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.2.1):</strong><br>1. Người dùng nhập credentials trên UI tại file <code>LoginPage.jsx</code> (Khách) hoặc <code>AdminLoginPage.jsx</code> (Admin/Staff), chuyển qua component <code>LoginForm.jsx</code> để validate không để rỗng email/mật khẩu.<br>2. <code>LoginForm.jsx</code> gọi API <code>POST /api/auth/login</code> (hoặc <code>/admin-login</code>) tới <code>AuthController.java</code>.<br>3. Request đi qua <code>SecurityConfig.java</code> (Spring Security permitAll cho endpoint auth).<br>4. Lớp <code>AuthServiceImpl.java</code> kiểm tra mật khẩu BCrypt với DB <code>UserRepository.java</code>, sinh chuỗi JWT Bearer Token chứa Role (<code>ROLE_CUSTOMER</code> / <code>ROLE_ADMIN</code> / <code>ROLE_STAFF</code>).<br>5. <code>AuthResponseDto</code> trả về Client. Frontend lưu JWT Token vào <code>localStorage</code> và chuyển hướng (redirect) theo role về <code>/</code> hoặc <code>/admin/dashboard</code>.",
    "steps": [
      {
        "name": "LoginPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Login/LoginPage.jsx",
        "layer": "Frontend UI",
        "desc": "Trang đăng nhập dành cho khách hàng. Thu nhận email/mật khẩu.",
        "dto": "LoginRequest (email, password)",
        "validation": "Kiểm tra định dạng email và mật khẩu không được rỗng.",
        "security": "Public Access."
      },
      {
        "name": "AdminLoginPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminLoginPage.jsx",
        "layer": "Frontend UI",
        "desc": "Trang đăng nhập dành cho Quản trị viên và Lễ tân/Nhân viên.",
        "dto": "AdminLoginRequest (usernameOrEmail, password)",
        "validation": "Validate credentials tài khoản quản trị.",
        "security": "Phân định quyền truy cập trang quản trị."
      },
      {
        "name": "LoginForm.jsx",
        "path": "frontendHomestayManagement/src/components/LoginForm/LoginForm.jsx",
        "layer": "Frontend Component",
        "desc": "Component Form đăng nhập dùng chung, xử lý submit và tương tác API Auth.",
        "dto": "Form Submit Payload",
        "validation": "Validate dữ liệu đầu vào client-side.",
        "security": "Nhận và chuyển giao JWT Token an toàn."
      },
      {
        "name": "AuthController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AuthController.java",
        "layer": "Controller",
        "desc": "REST Controller xử lý các endpoint xác thực: '/api/auth/login' và '/api/auth/admin-login'.",
        "dto": "LoginDto, AuthResponseDto (accessToken, tokenType, role)",
        "validation": "@Valid kiểm tra tham số đầu vào.",
        "security": "Endpoint công khai (permitAll)."
      },
      {
        "name": "SecurityConfig.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/config/SecurityConfig.java",
        "layer": "System Security Config",
        "desc": "Cấu hình bảo mật Spring Security, CORS, mã hóa mật khẩu BCrypt và JwtAuthenticationFilter.",
        "dto": "SecurityFilterChain Bean",
        "validation": "Phân quyền chi tiết theo Role (ADMIN, STAFF, CUSTOMER).",
        "security": "Chống tấn công CSRF, bảo vệ API."
      },
      {
        "name": "AuthServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AuthServiceImpl.java",
        "layer": "Service",
        "desc": "Xác thực tài khoản với DB UserRepository và sinh JWT Token chứa danh sách quyền.",
        "dto": "AuthResponseDto",
        "validation": "Đối soát mật khẩu đã mã hóa BCrypt.",
        "security": "Ký điện tử JWT với Secret Key."
      }
    ]
  },
  "auth_logout": {
    "title": "STT 2: 3.2.3 Logout",
    "desc": "Hướng dẫn đăng xuất, xoá token khỏi localStorage, kết thúc phiên làm việc.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.2.3):</strong><br>1. Người dùng bấm nút 'Đăng xuất' trên <code>Header.jsx</code> (Khách hàng) hoặc trên thanh điều hướng <code>AdminLayout.jsx</code> (Admin/Staff).<br>2. Sự kiện kích hoạt hàm <code>logout()</code> trong <code>AuthContext.jsx</code>.<br>3. <code>AuthContext.jsx</code> xóa sạch Token và thông tin User bằng lệnh <code>localStorage.removeItem('token')</code> và <code>localStorage.removeItem('user')</code>.<br>4. Reset state <code>user = null</code>, gỡ bỏ Authorization Bearer Header khỏi các request tiếp theo.<br>5. Điều hướng người dùng về trang đăng nhập <code>LoginPage.jsx</code> / <code>AdminLoginPage.jsx</code>, hoàn tất kết thúc phiên làm việc.",
    "steps": [
      {
        "name": "Header.jsx",
        "path": "frontendHomestayManagement/src/components/Header/Header.jsx",
        "layer": "Frontend UI Component",
        "desc": "Thanh Header chính chứa nút Đăng xuất dành cho khách hàng.",
        "dto": "User Context State",
        "validation": "Kiểm tra trạng thái đã đăng nhập trước khi hiển thị nút Logout.",
        "security": "Trigger sự kiện hủy session."
      },
      {
        "name": "AdminLayout.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminLayout.jsx",
        "layer": "Frontend Admin Layout",
        "desc": "Khung giao diện Admin chứa nút Đăng xuất dành cho Quản trị viên và Nhân viên.",
        "dto": "Admin Session State",
        "validation": "Xóa thông tin quản trị viên khỏi bộ nhớ tạm.",
        "security": "Bảo vệ các route quản trị sau khi đăng xuất."
      },
      {
        "name": "AuthContext.jsx",
        "path": "frontendHomestayManagement/src/context/AuthContext.jsx",
        "layer": "Frontend State Management",
        "desc": "Context quản lý trạng thái xác thực toàn cục, chứa hàm logout() thực thi dọn dẹp localStorage.",
        "dto": "Context Value (user, token, logout)",
        "validation": "Clear hoàn toàn localStorage và session state.",
        "security": "Vô hiệu hóa token phía client."
      }
    ]
  },
  "dynamic_pricing_penalties": {
    "title": "STT 3: 3.10 Dynamic Pricing & Penalties Management",
    "desc": "Quản lý giá động theo ngày trong tuần (weekend multiplier, peak pricing) và cấu hình nội quy, mức phạt (late check‑out, hư hỏng thiết bị).",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.10):</strong><br>1. Admin cấu hình tỷ lệ nhân giá cuối tuần, mùa cao điểm và mức phạt tại <code>AdminRoomsPage.jsx</code> (tab Giá) và <code>AdminRulesPenaltiesPage.jsx</code>.<br>2. Frontend gửi request tới <code>AdminPriceConfigController.java</code> (<code>/api/admin/price-configs</code>) và <code>AdminRulesPenaltyController.java</code> (<code>/api/admin/rules-penalties</code>).<br>3. Controller validate dữ liệu và chuyển sang <code>RoomScheduleServiceImpl.java</code> và <code>AdminRulesPenaltyServiceImpl.java</code> để tính toán giá động & khung phạt tự động.<br>4. Dữ liệu được lưu bền vững vào CSDL qua các Entity <code>DepositPolicy.java</code>, <code>RoomType.java</code>, <code>RulesPenalty.java</code>.<br>5. Khi khách đặt phòng hoặc checkout, <code>PublicBookingController.java</code> & <code>AdminBookingController.java</code> tự động áp dụng công thức giá động và phí phạt vào tổng hóa đơn.",
    "steps": [
      {
        "name": "AdminRoomsPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminRoomsPage.jsx",
        "layer": "Frontend Admin UI",
        "desc": "Giao diện quản lý cấu hình giá phòng động, hệ số nhân cuối tuần và gói thuê homestay.",
        "dto": "PriceConfigForm Data",
        "validation": "Hệ số nhân giá phải lớn hơn 0.",
        "security": "Quyền ADMIN."
      },
      {
        "name": "AdminRulesPenaltiesPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminRulesPenaltiesPage.jsx",
        "layer": "Frontend Admin UI",
        "desc": "Giao diện quản lý nội quy homestay và bảng tính phụ thu phạt check-out muộn / hư hỏng đồ.",
        "dto": "RulesPenaltyFormData",
        "validation": "Tỷ lệ phạt từ 0 đến 100%.",
        "security": "Quyền ADMIN."
      },
      {
        "name": "AdminPriceConfigController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminPriceConfigController.java",
        "layer": "Controller",
        "desc": "REST API tiếp nhận thiết lập chính sách giá và tỷ lệ đặt cọc.",
        "dto": "DepositPolicyDto, PriceConfigDto",
        "validation": "@Valid kiểm tra định dạng dữ liệu.",
        "security": "@PreAuthorize('hasRole(\"ADMIN\")')."
      },
      {
        "name": "AdminRulesPenaltyController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminRulesPenaltyController.java",
        "layer": "Controller",
        "desc": "REST API tiếp nhận thông số quy định phạt và phụ thu thời gian.",
        "dto": "RulesPenaltyDto",
        "validation": "@Valid kiểm tra số liệu không âm.",
        "security": "@PreAuthorize('hasRole(\"ADMIN\")')."
      },
      {
        "name": "AdminRulesPenaltyServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminRulesPenaltyServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý logic tự động tính toán phí phạt dựa trên mốc thời gian check-out thực tế.",
        "dto": "PenaltyCalculationResult",
        "validation": "Tính toán chính xác chênh lệch giờ check-out.",
        "security": "Bảo vệ thông tin cấu hình."
      },
      {
        "name": "DepositPolicy.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/entity/DepositPolicy.java",
        "layer": "Database Entity",
        "desc": "Entity JPA lưu vết tỷ lệ đặt cọc và chính sách giá động.",
        "dto": "Thực thể DepositPolicy",
        "validation": "Ràng buộc dữ liệu bảng deposit_policies.",
        "security": "Ánh xạ Hibernate CSDL."
      }
    ]
  },
  "invoice_sepay": {
    "title": "STT 4: 3.11 Invoice & SePay Payment Management",
    "desc": "Tự động tạo hoá đơn (tổng = phòng + dịch vụ + phạt – giảm giá) và xử lý thanh toán qua QR SePay (webhook tự động cập nhật trạng thái SUCCESS).",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.11):</strong><br>1. Hệ thống kích hoạt sinh hóa đơn khi checkout trên <code>AdminInvoicesPage.jsx</code> hoặc <code>BookingHistoryPage.jsx</code> gửi request tạo hóa đơn tới <code>AdminInvoiceController.java</code>.<br>2. <code>AdminInvoiceServiceImpl.java</code> tổng hợp công thức: <code>Tổng = Phòng + Dịch vụ + Phạt - Giảm giá</code> và lưu bản ghi vào entity <code>Invoice.java</code> (trạng thái UNPAID).<br>3. Component <code>SePayQrPayment.jsx</code> hiển thị mã VietQR động chứa nội dung chuyển khoản chuẩn <code>BK9801</code>.<br>4. Khi khách chuyển tiền, SePay bắn Webhook <code>POST /api/sepay/webhook</code> tới <code>SePayPaymentController.java</code>.<br>5. <code>SePayPaymentServiceImpl.java</code> kiểm tra chữ ký an toàn, giải mã cú pháp 'BK9801', khớp số tiền -> Cập nhật <code>Invoice.java</code> sang <code>PAID</code> (SUCCESS) và ghi nhật ký <code>Payment.java</code>. UI <code>AdminInvoicesPage.jsx</code> cập nhật trạng thái ĐÃ THANH TOÁN ngay tức thì.",
    "steps": [
      {
        "name": "AdminInvoicesPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminInvoicesPage.jsx",
        "layer": "Frontend Admin UI",
        "desc": "Giao diện quản lý hóa đơn thanh toán toàn bộ hệ thống homestay.",
        "dto": "InvoiceFilterQuery",
        "validation": "Lọc trạng thái PAID / UNPAID.",
        "security": "Quyền ADMIN / STAFF."
      },
      {
        "name": "SePayQrPayment.jsx",
        "path": "frontendHomestayManagement/src/components/SePayQrPayment/SePayQrPayment.jsx",
        "layer": "Frontend Component",
        "desc": "Component hiển thị mã VietQR động chứa cú pháp mã booking chuẩn định dạng SePay.",
        "dto": "SePayQRData",
        "validation": "Mã hóa chính xác nội dung chuyển khoản.",
        "security": "Hiển thị QR công khai an toàn."
      },
      {
        "name": "AdminInvoiceController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminInvoiceController.java",
        "layer": "Controller",
        "desc": "REST API quản lý thông tin hóa đơn và tổng hợp chi phí lưu trú.",
        "dto": "InvoiceDto",
        "validation": "@Valid ID hóa đơn hợp lệ.",
        "security": "@PreAuthorize('hasAnyRole(\"ADMIN\", \"STAFF\")')."
      },
      {
        "name": "SePayPaymentController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/SePayPaymentController.java",
        "layer": "Webhook Controller",
        "desc": "Endpoint tiếp nhận tín hiệu Webhook tự động từ hệ thống cổng SePay.",
        "dto": "SePayWebhookPayload (transactionId, amount, content...)",
        "validation": "Xác thực chữ ký API Secret Header.",
        "security": "Bảo mật Webhook chống giả mạo."
      },
      {
        "name": "AdminInvoiceServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminInvoiceServiceImpl.java",
        "layer": "Service",
        "desc": "Tính toán tổng hóa đơn: tiền phòng + dịch vụ minibar/amenities + phụ thu check-out muộn - voucher giảm giá.",
        "dto": "Invoice Entity & Dto",
        "validation": "Đảm bảo tổng tiền khớp với chi tiết đơn.",
        "security": "Ghi nhật ký tài chính."
      },
      {
        "name": "SePayPaymentServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/SePayPaymentServiceImpl.java",
        "layer": "Webhook Service",
        "desc": "Giải mã cú pháp chuyển khoản 'BK9801', đối soát biến động số dư và cập nhật trạng thái PAID tự động.",
        "dto": "Payment Entity",
        "validation": "Kiểm tra số tiền chuyển khớp hoặc lớn hơn số tiền hóa đơn.",
        "security": "Tránh khớp trùng giao dịch (Idempotency)."
      },
      {
        "name": "Invoice.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/entity/Invoice.java",
        "layer": "Database Entity",
        "desc": "Entity JPA lưu vết hóa đơn thanh toán.",
        "dto": "Thực thể Invoice",
        "validation": "Ràng buộc bảng invoices.",
        "security": "Lưu trữ dữ liệu CSDL."
      },
      {
        "name": "Payment.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/entity/Payment.java",
        "layer": "Database Entity",
        "desc": "Entity JPA lưu giao dịch thanh toán thực tế.",
        "dto": "Thực thể Payment",
        "validation": "Mã giao dịch ngân hàng referenceCode.",
        "security": "Nhật ký giao dịch tài chính bất biến."
      }
    ]
  },
  "customer_ai": {
    "title": "STT 5: 3.12.1 Customer AI Chat Box",
    "desc": "Trợ lý AI cho khách hàng (widget trên trang chủ), trả lời câu hỏi về tiện nghi, chính sách, giờ check‑in, điểm tham quan.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.12.1):</strong><br>1. Khách hàng thao tác trên bong bóng chat <code>AIChatWidget.jsx</code> / <code>CustomerAiChat.jsx</code> trên giao diện <code>HomePage.jsx</code>.<br>2. Nhập câu hỏi (VD: 'Giờ check-in là mấy giờ?') -> Gọi API <code>POST /api/ai/customer/chat</code> tại <code>CustomerAiChatController.java</code>.<br>3. <code>CustomerAiChatServiceImpl.java</code> tập hợp context thông tin homestay, bảng giá, quy định và địa điểm du lịch lân cận.<br>4. Dữ liệu chuyển qua <code>CustomerAiSidecarManager.java</code> để gửi tới tiến trình Python Sidecar chạy độc lập.<br>5. Tiến trình Python FastAPI <code>openchatbi/customer_assistant/app.py</code> tiếp nhận prompt, gọi LLM AI (GLM-5.2/OpenAI) và trả câu trả lời tư vấn hiển thị ngay trên widget cho khách hàng.",
    "steps": [
      {
        "name": "AIChatWidget.jsx",
        "path": "frontendHomestayManagement/src/components/AIChatWidget/AIChatWidget.jsx",
        "layer": "Frontend Component",
        "desc": "Widget bong bóng chat AI nổi ở góc màn hình giao diện trang chủ.",
        "dto": "Widget Visibility State",
        "validation": "Quản lý bật/tắt cửa sổ chat.",
        "security": "Hiển thị công khai."
      },
      {
        "name": "CustomerAiChat.jsx",
        "path": "frontendHomestayManagement/src/components/CustomerAiChat/CustomerAiChat.jsx",
        "layer": "Frontend UI",
        "desc": "Giao diện hội thoại chat của khách hàng với AI Assistant.",
        "dto": "ChatMessagePayload (message, sessionId)",
        "validation": "Kiểm tra độ dài câu hỏi không rỗng.",
        "security": "Mở cho tất cả khách tham quan."
      },
      {
        "name": "CustomerAiChatController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/CustomerAiChatController.java",
        "layer": "Controller",
        "desc": "REST API Controller nhận yêu cầu chat của khách hàng tại '/api/ai/customer/chat'.",
        "dto": "CustomerAiChatRequest, CustomerAiChatResponse",
        "validation": "@Valid dữ liệu đầu vào.",
        "security": "Rate Limiter chống spam request."
      },
      {
        "name": "CustomerAiChatServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/CustomerAiChatServiceImpl.java",
        "layer": "Service",
        "desc": "Tổng hợp context homestay (tiện nghi, nội quy, giờ check-in, vị trí) gửi tới Python Sidecar.",
        "dto": "AiPayloadContext",
        "validation": "Xử lý timeout dịch vụ AI.",
        "security": "Ẩn thông tin nhạy cảm."
      },
      {
        "name": "CustomerAiSidecarManager.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/config/CustomerAiSidecarManager.java",
        "layer": "System Manager",
        "desc": "Quản lý tiến trình Python Sidecar AI chạy độc lập.",
        "dto": "Process Health Status",
        "validation": "Tự động khôi phục nếu tiến trình gặp lỗi.",
        "security": "Kết nối localhost an toàn."
      },
      {
        "name": "app.py",
        "path": "openchatbi/customer_assistant/app.py",
        "layer": "AI Sidecar (Python FastAPI)",
        "desc": "Service Python FastAPI tiếp nhận prompt, kết nối mô hình LLM AI sinh câu trả lời tự nhiên.",
        "dto": "OpenAI Completion Response",
        "validation": "Xác thực X-Internal-Token.",
        "security": "Quản lý API Key bảo mật."
      }
    ]
  },
  "staff_ai": {
    "title": "STT 6: 3.12.2 Staff AI Assistant",
    "desc": "Trợ lý AI cho nhân viên admin/lễ tân (trên thanh header), hỗ trợ thống kê vận hành, dự báo công suất, điều hướng nhanh.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.12.2):</strong><br>1. Lễ tân hoặc Admin nhấn vào nút AI Assistant trên thanh Header <code>AdminLayout.jsx</code>, mở component <code>StaffAiChat.jsx</code>.<br>2. Nhập câu hỏi tác nghiệp (VD: 'Thống kê phòng bẩn hôm nay' hoặc 'Dự báo công suất tuần tới') -> Gửi HTTP <code>POST /api/ai/staff/chat</code> tới <code>StaffAiChatController.java</code>.<br>3. Controller xác thực quyền <code>ROLE_STAFF</code> / <code>ROLE_ADMIN</code>, chuyển tới <code>StaffAiChatServiceImpl.java</code>.<br>4. Service tổng hợp dữ liệu vận hành nội bộ (Room Status, Housekeeping checklist, Booking occupancy).<br>5. Gửi qua <code>CustomerAiSidecarManager.java</code> tới Python Sidecar <code>openchatbi/customer_assistant/app.py</code>. AI phân tích, tổng hợp báo cáo và trả về phản hồi kèm các đường dẫn điều hướng nhanh (Quick Links) cho nhân viên thao tác.",
    "steps": [
      {
        "name": "AdminLayout.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminLayout.jsx",
        "layer": "Frontend Admin Layout",
        "desc": "Thanh điều hướng Admin chứa lối vào Trợ lý AI cho nhân viên trên Header.",
        "dto": "Header Staff Action State",
        "validation": "Kiểm tra quyền nhân viên trước khi hiển thị.",
        "security": "Yêu cầu đăng nhập Staff/Admin."
      },
      {
        "name": "StaffAiChat.jsx",
        "path": "frontendHomestayManagement/src/components/StaffAiChat/StaffAiChat.jsx",
        "layer": "Frontend Staff UI",
        "desc": "Trợ lý AI dành cho nhân viên tra cứu thống kê vận hành và gợi ý điều hướng.",
        "dto": "StaffChatMessagePayload",
        "validation": "Validate câu hỏi không rỗng.",
        "security": "Phân quyền truy cập nhân viên."
      },
      {
        "name": "StaffAiChatController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/StaffAiChatController.java",
        "layer": "Controller",
        "desc": "REST API Controller nhận yêu cầu chat nghiệp vụ từ nhân viên tại '/api/ai/staff/chat'.",
        "dto": "StaffAiChatRequest, StaffAiChatResponse",
        "validation": "@Valid dữ liệu đầu vào.",
        "security": "@PreAuthorize('hasAnyRole(\"ADMIN\", \"STAFF\")')."
      },
      {
        "name": "StaffAiChatServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/StaffAiChatServiceImpl.java",
        "layer": "Service",
        "desc": "Tổng hợp dữ liệu vận hành nội bộ (trạng thái buồng phòng, checklist dọn dẹp, công suất) hỗ trợ AI.",
        "dto": "StaffAiPayloadContext",
        "validation": "Lọc bỏ dữ liệu bảo mật.",
        "security": "Bảo vệ thông tin doanh nghiệp nội bộ."
      },
      {
        "name": "CustomerAiSidecarManager.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/config/CustomerAiSidecarManager.java",
        "layer": "System Manager",
        "desc": "Quản lý tiến trình Python AI Sidecar cho cả Customer và Staff.",
        "dto": "Process Health State",
        "validation": "Health check định kỳ.",
        "security": "Localhost IPC execution."
      },
      {
        "name": "app.py",
        "path": "openchatbi/customer_assistant/app.py",
        "layer": "AI Sidecar (Python FastAPI)",
        "desc": "Mô hình Python FastAPI phân tích số liệu vận hành và tạo liên kết điều hướng nhanh.",
        "dto": "Staff Response JSON với Quick Links",
        "validation": "Xác thực token nội bộ.",
        "security": "Bảo mật khóa API Key."
      }
    ]
  },
  "reviews_wishlist": {
    "title": "STT 7: 3.14 Customer Reviews & Wishlist Management",
    "desc": "Quản lý đánh giá (1–5 sao + phản hồi + ảnh) và danh sách yêu thích (wishlist) của khách hàng.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.14):</strong><br>1. <strong>Đánh giá (Reviews):</strong> Khách gửi review 1-5 sao kèm ảnh tại <code>RoomDetailPage.jsx</code> -> Gọi <code>CustomerReviewController.java</code> (<code>POST /api/customer/reviews</code>) -> <code>ReviewServiceImpl.java</code> lưu vào <code>Review.java</code> (trạng thái PENDING). Admin vào <code>AdminReviewsPage.jsx</code> duyệt hoặc ẩn đánh giá qua <code>AdminReviewController.java</code>. Chỉ review trạng thái APPROVED được <code>PublicReviewController.java</code> trả về cho client.<br>2. <strong>Yêu thích (Wishlist):</strong> Khách bấm trái tim tại <code>HomePage.jsx</code> hoặc <code>RoomDetailPage.jsx</code> -> Request gửi <code>CustomerWishlistController.java</code> (<code>POST /api/customer/wishlist/toggle</code>) -> <code>WishlistServiceImpl.java</code> thêm/xóa khỏi CSDL <code>Wishlist.java</code> / <code>WishlistItem.java</code>. Khách truy cập <code>WishlistPage.jsx</code> để xem danh sách phòng yêu thích.",
    "steps": [
      {
        "name": "RoomDetailPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Rooms/RoomDetailPage.jsx",
        "layer": "Frontend Page UI",
        "desc": "Trang chi tiết phòng cho phép gửi đánh giá 1-5 sao + ảnh và bấm thả tim yêu thích.",
        "dto": "ReviewFormData, WishlistTogglePayload",
        "validation": "Đánh giá từ 1 đến 5 sao.",
        "security": "Xác thực người dùng trước khi thực hiện."
      },
      {
        "name": "WishlistPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Wishlist/WishlistPage.jsx",
        "layer": "Frontend Page UI",
        "desc": "Màn hình danh sách yêu thích lưu trữ các phòng homestay mà khách hàng quan tâm.",
        "dto": "WishlistItems List",
        "validation": "Lọc danh sách theo tài khoản khách hàng.",
        "security": "Yêu cầu tài khoản Customer."
      },
      {
        "name": "AdminReviewsPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminReviewsPage.jsx",
        "layer": "Frontend Admin UI",
        "desc": "Trang quản trị phê duyệt, phản hồi hoặc ẩn các bài đánh giá của khách hàng.",
        "dto": "ReviewModerationAction",
        "validation": "Cập nhật trạng thái APPROVED / HIDDEN.",
        "security": "Quyền ADMIN / STAFF."
      },
      {
        "name": "CustomerReviewController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/CustomerReviewController.java",
        "layer": "Controller",
        "desc": "API tiếp nhận bài đánh giá mới từ khách hàng sau khi lưu trú.",
        "dto": "ReviewCreateRequestDto, ReviewResponseDto",
        "validation": "@Valid số sao và nội dung.",
        "security": "Xác thực JWT Customer."
      },
      {
        "name": "CustomerWishlistController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/CustomerWishlistController.java",
        "layer": "Controller",
        "desc": "API bật/tắt trạng thái yêu thích phòng homestay tại '/api/customer/wishlist/toggle'.",
        "dto": "WishlistToggleRequestDto, WishlistToggleResponseDto",
        "validation": "Validate ID phòng tồn tại.",
        "security": "Xác thực JWT Token."
      },
      {
        "name": "AdminReviewController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminReviewController.java",
        "layer": "Controller Admin",
        "desc": "API duyệt (Approve) hoặc Ẩn (Hide) đánh giá vi phạm.",
        "dto": "ReviewStatusUpdateDto",
        "validation": "@Valid trạng thái kiểm duyệt.",
        "security": "@PreAuthorize('hasRole(\"ADMIN\")')."
      },
      {
        "name": "PublicReviewController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/PublicReviewController.java",
        "layer": "Controller Public",
        "desc": "API lấy danh sách đánh giá đã phê duyệt (APPROVED) cho công chúng xem.",
        "dto": "List<ReviewResponseDto>",
        "validation": "Chỉ lấy các review trạng thái APPROVED.",
        "security": "Public Access."
      },
      {
        "name": "WishlistServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/WishlistServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý logic thêm/xóa mục wishlist trong cơ sở dữ liệu.",
        "dto": "WishlistItem Entity",
        "validation": "Tránh thêm trùng lắp phòng yêu thích.",
        "security": "Bảo vệ danh sách cá nhân khách hàng."
      }
    ]
  },
  "stay_service_email": {
    "title": "STT 8: 3.15 Guest Stay Service & Email Notification",
    "desc": "Luồng gửi Email thông báo tự động khi khách check-in và đặt dịch vụ tận phòng từ link Gmail.",
    "presentationScript": "<strong>Kịch bản thuyết trình (Luồng 3.15):</strong><br>1. Hệ thống bắn sự kiện check-in, <code>StayAccessEmailListener.java</code> gửi Gmail chứa nút 'Mở trang dịch vụ lưu trú'.<br>2. Khách bấm nút trong Gmail -> Mở <code>StayActivationPage.jsx</code> xác thực Token qua <code>StayAccessController.java</code>.<br>3. Màn hình điều hướng tới <code>StayPage.jsx</code> cho phép khách đặt Minibar / Dịch vụ tận phòng.<br>4. Request gửi qua <code>stayService.js</code> tới <code>StayPortalController.java</code> và lưu vào CSDL qua <code>StayAccessServiceImpl.java</code>.",
    "steps": [
      {
        "name": "StayAccessEmailListener.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/event/StayAccessEmailListener.java",
        "layer": "Event Listener / Email Generator",
        "desc": "Lắng nghe sự kiện check-in để gửi Email đính kèm URL kích hoạt token.",
        "dto": "StayAccessEmailEvent",
        "validation": "Kiểm tra địa chỉ email hợp lệ.",
        "security": "Gửi thư bảo mật SSL/TLS."
      },
      {
        "name": "StayAccessController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/StayAccessController.java",
        "layer": "Controller (API)",
        "desc": "Xử lý các endpoint '/api/stay/activate' và '/api/stay/info'.",
        "dto": "StayActivationResponseDto",
        "validation": "Kiểm tra Token chưa hết hạn.",
        "security": "Bảo vệ thông tin phòng lưu trú."
      },
      {
        "name": "StayActivationPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Stay/StayActivationPage.jsx",
        "layer": "Frontend Activation UI",
        "desc": "Trang tiếp nhận token từ URL Gmail và lưu vào LocalStorage.",
        "dto": "Token Query Param",
        "validation": "Validate token tồn tại.",
        "security": "Lưu trữ phiên token an toàn."
      },
      {
        "name": "StayPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Stay/StayPage.jsx",
        "layer": "Frontend Guest Portal UI",
        "desc": "Cổng dịch vụ tận phòng dành cho khách đang lưu trú.",
        "dto": "ServiceOrderRequest",
        "validation": "Số lượng món > 0.",
        "security": "Chỉ phòng đang check-in mới được gọi dịch vụ."
      }
    ]
  }
};


// OFFLINE SYNTAX HIGHLIGHTER FOR JAVA, JAVASCRIPT/JSX, CSS
function highlightCode(code, lang) {
  // Tránh lỗi code rỗng
  if (!code) return "";
  
  // Escape các ký tự HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const placeholders = [];

  // 1. Comments: Khối /* ... */ và dòng // ...
  html = html.replace(/(\/\*[\s\S]*?\*\/|\/\/.+)$/gm, (match) => {
    placeholders.push(`<span class="token comment">${match}</span>`);
    return `___PH_${placeholders.length - 1}___`;
  });

  // 2. Strings: Nháy kép, nháy đơn, template literal
  html = html.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, (match) => {
    placeholders.push(`<span class="token string">${match}</span>`);
    return `___PH_${placeholders.length - 1}___`;
  });

  // 3. Java Annotations: @RestController, @Autowired...
  html = html.replace(/(@[a-zA-Z0-9_]+)/g, '<span class="token annotation">$1</span>');

  // 4. Keywords
  const keywords = /\b(class|interface|extends|implements|package|import|public|private|protected|static|final|void|int|double|float|long|boolean|char|byte|short|return|const|let|var|function|if|else|for|while|do|switch|case|default|break|continue|new|this|super|try|catch|finally|throw|throws|import|export|default|from|as|await|async|null|true|false)\b/g;
  html = html.replace(keywords, '<span class="token keyword">$1</span>');

  // 5. Functions & Methods: method_name(
  html = html.replace(/\b([a-zA-Z0-9_]+)(?=\s*\()/g, '<span class="token function">$1</span>');

  // 6. Numbers
  html = html.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');

  // Khôi phục comments và strings
  for (let i = placeholders.length - 1; i >= 0; i--) {
    html = html.replace(`___PH_${i}___`, placeholders[i]);
  }

  // Tạo các dòng code có số dòng
  const lines = html.split('\n');
  const numberedLines = lines.map((line, idx) => {
    return `<span class="line-number">${idx + 1}</span><span class="line-content">${line}</span>`;
  });

  return numberedLines.join('\n');
}

// LOAD SOURCE CODE FILE AND HIGHLIGHT IT
async function loadFileContent(relativePath, stepNode) {
  const codeContentElement = document.getElementById('code-content');
  const filePathTitleElement = document.getElementById('active-file-path');
  const explanationSidebar = document.getElementById('explanation-sidebar');
  
  filePathTitleElement.innerText = relativePath;
  codeContentElement.innerHTML = `<span style="color: var(--text-muted)">Đang tải mã nguồn: ${relativePath}...</span>`;
  
  try {
    // Call IPC main process file reader
    const code = await window.api.readProjectFile(relativePath);
    
    // Highlight code using our custom formatter
    const fileExtension = relativePath.split('.').pop();
    codeContentElement.innerHTML = highlightCode(code, fileExtension);
    
    // Copy code integration
    window.currentCode = code;
    
    // Render explanation
    renderExplanation(stepNode);
  } catch (error) {
    codeContentElement.innerHTML = `// Lỗi tải file: ${error.message}`;
  }
}

// RENDER EXPLANATION CARD IN THE SIDEBAR
function renderExplanation(step) {
  const sidebar = document.getElementById('explanation-sidebar');
  
  let badgesHtml = '';
  if (step.security) {
    badgesHtml += `<span class="exp-badge security">🔑 ${step.security}</span>`;
  }
  if (step.validation) {
    badgesHtml += `<span class="exp-badge validation">🛡️ ${step.validation}</span>`;
  }

  const screenImgHtml = step.image ? `
    <div class="exp-section">
      <div class="exp-sec-title">🖼️ Ảnh Màn Hình Giao Diện</div>
      <div class="exp-img-preview-wrap" style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: rgba(0,0,0,0.3); text-align: center;">
        <img src="${step.image}" alt="${step.name}" style="width: 100%; max-height: 180px; display: block; object-fit: cover; border-radius: 6px;" onError="this.onerror=null; this.src='../public/banner.png';" />
      </div>
    </div>
  ` : '';

  sidebar.innerHTML = `
    <div class="exp-block">
      <div class="exp-title">${step.name}</div>
      <p class="exp-desc">${step.desc}</p>
      
      ${screenImgHtml}

      <div class="exp-section">
        <div class="exp-sec-title">Phân lớp (Layer)</div>
        <div class="exp-sec-content">
          <strong style="color: var(--info)">${step.layer}</strong>
        </div>
      </div>

      <div class="exp-section">
        <div class="exp-sec-title">Đối tượng / Dữ liệu (DTO)</div>
        <div class="exp-sec-content">${step.dto}</div>
      </div>
      
      ${badgesHtml ? `
      <div class="exp-section">
        <div class="exp-sec-title">Bảo mật & Ràng buộc</div>
        <div class="exp-badge-list">
          ${badgesHtml}
        </div>
      </div>
      ` : ''}
      
      <div class="exp-section">
        <div class="exp-sec-title">Đường dẫn thực tế</div>
        <div class="exp-sec-content" style="font-family: var(--font-mono); font-size: 11px; word-break: break-all; color: var(--text-muted)">
          ${step.path}
        </div>
      </div>
    </div>
  `;
}

// RENDER SEQUENCE STEPS FLOWCHART
function renderFlowSteps(flowId) {
  const container = document.getElementById('steps-flowchart');
  container.innerHTML = '';
  
  const flow = window.FLOWS_CONFIG[flowId];
  if (!flow || !flow.steps || flow.steps.length === 0) {
    container.innerHTML = '<div class="empty-steps">Không tìm thấy thông tin các bước.</div>';
    return;
  }
  
  flow.steps.forEach((step, idx) => {
    // Create step node
    const node = document.createElement('div');
    node.className = `step-node ${idx === 0 ? 'active' : ''}`;
    node.innerHTML = `
      <span class="step-layer-badge">${step.layer}</span>
      <span class="step-node-name">${step.name}</span>
    `;
    
    node.addEventListener('click', () => {
      // Remove active class from all nodes
      document.querySelectorAll('.step-node').forEach(n => n.classList.remove('active'));
      // Add active to current
      node.classList.add('active');
      // Load file content
      loadFileContent(step.path, step);
      
      // Sync log print
      logToConsole(`[Xem code] Người dùng chọn bước ${idx + 1}: ${step.name} (${step.layer})`);
    });
    
    container.appendChild(node);
    
    // Add connector arrow if not the last node
    if (idx < flow.steps.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'step-arrow';
      arrow.innerHTML = '➔';
      container.appendChild(arrow);
    }
  });
  
  // Load the first step by default
  const firstStep = flow.steps[0];
  loadFileContent(firstStep.path, firstStep);
}

// DYNAMIC STATIC ANALYSIS FOR ANY FILE IN PROJECT
function analyzeFileCode(filePath, content) {
  const name = filePath.split(/[/\\]/).pop();
  const fileExtension = name.split('.').pop().toLowerCase();
  
  // Layer detection
  let layer = "Mã nguồn chung / Tiện ích";
  const pathLower = filePath.toLowerCase();
  const contentLower = content.toLowerCase();

  if (pathLower.includes("frontend") || pathLower.includes("components") || pathLower.includes("pages") || pathLower.includes("views") || ['jsx', 'tsx', 'html', 'css'].includes(fileExtension)) {
    if (fileExtension === 'css') {
      layer = "Frontend CSS Styling";
    } else {
      layer = "Frontend UI Component / View";
    }
  } else if (pathLower.includes("controller") || content.includes("@RestController") || content.includes("@Controller") || content.includes("router.") || content.includes("express()")) {
    layer = "Backend Controller (API Endpoint)";
  } else if (pathLower.includes("service") || content.includes("@Service") || content.includes("serviceimpl") || content.includes("class ") && pathLower.includes("impl")) {
    layer = "Business Service Layer (Nghiệp vụ)";
  } else if (pathLower.includes("repository") || content.includes("@Repository") || content.includes("jparepository") || content.includes("mongoose.model") || content.includes("db.query")) {
    layer = "Database Access Layer (Repository)";
  } else if (pathLower.includes("dto") || pathLower.includes("model") || pathLower.includes("entity") || content.includes("class ") && (pathLower.includes("request") || pathLower.includes("response"))) {
    layer = "Data Model / DTO";
  } else if (pathLower.includes("config") || content.includes("@Configuration") || content.includes("dotenv") || content.includes("config.js")) {
    layer = "System Configuration (Cấu hình)";
  } else if (pathLower.includes("preload") || pathLower.includes("preload.js")) {
    layer = "Electron Preload Bridge (Bảo mật)";
  } else if (pathLower.includes("main.js") || content.includes("browserwindow")) {
    layer = "Electron Main Process (Hệ thống)";
  }
  
  // DTO & imports detection
  let dtoList = [];
  const importRegex = /import\s+([\w*{}]+)\s+from|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  let count = 0;
  while ((match = importRegex.exec(content)) && count < 5) {
    const imp = match[1] || match[2];
    if (imp) {
      // Clean up brackets or symbols
      const cleanImp = imp.replace(/[{}]/g, '').trim();
      dtoList.push(cleanImp.split('/').pop());
      count++;
    }
  }
  let dto = dtoList.length > 0 ? `Phụ thuộc: ${dtoList.join(', ')}` : "Không xác định hoặc nội bộ";

  // Security detection
  let security = "";
  const secKeywords = [
    { kw: "@PreAuthorize", desc: "Phân quyền Spring Security (@PreAuthorize)" },
    { kw: "JWT", desc: "Mã hóa/Xác thực JWT Token" },
    { kw: "jwt", desc: "Mã hóa/Xác thực JWT Token" },
    { kw: "bcrypt", desc: "Mã hóa mật khẩu BCrypt" },
    { kw: "SecurityContext", desc: "Quản lý phiên đăng nhập" },
    { kw: "cors", desc: "Cấu hình chia sẻ tài nguyên (CORS)" },
    { kw: "ipcMain", desc: "Giao tiếp an toàn IPC Electron" },
    { kw: "contextBridge", desc: "Bảo mật kênh truyền Electron Preload" },
    { kw: "session", desc: "Quản lý phiên làm việc" },
    { kw: "sandbox", desc: "Kích hoạt Electron Sandbox" }
  ];
  const foundSec = secKeywords.filter(k => content.includes(k.kw) || contentLower.includes(k.kw.toLowerCase())).map(k => k.desc);
  // Deduplicate
  const uniqueSec = [...new Set(foundSec)];
  if (uniqueSec.length > 0) {
    security = uniqueSec.join(", ");
  } else {
    security = "Không phát hiện cơ chế bảo mật đặc biệt";
  }

  // Validation detection
  let validation = "";
  const valKeywords = [
    { kw: "@Valid", desc: "Tự động validate bằng Spring Bean Validation" },
    { kw: "@NotNull", desc: "Ràng buộc dữ liệu không rỗng (@NotNull)" },
    { kw: "validate", desc: "Hàm kiểm tra dữ liệu đầu vào" },
    { kw: "require", desc: "Yêu cầu tham số bắt buộc" },
    { kw: "throw new", desc: "Ném ngoại lệ xử lý lỗi nghiệp vụ" },
    { kw: "try", desc: "Xử lý ngoại lệ với try-catch" },
    { kw: "catch", desc: "Xử lý ngoại lệ với try-catch" }
  ];
  const foundVal = valKeywords.filter(k => content.includes(k.kw) || contentLower.includes(k.kw.toLowerCase())).map(k => k.desc);
  const uniqueVal = [...new Set(foundVal)];
  if (uniqueVal.length > 0) {
    validation = uniqueVal.join(", ");
  } else {
    validation = "Không phát hiện ràng buộc dữ liệu";
  }

  // Generate business description
  let desc = `Tệp tin nguồn <strong>${name}</strong> được phát hiện thuộc thành phần <strong>${layer}</strong>. `;
  
  // Find functions or classes
  const functionRegex = /function\s+(\w+)|class\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*\{/g;
  const methods = [];
  let mMatch;
  let mCount = 0;
  while ((mMatch = functionRegex.exec(content)) && mCount < 6) {
    const fnName = mMatch[1] || mMatch[2] || mMatch[3] || mMatch[4];
    if (fnName && !['if', 'for', 'while', 'switch', 'catch', 'return', 'let', 'const', 'var', 'import', 'export'].includes(fnName)) {
      methods.push(fnName);
      mCount++;
    }
  }

  if (methods.length > 0) {
    desc += `Khai báo các lớp, hàm hoặc biến logic quan trọng như: <code>${methods.join(', ')}</code>. `;
  }

  // Count code lines
  const lineCount = content.split('\n').length;
  desc += `Tổng dung lượng file khoảng ${lineCount} dòng code. File đóng vai trò thực thi hoặc điều khiển logic trong dự án hiện tại.`;

  return {
    name,
    path: filePath,
    layer,
    dto,
    security,
    validation,
    desc
  };
}

// LOAD CUSTOM FILE AND HIGHLIGHT IT
async function loadCustomFileContent(relativePath) {
  const codeContentElement = document.getElementById('code-content');
  const filePathTitleElement = document.getElementById('active-file-path');
  
  filePathTitleElement.innerText = relativePath;
  codeContentElement.innerHTML = `<span style="color: var(--text-muted)">Đang tải mã nguồn: ${relativePath}...</span>`;
  
  try {
    // Call IPC main process file reader
    const code = await window.api.readProjectFile(relativePath);
    
    // Highlight code using our custom formatter
    const fileExtension = relativePath.split('.').pop();
    codeContentElement.innerHTML = highlightCode(code, fileExtension);
    
    // Copy code integration
    window.currentCode = code;
    
    // Analyze code and render explanation
    const analysis = analyzeFileCode(relativePath, code);
    renderExplanation(analysis);
  } catch (error) {
    codeContentElement.innerHTML = `// Lỗi tải file: ${error.message}`;
  }
}

// GENERATE DYNAMIC BUSINESS FLOWS FOR ANY FILE LIST
function generateSmartFlows(flatFiles) {
  const flows = {};
  
  // Helper to extract extension
  const getExt = (name) => name.split('.').pop().toLowerCase();

  // Group by common business areas
  const modules = [
    {
      id: "auth_sec",
      name: "Xác thực & Bảo mật (Auth & Security)",
      keywords: ["auth", "login", "register", "token", "jwt", "credential", "security", "account"],
      desc: "Luồng xử lý xác thực quyền hạn người dùng, đăng nhập, bảo mật và cấu hình phân quyền truy cập."
    },
    {
      id: "booking_mgmt",
      name: "Quản lý Đặt phòng / Đặt chỗ (Booking Management)",
      keywords: ["booking", "book", "reservation", "room", "stay"],
      desc: "Luồng đăng ký, thuê phòng, đặt lịch, kiểm tra lịch trống buồng phòng và cập nhật trạng thái đặt chỗ."
    },
    {
      id: "payment_billing",
      name: "Thanh toán & Hóa đơn (Payment & Invoice)",
      keywords: ["payment", "invoice", "bill", "sepay", "checkout", "transaction", "bank"],
      desc: "Luồng giao dịch tài chính, sinh QR thanh toán, đối soát biến động số dư tài khoản ngân hàng và xuất hóa đơn."
    },
    {
      id: "tasks_operations",
      name: "Quản lý Công việc & Tác vụ (Tasks & Operations)",
      keywords: ["task", "schedule", "housekeeping", "clean", "todo", "countdown", "clock", "timer"],
      desc: "Luồng quản lý phân công công việc dọn dẹp buồng phòng, giám sát tiến độ hoạt động và đếm ngược thời gian tác vụ."
    }
  ];

  modules.forEach(mod => {
    // Gather files matching keywords
    const matchedFiles = flatFiles.filter(f => {
      const pathLower = f.path.toLowerCase();
      return mod.keywords.some(kw => pathLower.includes(kw));
    });

    if (matchedFiles.length >= 2) {
      // Sort matched files by layer order: Frontend -> Controller -> Service -> Repository / Config
      const sortedSteps = sortFilesIntoLayerSequence(matchedFiles);
      if (sortedSteps.length > 0) {
        flows[mod.id] = {
          title: mod.name,
          desc: mod.desc,
          steps: sortedSteps
        };
      }
    }
  });

  // If no flows were generated, or for general non-homestay repositories (like electron_tool)
  // Let's create general architectural flows
  if (Object.keys(flows).length === 0) {
    // 1. Electron/Web App Boot flow
    const uiFile = flatFiles.find(f => getExt(f.name) === 'html');
    const preloadFile = flatFiles.find(f => f.name.toLowerCase().includes('preload'));
    const mainFile = flatFiles.find(f => f.name.toLowerCase().includes('main') || f.name.toLowerCase().includes('index.js') || f.name.toLowerCase().includes('app.js'));
    const packageJson = flatFiles.find(f => f.name === 'package.json');

    if (uiFile || preloadFile || mainFile) {
      const bootSteps = [];
      if (packageJson) bootSteps.push(packageJson);
      if (uiFile) bootSteps.push(uiFile);
      if (preloadFile) bootSteps.push(preloadFile);
      if (mainFile) bootSteps.push(mainFile);

      flows["app_boot"] = {
        title: "Khởi chạy Ứng dụng (App Initialization)",
        desc: "Luồng khởi động cốt lõi của ứng dụng, nạp cấu hình hệ thống, thiết lập môi trường và mở cửa sổ chính.",
        steps: bootSteps.map(f => {
          const analysis = analyzeFileCode(f.path, "");
          return {
            name: f.name,
            path: f.path,
            layer: analysis.layer,
            desc: `Khởi tạo thành phần ${f.name} thuộc lớp ${analysis.layer}.`,
            dto: "Tham số khởi chạy cấu hình",
            validation: "Mặc định hệ thống",
            security: analysis.security !== "Không phát hiện cơ chế bảo mật đặc biệt" ? analysis.security : "Quyền quản trị"
          };
        })
      };
    }

    // 2. Custom Scripts & Feature flow (grouping other JS/Python/Shell files)
    const scriptFiles = flatFiles.filter(f => 
      ['js', 'py', 'sh', 'ps1', 'bat'].includes(getExt(f.name)) &&
      !f.name.toLowerCase().includes('main') && !f.name.toLowerCase().includes('preload')
    );

    if (scriptFiles.length > 0) {
      flows["custom_features"] = {
        title: "Logic Nghiệp vụ & Kịch bản Chạy (Scripts & Business Logic)",
        desc: "Các đoạn mã xử lý nghiệp vụ chính, các công cụ phụ trợ và kịch bản tự động được phát hiện trong dự án.",
        steps: scriptFiles.slice(0, 5).map(f => {
          const analysis = analyzeFileCode(f.path, "");
          return {
            name: f.name,
            path: f.path,
            layer: analysis.layer,
            desc: `Thực thi các thuật toán và logic điều khiển trong tệp ${f.name}.`,
            dto: "Dữ liệu cấu hình nội bộ",
            validation: "Xử lý lỗi runtime và exception",
            security: "Quyền hạn thực thi của tiến trình"
          };
        })
      };
    }
  }

  // Fallback if STILL empty: just group top 5 files into a default flow
  if (Object.keys(flows).length === 0 && flatFiles.length > 0) {
    flows["default_flow"] = {
      title: "Luồng Mã Nguồn Tổng Hợp (General Code Flow)",
      desc: "Luồng chạy tự động tổng hợp các tệp tin quan trọng nhất được phát hiện trong thư mục dự án.",
      steps: flatFiles.slice(0, 5).map(f => {
        const analysis = analyzeFileCode(f.path, "");
        return {
          name: f.name,
          path: f.path,
          layer: analysis.layer,
          desc: `Đọc và phân tích tệp tin nguồn ${f.name} trong cấu trúc thư mục hiện tại.`,
          dto: "Dữ liệu tham chiếu",
          validation: "Mặc định hệ thống",
          security: "Quyền hạn tiêu chuẩn"
        };
      })
    };
  }

  return flows;
}

// Helper to sort files by architectural layer sequence
function sortFilesIntoLayerSequence(files) {
  const order = [
    "Frontend UI Component / View",
    "Frontend CSS Styling",
    "Data Model / DTO",
    "Backend Controller (API Endpoint)",
    "Business Service Layer (Nghiệp vụ)",
    "Database Access Layer (Repository)",
    "System Configuration (Cấu hình)"
  ];

  const scoredFiles = files.map(f => {
    const analysis = analyzeFileCode(f.path, "");
    let score = order.indexOf(sfLayer => sfLayer === analysis.layer);
    if (score === -1) {
      // Direct string comparison since indexof with callback is incorrect
      score = order.indexOf(analysis.layer);
    }
    if (score === -1) score = 99; // Unknown layers at the end
    return { file: f, analysis, score };
  });

  // Sort ascending by layer score
  scoredFiles.sort((a, b) => a.score - b.score);

  return scoredFiles.map(sf => ({
    name: sf.file.name,
    path: sf.file.path,
    layer: sf.analysis.layer,
    desc: `Xử lý logic thành phần ${sf.file.name} thuộc lớp ${sf.analysis.layer}.`,
    dto: sf.analysis.dto,
    validation: sf.analysis.validation,
    security: sf.analysis.security
  }));
}
