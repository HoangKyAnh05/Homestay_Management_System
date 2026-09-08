import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import { clearBookingCart, readBookingCart } from '../../utils/bookingCart'
import { formatClockTime, formatVietnameseDate } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import { MultiBookingModal } from './RoomsPage'
import '../Home/HomePage.css'
import './RoomsPage.css'
import './RoomDetailPage.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

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

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function depositText(room) {
  if (!room?.depositPolicyId) return 'Không cần thanh toán trước'
  if (String(room.depositCalculationType || '').toUpperCase() === 'PERCENTAGE') {
    return `Cần thanh toán trước ${Number(room.depositPolicyValue || 0)}%`
  }
  return `Cần thanh toán trước ${formatMoney(room.depositPolicyValue)}`
}

function formatDateTime(value, options) {
  return formatVietnameseDate(value, options)
}

function formatBusyDate(value) {
  const date = new Date(value)
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  return `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatBusyTime(value) {
  return formatClockTime(value)
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
    OVERNIGHT: '2 ngày 1 đêm',
    NIGHTLY: '2 ngày 1 đêm',
    BY_NIGHT: '2 ngày 1 đêm',
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

function dateKeyToDateTimeLocal(dateKey, hour, minute = 0) {
  if (!dateKey) return ''
  return `${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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

function nowDateTimeLocalMin() {
  const now = new Date()
  now.setSeconds(0, 0)
  return toDateTimeLocalValue(now)
}

function roomDetailToCartRoom(room) {
  const weekdayPrice = room?.prices?.find((price) => String(price.dayType || '').toUpperCase() === 'WEEKDAY')?.price
  const weekendPrice = room?.prices?.find((price) => String(price.dayType || '').toUpperCase() === 'WEEKEND')?.price
  const firstPrice = room?.prices?.[0]
  return {
    roomId: null,
    quantity: 1,
    roomTypeId: room.roomTypeId,
    roomTypeName: room.roomTypeName,
    maxAdults: room.maxAdults,
    maxChildren: room.maxChildren,
    description: room.description,
    weekdayPrice: weekdayPrice ?? firstPrice?.price ?? 0,
    weekendPrice: weekendPrice ?? firstPrice?.price ?? 0,
    rentType: firstPrice?.rentType,
    depositPolicyId: room.depositPolicyId,
    depositPolicyName: room.depositPolicyName,
    depositCalculationType: room.depositCalculationType,
    depositPolicyValue: room.depositPolicyValue,
    primaryImageUrl: room.primaryImageUrl,
    imageUrls: room.imageUrls,
    prices: room.prices || [],
  }
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
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Komorebi Sanctuary">✨ Komorebi 3D</a>
        <a href="/rooms" className="home-nav-active">Phòng</a>
        <a href="/wishlist">Yêu thích</a>
        <a href="/amenities">Tiện nghi</a>
        <a href="/giveaway" title="Vòng quay may mắn & Nhận ưu đãi">Liên hệ</a>
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

function BookingModal({ room, initialBookingData, onClose, onCreated }) {
  const currentUser = getStoredUser()
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    identityDocumentNumber: currentUser?.identityDocumentNumber || '',
    checkInTarget: initialBookingData?.checkInTarget || defaultCheckInValue(),
    checkOutTarget: initialBookingData?.checkOutTarget || '',
    pricePolicyId: '',
    numberOfAdults: initialBookingData?.adults || 1,
    numberOfChildren: initialBookingData?.children || 0,
  })
  const [policies, setPolicies] = useState([])
  const [serviceOptions, setServiceOptions] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [serviceForm, setServiceForm] = useState({ optionKey: '', quantity: 1 })
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [sePayPayment, setSePayPayment] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const startPayment = () => {
    const token = getStoredToken()
    if (!paymentSummary) return
    const guestEmail = form.email.trim()
    setPaymentLoading(true)
    setError('')
    fetch(token
      ? `${API_BASE_URL}/payments/sepay/bookings/${paymentSummary.bookingId}`
      : `${API_BASE_URL}/payments/sepay/public/bookings/${paymentSummary.bookingId}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }),
      },
      ...(token ? {} : { body: JSON.stringify({ email: guestEmail }) }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tạo mã thanh toán SePay')
        return data
      })
      .then(setSePayPayment)
      .catch((err) => setError(err.message))
      .finally(() => setPaymentLoading(false))
  }

  useEffect(() => {
    if (initialBookingData?.checkOutTarget) return
    setForm((current) => ({
      ...current,
      checkOutTarget: defaultCheckOutValue(current.checkInTarget),
    }))
  }, [initialBookingData?.checkOutTarget])

  useEffect(() => {
    const token = getStoredToken()
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch(`${API_BASE_URL}/bookings/price-policies`, { headers: authHeaders }).then((res) => res.json()),
      fetch(`${API_BASE_URL}/bookings/services`, { headers: authHeaders }).then((res) => res.json()),
      token ? fetch(`${API_BASE_URL}/users/me`, { headers: authHeaders }).then((res) => {
        if (!res.ok) return null
        return res.json()
      }).catch(() => null) : Promise.resolve(null),
    ])
      .then(([policyData, serviceData, profileData]) => {
        const nextPolicies = Array.isArray(policyData) ? policyData : []
        setPolicies(nextPolicies)
        setServiceOptions(Array.isArray(serviceData) ? serviceData : [])
        setForm((current) => ({
          ...current,
          pricePolicyId: current.pricePolicyId || nextPolicies[0]?.id || '',
          ...(profileData ? {
            fullName: profileData.fullName || current.fullName,
            phone: profileData.phone || current.phone,
            email: profileData.email || current.email,
            address: profileData.address || current.address,
            dateOfBirth: profileData.dateOfBirth || current.dateOfBirth,
            identityDocumentNumber: profileData.identityDocumentNumber || current.identityDocumentNumber,
          } : {}),
        }))
      })
      .catch(() => setError('Không thể tải dữ liệu đặt phòng.'))
      .finally(() => setLoadingMeta(false))
  }, [])

  const selectedPolicy = policies.find((policy) => String(policy.id) === String(form.pricePolicyId)) || policies[0]
  const overlappingSlot = useMemo(
    () => findOverlappingBusySlot(room.busySlots, form.checkInTarget, form.checkOutTarget),
    [form.checkInTarget, form.checkOutTarget, room.busySlots]
  )
  const serviceTotal = selectedServices.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)

  const stayBreakdown = useMemo(() => {
    if (!form.checkInTarget || !form.checkOutTarget) return { totalNights: 1, weekdayNights: 1, weekendNights: 0 }
    const dIn = new Date(form.checkInTarget)
    const dOut = new Date(form.checkOutTarget)
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime()) || dOut <= dIn) {
      return { totalNights: 1, weekdayNights: 1, weekendNights: 0 }
    }
    let curr = new Date(dIn)
    curr.setHours(0, 0, 0, 0)
    const end = new Date(dOut)
    end.setHours(0, 0, 0, 0)
    if (end.getTime() <= curr.getTime()) {
      end.setDate(curr.getDate() + 1)
    }
    let weekdayNights = 0
    let weekendNights = 0
    while (curr.getTime() < end.getTime()) {
      const day = curr.getDay()
      if (day === 0 || day === 6) weekendNights++
      else weekdayNights++
      curr.setDate(curr.getDate() + 1)
    }
    return { totalNights: weekdayNights + weekendNights, weekdayNights, weekendNights }
  }, [form.checkInTarget, form.checkOutTarget])

  const roomPrice = useMemo(() => {
    if (!room) return 0
    const weekdayPrice = Number(
      room.weekdayPrice
      || room.price
      || room.prices?.find(p => String(p.dayType).toUpperCase() === 'WEEKDAY')?.price
      || 0
    )
    const weekendPrice = Number(
      room.weekendPrice
      || room.prices?.find(p => String(p.dayType).toUpperCase() === 'WEEKEND')?.price
      || weekdayPrice
    )
    return (stayBreakdown.weekdayNights * weekdayPrice) + (stayBreakdown.weekendNights * (weekendPrice > 0 ? weekendPrice : weekdayPrice))
  }, [room, stayBreakdown])

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

    if (!form.fullName?.trim()) {
      setError('Vui lòng nhập họ và tên khách hàng.')
      return
    }
    if (!form.phone?.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ.')
      return
    }
    const phoneDigits = form.phone.trim().replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('Số điện thoại không hợp lệ (phải bao gồm 10 chữ số, ví dụ: 0912345678).')
      return
    }
    if (!form.email?.trim()) {
      setError('Vui lòng nhập địa chỉ email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Địa chỉ email không đúng định dạng (ví dụ: khachhang@gmail.com).')
      return
    }
    if (!form.identityDocumentNumber?.trim()) {
      setError('Vui lòng nhập số Căn cước công dân (CCCD).')
      return
    }
    const idDigits = form.identityDocumentNumber.trim().replace(/\D/g, '')
    if (idDigits.length !== 12) {
      setError('Số Căn cước công dân (CCCD) phải bao gồm đúng 12 chữ số.')
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      <>
        <div className="public-booking-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
          <div className="public-booking-modal public-payment-summary">
          <div className="public-booking-head">
            <div>
              <h2>Tóm tắt đơn đặt phòng</h2>
              <p>Booking {bookingDisplay(paymentSummary)} · {houseTypeName(room)}</p>
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
              {Number(paymentSummary.roomDiscountAmount || 0) > 0 && (
                <>
                  <div><span>Tiền phòng gốc</span><strong>{formatMoney(paymentSummary.roomChargeBeforeDiscount)}</strong></div>
                  {Number(paymentSummary.memberDiscountAmount || 0) > 0 && (
                    <div><span>Ưu đãi thành viên {Number(paymentSummary.memberDiscountPercent || 0).toLocaleString('vi-VN')}%</span><strong>-{formatMoney(paymentSummary.memberDiscountAmount)}</strong></div>
                  )}
                  {Number(paymentSummary.roomDiscountAmount || 0) - Number(paymentSummary.memberDiscountAmount || 0) > 0 && (
                    <div><span>{paymentSummary.voucherCode ? `Voucher ${paymentSummary.voucherCode}` : 'Ưu đãi'}</span><strong>-{formatMoney(Number(paymentSummary.roomDiscountAmount || 0) - Number(paymentSummary.memberDiscountAmount || 0))}</strong></div>
                  )}
                </>
              )}
              <div><span>Tiền phòng</span><strong>{formatMoney(paymentSummary.roomCharge)}</strong></div>
              <div><span>Dịch vụ</span><strong>{formatMoney(paymentSummary.serviceCharge)}</strong></div>
              <div><span>Tổng tạm tính</span><strong>{formatMoney(paymentSummary.totalAmount)}</strong></div>
              <div><span>Trạng thái</span><strong>Chờ thanh toán</strong></div>
            </div>
          </div>

          <div className="public-booking-actions">
            {error && <span className="public-booking-error">{error}</span>}
            <button type="button" onClick={() => onCreated(paymentSummary)}>Để sau</button>
            <button type="button" disabled={paymentLoading} onClick={startPayment}>
              {paymentLoading ? 'Đang tạo QR...' : 'Thanh toán'}
            </button>
          </div>
        </div>
        </div>
        {sePayPayment && (
          <SePayQrPayment
            payment={sePayPayment}
            statusUrl={getStoredToken()
              ? `${API_BASE_URL}/bookings/my/${paymentSummary.bookingId}`
              : `${API_BASE_URL}/payments/sepay/public/bookings/${paymentSummary.bookingId}/status?email=${encodeURIComponent(form.email.trim())}`}
            headers={getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}}
            successStatus="CONFIRMED"
            onSuccess={(booking) => onCreated({ ...paymentSummary, ...booking, requiresDeposit: false })}
            onClose={() => setSePayPayment(null)}
          />
        )}
      </>
    )
  }

  return (
    <div className="public-booking-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="public-booking-modal" onSubmit={submit}>
        <div className="public-booking-head">
          <div>
            <h2>Đặt phòng trực tiếp</h2>
            <p>{houseTypeName(room)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="public-booking-body">
          <section>
            <h3>Thông tin khách hàng</h3>
            <div className="public-booking-grid">
              <label><span>Họ tên *</span><input required placeholder="VD: Nguyễn Văn An" value={form.fullName} onChange={(e) => { setError(''); setForm({ ...form, fullName: e.target.value }) }} /></label>
              <label><span>Số điện thoại *</span><input required placeholder="VD: 0912345678" value={form.phone} onChange={(e) => { setError(''); setForm({ ...form, phone: e.target.value.replace(/[^\d+]/g, '').slice(0, 11) }) }} /></label>
              <label><span>Email *</span><input type="email" required placeholder="VD: email@example.com" value={form.email} onChange={(e) => { setError(''); setForm({ ...form, email: e.target.value }) }} /></label>
              <label><span>Ngày sinh</span><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
              <label><span>Căn cước công dân *</span><input required maxLength={12} placeholder="Đủ 12 chữ số CCCD" value={form.identityDocumentNumber || ''} onChange={(e) => { setError(''); setForm({ ...form, identityDocumentNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }) }} /></label>
              <label className="public-booking-wide"><span>Địa chỉ</span><input placeholder="Địa chỉ thường trú" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            </div>
          </section>

          <section>
            <h3>Thông tin đặt phòng</h3>
            {initialBookingData?.checkInTarget && (
              <p className="public-booking-search-note">
                Đã lấy từ tìm kiếm: {initialBookingData.rooms} phòng · {initialBookingData.adults} người lớn · {initialBookingData.children} trẻ em
              </p>
            )}
            <div className="public-booking-grid">
              <label><span>Nhận phòng dự kiến</span><input type="datetime-local" required value={form.checkInTarget} min={nowDateTimeLocalMin()} onChange={(e) => {
                const value = e.target.value
                const now = new Date(); now.setSeconds(0, 0)
                if (value && new Date(value) < now) return
                setForm({ ...form, checkInTarget: value })
              }} /></label>
              <label><span>Trả phòng dự kiến</span><input type="datetime-local" required value={form.checkOutTarget} min={form.checkInTarget || nowDateTimeLocalMin()} onChange={(e) => {
                const value = e.target.value
                if (value && form.checkInTarget && new Date(value) <= new Date(form.checkInTarget)) return
                setForm({ ...form, checkOutTarget: value })
              }} /></label>
              <label><span>Người lớn</span><input type="number" min="1" max={room.maxAdults || undefined} value={form.numberOfAdults} onChange={(e) => setForm({ ...form, numberOfAdults: e.target.value })} /></label>
              <label><span>Trẻ em</span><input type="number" min="0" max={room.maxChildren || undefined} value={form.numberOfChildren} onChange={(e) => setForm({ ...form, numberOfChildren: e.target.value })} /></label>
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, color: '#334155', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📅</span>
              <span>
                Thời gian lưu trú: <strong>{stayBreakdown.totalNights === 1 ? '2 ngày 1 đêm' : `${stayBreakdown.totalNights + 1} ngày ${stayBreakdown.totalNights} đêm`}</strong>
                {stayBreakdown.weekendNights > 0 ? (
                  <span style={{ marginLeft: 6, color: '#64748b' }}>
                    ({stayBreakdown.weekdayNights} đêm thường + <strong style={{ color: '#ea580c' }}>{stayBreakdown.weekendNights} đêm Thứ 7/CN</strong>)
                  </span>
                ) : (
                  <span style={{ marginLeft: 6, color: '#64748b' }}>(Giá ngày thường)</span>
                )}
              </span>
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

        {error && (
          <div className="public-booking-error" style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 600, fontSize: 13, margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="public-booking-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="submit" disabled={submitting || loadingMeta}>{submitting ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}</button>
        </div>
      </form>
    </div>
  )
}

function RoomDetailPage({ roomId }) {
  const today = useMemo(() => new Date(), [])
  const initialSearchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const initialCheckInDate = initialSearchParams.get('checkInDate')
  const initialCheckOutDate = initialSearchParams.get('checkOutDate')
  const initialBookingData = useMemo(() => ({
    checkInTarget: initialCheckInDate ? dateKeyToDateTimeLocal(initialCheckInDate, 13) : '',
    checkOutTarget: initialCheckOutDate ? dateKeyToDateTimeLocal(initialCheckOutDate, 12) : '',
    adults: Number(initialSearchParams.get('adults') || 1),
    children: Number(initialSearchParams.get('children') || 0),
    rooms: Number(initialSearchParams.get('rooms') || 1),
  }), [initialCheckInDate, initialCheckOutDate, initialSearchParams])
  const [fromDate, setFromDate] = useState(initialCheckInDate || formatDateInput(today))
  const [toDate, setToDate] = useState(initialCheckOutDate || formatDateInput(addDays(today, 14)))
  const [room, setRoom] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [multiBookingRooms, setMultiBookingRooms] = useState([])
  const [createdBooking, setCreatedBooking] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams({ fromDate, toDate })
    setLoading(true)
    setError('')
    fetch(`${API_BASE_URL}/rooms/${roomId}?${params}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết loại phòng.')
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

  const openBookingModal = () => {
    if (!room) return
    const storedRooms = readBookingCart()
    const currentRoom = roomDetailToCartRoom(room)
    const hasCurrentRoom = storedRooms.some((item) => String(item.roomTypeId || item.id) === String(currentRoom.roomTypeId))
    setMultiBookingRooms(hasCurrentRoom ? storedRooms : [...storedRooms, currentRoom])
    setBookingModalOpen(true)
  }

  const [reviews, setReviews] = useState([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const token = getStoredToken()

  const roomTargetId = room?.roomTypeId || room?.roomId || room?.id || roomId

  useEffect(() => {
    if (!roomTargetId) return
    // Fetch public reviews
    fetch(`${API_BASE_URL}/public/reviews/room-type/${roomTargetId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data.filter((r) => (r.status || 'APPROVED').toUpperCase() !== 'HIDDEN') : []))
      .catch(() => setReviews([]))

    // Check wishlist status
    if (token) {
      fetch(`${API_BASE_URL}/customer/wishlist/check/${roomTargetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : false))
        .then(setIsWishlisted)
        .catch(() => {})
    }
  }, [roomTargetId, token])

  const toggleWishlist = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!token) {
      window.location.assign('/login')
      return
    }
    if (!roomTargetId) return
    const nextState = !isWishlisted
    setIsWishlisted(nextState)
    try {
      const res = await fetch(`${API_BASE_URL}/customer/wishlist/toggle/${roomTargetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.isWishlisted === 'boolean') {
        setIsWishlisted(data.isWishlisted)
      } else {
        setIsWishlisted(!nextState)
      }
    } catch {
      setIsWishlisted(!nextState)
    }
  }

  return (
    <div className="rooms-page room-detail-page">
      <PublicHeader />

      <main className="room-detail-main">
        <a className="room-back-link" href="/rooms">← Quay lại danh sách loại phòng</a>

        {loading ? (
          <div className="rooms-state">Đang tải chi tiết loại phòng...</div>
        ) : error ? (
          <div className="rooms-state rooms-state-error">{error}</div>
        ) : room ? (
          <>
            <section className="room-detail-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p>{houseTypeName(room)}</p>
                <h1>{houseTypeName(room)}</h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    color: isWishlisted ? '#ff385c' : '#64748b',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s',
                  }}
                  title={isWishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                >
                  {isWishlisted ? '❤️' : '♡'}
                </button>
                <div className="room-detail-rating">
                  ★ {room.averageRating ? Number(room.averageRating).toFixed(1) : '5.0'} ({reviews.length} đánh giá)
                </div>
              </div>
            </section>

            <section className="room-detail-layout">
              <aside className="room-detail-media-panel" aria-label="Ảnh phòng">
                <div className="room-detail-main-photo">
                  {selectedImage ? (
                    <img src={resolveImageUrl(selectedImage)} alt={houseTypeName(room, 'Loại phòng')} />
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
                  <h2>Thông tin loại phòng</h2>
                  <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
                  <div className="room-info-chips">
                    <span>{room.maxAdults || 0} người lớn</span>
                    <span>{room.maxChildren || 0} trẻ em</span>
                    <span>Phòng sẽ được lễ tân sắp xếp khi check-in</span>
                    <span className={room.depositPolicyId ? 'room-deposit-chip' : 'room-deposit-chip room-deposit-chip--free'}>
                      {depositText(room)}
                    </span>
                  </div>
                </section>
              </aside>

              <div className="room-detail-content">
                <section className="room-booking-panel room-booking-panel--compact">
                  <div className="room-booking-head">
                    <div>
                      <h2>Đặt loại phòng này</h2>
                      <p>Chọn thời gian lưu trú và gói thuê phù hợp để tạo đơn đặt phòng.</p>
                    </div>
                    <button className="room-detail-cta" type="button" onClick={openBookingModal}>
                      Chọn lịch đặt phòng
                    </button>
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

                {/* Section Đánh giá từ khách hàng */}
                <section className="room-info-section" style={{ marginTop: '28px' }}>
                  <h2>Đánh giá từ khách hàng (★ {room.averageRating ? Number(room.averageRating).toFixed(1) : '5.0'})</h2>
                  {reviews.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>Hạng phòng này chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và để lại đánh giá!</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px', marginTop: '14px' }}>
                      {reviews.map((rev) => (
                        <div key={rev.reviewId} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', overflow: 'hidden', fontWeight: 'bold' }}>
                              {rev.customerAvatar ? (
                                <img src={resolveImageUrl(rev.customerAvatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                rev.customerName?.charAt(0) || 'K'
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#1e293b' }}>{rev.customerName}</strong>
                              <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                                {'★'.repeat(rev.ratingStars || 5)} <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                              </div>
                            </div>
                          </div>

                          <p style={{ margin: '6px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>"{rev.comment}"</p>

                          {rev.imageUrls && rev.imageUrls.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                              {rev.imageUrls.map((url, i) => (
                                <a key={i} href={resolveImageUrl(url)} target="_blank" rel="noreferrer">
                                  <img
                                    src={resolveImageUrl(url)}
                                    alt="Ảnh đánh giá"
                                    style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </section>


            {createdBooking && (
              <div className={`room-created-toast${createdBooking.requiresDeposit ? ' room-created-toast--pending' : ''}`}>
                {!getStoredToken()
                  ? String(createdBooking.status || '').toUpperCase() === 'CONFIRMED'
                    ? `Đã tạo đơn đặt phòng ${bookingDisplay(createdBooking)} và thanh toán thành công. Email xác nhận đã được gửi về cho bạn.`
                    : `Đã tạo đơn đặt phòng ${bookingDisplay(createdBooking)}. Thông tin đặt phòng đã được gửi về email của bạn.`
                  : createdBooking.requiresDeposit
                  ? `Đã lưu đơn đặt phòng ${bookingDisplay(createdBooking)}. Đơn đang chờ thanh toán trước.`
                  : `Đã tạo đơn đặt phòng ${bookingDisplay(createdBooking)}. Trạng thái: đặt phòng thành công.`}
              </div>
            )}

            {bookingModalOpen && (
              <MultiBookingModal
                selectedRooms={multiBookingRooms}
                criteria={initialBookingData}
                onClose={() => setBookingModalOpen(false)}
                onCreated={(booking) => {
                  setCreatedBooking(booking)
                  setBookingModalOpen(false)
                  clearBookingCart()
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
