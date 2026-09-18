// Lá Đỏ Homestay Social AI Suite - Facebook Intelligent Scanner & Auto-Locator (v1.2.0)

// Cache auto-scan & reset flags immediately before SPA router changes
try {
  if (window.location.href.includes('lado_auto_scan=true') || window.location.hash.includes('lado_auto_scan=true')) {
    sessionStorage.setItem('lado_auto_scan_fb', 'true');
  }
  if (window.location.href.includes('reset=true') || window.location.hash.includes('reset=true')) {
    sessionStorage.setItem('lado_reset_fb', 'true');
  }
} catch (e) {}

console.log('[Lá Đỏ Social AI] Facebook Intelligent Script Active (v1.2.0 - Smart Permalink & Deep Locator).');

// ==========================================
// 1. AN TOÀN TRUYỀN THÔNG ĐIỆP (EXTENSION CONTEXT GUARD)
// ==========================================

function isExtensionValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
}

function safeSendMessage(message, callback) {
  if (!isExtensionValid()) {
    if (callback) callback(null);
    return;
  }
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        if (callback) callback(null);
        return;
      }
      if (callback) callback(response);
    });
  } catch (err) {
    if (callback) callback(null);
  }
}

// ==========================================
// 2. CHUẨN HÓA & TRÍCH XUẤT URL BÀI VIẾT FACEBOOK (CHÍNH XÁC 100%)
// ==========================================

function cleanFacebookUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, 'https://www.facebook.com').href;
    const u = new URL(fullUrl);

    // Remove FB tracking params
    const trackingKeys = [
      '__cft__[0]', '__cft__', '__tn__', 'notif_id', 'notif_t', 'ref', 'mibextid',
      'rdid', 'epa', 'sfnsn', 'fs', 'locale', 'entry_point', 's', 'extid'
    ];
    trackingKeys.forEach(k => u.searchParams.delete(k));
    for (const p of Array.from(u.searchParams.keys())) {
      if (p.startsWith('__cft') || p.startsWith('__tn') || p.startsWith('tracking') || p.startsWith('fbclid')) {
        u.searchParams.delete(p);
      }
    }
    return u.toString();
  } catch (e) {
    return rawUrl;
  }
}

/**
 * Chuẩn hóa mọi link bài viết/Reel/Video Facebook thành Link Trực Tiếp (Direct Permalink).
 * Tự động loại bỏ link trang cá nhân của người comment (e.g. /vanmat.hoang.3).
 */
function normalizeFacebookPostUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const clean = rawUrl.trim();
    if (clean.includes('/people/') || clean.includes('/messages') || clean.includes('/notifications') || clean.includes('/friends')) {
      return '';
    }

    const full = clean.startsWith('http') ? clean : new URL(clean, 'https://www.facebook.com').href;
    const u = new URL(full);
    const path = u.pathname;

    // 1. Reel / Reels / Share Reel
    const reelMatch = path.match(/\/(?:reel|reels|share\/r)\/(\d+)/i) || u.search.match(/reel_id=(\d+)/i);
    if (reelMatch && reelMatch[1]) {
      return `https://www.facebook.com/reel/${reelMatch[1]}`;
    }

    // 2. Watch / Video
    const videoMatch = path.match(/\/videos\/(\d+)/i) || u.searchParams.get('v');
    if (videoMatch) {
      const vId = typeof videoMatch === 'string' ? videoMatch : videoMatch[1];
      if (vId && /^\d+$/.test(vId)) {
        return `https://www.facebook.com/watch/?v=${vId}`;
      }
    }

    // 3. Permalink / Story FBID
    const storyFbid = u.searchParams.get('story_fbid') || u.searchParams.get('fbid');
    const pageId = u.searchParams.get('id') || '61590865271672';
    if (storyFbid && /^\d+$/.test(storyFbid)) {
      return `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${pageId}`;
    }

    // 4. Direct Post / Share Post
    const postMatch = path.match(/\/(?:posts|share\/p)\/([a-zA-Z0-9_-]+)/i);
    if (postMatch && postMatch[1]) {
      return cleanFacebookUrl(full);
    }

    // 5. Photo permalink
    if (path.includes('photo') && (u.searchParams.has('fbid') || u.searchParams.has('set'))) {
      return cleanFacebookUrl(full);
    }

    // Reject user profile URLs like /vanmat.hoang.3 or /profile.php without story_fbid
    if (path === '/profile.php' && !u.searchParams.has('story_fbid')) {
      return '';
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 1 && !segments[0].includes('post') && !segments[0].includes('reel')) {
      return '';
    }

    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Trích xuất URL bài viết/Reel bao quanh comment này trong cây DOM.
 */
function extractPostUrlForComment(commentEl) {
  if (!commentEl) return cleanFacebookUrl(window.location.href);

  // 1. Kiểm tra các anchor bên trong comment
  const commentAnchors = Array.from(commentEl.querySelectorAll('a[role="link"], a[href]'));
  for (const a of commentAnchors) {
    const rawHref = a.href || a.getAttribute('href') || '';
    const norm = normalizeFacebookPostUrl(rawHref);
    if (norm) return norm;
  }

  // 2. Leo ngược cây DOM tìm post card / Reel container (tối đa 30 cấp)
  let curr = commentEl.parentElement;
  let postUrlFound = null;
  let levels = 0;

  while (curr && curr !== document.body && curr !== document.documentElement && levels < 30) {
    levels++;

    const role = curr.getAttribute('role');
    if (role === 'feed' || role === 'main' || curr.id === 'facebook') break;

    // A. Ưu tiên Reel anchors trước
    const reelAnchors = Array.from(curr.querySelectorAll('a[href*="/reel/"], a[href*="/reels/"], a[href*="/share/r/"], a[href*="reel_id="]'));
    for (const a of reelAnchors) {
      const norm = normalizeFacebookPostUrl(a.href || a.getAttribute('href') || '');
      if (norm) {
        postUrlFound = norm;
        break;
      }
    }
    if (postUrlFound) break;

    // B. Video / Watch anchors
    const videoAnchors = Array.from(curr.querySelectorAll('a[href*="/watch"], a[href*="/videos/"]'));
    for (const a of videoAnchors) {
      const norm = normalizeFacebookPostUrl(a.href || a.getAttribute('href') || '');
      if (norm) {
        postUrlFound = norm;
        break;
      }
    }
    if (postUrlFound) break;

    // C. Permalink / Post anchors
    const postAnchors = Array.from(curr.querySelectorAll('a[href*="/posts/"], a[href*="story_fbid="], a[href*="permalink.php"], a[href*="/share/p/"]'));
    for (const a of postAnchors) {
      const norm = normalizeFacebookPostUrl(a.href || a.getAttribute('href') || '');
      if (norm) {
        postUrlFound = norm;
        break;
      }
    }
    if (postUrlFound) break;

    // D. Timestamp anchors trong header bài viết
    const timeAnchors = Array.from(curr.querySelectorAll(
      'a[aria-label*="giờ"], a[aria-label*="phút"], a[aria-label*="ngày"], a[aria-label*="tháng"], a[aria-label*="vừa xong"], a[aria-label*="hôm qua"], span[id] a'
    ));
    for (const ta of timeAnchors) {
      const norm = normalizeFacebookPostUrl(ta.href || ta.getAttribute('href') || '');
      if (norm) {
        postUrlFound = norm;
        break;
      }
    }
    if (postUrlFound) break;

    // E. Tất cả anchor hợp lệ trong container
    const allAnchors = Array.from(curr.querySelectorAll('a[role="link"], a[href]'));
    for (const a of allAnchors) {
      const norm = normalizeFacebookPostUrl(a.href || a.getAttribute('href') || '');
      if (norm) {
        postUrlFound = norm;
        break;
      }
    }
    if (postUrlFound) break;

    curr = curr.parentElement;
  }

  if (postUrlFound) return postUrlFound;

  // 3. Nếu đang ở trang đơn (Reel/Post page), lấy chính URL hiện tại nếu hợp lệ
  const curNorm = normalizeFacebookPostUrl(window.location.href);
  if (curNorm) return curNorm;

  // Fallback về trang Fanpage hiện tại
  return cleanFacebookUrl(window.location.href);
}

function getExactCommentContainer(replyBtn) {
  if (!replyBtn) return null;
  const art = replyBtn.closest('div[role="article"]') || replyBtn.closest('li[role="article"]') || replyBtn.closest('li');
  if (art) return art;

  let curr = replyBtn.parentElement;
  let levels = 0;
  while (curr && curr !== document.body && levels < 12) {
    levels++;
    if (curr.getAttribute('role') === 'article' || curr.tagName === 'LI') return curr;
    const role = curr.getAttribute('role');
    if (role === 'dialog' || role === 'feed' || role === 'main') break;
    curr = curr.parentElement;
  }
  return replyBtn.parentElement?.parentElement?.parentElement?.parentElement || null;
}

// ==========================================
// 3. XỬ LÝ & LỌC TÊN TÁC GIẢ VÀ NỘI DUNG BÌNH LUẬN (CHÍNH XÁC 100%)
// ==========================================

function cleanAuthorString(raw) {
  if (!raw) return 'Khách hàng';
  return raw
    .replace(/·\s*(tác giả|author|top fan|người theo dõi|follower)/gi, '')
    .replace(/(tác giả|author|top fan|người theo dõi|follower)/gi, '')
    .replace(/\s*·?\s*\d+\s*(giờ|phút|ngày|tháng|năm|tuần|giây|h|m|d|w|s|hr|min|yr)\s*(trước|ago)?\b.*/gi, '')
    .replace(/\s*·?\s*(vừa xong|just now|hôm qua|yesterday)\b.*/gi, '')
    .replace(/^\s*ảnh đại diện của\s+/i, '')
    .replace(/^@/, '')
    .trim() || 'Khách hàng';
}

function isOwnOrPageFacebookComment(container, authorName, text) {
  const cleanName = (authorName || '').trim().toLowerCase();
  const cleanMsg = (text || '').trim().toLowerCase();

  // 1. Loại bỏ các widget giao diện, quảng cáo, nút quản trị hệ thống Facebook, Shopee ads
  const systemKeywords = [
    'đáng chú ý', 'quảng bá thước phim', 'quảng bá bài viết', 'tạo quảng cáo',
    'được tài trợ', 'sponsored', 'start tiktok ads', 'tiktok ads', 'quản lý trang',
    'giới thiệu', 'chi tiết', 'xem thông tin chi tiết', 'gợi ý cho bạn', 'bài viết đề xuất',
    'tin ảnh và video', 'thước phim', 'reels', 'bí quyết dành cho trang', 'cài đặt ngay',
    'tìm hiểu thêm', 'gửi tin nhắn', 'mọi người sẽ không nhìn thấy phần này', 'trừ khi bạn ghim',
    'không có thông tin chi tiết', 'travel this national day', 'cebupacificr.com',
    'canva giáo dục', 'canva.com', 'residential proxies', 'web.io', 'getstarted.tiktok.com',
    'elevenlabs.io', 'đăng ký canva', 'shopee', 'shopeeshopee', 'lazada', 'tiki', 'suno.com', 'suno',
    'the perfect sound', 'sound for your content'
  ];

  if (systemKeywords.some(kw => cleanName.includes(kw) || cleanMsg.includes(kw))) {
    return true;
  }

  // 2. Loại bỏ các đoạn text chỉ là domain web quảng cáo (e.g. .vn, .com, canva.com, web.io, shopee.vn)
  if (
    cleanMsg === '.vn' ||
    cleanMsg === '.com' ||
    cleanMsg.startsWith('.vn') ||
    cleanMsg.startsWith('.com') ||
    /^\.?[a-z0-9-]*\.(com|io|vn|net|org|edu|ai|co|info|biz|me|store|shop)(\s+.*)?$/i.test(cleanMsg)
  ) {
    return true;
  }

  // Loại bỏ text ngắn vô nghĩa
  if (cleanMsg.replace(/[\p{P}\p{S}\s]/gu, '').length < 2) {
    return true;
  }

  // 3. Kiểm tra container có thuộc vùng quảng cáo / sidebar RightRail / header bài viết không
  if (container) {
    if (
      (container.closest && (
        container.closest('[data-pagelet="RightRail"]') ||
        container.closest('[aria-label*="Được tài trợ" i]') ||
        container.closest('[aria-label*="Sponsored" i]') ||
        container.closest('div[role="complementary"]') ||
        container.closest('div[data-ad-preview]')
      )) ||
      (container.querySelector && (
        container.querySelector('[aria-label*="Được tài trợ" i], [aria-label*="Sponsored" i], a[href*="ads/about"], a[href*="shopee.vn"], a[href*="suno.com"]')
      ))
    ) {
      return true;
    }
  }

  // 4. Tên Fanpage / Host
  const brandKeywords = [
    'lá đỏ homestay', 'la do homestay', 'lá đỏ homestay sa pa', 'lado homestay',
    'lado official', 'homestay lá đỏ', 'quản trị viên', 'admin'
  ];
  if (brandKeywords.some(kw => cleanName === kw || cleanName.includes(kw))) {
    return true;
  }

  // 4. Nội dung tự trả lời của Host
  const selfReplySignatures = [
    'chào mừng bạn đến với lá đỏ',
    'hẹn gặp bạn tại lá đỏ',
    'cảm ơn bạn đã quan tâm lá đỏ',
    'cảm ơn bạn đã quan tâm, hẹn gặp bạn tại lá đỏ',
    'để cùng ngắm mây mường hoa'
  ];
  if (selfReplySignatures.some(sig => cleanMsg.includes(sig))) {
    return true;
  }

  return false;
}

function extractAuthorNameFromElement(container) {
  if (!container) return 'Khách hàng';

  const systemBlacklist = [
    'đáng chú ý', 'quảng bá thước phim', 'quảng bá bài viết', 'tạo quảng cáo',
    'được tài trợ', 'sponsored', 'start tiktok ads', 'tiktok ads', 'quản lý trang',
    'giới thiệu', 'chi tiết', 'quản lý', 'trang chủ', 'chỉnh sửa', 'tạo bài viết',
    'bài viết', 'gợi ý cho bạn', 'bài viết đề xuất', 'thước phim'
  ];

  // 1. Anchor profile của người comment
  const anchors = Array.from(container.querySelectorAll('a[role="link"], a[href]'));
  for (const a of anchors) {
    if (a.closest('form') || a.closest('[contenteditable="true"]') || a.closest('.lado-ai-reply-btn')) continue;

    const href = (a.href || a.getAttribute('href') || '').toLowerCase();
    if (href.includes('/posts/') || href.includes('fbid=') || href.includes('story_fbid=') || href.includes('permalink.php') || href.includes('/videos/') || href.includes('/photo') || href.includes('/reel/')) {
      continue;
    }

    const t = (a.innerText || a.textContent || '').trim();
    if (t && t.length >= 2 && t.length <= 40 && !t.includes('\n')) {
      const clean = cleanAuthorString(t);
      if (clean && clean.length >= 2 && !systemBlacklist.some(sb => clean.toLowerCase() === sb || clean.toLowerCase().includes(sb))) {
        return clean;
      }
    }
  }

  // 2. Thẻ strong / bold
  const strongs = Array.from(container.querySelectorAll('strong, span.x193iq5w, span[style*="font-weight: 600"], span[style*="font-weight: bold"], h3, h4'));
  for (const s of strongs) {
    if (s.closest('form') || s.closest('[contenteditable="true"]') || s.closest('.lado-ai-reply-btn')) continue;
    const t = (s.innerText || s.textContent || '').trim();
    if (t && t.length >= 2 && t.length <= 40 && !t.includes('\n')) {
      const clean = cleanAuthorString(t);
      if (clean && clean.length >= 2 && !systemBlacklist.some(sb => clean.toLowerCase() === sb || clean.toLowerCase().includes(sb))) {
        return clean;
      }
    }
  }

  // 3. Avatar alt text
  const imgs = Array.from(container.querySelectorAll('img[src*="fbcdn"], img[src*="scontent"], image'));
  for (const img of imgs) {
    if (img.closest('form') || img.closest('[contenteditable="true"]') || img.closest('.lado-ai-reply-btn')) continue;
    const rawAlt = (img.getAttribute('alt') || img.getAttribute('aria-label') || '').trim();
    if (rawAlt) {
      const cleanAlt = cleanAuthorString(rawAlt);
      if (cleanAlt.length >= 2 && cleanAlt.length <= 40 && !systemBlacklist.some(sb => cleanAlt.toLowerCase() === sb || cleanAlt.toLowerCase().includes(sb))) {
        return cleanAlt;
      }
    }
  }

  return 'Khách hàng';
}

function extractCleanCommentText(container, authorName) {
  if (!container) return '';

  const allTextNodes = Array.from(container.querySelectorAll('div[dir="auto"], span[dir="auto"], span[lang], p'));

  const validNodes = allTextNodes.filter(node => {
    if (node.closest('.lado-ai-reply-btn') || node.classList?.contains('lado-ai-reply-btn')) return false;
    if (node.closest('button') || node.closest('div[role="button"]')) return false;
    if (node.closest('form') || node.getAttribute('contenteditable') === 'true' || node.closest('[contenteditable="true"]')) return false;

    const t = (node.innerText || node.textContent || '').trim();
    if (!t || t.length === 0) return false;

    const lower = t.toLowerCase();

    // Loại bỏ text hệ thống Facebook & quảng cáo
    const systemBlacklist = [
      'đáng chú ý', 'mọi người sẽ không nhìn thấy phần này', 'trừ khi bạn ghim',
      'không có thông tin chi tiết', 'tạo quảng cáo', 'quảng cáo bài viết',
      'quảng bá thước phim', 'quảng bá bài viết', 'được tài trợ', 'sponsored',
      'start tiktok ads', 'tiktok ads', 'getstarted.tiktok.com', 'elevenlabs.io',
      'bí quyết dành cho trang', 'bài viết đề xuất',
      'quản lý trang', 'chỉnh sửa chi tiết', 'thêm tiểu sử', 'xem thông tin chi tiết',
      'ai lá đỏ', 'đang sinh', 'viết bình luận', 'bình luận dưới tên', 'đang hoạt động'
    ];
    if (systemBlacklist.some(bl => lower.includes(bl))) return false;

    if (lower === 'trả lời' || lower === 'phản hồi' || lower === 'reply') return false;
    if (lower === 'thích' || lower === 'like' || lower === 'thích phản hồi' || lower === 'chia sẻ' || lower === 'share') return false;
    if (lower === 'gửi tin nhắn' || lower === 'send message' || lower === 'ẩn' || lower === 'chỉnh sửa' || lower === 'xem thêm') return false;
    if (lower === 'tác giả' || lower === 'top fan' || lower === 'người theo dõi' || lower === 'follower' || lower === 'author') return false;
    if (/^\d+\s*(giờ|phút|ngày|tháng|năm|h|m|d|s|w|hr|min|yr)/i.test(t) || lower === 'vừa xong' || lower === 'just now') return false;

    if (authorName && authorName !== 'Khách hàng' && lower === authorName.toLowerCase()) return false;

    return true;
  });

  if (validNodes.length === 0) return '';

  const leafNodes = validNodes.filter(n => !validNodes.some(other => other !== n && other.contains(n)));
  let result = '';
  if (leafNodes.length > 0) {
    result = leafNodes.map(n => (n.innerText || n.textContent || '').trim()).join(' ').trim();
  } else {
    result = (validNodes[0].innerText || validNodes[0].textContent || '').trim();
  }

  // Loại bỏ tên tác giả bị dính đầu
  if (authorName && authorName !== 'Khách hàng') {
    const cleanAuth = authorName.replace(/^@/, '').trim();
    const authRegex = new RegExp('^@?' + cleanAuth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(•|·|-)?\\s*', 'gi');
    result = result.replace(authRegex, '');
  }

  // Loại bỏ thời gian dính đầu
  result = result.replace(/^[•·\s]*\d+\s*(phút|giờ|ngày|tháng|năm|tuần|giây|m|h|d|s|hr|min|yr)\s*(trước|ago)?\s*/gi, '');
  result = result.replace(/^[•·\s]*(vừa xong|just now|hôm qua|yesterday)\s*/gi, '');

  // Làm sạch các nút hành động hệ thống Facebook
  result = result
    .replace(/✨|🍁/gu, '')
    .replace(/(ai\s*lá\s*đỏ|ai\s*lado)/gi, '')
    .replace(/\d+\s*(phản hồi|câu trả lời|repl(y|ies))/gi, '')
    .replace(/(xem|view)\s+(\d+\s+)?(phản hồi|câu trả lời|repl(y|ies))/gi, '')
    .replace(/(phản hồi|reply|trả lời)/gi, '')
    .replace(/(thích|like|dislike|không thích|chia sẻ|share)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

function parseRelativeTimeStringToMs(str) {
  if (!str) return Date.now();
  const lower = str.toLowerCase().trim();
  const now = Date.now();

  if (lower.includes('vừa xong') || lower.includes('just now') || lower === 'vừa') {
    return now;
  }
  if (lower.includes('hôm qua') || lower.includes('yesterday')) {
    return now - 24 * 3600 * 1000;
  }

  const match = lower.match(/(\d+)\s*(phút|giờ|ngày|tháng|năm|tuần|m|h|d|w|yr|min|hr|day|week|month|year)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

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

  return now;
}

function extractCommentTimestamp(container) {
  if (!container) return { text: 'Gần đây', timestampMs: Date.now() };

  try {
    const candidates = Array.from(container.querySelectorAll('a[role="link"], span[dir="auto"], span, abbr'));
    for (const el of candidates) {
      if (el.closest('.lado-ai-reply-btn') || el.closest('form')) continue;

      const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
      if (aria && (/\b(lúc|\d{1,2}\s+tháng|\d{1,2}\/\d{1,2}|202\d|am|pm|hôm qua|yesterday)\b/i.test(aria))) {
        const timeMs = parseRelativeTimeStringToMs(aria);
        const display = (el.innerText || '').trim() || aria;
        return { text: display, timestampMs: timeMs };
      }

      const t = (el.innerText || el.textContent || '').trim();
      if (t && (/^\d+\s*(giờ|phút|ngày|tháng|năm|h|m|d|s|w|hr|min|yr)/i.test(t) || t.includes('vừa xong') || t.includes('just now') || t.includes('hôm qua'))) {
        const timeMs = parseRelativeTimeStringToMs(t);
        return { text: t, timestampMs: timeMs };
      }
    }
  } catch (e) {}

  return { text: 'Gần đây', timestampMs: Date.now() };
}

function isElementIndented(el) {
  if (!el) return false;
  if (el.closest && el.closest('ul ul, li li, [role="group"]')) return true;
  try {
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style) {
      const ml = parseFloat(style.marginLeft || '0');
      const pl = parseFloat(style.paddingLeft || '0');
      if (ml >= 20 || pl >= 20) return true;
    }
  } catch (e) {}
  return false;
}

function isFacebookCommentAlreadyReplied(container, authorName, commentText) {
  if (!container) return false;

  try {
    if (isElementIndented(container)) return true;
    const nextSib = container.nextElementSibling;
    if (nextSib && isElementIndented(nextSib)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// ==========================================
// 4. THU THẬP BÌNH LUẬN TRÊN TRANG (ZERO-CLICK IN-PLACE HARVEST)
// ==========================================

function harvestFacebookComments(commentsMap) {
  try {
    // A. Tìm theo nút Trả lời / Phản hồi (Bảo đảm 100% là bình luận thật của người dùng)
    const allSpans = Array.from(document.querySelectorAll('span, div[role="button"], a[role="link"]'));
    const replyButtons = allSpans.filter(el => {
      if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return false;
      if (el.closest('#lado-auto-scan-banner') || el.closest('#lado-locate-guide-banner')) return false;
      if (el.closest('[data-pagelet="RightRail"]') || el.closest('[aria-label*="Được tài trợ" i]') || el.closest('[aria-label*="Sponsored" i]') || el.closest('div[role="complementary"]')) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'trả lời' || t === 'phản hồi' || t === 'reply';
    });

    replyButtons.forEach(btn => {
      try {
        const container = getExactCommentContainer(btn);
        if (!container) return;

        const authorName = extractAuthorNameFromElement(container);
        const text = extractCleanCommentText(container, authorName);

        if (!text || text.length === 0 || text === 'trả lời' || text === 'phản hồi' || text === 'thích') return;
        if (isOwnOrPageFacebookComment(container, authorName, text)) return;

        const isReplied = isFacebookCommentAlreadyReplied(container, authorName, text);
        const timeData = extractCommentTimestamp(container);
        const avatarEl = container.querySelector('image, img[src*="fbcdn"], img[src*="scontent"], img');
        const resolvedUrl = extractPostUrlForComment(container);
        const signature = `${resolvedUrl}:::${authorName.trim().toLowerCase()}:::${text.trim().toLowerCase()}`;

        if (!commentsMap.has(signature)) {
          const idx = commentsMap.size;
          commentsMap.set(signature, {
            id: `fb_${idx}_${Date.now()}`,
            index: idx,
            message: text,
            authorName: authorName || 'Khách hàng',
            authorAvatar: avatarEl ? (avatarEl.src || avatarEl.getAttribute('xlink:href') || '') : '',
            publishedAt: timeData.text,
            timestampMs: timeData.timestampMs,
            platform: 'FACEBOOK',
            postUrl: resolvedUrl,
            replied: isReplied
          });
        }
      } catch (e) {}
    });

    // B. Tìm theo cấu trúc comment article / list item (Bắt buộc phải thuộc danh sách comment và có avatar người dùng hoặc nút thích / trả lời)
    const commentWrappers = Array.from(document.querySelectorAll('div[role="article"], li[role="article"], div[aria-label*="Bình luận" i], div[aria-label*="Comment" i]'));

    commentWrappers.forEach(cw => {
      try {
        if (cw.closest('form') || cw.querySelector('div[contenteditable="true"]')) return;
        if (cw.closest('#lado-auto-scan-banner') || cw.closest('#lado-locate-guide-banner')) return;
        if (cw.closest('[data-pagelet="RightRail"]') || cw.closest('[aria-label*="Được tài trợ" i]') || cw.closest('div[role="complementary"]') || cw.closest('div[data-ad-preview]')) return;
        if (cw.querySelectorAll('div[role="article"]').length > 2) return;

        // Bắt buộc phải có avatar người dùng hoặc nút tương tác bình luận
        const hasUserAvatar = !!cw.querySelector('image, img[src*="fbcdn"], img[src*="scontent"]');
        const hasCommentAction = Array.from(cw.querySelectorAll('span, div[role="button"], a[role="link"]')).some(b => {
          const t = (b.innerText || b.textContent || '').trim().toLowerCase();
          return t === 'thích' || t === 'like' || t === 'trả lời' || t === 'phản hồi' || t === 'reply';
        });
        if (!hasUserAvatar && !hasCommentAction) return;

        const authorName = extractAuthorNameFromElement(cw);
        const text = extractCleanCommentText(cw, authorName);

        if (!text || text.length === 0 || text === 'trả lời' || text === 'phản hồi' || text === 'thích') return;
        if (isOwnOrPageFacebookComment(cw, authorName, text)) return;

        const isReplied = isFacebookCommentAlreadyReplied(cw, authorName, text);
        const timeData = extractCommentTimestamp(cw);
        const avatarEl = cw.querySelector('image, img[src*="fbcdn"], img[src*="scontent"], img');
        const resolvedUrl = extractPostUrlForComment(cw);
        const signature = `${resolvedUrl}:::${authorName.trim().toLowerCase()}:::${text.trim().toLowerCase()}`;

        if (!commentsMap.has(signature)) {
          const idx = commentsMap.size;
          commentsMap.set(signature, {
            id: `fb_${idx}_${Date.now()}`,
            index: idx,
            message: text,
            authorName: authorName || 'Khách hàng',
            authorAvatar: avatarEl ? (avatarEl.src || avatarEl.getAttribute('xlink:href') || '') : '',
            publishedAt: timeData.text,
            timestampMs: timeData.timestampMs,
            platform: 'FACEBOOK',
            postUrl: resolvedUrl,
            replied: isReplied
          });
        }
      } catch (e) {}
    });
  } catch (err) {}
}

function scrollAllContainers(y) {
  try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) {}
  if (document.documentElement) document.documentElement.scrollTop = y;
  if (document.body) document.body.scrollTop = y;
  if (document.scrollingElement) document.scrollingElement.scrollTop = y;

  const scrollables = Array.from(document.querySelectorAll('div[role="dialog"], div[role="feed"], div[role="main"], div[data-pagelet], div[style*="overflow"]'));
  scrollables.forEach(s => {
    if (s && s.scrollHeight > s.clientHeight && s.scrollTo) {
      try { s.scrollTo({ top: y, behavior: 'instant' }); } catch (e) {}
      try { s.scrollTop = y; } catch (e) {}
    }
  });
}

// ==========================================
// 5. TRỢ LÝ ĐỊNH VỊ THÔNG MINH & HIGHLIGHT KHOANH ĐỎ BÌNH LUẬN
// ==========================================

let activeHighlightRunning = false;

function normalizeCompareString(str) {
  return (str || '').toLowerCase().replace(/[\s\p{Punctuation}\p{Symbol}]/gu, '').trim();
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
  }, 15000);
}

function showTopGuideBanner(authorName, commentText, targetPostUrl) {
  let guide = document.getElementById('lado-locate-guide-banner');
  if (!guide) {
    guide = document.createElement('div');
    guide.id = 'lado-locate-guide-banner';
    guide.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 2147483646 !important;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98)) !important;
      border: 2px solid #ef4444 !important;
      border-radius: 14px !important;
      padding: 14px 18px !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.45) !important;
      max-width: 400px !important;
      backdrop-filter: blur(12px) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      transition: all 0.3s ease !important;
      pointer-events: auto !important;
    `;
    const root = document.body || document.documentElement;
    if (root) root.appendChild(guide);
  }

  guide.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:20px; animation:ladoSpin 1s linear infinite;">🍁</span>
        <strong style="font-size:14px; color:#fca5a5;">LÁ ĐỎ HOMESTAY - TRỢ LÝ ĐỊNH VỊ</strong>
      </div>
      <button id="lado-close-guide" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:0 4px;">✖</button>
    </div>
    <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">
      Đang tìm bình luận của: <b style="color:#ffffff;">${authorName || 'Khách hàng'}</b><br/>
      <i style="color:#94a3b8;">"${(commentText || '').slice(0, 50)}..."</i>
    </div>
    <div id="lado-guide-status" style="font-size:11px; color:#f87171; display:flex; align-items:center; gap:6px;">
      <span class="lado-spinner-mini" style="display:inline-block; width:10px; height:10px; border:2px solid #ef4444; border-top-color:transparent; border-radius:50%; animation:ladoSpin 0.7s linear infinite;"></span>
      <span>⚡ Đang tự động mở bình luận ẩn & cuộn định vị...</span>
    </div>
    <div style="display:flex; gap:6px; margin-top:4px;">
      <button id="lado-guide-ai-suggest" style="flex:1; background:linear-gradient(135deg, #ea580c, #c2410c); color:#fff; border:none; border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer;">✨ Gợi ý AI</button>
      <button id="lado-guide-back-dash" style="flex:1; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:6px 10px; font-size:11.5px; cursor:pointer;">🏠 Về Dashboard</button>
    </div>
  `;

  document.getElementById('lado-close-guide')?.addEventListener('click', () => guide.remove());
  document.getElementById('lado-guide-back-dash')?.addEventListener('click', () => {
    safeSendMessage({ action: 'RETURN_TO_DASHBOARD' });
    window.location.href = 'http://localhost:5173/admin/marketing/engagement-inbox';
  });
  document.getElementById('lado-guide-ai-suggest')?.addEventListener('click', () => {
    safeSendMessage({
      action: 'GENERATE_AI_REPLY',
      payload: {
        postTitle: 'Lá Đỏ Homestay Sa Pa',
        postContent: 'Lá Đỏ Homestay Sa Pa view thung lũng Mường Hoa',
        commentText: commentText,
        authorName: authorName,
        tone: 'WARM'
      }
    }, (res) => {
      if (res && res.reply) {
        if (navigator.clipboard) navigator.clipboard.writeText(res.reply);
        showInPageToast(`📋 Đã sao chép câu trả lời AI: "${res.reply.slice(0, 35)}..."`);
      }
    });
  });
}

function updateTopGuideBannerFound(authorName, commentText) {
  const guide = document.getElementById('lado-locate-guide-banner');
  if (guide) {
    guide.style.border = '2px solid #10b981';
    guide.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.45)';
    guide.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:22px;">🎉</span>
          <div>
            <strong style="font-size:14px; color:#6ee7b7;">ĐÃ KHOANH ĐỎ BÌNH LUẬN!</strong>
            <div style="font-size:12px; color:#cbd5e1;">Bình luận của <b>${authorName || 'khách'}</b> đã sẵn sàng.</div>
          </div>
        </div>
        <button id="lado-close-guide-found" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:0 4px;">✖</button>
      </div>
      <div style="font-size:11.5px; color:#a7f3d0; margin-top:4px;">
        👉 Nhấn nút <b>"✨ AI Lá Đỏ"</b> ngay dưới bình luận để gửi câu trả lời tự động!
      </div>
    `;
    document.getElementById('lado-close-guide-found')?.addEventListener('click', () => guide.remove());
    setTimeout(() => {
      guide.remove();
    }, 9000);
  }
}

function applyHighlightToElement(targetEl, authorName, commentText) {
  if (!targetEl) return;
  activeHighlightRunning = false;

  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetEl.style.transition = 'all 0.4s ease';
  targetEl.style.outline = '4px solid #ef4444 !important';
  targetEl.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.95), inset 0 0 15px rgba(239, 68, 68, 0.25) !important';
  targetEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15) !important';
  targetEl.style.borderRadius = '12px !important';

  // Floating red badge
  showTargetBadgeOnElement(targetEl, `🎯 BÌNH LUẬN FACEBOOK CẦN TRẢ LỜI: "${(commentText || authorName || '').slice(0, 35)}..." (Bấm nút ✨ AI Lá Đỏ)`);

  // Auto-click "Trả lời" / "Reply" on this exact comment
  setTimeout(() => {
    try {
      const replyBtn = Array.from(targetEl.querySelectorAll('span, div[role="button"], a[role="link"]')).find(
        el => {
          if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return false;
          const t = (el.textContent || '').trim().toLowerCase();
          return t === 'trả lời' || t === 'phản hồi' || t === 'reply';
        }
      );
      if (replyBtn) {
        replyBtn.click();
        debouncedInjectAiButtons();
      }
    } catch (e) {}
  }, 400);

  updateTopGuideBannerFound(authorName, commentText);
  showInPageToast(`👀 Đã khoanh đỏ bình luận của ${authorName || 'khách'}: "${(commentText || '').slice(0, 30)}..."`);

  // Clear pending highlight from storage
  try {
    if (isExtensionValid() && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['pendingHighlight']);
    }
  } catch (e) {}

  setTimeout(() => {
    targetEl.style.outline = '';
    targetEl.style.boxShadow = '';
    targetEl.style.backgroundColor = '';
  }, 15000);
}

function pollAndHighlightComment(targetCommentText, targetAuthorName, targetPostUrl) {
  const cleanTarget = (targetCommentText || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
  const cleanAuthor = (targetAuthorName || '').trim().toLowerCase();
  const normTarget = normalizeCompareString(cleanTarget);
  const normAuthor = normalizeCompareString(cleanAuthor);

  if (!cleanTarget && !cleanAuthor) return;

  activeHighlightRunning = true;
  showTopGuideBanner(targetAuthorName, targetCommentText, targetPostUrl);

  function tryFind() {
    function isSystemUiElement(el) {
      if (!el) return true;
      if (el.closest('nav, header, [role="navigation"], [role="banner"], [role="search"], form, [contenteditable="true"], #lado-locate-guide-banner, #lado-target-marker-badge, .lado-ai-reply-btn')) return true;
      if (el.closest('[data-pagelet="LeftRail"], [data-pagelet="RightRail"], [data-pagelet="ProfileTabs"]')) return true;
      return false;
    }

    // 1. Check all structured comment articles & list items (Primary)
    const candidateContainers = Array.from(document.querySelectorAll('div[role="article"], li[role="article"], ul > li, div[data-visualcompletion="ignore-dynamic-snippet"]'));
    let bestMatch = null;
    let highestScore = 0;

    for (const el of candidateContainers) {
      if (isSystemUiElement(el)) continue;
      if (el.querySelectorAll('div[role="article"]').length > 2) continue;

      const elAuthor = extractAuthorNameFromElement(el);
      const elText = extractCleanCommentText(el, elAuthor);

      const normElAuthor = normalizeCompareString(elAuthor);
      const normElText = normalizeCompareString(elText);

      let score = 0;

      const isAuthorMatch = normAuthor && normAuthor !== 'khachhang' &&
        (normElAuthor === normAuthor || normElAuthor.includes(normAuthor) || normAuthor.includes(normElAuthor));

      const isTextMatch = normTarget &&
        (normElText === normTarget || (normTarget.length >= 3 && normElText.includes(normTarget)) || (normElText.length >= 3 && normTarget.includes(normElText)));

      if (isAuthorMatch && isTextMatch) {
        score = 100;
      } else if (normTarget && normTarget.length >= 4 && normElText === normTarget) {
        score = 90;
      } else if (normTarget && normTarget.length >= 4 && (normElText.includes(normTarget) || normTarget.includes(normElText))) {
        score = 80;
      } else if (isAuthorMatch && (!normTarget || normTarget.length < 3)) {
        score = 60;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = el;
      }
    }

    if (bestMatch && highestScore >= 60) {
      return bestMatch;
    }

    // 2. Direct text node search strictly inside comment wrappers (Secondary)
    if (cleanTarget && cleanTarget.length >= 2) {
      const textNodes = Array.from(document.querySelectorAll('div[dir="auto"], span[dir="auto"], span[lang], p'));
      for (const tn of textNodes) {
        if (isSystemUiElement(tn)) continue;

        const commentWrap = tn.closest('div[role="article"]') || tn.closest('li[role="article"]') || tn.closest('li');
        if (!commentWrap || isSystemUiElement(commentWrap)) continue;

        const rawText = (tn.innerText || tn.textContent || '').trim().toLowerCase();
        const normNodeText = normalizeCompareString(rawText);

        const isExact = rawText === cleanTarget || normNodeText === normTarget;
        const isContains = (cleanTarget.length >= 4 && rawText.includes(cleanTarget)) || (normTarget.length >= 4 && normNodeText.includes(normTarget));

        if (isExact || isContains) {
          if (cleanTarget.length <= 4 && normAuthor && normAuthor !== 'khachhang') {
            const elAuthor = extractAuthorNameFromElement(commentWrap);
            const normElAuthor = normalizeCompareString(elAuthor);
            if (!normElAuthor.includes(normAuthor) && !normAuthor.includes(normElAuthor)) {
              continue;
            }
          }
          return commentWrap;
        }
      }
    }

    return null;
  }

  // Auto-expand helper: strictly expands collapsed replies/comments within the CURRENT active post or Reel sidebar.
  // NEVER clicks any link or card that would navigate or open other posts.
  function expandVisibleComments() {
    try {
      // Find comment section container (dialog if open, or reel sidebar, or main content)
      const activeScope = document.querySelector('div[role="dialog"]') ||
                          document.querySelector('div[role="complementary"]') ||
                          document.querySelector('div[role="main"]') ||
                          document.body;

      // Only search for in-place text expansion triggers (strictly NO anchors with navigation hrefs!)
      const expandElements = Array.from(activeScope.querySelectorAll('span, div[role="button"]')).filter(b => {
        if (b.dataset.ladoExpanded === 'true') return false;
        if (b.closest('#lado-locate-guide-banner') || b.closest('.lado-ai-reply-btn') || b.classList.contains('lado-ai-reply-btn')) return false;

        // Skip anything inside navigation, header, search, or side rails
        if (b.closest('nav, header, [role="navigation"], [role="banner"], [role="search"], [data-pagelet="LeftRail"], [data-pagelet="RightRail"]')) return false;

        // Never click on an anchor tag with an href (to prevent navigating or opening other posts)
        if (b.tagName === 'A' || b.closest('a')) {
          const aTag = b.tagName === 'A' ? b : b.closest('a');
          const href = (aTag?.getAttribute('href') || '').toLowerCase().trim();
          if (href && href !== '#' && !href.startsWith('javascript:')) return false;
        }

        const txt = (b.textContent || '').toLowerCase().trim();
        if (!txt || txt.length < 3) return false;

        // Strictly match comment expansion phrases only
        const isCommentExpander =
          txt.includes('xem thêm bình luận') ||
          txt.includes('view more comments') ||
          txt.includes('xem tất cả bình luận') ||
          txt.includes('view all comments') ||
          txt.includes('xem các bình luận trước') ||
          txt.includes('view previous comments') ||
          txt.includes('xem phản hồi') ||
          txt.includes('view replies') ||
          /^\d+\s*(phản hồi|câu trả lời|repl(y|ies))$/i.test(txt) ||
          /^(xem|view)\s+(\d+\s+)?(phản hồi|câu trả lời|repl(y|ies))$/i.test(txt);

        return isCommentExpander;
      });

      expandElements.forEach(btn => {
        try {
          btn.dataset.ladoExpanded = 'true';
          btn.click();
        } catch (e) {}
      });
    } catch (e) {}
  }

  // 1. Kiểm tra ngay lập tức
  expandVisibleComments();
  const immediate = tryFind();
  if (immediate) {
    applyHighlightToElement(immediate, targetAuthorName, targetCommentText);
    return;
  }

  // 2. Vòng lặp polling kèm cuộn thông minh và tự mở comment
  let attempts = 0;
  const maxAttempts = 45;

  const pollTimer = setInterval(() => {
    attempts++;
    expandVisibleComments();

    const found = tryFind();
    if (found) {
      clearInterval(pollTimer);
      applyHighlightToElement(found, targetAuthorName, targetCommentText);
      return;
    }

    // Cuộn nhẹ feed xuống để lazy-load bài viết / bình luận tiếp theo
    if (attempts % 3 === 0 && attempts < maxAttempts) {
      // Nếu đang ở Reel viewer, cuộn right sidebar
      const reelSidebar = document.querySelector('div[role="complementary"], div[style*="overflow-y: auto"], div[style*="overflow-y: scroll"]');
      if (reelSidebar && reelSidebar.scrollHeight > reelSidebar.clientHeight) {
        reelSidebar.scrollBy({ top: 350, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: 400, behavior: 'smooth' });
      }
    }

    if (attempts >= maxAttempts) {
      clearInterval(pollTimer);
      activeHighlightRunning = false;
      const guide = document.getElementById('lado-locate-guide-banner');
      if (guide) {
        guide.style.border = '2px solid #f59e0b';
        guide.innerHTML = `
          <div style="font-size:13px; color:#fde68a;">ℹ️ Chưa thấy bình luận trên màn hình này.</div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Bạn có thể cuộn xuống thêm để xem tiếp bài viết.</div>
        `;
        setTimeout(() => guide.remove(), 6000);
      }
    }
  }, 300);
}

// ==========================================
// 6. ĐỌC HIGHLIGHT TỪ HASH URL, STORAGE VÀ TIN NHẮN
// ==========================================

function checkUrlHighlightParams() {
  try {
    const hash = window.location.hash || '';
    if (hash.includes('lado_author=') || hash.includes('lado_comment=')) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const author = decodeURIComponent(hashParams.get('lado_author') || '');
      const comment = decodeURIComponent(hashParams.get('lado_comment') || '');
      if (author || comment) {
        pollAndHighlightComment(comment, author, window.location.href);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function checkPendingHighlight() {
  if (activeHighlightRunning) return;
  if (checkUrlHighlightParams()) return;

  if (isExtensionValid() && chrome.storage && chrome.storage.local) {
    try {
      chrome.storage.local.get(['pendingHighlight'], (res) => {
        if (chrome.runtime.lastError) return;
        if (res && res.pendingHighlight) {
          const { commentText, authorName, postUrl, timestamp } = res.pendingHighlight;
          if (Date.now() - timestamp < 180000) {
            pollAndHighlightComment(commentText, authorName, postUrl);
          }
        }
      });
    } catch (e) {}
  }
}

if (isExtensionValid() && chrome.storage && chrome.storage.onChanged) {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.pendingHighlight && changes.pendingHighlight.newValue) {
        const { commentText, authorName, postUrl, timestamp } = changes.pendingHighlight.newValue;
        if (Date.now() - timestamp < 180000) {
          pollAndHighlightComment(commentText, authorName, postUrl);
        }
      }
    });
  } catch (e) {}
}

checkPendingHighlight();
setTimeout(checkPendingHighlight, 400);
setTimeout(checkPendingHighlight, 1200);
setTimeout(checkPendingHighlight, 2500);

// ==========================================
// 7. MUTATION OBSERVER TIÊM NÚT ✨ AI LÁ ĐỎ
// ==========================================

let debounceInjectTimer = null;
function debouncedInjectAiButtons() {
  if (debounceInjectTimer) clearTimeout(debounceInjectTimer);
  debounceInjectTimer = setTimeout(() => {
    injectAiButtonsToFacebookComments();
  }, 250);
}

const fbObserver = new MutationObserver((mutations) => {
  let hasRelevantMutation = false;
  for (let i = 0; i < mutations.length; i++) {
    const m = mutations[i];
    if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
      hasRelevantMutation = true;
      break;
    }
  }
  if (hasRelevantMutation) {
    debouncedInjectAiButtons();
  }
});

if (document.body) {
  fbObserver.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    fbObserver.observe(document.body, { childList: true, subtree: true });
  });
}

setTimeout(injectAiButtonsToFacebookComments, 800);
setTimeout(injectAiButtonsToFacebookComments, 2000);

function injectAiButtonsToFacebookComments() {
  const allElements = document.querySelectorAll('span, div[role="button"], a[role="link"], button');

  allElements.forEach((el) => {
    if (el.classList.contains('lado-ai-reply-btn') || el.closest('.lado-ai-reply-btn')) return;
    if (el.dataset && el.dataset.ladoAiProcessed === 'true') return;

    const text = (el.textContent || '').trim().toLowerCase();
    const isReplyBtn = text === 'trả lời' || text === 'phản hồi' || text === 'reply';
    if (!isReplyBtn) return;

    const hasNestedReply = Array.from(el.querySelectorAll('span, div, a')).some(c => {
      const ct = (c.textContent || '').trim().toLowerCase();
      return ct === 'trả lời' || ct === 'phản hồi' || ct === 'reply';
    });
    if (hasNestedReply) return;

    el.dataset.ladoAiProcessed = 'true';

    const parent = el.parentElement;
    if (!parent) return;
    if (parent.querySelector('.lado-ai-reply-btn') || parent.nextElementSibling?.classList?.contains('lado-ai-reply-btn')) {
      return;
    }

    const commentContainer = getExactCommentContainer(el) ||
                             el.closest('div[role="article"]') ||
                             el.closest('li') ||
                             el.closest('div[data-visualcompletion="ignore-dynamic-snippet"]') ||
                             parent.parentElement?.parentElement;
    if (!commentContainer) return;

    const authorName = extractAuthorNameFromElement(commentContainer);
    const commentText = extractCleanCommentText(commentContainer, authorName);
    if (!commentText || commentText.length < 1) return;

    if (isFacebookCommentAlreadyReplied(commentContainer, authorName, commentText)) return;

    const postContainer = commentContainer.closest('div[role="dialog"]') ||
                          commentContainer.closest('div[role="feed"] > div') ||
                          commentContainer.closest('div[role="main"]') ||
                          document.body;
    const postCaptionEl = postContainer.querySelector('div[data-ad-preview="message"]') ||
                          postContainer.querySelector('div[data-ad-comet-preview="message"]') ||
                          postContainer.querySelector('span[dir="auto"], div[dir="auto"]');
    const realPostCaption = postCaptionEl ? postCaptionEl.innerText.trim().slice(0, 300) : 'Lá Đỏ Homestay Sa Pa view thung lũng Mường Hoa & săn mây';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lado-ai-reply-btn lado-fb';
    btn.innerHTML = `<span>✨ AI Lá Đỏ</span>`;
    btn.title = `Tự động trả lời bình luận của ${authorName || 'khách'} bằng AI Lá Đỏ Homestay`;

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      btn.classList.add('loading');
      btn.innerHTML = `<span>⏳ Đang sinh & gửi...</span>`;

      try {
        el.click();
      } catch (err) {}

      safeSendMessage({
        action: 'GENERATE_AI_REPLY',
        payload: {
          postTitle: 'Lá Đỏ Homestay Sa Pa',
          postContent: realPostCaption,
          commentText: commentText,
          authorName: authorName,
          tone: 'WARM'
        }
      }, (response) => {
        btn.classList.remove('loading');
        btn.innerHTML = `<span>✨ AI Lá Đỏ</span>`;

        if (response && response.reply) {
          setTimeout(() => {
            fillAndSubmitFacebookComment(commentContainer, el, response.reply);
          }, 250);
        } else {
          showInPageToast('⚠️ Không thể sinh câu trả lời lúc này. Vui lòng thử lại!');
        }
      });
    });

    if (el.nextSibling) {
      parent.insertBefore(btn, el.nextSibling);
    } else {
      parent.appendChild(btn);
    }
  });
}

// ==========================================
// 8. ĐIỀN NỘI DUNG VÀ GỬI BÌNH LUẬN (REACT 18 & LEXICAL)
// ==========================================

function fillAndSubmitFacebookComment(commentContainer, replyButtonEl, replyText) {
  let attempts = 0;
  const maxAttempts = 15;

  const fillInterval = setInterval(() => {
    attempts++;

    let inputEl = null;

    if (document.activeElement && (document.activeElement.getAttribute('contenteditable') === 'true' || document.activeElement.getAttribute('role') === 'textbox')) {
      inputEl = document.activeElement;
    }

    if (!inputEl && commentContainer) {
      inputEl = commentContainer.querySelector('div[contenteditable="true"][role="textbox"]') ||
                commentContainer.querySelector('div[contenteditable="true"]') ||
                commentContainer.nextElementSibling?.querySelector('div[contenteditable="true"]');
    }

    if (!inputEl && replyButtonEl) {
      const allInputs = Array.from(document.querySelectorAll('div[contenteditable="true"][role="textbox"], div[contenteditable="true"]'));
      const btnRect = replyButtonEl.getBoundingClientRect();

      const nearbyInputs = allInputs.filter(inp => {
        const inpRect = inp.getBoundingClientRect();
        return inpRect.top >= btnRect.top - 60 && inpRect.height > 0;
      });

      if (nearbyInputs.length > 0) {
        nearbyInputs.sort((a, b) => {
          const distA = Math.abs(a.getBoundingClientRect().top - btnRect.top);
          const distB = Math.abs(b.getBoundingClientRect().top - btnRect.top);
          return distA - distB;
        });
        inputEl = nearbyInputs[0];
      }
    }

    if (!inputEl) {
      const allInputs = Array.from(document.querySelectorAll('div[contenteditable="true"][role="textbox"], div[contenteditable="true"]'));
      const visibleInputs = allInputs.filter(inp => inp.offsetParent !== null);
      if (visibleInputs.length > 0) {
        inputEl = visibleInputs[visibleInputs.length - 1];
      }
    }

    if (inputEl) {
      clearInterval(fillInterval);

      inputEl.focus();

      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(inputEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {}

      const currentText = inputEl.innerText ? inputEl.innerText.trim() : '';
      const textToInsert = (currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '') + replyText;

      let insertSuccess = false;
      try {
        const beforeInputEvt = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertText',
          data: textToInsert
        });
        inputEl.dispatchEvent(beforeInputEvt);

        insertSuccess = document.execCommand('insertText', false, textToInsert);

        const inputEvt = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertText',
          data: textToInsert
        });
        inputEl.dispatchEvent(inputEvt);
      } catch (e) {
        insertSuccess = false;
      }

      if (!insertSuccess && (!inputEl.innerText || !inputEl.innerText.includes(replyText))) {
        try {
          const p = inputEl.querySelector('p') || inputEl;
          const span = document.createElement('span');
          span.setAttribute('data-lexical-text', 'true');
          span.textContent = textToInsert;
          p.appendChild(span);
        } catch (e) {}
      }

      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      setTimeout(() => {
        triggerFacebookSubmit(inputEl, commentContainer);
      }, 400);

      showInPageToast('🚀 Đã điền và gửi câu trả lời AI Lá Đỏ lên Facebook!');
    } else if (attempts >= maxAttempts) {
      clearInterval(fillInterval);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(replyText).then(() => {
          showInPageToast('✨ Đã sao chép câu trả lời AI vào Clipboard! Nhấn Ctrl+V để dán.');
        }).catch(() => {
          showInPageToast('✨ Câu trả lời: ' + replyText.slice(0, 40) + '...');
        });
      }
    }
  }, 150);
}

function triggerFacebookSubmit(inputEl, commentContainer) {
  if (!inputEl) return;

  const container = inputEl.closest('form') ||
                    commentContainer ||
                    inputEl.parentElement?.parentElement?.parentElement ||
                    inputEl.parentElement;

  if (container) {
    const sendBtn = container.querySelector('div[role="button"][aria-label*="Bình luận"]') ||
                    container.querySelector('div[role="button"][aria-label*="Comment"]') ||
                    container.querySelector('div[role="button"][aria-label*="Gửi"]') ||
                    container.querySelector('div[role="button"][aria-label*="Send"]') ||
                    container.querySelector('div[role="button"] > svg path[fill*="#0064e0"]')?.closest('div[role="button"]') ||
                    container.querySelector('div[role="button"] > svg path[fill*="blue"]')?.closest('div[role="button"]') ||
                    container.querySelector('div[aria-label="Nhấn Enter để gửi"]') ||
                    container.querySelector('button[type="submit"]');

    if (sendBtn) {
      sendBtn.click();
      safeSendMessage({ action: 'RECORD_REPLY_SUCCESS' });
      return;
    }
  }

  inputEl.focus();

  const enterDown = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    charCode: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  inputEl.dispatchEvent(enterDown);

  const enterPress = new KeyboardEvent('keypress', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    charCode: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  inputEl.dispatchEvent(enterPress);

  const enterUp = new KeyboardEvent('keyup', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    charCode: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  inputEl.dispatchEvent(enterUp);

  safeSendMessage({ action: 'RECORD_REPLY_SUCCESS' });
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

// ==========================================
// 9. LẮNG NGHE THÔNG ĐIỆP TỪ POPUP / BACKGROUND
// ==========================================

if (isExtensionValid() && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'SCAN_COMMENTS') {
      (async () => {
        try {
          const collectedMap = new Map();
          const startY = window.scrollY || document.documentElement?.scrollTop || 0;

          harvestFacebookComments(collectedMap);

          const totalSteps = 16;
          const stepDist = 600;

          for (let s = 1; s <= totalSteps; s++) {
            const nextY = startY + (s * stepDist);
            scrollAllContainers(nextY);

            await new Promise(r => setTimeout(r, 150));
            harvestFacebookComments(collectedMap);
          }

          scrollAllContainers(startY);

          const allComments = Array.from(collectedMap.values());
          const totalCount = Math.min(allComments.length, 300);
          sendResponse({ count: totalCount, comments: allComments.slice(0, totalCount) });
        } catch (err) {
          sendResponse({ count: 0, comments: [] });
        }
      })();

      return true;
    }

    if (req.action === 'HIGHLIGHT_COMMENT') {
      const { commentText, authorName, postUrl } = req;
      pollAndHighlightComment(commentText, authorName, postUrl);
      sendResponse({ success: true, found: true });
      return true;
    }

    if (req.action === 'EXECUTE_POST_REPLY') {
      const { message, index, commentText } = req;
      const cleanTarget = (commentText || '').trim().toLowerCase();
      let targetRow = null;

      if (cleanTarget) {
        const textElements = Array.from(document.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
        const snippet = cleanTarget.slice(0, Math.min(cleanTarget.length, 25));
        for (const tel of textElements) {
          if ((tel.innerText || '').toLowerCase().includes(snippet)) {
            targetRow = tel.closest('div[role="article"]') || tel.parentElement?.parentElement;
            break;
          }
        }
      }

      if (!targetRow && index !== undefined) {
        const articles = document.querySelectorAll('div[role="article"]');
        if (articles[index]) targetRow = articles[index];
      }

      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const replyBtn = Array.from(targetRow.querySelectorAll('span, div[role="button"], a[role="link"]')).find(
          el => {
            const t = (el.textContent || '').trim().toLowerCase();
            return t === 'trả lời' || t === 'phản hồi' || t === 'reply';
          }
        );
        if (replyBtn) replyBtn.click();

        setTimeout(() => {
          fillAndSubmitFacebookComment(targetRow, replyBtn, message);
        }, 350);

        sendResponse({ success: true, message: 'Đã gửi câu trả lời lên Facebook!' });
      } else {
        fillAndSubmitFacebookComment(null, null, message);
        sendResponse({ success: true, message: 'Đã gửi câu trả lời lên Facebook!' });
      }
      return true;
    }

    if (req.action === 'TRIGGER_AUTO_SCAN') {
      window.__LADO_FB_AUTO_SCAN_EXECUTED__ = false;
      checkAndTriggerAutoScanFacebook(true);
      sendResponse({ success: true });
      return true;
    }
  });
}

// ==========================================
// 10. TỰ ĐỘNG MỞ TỪNG BÀI VIẾT & QUÉT SÂU BÌNH LUẬN (MULTI-POST DEEP NAVIGATOR)
// ==========================================

function showPersistentScanBanner(statusText, progressPercent) {
  let banner = document.getElementById('lado-auto-scan-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'lado-auto-scan-banner';
    banner.style.cssText = `
      position: fixed !important;
      top: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98)) !important;
      border: 2px solid #ea580c !important;
      border-radius: 16px !important;
      padding: 16px 22px !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(234, 88, 12, 0.45) !important;
      min-width: 380px !important;
      max-width: 480px !important;
      backdrop-filter: blur(14px) !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      pointer-events: auto !important;
    `;
    const root = document.body || document.documentElement;
    if (root) root.appendChild(banner);
  }

  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div class="lado-spinner" style="width:20px; height:20px; border:3px solid rgba(234,88,12,0.3); border-top-color:#ea580c; border-radius:50%; animation:ladoSpin 0.8s linear infinite;"></div>
      <strong style="font-size:15px; color:#fed7aa;">🍁 LÁ ĐỎ HOMESTAY - QUÉT TỪNG BÀI VIẾT</strong>
    </div>
    <div id="lado-scan-status-text" style="font-size:13px; color:#e2e8f0; line-height:1.5;">
      ${statusText || 'Đang quét bài viết...'}
    </div>
    <div style="background:rgba(255,255,255,0.1); border-radius:6px; height:6px; overflow:hidden;">
      <div id="lado-scan-prog" style="background:#ea580c; width:${progressPercent || 10}%; height:100%; transition:width 0.3s;"></div>
    </div>
  `;
}

function discoverAllPostUrlsOnPage() {
  const allAnchors = Array.from(document.querySelectorAll('a[href]'));
  const foundUrls = [];
  const seen = new Set();

  for (const a of allAnchors) {
    if (a.closest('#lado-auto-scan-banner') || a.closest('#lado-locate-guide-banner')) continue;
    const rawHref = a.href || a.getAttribute('href') || '';
    if (!rawHref) continue;

    const norm = normalizeFacebookPostUrl(rawHref);
    if (norm && !seen.has(norm)) {
      if (norm.includes('profile.php') && !norm.includes('story_fbid')) continue;
      seen.add(norm);
      foundUrls.push(norm);
    }
  }

  return foundUrls;
}

async function performDeepPostScan(postUrl, collectedMap) {
  // 1. Chờ DOM bài viết load đầy đủ
  await new Promise(r => setTimeout(r, 1200));

  // 2. Chuyển bộ lọc sang "Tất cả bình luận" (All comments)
  try {
    const filterBtn = Array.from(document.querySelectorAll('span, div[role="button"]')).find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'phù hợp nhất' || t.includes('phù hợp nhất') || t.includes('most relevant');
    });
    if (filterBtn) {
      filterBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const allOpt = Array.from(document.querySelectorAll('div[role="menuitem"], div[role="option"], span')).find(o => {
        const t = (o.textContent || '').trim().toLowerCase();
        return t.includes('tất cả bình luận') || t.includes('all comments');
      });
      if (allOpt) {
        allOpt.click();
        await new Promise(r => setTimeout(r, 450));
      }
    }
  } catch (e) {}

  // 3. Mở bung tất cả bình luận & phản hồi ẩn (5 vòng lặp)
  for (let exp = 0; exp < 5; exp++) {
    const expandBtns = Array.from(document.querySelectorAll('span, div[role="button"]')).filter(b => {
      if (b.dataset.ladoScanExp === 'true') return false;
      if (b.tagName === 'A' || b.getAttribute('href') || b.closest('a[href]')) return false;
      if (b.classList.contains('lado-ai-reply-btn') || b.closest('.lado-ai-reply-btn')) return false;
      if (b.closest('#lado-auto-scan-banner') || b.closest('#lado-locate-guide-banner')) return false;

      const t = (b.textContent || '').trim().toLowerCase();
      return t.includes('xem thêm bình luận') ||
             t.includes('view more comments') ||
             t.includes('xem các bình luận trước') ||
             t.includes('view previous comments') ||
             t.includes('xem phản hồi') ||
             t.includes('view replies') ||
             /\d+\s*(phản hồi|câu trả lời|repl)/i.test(t);
    });

    if (expandBtns.length === 0) break;
    expandBtns.forEach(b => {
      b.dataset.ladoScanExp = 'true';
      try { b.click(); } catch(e) {}
    });
    await new Promise(r => setTimeout(r, 350));
  }

  // 4. Cuộn nhẹ để nạp các bình luận ở dưới
  const scrollContainers = Array.from(document.querySelectorAll('div[role="dialog"], div[role="main"], div[data-pagelet], div[style*="overflow"]'));
  for (let s = 0; s < 4; s++) {
    window.scrollBy({ top: 400, behavior: 'instant' });
    scrollContainers.forEach(sc => {
      if (sc && sc.scrollHeight > sc.clientHeight) {
        try { sc.scrollTop += 400; } catch (e) {}
      }
    });
    await new Promise(r => setTimeout(r, 200));
    harvestFacebookComments(collectedMap);
  }

  // 5. Thu hoạch bình luận cho bài viết này
  harvestFacebookComments(collectedMap);
}

function finishAndSyncAllScannedComments(commentsToSave, totalPostsScanned) {
  // Xóa queue trạng thái quét
  chrome.storage.local.remove(['ladoFbScanActive', 'ladoFbScanQueue', 'ladoFbScanIndex', 'ladoFbCollectedComments']);

  const totalCount = Math.min(commentsToSave.length, 300);
  const cleanList = commentsToSave.slice(0, totalCount);

  chrome.storage.local.set({
    scannedCommentsList: cleanList,
    scannedCount: totalCount
  });

  // Đồng bộ lên Spring Boot Backend
  if (cleanList.length > 0) {
    try {
      const syncPayload = {
        platform: 'FACEBOOK',
        channel: 'FACEBOOK',
        pageTitle: document.title || 'Lá Đỏ Homestay Facebook Fanpage',
        pageUrl: window.location.href,
        comments: cleanList.map(c => ({
          id: c.id,
          authorName: c.authorName || 'Khách hàng',
          authorAvatar: c.authorAvatar || '',
          message: c.message || '',
          publishedAt: c.publishedAt || 'Vừa xong',
          timeText: c.publishedAt || 'Vừa xong',
          timestampMs: c.timestampMs || Date.now(),
          likeCount: 0,
          videoTitle: 'Bài đăng Fanpage Facebook',
          postUrl: c.postUrl || window.location.href,
          videoUrl: c.postUrl || window.location.href,
          commentUrl: c.postUrl || window.location.href,
          replied: !!c.replied
        }))
      };

      safeSendMessage({ action: 'SYNC_SCANNED_COMMENTS', payload: syncPayload });

      fetch('http://localhost:8080/api/admin/marketing/comments/sync-scanned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      }).catch(() => {});
    } catch (e) {}
  }

  function triggerReturnToDashboard() {
    safeSendMessage({ action: 'RETURN_TO_DASHBOARD' });
    try { window.close(); } catch (e) {}
    setTimeout(() => {
      window.location.href = 'http://localhost:5173/admin/marketing/engagement-inbox';
    }, 300);
  }

  let banner = document.getElementById('lado-auto-scan-banner');
  if (banner) {
    if (cleanList.length > 0) {
      banner.style.border = '2px solid #10b981';
      banner.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:24px;">🎉</span>
          <div>
            <strong style="font-size:15px; color:#6ee7b7;">ĐÃ MỞ & QUÉT XONG ${totalPostsScanned} BÀI VIẾT!</strong>
            <div style="font-size:12px; color:#cbd5e1;">Đã lưu <b>${cleanList.length}</b> bình luận chuẩn xác kèm Link Trực Tiếp.</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button id="lado-fb-btn-back" style="flex:1.2; background:#10b981; color:#022c22; font-weight:bold; border:none; border-radius:8px; padding:9px 14px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px;">🏠 Về Dashboard</button>
          <button id="lado-fb-btn-close" style="flex:1; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:9px 12px; cursor:pointer; font-size:13px;">✖ Đóng Tab</button>
        </div>
        <div id="lado-fb-countdown" style="font-size:11px; color:#94a3b8; text-align:center;">Tự động chuyển về Dashboard sau 3s...</div>
      `;

      document.getElementById('lado-fb-btn-back')?.addEventListener('click', triggerReturnToDashboard);
      document.getElementById('lado-fb-btn-close')?.addEventListener('click', () => banner.remove());

      let cCount = 3;
      const cdTimer = setInterval(() => {
        cCount--;
        const cdEl = document.getElementById('lado-fb-countdown');
        if (cdEl) cdEl.textContent = `Tự động chuyển về Dashboard sau ${cCount}s...`;
        if (cCount <= 0) {
          clearInterval(cdTimer);
          triggerReturnToDashboard();
        }
      }, 1000);
    } else {
      banner.style.border = '2px solid #f59e0b';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:20px;">ℹ️</span>
          <div>
            <strong style="font-size:14px; color:#fde68a;">CHƯA TÌM THẤY BÌNH LUẬN MỚI</strong>
            <div style="font-size:12px; color:#cbd5e1;">Đã mở ${totalPostsScanned} bài viết nhưng chưa có bình luận của khách.</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button id="lado-fb-btn-back" style="flex:1; background:#ea580c; color:#fff; font-weight:bold; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; font-size:12px;">🏠 Về Dashboard</button>
        </div>
      `;
      document.getElementById('lado-fb-btn-back')?.addEventListener('click', triggerReturnToDashboard);
    }
  }
}

async function checkAndTriggerAutoScanFacebook(force = false) {
  if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;

  chrome.storage.local.get(['ladoFbScanActive', 'ladoFbScanQueue', 'ladoFbScanIndex', 'ladoFbCollectedComments'], async (data) => {
    let { ladoFbScanActive, ladoFbScanQueue, ladoFbScanIndex, ladoFbCollectedComments } = data;
    const url = window.location.href;
    const isAutoScanParam = force || url.includes('lado_auto_scan=true') || url.includes('lado_auto_scan');
    const isReset = url.includes('reset=true');

    if (isReset) {
      ladoFbScanActive = false;
      ladoFbScanQueue = null;
      ladoFbScanIndex = 0;
      ladoFbCollectedComments = [];
      chrome.storage.local.remove(['ladoFbScanActive', 'ladoFbScanQueue', 'ladoFbScanIndex', 'ladoFbCollectedComments', 'scannedCommentsList', 'scannedCount']);
    }

    // A. NẾU ĐANG TRONG QUÁ TRÌNH QUÉT MỞ TỪNG BÀI VIẾT (ACTIVE QUEUE)
    if (ladoFbScanActive && Array.isArray(ladoFbScanQueue) && ladoFbScanQueue.length > 0) {
      const idx = typeof ladoFbScanIndex === 'number' ? ladoFbScanIndex : 0;
      const totalPosts = ladoFbScanQueue.length;
      const currentUrl = ladoFbScanQueue[idx] || window.location.href;
      const commentsList = Array.isArray(ladoFbCollectedComments) ? [...ladoFbCollectedComments] : [];

      showPersistentScanBanner(`🍁 Đang mở & quét bài viết ${idx + 1}/${totalPosts}... (Đã gom ${commentsList.length} bình luận)`, Math.round(((idx) / totalPosts) * 90));

      const collectedMap = new Map();
      commentsList.forEach(c => {
        const sig = `${c.postUrl}:::${(c.authorName || '').toLowerCase()}:::${(c.message || '').toLowerCase()}`;
        collectedMap.set(sig, c);
      });

      // Mở bung tất cả bình luận trong bài viết hiện tại
      await performDeepPostScan(currentUrl, collectedMap);

      const updatedComments = Array.from(collectedMap.values());
      const nextIdx = idx + 1;

      if (nextIdx < totalPosts) {
        // Cập nhật storage và chuyển sang mở bài viết tiếp theo
        chrome.storage.local.set({
          ladoFbScanIndex: nextIdx,
          ladoFbCollectedComments: updatedComments
        }, () => {
          showPersistentScanBanner(`✅ Đã quét xong bài ${idx + 1}! Đang mở bài viết ${nextIdx + 1}/${totalPosts}...`, Math.round((nextIdx / totalPosts) * 90));
          setTimeout(() => {
            window.location.href = ladoFbScanQueue[nextIdx];
          }, 800);
        });
      } else {
        // ĐÃ MỞ VÀ QUÉT HẾT TẤT CẢ CÁC BÀI VIẾT!
        finishAndSyncAllScannedComments(updatedComments, totalPosts);
      }
      return;
    }

    // B. NẾU MỚI BẮT ĐẦU TỪ DASHBOARD (KHỞI TẠO TÌM BÀI VIẾT TRÊN FANPAGE)
    if (isAutoScanParam && !window.__LADO_FB_SCAN_INITIATED__) {
      window.__LADO_FB_SCAN_INITIATED__ = true;
      showPersistentScanBanner('🍁 LÁ ĐỎ AI - Đang tìm tất cả bài viết trên Fanpage để mở từng bài...', 15);

      // Chờ Fanpage render
      await new Promise(r => setTimeout(r, 1200));

      // Cuộn để nạp danh sách link bài viết trên Timeline
      for (let s = 1; s <= 3; s++) {
        window.scrollBy({ top: 800, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 450));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 300));

      const discoveredUrls = discoverAllPostUrlsOnPage();

      if (discoveredUrls.length > 0) {
        const queueToScan = discoveredUrls.slice(0, 10); // Lấy tối đa 10 bài viết mới nhất
        showPersistentScanBanner(`🎯 Đã tìm thấy ${queueToScan.length} bài viết! Bắt đầu mở bài viết 1...`, 20);

        chrome.storage.local.set({
          ladoFbScanActive: true,
          ladoFbScanQueue: queueToScan,
          ladoFbScanIndex: 0,
          ladoFbCollectedComments: []
        }, () => {
          setTimeout(() => {
            window.location.href = queueToScan[0];
          }, 700);
        });
      } else {
        // Fallback nếu không tìm thấy link lẻ: quét trực tiếp trang hiện tại
        const collectedMap = new Map();
        await performDeepPostScan(window.location.href, collectedMap);
        finishAndSyncAllScannedComments(Array.from(collectedMap.values()), 1);
      }
    }
  });
}

// Tự động kiểm tra scan khi script load
if (document.readyState === 'complete') {
  checkAndTriggerAutoScanFacebook();
} else {
  window.addEventListener('load', () => checkAndTriggerAutoScanFacebook());
}
