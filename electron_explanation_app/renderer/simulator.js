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
  }
});

// SIMULATION ENGINE
function loadSimulator(flowId) {
  const simContent = document.getElementById('simulator-content');
  if (!simContent) return;
  
  logToConsole(`[Hệ thống] Khởi tạo giao diện giả lập cho luồng: ${window.FLOWS_CONFIG[flowId].title}`);
  
  switch(flowId) {
    case 'auth_security':
      renderAuthSimulator(simContent);
      break;
    case 'booking_mgmt':
      renderBookingSimulator(simContent);
      break;
    case 'housekeeping':
      renderHousekeepingSimulator(simContent);
      break;
    case 'payment_invoice':
      renderPaymentSimulator(simContent);
      break;
    case 'room_mgmt':
      renderRoomSimulator(simContent);
      break;
    case 'services_mgmt':
      renderServicesSimulator(simContent);
      break;
    case 'rules_penalties':
      renderRulesSimulator(simContent);
      break;
    case 'customer_ai_chat':
      renderCustomerAiChatSimulator(simContent);
      break;
    case 'ai_marketing':
      renderAiMarketingSimulator(simContent);
      break;
    case 'stay_portal':
      renderStayPortalSimulator(simContent);
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

// 1. AUTH SIMULATOR
function renderAuthSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Lagom Homestay - Trang Đăng Nhập</h4>
        <p>Đăng nhập hệ thống quản lý hoặc đặt phòng.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Tài khoản / Email</label>
          <input type="text" id="sim-login-email" class="sim-input" value="admin@lagom.com">
        </div>
        <div class="sim-form-group">
          <label>Mật khẩu</label>
          <input type="password" id="sim-login-pass" class="sim-input" value="••••••••">
        </div>
        <button class="sim-btn" id="sim-auth-btn">🔐 ĐĂNG NHẬP HỆ THỐNG</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-auth-btn').addEventListener('click', () => {
    const email = document.getElementById('sim-login-email').value;
    
    const logs = [
      () => logToConsole(`[Frontend] Bấm Đăng Nhập. Thu thập input: ${email}. Gọi validate form...`, 'system'),
      () => logToConsole(`[API Client] Gửi POST request tới http://localhost:8080/api/auth/login với payload: { usernameOrEmail: "${email}" }`, 'api-call'),
      () => logToConsole(`[Controller] AuthController nhận request. Chuyển sang dịch vụ AuthenticationManager.`, 'api-response'),
      () => logToConsole(`[Service] AuthServiceImpl so khớp hash mật khẩu BCrypt. Xác thực thành công! Tạo JWT Token với phân quyền ADMIN.`, 'api-response'),
      () => logToConsole(`[Repository] AccountRepository thực hiện SQL: SELECT * FROM account WHERE email = '${email}'`, 'api-call')
    ];
    
    triggerTraceRun('auth_security', 5, logs);
  });
}

// 2. BOOKING SIMULATOR
function renderBookingSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Đặt Phòng Trực Tuyến</h4>
        <p>Chọn loại phòng và thời gian ở mong muốn.</p>
      </div>
      
      <div class="sim-rooms-grid">
        <div class="sim-room-card">
          <div class="sim-room-img">🏠</div>
          <div class="sim-room-details">
            <span class="sim-room-title">Phòng Suite VIP Căn Hộ</span>
            <span class="sim-room-price">1,200,000đ / đêm</span>
          </div>
        </div>
        <div class="sim-room-card">
          <div class="sim-room-img">🛋️</div>
          <div class="sim-room-details">
            <span class="sim-room-title">Phòng Standard Double</span>
            <span class="sim-room-price">600,000đ / đêm</span>
          </div>
        </div>
      </div>
      
      <div class="sim-card" style="margin-top: 10px;">
        <div class="sim-form-group">
          <label>Chọn Loại Phòng</label>
          <select id="sim-booking-type" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option value="1">Suite VIP Căn Hộ</option>
            <option value="2">Standard Double</option>
          </select>
        </div>
        <div class="sim-form-group" style="display: flex; flex-direction: row; gap: 10px;">
          <div style="flex: 1;">
            <label>Ngày Check-in</label>
            <input type="date" id="sim-booking-in" class="sim-input" value="2026-07-20" style="width: 100%;">
          </div>
          <div style="flex: 1;">
            <label>Ngày Check-out</label>
            <input type="date" id="sim-booking-out" class="sim-input" value="2026-07-22" style="width: 100%;">
          </div>
        </div>
        <button class="sim-btn" id="sim-booking-btn">🛎️ TIẾN HÀNH ĐẶT PHÒNG</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-booking-btn').addEventListener('click', () => {
    const checkIn = document.getElementById('sim-booking-in').value;
    const checkOut = document.getElementById('sim-booking-out').value;
    
    const logs = [
      () => logToConsole(`[Frontend] RoomsPage nhận click Đặt phòng. Validate lịch trống cục bộ. Check-in: ${checkIn}, Check-out: ${checkOut}`, 'system'),
      () => logToConsole(`[Controller] PublicBookingController nhận POST '/api/public/bookings' mang thông tin RoomType: 1, Dates: ${checkIn} -> ${checkOut}`, 'api-call'),
      () => logToConsole(`[Service] PublicBookingServiceImpl thực hiện logic: check phòng trống trên DB, tính phụ thu sớm/muộn, áp dụng chiết khấu. Tạo mã Đặt phòng tạm thời.`, 'api-response'),
      () => logToConsole(`[Repository] BookingRepository lưu bản ghi Booking mới. Thực hiện SQL: INSERT INTO bookings, INSERT INTO booking_details...`, 'api-call')
    ];
    
    triggerTraceRun('booking_mgmt', 4, logs);
  });
}

// 3. HOUSEKEEPING SIMULATOR
function renderHousekeepingSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Bảng Phân Công Dọn Phòng</h4>
        <p>Giao lịch dọn dẹp cho nhân viên buồng phòng.</p>
      </div>
      
      <div class="sim-task-list">
        <div class="sim-task-item">
          <div class="sim-task-label">
            <span class="sim-task-badge dirty">BẨN</span>
            <strong>Phòng L202 (Suite VIP)</strong>
          </div>
          <select id="assign-staff-202" class="sim-input" style="padding: 4px 8px; font-size: 11px;">
            <option>Chọn NV: Nguyễn Văn Nam</option>
            <option>Chọn NV: Lê Thị Hoa</option>
          </select>
        </div>
        
        <div class="sim-task-item">
          <div class="sim-task-label">
            <span class="sim-task-badge clean">SẠCH</span>
            <strong>Phòng S101 (Standard)</strong>
          </div>
          <span style="font-size: 12px; color: var(--text-muted)">Đã dọn xong</span>
        </div>
      </div>
      
      <button class="sim-btn" id="sim-housekeeping-btn" style="margin-top: 10px;">📋 GIAO VIỆC DỌN PHÒNG</button>
    </div>
  `;
  
  document.getElementById('sim-housekeeping-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[Frontend] Click phân công. Đọc dữ liệu nhân viên dọn dẹp gán cho phòng L202.`, 'system'),
      () => logToConsole(`[Controller] AdminHousekeepingCalendarController nhận POST '/api/admin/housekeeping/assign' với taskId và staffId.`, 'api-call'),
      () => logToConsole(`[Service] AdminHousekeepingCalendarServiceImpl cập nhật nhân viên phụ trách, đổi trạng thái task thành IN_PROGRESS.`, 'api-response'),
      () => logToConsole(`[Repository] HousekeepingTaskRepository cập nhật DB: UPDATE housekeeping_tasks SET status='IN_PROGRESS', staff_id=3 WHERE id=1`, 'api-call')
    ];
    
    triggerTraceRun('housekeeping', 4, logs);
  });
}

// 4. PAYMENT & INVOICE SIMULATOR
function renderPaymentSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Giả Lập Thanh Toán SePay QR</h4>
        <p>Quét mã QR để khớp lệnh và thanh toán tự động qua Webhook.</p>
      </div>
      
      <div class="sim-card">
        <p style="font-size: 13px; margin-bottom: 8px;">Hóa đơn: <strong>#BK-9801</strong> - Phòng VIP L202</p>
        <p style="font-size: 14px; color: var(--success); font-weight: bold; margin-bottom: 12px;">Số tiền: 1,200,000đ</p>
        
        <div class="sepay-qr-box">
          <div class="sepay-qr-placeholder">VietQR CODE</div>
          <div class="sepay-text">Nội dung chuyển khoản: <br><strong style="color: var(--primary)">BK9801</strong></div>
        </div>
        
        <button class="sim-btn" id="sim-payment-btn" style="margin-top: 16px; background-color: var(--success); width: 100%;">
          ⚡ GIẢ LẬP WEBHOOK SEPAY (BANK CHUYỂN KHOẢN)
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-payment-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[Frontend] Đang hiển thị VietQR với nội dung chuyển khoản mã hóa 'BK9801'. Chờ tín hiệu websocket...`, 'system'),
      () => logToConsole(`[Webhook API] Cổng SePay nhận lệnh chuyển khoản từ ngân hàng Vietcombank. Bắn HTTP POST Webhook tới backend endpoint: '/api/sepay/webhook' với signature bảo mật.`, 'api-call'),
      () => logToConsole(`[Service] SePayPaymentServiceImpl xác thực Signature từ header. Phân tích nội dung chuyển khoản: tìm thấy từ khóa 'BK9801'. Tìm hóa đơn tương ứng. Cập nhật hóa đơn sang PAID.`, 'api-response'),
      () => logToConsole(`[Repository] PaymentRepository lưu vết thanh toán (INSERT INTO payments), InvoiceRepository cập nhật trạng thái hóa đơn.`, 'api-call')
    ];
    
    triggerTraceRun('payment_invoice', 4, logs);
  });
}

// 5. ROOM MANAGEMENT SIMULATOR
function renderRoomSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Quản Lý Buồng Phòng (Admin)</h4>
        <p>Cập nhật thông tin và tạo phòng mới.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Số Phòng</label>
          <input type="text" id="sim-room-num" class="sim-input" value="L204">
        </div>
        <div class="sim-form-group">
          <label>Loại Phòng</label>
          <select id="sim-room-type" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option>Suite VIP Căn Hộ</option>
            <option>Standard Double</option>
          </select>
        </div>
        <button class="sim-btn" id="sim-room-btn">➕ TẠO PHÒNG MỚI</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-room-btn').addEventListener('click', () => {
    const roomNum = document.getElementById('sim-room-num').value;
    
    const logs = [
      () => logToConsole(`[Frontend] Click thêm phòng. Gom dữ liệu form. Validate số phòng: ${roomNum}`, 'system'),
      () => logToConsole(`[Controller] AdminRoomController nhận request POST '/api/admin/rooms' với RoomDto.`, 'api-call'),
      () => logToConsole(`[Service] AdminRoomServiceImpl kiểm tra số phòng ${roomNum} xem đã tồn tại chưa. Tạo mới thực thể Room và map với chính sách mặc định.`, 'api-response'),
      () => logToConsole(`[Repository] RoomRepository lưu thông tin phòng mới vào DB: INSERT INTO rooms (room_number, room_type_id, status) VALUES ('${roomNum}', 1, 'AVAILABLE')`, 'api-call')
    ];
    
    triggerTraceRun('room_mgmt', 4, logs);
  });
}

// 6. SERVICES SIMULATOR
function renderServicesSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Quản Lý Dịch Vụ Minibar</h4>
        <p>Khai báo danh mục đồ uống và thức ăn nhẹ trong phòng.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Tên đồ ăn/uống</label>
          <input type="text" id="sim-service-name" class="sim-input" value="Nước yến sào Khánh Hòa">
        </div>
        <div class="sim-form-group">
          <label>Đơn Giá Bán Lẻ (đ)</label>
          <input type="number" id="sim-service-price" class="sim-input" value="35000">
        </div>
        <button class="sim-btn" id="sim-services-btn">💾 LƯU DỊCH VỤ</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-services-btn').addEventListener('click', () => {
    const sName = document.getElementById('sim-service-name').value;
    const sPrice = document.getElementById('sim-service-price').value;
    
    const logs = [
      () => logToConsole(`[Frontend] Click Lưu dịch vụ. Validate tên dịch vụ: "${sName}", đơn giá: ${sPrice}đ`, 'system'),
      () => logToConsole(`[Controller] AdminServiceCatalogController nhận POST '/api/admin/services' chứa ServiceCatalogDto.`, 'api-call'),
      () => logToConsole(`[Service] AdminServiceCatalogServiceImpl lưu và đồng bộ danh mục dịch vụ trong kho của hệ thống.`, 'api-response'),
      () => logToConsole(`[Repository] RoomMiniBarItemRepository liên kết mặt hàng dịch vụ với kho hàng buồng phòng.`, 'api-call')
    ];
    
    triggerTraceRun('services_mgmt', 4, logs);
  });
}

// 7. RULES & SURCHARGES SIMULATOR
function renderRulesSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>Cấu Hình Quy Định Phạt & Phụ Thu</h4>
        <p>Cập nhật quy tắc tính tiền phụ thu check-in/out.</p>
      </div>
      
      <div class="sim-card">
        <div class="sim-form-group">
          <label>Phụ thu Check-out muộn từ 12h - 15h (%)</label>
          <input type="number" id="sim-rule-checkout" class="sim-input" value="30">
        </div>
        <div class="sim-form-group">
          <label>Phạt hỏng hóc đồ đạc/quy định (%)</label>
          <input type="number" id="sim-rule-penalty" class="sim-input" value="100">
        </div>
        <button class="sim-btn" id="sim-rules-btn">🔧 CẬP NHẬT CẤU HÌNH</button>
      </div>
    </div>
  `;
  
  document.getElementById('sim-rules-btn').addEventListener('click', () => {
    const logs = [
      () => logToConsole(`[Frontend] Click Cập nhật quy định. Gửi tham số phụ thu checkout muộn mới.`, 'system'),
      () => logToConsole(`[Controller] AdminRulesPenaltyController nhận request PUT '/api/admin/rules' lưu quy tắc phạt.`, 'api-call'),
      () => logToConsole(`[Service] AdminRulesPenaltyServiceImpl lưu cấu hình và kích hoạt tính phụ thu tự động khi khách check-out muộn.`, 'api-response'),
      () => logToConsole(`[Repository] RulesPenaltyRepository ghi cấu hình mới vào bảng rules_penalty.`, 'api-call')
    ];
    
    triggerTraceRun('rules_penalties', 4, logs);
  });
}

// 8. CUSTOMER AI CHAT SIMULATOR
function renderCustomerAiChatSimulator(container) {
  container.innerHTML = `
    <div class="sim-page" style="display: flex; flex-direction: column; height: 100%; max-height: 380px;">
      <div class="sim-page-header" style="flex-shrink: 0; padding-bottom: 8px;">
        <h4 style="display: flex; align-items: center; gap: 6px;">🤖 Lagom AI Assistant <span style="font-size: 10px; background-color: var(--success); color: white; padding: 2px 6px; border-radius: 10px;">GLM-5.2 Active</span></h4>
        <p>Hỏi đáp thông tin phòng trống, dịch vụ & chính sách homestay tự động.</p>
      </div>

      <div class="sim-card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-tertiary); padding: 12px; gap: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <!-- Messages Area -->
        <div id="ai-chat-messages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; font-size: 12px;">
          <div style="background-color: var(--bg-accent); padding: 8px 12px; border-radius: var(--radius-md); align-self: flex-start; max-width: 85%; color: var(--text-primary);">
            Xin chào! Tôi là trợ lý ảo Lagom Homestay. Bạn cần tôi hỗ trợ tìm thông tin phòng, xem giá hay kiểm tra lịch trình gì không?
          </div>
        </div>

        <!-- Preset Prompts -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;">
          <button class="browser-btn preset-chat-btn" onclick="sendPresetChat('Phòng Suite VIP có những tiện ích gì và giá bao nhiêu?')" style="font-size: 10.5px; padding: 4px 8px; background-color: var(--bg-primary);">🏠 Xem phòng Suite VIP</button>
          <button class="browser-btn preset-chat-btn" onclick="sendPresetChat('Chính sách check-in sớm của homestay tính phí thế nào?')" style="font-size: 10.5px; padding: 4px 8px; background-color: var(--bg-primary);">🛡️ Chính sách phụ thu</button>
        </div>

        <!-- Input Box -->
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <input type="text" id="ai-chat-input" class="sim-input" placeholder="Nhập câu hỏi của bạn..." style="margin-bottom: 0; flex: 1; font-size: 12px; padding: 6px 10px;">
          <button class="sim-btn" id="ai-chat-send-btn" style="padding: 6px 14px; font-size: 12px; margin-top: 0; white-space: nowrap;">Gửi AI ➔</button>
        </div>
      </div>
    </div>
  `;

  // Define helper inside window context for inline onclick
  window.sendPresetChat = (msg) => {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = msg;
      document.getElementById('ai-chat-send-btn').click();
    }
  };

  document.getElementById('ai-chat-send-btn').addEventListener('click', () => {
    const chatInput = document.getElementById('ai-chat-input');
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Append user message
    const msgContainer = document.getElementById('ai-chat-messages');
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'background-color: var(--primary); padding: 8px 12px; border-radius: var(--radius-md); align-self: flex-end; max-width: 85%; color: white;';
    userMsg.innerText = msg;
    msgContainer.appendChild(userMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    chatInput.value = '';

    const logs = [
      () => logToConsole(`[Customer UI] Khách gửi câu hỏi: "${msg}". Kích hoạt widget CustomerAiChat.jsx.`, 'system'),
      () => logToConsole(`[API Endpoint] POST '/api/ai/customer/chat'. CustomerAiChatController tiếp nhận, kích hoạt CustomerAiRateLimiter kiểm tra spam.`, 'api-call'),
      () => logToConsole(`[Service Layer] CustomerAiChatServiceImpl tập hợp context: Catalog phòng trống (RoomService) và lịch sử bookings của khách.`, 'api-response'),
      () => {
        logToConsole(`[AI Client] OpenChatBiCustomerClient tạo HTTP request, đính kèm X-Internal-Token bảo mật, gọi python sidecar tại port 8001.`, 'api-call');
        
        // Simulating the AI response bubble
        setTimeout(() => {
          const aiMsg = document.createElement('div');
          aiMsg.style.cssText = 'background-color: var(--bg-accent); padding: 8px 12px; border-radius: var(--radius-md); align-self: flex-start; max-width: 85%; color: var(--text-primary); margin-top: 4px; line-height: 1.4;';
          
          let responseText = 'Mô hình GLM-5.2 (FPT AI Factory) đang phản hồi...';
          if (msg.includes('Suite VIP')) {
            responseText = 'Phòng Suite VIP Căn Hộ hiện tại có mức giá trong tuần là 1.200.000đ/đêm. Phòng rộng rãi, đầy đủ minibar, view hồ tuyệt đẹp và tối đa 2 người lớn kèm 2 trẻ em.';
          } else if (msg.includes('check-in')) {
            responseText = 'Chính sách phụ thu check-in sớm: từ 06:00 - 09:00 phụ thu 50% tiền phòng, từ 09:00 - 12:00 phụ thu 30%. Quy tắc này được lưu trữ và tính toán tự động trong RulesPenalty.';
          } else {
            responseText = 'Cảm ơn câu hỏi của bạn. Hệ thống Lagom Homestay cung cấp đầy đủ thông tin phòng, tiện ích và đặt lịch trực tiếp. Bạn vui lòng chọn ngày đặt phòng để được tư vấn chính xác nhất nhé!';
          }
          
          aiMsg.innerText = responseText;
          msgContainer.appendChild(aiMsg);
          msgContainer.scrollTop = msgContainer.scrollHeight;
          logToConsole(`[Python Sidecar] app.py nhận request. Cấu trúc System Prompt, gọi API FPT AI Factory GLM-5.2 thành công.`, 'api-response');
        }, 1000);
      }
    ];

    triggerTraceRun('customer_ai_chat', 4, logs);
  });
}

// 9. AI MARKETING AGENT SIMULATOR
function renderAiMarketingSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>🤖 AI Agent Đăng Bài Marketing</h4>
        <p>Sinh nội dung quảng bá homestay bằng AI và tự động đăng lên mạng xã hội.</p>
      </div>

      <div class="sim-card">
        <div class="sim-form-group">
          <label>Kênh Đăng Bài</label>
          <select id="sim-mkt-platform" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white;">
            <option value="Facebook">Facebook Fanpage</option>
            <option value="YouTube">YouTube Channel</option>
          </select>
        </div>

        <div class="sim-form-group" style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label>Giọng điệu (Tone)</label>
            <select id="sim-mkt-tone" class="sim-input" style="background-color: var(--bg-primary); border-color: var(--border-color); color: white; width: 100%;">
              <option value="Thân thiện">Thân thiện, trẻ trung</option>
              <option value="Chuyên nghiệp">Chuyên nghiệp, sang trọng</option>
              <option value="Hài hước">Hài hước, Gen Z</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label>Chủ đề / Mô tả ngắn</label>
            <input type="text" id="sim-mkt-topic" class="sim-input" value="Khai trương phòng Suite VIP mới view hồ tuyệt đẹp" style="width: 100%;">
          </div>
        </div>

        <button class="sim-btn" id="sim-mkt-generate-btn" style="background-color: var(--primary); width: 100%;">🚀 TẠO NỘI DUNG AI & ĐĂNG BÀI</button>
      </div>

      <div id="sim-mkt-result-card" class="sim-card" style="display: none; margin-top: 12px; background-color: var(--bg-tertiary); border: 1px dashed var(--success); padding: 12px;">
        <span style="font-size: 10px; background-color: var(--success-glow); color: var(--success); padding: 2px 6px; border-radius: 4px; font-weight: bold;">ĐÃ XUẤT BẢN THÀNH CÔNG</span>
        <p id="sim-mkt-result-text" style="font-size: 11.5px; color: var(--text-primary); line-height: 1.5; margin-top: 6px; font-family: var(--font-mono); white-space: pre-wrap;"></p>
      </div>
    </div>
  `;

  document.getElementById('sim-mkt-generate-btn').addEventListener('click', () => {
    const platform = document.getElementById('sim-mkt-platform').value;
    const tone = document.getElementById('sim-mkt-tone').value;
    const topic = document.getElementById('sim-mkt-topic').value;

    const logs = [
      () => logToConsole(`[MKT UI] Chọn kênh: ${platform}, Tone: ${tone}. Bấm "Đăng bài". Gọi MarketingPages.jsx.`, 'system'),
      () => logToConsole(`[Controller] AdminMarketingController nhận request POST '/api/admin/marketing/posts/generate' với chủ đề: "${topic}"`, 'api-call'),
      () => logToConsole(`[Service Layer] AdminMarketingServiceImpl gọi bộ sinh văn bản AI với Tone: "${tone}".`, 'api-response'),
      () => logToConsole(`[AI Text Generator] MarketingAiTextGeneratorImpl gọi OpenAI/FPT API để sinh bài đăng quảng cáo tối ưu.`, 'api-response'),
      () => {
        logToConsole(`[Publisher Integration] MarketingSocialPublisherImpl gọi Facebook Graph API sử dụng Access Token để đăng bài viết lên Fanpage.`, 'api-call');
        
        // Show simulated MKT post result
        setTimeout(() => {
          const resultCard = document.getElementById('sim-mkt-result-card');
          const resultText = document.getElementById('sim-mkt-result-text');
          if (resultCard && resultText) {
            resultCard.style.display = 'block';
            let generatedContent = '';
            if (tone === 'Thân thiện') {
              generatedContent = `🌟 SIÊU PHẨM MỚI TOANH TẠI LAGOM HOMESTAY 🌟\n\nBạn đã sẵn sàng tận hưởng bình minh lãng mạn bên hồ nước xanh mát chưa? Homestay chính thức ra mắt phòng Suite VIP view hồ cực xịn sò! 😍\n\n📌 Tiện ích chuẩn 5 sao\n📌 Không gian yên tĩnh thư giãn\n\n👉 Inbox ngay để đặt chỗ trước nhé cả nhà!`;
            } else if (tone === 'Hài hước') {
              generatedContent = `📣 CHỐN DUNG THÂN LÝ TƯỞNG CHO TEAM MÊ CHILL 📣\n\nSuite VIP view hồ mới lên sóng, đẹp xỉu up xỉu down! 🌊 Cảnh đẹp thế này không đi thì phí cả thanh xuân. Phòng ngủ êm ái, tủ lạnh minibar ngập tràn nước ngọt.\n\nĐặt ngay kẻo lỡ chuyến đi trốn thế gian cuối tuần này nhé! 🏎️💨`;
            } else {
              generatedContent = `[Lagom Homestay - Trải nghiệm Nghỉ dưỡng Cao cấp]\n\nChúng tôi trân trọng giới thiệu căn hộ hạng sang Suite VIP với tầm nhìn bao quát toàn bộ hồ cảnh quan. Thiết kế hiện đại kết hợp tiện nghi cao cấp mang đến kỳ nghỉ dưỡng tuyệt hảo cho quý đối tác và gia đình.\n\nLiên hệ hotline để nhận báo giá chi tiết.`;
            }
            resultText.innerText = generatedContent;
            logToConsole(`[Mạng xã hội] Facebook xác nhận bài viết đã đăng trên Page (Post ID: 9817293812_fb).`, 'api-response');
          }
        }, 1000);
      }
    ];

    triggerTraceRun('ai_marketing', 5, logs);
  });
}

// 10. GUEST STAY PORTAL SIMULATOR
function renderStayPortalSimulator(container) {
  container.innerHTML = `
    <div class="sim-page">
      <div class="sim-page-header">
        <h4>🛎️ Cổng Tương Tác Khách Lưu Trú (Stay Portal)</h4>
        <p>Dành cho khách hàng tự phục vụ khi đang ở tại homestay.</p>
      </div>

      <div class="sim-card" style="background-color: var(--bg-secondary); margin-bottom: 12px; border: 1px solid var(--primary-glow);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: bold; color: #a5b4fc;">PHÒNG L202 (Suite VIP)</span>
          <span class="step-layer-badge" style="background-color: rgba(16, 185, 129, 0.15); color: var(--success);">ĐANG LƯU TRÚ</span>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary)">Thời gian ở: 2026-07-20 ➔ 2026-07-22</p>
      </div>

      <div class="sim-card">
        <label style="font-size: 11px; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Mua đồ uống tủ lạnh Minibar</label>
        <div class="sim-form-group" style="display: flex; gap: 8px; margin-top: 6px;">
          <select id="sim-stay-item" class="sim-input" style="flex: 2; background-color: var(--bg-primary); border-color: var(--border-color); color: white; margin-bottom: 0; font-size: 12px;">
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

