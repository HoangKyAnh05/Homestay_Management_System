// Lá Đỏ Homestay Social AI - Bridge Script between Web Portal and Extension

console.log('[Lá Đỏ Social AI] Web Portal Bridge Script Active.');

// Tell the React Frontend that the Extension is Installed and Active!
window.__LADO_EXTENSION_INSTALLED__ = true;
window.postMessage({ type: 'LADO_EXTENSION_READY', version: '1.2.0' }, '*');

// Auto-sync JWT Token from localStorage / sessionStorage to Extension Storage
function syncJwtToken() {
  try {
    const token = localStorage.getItem('homeStayAccessToken') ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('jwt') ||
                  sessionStorage.getItem('homeStayAccessToken') ||
                  sessionStorage.getItem('token');
    if (token) {
      chrome.runtime.sendMessage({
        action: 'STORE_JWT_TOKEN',
        token: token
      });
    }
  } catch (e) {
    console.debug('[Lá Đỏ Social Bridge] Storage check error:', e);
  }
}

syncJwtToken();
setInterval(syncJwtToken, 5000);

// Listen for messages from the React Web App
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.type === 'LADO_SET_PENDING_HIGHLIGHT') {
    if (event.data.payload && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pendingHighlight: event.data.payload }, () => {
        console.log('[Lá Đỏ Social Bridge] Đã lưu pendingHighlight vào Extension Storage:', event.data.payload);
      });
    }
  }

  if (event.data && event.data.type === 'LADO_TRIGGER_AUTO_SCAN') {
    const { platform, reset } = event.data;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        pendingAutoScan: {
          platform,
          reset: !!reset,
          timestamp: Date.now()
        }
      }, () => {
        console.log('[Lá Đỏ Social Bridge] Đã kích hoạt pendingAutoScan cho nền tảng:', platform);
      });
    }
  }

  if (event.data && event.data.type === 'LADO_POST_SOCIAL_REPLY_VIA_EXTENSION') {
    const { platform, videoId, parentCommentId, message } = event.data;

    chrome.runtime.sendMessage({
      action: 'FORWARD_REPLY_TO_SOCIAL_TAB',
      payload: { platform, videoId, parentCommentId, message }
    }, (response) => {
      window.postMessage({
        type: 'LADO_EXTENSION_REPLY_RESULT',
        result: response
      }, '*');
    });
  }
});
