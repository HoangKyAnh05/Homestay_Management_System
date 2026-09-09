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

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:,.<>?])[^\s]{8,64}$/

// Bước 1: Form đăng ký
function StepRegister({ onNext }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateFullName = (val) => {
    const trimmed = (val || '').trim()
    if (!trimmed) return 'Vui lòng nhập họ và tên'
    if (trimmed.length > 100) return 'Họ và tên tối đa 100 ký tự'
    return ''
  }

  const validateEmail = (val) => {
    const trimmed = (val || '').trim()
    if (!trimmed) return 'Vui lòng nhập email'
    if (trimmed.includes('..') || !EMAIL_REGEX.test(trimmed)) {
      return 'Email không hợp lệ (Ví dụ: user@example.com)'
    }
    return ''
  }

  const validatePhone = (val) => {
    const trimmed = (val || '').trim()
    if (!trimmed) return 'Vui lòng nhập số điện thoại'
    if (!/^\d{10}$/.test(trimmed)) {
      return 'Số điện thoại phải đúng 10 chữ số (Ví dụ: 0912345678)'
    }
    return ''
  }

  const validatePassword = (val) => {
    if (!val) return 'Vui lòng nhập mật khẩu'
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    const nameErr = validateFullName(trimmedName)
    const emailErr = validateEmail(trimmedEmail)
    const phoneErr = validatePhone(trimmedPhone)
    const passwordErr = validatePassword(password)
    const confirmErr = validateConfirmPassword(confirmPassword, password)

    const nextErrors = {
      fullName: nameErr,
      email: emailErr,
      phone: phoneErr,
      password: passwordErr,
      confirmPassword: confirmErr,
    }

    setFieldErrors(nextErrors)

    if (nameErr || emailErr || phoneErr || passwordErr || confirmErr) {
      setError('')
      return
    }

    setFieldErrors({})
    setError('')
    setIsLoading(true)
    try {
      await register(trimmedName, trimmedEmail, trimmedPhone, password)
      onNext(trimmedEmail)
    } catch (err) {
      const newFieldErrors = {}
      if (err.fieldErrors && typeof err.fieldErrors === 'object') {
        Object.assign(newFieldErrors, err.fieldErrors)
      }
      if (err.message) {
        const lowerMsg = err.message.toLowerCase()
        if (lowerMsg.includes('email') || lowerMsg.includes('mail')) {
          newFieldErrors.email = err.message
        } else if (lowerMsg.includes('điện thoại') || lowerMsg.includes('phone') || lowerMsg.includes('sđt')) {
          newFieldErrors.phone = err.message
        } else if (lowerMsg.includes('họ tên') || lowerMsg.includes('họ và tên') || lowerMsg.includes('name')) {
          newFieldErrors.fullName = err.message
        } else if (lowerMsg.includes('mật khẩu') || lowerMsg.includes('password')) {
          newFieldErrors.password = err.message
        }
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }))
        setError('')
      } else {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-card register-card">
      <div className="register-header-row">
        <h2 id="register-title">Đăng ký</h2>
        <a href="/home" className="auth-back-link auth-home-btn" title="Về trang chủ">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Về trang chủ</span>
        </a>
      </div>

      <form className="login-form register-form" onSubmit={handleSubmit} noValidate>
        <label className="field-group" htmlFor="fullName">
          <span>Họ và tên</span>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nhập họ và tên"
            autoComplete="name"
            value={fullName}
            className={fieldErrors.fullName ? 'field-input--error' : ''}
            onChange={(e) => {
              setFullName(e.target.value)
              if (fieldErrors.fullName) {
                setFieldErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }))
              }
            }}
            onBlur={(e) => {
              setFieldErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }))
            }}
            required
          />
          {fieldErrors.fullName && (
            <span className="field-error" role="alert">{fieldErrors.fullName}</span>
          )}
        </label>

        <label className="field-group" htmlFor="registerEmail">
          <span>Email</span>
          <input
            id="registerEmail"
            name="email"
            type="email"
            placeholder="user@example.com"
            autoComplete="email"
            value={email}
            className={fieldErrors.email ? 'field-input--error' : ''}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))
              }
            }}
            onBlur={(e) => {
              setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))
            }}
            required
          />
          {fieldErrors.email && (
            <span className="field-error" role="alert">{fieldErrors.email}</span>
          )}
        </label>

        <label className="field-group" htmlFor="phone">
          <span>Số điện thoại</span>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Nhập số điện thoại (10 chữ số)"
            autoComplete="tel"
            value={phone}
            className={fieldErrors.phone ? 'field-input--error' : ''}
            onChange={(e) => {
              setPhone(e.target.value)
              if (fieldErrors.phone) {
                setFieldErrors((prev) => ({ ...prev, phone: validatePhone(e.target.value) }))
              }
            }}
            onBlur={(e) => {
              setFieldErrors((prev) => ({ ...prev, phone: validatePhone(e.target.value) }))
            }}
            required
          />
          {fieldErrors.phone && (
            <span className="field-error" role="alert">{fieldErrors.phone}</span>
          )}
        </label>

        <label className="field-group" htmlFor="registerPassword">
          <span>Mật khẩu</span>
          <div className={`password-field ${fieldErrors.password ? 'field-input--error' : ''}`}>
            <input
              id="registerPassword"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="8-64 ký tự, gồm chữ hoa, thường, số & ký tự đặc biệt"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))
                }
              }}
              onBlur={(e) => {
                setFieldErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))
              }}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              tabIndex="-1"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword((v) => !v)}
            >
              <PasswordToggleIcon isVisible={showPassword} />
            </button>
          </div>
          {fieldErrors.password && (
            <span className="field-error" role="alert">{fieldErrors.password}</span>
          )}
        </label>

        <label className="field-group" htmlFor="confirmPassword">
          <span>Xác nhận mật khẩu</span>
          <div className={`password-field ${fieldErrors.confirmPassword ? 'field-input--error' : ''}`}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(e.target.value, password),
                  }))
                }
              }}
              onBlur={(e) => {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: validateConfirmPassword(e.target.value, password),
                }))
              }}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              tabIndex="-1"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              <PasswordToggleIcon isVisible={showConfirmPassword} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className="field-error" role="alert">{fieldErrors.confirmPassword}</span>
          )}
        </label>

        {error && !Object.values(fieldErrors).some(Boolean) && (
          <p className="auth-error">{error}</p>
        )}

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
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const otp = otpValues.join('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS)
  const [isResending, setIsResending] = useState(false)
  const inputsRef = useRef([])
  const resendBtnRef = useRef(null)

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0 || isLocked) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft, isLocked])

  const handleInput = (index, value) => {
    if (isLocked) return
    const cleaned = value.replace(/\D/g, '')

    // Trường hợp xóa
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

    // Nhập 1 số
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
        if (index > 0) {
          setOtpValues((prev) => {
            const next = [...prev]
            next[index - 1] = ''
            return next
          })
          inputsRef.current[index - 1]?.focus()
        }
      } else {
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
      await verifyEmail(email, otp)
      onSuccess()
    } catch (err) {
      if (err.code === 'OTP_LOCKED' || err.message?.includes('quá 5 lần')) {
        setIsLocked(true)
        setError('Bạn đã nhập sai 5 lần. Mã OTP hiện tại đã bị vô hiệu hóa. Vui lòng bấm \'Gửi lại mã\' để nhận mã mới.')
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
      const { resendVerifyEmail } = await import('../../services/authService')
      await resendVerifyEmail(email)
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

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="login-card register-card">
      <div className="auth-top-bar register-top-bar">
        <a href="/home" className="auth-back-link auth-home-btn" title="Về trang chủ">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Về trang chủ</span>
        </a>
      </div>

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
          {isLoading ? 'Đang xác minh...' : 'Xác minh'}
        </button>
      </form>

      <p className="signup-text register-login-text">
        <a href="/register">← Nhập lại thông tin đăng ký</a>
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
