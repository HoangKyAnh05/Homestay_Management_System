import { useCallback, useEffect, useRef, useState } from 'react'
import { getRememberedEmail, login, loginWithGoogle } from '../../services/authService'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const hasGoogleClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')

function LoginForm() {
  const nextPath = (() => {
    const requested = new URLSearchParams(window.location.search).get('next')
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/home'
  })()
  const googleTokenClientRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const rememberedEmail = getRememberedEmail()
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!rememberedEmail)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage] = useState(() => {
    // Kiểm tra query param ?reset=1 sau khi đổi mật khẩu thành công
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      window.history.replaceState(null, '', '/login')
      return 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.'
    }
    return ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)

  // Tự động lấy credentials đã lưu từ password manager của trình duyệt
  useEffect(() => {
    if (!window.PasswordCredential || !navigator.credentials) return

    navigator.credentials
      .get({ password: true, mediation: 'optional' })
      .then((credential) => {
        if (credential instanceof window.PasswordCredential) {
          setEmail(credential.id)
          setPassword(credential.password)
          setRemember(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleGoogleAccessToken = useCallback(async (response) => {
    if (response.error) {
      setIsGoogleLoading(false)
      setErrorMessage('Đăng nhập Google thất bại')
      return
    }

    try {
      await loginWithGoogle(response.access_token)
      window.location.assign(nextPath)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsGoogleLoading(false)
    }
  }, [nextPath])

  const handleGoogleError = useCallback((error) => {
    setIsGoogleLoading(false)
    if (error?.type === 'popup_closed') {
      // Người dùng chủ động tắt popup đăng nhập
      return
    }
    if (error?.type === 'popup_failed_to_open') {
      setErrorMessage('Trình duyệt đã chặn popup Google. Vui lòng cho phép popup để đăng nhập.')
      return
    }
    if (error?.message) {
      setErrorMessage(error.message)
    }
  }, [])

  const initializeGoogleClient = useCallback(async () => {
    if (googleTokenClientRef.current) {
      return googleTokenClientRef.current
    }

    await loadGoogleIdentityScript()

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Không thể tải Google Login')
    }

    googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: handleGoogleAccessToken,
      error_callback: handleGoogleError,
    })

    setIsGoogleReady(true)
    return googleTokenClientRef.current
  }, [handleGoogleAccessToken, handleGoogleError])

  useEffect(() => {
    if (!hasGoogleClientId) {
      return
    }

    let isMounted = true

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !window.google?.accounts?.oauth2) {
          return
        }

        googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: handleGoogleAccessToken,
          error_callback: handleGoogleError,
        })

        setIsGoogleReady(true)
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage('Không thể tải Google Login')
        }
      })

    return () => {
      isMounted = false
    }
  }, [handleGoogleAccessToken, handleGoogleError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password, remember)

      // Báo cho trình duyệt lưu credentials (trigger password manager)
      if (window.PasswordCredential && navigator.credentials) {
        const credential = new window.PasswordCredential({ id: email, password })
        navigator.credentials.store(credential).catch(() => {
          // Password manager là tiện ích tùy chọn, không được chặn đăng nhập thành công.
        })
      }

      window.location.assign(nextPath)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMissingGoogleClientId = () => {
    setErrorMessage('Chưa cấu hình Google Client ID trong file .env của frontend')
  }

  const handleGoogleLogin = async () => {
    setErrorMessage('')

    if (!hasGoogleClientId) {
      handleMissingGoogleClientId()
      return
    }

    setIsGoogleLoading(true)

    try {
      const googleTokenClient = isGoogleReady
        ? googleTokenClientRef.current
        : await initializeGoogleClient()

      googleTokenClient.requestAccessToken()
    } catch (error) {
      setIsGoogleLoading(false)
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="login-card">
      <div className="auth-top-bar login-top-bar">
        <a href="/home" className="auth-back-link auth-home-btn" title="Về trang chủ">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Về trang chủ</span>
        </a>
      </div>

      <div className="login-heading">
        <h2 id="login-title">Đăng nhập</h2>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        {successMessage && <p className="auth-success">{successMessage}</p>}

        <label className="field-group" htmlFor="email">
          <span>Email</span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Nhập email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="field-group" htmlFor="password">
          <span>
            Mật khẩu
            <a href="/forgot">Quên mật khẩu?</a>
          </span>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword((current) => !current)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {showPassword ? (
                  <>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M4 4l16 16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </label>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <label className="remember-row">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Ghi nhớ email</span>
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="m10 17 5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </button>

        <div className="divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <button className="google-button" type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
          <span aria-hidden="true">G</span>
          {isGoogleLoading ? 'Đang đăng nhập bằng Google...' : 'Đăng nhập bằng Google'}
        </button>
      </form>

      <p className="signup-text">
        Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
      </p>
    </div>
  )
}

function loadGoogleIdentityScript() {
  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')

  if (existingScript) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default LoginForm
