import { useState } from 'react'

function PasswordToggleIcon({ isVisible }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
      {!isVisible && <path d="M4 4l16 16" />}
    </svg>
  )
}

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="login-card register-card">
      <div className="login-heading register-heading">
        <h2 id="register-title">Đăng ký</h2>
      </div>

      <form className="login-form register-form">
        <label className="field-group" htmlFor="fullName">
          <span>Họ và tên</span>
          <input id="fullName" name="fullName" type="text" placeholder="Nhập họ và tên" />
        </label>

        <label className="field-group" htmlFor="registerEmail">
          <span>Email</span>
          <input id="registerEmail" name="email" type="email" placeholder="Nhập email của bạn" />
        </label>

        <label className="field-group" htmlFor="phone">
          <span>Số điện thoại</span>
          <input id="phone" name="phone" type="tel" placeholder="Nhập số điện thoại" />
        </label>

        <label className="field-group" htmlFor="registerPassword">
          <span>Mật khẩu</span>
          <div className="password-field">
            <input
              id="registerPassword"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword((current) => !current)}
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
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              <PasswordToggleIcon isVisible={showConfirmPassword} />
            </button>
          </div>
        </label>

        <button className="primary-button" type="submit">
          Tạo tài khoản
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

export default RegisterForm
