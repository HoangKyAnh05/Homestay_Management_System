import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminBookingsPage.css'

const API_BASE = 'http://localhost:8080/api/admin/bookings'
const SCHEDULE_API = `${API_BASE}/schedule`
const PAGE_SIZE_OPTIONS = [6, 8, 12]

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
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

function formatDateTime(value) {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
  const normalized = String(status || '').toUpperCase()
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
    `${booking.customerName || ''} ${booking.customerPhone || ''} ${booking.bookingId || ''}`.toLowerCase().includes(keyword)
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

function BookingCard({ booking, onOpenDetail }) {
  const totalGuests = Number(booking.numberOfAdults || 0) + Number(booking.numberOfChildren || 0)
  return (
    <article className={bookingStatusClass(booking.detailStatus || booking.bookingStatus)}>
      <div className="abk-booking-main">
        <strong>{booking.customerName || 'Khách hàng'}</strong>
        <span>#{booking.bookingId} · {statusLabel(booking.detailStatus || booking.bookingStatus)}</span>
      </div>
      <div className="abk-booking-meta">
        <span>{formatTime(booking.checkInTarget)} - {formatTime(booking.checkOutTarget)}</span>
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

function BookingDetailModal({ detail, loading, error, actionLoading, actionError, onClose, onRefresh, onAction }) {
  const PRICE_API_MODAL = 'http://localhost:8080/api/admin/price-config'

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
  }, [detail?.bookingDetailId])

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
  const services    = serviceForm.type === 'FACILITY' ? detail?.facilityServices || [] : detail?.inventoryServices || []

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

  return (
    <div className="abk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="abk-modal">
        <div className="abk-modal-head">
          <div>
            <h3>Chi tiết đơn đặt phòng</h3>
            <p>{detail ? `Booking #${detail.bookingId} · Phòng ${detail.roomNumber}` : 'Đang tải thông tin...'}</p>
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
                    <button type="button" className="abk-action-primary" disabled={actionLoading} onClick={() => onAction('check-in')}>
                      Check in
                    </button>
                  )}
                  {canCheckOut && (
                    <button type="button" className="abk-action-primary" disabled={actionLoading} onClick={() => onAction('check-out')}>
                      Check out
                    </button>
                  )}
                  <button type="button" className="abk-action-secondary" onClick={() => setStayOpen(v => !v)}>
                    Lưu trú
                  </button>
                </div>
              </div>
              {actionError && <div className="abk-inline-error">{actionError}</div>}

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
                  <div className="abk-detail-grid">
                    <DetailField label="Phòng"            value={`${detail.roomNumber} · ${detail.roomTypeName || 'Chưa phân loại'}`} />
                    <DetailField label="Ngày đặt"         value={formatDateTime(detail.bookingDate)} />
                    <DetailField label="Nhận phòng"       value={formatDateTime(detail.checkInTarget)} />
                    <DetailField label="Trả phòng"        value={formatDateTime(detail.checkOutTarget)} />
                    <DetailField label="Người lớn"        value={detail.numberOfAdults} />
                    <DetailField label="Trẻ em"           value={detail.numberOfChildren} />
                    <DetailField label="Loại thuê"        value={detail.rentType} />
                    <DetailField label="Trạng thái"       value={statusLabel(detail.bookingStatus)} />
                    <DetailField label="Giá lúc đặt"      value={formatMoney(detail.priceAtBooking)} />
                    <DetailField label="Đã thanh toán"    value={formatMoney(detail.paidAmount)} />
                  </div>
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
                              <span>Check-in {formatDateTime(record.actualCheckIn)} · Check-out {formatDateTime(record.actualCheckOut)}</span>
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
                    {detail.serviceItems?.length ? (
                      <div className="abk-line-list">
                        {detail.serviceItems.map(item => (
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
                            <strong>{formatMoney(item.amount)}</strong>
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
                      <button type="button" disabled={actionLoading} onClick={() => onAction('invoice')}>
                        Generate hóa đơn
                      </button>
                    </div>
                    {detail.invoice ? (
                      <>
                        <div className="abk-detail-grid">
                          <DetailField label="Mã hóa đơn" value={`#${detail.invoice.id}`} />
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
                                  <span>{payment.transactionNo || 'Không có mã giao dịch'} · {formatDateTime(payment.paymentTime)}</span>
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
  )
}

function DirectBookingModal({ onClose, onCreated }) {
  const PRICE_API = 'http://localhost:8080/api/admin/price-config'

  const initialCheckIn = defaultCheckInValue()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
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

  const selectedRoomEntries = Object.values(form.selectedRooms)
  const selectedRoomIds = new Set(selectedRoomEntries.map(r => String(r.roomId)))

  // Tính ngày check-in là WEEKDAY hay WEEKEND
  const isWeekend = useMemo(() => {
    if (!form.checkInTarget) return false
    const d = new Date(form.checkInTarget).getDay() // 0=CN, 6=T7
    return d === 0 || d === 6
  }, [form.checkInTarget])

  // Tìm giá cho một loại phòng theo gói thuê và day_type đang chọn
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
        checkInTarget:  form.checkInTarget,
        checkOutTarget: form.checkOutTarget,
        rentType:       selectedPolicy?.rentType || 'OVERNIGHT',
        pricePolicyId:  Number(form.pricePolicyId),
        rooms: selectedRoomEntries.map(r => ({
          roomId:          Number(r.roomId),
          numberOfAdults:  Number(r.numberOfAdults),
          numberOfChildren:Number(r.numberOfChildren),
        })),
      }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không tạo được đơn đặt phòng')
        return data
      })
      .then(data => onCreated(data))
      .catch(err => setError(err.message || 'Không tạo được đơn đặt phòng'))
      .finally(() => setSubmitLoading(false))
  }

  return (
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
                        <span>{room.roomTypeName || 'Chưa phân loại'} · Tối đa {room.maxAdults || 0} người lớn, {room.maxChildren || 0} trẻ em</span>
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
                          <span>{room.roomTypeName || 'Chưa phân loại'}</span>
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
                                  {formatTime(slot.checkInTarget)} - {formatTime(slot.checkOutTarget)} · {slot.customerName || 'Khách'}
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
  )
}

function AdminBookingsPage() {
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

  const runDetailAction = (action, body, directData) => {
    // '__refresh__' là signal từ inline edit form — data đã có sẵn, chỉ cần set state
    if (action === '__refresh__') {
      if (directData) setSelectedDetail(directData)
      loadSchedule()
      return
    }
    if (!selectedBookingDetailId) return
    setActionLoading(true)
    setActionError('')

    fetch(`${API_BASE}/details/${selectedBookingDetailId}/${action}`, {
      method: 'POST',
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
    if (!statusFilter) return schedule.bookings
    return schedule.bookings.filter(booking =>
      [booking.bookingStatus, booking.detailStatus].some(status => String(status || '').toUpperCase() === statusFilter)
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
  const todayBookings = schedule.bookings.filter(booking => overlapsDay(booking, new Date()))
  const activeRoomsToday = new Set(todayBookings.map(booking => booking.roomId)).size
  const pendingCount = schedule.bookings.filter(booking =>
    [booking.bookingStatus, booking.detailStatus].some(status => String(status || '').toUpperCase() === 'PENDING')
  ).length
  const weekRevenue = schedule.bookings.reduce((sum, booking) => sum + Number(booking.priceAtBooking || 0), 0)

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
          <button type="button" className="abk-create-btn" onClick={() => setDirectModalOpen(true)}>
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
        <div><span>Phòng có khách hôm nay</span><strong>{activeRoomsToday}</strong></div>
        <div><span>Đơn trong tuần</span><strong>{schedule.bookings.length}</strong></div>
        <div><span>Đang chờ</span><strong>{pendingCount}</strong></div>
        <div><span>Giá trị đặt phòng</span><strong>{formatMoney(weekRevenue)}</strong></div>
      </div>

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
          <option value="PENDING">Chờ xác nhận</option>
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
        ) : filteredRooms.length === 0 ? (
          <div className="abk-empty">Không có phòng hoặc đơn đặt phòng phù hợp.</div>
        ) : (
          <div className="abk-grid-wrap">
            <div className="abk-grid" style={{ '--abk-days': weekDays.length }}>
              <div className="abk-room-head">Phòng</div>
              {weekDays.map((day, index) => {
                const key = toDateKey(day)
                return (
                  <div className={`abk-day-head${key === todayKey ? ' abk-day-head--today' : ''}`} key={key}>
                    <span>{index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}</span>
                    <strong>{formatShortDate(day)}</strong>
                  </div>
                )
              })}

              {pagedRooms.map(room => (
                <div className="abk-row" key={room.id}>
                  <div className="abk-room-cell">
                    <strong>Phòng {room.roomNumber}</strong>
                    <span>{room.roomTypeName || 'Chưa phân loại'}</span>
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
    </AdminLayout>
  )
}

export default AdminBookingsPage
