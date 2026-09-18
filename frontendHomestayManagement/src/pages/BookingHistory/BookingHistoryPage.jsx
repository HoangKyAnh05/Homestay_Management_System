import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import { calculateStayOverdueInfo } from '../../utils/stayOverdue'
import '../Home/HomePage.css'
import './BookingHistoryPage.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'
const HISTORY_PAGE_SIZE = 3

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ thanh toán/xác nhận',
    CONFIRMED: 'Đặt phòng thành công',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || 'Chưa rõ'
}

function serviceTypeLabel(type) {
  return type === 'FACILITY' ? 'Dịch vụ' : 'Thuê đồ'
}

function serviceSourceLabel(source) {
  return source === 'STAY' ? 'Gọi trong kỳ ở' : 'Đặt trước'
}

function bookingSortTime(booking) {
  const value = booking?.bookingDate || booking?.createdAt || booking?.checkInTarget
  const time = value ? new Date(value).getTime() : 0
  return Number.isNaN(time) ? 0 : time
}

function canAddService(booking) {
  const status = String(booking?.status || '').toUpperCase()
  const checkoutValue = booking?.checkOutTarget || booking?.rooms
    ?.map(room => room.checkOutTarget)
    .filter(Boolean)
    .sort()
    .at(-1)
  const checkout = checkoutValue ? new Date(checkoutValue) : null
  return ['CONFIRMED', 'CHECKED_IN'].includes(status)
    && checkout
    && checkout.getTime() > Date.now()
}

function UserAvatar({ user }) {
  const avatarUrl = resolveImageUrl(user?.avatarUrl)
  return (
    <span className="home-user-avatar" aria-hidden="true">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" />
      ) : (
        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
      )}
    </span>
  )
}

function PublicHeader() {
  const currentUser = getStoredUser()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <header className="home-header">
      <a className="home-logo" href="/home">Lá Đỏ Homestay</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Lá Đỏ Sanctuary">🍁 Lá Đỏ 3D</a>
        <a href="/explore" title="Khám phá xung quanh Lá Đỏ Homestay & Sa Pa">Khám phá xung quanh</a>
        <a href="/rooms">Phòng</a>
        <a href="/stay" title="Dịch vụ dành cho khách đang lưu trú">Dịch vụ lưu trú</a>
        <a href="/wishlist">Yêu thích</a>
        <a href="/amenities">Tiện nghi</a>
        <a
          href="/giveaway"
          className="home-nav-lucky-wheel"
          title="Vòng quay may mắn - Nhận ưu đãi nghỉ dưỡng!"
          aria-label="Vòng quay may mắn"
        >
          <svg className="lucky-wheel-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="7.5" />
            <path d="M12 2.5v15M4.5 10h15M6.7 4.7l10.6 10.6M6.7 15.3l10.6-10.6" />
            <circle cx="12" cy="10" r="2" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" />
            <path d="M8 21.5l2.5-4h3l2.5 4" />
            <line x1="6" y1="21.5" x2="18" y2="21.5" />
          </svg>
        </a>

        <a href="/home#about">Giới thiệu</a>
      </nav>

      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            <UserAvatar user={currentUser} />
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              <a href="/stay" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/stay'); }}>Dịch vụ lưu trú</a>
              <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
              <a href="/vouchers" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/vouchers'); }}>Kho mã giảm giá</a>
              <a href="/booking-history" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/booking-history'); }}>Lịch sử đặt phòng</a>
              <a href="/profile" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/profile'); }}>Thông tin cá nhân</a>
              <button type="button" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}

        </div>
      ) : (
        <div className="home-actions">
          <a href="/login">Đăng nhập</a>
          <a href="/register">Đăng ký</a>
        </div>
      )}
    </header>
  )
}

function PaymentButton({ bookingId, compact = false, loading = false, onPay }) {
  return (
    <button
      className={compact ? 'history-pay-btn history-pay-btn--compact' : 'history-pay-btn'}
      type="button"
      disabled={loading}
      onClick={(event) => {
        event.stopPropagation()
        onPay(bookingId)
      }}
    >
      {loading ? 'Đang tạo QR...' : 'Thanh toán'}
    </button>
  )
}

function AddServiceButton({ bookingId, compact = false }) {
  const className = compact
    ? 'history-add-service-btn history-add-service-btn--compact'
    : 'history-add-service-btn'
  return (
    <a
      className={className}
      href={`/amenities?bookingId=${bookingId}#services`}
      onClick={(event) => event.stopPropagation()}
    >
      Thêm dịch vụ
    </a>
  )
}

function canExtendStay(booking) {
  const status = String(booking?.status || '').toUpperCase()
  return ['CONFIRMED', 'CHECKED_IN'].includes(status)
}

function parseRoomChangeNotes(notes) {
  if (!notes) return null
  const text = String(notes).trim()
  const matchTransfer = text.match(/Đã đổi từ (?:Phòng\s*)?([^\s,]+) sang (?:Phòng\s*)?([^\s,]+)/i)
  const matchTime = text.match(/lúc\s+([0-9]{1,2}:[0-9]{2}(?:\s+[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})?)/i)
  const matchReason = text.match(/-\s*Ghi chú:\s*([^\[]+)/i)
  const matchEffective = text.match(/\[Áp dụng từ:\s*([^\]]+)\]/i)
  const isComplimentary = text.includes('Miễn phí') || text.includes('nâng hạng')

  if (matchTransfer) {
    return {
      isStructured: true,
      fromRoom: matchTransfer[1],
      toRoom: matchTransfer[2],
      changeTime: matchTime ? matchTime[1] : null,
      reason: matchReason ? matchReason[1].trim() : null,
      effectiveTime: matchEffective ? matchEffective[1].trim() : null,
      isComplimentary,
      rawText: text,
    }
  }

  return {
    isStructured: false,
    rawText: text,
    isComplimentary,
  }
}

function RoomChangeHistoryCard({ notes }) {
  if (!notes) return null
  const parsed = parseRoomChangeNotes(notes)
  if (!parsed) return null

  if (parsed.isStructured) {
    return (
      <div className="history-room-change-card">
        <div className="history-room-change-header">
          <div className="history-room-change-title">
            <span className="history-room-change-icon">🔄</span>
            <strong>Lịch Sử Đổi Phòng</strong>
          </div>
          {parsed.isComplimentary && (
            <span className="history-room-change-free-badge">✨ Miễn phí đổi / nâng hạng</span>
          )}
        </div>

        <div className="history-room-change-flow">
          <div className="history-change-room-tag history-change-room-old">
            <span className="history-change-label">Phòng ban đầu</span>
            <span className="history-change-value">🚪 Phòng {parsed.fromRoom}</span>
          </div>
          <div className="history-change-arrow">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
          <div className="history-change-room-tag history-change-room-new">
            <span className="history-change-label">Phòng đã đổi</span>
            <span className="history-change-value">✨ Phòng {parsed.toRoom}</span>
          </div>
        </div>

        <div className="history-room-change-meta">
          {parsed.changeTime && (
            <div className="history-change-meta-item">
              <span className="meta-icon">🕒</span>
              <span className="meta-label">Thời điểm đổi:</span>
              <span className="meta-value">{parsed.changeTime}</span>
            </div>
          )}
          {parsed.effectiveTime && (
            <div className="history-change-meta-item">
              <span className="meta-icon">⏱️</span>
              <span className="meta-label">Áp dụng từ:</span>
              <span className="meta-value">{parsed.effectiveTime}</span>
            </div>
          )}
          {parsed.reason && (
            <div className="history-change-meta-item history-change-meta-reason">
              <span className="meta-icon">📝</span>
              <span className="meta-label">Lý do / Ghi chú:</span>
              <span className="meta-value">{parsed.reason}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="history-room-change-card history-room-change-simple">
      <div className="history-room-change-header">
        <div className="history-room-change-title">
          <span className="history-room-change-icon">🔄</span>
          <strong>Lịch Sử Đổi Phòng / Ghi Chú:</strong>
        </div>
        {parsed.isComplimentary && (
          <span className="history-room-change-free-badge">✨ Miễn phí đổi / nâng hạng</span>
        )}
      </div>
      <p className="history-room-change-text">{parsed.rawText}</p>
    </div>
  )
}

function ExtendStayButton({ onClick, compact = false }) {
  const className = compact
    ? 'history-extend-btn history-extend-btn--compact'
    : 'history-extend-btn'
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      title="Book thêm ngày / Gia hạn thời gian lưu trú"
    >
       Book thêm ngày
    </button>
  )
}

function canCancelBooking(booking) {
  const status = String(booking?.status || '').toUpperCase()
  return ['PENDING', 'CONFIRMED'].includes(status)
}

function CancelBookingButton({ onClick, compact = false }) {
  const className = compact
    ? 'history-cancel-btn history-cancel-btn--compact'
    : 'history-cancel-btn'
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      title="Hủy đặt phòng và nhận hoàn tiền theo quy định"
    >
      Hủy phòng
    </button>
  )
}

function BookingExtensionModal({
  booking,
  roomDetail,
  onClose,
  token,
  onExtensionSuccess,
}) {
  const [days, setDays] = useState(1)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const detailId = roomDetail?.bookingDetailId || booking?.rooms?.[0]?.bookingDetailId

  const checkAvailability = async (targetDays) => {
    if (!booking?.bookingId) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my/${booking.bookingId}/check-extension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingDetailId: detailId,
          additionalHours: null,
          additionalDays: targetDays,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra tình trạng phòng')
      setCheckResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkAvailability(days)
  }, [days])

  const handleConfirmExtend = async (switchRoomId = null) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my/${booking.bookingId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingDetailId: detailId,
          additionalHours: null,
          additionalDays: days,
          switchRoomId: switchRoomId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể gia hạn lưu trú')
      setSuccessMsg(
        switchRoomId
          ? '✓ Đã chuyển đổi sang phòng mới thành công! Bạn có thể tiếp tục lưu trú.'
          : `✓ Đã gia hạn thành công thêm ${days} ngày! Chúc bạn có kỳ nghỉ tuyệt vời!`
      )
      onExtensionSuccess(data)
      setTimeout(() => {
        onClose()
      }, 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isMustBookFullDay = checkResult?.mustBookFullDay

  return (
    <div className="extend-modal-overlay" onClick={onClose}>
      <div className="extend-modal" onClick={(e) => e.stopPropagation()}>
        <div className="extend-modal-header">
          <div>
            <h2>Book Thêm Ngày / Gia Hạn Lưu Trú</h2>
            <p>Booking {bookingDisplay(booking)} · {roomDetail?.roomNumber ? `Phòng ${roomDetail.roomNumber}` : 'Phòng đang ở'}</p>
          </div>
          <button type="button" className="extend-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="extend-modal-body">
          {checkResult?.warningNotice && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '14px',
                lineHeight: '1.5'
              }}
            >
              {checkResult.warningNotice}
            </div>
          )}

          {error && <div className="extend-alert extend-alert--error">{error}</div>}
          {successMsg && <div className="extend-alert extend-alert--success">{successMsg}</div>}

          {/* Current Booking Info */}
          <div className="extend-current-info">
            <div>
              <span className="extend-info-label">Phòng đang ở</span>
              <strong>{roomDetail?.roomNumber ? `Phòng ${roomDetail.roomNumber}` : 'Phòng hiện tại'} ({houseTypeName(roomDetail || {})})</strong>
            </div>
            <div>
              <span className="extend-info-label">Giờ trả phòng hiện tại</span>
              <strong style={{ color: '#ea580c' }}>{formatAppDateTime(roomDetail?.checkOutTarget || checkResult?.currentCheckOut, { weekday: 'short' })}</strong>
            </div>
          </div>

          {/* Selection options */}
          <div className="extend-hours-section">
            <label className="extend-section-title">Chọn số ngày muốn book thêm (trả phòng lúc 11:00 trưa):</label>
            <div className="extend-hour-presets">
              {[1, 2, 3, 5, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`extend-hour-btn ${days === d ? 'is-active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  +{d} Ngày {d === 1 ? '(đến 11:00 ngày mai)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Live Check Result */}
          {checking ? (
            <div className="extend-checking-box">
              <div className="extend-spinner" />
              <span>Đang kiểm tra phòng trống theo thời gian thực...</span>
            </div>
          ) : checkResult ? (
            checkResult.currentRoomAvailable ? (
              /* Case 1: Room is available! */
              <div className="extend-result-box extend-result-box--available">
                <div className="extend-result-badge">✓ Phòng còn trống</div>
                <h3>{checkResult.message}</h3>
                <div className="extend-fee-breakdown">
                  <div className="extend-fee-row">
                    <span>Thời gian trả phòng mới:</span>
                    <strong>{formatAppDateTime(checkResult.newCheckOut, { weekday: 'short' })}</strong>
                  </div>
                  <div className="extend-fee-row">
                    <span>Thời gian gia hạn:</span>
                      <strong>
                        +{checkResult.additionalDays || days} ngày
                      </strong>
                  </div>
                  <div className="extend-fee-row extend-fee-total">
                    <span>Phí gia hạn lưu trú:</span>
                    <strong style={{ color: '#16a34a', fontSize: '18px' }}>{formatMoney(checkResult.extensionFee)}</strong>
                  </div>
                </div>
                <p className="extend-hint-note">ℹ️ Phí gia hạn sẽ được tự động cộng vào hóa đơn booking của bạn.</p>

                <div className="extend-actions">
                  <button
                    type="button"
                    className="extend-confirm-btn"
                    disabled={saving}
                    onClick={() => handleConfirmExtend(null)}
                  >
                    {saving ? 'Đang xử lý...' : `✓ Xác nhận gia hạn (${formatMoney(checkResult.extensionFee)})`}
                  </button>
                  <button type="button" className="extend-cancel-btn" onClick={onClose}>
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              /* Case 2: Room is already booked by another customer! */
              <div className="extend-result-box extend-result-box--busy">
                <div className="extend-result-badge extend-result-badge--busy">️ Phòng đã có khách đặt trước</div>
                <div className="extend-busy-desc">
                  <strong>Phòng {checkResult.roomNumber || 'này'} đã được khách khác đặt trước cho ngày/khung giờ tiếp theo.</strong>
                  <p>Hệ thống không thể gia hạn tiếp tại phòng hiện tại. Bạn có thể lựa chọn 1 trong 2 phương án dưới đây:</p>
                </div>

                <div className="extend-options-wrapper">
                  {/* Option A: Switch to another available room */}
                  <div className="extend-option-card">
                    <div className="extend-option-head">
                      <span className="extend-option-tag">Lựa chọn 1</span>
                      <h4> Chuyển đổi sang phòng khác còn trống để tiếp tục ở</h4>
                    </div>

                    {checkResult.alternativeRooms && checkResult.alternativeRooms.length > 0 ? (
                      <div className="extend-alt-grid">
                        {checkResult.alternativeRooms.map((alt) => (
                          <div key={alt.roomId} className="extend-alt-item">
                            <div className="extend-alt-info">
                              <strong>Phòng {alt.roomNumber}</strong>
                              <span className="extend-alt-type">{alt.roomTypeName} · Tối đa {alt.capacityAdults} người</span>
                              <span className="extend-alt-price">
                                {formatMoney(alt.totalPrice)} {checkResult.additionalDays > 0 ? `(+${checkResult.additionalDays} ngày)` : `(+${hours}h)`}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="extend-switch-btn"
                              disabled={saving}
                              onClick={() => handleConfirmExtend(alt.roomId)}
                            >
                              {saving ? 'Đang đổi...' : 'Đổi sang phòng này →'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="extend-no-rooms">Hiện tại tất cả các phòng khác cũng đã kín lịch trong khung giờ/ngày này.</p>
                    )}
                  </div>

                  {/* Option B: Check out on time */}
                  <div className="extend-option-card extend-option-card--checkout">
                    <div className="extend-option-head">
                      <span className="extend-option-tag">Lựa chọn 2</span>
                      <h4> Trả phòng đúng giờ (Check-out khi hết giờ)</h4>
                    </div>
                    <p className="extend-checkout-text">
                      Bạn có thể giữ nguyên lịch trình và thực hiện thủ tục trả phòng vào lúc <strong>{formatAppDateTime(checkResult.currentCheckOut, { weekday: 'short' })}</strong>.
                    </p>
                    <button type="button" className="extend-checkout-confirm-btn" onClick={onClose}>
                      Tôi sẽ trả phòng đúng giờ
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BookingCancelModal({
  booking,
  onClose,
  token,
  onCancelSuccess,
  currentUser,
}) {
  const [reason, setReason] = useState('')
  const [zaloPhone, setZaloPhone] = useState(currentUser?.phoneNumber || '')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankName, setBankName] = useState('Vietcombank')
  const [accountHolderName, setAccountHolderName] = useState(currentUser?.fullName || '')
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [previewError, setPreviewError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    let ignore = false
    setLoadingPreview(true)
    setPreviewError('')
    fetch(`${API_BASE_URL}/bookings/my/${booking.bookingId}/cancel-policy-preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra chính sách hoàn tiền')
        return data
      })
      .then((data) => {
        if (!ignore) setPreview(data)
      })
      .catch((err) => {
        if (!ignore) setPreviewError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoadingPreview(false)
      })
    return () => {
      ignore = true
    }
  }, [booking?.bookingId, token])

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setSubmitError('Vui lòng nhập lý do hủy phòng')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my/${booking.bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reason.trim(),
          zaloPhone: zaloPhone.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankName: bankName.trim(),
          accountHolderName: accountHolderName.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể thực hiện hủy phòng')
      setSuccessMsg('✓ Đã gửi yêu cầu hủy phòng thành công!')
      onCancelSuccess(data)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="history-cancel-modal-overlay" onClick={onClose}>
      <div className="history-cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-cancel-modal-header">
          <div>
            <h2> Xác Nhận Hủy Đặt Phòng</h2>
            <p>Booking {bookingDisplay(booking)}</p>
          </div>
          <button type="button" className="history-cancel-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="history-cancel-modal-body">
          {submitError && <div className="history-cancel-alert history-cancel-alert--error">{submitError}</div>}
          {successMsg && <div className="history-cancel-alert history-cancel-alert--success">{successMsg}</div>}

          {/* Refund Policy Rules Box */}
          <div className="history-cancel-policy-card">
            <h4> Quy định chính sách hủy phòng & hoàn tiền:</h4>
            <ul>
              <li>
                <span className="policy-tag policy-tag--green">Hoàn 100%</span>
                <strong>Hủy trước 48 giờ nhận phòng:</strong> Hoàn trả 100% số tiền đã thanh toán.
              </li>
              <li>
                <span className="policy-tag policy-tag--yellow">Hoàn 50%</span>
                <strong>Hủy trong vòng 48 giờ trước nhận phòng:</strong> Hoàn trả 50% số tiền đã thanh toán.
              </li>
              <li>
                <span className="policy-tag policy-tag--red">Không hoàn tiền</span>
                <strong>Hủy sau giờ nhận phòng (đã quá giờ check-in / vào phòng):</strong> Mất 100% số tiền.
              </li>
            </ul>
          </div>

          {loadingPreview ? (
            <div className="history-cancel-loading">
              <span className="cancel-spinner" /> Đang kiểm tra thời gian và chính sách hoàn tiền...
            </div>
          ) : previewError ? (
            <div className="history-cancel-alert history-cancel-alert--error">{previewError}</div>
          ) : preview && (
            <div className="history-cancel-preview-card">
              <div className="cancel-preview-row">
                <span>Giờ nhận phòng dự kiến:</span>
                <strong>{formatAppDateTime(preview.checkInTarget, { weekday: 'short' })}</strong>
              </div>
              <div className="cancel-preview-row">
                <span>Thời gian yêu cầu hủy:</span>
                <strong>{formatAppDateTime(preview.requestTime, { weekday: 'short' })}</strong>
              </div>
              <div className="cancel-preview-row">
                <span>Khoảng cách đến giờ check-in:</span>
                <strong className={preview.hoursUntilCheckIn >= 48 ? 'text-green' : preview.hoursUntilCheckIn > 0 ? 'text-yellow' : 'text-red'}>
                  {preview.hoursUntilCheckIn > 0
                    ? `Trước giờ nhận phòng ${preview.hoursUntilCheckIn} giờ`
                    : 'Đã quá giờ nhận phòng'}
                </strong>
              </div>
              <div className="cancel-preview-divider" />
              <div className="cancel-preview-row">
                <span>Số tiền bạn đã thanh toán:</span>
                <strong>{formatMoney(preview.paidAmount)}</strong>
              </div>
              <div className="cancel-preview-row">
                <span>Tỷ lệ hoàn tiền áp dụng:</span>
                <span className={`policy-badge policy-badge--${preview.refundRate === 100 ? 'green' : preview.refundRate === 50 ? 'yellow' : 'red'}`}>
                  {preview.refundRate}%
                </span>
              </div>
              <div className="cancel-preview-row cancel-preview-row--highlight">
                <span>Số tiền dự kiến được hoàn trả:</span>
                <strong className="refund-amount-value">{formatMoney(preview.refundAmount)}</strong>
              </div>
              <div className="cancel-preview-desc">
                <em>{preview.policyDescription}</em>
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmCancel} className="history-cancel-form">
            <div className="history-cancel-field">
              <label>Lý do hủy phòng <span className="field-required">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng cho biết lý do hủy phòng (VD: Thay đổi lịch trình, bận việc đột xuất...)"
                rows={2}
                required
              />
            </div>

            {preview && Number(preview.refundAmount || 0) > 0 && (
              <div className="history-cancel-bank-fields">
                <h4>Thông tin liên hệ & nhận hoàn tiền:</h4>
                <p className="field-subtext">Lễ tân sẽ liên hệ qua Zalo / SĐT hoặc chuyển khoản hoàn trả theo thông tin này:</p>
                
                <div className="history-cancel-field">
                  <label>Số điện thoại / Zalo nhận liên hệ:</label>
                  <input
                    type="text"
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    required
                  />
                </div>

                <div className="cancel-form-grid">
                  <div className="history-cancel-field">
                    <label>Ngân hàng nhận:</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="VD: Vietcombank, MBBank..."
                    />
                  </div>
                  <div className="history-cancel-field">
                    <label>Số tài khoản (STK):</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="VD: 1029384756"
                    />
                  </div>
                </div>

                <div className="history-cancel-field">
                  <label>Tên chủ tài khoản:</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                  />
                </div>
              </div>
            )}

            <div className="history-cancel-actions">
              <button
                type="button"
                className="history-cancel-btn--back"
                onClick={onClose}
                disabled={submitting}
              >
                Giữ lại phòng
              </button>
              <button
                type="submit"
                className="history-cancel-btn--confirm"
                disabled={submitting || loadingPreview}
              >
                {submitting ? 'Đang gửi yêu cầu hủy...' : 'Xác nhận hủy đặt phòng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CustomerChangeRoomModal({ booking, room, onClose, currentUser }) {
  const [reason, setReason] = useState('ROOM_ISSUE')
  const [phone, setPhone] = useState(currentUser?.phoneNumber || booking?.customerPhone || '')
  const [preferredRoomType, setPreferredRoomType] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!note.trim()) {
      setError('Vui lòng nhập mô tả chi tiết yêu cầu / sự cố gặp phải')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/request-room-change-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode: booking?.bookingCode || `#${booking?.bookingId}`,
          phone: phone.trim() || undefined,
          reason,
          preferredRoomTypeName: preferredRoomType.trim() || undefined,
          note: note.trim(),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || 'Không thể gửi yêu cầu đổi phòng')
      setSuccessMsg('✓ Đã gửi yêu cầu đổi phòng đến Lễ tân & Quản trị viên! Lễ tân đã nhận được thông báo đỏ và sẽ liên hệ hỗ trợ bạn ngay.')
      setTimeout(() => {
        onClose()
      }, 2500)
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="history-cancel-modal-overlay" onClick={onClose}>
      <div className="history-cancel-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="history-cancel-modal-header">
          <div>
            <h2>🔄 Báo Sự Cố & Yêu Cầu Đổi Phòng</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Mã đơn: <strong>{booking?.bookingCode}</strong> · {room?.roomNumber ? `Phòng ${room.roomNumber}` : 'Chưa gán phòng'}
            </p>
          </div>
          <button type="button" className="history-cancel-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="history-cancel-modal-body" style={{ padding: '20px 24px' }}>
          {error && <div className="extend-alert extend-alert--error">{error}</div>}
          {successMsg && <div className="extend-alert extend-alert--success">{successMsg}</div>}

          <div className="history-cancel-field">
            <label>Lý do yêu cầu đổi phòng <span className="field-required">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="history-modal-select"
            >
              <option value="ROOM_ISSUE">🛠️ Phòng gặp sự cố kỹ thuật (Máy lạnh, nước, thiết bị hỏng...)</option>
              <option value="CUSTOMER_UPGRADE">✨ Muốn đổi loại phòng / Nâng hạng phòng cao cấp hơn</option>
              <option value="CUSTOMER_PREFERENCE">🪟 Muốn đổi tầng / Hướng view / Vị trí yên tĩnh hơn</option>
              <option value="OTHER">📝 Lý do cá nhân khác</option>
            </select>
          </div>

          <div className="history-cancel-field" style={{ marginTop: 12 }}>
            <label>Loại phòng mong muốn đổi sang (nếu có)</label>
            <input
              type="text"
              value={preferredRoomType}
              onChange={(e) => setPreferredRoomType(e.target.value)}
              placeholder="VD: VIP King, Deluxe View Núi, Cùng loại phòng khác..."
            />
          </div>

          <div className="history-cancel-field" style={{ marginTop: 12 }}>
            <label>Mô tả chi tiết sự cố / Ghi chú <span className="field-required">*</span></label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Máy lạnh phòng phát tiếng kêu to và không mát. Mong Lễ tân hỗ trợ chuyển sang phòng khác..."
            />
          </div>

          <div className="history-cancel-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="history-cancel-btn--back"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="history-cancel-btn--confirm"
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : '🚀 Gửi Yêu Cầu Cho Lễ Tân'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookingHistoryPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [paymentLoadingId, setPaymentLoadingId] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [paymentState, setPaymentState] = useState('waiting')
  const [paymentError, setPaymentError] = useState('')
  const [error, setError] = useState('')
  const [customerActionError, setCustomerActionError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [confirmSaving, setConfirmSaving] = useState(false)
  
  // Extend Stay Modal State
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [extendBooking, setExtendBooking] = useState(null)
  const [extendRoomDetail, setExtendRoomDetail] = useState(null)

  // Cancel Booking Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelBooking, setCancelBooking] = useState(null)

  // Customer Change Room Modal State
  const [changeRoomModalOpen, setChangeRoomModalOpen] = useState(false)
  const [changeRoomBooking, setChangeRoomBooking] = useState(null)
  const [changeRoomTargetRoom, setChangeRoomTargetRoom] = useState(null)

  const handleOpenChangeRoomModal = (bookingObj, roomObj = null) => {
    setChangeRoomBooking(bookingObj)
    setChangeRoomTargetRoom(roomObj || bookingObj?.rooms?.[0] || null)
    setChangeRoomModalOpen(true)
  }

  const handleOpenExtendModal = (bookingObj, roomDetailObj = null) => {
    setExtendBooking(bookingObj)
    setExtendRoomDetail(roomDetailObj || bookingObj?.rooms?.[0] || null)
    setExtendModalOpen(true)
  }

  const handleExtensionSuccess = (updatedData) => {
    setDetail(updatedData)
    setBookings((current) =>
      current.map((b) => (b.bookingId === updatedData.bookingId ? { ...b, totalAmount: updatedData.totalAmount } : b))
    )
  }

  const handleOpenCancelModal = (bookingObj) => {
    setCancelBooking(bookingObj)
    setCancelModalOpen(true)
  }

  const handleCancelSuccess = (updatedData) => {
    setDetail(updatedData)
    setBookings((current) =>
      current.map((b) =>
        b.bookingId === updatedData.bookingId
          ? {
              ...b,
              status: 'CANCELLED',
              cancellationReason: updatedData.cancellationReason,
              cancelledAt: updatedData.cancelledAt,
              refundRate: updatedData.refundRate,
              refundAmount: updatedData.refundAmount,
              refundStatus: updatedData.refundStatus,
              requiresPayment: false,
            }
          : b
      )
    )
  }
  
  // Review & Rating State
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewStars, setReviewStars] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [reviewImageInput, setReviewImageInput] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewData, setReviewData] = useState(null)

  const token = getStoredToken()

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReviewImages((prev) => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const addImageUrl = () => {
    if (reviewImageInput.trim()) {
      setReviewImages((prev) => [...prev, reviewImageInput.trim()])
      setReviewImageInput('')
    }
  }

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const submitReview = async (event) => {
    event.preventDefault()
    if (!detail?.bookingId) return
    setReviewError('')
    setReviewSubmitting(true)
    try {
      const isEditing = Boolean(reviewData?.reviewId || reviewData?.id)
      const url = isEditing
        ? `${API_BASE_URL}/customer/reviews/booking/${detail.bookingId}`
        : `${API_BASE_URL}/customer/reviews`
      const method = isEditing ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: detail.bookingId,
          ratingStars: reviewStars,
          comment: reviewComment,
          imageUrls: reviewImages,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể lưu đánh giá')
      setReviewData(data)
      setReviewOpen(false)
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }


  const updateBookingAfterCustomerAction = (updatedDetail) => {
    setDetail(updatedDetail)
    setBookings((current) => current.map((booking) => (
      booking.bookingId === updatedDetail.bookingId
        ? {
            ...booking,
            customerConfirmed: updatedDetail.customerConfirmed,
            customerFeedback: updatedDetail.customerFeedback,
            customerFeedbackAt: updatedDetail.customerFeedbackAt,
          }
        : booking
    )))
  }

  const handleCustomerConfirm = async () => {
    if (!detail?.bookingId || detail.customerConfirmed) return
    setCustomerActionError('')
    setConfirmSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my/${detail.bookingId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể xác nhận booking')
      updateBookingAfterCustomerAction(data)
    } catch (err) {
      setCustomerActionError(err.message)
    } finally {
      setConfirmSaving(false)
    }
  }

  const openFeedback = () => {
    setFeedbackText(detail?.customerFeedback || '')
    setFeedbackOpen(true)
  }

  const submitFeedback = async (event) => {
    event.preventDefault()
    if (!detail?.bookingId) return
    setCustomerActionError('')
    setFeedbackSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my/${detail.bookingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ feedback: feedbackText }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể gửi phản hồi')
      updateBookingAfterCustomerAction(data)
      setFeedbackOpen(false)
    } catch (err) {
      setCustomerActionError(err.message)
    } finally {
      setFeedbackSaving(false)
    }
  }

  const handlePayment = async (bookingId) => {
    setPaymentError('')
    setPaymentLoadingId(bookingId)
    try {
      const response = await fetch(`${API_BASE_URL}/payments/sepay/bookings/${bookingId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể tạo mã thanh toán SePay')
      setPaymentInfo(data)
      setPaymentState('waiting')
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoadingId(null)
    }
  }

  useEffect(() => {
    if (!paymentInfo?.bookingId || paymentState !== 'waiting') return undefined

    const controller = new AbortController()
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/my/${paymentInfo.bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && data.status === 'CONFIRMED') {
          setPaymentState('success')
          setDetail(data)
          setBookings((current) => current.map((booking) => (
            booking.bookingId === data.bookingId
              ? { ...booking, status: data.status, requiresPayment: false }
              : booking
          )))
        }
      } catch (err) {
        if (err.name !== 'AbortError') setPaymentError('Không thể kiểm tra trạng thái thanh toán')
      }
    }, 2000)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [paymentInfo, paymentState, token])

  useEffect(() => {
    if (!token) {
      window.location.assign('/login')
      return undefined
    }

    const controller = new AbortController()
    fetch(`${API_BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải lịch sử đặt phòng')
        return Array.isArray(data) ? data : []
      })
      .then((data) => {
        const sortedData = [...data].sort((first, second) => bookingSortTime(second) - bookingSortTime(first))
        setBookings(sortedData)
        setSelectedBookingId((current) => current || sortedData[0]?.bookingId || null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || !selectedBookingId) {
      return undefined
    }
    setDetailLoading(true)
    const controller = new AbortController()
    fetch(`${API_BASE_URL}/bookings/my/${selectedBookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết đơn')
        return data
      })
      .then((data) => {
        setDetail(data)
        fetch(`${API_BASE_URL}/customer/reviews/booking/${selectedBookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then(setReviewData)
          .catch(() => setReviewData(null))
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setDetailLoading(false))

    return () => controller.abort()
  }, [selectedBookingId, token])

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.bookingId === selectedBookingId) || null,
    [bookings, selectedBookingId]
  )
  const sortedBookings = useMemo(
    () => [...bookings].sort((first, second) => bookingSortTime(second) - bookingSortTime(first)),
    [bookings]
  )
  const totalHistoryPages = Math.max(1, Math.ceil(sortedBookings.length / HISTORY_PAGE_SIZE))
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages)
  const paginatedBookings = sortedBookings.slice(
    (safeHistoryPage - 1) * HISTORY_PAGE_SIZE,
    safeHistoryPage * HISTORY_PAGE_SIZE
  )

  const activeAlerts = useMemo(() => {
    const overdueRooms = []
    const dueTodayRooms = []

    bookings.forEach((booking) => {
      const isStaying = ['CHECKED_IN', 'CONFIRMED'].includes(String(booking.status || '').toUpperCase())
      if (!isStaying) return

      const roomsToCheck =
        booking.bookingId === detail?.bookingId && detail?.rooms?.length
          ? detail.rooms
          : [
              {
                roomNumber: booking.firstRoomNumber,
                checkOutTarget: booking.checkOutTarget,
                status: booking.status,
                bookingCode: bookingDisplay(booking),
              },
            ]

      roomsToCheck.forEach((r) => {
        const info = calculateStayOverdueInfo(r.checkOutTarget, null, booking.status)
        if (info.isOverdue) {
          overdueRooms.push({
            roomNumber: r.roomNumber || booking.firstRoomNumber || 'Chưa gán',
            checkOutTarget: r.checkOutTarget || booking.checkOutTarget,
            bookingCode: bookingDisplay(booking),
            overdueDays: info.overdueDays,
            overdueHours: info.overdueHours,
            message: info.message,
          })
        } else if (info.isDueToday) {
          dueTodayRooms.push({
            roomNumber: r.roomNumber || booking.firstRoomNumber || 'Chưa gán',
            checkOutTarget: r.checkOutTarget || booking.checkOutTarget,
            bookingCode: bookingDisplay(booking),
          })
        }
      })
    })

    return { overdueRooms, dueTodayRooms }
  }, [bookings, detail])

  useEffect(() => {
    if (historyPage > totalHistoryPages) setHistoryPage(totalHistoryPages)
  }, [historyPage, totalHistoryPages])

  const changeHistoryPage = (nextPage) => {
    const safeNextPage = Math.min(Math.max(nextPage, 1), totalHistoryPages)
    const nextFirstBooking = sortedBookings[(safeNextPage - 1) * HISTORY_PAGE_SIZE]
    setHistoryPage(safeNextPage)
    if (nextFirstBooking) setSelectedBookingId(nextFirstBooking.bookingId)
  }

  return (
    <div className="booking-history-page">
      <PublicHeader />
      <main className="booking-history-main">
        <section className="history-heading">
          <div>
            <p>Tài khoản của tôi</p>
            <h1>Lịch sử đặt phòng</h1>
          </div>
          <span>{bookings.length} booking</span>
        </section>


        {activeAlerts.dueTodayRooms.length > 0 && activeAlerts.overdueRooms.length === 0 && (
          <div className="history-stay-alert history-stay-alert--due-today">
            <div className="history-stay-alert-icon">🔔</div>
            <div className="history-stay-alert-content">
              <strong>Nhắc nhở: Hôm nay bạn cần trả phòng</strong>
              <p>
                Hôm nay bạn cần trả phòng cho các phòng:{' '}
                <strong>
                  {activeAlerts.dueTodayRooms.map((r) => (r.roomNumber ? `Phòng ${r.roomNumber}` : 'Phòng đã đặt')).join(', ')}
                </strong>{' '}
                (hạn trả trước {formatAppDateTime(activeAlerts.dueTodayRooms[0].checkOutTarget)}). Vui lòng kiểm tra hành lý và liên hệ quầy lễ tân để làm thủ tục check-out.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="history-state">Đang tải lịch sử đặt phòng...</div>
        ) : error ? (
          <div className="history-state history-state--error">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="history-state">Bạn chưa có booking nào.</div>
        ) : (
          <section className="history-layout">
            <div className="history-list">
              {paginatedBookings.map((booking) => (
                <article
                  key={booking.bookingId}
                  className={`history-booking-card${booking.bookingId === selectedBookingId ? ' is-active' : ''}`}
                  onClick={() => setSelectedBookingId(booking.bookingId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedBookingId(booking.bookingId)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div className="history-card-top">
                    <strong>Booking {bookingDisplay(booking)}</strong>
                    <span className={`history-status history-status--${String(booking.status || '').toLowerCase()}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <h2>{booking.firstRoomNumber ? `Phòng ${booking.firstRoomNumber}` : 'Chưa gán phòng'} · {houseTypeName({ roomTypeId: booking.firstRoomTypeId || booking.roomTypeId, roomTypeName: booking.firstRoomTypeName })}</h2>
                  <p>{formatAppDateTime(booking.checkInTarget, { weekday: 'long' })}</p>
                  <div className="history-card-bottom">
                    <span>{booking.roomCount} phòng · {formatMoney(booking.totalAmount)}</span>
                    {booking.requiresPayment && (
                      <PaymentButton
                        bookingId={booking.bookingId}
                        compact
                        loading={paymentLoadingId === booking.bookingId}
                        onPay={handlePayment}
                      />
                    )}
                  </div>
                </article>
              ))}
              {totalHistoryPages > 1 && (
                <nav className="history-pagination" aria-label="Phân trang lịch sử booking">
                  <button
                    type="button"
                    disabled={safeHistoryPage === 1}
                    onClick={() => changeHistoryPage(safeHistoryPage - 1)}
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalHistoryPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={pageNumber === safeHistoryPage ? 'is-active' : ''}
                      onClick={() => changeHistoryPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safeHistoryPage === totalHistoryPages}
                    onClick={() => changeHistoryPage(safeHistoryPage + 1)}
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </nav>
              )}
            </div>

            <aside className="history-detail">
              {detailLoading ? (
                <div className="history-state">Đang tải chi tiết...</div>
              ) : detail ? (
                <>
                  <div className="history-detail-head">
                    <div>
                      <span>Booking {bookingDisplay(detail)}</span>
                      <h2>{statusLabel(detail.status)}</h2>
                    </div>
                    <div className="history-detail-actions">
                      {['CONFIRMED', 'CHECKED_IN'].includes(String(detail.status || '').toUpperCase()) && (
                        <button
                          type="button"
                          className="history-change-room-btn"
                          onClick={() => handleOpenChangeRoomModal(detail)}
                          title="Báo sự cố kỹ thuật hoặc yêu cầu đổi phòng"
                        >
                          🔄 Báo sự cố / Đổi phòng
                        </button>
                      )}
                      {canExtendStay(detail) && (
                        <ExtendStayButton onClick={() => handleOpenExtendModal(detail)} />
                      )}
                      {canCancelBooking(detail) && (
                        <CancelBookingButton onClick={() => handleOpenCancelModal(detail)} />
                      )}
                      {canAddService(detail) && <AddServiceButton bookingId={detail.bookingId} />}
                      {detail.requiresPayment && (
                        <PaymentButton
                          bookingId={detail.bookingId}
                          loading={paymentLoadingId === detail.bookingId}
                          onPay={handlePayment}
                        />
                      )}
                    </div>
                  </div>

                  {paymentError && <div className="history-payment-error">{paymentError}</div>}

                  {detail.status === 'CANCELLED' && (
                    <div className="history-cancellation-card">
                      <div className="history-cancellation-badge">
                        <span className="history-cancellation-icon"></span>
                        <div>
                          <strong>Đơn đặt phòng đã được hủy{detail.cancelledAt ? ` lúc ${formatAppDateTime(detail.cancelledAt, { weekday: 'short' })}` : ''}</strong>
                          {detail.cancellationReason && <p>Lý do hủy: <em>{detail.cancellationReason}</em></p>}
                        </div>
                      </div>
                      <div className="history-cancellation-refund-grid">
                        <div>
                          <span>Tỷ lệ hoàn tiền:</span>
                          <strong className="refund-rate-highlight">{detail.refundRate !== undefined && detail.refundRate !== null ? `${detail.refundRate}%` : '0%'}</strong>
                        </div>
                        <div>
                          <span>Số tiền hoàn trả:</span>
                          <strong className="refund-amount-highlight">{formatMoney(detail.refundAmount)}</strong>
                        </div>
                        <div>
                          <span>Trạng thái xử lý:</span>
                          <strong className={detail.refundStatus === 'REFUNDED' ? 'refund-status--completed' : 'refund-status--pending'}>
                            {detail.refundStatus === 'REFUNDED' ? '✓ Đã hoàn tiền thành công' : Number(detail.refundAmount || 0) > 0 ? ' Đang chờ Lễ tân chuyển khoản' : 'Không áp dụng hoàn tiền'}
                          </strong>
                        </div>
                      </div>
                      {detail.refundInfo && (
                        <div className="history-cancellation-refund-info">
                          <span>Thông tin nhận hoàn tiền:</span>
                          <strong>{detail.refundInfo}</strong>
                        </div>
                      )}
                      {Number(detail.refundAmount || 0) > 0 && detail.refundStatus !== 'REFUNDED' && (
                        <div className="history-cancellation-support-note">
                           Lễ tân sẽ chủ động liên hệ với quý khách qua Zalo/SĐT để xác nhận và thực hiện chuyển khoản hoàn tiền theo đúng quy định.
                        </div>
                      )}
                    </div>
                  )}

                  {detail.requiresPayment && (
                    <div className="history-payment-alert">
                      <strong>Cần thanh toán trước {formatMoney(detail.depositAmount)}</strong>
                      <p>
                        {detail.depositCalculationType === 'PERCENTAGE'
                          ? `${Number(detail.depositPolicyValue || 0)}% tổng giá trị đơn`
                          : detail.depositPolicyName}
                      </p>
                    </div>
                  )}

                  <div className="history-summary-grid">
                    <div><span>Ngày đặt</span><strong>{formatAppDateTime(detail.bookingDate, { weekday: 'long' })}</strong></div>
                    {Number(detail.roomDiscountAmount || 0) > 0 && (
                      <>
                        <div><span>Tiền phòng gốc</span><strong>{formatMoney(detail.roomChargeBeforeDiscount)}</strong></div>
                        {Number(detail.memberDiscountAmount || 0) > 0 && (
                          <div><span>Ưu đãi thành viên {Number(detail.memberDiscountPercent || 0).toLocaleString('vi-VN')}%</span><strong>-{formatMoney(detail.memberDiscountAmount)}</strong></div>
                        )}
                        {Number(detail.roomDiscountAmount || 0) - Number(detail.memberDiscountAmount || 0) > 0 && (
                          <div><span>{detail.voucherCode ? `Voucher ${detail.voucherCode}` : 'Ưu đãi'}</span><strong>-{formatMoney(Number(detail.roomDiscountAmount || 0) - Number(detail.memberDiscountAmount || 0))}</strong></div>
                        )}
                      </>
                    )}
                    <div><span>Tổng tiền phòng</span><strong>{formatMoney(detail.roomCharge)}</strong></div>
                    <div><span>Tổng dịch vụ</span><strong>{formatMoney(detail.serviceCharge)}</strong></div>
                    <div><span>Tổng thanh toán</span><strong>{formatMoney(detail.totalAmount)}</strong></div>
                  </div>

                  <section className="history-detail-section">
                    <h3>Loại phòng đã đặt</h3>
                    <div className="history-room-list">
                      {detail.rooms.map((room) => {
                        const roomExtHours = Number(room.extensionHours || 0)
                        const isUpgraded = room.notes && (room.notes.includes('Miễn phí') || room.notes.includes('Đổi phòng') || room.notes.includes('đổi từ') || room.notes.includes('Đã đổi'))
                        const overdueInfo = calculateStayOverdueInfo(room.checkOutTarget, null, detail.status)
                        return (
                          <article key={room.bookingDetailId} className={room.notes ? 'has-room-change-note' : ''}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong>{room.roomNumber ? `Phòng ${room.roomNumber}` : 'Chưa gán phòng'}</strong>
                                {['CHECKED_IN', 'CONFIRMED'].includes(String(detail.status || '').toUpperCase()) && overdueInfo.isOverdue && (
                                  <span className="history-room-overdue-tag" title={overdueInfo.message}>
                                    ⚠️ {overdueInfo.shortBadge} (Tính thêm {overdueInfo.overdueDays >= 1 ? `${overdueInfo.overdueDays} ngày` : 'phí trễ'})
                                  </span>
                                )}
                                {['CHECKED_IN', 'CONFIRMED'].includes(String(detail.status || '').toUpperCase()) && !overdueInfo.isOverdue && overdueInfo.isDueToday && (
                                  <span className="history-room-duetoday-tag">
                                    🔔 Trả phòng hôm nay
                                  </span>
                                )}
                                {roomExtHours > 0 && (
                                  <span className="history-room-extended-tag">
                                     Đã thuê thêm +{roomExtHours}h
                                  </span>
                                )}
                                {isUpgraded && (
                                  <span className="history-room-upgrade-badge" title={room.notes}>
                                     🏷️ Đã đổi phòng
                                  </span>
                                )}
                              </div>
                              <span>{houseTypeName(room)} · {room.numberOfAdults} NL · {room.numberOfChildren} TE</span>
                            </div>
                            <div>
                              <p>{formatAppDateTime(room.checkInTarget, { weekday: 'long' })} → {formatAppDateTime(room.checkOutTarget, { weekday: 'long' })}</p>
                            </div>
                            <b>
                              {Number(room.allocatedDiscount || 0) > 0
                                ? `${formatMoney(room.finalRoomAmount)} (-${formatMoney(room.allocatedDiscount)})`
                                : formatMoney(room.priceAtBooking)}
                            </b>
                            {room.notes && (
                              <div className="history-room-full-row">
                                <RoomChangeHistoryCard notes={room.notes} />
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </section>

                  <section className="history-detail-section">
                    <h3>Dịch vụ và phát sinh</h3>
                    {detail.services.length ? (
                      <div className="history-service-list">
                        {detail.services.map((service) => (
                          <div key={`${service.source || 'PRE_BOOKED'}-${service.id}`}>
                            <span>{service.name} · {serviceSourceLabel(service.source)} · {serviceTypeLabel(service.type)} × {service.quantity}</span>
                            <strong>{formatMoney(service.totalAmount)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="history-muted">Không có dịch vụ đi kèm.</p>
                    )}
                  </section>

                  <section className="history-customer-review">
                    <div>
                      <span>Kiểm tra & Đánh giá chuyến đi</span>
                      <strong>{detail.customerConfirmed ? 'Bạn đã xác nhận đơn này' : 'Xác nhận nếu hóa đơn và dịch vụ đã đúng'}</strong>
                      {reviewData && (
                        <div>
                          <p className="history-review-done-text"> Bạn đã đánh giá: {reviewData.ratingStars} Sao — "{reviewData.comment}"</p>
                          {reviewData.imageUrls && reviewData.imageUrls.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {reviewData.imageUrls.map((url, i) => (
                                <img
                                  key={i}
                                  src={resolveImageUrl(url)}
                                  alt="Ảnh review"
                                  style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {customerActionError && <p className="history-customer-review-error">{customerActionError}</p>}

                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['CHECKED_OUT', 'COMPLETED'].includes(String(detail.status || '').toUpperCase()) && (
                        <button
                          type="button"
                          className="history-review-star-btn"
                          onClick={() => {
                            setReviewStars(reviewData?.ratingStars || 5)
                            setReviewComment(reviewData?.comment || '')
                            setReviewImages(reviewData?.imageUrls || [])
                            setReviewOpen(true)
                          }}
                        >
                          {reviewData ? `★ ${reviewData.ratingStars} Sao (Sửa)` : '★ Đánh giá ngay'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="history-confirm-btn"
                        disabled={detail.customerConfirmed || confirmSaving}
                        onClick={handleCustomerConfirm}
                      >
                        {detail.customerConfirmed ? 'Đã xác nhận' : confirmSaving ? 'Đang lưu...' : 'Xác nhận'}
                      </button>
                      <button type="button" className="history-feedback-btn" onClick={openFeedback}>
                        Phản hồi
                      </button>
                    </div>
                  </section>

                </>
              ) : selectedBooking ? (
                <div className="history-state">Chọn booking để xem chi tiết.</div>
              ) : null}
            </aside>
          </section>
        )}
      </main>

      {paymentInfo && (
        <div className="sepay-modal-backdrop" role="presentation">
          <section className="sepay-modal" role="dialog" aria-modal="true" aria-labelledby="sepay-payment-title">
            <button
              className="sepay-modal-close"
              type="button"
              aria-label="Đóng"
              onClick={() => setPaymentInfo(null)}
            >
              ×
            </button>
            {paymentState === 'success' ? (
              <div className="sepay-success">
                <span>✓</span>
                <h2 id="sepay-payment-title">Thanh toán thành công</h2>
                <p>Booking {bookingDisplay(paymentInfo)} đã được xác nhận và hóa đơn đã được lưu.</p>
                <button type="button" onClick={() => setPaymentInfo(null)}>Hoàn tất</button>
              </div>
            ) : (
              <>
                <div className="sepay-modal-heading">
                  <span>Thanh toán SePay</span>
                  <h2 id="sepay-payment-title">Quét mã QR để thanh toán</h2>
                  <p>Không thay đổi số tiền và nội dung chuyển khoản.</p>
                </div>
                <div className="sepay-payment-layout">
                  <div className="sepay-qr">
                    <img src={paymentInfo.qrCodeUrl} alt="Mã QR thanh toán SePay" />
                    <small>Đang chờ SePay xác nhận...</small>
                  </div>
                  <dl className="sepay-payment-info">
                    <div><dt>Số tiền</dt><dd>{formatMoney(paymentInfo.amount)}</dd></div>
                    <div><dt>Ngân hàng</dt><dd>{paymentInfo.bankName}</dd></div>
                    <div><dt>Số tài khoản</dt><dd>{paymentInfo.accountNumber}</dd></div>
                    <div><dt>Chủ tài khoản</dt><dd>{paymentInfo.accountHolder}</dd></div>
                    <div><dt>Nội dung</dt><dd className="sepay-code">{paymentInfo.transferContent}</dd></div>
                  </dl>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {feedbackOpen && (
        <div className="history-feedback-backdrop" onClick={(event) => event.target === event.currentTarget && setFeedbackOpen(false)}>
          <form className="history-feedback-modal" onSubmit={submitFeedback}>
            <div>
              <h2>Phản hồi về booking</h2>
              <p>Nhập nội dung cần hệ thống kiểm tra lại về hóa đơn hoặc dịch vụ.</p>
            </div>
            <textarea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              maxLength={1000}
              placeholder="Ví dụ: Hóa đơn đang tính nhầm dịch vụ minibar..."
              autoFocus
            />
            <div className="history-feedback-actions">
              <button type="button" onClick={() => setFeedbackOpen(false)}>Hủy</button>
              <button type="submit" disabled={feedbackSaving || !feedbackText.trim()}>
                {feedbackSaving ? 'Đang lưu...' : 'Lưu phản hồi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {reviewOpen && (
        <div className="history-feedback-backdrop" onClick={(event) => event.target === event.currentTarget && setReviewOpen(false)}>
          <form className="history-feedback-modal" onSubmit={submitReview}>
            <div>
              <h2> Đánh giá chuyến đi</h2>
              <p>Hãy chia sẻ cảm nhận của bạn về trải nghiệm kỳ nghỉ tại Homestay.</p>
            </div>

            {reviewError && <p className="history-customer-review-error">{reviewError}</p>}

            <div style={{ display: 'flex', gap: '8px', fontSize: '2rem', justifyContent: 'center', cursor: 'pointer', margin: '16px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setReviewStars(star)}
                  style={{ color: star <= reviewStars ? '#f59e0b' : '#cbd5e1', transition: 'color 0.2s' }}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              maxLength={1000}
              placeholder="Nhập trải nghiệm thực tế của bạn (phòng sạch đẹp, dịch vụ tốt, không khí thoáng mát...)"
              rows={4}
              required
            />

            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                 Thêm hình ảnh đánh giá (Tải tệp từ máy hoặc dán URL ảnh)
              </label>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}
              />

              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="https://example.com/anh-phong.jpg"
                  value={reviewImageInput}
                  onChange={(e) => setReviewImageInput(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Thêm URL
                </button>
              </div>

              {reviewImages.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {reviewImages.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <img src={url} alt="Review thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(idx)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'grid', placeItems: 'center' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="history-feedback-actions" style={{ marginTop: '16px' }}>
              <button type="button" onClick={() => setReviewOpen(false)}>Hủy</button>
              <button type="submit" disabled={reviewSubmitting || !reviewComment.trim()}>
                {reviewSubmitting ? 'Đang lưu...' : reviewData ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Thuê Thêm Giờ / Gia Hạn Lưu Trú */}
      {extendModalOpen && extendBooking && (
        <BookingExtensionModal
          booking={extendBooking}
          roomDetail={extendRoomDetail}
          token={token}
          onClose={() => setExtendModalOpen(false)}
          onExtensionSuccess={handleExtensionSuccess}
        />
      )}

      {/* Modal: Xác Nhận Hủy Đặt Phòng & Hoàn Tiền */}
      {cancelModalOpen && cancelBooking && (
        <BookingCancelModal
          booking={cancelBooking}
          currentUser={getStoredUser()}
          token={token}
          onClose={() => setCancelModalOpen(false)}
          onCancelSuccess={handleCancelSuccess}
        />
      )}

      {/* Modal: Khách Hàng Yêu Cầu Đổi Phòng / Báo Sự Cố */}
      {changeRoomModalOpen && changeRoomBooking && (
        <CustomerChangeRoomModal
          booking={changeRoomBooking}
          room={changeRoomTargetRoom}
          currentUser={getStoredUser()}
          onClose={() => setChangeRoomModalOpen(false)}
        />
      )}

    </div>
  )
}


export default BookingHistoryPage
