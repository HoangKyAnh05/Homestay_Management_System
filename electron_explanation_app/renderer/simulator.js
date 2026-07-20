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
