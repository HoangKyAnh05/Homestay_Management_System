import { useMemo, useState } from 'react'
import { activateStayAccount } from '../../services/authService'
import './StayActivationPage.css'

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
  if (val !== pwd) return 'Mật khẩu xác nhận chưa trùng khớp.'
  return ''
}

function StayActivationPage() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', [])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!token) {
      setError('Đường dẫn kích hoạt không hợp lệ.')
      return
    }
    const pwdErr = validatePassword(password)
    if (pwdErr) {
      setError(pwdErr)
      return
    }
    const confirmErr = validateConfirmPassword(confirmation, password)
    if (confirmErr) {
      setError(confirmErr)
      return
    }
    setSubmitting(true)
    try {
      await activateStayAccount(token, password)
      window.location.replace('/stay')
    } catch (activationError) {
      setError(activationError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="stay-activation-page">
      <section className="stay-activation-card">
        <a className="stay-activation-brand" href="/home">Lá Đỏ Homestay</a>
        <span className="stay-activation-kicker">CHÀO MỪNG BẠN ĐẾN LƯU TRÚ</span>
        <h1>Kích hoạt tài khoản dịch vụ</h1>
        <p>Đặt mật khẩu để xem thông tin phòng và gọi dịch vụ trong thời gian bạn lưu trú.</p>

        <form onSubmit={submit}>
          <label>
            <span>Mật khẩu mới</span>
            <input
              type="password"
              required
              placeholder="8-64 ký tự, gồm chữ hoa, thường, số & ký tự đặc biệt"
              autoComplete="new-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>
          <label>
            <span>Xác nhận mật khẩu</span>
            <input
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
            />
          </label>
          {error && <div className="stay-activation-error" role="alert">{error}</div>}
          <button type="submit" disabled={submitting || !token}>
            {submitting ? 'Đang kích hoạt...' : 'Kích hoạt và vào trang dịch vụ'}
          </button>
        </form>
        <small>Liên kết chỉ dùng một lần và có hiệu lực trong 24 giờ.</small>
      </section>
    </main>
  )
}

export default StayActivationPage
