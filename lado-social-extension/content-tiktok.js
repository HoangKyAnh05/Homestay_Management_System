(() => {
  // Cache auto-scan and highlight parameters immediately before SPA router rewrites the URL
  try {
    const fullHref = window.location.href;
    if (fullHref.includes('lado_auto_scan=true') || window.location.hash.includes('lado_auto_scan=true')) {
      sessionStorage.setItem('lado_auto_scan_tt', 'true');
    }
    if (fullHref.includes('reset=true') || window.location.hash.includes('reset=true')) {
      sessionStorage.setItem('lado_reset_tt', 'true');
    }
    const matchAuthor = fullHref.match(/[?&#]lado_author=([^&#]+)/i);
    const matchComment = fullHref.match(/[?&#]lado_comment=([^&#]+)/i);
    if (matchAuthor && matchAuthor[1]) {
      sessionStorage.setItem('lado_pending_author_tt', decodeURIComponent(matchAuthor[1]));
    }
    if (matchComment && matchComment[1]) {
      sessionStorage.setItem('lado_pending_comment_tt', decodeURIComponent(matchComment[1]));
    }
  } catch (e) {}

  console.log('[Lá Đỏ TikTok AI] Universal TikTok & TikTok Studio Content Script Active (v1.0.6).');

  // 1. Check for pending comment highlight on TikTok page load
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
        const cachedAuthor = sessionStorage.getItem('lado_pending_author_tt');
        const cachedComment = sessionStorage.getItem('lado_pending_comment_tt');
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

  function checkPendingHighlight() {
    const fromHash = getHashHighlightTarget();
    if (fromHash && (fromHash.commentText || fromHash.authorName)) {
      pollAndHighlightTikTokComment(fromHash.commentText, fromHash.authorName);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['pendingHighlight'], (res) => {
        if (res && res.pendingHighlight) {
          const { commentText, authorName, timestamp } = res.pendingHighlight;
          if (Date.now() - timestamp < 180000) {
            chrome.storage.local.remove(['pendingHighlight']);
            pollAndHighlightTikTokComment(commentText, authorName);
          }
        }
      });
    }
  }

  function pollAndHighlightTikTokComment(commentText, authorName) {
    const clean = (commentText || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
    const cleanAuthor = (authorName || '').replace(/^[@\s]+/, '').trim().toLowerCase();
    if (!clean && !cleanAuthor) return;

    let tries = 0;
    const pollTimer = setInterval(() => {
      tries++;
      const commentNodes = getAllTikTokCommentNodes();

      let targetComment = null;
      for (const node of commentNodes) {
        const t = (node.innerText || node.textContent || '').toLowerCase();
        if (clean && (t.includes(clean) || (clean.length >= 4 && clean.includes(t)))) {
          targetComment = node;
          break;
        }
        if (cleanAuthor && cleanAuthor !== 'người dùng tiktok' && cleanAuthor.length >= 3 && t.includes(cleanAuthor)) {
          targetComment = node;
          break;
        }
      }

      if (!targetComment) {
        const rows = Array.from(document.querySelectorAll('tr, [role="row"], li, div[class*="item"], div[class*="row"], div[data-e2e="comment-level-1"], div[data-e2e="comment-item"]'));
        for (const r of rows) {
          const t = (r.innerText || '').toLowerCase();
          if (clean && t.includes(clean)) {
            targetComment = r;
            break;
          }
          if (cleanAuthor && cleanAuthor !== 'người dùng tiktok' && cleanAuthor.length >= 3 && t.includes(cleanAuthor)) {
            targetComment = r;
            break;
          }
        }
      }

      if (targetComment) {
        clearInterval(pollTimer);
        const highlightTarget = targetComment.closest('tr, [role="row"], li, div[data-e2e="comment-level-1"], div[data-e2e="comment-item"]') || targetComment;
        highlightTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightTarget.style.transition = 'all 0.4s ease';
        highlightTarget.style.outline = '4px solid #ef4444 !important';
        highlightTarget.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.95), inset 0 0 15px rgba(239, 68, 68, 0.25) !important';
        highlightTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15) !important';
        highlightTarget.style.borderRadius = '12px !important';
        
        showTargetBadgeOnElement(highlightTarget, `🎯 BÌNH LUẬN TIKTOK CẦN TRẢ LỜI: "${(clean || authorName || '').slice(0, 35)}..."`);

        // Auto click Reply
        setTimeout(() => {
          try {
            const replyBtn = Array.from(highlightTarget.querySelectorAll('span, button, div[role="button"], a')).find(el => {
              if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return false;
              const t = (el.textContent || '').trim().toLowerCase();
              return t === 'trả lời' || t === 'phản hồi' || t === 'reply';
            });
            if (replyBtn) {
              replyBtn.click();
              debouncedInjectAllAiButtons();
            }
          } catch (e) {}
        }, 400);

        setTimeout(() => {
          highlightTarget.style.outline = '';
          highlightTarget.style.boxShadow = '';
          highlightTarget.style.backgroundColor = '';
        }, 15000);
        showInPageToast(`👀 Đã khoanh đỏ bình luận của ${authorName || 'khách'}: "${(clean || authorName || '').slice(0, 30)}..."`);
      } else {
        // If not found in early tries, scroll slightly down to trigger TikTok table virtualization
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
    }, 350);
  }

  checkPendingHighlight();
  setTimeout(checkPendingHighlight, 800);
  setTimeout(checkPendingHighlight, 2000);
  setTimeout(checkPendingHighlight, 3500);

  // 2. MutationObserver for Live In-Page AI Button Injection
  let debounceInjectTimer = null;
  function debouncedInjectAllAiButtons() {
    if (debounceInjectTimer) clearTimeout(debounceInjectTimer);
    debounceInjectTimer = setTimeout(() => {
      injectAiButtonsToTikTokComments();
      injectMainVideoAiCommentButton();
    }, 250);
  }

  if (!window.__LADO_TT_OBSERVER__) {
    window.__LADO_TT_OBSERVER__ = new MutationObserver(() => {
      debouncedInjectAllAiButtons();
    });

    if (document.body) {
      window.__LADO_TT_OBSERVER__.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        window.__LADO_TT_OBSERVER__.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
  setTimeout(debouncedInjectAllAiButtons, 800);
  setTimeout(debouncedInjectAllAiButtons, 2000);

  // 3. Helper: Check if comment is host's own reply
  function isOwnHostComment(item, authorName, commentText) {
    if (!authorName) return false;
    const cleanName = (authorName || '').trim().toLowerCase();
    const cleanMsg = (commentText || '').trim().toLowerCase();
    const brandKeywords = [
      'lá đỏ homestay', 'lá đỏ homestay sa pa', 'la do homestay official', 'lado official',
      'lado homestay', 'lá đỏ', 'quản trị viên', 'admin', 'tác giả', 'creator'
    ];
    if (brandKeywords.some(kw => cleanName === kw || cleanName.includes(kw))) return true;
    if (item && item.querySelector && item.querySelector('[data-e2e*="creator"], [class*="creator-badge"], [class*="AuthorBadge"], [data-e2e="comment-creator-tag"]')) return true;
    const selfReplySignatures = ['chào mừng bạn đến với lá đỏ', 'hẹn gặp bạn tại lá đỏ', 'cảm ơn bạn đã quan tâm'];
    if (selfReplySignatures.some(sig => cleanMsg.includes(sig))) return true;
    return false;
  }

  // Helper: Check if an element or text is only an action toolbar
  function isActionToolbarOnly(el) {
    if (!el) return true;
    const text = (typeof el === 'string' ? el : (el.innerText || el.textContent || '')).toLowerCase().replace(/[\s\d•·|^♡\-]/g, '');
    const cleaned = text.replace(/(reply|trảlời|phảnhồi|delete|xóa|like|thích|view|hide|ẩn|✨ailáđỏ|ailáđỏ|gợiýai|đangsinh|bìnhluậnai|✨bìnhluậnai|✨trảlờiai)/g, '');
    return cleaned.length === 0;
  }

  // 4. Extract Comment Info from Any TikTok Container (TikTok Studio or Video Web)
  function extractTikTokComment(node) {
    if (!node) return null;
    const txt = (node.innerText || '').trim();
    if (txt.length < 2) return null;

    if (isActionToolbarOnly(txt)) return null;

    const lines = txt.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    let authorName = '';
    let publishedAt = 'Gần đây';
    let commentText = '';
    let videoTitle = 'Video TikTok Lá Đỏ Homestay';
    let authorAvatar = '';

    // Avatar
    const avatarEl = node.querySelector('img[src*="avatar"], img[src*="tiktokcdn"], img[src*="byteoversea"], img[src*="ibyteimg"], img');
    if (avatarEl && avatarEl.src && !avatarEl.src.includes('data:image/svg')) {
      authorAvatar = avatarEl.src;
    }

    // Parse text lines:
    // Format on TikTok Studio:
    // Line 0: "baohuthichiu · 1h ago"
    // Line 1: "Hii"
    // Line 2: "♡ 0"
    // Line 3: "Reply"
    // Line 4: "Delete"
    // Line 5: "Lá Đỏ Homestay" (video info)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isActionToolbarOnly(line) || /^[\d\s•·|^♡\-_~@]+$/.test(line)) continue;

      // Line with author · time
      if (line.includes('·') || line.includes('•')) {
        const parts = line.split(/[·•]/);
        if (parts.length >= 2 && !authorName) {
          authorName = parts[0].trim();
          publishedAt = parts[1].trim();
          continue;
        }
      }

      // Line is relative time only
      const isTimeOnly = /^\d+\s*(s|m|h|d|w|min|hr|day|week|phút|giờ|ngày|giây)\s*(ago|trước)?$/i.test(line) ||
                         line.toLowerCase() === 'just now' || line.toLowerCase() === 'vừa xong';
      if (isTimeOnly) {
        publishedAt = line;
        continue;
      }

      // Author line
      if (!authorName && line.length < 40 && !line.toLowerCase().includes('homestay')) {
        authorName = line;
        continue;
      }

      // Comment message line
      if (!commentText) {
        if (!isActionToolbarOnly(line) && !line.startsWith('♡') && line !== 'Delete' && line !== 'Reply') {
          commentText = line;
        }
      }
    }

    // Fallbacks
    if (!authorName) {
      const authorEl = node.querySelector('span[data-e2e="comment-username-1"], [class*="username" i], [class*="userName" i], [class*="nickname" i], strong, b');
      if (authorEl && !isActionToolbarOnly(authorEl.innerText)) {
        authorName = authorEl.innerText.trim();
      }
    }
    if (!authorName) authorName = 'Người dùng TikTok';

    if (!commentText) {
      const textEl = node.querySelector('p, span[class*="text" i], div[class*="content" i], div[class*="text" i]');
      if (textEl) {
        const t = textEl.innerText.trim();
        if (t && t !== authorName && t !== publishedAt && !isActionToolbarOnly(t) && !t.startsWith('♡')) {
          commentText = t;
        }
      }
    }

    if (!commentText) return null;

    // Video URL & title
    const videoLink = node.querySelector('a[href*="/video/"], a[href*="tiktok.com"], a');
    let postUrl = window.location.href;
    if (videoLink && videoLink.href) {
      postUrl = videoLink.href;
    }

    const videoTitleEl = node.querySelector('div[class*="video-title"], span[class*="video-title"], a[title]');
    if (videoTitleEl && videoTitleEl.innerText.trim()) {
      videoTitle = videoTitleEl.innerText.trim();
    } else {
      videoTitle = getTikTokVideoTitle();
    }

    return {
      authorName,
      authorAvatar,
      message: commentText,
      publishedAt,
      timeText: publishedAt,
      timestampMs: parseRelativeTimeStringToMs(publishedAt),
      videoTitle,
      postUrl,
      platform: 'TIKTOK'
    };
  }

  // 5. Universal Comment Containers Finder
  function getAllTikTokCommentNodes() {
    const candidates = [];

    // Method 1: Find every leaf element that has text 'Reply' / 'Trả lời'
    const replyLeaves = Array.from(document.querySelectorAll('span, button, a, div')).filter(el => {
      if (el.children.length > 0) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      const e2e = (el.getAttribute('data-e2e') || '').toLowerCase();
      return (t === 'reply' || t === 'trả lời' || e2e.includes('comment-reply')) && t.length <= 12;
    });

    replyLeaves.forEach(leaf => {
      let curr = leaf.parentElement;
      let rowCandidate = null;
      let depth = 0;

      while (curr && depth < 10 && curr !== document.body && curr !== document.documentElement) {
        const text = (curr.innerText || '').trim();
        const hasImg = !!curr.querySelector('img');

        if ((hasImg || text.length > 10) && !isActionToolbarOnly(text)) {
          rowCandidate = curr;

          const parent = curr.parentElement;
          if (parent) {
            const repliesInParent = Array.from(parent.querySelectorAll('span, button, a, div')).filter(s => {
              if (s.children.length > 0) return false;
              const st = (s.textContent || '').trim().toLowerCase();
              return st === 'reply' || st === 'trả lời';
            });
            if (repliesInParent.length > 1) {
              break;
            }
          }
        }
        curr = curr.parentElement;
        depth++;
      }

      if (rowCandidate && !candidates.includes(rowCandidate)) {
        candidates.push(rowCandidate);
      }
    });

    // Method 2: Standard selectors for table rows / comment list items
    const selectors = [
      'tr',
      '[role="row"]',
      'div[class*="semi-table-row"]',
      'div[class*="arco-table-row"]',
      'div[class*="table-row"]',
      'div[class*="comment-row"]',
      'div[class*="CommentItem"]',
      'div[class*="commentItem"]',
      'div[class*="comment-item"]',
      'div[class*="studio-comment"]',
      'div[data-e2e*="comment-level"]',
      'div[data-e2e*="comment-item"]'
    ];

    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          const txt = (el.innerText || '').trim();
          if (txt.length > 5 && !isActionToolbarOnly(txt) && !candidates.includes(el)) {
            candidates.push(el);
          }
        });
      } catch (e) {}
    });

    // Deduplicate: Filter out containers that contain other candidate rows
    const finalRows = candidates.filter(r => {
      const containsOtherRow = candidates.some(other => other !== r && r.contains(other) && (other.innerText || '').length > 5);
      return !containsOtherRow;
    });

    return finalRows;
  }

  // 6. Universal Video Title Extractor
  function getTikTokVideoTitle() {
    const currentUrl = window.location.href;

    if (currentUrl.includes('/tiktokstudio/comment/')) {
      const parts = currentUrl.split('/tiktokstudio/comment/')[1]?.split('?')[0];
      const descEl = document.querySelector('div[class*="video-title"], div[class*="post-title"], h1, h2, div[class*="info"] span');
      const customTitle = descEl ? descEl.innerText.trim() : '';
      return customTitle || `TikTok Studio - Video #${parts || ''}`;
    }

    if (currentUrl.includes('/tiktokstudio/comment') || currentUrl.includes('/creator-center/')) {
      return 'TikTok Studio - Quản lý bình luận';
    }

    const descEl = document.querySelector('h1[data-e2e="browse-video-desc"], div[data-e2e="browse-video-desc"], div[data-e2e="video-desc"], span[class*="SpanText"], span[data-e2e="video-desc"]');
    return descEl ? descEl.innerText.trim() : 'Video TikTok Lá Đỏ Homestay Sa Pa';
  }

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

    const mdMatch = lower.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (mdMatch) {
      const currentYear = new Date().getFullYear();
      const m = parseInt(mdMatch[1], 10) - 1;
      const d = parseInt(mdMatch[2], 10);
      const parsed = new Date(currentYear, m, d).getTime();
      if (!isNaN(parsed)) return parsed;
    }

    const match = lower.match(/(\d+)\s*(phút|giờ|ngày|tháng|năm|tuần|giây|m|h|d|w|s|yr|min|hr|day|week|month|year)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      if (unit === 's' || unit.startsWith('giây') || unit.startsWith('sec')) return now - val * 1000;
      if (unit.startsWith('ph') || unit === 'm' || unit.startsWith('min')) return now - val * 60 * 1000;
      if (unit.startsWith('gi') || unit === 'h' || unit.startsWith('hr')) return now - val * 3600 * 1000;
      if (unit.startsWith('ng') || unit === 'd' || unit.startsWith('day')) return now - val * 24 * 3600 * 1000;
      if (unit.startsWith('tu') || unit === 'w' || unit.startsWith('week')) return now - val * 7 * 24 * 3600 * 1000;
      if (unit.startsWith('th') || unit.startsWith('month')) return now - val * 30 * 24 * 3600 * 1000;
      if (unit.startsWith('n') || unit === 'yr' || unit.startsWith('year')) return now - val * 365 * 24 * 3600 * 1000;
    }

    const parsedDirect = Date.parse(str);
    if (!isNaN(parsedDirect) && parsedDirect > 1000000000000) return parsedDirect;

    return now;
  }

  function enforceTikTokCharLimit(text, maxChars = 135) {
    if (!text) return '';
    let clean = text.trim();
    if (clean.length <= maxChars) return clean;

    const sub = clean.slice(0, maxChars);
    const lastPunct = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('!'), sub.lastIndexOf('?'), sub.lastIndexOf('~'));
    if (lastPunct > 50) {
      return clean.slice(0, lastPunct + 1).trim();
    }

    const lastSpace = sub.lastIndexOf(' ');
    if (lastSpace > 50) {
      return clean.slice(0, lastSpace).trim() + ' nha! ❤️';
    }

    return sub.trim();
  }

  // 7. Inject AI Reply Button next to EACH TikTok "Reply" button & inside inline reply inputs
  function injectAiButtonsToTikTokComments() {
    // 1. Clean up duplicate buttons if any exist
    document.querySelectorAll('.lado-ai-reply-btn').forEach(btn => {
      const parent = btn.parentElement;
      if (parent) {
        const siblingBtns = Array.from(parent.querySelectorAll('.lado-ai-reply-btn'));
        if (siblingBtns.length > 1) {
          siblingBtns.slice(1).forEach(b => b.remove());
        }
      }
    });

    // 2. Strategy A: Find all leaf "Reply" / "Trả lời" elements
    const allLeafElements = Array.from(document.querySelectorAll('span, button, a, div[role="button"]'));

    allLeafElements.forEach((el) => {
      if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return;
      if (el.closest('#lado-tt-auto-scan-banner')) return;

      const txt = (el.textContent || '').trim().toLowerCase();
      const isReplyTrigger = (txt === 'reply' || txt === 'trả lời' || txt === 'phản hồi') && txt.length <= 12;
      const isDataE2e = (el.getAttribute('data-e2e') || '').includes('comment-reply');

      if (!isReplyTrigger && !isDataE2e) return;

      // Ensure this is the innermost leaf node
      const hasNestedReply = Array.from(el.querySelectorAll('span, button, a, div')).some(c => {
        const ct = (c.textContent || '').trim().toLowerCase();
        return ct === 'reply' || ct === 'trả lời' || ct === 'phản hồi';
      });
      if (hasNestedReply) return;

      // Find the parent comment container row
      const commentContainer = el.closest('tr, [role="row"], li, div[class*="semi-table-row"], div[class*="arco-table-row"], div[class*="table-row"], div[class*="CommentItem"], div[class*="commentItem"], div[class*="comment-item"], div[class*="commentRow"], div[data-e2e*="comment"]') || el.parentElement?.parentElement;

      // If this comment container already has an AI button, SKIP!
      if (commentContainer && commentContainer.querySelector('.lado-ai-reply-btn')) return;

      const parent = el.parentElement;
      if (!parent || parent.querySelector('.lado-ai-reply-btn')) return;

      const info = extractTikTokComment(commentContainer) || { authorName: 'Khách', message: '' };
      if (isOwnHostComment(commentContainer, info.authorName, info.message)) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lado-ai-reply-btn lado-tt';
      btn.innerHTML = `<span>✨ Bình luận AI</span>`;
      btn.title = `Tự động trả lời bình luận của ${info.authorName || 'khách'} bằng AI Lá Đỏ`;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        btn.classList.add('loading');
        btn.innerHTML = `<span>⏳ Đang sinh & gửi...</span>`;

        try { el.click(); } catch (err) {}

        const videoTitle = getTikTokVideoTitle();
        const targetCommentText = info.message || (commentContainer ? (commentContainer.innerText || '').slice(0, 100) : '');

        chrome.runtime.sendMessage({
          action: 'GENERATE_AI_REPLY',
          payload: {
            postTitle: videoTitle,
            postContent: 'Lá Đỏ Homestay Sa Pa view thung lũng Mường Hoa & cafe săn mây',
            commentText: targetCommentText,
            authorName: info.authorName || 'Khách',
            tone: 'WARM'
          }
        }, (response) => {
          btn.classList.remove('loading');
          btn.innerHTML = `<span>✨ Bình luận AI</span>`;

          if (response && response.reply) {
            const boundedReply = enforceTikTokCharLimit(response.reply, 135);
            setTimeout(() => {
              fillAndSubmitTikTokComment(commentContainer, boundedReply);
            }, 300);
          }
        });
      });

      if (el.nextSibling) {
        parent.insertBefore(btn, el.nextSibling);
      } else {
        parent.appendChild(btn);
      }
    });

    // Clean up any rogue long red buttons inside input cards
    document.querySelectorAll('.lado-inline-reply-ai-btn, .lado-main-ai-btn').forEach(b => b.remove());
  }

  // 8. Universal TikTok Input Filler & Submitter (Strictly bounded to comment input, never hits global upload buttons)
  function fillAndSubmitTikTokComment(commentContainer, replyText) {
    const safeText = enforceTikTokCharLimit(replyText, 135);
    let attempts = 0;

    const fillInterval = setInterval(() => {
      attempts++;

      let inputEl = null;
      if (commentContainer) {
        inputEl = commentContainer.querySelector('div[contenteditable="true"], textarea, input[type="text"], div[role="textbox"]');
      }
      if (!inputEl) {
        // Search inside active reply forms / comment boxes only
        const activeBoxes = Array.from(document.querySelectorAll('div[class*="ReplyInput" i], div[class*="comment-input" i], div[class*="CommentInput" i], div[data-e2e="comment-input"]'));
        for (const box of activeBoxes) {
          const found = box.querySelector('div[contenteditable="true"], textarea, input[type="text"], div[role="textbox"]');
          if (found) {
            inputEl = found;
            break;
          }
        }
      }
      if (!inputEl) {
        inputEl = document.querySelector('div[contenteditable="true"]:not([class*="upload"]), textarea[placeholder*="comment" i], textarea[placeholder*="bình luận" i], textarea[placeholder*="reply" i]');
      }

      if (inputEl) {
        clearInterval(fillInterval);
        inputEl.focus();

        if (inputEl.getAttribute('contenteditable') === 'true' || inputEl.isContentEditable) {
          inputEl.innerHTML = '';
          document.execCommand('insertText', false, safeText);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          inputEl.value = safeText;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(() => {
          let submitBtn = null;
          const inputContainer = inputEl.closest('div[class*="Input" i], div[class*="wrapper" i], div[class*="container" i], div[class*="card" i], form') || inputEl.parentElement;
          const searchScopes = [commentContainer, inputContainer].filter(Boolean);

          for (const scope of searchScopes) {
            const candidates = Array.from(scope.querySelectorAll('button, div[role="button"], svg, span')).filter(el => {
              if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return false;
              if (el.closest('nav, aside, header, #sidebar, .semi-navigation, [class*="navigation" i], [class*="sidebar" i], [class*="menu" i]')) return false;
              const text = (el.textContent || '').trim().toLowerCase();
              const aria = (el.getAttribute('aria-label') || '').toLowerCase();
              const e2e = (el.getAttribute('data-e2e') || '').toLowerCase();
              const className = (typeof el.className === 'string' ? el.className : '').toLowerCase();

              if (text.includes('upload') || text.includes('tải lên') || aria.includes('upload') || className.includes('upload')) return false;
              
              return (
                e2e.includes('comment-post') ||
                text === 'post' || text === 'đăng' || text === 'send' || text === 'gửi' ||
                aria.includes('post') || aria.includes('send') || aria.includes('gửi') || aria.includes('submit') ||
                className.includes('send') || className.includes('submit') || className.includes('postbutton')
              );
            });

            if (candidates.length > 0) {
              submitBtn = candidates[0];
              break;
            }
          }

          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            showInPageToast(`🚀 Đã gửi phản hồi TikTok: "${safeText.slice(0, 35)}..."`);
            chrome.runtime.sendMessage({ action: 'RECORD_REPLY_SUCCESS' });
          } else {
            const enterEvt = new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              keyCode: 13,
              key: 'Enter'
            });
            inputEl.dispatchEvent(enterEvt);
            showInPageToast(`✍️ Đã điền sẵn nội dung AI vào ô bình luận: "${safeText.slice(0, 35)}..."`);
          }
        }, 450);
      } else if (attempts >= 15) {
        clearInterval(fillInterval);
        showInPageToast(`📋 Gợi ý AI: "${safeText}" (Đã sao chép vào bộ nhớ tạm)`);
        try { navigator.clipboard.writeText(safeText); } catch (e) {}
      }
    }, 200);
  }

  function showInPageToast(msg) {
    const existing = document.getElementById('lado-inpage-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'lado-inpage-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #fff;
      padding: 12px 20px;
      border-radius: 12px;
      border-left: 4px solid #fe0979;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      z-index: 9999999;
      font-size: 13.5px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: ladoSlideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>🍁</span> <span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // 9. Message Listener for Manual Popup or Background Scan Requests
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCAN_COMMENTS') {
      const commentNodes = getAllTikTokCommentNodes();
      const collected = [];
      commentNodes.forEach((node, idx) => {
        const info = extractTikTokComment(node);
        if (info && info.message && !isOwnHostComment(node, info.authorName, info.message)) {
          info.id = `tt_${idx}_${Date.now()}`;
          collected.push(info);
        }
      });
      sendResponse({ success: true, comments: collected, count: collected.length });
      return true;
    }

    if (request.action === 'TRIGGER_AUTO_SCAN') {
      window.__LADO_TT_SCANNING_STARTED__ = false;
      checkAndTriggerAutoScanTikTok(true);
      sendResponse({ success: true });
      return true;
    }
  });

  // 10. 1-CLICK AUTO-SCAN & SYNC TIÊU CHUẨN CHO TIKTOK STUDIO & WEB
  function checkAndTriggerAutoScanTikTok(force = false) {
    if (window.top !== window.self) return;

    const urlParams = new URLSearchParams(window.location.search);
    let isUrlScan = force || urlParams.get('lado_auto_scan') === 'true' || window.location.hash.includes('lado_auto_scan=true') || window.location.href.includes('lado_auto_scan');
    let isUrlReset = urlParams.get('reset') === 'true' || window.location.hash.includes('reset=true');

    try {
      if (sessionStorage.getItem('lado_auto_scan_tt') === 'true') isUrlScan = true;
      if (sessionStorage.getItem('lado_reset_tt') === 'true') isUrlReset = true;
    } catch (e) {}

    if (isUrlScan) {
      executeTikTokAutoScan(isUrlReset);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['pendingAutoScan'], (res) => {
        if (res && res.pendingAutoScan) {
          const { platform, reset, timestamp } = res.pendingAutoScan;
          if (platform === 'TIKTOK' && Date.now() - timestamp < 120000) {
            chrome.storage.local.remove(['pendingAutoScan']);
            executeTikTokAutoScan(reset !== false);
          }
        }
      });
    }
  }

  function executeTikTokAutoScan(isReset = true) {
    if (window.top !== window.self) return;
    if (window.__LADO_TT_SCANNING_STARTED__) return;
    window.__LADO_TT_SCANNING_STARTED__ = true;

    try {
      sessionStorage.removeItem('lado_auto_scan_tt');
      sessionStorage.removeItem('lado_reset_tt');
    } catch (e) {}

    console.log('[Lá Đỏ TikTok AI] Kích hoạt chế độ 1-Click Auto Scan & Sync TikTok...');

    // Reset local data if requested
    if (isReset) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['scannedCommentsList', 'scannedCount']);
      }
    }

    // In-page progress banner
    const existingBanner = document.getElementById('lado-tt-auto-scan-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'lado-tt-auto-scan-banner';
    banner.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999999;
      background: #0f172a;
      color: #ffffff;
      border: 2px solid #fe0979;
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(254, 9, 121, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 340px;
      max-width: 440px;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="lado-spinner-tt" style="width:20px; height:20px; border:3px solid rgba(254,9,121,0.3); border-top-color:#fe0979; border-radius:50%; animation:ladoSpinTT 0.8s linear infinite;"></div>
        <strong style="font-size:15px; color:#fbcfe8;">🎵 LÁ ĐỎ TIKTOK AI - TỰ ĐỘNG QUÉT</strong>
      </div>
      <div id="lado-tt-scan-status-text" style="font-size:13px; color:#e2e8f0; line-height:1.5;">
        Đang tự động cuộn trang TikTok Studio, tìm kiếm và trích xuất bình luận...
      </div>
      <div style="background:rgba(255,255,255,0.1); border-radius:6px; height:6px; overflow:hidden;">
        <div id="lado-tt-scan-prog" style="background:#fe0979; width:15%; height:100%; transition:width 0.3s;"></div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `@keyframes ladoSpinTT { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    (async () => {
      try {
        const collectedMap = new Map();
        const startY = window.scrollY || document.documentElement?.scrollTop || 0;
        const progEl = document.getElementById('lado-tt-scan-prog');
        const textEl = document.getElementById('lado-tt-scan-status-text');

        function harvestTikTok() {
          const commentNodes = getAllTikTokCommentNodes();
          console.log('[Lá Đỏ TikTok AI] Số lượng comment node tìm thấy:', commentNodes.length);

          commentNodes.forEach((node) => {
            const info = extractTikTokComment(node);
            if (info && info.message && info.message.length > 0) {
              if (!isOwnHostComment(node, info.authorName, info.message)) {
                const sig = `${(info.authorName || '').trim().toLowerCase()}:::${info.message.trim().toLowerCase()}`;
                if (!collectedMap.has(sig)) {
                  info.id = `tt_${collectedMap.size}_${Date.now()}`;
                  collectedMap.set(sig, info);
                  console.log('[Lá Đỏ TikTok AI] Đã lưu bình luận:', info.authorName, '->', info.message);
                }
              }
            }
          });
        }

        harvestTikTok();

        // Deep scroll loop
        const totalSteps = 16;
        for (let s = 1; s <= totalSteps; s++) {
          window.scrollBy({ top: 500, behavior: 'instant' });
          const scrollables = Array.from(document.querySelectorAll('div[class*="table"], div[class*="container"], div[role="feed"], tbody, div[style*="overflow"]'));
          scrollables.forEach(sc => {
            if (sc && sc.scrollHeight > sc.clientHeight) {
              try { sc.scrollTop += 500; } catch (e) {}
            }
          });

          if (progEl) progEl.style.width = `${Math.min(90, Math.round((s / totalSteps) * 90))}%`;
          if (textEl) textEl.textContent = `Đang quét sâu bước ${s}/${totalSteps}... (Đã tìm thấy ${collectedMap.size} bình luận)`;

          await new Promise(r => setTimeout(r, 220));
          harvestTikTok();
        }

        window.scrollTo({ top: startY, behavior: 'instant' });
        if (progEl) progEl.style.width = '100%';

        const allComments = Array.from(collectedMap.values());
        const totalCount = Math.min(allComments.length, 300);
        const commentsToSave = allComments.slice(0, totalCount);

        console.log('[Lá Đỏ TikTok AI] Tổng số bình luận thu thập:', commentsToSave.length, commentsToSave);

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            scannedCommentsList: commentsToSave,
            scannedCount: totalCount
          });
        }

        // Sync to Spring Boot Backend
        try {
          const syncPayload = {
            platform: 'TIKTOK',
            channel: 'TIKTOK',
            pageTitle: document.title || 'TikTok Studio Comments',
            pageUrl: window.location.href,
            comments: commentsToSave.map(c => ({
              authorName: c.authorName || 'Người dùng TikTok',
              authorAvatar: c.authorAvatar || '',
              message: c.message || '',
              publishedAt: c.publishedAt || 'Vừa xong',
              timeText: c.publishedAt || 'Vừa xong',
              timestampMs: c.timestampMs || Date.now(),
              likeCount: c.likeCount || 0,
              videoTitle: c.videoTitle || 'Video TikTok Lá Đỏ',
              videoUrl: c.postUrl || window.location.href,
              commentUrl: c.commentUrl || window.location.href
            }))
          };

          // 1. Send via background script (bypasses CSP & Mixed Content)
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ action: 'SYNC_SCANNED_COMMENTS', payload: syncPayload }, (res) => {
                console.log('[Lá Đỏ TikTok AI] Background sync response:', res);
              });
            }
          } catch (e) {}

          // 2. Direct fetch fallback
          try {
            const res = await fetch('http://localhost:8080/api/admin/marketing/comments/sync-scanned', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload)
            });
            const resJson = await res.json();
            console.log('[Lá Đỏ TikTok AI] Kết quả đồng bộ Backend:', resJson);
          } catch (directErr) {
            console.debug('[Lá Đỏ TikTok AI] Direct fetch notice (handled via background):', directErr);
          }
        } catch (syncErr) {
          console.warn('[Lá Đỏ TikTok AI] Lỗi gửi backend:', syncErr);
        }

        if (banner) {
          banner.style.border = '2px solid #10b981';
          banner.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)';
          banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🎉</span>
              <div>
                <strong style="font-size:15px; color:#6ee7b7;">ĐÃ QUÉT & ĐỒNG BỘ TIKTOK THÀNH CÔNG!</strong>
                <div style="font-size:12px; color:#cbd5e1;">Đã lưu <b>${commentsToSave.length}</b> bình luận vào Hệ thống Quản trị.</div>
              </div>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button id="lado-btn-back-dashboard" style="flex:1.2; background:#10b981; color:#022c22; font-weight:bold; border:none; border-radius:8px; padding:9px 14px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px;">🏠 Về Dashboard</button>
              <button id="lado-btn-close-tab" style="flex:1; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:9px 12px; cursor:pointer; font-size:13px;">✖ Đóng Tab</button>
            </div>
            <div id="lado-countdown-text" style="font-size:11px; color:#94a3b8; text-align:center;">Tự động chuyển về Dashboard sau 3s...</div>
          `;

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

          const btnBack = document.getElementById('lado-btn-back-dashboard');
          if (btnBack) {
            btnBack.addEventListener('click', triggerReturnToDashboard);
          }
          const btnClose = document.getElementById('lado-btn-close-tab');
          if (btnClose) {
            btnClose.addEventListener('click', triggerReturnToDashboard);
          }

          let leftSec = 3;
          const cdTimer = setInterval(() => {
            leftSec--;
            const cdEl = document.getElementById('lado-countdown-text');
            if (cdEl) cdEl.textContent = `Tự động chuyển về Dashboard sau ${leftSec}s...`;
            if (leftSec <= 0) {
              clearInterval(cdTimer);
              triggerReturnToDashboard();
            }
          }, 1000);
        }
      } catch (err) {
        console.error('[Lá Đỏ TikTok AI] Lỗi auto-scan:', err);
        if (banner) {
          banner.innerHTML = `
            <div style="color:#f87171; font-weight:bold;">⚠️ Không thể hoàn tất quét bình luận TikTok</div>
            <div style="font-size:12px; color:#e2e8f0;">${err.message || 'Lỗi không xác định'}</div>
          `;
        }
      }
    })();
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req.action === 'HIGHLIGHT_COMMENT') {
        const { commentText, authorName } = req;
        pollAndHighlightTikTokComment(commentText, authorName);
        sendResponse({ success: true });
        return true;
      }
      if (req.action === 'TRIGGER_AUTO_SCAN') {
        window.__LADO_TT_AUTO_SCAN_EXECUTED__ = false;
        checkAndTriggerAutoScanTikTok(true);
        sendResponse({ success: true });
        return true;
      }
    });
  }

  setTimeout(checkAndTriggerAutoScanTikTok, 1500);
  setTimeout(checkAndTriggerAutoScanTikTok, 3500);
})();
