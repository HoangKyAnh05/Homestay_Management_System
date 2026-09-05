import { useEffect, useRef, useState } from 'react'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { readNdjsonStream } from '../../utils/readNdjsonStream'
import './CustomerAiChat.css'

const STREAM_API_URL = (import.meta.env.VITE_API_URL || '') + '/api/ai/customer/chat/stream'
const SESSION_STORAGE_KEY = 'homeStayAiChatSessionId'
const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! Mình có thể tư vấn phòng, dịch vụ, chính sách và hỗ trợ kiểm tra booking khi bạn đăng nhập.',
}

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing
  const generated = window.crypto?.randomUUID?.().replaceAll('-', '')
    || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated)
  return generated
}

function quickQuestions(authenticated) {
  return authenticated
    ? ['Booking gần nhất của tôi?', 'Tôi còn phải thanh toán bao nhiêu?', 'Có những dịch vụ nào?']
    : ['Có những loại phòng nào?', 'Có những dịch vụ nào?', 'Hướng dẫn tôi đặt phòng']
}

export default function CustomerAiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sessionId] = useState(getSessionId)
  const messageListRef = useRef(null)
  const abortControllerRef = useRef(null)
  const user = getStoredUser()
  const token = getStoredToken()
  const authenticated = user?.role === 'ROLE_CUSTOMER' && Boolean(token)

  useEffect(() => {
    if (!open) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  useEffect(() => {
    if (!open || !messageListRef.current) return
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [messages, open, sending])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const sendMessage = async (messageText) => {
    const question = messageText.trim()
    if (!question || sending) return

    const history = messages
      .filter((message) => message !== WELCOME_MESSAGE)
      .filter((message) => message.content?.trim())
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setMessages((current) => [
      ...current,
      { role: 'user', content: question },
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])
    setInput('')
    setError('')
    setSending(true)
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(STREAM_API_URL, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          message: question,
          sessionId,
          pagePath: `${window.location.pathname}${window.location.search}`,
          history,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'AI chat đang tạm thời không khả dụng.')
      }
      let finalAnswer = ''
      await readNdjsonStream(response, (event) => {
        const payload = event.payload || {}
        if (event.type === 'delta') {
          const text = payload.text || ''
          finalAnswer += text
          setMessages((current) => current.map((message) => (
            message.id === assistantMessageId
              ? { ...message, content: `${message.content || ''}${text}` }
              : message
          )))
        } else if (event.type === 'done') {
          finalAnswer = payload.answer || finalAnswer
          setMessages((current) => current.map((message) => (
            message.id === assistantMessageId
              ? { ...message, content: finalAnswer || 'Mình chưa có câu trả lời phù hợp.' }
              : message
          )))
        } else if (event.type === 'error') {
          throw new Error(payload.message || 'AI chat đang tạm thời không khả dụng.')
        }
      })
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message)
        setMessages((current) => current.filter((message) => message.id !== assistantMessageId || message.content))
      }
    } finally {
      if (!controller.signal.aborted) setSending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  return (
    <div className={`customer-ai-chat${open ? ' is-open' : ''}`}>
      {open && (
        <section className="customer-ai-panel" role="dialog" aria-modal="false" aria-labelledby="customer-ai-title">
          <header className="customer-ai-header">
            <div className="customer-ai-avatar" aria-hidden="true">AI</div>
            <div>
              <h2 id="customer-ai-title">Trợ lý Home Stays</h2>
              <p><span /> Sẵn sàng hỗ trợ</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý AI">×</button>
          </header>

          <div className="customer-ai-messages" ref={messageListRef} aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`customer-ai-message customer-ai-message--${message.role}`}
                key={message.id || `${message.role}-${index}-${message.content.slice(0, 20)}`}
              >
                {message.role === 'assistant' && <span className="customer-ai-mini-avatar">AI</span>}
                {message.role === 'assistant' && !message.content && sending ? (
                  <div className="customer-ai-typing" aria-label="AI đang trả lời"><i /><i /><i /></div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="customer-ai-suggestions">
              {quickQuestions(authenticated).map((question) => (
                <button type="button" key={question} onClick={() => sendMessage(question)}>
                  {question}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="customer-ai-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>×</button>
            </div>
          )}

          <form className="customer-ai-form" onSubmit={handleSubmit}>
            <textarea
              rows="1"
              maxLength="1000"
              placeholder="Nhập câu hỏi của bạn..."
              aria-label="Câu hỏi cho trợ lý AI"
              value={input}
              disabled={sending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit(event)
                }
              }}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Gửi câu hỏi">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m4 4 16 8-16 8 3-8-3-8Z" />
                <path d="M7 12h13" />
              </svg>
            </button>
          </form>
          <footer>
            AI có thể nhầm lẫn. Giá và phòng trống cần được xác nhận trên hệ thống.
          </footer>
        </section>
      )}

      <button
        type="button"
        className="customer-ai-launcher"
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <span aria-hidden="true">×</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5.5h14v10H9l-4 3v-13Z" />
              <path d="M8 9h8M8 12h5" />
            </svg>
            <b>AI</b>
          </>
        )}
      </button>
    </div>
  )
}
