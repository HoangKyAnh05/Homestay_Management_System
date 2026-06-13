import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './RoomsPage.css'
import './RoomDetailPage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function formatMoney(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function depositText(room) {
  if (!room?.depositPolicyId) return 'Không cần thanh toán trước'
  if (String(room.depositCalculationType || '').toUpperCase() === 'PERCENTAGE') {
    return `Cần thanh toán trước ${Number(room.depositPolicyValue || 0)}%`
  }
  return `Cần thanh toán trước ${formatMoney(room.depositPolicyValue)}`
}

function formatDateTime(value, options) {
  return new Intl.DateTimeFormat('vi-VN', options).format(new Date(value))
}

function formatBusyDate(value) {
  const date = new Date(value)
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  return `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatBusyTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function formatBusyDateRange(slot) {
  return `${formatBusyDate(slot.checkInTarget)} - ${formatBusyDate(slot.checkOutTarget)}`
}

function formatBusyTimeRange(slot) {
  return `${formatBusyTime(slot.checkInTarget)} - ${formatBusyTime(slot.checkOutTarget)}`
}

function findOverlappingBusySlot(slots, checkInTarget, checkOutTarget) {
  if (!checkInTarget || !checkOutTarget) return null
  const checkIn = new Date(checkInTarget)
  const checkOut = new Date(checkOutTarget)
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null

  return (slots || []).find((slot) => {
    const busyStart = new Date(slot.checkInTarget)
    const busyEnd = new Date(slot.checkOutTarget)
    const checkInInsideBusySlot = checkIn >= busyStart && checkIn < busyEnd
    const rangeOverlapsBusySlot = checkIn < busyEnd && checkOut > busyStart
    return checkInInsideBusySlot || rangeOverlapsBusySlot
  }) || null
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: 'Qua đêm',
    NIGHTLY: 'Qua đêm',
    BY_NIGHT: 'Qua đêm',
    DAILY: 'Theo ngày',
    BY_DAY: 'Theo ngày',
    HOURLY: 'Theo giờ',
    COMBO: 'Combo',
  }
  return labels[String(rentType || '').toUpperCase()] || rentType || 'Gói thuê'
}

function dayTypeLabel(dayType) {
  return String(dayType || '').toUpperCase() === 'WEEKEND' ? 'Cuối tuần' : 'Ngày thường'
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
  const date = new Date()
  date.setHours(Math.max(13, date.getHours() + 1), 0, 0, 0)
  return toDateTimeLocalValue(date)
}

function defaultCheckOutValue(checkInValue) {
  const date = new Date(checkInValue)
  date.setDate(date.getDate() + 1)
  date.setHours(12, 0, 0, 0)
  return toDateTimeLocalValue(date)
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
        <a href="/rooms" className="home-nav-active">Phòng</a>
        <a href="/home#amenities">Tiện nghi</a>
        <a href="/home#contact">Liên hệ</a>
        <a href="/home#about">Giới thiệu</a>
      </nav>

      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            <span className="home-user-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
            </span>
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              <a href="/booking-history">Lịch sử đặt phòng</a>
              <a href="/profile">Thông tin cá nhân</a>
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

function groupSlotsByDate(slots) {
  return slots.reduce((groups, slot) => {
    const dateKey = formatDateTime(slot.checkInTarget, {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return {
      ...groups,
      [dateKey]: [...(groups[dateKey] || []), slot],
    }
  }, {})
}

function groupPrices(prices) {
  const groups = new Map()
  prices.forEach((price) => {
    const key = `${price.policyName}-${price.rentType}`
    const current = groups.get(key) || {
      policyName: price.policyName,
      rentType: price.rentType,
      weekdayPrice: null,
      weekendPrice: null,
    }
    if (String(price.dayType || '').toUpperCase() === 'WEEKEND') {
      current.weekendPrice = price.price
    } else {
      current.weekdayPrice = price.price
    }
    groups.set(key, current)
  })
  return Array.from(groups.values())
}

function BookingModal({ room, onClose, onCreated }) {
  const currentUser = getStoredUser()
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    checkInTarget: defaultCheckInValue(),
    checkOutTarget: '',
    pricePolicyId: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
  })
  const [policies, setPolicies] = useState([])
  const [serviceOptions, setServiceOptions] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [serviceForm, setServiceForm] = useState({ optionKey: '', quantity: 1 })
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentSummary, setPaymentSummary] = useState(null)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      checkOutTarget: defaultCheckOutValue(current.checkInTarget),
    }))
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setError('Bạn cần đăng nhập để đặt phòng.')
      setLoadingMeta(false)
      return
    }

    Promise.all([
      fetch(`${API_BASE_URL}/bookings/price-policies`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
      fetch(`${API_BASE_URL}/bookings/services`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
    ])
      .then(([policyData, serviceData]) => {
        const nextPolicies = Array.isArray(policyData) ? policyData : []
        setPolicies(nextPolicies)
        setServiceOptions(Array.isArray(serviceData) ? serviceData : [])
        setForm((current) => ({ ...current, pricePolicyId: current.pricePolicyId || nextPolicies[0]?.id || '' }))
      })
      .catch(() => setError('Không thể tải dữ liệu đặt phòng.'))
      .finally(() => setLoadingMeta(false))
  }, [])

  const selectedPolicy = policies.find((policy) => String(policy.id) === String(form.pricePolicyId))
  const overlappingSlot = useMemo(
    () => findOverlappingBusySlot(room.busySlots, form.checkInTarget, form.checkOutTarget),
    [form.checkInTarget, form.checkOutTarget, room.busySlots]
  )
  const serviceTotal = selectedServices.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  const roomPrice = useMemo(() => {
    if (!selectedPolicy || !room?.prices) return 0
    const isWeekend = [0, 6].includes(new Date(form.checkInTarget).getDay())
    const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY'
    const price = room.prices.find((item) =>
      String(item.rentType).toUpperCase() === String(selectedPolicy.rentType).toUpperCase()
      && String(item.policyName) === String(selectedPolicy.policyName)
      && String(item.dayType).toUpperCase() === dayType
    )
    return Number(price?.price || 0)
  }, [form.checkInTarget, room?.prices, selectedPolicy])

  const addService = () => {
    const option = serviceOptions.find((item) => `${item.type}-${item.id}` === serviceForm.optionKey)
    if (!option) return
    const quantity = Number(serviceForm.quantity || 1)
    setSelectedServices((current) => {
      const existing = current.find((item) => item.type === option.type && item.serviceId === option.id)
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...current, {
        type: option.type,
        serviceId: option.id,
        name: option.name,
        price: option.price,
        quantity,
      }]
    })
    setServiceForm({ optionKey: '', quantity: 1 })
  }

  const submit = (event) => {
    event.preventDefault()
    const token = getStoredToken()
    if (!token) {
      window.location.assign('/login')
      return
    }

    setSubmitting(true)
    setError('')
    if (overlappingSlot) {
      setSubmitting(false)
      setError(`Khung giờ này đã được đặt trước: ${formatBusyDateRange(overlappingSlot)}, ${formatBusyTimeRange(overlappingSlot)}.`)
      return
    }
    fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        roomId: room.roomId,
        pricePolicyId: Number(form.pricePolicyId),
        numberOfAdults: Number(form.numberOfAdults),
        numberOfChildren: Number(form.numberOfChildren),
        services: selectedServices.map((item) => ({
          type: item.type,
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tạo đơn đặt phòng.')
        return data
      })
      .then((data) => {
        if (data.requiresDeposit) {
          setPaymentSummary(data)
        } else {
          onCreated(data)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  if (paymentSummary) {
    return (
      <div className="public-booking-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="public-booking-modal public-payment-summary">
          <div className="public-booking-head">
            <div>
              <h2>Tóm tắt đơn đặt phòng</h2>
              <p>Booking #{paymentSummary.bookingId} · Phòng {paymentSummary.roomNumber}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng">×</button>
          </div>

          <div className="public-payment-body">
            <div className="public-payment-status">
              <strong>Cần thanh toán trước</strong>
              <span>{formatMoney(paymentSummary.depositAmount)}</span>
              <p>
                {paymentSummary.depositCalculationType === 'PERCENTAGE'
                  ? `${Number(paymentSummary.depositPolicyValue || 0)}% tổng giá trị đơn`
                  : paymentSummary.depositPolicyName}
              </p>
            </div>

            <div className="public-payment-grid">
              <div><span>Nhận phòng</span><strong>{formatBusyDate(paymentSummary.checkInTarget)} · {formatBusyTime(paymentSummary.checkInTarget)}</strong></div>
              <div><span>Trả phòng</span><strong>{formatBusyDate(paymentSummary.checkOutTarget)} · {formatBusyTime(paymentSummary.checkOutTarget)}</strong></div>
              <div><span>Tiền phòng</span><strong>{formatMoney(paymentSummary.roomCharge)}</strong></div>
              <div><span>Dịch vụ</span><strong>{formatMoney(paymentSummary.serviceCharge)}</strong></div>
              <div><span>Tổng tạm tính</span><strong>{formatMoney(paymentSummary.totalAmount)}</strong></div>
              <div><span>Trạng thái</span><strong>Chờ thanh toán</strong></div>
            </div>
          </div>

          <div className="public-booking-actions">
            <button type="button" onClick={() => onCreated(paymentSummary)}>Để sau</button>
            <button type="button">Thanh toán</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="public-booking-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="public-booking-modal" onSubmit={submit}>
        <div className="public-booking-head">
          <div>
            <h2>Đặt phòng trực tiếp</h2>
            <p>Phòng {room.roomNumber} · {room.roomTypeName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="public-booking-body">
          <section>
            <h3>Thông tin khách hàng</h3>
            <div className="public-booking-grid">
              <label><span>Họ tên</span><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              <label><span>Số điện thoại</span><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label><span>Ngày sinh</span><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
              <label className="public-booking-wide"><span>Địa chỉ</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            </div>
          </section>

          <section>
            <h3>Thông tin đặt phòng</h3>
            <div className="public-booking-grid">
              <label><span>Nhận phòng dự kiến</span><input type="datetime-local" required value={form.checkInTarget} onChange={(e) => setForm({ ...form, checkInTarget: e.target.value })} /></label>
              <label><span>Trả phòng dự kiến</span><input type="datetime-local" required value={form.checkOutTarget} onChange={(e) => setForm({ ...form, checkOutTarget: e.target.value })} /></label>
              <label className="public-booking-wide"><span>Gói thuê</span><select required value={form.pricePolicyId} onChange={(e) => setForm({ ...form, pricePolicyId: e.target.value })}>
                {policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.policyName}</option>)}
              </select></label>
              <label><span>Người lớn</span><input type="number" min="1" max={room.maxAdults || undefined} value={form.numberOfAdults} onChange={(e) => setForm({ ...form, numberOfAdults: e.target.value })} /></label>
              <label><span>Trẻ em</span><input type="number" min="0" max={room.maxChildren || undefined} value={form.numberOfChildren} onChange={(e) => setForm({ ...form, numberOfChildren: e.target.value })} /></label>
            </div>
          </section>

          <section>
            <h3>Dịch vụ đi kèm</h3>
            <div className="public-service-add">
              <select value={serviceForm.optionKey} onChange={(e) => setServiceForm({ ...serviceForm, optionKey: e.target.value })}>
                <option value="">Chọn dịch vụ</option>
                {serviceOptions.map((service) => (
                  <option key={`${service.type}-${service.id}`} value={`${service.type}-${service.id}`}>
                    {service.name} · {formatMoney(service.price)}
                  </option>
                ))}
              </select>
              <input type="number" min="1" value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: e.target.value })} />
              <button type="button" onClick={addService} disabled={!serviceForm.optionKey}>Thêm</button>
            </div>
            <div className="public-service-list">
              {selectedServices.length ? selectedServices.map((service) => (
                <div key={`${service.type}-${service.serviceId}`}>
                  <span>{service.name} × {service.quantity}</span>
                  <strong>{formatMoney(Number(service.price) * service.quantity)}</strong>
                  <button type="button" onClick={() => setSelectedServices((current) => current.filter((item) => item !== service))}>×</button>
                </div>
              )) : <p>Chưa chọn dịch vụ đi kèm.</p>}
            </div>
          </section>
        </div>

        {error && <div className="public-booking-error">{error}</div>}
        {overlappingSlot && (
          <div className="public-booking-warning">
            Khung giờ này đã được đặt trước: {formatBusyDateRange(overlappingSlot)}, {formatBusyTimeRange(overlappingSlot)}.
          </div>
        )}
        {loadingMeta && <div className="public-booking-error">Đang tải thông tin đặt phòng...</div>}

        <div className="public-booking-summary">
          <span>Tiền phòng: <strong>{formatMoney(roomPrice)}</strong></span>
          <span>Dịch vụ: <strong>{formatMoney(serviceTotal)}</strong></span>
          <span>Tổng tạm tính: <strong>{formatMoney(roomPrice + serviceTotal)}</strong></span>
        </div>

        <div className="public-booking-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="submit" disabled={submitting || loadingMeta || Boolean(overlappingSlot)}>{submitting ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}</button>
        </div>
      </form>
    </div>
  )
}

function RoomDetailPage({ roomId }) {
  const today = useMemo(() => new Date(), [])
  const [fromDate, setFromDate] = useState(formatDateInput(today))
  const [toDate, setToDate] = useState(formatDateInput(addDays(today, 14)))
  const [room, setRoom] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams({ fromDate, toDate })
    setLoading(true)
    setError('')
    fetch(`${API_BASE_URL}/rooms/${roomId}?${params}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết phòng.')
        setRoom(data)
        setSelectedImage(data.primaryImageUrl || data.imageUrls?.[0] || '')
      })
      .catch((err) => {
        setRoom(null)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [roomId, fromDate, toDate])

  const imageUrls = room?.imageUrls?.length ? room.imageUrls : []
  const groupedSlots = useMemo(() => groupSlotsByDate(room?.busySlots || []), [room])
  const groupedPrices = useMemo(() => groupPrices(room?.prices || []), [room])

  return (
    <div className="rooms-page room-detail-page">
      <PublicHeader />

      <main className="room-detail-main">
        <a className="room-back-link" href="/rooms">← Quay lại danh sách phòng</a>

        {loading ? (
          <div className="rooms-state">Đang tải chi tiết phòng...</div>
        ) : error ? (
          <div className="rooms-state rooms-state-error">{error}</div>
        ) : room ? (
          <>
            <section className="room-detail-heading">
              <div>
                <p>{room.roomTypeName}</p>
                <h1>Phòng {room.roomNumber}</h1>
              </div>
              <div className="room-detail-rating">★ 4.9</div>
            </section>

            <section className="room-detail-layout">
              <aside className="room-detail-media-panel" aria-label="Ảnh phòng">
                <div className="room-detail-main-photo">
                  {selectedImage ? (
                    <img src={resolveImageUrl(selectedImage)} alt={`Phòng ${room.roomNumber}`} />
                  ) : (
                    <div>Home Stays</div>
                  )}
                </div>
                <div className="room-detail-thumbs">
                  {imageUrls.slice(0, 6).map((url) => (
                    <button
                      key={url}
                      type="button"
                      className={selectedImage === url ? 'room-thumb-active' : ''}
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={resolveImageUrl(url)} alt="Ảnh phòng" />
                    </button>
                  ))}
                </div>
                <section className="room-info-section">
                  <h2>Thông tin phòng</h2>
                  <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
                  <div className="room-info-chips">
                    <span>{room.maxAdults || 0} người lớn</span>
                    <span>{room.maxChildren || 0} trẻ em</span>
                    <span>Phòng {room.roomNumber}</span>
                    <span className={room.depositPolicyId ? 'room-deposit-chip' : 'room-deposit-chip room-deposit-chip--free'}>
                      {depositText(room)}
                    </span>
                  </div>
                </section>
              </aside>

              <div className="room-detail-content">
                <section className="room-booking-panel">
                  <div className="room-booking-head">
                    <div>
                      <h2>Lịch phòng đã đặt</h2>
                      <p>Chọn khoảng ngày để kiểm tra các khung giờ bận trước khi đặt theo combo hoặc theo giờ.</p>
                    </div>
                    <button className="room-detail-cta" type="button" onClick={() => setBookingModalOpen(true)}>
                      Chọn lịch đặt phòng
                    </button>
                  </div>

                  <div className="room-date-fields">
                    <label>
                      <span>Từ ngày</span>
                      <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                    </label>
                    <label>
                      <span>Đến ngày</span>
                      <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                    </label>
                  </div>

                  <div className="room-busy-list">
                    {Object.keys(groupedSlots).length ? (
                      Object.entries(groupedSlots).map(([date, slots]) => (
                        <div className="room-busy-day" key={date}>
                          <h3>{date}</h3>
                          <div className="room-busy-slots">
                            {slots.map((slot) => (
                              <div className="room-busy-slot" key={slot.bookingDetailId}>
                                <div className="room-busy-slot-main">
                                  <span>{formatBusyDateRange(slot)}</span>
                                  <em>{formatBusyTimeRange(slot)}</em>
                                </div>
                                <strong>Đã đặt</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="room-free-state">
                        Chưa có khung giờ đã đặt trong khoảng ngày này.
                      </div>
                    )}
                  </div>
                </section>

                <section className="room-info-section room-price-section">
                  <h2>Bảng giá theo gói</h2>
                  <div className="room-price-grid">
                    {groupedPrices.map((price) => (
                      <article className="room-price-card" key={`${price.policyName}-${price.rentType}`}>
                        <span>{rentTypeLabel(price.rentType)}</span>
                        <h3>{price.policyName}</h3>
                        <div className="room-price-lines">
                          <div>
                            <p>Ngày thường</p>
                            <strong>{formatMoney(price.weekdayPrice)}</strong>
                          </div>
                          <div>
                            <p>Cuối tuần</p>
                            <strong>{formatMoney(price.weekendPrice)}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            {createdBooking && (
              <div className={`room-created-toast${createdBooking.requiresDeposit ? ' room-created-toast--pending' : ''}`}>
                {createdBooking.requiresDeposit
                  ? `Đã lưu đơn đặt phòng #${createdBooking.bookingId}. Đơn đang chờ thanh toán trước.`
                  : `Đã tạo đơn đặt phòng #${createdBooking.bookingId}. Trạng thái: đặt phòng thành công.`}
              </div>
            )}

            {bookingModalOpen && (
              <BookingModal
                room={room}
                onClose={() => setBookingModalOpen(false)}
                onCreated={(booking) => {
                  setCreatedBooking(booking)
                  setBookingModalOpen(false)
                }}
              />
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

export default RoomDetailPage
