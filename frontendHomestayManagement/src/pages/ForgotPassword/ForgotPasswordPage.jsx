import { useEffect, useRef, useState } from 'react'
import LoginHero from '../../components/LoginHero/LoginHero'
import { forgotPassword, resetPassword, verifyOtp } from '../../services/authService'
import '../Login/LoginPage.css'
import './ForgotPasswordPage.css'

const OTP_SECONDS = 180 // 3 phút

// Bước 1: Nhập email
function StepEmail({ onNext }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await forgotPassword(email)
      onNext(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card">
      <div className="login-heading">
        <h2>Quên mật khẩu</h2>
        <p className="fp-subtitle">Nhập email tài khoản, chúng tôi sẽ gửi mã OTP cho bạn.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="fp-email">
          <span>Email</span>
          <input
            id="fp-email"
            type="email"
            placeholder="Nhập email của bạn"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>
      </form>
      <p className="signup-text">
        <a href="/login">← Quay lại đăng nhập</a>
      </p>
    </div>
  )
}

// Bước 2: Nhập OTP + đếm ngược
function StepOtp({ email, onNext, onResend }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  // Tự focus ô đầu tiên
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleInput = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const digits = otp.split('')
    digits[index] = value
    const newOtp = digits.join('').slice(0, 6)
    setOtp(newOtp)
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setOtp(pasted)
    const focusIndex = Math.min(pasted.length, 5)
    inputsRef.current[focusIndex]?.focus()
    event.preventDefault()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return }
    setError('')
    setIsLoading(true)
    try {
      await verifyOtp(email, otp)
      onNext(otp)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')
    try {
      await onResend()
      setSecondsLeft(OTP_SECONDS)
      setOtp('')
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="login-card">
      <div className="login-heading">
        <h2>Nhập mã OTP</h2>
        <p className="fp-subtitle">
          Mã 6 chữ số đã được gửi đến <strong>{email}</strong>
        </p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="otp-inputs" onPaste={handlePaste}>
          {Array.from({ length: 6 }, (_, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              className="otp-box"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i] || ''}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Chữ số OTP thứ ${i + 1}`}
            />
          ))}
        </div>

        <div className="fp-timer-row">
          {secondsLeft > 0 ? (
            <span className={secondsLeft <= 30 ? 'fp-timer fp-timer--urgent' : 'fp-timer'}>
              Hết hạn sau {formatTime(secondsLeft)}
            </span>
          ) : (
            <span className="fp-timer fp-timer--expired">Mã đã hết hạn</span>
          )}
          <button
            type="button"
            className="fp-resend"
            onClick={handleResend}
            disabled={secondsLeft > 0 || isResending}
          >
            {isResending ? 'Đang gửi lại...' : 'Gửi lại mã'}
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={isLoading || otp.length < 6}>
          {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>
      </form>
      <p className="signup-text">
        <a href="/login">← Quay lại đăng nhập</a>
      </p>
    </div>
  )
}

// Bước 3: Nhập mật khẩu mới
function StepNewPassword({ email, otp, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await resetPassword(email, otp, newPassword)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card">
      <div className="login-heading">
        <h2>Mật khẩu mới</h2>
        <p className="fp-subtitle">Đặt mật khẩu mới cho tài khoản <strong>{email}</strong></p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="new-password">
          <span>Mật khẩu mới</span>
          <div className="password-field">
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              placeholder="Ít nhất 6 ký tự"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" aria-label={showNew ? 'Ẩn' : 'Hiện'} onClick={() => setShowNew((v) => !v)}>
              <EyeIcon visible={showNew} />
            </button>
          </div>
        </label>

        <label className="field-group" htmlFor="confirm-password">
          <span>Nhập lại mật khẩu</span>
          <div className="password-field">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" aria-label={showConfirm ? 'Ẩn' : 'Hiện'} onClick={() => setShowConfirm((v) => !v)}>
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  )
}

function EyeIcon({ visible }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible && <path d="M4 4l16 16" />}
    </svg>
  )
}

// Page wrapper: quản lý 3 bước
function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1 | 2 | 3
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')

  const handleEmailNext = (submittedEmail) => {
    setEmail(submittedEmail)
    setStep(2)
  }

  const handleOtpNext = (submittedOtp) => {
    setOtp(submittedOtp)
    setStep(3)
  }

  const handleResend = async () => {
    const { forgotPassword: sendOtp } = await import('../../services/authService')
    await sendOtp(email)
  }

  const handleSuccess = () => {
    window.location.assign('/login?reset=1')
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Đặt lại mật khẩu">
        <LoginHero />
        <section className="form-panel" aria-labelledby="fp-title">
          {step === 1 && <StepEmail onNext={handleEmailNext} />}
          {step === 2 && <StepOtp email={email} onNext={handleOtpNext} onResend={handleResend} />}
          {step === 3 && <StepNewPassword email={email} otp={otp} onSuccess={handleSuccess} />}
        </section>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
