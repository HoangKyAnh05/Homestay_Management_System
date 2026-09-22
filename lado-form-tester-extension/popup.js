// Popup controller for Lá Đỏ Form Auto Tester

document.addEventListener('DOMContentLoaded', () => {
  const statusPill = document.getElementById('page-status');

  function showStatus(text, isSuccess = true) {
    if (!statusPill) return;
    statusPill.textContent = text;
    statusPill.style.background = isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    statusPill.style.color = isSuccess ? '#34d399' : '#f87171';
    statusPill.style.borderColor = isSuccess ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)';
    
    setTimeout(() => {
      statusPill.textContent = '🟢 Sẵn sàng';
      statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
      statusPill.style.color = '#34d399';
      statusPill.style.borderColor = 'rgba(52, 211, 153, 0.3)';
    }, 2500);
  }

  // Tabs switching
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Execute autofill on active tab
  async function triggerAutofill(presetKey, customData = null) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showStatus('❌ Không thấy tab', false);
        return;
      }

      // Try sending message first
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'AUTOFILL_PRESET', presetKey, customData },
        async (response) => {
          if (chrome.runtime.lastError || !response) {
            // Content script not loaded yet in this tab -> dynamically inject content.js & execute!
            try {
              await chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ['content.css']
              }).catch(() => {});

              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
              });

              // Execute directly
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (k, d) => {
                  if (typeof window.__ladoExecuteFillPreset === 'function') {
                    return window.__ladoExecuteFillPreset(k, d);
                  }
                  return 0;
                },
                args: [presetKey, customData]
              }, (results) => {
                const count = results?.[0]?.result || 0;
                showStatus(`⚡ Đã điền ${count} ô!`, true);
              });
            } catch (injectErr) {
              console.error('[Lá Đỏ Tester] Injection error:', injectErr);
              showStatus('❌ Lỗi quyền trang', false);
            }
          } else {
            showStatus(`⚡ Đã điền ${response.filledCount || 0} ô!`, true);
          }
        }
      );
    } catch (err) {
      console.error('[Lá Đỏ Tester] Error:', err);
      showStatus('❌ Lỗi thực thi', false);
    }
  }

  // Clear all forms
  async function triggerClear() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      chrome.tabs.sendMessage(tab.id, { action: 'CLEAR_FORMS' }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                if (typeof window.__ladoClearOpenForms === 'function') {
                  return window.__ladoClearOpenForms();
                }
                return 0;
              }
            });
            showStatus('🧹 Đã xóa!', true);
          } catch (e) {}
        } else {
          showStatus('🧹 Đã xóa!', true);
        }
      });
    } catch (e) {}
  }

  // 1. Quick Fill Default (Mặc định chuẩn 100% đúng validate)
  document.getElementById('btn-quick-fill-default')?.addEventListener('click', () => {
    triggerAutofill('VALID_DEFAULT');
  });

  // 2. Preset Cards (Khách VIP, Boundary, etc.)
  document.querySelectorAll('.case-card[data-preset]').forEach((card) => {
    card.addEventListener('click', () => {
      const presetKey = card.getAttribute('data-preset');
      triggerAutofill(presetKey);
    });
  });

  // 3. Validation Chips (Lỗi SĐT, Email, CCCD, Name)
  document.querySelectorAll('.btn-case-chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const presetKey = chip.getAttribute('data-preset');
      triggerAutofill(presetKey);
    });
  });

  // 4. Custom Override
  document.getElementById('btn-apply-custom')?.addEventListener('click', () => {
    const customData = {
      name: document.getElementById('custom-name')?.value || 'Nguyễn Văn An',
      phone: document.getElementById('custom-phone')?.value || '0912345678',
      email: document.getElementById('custom-email')?.value || 'an.nguyen@example.com',
      cccd: document.getElementById('custom-cccd')?.value || '001200012345',
      address: '031 Hoàng Liên, Sa Pa'
    };
    triggerAutofill('CUSTOM_OVERRIDE', customData);
  });

  // 5. Clear All
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    triggerClear();
  });
});
