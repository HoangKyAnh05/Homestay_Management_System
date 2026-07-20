import { useRef, useState } from 'react'
import './AIChatWidget.css'

const QUICK_QUESTIONS = [
  'Tìm phòng cho 2 người',
  'Homestay có tiện nghi gì?',
  'Chính sách nhận phòng',
]

const INITIAL_MESSAGES = [{
  id: 1,
  role: 'assistant',
  content: 'Xin chào! Mình là Homey, trợ lý AI của Home Stays. Mình có thể giúp bạn tìm phòng, khám phá tiện nghi hoặc giải đáp chính sách lưu trú.',
  time: 'Bây giờ',
}]

const DEMO_RESPONSES = {
  'Tìm phòng cho 2 người': 'Tuyệt quá! Bạn dự định nhận phòng và trả phòng vào ngày nào? Mình sẽ gợi ý không gian phù hợp cho 2 người.',
  'Homestay có tiện nghi gì?': 'Home Stays có Wi-Fi, bữa sáng, khu vực thư giãn, hỗ trợ 24/7 và nhiều tiện nghi riêng theo từng hạng phòng.',
  'Chính sách nhận phòng': 'Thời gian nhận phòng tiêu chuẩn là từ 14:00 và trả phòng trước 12:00. Bạn có thể gửi yêu cầu nếu cần nhận sớm hoặc trả muộn.',
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

function AIChatWidget({ userName }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const nextId = useRef(2)

  const sendMessage = (content) => {
    const normalizedContent = content.trim()
    if (!normalizedContent || isTyping) return

    setMessages((current) => [...current, {
      id: nextId.current++,
      role: 'user',
      content: normalizedContent,
      time: 'Bây giờ',
    }])
    setDraft('')
    setIsTyping(true)

    window.setTimeout(() => {
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: 'assistant',
        content: DEMO_RESPONSES[normalizedContent]
          || 'Mình đã ghi nhận câu hỏi của bạn. Khi hệ thống AI được kết nối, mình sẽ tư vấn chi tiết và chính xác hơn nhé!',
        time: 'Bây giờ',
      }])
      setIsTyping(false)
    }, 700)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <div className={`ai-chat-widget${isOpen ? ' ai-chat-widget--open' : ''}`}>
      {isOpen && (
        <section className="ai-chat-panel" aria-label="Trợ lý AI Home Stays">
          <header className="ai-chat-header">
            <div className="ai-chat-avatar">
              <SparkleIcon />
              <span className="ai-chat-online-dot" />
            </div>
            <div className="ai-chat-heading">
              <strong>Homey AI</strong>
              <span><i /> Trợ lý tư vấn trực tuyến</span>
            </div>
            <button className="ai-chat-close" type="button" aria-label="Đóng cửa sổ trò chuyện" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <div className="ai-chat-welcome">
            <span><SparkleIcon /></span>
            <div>
              <strong>Chào {userName || 'bạn'}!</strong>
              <p>Mình có thể giúp gì cho kỳ nghỉ sắp tới của bạn?</p>
            </div>
          </div>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((message) => (
              <div className={`ai-chat-message ai-chat-message--${message.role}`} key={message.id}>
                {message.role === 'assistant' && <span className="ai-message-avatar"><SparkleIcon /></span>}
                <div>
                  <p>{message.content}</p>
                  <time>{message.time}</time>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-chat-message ai-chat-message--assistant">
                <span className="ai-message-avatar"><SparkleIcon /></span>
                <div className="ai-typing" aria-label="Homey đang trả lời"><i /><i /><i /></div>
              </div>
            )}
          </div>

          {messages.length < 3 && (
            <div className="ai-chat-quick">
              <span>Câu hỏi thường gặp</span>
              <div>
                {QUICK_QUESTIONS.map((question) => (
                  <button type="button" key={question} onClick={() => sendMessage(question)}>
                    {question}
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="ai-chat-compose" onSubmit={handleSubmit}>
            <label htmlFor="ai-chat-input">Nhập câu hỏi cho Homey</label>
            <div>
              <input
                id="ai-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                autoComplete="off"
                maxLength="500"
              />
              <button type="submit" aria-label="Gửi tin nhắn" disabled={!draft.trim() || isTyping}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
            <small>Homey AI có thể đưa ra thông tin chưa chính xác.</small>
          </form>
        </section>
      )}

      <button
        className="ai-chat-trigger"
        type="button"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen
          ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          : <ChatIcon />}
        {!isOpen && <span className="ai-chat-notification">1</span>}
      </button>

      {!isOpen && (
        <button className="ai-chat-invitation" type="button" onClick={() => setIsOpen(true)}>
          <strong>Cần tư vấn?</strong>
          <span>Trò chuyện cùng Homey AI</span>
        </button>
      )}
    </div>
  )
}

export default AIChatWidget
