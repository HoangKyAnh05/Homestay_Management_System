// CONFIGURATION FOR ALL 7 CORE CODE FLOWS
window.FLOWS_CONFIG = {
  "auth_security": {
    "title": "Xác thực & Bảo mật (Auth & Security)",
    "desc": "Luồng đăng nhập, xử lý phân quyền JWT, mã hóa mật khẩu, và bảo mật các endpoints hệ thống.",
    "steps": [
      {
        "name": "LoginForm.jsx",
        "path": "frontendHomestayManagement/src/components/LoginForm/LoginForm.jsx",
        "layer": "Frontend UI",
        "desc": "Nhận thông tin email và mật khẩu từ khách hàng hoặc quản trị viên. Xử lý sự kiện submit, validate form cơ bản và gọi authService để thực hiện API request.",
        "dto": "LoginRequest (email, password)",
        "validation": "Kiểm tra email đúng định dạng, mật khẩu không được trống.",
        "security": "Không yêu cầu xác thực để vào trang này."
      },
      {
        "name": "authService.js",
        "path": "frontendHomestayManagement/src/services/authService.js",
        "layer": "API Client",
        "desc": "Sử dụng Axios gửi POST request lên backend. Khi nhận phản hồi thành công, lưu mã JWT token vào LocalStorage để gửi kèm trong Authorization header của các request sau.",
        "dto": "JWTAuthResponse (accessToken, tokenType = 'Bearer')",
        "validation": "Kiểm tra mã phản hồi HTTP 200 OK.",
        "security": "Thực hiện lưu trữ token bảo mật."
      },
      {
        "name": "AuthController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AuthController.java",
        "layer": "Controller",
        "desc": "REST API Controller nhận POST request đến '/api/auth/login'. Sử dụng Spring AuthenticationManager để xác thực credentials nhận vào.",
        "dto": "LoginDto (usernameOrEmail, password)",
        "validation": "@Valid tự động kiểm tra dữ liệu đầu vào không rỗng.",
        "security": "Endpoint được mở công khai (permitAll) trong SecurityConfig."
      },
      {
        "name": "AuthServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AuthServiceImpl.java",
        "layer": "Service",
        "desc": "Thực hiện xác thực qua AuthenticationManager. Nếu khớp credentials, sinh JWT token dựa trên thông tin người dùng và phân quyền (Roles) rồi trả về cho Controller.",
        "dto": "JWTAuthResponse chứa mã token đã được ký mã hóa SHA-256.",
        "validation": "Ném ra BadCredentialsException nếu tài khoản hoặc mật khẩu sai.",
        "security": "Mật khẩu người dùng được so khớp thông qua BCryptPasswordEncoder."
      },
      {
        "name": "AccountRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/AccountRepository.java",
        "layer": "Repository",
        "desc": "Thực hiện tìm kiếm thông tin tài khoản người dùng từ database thông qua Spring Data JPA bằng email hoặc username.",
        "dto": "Entity Account liên kết với Role và Employee/Customer.",
        "validation": "Tìm kiếm trả về Optional để tránh lỗi NullPointerException.",
        "security": "Chỉ đọc dữ liệu bảo mật mật khẩu đã được hash."
      }
    ]
  },
  "booking_mgmt": {
    "title": "Quản lý Đặt phòng (Booking Management)",
    "desc": "Luồng đặt phòng của khách hàng và quy trình tiếp nhận, phê duyệt của quản trị viên hệ thống.",
    "steps": [
      {
        "name": "RoomsPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Rooms/RoomsPage.jsx",
        "layer": "Frontend UI",
        "desc": "Trang hiển thị danh sách phòng trống, cho phép khách lọc phòng theo ngày check-in/check-out và bấm đặt phòng.",
        "dto": "Booking parameters (checkInDate, checkOutDate, roomTypeId)",
        "validation": "Ngày check-in phải lớn hơn hoặc bằng ngày hiện tại, ngày check-out phải sau ngày check-in.",
        "security": "Khách vãng lai có thể xem phòng, nhưng cần đăng nhập để tiến hành đặt."
      },
      {
        "name": "PublicBookingController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/PublicBookingController.java",
        "layer": "Controller",
        "desc": "Nhận request tạo đơn đặt phòng từ khách hàng tại API '/api/public/bookings'. Nhận request tính giá dự kiến.",
        "dto": "BookingRequestDto (roomTypeId, checkInDate, checkOutDate, guestInfo...)",
        "validation": "Kiểm tra định dạng ngày tháng và thông tin cá nhân khách hàng.",
        "security": "Yêu cầu quyền truy cập vai trò CUSTOMER (JWT token)."
      },
      {
        "name": "PublicBookingServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/PublicBookingServiceImpl.java",
        "layer": "Service",
        "desc": "Thực hiện nghiệp vụ kiểm tra phòng trống trên lịch thực tế, tính toán phụ thu check-in/out, áp dụng mã giảm giá và tính toán tổng tiền thanh toán.",
        "dto": "Tạo thực thể Booking và BookingDetail tương ứng.",
        "validation": "Kiểm tra phòng đã bị đặt chưa trong khoảng thời gian yêu cầu. Ném ra ngoại lệ nếu phòng bận.",
        "security": "Ghi nhận mã UserID từ Token để gán chủ sở hữu đơn đặt."
      },
      {
        "name": "BookingRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/BookingRepository.java",
        "layer": "Repository",
        "desc": "Ghi đơn đặt phòng mới vào cơ sở dữ liệu MySQL, khóa lịch phòng trong bảng RoomSchedule.",
        "dto": "Thực thể JPA Booking cập nhật trạng thái PENDING_PAYMENT.",
        "validation": "Lưu Cascade để đồng thời lưu cả chi tiết hóa đơn đặt phòng.",
        "security": "Giao dịch được quản lý bởi annotation @Transactional."
      }
    ]
  },
  "housekeeping": {
    "title": "Quản lý Dọn phòng (Housekeeping)",
    "desc": "Luồng lên lịch dọn dẹp phòng, phân công công việc cho nhân viên dọn phòng và cập nhật checklists công việc.",
    "steps": [
      {
        "name": "AdminHousekeepingCalendarPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminHousekeepingCalendarPage.jsx",
        "layer": "Frontend UI",
        "desc": "Giao diện lịch phân công dọn phòng của Admin, hoặc trang xem danh sách việc cần làm của nhân viên Housekeeping.",
        "dto": "HousekeepingTask object",
        "validation": "Validate nhân viên được chọn phải có role HOUSEKEEPING.",
        "security": "Chỉ Admin, Receptionist và Housekeeping được truy cập."
      },
      {
        "name": "AdminHousekeepingCalendarController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminHousekeepingCalendarController.java",
        "layer": "Controller",
        "desc": "REST API Controller cung cấp các endpoint lấy lịch dọn phòng, cập nhật trạng thái phòng bẩn/sạch.",
        "dto": "HousekeepingTaskDto",
        "validation": "Validate taskId không được null.",
        "security": "Yêu cầu quyền ADMIN hoặc RECEPTIONIST để chỉnh sửa lịch."
      },
      {
        "name": "AdminHousekeepingCalendarServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminHousekeepingCalendarServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý logic tự động tạo lịch dọn dẹp khi khách check-out, gán việc cho nhân viên rảnh, cập nhật trạng thái buồng phòng.",
        "dto": "Chuyển đổi HousekeepingTask thành Dto phản hồi.",
        "validation": "Kiểm tra phòng có đang bận hoặc có khách ở không trước khi đổi trạng thái.",
        "security": "Đồng bộ hóa trạng thái phòng đảm bảo dữ liệu cập nhật chính xác."
      },
      {
        "name": "HousekeepingTaskRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/HousekeepingTaskRepository.java",
        "layer": "Repository",
        "desc": "Truy vấn, cập nhật trạng thái các công việc dọn dẹp trong DB dựa trên ngày và nhân viên đảm nhận.",
        "dto": "Thực thể HousekeepingTask.",
        "validation": "Truy vấn tùy chỉnh bằng HQL để lọc theo ngày.",
        "security": "Truy cập dữ liệu trực tiếp qua JPA."
      }
    ]
  },
  "payment_invoice": {
    "title": "Hóa đơn & Thanh toán (Invoice & Payment)",
    "desc": "Luồng sinh mã QR thanh toán động và tự động khớp lệnh chuyển khoản qua webhook SePay.",
    "steps": [
      {
        "name": "SePayQrPayment.jsx",
        "path": "frontendHomestayManagement/src/components/SePayQrPayment/SePayQrPayment.jsx",
        "layer": "Frontend UI",
        "desc": "Hiển thị thông tin chuyển khoản và mã QR VietQR động (chứa số tài khoản, số tiền và nội dung chuyển khoản mã hóa mã đặt phòng).",
        "dto": "Payment details (amount, content, accountNo)",
        "validation": "Kiểm tra số tiền thanh toán khớp với giá trị hóa đơn.",
        "security": "Thông tin mã hóa tránh giả mạo nội dung chuyển khoản."
      },
      {
        "name": "SePayPaymentController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/SePayPaymentController.java",
        "layer": "Controller",
        "desc": "Nhận request Webhook tự động từ hệ thống SePay khi có biến động số dư tài khoản ngân hàng. Nhận POST gửi dữ liệu giao dịch.",
        "dto": "SePayWebhookDto (transactionId, amount, content, transferDate...)",
        "validation": "Kiểm tra chữ ký (Signature) trong HTTP Header để xác thực request đến từ SePay thật.",
        "security": "Sử dụng API Key bảo mật để giải mã và xác thực webhook."
      },
      {
        "name": "SePayPaymentServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/SePayPaymentServiceImpl.java",
        "layer": "Service",
        "desc": "Phân tích cú pháp nội dung chuyển khoản để lấy mã Đặt phòng (Booking ID). Kiểm tra số tiền chuyển khoản có khớp với số tiền cần thanh toán của hóa đơn không. Cập nhật trạng thái Booking thành PAID, tạo hóa đơn Invoice.",
        "dto": "Transaction logs và thực thể Payment.",
        "validation": "Ném ngoại lệ hoặc ghi log lỗi nếu nội dung chuyển khoản sai cú pháp hoặc sai số tiền.",
        "security": "Khóa bản ghi (Locking) để tránh xử lý trùng lặp giao dịch (Idempotency)."
      },
      {
        "name": "PaymentRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/PaymentRepository.java",
        "layer": "Repository",
        "desc": "Lưu lịch sử giao dịch ngân hàng thành công vào DB và đồng bộ trạng thái thanh toán của hóa đơn.",
        "dto": "Thực thể Payment và Invoice.",
        "validation": "Lưu thông tin tham chiếu mã giao dịch ngân hàng gốc.",
        "security": "Lưu dấu kiểm toán giao dịch tài chính (Audit Log)."
      }
    ]
  },
  "room_mgmt": {
    "title": "Quản lý Phòng (Room Management)",
    "desc": "Luồng định cấu hình loại phòng, giá cơ bản, tải lên hình ảnh phòng và chính sách cọc phòng của Admin.",
    "steps": [
      {
        "name": "AdminRoomsPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminRoomsPage.jsx",
        "layer": "Frontend UI",
        "desc": "Quản trị viên thao tác giao diện quản lý phòng: Thêm phòng mới, cập nhật giá loại phòng, gán chính sách đặt cọc.",
        "dto": "Room/RoomType Form Data",
        "validation": "Kiểm tra số phòng phải là số dương, tên loại phòng không được để trống.",
        "security": "Chỉ dành cho tài khoản Admin/Receptionist."
      },
      {
        "name": "AdminRoomController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminRoomController.java",
        "layer": "Controller",
        "desc": "REST API tiếp nhận các yêu cầu POST, PUT, DELETE quản lý phòng và loại phòng.",
        "dto": "RoomDto, RoomTypeDto",
        "validation": "@Valid kiểm tra định dạng dữ liệu đầu vào.",
        "security": "Chặn các role không phải ADMIN truy cập thông qua @PreAuthorize('hasRole(\"ADMIN\")')."
      },
      {
        "name": "AdminRoomServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminRoomServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý logic nghiệp vụ: Tạo phòng, kiểm tra trùng số phòng, tạo cấu hình giá mặc định và chính sách đặt cọc cho phòng mới.",
        "dto": "Thực thể Room, RoomType.",
        "validation": "Ném ngoại lệ RoomNumberAlreadyExistsException nếu số phòng đã tồn tại.",
        "security": "Transaction rollback nếu gặp lỗi trong lúc lưu hình ảnh phòng."
      },
      {
        "name": "RoomRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/RoomRepository.java",
        "layer": "Repository",
        "desc": "Truy xuất danh sách phòng kèm theo thông tin loại phòng và lịch trạng thái phòng.",
        "dto": "Thực thể JPA Room.",
        "validation": "Truy vấn tự sinh và JPQL tùy chỉnh.",
        "security": "Giao tiếp an toàn với cơ sở dữ liệu."
      }
    ]
  },
  "services_mgmt": {
    "title": "Dịch vụ & Tiện ích (Services & Amenities)",
    "desc": "Luồng quản lý danh mục dịch vụ đi kèm (như minibar, giặt là, thuê xe) và các tiện ích tại phòng.",
    "steps": [
      {
        "name": "AdminServiceCategoriesPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminServiceCategoriesPage.jsx",
        "layer": "Frontend UI",
        "desc": "Trang cấu hình dịch vụ, thiết lập danh mục mặt hàng minibar và mức giá bán lẻ.",
        "dto": "ServiceCatalog Form Data",
        "validation": "Giá dịch vụ phải lớn hơn 0.",
        "security": "Chỉ dành cho Admin và nhân viên Lễ tân."
      },
      {
        "name": "AdminServiceCatalogController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminServiceCatalogController.java",
        "layer": "Controller",
        "desc": "Tiếp nhận các HTTP request lấy danh sách dịch vụ hoặc tạo mới các mặt hàng minibar.",
        "dto": "ServiceCatalogDto",
        "validation": "Validate tên dịch vụ tối thiểu 3 ký tự.",
        "security": "Quyền truy cập ADMIN hoặc RECEPTIONIST."
      },
      {
        "name": "AdminServiceCatalogServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminServiceCatalogServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý logic CRUD dịch vụ, kiểm tra số lượng tồn kho minibar và cập nhật giá bán.",
        "dto": "Thực thể ServiceCatalog.",
        "validation": "Ném ngoại lệ ServiceNotFoundException nếu ID dịch vụ không khớp.",
        "security": "Đồng bộ hóa dữ liệu danh mục tiện ích."
      },
      {
        "name": "RoomMiniBarItemRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/RoomMiniBarItemRepository.java",
        "layer": "Repository",
        "desc": "Truy xuất danh sách đồ uống/đồ ăn nhẹ được xếp trong tủ lạnh của từng phòng cụ thể.",
        "dto": "Thực thể RoomMiniBarItem.",
        "validation": "Tải liên kết (Eager Loading) thông tin sản phẩm.",
        "security": "Truy vấn cơ sở dữ liệu qua Hibernate."
      }
    ]
  },
  "rules_penalties": {
    "title": "Quy định & Phụ thu (Rules & Surcharges)",
    "desc": "Luồng quản lý quy định homestay, các khoản phụ thu check-in sớm, check-out muộn hoặc phạt vi phạm.",
    "steps": [
      {
        "name": "AdminRulesPenaltiesPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/AdminRulesPenaltiesPage.jsx",
        "layer": "Frontend UI",
        "desc": "Giao diện quản lý các tham số phạt và bảng cấu hình phụ thu theo giờ đối với trường hợp check-in sớm hoặc check-out muộn.",
        "dto": "RulesPenalty Form Data",
        "validation": "Tỷ lệ phụ thu phải nằm trong khoảng 0% - 100%.",
        "security": "Yêu cầu quyền truy cập ADMIN."
      },
      {
        "name": "AdminRulesPenaltyController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminRulesPenaltyController.java",
        "layer": "Controller",
        "desc": "REST API Controller tiếp nhận cấu hình quy tắc phạt và thông số giá phụ thu từ admin.",
        "dto": "RulesPenaltyDto",
        "validation": "Đảm bảo các giá trị cấu hình không âm.",
        "security": "Bảo vệ bởi phân quyền Spring Security cho ADMIN."
      },
      {
        "name": "AdminRulesPenaltyServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminRulesPenaltyServiceImpl.java",
        "layer": "Service",
        "desc": "Xử lý nghiệp vụ tính toán: Dựa trên cấu hình giờ check-out muộn thực tế của khách, tính ra số tiền phạt/phụ thu tương ứng để cộng vào hóa đơn cuối cùng.",
        "dto": "SurchargeCalculationResponse.",
        "validation": "Tính toán chênh lệch thời gian chuẩn xác theo múi giờ hệ thống.",
        "security": "Kiểm tra kiểm toán chỉnh sửa cấu hình giá."
      },
      {
        "name": "RulesPenaltyRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/RulesPenaltyRepository.java",
        "layer": "Repository",
        "desc": "Truy vấn danh mục quy định và các mức phụ thu từ database để hệ thống áp dụng tính toán hóa đơn.",
        "dto": "Thực thể RulesPenalty.",
        "validation": "Truy xuất danh sách active rules.",
        "security": "Truy vấn trực tiếp qua JPA."
      }
    ]
  },
  "customer_ai_chat": {
    "title": "Trợ lý AI Khách hàng (Customer AI Assistant)",
    "desc": "Luồng tương tác tư vấn phòng trống, dịch vụ, chính sách và lịch sử đặt phòng qua mô hình GLM-5.2 trên FPT AI Factory.",
    "steps": [
      {
        "name": "CustomerAiChat.jsx",
        "path": "frontendHomestayManagement/src/components/CustomerAiChat/CustomerAiChat.jsx",
        "layer": "Frontend UI",
        "desc": "Bong bóng chat góc màn hình cho phép khách hàng nhập câu hỏi trực quan. Hiển thị lịch sử trò chuyện và câu trả lời từ AI.",
        "dto": "Tin nhắn của khách hàng (message), sessionId, lịch sử hội thoại.",
        "validation": "Nội dung câu hỏi không được rỗng và giới hạn tối đa 1000 ký tự.",
        "security": "Không yêu cầu đăng nhập, mở công khai cho toàn bộ khách hàng."
      },
      {
        "name": "CustomerAiChatController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/CustomerAiChatController.java",
        "layer": "Controller",
        "desc": "REST Controller nhận câu hỏi tại POST '/api/ai/customer/chat'. Áp dụng kiểm soát tần suất truy cập (Rate Limit) theo IP/Tài khoản.",
        "dto": "CustomerAiChatRequest, CustomerAiChatResponse",
        "validation": "Tự động xác thực qua annotation @Valid.",
        "security": "Chặn spam bằng CustomerAiRateLimiter (tối đa 20 yêu cầu/phút)."
      },
      {
        "name": "CustomerAiChatServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/CustomerAiChatServiceImpl.java",
        "layer": "Service",
        "desc": "Thu thập context nghiệp vụ hiện tại của hệ thống (danh mục phòng trống, chính sách giá, lịch sử booking của khách) để đưa vào context gọi AI.",
        "dto": "CustomerAiClientRequest chứa payload context an toàn.",
        "validation": "Xử lý timeout và các ngoại lệ khi kết nối dịch vụ AI.",
        "security": "Chỉ lấy thông tin booking thuộc tài khoản JWT hiện hành của khách."
      },
      {
        "name": "app.py",
        "path": "openchatbi/customer_assistant/app.py",
        "layer": "AI Sidecar (Python)",
        "desc": "FastAPI sidecar nhận request, cấu hình System Prompt ngăn chặn rò rỉ dữ liệu nhạy cảm và gọi API FPT AI Factory GLM-5.2.",
        "dto": "Cấu trúc tin nhắn Chat Completion chuẩn FPT/OpenAI.",
        "validation": "Xác thực token bảo mật nội bộ X-Internal-Token.",
        "security": "Bảo mật khóa API FPT_AI_API_KEY ở môi trường máy chủ nội bộ."
      }
    ]
  },
  "ai_marketing": {
    "title": "AI Agent Marketing Đăng bài (AI Marketing Agent)",
    "desc": "Luồng tạo nội dung quảng cáo tự động bằng AI và lập lịch/đăng bài viết trực tiếp lên các kênh mạng xã hội (Facebook, YouTube).",
    "steps": [
      {
        "name": "MarketingPages.jsx",
        "path": "frontendHomestayManagement/src/pages/Admin/MarketingPages.jsx",
        "layer": "Frontend UI",
        "desc": "Giao diện quản trị marketing cho phép admin chọn kênh đăng bài, cấu hình giọng điệu (Tone), nhập mô tả chủ đề và quản lý bài viết.",
        "dto": "MarketingPostRequest (platform, tone, description, scheduledTime).",
        "validation": "Đảm bảo đã chọn ít nhất một kênh mạng xã hội, giờ hẹn giờ phải nằm trong tương lai.",
        "security": "Yêu cầu tài khoản có quyền quản trị viên (ADMIN)."
      },
      {
        "name": "AdminMarketingController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/AdminMarketingController.java",
        "layer": "Controller",
        "desc": "Nhận yêu cầu khởi tạo quy trình viết bài tự động bằng AI hoặc gửi bài viết đi xuất bản ngay lập tức.",
        "dto": "MarketingPostDto, phản hồi MarketingPostResponse.",
        "validation": "@Valid kiểm tra dữ liệu yêu cầu tạo bài đăng.",
        "security": "Bảo vệ nghiêm ngặt bằng Spring Security phân quyền ROLE_ADMIN."
      },
      {
        "name": "AdminMarketingServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/AdminMarketingServiceImpl.java",
        "layer": "Service",
        "desc": "Điều phối dịch vụ: Kích hoạt mô hình AI sinh nội dung bài viết, lưu trữ nháp trong DB và thiết lập lập lịch đăng bài.",
        "dto": "Đơn vị dữ liệu Post Entity cập nhật trạng thái SCHEDULED/PUBLISHED.",
        "validation": "Kiểm tra giới hạn dung lượng phương tiện truyền thông đính kèm.",
        "security": "Ghi log lịch sử người dùng thực hiện tạo chiến dịch."
      },
      {
        "name": "MarketingAiTextGeneratorImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/MarketingAiTextGeneratorImpl.java",
        "layer": "Service",
        "desc": "Giao tiếp với mô hình OpenAI/FPT để sinh đoạn text quảng cáo sáng tạo theo đúng Tone yêu cầu (thân thiện, chuyên nghiệp...).",
        "dto": "Prompt mang theo chỉ thị và mô tả chủ đề.",
        "validation": "Lọc nội dung từ ngữ độc hại/nhạy cảm trước khi trả về.",
        "security": "Sử dụng API Key cấu hình độc quyền trên Server."
      },
      {
        "name": "MarketingSocialPublisherImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/MarketingSocialPublisherImpl.java",
        "layer": "Service Integration",
        "desc": "Tích hợp API mạng xã hội để đăng bài viết lên Fanpage Facebook (sử dụng Facebook Graph API) hoặc tải video lên kênh YouTube.",
        "dto": "Payload Graph API (message, link, access_token).",
        "validation": "Kiểm tra mã lỗi trả về từ API của mạng xã hội (Token hết hạn, lỗi cấu trúc).",
        "security": "Mã hóa và quản lý an toàn OAuth Access Token của các tài khoản mạng xã hội."
      }
    ]
  },
  "stay_portal": {
    "title": "Cổng Thông Tin Lưu Trú (Guest Stay Portal)",
    "desc": "Luồng dành cho khách hàng đang lưu trú tại homestay tự phục vụ: Kích hoạt tài khoản, xem thông tin phòng, và gọi đồ ăn/dịch vụ minibar.",
    "steps": [
      {
        "name": "StayPage.jsx",
        "path": "frontendHomestayManagement/src/pages/Stay/StayPage.jsx",
        "layer": "Frontend UI",
        "desc": "Cổng thông tin riêng tư cho khách đang ở. Hiển thị thông tin phòng, số điện thoại khẩn cấp, các dịch vụ minibar và nút gọi đồ.",
        "dto": "Mã đặt phòng (access token/bookingId), yêu cầu dịch vụ (serviceId, quantity).",
        "validation": "Kiểm tra số lượng dịch vụ đặt mua phải lớn hơn 0.",
        "security": "Chỉ truy cập được thông qua đường dẫn bảo mật gửi riêng qua email của khách."
      },
      {
        "name": "StayPortalController.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/controller/StayPortalController.java",
        "layer": "Controller",
        "desc": "Cung cấp API REST cho cổng lưu trú tại '/api/stays/current' và đặt thêm dịch vụ tiện ích.",
        "dto": "AddBookingFacilityServiceRequest, StaySummaryResponse",
        "validation": "Xác thực cấu trúc DTO đầu vào hợp lệ.",
        "security": "Xác thực vai trò GUEST/CUSTOMER dựa vào Access Token lưu trú."
      },
      {
        "name": "StayAccessServiceImpl.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/service/impl/StayAccessServiceImpl.java",
        "layer": "Service",
        "desc": "Thực hiện nghiệp vụ kiểm tra trạng thái lưu trú hiện tại, thêm yêu cầu dịch vụ vào hóa đơn phụ thu, và kích hoạt thông báo cho lễ tân dọn phòng/phục vụ.",
        "dto": "Ghi nhận thực thể BookingServiceOrder mới.",
        "validation": "Đảm bảo thời gian đặt dịch vụ nằm trong khoảng thời gian khách check-in và check-out thực tế.",
        "security": "Xác thực token lưu trú trùng khớp với đơn đặt phòng đang active."
      },
      {
        "name": "StayAccessRepository.java",
        "path": "homestayManagement/src/main/java/com/homestayManagement/homestayManagement/repository/StayAccessRepository.java",
        "layer": "Repository",
        "desc": "Truy xuất bản ghi StayAccess, liên kết giữa khách hàng, phòng đang ở và thời hạn hiệu lực của mã token truy cập.",
        "dto": "Thực thể StayAccess.",
        "validation": "Lọc bản ghi theo trạng thái active.",
        "security": "Giao dịch an toàn được quản lý bởi Spring Data JPA."
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

  sidebar.innerHTML = `
    <div class="exp-block">
      <div class="exp-title">${step.name}</div>
      <p class="exp-desc">${step.desc}</p>
      
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
