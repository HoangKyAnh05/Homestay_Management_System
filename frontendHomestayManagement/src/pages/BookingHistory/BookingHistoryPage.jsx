import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './BookingHistoryPage.css'

const API_BASE_URL = 'http://localhost:8080/api'
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
      <a className="home-logo" href="/home">Home Stays</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/rooms">Phòng</a>
        <a href="/wishlist">Yêu thích</a>
        <a href="/amenities">Tiện nghi</a>
        <a href="/home#contact">Liên hệ</a>
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
              <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
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
      const response = await fetch(`${API_BASE_URL}/customer/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: detail.bookingId,
          ratingStars: reviewStars,
          comment: reviewComment,
          imageUrls: reviewImages,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể gửi đánh giá')
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
                  <h2>Phòng {booking.firstRoomNumber} · {booking.firstRoomTypeName}</h2>
                  <p>{formatAppDateTime(booking.checkInTarget, { weekday: 'long' })}</p>
                  <div className="history-card-bottom">
                    <span>{booking.roomCount} phòng · {formatMoney(booking.totalAmount)}</span>
                    {canAddService(booking) && <AddServiceButton bookingId={booking.bookingId} compact />}
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
                        <div><span>Voucher {detail.voucherCode}</span><strong>-{formatMoney(detail.roomDiscountAmount)}</strong></div>
                      </>
                    )}
                    <div><span>Tổng tiền phòng</span><strong>{formatMoney(detail.roomCharge)}</strong></div>
                    <div><span>Tổng dịch vụ</span><strong>{formatMoney(detail.serviceCharge)}</strong></div>
                    <div><span>Tổng thanh toán</span><strong>{formatMoney(detail.totalAmount)}</strong></div>
                  </div>

                  <section className="history-detail-section">
                    <h3>Phòng đã đặt</h3>
                    <div className="history-room-list">
                      {detail.rooms.map((room) => (
                        <article key={room.bookingDetailId}>
                          <div>
                            <strong>Phòng {room.roomNumber}</strong>
                            <span>{room.roomTypeName} · {room.numberOfAdults} NL · {room.numberOfChildren} TE</span>
                          </div>
                          <p>{formatAppDateTime(room.checkInTarget, { weekday: 'long' })} → {formatAppDateTime(room.checkOutTarget, { weekday: 'long' })}</p>
                          <b>
                            {Number(room.allocatedDiscount || 0) > 0
                              ? `${formatMoney(room.finalRoomAmount)} (-${formatMoney(room.allocatedDiscount)})`
                              : formatMoney(room.priceAtBooking)}
                          </b>
                        </article>
                      ))}
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
                          <p className="history-review-done-text">⭐ Bạn đã đánh giá: {reviewData.ratingStars} Sao — "{reviewData.comment}"</p>
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
                            setReviewOpen(true)
                          }}
                        >
                          {reviewData ? `⭐ ${reviewData.ratingStars} Sao (Sửa)` : '⭐ Đánh giá ngay'}
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
              <h2>⭐ Đánh giá chuyến đi</h2>
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
                📷 Thêm hình ảnh đánh giá (Tải tệp từ máy hoặc dán URL ảnh)
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
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}


export default BookingHistoryPage
