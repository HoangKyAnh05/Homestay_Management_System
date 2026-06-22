import { useState } from 'react'
import { adminLogin } from '../../services/authService'
import { roleDefaultPath } from '../../utils/roleUtils'
import './AdminLoginPage.css'

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const data = await adminLogin(email, password)
      window.location.assign(roleDefaultPath(data.user?.role))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <a href="/home" className="admin-login-logo">Home Stays</a>
          <div>
            <p>Staff Workspace</p>
            <h1>Đăng nhập hệ thống nhân viên</h1>
          </div>
          <span>Chỉ dành cho tài khoản được admin cấp quyền.</span>
        </div>

        <section className="admin-login-panel">
          <div className="admin-login-heading">
            <p>Internal access</p>
            <h2 id="admin-login-title">Nhân viên đăng nhập</h2>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="admin-login-field" htmlFor="admin-email">
              <span>Email nhân viên</span>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="name@homestay.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="admin-login-field" htmlFor="admin-password">
              <span>Mật khẩu</span>
              <div className="admin-password-field">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu được cấp"
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
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!showPassword && <path d="M4 4l16 16" />}
                  </svg>
                </button>
              </div>
            </label>

            {errorMessage && <p className="admin-login-error">{errorMessage}</p>}

            <button className="admin-login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập...' : 'Vào hệ thống'}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="m10 17 5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}

export default AdminLoginPage
