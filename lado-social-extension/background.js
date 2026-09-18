// Lá Đỏ Homestay Social AI - Service Worker (Background Script)

const DEFAULT_GROQ_KEY = '';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Lá Đỏ Social Extension] Installed successfully.');
  chrome.storage.local.set({
    serverUrl: 'http://localhost:8080',
    groqApiKey: DEFAULT_GROQ_KEY,
    aiTone: 'WARM',
    enableYoutube: true,
    enableFacebook: true,
    autoSubmit: true,
    scannedCount: 0,
    repliedCountToday: 0
  });
});

// Watch tab updates for auto-scan trigger URLs and pending highlight triggers
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (changeInfo.url.includes('lado_auto_scan=true') || changeInfo.url.includes('lado_auto_scan')) {
      chrome.storage.local.set({ [`auto_scan_tab_${tabId}`]: true });
    }
  }
  if (changeInfo.status === 'complete' && tab && tab.url) {
    // 1. Check auto scan trigger (from URL flag or pendingAutoScan storage)
    chrome.storage.local.get([`auto_scan_tab_${tabId}`, 'pendingAutoScan'], (res) => {
      let shouldScan = false;
      let scanReset = true;

      if (res && res[`auto_scan_tab_${tabId}`]) {
        shouldScan = true;
        chrome.storage.local.remove([`auto_scan_tab_${tabId}`]);
      }

      if (res && res.pendingAutoScan) {
        const { platform, reset, timestamp } = res.pendingAutoScan;
        if (Date.now() - timestamp < 120000) {
          const isMatch = (platform === 'YOUTUBE' && tab.url.includes('youtube.com')) ||
                          (platform === 'TIKTOK' && tab.url.includes('tiktok.com')) ||
                          (platform === 'FACEBOOK' && tab.url.includes('facebook.com'));
          if (isMatch) {
            shouldScan = true;
            scanReset = reset !== false;
          }
        }
      }

      if (shouldScan) {
        const sendTrigger = async () => {
          try {
            const currentTab = await chrome.tabs.get(tabId).catch(() => null);
            if (currentTab && currentTab.id) {
              chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_AUTO_SCAN', reset: scanReset }, () => {
                if (chrome.runtime.lastError) { /* ignore */ }
              });
            }
          } catch (e) {}
        };
        setTimeout(sendTrigger, 800);
        setTimeout(sendTrigger, 2200);
        setTimeout(sendTrigger, 3800);
      }
    });

    // 2. Check pending highlight for Facebook, TikTok, YouTube
    if (tab.url.includes('facebook.com') || tab.url.includes('youtube.com') || tab.url.includes('tiktok.com')) {
      chrome.storage.local.get(['pendingHighlight'], (res) => {
        if (res && res.pendingHighlight) {
          const { commentText, authorName, postUrl, timestamp } = res.pendingHighlight;
          if (Date.now() - timestamp < 180000) {
            setTimeout(async () => {
              try {
                const currentTab = await chrome.tabs.get(tabId).catch(() => null);
                if (currentTab && currentTab.id) {
                  chrome.tabs.sendMessage(tabId, {
                    action: 'HIGHLIGHT_COMMENT',
                    commentText,
                    authorName,
                    postUrl
                  }, () => {
                    if (chrome.runtime.lastError) { /* ignore */ }
                  });
                }
              } catch (e) {}
            }, 800);
          }
        }
      });
    }
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_CONFIG') {
    chrome.storage.local.get(['serverUrl', 'groqApiKey', 'aiTone', 'jwtToken', 'enableYoutube', 'enableFacebook', 'autoSubmit'], (config) => {
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
      .then(reply => sendResponse({ success: true, reply }))
      .catch(error => {
        const fallback = generateLocalSmartReply(request.payload?.commentText || '', request.payload?.tone || 'WARM');
        sendResponse({ success: true, reply: fallback });
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

  if (request.action === 'FORWARD_REPLY_TO_SOCIAL_TAB') {
    handleForwardReplyToSocialTab(request.payload)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
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

  console.log('[Lá Đỏ Social Hub] Background syncing comments to backend:', serverUrl, payload?.comments?.length);

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
      console.warn('[Lá Đỏ Social AI] Direct Groq API failed, trying Backend:', err);
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
    console.warn('[Lá Đỏ Social AI] Backend request failed:', err);
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

  const systemPrompt = `Bạn là Trợ lý AI Chăm sóc Khách hàng & Marketing của "Lá Đỏ Homestay Sa Pa" (Homestay ngắm trọn thung lũng Mường Hoa & biển mây Sa Pa, có tiệc nướng BBQ Tây Bắc, cafe săn mây, phòng view kính).

QUY TẮC PHẢN HỒI:
1. PHẢN HỒI ĐÚNG TRỌNG TÂM: Đọc kỹ bình luận của khách để trả lời chính xác điều khách đang nói hoặc hỏi.
   - Nếu khách chào hỏi/alo/hello: Chào lại thân mật, tươi vui, hỏi xem bạn ấy đang lên kế hoạch du lịch Sa Pa hay cần tư vấn phòng view mây.
   - Nếu khách hỏi giá/phòng/đặt chỗ: Báo giá tham khảo mềm (từ 450k - 1tr2/đêm tùy hạng phòng), gợi ý nhắn tin để nhận ảnh phòng và voucher mới nhất.
   - Nếu khách khen cảnh đẹp/mê/chill: Cảm ơn chân thành, mời bạn ghé trải nghiệm thực tế ngắm mây Mường Hoa.
   - Nếu khách hỏi dịch vụ/ăn uống/BBQ: Giới thiệu BBQ ngoài trời cực chill và cafe săn mây.
2. ĐA DẠNG & SÁNG TẠO: Mỗi lần trả lời phải viết một câu hoàn toàn mới, biến hóa từ ngữ, TUYỆT ĐỐI KHÔNG DÙNG VĂN MẪU RẬP KHUÔN.
3. NGẮN GỌN & CÓ DUYÊN: Độ dài 1-2 câu súc tích, tự nhiên như người thật, kèm 1-2 emoji sinh động (🌸, 🌿, 🏡, ☁️, ✨, ❤️, ⛰️).
4. ĐỊNH DẠNG: Chỉ trả về nội dung câu trả lời thuần túy, không có dấu ngoặc kép bọc ngoài.`;

  const userPrompt = `Tên khách: ${authorName || 'Khách hàng'}
Bình luận của khách: "${commentText}"
Bài viết/Video: "${postContent || postTitle || 'Lá Đỏ Homestay Sa Pa view thung lũng Mường Hoa'}"
Phong cách: ${toneDesc}

Hãy viết một câu trả lời mới mẻ, hấp dẫn, đúng ngữ cảnh:`;

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
          max_tokens: 250
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
  const namePrefix = authorName && authorName !== 'Khách' && authorName !== 'Khách hàng' ? `Chào bạn ${authorName}! ` : 'Dạ chào bạn! ';

  if (lower.includes('giá') || lower.includes('nhiêu') || lower.includes('tiền') || lower.includes('cost') || lower.includes('price') || lower.includes('phòng')) {
    const list = [
      `${namePrefix}Giá phòng tại Lá Đỏ Homestay Sa Pa dao động từ 450.000đ - 1.200.000đ/đêm tùy theo hạng phòng view ngắm thung lũng Mường Hoa và biển mây thơ mộng ạ 🌿. Bạn nhắn tin để Lá Đỏ gửi ảnh phòng và tư vấn ưu đãi nhé! 🏡✨`,
      `${namePrefix}Hiện Lá Đỏ có nhiều hạng phòng view thung lũng cực chill từ 450k/đêm ạ ☁️. Bạn dự định đi ngày nào để bên mình kiểm tra phòng trống và giữ phòng đẹp nhất cho bạn nha! 🌸`,
      `${namePrefix}Phòng nghỉ tại Lá Đỏ giá chỉ từ 450.000đ/đêm có ban công ngắm mây Mường Hoa siêu lãng mạn ạ ⛰️. Bạn inbox để nhận bảng giá chi tiết kèm voucher giảm 10% nhé! ❤️`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (lower.includes('ở đâu') || lower.includes('địa chỉ') || lower.includes('chỗ nào') || lower.includes('location') || lower.includes('view') || lower.includes('mây')) {
    const list = [
      `${namePrefix}Lá Đỏ Homestay tọa lạc ngay tại Sa Pa với vị trí đắc địa ngắm trọn thung lũng Mường Hoa và biển mây ngút ngàn ạ! Mời bạn ghé chơi săn mây và thưởng thức BBQ cùng Lá Đỏ nhé! ☁️🌸`,
      `${namePrefix}Homestay nằm ở vị trí ôm trọn view Mường Hoa thơ mộng, đường đi rất thuận tiện và có bãi đỗ xe rộng rãi bạn nhé 🏡✨. Ghé Lá Đỏ check-in thôi nào!`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (lower.includes('lô') || lower.includes('alo') || lower.includes('hello') || lower.includes('hi') || lower.includes('chào') || lower.includes('ơi')) {
    const list = [
      `${namePrefix}Lá Đỏ Homestay Sa Pa chào bạn ạ! 🌸 Rất vui được đón tiếp bạn. Bạn đang quan tâm đến phòng nghỉ dưỡng hay trải nghiệm săn mây gì tại Sa Pa, hãy nhắn Lá Đỏ hỗ trợ bạn ngay nhé! ✨🏡`,
      `${namePrefix}Lá Đỏ đây ạ! Chúc bạn một ngày thật tuyệt vời 🌿. Bạn đang lên kế hoạch du lịch Sa Pa đúng không nè, nhắn bên mình tư vấn lịch trình và phòng xinh nha! ☁️❤️`,
      `${namePrefix}Chào bạn! Rất vui được tương tác cùng bạn 🌸. Sa Pa mùa này đang vào đợt mây đẹp lắm, bạn có dự định ghé Lá Đỏ nghỉ dưỡng săn mây không ạ? 🏡⛰️`
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (tone === 'PROMO') {
    return `${namePrefix}Lá Đỏ Homestay cảm ơn bạn đã quan tâm! Tặng bạn mã ưu đãi giảm 10% khi đặt phòng trực tiếp tại Lá Đỏ Homestay Sa Pa trong tuần này ạ. Bạn nhắn tin để bên mình giữ phòng view đẹp nhất cho bạn nhé! 🎁✨`;
  }

  if (tone === 'GRATITUDE') {
    return `${namePrefix}Lá Đỏ Homestay Sa Pa xin chân thành cảm ơn tình cảm và sự ủng hộ quý báu của bạn ạ! Chúc bạn luôn có những chuyến hành trình du lịch Sa Pa thật nhiều niềm vui và ý nghĩa! ❤️🌿`;
  }

  const defaultList = [
    `${namePrefix}Lá Đỏ Homestay Sa Pa xin chào và cảm ơn bạn đã theo dõi ạ! Nếu bạn cần thêm thông tin về phòng ốc, dịch vụ nướng BBQ hay săn mây Sa Pa thì đừng ngần ngại nhắn tin cho Lá Đỏ nhé! 🌸🌿`,
    `${namePrefix}Cảm ơn bạn đã tương tác cùng Lá Đỏ Homestay! Chúc bạn một ngày ngập tràn năng lượng và hẹn sớm gặp bạn tại Sa Pa mộng mơ nhé! ☁️🏡✨`
  ];
  return defaultList[Math.floor(Math.random() * defaultList.length)];
}

async function handleForwardReplyToSocialTab({ platform, videoId, parentCommentId, message }) {
  const tabs = await chrome.tabs.query({});
  let targetTab = null;

  if (platform === 'YOUTUBE') {
    targetTab = tabs.find(t => t.url && t.url.includes('youtube.com') && (videoId ? t.url.includes(videoId) : true));
  } else if (platform === 'FACEBOOK') {
    targetTab = tabs.find(t => t.url && t.url.includes('facebook.com'));
  }

  if (!targetTab || !targetTab.id) {
    return {
      success: false,
      error: `Không tìm thấy tab ${platform} đang mở để tự động gửi. Hãy mở video YouTube hoặc bài viết Facebook trong 1 tab trình duyệt.`
    };
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(targetTab.id, {
      action: 'EXECUTE_POST_REPLY',
      parentCommentId,
      message
    }, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(res || { success: true });
      }
    });
  });
}
