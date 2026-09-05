import { useEffect, useRef, useState } from 'react'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { readNdjsonStream } from '../../utils/readNdjsonStream'
import './StaffAiChat.css'

const STREAM_API_URL = (import.meta.env.VITE_API_URL || '') + '/api/ai/staff/chat/stream'
const SESSION_STORAGE_KEY = 'homeStayStaffAiChatSessionId'
const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! Mình có thể hỗ trợ tóm tắt booking, check-in/out, phòng, doanh thu và các việc cần chú ý trong ca trực.',
}

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing
  const generated = window.crypto?.randomUUID?.().replaceAll('-', '')
    || `staff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated)
  return generated
}

function quickQuestions(role) {
  return role === 'ROLE_RECEPTIONIST'
    ? ['Hôm nay có booking nào cần check-in?', 'Tóm tắt phòng đang lưu trú', 'Việc nào cần chú ý khi checkout?']
    : ['Tóm tắt tình hình 7 ngày gần đây', 'Phòng nào đang có doanh thu tốt?', 'Hôm nay có booking nào cần theo dõi?']
}

export default function StaffAiChat() {
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
      const response = await fetch(STREAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
        throw new Error(data.message || 'AI nội bộ đang tạm thời không khả dụng.')
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
          throw new Error(payload.message || 'AI nội bộ đang tạm thời không khả dụng.')
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
    <div className={`staff-ai-chat${open ? ' is-open' : ''}`}>
      {open && (
        <section className="staff-ai-panel" role="dialog" aria-modal="false" aria-labelledby="staff-ai-title">
          <header className="staff-ai-header">
            <div className="staff-ai-avatar" aria-hidden="true">AI</div>
            <div>
              <h2 id="staff-ai-title">Trợ lý nội bộ</h2>
              <p><span /> Admin & lễ tân</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý AI">×</button>
          </header>

          <div className="staff-ai-messages" ref={messageListRef} aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`staff-ai-message staff-ai-message--${message.role}`}
                key={message.id || `${message.role}-${index}-${message.content.slice(0, 20)}`}
              >
                {message.role === 'assistant' && <span className="staff-ai-mini-avatar">AI</span>}
                {message.role === 'assistant' && !message.content && sending ? (
                  <div className="staff-ai-typing" aria-label="AI đang trả lời"><i /><i /><i /></div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="staff-ai-suggestions">
              {quickQuestions(user?.role).map((question) => (
                <button type="button" key={question} onClick={() => sendMessage(question)}>
                  {question}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="staff-ai-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>×</button>
            </div>
          )}

          <form className="staff-ai-form" onSubmit={handleSubmit}>
            <textarea
              rows="1"
              maxLength="1000"
              placeholder="Nhập câu hỏi nội bộ..."
              aria-label="Câu hỏi cho trợ lý AI nội bộ"
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
          <footer>AI chỉ hỗ trợ tư vấn. Các thao tác nghiệp vụ vẫn cần thực hiện trên hệ thống.</footer>
        </section>
      )}

      <button
        type="button"
        className="staff-ai-launcher"
        aria-label={open ? 'Đóng trợ lý AI nội bộ' : 'Mở trợ lý AI nội bộ'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <span aria-hidden="true">×</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 4 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-4Z" />
              <path d="M9 12h6M12 9v6" />
            </svg>
            <b>AI</b>
          </>
        )}
      </button>
    </div>
  )
}
