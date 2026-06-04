import { useState } from 'react'
import { login } from '../../services/authService'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      window.location.assign('/home')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-card">
      <div className="login-heading">
        <h2 id="login-title">Đăng nhập</h2>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="email">
          <span>Email</span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Nhập email"
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
          <input type="checkbox" name="remember" />
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

        <button className="google-button" type="button">
          <span aria-hidden="true">G</span>
          Google
        </button>
      </form>

      <p className="signup-text">
        Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
      </p>
    </div>
  )
}

export default LoginForm
