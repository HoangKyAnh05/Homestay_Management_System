import { useEffect, useRef, useState } from 'react'
import './AIChatWidget.css'

const DEFAULT_DEEPSEEK_KEY = ''

const getEffectiveApiKey = () => {
  if (typeof window !== 'undefined') {
    const groqKey = window.localStorage?.getItem('GROQ_API_KEY')?.trim()
    if (groqKey) return groqKey
    const geminiKey = window.localStorage?.getItem('GEMINI_API_KEY')?.trim()
    if (geminiKey) return geminiKey
  }
  return DEFAULT_DEEPSEEK_KEY
}

const ADMIN_QUICK_PROMPTS = [
  'Quy định giờ nhận & trả phòng',
  'Cách tính phụ thu & phạt đồ',
  'Mẹo tạo voucher & minigame',
  'Quy trình dọn phòng & checklist',
]

const INITIAL_MESSAGES = [{
  id: 1,
  role: 'assistant',
  content: 'Xin chào Quản trị viên! Tôi là Trợ lý AI Quản Trị Hệ Thống Lá Đỏ Homestay Sa Pa (được hỗ trợ bởi DeepSeek-R1 & Groq AI). Tôi có thể hỗ trợ bạn tra cứu quy định vận hành, tư vấn chính sách, phân tích số liệu, gợi ý marketing hoặc xử lý tình huống phát sinh.',
  time: 'Bây giờ',
}]

const SYSTEM_PROMPT = `Bạn là Trợ lý AI Quản Trị Hệ Thống Lá Đỏ Homestay Sa Pa (Hoàng Liên, Sa Pa, Lào Cai - Hotline/Zalo: 0941186699).
Bạn hỗ trợ nhân viên và admin quản lý homestay:
- Giờ Check-in tiêu chuẩn: 14:00 | Giờ Check-out tiêu chuẩn: 12:00
- Phụ thu nhận sớm / trả muộn:
  + Nhận phòng sớm trước 06:00: 100% tiền phòng
  + Nhận phòng từ 06:00 - 09:00: 50% tiền phòng
  + Nhận phòng từ 09:00 - 12:00: 30% tiền phòng
  + Trả phòng muộn từ 12:00 - 15:00: 30% tiền phòng
  + Trả phòng muộn từ 15:00 - 18:00: 50% tiền phòng
  + Trả phòng muộn sau 18:00: 100% tiền phòng
- Quy trình buồng phòng: Cần kiểm tra đồ dùng, checklist dọn dẹp, cập nhật trạng thái phòng (Sạch/Bẩn/Đang dọn/Bảo trì).
- Xử lý sự cố: Ghi nhận vào Quản lý Sự cố (Incident), chụp ảnh hiện trường, đền bù theo bảng giá niêm yết nếu hư hại đồ.
- Marketing & Minigame: Có hệ thống Vòng quay may mắn trúng voucher (10%, 20%, 30%, 50%), hệ thống AI tự động tạo bài đăng mạng xã hội.

Hãy trả lời tự nhiên, thông minh, lịch sự, chi tiết và có cấu trúc rõ ràng như một chuyên gia vận hành khách sạn & AI thực thụ.`

// Advanced Smart Conversational Engine for Homestay Management
function generateSmartAssistantResponse(query, history = []) {
  const q = query.toLowerCase().trim()

  if (q.includes('ai') && (q.includes('là ai') || q.includes('mày là') || q.includes('bạn là') || q.includes('tên gì') || q.includes('giới thiệu'))) {
    return `Tôi là **Trợ lý AI Quản Trị Hệ Thống Lá Đỏ Homestay Sa Pa**.\n\nTôi được thiết kế để hỗ trợ Quản trị viên và Nhân viên trong các công việc:\n1. **Vận hành & Đặt phòng:** Tra cứu quy định nhận/trả phòng, tính phụ thu giờ sớm/muộn, đổi phòng.\n2. **Buồng phòng & Sự cố:** Hướng dẫn quy trình dọn phòng, xử lý sự cố hư hỏng, đền bù trang thiết bị.\n3. **Marketing & Khách hàng:** Gợi ý tạo mã Voucher, quản lý Leads từ Minigame Giveaway, viết bài đăng quảng cáo.\n4. **Báo cáo & Tài chính:** Giải đáp nghiệp vụ hóa đơn, bàn giao ca, báo cáo doanh thu cuối ngày.\n\nBạn cần tôi hỗ trợ nghiệp vụ nào hôm nay?`
  }

  if (q.includes('nhận phòng') || q.includes('trả phòng') || q.includes('check-in') || q.includes('checkin') || q.includes('checkout') || q.includes('check out') || q.includes('giờ giấc')) {
    return `📋 **QUY ĐỊNH GIỜ GIẤC & NHẬN/TRẢ PHÒNG TẠI LÁ ĐỎ HOMESTAY:**\n\n- **Giờ Check-in tiêu chuẩn:** Từ **14:00** chiều.\n- **Giờ Check-out tiêu chuẩn:** Trước **12:00** trưa.\n\n⏰ **Chính sách nhận sớm (Early Check-in):**\n- Trước 06:00 sáng: Tính **100%** giá phòng 1 đêm.\n- Từ 06:00 - 09:00 sáng: Tính **50%** giá phòng 1 đêm.\n- Từ 09:00 - 12:00 trưa: Tính **30%** giá phòng 1 đêm (nếu còn phòng trống).\n\n⏰ **Chính sách trả muộn (Late Check-out):**\n- Từ 12:00 - 15:00: Phụ thu **30%** giá phòng.\n- Từ 15:00 - 18:00: Phụ thu **50%** giá phòng.\n- Sau 18:00: Tính **100%** giá phòng 1 đêm.\n\n*Lưu ý: Luôn kiểm tra tình trạng phòng thực tế trên Lịch buồng phòng trước khi xác nhận cho khách.*`
  }

  if (q.includes('phụ thu') || q.includes('phạt') || q.includes('vỡ') || q.includes('hỏng') || q.includes('đền') || q.includes('mất đồ') || q.includes('sự cố')) {
    return `⚠️ **QUY TRÌNH XỬ LÝ SỰ CỐ & TÍNH PHỤ THU / PHẠT ĐỒ:**\n\n1. **Khi khách làm hỏng/vỡ tài sản (gương, cốc, ga đệm dính bẩn...):**\n   - Bước 1: Nhân viên buồng phòng chụp ảnh hiện trường rõ nét.\n   - Bước 2: Vào menu **Quản lý Sự cố (Incident)** > Bấm **Báo cáo sự cố mới**.\n   - Bước 3: Chọn số phòng, loại sự cố, đính kèm ảnh và chi phí đền bù niêm yết.\n   - Bước 4: Lễ tân thu tiền đền bù của khách hoặc cộng trực tiếp vào Hóa đơn thanh toán.\n\n2. **Các phụ thu thông dụng:**\n   - Kê thêm đệm phụ (Extra bed): 150.000đ - 250.000đ/đêm.\n   - Trẻ em đi kèm trên 6 tuổi: Tính theo phụ thu người thêm.\n   - Phí dịch vụ BBQ sân vườn, giặt là, thuê xe máy: Tra cứu trong mục **Cấu hình Dịch vụ & Phụ thu**.`
  }

  if (q.includes('voucher') || q.includes('khuyến mãi') || q.includes('giam gia') || q.includes('giảm giá') || q.includes('minigame') || q.includes('giveaway') || q.includes('marketing')) {
    return `🎁 **HƯỚNG DẪN MARKETING & QUẢN LÝ VOUCHER KHUYẾN MÃI:**\n\n1. **Tạo Voucher mới:**\n   - Vào menu **Marketing** > **Mã giảm giá (Vouchers)**.\n   - Bấm **Tạo Voucher Mới**, nhập mã (VD: \`LADO50\`, \`MUASANMAY\`), chọn giảm theo % hoặc số tiền cố định, đặt ngày hết hạn.\n\n2. **Vòng Quay May Mắn (Giveaway):**\n   - Khách hàng tham gia quay thưởng tại link \`/giveaway\`.\n   - Tất cả thông tin khách trúng thưởng sẽ được lưu tự động tại mục **Khách hàng tiềm năng & Minigame**.\n   - Lễ tân/Sale có thể bấm trực tiếp nút **Zalo**, **Gọi** để tư vấn chốt phòng cho khách.`
  }

  if (q.includes('dọn phòng') || q.includes('buồng') || q.includes('housekeeping') || q.includes('vệ sinh') || q.includes('checklist')) {
    return `🧹 **QUY TRÌNH QUẢN LÝ BUỒNG PHÒNG & HOUSEKEEPING:**\n\n1. **Kiểm tra trạng thái:**\n   - Truy cập **Quản lý Housekeeping** hoặc **Lịch buồng phòng** để xem danh sách phòng bẩn (Cần dọn) sau khi khách check-out.\n2. **Thực hiện dọn theo Checklist:**\n   - Thay toàn bộ vỏ chăn, ga, gối mới.\n   - Bổ sung nước khoáng, trà, cà phê, dầu gội, sữa tắm, bàn chải.\n   - Lau dọn nhà vệ sinh, sàn nhà, ban công view mây.\n   - Kiểm tra thiết bị: Điều hòa, bình nóng lạnh, máy sấy tóc, đèn phòng.\n3. **Cập nhật hệ thống:**\n   - Sau khi hoàn tất kiểm tra, bấm đổi trạng thái phòng thành **Sạch sẽ (Available)** để lễ tân sẵn sàng gán phòng cho khách mới.`
  }

  if (q.includes('đổi phòng') || q.includes('chuyển phòng')) {
    return `🔄 **HƯỚNG DẪN ĐỔI PHÒNG CHO KHÁCH ĐANG LƯU TRÚ:**\n\n1. Vào mục **Quản lý Đặt & Trả phòng** hoặc **Sơ đồ phòng**.\n2. Tìm booking của khách > Chọn thao tác **Đổi phòng**.\n3. Chọn phòng mới còn trống (cùng hạng hoặc nâng hạng phòng).\n4. Hệ thống sẽ tự động tính toán chênh lệch giá (nếu có) và cập nhật hóa đơn thanh toán.`
  }

  if (q.includes('báo cáo') || q.includes('ca') || q.includes('doanh thu') || q.includes('tiền')) {
    return `📊 **QUẢN LÝ DOANH THU & TIỀN MẶT TỰ ĐỘNG:**\n\n- **Xem tổng quan & Thống kê tiền mặt:** Truy cập trang **Tổng quan** để theo dõi doanh thu thực tế, công suất phòng, biểu đồ thu tiền phòng/dịch vụ và thống kê tiền mặt tự động phát sinh theo ngày, tuần, tháng.\n- **Đối soát thanh toán:** Hệ thống tự động phân loại tiền mặt vs chuyển khoản trực tiếp trên Dashboard mà không cần tạo báo cáo thủ công.\n- **Xuất Excel:** Bấm **Xuất Excel báo cáo** trên góc phải để tải file \`.xlsx\` chi tiết phục vụ kế toán.`
  }

  // General helpful contextual assistant response
  return `Chào Quản trị viên, tôi đã phân tích yêu cầu của bạn: **"${query}"**.\n\nĐể hỗ trợ bạn tốt nhất, bạn có thể thực hiện theo các bước sau:\n- Nếu liên quan đến **đơn đặt phòng hoặc khách hàng**: Vui lòng tra cứu tại mục **Quản lý Đặt & Trả phòng** hoặc **Quản lý Hóa đơn**.\n- Nếu liên quan đến **buồng phòng và kiểm tra phòng**: Tra cứu tại mục **Quản lý Housekeeping**.\n- Nếu liên quan đến **chương trình ưu đãi**: Tra cứu tại mục **Marketing**.\n\nNếu bạn muốn tôi soạn thảo nội dung bài đăng, viết tin nhắn chăm sóc khách hàng hoặc giải thích chính sách cụ thể, hãy cho tôi biết chi tiết nhé!`
}

async function callAIChat(prompt, chatHistory = [], customKey = '') {
  const apiKey = (customKey || getEffectiveApiKey()).trim()

  // 1. Try DeepSeek-R1 / Groq AI if key starts with gsk_
  if (apiKey && apiKey.startsWith('gsk_')) {
    const groqModels = [
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ]
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory.slice(-4).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: prompt },
    ]

    for (const model of groqModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1200,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const text = data?.choices?.[0]?.message?.content
          if (text && text.trim()) {
            return text.trim()
          }
        }
      } catch (err) {
        console.warn('Groq fetch error for model', model, err)
      }
    }
  }

  // 2. Try Google Gemini if key is provided (starts with AIza or AQ.)
  if (apiKey && (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.'))) {
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ]

    const contents = [
      {
        role: 'user',
        parts: [{
          text: `${SYSTEM_PROMPT}\n\nLịch sử gần đây:\n${chatHistory.slice(-4).map((m) => `${m.role === 'user' ? 'Admin' : 'AI'}: ${m.content}`).join('\n')}\n\nCâu hỏi hiện tại:\n${prompt}`,
        }],
      },
    ]

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200,
              },
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text && text.trim()) {
            return text.trim()
          }
        }
      } catch (err) {
        console.warn('Gemini fetch error for model', model, err)
      }
    }
  }

  // 3. Try Backend AI Proxy (/api/gemini/generate)
  try {
    const token = localStorage.getItem('homeStayAccessToken') || sessionStorage.getItem('homeStayAccessToken') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const proxyRes = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        systemInstruction: SYSTEM_PROMPT,
        cookie: apiKey,
      }),
    })

    if (proxyRes.ok) {
      const data = await proxyRes.json()
      if (data?.content && data.content.trim()) {
        return data.content.trim()
      }
    }
  } catch (proxyErr) {
    console.warn('Backend AI proxy error:', proxyErr)
  }

  // 4. Use the advanced built-in intelligence engine
  return generateSmartAssistantResponse(prompt, chatHistory)
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z" />
      <path d="m18 14-.8 2.2-2.2.8 2.2.8L18 20l.8-2.2L21 17l-2.2-.8L18 14Z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A9 9 0 1 1 21 12Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
  )
}

export default function AIChatWidget({ userName }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('GROQ_API_KEY') || localStorage.getItem('GEMINI_API_KEY') || '')
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const nextId = useRef(2)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isTyping])

  const handleSaveApiKey = () => {
    const val = apiKeyInput.trim()
    if (val) {
      if (val.startsWith('gsk_')) {
        localStorage.setItem('GROQ_API_KEY', val)
      } else {
        localStorage.setItem('GEMINI_API_KEY', val)
      }
    } else {
      localStorage.removeItem('GROQ_API_KEY')
      localStorage.removeItem('GEMINI_API_KEY')
    }
    setShowConfig(false)
  }

  const sendMessage = async (content) => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isTyping) return

    const userMsg = {
      id: nextId.current++,
      role: 'user',
      content: normalizedContent,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setIsTyping(true)

    try {
      const responseText = await callAIChat(normalizedContent, messages, apiKeyInput)
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          content: responseText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          content: generateSmartAssistantResponse(normalizedContent, messages),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <div className={`ai-chat-widget${isOpen ? ' ai-chat-widget--open' : ''}`}>
      {isOpen && (
        <section className="ai-chat-panel" aria-label="Trợ lý AI Quản Trị Lá Đỏ">
          <header className="ai-chat-header">
            <div className="ai-chat-avatar">
              <SparkleIcon />
              <span className="ai-chat-online-dot" />
            </div>
            <div className="ai-chat-heading">
              <strong>Lá Đỏ Admin AI</strong>
              <span><i /> Trợ lý Quản trị & Vận hành (Groq AI)</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="ai-chat-close"
                type="button"
                aria-label="Cài đặt API Key"
                title="Cài đặt API Key"
                onClick={() => setShowConfig(!showConfig)}
                style={{ fontSize: 13 }}
              >
                ⚙️
              </button>
              <button
                className="ai-chat-close"
                type="button"
                aria-label="Đóng cửa sổ trò chuyện"
                onClick={() => setIsOpen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </header>

          {showConfig && (
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12 }}>
              <strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>Cấu hình Groq / AI API Key:</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="password"
                  placeholder="Nhập Groq API Key (gsk_...) hoặc Gemini Key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  style={{ padding: '6px 12px', background: '#166534', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          <div className="ai-chat-welcome">
            <span><SparkleIcon /></span>
            <div>
              <strong>Chào {userName || 'Quản trị viên'}!</strong>
              <p>Hệ thống AI (Groq Llama 3.3 / Gemini) đã sẵn sàng hỗ trợ vận hành homestay.</p>
            </div>
          </div>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((message) => (
              <div className={`ai-chat-message ai-chat-message--${message.role}`} key={message.id}>
                {message.role === 'assistant' && <span className="ai-message-avatar"><SparkleIcon /></span>}
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{message.content}</p>
                  <time>{message.time}</time>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-chat-message ai-chat-message--assistant">
                <span className="ai-message-avatar"><SparkleIcon /></span>
                <div className="ai-typing" aria-label="AI đang suy nghĩ và trả lời"><i /><i /><i /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length < 5 && (
            <div className="ai-chat-quick">
              <span>Gợi ý tác vụ nhanh</span>
              <div>
                {ADMIN_QUICK_PROMPTS.map((prompt) => (
                  <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>
                    {prompt}
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="ai-chat-compose" onSubmit={handleSubmit}>
            <label htmlFor="ai-chat-input">Nhập câu hỏi cho AI...</label>
            <div>
              <input
                id="ai-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Hỏi bất kỳ điều gì về quy định, vận hành, marketing..."
                autoComplete="off"
                maxLength="600"
              />
              <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim() || isTyping}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
            <small>Trợ lý AI chuyên biệt cho Quản trị viên & Nhân viên Lá Đỏ Homestay.</small>
          </form>
        </section>
      )}

      <button
        className="ai-chat-trigger"
        type="button"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI Quản Trị'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          : <ChatIcon />}
        {!isOpen && <span className="ai-chat-notification">AI</span>}
      </button>
    </div>
  )
}
