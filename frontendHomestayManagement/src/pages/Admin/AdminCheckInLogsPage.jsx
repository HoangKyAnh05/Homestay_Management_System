import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import AdminLayout from './AdminLayout'
import './AdminCheckInLogsPage.css'

const API_BASE = 'http://localhost:8080/api/admin/bookings'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function toDateInputValue(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFromDate() {
  const date = new Date()
  date.setDate(date.getDate() - 14)
  return toDateInputValue(date)
}

function defaultToDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return toDateInputValue(date)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || 'Chưa rõ'
}

function rentTypeLabel(rentType) {
  const labels = {
    HOURLY: 'Theo giờ',
    BY_HOUR: 'Theo giờ',
    DAILY: 'Theo ngày',
    BY_DAY: 'Theo ngày',
    NIGHTLY: 'Theo đêm',
    BY_NIGHT: 'Theo đêm',
  }
  return labels[String(rentType || '').toUpperCase()] || rentType || 'Chưa rõ'
}

function detailStage(detail) {
  if (detail.checkInRecord?.actualCheckOut) return 'completed'
  if (detail.checkInRecord?.actualCheckIn) return 'staying'
  if (String(detail.detailStatus || '').toUpperCase() === 'CANCELLED') return 'cancelled'
  return 'waiting'
}

function stageLabel(stage) {
  return {
    waiting: 'Chưa check-in',
    staying: 'Đang lưu trú',
    completed: 'Đã trả phòng',
    cancelled: 'Đã hủy',
  }[stage]
}

function bookingMatches(booking, keyword) {
  if (!keyword) return true
  const customer = booking.customer || {}
  const haystack = [
    booking.bookingId,
    booking.bookingStatus,
    customer.fullName,
    customer.phone,
    customer.email,
    ...booking.details.flatMap(detail => [
      detail.roomNumber,
      detail.roomTypeName,
      detail.detailStatus,
      detail.bookingDetailId,
    ]),
  ].join(' ').toLowerCase()
  return haystack.includes(keyword)
}

function bookingHasStatus(booking, status) {
  if (!status) return true
  return booking.details.some(detail => detailStage(detail) === status)
}

function BookingListItem({ booking, active, onSelect }) {
  const customer = booking.customer || {}
  const progress = booking.totalDetails ? Math.round((booking.checkedInDetails / booking.totalDetails) * 100) : 0
  const isCompleted = String(booking.bookingStatus || '').toUpperCase() === 'COMPLETED'
    || (booking.totalDetails > 0 && booking.completedDetails === booking.totalDetails)

  return (
    <button type="button" className={`acl-booking${active ? ' acl-booking--active' : ''}`} onClick={onSelect}>
      <span className="acl-booking-top">
        <strong>Booking #{booking.bookingId}</strong>
        <span className={`acl-pill acl-pill--${String(booking.bookingStatus || '').toLowerCase()}`}>
          {statusLabel(booking.bookingStatus)}
        </span>
      </span>
      <span className="acl-booking-customer">{customer.fullName || 'Khách chưa có tên'}</span>
      <span className="acl-booking-meta">
        <span>{booking.totalDetails} phòng</span>
        <span>{formatMoney(booking.totalAmount)}</span>
      </span>
      <span className={`acl-progress${isCompleted ? ' acl-progress--completed' : ''}`} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </span>
    </button>
  )
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`acl-summary-card${tone ? ` acl-summary-card--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DetailCard({ detail, actionLoading, onAction }) {
  const stage = detailStage(detail)
  const canCheckIn = stage === 'waiting'
  const canCheckOut = stage === 'staying'
  const loading = actionLoading === detail.bookingDetailId

  return (
    <article className={`acl-detail acl-detail--${stage}`}>
      <div className="acl-detail-main">
        <div className="acl-room-badge">
          <strong>{detail.roomNumber || '—'}</strong>
          <span>{detail.roomTypeName || 'Chưa phân loại'}</span>
        </div>
        <div>
          <div className="acl-detail-title">
            <h3>{detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'}</h3>
            <span className={`acl-stage acl-stage--${stage}`}>{stageLabel(stage)}</span>
          </div>
          <div className="acl-detail-grid">
            <div><span>Nhận phòng dự kiến</span><strong>{formatAppDateTime(detail.checkInTarget)}</strong></div>
            <div><span>Trả phòng dự kiến</span><strong>{formatAppDateTime(detail.checkOutTarget)}</strong></div>
            <div><span>Check-in thực tế</span><strong>{formatAppDateTime(detail.checkInRecord?.actualCheckIn)}</strong></div>
            <div><span>Check-out thực tế</span><strong>{formatAppDateTime(detail.checkInRecord?.actualCheckOut)}</strong></div>
          </div>
        </div>
      </div>

      <div className="acl-detail-bottom">
        <div className="acl-detail-tags">
          <span>{detail.numberOfAdults || 0} người lớn</span>
          <span>{detail.numberOfChildren || 0} trẻ em</span>
          <span>{rentTypeLabel(detail.rentType)}</span>
          <span>{formatMoney(detail.priceAtBooking)}</span>
        </div>
        <div className="acl-detail-actions">
          <button type="button" disabled={!canCheckIn || loading} onClick={() => onAction(detail.bookingDetailId, 'check-in')}>
            {loading && canCheckIn ? 'Đang xử lý...' : 'Check-in'}
          </button>
          <button type="button" disabled={!canCheckOut || loading} onClick={() => onAction(detail.bookingDetailId, 'check-out')}>
            {loading && canCheckOut ? 'Đang xử lý...' : 'Check-out'}
          </button>
        </div>
      </div>
    </article>
  )
}

function createGuestForms(preparation) {
  const total = Number(preparation.numberOfAdults || 0) + Number(preparation.numberOfChildren || 0)
  return Array.from({ length: total }, (_, index) => ({
    fullName: index === 0 ? preparation.customer?.fullName || '' : '',
    identityDocumentNumber: index === 0 ? preparation.customerIdentityDocumentNumber || '' : '',
    dateOfBirth: index === 0 ? preparation.customer?.dateOfBirth || '' : '',
    email: index === 0 ? preparation.customer?.email || '' : '',
    phone: index === 0 ? preparation.customer?.phone || '' : '',
    address: index === 0 ? preparation.customer?.address || '' : '',
    gender: '',
    nationality: 'VIETNAM',
  }))
}

function CheckOutModal({ bookingDetailId, onClose, onCompleted }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/details/${bookingDetailId}`, {
      headers: authHeaders(), signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết đơn đặt phòng')
        setDetail(data)
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [bookingDetailId])

  const handleCheckOut = async () => {
    setCheckingOut(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/prepare-check-out`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể thực hiện check-out')
      if (data.completed) {
        await onCompleted()
      } else {
        setDetail(data.booking)
        setPayment(data.payment)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  const inv = detail?.invoice
  const paidAmount = Number(detail?.paidAmount || 0)
  const remaining = inv ? Number(inv.totalAmount || 0) - paidAmount : 0
  const guests = detail?.guests || []
  const primaryGuest = guests.find(g => g.primaryGuest) || guests[0]
  const otherGuests = guests.filter(g => g !== primaryGuest)

  function genderLabel(g) {
    return g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : g === 'OTHER' ? 'Khác' : '—'
  }

  return (
    <>
      <div className="aco-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <section className="aco-modal" role="dialog" aria-modal="true" aria-labelledby="aco-title">

          {/* ── Header ── */}
          <header className="aco-header">
            <div className="aco-header-label">Trả phòng</div>
            <div className="aco-header-body">
              <div>
                <h2 id="aco-title">
                  {detail ? `Booking #${detail.bookingId}` : 'Đang tải...'}
                </h2>
                <p>{detail ? `${detail.customer?.fullName || '—'} · ${detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'} · ${detail.roomTypeName || ''}` : ''}</p>
              </div>
              <button type="button" className="aco-close" onClick={onClose} aria-label="Đóng">×</button>
            </div>
          </header>

          {/* ── Loading / Error ── */}
          {loading && <div className="aco-state">Đang tải chi tiết đơn đặt phòng...</div>}
          {!loading && error && !detail && <div className="aco-state aco-state--error">{error}</div>}

          {detail && (
            <div className="aco-body">
              <div className="aco-cols">

                {/* ── Cột trái: Thông tin & Khách ── */}
                <div className="aco-left">

                  {/* Tổng quan booking */}
                  <section className="aco-card">
                    <div className="aco-card-title">
                      <svg viewBox="0 0 20 20" fill="none"><path d="M3 10h14M3 6h14M3 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Thông tin đặt phòng
                    </div>
                    <div className="aco-info-grid">
                      <div className="aco-info-item">
                        <span>Phòng</span>
                        <strong>{detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán'}</strong>
                        <small>{detail.roomTypeName}</small>
                      </div>
                      <div className="aco-info-item">
                        <span>Nhận phòng</span>
                        <strong>{formatAppDateTime(detail.checkInTarget)}</strong>
                      </div>
                      <div className="aco-info-item">
                        <span>Trả phòng</span>
                        <strong>{formatAppDateTime(detail.checkOutTarget)}</strong>
                      </div>
                      <div className="aco-info-item">
                        <span>Số khách</span>
                        <strong>{detail.numberOfAdults || 0} người lớn · {detail.numberOfChildren || 0} trẻ em</strong>
                      </div>
                    </div>
                  </section>

                  {/* Khách lưu trú */}
                  {guests.length > 0 && (
                    <section className="aco-card">
                      <div className="aco-card-title">
                        <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        Khách lưu trú
                        <span className="aco-badge">{guests.length} người</span>
                      </div>

                      {primaryGuest && (
                        <div className="aco-guest aco-guest--primary">
                          <div className="aco-guest-avatar">
                            {(primaryGuest.fullName || '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase()}
                          </div>
                          <div className="aco-guest-info">
                            <div className="aco-guest-name">
                              {primaryGuest.fullName || '—'}
                              <span className="aco-guest-tag">Người đại diện</span>
                            </div>
                            <div className="aco-guest-fields">
                              {primaryGuest.identityDocumentNumber && (
                                <span><em>CCCD</em>{primaryGuest.identityDocumentNumber}</span>
                              )}
                              {primaryGuest.phone && (
                                <span><em>SĐT</em>{primaryGuest.phone}</span>
                              )}
                              {primaryGuest.dateOfBirth && (
                                <span><em>Ngày sinh</em>{new Date(primaryGuest.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                              )}
                              {primaryGuest.gender && (
                                <span><em>Giới tính</em>{genderLabel(primaryGuest.gender)}</span>
                              )}
                              {primaryGuest.email && (
                                <span><em>Email</em>{primaryGuest.email}</span>
                              )}
                              {primaryGuest.address && (
                                <span className="aco-guest-address"><em>Địa chỉ</em>{primaryGuest.address}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {otherGuests.length > 0 && (
                        <div className="aco-guest-others">
                          {otherGuests.map((guest, i) => (
                            <div key={guest.id || i} className="aco-guest aco-guest--other">
                              <div className="aco-guest-avatar aco-guest-avatar--sm">
                                {(guest.fullName || '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase()}
                              </div>
                              <div className="aco-guest-info">
                                <div className="aco-guest-name">
                                  {guest.fullName || '—'}
                                  <span className="aco-guest-tag aco-guest-tag--other">
                                    {i < Number(detail.numberOfAdults || 1) - 1 ? 'Người lớn' : 'Trẻ em'}
                                  </span>
                                </div>
                                <div className="aco-guest-fields">
                                  {guest.identityDocumentNumber && (
                                    <span><em>CCCD</em>{guest.identityDocumentNumber}</span>
                                  )}
                                  {guest.phone && (
                                    <span><em>SĐT</em>{guest.phone}</span>
                                  )}
                                  {guest.dateOfBirth && (
                                    <span><em>Ngày sinh</em>{new Date(guest.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                </div>

                {/* ── Cột phải: Hoá đơn ── */}
                <div className="aco-right">
                  <section className="aco-card aco-card--invoice">
                    <div className="aco-card-title">
                      <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 7h6M7 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Hoá đơn thanh toán
                    </div>

                    {/* Chi phí phát sinh */}
                    {(detail.serviceItems?.length > 0 || detail.penaltyItems?.length > 0) && (
                      <div className="aco-items">
                        {detail.serviceItems?.map((item, i) => (
                          <div key={i} className="aco-item">
                            <span className="aco-item-name">{item.name}</span>
                            <span className="aco-item-qty">×{item.quantity}</span>
                            <strong>{formatMoney(item.totalPrice)}</strong>
                          </div>
                        ))}
                        {detail.penaltyItems?.map((item, i) => (
                          <div key={i} className="aco-item aco-item--penalty">
                            <span className="aco-item-name">
                              {item.title}
                              {item.description && <small>{item.description}</small>}
                            </span>
                            <span className="aco-item-qty">×1</span>
                            <strong>{formatMoney(item.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tổng kết */}
                    <div className="aco-totals">
                      <div className="aco-total-row">
                        <span>Tiền phòng</span>
                        <strong>{formatMoney(inv?.roomCharge)}</strong>
                      </div>
                      <div className="aco-total-row">
                        <span>Dịch vụ</span>
                        <strong>{formatMoney(inv?.serviceCharge)}</strong>
                      </div>
                      {Number(inv?.penaltyCharge || 0) > 0 && (
                        <div className="aco-total-row aco-total-row--penalty">
                          <span>Phạt vi phạm</span>
                          <strong>{formatMoney(inv?.penaltyCharge)}</strong>
                        </div>
                      )}
                      <div className="aco-total-row aco-total-row--sum">
                        <span>Tổng cộng</span>
                        <strong>{formatMoney(inv?.totalAmount)}</strong>
                      </div>
                      <div className="aco-total-row aco-total-row--paid">
                        <span>Đã thanh toán</span>
                        <strong>{formatMoney(paidAmount)}</strong>
                      </div>
                    </div>

                    {/* Trạng thái cuối */}
                    {remaining > 0 ? (
                      <div className="aco-balance aco-balance--due">
                        <div className="aco-balance-label">Còn lại cần thanh toán</div>
                        <div className="aco-balance-amount">{formatMoney(remaining)}</div>
                        <p>Khách cần thanh toán trước khi trả phòng.</p>
                      </div>
                    ) : (
                      <div className="aco-balance aco-balance--clear">
                        <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="m6.5 10 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <strong>Đã thanh toán đủ</strong>
                          <p>Có thể xác nhận trả phòng ngay.</p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

              </div>

              {error && <div className="aco-error">{error}</div>}
            </div>
          )}

          {detail && (
            <footer className="aco-footer">
              <button type="button" className="aco-btn-cancel" onClick={onClose}>Hủy</button>
              <button
                type="button"
                className={`aco-btn-checkout${remaining > 0 ? ' aco-btn-checkout--pay' : ''}`}
                disabled={checkingOut || loading}
                onClick={handleCheckOut}
              >
                {checkingOut ? (
                  <><span className="aco-spinner" />Đang xử lý...</>
                ) : remaining > 0 ? (
                  `Check-out & Thanh toán ${formatMoney(remaining)}`
                ) : (
                  'Xác nhận Check-out'
                )}
              </button>
            </footer>
          )}
        </section>
      </div>

      {payment && (
        <SePayQrPayment
          payment={payment}
          statusUrl={`${API_BASE}/details/${bookingDetailId}`}
          headers={authHeaders()}
          successStatus="COMPLETED"
          statusField="detailStatus"
          title="Thanh toán trước khi trả phòng"
          onSuccess={async () => { setPayment(null); await onCompleted() }}
          onClose={() => setPayment(null)}
        />
      )}
    </>
  )
}

function CheckInModal({ bookingDetailId, onClose, onCompleted }) {
  const [preparation, setPreparation] = useState(null)
  const [roomId, setRoomId] = useState('')
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/details/${bookingDetailId}/check-in-preparation`, {
      headers: authHeaders(), signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể chuẩn bị thông tin check-in')
        setPreparation(data)
        setRoomId(data.availableRooms?.[0]?.id ? String(data.availableRooms[0].id) : '')
        setGuests(createGuestForms(data))
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [bookingDetailId])

  const updateGuest = (index, field, value) => {
    setGuests(current => current.map((guest, guestIndex) => (
      guestIndex === index ? { ...guest, [field]: value } : guest
    )))
  }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/complete-check-in`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          roomId: Number(roomId),
          guests: guests.map(guest => ({
            ...guest,
            dateOfBirth: guest.dateOfBirth || null,
            email: guest.email || null,
            phone: guest.phone || null,
            address: guest.address || null,
            gender: guest.gender || null,
            nationality: guest.nationality || null,
          })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể hoàn tất check-in')
      await onCompleted(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="acl-checkin-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="acl-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="acl-checkin-title">
        <header className="acl-checkin-head">
          <div>
            <span>Tiếp nhận lưu trú</span>
            <h2 id="acl-checkin-title">Check-in booking #{preparation?.bookingId || ''}</h2>
            <p>{preparation ? `${preparation.customer?.fullName} · ${preparation.roomTypeName}` : 'Đang tải thông tin...'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </header>

        {loading ? <div className="acl-checkin-state">Đang chuẩn bị form check-in...</div> : null}
        {!loading && !preparation ? <div className="acl-checkin-state acl-checkin-state--error">{error}</div> : null}

        {preparation ? (
          <form className="acl-checkin-body" onSubmit={submit}>
            <section className="acl-checkin-summary">
              <div><span>Khách đặt phòng</span><strong>{preparation.customer?.fullName || '—'}</strong></div>
              <div><span>Thời gian lưu trú</span><strong>{formatAppDateTime(preparation.checkInTarget)} → {formatAppDateTime(preparation.checkOutTarget)}</strong></div>
              <div><span>Số khách</span><strong>{preparation.numberOfAdults} người lớn · {preparation.numberOfChildren} trẻ em</strong></div>
            </section>

            <section className="acl-checkin-section">
              <div className="acl-checkin-section-head">
                <div><span>01</span><div><h3>Gán phòng trống</h3><p>Chỉ hiển thị phòng đúng loại và không trùng lịch.</p></div></div>
              </div>
              {preparation.availableRooms.length ? (
                <div className="acl-room-options">
                  {preparation.availableRooms.map(room => (
                    <label key={room.id} className={String(room.id) === roomId ? 'is-selected' : ''}>
                      <input type="radio" name="room" value={room.id} checked={String(room.id) === roomId}
                        onChange={event => setRoomId(event.target.value)} />
                      <span>Phòng</span><strong>{room.roomNumber}</strong><small>{room.roomTypeName}</small>
                    </label>
                  ))}
                </div>
              ) : <div className="acl-checkin-warning">Không còn phòng {preparation.roomTypeName} trống trong thời gian này.</div>}
            </section>

            <section className="acl-checkin-section">
              <div className="acl-checkin-section-head">
                <div><span>02</span><div><h3>Thông tin người lưu trú</h3><p>Nhập đủ {guests.length} người. Tên và CCCD là bắt buộc.</p></div></div>
              </div>
              <div className="acl-guest-forms">
                {guests.map((guest, index) => {
                  const isAdult = index < Number(preparation.numberOfAdults || 0)
                  return (
                    <article className="acl-guest-form" key={index}>
                      <div className="acl-guest-form-title">
                        <strong>Người lưu trú {index + 1}</strong>
                        <span>{index === 0 ? 'Người đặt · Đại diện' : isAdult ? 'Người lớn' : 'Trẻ em'}</span>
                      </div>
                      <div className="acl-guest-fields">
                        <label><span>Họ và tên *</span><input required maxLength="100" value={guest.fullName}
                          onChange={event => updateGuest(index, 'fullName', event.target.value)} /></label>
                        <label><span>Căn cước công dân *</span><input required maxLength="30" value={guest.identityDocumentNumber}
                          onChange={event => updateGuest(index, 'identityDocumentNumber', event.target.value)} /></label>
                        <label><span>Ngày sinh</span><input type="date" value={guest.dateOfBirth}
                          onChange={event => updateGuest(index, 'dateOfBirth', event.target.value)} /></label>
                        <label><span>Email</span><input type="email" maxLength="100" value={guest.email}
                          onChange={event => updateGuest(index, 'email', event.target.value)} /></label>
                        <label><span>Số điện thoại</span><input maxLength="15" value={guest.phone}
                          onChange={event => updateGuest(index, 'phone', event.target.value)} /></label>
                        <label><span>Giới tính</span><select value={guest.gender}
                          onChange={event => updateGuest(index, 'gender', event.target.value)}>
                          <option value="">Chưa chọn</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
                        </select></label>
                        <label className="acl-guest-field-wide"><span>Địa chỉ</span><input maxLength="255" value={guest.address}
                          onChange={event => updateGuest(index, 'address', event.target.value)} /></label>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            {error && <div className="acl-checkin-warning acl-checkin-warning--error">{error}</div>}
            <footer className="acl-checkin-actions">
              <button type="button" onClick={onClose}>Hủy</button>
              <button type="submit" disabled={saving || !roomId || !preparation.availableRooms.length}>
                {saving ? 'Đang check-in...' : `Xác nhận check-in ${guests.length} người`}
              </button>
            </footer>
          </form>
        ) : null}
      </section>
    </div>
  )
}

function AdminCheckInLogsPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [checkInTargetId, setCheckInTargetId] = useState(null)
  const [checkOutTargetId, setCheckOutTargetId] = useState(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate, toDate })
      const response = await fetch(`${API_BASE}/check-in-logs?${params}`, { headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể tải nhật ký lưu trú')
      const nextBookings = Array.isArray(data) ? data : []
      setBookings(nextBookings)
      setSelectedBookingId(current => {
        if (current && nextBookings.some(booking => booking.bookingId === current)) return current
        return nextBookings[0]?.bookingId || null
      })
    } catch (err) {
      setError(err.message)
      setBookings([])
      setSelectedBookingId(null)
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    // The request updates loading state before synchronizing with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs()
  }, [loadLogs])

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return bookings.filter(booking => bookingMatches(booking, keyword) && bookingHasStatus(booking, stageFilter))
  }, [bookings, search, stageFilter])

  const selectedBooking = useMemo(() => {
    return filteredBookings.find(booking => booking.bookingId === selectedBookingId) || filteredBookings[0] || null
  }, [filteredBookings, selectedBookingId])

  const allDetails = bookings.flatMap(booking => booking.details)
  const waitingCount = allDetails.filter(detail => detailStage(detail) === 'waiting').length
  const stayingCount = allDetails.filter(detail => detailStage(detail) === 'staying').length
  const completedCount = allDetails.filter(detail => detailStage(detail) === 'completed').length

  const runAction = async (bookingDetailId, action) => {
    if (action === 'check-in') {
      setCheckInTargetId(bookingDetailId)
      return
    }
    if (action === 'check-out') {
      setCheckOutTargetId(bookingDetailId)
      return
    }
    setActionLoading(bookingDetailId)
    setActionError('')
    try {
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể cập nhật lưu trú')
      await loadLogs()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout activePage="check-in-logs">
      <div className="acl-header">
        <div>
          <h1>Nhật ký lưu trú</h1>
          <p>Quản lí check-in theo booking, mỗi booking hiển thị toàn bộ lưu trú theo từng booking detail.</p>
        </div>
        <button type="button" className="acl-refresh" onClick={loadLogs} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <section className="acl-summary">
        <SummaryCard label="Booking trong kỳ" value={bookings.length} />
        <SummaryCard label="Chưa check-in" value={waitingCount} tone="waiting" />
        <SummaryCard label="Đang lưu trú" value={stayingCount} tone="staying" />
        <SummaryCard label="Đã trả phòng" value={completedCount} tone="completed" />
      </section>

      <section className="acl-toolbar">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm booking, khách hàng, số phòng, số điện thoại..." />
        <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
        <select value={stageFilter} onChange={event => setStageFilter(event.target.value)}>
          <option value="">Tất cả lưu trú</option>
          <option value="waiting">Chưa check-in</option>
          <option value="staying">Đang lưu trú</option>
          <option value="completed">Đã trả phòng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </section>

      {error ? <div className="acl-message acl-message--error">{error}</div> : null}
      {actionError ? <div className="acl-message acl-message--error">{actionError}</div> : null}

      <section className="acl-workspace">
        <aside className="acl-booking-panel">
          <div className="acl-panel-title">
            <strong>Danh sách booking</strong>
            <span>{filteredBookings.length} kết quả</span>
          </div>
          {loading ? (
            <div className="acl-empty">Đang tải nhật ký...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="acl-empty">Không có booking phù hợp.</div>
          ) : (
            <div className="acl-booking-list">
              {filteredBookings.map(booking => (
                <BookingListItem
                  key={booking.bookingId}
                  booking={booking}
                  active={selectedBooking?.bookingId === booking.bookingId}
                  onSelect={() => setSelectedBookingId(booking.bookingId)}
                />
              ))}
            </div>
          )}
        </aside>

        <div className="acl-detail-panel">
          {selectedBooking ? (
            <>
              <div className="acl-selected-head">
                <div>
                  <span>Booking #{selectedBooking.bookingId}</span>
                  <h2>{selectedBooking.customer?.fullName || 'Khách chưa có tên'}</h2>
                  <p>
                    Đặt ngày {formatDate(selectedBooking.bookingDate)}
                    {selectedBooking.customer?.phone ? ` · ${selectedBooking.customer.phone}` : ''}
                  </p>
                </div>
                <div className="acl-selected-total">
                  <span>Tổng tiền phòng</span>
                  <strong>{formatMoney(selectedBooking.totalAmount)}</strong>
                </div>
              </div>

              <div className="acl-detail-list">
                {selectedBooking.details.map(detail => (
                  <DetailCard
                    key={detail.bookingDetailId}
                    detail={detail}
                    actionLoading={actionLoading}
                    onAction={runAction}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="acl-empty acl-empty--panel">Chọn một booking để xem lưu trú.</div>
          )}
        </div>
      </section>
      {checkInTargetId && (
        <CheckInModal
          bookingDetailId={checkInTargetId}
          onClose={() => setCheckInTargetId(null)}
          onCompleted={async () => {
            setCheckInTargetId(null)
            await loadLogs()
          }}
        />
      )}
      {checkOutTargetId && (
        <CheckOutModal
          bookingDetailId={checkOutTargetId}
          onClose={() => setCheckOutTargetId(null)}
          onCompleted={async () => {
            setCheckOutTargetId(null)
            await loadLogs()
          }}
        />
      )}
    </AdminLayout>
  )
}

export default AdminCheckInLogsPage
