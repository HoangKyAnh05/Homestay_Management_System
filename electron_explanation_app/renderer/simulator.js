// VIRTUAL CONSOLE UTILITY
function logToConsole(message, type = 'system') {
  const consoleBody = document.getElementById('console-logs');
  if (!consoleBody) return;
  
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  
  const time = new Date().toLocaleTimeString();
  line.innerText = `[${time}] ${message}`;
  
  consoleBody.appendChild(line);
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Clear console helper
document.getElementById('clear-console-btn').addEventListener('click', () => {
  const consoleBody = document.getElementById('console-logs');
  if (consoleBody) {
    consoleBody.innerHTML = '<div class="console-line system">[Hệ thống] Đã xóa toàn bộ logs.</div>';
// SIMULATION ENGINE FOR HOMESTAY SYSTEM MODULES
function loadSimulator(flowId) {
  const simContent = document.getElementById('simulator-content');
  if (!simContent) return;
  
  const flowTitle = window.FLOWS_CONFIG[flowId] ? window.FLOWS_CONFIG[flowId].title : flowId;
  logToConsole(`[Hệ thống] Khởi tạo giao diện giả lập cho luồng: ${flowTitle}`);
  
  switch(flowId) {
    case 'auth_login':
    case 'auth_logout':
    case 'auth_security':
      renderAuthSimulator(simContent);
      break;
    case 'room_mgmt':
      renderRoomSimulator(simContent);
      break;
    case 'booking_mgmt':
      renderBookingSimulator(simContent);
      break;
    case 'invoice_sepay':
    case 'invoice_payment':
    case 'payment_invoice':
      renderPaymentSimulator(simContent);
      break;
    case 'dynamic_pricing_penalties':
    case 'rules_penalties':
      renderRulesSimulator(simContent);
      break;
    case 'dashboard_reporting':
      renderDashboardSimulator(simContent);
      break;
    case 'marketing_mgmt':
    case 'ai_marketing':
      renderMarketingSimulator(simContent);
      break;
    case 'customer_ai':
    case 'staff_ai':
    case 'ai_assistant':
    case 'customer_ai_chat':
      renderAiAssistantSimulator(simContent);
      break;
    default:
      if (window.FLOWS_CONFIG[flowId]) {
        renderGenericFlowSimulator(simContent, flowId);
      } else {
        simContent.innerHTML = '<div class="welcome-simulator">Chưa có bản giả lập cho luồng này.</div>';
      }
  }
}

// DYNAMIC GENERIC INTERACTIVE FLOW SIMULATOR
function renderGenericFlowSimulator(container, flowId) {
  const flow = window.FLOWS_CONFIG[flowId];
  if (!flow) return;

  const stepsListHtml = flow.steps.map((step, idx) => `
    <div style="background-color: var(--bg-primary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; text-align: left; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #a5b4fc; font-size: 12.5px;">Bước ${idx + 1}: ${step.name}</strong>
        <span class="step-layer-badge" style="font-size: 8px; padding: 2px 5px; color: var(--primary); background-color: rgba(99, 102, 241, 0.15); border-radius: 4px; font-weight: 800; text-transform: uppercase;">${step.layer}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${step.desc}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="sim-page" style="animation: fadeIn 0.25s ease;">
      <div class="sim-page-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 8px;">
        <h4 style="font-size: 15px; font-weight: 600;">Trình Mô Phỏng: ${flow.title}</h4>
        <p style="font-size: 12px; color: var(--text-secondary);">${flow.desc}</p>
      </div>
      
      <div class="sim-card" style="background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 12px; color: var(--text-secondary); text-align: left; font-weight: 500;">
          Chuỗi sự kiện thực thi của luồng mã nguồn (phân tích bởi AI):
        </div>
        <div style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
          ${stepsListHtml}
        </div>
        <button class="sim-btn" id="sim-run-custom-flow-btn" style="margin-top: 8px; background-color: var(--primary); color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background-color 0.2s;">
          🚀 CHẠY MÔ PHỎNG LUỒNG CODE TỰ ĐỘNG
        </button>
      </div>
    </div>
  `;

  document.getElementById('sim-run-custom-flow-btn').addEventListener('click', () => {
    const logs = flow.steps.map((step, idx) => {
      return () => {
        logToConsole(`[Bước ${idx + 1}] Đang chạy file: ${step.name} (${step.layer}).`, 'api-call');
        logToConsole(`↳ Chi tiết: ${step.desc}`, 'api-response');
      };
    });

    triggerTraceRun(flowId, flow.steps.length, logs);
  });
}

// Run Step Trace Animation Helper
function triggerTraceRun(flowId, stepsCount, logCallback) {
  const nodes = document.querySelectorAll('.step-node');
  if (nodes.length === 0) return;
  
  let currentStep = 0;
  
  // Disable form buttons during trace run
  const buttons = document.querySelectorAll('.sim-btn, .sim-btn-secondary');
  buttons.forEach(btn => btn.disabled = true);
  
  logToConsole(`[Bắt đầu luồng] Kích hoạt luồng chạy code tự động...`, 'system');
  
  function next() {
    if (currentStep >= stepsCount) {
      // Re-enable buttons
      buttons.forEach(btn => btn.disabled = false);
      logToConsole(`[Hoàn thành luồng] Chạy xong toàn bộ các bước!`, 'system');
      return;
    }
    
    // Highlight step node
    nodes.forEach(n => n.classList.remove('active'));
    if (nodes[currentStep * 2]) { // Skip arrows in DOM list (which are alternate items)
      nodes[currentStep * 2].classList.add('active');
      nodes[currentStep * 2].click(); // Triggers loading code & explanations
    }
    
    // Fire callback log for this step
    if (logCallback && logCallback[currentStep]) {
      logCallback[currentStep]();
    }
    
    currentStep++;
    setTimeout(next, 1200); // 1.2s delay per step
  }
  
  next();
}

// 1. MODULE 1: AUTH & SECURITY SIMULATOR
function renderAuthSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>1. System Access & Security (Auth)</h4>
        <p>Giải lập Đăng nhập Khách hàng / Nhân viên & Xử lý bảo mật SecurityConfig.</p>
      </div>
      
      <div class="sim-card">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button class="browser-btn auth-type-btn active" id="auth-mode-customer" style="flex: 1; padding: 6px;">👤 Khách hàng (/login)</button>
          <button class="browser-btn auth-type-btn" id="auth-mode-admin" style="flex: 1; padding: 6px;">👑 Admin/Staff (/admin-login)</button>
        </div>

        <div class="sim-form-group">
          <label id="auth-label-user">Email / Số điện thoại</label>
          <input type="text" id="sim-login-email" class="sim-input" value="customer@homestay.com">
        </div>
        <div class="sim-form-group">
          <label>Mật khẩu</label>
          <input type="password" id="sim-login-pass" class="sim-input" value="••••••••">
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="sim-btn" id="sim-auth-btn" style="flex: 2;">🔐 ĐĂNG NHẬP HỆ THỐNG</button>
          <button class="sim-btn-secondary" id="sim-logout-btn" style="flex: 1; background-color: var(--danger-glow); color: var(--danger); border: 1px solid var(--danger);">🚪 Đăng xuất</button>
        </div>
      </div>
    </div>
  `;
  
  let currentAuthMode = 'customer';
  const customerBtn = document.getElementById('auth-mode-customer');
  const adminBtn = document.getElementById('auth-mode-admin');
  const emailInput = document.getElementById('sim-login-email');

  customerBtn.addEventListener('click', () => {
    currentAuthMode = 'customer';
    customerBtn.classList.add('active');
    adminBtn.classList.remove('active');
    emailInput.value = 'customer@homestay.com';
  });

  adminBtn.addEventListener('click', () => {
    currentAuthMode = 'admin';
    adminBtn.classList.add('active');
    customerBtn.classList.remove('active');
    emailInput.value = 'admin@homestay.com';
  });

  document.getElementById('sim-auth-btn').addEventListener('click', () => {
    const email = emailInput.value;
    const isCustomer = currentAuthMode === 'customer';
    const endpoint = isCustomer ? '/api/auth/login' : '/api/auth/admin-login';
    const pageSource = isCustomer ? 'LoginPage.jsx' : 'AdminLoginPage.jsx';
    
    const logs = [
      () => logToConsole(`[Frontend - ${pageSource}] Thu thập thông tin credentials: ${email}. Gọi LoginForm component...`, 'system'),
      () => logToConsole(`[AdminLoginPage / LoginForm] Submit form, kiểm tra định dạng email/mật khẩu không rỗng.`, 'system'),
      () => logToConsole(`[LoginForm / AuthController] Gọi API POST '${endpoint}' với payload { usernameOrEmail: "${email}" }`, 'api-call'),
      () => logToConsole(`[AuthController / SecurityConfig] Spring Security nhận request. Đã mở permitAll() cho endpoint auth.`, 'api-response'),
      () => logToConsole(`[SecurityConfig / AuthServiceImpl] AuthenticationManager xác thực mật khẩu BCrypt. Trả mã JWT Bearer Token với Role: ${isCustomer ? 'ROLE_CUSTOMER' : 'ROLE_ADMIN'}.`, 'api-response'),
      () => logToConsole(`[AdminLayout.jsx] Lưu JWT Token vào LocalStorage/Context, kích hoạt Session quản trị.`, 'system')
    ];
    
    triggerTraceRun('auth_security', 6, logs);
  });

  document.getElementById('sim-logout-btn').addEventListener('click', () => {
    logToConsole(`[AdminLayout.jsx] Bấm Đăng xuất. Xóa JWT Token khỏi LocalStorage, hủy Context Session và điều hướng về trang Login.`, 'system');
  });
}

// 2. MODULE 2: ROOM MANAGEMENT SIMULATOR
function renderRoomSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>2. Room Management (Search, Deposit, Category)</h4>
        <p>Tìm kiếm phòng, chính sách tiền cọc và quản lý danh mục loại phòng.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Danh Mục Loại Phòng (RoomType)</label>
          <select id="sim-room-cat" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option value="1">Suite VIP Căn Hộ View Hồ (1.200.000đ/đêm)</option>
            <option value="2">Standard Double Lãng Mạn (600.000đ/đêm)</option>
            <option value="3">Family Villa Nguyên Căn (2.500.000đ/đêm)</option>
          </select>
        </div>
        <div class="sim-form-group" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label>Ngày Check-in</label>
            <input type="date" id="sim-room-in" class="sim-input" value="2026-08-20">
          </div>
          <div style="flex: 1;">
            <label>Tỷ Lệ Tiền Cọc (%)</label>
            <input type="number" id="sim-deposit-rate" class="sim-input" value="30" min="0" max="100">
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="sim-btn" id="sim-search-room-btn" style="flex: 1;">🔍 TÌM KIẾM PHÒNG TRỐNG</button>
          <button class="sim-btn-secondary" id="sim-config-deposit-btn" style="flex: 1; background-color: var(--primary-glow); color: #a5b4fc; border: 1px solid var(--primary);">⚙️ CẤU HÌNH CỌC (ADMIN)</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('sim-search-room-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[HomeSearch.jsx] Khách chọn bộ lọc ngày check-in. Kích hoạt sự kiện submit trên HomeSearch.`, 'system'),
      () => logToConsole(`[HomePage.jsx] Render danh sách phòng dựa trên tham số lọc tìm kiếm.`, 'system'),
      () => logToConsole(`[AdminRoomsPage.jsx] Load danh mục phòng hiện tại từ state quản trị.`, 'system'),
      () => logToConsole(`[RoomController.java] GET '/api/rooms/search' tiếp nhận tham số ngày và mã loại phòng.`, 'api-call'),
      () => logToConsole(`[AdminPriceConfigController.java] Đọc cấu hình chính sách giá và đợt thuê phòng.`, 'api-response'),
      () => logToConsole(`[RoomType.java Entity] Hibernate truy xuất thông tin chi tiết bảng room_types.`, 'api-call'),
      () => logToConsole(`[DepositPolicy.java Entity] Áp dụng tỷ lệ đặt cọc phòng tương ứng. Trả kết quả danh sách phòng trống.`, 'api-response')
    ];
    
    triggerTraceRun('room_mgmt', 7, logs);
  });

  document.getElementById('sim-config-deposit-btn').addEventListener('click', () => {
    const rate = document.getElementById('sim-deposit-rate').value;
    logToConsole(`[AdminRoomsPage.jsx / AdminPriceConfigController.java] Cập nhật DepositPolicy tỷ lệ cọc mới: ${rate}%.`, 'api-call');
  });
}

// 3. MODULE 3: BOOKING MANAGEMENT (REQUEST EXTRA AMENITIES) SIMULATOR
function renderBookingSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>3. Booking Management (Request Extra Amenities)</h4>
        <p>Yêu cầu dịch vụ / tiện ích bổ sung từ Lịch sử Đặt phòng.</p>
      </div>
      
      <div class="sim-card" style="background-color: var(--bg-tertiary); margin-bottom: 12px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 6px;">
          <strong>Đơn Booking: #BK-9801 (Đang ở)</strong>
          <span style="color: var(--success); font-size: 10px; font-weight: bold; background-color: var(--success-glow); padding: 2px 6px; border-radius: 4px;">CHECKED_IN</span>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary);">Phòng VIP L202 - Khách: Nguyễn Văn Anh</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Chọn Dịch Vụ / Tiện Ích Bổ Sung</label>
          <select id="sim-amenity-select" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option value="BBQ Kit">Tiệc Nướng BBQ Sân Vườn (+250.000đ)</option>
            <option value="Airport Pickup">Xe Đưa Đón Sân Bay (+350.000đ)</option>
            <option value="Motorbike Rental">Thuê Xe Máy Theo Ngày (+150.000đ)</option>
          </select>
        </div>
        <button class="sim-btn" id="sim-req-amenity-btn" style="background-color: var(--primary); width: 100%;">
          🛎️ GỬI YÊU CẦU DỊCH VỤ BỔ SUNG
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-req-amenity-btn').addEventListener('click', () => {
    const amenity = document.getElementById('sim-amenity-select').value;
    
    const logs = [
      () => logToConsole(`[BookingHistoryPage.jsx] Khách nhấn "Thêm dịch vụ" tại đơn #BK-9801, chuyển sang AmenitiesPage.jsx.`, 'system'),
      () => logToConsole(`[AmenitiesPage.jsx] Chọn dịch vụ bổ sung: "${amenity}". Bấm xác nhận gửi yêu cầu.`, 'system'),
      () => logToConsole(`[PublicAmenityController.java] POST '/api/public/amenities/request' với payload { bookingId: "BK-9801", amenity: "${amenity}" }`, 'api-call'),
      () => logToConsole(`[PublicAmenityServiceImpl.java] Kiểm tra trạng thái đơn #BK-9801 hợp lệ. Tính thêm chi phí "${amenity}" vào hóa đơn phụ thu.`, 'api-response')
    ];
    
    triggerTraceRun('booking_mgmt', 4, logs);
  });
}

// 4. MODULE 4: INVOICE & PAYMENT (SEPAY) SIMULATOR
function renderPaymentSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>4. Invoice & Payment (SePay QR Payment)</h4>
        <p>Thanh toán hóa đơn VietQR & Khớp lệnh chuyển khoản ngân hàng SePay.</p>
      </div>
      
      <div class="sim-card">
        <p style="font-size: 13px; margin-bottom: 6px;">Hóa đơn Đặt phòng: <strong>#INV-9801</strong></p>
        <p style="font-size: 14px; color: var(--success); font-weight: bold; margin-bottom: 12px;">Số tiền thanh toán: 1,500,000đ</p>
        
        <div style="background-color: var(--bg-primary); padding: 12px; border-radius: 8px; text-align: center; border: 1px dashed var(--primary); margin-bottom: 12px;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">MÃ VIETQR DỘNG (SEPAY INTEGRATED)</div>
          <div style="font-size: 16px; font-weight: 800; color: #a5b4fc;">Nội dung: BK9801</div>
        </div>
        
        <button class="sim-btn" id="sim-sepay-webhook-btn" style="background-color: var(--success); width: 100%;">
          ⚡ GIẢ LẬP WEBHOOK SEPAY (NGÂN HÀNG BÁO CÓ MONEY IN)
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-sepay-webhook-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[AdminInvoicesPage.jsx] Admin xem trạng thái hóa đơn #INV-9801 (Đang chờ thanh toán).`, 'system'),
      () => logToConsole(`[SePayQrPayment.jsx] Render VietQR mã hóa cú pháp chuyển khoản 'BK9801'.`, 'system'),
      () => logToConsole(`[AdminInvoiceController.java] Lấy chi tiết thông tin hóa đơn và lịch sử giao dịch.`, 'api-call'),
      () => logToConsole(`[SePayPaymentController.java] SePay Webhook bắn HTTP POST chứa nội dung "BK9801" + Số tiền 1.500.000đ kèm Signature.`, 'api-call'),
      () => logToConsole(`[AdminInvoiceServiceImpl.java] Cập nhật hóa đơn sang trạng thái PAID.`, 'api-response'),
      () => logToConsole(`[SePayPaymentServiceImpl.java] Kiểm tra chữ ký an toàn, giải mã nội dung "BK9801", xác nhận khớp tiền thành công!`, 'api-response'),
      () => logToConsole(`[Invoice.java Entity] Cập nhật status = 'PAID' trong CSDL invoices.`, 'api-call'),
      () => logToConsole(`[Payment.java Entity] Tạo bản ghi giao dịch mới trong bảng payments.`, 'api-call')
    ];
    
    triggerTraceRun('invoice_payment', 8, logs);
  });
}

// 5. MODULE 5: RULES & PENALTIES SIMULATOR
function renderRulesSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>5. Rules & Penalties (Quy định & Phạt)</h4>
        <p>Quản lý quy định homestay và tính toán phụ thu / phí phạt.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Phụ thu Check-out muộn (trên 2 tiếng)</label>
          <input type="number" id="sim-rule-checkout" class="sim-input" value="30">
        </div>
        <div class="sim-form-group">
          <label>Mức phạt vi phạm quy định hút thuốc / làm hỏng đồ (%)</label>
          <input type="number" id="sim-rule-penalty" class="sim-input" value="100">
        </div>
        <button class="sim-btn" id="sim-rules-save-btn" style="width: 100%;">🔧 LƯU CẤU HÌNH QUY ĐỊNH PHẠT</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-rules-save-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[AdminRulesPenaltiesPage.jsx] Admin chỉnh sửa tham số tỷ lệ phụ thu và phạt vi phạm. Bấm Lưu.`, 'system'),
      () => logToConsole(`[AdminRulesPenaltyController.java] PUT '/api/admin/rules-penalties' tiếp nhận RulesPenaltyDto.`, 'api-call'),
      () => logToConsole(`[AdminRulesPenaltyServiceImpl.java] Thực hiện cập nhật quy tắc tính tiền phạt phụ thu tự động khi khách check-out muộn.`, 'api-response')
    ];
    
    triggerTraceRun('rules_penalties', 3, logs);
  });
}

// 6. MODULE 6: DASHBOARD & REPORTING SIMULATOR
function renderDashboardSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>6. Dashboard & Reporting (Marketing Metrics)</h4>
        <p>Báo cáo chỉ số hiệu suất Marketing & Thống kê tổng quan.</p>
      </div>
      
      <div class="sim-card" style="display: flex; gap: 10px; margin-bottom: 12px; background-color: var(--bg-tertiary);">
        <div style="flex: 1; padding: 8px; background-color: var(--bg-primary); border-radius: 6px; text-align: center;">
          <div style="font-size: 10px; color: var(--text-muted);">LƯỢT TƯƠNG TÁC</div>
          <div style="font-size: 16px; font-weight: bold; color: var(--primary);">12,450</div>
        </div>
        <div style="flex: 1; padding: 8px; background-color: var(--bg-primary); border-radius: 6px; text-align: center;">
          <div style="font-size: 10px; color: var(--text-muted);">TỶ LỆ CHUYỂN ĐỔI</div>
          <div style="font-size: 16px; font-weight: bold; color: var(--success);">4.8%</div>
        </div>
      </div>
      
      <div class="sim-card">
        <button class="sim-btn" id="sim-dash-fetch-btn" style="width: 100%;">📊 TẢI METRICS DASHBOARD MỚI NHẤT</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-dash-fetch-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[MarketingPages.jsx (Dashboard)] Render các Widget chỉ số báo cáo doanh thu & marketing metrics.`, 'system'),
      () => logToConsole(`[AdminMarketingController.java] GET '/api/admin/marketing/dashboard' gọi hàm dashboard() tổng hợp dữ liệu chiến dịch.`, 'api-call')
    ];
    
    triggerTraceRun('dashboard_reporting', 2, logs);
  });
}

// 7. MODULE 7: MARKETING MANAGEMENT SIMULATOR
function renderMarketingSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>7. Marketing Management (UI & AI Post Agent)</h4>
        <p>Tạo bài đăng tự động bằng AI và xuất bản lên mạng xã hội.</p>
      </div>

      <div class="sim-card">
        <div class="sim-form-group">
          <label>Kênh Đăng Bài</label>
          <select id="sim-mkt-platform" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option value="Facebook Fanpage">Facebook Fanpage</option>
            <option value="YouTube Channel">YouTube Channel</option>
          </select>
        </div>

        <div class="sim-form-group">
          <label>Chủ đề bài viết</label>
          <input type="text" id="sim-mkt-topic" class="sim-input" value="Khuyến mãi giảm 20% cho phòng VIP Suite cuối tuần">
        </div>

        <button class="sim-btn" id="sim-mkt-generate-btn" style="background-color: var(--primary); width: 100%;">🚀 TẠO NỘI DUNG AI & ĐĂNG BÀI</button>
      </div>
    </div>
  `;

  document.getElementById('sim-mkt-generate-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[MarketingPages.jsx] Admin cấu hình chủ đề bài đăng trên giao diện Marketing.`, 'system'),
      () => logToConsole(`[AdminPlaceholderPage.jsx] Màn hình chờ xuất bản bài đăng.`, 'system'),
      () => logToConsole(`[AdminMarketingController.java] POST '/api/admin/marketing/publish' tiếp nhận request tạo bài viết AI.`, 'api-call')
    ];

    triggerTraceRun('marketing_mgmt', 3, logs);
  });
}

// 8. MODULE 8: AI ASSISTANT & CHATBOX SIMULATOR
function renderAiAssistantSimulator(container) {
  container.innerHTML = `
    <div class="sim-page" style="display: flex; flex-direction: column; height: 100%; max-height: 380px;">
      <div class="sim-page-header" style="flex-shrink: 0; padding-bottom: 6px;">
        <h4 style="display: flex; align-items: center; gap: 6px;">🤖 8. AI Assistant & Chatbox <span style="font-size: 10px; background-color: var(--success); color: white; padding: 2px 6px; border-radius: 10px;">Sidecar Python Active</span></h4>
        <p>Trợ lý AI hỗ trợ Khách hàng (Customer) & Nhân viên (Staff).</p>
      </div>

      <div class="sim-card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-tertiary); padding: 10px; gap: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="browser-btn chat-role-btn active" id="chat-mode-customer" style="flex: 1; font-size: 11px; padding: 4px;">💬 Chat Khách hàng</button>
          <button class="browser-btn chat-role-btn" id="chat-mode-staff" style="flex: 1; font-size: 11px; padding: 4px;">👔 Chat Nhân viên</button>
        </div>

        <div id="ai-chat-messages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px; font-size: 11.5px;">
          <div style="background-color: var(--bg-accent); padding: 6px 10px; border-radius: var(--radius-md); align-self: flex-start; max-width: 85%; color: var(--text-primary);">
            Xin chào! Tôi là trợ lý AI Homestay. Bạn cần tư vấn thông tin phòng hay hỗ trợ công việc?
          </div>
        </div>

        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <input type="text" id="ai-chat-input" class="sim-input" placeholder="Nhập câu hỏi..." style="margin-bottom: 0; flex: 1; font-size: 11.5px; padding: 6px 10px;">
          <button class="sim-btn" id="ai-chat-send-btn" style="padding: 6px 12px; font-size: 11.5px; margin-top: 0; white-space: nowrap;">Gửi AI ➔</button>
        </div>
      </div>
    </div>
  `;

  let isCustomerMode = true;
  const customerBtn = document.getElementById('chat-mode-customer');
  const staffBtn = document.getElementById('chat-mode-staff');

  customerBtn.addEventListener('click', () => {
    isCustomerMode = true;
    customerBtn.classList.add('active');
    staffBtn.classList.remove('active');
  });

  staffBtn.addEventListener('click', () => {
    isCustomerMode = false;
    staffBtn.classList.add('active');
    customerBtn.classList.remove('active');
  });

  document.getElementById('ai-chat-send-btn').addEventListener('click', () => {
    const chatInput = document.getElementById('ai-chat-input');
    const msg = chatInput.value.trim();
    if (!msg) return;

    const msgContainer = document.getElementById('ai-chat-messages');
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'background-color: var(--primary); padding: 6px 10px; border-radius: var(--radius-md); align-self: flex-end; max-width: 85%; color: white;';
    userMsg.innerText = `[${isCustomerMode ? 'Khách' : 'Staff'}] ${msg}`;
    msgContainer.appendChild(userMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    chatInput.value = '';

    const logs = [
      () => logToConsole(`[${isCustomerMode ? 'CustomerAiChat.jsx' : 'StaffAiChat.jsx'}] Thu thập tin nhắn từ widget AIChatWidget.jsx: "${msg}"`, 'system'),
      () => logToConsole(`[${isCustomerMode ? 'CustomerAiChatController.java' : 'StaffAiChatController.java'}] Controller tiếp nhận request chat từ client.`, 'api-call'),
      () => logToConsole(`[${isCustomerMode ? 'CustomerAiChatServiceImpl.java' : 'StaffAiChatServiceImpl.java'}] Tập hợp context nghiệp vụ phù hợp.`, 'api-response'),
      () => logToConsole(`[CustomerAiSidecarManager.java] Đảm bảo tiến trình Python Sidecar đang chạy khỏe mạnh.`, 'system'),
      () => {
        logToConsole(`[openchatbi/customer_assistant/app.py] FastAPI Python sidecar nhận prompt và gọi mô hình AI trả lời.`, 'api-call');
        setTimeout(() => {
          const aiMsg = document.createElement('div');
          aiMsg.style.cssText = 'background-color: var(--bg-accent); padding: 6px 10px; border-radius: var(--radius-md); align-self: flex-start; max-width: 85%; color: var(--text-primary); margin-top: 4px; line-height: 1.4;';
          aiMsg.innerText = isCustomerMode 
            ? 'Cảm ơn bạn đã hỏi! Homestay có các phòng VIP Suite view hồ tuyệt đẹp và dịch vụ minibar chu đáo.'
            : 'Đã tra cứu dữ liệu buồng phòng: Hiện tại có 2 phòng cần dọn dẹp trước 14:00.';
          msgContainer.appendChild(aiMsg);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 1000);
      },
      () => logToConsole(`[AI_CHAT_API_KEY_GUIDE.md] Kiểm tra cấu hình API Key và trạng thái kết nối thành công.`, 'system')
    ];

    triggerTraceRun('ai_assistant', 6, logs);
  });
}
" style="flex: 2; background-color: var(--bg-primary); border-color: var(--border-color); color: white; margin-bottom: 0; font-size: 12px;">
            <option value="Coca-Cola (20k)">Coca-Cola (Đơn giá: 20,000đ)</option>
            <option value="Yến sào Khánh Hòa (35k)">Yến sào Khánh Hòa (Đơn giá: 35,000đ)</option>
            <option value="Mì ly Hảo Hảo (15k)">Mì ly Hảo Hảo (Đơn giá: 15,000đ)</option>
          </select>
          
          <input type="number" id="sim-stay-qty" class="sim-input" value="2" min="1" max="10" style="flex: 1; margin-bottom: 0; font-size: 12px; text-align: center;">
        </div>

        <button class="sim-btn" id="sim-stay-order-btn" style="background-color: var(--success); width: 100%; margin-top: 10px;">🛒 GỌI DỊCH VỤ MINIBAR</button>
      </div>
    </div>
  `;

  document.getElementById('sim-stay-order-btn').addEventListener('click', () => {
    const item = document.getElementById('sim-stay-item').value;
    const qty = document.getElementById('sim-stay-qty').value;

    const logs = [
      () => logToConsole(`[Stay Portal UI] Khách chọn mua: ${qty} x ${item}. Gửi request từ StayPage.jsx.`, 'system'),
      () => logToConsole(`[Controller] StayPortalController nhận POST '/api/stays/1/services' (gọi dịch vụ cho mã lưu trú accessId = 1)`, 'api-call'),
      () => logToConsole(`[Service] StayAccessServiceImpl thêm Order vào hóa đơn chi tiết phòng L202. Đổi trạng thái cần phục vụ.`, 'api-response'),
      () => logToConsole(`[Database] StayAccessRepository thực hiện lưu bản ghi dịch vụ BookingServiceOrder mới.`, 'api-call')
    ];

    triggerTraceRun('stay_portal', 4, logs);
  });
}

