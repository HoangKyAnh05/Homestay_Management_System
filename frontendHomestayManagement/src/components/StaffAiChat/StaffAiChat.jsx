import { useEffect, useRef, useState } from 'react'
import { getStoredToken, getStoredUser } from '../../services/authService'
import './StaffAiChat.css'

const API_URL = 'http://localhost:8080/api/ai/staff/chat'
const SESSION_STORAGE_KEY = 'homeStayStaffAiChatSessionId'
const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chao! Minh co the ho tro tom tat booking, check-in/out, phong, doanh thu va cac viec can chu y trong ca truc.',
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
    ? ['Hom nay co booking nao can check-in?', 'Tom tat phong dang luu tru', 'Viec nao can chu y khi checkout?']
    : ['Tom tat tinh hinh 7 ngay gan day', 'Phong nao dang co doanh thu tot?', 'Hom nay co booking nao can theo doi?']
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
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, { role: 'user', content: question }])
    setInput('')
    setError('')
    setSending(true)
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(API_URL, {
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
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'AI noi bo dang tam thoi khong kha dung.')
      }
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.answer || 'Minh chua co cau tra loi phu hop.' },
      ])
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message)
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
              <h2 id="staff-ai-title">Tro ly noi bo</h2>
              <p><span /> Admin & le tan</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Dong tro ly AI">×</button>
          </header>

          <div className="staff-ai-messages" ref={messageListRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`staff-ai-message staff-ai-message--${message.role}`} key={`${message.role}-${index}-${message.content.slice(0, 20)}`}>
                {message.role === 'assistant' && <span className="staff-ai-mini-avatar">AI</span>}
                <p>{message.content}</p>
              </div>
            ))}
            {sending && (
              <div className="staff-ai-message staff-ai-message--assistant">
                <span className="staff-ai-mini-avatar">AI</span>
                <div className="staff-ai-typing" aria-label="AI dang tra loi">
                  <i /><i /><i />
                </div>
              </div>
            )}
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
              placeholder="Nhap cau hoi noi bo..."
              aria-label="Cau hoi cho tro ly AI noi bo"
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
            <button type="submit" disabled={sending || !input.trim()} aria-label="Gui cau hoi">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m4 4 16 8-16 8 3-8-3-8Z" />
                <path d="M7 12h13" />
              </svg>
            </button>
          </form>
          <footer>AI chi ho tro tu van. Cac thao tac nghiep vu van can thuc hien tren he thong.</footer>
        </section>
      )}

      <button
        type="button"
        className="staff-ai-launcher"
        aria-label={open ? 'Dong tro ly AI noi bo' : 'Mo tro ly AI noi bo'}
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
