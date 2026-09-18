// Lá Đỏ Homestay TikTok AI - Service Worker (Background Script)

const DEFAULT_GROQ_KEY = '';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Lá Đỏ TikTok AI Extension] Installed successfully.');
  chrome.storage.local.set({
    serverUrl: 'http://localhost:8080',
    groqApiKey: DEFAULT_GROQ_KEY,
    aiTone: 'WARM',
    enableTiktokButton: true,
    autoSubmit: true,
    scannedCount: 0,
    repliedCountToday: 0
  });
});

// Watch tab updates for auto-scan trigger URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (changeInfo.url.includes('lado_auto_scan=true') || changeInfo.url.includes('lado_auto_scan')) {
      chrome.storage.local.set({ [`auto_scan_tab_${tabId}`]: true });
    }
  }
  if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes('tiktok.com')) {
    chrome.storage.local.get([`auto_scan_tab_${tabId}`], (res) => {
      if (res && res[`auto_scan_tab_${tabId}`]) {
        chrome.storage.local.remove([`auto_scan_tab_${tabId}`]);
        setTimeout(async () => {
          try {
            const currentTab = await chrome.tabs.get(tabId).catch(() => null);
            if (currentTab && currentTab.id) {
              chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_AUTO_SCAN' }, () => {
                if (chrome.runtime.lastError) { /* ignore */ }
              });
            }
          } catch (e) {}
        }, 1200);
      }
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_CONFIG') {
    chrome.storage.local.get(['serverUrl', 'groqApiKey', 'aiTone', 'jwtToken', 'enableTiktokButton', 'autoSubmit'], (config) => {
      sendResponse(config);
    });
    return true;
  }

  if (request.action === 'RETURN_TO_DASHBOARD' || request.action === 'CLOSE_CURRENT_TAB') {
    handleReturnToDashboard(sender?.tab?.id)
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.action === 'GENERATE_AI_REPLY') {
    handleGenerateAiReply(request.payload)
      .then(reply => sendResponse({ success: true, reply: enforceTikTokCharLimit(reply) }))
      .catch(error => {
        const fallback = generateLocalSmartReply(request.payload?.commentText || '', request.payload?.tone || 'WARM');
        sendResponse({ success: true, reply: enforceTikTokCharLimit(fallback) });
      });
    return true;
  }

  if (request.action === 'RECORD_REPLY_SUCCESS') {
    chrome.storage.local.get(['repliedCountToday'], (data) => {
      const count = (data.repliedCountToday || 0) + 1;
      chrome.storage.local.set({ repliedCountToday: count });
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'SYNC_SCANNED_COMMENTS') {
    handleSyncScannedComments(request.payload)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err?.message || String(err) }));
    return true;
  }

  if (request.action === 'STORE_JWT_TOKEN') {
    if (request.token) {
      chrome.storage.local.set({ jwtToken: request.token });
    }
    sendResponse({ success: true });
    return true;
  }
});

async function handleSyncScannedComments(payload) {
  const config = await chrome.storage.local.get(['serverUrl', 'jwtToken']);
  const serverUrl = config.serverUrl || 'http://localhost:8080';
  const headers = { 'Content-Type': 'application/json' };
  if (config.jwtToken) {
    headers['Authorization'] = `Bearer ${config.jwtToken}`;
  }

  console.log('[Lá Đỏ TikTok AI] Background syncing comments to backend:', serverUrl, payload?.comments?.length);

  const response = await fetch(`${serverUrl}/api/admin/marketing/comments/sync-scanned`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }
  return await response.json();
}

function enforceTikTokCharLimit(text, maxChars = 135) {
  if (!text) return '';
  let clean = text.trim();
  if (clean.length <= maxChars) return clean;

  const sub = clean.slice(0, maxChars);
  const lastDot = sub.lastIndexOf('.');
  const lastExcl = sub.lastIndexOf('!');
  const lastCut = Math.max(lastDot, lastExcl);

  if (lastCut > 35) {
    return sub.slice(0, lastCut + 1).trim();
  }
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 35) {
    return sub.slice(0, lastSpace).trim() + ' ạ! 🌸';
  }
  return sub;
}

async function handleGenerateAiReply({ postTitle, postContent, commentText, tone, authorName }) {
  const config = await chrome.storage.local.get(['serverUrl', 'groqApiKey', 'jwtToken', 'aiTone']);
  const serverUrl = config.serverUrl || 'http://localhost:8080';
  const selectedTone = tone || config.aiTone || 'WARM';
  const apiKey = config.groqApiKey || DEFAULT_GROQ_KEY;

  if (apiKey && apiKey.startsWith('gsk_')) {
    try {
      const groqReply = await callGroqLlm(commentText, selectedTone, apiKey, postTitle, postContent, authorName);
      if (groqReply && groqReply.length > 5) {
        return groqReply;
      }
    } catch (err) {
      console.warn('[Lá Đỏ TikTok AI] Direct Groq API failed, trying Backend:', err);
    }
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (config.jwtToken) {
      headers['Authorization'] = `Bearer ${config.jwtToken}`;
    }

    const response = await fetch(`${serverUrl}/api/admin/marketing/comments/suggest-reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        postTitle: postTitle || 'Lá Đỏ Homestay Sa Pa',
        postContent: postContent || 'Homestay Lá Đỏ Sa Pa view thung lũng Mường Hoa & săn mây',
        commentText: commentText || 'hello',
        tone: selectedTone
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.suggestedReply && data.suggestedReply.trim().length > 0) {
        return data.suggestedReply;
      }
    }
  } catch (err) {
    console.warn('[Lá Đỏ TikTok AI] Backend request failed:', err);
  }

  return generateLocalSmartReply(commentText, selectedTone, authorName);
}

async function callGroqLlm(commentText, tone, apiKey, postTitle, postContent, authorName) {
  const toneMap = {
    'WARM': 'Thân thiện, mến khách, ấm áp, đậm nét homestay Sa Pa ngắm thung lũng Mường Hoa & săn mây',
    'BOOKING_INQUIRY': 'Tư vấn nhiệt tình giá phòng, phòng view mây, hỏi ngày đi và số lượng khách để báo giá ưu đãi nhất',
    'GRATITUDE': 'Chân thành cảm ơn khách đã ghé thăm hoặc khen ngợi, chúc khách một ngày an lành và hẹn gặp tại Sa Pa',
    'PROMO': 'Tặng mã voucher giảm giá 10% khi đặt phòng trực tiếp trong tuần này'
  };
  const toneDesc = toneMap[tone] || 'Thân thiện, hiếu khách, tự nhiên';

  const systemPrompt = `Bạn là Trợ lý AI Chăm sóc Khách hàng & Marketing của "Lá Đỏ Homestay Sa Pa" trên TikTok.
GIỚI HẠN BẮT BUỘC: Câu trả lời TỐI ĐA 120 ký tự (khoảng 1 câu ngắn, tự nhiên, sinh động, kèm emoji 🌸/☁️/🏡).
NỘI DUNG: Trả lời trúng ý câu hỏi của khách, mời bạn ghé Lá Đỏ Homestay Sa Pa ngắm thung lũng Mường Hoa & săn mây.`;

  const userPrompt = `Tên khách: ${authorName || 'Khách hàng'}
Bình luận: "${commentText}"
Video: "${postContent || postTitle || 'Lá Đỏ Homestay Sa Pa'}"
Phong cách: ${toneDesc}

Hãy viết 1 câu trả lời ngắn gọn (dưới 120 ký tự):`;

  const candidateModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound'];

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.92,
          max_tokens: 150
        })
      });

      if (response.ok) {
        const json = await response.json();
        const text = json?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 3) {
          return text.trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      console.debug(`Model ${model} try error:`, e);
    }
  }

  throw new Error('All Groq models failed');
}

function generateLocalSmartReply(commentText, tone, authorName) {
  const lower = (commentText || '').toLowerCase();
  const namePrefix = authorName && authorName !== 'Khách' && authorName !== 'Người dùng TikTok' ? `@${authorName} ` : '';

  if (lower.includes('giá') || lower.includes('nhiêu') || lower.includes('tiền') || lower.includes('cost') || lower.includes('price') || lower.includes('phòng')) {
    const list = [
      `${namePrefix}Dạ giá phòng tại Lá Đỏ chỉ từ 450k/đêm view trọn thung lũng Mường Hoa siêu chill ạ! Bạn nhắn tin để Lá Đỏ tư vấn nhé 🌸🏡`,
      `${namePrefix}Phòng view mây ngắm Mường Hoa giá từ 450k ạ ☁️. Bạn dự định đi ngày nào nhắn Lá Đỏ kiểm tra phòng đẹp nhất nha! ✨`,
      `${namePrefix}Lá Đỏ có phòng view kính ngắm biển mây từ 450k/đêm kèm cafe & BBQ chill lắm ạ! Nhắn Lá Đỏ gửi ảnh phòng nha 🌿❤️`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (lower.includes('ở đâu') || lower.includes('địa chỉ') || lower.includes('chỗ nào') || lower.includes('location') || lower.includes('view') || lower.includes('mây')) {
    const list = [
      `${namePrefix}Lá Đỏ Homestay ở Sa Pa ôm trọn view thung lũng Mường Hoa & biển mây bồng bềnh ạ! Ghé Lá Đỏ check-in thôi nè ☁️🏡`,
      `${namePrefix}Homestay nằm ngay vị trí săn mây ngắm thung lũng Mường Hoa tuyệt đẹp tại Sa Pa bạn nhé! Rất mong được đón tiếp bạn 🌸⛰️`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  const defaultList = [
    `${namePrefix}Lá Đỏ Homestay Sa Pa cảm ơn bạn nhiều ạ! Chúc bạn ngày mới vui vẻ và hẹn sớm gặp bạn tại Sa Pa săn mây nhé ☁️🌸`,
    `${namePrefix}Cảm ơn bạn đã tương tác cùng Lá Đỏ Homestay Sa Pa! Bạn cần tư vấn phòng view mây cứ nhắn Lá Đỏ nha 🏡✨`
  ];
  return defaultList[Math.floor(Math.random() * defaultList.length)];
}

async function handleReturnToDashboard(tabId) {
  try {
    const tabs = await chrome.tabs.query({}).catch(() => []);
    const dashboardTab = tabs.find(t => t.url && (t.url.includes('engagement-inbox') || t.url.includes('5173') || t.url.includes('localhost')));
    
    if (dashboardTab && dashboardTab.id) {
      await chrome.tabs.update(dashboardTab.id, { active: true }).catch(() => {});
      if (dashboardTab.windowId) {
        await chrome.windows.update(dashboardTab.windowId, { focused: true }).catch(() => {});
      }
    }
    
    if (tabId) {
      setTimeout(async () => {
        try {
          const tab = await chrome.tabs.get(tabId).catch(() => null);
          if (tab && tab.id) {
            await chrome.tabs.remove(tabId).catch(() => {});
          }
        } catch (e) {}
      }, 350);
    }
  } catch (e) {
    console.debug('handleReturnToDashboard error:', e);
  }
}
