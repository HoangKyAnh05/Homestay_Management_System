import { useCallback, useEffect, useRef, useState } from 'react'
import { getRememberedEmail, login, loginWithGoogle } from '../../services/authService'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const hasGoogleClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')

function LoginForm() {
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
      setErrorMessage('Dang nhap Google that bai')
      return
    }

    try {
      await loginWithGoogle(response.access_token)
      window.location.assign('/home')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsGoogleLoading(false)
    }
  }, [])

  const initializeGoogleClient = useCallback(async () => {
    if (googleTokenClientRef.current) {
      return googleTokenClientRef.current
    }

    await loadGoogleIdentityScript()

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Khong the tai Google Login')
    }

    googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: handleGoogleAccessToken,
    })

    setIsGoogleReady(true)
    return googleTokenClientRef.current
  }, [handleGoogleAccessToken])

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
        })

        setIsGoogleReady(true)
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage('Khong the tai Google Login')
        }
      })

    return () => {
      isMounted = false
    }
  }, [handleGoogleAccessToken])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password, remember)

      // Báo cho trình duyệt lưu credentials (trigger password manager)
      if (window.PasswordCredential) {
        const credential = new window.PasswordCredential({ id: email, password })
        await navigator.credentials.store(credential)
      }

      // Admin → trang quản lí, user thường → home
      const user = JSON.parse(localStorage.getItem('homeStayUser') || sessionStorage.getItem('homeStayUser') || 'null')
      window.location.assign(user?.role === 'ROLE_ADMINISTRATOR' ? '/admin' : '/home')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMissingGoogleClientId = () => {
    setErrorMessage('Chua cau hinh Google Client ID trong file .env cua frontend')
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
          <span>Ghi nhớ đăng nhập</span>
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
          {isGoogleLoading ? 'Dang dang nhap Google...' : 'Login with Google'}
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
