(() => {
  if (window.__LADO_YT_SCRIPT_INITIALIZED__) {
    console.log('[Lá Đỏ YouTube AI] Script already active in this tab.');
  }
  window.__LADO_YT_SCRIPT_INITIALIZED__ = true;

  // Cache auto-scan and highlight parameters immediately before SPA router rewrites the URL
  try {
    const fullHref = window.location.href;
    if (fullHref.includes('lado_auto_scan=true') || window.location.hash.includes('lado_auto_scan=true')) {
      sessionStorage.setItem('lado_auto_scan_yt', 'true');
    }
    if (fullHref.includes('reset=true') || window.location.hash.includes('reset=true')) {
      sessionStorage.setItem('lado_reset_yt', 'true');
    }
    const matchAuthor = fullHref.match(/[?&#]lado_author=([^&#]+)/i);
    const matchComment = fullHref.match(/[?&#]lado_comment=([^&#]+)/i);
    if (matchAuthor && matchAuthor[1]) {
      sessionStorage.setItem('lado_pending_author_yt', decodeURIComponent(matchAuthor[1]));
    }
    if (matchComment && matchComment[1]) {
      sessionStorage.setItem('lado_pending_comment_yt', decodeURIComponent(matchComment[1]));
    }
  } catch (e) {}

  console.log('[Lá Đỏ YouTube AI] Content Script Active - Ready for Scanning, AI Replies & Auto-Submit.');

  const LADO_HIDE_CLUTTER_CSS = `
    ytcp-canned-responses,
    ytcp-canned-response-chip-bar,
    ytcp-canned-response-chip,
    ytcp-comment-reply-suggestions,
    ytcp-suggested-replies,
    ytcp-chip-bar,
    ytcp-chip,
    #canned-responses,
    #reply-suggestions,
    #canned-response-container,
    #smart-replies,
    #suggestions,
    yt-chip-cloud-chip-renderer,
    ytcp-chip-cloud-chip-renderer,
    ytcp-comment-suggestions-renderer,
    ytcp-chip-cloud-renderer,
    [id*="canned-response"],
    [class*="canned-response"],
    [id*="reply-suggestions"],
    .lado-stray-box,
    .lado-outline-box {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }
  `;

  // Inject hide style directly to document head
  function injectClutterStyles(root = document) {
    if (!root) return;
    if (root.querySelector && !root.querySelector('style#lado-hide-clutter-style')) {
      try {
        const styleEl = document.createElement('style');
        styleEl.id = 'lado-hide-clutter-style';
        styleEl.textContent = LADO_HIDE_CLUTTER_CSS;
        if (root.head) {
          root.head.appendChild(styleEl);
        } else if (root.appendChild) {
          root.appendChild(styleEl);
        }
      } catch (e) {}
    }
  }

  injectClutterStyles(document);

  // Deep Shadow DOM Query Helpers
  function deepQuerySelector(selector, root = document) {
    try {
      const direct = root.querySelector(selector);
      if (direct) return direct;
    } catch (e) {}

    const stack = [root];
    const seen = new Set();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      if (current.querySelector) {
        try {
          const match = current.querySelector(selector);
          if (match) return match;
        } catch (e) {}
      }

      if (current.shadowRoot && !seen.has(current.shadowRoot)) {
        stack.push(current.shadowRoot);
      }

      const children = current.children || current.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
          stack.push(children[i]);
        }
      }
    }
    return null;
  }

  function deepQuerySelectorAll(selector, root = document) {
    const results = [];
    const stack = [root];
    const seen = new Set();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      if (current.querySelectorAll) {
        try {
          const matches = current.querySelectorAll(selector);
          for (const m of matches) {
            if (!results.includes(m)) results.push(m);
          }
        } catch (e) {}
      }

      if (current.shadowRoot && !seen.has(current.shadowRoot)) {
        stack.push(current.shadowRoot);
      }

      const children = current.children || current.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
          stack.push(children[i]);
        }
      }
    }
    return results;
  }

  function cleanupClutterAndCannedResponses() {
    const stack = [document];
    const seen = new Set();

    const hideSelectors = [
      'ytcp-canned-responses',
      'ytcp-canned-response-chip-bar',
      'ytcp-canned-response-chip',
      'ytcp-comment-reply-suggestions',
      'ytcp-suggested-replies',
      'ytcp-chip-bar',
      '#canned-responses',
      '#reply-suggestions',
      '#canned-response-container',
      '#smart-replies',
      '#suggestions',
      'ytcp-chip-cloud-chip-renderer'
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);

      if (current.querySelectorAll) {
        try {
          for (const sel of hideSelectors) {
            const els = current.querySelectorAll(sel);
            els.forEach(el => {
              el.style.setProperty('display', 'none', 'important');
              el.style.setProperty('visibility', 'hidden', 'important');
              el.style.setProperty('height', '0', 'important');
              el.style.setProperty('pointer-events', 'none', 'important');
            });
          }
        } catch (e) {}
      }

      if (current.shadowRoot && !seen.has(current.shadowRoot)) {
        stack.push(current.shadowRoot);
      }

      const children = current.children || current.childNodes || [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.ELEMENT_NODE) {
          stack.push(children[i]);
        }
      }
    }
  }

  function getHashHighlightTarget() {
    try {
      const full = window.location.href;
      const hashIdx = full.indexOf('#');
      const hashStr = hashIdx !== -1 ? full.slice(hashIdx + 1) : '';
      const queryStr = window.location.search ? window.location.search.slice(1) : '';
      const combined = `${queryStr}&${hashStr}`;
      const params = new URLSearchParams(combined);

      let author = params.get('lado_author');
      let comment = params.get('lado_comment');

      if (!author && !comment) {
        const cachedAuthor = sessionStorage.getItem('lado_pending_author_yt');
        const cachedComment = sessionStorage.getItem('lado_pending_comment_yt');
        if (cachedAuthor || cachedComment) {
          author = cachedAuthor;
          comment = cachedComment;
        }
      }

      if (author || comment) {
        return {
          authorName: author ? decodeURIComponent(author) : '',
          commentText: comment ? decodeURIComponent(comment) : ''
        };
      }
    } catch (e) {}
    return null;
  }

  // Check for pending comment highlight on YouTube page load
  function checkPendingHighlight() {
    const fromHash = getHashHighlightTarget();
    if (fromHash && (fromHash.commentText || fromHash.authorName)) {
      pollAndHighlightYouTubeComment(fromHash.commentText, fromHash.authorName);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['pendingHighlight'], (res) => {
        if (res && res.pendingHighlight) {
          const { commentText, authorName, timestamp } = res.pendingHighlight;
          if (Date.now() - timestamp < 180000) {
            chrome.storage.local.remove(['pendingHighlight']);
            pollAndHighlightYouTubeComment(commentText, authorName);
          }
        }
      });
    }
  }

  function showTargetBadgeOnElement(targetEl, text) {
    if (!targetEl) return;
    const existingBadge = document.getElementById('lado-target-marker-badge');
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement('div');
    badge.id = 'lado-target-marker-badge';
    badge.className = 'lado-target-marker-badge';
    badge.innerHTML = `<span>🎯</span> <span>${text}</span>`;
    
    if (getComputedStyle(targetEl).position === 'static') {
      targetEl.style.position = 'relative';
    }
    targetEl.appendChild(badge);

    setTimeout(() => {
      badge.remove();
    }, 12000);
  }

  function pollAndHighlightYouTubeComment(commentText, authorName) {
    const clean = (commentText || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
    const cleanAuthor = (authorName || '').replace(/^[@\s]+/, '').trim().toLowerCase();
    if (!clean && !cleanAuthor) return;

    let tries = 0;
    const pollTimer = setInterval(() => {
      tries++;
      const textNodes = deepQuerySelectorAll(
        '#content-text, .yt-core-attributed-string, yt-formatted-string, #comment-content, ytcp-comment #body #content, yt-formatted-string#content, #comment-body, .comment-body',
        document
      );

      let targetThread = null;
      for (const node of textNodes) {
        const t = (node.innerText || node.textContent || '').toLowerCase();
        if (clean && (t.includes(clean) || (clean.length >= 3 && clean.includes(t)))) {
          targetThread = node.closest('ytd-comment-thread-renderer') ||
                         node.closest('ytd-comment-view-model') ||
                         node.closest('ytcp-comment-thread') ||
                         node.closest('ytcp-comment') ||
                         node.closest('ytcp-comment-item') ||
                         node;
          break;
        }
        if (cleanAuthor && cleanAuthor !== 'khán giả' && cleanAuthor.length >= 3 && t.includes(cleanAuthor)) {
          targetThread = node.closest('ytd-comment-thread-renderer') ||
                         node.closest('ytd-comment-view-model') ||
                         node.closest('ytcp-comment-thread') ||
                         node.closest('ytcp-comment') ||
                         node.closest('ytcp-comment-item') ||
                         node;
          break;
        }
      }

      if (targetThread) {
        clearInterval(pollTimer);
        targetThread.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetThread.style.transition = 'all 0.4s ease';
        targetThread.style.outline = '4px solid #ef4444 !important';
        targetThread.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.95), inset 0 0 15px rgba(239, 68, 68, 0.25) !important';
        targetThread.style.backgroundColor = 'rgba(239, 68, 68, 0.15) !important';
        targetThread.style.borderRadius = '12px !important';
        
        showTargetBadgeOnElement(targetThread, `🎯 BÌNH LUẬN YOUTUBE CẦN TRẢ LỜI: "${(clean || authorName || '').slice(0, 35)}..."`);

        // Auto click Reply button on YouTube & inject AI
        setTimeout(() => {
          try {
            const replyBtn = deepQuerySelector(
              '#reply-button-end button, ytd-button-renderer#reply-button-end, ytcp-button#reply-button, #actions #reply-button, ytcp-comment-actions ytcp-button, button[aria-label*="Reply" i], button[aria-label*="Phản hồi" i], button[aria-label*="Trả lời" i], ytcp-button[aria-label*="Reply" i], ytcp-button[aria-label*="Phản hồi" i], ytcp-button[aria-label*="Trả lời" i]',
              targetThread
            );
            if (replyBtn) {
              const clickTarget = replyBtn.querySelector('button, div#button, [role="button"]') || replyBtn;
              clickTarget.click();
              injectAiButtonsToYouTubeComments();
            }
          } catch (e) {}
        }, 350);

        setTimeout(() => {
          targetThread.style.outline = '';
          targetThread.style.boxShadow = '';
          targetThread.style.backgroundColor = '';
        }, 15000);
        showInPageToast(`👀 Đã khoanh đỏ bình luận của ${authorName || 'khán giả'}: "${(clean || authorName || '').slice(0, 30)}..."`);
      } else {
        // If not found in first few tries, scroll slightly to trigger YouTube virtualization render
        if (tries % 6 === 0 && tries < 30) {
          window.scrollBy({ top: 350, behavior: 'instant' });
          const scrollables = Array.from(document.querySelectorAll('div[class*="table"], div[class*="container"], div[role="feed"], tbody, div[style*="overflow"]'));
          scrollables.forEach(sc => {
            if (sc && sc.scrollHeight > sc.clientHeight) {
              try { sc.scrollTop += 350; } catch (e) {}
            }
          });
        }
        if (tries >= 35) {
          clearInterval(pollTimer);
        }
      }
    }, 300);
  }

  checkPendingHighlight();
  setTimeout(checkPendingHighlight, 800);
  setTimeout(checkPendingHighlight, 2000);
  setTimeout(checkPendingHighlight, 3500);

  function extractVideoInfoFromNode(node, currentUrl) {
    let videoTitle = 'Video YouTube Lá Đỏ';
    let videoUrl = currentUrl;

    const studioUrlMatch = currentUrl.match(/\/video\/([a-zA-Z0-9_-]{8,})/);
    if (studioUrlMatch && studioUrlMatch[1]) {
      videoUrl = `https://www.youtube.com/watch?v=${studioUrlMatch[1]}`;
    }

    if (node) {
      const linkEl = deepQuerySelector(
        'ytcp-comment-video-thumbnail a, #video-title, a.video-link, a[href*="/video/"], a[href*="watch?v="], yt-formatted-string#video-title',
        node
      );
      if (linkEl) {
        const text = (linkEl.innerText || linkEl.textContent || '').trim();
        if (text) videoTitle = text;

        const href = linkEl.getAttribute('href') || linkEl.href || '';
        const match = href.match(/\/video\/([a-zA-Z0-9_-]{8,})/) || href.match(/[?&]v=([a-zA-Z0-9_-]{8,})/);
        if (match && match[1]) {
          videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        } else if (href.startsWith('http')) {
          videoUrl = href;
        }
      }
    }

    if (videoTitle === 'Video YouTube Lá Đỏ') {
      const pageTitleEl = document.querySelector('h1.ytd-watch-metadata, h1.title, yt-formatted-string.ytd-reel-player-header-renderer');
      if (pageTitleEl && pageTitleEl.innerText.trim()) {
        videoTitle = pageTitleEl.innerText.trim();
      }
    }

    return { videoTitle, videoUrl };
  }

  function cleanYouTubeAuthor(raw) {
    if (!raw) return 'Khán giả';
    let clean = raw.split('\n')[0].trim();
    clean = clean.replace(/•\s*.*/g, '');
    clean = clean.replace(/\s*·?\s*\d+\s*(giờ|phút|ngày|tháng|năm|tuần|giây|h|m|d|w|s|hr|min|yr)\s*(trước|ago)?\b.*/gi, '');
    clean = clean.replace(/\s*·?\s*(vừa xong|just now|hôm qua|yesterday)\b.*/gi, '');
    clean = clean.replace(/^@/, '').trim();
    return clean || 'Khán giả';
  }

  function cleanYouTubeCommentText(rawText, authorName) {
    if (!rawText) return '';
    let text = rawText.trim();

    // 1. Loại bỏ tiền tố tên tác giả / handle nếu bị dính
    if (authorName && authorName !== 'Khán giả') {
      const cleanAuth = authorName.replace(/^@/, '').trim();
      const authRegex = new RegExp('^@?' + cleanAuth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(•|·|-)?\\s*', 'gi');
      text = text.replace(authRegex, '');
    }

    // 2. Loại bỏ bất kỳ @handle nào ở đầu
    text = text.replace(/^@[a-zA-Z0-9_.-]+\s*(•|·|-)?\s*/gi, '');

    // 3. Loại bỏ thời gian tương đối ở đầu (ví dụ: "• 17 phút trước", "17 phút trước", "17 minutes ago")
    text = text.replace(/^[•·\s]*\d+\s*(phút|giờ|ngày|tháng|năm|tuần|giây|m|h|d|s|hr|min|yr|minutos|horas|hours|minutes|days|weeks|months|years)\s*(trước|ago)?\s*/gi, '');
    text = text.replace(/^[•·\s]*(vừa xong|just now|hôm qua|yesterday)\s*/gi, '');

    // 4. Loại bỏ các nút UI, nhãn AI, số lượng phản hồi dính trong text
    text = text
      .replace(/✨|🍁/gu, '')
      .replace(/(ai\s*lá\s*đỏ|ai\s*lado)/gi, '')
      .replace(/\d+\s*(phản hồi|câu trả lời|repl(y|ies))/gi, '')
      .replace(/(xem|view)\s+(\d+\s+)?(phản hồi|câu trả lời|repl(y|ies))/gi, '')
      .replace(/(phản hồi|reply|trả lời)/gi, '')
      .replace(/(thích|like|dislike|không thích|chia sẻ|share)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  function isOwnOrAuthorYouTubeComment(thread, authorName, commentText) {
    const cleanName = (authorName || '').trim().toLowerCase();
    const cleanMsg = (commentText || '').trim().toLowerCase();

    const brandKeywords = [
      'lá đỏ homestay', 'quản trị viên homestay', 'la do homestay official', 'lado official',
      'homestay lá đỏ', 'lado homestay', 'quản trị viên', 'admin'
    ];
    if (brandKeywords.some(kw => cleanName === kw || cleanName.includes(kw))) return true;

    // Check specific author creator badge with actual content
    if (thread) {
      const authorBadges = Array.from(thread.querySelectorAll ? thread.querySelectorAll('ytd-author-comment-badge-renderer, [aria-label*="Tác giả"], [aria-label*="Creator"]') : []);
      for (const b of authorBadges) {
        if (!b.hasAttribute('hidden') && b.offsetParent !== null) {
          return true;
        }
      }
    }

    const selfReplySignatures = [
      'chào mừng bạn đến với lá đỏ', 'lá đỏ homestay view thung lũng',
      'hẹn gặp bạn tại lá đỏ', 'để cùng ngắm mây mường hoa'
    ];
    if (selfReplySignatures.some(sig => cleanMsg.startsWith(sig) || cleanMsg.includes(sig))) return true;

    return false;
  }

  function isYouTubeCommentAlreadyReplied(threadNode) {
    if (!threadNode) return false;
    try {
      // Check replies section
      const repliesContainer = threadNode.querySelector ? (threadNode.querySelector('#replies, ytd-comment-replies-renderer, [id="replies"]') || deepQuerySelector('#replies, ytd-comment-replies-renderer', threadNode)) : null;
      if (repliesContainer) {
        const renderedReplies = repliesContainer.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytcp-comment-item, [role="row"]');
        if (renderedReplies.length > 0) return true;

        const repliesText = (repliesContainer.innerText || '').trim().toLowerCase();
        if (repliesText.length > 0) {
          const ytReplyPatterns = [
            /\b\d+\s*(phản hồi|câu trả lời|repl(y|ies))\b/i,
            /(xem|view)\s+(\d+\s+)?(phản hồi|câu trả lời|repl(y|ies))/i
          ];
          for (const pattern of ytReplyPatterns) {
            if (pattern.test(repliesText)) return true;
          }
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  function findEditableInput(container) {
    if (!container) return null;

    const inputSelectors = [
      'div[contenteditable="true"]',
      'div[contenteditable="plaintext-only"]',
      'div[contenteditable]',
      '#textbox',
      '#contenteditable-root',
      'div[role="textbox"]',
      'textarea#input',
      'textarea'
    ];

    for (const sel of inputSelectors) {
      const el = deepQuerySelector(sel, container);
      if (el) return el;
    }
    return null;
  }

  async function fillAndSubmitReply(contextNode, replyText, authorName) {
    if (!replyText) return false;

    const commentContainer = (contextNode && contextNode.closest && (
      contextNode.closest('ytcp-comment-thread') ||
      contextNode.closest('ytcp-comment-item') ||
      contextNode.closest('ytcp-comment') ||
      contextNode.closest('ytd-comment-thread-renderer') ||
      contextNode.closest('ytd-comment-view-model') ||
      contextNode.closest('#comment')
    )) || contextNode?.parentElement?.parentElement || document;

    let targetReplyBtn = null;
    if (contextNode && contextNode !== document && contextNode !== document.body) {
      const tagName = (contextNode.tagName || '').toLowerCase();
      const id = (contextNode.id || '').toLowerCase();
      const txt = (contextNode.innerText || contextNode.textContent || '').trim().toLowerCase();

      if (id.includes('reply') || txt === 'phản hồi' || txt === 'reply' || tagName === 'ytcp-button' || tagName === 'ytd-button-renderer' || tagName === 'button') {
        targetReplyBtn = contextNode;
      } else {
        targetReplyBtn = deepQuerySelector(
          'ytcp-button#reply-button, #reply-button, ytd-button-renderer#reply-button-end, #reply-button-end, ytd-button-renderer#reply-button, ytcp-comment-actions ytcp-button, ytcp-button[aria-label*="Phản hồi"], ytcp-button[aria-label*="Reply"], button[aria-label*="Phản hồi"], button[aria-label*="Reply"]',
          contextNode
        );
      }
    }

    if (!targetReplyBtn) {
      targetReplyBtn = deepQuerySelector(
        'ytcp-button#reply-button, #reply-button, ytd-button-renderer#reply-button-end, #reply-button-end, ytd-button-renderer#reply-button',
        commentContainer
      );
    }

    let inputEl = findEditableInput(commentContainer);

    if (!inputEl) {
      if (targetReplyBtn) {
        const innerBtn = targetReplyBtn.querySelector('button, .label, div#button, div') || targetReplyBtn;
        targetReplyBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true }));
        targetReplyBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
        targetReplyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
        if (typeof targetReplyBtn.click === 'function') targetReplyBtn.click();
        if (innerBtn !== targetReplyBtn && typeof innerBtn.click === 'function') innerBtn.click();
      }

      for (let i = 0; i < 35; i++) {
        await new Promise(r => setTimeout(r, 100));
        inputEl = findEditableInput(commentContainer);
        if (!inputEl) {
          inputEl = findEditableInput(document);
        }
        if (inputEl) break;
      }
    }

    if (!inputEl) {
      try { navigator.clipboard.writeText(replyText); } catch(e) {}
      showInPageToast(`📋 Đã sao chép câu trả lời AI vào Clipboard!`);
      return false;
    }

    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputEl.focus();
    await new Promise(r => setTimeout(r, 120));

    const editableDiv = inputEl.shadowRoot ? inputEl.shadowRoot.querySelector('div[contenteditable="true"], #textbox') : null;
    const targetInput = editableDiv || inputEl;
    targetInput.focus();

    try {
      const root = (targetInput.getRootNode && typeof targetInput.getRootNode === 'function') ? targetInput.getRootNode() : document;
      const sel = (root && root.getSelection) ? root.getSelection() : window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(targetInput);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {}

    let execOk = false;
    try {
      execOk = document.execCommand('insertText', false, replyText);
    } catch (e) {}

    if (!execOk || !targetInput.textContent.trim()) {
      targetInput.innerHTML = '';
      targetInput.innerText = replyText;
      targetInput.textContent = replyText;
    }

    const hostEl = (targetInput.getRootNode && targetInput.getRootNode().host) ||
                   targetInput.closest('ytcp-social-suggestions-textbox') ||
                   deepQuerySelector('ytcp-social-suggestions-textbox', commentContainer) ||
                   deepQuerySelector('ytcp-social-suggestions-textbox', document);

    if (hostEl) {
      try { hostEl.value = replyText; } catch(e) {}
      try { hostEl.text = replyText; } catch(e) {}
      try { hostEl.formattedText = replyText; } catch(e) {}
      try { if (typeof hostEl.setText === 'function') hostEl.setText(replyText); } catch(e) {}
      try { if (typeof hostEl.setValue === 'function') hostEl.setValue(replyText); } catch(e) {}
      try { if (typeof hostEl.set === 'function') hostEl.set('value', replyText); } catch(e) {}

      hostEl.dispatchEvent(new CustomEvent('iron-input', { bubbles: true, composed: true }));
      hostEl.dispatchEvent(new CustomEvent('value-changed', { detail: { value: replyText }, bubbles: true, composed: true }));
      hostEl.dispatchEvent(new CustomEvent('text-changed', { detail: { text: replyText }, bubbles: true, composed: true }));
      hostEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      hostEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }

    const ytCommentBox = targetInput.closest('ytd-commentbox') || deepQuerySelector('ytd-commentbox', commentContainer);
    if (ytCommentBox) {
      try { ytCommentBox.setValue?.(replyText); } catch(e) {}
    }

    targetInput.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
    targetInput.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: replyText }));
    targetInput.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: replyText }));
    targetInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    targetInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, composed: true, key: ' ', code: 'Space' }));
    targetInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, composed: true, key: ' ', code: 'Space' }));

    await new Promise(r => setTimeout(r, 450));

    let submitBtn = null;
    for (let i = 0; i < 30; i++) {
      const cancelBtn = Array.from(deepQuerySelectorAll('ytcp-button, button', commentContainer)).find(b => {
        if (b.id === 'cancel-button') return true;
        const t = (b.innerText || b.textContent || '').trim().toLowerCase();
        return t === 'hủy' || t === 'cancel';
      });

      if (cancelBtn && cancelBtn.parentElement) {
        const footerButtons = deepQuerySelectorAll('ytcp-button, button, ytd-button-renderer', cancelBtn.parentElement);
        for (const b of footerButtons) {
          if (b === cancelBtn || b === targetReplyBtn) continue;
          const t = (b.innerText || b.textContent || '').trim().toLowerCase();
          if (t.includes('hủy') || t.includes('cancel')) continue;
          if (b.classList.contains('lado-ai-reply-btn')) continue;
          submitBtn = b;
          break;
        }
      }

      if (!submitBtn) {
        const dialogContainer = targetInput.closest('ytcp-comment-reply-dialog, ytcp-comment-dialog, ytd-commentbox, ytcp-form-input-container, ytcp-comment-creator') ||
                                deepQuerySelector('ytcp-comment-reply-dialog, ytcp-comment-dialog, ytcp-form-input-container, ytd-commentbox, ytcp-comment-creator', commentContainer) ||
                                commentContainer;

        const candidates = deepQuerySelectorAll(
          'ytcp-button#reply-button, ytcp-button#submit-button, ytcp-button.submit-button, ytcp-button[aria-label*="Phản hồi"], ytcp-button[aria-label*="Reply"], #submit-button button, ytd-button-renderer#submit-button, #submit-button, ytcp-button#reply-button-dialog, ytcp-button',
          dialogContainer
        );
        for (const b of candidates) {
          if (b === targetReplyBtn) continue;
          if (b.closest('ytcp-comment-actions, #actions, ytd-comment-action-buttons-renderer')) continue;
          const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
          if (txt.includes('hủy') || txt.includes('cancel') || b.id === 'cancel-button') continue;
          if (b.classList.contains('lado-ai-reply-btn') || b.querySelector('.lado-ai-reply-btn')) continue;
          if (b.id === 'reply-button' || b.id === 'submit-button' || txt === 'phản hồi' || txt === 'reply' || b.getAttribute('aria-label')?.toLowerCase() === 'phản hồi' || b.getAttribute('aria-label')?.toLowerCase() === 'reply') {
            submitBtn = b;
            break;
          }
        }
      }

      if (submitBtn) break;
      await new Promise(r => setTimeout(r, 100));
    }

    if (submitBtn) {
      submitBtn.removeAttribute('disabled');
      submitBtn.removeAttribute('aria-disabled');
      if ('disabled' in submitBtn) submitBtn.disabled = false;

      const innerShadowBtn = submitBtn.shadowRoot ? submitBtn.shadowRoot.querySelector('button, #button') : null;
      if (innerShadowBtn) {
        innerShadowBtn.removeAttribute('disabled');
        innerShadowBtn.removeAttribute('aria-disabled');
        if ('disabled' in innerShadowBtn) innerShadowBtn.disabled = false;
      }

      const clickTarget = innerShadowBtn || submitBtn.querySelector('button, .label, div#button, div') || submitBtn;
      clickTarget.removeAttribute('disabled');
      clickTarget.removeAttribute('aria-disabled');
      if ('disabled' in clickTarget) clickTarget.disabled = false;

      clickTarget.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));
      clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true }));
      clickTarget.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true, composed: true }));
      clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
      clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
      if (typeof clickTarget.click === 'function') clickTarget.click();
      if (typeof submitBtn.click === 'function' && submitBtn !== clickTarget) submitBtn.click();

      chrome.runtime.sendMessage({ action: 'RECORD_REPLY_SUCCESS' });
      showInPageToast(`✅ Đã tự động gửi phản hồi AI cho "${authorName || 'khán giả'}" thành công!`);
      return true;
    } else {
      try { navigator.clipboard.writeText(replyText); } catch(e) {}
      showInPageToast(`📋 Đã điền câu trả lời vào ô. Bạn bấm "Phản hồi" để gửi nha!`);
      return true;
    }
  }

  function injectAiButtonsToYouTubeComments() {
    cleanupClutterAndCannedResponses();

    const isStudio = window.location.hostname.includes('studio.youtube.com');
    const commentThreads = isStudio
      ? deepQuerySelectorAll('ytcp-comment-thread, ytcp-comment-item, ytcp-comment', document)
      : deepQuerySelectorAll('ytd-comment-thread-renderer, ytd-comment-view-model', document);

    commentThreads.forEach((thread) => {
      if (thread.querySelector('.lado-ai-reply-btn') || deepQuerySelector('.lado-ai-reply-btn', thread)) {
        return;
      }

      const commentContentEl = deepQuerySelector(
        '#comment #content-text, #content-text, .yt-core-attributed-string, yt-formatted-string#content, #comment-content, .comment-content, #body #content, yt-formatted-string.content, #content',
        thread
      );
      const commentAuthorEl = deepQuerySelector(
        '#author-text, #name, #header-author, #author-name, .author-name, ytcp-comment-header-renderer #name, span.author-text, a#author-text',
        thread
      );

      const commentText = commentContentEl ? (commentContentEl.innerText || commentContentEl.textContent || '').trim() : '';
      const authorName = commentAuthorEl ? (commentAuthorEl.innerText || commentAuthorEl.textContent || '').trim() : 'Khán giả';

      if (!commentText || isOwnOrAuthorYouTubeComment(thread, authorName, commentText) || isYouTubeCommentAlreadyReplied(thread)) return;

      let replyBtn = null;
      const candidateButtons = deepQuerySelectorAll(
        '#reply-button-end, ytd-button-renderer#reply-button-end, ytcp-button#reply-button, #actions #reply-button, ytcp-comment-actions ytcp-button, ytcp-button',
        thread
      );

      for (const c of candidateButtons) {
        if (c.closest('ytcp-comment-reply-dialog, ytcp-comment-dialog, ytcp-form-input-container, ytd-commentbox, #reply-dialog')) continue;

        const rawTxt = (c.innerText || c.textContent || '').trim();
        const txt = rawTxt.toLowerCase();

        if (txt.includes('hủy') || txt.includes('cancel')) continue;
        if (/^\d+\s*(phản hồi|repl)/i.test(rawTxt) || /(xem|view|ẩn|hide)\s*(phản hồi|repl)/i.test(rawTxt)) continue;

        if (c.id === 'reply-button' || c.id === 'reply-button-end' || txt === 'phản hồi' || txt === 'reply' || c.getAttribute('aria-label')?.toLowerCase() === 'phản hồi' || c.getAttribute('aria-label')?.toLowerCase() === 'reply') {
          replyBtn = c.closest('ytcp-button, ytd-button-renderer, button') || c;
          break;
        }
      }

      if (!replyBtn) return;

      const parentRow = replyBtn.parentElement;
      if (!parentRow || parentRow.querySelector('.lado-ai-reply-btn')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lado-ai-reply-btn lado-yt';
      btn.innerHTML = `<span>✨ AI Lá Đỏ</span>`;
      btn.title = `Tự động tạo câu trả lời AI & gửi lên YouTube cho ${authorName}`;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        btn.classList.add('loading');
        const spanText = btn.querySelector('span');
        if (spanText) spanText.textContent = '⏳ Đang sinh & gửi...';

        try {
          const clickTarget = replyBtn.querySelector('button, a, div[role="button"]') || replyBtn;
          clickTarget.click();

          const { videoTitle, videoUrl } = extractVideoInfoFromNode(thread, window.location.href);

          chrome.runtime.sendMessage({
            action: 'GENERATE_AI_REPLY',
            payload: {
              postTitle: videoTitle,
              postContent: 'Lá Đỏ Homestay Sa Pa view thung lũng Mường Hoa',
              commentText: commentText,
              authorName: authorName,
              tone: 'WARM'
            }
          }, async (response) => {
            btn.classList.remove('loading');
            if (spanText) spanText.textContent = '✨ AI Lá Đỏ';

            if (response && response.reply) {
              await fillAndSubmitReply(thread, response.reply, authorName);
            }
          });
        } catch (err) {
          btn.classList.remove('loading');
          if (spanText) spanText.textContent = '✨ AI Lá Đỏ';
        }
      });

      parentRow.appendChild(btn);
    });
  }

  function injectMainYouTubeCommentButton() {
    if (document.querySelector('.lado-main-ai-btn')) return;

    const submitBtn = deepQuerySelector('ytd-commentbox #submit-button, #submit-button, ytcp-comment-reply-dialog #submit-button', document);
    if (!submitBtn) return;

    const mainAiBtn = document.createElement('button');
    mainAiBtn.type = 'button';
    mainAiBtn.className = 'lado-main-ai-btn lado-ai-reply-btn lado-yt';
    mainAiBtn.innerHTML = `<span>✨ Bình luận AI</span>`;
    mainAiBtn.title = 'Tự động tạo bình luận hấp dẫn bằng AI cho video này và đăng luôn';

    mainAiBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      mainAiBtn.classList.add('loading');
      mainAiBtn.innerHTML = `<span>⏳ Đang sinh & gửi...</span>`;

      const videoTitle = document.querySelector('h1.ytd-watch-metadata, #title h1, h1')?.innerText?.trim() || 'Video YouTube Lá Đỏ Homestay';

      chrome.runtime.sendMessage({
        action: 'GENERATE_AI_REPLY',
        payload: {
          postTitle: videoTitle,
          postContent: 'Homestay Lá Đỏ Sa Pa view thung lũng Mường Hoa & săn mây',
          commentText: 'Hãy viết một bình luận ngắn gọn, thân thiện giới thiệu hoặc tương tác chào mọi người về Lá Đỏ Homestay Sa Pa trên video này.',
          authorName: 'Khán giả',
          tone: 'WARM'
        }
      }, (res) => {
        mainAiBtn.classList.remove('loading');
        mainAiBtn.innerHTML = `<span>✨ Bình luận AI</span>`;

        if (res && res.reply) {
          fillAndSubmitReply(document.body, res.reply, 'Khán giả').then(() => {
            showInPageToast('🚀 Đã đăng bình luận AI lên video YouTube!');
          });
        }
      });
    });

    submitBtn.parentNode.insertBefore(mainAiBtn, submitBtn);
  }

  let debounceYtInjectTimer = null;
  function debouncedInjectYtAll() {
    if (debounceYtInjectTimer) clearTimeout(debounceYtInjectTimer);
    debounceYtInjectTimer = setTimeout(() => {
      injectAiButtonsToYouTubeComments();
      injectMainYouTubeCommentButton();
    }, 300);
  }

  const ytObserver = new MutationObserver(() => {
    debouncedInjectYtAll();
  });
  if (document.body) {
    ytObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      ytObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
  setTimeout(debouncedInjectYtAll, 1000);
  setTimeout(debouncedInjectYtAll, 2500);

  function parseRelativeTimeStringToMs(str) {
    if (!str) return Date.now();
    const lower = str.toLowerCase().trim();
    const now = Date.now();

    if (lower.includes('vừa xong') || lower.includes('just now') || lower === 'vừa' || lower === 'now') {
      return now;
    }
    if (lower.includes('hôm qua') || lower.includes('yesterday')) {
      return now - 24 * 3600 * 1000;
    }

    const fullDateMatch = lower.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (fullDateMatch) {
      const y = parseInt(fullDateMatch[1], 10);
      const m = parseInt(fullDateMatch[2], 10) - 1;
      const d = parseInt(fullDateMatch[3], 10);
      const parsed = new Date(y, m, d).getTime();
      if (!isNaN(parsed)) return parsed;
    }

    const vnThgMatch = lower.match(/(\d{1,2})\s+thg\s+(\d{1,2})(?:,?\s*(\d{4}))?/i);
    if (vnThgMatch) {
      const d = parseInt(vnThgMatch[1], 10);
      const m = parseInt(vnThgMatch[2], 10) - 1;
      const y = vnThgMatch[3] ? parseInt(vnThgMatch[3], 10) : new Date().getFullYear();
      const parsed = new Date(y, m, d).getTime();
      if (!isNaN(parsed)) return parsed;
    }

    const match = lower.match(/(\d+)\s*(phút|giờ|ngày|tháng|năm|tuần|giây|m|h|d|w|s|yr|min|hr|day|week|month|year)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      if (unit === 's' || unit.startsWith('giây') || unit.startsWith('sec')) {
        return now - val * 1000;
      }
      if (unit.startsWith('ph') || unit === 'm' || unit.startsWith('min')) {
        return now - val * 60 * 1000;
      }
      if (unit.startsWith('gi') || unit === 'h' || unit.startsWith('hr')) {
        return now - val * 3600 * 1000;
      }
      if (unit.startsWith('ng') || unit === 'd' || unit.startsWith('day')) {
        return now - val * 24 * 3600 * 1000;
      }
      if (unit.startsWith('tu') || unit === 'w' || unit.startsWith('week')) {
        return now - val * 7 * 24 * 3600 * 1000;
      }
      if (unit.startsWith('th') || unit.startsWith('month')) {
        return now - val * 30 * 24 * 3600 * 1000;
      }
      if (unit.startsWith('n') || unit === 'yr' || unit.startsWith('year')) {
        return now - val * 365 * 24 * 3600 * 1000;
      }
    }

    const parsedDirect = Date.parse(str);
    if (!isNaN(parsedDirect) && parsedDirect > 1000000000000) {
      return parsedDirect;
    }

    return now;
  }

  function extractYouTubeCommentTimestamp(node) {
    if (!node) return { text: 'Gần đây', timestampMs: Date.now() };

    try {
      const timeEl = deepQuerySelector(
        '#header-author .published-time-text a, .published-time-text, yt-formatted-string#published-time-text, .date-text, #published-time-text, [class*="published-time"]',
        node
      );
      if (timeEl) {
        const txt = (timeEl.innerText || timeEl.textContent || '').trim();
        const titleAttr = timeEl.getAttribute('title') || timeEl.getAttribute('aria-label') || '';
        const effective = txt || titleAttr || 'Gần đây';
        return {
          text: effective,
          timestampMs: parseRelativeTimeStringToMs(titleAttr || txt)
        };
      }
    } catch (e) {}

    return { text: 'Gần đây', timestampMs: Date.now() };
  }

  function showInPageToast(msg) {
    let toast = document.getElementById('lado-inpage-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lado-inpage-toast';
      toast.className = 'lado-floating-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // 6. Listeners for Extension Popup Actions (Scanning, Auto-Reply, & Navigation)
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'SCAN_COMMENTS') {
      const isStudio = window.location.hostname.includes('studio.youtube.com');
      const commentNodes = isStudio
        ? deepQuerySelectorAll('ytcp-comment-thread, ytcp-comment-item, ytcp-comment', document)
        : deepQuerySelectorAll('ytd-comment-thread-renderer, ytd-comment-view-model', document);

      const results = [];
      const currentUrl = window.location.href;

      commentNodes.forEach((node, idx) => {
        let textEl = deepQuerySelector(
          'yt-formatted-string#content-text, #content-text, .ytcp-comment-text, ytcp-comment-text, yt-formatted-string.content-text, #comment-content',
          node
        );
        if (!textEl) {
          textEl = deepQuerySelector(
            '.yt-core-attributed-string, yt-formatted-string#content, #comment-content, .comment-content, #body #content',
            node
          );
        }
        const authorEl = deepQuerySelector(
          '#author-text, #name, #header-author, #author-name, .author-name, ytcp-comment-header-renderer #name, span.author-text, a#author-text',
          node
        );
        const avatarEl = deepQuerySelector(
          '#author-thumbnail img, ytcp-img-with-fallback img, img.avatar, #avatar img, img',
          node
        );

        const timeInfo = extractYouTubeCommentTimestamp(node);
        const { videoTitle, videoUrl } = extractVideoInfoFromNode(node, currentUrl);

        const rawAuthor = authorEl ? (authorEl.innerText || authorEl.textContent || '').trim() : 'Khán giả';
        const authorName = cleanYouTubeAuthor(rawAuthor);
        const rawComment = textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
        const commentText = cleanYouTubeCommentText(rawComment, authorName);

        if (commentText.length > 0 && !isOwnOrAuthorYouTubeComment(node, authorName, commentText) && !isYouTubeCommentAlreadyReplied(node)) {
          const alreadyExists = results.some(r => r.message === commentText && r.authorName === authorName);
          if (!alreadyExists) {
            results.push({
              id: `yt_${idx}_${Date.now()}`,
              index: idx,
              message: commentText,
              authorName: authorName,
              authorAvatar: avatarEl ? avatarEl.src : '',
              publishedAt: timeInfo.text,
              timestampMs: timeInfo.timestampMs,
              platform: 'YOUTUBE',
              postUrl: videoUrl,
              videoTitle: videoTitle
            });
          }
        }
      });

      sendResponse({ count: results.length, comments: results, videoTitle: results[0]?.videoTitle || 'Video YouTube' });
      return true;
    }

    if (req.action === 'EXECUTE_POST_REPLY') {
      const { commentText, authorName, message, index } = req;
      const isStudio = window.location.hostname.includes('studio.youtube.com');
      const commentNodes = isStudio
        ? deepQuerySelectorAll('ytcp-comment-thread, ytcp-comment-item, ytcp-comment', document)
        : deepQuerySelectorAll('ytd-comment-thread-renderer, ytd-comment-view-model', document);

      let targetThread = null;

      if (index !== undefined && commentNodes[index]) {
        targetThread = commentNodes[index];
      }

      if (!targetThread && commentText) {
        const clean = commentText.replace(/^["']|["']$/g, '').trim().toLowerCase();
        for (const t of commentNodes) {
          const txt = (t?.innerText || t?.textContent || '').toLowerCase();
          if (txt.includes(clean)) {
            targetThread = t;
            break;
          }
        }
      }

      if (targetThread) {
        targetThread.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fillAndSubmitReply(targetThread, message, authorName).then(success => {
          sendResponse({ success: true });
        });
        return true;
      } else {
        fillAndSubmitReply(document.body, message, authorName).then(success => {
          sendResponse({ success });
        });
        return true;
      }
    }

    if (req.action === 'HIGHLIGHT_COMMENT') {
      const { commentText, authorName } = req;
      pollAndHighlightYouTubeComment(commentText, authorName);
      sendResponse({ success: true });
      return true;
    }

    if (req.action === 'TRIGGER_AUTO_SCAN') {
      window.__LADO_YT_AUTO_SCAN_EXECUTED__ = false;
      checkAndTriggerAutoScanYouTube(true);
      sendResponse({ success: true });
      return true;
    }
  });

  // ==========================================
  // 7. TỰ ĐỘNG KÍCH HOẠT QUÉT & ĐỒNG BỘ YOUTUBE (AUTO-SCAN & SYNC)
  // ==========================================

  function checkAndTriggerAutoScanYouTube(force = false) {
    if (window.top !== window.self) return;

    const url = window.location.href;
    let isUrlScan = force || url.includes('lado_auto_scan=true') || url.includes('lado_auto_scan');
    let isUrlReset = url.includes('reset=true');

    try {
      if (sessionStorage.getItem('lado_auto_scan_yt') === 'true') isUrlScan = true;
      if (sessionStorage.getItem('lado_reset_yt') === 'true') isUrlReset = true;
    } catch (e) {}

    if (isUrlScan) {
      executeYouTubeAutoScan(isUrlReset);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['pendingAutoScan'], (res) => {
        if (res && res.pendingAutoScan) {
          const { platform, reset, timestamp } = res.pendingAutoScan;
          if (platform === 'YOUTUBE' && Date.now() - timestamp < 120000) {
            chrome.storage.local.remove(['pendingAutoScan']);
            executeYouTubeAutoScan(reset !== false);
          }
        }
      });
    }
  }

  function executeYouTubeAutoScan(isReset = true) {
    if (window.top !== window.self) return;
    if (window.__LADO_YT_AUTO_SCAN_EXECUTED__) return;
    window.__LADO_YT_AUTO_SCAN_EXECUTED__ = true;

    console.log('[Lá Đỏ YouTube AI] Kích hoạt chế độ Tự động quét và Đồng bộ YouTube...');

    if (isReset && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['scannedCommentsList', 'scannedCount']);
    }

    // Floating Banner
    const existingBanner = document.getElementById('lado-yt-auto-scan-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'lado-yt-auto-scan-banner';
    banner.style.cssText = `
      position: fixed !important;
      top: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98)) !important;
      border: 2px solid #ef4444 !important;
      border-radius: 16px !important;
      padding: 16px 22px !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(239, 68, 68, 0.45) !important;
      min-width: 350px !important;
      max-width: 440px !important;
      backdrop-filter: blur(14px) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      pointer-events: auto !important;
    `;
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="lado-spinner-yt" style="width:22px; height:22px; border:3px solid rgba(239,68,68,0.3); border-top-color:#ef4444; border-radius:50%; animation:ladoSpinYT 0.8s linear infinite; flex-shrink:0;"></div>
        <div>
          <strong style="font-size:15px; color:#fca5a5; display:block; letter-spacing:0.3px;">▶️ LÁ ĐỎ YOUTUBE AI - TỰ ĐỘNG QUÉT</strong>
          <span style="font-size:11px; color:#94a3b8;">Hệ thống đang tự động trích xuất bình luận</span>
        </div>
      </div>
      <div id="lado-yt-scan-status-text" style="font-size:13px; color:#e2e8f0; line-height:1.5;">
        Đang chuẩn bị quét & cuộn trang YouTube Studio...
      </div>
      <div style="background:rgba(255,255,255,0.12); border-radius:6px; height:6px; overflow:hidden;">
        <div id="lado-yt-scan-prog" style="background:#ef4444; width:15%; height:100%; transition:width 0.3s;"></div>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'lado-yt-spinner-style';
    style.textContent = `@keyframes ladoSpinYT { to { transform: rotate(360deg); } }`;
    if (!document.getElementById('lado-yt-spinner-style')) {
      (document.head || document.documentElement).appendChild(style);
    }

    function safeAttachBanner() {
      const root = document.body || document.documentElement;
      if (root && !document.getElementById('lado-yt-auto-scan-banner')) {
        root.appendChild(banner);
      }
    }

    safeAttachBanner();
    setTimeout(safeAttachBanner, 300);
    setTimeout(safeAttachBanner, 1000);

    try {
      sessionStorage.removeItem('lado_auto_scan_yt');
      sessionStorage.removeItem('lado_reset_yt');
    } catch (e) {}

    (async () => {
      try {
        const collectedMap = new Map();
        const startY = window.scrollY || document.documentElement?.scrollTop || 0;
        const progEl = document.getElementById('lado-yt-scan-prog');
        const textEl = document.getElementById('lado-yt-scan-status-text');

        if (textEl) textEl.textContent = 'Đang đợi YouTube tải danh sách bình luận...';

        // Wait up to 8s for YouTube comment items to be rendered into the DOM
        let waitAttempts = 0;
        while (waitAttempts < 18) {
          waitAttempts++;
          const checkNodes = deepQuerySelectorAll('ytcp-comment-thread, ytcp-comment-item, ytcp-comment, ytcp-comment-view-model, ytd-comment-thread-renderer, ytd-comment-view-model, [role="row"]', document);
          if (checkNodes.length > 0) break;
          await new Promise(r => setTimeout(r, 400));
        }

        function harvestYouTube() {
          const isStudio = window.location.hostname.includes('studio.youtube.com');
          const commentNodes = isStudio
            ? deepQuerySelectorAll('ytcp-comment-thread, ytcp-comment-item, ytcp-comment, ytcp-comment-view-model, [role="row"]', document)
            : deepQuerySelectorAll('ytd-comment-thread-renderer, ytd-comment-view-model', document);

          const currentUrl = window.location.href;

          commentNodes.forEach((node, idx) => {
            let textEl = deepQuerySelector(
              'yt-formatted-string#content-text, #content-text, .ytcp-comment-text, ytcp-comment-text, yt-formatted-string.content-text, #comment-content, .comment-content, #body #content, yt-formatted-string#content, .yt-core-attributed-string, span[dir="auto"]',
              node
            );
            const authorEl = deepQuerySelector(
              '#author-text, #name, #header-author, #author-name, .author-name, ytcp-comment-header-renderer #name, span.author-text, a#author-text',
              node
            );
            const avatarEl = deepQuerySelector(
              '#author-thumbnail img, ytcp-img-with-fallback img, img.avatar, #avatar img, img',
              node
            );

            const timeInfo = extractYouTubeCommentTimestamp(node);
            const { videoTitle, videoUrl } = extractVideoInfoFromNode(node, currentUrl);
            const rawAuthor = authorEl ? (authorEl.innerText || authorEl.textContent || '').trim() : 'Khán giả';
            const authorName = cleanYouTubeAuthor(rawAuthor);
            const rawComment = textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';
            const commentText = cleanYouTubeCommentText(rawComment, authorName);

            if (commentText.length > 0 && !isOwnOrAuthorYouTubeComment(node, authorName, commentText)) {
              const sig = `${authorName.toLowerCase()}:::${commentText.toLowerCase()}`;
              if (!collectedMap.has(sig)) {
                collectedMap.set(sig, {
                  id: `yt_${idx}_${Date.now()}`,
                  index: idx,
                  message: commentText,
                  authorName: authorName,
                  authorAvatar: avatarEl ? avatarEl.src : '',
                  publishedAt: timeInfo.text,
                  timestampMs: timeInfo.timestampMs,
                  platform: 'YOUTUBE',
                  postUrl: videoUrl,
                  videoTitle: videoTitle
                });
              }
            }
          });
        }

        harvestYouTube();

        // Deep scroll loop
        const totalSteps = 16;
        for (let s = 1; s <= totalSteps; s++) {
          window.scrollBy({ top: 650, behavior: 'instant' });
          const scrollables = Array.from(document.querySelectorAll('div[id="contents"], div[id="body"], ytcp-comments-section, div[style*="overflow"], ytcp-comments-list, [class*="table"], tbody'));
          scrollables.forEach(sc => {
            if (sc && sc.scrollHeight > sc.clientHeight) {
              try { sc.scrollTop += 650; } catch (e) {}
            }
          });

          if (progEl) progEl.style.width = `${Math.min(90, Math.round((s / totalSteps) * 90))}%`;
          if (textEl) textEl.textContent = `Đang quét sâu bước ${s}/${totalSteps}... (Đã tìm thấy ${collectedMap.size} bình luận)`;

          await new Promise(r => setTimeout(r, 220));
          harvestYouTube();
        }

        window.scrollTo({ top: startY, behavior: 'instant' });
        if (progEl) progEl.style.width = '100%';

        const allComments = Array.from(collectedMap.values());
        const totalCount = Math.min(allComments.length, 300);
        const commentsToSave = allComments.slice(0, totalCount);

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            scannedCommentsList: commentsToSave,
            scannedCount: totalCount
          });
        }

        // Sync directly to Spring Boot Backend
        if (commentsToSave.length > 0) {
          try {
            const syncPayload = {
              platform: 'YOUTUBE',
              channel: 'YOUTUBE',
              pageTitle: document.title || 'YouTube Studio Comments',
              pageUrl: window.location.href,
              comments: commentsToSave.map(c => ({
                id: c.id,
                authorName: c.authorName || 'Khán giả YouTube',
                authorAvatar: c.authorAvatar || '',
                message: c.message || '',
                publishedAt: c.publishedAt || 'Vừa xong',
                timeText: c.publishedAt || 'Vừa xong',
                timestampMs: c.timestampMs || Date.now(),
                likeCount: 0,
                videoTitle: c.videoTitle || 'Video YouTube Lá Đỏ',
                videoUrl: c.postUrl || window.location.href,
                commentUrl: c.postUrl || window.location.href
              }))
            };

            // 1. Send via background script (bypasses CSP & Mixed Content)
            try {
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: 'SYNC_SCANNED_COMMENTS', payload: syncPayload }, (res) => {
                  console.log('[Lá Đỏ YouTube AI] Background sync response:', res);
                });
              }
            } catch (e) {}

            // 2. Direct fetch fallback
            try {
              await fetch('http://localhost:8080/api/admin/marketing/comments/sync-scanned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(syncPayload)
              });
            } catch (directErr) {
              console.debug('[Lá Đỏ YouTube AI] Direct fetch notice (handled via background):', directErr);
            }
          } catch (syncErr) {
            console.warn('[Lá Đỏ YouTube AI] Lỗi gửi backend:', syncErr);
          }
        }

        if (banner) {
          if (commentsToSave.length > 0) {
            banner.style.border = '2px solid #10b981';
            banner.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)';
            banner.innerHTML = `
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">🎉</span>
                <div>
                  <strong style="font-size:15px; color:#6ee7b7;">ĐÃ QUÉT & ĐỒNG BỘ YOUTUBE THÀNH CÔNG!</strong>
                  <div style="font-size:12px; color:#cbd5e1;">Đã lưu <b>${commentsToSave.length}</b> bình luận vào Hệ thống Quản trị.</div>
                </div>
              </div>
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button id="lado-yt-btn-back" style="flex:1.2; background:#10b981; color:#022c22; font-weight:bold; border:none; border-radius:8px; padding:9px 14px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px;">🏠 Về Dashboard</button>
                <button id="lado-yt-btn-close" style="flex:1; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:9px 12px; cursor:pointer; font-size:13px;">✖ Đóng Tab</button>
              </div>
              <div id="lado-yt-countdown" style="font-size:11px; color:#94a3b8; text-align:center;">Tự động chuyển về Dashboard sau 3s...</div>
            `;
          } else {
            banner.style.border = '2px solid #f59e0b';
            banner.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.4)';
            banner.innerHTML = `
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">ℹ️</span>
                <div>
                  <strong style="font-size:14px; color:#fde68a;">KÊNH CHƯA CÓ BÌNH LUẬN NÀO</strong>
                  <div style="font-size:12px; color:#cbd5e1;">Hiện không tìm thấy bình luận trên bộ lọc kênh YouTube này.</div>
                </div>
              </div>
              <div style="font-size:12px; color:#94a3b8; background:rgba(255,255,255,0.06); padding:8px 10px; border-radius:8px; line-height:1.4;">
                💡 <b>Mẹo:</b> Bạn có thể dán trực tiếp link Video YouTube bất kỳ vào ô link trên Dashboard để quét bình luận của video đó nhé!
              </div>
              <div style="display:flex; gap:8px; margin-top:4px;">
                <button id="lado-yt-btn-back" style="flex:1.2; background:#f59e0b; color:#000; font-weight:bold; border:none; border-radius:8px; padding:9px 14px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px;">🏠 Về Dashboard</button>
                <button id="lado-yt-btn-close" style="flex:1; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:9px 12px; cursor:pointer; font-size:13px;">✖ Đóng Tab</button>
              </div>
              <div id="lado-yt-countdown" style="font-size:11px; color:#94a3b8; text-align:center;">Tự động chuyển về Dashboard sau 4s...</div>
            `;
          }

          function triggerReturnToDashboard() {
            try {
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: 'RETURN_TO_DASHBOARD' });
              }
            } catch (e) {}
            try { window.close(); } catch (e) {}
            setTimeout(() => {
              window.location.href = 'http://localhost:5173/admin/marketing/engagement-inbox';
            }, 300);
          }

          const btnBack = document.getElementById('lado-yt-btn-back');
          if (btnBack) {
            btnBack.addEventListener('click', triggerReturnToDashboard);
          }
          const btnClose = document.getElementById('lado-yt-btn-close');
          if (btnClose) {
            btnClose.addEventListener('click', triggerReturnToDashboard);
          }

          let leftSec = commentsToSave.length > 0 ? 3 : 4;
          const cdTimer = setInterval(() => {
            leftSec--;
            const cdEl = document.getElementById('lado-yt-countdown');
            if (cdEl) cdEl.textContent = `Tự động chuyển về Dashboard sau ${leftSec}s...`;
            if (leftSec <= 0) {
              clearInterval(cdTimer);
              triggerReturnToDashboard();
            }
          }, 1000);
        }
      } catch (err) {
        console.error('[Lá Đỏ YouTube AI] Lỗi auto-scan:', err);
        if (banner) {
          banner.innerHTML = `
            <div style="color:#f87171; font-weight:bold;">⚠️ Không thể hoàn tất quét bình luận YouTube</div>
            <div style="font-size:12px; color:#e2e8f0;">${err.message || 'Lỗi không xác định'}</div>
          `;
        }
      }
    })();
  }

  // Run on startup with staggered timers
  setTimeout(checkAndTriggerAutoScanYouTube, 600);
  setTimeout(checkAndTriggerAutoScanYouTube, 1800);
  setTimeout(checkAndTriggerAutoScanYouTube, 3600);
})();
