import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { clearBookingCart, readBookingCart, writeBookingCart } from '../../utils/bookingCart'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './RoomsPage.css'
import './RoomDetailPage.css'

const API_BASE_URL = 'http://localhost:8080/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function roomPrice(room) {
  return Number(room.price ?? room.weekdayPrice ?? room.weekendPrice ?? 0)
}

function toDateTimeLocal(date = new Date()) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hour = String(value.getHours()).padStart(2, '0')
  const minute = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function dateKeyToDateTimeLocal(dateKey, hour) {
  return dateKey ? `${dateKey}T${String(hour).padStart(2, '0')}:00` : ''
}

function defaultCheckInValue() {
  const date = new Date()
  date.setHours(Math.max(13, date.getHours() + 1), 0, 0, 0)
  return toDateTimeLocal(date)
}

function defaultCheckOutValue(checkInValue) {
  const date = new Date(checkInValue)
  date.setDate(date.getDate() + 1)
  date.setHours(12, 0, 0, 0)
  return toDateTimeLocal(date)
}

function parseSearchCriteria() {
  const params = new URLSearchParams(window.location.search)
  const checkInDate = params.get('checkInDate')
  const checkOutDate = params.get('checkOutDate')
  if (!checkInDate || !checkOutDate) return null
  return {
    checkInDate,
    checkOutDate,
    rooms: Number(params.get('rooms') || 1),
    adults: Number(params.get('adults') || 1),
    children: Number(params.get('children') || 0),
    focusRoomId: params.get('focusRoomId'),
  }
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: 'đêm',
    NIGHTLY: 'đêm',
    BY_NIGHT: 'đêm',
    DAILY: 'ngày',
    BY_DAY: 'ngày',
    HOURLY: 'giờ',
    COMBO: 'combo',
  }
  return labels[String(rentType || '').toUpperCase()] || 'đêm'
}

function depositLabel(room) {
  if (!room.depositPolicyId) return 'Không cần thanh toán trước'
  if (String(room.depositCalculationType || '').toUpperCase() === 'PERCENTAGE') {
    return `Thanh toán trước ${Number(room.depositPolicyValue || 0)}%`
  }
  return `Thanh toán trước ${formatPrice(room.depositPolicyValue)}`
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
        <a href="/rooms" className="home-nav-active">Phòng</a>
        <a href="/home#amenities">Tiện nghi</a>
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

function RoomCard({ room, selected, onToggle }) {
  const title = `${room.roomTypeName || 'Phòng'} ${room.roomNumber || ''}`.trim()
  const imageUrl = room.primaryImageUrl || room.imageUrls?.[0]
  const price = roomPrice(room)

  return (
    <article className={`public-room-card${selected ? ' is-selected' : ''}`}>
      <a className="public-room-card-link" href={`/rooms/${room.roomId}${window.location.search || ''}`}>
        <div className="public-room-photo">
          {imageUrl ? (
            <img src={resolveImageUrl(imageUrl)} alt={title} loading="lazy" />
          ) : (
            <div className="public-room-photo-empty">Home Stays</div>
          )}
          <span className="public-room-badge">Phòng {room.roomNumber}</span>
        </div>
      </a>
      <div className="public-room-body">
        <div className="public-room-title-row">
          <h3>{title}</h3>
          <span>4.9</span>
        </div>
        <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
        <div className="public-room-meta">
          <span>{room.maxAdults || 0} người lớn</span>
          <span>{room.maxChildren || 0} trẻ em</span>
        </div>
        <div className="public-room-price-row">
          <strong>{formatPrice(price)}</strong>
          <span>/{rentTypeLabel(room.rentType)}</span>
        </div>
        {room.weekendPrice && room.weekendPrice !== room.weekdayPrice && (
          <div className="public-room-weekend">Cuối tuần: {formatPrice(room.weekendPrice)}</div>
        )}
        {room.depositPolicyId && (
          <div className="public-room-deposit">{depositLabel(room)}</div>
        )}
        <div className="public-room-actions">
          <a href={`/rooms/${room.roomId}${window.location.search || ''}`}>Xem chi tiết</a>
          <button type="button" className={selected ? 'is-selected' : ''} onClick={() => onToggle(room)}>
            {selected ? 'Bỏ chọn' : 'Chọn phòng'}
          </button>
        </div>
      </div>
    </article>
  )
}
export function MultiBookingModal({ selectedRooms, criteria, onClose, onCreated }) {
  const currentUser = getStoredUser()
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    checkInTarget: criteria?.checkInDate ? dateKeyToDateTimeLocal(criteria.checkInDate, 13) : defaultCheckInValue(),
    checkOutTarget: criteria?.checkOutDate ? dateKeyToDateTimeLocal(criteria.checkOutDate, 12) : '',
    pricePolicyId: '',
  })
  const [roomGuests, setRoomGuests] = useState(() => Object.fromEntries(selectedRooms.map((room) => [
    String(room.roomId),
    {
      numberOfAdults: Math.max(1, Math.min(Number(room.maxAdults || 1), Math.ceil(Number(criteria?.adults || 1) / Math.max(1, selectedRooms.length)))),
      numberOfChildren: Math.max(0, Math.min(Number(room.maxChildren || 0), Math.ceil(Number(criteria?.children || 0) / Math.max(1, selectedRooms.length)))),
    },
  ])))
  const [policies, setPolicies] = useState([])
  const [serviceOptions, setServiceOptions] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [serviceForm, setServiceForm] = useState({ optionKey: '', quantity: 1 })
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentSummary, setPaymentSummary] = useState(null)

  useEffect(() => {
    if (form.checkOutTarget) return
    setForm((current) => ({ ...current, checkOutTarget: defaultCheckOutValue(current.checkInTarget) }))
  }, [form.checkInTarget, form.checkOutTarget])

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

  const roomTotal = selectedRooms.reduce((sum, room) => sum + roomPrice(room), 0)
  const serviceTotal = selectedServices.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  const invalidDate = form.checkInTarget && form.checkOutTarget && new Date(form.checkOutTarget) <= new Date(form.checkInTarget)

  const updateRoomGuest = (roomId, field, value) => {
    setRoomGuests((current) => ({
      ...current,
      [String(roomId)]: { ...current[String(roomId)], [field]: Number(value) },
    }))
  }

  const addService = () => {
    const option = serviceOptions.find((item) => `${item.type}-${item.id}` === serviceForm.optionKey)
    if (!option) return
    const quantity = Number(serviceForm.quantity || 1)
    setSelectedServices((current) => {
      const existing = current.find((item) => item.type === option.type && item.serviceId === option.id)
      if (existing) {
        return current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item)
      }
      return [...current, { type: option.type, serviceId: option.id, name: option.name, price: option.price, quantity }]
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
    if (invalidDate) {
      setError('Giờ trả phòng phải sau giờ nhận phòng. Vui lòng chọn lại.')
      return
    }

    setSubmitting(true)
    setError('')
    fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        roomId: selectedRooms[0]?.roomId,
        pricePolicyId: Number(form.pricePolicyId),
        numberOfAdults: roomGuests[String(selectedRooms[0]?.roomId)]?.numberOfAdults || 1,
        numberOfChildren: roomGuests[String(selectedRooms[0]?.roomId)]?.numberOfChildren || 0,
        rooms: selectedRooms.map((room) => ({
          roomId: room.roomId,
          numberOfAdults: Number(roomGuests[String(room.roomId)]?.numberOfAdults || 1),
          numberOfChildren: Number(roomGuests[String(room.roomId)]?.numberOfChildren || 0),
        })),
        services: selectedServices.map((item) => ({ type: item.type, serviceId: item.serviceId, quantity: item.quantity })),
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tạo đơn đặt phòng.')
        return data
      })
      .then((data) => {
        if (data.requiresDeposit) setPaymentSummary(data)
        else onCreated(data)
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
              <p>Booking #{paymentSummary.bookingId} · {paymentSummary.rooms?.length || selectedRooms.length} phòng</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng">×</button>
          </div>
          <div className="public-payment-body">
            <div className="public-payment-status">
              <strong>Cần thanh toán trước</strong>
              <span>{formatPrice(paymentSummary.depositAmount)}</span>
              <p>{paymentSummary.depositCalculationType === 'PERCENTAGE' ? `${Number(paymentSummary.depositPolicyValue || 0)}% tổng giá trị đơn` : paymentSummary.depositPolicyName}</p>
            </div>
            <div className="multi-payment-room-list">
              {(paymentSummary.rooms || []).map((room) => (
                <div key={room.bookingDetailId}>
                  <span>Phòng {room.roomNumber} · {room.roomTypeName}</span>
                  <strong>{formatPrice(room.priceAtBooking)}</strong>
                </div>
              ))}
            </div>
            <div className="public-payment-grid">
              <div><span>Tiền phòng</span><strong>{formatPrice(paymentSummary.roomCharge)}</strong></div>
              <div><span>Dịch vụ</span><strong>{formatPrice(paymentSummary.serviceCharge)}</strong></div>
              <div><span>Tổng tạm tính</span><strong>{formatPrice(paymentSummary.totalAmount)}</strong></div>
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
      <form className="public-booking-modal multi-booking-modal" onSubmit={submit}>
        <div className="public-booking-head">
          <div>
            <h2>Đặt nhiều phòng</h2>
            <p>{selectedRooms.length} phòng trong cùng một booking</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="public-booking-body multi-booking-body">
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
            <h3>Thời gian và gói thuê</h3>
            {criteria && <p className="public-booking-search-note">Đã lấy từ tìm kiếm: {criteria.rooms} phòng · {criteria.adults} người lớn · {criteria.children} trẻ em</p>}
            <div className="public-booking-grid">
              <label><span>Nhận phòng</span><input type="datetime-local" required value={form.checkInTarget} onChange={(e) => setForm({ ...form, checkInTarget: e.target.value })} /></label>
              <label><span>Trả phòng</span><input type="datetime-local" required value={form.checkOutTarget} onChange={(e) => setForm({ ...form, checkOutTarget: e.target.value })} /></label>
              <label className="public-booking-wide"><span>Gói thuê</span><select required value={form.pricePolicyId} onChange={(e) => setForm({ ...form, pricePolicyId: e.target.value })}>{policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.policyName}</option>)}</select></label>
            </div>
          </section>

          <section className="multi-selected-section">
            <h3>Phòng trong booking này</h3>
            <div className="multi-selected-rooms">
              {selectedRooms.map((room) => (
                <article key={room.roomId}>
                  <div>
                    <strong>Phòng {room.roomNumber}</strong>
                    <span>{room.roomTypeName} · tối đa {room.maxAdults || 0} NL · {room.maxChildren || 0} TE</span>
                  </div>
                  <b>{formatPrice(roomPrice(room))}</b>
                  <label><span>Người lớn</span><input type="number" min="1" max={room.maxAdults || undefined} value={roomGuests[String(room.roomId)]?.numberOfAdults || 1} onChange={(e) => updateRoomGuest(room.roomId, 'numberOfAdults', e.target.value)} /></label>
                  <label><span>Trẻ em</span><input type="number" min="0" max={room.maxChildren || undefined} value={roomGuests[String(room.roomId)]?.numberOfChildren || 0} onChange={(e) => updateRoomGuest(room.roomId, 'numberOfChildren', e.target.value)} /></label>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>Dịch vụ đi kèm</h3>
            <div className="public-service-add">
              <select value={serviceForm.optionKey} onChange={(e) => setServiceForm({ ...serviceForm, optionKey: e.target.value })}>
                <option value="">Chọn dịch vụ</option>
                {serviceOptions.map((service) => <option key={`${service.type}-${service.id}`} value={`${service.type}-${service.id}`}>{service.name} · {formatPrice(service.price)}</option>)}
              </select>
              <input type="number" min="1" value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: e.target.value })} />
              <button type="button" onClick={addService} disabled={!serviceForm.optionKey}>Thêm</button>
            </div>
            <div className="public-service-list">
              {selectedServices.length ? selectedServices.map((service) => (
                <div key={`${service.type}-${service.serviceId}`}>
                  <span>{service.name} × {service.quantity}</span>
                  <strong>{formatPrice(Number(service.price) * service.quantity)}</strong>
                  <button type="button" onClick={() => setSelectedServices((current) => current.filter((item) => item !== service))}>×</button>
                </div>
              )) : <p>Chưa chọn dịch vụ đi kèm.</p>}
            </div>
          </section>
        </div>

        {error && <div className="public-booking-error">{error}</div>}
        {invalidDate && <div className="public-booking-warning">Giờ trả phòng phải sau giờ nhận phòng.</div>}
        {loadingMeta && <div className="public-booking-error">Đang tải thông tin đặt phòng...</div>}

        <div className="public-booking-summary">
          <span>Tiền phòng: <strong>{formatPrice(roomTotal)}</strong></span>
          <span>Dịch vụ: <strong>{formatPrice(serviceTotal)}</strong></span>
          <span>Tổng tạm tính: <strong>{formatPrice(roomTotal + serviceTotal)}</strong></span>
        </div>

        <div className="public-booking-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="submit" disabled={submitting || loadingMeta || invalidDate}>{submitting ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}</button>
        </div>
      </form>
    </div>
  )
}

function BookingCart({ selectedRooms, requestedRooms, onRemove, onOpenBooking }) {
  const total = selectedRooms.reduce((sum, room) => sum + roomPrice(room), 0)
  const isEnough = selectedRooms.length >= requestedRooms

  return (
    <aside className="rooms-booking-cart" aria-label="Booking của bạn">
      <div className="rooms-booking-cart-head">
        <div>
          <h2>Booking của bạn</h2>
          <p>Đã chọn {selectedRooms.length}/{requestedRooms} phòng</p>
        </div>
        <span className={isEnough ? 'is-ready' : ''}>{isEnough ? 'Đủ phòng' : 'Chưa đủ'}</span>
      </div>
      <div className="rooms-booking-cart-list">
        {selectedRooms.length ? selectedRooms.map((room) => (
          <div key={room.roomId}>
            <span>Phòng {room.roomNumber} · {room.roomTypeName}</span>
            <strong>{formatPrice(roomPrice(room))}</strong>
            <button type="button" onClick={() => onRemove(room.roomId)} aria-label="Bỏ phòng">×</button>
          </div>
        )) : <p>Chọn phòng từ danh sách để tạo booking nhiều phòng.</p>}
      </div>
      <div className="rooms-booking-cart-total">
        <span>Tạm tính</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button type="button" disabled={!selectedRooms.length} onClick={onOpenBooking}>Tiếp tục đặt phòng</button>
    </aside>
  )
}
function RoomsPage() {
  const searchCriteria = useMemo(() => parseSearchCriteria(), [])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [maxPrice, setMaxPrice] = useState(10000000)
  const [selectedRooms, setSelectedRooms] = useState(() => readBookingCart())
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)
  const [focusRoomApplied, setFocusRoomApplied] = useState(() => readBookingCart().length > 0)

  useEffect(() => {
    const params = searchCriteria ? new URLSearchParams({
      checkInDate: searchCriteria.checkInDate,
      checkOutDate: searchCriteria.checkOutDate,
      rooms: String(searchCriteria.rooms),
      adults: String(searchCriteria.adults),
      children: String(searchCriteria.children),
    }) : null
    const url = params ? `${API_BASE_URL}/rooms/search?${params}` : `${API_BASE_URL}/rooms`

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const nextRooms = Array.isArray(data) ? data : []
        setRooms(nextRooms)
        const highest = Math.max(...nextRooms.map((room) => roomPrice(room)), 0)
        setMaxPrice(Math.max(highest, 100000))
      })
      .catch(() => setError('Không thể tải danh sách phòng.'))
      .finally(() => setLoading(false))
  }, [searchCriteria])

  useEffect(() => {
    if (!searchCriteria?.focusRoomId || !rooms.length || selectedRooms.length || focusRoomApplied) return
    const focusedRoom = rooms.find((room) => String(room.roomId) === String(searchCriteria.focusRoomId))
    if (focusedRoom) {
      setSelectedRooms([focusedRoom])
      setFocusRoomApplied(true)
    }
  }, [focusRoomApplied, rooms, searchCriteria, selectedRooms.length])

  useEffect(() => {
    writeBookingCart(selectedRooms)
  }, [selectedRooms])

  const highestPrice = useMemo(() => {
    const highest = Math.max(...rooms.map((room) => roomPrice(room)), 0)
    return Math.max(highest, 100000)
  }, [rooms])

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        const price = roomPrice(room)
        const matchesPrice = price <= maxPrice
        return matchesPrice
      })
      .sort((a, b) => roomPrice(a) - roomPrice(b))
  }, [rooms, maxPrice])

  const requestedRooms = searchCriteria?.rooms || Math.max(1, selectedRooms.length || 1)
  const selectedRoomIds = useMemo(() => new Set(selectedRooms.map((room) => String(room.roomId))), [selectedRooms])

  const toggleRoom = (room) => {
    setSelectedRooms((current) => {
      if (current.some((item) => String(item.roomId) === String(room.roomId))) {
        return current.filter((item) => String(item.roomId) !== String(room.roomId))
      }
      return [...current, room]
    })
  }

  const removeRoom = (roomId) => {
    setSelectedRooms((current) => current.filter((room) => String(room.roomId) !== String(roomId)))
  }

  return (
    <div className="rooms-page">
      <PublicHeader />

      <main>
        <div className="rooms-shell">
          <aside className="rooms-sidebar" aria-label="Bộ lọc phòng">
            <BookingCart
              selectedRooms={selectedRooms}
              requestedRooms={requestedRooms}
              onRemove={removeRoom}
              onOpenBooking={() => setBookingModalOpen(true)}
            />

            <div className="rooms-amenities-card" aria-label="Tiện ích nổi bật">
              <h2>Tiện ích phòng</h2>
              <div className="rooms-amenities-list">
                <div>
                  <span className="rooms-amenity-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14M6 19v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                  </span>
                  <strong>Để xe tầng 1, thang máy</strong>
                </div>
                <div>
                  <span className="rooms-amenity-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 17v2M17 17v2M8 11h8"/></svg>
                  </span>
                  <strong>Nệm dưới, gác xép</strong>
                </div>
                <div>
                  <span className="rooms-amenity-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m10 10 5 2-5 2z"/></svg>
                  </span>
                  <strong>Máy chiếu Netflix</strong>
                </div>
                <div>
                  <span className="rooms-amenity-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h6"/></svg>
                  </span>
                  <strong>Bếp đủ đồ, tủ lạnh</strong>
                </div>
                <div>
                  <span className="rooms-amenity-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="8" rx="2"/><path d="M7 17h10M8 13v3M16 13v3"/></svg>
                  </span>
                  <strong>Điều hòa, nóng lạnh</strong>
                </div>
              </div>
            </div>

            <div className="rooms-toolbar">
              <label className="rooms-price-filter">
                <span>Giá tối đa: {formatPrice(maxPrice)}</span>
                <input
                  type="range"
                  min="0"
                  max={highestPrice}
                  step="50000"
                  value={Math.min(maxPrice, highestPrice)}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </label>
            </div>
          </aside>

          <section className="rooms-results-panel">
            <div className="rooms-results-head">
              <div>
                <h2>{searchCriteria ? 'Phòng trống phù hợp' : 'Tất cả phòng'}</h2>
                <p>
                  {searchCriteria
                    ? `Từ ${searchCriteria.checkInDate} đến ${searchCriteria.checkOutDate} · cần ${searchCriteria.rooms} phòng`
                    : 'Sắp xếp giá thấp lên trước.'}
                </p>
              </div>
              <span>{visibleRooms.length} phù hợp</span>
            </div>

            {loading ? (
              <div className="rooms-state">Đang tải danh sách phòng...</div>
            ) : error ? (
              <div className="rooms-state rooms-state-error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="public-rooms-grid" aria-label="Danh sách phòng">
                {visibleRooms.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    selected={selectedRoomIds.has(String(room.roomId))}
                    onToggle={toggleRoom}
                  />
                ))}
              </div>
            ) : (
              <div className="rooms-state">Không tìm thấy phòng phù hợp với bộ lọc hiện tại.</div>
            )}
          </section>
        </div>

        {createdBooking && (
          <div className={`room-created-toast${createdBooking.requiresDeposit ? ' room-created-toast--pending' : ''}`}>
            {createdBooking.requiresDeposit
              ? `Đã lưu booking #${createdBooking.bookingId}. Đơn đang chờ thanh toán trước.`
              : `Đã tạo booking #${createdBooking.bookingId}. Trạng thái: đặt phòng thành công.`}
          </div>
        )}

        {bookingModalOpen && (
          <MultiBookingModal
            selectedRooms={selectedRooms}
            criteria={searchCriteria}
            onClose={() => setBookingModalOpen(false)}
            onCreated={(booking) => {
              setCreatedBooking(booking)
              setBookingModalOpen(false)
              setSelectedRooms([])
              clearBookingCart()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default RoomsPage


