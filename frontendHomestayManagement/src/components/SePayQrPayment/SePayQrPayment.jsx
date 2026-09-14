import { useEffect, useState } from 'react'
import './SePayQrPayment.css'

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function formatTimeRemaining(seconds) {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
  const [state, setState] = useState('waiting') // 'waiting' | 'success' | 'expired'
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const authorization = headers?.Authorization
  const contentType = headers?.['Content-Type']

  // 5-minute countdown (300 seconds default or derived from remainingSeconds / holdExpiresAt)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (payment?.remainingSeconds != null) {
      return Math.max(0, Math.min(Number(payment.remainingSeconds), 300))
    }
    if (payment?.holdExpiresAt) {
      const diff = Math.floor((new Date(payment.holdExpiresAt).getTime() - Date.now()) / 1000)
      return diff > 0 ? Math.min(diff, 300) : 0
    }
    return 300
  })

  useEffect(() => {
    if (state !== 'waiting') return undefined

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setState('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state])

  const checkPaymentNow = async () => {
    if (!statusUrl || state === 'expired') return
    setChecking(true)
    setError('')
    try {
      const response = await fetch(statusUrl, {
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
          ...(contentType ? { 'Content-Type': contentType } : {}),
        },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể kiểm tra trạng thái thanh toán')
      const currentSt = String(data[statusField] || '').toUpperCase()
      if (currentSt === successStatus) {
        setState('success')
        onSuccess(data)
      } else if (currentSt === 'CANCELLED' || currentSt === 'EXPIRED') {
        setState('expired')
      } else {
        setError('Hệ thống chưa nhận được thanh toán. Nếu đã chuyển khoản thành công, vui lòng chờ 5-10 giây để ngân hàng đồng bộ rồi bấm "Kiểm tra lại giao dịch".')
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi kiểm tra thanh toán')
    } finally {
      setChecking(false)
    }
  }

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
        const currentSt = String(data[statusField] || '').toUpperCase()
        if (currentSt === successStatus) {
          setState('success')
          onSuccess(data)
        } else if (currentSt === 'CANCELLED' || currentSt === 'EXPIRED') {
          setState('expired')
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

  const [sandboxLoading, setSandboxLoading] = useState(false)

  const triggerSandboxPayment = async (simulationType = 'SUCCESS') => {
    setSandboxLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/sepay/sandbox/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({
          bookingId: payment?.bookingId,
          paymentCode: payment?.paymentCode,
          amount: payment?.amount,
          simulationType,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || 'Mô phỏng thanh toán thất bại')
      }
      if (data.paymentStatus === 'EXPIRED') {
        setState('expired')
      } else if (data.success || data.paymentStatus === 'SUCCESS') {
        setState('success')
        onSuccess(data)
      } else {
        setError(data.message || 'Giao dịch chuyển sang trạng thái: ' + data.paymentStatus)
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi mô phỏng thanh toán')
    } finally {
      setSandboxLoading(false)
    }
  }

  return (
    <div className="sepay-shared-backdrop" role="presentation">
      <section className="sepay-shared-modal" role="dialog" aria-modal="true" aria-labelledby="sepay-shared-title">
        <button className="sepay-shared-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        {state === 'success' ? (
          <div className="sepay-shared-success">
            <span>✓</span>
            <h2 id="sepay-shared-title">Thanh toán thành công</h2>
            <p>Hệ thống đã nhận được xác nhận thanh toán.</p>
            <button type="button" onClick={onClose}>Hoàn tất</button>
          </div>
        ) : state === 'expired' ? (
          <div className="sepay-shared-expired" style={{ textAlign: 'center', padding: '32px 16px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>⏰</span>
            <h2 style={{ fontSize: '20px', color: '#dc2626', marginBottom: '8px' }}>Mã QR thanh toán đã hết hạn (5 phút)</h2>
            <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 20px' }}>
              Theo quy định, đơn đặt phòng chưa thanh toán sau 5 phút đã tự động được hủy. Số lượng phòng giữ chỗ đã được giải phóng tự động để khách hàng khác có thể đặt.
            </p>
            <button
              type="button"
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={onClose}
            >
              Đóng & Đặt phòng lại
            </button>
          </div>
        ) : (
          <>
            <header className="sepay-shared-heading">
              <span>Thanh toán SePay</span>
              <h2 id="sepay-shared-title">{title}</h2>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: timeLeft <= 60 ? '#fee2e2' : '#fef3c7',
                  color: timeLeft <= 60 ? '#b91c1c' : '#92400e',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginTop: '6px'
                }}
              >
                <span>⏳ Thời gian giữ chỗ còn:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{formatTimeRemaining(timeLeft)}</span>
              </div>
              <p style={{ marginTop: '4px' }}>Không thay đổi số tiền và nội dung chuyển khoản.</p>
            </header>
            {error && <div className="sepay-shared-error">{error}</div>}
            <div className="sepay-shared-layout">
              <div className="sepay-shared-qr">
                <img src={payment?.qrCodeUrl} alt="Mã QR thanh toán SePay" />
                <small>{checking ? 'Đang kiểm tra giao dịch...' : 'Đang chờ SePay xác nhận...'}</small>
                <button
                  type="button"
                  className="sepay-recheck-btn"
                  onClick={checkPaymentNow}
                  disabled={checking}
                >
                  {checking ? 'Đang kiểm tra...' : ' Kiểm tra lại giao dịch'}
                </button>
              </div>
              <dl className="sepay-shared-info">
                <div><dt>Số tiền</dt><dd>{formatMoney(payment?.amount)}</dd></div>
                <div><dt>Ngân hàng</dt><dd>{payment?.bankName}</dd></div>
                <div><dt>Số tài khoản</dt><dd>{payment?.accountNumber}</dd></div>
                <div><dt>Chủ tài khoản</dt><dd>{payment?.accountHolder}</dd></div>
                <div><dt>Nội dung</dt><dd className="sepay-shared-code">{payment?.transferContent}</dd></div>
                <div>
                  <dt>Hạn thanh toán</dt>
                  <dd style={{ color: '#b91c1c', fontWeight: 600 }}>5 phút (Đếm ngược: {formatTimeRemaining(timeLeft)})</dd>
                </div>
              </dl>
            </div>

            {/* Sandbox Simulation Box */}
            <div className="sepay-sandbox-control-box" style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1.5px dashed #10b981',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#065f46', fontSize: '14px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <span>Mô phỏng Thanh toán Sandbox (Test 1-Click)</span>
                </div>
                <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Sandbox Mode</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: '1.4' }}>
                Hoàn tất đơn đặt phòng ngay lập tức để kiểm thử toàn diện mà không cần chuyển khoản thật qua ngân hàng.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="sepay-sandbox-btn-success"
                  onClick={() => triggerSandboxPayment('SUCCESS')}
                  disabled={sandboxLoading || checking}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{sandboxLoading ? '⏳ Đang xử lý...' : '✓ Xác nhận Thanh toán Thành công (1-Click)'}</span>
                </button>
                <button
                  type="button"
                  className="sepay-sandbox-btn-underpaid"
                  onClick={() => triggerSandboxPayment('UNDERPAID')}
                  disabled={sandboxLoading || checking}
                  style={{
                    background: '#ffffff',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Test kịch bản chuyển thiếu tiền"
                >
                  Test Thiếu Tiền (Unhappy)
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default SePayQrPayment
