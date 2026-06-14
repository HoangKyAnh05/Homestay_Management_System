import { useEffect, useState } from 'react'
import './SePayQrPayment.css'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function SePayQrPayment({
  payment,
  statusUrl,
  headers,
  successStatus,
  statusField = 'status',
  title = 'Quét mã QR để thanh toán',
  onSuccess,
  onClose,
}) {
  const [state, setState] = useState('waiting')
  const [error, setError] = useState('')
  const authorization = headers?.Authorization
  const contentType = headers?.['Content-Type']

  useEffect(() => {
    if (!payment || state !== 'waiting') return undefined

    const controller = new AbortController()
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(statusUrl, {
          headers: {
            ...(authorization ? { Authorization: authorization } : {}),
            ...(contentType ? { 'Content-Type': contentType } : {}),
          },
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể kiểm tra trạng thái thanh toán')
        if (String(data[statusField] || '').toUpperCase() === successStatus) {
          setState('success')
          onSuccess(data)
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      }
    }, 2000)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [authorization, contentType, onSuccess, payment, state, statusField, statusUrl, successStatus])

  return (
    <div className="sepay-shared-backdrop" role="presentation">
      <section className="sepay-shared-modal" role="dialog" aria-modal="true" aria-labelledby="sepay-shared-title">
        <button className="sepay-shared-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        {state === 'success' ? (
          <div className="sepay-shared-success">
            <span>✓</span>
            <h2 id="sepay-shared-title">Thanh toán thành công</h2>
            <p>Hệ thống đã nhận được xác nhận từ SePay.</p>
            <button type="button" onClick={onClose}>Hoàn tất</button>
          </div>
        ) : (
          <>
            <header className="sepay-shared-heading">
              <span>Thanh toán SePay</span>
              <h2 id="sepay-shared-title">{title}</h2>
              <p>Không thay đổi số tiền và nội dung chuyển khoản.</p>
            </header>
            {error && <div className="sepay-shared-error">{error}</div>}
            <div className="sepay-shared-layout">
              <div className="sepay-shared-qr">
                <img src={payment.qrCodeUrl} alt="Mã QR thanh toán SePay" />
                <small>Đang chờ SePay xác nhận...</small>
              </div>
              <dl className="sepay-shared-info">
                <div><dt>Số tiền</dt><dd>{formatMoney(payment.amount)}</dd></div>
                <div><dt>Ngân hàng</dt><dd>{payment.bankName}</dd></div>
                <div><dt>Số tài khoản</dt><dd>{payment.accountNumber}</dd></div>
                <div><dt>Chủ tài khoản</dt><dd>{payment.accountHolder}</dd></div>
                <div><dt>Nội dung</dt><dd className="sepay-shared-code">{payment.transferContent}</dd></div>
              </dl>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default SePayQrPayment
