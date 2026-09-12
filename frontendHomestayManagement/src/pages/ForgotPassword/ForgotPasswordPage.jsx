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
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const otp = otpValues.join('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const inputsRef = useRef([])
  const resendBtnRef = useRef(null)

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
    const cleaned = value.replace(/\D/g, '')

    // Trường hợp xóa ký tự
    if (!cleaned) {
      setOtpValues((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }

    // Trường hợp nhập đè hoặc dán nhiều số
    if (cleaned.length > 1) {
      if (cleaned.length === 2 && otpValues[index]) {
        // Người dùng gõ đè 1 số mới vào ô đã có số
        const newDigit = cleaned.slice(-1)
        setOtpValues((prev) => {
          const next = [...prev]
          next[index] = newDigit
          return next
        })
        if (index < 5) {
          inputsRef.current[index + 1]?.focus()
          inputsRef.current[index + 1]?.select?.()
        }
        return
      }

      // Dán chuỗi nhiều ký tự
      const digits = cleaned.slice(0, 6).split('')
      setOtpValues((prev) => {
        const next = [...prev]
        digits.forEach((d, i) => {
          if (index + i < 6) {
            next[index + i] = d
          }
        })
        return next
      })
      const targetIndex = Math.min(index + digits.length, 5)
      inputsRef.current[targetIndex]?.focus()
      inputsRef.current[targetIndex]?.select?.()
      return
    }

    // Nhập 1 số bình thường
    setOtpValues((prev) => {
      const next = [...prev]
      next[index] = cleaned
      return next
    })
    if (index < 5) {
      inputsRef.current[index + 1]?.focus()
      inputsRef.current[index + 1]?.select?.()
    }
  }

  const handleKeyDown = (index, event) => {
    if (isLocked) return
    if (event.key === 'Backspace') {
      if (!otpValues[index]) {
        // Ô hiện tại rỗng -> lùi về ô trước và xóa
        if (index > 0) {
          setOtpValues((prev) => {
            const next = [...prev]
            next[index - 1] = ''
            return next
          })
          inputsRef.current[index - 1]?.focus()
        }
      } else {
        // Ô hiện tại có giá trị -> xóa giá trị ô hiện tại
        setOtpValues((prev) => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      }
    } else if (event.key === 'Delete') {
      setOtpValues((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
      inputsRef.current[index - 1]?.select?.()
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
      inputsRef.current[index + 1]?.select?.()
    }
  }

  const handlePaste = (event) => {
    if (isLocked) return
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const digits = pasted.split('')
    setOtpValues((prev) => {
      const next = [...prev]
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d
      })
      return next
    })
    const focusIndex = Math.min(digits.length, 5)
    inputsRef.current[focusIndex]?.focus()
    inputsRef.current[focusIndex]?.select?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLocked) return
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return }
    setError('')
    setIsLoading(true)
    try {
      await verifyOtp(email, otp)
      onNext(otp)
    } catch (err) {
      if (err.code === 'OTP_LOCKED' || err.message?.includes('quá 5 lần')) {
        setIsLocked(true)
        setError('Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng bấm \'Gửi lại mã\' để nhận mã mới.')
        setTimeout(() => resendBtnRef.current?.focus(), 150)
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')
    try {
      await onResend()
      setIsLocked(false)
      setSecondsLeft(OTP_SECONDS)
      setOtpValues(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 150)
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
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              value={otpValues[i]}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              aria-label={`Chữ số OTP thứ ${i + 1}`}
              disabled={isLocked || isLoading}
            />
          ))}
        </div>

        <div className="fp-timer-row">
          {isLocked ? (
            <span className="fp-timer fp-timer--expired" style={{ color: '#dc2626', fontWeight: 600 }}>
              Mã OTP đã bị khóa
            </span>
          ) : secondsLeft > 0 ? (
            <span className={secondsLeft <= 30 ? 'fp-timer fp-timer--urgent' : 'fp-timer'}>
              Hết hạn sau {formatTime(secondsLeft)}
            </span>
          ) : (
            <span className="fp-timer fp-timer--expired">Mã đã hết hạn</span>
          )}
          <button
            ref={resendBtnRef}
            type="button"
            className={`fp-resend ${isLocked ? 'fp-resend--locked-focus' : ''}`}
            onClick={handleResend}
            disabled={(!isLocked && secondsLeft > 0) || isResending}
            style={isLocked ? {
              background: '#2d5a3d',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              boxShadow: '0 0 0 3px rgba(45,90,61,0.3)',
              cursor: 'pointer'
            } : {}}
          >
            {isResending ? 'Đang gửi lại...' : 'Gửi lại mã'}
          </button>
        </div>

        {error && (
          <p className="auth-error" style={isLocked ? {
            background: '#fef2f2',
            borderColor: '#f87171',
            color: '#b91c1c',
            fontWeight: 600,
            padding: '12px'
          } : {}}>
            {error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={isLoading || otp.length < 6 || isLocked}>
          {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>
      </form>
      <p className="signup-text">
        <a href="/login">← Quay lại đăng nhập</a>
      </p>
    </div>
  )
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:,.<>?])[^\s]{8,64}$/

const validatePassword = (val) => {
  if (!val) return 'Vui lòng nhập mật khẩu mới'
  if (val.length < 8 || val.length > 64) return 'Mật khẩu phải từ 8 đến 64 ký tự'
  if (/\s/.test(val)) return 'Mật khẩu không được chứa khoảng trắng'
  if (!/(?=.*[a-z])/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ cái viết thường (a-z)'
  if (!/(?=.*[A-Z])/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ cái viết hoa (A-Z)'
  if (!/(?=.*\d)/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ số (0-9)'
  if (!/(?=.*[!@#$%^&*()_+\-=[\]{};:,.<>?])/.test(val)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)'
  return ''
}

const validateConfirmPassword = (val, pwd) => {
  if (!val) return 'Vui lòng nhập lại mật khẩu'
  if (val !== pwd) return 'Mật khẩu nhập lại không khớp'
  return ''
}

// Bước 3: Nhập mật khẩu mới
function StepNewPassword({ email, otp, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const pwdErr = validatePassword(newPassword)
    const confirmErr = validateConfirmPassword(confirmPassword, newPassword)

    if (pwdErr || confirmErr) {
      setFieldErrors({
        newPassword: pwdErr,
        confirmPassword: confirmErr,
      })
      setError('')
      return
    }

    setFieldErrors({})
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
          <div className={`password-field ${fieldErrors.newPassword ? 'field-input--error' : ''}`}>
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              placeholder="8-64 ký tự, gồm chữ hoa, thường, số & ký tự đặc biệt"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: validatePassword(e.target.value) }))
                }
              }}
              onBlur={(e) => {
                setFieldErrors((prev) => ({ ...prev, newPassword: validatePassword(e.target.value) }))
              }}
              required
            />
            <button type="button" aria-label={showNew ? 'Ẩn' : 'Hiện'} onClick={() => setShowNew((v) => !v)}>
              <EyeIcon visible={showNew} />
            </button>
          </div>
          {fieldErrors.newPassword && (
            <span className="field-error" role="alert">{fieldErrors.newPassword}</span>
          )}
        </label>

        <label className="field-group" htmlFor="confirm-password">
          <span>Nhập lại mật khẩu</span>
          <div className={`password-field ${fieldErrors.confirmPassword ? 'field-input--error' : ''}`}>
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value, newPassword) }))
                }
              }}
              onBlur={(e) => {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value, newPassword) }))
              }}
              required
            />
            <button type="button" aria-label={showConfirm ? 'Ẩn' : 'Hiện'} onClick={() => setShowConfirm((v) => !v)}>
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="field-error" role="alert">{fieldErrors.confirmPassword}</span>
          )}
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
