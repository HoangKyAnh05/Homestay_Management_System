import { useEffect, useRef, useState } from 'react'
import { register, verifyEmail } from '../../services/authService'

const OTP_SECONDS = 180

function PasswordToggleIcon({ isVisible }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
      {!isVisible && <path d="M4 4l16 16" />}
    </svg>
  )
}

// Bước 1: Form đăng ký
function StepRegister({ onNext }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await register(fullName, email, phone, password)
      onNext(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card register-card">
      <div className="login-heading register-heading">
        <h2 id="register-title">Đăng ký</h2>
      </div>

      <form className="login-form register-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="fullName">
          <span>Họ và tên</span>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nhập họ và tên"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label className="field-group" htmlFor="registerEmail">
          <span>Email</span>
          <input
            id="registerEmail"
            name="email"
            type="email"
            placeholder="Nhập email của bạn"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field-group" htmlFor="phone">
          <span>Số điện thoại</span>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Nhập số điện thoại"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="field-group" htmlFor="registerPassword">
          <span>Mật khẩu</span>
          <div className="password-field">
            <input
              id="registerPassword"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 6 ký tự"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword((v) => !v)}
            >
              <PasswordToggleIcon isVisible={showPassword} />
            </button>
          </div>
        </label>

        <label className="field-group" htmlFor="confirmPassword">
          <span>Xác nhận mật khẩu</span>
          <div className="password-field">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              <PasswordToggleIcon isVisible={showConfirmPassword} />
            </button>
          </div>
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        </button>
      </form>

      <p className="signup-text register-login-text">
        Đã có tài khoản? <a href="/login">Đăng nhập</a>
      </p>
    </div>
  )
}

// Bước 2: Nhập OTP xác minh email
function StepVerifyEmail({ email, onSuccess }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const handleInput = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const digits = otp.split('')
    digits[index] = value
    const newOtp = digits.join('').slice(0, 6)
    setOtp(newOtp)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setOtp(pasted)
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
    event.preventDefault()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return }
    setError('')
    setIsLoading(true)
    try {
      await verifyEmail(email, otp)
      onSuccess()
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
      const { resendVerifyEmail } = await import('../../services/authService')
      await resendVerifyEmail(email)
      setSecondsLeft(OTP_SECONDS)
      setOtp('')
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="login-card register-card">
      <div className="login-heading register-heading">
        <h2>Xác minh email</h2>
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
          {isLoading ? 'Đang xác minh...' : 'Xác minh'}
        </button>
      </form>

      <p className="signup-text register-login-text">
        <a href="/register">← Quay lại đăng ký</a>
      </p>
    </div>
  )
}

function RegisterForm() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')

  const handleRegisterNext = (submittedEmail) => {
    setEmail(submittedEmail)
    setStep(2)
  }

  const handleVerifySuccess = () => {
    window.location.assign('/home')
  }

  return step === 1
    ? <StepRegister onNext={handleRegisterNext} />
    : <StepVerifyEmail email={email} onSuccess={handleVerifySuccess} />
}

export default RegisterForm
