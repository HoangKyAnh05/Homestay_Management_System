/**
 * Lá Đỏ Homestay - Form Auto Tester Content Script
 * Siêu tương thích React 17/18/19 Controlled Inputs, không can thiệp logic source code.
 */

(function () {
  // Tránh inject đè
  if (window.__LADO_TESTER_INJECTED__) return;
  window.__LADO_TESTER_INJECTED__ = true;

  // React-safe setter
  function setReactInputValue(input, value) {
    if (!input) return false;
    try {
      input.focus();

      // 1. Prototype setter
      const proto =
        input instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

      if (descriptor && descriptor.set) {
        descriptor.set.call(input, value);
      } else {
        input.value = value;
      }

      // 2. React _valueTracker reset
      if (input._valueTracker) {
        input._valueTracker.setValue(value);
      }

      // 3. Dispatch native DOM events
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

      // Highlight feedback
      input.classList.add('lado-input-filled-flash');
      setTimeout(() => {
        input.classList.remove('lado-input-filled-flash');
      }, 1200);

      return true;
    } catch (e) {
      console.warn('[Lá Đỏ Tester] Error setting input value:', e);
      try {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (err) {}
      return false;
    }
  }

  // Predefined Test Data Presets
  const TEST_DATA_PRESETS = {
    // 1. DEFAULT HAPPY PATH (Chuẩn 100% đúng validate)
    VALID_DEFAULT: {
      name: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'nguyenvanan.test@gmail.com',
      cccd: '001200012345',
      address: '031 Hoàng Liên, TT. Sa Pa, Lào Cai',
      occupants: [
        { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com' },
        { name: 'Trần Thị Bình', email: 'binh.tran@example.com' },
        { name: 'Lê Hoàng Cường', email: 'cuong.le@example.com' },
        { name: 'Phạm Minh Đức', email: 'duc.pham@example.com' }
      ]
    },

    // 2. VIP GUEST
    VALID_VIP: {
      name: 'Hoàng Kỳ Anh VIP',
      phone: '0988889999',
      email: 'kyanhhoang230205@gmail.com',
      cccd: '038202008888',
      address: 'Biệt Thự Vườn Mây, Fansipan Sa Pa',
      occupants: [
        { name: 'Hoàng Kỳ Anh VIP', email: 'kyanhhoang230205@gmail.com' },
        { name: 'Nguyễn Minh Thư', email: 'minhthu.lado@gmail.com' },
        { name: 'Đặng Tuấn Kiệt', email: 'tuankiet.sa_pa@gmail.com' }
      ]
    },

    // 3. INVALID PHONE CASES
    INVALID_PHONE_SHORT: {
      name: 'Trần Phone Ngắn',
      phone: '09123456', // 8 chữ số (thiếu số)
      email: 'phone.ngan@gmail.com',
      cccd: '001200012345',
      address: 'Hà Nội'
    },
    INVALID_PHONE_NO_ZERO: {
      name: 'Lê Phone Không Số 0',
      phone: '9876543210', // không bắt đầu bằng số 0
      email: 'phone.nozero@gmail.com',
      cccd: '001200012345',
      address: 'Đà Nẵng'
    },
    INVALID_PHONE_CHARS: {
      name: 'Phạm Phone Chữ',
      phone: '0912ABCD88', // chứa chữ
      email: 'phone.char@gmail.com',
      cccd: '001200012345',
      address: 'Hải Phòng'
    },

    // 4. INVALID EMAIL CASES
    INVALID_EMAIL_NO_AT: {
      name: 'Vũ Email Thiếu A Còng',
      phone: '0912345678',
      email: 'emailkhongcoacong.gmail.com', // Thiếu @
      cccd: '001200012345',
      address: 'Sa Pa'
    },
    INVALID_EMAIL_NO_DOMAIN: {
      name: 'Đỗ Email Thiếu Domain',
      phone: '0912345678',
      email: 'user@domain', // Thiếu .com/.vn
      cccd: '001200012345',
      address: 'Lào Cai'
    },

    // 5. INVALID CCCD CASES
    INVALID_CCCD_SHORT: {
      name: 'Bùi CCCD Thiếu Số',
      phone: '0912345678',
      email: 'cccd.thieuso@gmail.com',
      cccd: '001200012', // chỉ 9 số
      address: 'Sa Pa'
    },
    INVALID_CCCD_CHARS: {
      name: 'Ngô CCCD Có Chữ',
      phone: '0912345678',
      email: 'cccd.cochu@gmail.com',
      cccd: '00120001234A', // có chữ cái
      address: 'Hà Giang'
    },

    // 6. INVALID NAME CASES
    INVALID_NAME_SPECIAL_CHARS: {
      name: 'Nguyễn @#$$%^^ Văn An',
      phone: '0912345678',
      email: 'name.special@gmail.com',
      cccd: '001200012345',
      address: 'Sa Pa'
    },

    // 7. BOUNDARY TESTING (Giá trị biên)
    BOUNDARY_LONG_NAME: {
      name: 'Nguyễn Hoàng Phan Long Gia Cát Lượng Đình Triều Quốc Vương Thượng Đẳng Hoàng Kim Vạn Tuế',
      phone: '0901234567',
      email: 'super.very.long.email.boundary.testing.suite@example.organization.vn',
      cccd: '999999999999',
      address: 'Số 9999 Đường Hoàng Liên Kéo Dài Mở Rộng, Thung Lũng Mường Hoa, Thị Xã Sa Pa, Tỉnh Lào Cai, Việt Nam',
      occupants: [
        { name: 'Khách Phòng Một Siêu Dài Tên', email: 'khach1.boundary@example.com' },
        { name: 'Khách Phòng Hai Siêu Dài Tên', email: 'khach2.boundary@example.com' }
      ]
    },

    // 8. AUTH TEST CASES
    AUTH_LOGIN_VALID: {
      authEmail: 'customer@example.com',
      authPassword: 'Password123@'
    }
  };

  // Helper to check if element is visible
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  // Get field context from label/placeholder/name/id
  function getFieldContext(input) {
    let text = '';
    // Check closest label or label[for]
    const label = input.closest('label') || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
    if (label) text += ' ' + label.innerText;

    // Check placeholder
    if (input.placeholder) text += ' ' + input.placeholder;
    if (input.name) text += ' ' + input.name;
    if (input.id) text += ' ' + input.id;
    if (input.className) text += ' ' + input.className;

    return text.toLowerCase();
  }

  // Main Form Autofill Function
  window.__ladoExecuteFillPreset = function (presetKey, customOverrides = null) {
    const data = customOverrides || TEST_DATA_PRESETS[presetKey] || TEST_DATA_PRESETS.VALID_DEFAULT;
    let filledCount = 0;

    // Lấy tất cả input có thể nhập
    const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea'))
      .filter(el => !el.readOnly && !el.disabled);

    // Phân loại Occupant inputs và Main inputs
    const occupantInputs = allInputs.filter(el => 
      el.classList.contains('occupant-input') || 
      el.id.includes('guest-name') || 
      el.id.includes('guest-email') ||
      el.closest('.multi-room-unit-occupants') !== null ||
      el.closest('.multi-room-unit-guest-grid') !== null
    );

    const mainInputs = allInputs.filter(el => !occupantInputs.includes(el));

    // 1. Fill Main Inputs
    mainInputs.forEach(input => {
      const ctx = getFieldContext(input);

      // CCCD / Giấy tờ tùy thân
      if (ctx.includes('cccd') || ctx.includes('căn cước') || ctx.includes('12 chữ số') || ctx.includes('identitydocumentnumber') || ctx.includes('giấy tờ')) {
        if (data.cccd !== undefined && setReactInputValue(input, data.cccd)) filledCount++;
      }
      // Số điện thoại
      else if (ctx.includes('số điện thoại') || ctx.includes('sđt') || ctx.includes('phone') || ctx.includes('0912') || input.type === 'tel') {
        if (data.phone !== undefined && setReactInputValue(input, data.phone)) filledCount++;
      }
      // Email
      else if (ctx.includes('email') || input.type === 'email') {
        if (data.email !== undefined && setReactInputValue(input, data.email)) filledCount++;
      }
      // Họ tên người đặt
      else if (ctx.includes('họ tên') || ctx.includes('họ và tên') || ctx.includes('fullname') || ctx.includes('nguyễn văn an') || ctx.includes('tên khách')) {
        if (data.name !== undefined && setReactInputValue(input, data.name)) filledCount++;
      }
      // Địa chỉ
      else if (ctx.includes('địa chỉ') || ctx.includes('address') || ctx.includes('thường trú')) {
        if (data.address !== undefined && setReactInputValue(input, data.address)) filledCount++;
      }
    });

    // 2. Fill Occupant Inputs (Multi-room đại diện phòng)
    const occupantsList = data.occupants || TEST_DATA_PRESETS.VALID_DEFAULT.occupants;
    let nameIdx = 0;
    let emailIdx = 0;

    occupantInputs.forEach(input => {
      const ctx = getFieldContext(input);
      if (ctx.includes('email') || input.type === 'email') {
        const occData = occupantsList[emailIdx] || occupantsList[0];
        if (occData && occData.email && setReactInputValue(input, occData.email)) {
          filledCount++;
          emailIdx++;
        }
      } else {
        const occData = occupantsList[nameIdx] || occupantsList[0];
        if (occData && occData.name && setReactInputValue(input, occData.name)) {
          filledCount++;
          nameIdx++;
        }
      }
    });

    // 3. Fallback: Check for Login / Register inputs
    if (data.authEmail || data.authPassword) {
      allInputs.forEach(input => {
        if (data.authEmail && (input.type === 'email' || input.name === 'email' || input.name === 'username')) {
          if (setReactInputValue(input, data.authEmail)) filledCount++;
        }
        if (data.authPassword && (input.type === 'password' || input.name === 'password')) {
          if (setReactInputValue(input, data.authPassword)) filledCount++;
        }
      });
    }

    showToastNotification(`⚡ Đã điền xong [${presetKey}] (${filledCount} trường)!`);
    return filledCount;
  };

  // Clear all open form inputs
  window.__ladoClearOpenForms = function () {
    let clearedCount = 0;
    const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea');
    allInputs.forEach((input) => {
      if (!input.readOnly && !input.disabled) {
        setReactInputValue(input, '');
        clearedCount++;
      }
    });
    showToastNotification(`🧹 Đã xóa sạch ${clearedCount} ô nhập trên màn hình!`);
    return clearedCount;
  };

  // Visual Toast Message
  function showToastNotification(msg) {
    let toast = document.getElementById('lado-tester-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lado-tester-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'lado-tester-toast-show';
    setTimeout(() => {
      toast.className = 'lado-tester-toast-hide';
    }, 2800);
  }

  // In-Page Floating Quick Tester Widget
  function injectFloatingTesterWidget() {
    if (document.getElementById('lado-floating-tester-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'lado-floating-tester-widget';
    widget.innerHTML = `
      <div class="lado-widget-bar" id="lado-widget-bar">
        <div class="lado-widget-badge">
          <span class="lado-widget-icon">🍁</span>
          <span class="lado-widget-title">Lá Đỏ Tester</span>
        </div>
        
        <button type="button" class="lado-btn lado-btn-primary" id="lado-btn-autofill" title="Điền nhanh dữ liệu chuẩn 100% đúng validate">
          ⚡ Điền Hợp Lệ
        </button>

        <div class="lado-dropdown-container">
          <button type="button" class="lado-btn lado-btn-secondary" id="lado-btn-cases-toggle" title="Chọn các Test Case lỗi validation / Giá trị biên">
            📋 Test Cases ▾
          </button>
          <div class="lado-dropdown-menu" id="lado-cases-menu">
            <div class="lado-menu-header">Chọn Test Case:</div>
            <button type="button" data-case="VALID_DEFAULT">🟢 1. Chuẩn 100% (Happy Path)</button>
            <button type="button" data-case="VALID_VIP">👑 2. Khách VIP Sa Pa</button>
            <div class="lado-menu-divider"></div>
            <div class="lado-menu-header">Lỗi Validate SĐT:</div>
            <button type="button" data-case="INVALID_PHONE_SHORT">🔴 SĐT ngắn (8 số)</button>
            <button type="button" data-case="INVALID_PHONE_NO_ZERO">🔴 SĐT không bắt đầu 0</button>
            <button type="button" data-case="INVALID_PHONE_CHARS">🔴 SĐT chứa chữ cái</button>
            <div class="lado-menu-divider"></div>
            <div class="lado-menu-header">Lỗi Validate Email & CCCD:</div>
            <button type="button" data-case="INVALID_EMAIL_NO_AT">🔴 Email thiếu @</button>
            <button type="button" data-case="INVALID_EMAIL_NO_DOMAIN">🔴 Email thiếu domain</button>
            <button type="button" data-case="INVALID_CCCD_SHORT">🔴 CCCD thiếu (9 số)</button>
            <button type="button" data-case="INVALID_CCCD_CHARS">🔴 CCCD có chữ cái</button>
            <div class="lado-menu-divider"></div>
            <div class="lado-menu-header">Giá trị biên:</div>
            <button type="button" data-case="BOUNDARY_LONG_NAME">🟡 Tên & Email siêu dài</button>
          </div>
        </div>

        <button type="button" class="lado-btn lado-btn-danger" id="lado-btn-clear" title="Xóa sạch dữ liệu form">
          🧹 Xóa
        </button>

        <button type="button" class="lado-widget-minimize" id="lado-widget-min" title="Thu nhỏ">
          ─
        </button>
      </div>

      <div class="lado-widget-minimized" id="lado-widget-mini-btn" title="Mở Lá Đỏ Form Tester" style="display: none;">
        🍁 <span>Test Form</span>
      </div>
    `;

    document.body.appendChild(widget);

    // Event handlers for floating bar
    const autoFillBtn = document.getElementById('lado-btn-autofill');
    const casesToggleBtn = document.getElementById('lado-btn-cases-toggle');
    const casesMenu = document.getElementById('lado-cases-menu');
    const clearBtn = document.getElementById('lado-btn-clear');
    const minBtn = document.getElementById('lado-widget-min');
    const miniBtn = document.getElementById('lado-widget-mini-btn');
    const bar = document.getElementById('lado-widget-bar');

    autoFillBtn?.addEventListener('click', () => {
      window.__ladoExecuteFillPreset('VALID_DEFAULT');
    });

    casesToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      casesMenu.classList.toggle('lado-show');
    });

    document.addEventListener('click', (e) => {
      if (!widget.contains(e.target)) {
        casesMenu?.classList.remove('lado-show');
      }
    });

    casesMenu?.querySelectorAll('button[data-case]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const caseKey = btn.getAttribute('data-case');
        window.__ladoExecuteFillPreset(caseKey);
        casesMenu.classList.remove('lado-show');
      });
    });

    clearBtn?.addEventListener('click', () => {
      window.__ladoClearOpenForms();
    });

    minBtn?.addEventListener('click', () => {
      bar.style.display = 'none';
      miniBtn.style.display = 'flex';
    });

    miniBtn?.addEventListener('click', () => {
      miniBtn.style.display = 'none';
      bar.style.display = 'flex';
    });
  }

  // Listen for messages from popup.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'AUTOFILL_PRESET') {
      const count = window.__ladoExecuteFillPreset(request.presetKey, request.customData);
      sendResponse({ success: true, filledCount: count });
    } else if (request.action === 'CLEAR_FORMS') {
      const count = window.__ladoClearOpenForms();
      sendResponse({ success: true, clearedCount: count });
    } else if (request.action === 'PING') {
      sendResponse({ success: true, url: window.location.href });
    }
    return true;
  });

  // Inject widget on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingTesterWidget);
  } else {
    injectFloatingTesterWidget();
  }
})();
