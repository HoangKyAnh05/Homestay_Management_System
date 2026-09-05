import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { useShiftGuard } from '../../context/ShiftGuardContext'
import { formatClockTime, formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import AdminLayout from './AdminLayout'
import './AdminBookingsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/bookings'
const ADMIN_SERVICE_API = (import.meta.env.VITE_API_URL || '') + '/api/admin/services'
const HOUSEKEEPING_API = (import.meta.env.VITE_API_URL || '') + '/api/housekeeping'
const SCHEDULE_API = `${API_BASE}/schedule`
const PAGE_SIZE_OPTIONS = [6, 8, 12]
const ADMIN_SCHEDULE_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED'])

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function serviceImageSrc(imageUrl) {
  if (!imageUrl) return '/img.png'
  return imageUrl.startsWith('/uploads/') ? `${import.meta.env.VITE_API_URL || ''}${imageUrl}` : imageUrl
}

function toDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay() || 7
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - day + 1)
  return result
}

function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function formatShortDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatFullVietnameseDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const dayName = days[d.getDay()]
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${dayName} - Ngày ${day}/${month}/${year}`
}

function normalizeStatus(status) {
  return String(status || '').toUpperCase()
}

function isAdminScheduleBookingVisible(booking) {
  return ADMIN_SCHEDULE_STATUSES.has(normalizeStatus(booking.bookingStatus))
}

function formatBookingCardTime(booking) {
  if (!booking.checkInTarget || !booking.checkOutTarget) return ''
  const checkOut = new Date(booking.checkOutTarget)
  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return `${formatClockTime(booking.checkInTarget)} - ${formatClockTime(booking.checkOutTarget)} ${weekdayLabels[checkOut.getDay()]}`
}

function toDateTimeLocalValue(date = new Date()) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hour = String(value.getHours()).padStart(2, '0')
  const minute = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function defaultCheckInValue() {
  const now = new Date()
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
  return toDateTimeLocalValue(now)
}

function defaultCheckOutValue(checkInValue) {
  const date = new Date(checkInValue)
  date.setDate(date.getDate() + 1)
  date.setHours(12, 0, 0, 0)
  return toDateTimeLocalValue(date)
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Check in thành công',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] || status || 'Chưa rõ'
}

function bookingStatusClass(status) {
  const normalized = normalizeStatus(status)
  if (normalized === 'CANCELLED') return 'abk-booking abk-booking--cancelled'
  if (normalized === 'COMPLETED') return 'abk-booking abk-booking--completed'
  if (normalized === 'PENDING') return 'abk-booking abk-booking--pending'
  if (normalized === 'CHECKED_IN') return 'abk-booking abk-booking--active'
  return 'abk-booking'
}

function overlapsDay(booking, day) {
  const start = new Date(booking.checkInTarget)
  const end = new Date(booking.checkOutTarget)
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = addDays(dayStart, 1)
  return start < dayEnd && end > dayStart
}

function isCheckInDay(booking, day) {
  if (!booking.checkInTarget) return false
  return toDateKey(new Date(booking.checkInTarget)) === toDateKey(day)
}

function roomMatchesSearch(room, bookings, keyword) {
  if (!keyword) return true
  const roomText = `${room.roomNumber || ''} ${room.roomTypeName || ''}`.toLowerCase()
  if (roomText.includes(keyword)) return true
  return bookings.some(booking =>
    booking.roomId === room.id &&
    `${booking.customerName || ''} ${booking.customerPhone || ''} ${booking.bookingId || ''} ${booking.bookingCode || ''}`.toLowerCase().includes(keyword)
  )
}

function serviceTypeLabel(type) {
  if (type === 'FACILITY') return 'Tiện ích'
  if (type === 'INVENTORY') return 'Thuê đồ'
  if (type === 'MINI_BAR') return 'Mini-bar'
  return 'Dịch vụ'
}

function paymentStatusLabel(status) {
  if (status === 'SUCCESS') return 'Thành công'
  if (status === 'FAILED') return 'Thất bại'
  return 'Đang chờ'
}

function sumMoney(items, selector) {
  return (items || []).reduce((total, item) => total + Number(selector(item) || 0), 0)
}

function invoiceTotals(detail) {
  const roomCharge = Number(detail?.invoice?.roomCharge ?? detail?.finalRoomAmount ?? detail?.priceAtBooking ?? 0)
  const serviceCharge = Number(detail?.invoice?.serviceCharge ?? sumMoney(detail?.serviceItems, item => item.totalPrice))
  const penaltyCharge = Number(detail?.invoice?.penaltyCharge ?? (
    sumMoney(detail?.penaltyItems, item => item.amount) +
    sumMoney(detail?.checkInRecords, record => Number(record.earlyCheckInFee || 0) + Number(record.lateCheckOutFee || 0))
  ))
  const totalAmount = Number(detail?.invoice?.totalAmount ?? (roomCharge + serviceCharge + penaltyCharge))
  const paidAmount = Number(detail?.paidAmount || 0)
  return {
    roomCharge,
    serviceCharge,
    penaltyCharge,
    totalAmount,
    paidAmount,
    remainingAmount: Math.max(totalAmount - paidAmount, 0),
  }
}

function hasVoucherDiscount(detail) {
  return Boolean(detail?.voucherCode) || Number(detail?.roomDiscountAmount || 0) > 0
}

function BookingCard({ booking, onOpenDetail }) {
  const totalGuests = Number(booking.numberOfAdults || 0) + Number(booking.numberOfChildren || 0)
  return (
    <article className={bookingStatusClass(booking.detailStatus || booking.bookingStatus)}>
      <div className="abk-booking-main">
        <strong>{booking.customerName || 'Khách hàng'}</strong>
        <span>{bookingDisplay(booking)} · {statusLabel(booking.detailStatus || booking.bookingStatus)}</span>
      </div>
      <div className="abk-booking-meta">
        <span>{formatBookingCardTime(booking)}</span>
        <span>{totalGuests} khách · {booking.rentType}</span>
      </div>
      <button type="button" className="abk-detail-link" onClick={() => onOpenDetail(booking.bookingDetailId)}>
        Chi tiết
      </button>
    </article>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="abk-detail-field">
      <span>{label}</span>
      <strong>{value || 'Chưa có'}</strong>
    </div>
  )
}

function AddRow({ title, children, onSubmit, disabled }) {
  return (
    <form className="abk-add-row" onSubmit={onSubmit}>
      <span>{title}</span>
      {children}
      <button type="submit" disabled={disabled} aria-label={title}>+</button>
    </form>
  )
}

function InvoicePreviewModal({ detail, onClose }) {
  const totals = invoiceTotals(detail)
  const selectedServices = detail?.serviceItems?.filter(item => item.type !== 'MINI_BAR') || []
  const selectedMiniBars = detail?.serviceItems?.filter(item => item.type === 'MINI_BAR') || []
  const timeFeeTotal = sumMoney(detail?.checkInRecords, record =>
    Number(record.earlyCheckInFee || 0) + Number(record.lateCheckOutFee || 0)
  )
  const voucherApplied = hasVoucherDiscount(detail)
  const extHours = Number(detail?.extensionHours || 0)
  const totalRoomCharge = Number(detail?.priceAtBooking ?? detail?.roomChargeBeforeDiscount ?? totals.roomCharge)
  const extAmount = Number(detail?.extensionAmount || (extHours > 0 ? (totalRoomCharge > 0 ? Math.round(totalRoomCharge / 20 * extHours) : extHours * 80000) : 0))
  const roomBaseAmount = Math.max(0, (voucherApplied ? totalRoomCharge : totals.roomCharge) - (extHours > 0 ? extAmount : 0))
  const roomVoucherDiscount = Number(detail?.allocatedDiscount || 0)

  return (
    <div className="abk-overlay abk-invoice-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="abk-modal abk-invoice-modal" role="dialog" aria-modal="true">
        <div className="abk-modal-head abk-invoice-head">
          <div>
            <h3>Hóa đơn {detail?.invoice?.id ? `#${detail.invoice.id}` : bookingDisplay(detail)}</h3>
            <p>{bookingDisplay(detail)} · Phòng {detail?.roomNumber || 'chưa gán'} · {detail?.customer?.fullName || 'Khách hàng'}</p>
          </div>
          <button type="button" className="abk-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="abk-modal-body abk-invoice-body">
          <section className="abk-invoice-summary">
            <div>
              <span>Tổng tiền</span>
              <strong>{formatMoney(totals.totalAmount)}</strong>
            </div>
            <div>
              <span>Đã thanh toán trước</span>
              <strong>{formatMoney(totals.paidAmount)}</strong>
            </div>
            {voucherApplied && (
              <div className="abk-invoice-discount">
                <span>Voucher đã giảm</span>
                <strong>-{formatMoney(roomVoucherDiscount)}</strong>
              </div>
            )}
            <div className={totals.remainingAmount > 0 ? 'abk-invoice-due' : 'abk-invoice-paid'}>
              <span>Còn lại</span>
              <strong>{formatMoney(totals.remainingAmount)}</strong>
            </div>
          </section>

          <section className="abk-invoice-section">
            <h4>Thông tin đặt phòng</h4>
            <div className="abk-detail-grid">
              <DetailField label="Khách đặt" value={detail?.customer?.fullName} />
              <DetailField label="Điện thoại" value={detail?.customer?.phone} />
              <DetailField label="Email" value={detail?.customer?.email} />
              <DetailField label="Phòng" value={`${detail?.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'} · ${houseTypeName(detail, 'Chưa phân loại')}`} />
              <DetailField label="Nhận phòng" value={formatAppDateTime(detail?.checkInTarget)} />
              <DetailField label="Trả phòng" value={formatAppDateTime(detail?.checkOutTarget)} />
              <DetailField label="Số khách" value={`${Number(detail?.numberOfAdults || 0)} người lớn · ${Number(detail?.numberOfChildren || 0)} trẻ em`} />
              <DetailField label="Loại thuê" value={detail?.rentType} />
              {extHours > 0 && (
                <DetailField label="Thuê thêm giờ" value={`+${extHours} giờ (+${formatMoney(extAmount)})`} />
              )}
              <DetailField label="Người lập" value={detail?.invoice?.employeeName} />
              {voucherApplied && (
                <>
                  <DetailField label="Voucher" value={detail?.voucherCode || 'Đã áp dụng'} />
                  <DetailField label="Giảm voucher phòng này" value={`-${formatMoney(roomVoucherDiscount)}`} />
                </>
              )}
            </div>
          </section>

          <section className="abk-invoice-section">
            <h4>Người lưu trú ({detail?.guests?.length || 0})</h4>
            {detail?.guests?.length ? (
              <div className="abk-invoice-table">
                <div className="abk-invoice-table-head">
                  <span>Họ tên</span><span>Giấy tờ</span><span>Liên hệ</span><span>Địa chỉ</span>
                </div>
                {detail.guests.map(guest => (
                  <div className="abk-invoice-table-row" key={guest.id}>
                    <span><strong>{guest.fullName}</strong>{guest.primaryGuest ? ' · Đại diện' : ''}</span>
                    <span>{guest.identityDocumentType || 'CCCD'} {guest.identityDocumentNumber || ''}</span>
                    <span>{[guest.phone, guest.email].filter(Boolean).join(' · ') || 'Chưa có'}</span>
                    <span>{guest.address || 'Chưa có'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="abk-empty abk-empty--sm">Chưa có danh sách người lưu trú.</div>
            )}
          </section>

          <section className="abk-invoice-section">
            <h4>Chi tiết tiền phòng và lưu trú</h4>
            <div className="abk-line-list">
              {extHours > 0 ? (
                <>
                  <div className="abk-line-row">
                    <div>
                      <strong>Giá phòng ban đầu</strong>
                      <span>{detail?.rentType || 'Loại thuê'} · {formatAppDateTime(detail?.checkInTarget)}</span>
                    </div>
                    <strong>{formatMoney(roomBaseAmount)}</strong>
                  </div>
                  <div className="abk-line-row" style={{ background: '#f0f9ff', padding: '8px 10px', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0369a1' }}>⏰ Thuê thêm giờ (+{extHours}h)</strong>
                      <span style={{ color: '#0284c7' }}>Gia hạn thời gian trả phòng đến {formatAppDateTime(detail?.checkOutTarget)}</span>
                    </div>
                    <strong style={{ color: '#0284c7' }}>+{formatMoney(extAmount)}</strong>
                  </div>
                </>
              ) : (
                <div className="abk-line-row">
                  <div>
                    <strong>Giá phòng đã đặt</strong>
                    <span>{detail?.rentType || 'Loại thuê'} · {formatAppDateTime(detail?.checkInTarget)} đến {formatAppDateTime(detail?.checkOutTarget)}</span>
                  </div>
                  <strong>{formatMoney(voucherApplied ? roomBaseAmount : totals.roomCharge)}</strong>
                </div>
              )}
              {voucherApplied && (
                <>
                  <div className="abk-line-row abk-line-row--discount">
                    <div>
                      <strong>Voucher {detail?.voucherCode || 'đã áp dụng'}</strong>
                      <span>Giảm trên tiền phòng của phòng này.</span>
                    </div>
                    <strong>-{formatMoney(roomVoucherDiscount)}</strong>
                  </div>
                  <div className="abk-line-row">
                    <div>
                      <strong>Tiền phòng sau giảm</strong>
                      <span>Số tiền phòng dùng để tính hóa đơn.</span>
                    </div>
                    <strong>{formatMoney(totals.roomCharge)}</strong>
                  </div>
                </>
              )}
              {detail?.checkInRecords?.map(record => (
                <div className="abk-line-row" key={record.id}>
                  <div>
                    <strong>Ca lưu trú #{record.id}</strong>
                    <span>Check-in {formatAppDateTime(record.actualCheckIn)} · Check-out {formatAppDateTime(record.actualCheckOut)}</span>
                    <span>Lễ tân: {record.receptionistName || 'Chưa có'} · Housekeeping: {record.housekeepingName || 'Chưa có'}</span>
                  </div>
                  <strong>{formatMoney(Number(record.earlyCheckInFee || 0) + Number(record.lateCheckOutFee || 0))}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="abk-invoice-section">
            <h4>Dịch vụ đã dùng</h4>
            {selectedServices.length || selectedMiniBars.length ? (
              <div className="abk-line-list">
                {[...selectedServices, ...selectedMiniBars].map(item => (
                  <div className="abk-line-row" key={`${item.type}-${item.id}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{serviceTypeLabel(item.type)} · SL {item.quantity} × {formatMoney(item.unitPrice)}</span>
                    </div>
                    <strong>{formatMoney(item.totalPrice)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="abk-empty abk-empty--sm">Chưa ghi nhận dịch vụ.</div>
            )}
          </section>

          <section className="abk-invoice-section">
            <h4>Phụ phí và khoản phạt</h4>
            {detail?.penaltyItems?.length || timeFeeTotal > 0 ? (
              <div className="abk-line-list">
                {timeFeeTotal > 0 && (
                  <div className="abk-line-row">
                    <div>
                      <strong>Phụ phí thời gian lưu trú</strong>
                      <span>Phí nhận phòng sớm/trả phòng muộn từ các ca lưu trú.</span>
                    </div>
                    <strong>{formatMoney(timeFeeTotal)}</strong>
                  </div>
                )}
                {detail.penaltyItems?.map(item => (
                  <div className="abk-line-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description || 'Không có ghi chú'}</span>
                    </div>
                    <strong>{formatMoney(item.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="abk-empty abk-empty--sm">Không có phụ phí hoặc khoản phạt.</div>
            )}
          </section>

          <section className="abk-invoice-section">
            <h4>Thanh toán</h4>
            {detail?.payments?.length ? (
              <div className="abk-line-list">
                {detail.payments.map(payment => (
                  <div className="abk-line-row" key={payment.id}>
                    <div>
                      <strong>{payment.paymentMethod || 'Chưa rõ phương thức'} · {paymentStatusLabel(payment.status)}</strong>
                      <span>{payment.transactionNo || 'Không có mã giao dịch'} · {formatAppDateTime(payment.paymentTime)}</span>
                    </div>
                    <strong>{formatMoney(payment.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="abk-empty abk-empty--sm">Chưa có thanh toán thành công.</div>
            )}
          </section>

          <section className="abk-invoice-total-box">
            {voucherApplied && (
              <>
                <div><span>Tiền phòng gốc</span><strong>{formatMoney(roomBaseAmount)}</strong></div>
                <div><span>Voucher {detail?.voucherCode || ''}</span><strong>-{formatMoney(roomVoucherDiscount)}</strong></div>
              </>
            )}
            <div><span>Tiền phòng</span><strong>{formatMoney(totals.roomCharge)}</strong></div>
            <div><span>Dịch vụ, mini-bar</span><strong>{formatMoney(totals.serviceCharge)}</strong></div>
            <div><span>Phụ phí, phạt</span><strong>{formatMoney(totals.penaltyCharge)}</strong></div>
            <div><span>Tổng tiền</span><strong>{formatMoney(totals.totalAmount)}</strong></div>
            <div><span>Đã thanh toán</span><strong>{formatMoney(totals.paidAmount)}</strong></div>
            <div className="abk-invoice-total-due"><span>Còn lại</span><strong>{formatMoney(totals.remainingAmount)}</strong></div>
          </section>
        </div>
      </div>
    </div>
  )
}

function BookingDetailModal({ detail, loading, error, actionLoading, actionError, onClose, onRefresh, onAction }) {
  const PRICE_API_MODAL = (import.meta.env.VITE_API_URL || '') + '/api/admin/price-config'

  const [stayOpen, setStayOpen]       = useState(false)
  const [editCustomer, setEditCustomer] = useState(false)
  const [editBooking,  setEditBooking]  = useState(false)

  // Form chỉnh sửa khách hàng
  const [custForm, setCustForm] = useState({ fullName: '', phone: '', address: '', dateOfBirth: '' })
  const [custSaving, setCustSaving]   = useState(false)
  const [custError,  setCustError]    = useState('')

  // Form chỉnh sửa thông tin đặt phòng
  const [bookForm, setBookForm] = useState({
    checkInTarget: '', checkOutTarget: '', numberOfAdults: 1, numberOfChildren: 0, pricePolicyId: '',
  })
  const [pricePolicies, setPricePolicies] = useState([])
  const [bookSaving, setBookSaving] = useState(false)
  const [bookError,  setBookError]  = useState('')

  const [serviceForm, setServiceForm] = useState({ type: 'FACILITY', serviceId: '', quantity: 1 })
  const [miniBarForm, setMiniBarForm] = useState({ itemId: '', quantity: 1 })
  const [penaltyForm, setPenaltyForm] = useState({ rulesPenaltyId: '', amount: '', description: '' })
  const [checkoutPayment, setCheckoutPayment] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [housekeepingLoading, setHousekeepingLoading] = useState(false)
  const [housekeepingNotice, setHousekeepingNotice] = useState('')
  const [housekeepingTask, setHousekeepingTask] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoicePreview, setInvoicePreview] = useState(null)

  // Reset khi detail thay đổi
  useEffect(() => {
    setStayOpen(false)
    setEditCustomer(false)
    setEditBooking(false)
    setCustError('')
    setBookError('')
    setServiceForm({ type: 'FACILITY', serviceId: '', quantity: 1 })
    setMiniBarForm({ itemId: '', quantity: 1 })
    setPenaltyForm({ rulesPenaltyId: '', amount: '', description: '' })
    setHousekeepingNotice('')
    setHousekeepingTask(null)
    setInvoicePreview(null)
  }, [detail?.bookingDetailId])

  useEffect(() => {
    if (!detail?.bookingDetailId || !detail?.checkInRecords?.length) return undefined
    let active = true
    const loadHousekeepingTask = () => {
      fetch(`${HOUSEKEEPING_API}/booking-details/${detail.bookingDetailId}`, { headers: authHeaders() })
        .then(async response => ({ ok: response.ok, data: await response.json().catch(() => ({})) }))
        .then(({ ok, data }) => {
          if (active) setHousekeepingTask(ok ? data : null)
        })
        .catch(() => { if (active) setHousekeepingTask(null) })
    }
    loadHousekeepingTask()
    const refreshTimer = window.setInterval(loadHousekeepingTask, 10_000)
    return () => {
      active = false
      window.clearInterval(refreshTimer)
    }
  }, [detail?.bookingDetailId, detail?.checkInRecords?.length])

  // Khi mở form sửa khách → pre-fill
  useEffect(() => {
    if (editCustomer && detail?.customer) {
      setCustForm({
        fullName:    detail.customer.fullName    || '',
        phone:       detail.customer.phone       || '',
        address:     detail.customer.address     || '',
        dateOfBirth: detail.customer.dateOfBirth || '',
      })
      setCustError('')
    }
  }, [editCustomer, detail?.customer])

  // Khi mở form sửa booking → pre-fill + load gói thuê
  useEffect(() => {
    if (editBooking && detail) {
      setBookForm({
        checkInTarget:    detail.checkInTarget  ? toDateTimeLocalValue(new Date(detail.checkInTarget))  : '',
        checkOutTarget:   detail.checkOutTarget ? toDateTimeLocalValue(new Date(detail.checkOutTarget)) : '',
        numberOfAdults:   detail.numberOfAdults   ?? 1,
        numberOfChildren: detail.numberOfChildren ?? 0,
        pricePolicyId: '',
      })
      setBookError('')
      // Load gói thuê để người dùng có thể đổi (optional)
      fetch(`${PRICE_API_MODAL}/policies`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setPricePolicies(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
  }, [editBooking, detail])

  const hasCheckIn  = Boolean(detail?.checkInRecords?.length)
  const hasCheckOut = detail?.checkInRecords?.some(r => r.actualCheckOut)
  const canEdit     = detail && !hasCheckIn && !['CANCELLED', 'COMPLETED'].includes(String(detail.bookingStatus).toUpperCase())
  const canCheckIn  = canEdit
  const canCheckOut = detail && hasCheckIn && !hasCheckOut
  const inspectionComplete = Boolean(
    detail?.housekeepingInspectionCompleted || housekeepingTask?.inspectionStatus === 'COMPLETED'
  )
  const extHours = Number(detail?.extensionHours || 0)
  const totalRoomCharge = Number(detail?.priceAtBooking ?? detail?.roomChargeBeforeDiscount ?? 0)
  const extAmount = Number(detail?.extensionAmount || (extHours > 0 ? (totalRoomCharge > 0 ? Math.round(totalRoomCharge / 20 * extHours) : extHours * 80000) : 0))
  const services    = serviceForm.type === 'FACILITY' ? detail?.facilityServices || [] : detail?.inventoryServices || []
  const selectedServices = detail?.serviceItems?.filter(item => item.type !== 'MINI_BAR') || []
  const selectedMiniBars = detail?.serviceItems?.filter(item => item.type === 'MINI_BAR') || []

  // ── Lưu chỉnh sửa khách hàng ──
  const saveCustomer = (e) => {
    e.preventDefault()
    setCustSaving(true); setCustError('')
    fetch(`${API_BASE}/details/${detail.bookingDetailId}/customer`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        fullName:    custForm.fullName,
        phone:       custForm.phone,
        address:     custForm.address || null,
        dateOfBirth: custForm.dateOfBirth || null,
      }),
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.message || 'Lỗi khi lưu')
        onAction('__refresh__', null, d)   // truyền data mới lên parent
        setEditCustomer(false)
      })
      .catch(err => setCustError(err.message))
      .finally(() => setCustSaving(false))
  }

  // ── Lưu chỉnh sửa thông tin đặt phòng ──
  const saveBooking = (e) => {
    e.preventDefault()
    setBookSaving(true); setBookError('')
    fetch(`${API_BASE}/details/${detail.bookingDetailId}/booking-info`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        checkInTarget:    bookForm.checkInTarget,
        checkOutTarget:   bookForm.checkOutTarget,
        numberOfAdults:   Number(bookForm.numberOfAdults),
        numberOfChildren: Number(bookForm.numberOfChildren),
        pricePolicyId:    bookForm.pricePolicyId ? Number(bookForm.pricePolicyId) : null,
      }),
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.message || 'Lỗi khi lưu')
        onAction('__refresh__', null, d)
        setEditBooking(false)
      })
      .catch(err => setBookError(err.message))
      .finally(() => setBookSaving(false))
  }

  const submitService = (e) => {
    e.preventDefault()
    onAction('services', { type: serviceForm.type, serviceId: Number(serviceForm.serviceId), quantity: Number(serviceForm.quantity) })
  }
  const submitMiniBar = (e) => {
    e.preventDefault()
    onAction('mini-bar', { itemId: Number(miniBarForm.itemId), quantity: Number(miniBarForm.quantity) })
  }
  const submitPenalty = (e) => {
    e.preventDefault()
    onAction('penalties', { rulesPenaltyId: Number(penaltyForm.rulesPenaltyId), amount: Number(penaltyForm.amount), description: penaltyForm.description })
  }

  const removeCharge = (path, label) => {
    if (window.confirm(`Xóa ${label} khỏi ca lưu trú này?`)) {
      onAction(path, null, undefined, 'DELETE')
    }
  }

  const prepareCheckOut = () => {
    setCheckoutLoading(true)
    setCheckoutPayment(null)
    fetch(`${API_BASE}/details/${detail.bookingDetailId}/prepare-check-out`, {
      method: 'POST',
      headers: authHeaders(),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể chuẩn bị checkout')
        return data
      })
      .then((data) => {
        onAction('__refresh__', null, data.booking)
        if (!data.completed) setCheckoutPayment(data.payment)
      })
      .catch((err) => onAction('__error__', null, err.message))
      .finally(() => setCheckoutLoading(false))
  }

  const requestHousekeeping = () => {
    setHousekeepingLoading(true)
    setHousekeepingNotice('')
    fetch(`${HOUSEKEEPING_API}/booking-details/${detail.bookingDetailId}/request`, {
      method: 'POST',
      headers: authHeaders(),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể gửi yêu cầu kiểm tra phòng')
        return data
      })
      .then(data => {
        setHousekeepingTask(data)
        setHousekeepingNotice('Đã gửi yêu cầu kiểm tra phòng cho housekeeping.')
      })
      .catch(err => onAction('__error__', null, err.message))
      .finally(() => setHousekeepingLoading(false))
  }

  const generateInvoicePreview = () => {
    if (!detail?.bookingDetailId) return
    setInvoiceLoading(true)
    fetch(`${API_BASE}/details/${detail.bookingDetailId}/invoice`, {
      method: 'POST',
      headers: authHeaders(),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tạo hóa đơn')
        return data
      })
      .then(data => {
        onAction('__refresh__', null, data)
        setInvoicePreview(data)
      })
      .catch(err => onAction('__error__', null, err.message))
      .finally(() => setInvoiceLoading(false))
  }

  return (
    <>
      <div className="abk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="abk-modal">
        <div className="abk-modal-head">
          <div>
            <h3>Chi tiết đơn đặt phòng</h3>
            <p>{detail ? `Booking ${bookingDisplay(detail)} · ${detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'}` : 'Đang tải thông tin...'}</p>
          </div>
          <button type="button" className="abk-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="abk-modal-body">
          {loading ? (
            <div className="abk-empty">Đang tải chi tiết...</div>
          ) : error ? (
            <div className="abk-empty abk-empty--error">{error}</div>
          ) : detail ? (
            <>
              {/* ── Thanh hành động trên cùng ── */}
              <div className="abk-modal-actions">
                <span className={`abk-status-pill abk-status-pill--${String(detail.bookingStatus || '').toLowerCase()}`}>
                  {statusLabel(detail.bookingStatus)}
                </span>
                <div>
                  {canCheckIn && (
                    <button
                      type="button"
                      className="abk-action-primary"
                      disabled={actionLoading}
                      onClick={() => window.location.assign(`/admin/check-in-logs?bookingDetailId=${detail.bookingDetailId}`)}
                    >
                      Check in
                    </button>
                  )}
                  {canCheckOut && (
                    <button
                      type="button"
                      className="abk-action-secondary"
                      disabled={actionLoading || housekeepingLoading || Boolean(housekeepingTask)}
                      onClick={requestHousekeeping}
                    >
                      {housekeepingLoading ? 'Đang gửi...' : housekeepingTask ? 'Đã yêu cầu kiểm tra' : 'Yêu cầu kiểm tra phòng'}
                    </button>
                  )}
                  {canCheckOut && (
                    <button
                      type="button"
                      className="abk-action-primary"
                      disabled={actionLoading || checkoutLoading || !inspectionComplete}
                      title={!inspectionComplete ? 'Chờ housekeeping gửi chi phí kiểm tra phòng' : undefined}
                      onClick={prepareCheckOut}
                    >
                      {checkoutLoading ? 'Đang kiểm tra...' : 'Check out'}
                    </button>
                  )}
                  <button type="button" className="abk-action-secondary" onClick={() => setStayOpen(v => !v)}>
                    Lưu trú
                  </button>
                </div>
              </div>
              {actionError && <div className="abk-inline-error">{actionError}</div>}
              {housekeepingNotice && <div className="abk-inline-success">{housekeepingNotice}</div>}

              {/* ══════════════════════════════════════════
                  THÔNG TIN KHÁCH HÀNG
              ══════════════════════════════════════════ */}
              <section className="abk-detail-section">
                <div className="abk-section-head">
                  <h4>Thông tin khách hàng</h4>
                  {canEdit && !editCustomer && (
                    <button type="button" className="abk-edit-btn" onClick={() => { setEditCustomer(true); setEditBooking(false) }}>
                      ✏️ Chỉnh sửa
                    </button>
                  )}
                  {editCustomer && (
                    <button type="button" className="abk-edit-btn abk-edit-btn--cancel" onClick={() => setEditCustomer(false)}>
                      Huỷ
                    </button>
                  )}
                </div>

                {!editCustomer ? (
                  <div className="abk-detail-grid">
                    <DetailField label="Họ tên"       value={detail.customer?.fullName} />
                    <DetailField label="Điện thoại"   value={detail.customer?.phone} />
                    <DetailField label="Email"         value={detail.customer?.email} />
                    <DetailField label="Địa chỉ"      value={detail.customer?.address} />
                    <DetailField label="Ngày sinh"     value={detail.customer?.dateOfBirth ? new Date(detail.customer.dateOfBirth).toLocaleDateString('vi-VN') : ''} />
                    <DetailField label="Mã KH"         value={detail.customer?.id ? `#${detail.customer.id}` : ''} />
                  </div>
                ) : (
                  <form className="abk-edit-form" onSubmit={saveCustomer}>
                    <div className="abk-edit-grid">
                      <label className="abk-edit-field">
                        <span>Họ tên <em>*</em></span>
                        <input required maxLength={100} value={custForm.fullName}
                          onChange={e => setCustForm(f => ({ ...f, fullName: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field">
                        <span>Điện thoại <em>*</em></span>
                        <input required maxLength={10} value={custForm.phone}
                          onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field abk-edit-field--wide">
                        <span>Địa chỉ</span>
                        <input maxLength={255} value={custForm.address}
                          onChange={e => setCustForm(f => ({ ...f, address: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field">
                        <span>Ngày sinh</span>
                        <input type="date" value={custForm.dateOfBirth}
                          onChange={e => setCustForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                      </label>
                    </div>
                    {custError && <p className="abk-edit-error">{custError}</p>}
                    <div className="abk-edit-actions">
                      <button type="button" className="abk-action-secondary" onClick={() => setEditCustomer(false)}>Huỷ</button>
                      <button type="submit" className="abk-action-primary" disabled={custSaving}>
                        {custSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* ══════════════════════════════════════════
                  THÔNG TIN ĐẶT PHÒNG
              ══════════════════════════════════════════ */}
              <section className="abk-detail-section">
                <div className="abk-section-head">
                  <h4>Thông tin đặt phòng</h4>
                  {canEdit && !editBooking && (
                    <button type="button" className="abk-edit-btn" onClick={() => { setEditBooking(true); setEditCustomer(false) }}>
                      ✏️ Chỉnh sửa
                    </button>
                  )}
                  {editBooking && (
                    <button type="button" className="abk-edit-btn abk-edit-btn--cancel" onClick={() => setEditBooking(false)}>
                      Huỷ
                    </button>
                  )}
                </div>

                {!editBooking ? (
                  <>
                    {extHours > 0 && (
                      <div className="abk-extension-callout" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0369a1' }}>
                        <div>
                          <strong style={{ fontSize: '14px' }}>⏰ Khách đã thuê thêm {extHours} giờ lưu trú</strong>
                          <div style={{ fontSize: '13px', marginTop: '2px', color: '#0284c7' }}>
                            Phụ phí thuê thêm: <b>+{formatMoney(extAmount)}</b> · Giờ trả phòng gia hạn: <b>{formatAppDateTime(detail.checkOutTarget)}</b>
                          </div>
                        </div>
                        <span style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                          +{extHours}h
                        </span>
                      </div>
                    )}
                    <div className="abk-detail-grid">
                      <DetailField label="Phòng"            value={`${detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'} · ${houseTypeName(detail, 'Chưa phân loại')}`} />
                      <DetailField label="Ngày đặt"         value={formatAppDateTime(detail.bookingDate)} />
                      <DetailField label="Nhận phòng"       value={formatAppDateTime(detail.checkInTarget)} />
                      <DetailField label="Trả phòng"        value={formatAppDateTime(detail.checkOutTarget)} />
                      <DetailField label="Người lớn"        value={detail.numberOfAdults} />
                      <DetailField label="Trẻ em"           value={detail.numberOfChildren} />
                      <DetailField label="Loại thuê"        value={detail.rentType} />
                      {extHours > 0 && (
                        <>
                          <DetailField label="Thuê thêm giờ" value={`+${extHours} giờ`} />
                          <DetailField label="Tiền thuê thêm" value={`+${formatMoney(extAmount)}`} />
                        </>
                      )}
                      <DetailField label="Trạng thái"       value={statusLabel(detail.bookingStatus)} />
                      <DetailField label="Giá lúc đặt"      value={formatMoney(detail.priceAtBooking)} />
                      {hasVoucherDiscount(detail) && (
                        <>
                          <DetailField label="Voucher" value={detail.voucherCode || 'Đã áp dụng'} />
                          <DetailField label="Tổng giảm voucher" value={`-${formatMoney(detail.roomDiscountAmount)}`} />
                          <DetailField label="Giảm cho phòng này" value={`-${formatMoney(detail.allocatedDiscount)}`} />
                          <DetailField label="Tiền phòng sau giảm" value={formatMoney(detail.finalRoomAmount)} />
                        </>
                      )}
                      <DetailField label="Khách xác nhận" value={detail.customerConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'} />
                      <DetailField label="Đã thanh toán"    value={formatMoney(detail.paidAmount)} />
                    </div>
                    <div className={`abk-customer-feedback${detail.customerFeedback ? '' : ' abk-customer-feedback--empty'}`}>
                      <span>Phản hồi của khách hàng</span>
                      <strong>{detail.customerFeedback || 'Chưa có phản hồi'}</strong>
                      {detail.customerFeedbackAt && <small>Gửi lúc {formatAppDateTime(detail.customerFeedbackAt)}</small>}
                    </div>
                  </>
                ) : (
                  <form className="abk-edit-form" onSubmit={saveBooking}>
                    <div className="abk-edit-grid">
                      <label className="abk-edit-field">
                        <span>Nhận phòng dự kiến <em>*</em></span>
                        <input required type="datetime-local" value={bookForm.checkInTarget}
                          onChange={e => setBookForm(f => ({ ...f, checkInTarget: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field">
                        <span>Trả phòng dự kiến <em>*</em></span>
                        <input required type="datetime-local" value={bookForm.checkOutTarget}
                          onChange={e => setBookForm(f => ({ ...f, checkOutTarget: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field">
                        <span>Số người lớn <em>*</em></span>
                        <input required type="number" min={1} value={bookForm.numberOfAdults}
                          onChange={e => setBookForm(f => ({ ...f, numberOfAdults: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field">
                        <span>Số trẻ em <em>*</em></span>
                        <input required type="number" min={0} value={bookForm.numberOfChildren}
                          onChange={e => setBookForm(f => ({ ...f, numberOfChildren: e.target.value }))} />
                      </label>
                      <label className="abk-edit-field abk-edit-field--wide">
                        <span>Đổi gói thuê <small>(để trống = giữ nguyên giá cũ)</small></span>
                        <select value={bookForm.pricePolicyId}
                          onChange={e => setBookForm(f => ({ ...f, pricePolicyId: e.target.value }))}>
                          <option value="">— Giữ nguyên gói hiện tại ({detail.rentType}) —</option>
                          {pricePolicies.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.policyName}{p.limitHours ? ` · ${p.limitHours}h` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="abk-edit-hint">
                      ℹ️ Giá sẽ được tính lại theo gói thuê và ngày check-in mới nếu bạn đổi gói.
                    </div>
                    {bookError && <p className="abk-edit-error">{bookError}</p>}
                    <div className="abk-edit-actions">
                      <button type="button" className="abk-action-secondary" onClick={() => setEditBooking(false)}>Huỷ</button>
                      <button type="submit" className="abk-action-primary" disabled={bookSaving}>
                        {bookSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {detail.guests?.length ? (
                <section className="abk-detail-section">
                  <div className="abk-section-head">
                    <h4>Người lưu trú ({detail.guests.length})</h4>
                  </div>
                  <div className="abk-guest-list">
                    {detail.guests.map(guest => (
                      <article className="abk-guest-card" key={guest.id}>
                        <div>
                          <strong>{guest.fullName}</strong>
                          {guest.primaryGuest && <span>Đại diện</span>}
                        </div>
                        <p>{guest.identityDocumentType || 'CCCD'}: {guest.identityDocumentNumber}</p>
                        <p>{guest.dateOfBirth ? `Ngày sinh ${new Date(guest.dateOfBirth).toLocaleDateString('vi-VN')}` : 'Chưa có ngày sinh'}</p>
                        <p>{[guest.phone, guest.email].filter(Boolean).join(' · ') || 'Chưa có thông tin liên hệ'}</p>
                        {guest.address && <p>{guest.address}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {stayOpen && (
                <section className="abk-stay-panel">
                  <div className="abk-stay-head">
                    <h4>Lưu trú, dịch vụ, phụ phí, hóa đơn</h4>
                    <button type="button" onClick={onRefresh}>Làm mới</button>
                  </div>

                  <div className="abk-stay-block">
                    <h5>Lưu trú thực tế</h5>
                    {detail.checkInRecords?.length ? (
                      <div className="abk-line-list">
                        {detail.checkInRecords.map(record => (
                          <div className="abk-line-row" key={record.id}>
                            <div>
                              <strong>Ca lưu trú #{record.id}</strong>
                              <span>Check-in {formatAppDateTime(record.actualCheckIn)} · Check-out {formatAppDateTime(record.actualCheckOut)}</span>
                              <span>Lễ tân: {record.receptionistName || 'Chưa có'} · Phòng {detail.roomNumber}</span>
                            </div>
                            <strong>{formatMoney(Number(record.earlyCheckInFee || 0) + Number(record.lateCheckOutFee || 0))}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Chưa check-in.</div>
                    )}
                  </div>

                  <div className="abk-stay-block">
                    <h5>Dịch vụ</h5>
                    <AddRow title="Thêm dịch vụ" onSubmit={submitService} disabled={actionLoading || !serviceForm.serviceId}>
                      <select value={serviceForm.type} onChange={e => setServiceForm({ ...serviceForm, type: e.target.value, serviceId: '' })}>
                        <option value="FACILITY">Tiện ích</option>
                        <option value="INVENTORY">Thuê đồ</option>
                      </select>
                      <select value={serviceForm.serviceId} onChange={e => setServiceForm({ ...serviceForm, serviceId: e.target.value })}>
                        <option value="">Chọn dịch vụ</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>{service.name} · {formatMoney(service.price)}</option>
                        ))}
                      </select>
                      <input type="number" min="1" value={serviceForm.quantity} onChange={e => setServiceForm({ ...serviceForm, quantity: e.target.value })} />
                    </AddRow>
                    {selectedServices.length ? (
                      <div className="abk-line-list">
                        {selectedServices.map(item => (
                          <div className="abk-line-row" key={`${item.type}-${item.id}`}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>{serviceTypeLabel(item.type)} · SL {item.quantity} × {formatMoney(item.unitPrice)}</span>
                            </div>
                            <div className="abk-line-actions">
                              <strong>{formatMoney(item.totalPrice)}</strong>
                              {Number(item.id) > 0 && (
                                <button
                                  type="button"
                                  className="abk-remove-line"
                                  disabled={actionLoading || hasCheckOut}
                                  aria-label={`Xóa ${item.name}`}
                                  title={`Xóa ${item.name}`}
                                  onClick={() => removeCharge(`services/${item.id}`, item.name)}
                                >×</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Chưa ghi nhận dịch vụ.</div>
                    )}
                  </div>

                  <div className="abk-stay-block">
                    <h5>Mini-bar</h5>
                    <AddRow title="Thêm mini-bar" onSubmit={submitMiniBar} disabled={actionLoading || !miniBarForm.itemId}>
                      <select value={miniBarForm.itemId} onChange={e => setMiniBarForm({ ...miniBarForm, itemId: e.target.value })}>
                        <option value="">Chọn mini-bar</option>
                        {detail.miniBarItems?.map(item => (
                          <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.price)}</option>
                        ))}
                      </select>
                      <input type="number" min="1" value={miniBarForm.quantity} onChange={e => setMiniBarForm({ ...miniBarForm, quantity: e.target.value })} />
                    </AddRow>
                    {selectedMiniBars.length ? (
                      <div className="abk-line-list">
                        {selectedMiniBars.map(item => (
                          <div className="abk-line-row" key={`MINI_BAR-${item.id}`}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>Mini-bar · SL {item.quantity} × {formatMoney(item.unitPrice)}</span>
                            </div>
                            <div className="abk-line-actions">
                              <strong>{formatMoney(item.totalPrice)}</strong>
                              <button
                                type="button"
                                className="abk-remove-line"
                                disabled={actionLoading || hasCheckOut}
                                aria-label={`Xóa ${item.name}`}
                                title={`Xóa ${item.name}`}
                                onClick={() => removeCharge(`mini-bar/${item.id}`, item.name)}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Chưa ghi nhận mini-bar.</div>
                    )}
                  </div>

                  <div className="abk-stay-block">
                    <h5>Phụ phí, khoản phạt</h5>
                    <AddRow title="Thêm khoản phạt" onSubmit={submitPenalty} disabled={actionLoading || !penaltyForm.rulesPenaltyId || !penaltyForm.amount}>
                      <select value={penaltyForm.rulesPenaltyId} onChange={e => setPenaltyForm({ ...penaltyForm, rulesPenaltyId: e.target.value })}>
                        <option value="">Chọn khoản phạt</option>
                        {detail.penaltyRules?.map(rule => (
                          <option key={rule.id} value={rule.id}>{rule.title} · {formatMoney(rule.penaltyAmount)}</option>
                        ))}
                      </select>
                      <input type="number" min="1" placeholder="Số tiền" value={penaltyForm.amount} onChange={e => setPenaltyForm({ ...penaltyForm, amount: e.target.value })} />
                      <input placeholder="Ghi chú" value={penaltyForm.description} onChange={e => setPenaltyForm({ ...penaltyForm, description: e.target.value })} />
                    </AddRow>
                    {detail.penaltyItems?.length ? (
                      <div className="abk-line-list">
                        {detail.penaltyItems.map(item => (
                          <div className="abk-line-row" key={item.id}>
                            <div>
                              <strong>{item.title}</strong>
                              <span>{item.description || 'Không có ghi chú'}</span>
                            </div>
                            <div className="abk-line-actions">
                              <strong>{formatMoney(item.amount)}</strong>
                              <button
                                type="button"
                                className="abk-remove-line"
                                disabled={actionLoading || hasCheckOut}
                                aria-label={`Xóa ${item.title}`}
                                title={`Xóa ${item.title}`}
                                onClick={() => removeCharge(`penalties/${item.id}`, item.title)}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Chưa có khoản phạt.</div>
                    )}
                  </div>

                  <div className="abk-stay-block">
                    <div className="abk-block-title-row">
                      <h5>Hóa đơn và thanh toán</h5>
                      <button type="button" disabled={actionLoading || invoiceLoading} onClick={generateInvoicePreview}>
                        {invoiceLoading ? 'Đang tạo...' : 'Generate hóa đơn'}
                      </button>
                    </div>
                    {detail.invoice ? (
                      <>
                        <div className="abk-detail-grid">
                          <DetailField label="Mã hóa đơn" value={`#${detail.invoice.id}`} />
                          {hasVoucherDiscount(detail) && (
                            <>
                              <DetailField label="Tiền phòng gốc" value={formatMoney(detail.priceAtBooking)} />
                              <DetailField label="Giảm voucher phòng này" value={`-${formatMoney(detail.allocatedDiscount)}`} />
                            </>
                          )}
                          <DetailField label="Tiền phòng" value={formatMoney(detail.invoice.roomCharge)} />
                          <DetailField label="Dịch vụ" value={formatMoney(detail.invoice.serviceCharge)} />
                          <DetailField label="Phạt" value={formatMoney(detail.invoice.penaltyCharge)} />
                          <DetailField label="Tổng tiền" value={formatMoney(detail.invoice.totalAmount)} />
                          <DetailField label="Người lập" value={detail.invoice.employeeName} />
                        </div>
                        {detail.payments?.length ? (
                          <div className="abk-line-list abk-line-list--mt">
                            {detail.payments.map(payment => (
                              <div className="abk-line-row" key={payment.id}>
                                <div>
                                  <strong>{payment.paymentMethod || 'Chưa rõ phương thức'}</strong>
                                  <span>{payment.transactionNo || 'Không có mã giao dịch'} · {formatAppDateTime(payment.paymentTime)}</span>
                                </div>
                                <strong>{formatMoney(payment.amount)} · {paymentStatusLabel(payment.status)}</strong>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="abk-empty abk-empty--sm">Chưa lập hóa đơn cho booking này.</div>
                    )}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
        </div>
      </div>
      {invoicePreview && (
        <InvoicePreviewModal
          detail={invoicePreview}
          onClose={() => setInvoicePreview(null)}
        />
      )}
      {checkoutPayment && (
        <SePayQrPayment
          payment={checkoutPayment}
          statusUrl={`${API_BASE}/details/${detail.bookingDetailId}`}
          headers={authHeaders()}
          statusField="bookingStatus"
          successStatus="COMPLETED"
          title="Thanh toán số tiền còn lại tại quầy"
          onSuccess={(booking) => onAction('__refresh__', null, booking)}
          onClose={() => setCheckoutPayment(null)}
        />
      )}
    </>
  )
}

function DirectBookingModal({ onClose, onCreated }) {
  const PRICE_API = (import.meta.env.VITE_API_URL || '') + '/api/admin/price-config'

  const initialCheckIn = defaultCheckInValue()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    identityDocumentNumber: '',
    checkInTarget: initialCheckIn,
    checkOutTarget: defaultCheckOutValue(initialCheckIn),
    pricePolicyId: '',   // ID gói thuê đã chọn
    selectedRooms: {},
  })

  // Danh sách gói thuê từ price_policies
  const [pricePolicies, setPricePolicies] = useState([])
  // Tất cả cấu hình giá (room_price_configs) — dùng để hiển thị preview giá
  const [priceConfigs, setPriceConfigs] = useState([])
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentResult, setPaymentResult] = useState(null)
  const [serviceCatalog, setServiceCatalog] = useState({ facility: [], inventory: [] })
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicePickerRoomId, setServicePickerRoomId] = useState(null)

  // Load gói thuê + toàn bộ config giá một lần khi mở modal
  useEffect(() => {
    Promise.all([
      fetch(`${PRICE_API}/policies`, { headers: authHeaders() }),
      fetch(`${PRICE_API}/configs`,  { headers: authHeaders() }),
    ])
      .then(async ([ppRes, pcRes]) => {
        const [pp, pc] = await Promise.all([ppRes.json(), pcRes.json()])
        const policies = Array.isArray(pp) ? pp : []
        setPricePolicies(policies)
        setPriceConfigs(Array.isArray(pc) ? pc : [])
        // Tự động chọn gói đầu tiên
        if (policies.length > 0) {
          setForm(f => ({ ...f, pricePolicyId: String(policies[0].id) }))
        }
      })
      .catch(() => {}) // non-critical
  }, [])

  useEffect(() => {
    setServicesLoading(true)
    Promise.all([
      fetch(`${ADMIN_SERVICE_API}/facility`, { headers: authHeaders() }),
      fetch(`${ADMIN_SERVICE_API}/inventory`, { headers: authHeaders() }),
    ])
      .then(async ([facilityRes, inventoryRes]) => {
        const [facility, inventory] = await Promise.all([
          facilityRes.json().catch(() => []),
          inventoryRes.json().catch(() => []),
        ])
        if (!facilityRes.ok || !inventoryRes.ok) throw new Error('Không tải được danh sách dịch vụ')
        setServiceCatalog({
          facility: Array.isArray(facility) ? facility : [],
          inventory: Array.isArray(inventory) ? inventory : [],
        })
      })
      .catch(err => setError(err.message || 'Không tải được danh sách dịch vụ'))
      .finally(() => setServicesLoading(false))
  }, [])

  const selectedRoomEntries = Object.values(form.selectedRooms)
  const selectedRoomIds = new Set(selectedRoomEntries.map(r => String(r.roomId)))
  const serviceOptions = useMemo(() => [
    ...serviceCatalog.facility
      .filter(service => service.isActive !== false)
      .map(service => ({ ...service, type: 'FACILITY', stock: null })),
    ...serviceCatalog.inventory
      .filter(service => Number(service.quantityInStock || 0) > 0)
      .map(service => ({ ...service, type: 'INVENTORY', stock: Number(service.quantityInStock || 0) })),
  ], [serviceCatalog])
  const servicePickerRoom = servicePickerRoomId ? form.selectedRooms[String(servicePickerRoomId)] : null

  // Tính ngày check-in là WEEKDAY hay WEEKEND
  const isWeekend = useMemo(() => {
    if (!form.checkInTarget) return false
    const d = new Date(form.checkInTarget).getDay() // 0=CN, 6=T7
    return d === 0 || d === 6
  }, [form.checkInTarget])

  // Tìm giá cho một loại nhà theo gói thuê và day_type đang chọn
  const getPriceForRoomType = (roomTypeId) => {
    if (!form.pricePolicyId || !roomTypeId) return null
    const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY'
    const cfg = priceConfigs.find(
      c => c.roomTypeId === roomTypeId &&
           c.pricePolicyId === Number(form.pricePolicyId) &&
           c.dayType === dayType
    )
    return cfg ? cfg.price : null
  }

  const selectedPolicy = pricePolicies.find(p => p.id === Number(form.pricePolicyId))

  // Load phòng mỗi khi checkIn/checkOut thay đổi
  useEffect(() => {
    if (!form.checkInTarget || !form.checkOutTarget) return
    const controller = new AbortController()
    const params = new URLSearchParams({
      checkInTarget: form.checkInTarget,
      checkOutTarget: form.checkOutTarget,
    })
    Promise.resolve().then(() => { setRoomsLoading(true); setError('') })
    fetch(`${API_BASE}/direct/rooms?${params.toString()}`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tải được danh sách phòng')
        return data
      })
      .then(data => {
        const nextRooms = Array.isArray(data) ? data : []
        setRooms(nextRooms)
        // Bỏ ra khỏi selectedRooms những phòng không còn available
        setForm(current => {
          const availableIds = new Set(nextRooms.filter(r => r.available).map(r => String(r.roomId)))
          const selectedRooms = Object.fromEntries(
            Object.entries(current.selectedRooms).filter(([id]) => availableIds.has(id))
          )
          return { ...current, selectedRooms }
        })
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Không tải được danh sách phòng')
      })
      .finally(() => setRoomsLoading(false))
    return () => controller.abort()
  }, [form.checkInTarget, form.checkOutTarget])

  const updateForm = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const updateCheckIn = (value) => {
    setForm(f => ({
      ...f,
      checkInTarget: value,
      checkOutTarget: f.checkOutTarget && new Date(f.checkOutTarget) > new Date(value)
        ? f.checkOutTarget
        : defaultCheckOutValue(value),
      selectedRooms: {},
    }))
  }

  const toggleRoom = (room) => {
    if (!room.available) return
    const key = String(room.roomId)
    setForm(f => {
      const selectedRooms = { ...f.selectedRooms }
      if (selectedRooms[key]) {
        delete selectedRooms[key]
      } else {
        selectedRooms[key] = {
          roomId: room.roomId,
          roomNumber: room.roomNumber,
          roomTypeName: room.roomTypeName,
          roomTypeId: room.roomTypeId,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          depositPolicyName: room.depositPolicyName,
          depositCalculationType: room.depositCalculationType,
          depositPolicyValue: room.depositPolicyValue,
          numberOfAdults: 1,
          numberOfChildren: 0,
          guests: [{
            fullName: f.fullName,
            identityDocumentNumber: f.identityDocumentNumber,
            phone: f.phone,
            dateOfBirth: f.dateOfBirth,
            email: f.email,
            address: f.address,
          }],
          services: [],
        }
      }
      return { ...f, selectedRooms }
    })
  }

  // Fix bug: xóa phòng khỏi selectedRooms bằng key
  const removeRoom = (roomId) => {
    setForm(f => {
      const selectedRooms = { ...f.selectedRooms }
      delete selectedRooms[String(roomId)]
      return { ...f, selectedRooms }
    })
  }

  const updateSelectedRoom = (roomId, field, value) => {
    setForm(f => ({
      ...f,
      selectedRooms: {
        ...f.selectedRooms,
        [String(roomId)]: { ...f.selectedRooms[String(roomId)], [field]: value },
      },
    }))
  }

  const updateGuest = (roomId, guestIndex, field, value) => {
    setForm(f => {
      const room = f.selectedRooms[String(roomId)]
      const guests = room.guests.map((guest, index) => index === guestIndex ? { ...guest, [field]: value } : guest)
      return { ...f, selectedRooms: { ...f.selectedRooms, [String(roomId)]: { ...room, guests } } }
    })
  }

  const addGuest = (roomId) => {
    setForm(f => {
      const room = f.selectedRooms[String(roomId)]
      const guests = [...room.guests, { fullName: '', identityDocumentNumber: '', phone: '', dateOfBirth: '', email: '', address: '' }]
      return { ...f, selectedRooms: { ...f.selectedRooms, [String(roomId)]: { ...room, guests } } }
    })
  }

  const removeGuest = (roomId, guestIndex) => {
    setForm(f => {
      const room = f.selectedRooms[String(roomId)]
      if (room.guests.length === 1) return f
      const guests = room.guests.filter((_, index) => index !== guestIndex)
      return { ...f, selectedRooms: { ...f.selectedRooms, [String(roomId)]: { ...room, guests } } }
    })
  }

  const serviceKey = (service) => `${service.type}:${service.id ?? service.serviceId}`

  const updateRoomServices = (roomId, service, quantityValue) => {
    const quantity = Math.max(0, Number(quantityValue || 0))
    setForm(f => {
      const room = f.selectedRooms[String(roomId)]
      if (!room) return f
      const currentServices = Array.isArray(room.services) ? room.services : []
      const key = serviceKey(service)
      const maxQuantity = service.type === 'INVENTORY' ? Number(service.stock || 0) : 99
      const nextQuantity = Math.min(quantity, maxQuantity)
      const nextServices = nextQuantity <= 0
        ? currentServices.filter(item => serviceKey(item) !== key)
        : [
            ...currentServices.filter(item => serviceKey(item) !== key),
            {
              type: service.type,
              serviceId: Number(service.id ?? service.serviceId),
              id: Number(service.id ?? service.serviceId),
              name: service.name,
              price: service.price,
              quantity: nextQuantity,
              stock: service.stock,
            },
          ]
      return {
        ...f,
        selectedRooms: {
          ...f.selectedRooms,
          [String(roomId)]: { ...room, services: nextServices },
        },
      }
    })
  }

  const serviceMaxQuantity = (service) => (
    service.type === 'INVENTORY' ? Number(service.stock || 0) : 99
  )

  const incrementRoomService = (roomId, service) => {
    const room = form.selectedRooms[String(roomId)]
    const selected = (room?.services || []).find(item => serviceKey(item) === serviceKey(service))
    const nextQuantity = Math.min(Number(selected?.quantity || 0) + 1, serviceMaxQuantity(service))
    updateRoomServices(roomId, service, nextQuantity)
  }

  const decrementRoomService = (roomId, service) => {
    const room = form.selectedRooms[String(roomId)]
    const selected = (room?.services || []).find(item => serviceKey(item) === serviceKey(service))
    const nextQuantity = Math.max(Number(selected?.quantity || 0) - 1, 0)
    updateRoomServices(roomId, service, nextQuantity)
  }

  const roomServiceTotal = (room) => (room.services || [])
    .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)

  const formatDeposit = (room) => {
    if (!room.depositPolicyName) return 'Không cọc'
    if (room.depositCalculationType === 'PERCENTAGE') {
      return `Cọc ${Number(room.depositPolicyValue || 0)}% (${room.depositPolicyName})`
    }
    return `Cọc ${formatMoney(room.depositPolicyValue)} (${room.depositPolicyName})`
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.pricePolicyId) { setError('Vui lòng chọn gói thuê'); return }
    setSubmitLoading(true); setError('')
    fetch(`${API_BASE}/direct`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        fullName:       form.fullName,
        phone:          form.phone,
        email:          form.email,
        address:        form.address,
        dateOfBirth:    form.dateOfBirth || null,
        identityDocumentNumber: form.identityDocumentNumber,
        checkInTarget:  form.checkInTarget,
        checkOutTarget: form.checkOutTarget,
        rentType:       selectedPolicy?.rentType || 'OVERNIGHT',
        pricePolicyId:  Number(form.pricePolicyId),
        rooms: selectedRoomEntries.map(r => ({
          roomId:          Number(r.roomId),
          numberOfAdults:  Number(r.numberOfAdults),
          numberOfChildren:Number(r.numberOfChildren),
          guests: r.guests.map(guest => ({
            ...guest,
            dateOfBirth: guest.dateOfBirth || null,
            email: guest.email || null,
            address: guest.address || null,
          })),
          services: (r.services || []).map(service => ({
            type: service.type,
            serviceId: Number(service.serviceId),
            quantity: Number(service.quantity),
          })),
        })),
      }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tạo được đơn đặt phòng')
        return data
      })
      .then(data => {
        if (data.requiresPayment && data.payment) {
          setPaymentResult(data)
          return
        }
        onCreated(data.booking)
      })
      .catch(err => setError(err.message || 'Không tạo được đơn đặt phòng'))
      .finally(() => setSubmitLoading(false))
  }

  return (
    <>
      <div className="abk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="abk-modal abk-direct-modal">
        <div className="abk-modal-head">
          <div>
            <h3>Đặt phòng trực tiếp</h3>
            <p>Tạo booking cho khách đến homestay qua lễ tân hoặc admin.</p>
          </div>
          <button type="button" className="abk-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="abk-modal-body" onSubmit={submit}>
          {error && <div className="abk-inline-error">{error}</div>}
          <div className="abk-direct-layout">

            {/* ── Cột trái: form ── */}
            <section className="abk-direct-form">
              <h4>Thông tin khách hàng</h4>
              <div className="abk-form-grid">
                <label><span>Họ tên</span>
                  <input required value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} />
                </label>
                <label><span>Số điện thoại</span>
                  <input required maxLength="10" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
                </label>
                <label><span>Email</span>
                  <input required type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} />
                </label>
                <label><span>Ngày sinh</span>
                  <input type="date" value={form.dateOfBirth} onChange={e => updateForm('dateOfBirth', e.target.value)} />
                </label>
                <label><span>CCCD người đại diện</span>
                  <input required maxLength="30" value={form.identityDocumentNumber} onChange={e => updateForm('identityDocumentNumber', e.target.value)} />
                </label>
                <label className="abk-form-wide"><span>Địa chỉ</span>
                  <input value={form.address} onChange={e => updateForm('address', e.target.value)} />
                </label>
              </div>

              <h4>Thông tin đặt phòng</h4>
              <div className="abk-form-grid">
                <label><span>Nhận phòng dự kiến</span>
                  <input required type="datetime-local" value={form.checkInTarget} onChange={e => updateCheckIn(e.target.value)} />
                </label>
                <label><span>Trả phòng dự kiến</span>
                  <input required type="datetime-local" value={form.checkOutTarget} onChange={e => updateForm('checkOutTarget', e.target.value)} />
                </label>
                {/* Loại thuê — lấy từ price_policies DB */}
                <label className="abk-form-wide"><span>Gói thuê</span>
                  <select
                    required
                    value={form.pricePolicyId}
                    onChange={e => updateForm('pricePolicyId', e.target.value)}
                  >
                    <option value="">— Chọn gói thuê —</option>
                    {pricePolicies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.policyName}
                        {p.limitHours ? ` · ${p.limitHours}h` : ''}
                        {p.standardCheckIn ? ` · Check-in ${p.standardCheckIn}` : ''}
                        {p.standardCheckOut ? ` → ${p.standardCheckOut}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Preview gói đang chọn */}
              {selectedPolicy && (
                <div className="abk-policy-preview">
                  <span className="abk-policy-preview-badge">
                    {selectedPolicy.rentType}
                    {selectedPolicy.limitHours ? ` · ${selectedPolicy.limitHours} giờ` : ''}
                  </span>
                  {selectedPolicy.standardCheckIn && (
                    <span>🕐 Nhận phòng chuẩn: {selectedPolicy.standardCheckIn}</span>
                  )}
                  {selectedPolicy.standardCheckOut && (
                    <span>🕐 Trả phòng chuẩn: {selectedPolicy.standardCheckOut}</span>
                  )}
                  <span className={`abk-day-type${isWeekend ? ' abk-day-type--weekend' : ''}`}>
                    {isWeekend ? '📅 Cuối tuần' : '📅 Ngày thường'}
                  </span>
                </div>
              )}

              {/* Phòng đã chọn */}
              <div className="abk-selected-rooms">
                <div className="abk-selected-rooms-head">
                  <h4>Phòng trong booking này</h4>
                  <span>{selectedRoomEntries.length} phòng</span>
                </div>
                {selectedRoomEntries.length ? selectedRoomEntries.map(room => {
                  const price = getPriceForRoomType(room.roomTypeId)
                  return (
                    <div className="abk-selected-room" key={room.roomId}>
                      <div className="abk-selected-room-info">
                        <strong>Phòng {room.roomNumber}</strong>
                        <span>{houseTypeName(room, 'Chưa phân loại')} · Tối đa {room.maxAdults || 0} người lớn, {room.maxChildren || 0} trẻ em</span>
                        <span className="abk-selected-room-deposit">{formatDeposit(room)}</span>
                        {price != null && (
                          <span className="abk-selected-room-price">
                            {formatMoney(price)} / {isWeekend ? 'cuối tuần' : 'ngày thường'}
                          </span>
                        )}
                        {price == null && form.pricePolicyId && (
                          <span className="abk-selected-room-price abk-selected-room-price--none">Chưa có giá cho gói này</span>
                        )}
                      </div>
                      <label>
                        <span>Người lớn</span>
                        <input type="number" min="1" max={room.maxAdults || undefined}
                          value={room.numberOfAdults}
                          onChange={e => updateSelectedRoom(room.roomId, 'numberOfAdults', e.target.value)} />
                      </label>
                      <label>
                        <span>Trẻ em</span>
                        <input type="number" min="0" max={room.maxChildren || undefined}
                          value={room.numberOfChildren}
                          onChange={e => updateSelectedRoom(room.roomId, 'numberOfChildren', e.target.value)} />
                      </label>
                      {/* Fix: dùng removeRoom thay vì toggleRoom để xóa chính xác bằng key */}
                      <button type="button" className="abk-remove-room-btn" onClick={() => removeRoom(room.roomId)} aria-label="Bỏ chọn phòng">×</button>
                      <div className="abk-room-services">
                        <div className="abk-room-services-head">
                          <strong>Dịch vụ</strong>
                          <button type="button" className="abk-service-picker-btn" onClick={() => setServicePickerRoomId(room.roomId)}>
                            Chọn dịch vụ
                          </button>
                        </div>
                        {room.services?.length ? (
                          <div className="abk-room-service-list">
                            {room.services.map(service => (
                              <span key={serviceKey(service)}>
                                {service.name} x{service.quantity}
                                <b>{formatMoney(Number(service.price || 0) * Number(service.quantity || 0))}</b>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p>Chưa chọn dịch vụ cho phòng này.</p>
                        )}
                        {room.services?.length ? (
                          <span className="abk-selected-room-services">
                            {room.services.length} dịch vụ · {formatMoney(roomServiceTotal(room))}
                          </span>
                        ) : null}
                      </div>
                      <div className="abk-room-guests">
                        <div className="abk-room-guests-head">
                          <strong>Thông tin người lưu trú</strong>
                          <button type="button" onClick={() => addGuest(room.roomId)}>+ Thêm người</button>
                        </div>
                        {room.guests.map((guest, guestIndex) => (
                          <div className="abk-room-guest" key={guestIndex}>
                            <label><span>Họ tên *</span><input required maxLength="100" value={guest.fullName} onChange={e => updateGuest(room.roomId, guestIndex, 'fullName', e.target.value)} /></label>
                            <label><span>CCCD *</span><input required maxLength="30" value={guest.identityDocumentNumber} onChange={e => updateGuest(room.roomId, guestIndex, 'identityDocumentNumber', e.target.value)} /></label>
                            <label><span>Điện thoại *</span><input required maxLength="15" value={guest.phone} onChange={e => updateGuest(room.roomId, guestIndex, 'phone', e.target.value)} /></label>
                            <label><span>Ngày sinh</span><input type="date" value={guest.dateOfBirth} onChange={e => updateGuest(room.roomId, guestIndex, 'dateOfBirth', e.target.value)} /></label>
                            <label><span>Email</span><input type="email" maxLength="100" value={guest.email} onChange={e => updateGuest(room.roomId, guestIndex, 'email', e.target.value)} /></label>
                            <label><span>Địa chỉ</span><input maxLength="255" value={guest.address} onChange={e => updateGuest(room.roomId, guestIndex, 'address', e.target.value)} /></label>
                            {room.guests.length > 1 && <button type="button" className="abk-remove-guest-btn" onClick={() => removeGuest(room.roomId, guestIndex)}>Xóa</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }) : (
                  <div className="abk-empty abk-empty--sm">Chưa chọn phòng nào.</div>
                )}
              </div>
            </section>

            {/* ── Cột phải: danh sách phòng ── */}
            <section className="abk-room-picker">
              <div className="abk-room-picker-head">
                <h4>Chọn phòng</h4>
                <span>{rooms.filter(r => r.available).length}/{rooms.length} phòng trống</span>
              </div>
              {roomsLoading ? (
                <div className="abk-empty abk-empty--sm">Đang kiểm tra phòng...</div>
              ) : (
                <div className="abk-room-options">
                  {rooms.map(room => {
                    const price = getPriceForRoomType(room.roomTypeId)
                    const isSelected = selectedRoomIds.has(String(room.roomId))
                    return (
                      <button
                        type="button"
                        key={room.roomId}
                        disabled={!room.available}
                        className={`abk-room-option${isSelected ? ' abk-room-option--selected' : ''}${!room.available ? ' abk-room-option--busy' : ''}`}
                        onClick={() => toggleRoom(room)}
                      >
                        <div className="abk-room-option-main">
                          <strong>Phòng {room.roomNumber}</strong>
                          <span>{houseTypeName(room, 'Chưa phân loại')}</span>
                          <span>Tối đa {room.maxAdults || 0} NL · {room.maxChildren || 0} TE</span>
                          {room.depositPolicyName && (
                            <span className="abk-room-deposit-hint">
                              {room.depositCalculationType === 'PERCENTAGE'
                                ? `Cọc ${Number(room.depositPolicyValue || 0)}%`
                                : `Cọc ${formatMoney(room.depositPolicyValue)}`}
                            </span>
                          )}
                        </div>
                        <div className="abk-room-option-side">
                          {price != null ? (
                            <strong className="abk-room-price">{formatMoney(price)}</strong>
                          ) : form.pricePolicyId ? (
                            <span className="abk-room-price-none">Chưa có giá</span>
                          ) : null}
                          <em>{room.available ? (isSelected ? '✓ Đã chọn' : 'Trống') : 'Đã book'}</em>
                          {!room.available && room.busySlots?.length ? (
                            <div className="abk-busy-slots">
                              {room.busySlots.map(slot => (
                                <span key={slot.bookingDetailId}>
                                  {formatClockTime(slot.checkInTarget)} - {formatClockTime(slot.checkOutTarget)} · {slot.customerName || 'Khách'}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="abk-direct-actions">
            <button type="button" className="abk-action-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="abk-action-primary"
              disabled={submitLoading || selectedRoomEntries.length === 0 || !form.pricePolicyId}>
              {submitLoading ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}
            </button>
          </div>
        </form>
        </div>
      </div>
      {paymentResult && (
        <SePayQrPayment
          payment={paymentResult.payment}
          statusUrl={`${API_BASE}/details/${paymentResult.booking.bookingDetailId}`}
          headers={authHeaders()}
          statusField="bookingStatus"
          successStatus="CONFIRMED"
          title="Thanh toán đặt phòng tại quầy"
          onSuccess={onCreated}
          onClose={() => {
            setPaymentResult(null)
            onClose()
          }}
        />
      )}
      {servicePickerRoom && (
        <div className="abk-overlay abk-service-picker-overlay" onClick={e => e.target === e.currentTarget && setServicePickerRoomId(null)}>
          <div className="abk-modal abk-service-picker-modal" role="dialog" aria-modal="true">
            <div className="abk-modal-head">
              <div>
                <h3>Chọn dịch vụ phòng {servicePickerRoom.roomNumber}</h3>
                <p>Dịch vụ được lưu vào booking của riêng phòng này.</p>
              </div>
              <button type="button" className="abk-modal-close" onClick={() => setServicePickerRoomId(null)}>×</button>
            </div>
            <div className="abk-service-picker-body">
              {servicesLoading ? (
                <div className="abk-empty abk-empty--sm">Đang tải dịch vụ...</div>
              ) : serviceOptions.length ? (
                serviceOptions.map(service => {
                  const selected = (servicePickerRoom.services || []).find(item => serviceKey(item) === serviceKey(service))
                  const quantity = selected?.quantity || 0
                  const maxQuantity = serviceMaxQuantity(service)
                  return (
                    <button
                      type="button"
                      className={`abk-service-picker-row${quantity > 0 ? ' abk-service-picker-row--selected' : ''}`}
                      key={serviceKey(service)}
                      onClick={() => incrementRoomService(servicePickerRoom.roomId, service)}
                      disabled={maxQuantity <= 0}
                    >
                      <img
                        src={serviceImageSrc(service.imageUrl)}
                        alt=""
                        onError={e => { e.currentTarget.src = '/img.png' }}
                      />
                      <div>
                        <strong>{service.name}</strong>
                        <span>{service.type === 'FACILITY' ? 'Dịch vụ tiện ích' : `Thuê đồ · còn ${service.stock}`}</span>
                      </div>
                      <b>{formatMoney(service.price)}</b>
                      <div className="abk-service-quantity" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => decrementRoomService(servicePickerRoom.roomId, service)}
                          disabled={quantity <= 0}
                          aria-label={`Gi?m ${service.name}`}
                        >
                          -
                        </button>
                        <strong>{quantity}</strong>
                        <button
                          type="button"
                          onClick={() => incrementRoomService(servicePickerRoom.roomId, service)}
                          disabled={quantity >= maxQuantity}
                          aria-label={`Tang ${service.name}`}
                        >
                          +
                        </button>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="abk-empty abk-empty--sm">Chưa có dịch vụ đang khả dụng.</div>
              )}
            </div>
            <div className="abk-direct-actions">
              <button type="button" className="abk-action-secondary" onClick={() => setServicePickerRoomId(null)}>Đóng</button>
              <button type="button" className="abk-action-primary" onClick={() => setServicePickerRoomId(null)}>
                Lưu lựa chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DayRevenueDetailModal({ day, bookings = [], rooms = [], onClose, onOpenDetail }) {
  if (!day) return null

  // Lọc các đơn đặt phòng trong ngày:
  // 1. Đơn nhận phòng vào ngày này
  const checkInBookings = bookings.filter(b => isCheckInDay(b, day))
  // 2. Đơn hoạt động trong ngày này (check-in hoặc đang lưu trú)
  const activeBookings = bookings.filter(b => isCheckInDay(b, day) || overlapsDay(b, day))

  // Doanh thu nhận phòng trong ngày
  const totalCheckInRevenue = checkInBookings.reduce((sum, b) => sum + Number(b.priceAtBooking || b.finalRoomAmount || 0), 0)

  // Thống kê phòng
  const assignedRooms = new Set(activeBookings.map(b => b.roomId).filter(Boolean))
  const unassignedCount = activeBookings.filter(b => b.roomId == null).length
  const totalGuests = activeBookings.reduce((sum, b) => sum + Number(b.numberOfAdults || 1) + Number(b.numberOfChildren || 0), 0)

  const dayTitle = formatFullVietnameseDate(day)

  return (
    <div className="abk-day-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="abk-day-modal">
        <div className="abk-day-modal-head">
          <div>
            <span className="abk-day-modal-badge">📊 Báo cáo ngày</span>
            <h3>{dayTitle}</h3>
            <p>Tổng quan doanh thu và danh sách khách hàng đặt phòng trong ngày</p>
          </div>
          <button type="button" className="abk-modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="abk-day-modal-body">
          {/* Thẻ chỉ số tổng quan */}
          <div className="abk-day-kpi-grid">
            <div className="abk-day-kpi-card abk-day-kpi-card--revenue">
              <div className="abk-day-kpi-icon">💰</div>
              <div>
                <span>Doanh thu ngày</span>
                <strong>{formatMoney(totalCheckInRevenue)}</strong>
                <small>{checkInBookings.length} đơn nhận phòng hôm nay</small>
              </div>
            </div>

            <div className="abk-day-kpi-card">
              <div className="abk-day-kpi-icon">🏠</div>
              <div>
                <span>Phòng có khách</span>
                <strong>{assignedRooms.size + unassignedCount} phòng</strong>
                <small>{assignedRooms.size} đã gán · {unassignedCount} chờ xếp</small>
              </div>
            </div>

            <div className="abk-day-kpi-card">
              <div className="abk-day-kpi-icon">📋</div>
              <div>
                <span>Tổng đơn trong ngày</span>
                <strong>{activeBookings.length} đơn</strong>
                <small>{checkInBookings.length} mới · {activeBookings.length - checkInBookings.length} lưu trú tiếp</small>
              </div>
            </div>

            <div className="abk-day-kpi-card">
              <div className="abk-day-kpi-icon">👥</div>
              <div>
                <span>Số lượng khách</span>
                <strong>{totalGuests} khách</strong>
                <small>Dự kiến lưu trú trong ngày</small>
              </div>
            </div>
          </div>

          {/* Danh sách đặt phòng */}
          <div className="abk-day-booking-section">
            <div className="abk-day-booking-head">
              <h4>Danh sách khách đặt phòng ({activeBookings.length})</h4>
              <span>Bấm nút "Chi tiết" để xem hóa đơn & quản lý lưu trú</span>
            </div>

            {activeBookings.length === 0 ? (
              <div className="abk-day-booking-empty">
                <span>🍃</span>
                <p>Không có đơn đặt phòng nào trong ngày này.</p>
                <small>Doanh thu: 0đ</small>
              </div>
            ) : (
              <div className="abk-day-booking-list">
                {activeBookings.map(b => {
                  const isNewCheckIn = isCheckInDay(b, day)
                  const room = rooms.find(r => r.id === b.roomId)
                  const roomName = b.roomNumber
                    ? `Phòng ${b.roomNumber}`
                    : b.roomId
                    ? `Phòng ${room?.roomNumber || b.roomId}`
                    : 'Chờ gán phòng'
                  const isUnassigned = !b.roomId

                  return (
                    <article className={`abk-day-booking-item${isUnassigned ? ' is-unassigned' : ''}`} key={b.bookingDetailId}>
                      <div className="abk-day-booking-main">
                        <div className="abk-day-booking-header-row">
                          <span className={`abk-day-room-pill${isUnassigned ? ' is-unassigned' : ''}`}>
                            {isUnassigned ? '⚡ Chờ gán phòng' : `🚪 ${roomName}`}
                          </span>
                          <span className="abk-day-type-text">
                            {houseTypeName(b, room?.roomTypeName || 'Loại phòng')}
                          </span>
                          {isNewCheckIn ? (
                            <span className="abk-day-checkin-tag">✨ Nhận phòng hôm nay</span>
                          ) : (
                            <span className="abk-day-stay-tag">🛌 Đang lưu trú</span>
                          )}
                          <span className={`abk-status-pill abk-status-pill--${String(b.bookingStatus || '').toLowerCase()}`}>
                            {statusLabel(b.bookingStatus)}
                          </span>
                        </div>

                        <div className="abk-day-customer-grid">
                          <div>
                            <span className="abk-day-label">Khách hàng</span>
                            <strong className="abk-day-customer-name">
                              {b.customerName || 'Khách vãng lai'}
                            </strong>
                            {b.customerPhone && (
                              <span className="abk-day-phone">📞 {b.customerPhone}</span>
                            )}
                          </div>

                          <div>
                            <span className="abk-day-label">Mã booking & Khách</span>
                            <span className="abk-day-code">{bookingDisplay(b)}</span>
                            <span className="abk-day-guests">
                              👥 {b.numberOfAdults || 1} NL {b.numberOfChildren > 0 ? `· ${b.numberOfChildren} TE` : ''}
                            </span>
                          </div>

                          <div>
                            <span className="abk-day-label">Thời gian lưu trú</span>
                            <span className="abk-day-time">
                              {formatAppDateTime(b.checkInTarget)}
                            </span>
                            <span className="abk-day-time-arrow">
                              ➔ {formatAppDateTime(b.checkOutTarget)}
                            </span>
                          </div>

                          <div className="abk-day-price-col">
                            <span className="abk-day-label">Doanh thu phòng</span>
                            <strong className="abk-day-price">
                              {formatMoney(b.priceAtBooking || b.finalRoomAmount || 0)}
                            </strong>
                            <small className="abk-day-rent-type">
                              Gói: {b.rentType === 'OVERNIGHT' ? 'Qua đêm' : b.rentType === 'HOURLY' ? 'Theo giờ' : 'Theo ngày'}
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="abk-day-booking-side">
                        <button
                          type="button"
                          className="abk-day-detail-btn"
                          onClick={() => {
                            onClose()
                            onOpenDetail(b.bookingDetailId)
                          }}
                        >
                          Chi tiết →
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="abk-day-modal-footer">
          <div className="abk-day-footer-total">
            <span>Tổng doanh thu đặt phòng ngày {formatShortDate(day)}:</span>
            <strong>{formatMoney(totalCheckInRevenue)}</strong>
          </div>
          <button type="button" className="abk-day-footer-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminBookingsPage() {
  const { isInShift, guardAction } = useShiftGuard()
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek()))
  const [schedule, setSchedule] = useState({ rooms: [], bookings: [], weekStart, weekEnd: weekStart })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [selectedBookingDetailId, setSelectedBookingDetailId] = useState(null)
  const [directModalOpen, setDirectModalOpen] = useState(false)
  const [daySummaryModal, setDaySummaryModal] = useState(null)

  const loadSchedule = () => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetch(`${SCHEDULE_API}?weekStart=${weekStart}`, { headers: authHeaders(), signal: controller.signal })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tải được lịch đặt phòng')
        return data
      })
      .then(data => {
        setSchedule({
          rooms: Array.isArray(data.rooms) ? data.rooms : [],
          bookings: Array.isArray(data.bookings) ? data.bookings : [],
          weekStart: data.weekStart || weekStart,
          weekEnd: data.weekEnd || weekStart,
          today: data.today,
        })
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Không tải được lịch đặt phòng')
      })
      .finally(() => setLoading(false))

    return controller
  }

  useEffect(() => {
    const controller = loadSchedule()
    return () => controller.abort()
  }, [weekStart])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, pageSize, weekStart])

  const loadDetail = (bookingDetailId) => {
    setSelectedBookingDetailId(bookingDetailId)
    setDetailError('')
    setActionError('')
    setDetailLoading(true)

    fetch(`${API_BASE}/details/${bookingDetailId}`, { headers: authHeaders() })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tải được chi tiết đơn đặt phòng')
        return data
      })
      .then(data => setSelectedDetail(data))
      .catch(err => setDetailError(err.message || 'Không tải được chi tiết đơn đặt phòng'))
      .finally(() => setDetailLoading(false))
  }

  const openDetail = (bookingDetailId) => {
    setDetailModalOpen(true)
    setSelectedDetail(null)
    loadDetail(bookingDetailId)
  }

  const runDetailAction = (action, body, directData, method = 'POST') => {
    // '__refresh__' là signal từ inline edit form — data đã có sẵn, chỉ cần set state
    if (action === '__refresh__') {
      if (directData) setSelectedDetail(directData)
      loadSchedule()
      return
    }
    if (action === '__error__') {
      setActionError(directData || 'Không xử lý được yêu cầu')
      return
    }
    if (!isInShift) {
      guardAction(null, 'Chỉnh sửa / Cập nhật đơn đặt phòng')
      return
    }
    if (!selectedBookingDetailId) return
    setActionLoading(true)
    setActionError('')

    fetch(`${API_BASE}/details/${selectedBookingDetailId}/${action}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không xử lý được yêu cầu')
        return data
      })
      .then(data => {
        setSelectedDetail(data)
        loadSchedule()
      })
      .catch(err => setActionError(err.message || 'Không xử lý được yêu cầu'))
      .finally(() => setActionLoading(false))
  }

  const handleDirectBookingCreated = (detail) => {
    setDirectModalOpen(false)
    loadSchedule()
    if (detail?.bookingDetailId) {
      openDetail(detail.bookingDetailId)
    }
  }

  const weekDays = useMemo(() => {
    const start = toDate(schedule.weekStart || weekStart)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [schedule.weekStart, weekStart])

  const visibleBookings = useMemo(() => {
    const adminBookings = schedule.bookings.filter(isAdminScheduleBookingVisible)
    if (!statusFilter) return adminBookings
    return adminBookings.filter(booking =>
      [booking.bookingStatus, booking.detailStatus].some(status => normalizeStatus(status) === statusFilter)
    )
  }, [schedule.bookings, statusFilter])

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return schedule.rooms.filter(room => roomMatchesSearch(room, visibleBookings, keyword))
  }, [schedule.rooms, visibleBookings, search])

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRooms = filteredRooms.slice((safePage - 1) * pageSize, safePage * pageSize)

  const todayKey = toDateKey(new Date())
  const adminScheduleBookings = schedule.bookings.filter(isAdminScheduleBookingVisible)
  const todayBookings = adminScheduleBookings.filter(booking => overlapsDay(booking, new Date()))
  const activeRoomsToday = new Set(
    todayBookings.map(booking => booking.roomId).filter(roomId => roomId != null)
  ).size
  const unassignedToday = todayBookings.filter(b => b.roomId == null).length
  const unassignedWeek = adminScheduleBookings.filter(b => b.roomId == null)
  const pendingCount = adminScheduleBookings.filter(booking =>
    [booking.bookingStatus, booking.detailStatus].some(status => normalizeStatus(status) === 'PENDING')
  ).length
  const weekRevenue = adminScheduleBookings.reduce((sum, booking) => sum + Number(booking.priceAtBooking || 0), 0)

  const unassignedVisibleBookings = visibleBookings.filter(booking => booking.roomId == null)

  const shiftWeek = amount => {
    setWeekStart(toDateKey(addDays(toDate(weekStart), amount * 7)))
  }

  return (
    <AdminLayout activePage="booking-orders">
      <div className="abk-header">
        <div>
          <h1>Đơn Đặt Phòng</h1>
          <p>Lịch tuần từ {formatShortDate(schedule.weekStart)} đến {formatShortDate(schedule.weekEnd)}.</p>
        </div>
        <div className="abk-week-controls">
          <button
            type="button"
            className="abk-create-btn"
            onClick={() => guardAction(() => setDirectModalOpen(true), 'Tạo đơn đặt phòng')}
          >
            Đặt phòng
          </button>
          <button type="button" className="abk-icon-btn" onClick={() => shiftWeek(-1)} aria-label="Tuần trước">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" className="abk-today-btn" onClick={() => setWeekStart(toDateKey(startOfWeek()))}>Hôm nay</button>
          <button type="button" className="abk-icon-btn" onClick={() => shiftWeek(1)} aria-label="Tuần sau">
            <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div className="abk-stats">
        <div><span>Phòng trong hệ thống</span><strong>{schedule.rooms.length}</strong></div>
        <div>
          <span>Phòng có khách hôm nay</span>
          <strong>
            {activeRoomsToday + unassignedToday}
            {unassignedToday > 0 && (
              <small style={{ fontSize: '12px', color: '#e67e22', marginLeft: '6px', fontWeight: 700 }}>
                ({unassignedToday} chờ gán)
              </small>
            )}
          </strong>
        </div>
        <div><span>Đơn trong tuần</span><strong>{adminScheduleBookings.length}</strong></div>
        <div>
          <span>Chưa gán phòng</span>
          <strong style={{ color: unassignedWeek.length > 0 ? '#e67e22' : 'inherit' }}>
            {unassignedWeek.length}
          </strong>
        </div>
        <div><span>Đang chờ</span><strong>{pendingCount}</strong></div>
        <div><span>Giá trị đặt phòng</span><strong>{formatMoney(weekRevenue)}</strong></div>
      </div>

      {unassignedWeek.length > 0 && (
        <div className="abk-unassigned-alert-banner">
          <div className="abk-unassigned-alert-left">
            <span className="abk-unassigned-alert-icon">⚡</span>
            <div>
              <strong>Có {unassignedWeek.length} phòng đặt trực tuyến chưa được gán phòng trong tuần này!</strong>
              <p>Các đơn này đang hiển thị ở hàng <em>"Chờ gán phòng"</em> trên lịch hoặc có thể gán tại <em>Nhật ký lưu trú</em>.</p>
            </div>
          </div>
          <a href="/admin/check-in-logs" className="abk-unassigned-alert-link">
            Mở Nhật ký check-in →
          </a>
        </div>
      )}

      <div className="abk-toolbar">
        <input
          className="abk-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm phòng, loại phòng, khách hàng, số điện thoại..."
        />
        <input
          className="abk-date"
          type="date"
          value={weekStart}
          onChange={e => setWeekStart(toDateKey(startOfWeek(toDate(e.target.value))))}
        />
        <select className="abk-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Check in thành công</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <select className="abk-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size} phòng/trang</option>)}
        </select>
      </div>

      <section className="abk-schedule">
        {loading ? (
          <div className="abk-empty">Đang tải lịch đặt phòng...</div>
        ) : error ? (
          <div className="abk-empty abk-empty--error">{error}</div>
        ) : filteredRooms.length === 0 && unassignedVisibleBookings.length === 0 ? (
          <div className="abk-empty">Không có phòng hoặc đơn đặt phòng phù hợp.</div>
        ) : (
          <div className="abk-grid-wrap">
            <div className="abk-grid" style={{ '--abk-days': weekDays.length }}>
              <div className="abk-room-head">Phòng</div>
              {weekDays.map((day, index) => {
                const key = toDateKey(day)
                const dayCheckInBookings = schedule.bookings.filter(b => isAdminScheduleBookingVisible(b) && isCheckInDay(b, day))
                const dayRevenue = dayCheckInBookings.reduce((sum, b) => sum + Number(b.priceAtBooking || b.finalRoomAmount || 0), 0)
                return (
                  <div
                    className={`abk-day-head${key === todayKey ? ' abk-day-head--today' : ''}`}
                    key={key}
                    onClick={() => setDaySummaryModal(day)}
                    title={`Nhấn để xem doanh thu & danh sách đặt phòng ngày ${formatShortDate(day)}`}
                  >
                    <span>{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</span>
                    <strong>{formatShortDate(day)}</strong>
                    <div className="abk-day-head-meta">
                      {dayCheckInBookings.length > 0 ? (
                        <span className="abk-day-head-revenue">
                          {formatMoney(dayRevenue)}
                        </span>
                      ) : (
                        <span className="abk-day-head-empty">0đ</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Hàng đơn đặt chưa gán phòng (Web Booking Chưa Xếp Phòng) */}
              {unassignedVisibleBookings.length > 0 && (
                <div className="abk-row abk-row--unassigned" key="unassigned-row">
                  <div className="abk-room-cell abk-room-cell--unassigned">
                    <div className="abk-unassigned-tag">
                      <span className="abk-unassigned-pulse"></span>
                      <strong>Chờ gán phòng</strong>
                    </div>
                    <span>{unassignedVisibleBookings.length} đơn đặt chờ xếp</span>
                  </div>
                  {weekDays.map(day => {
                    const dayBookings = unassignedVisibleBookings
                      .filter(booking => isCheckInDay(booking, day))
                      .sort((a, b) => new Date(a.checkInTarget) - new Date(b.checkInTarget))
                    return (
                      <div className="abk-day-cell abk-day-cell--unassigned" key={`unassigned-${toDateKey(day)}`}>
                        {dayBookings.length ? (
                          dayBookings.map(booking => (
                            <div key={booking.bookingDetailId} className="abk-unassigned-booking-wrapper">
                              <span className="abk-unassigned-type-pill">
                                🏠 {houseTypeName(booking, 'Loại phòng')}
                              </span>
                              <BookingCard booking={booking} onOpenDetail={openDetail} />
                            </div>
                          ))
                        ) : (
                          <span className="abk-free">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {pagedRooms.map(room => (
                <div className="abk-row" key={room.id}>
                  <div className="abk-room-cell">
                    <strong>Phòng {room.roomNumber}</strong>
                    <span>{houseTypeName(room, 'Chưa phân loại')}</span>
                  </div>
                  {weekDays.map(day => {
                    const dayBookings = visibleBookings
                      .filter(booking => booking.roomId === room.id && isCheckInDay(booking, day))
                      .sort((a, b) => new Date(a.checkInTarget) - new Date(b.checkInTarget))
                    return (
                      <div className="abk-day-cell" key={`${room.id}-${toDateKey(day)}`}>
                        {dayBookings.length ? (
                          dayBookings.map(booking => (
                            <BookingCard key={booking.bookingDetailId} booking={booking} onOpenDetail={openDetail} />
                          ))
                        ) : (
                          <span className="abk-free">Trống</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="abk-footer">
        <span>
          Hiển thị {pagedRooms.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredRooms.length)} / {filteredRooms.length} phòng
        </span>
        <div className="abk-pagination">
          <button type="button" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Trước</button>
          <strong>{safePage} / {totalPages}</strong>
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Sau</button>
        </div>
      </div>

      {detailModalOpen && (
        <BookingDetailModal
          detail={selectedDetail}
          loading={detailLoading}
          error={detailError}
          actionLoading={actionLoading}
          actionError={actionError}
          onClose={() => setDetailModalOpen(false)}
          onRefresh={() => selectedBookingDetailId && loadDetail(selectedBookingDetailId)}
          onAction={runDetailAction}
        />
      )}

      {directModalOpen && (
        <DirectBookingModal
          onClose={() => setDirectModalOpen(false)}
          onCreated={handleDirectBookingCreated}
        />
      )}

      {daySummaryModal && (
        <DayRevenueDetailModal
          day={daySummaryModal}
          bookings={schedule.bookings.filter(isAdminScheduleBookingVisible)}
          rooms={schedule.rooms}
          onClose={() => setDaySummaryModal(null)}
          onOpenDetail={openDetail}
        />
      )}
    </AdminLayout>
  )
}

export default AdminBookingsPage
