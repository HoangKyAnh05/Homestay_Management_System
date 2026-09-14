import { useState } from 'react'
import { adminLogin, login } from '../../services/authService'
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
      // Try adminLogin first, fallback to standard login if appropriate
      let data
      try {
        data = await adminLogin(email, password)
      } catch (err) {
        data = await login(email, password)
      }

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
          <div className="admin-login-brand-top">
            <a href="/home" className="admin-login-logo">
              <span className="brand-leaf-icon">🍁</span>
              <span>Lá Đỏ Homestay</span>
            </a>
            <div className="brand-tag-badge">Sa Pa • Mountain & Cloud Retreat</div>
          </div>

          <div className="admin-login-brand-mid">
            <p className="admin-login-pretitle">HỆ THỐNG NỘI BỘ</p>
            <h1>Cổng Quản Trị & Vận Hành Homestay</h1>
            <p className="admin-login-desc">
              Không gian làm việc bảo mật dành cho Ban Quản Lý, Lễ Tân, Buồng Phòng và Đội Ngũ Vận Hành Lá Đỏ Sa Pa.
            </p>
          </div>

          <div className="admin-login-brand-bottom">
            <a href="/home" className="admin-back-home-link">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Về trang chủ Lá Đỏ Homestay</span>
            </a>
          </div>
        </div>

        <section className="admin-login-panel">
          <div className="admin-login-heading">
            <div className="admin-security-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Xác thực tài khoản nhân viên</span>
            </div>
            <h2 id="admin-login-title">Đăng nhập nhân viên</h2>
            <p className="admin-subheading-text">Vui lòng nhập tài khoản email và mật khẩu được cấp</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="admin-login-field" htmlFor="admin-email">
              <span>Email nhân viên / quản lý</span>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="name@ladohomestay.vn"
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
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!showPassword && <path d="M4 4l16 16" />}
                  </svg>
                </button>
              </div>
            </label>

            {errorMessage && <p className="admin-login-error">{errorMessage}</p>}

            <button className="admin-login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="m10 17 5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            </button>
          </form>

          <div className="admin-login-footer-switch">
            <span>Bạn là khách hàng lưu trú?</span>
            <a href="/login">Đăng nhập tài khoản khách hàng →</a>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AdminLoginPage
