import { useMemo, useState } from 'react'
import { activateStayAccount } from '../../services/authService'
import './StayActivationPage.css'

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
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận chưa trùng khớp.')
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
        <a className="stay-activation-brand" href="/home">Home Stays</a>
        <span className="stay-activation-kicker">CHÀO MỪNG BẠN ĐẾN LƯU TRÚ</span>
        <h1>Kích hoạt tài khoản dịch vụ</h1>
        <p>Đặt mật khẩu để xem thông tin phòng và gọi dịch vụ trong thời gian bạn lưu trú.</p>

        <form onSubmit={submit}>
          <label>
            <span>Mật khẩu mới</span>
            <input
              type="password"
              required
              minLength="6"
              maxLength="100"
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
              minLength="6"
              maxLength="100"
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
