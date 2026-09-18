// Lá Đỏ Homestay Social AI - Popup Controller

const DEFAULT_GROQ_KEY = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements - Header
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  // Elements - Comments View
  const btnScanTop = document.getElementById('btnScanTop');
  const btnScanEmpty = document.getElementById('btnScanEmpty');
  const btnGenerateAllAi = document.getElementById('btnGenerateAllAi');
  const btnClearComments = document.getElementById('btnClearComments');
  const commentsListContainer = document.getElementById('commentsListContainer');
  const commentsEmptyState = document.getElementById('commentsEmptyState');

  // Elements - Date Range Filter
  const filterStartDate = document.getElementById('filterStartDate');
  const filterEndDate = document.getElementById('filterEndDate');
  const btnApplyDateFilter = document.getElementById('btnApplyDateFilter');
  const btnResetDateFilter = document.getElementById('btnResetDateFilter');
  const filterCountBadge = document.getElementById('filterCountBadge');
  const dateChips = document.querySelectorAll('.date-chip');

  let currentComments = [];
  let activeDateRange = 'all'; // 'all', 'today', '7days', '30days', 'custom'
  let customStartDate = null;
  let customEndDate = null;

  // 1. Load Initial State from Chrome Storage
  const config = await chrome.storage.local.get([
    'serverUrl',
    'groqApiKey',
    'aiTone',
    'scannedCount',
    'repliedCountToday',
    'scannedCommentsList'
  ]);

  const defaultServer = config.serverUrl || 'http://localhost:8080';

  // Helper to filter out own/host comments and invalid system texts
  function isOwnComment(c) {
    if (!c) return false;
    const name = (c.authorName || '').trim().toLowerCase();
    const msg = (c.message || '').trim().toLowerCase();

    // Reject empty messages or messages that are purely button labels
    if (!msg || msg.length === 0) return true;
    if (msg === 'trả lời' || msg === 'phản hồi' || msg === 'thích' || msg === '✨ ai lá đỏ' || msg === 'ai lá đỏ') return true;

    const brandKeywords = ['lá đỏ homestay', 'lá đỏ coffee', 'lá đỏ sapa', 'lado homestay', 'ladocoffeesapa', 'lado coffee', 'quản trị viên'];
    if (brandKeywords.some(kw => name === kw || name.includes(kw)) || name === 'lá đỏ' || name === 'la do') return true;

    const strippedName = name.replace(/[\p{Emoji}\p{Symbol}\p{Punctuation}\s]/gu, '');
    if (strippedName.length === 0) return true;

    const selfMsgSignatures = ['chào mừng bạn đến với lá đỏ', 'lá đỏ homestay xin chào', 'lá đỏ cảm ơn', 'inbox lá đỏ'];
    if (selfMsgSignatures.some(sig => msg.startsWith(sig))) return true;

    return false;
  }

  // Date Filtering Engine
  function getFilteredComments() {
    if (!currentComments || currentComments.length === 0) return [];

    if (activeDateRange === 'all' && !customStartDate && !customEndDate) {
      return currentComments;
    }

    const now = new Date();
    let startMs = 0;
    let endMs = Infinity;

    if (activeDateRange === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      startMs = startOfToday.getTime();
      endMs = Date.now() + 60000;
    } else if (activeDateRange === '7days') {
      startMs = Date.now() - 7 * 24 * 3600 * 1000;
      endMs = Date.now() + 60000;
    } else if (activeDateRange === '30days') {
      startMs = Date.now() - 30 * 24 * 3600 * 1000;
      endMs = Date.now() + 60000;
    } else {
      if (customStartDate) {
        const s = new Date(customStartDate + 'T00:00:00');
        if (!isNaN(s.getTime())) startMs = s.getTime();
      }
      if (customEndDate) {
        const e = new Date(customEndDate + 'T23:59:59');
        if (!isNaN(e.getTime())) endMs = e.getTime();
      }
    }

    return currentComments.filter(c => {
      const t = c.timestampMs || Date.now();
      return t >= startMs && t <= endMs;
    });
  }

  function updateAndRenderFilteredComments() {
    const filtered = getFilteredComments();
    if (activeDateRange === 'all' && !customStartDate && !customEndDate) {
      if (filterCountBadge) filterCountBadge.textContent = '';
    } else {
      if (filterCountBadge) filterCountBadge.textContent = `Hiển thị ${filtered.length}/${currentComments.length}`;
    }
    renderCommentsList(filtered);
  }

  // Wire Date Filter Event Listeners
  if (btnApplyDateFilter) {
    btnApplyDateFilter.addEventListener('click', () => {
      const s = filterStartDate ? filterStartDate.value : '';
      const e = filterEndDate ? filterEndDate.value : '';
      if (!s && !e) {
        activeDateRange = 'all';
        customStartDate = null;
        customEndDate = null;
      } else {
        activeDateRange = 'custom';
        customStartDate = s;
        customEndDate = e;
      }
      dateChips.forEach(chip => chip.classList.remove('active'));
      updateAndRenderFilteredComments();
    });
  }

  if (btnResetDateFilter) {
    btnResetDateFilter.addEventListener('click', () => {
      activeDateRange = 'all';
      customStartDate = null;
      customEndDate = null;
      if (filterStartDate) filterStartDate.value = '';
      if (filterEndDate) filterEndDate.value = '';
      dateChips.forEach(chip => {
        if (chip.getAttribute('data-range') === 'all') chip.classList.add('active');
        else chip.classList.remove('active');
      });
      updateAndRenderFilteredComments();
    });
  }

  dateChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const range = chip.getAttribute('data-range');
      activeDateRange = range;
      customStartDate = null;
      customEndDate = null;

      dateChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const now = new Date();
      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (range === 'today') {
        if (filterStartDate) filterStartDate.value = formatDate(now);
        if (filterEndDate) filterEndDate.value = formatDate(now);
      } else if (range === '7days') {
        const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        if (filterStartDate) filterStartDate.value = formatDate(past);
        if (filterEndDate) filterEndDate.value = formatDate(now);
      } else if (range === '30days') {
        const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        if (filterStartDate) filterStartDate.value = formatDate(past);
        if (filterEndDate) filterEndDate.value = formatDate(now);
      } else {
        if (filterStartDate) filterStartDate.value = '';
        if (filterEndDate) filterEndDate.value = '';
      }

      updateAndRenderFilteredComments();
    });
  });

  // Load saved comments list (excluding own comments)
  currentComments = (config.scannedCommentsList || []).filter(c => !isOwnComment(c));
  chrome.storage.local.set({ scannedCommentsList: currentComments, scannedCount: currentComments.length });
  updateAndRenderFilteredComments();

  // Check connection status
  checkServerConnection(defaultServer);

  // 3. Scan Active Tab
  if (btnScanTop) btnScanTop.addEventListener('click', handleScanActiveTab);
  if (btnScanEmpty) btnScanEmpty.addEventListener('click', handleScanActiveTab);

  async function handleScanActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) {
      alert('Vui lòng mở một tab trình duyệt hợp lệ!');
      return;
    }

    const isYoutube = tab.url.includes('youtube.com');
    const isFacebook = tab.url.includes('facebook.com');

    if (!isYoutube && !isFacebook) {
      alert('Vui lòng mở một tab YouTube Video hoặc Facebook Fanpage/Bài viết trước khi bấm quét!');
      return;
    }

    const scriptFile = isYoutube ? 'content-youtube.js' : 'content-facebook.js';

    if (btnScanTop) btnScanTop.innerHTML = `<span>⏳ Đang cuộn & quét...</span>`;
    if (btnScanEmpty) btnScanEmpty.innerHTML = `<span>⏳ Đang cuộn & quét...</span>`;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [scriptFile]
      });
    } catch (e) {
      console.debug('Script inject note:', e);
    }

    chrome.tabs.sendMessage(tab.id, { action: 'SCAN_COMMENTS' }, (response) => {
      if (btnScanTop) btnScanTop.innerHTML = `<span>🔍 Quét toàn bộ trang</span>`;
      if (btnScanEmpty) btnScanEmpty.innerHTML = `<span>🔍 Quét toàn bộ trang ngay</span>`;

      if (chrome.runtime.lastError) {
        alert('Không thể kết nối với tab này. Vui lòng F5 làm mới tab YouTube/Facebook rồi bấm quét lại!');
        return;
      }

      if (response && response.comments !== undefined) {
        const freshComments = (response.comments || []).filter(c => !isOwnComment(c));

        // For the active post/page, replace existing comments with the fresh unreplied comments
        const currentPostUrl = (tab.url || '').split('?')[0];
        const otherPageComments = currentComments.filter(c => {
          const cUrl = (c.postUrl || '').split('?')[0];
          return cUrl && cUrl !== currentPostUrl && !cUrl.includes(currentPostUrl) && !currentPostUrl.includes(cUrl);
        });

        // Retain generated aiReply drafts if author and message match
        const existingRepliesMap = new Map();
        currentComments.forEach(c => {
          if (c.aiReply) {
            const sig = `${(c.authorName || '').trim()}:::${(c.message || '').trim()}`;
            existingRepliesMap.set(sig, c.aiReply);
          }
        });

        freshComments.forEach(c => {
          const sig = `${(c.authorName || '').trim()}:::${(c.message || '').trim()}`;
          if (!c.aiReply && existingRepliesMap.has(sig)) {
            c.aiReply = existingRepliesMap.get(sig);
          }
        });

        const dedupMap = new Map();
        [...freshComments, ...otherPageComments].forEach(c => {
          const key = `${(c.authorName || '').trim().toLowerCase()}:::${(c.message || '').trim().toLowerCase()}`;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, c);
          }
        });
        currentComments = Array.from(dedupMap.values());

        chrome.storage.local.set({
          scannedCommentsList: currentComments,
          scannedCount: currentComments.length
        });
        updateAndRenderFilteredComments();

        if (freshComments.length === 0) {
          setTimeout(() => {
            alert('Không tìm thấy bình luận chưa trả lời nào trên bài viết/trang này.');
          }, 100);
        }
      }
    });
  }

  // 4. Render Comments List
  function renderCommentsList(comments) {
    if (!commentsListContainer) return;
    commentsListContainer.innerHTML = '';
    const total = comments ? comments.length : 0;

    if (total === 0) {
      if (commentsEmptyState) commentsEmptyState.classList.add('show');
      commentsListContainer.style.display = 'none';
      return;
    }

    if (commentsEmptyState) commentsEmptyState.classList.remove('show');
    commentsListContainer.style.display = 'flex';

    comments.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `comment-card ${item.replied ? 'replied' : ''}`;
      card.id = `comment-card-${idx}`;

      const platformClass = item.platform === 'YOUTUBE' ? 'yt' : 'fb';
      const platformText = item.platform === 'YOUTUBE' ? '🔴 YouTube' : '🔵 Facebook';
      const avatarSrc = item.authorAvatar || 'icons/icon48.png';

      card.innerHTML = `
        <div class="comment-header">
          <div class="author-info">
            <img class="author-avatar" src="${escapeHtml(avatarSrc)}" alt="avatar" onerror="this.src='icons/icon48.png'">
            <div>
              <span class="author-name">${escapeHtml(item.authorName || 'Khách')}</span>
              <span class="platform-tag ${platformClass}">${platformText}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn-link-post" id="btn-view-post-${idx}" title="Mở / xem vị trí bình luận này trên bài viết">
              <span>🔗 Xem bài viết</span>
            </button>
            <span class="comment-time">${escapeHtml(item.publishedAt || 'Gần đây')}</span>
          </div>
        </div>

        <div class="comment-body-box">
          💬 <strong>Khách:</strong> "${escapeHtml(item.message || '')}"
        </div>

        <div class="ai-reply-container">
          <div class="ai-controls-row">
            <select class="tone-select-mini" id="tone-select-${idx}">
              <option value="WARM" ${item.tone === 'WARM' ? 'selected' : ''}>🌿 Thân thiện</option>
              <option value="BOOKING_INQUIRY" ${item.tone === 'BOOKING_INQUIRY' ? 'selected' : ''}>📅 Báo giá phòng</option>
              <option value="GRATITUDE" ${item.tone === 'GRATITUDE' ? 'selected' : ''}>❤️ Cảm ơn</option>
              <option value="PROMO" ${item.tone === 'PROMO' ? 'selected' : ''}>🎁 Ưu đãi 10%</option>
            </select>
            <button class="btn-ai-gen" id="btn-ai-gen-${idx}">
              <span>✨ Gợi ý AI</span>
            </button>
          </div>

          <textarea class="reply-textarea" id="reply-text-${idx}" placeholder="Bấm '✨ Gợi ý AI' hoặc nhập câu trả lời của bạn tại đây...">${escapeHtml(item.aiReply || '')}</textarea>

          <div class="card-actions-row">
            ${item.replied ? `<button class="btn-view-replied" id="btn-check-reply-${idx}" title="Đến đúng bình luận để kiểm tra câu trả lời"><span>👀 Kiểm tra</span></button>` : ''}
            <button class="btn-copy-reply" id="btn-copy-${idx}" title="Sao chép câu trả lời">
              <span>📋 Copy câu trả lời</span>
            </button>
          </div>
        </div>
      `;

      commentsListContainer.appendChild(card);

      // Precise navigation and highlight function
      async function navigateToCommentPost(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        const btnView = card.querySelector(`#btn-view-post-${idx}`);
        const btnCheck = card.querySelector(`#btn-check-reply-${idx}`);
        if (btnView) btnView.innerHTML = `<span>⏳ Đang mở...</span>`;
        if (btnCheck) btnCheck.innerHTML = `<span>⏳ Đang mở...</span>`;

        setTimeout(() => {
          if (btnView) btnView.innerHTML = `<span>🔗 Xem bài viết</span>`;
          if (btnCheck) btnCheck.innerHTML = `<span>👀 Kiểm tra</span>`;
        }, 1500);

        const allTabs = await chrome.tabs.query({});
        const activeTabOnDomain = allTabs.find(t => t.active && t.url && (t.url.includes('facebook.com') || t.url.includes('youtube.com') || t.url.includes('tiktok.com')));

        let targetUrl = (item.postUrl || '').trim();
        if (!targetUrl || !targetUrl.startsWith('http') || targetUrl === 'https://www.facebook.com' || targetUrl === 'https://www.facebook.com/') {
          targetUrl = activeTabOnDomain?.url || (item.platform === 'TIKTOK' ? 'https://www.tiktok.com/tiktokstudio/comment' : item.platform === 'YOUTUBE' ? 'https://studio.youtube.com' : 'https://www.facebook.com');
        }

        // 1. Send immediate highlight if the active tab is already open on Facebook/YouTube/TikTok
        if (activeTabOnDomain && activeTabOnDomain.id) {
          chrome.tabs.sendMessage(activeTabOnDomain.id, {
            action: 'HIGHLIGHT_COMMENT',
            commentText: item.message,
            authorName: item.authorName,
            postUrl: targetUrl
          });
        }

        // 2. Save pending highlight into chrome.storage.local so target tab automatically finds and highlights comment
        await chrome.storage.local.set({
          pendingHighlight: {
            commentText: item.message,
            authorName: item.authorName,
            platform: item.platform,
            postUrl: targetUrl,
            timestamp: Date.now()
          }
        });

        // 3. If targetUrl is different from active tab, open dedicated post URL in a new tab
        const isSameUrl = activeTabOnDomain && activeTabOnDomain.url && (activeTabOnDomain.url === targetUrl || activeTabOnDomain.url.split('?')[0] === targetUrl.split('?')[0]);
        if (!isSameUrl) {
          let finalTargetUrl = targetUrl;
          try {
            const sep = finalTargetUrl.includes('?') ? '&' : '?';
            const paramPart = `lado_author=${encodeURIComponent(item.authorName || '')}&lado_comment=${encodeURIComponent(item.message || '')}`;
            if (finalTargetUrl.includes('#')) {
              finalTargetUrl = `${finalTargetUrl}&${paramPart}`;
            } else {
              finalTargetUrl = `${finalTargetUrl}${sep}${paramPart}#${paramPart}`;
            }
          } catch (e) {}
          chrome.tabs.create({ url: finalTargetUrl, active: true });
        }
      }

      // Event: Click "🔗 Xem bài viết"
      const btnViewPost = card.querySelector(`#btn-view-post-${idx}`);
      if (btnViewPost) {
        btnViewPost.addEventListener('click', navigateToCommentPost);
      }

      // Event: Click "👀 Kiểm tra"
      const btnCheckReply = card.querySelector(`#btn-check-reply-${idx}`);
      if (btnCheckReply) {
        btnCheckReply.addEventListener('click', navigateToCommentPost);
      }

      // Event: Generate AI for this comment
      const btnAiGen = card.querySelector(`#btn-ai-gen-${idx}`);
      const replyTextarea = card.querySelector(`#reply-text-${idx}`);
      const toneSelect = card.querySelector(`#tone-select-${idx}`);

      if (btnAiGen) {
        btnAiGen.addEventListener('click', async () => {
          btnAiGen.innerHTML = `<span>⏳ Đang sinh...</span>`;
          const selectedTone = toneSelect ? toneSelect.value : 'WARM';

          chrome.runtime.sendMessage({
            action: 'GENERATE_AI_REPLY',
            payload: {
              postTitle: 'Lá Đỏ Homestay Sa Pa',
              postContent: 'Homestay Lá Đỏ Sa Pa view thung lũng Mường Hoa & săn mây',
              commentText: item.message,
              authorName: item.authorName,
              tone: selectedTone
            }
          }, (res) => {
            btnAiGen.innerHTML = `<span>✨ Gợi ý AI</span>`;
            if (res && res.reply) {
              if (replyTextarea) replyTextarea.value = res.reply;
              item.aiReply = res.reply;
              item.tone = selectedTone;
              saveCurrentComments();
            }
          });
        });
      }

      // Event: Copy reply
      const btnCopy = card.querySelector(`#btn-copy-${idx}`);
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const text = replyTextarea ? replyTextarea.value.trim() : '';
          if (!text) return;
          navigator.clipboard.writeText(text);
          btnCopy.textContent = '✓ Đã chép!';
          item.replied = true;
          saveCurrentComments();
          chrome.runtime.sendMessage({ action: 'RECORD_REPLY_SUCCESS' });
          setTimeout(() => {
            btnCopy.textContent = '📋 Copy câu trả lời';
            renderCommentsList(currentComments);
          }, 1200);
        });
      }

      // Update textarea change
      if (replyTextarea) {
        replyTextarea.addEventListener('input', () => {
          item.aiReply = replyTextarea.value;
          saveCurrentComments();
        });
      }
    });
  }

  // 5. Batch Generate AI for all comments
  if (btnGenerateAllAi) {
    btnGenerateAllAi.addEventListener('click', async () => {
      if (!currentComments || currentComments.length === 0) return;

      btnGenerateAllAi.innerHTML = `<span>⏳ Đang sinh tất cả...</span>`;

      for (let i = 0; i < currentComments.length; i++) {
        const item = currentComments[i];
        if (!item.aiReply || item.aiReply.trim().length === 0) {
          try {
            const res = await new Promise(resolve => {
              chrome.runtime.sendMessage({
                action: 'GENERATE_AI_REPLY',
                payload: {
                  postTitle: 'Lá Đỏ Homestay Sa Pa',
                  postContent: 'Homestay Lá Đỏ Sa Pa view thung lũng Mường Hoa',
                  commentText: item.message,
                  tone: item.tone || 'WARM'
                }
              }, resolve);
            });
            if (res && res.reply) {
              item.aiReply = res.reply;
              const txt = document.getElementById(`reply-text-${i}`);
              if (txt) txt.value = res.reply;
            }
          } catch (e) {
            console.debug('Batch AI error for item', i, e);
          }
        }
      }

      saveCurrentComments();
      btnGenerateAllAi.innerHTML = `<span>✨ Tạo AI tất cả</span>`;
    });
  }

  // 6. Clear Comments List
  if (btnClearComments) {
    btnClearComments.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa danh sách bình luận đã quét?')) {
        currentComments = [];
        chrome.storage.local.set({ scannedCommentsList: [], scannedCount: 0 });
        renderCommentsList([]);
      }
    });
  }

  function saveCurrentComments() {
    chrome.storage.local.set({ scannedCommentsList: currentComments });
  }

  async function checkServerConnection(url) {
    try {
      const resp = await fetch(`${url}/api/admin/marketing/comments/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postTitle: 'Kiểm tra kết nối',
          postContent: 'Lá Đỏ Homestay',
          commentText: 'hello',
          tone: 'WARM'
        })
      });
      if (resp.ok) {
        if (statusIndicator) statusIndicator.className = 'status-indicator online';
        if (statusText) statusText.textContent = 'Đã kết nối';
      } else {
        if (statusIndicator) statusIndicator.className = 'status-indicator online';
        if (statusText) statusText.textContent = 'Sẵn sàng (AI)';
      }
    } catch (e) {
      if (statusIndicator) statusIndicator.className = 'status-indicator online';
      if (statusText) statusText.textContent = 'DeepSeek / Groq';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
