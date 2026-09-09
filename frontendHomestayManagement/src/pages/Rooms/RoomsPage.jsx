import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import RoomScheduleCalendarModal from '../../components/RoomScheduleCalendar/RoomScheduleCalendarModal'
import CustomDateTimePicker from '../../components/DateTimePicker/CustomDateTimePicker'
import { clearBookingCart, readBookingCart, writeBookingCart } from '../../utils/bookingCart'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './RoomsPage.css'
import './RoomDetailPage.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Number(price || 0)) + 'đ'
}

function getFallbackRoomImage(roomTypeName, roomTypeId) {
  const name = String(roomTypeName || '').toLowerCase()
  if (name.includes('studio')) return '/home_1/image.png'
  if (name.includes('vip') || name.includes('suite')) return '/home_2/image_1.jpg'
  if (name.includes('deluxe')) return '/home_3/image_3.jpg'
  if (name.includes('family') || name.includes('gia đình')) return '/home_4/image_1.jpg'
  if (name.includes('connecting') || name.includes('kết nối')) return '/home_5/image_1.jpg'

  const fallbacks = [
    '/home_1/image.png',
    '/home_2/image_1.jpg',
    '/home_3/image_3.jpg',
    '/home_4/image_1.jpg',
    '/home_5/image_1.jpg'
  ]
  const idNum = Math.max(1, Number(roomTypeId) || 1)
  const idx = (idNum - 1) % fallbacks.length
  return fallbacks[idx]
}

function serviceKey(service) {
  return `${service.type}-${service.id}`
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase()
}

function getSavedVouchers() {
  try {
    const raw = localStorage.getItem('homestay_saved_vouchers')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveVoucherToStorage(voucher) {
  if (!voucher || !voucher.code) return
  try {
    const existing = getSavedVouchers()
    if (!existing.some((v) => normalizeCode(v.code) === normalizeCode(voucher.code))) {
      existing.unshift(voucher)
      localStorage.setItem('homestay_saved_vouchers', JSON.stringify(existing))
    }
  } catch {}
}

function calculateVoucherDiscount(voucher, roomTotal) {
  if (!voucher || roomTotal <= 0) return 0
  const minOrderValue = Number(voucher.minOrderValue || 0)
  if (roomTotal < minOrderValue) return 0
  const discountValue = Number(voucher.discountValue || 0)
  let discount = String(voucher.discountType || '').toUpperCase() === 'PERCENT'
    ? Math.round((roomTotal * discountValue) / 100)
    : Math.round(discountValue)
  const maxDiscount = Number(voucher.maxDiscountAmount || 0)
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount)
  return Math.max(0, Math.min(discount, roomTotal))
}

function voucherDiscountText(voucher) {
  if (!voucher) return ''
  if (String(voucher.discountType || '').toUpperCase() === 'PERCENT') {
    return `Giảm ${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}%`
  }
  return `Giảm ${formatPrice(voucher.discountValue)}`
}

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function serviceUnit(type) {
  return String(type || '').toUpperCase() === 'INVENTORY' ? 'lượt' : 'người'
}

function serviceTypeLabel(type) {
  return String(type || '').toUpperCase() === 'INVENTORY' ? 'Thuê đồ' : 'Tiện ích'
}

function isWeekendDay(targetDate) {
  let date = null
  if (targetDate) {
    date = new Date(targetDate)
  } else {
    try {
      const params = new URLSearchParams(window.location.search)
      const checkInDate = params.get('checkInDate')
      if (checkInDate) {
        date = new Date(checkInDate)
      }
    } catch {}
  }
  if (!date || Number.isNaN(date.getTime())) {
    date = new Date()
  }
  const day = date.getDay()
  return day === 0 || day === 6
}

function roomPrice(room, targetDate) {
  if (!room) return 0
  const isWeekend = isWeekendDay(targetDate)

  if (isWeekend) {
    if (room.weekendPrice != null && Number(room.weekendPrice) > 0) {
      return Number(room.weekendPrice)
    }
    if (Array.isArray(room.prices) && room.prices.length > 0) {
      const weekendItem = room.prices.find(
        (p) => String(p.dayType || '').toUpperCase() === 'WEEKEND' && Number(p.price) > 0
      )
      if (weekendItem) return Number(weekendItem.price)
    }
  } else {
    if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) {
      return Number(room.weekdayPrice)
    }
    if (Array.isArray(room.prices) && room.prices.length > 0) {
      const weekdayItem = room.prices.find(
        (p) => String(p.dayType || '').toUpperCase() === 'WEEKDAY' && Number(p.price) > 0
      )
      if (weekdayItem) return Number(weekdayItem.price)
    }
  }

  if (room.price != null && Number(room.price) > 0) return Number(room.price)
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) return Number(room.weekdayPrice)
  if (room.weekendPrice != null && Number(room.weekendPrice) > 0) return Number(room.weekendPrice)
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const validPrices = room.prices.map((p) => Number(p.price || 0)).filter((p) => p > 0)
    if (validPrices.length > 0) return Math.min(...validPrices)
  }
  return 0
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

function formatDateTimeLocalDisplay(value) {
  if (!value) return 'dd/mm/yyyy --:-- AM/PM'
  const [datePart, timePart = ''] = String(value).split('T')
  const [year, month, day] = datePart.split('-')
  const [hourText = '', minute = ''] = timePart.split(':')
  if (!year || !month || !day || !hourText || !minute) return 'dd/mm/yyyy --:-- AM/PM'
  const hour = Number(hourText)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = String(hour % 12 || 12).padStart(2, '0')
  return `${day}/${month}/${year} ${displayHour}:${minute} ${period}`
}

function parseDateTimeLocalDisplay(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!match) return ''
  const [, dayText, monthText, yearText, hourText, minuteText, periodText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const enteredHour = Number(hourText)
  const minute = Number(minuteText)
  const period = periodText?.toUpperCase()
  if (period && (enteredHour < 1 || enteredHour > 12)) return ''
  if (!period && (enteredHour < 0 || enteredHour > 23)) return ''
  const hour = period
    ? (enteredHour % 12) + (period === 'PM' ? 12 : 0)
    : enteredHour
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  const isValid = date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute
  return isValid ? toDateTimeLocal(date) : ''
}

function LocalizedDateTimeInput({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  allowBeforeMin = false,
  invalid = false,
  ariaLabel = 'Ngày giờ',
  busySlots = [],
  rooms = [],
  roomTargetId = null,
  checkInValue = null,
  checkOutValue = null,
  isCheckIn = true,
}) {
  return (
    <CustomDateTimePicker
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
      required={required}
      allowBeforeMin={allowBeforeMin}
      invalid={invalid}
      ariaLabel={ariaLabel}
      busySlots={busySlots}
      rooms={rooms}
      roomTargetId={roomTargetId}
      checkInValue={checkInValue}
      checkOutValue={checkOutValue}
      isCheckIn={isCheckIn}
    />
  )
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

function defaultRoomTypeCriteria(roomTypeId = null) {
  return {
    checkInDate: '',
    checkOutDate: '',
    rooms: 1,
    adults: 1,
    children: 0,
    roomTypeId,
    isDefaultRoomTypeList: true,
  }
}

function parseSearchCriteria() {
  const params = new URLSearchParams(window.location.search)
  const checkInDate = params.get('checkInDate')
  const checkOutDate = params.get('checkOutDate')
  const roomTypeId = params.get('roomTypeId')
  if (!checkInDate || !checkOutDate) {
    return defaultRoomTypeCriteria(roomTypeId)
  }
  return {
    checkInDate,
    checkOutDate,
    rooms: Number(params.get('rooms') || 1),
    adults: Number(params.get('adults') || 1),
    children: Number(params.get('children') || 0),
    focusRoomId: params.get('focusRoomId'),
    roomTypeId,
    roomTypeName: params.get('roomTypeName') || '',
  }
}

function bookingDayType(checkInTarget) {
  const date = new Date(checkInTarget)
  return [0, 6].includes(date.getDay()) ? 'WEEKEND' : 'WEEKDAY'
}

function dateTimeLocalToDateKey(value) {
  if (!value) return ''
  return value.slice(0, 10)
}

function findOverlappingSlot(slots, checkInTarget, checkOutTarget) {
  if (!checkInTarget || !checkOutTarget) return null
  const checkIn = new Date(checkInTarget)
  const checkOut = new Date(checkOutTarget)
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null

  return (slots || []).find((slot) => {
    const busyStart = new Date(slot.checkInTarget)
    const busyEnd = new Date(slot.checkOutTarget)
    return checkIn < busyEnd && checkOut > busyStart
  }) || null
}

function findNextBusySlot(slots, checkInTarget) {
  if (!checkInTarget) return null
  const checkIn = new Date(checkInTarget)
  if (Number.isNaN(checkIn.getTime())) return null

  return (slots || [])
    .filter((slot) => new Date(slot.checkInTarget) > checkIn)
    .sort((first, second) => new Date(first.checkInTarget) - new Date(second.checkInTarget))[0] || null
}

function formatNoticeTime(value) {
  return formatAppDateTime(value)
}

function getStayBreakdown(checkInTarget, checkOutTarget) {
  if (!checkInTarget || !checkOutTarget) return { totalNights: 1, weekdayNights: 1, weekendNights: 0 }
  const dIn = new Date(checkInTarget)
  const dOut = new Date(checkOutTarget)
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
}

function calculateDynamicRoomPrice(room, checkInTarget, checkOutTarget) {
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

  const { weekdayNights, weekendNights } = getStayBreakdown(checkInTarget, checkOutTarget)
  return (weekdayNights * weekdayPrice) + (weekendNights * (weekendPrice > 0 ? weekendPrice : weekdayPrice))
}

function findRoomPolicyPrice(room, policy, dayType) {
  if (!room) return null
  if (!policy) {
    return { price: calculateDynamicRoomPrice(room) }
  }
  return (room.prices || []).find((price) =>
    String(price.policyName) === String(policy.policyName)
    && String(price.rentType).toUpperCase() === String(policy.rentType).toUpperCase()
    && String(price.dayType).toUpperCase() === String(dayType).toUpperCase()
  ) || null
}

function normalizeRentType(rentType) {
  return String(rentType || '').trim().toUpperCase()
}

function isOvernightPolicy(policy) {
  return ['OVERNIGHT', 'NIGHTLY', 'BY_NIGHT'].includes(normalizeRentType(policy?.rentType))
}

function isAutoCheckoutPolicy(policy) {
  return ['HOURLY', 'BY_HOUR', 'COMBO'].includes(normalizeRentType(policy?.rentType))
}

function isHourlyPolicy(policy) {
  return ['HOURLY', 'BY_HOUR'].includes(normalizeRentType(policy?.rentType))
}

function addHoursToDateTimeLocal(value, hours) {
  if (!value || !hours) return value
  const date = new Date(value)
  date.setHours(date.getHours() + Number(hours))
  return toDateTimeLocal(date)
}

function nowDateTimeLocalMin() {
  const now = new Date()
  now.setSeconds(0, 0)
  return toDateTimeLocal(now)
}

function overnightCheckoutValue(checkInTarget) {
  const date = new Date(checkInTarget)
  date.setDate(date.getDate() + 1)
  date.setHours(11, 0, 0, 0)
  return toDateTimeLocal(date)
}

function normalizeBookingTime(form, policy) {
  if (!form.checkInTarget) return form
  if (isAutoCheckoutPolicy(policy)) {
    return {
      ...form,
      checkOutTarget: addHoursToDateTimeLocal(form.checkInTarget, policy?.limitHours || 1),
    }
  }
  return {
    ...form,
    checkOutTarget: overnightCheckoutValue(form.checkInTarget),
  }
}

function validateBookingTime(form) {
  if (!form.checkInTarget || !form.checkOutTarget) return ''
  const checkIn = new Date(form.checkInTarget)
  const checkOut = new Date(form.checkOutTarget)
  if (checkOut <= checkIn) return 'Giờ trả phòng phải sau giờ nhận phòng.'
  return ''
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: '2 ngày 1 đêm',
    NIGHTLY: '2 ngày 1 đêm',
    BY_NIGHT: '2 ngày 1 đêm',
    DAILY: 'ngày',
    BY_DAY: 'ngày',
    HOURLY: 'giờ',
    COMBO: 'Combo',
  }
  return labels[String(rentType || '').toUpperCase()] || '2 ngày 1 đêm'
}

function depositLabel(room) {
  if (!room.depositPolicyId) return 'Không cần thanh toán trước'
  if (String(room.depositCalculationType || '').toUpperCase() === 'PERCENTAGE') {
    return `Thanh toán trước ${Number(room.depositPolicyValue || 0)}%`
  }
  return `Thanh toán trước ${formatPrice(room.depositPolicyValue)}`
}

function roomKey(room) {
  return room.roomId ? `room-${room.roomId}` : `type-${room.roomTypeId || room.id}`
}

function roomTypeIdOf(room) {
  return room.roomTypeId || room.id
}

function selectedQuantity(room) {
  return Math.max(1, Number(room.quantity || 1))
}

function roomUnitKey(room, unitIndex) {
  return `${roomKey(room)}-unit-${unitIndex}`
}

function createRoomUnit(room, unitIndex, criteria, totalRoomCount, template = null) {
  const defaultAdults = Math.max(
    1,
    Math.min(Number(room.maxAdults || 1), Math.ceil(Number(criteria?.adults || 1) / Math.max(1, totalRoomCount))),
  )
  const defaultChildren = Math.max(
    0,
    Math.min(Number(room.maxChildren || 0), Math.ceil(Number(criteria?.children || 0) / Math.max(1, totalRoomCount))),
  )
  return {
    key: roomUnitKey(room, unitIndex),
    typeKey: roomKey(room),
    unitIndex,
    room,
    numberOfAdults: template?.numberOfAdults ?? defaultAdults,
    numberOfChildren: template?.numberOfChildren ?? defaultChildren,
    services: [],
  }
}

function initialRoomUnits(selectedRooms, criteria) {
  const totalRoomCount = selectedRooms.reduce((sum, room) => sum + selectedQuantity(room), 0)
  return selectedRooms.flatMap((room) =>
    Array.from(
      { length: selectedQuantity(room) },
      (_, index) => createRoomUnit(room, index + 1, criteria, totalRoomCount),
    ))
}

function isRoomTypeSearchResult(room) {
  return !room.roomId && Boolean(room.roomTypeId || room.availableRooms !== undefined)
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

function RoomCard({ room, selected, onToggle, criteria }) {
  const typeOnly = isRoomTypeSearchResult(room)
  const title = houseTypeName(room)
  const imageUrl = room.primaryImageUrl || room.imageUrls?.[0]
  const targetDate = criteria?.checkInDate
  const isWeekend = isWeekendDay(targetDate)
  const price = roomPrice(room, targetDate)
  const detailRoomId = room.roomId || room.representativeRoomId
  const detailUrl = detailRoomId ? `/rooms/${detailRoomId}${window.location.search || ''}` : null
  const roomTypeId = room.roomTypeId || room.id

  const [isLiked, setIsLiked] = useState(false)
  const token = getStoredToken()

  useEffect(() => {
    if (!token || !roomTypeId) return
    fetch(`${API_BASE_URL}/customer/wishlist/check/${roomTypeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : false))
      .then(setIsLiked)
      .catch(() => {})
  }, [roomTypeId, token])

  const toggleHeart = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!token) {
      window.location.assign('/login')
      return
    }
    const nextState = !isLiked
    setIsLiked(nextState)
    try {
      const res = await fetch(`${API_BASE_URL}/customer/wishlist/toggle/${roomTypeId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.isWishlisted === 'boolean') {
        setIsLiked(data.isWishlisted)
      }
    } catch {
      // Retain optimistic UI state
    }
  }


  const isMaintenance = String(room.status || '').toUpperCase() === 'MAINTENANCE'
  const isSoldOut = typeOnly ? (Number(room.availableRooms || 0) <= 0) : (room.status && room.status !== 'AVAILABLE')
  const isBooked = isSoldOut || String(room.status || '').toUpperCase() === 'BOOKED' || String(room.status || '').toUpperCase() === 'OCCUPIED'
  const isAvailable = !isMaintenance && !isBooked

  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef(null)

  const handleStartHold = () => {
    if (!room.videoUrl) return
    setIsVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleEndHold = () => {
    if (!room.videoUrl) return
    setIsVideoPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <article className={`public-room-card${selected ? ' is-selected' : ''}${!isAvailable ? ' is-room-disabled' : ''}`}>
      <a className="public-room-card-link" href={detailUrl || window.location.href} onClick={(event) => !detailUrl && event.preventDefault()}>
        <div
          className="public-room-photo"
          onMouseEnter={handleStartHold}
          onMouseLeave={handleEndHold}
          onPointerDown={handleStartHold}
          onPointerUp={handleEndHold}
          onTouchStart={handleStartHold}
          onTouchEnd={handleEndHold}
          style={{ position: 'relative', overflow: 'hidden', cursor: room.videoUrl ? 'pointer' : 'default' }}
        >
          <img
            src={resolveImageUrl(imageUrl) || getFallbackRoomImage(title, roomTypeId)}
            alt={title}
            loading="lazy"
            style={{ opacity: isVideoPlaying ? 0 : 1, transition: 'opacity 0.3s ease' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getFallbackRoomImage(title, roomTypeId);
            }}
          />
          {room.videoUrl && (
            <video
              ref={videoRef}
              src={resolveImageUrl(room.videoUrl)}
              muted
              loop
              playsInline
              preload="metadata"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isVideoPlaying ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            />
          )}
          {room.videoUrl && (
            <span
              className="room-video-preview-badge"
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                zIndex: 3,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 999,
                background: isVideoPlaying ? 'rgba(225, 29, 72, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            >
              <span style={{ display: 'inline-block', transform: isVideoPlaying ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                {isVideoPlaying ? '▶' : '🎬'}
              </span>
              <span>{isVideoPlaying ? 'Đang phát video' : 'Hold xem video'}</span>
            </span>
          )}
          <span className={`public-room-badge${!isAvailable ? ' is-maintenance' : ''}`}>
            {isMaintenance
              ? '⚠️ Tạm bảo trì'
              : isBooked
              ? '🔴 Đã kín lịch'
              : typeOnly
              ? `Còn ${room.availableRooms || 0} phòng`
              : 'Sẵn sàng đặt'}
          </span>
          <button
            type="button"
            className={`public-room-heart-btn${isLiked ? ' is-liked' : ''}`}
            title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onClick={toggleHeart}
          >
            {isLiked ? '❤️' : '♡'}
          </button>
        </div>
      </a>
      <div className="public-room-body">
        <div className="public-room-title-row">
          <h3>{title}</h3>
          <span>⭐ {room.averageRating || 4.9}</span>
        </div>
        <p>{room.description || 'Không gian nghỉ dưỡng tiện nghi, phù hợp cho kỳ lưu trú của bạn.'}</p>
        <div className="public-room-meta">
          <span>{room.maxAdults || 0} người lớn</span>
          <span>{room.maxChildren || 0} trẻ em</span>
          {typeOnly && <span>Đặt theo loại phòng</span>}
        </div>
        <div className="public-room-price-row">
          <strong>{formatPrice(price)}</strong>
          <span>/{rentTypeLabel(room.rentType)}</span>
          {isWeekend && (room.weekendPrice || room.prices?.some(p => String(p.dayType).toUpperCase() === 'WEEKEND')) && (
            <span className="public-room-weekend-badge" style={{ marginLeft: 8, fontSize: '0.75rem', background: '#ffe4e6', color: '#e11d48', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>Giá cuối tuần</span>
          )}
        </div>
        {room.weekendPrice && room.weekendPrice !== room.weekdayPrice && !isWeekend && (
          <div className="public-room-weekend">Cuối tuần: {formatPrice(room.weekendPrice)}</div>
        )}
        {room.depositPolicyId && (
          <div className="public-room-deposit">{depositLabel(room)}</div>
        )}
        <div className="public-room-actions">
          {detailUrl && <a href={detailUrl}>Xem chi tiết</a>}
          <button
            type="button"
            className={selected ? 'is-selected' : ''}
            disabled={!isAvailable}
            onClick={() => isAvailable && onToggle(room)}
            title={!isAvailable ? (isMaintenance ? 'Phòng đang bảo trì, tạm thời không thể đặt' : 'Phòng đã có lịch đặt, không thể chọn') : undefined}
          >
            {isMaintenance ? 'Đang bảo trì' : isBooked ? 'Đã kín lịch' : selected ? 'Bỏ chọn' : typeOnly ? 'Đặt phòng' : 'Chọn phòng'}
          </button>
        </div>
      </div>
    </article>
  )
}


function LuckyVoucherRewardModal({ reward, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!reward) return null

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reward.code)
      } else {
        const input = document.createElement('input')
        input.value = reward.code
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
    } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSaveAndCopy = () => {
    saveVoucherToStorage({
      id: Date.now(),
      code: reward.code,
      discountType: 'PERCENT',
      discountValue: reward.discountPercent || 8,
      minOrderValue: 0,
      endDate: reward.endDate,
      isLucky: true,
    })
    handleCopy()
  }

  return (
    <div className="lucky-reward-overlay" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="lucky-reward-modal" role="dialog" aria-modal="true" aria-labelledby="lucky-reward-title">
        <button type="button" className="lucky-reward-close" onClick={onClose} aria-label="Đóng">×</button>
        <div className="lucky-reward-sparkles" aria-hidden="true">✨ 🎉 🎁</div>
        <div className="lucky-reward-head">
          <h3 id="lucky-reward-title">Chúc Mừng Bạn Nhận Voucher May Mắn!</h3>
          <p>
            Cảm ơn bạn đã đặt phòng thành công. Homestay gửi tặng bạn mã giảm giá may mắn cho lần đặt phòng tiếp theo:
          </p>
        </div>

        <div className="lucky-voucher-card">
          <span className="lucky-voucher-discount">GIẢM {reward.discountPercent}%</span>
          <span className="lucky-voucher-desc">Áp dụng trực tiếp vào tổng tiền phòng cho lần đặt kế tiếp</span>
          <div className="lucky-voucher-code-box">
            <span className="lucky-voucher-code">{reward.code}</span>
            <button type="button" className="lucky-voucher-copy-btn" onClick={handleCopy}>
              {copied ? '✓ Đã chép' : '📋 Sao chép'}
            </button>
          </div>
          <div className="lucky-voucher-meta">
            <span>🎟️ Voucher may mắn</span>
            <span>• Hạn dùng 3 tháng</span>
            <span>• Không giới hạn đơn tối thiểu</span>
          </div>
        </div>

        <div className="lucky-reward-footer">
          <button type="button" className="lucky-reward-save-btn" onClick={handleSaveAndCopy}>
            {copied ? '✓ Đã lưu & sao chép mã!' : '💾 Lưu & Sao chép mã'}
          </button>
          <button type="button" className="lucky-reward-done-btn" onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </section>
    </div>
  )
}

function BookingVoucherControl({
  voucherCode,
  setVoucherCode,
  voucherEligible,
  voucherDiscount,
  eligibleVouchers = [],
  selectedVoucher,
  allVouchers = [],
  setVouchers,
  roomTotal = 0,
}) {
  const [open, setOpen] = useState(false)
  const [draftCode, setDraftCode] = useState(voucherCode)
  const [checking, setChecking] = useState(false)
  const [manualError, setManualError] = useState('')

  const combinedVouchers = useMemo(() => {
    const list = [...(allVouchers.length ? allVouchers : eligibleVouchers)]
    const saved = getSavedVouchers()
    saved.forEach((sv) => {
      if (!list.some((item) => normalizeCode(item.code) === normalizeCode(sv.code))) {
        list.push(sv)
      }
    })
    return list
  }, [allVouchers, eligibleVouchers])

  const draftVoucher = combinedVouchers.find((voucher) => normalizeCode(voucher.code) === normalizeCode(draftCode))
  const appliedLabel = selectedVoucher && voucherEligible
    ? `${selectedVoucher.code} · -${formatPrice(voucherDiscount)}`
    : 'Chọn hoặc nhập mã khuyến mãi'

  const openPopup = () => {
    setDraftCode(voucherCode)
    setManualError('')
    setOpen(true)
  }

  const handleSelectVoucher = (code) => {
    setDraftCode(code)
    setVoucherCode(code.trim())
    setOpen(false)
  }

  const confirmVoucher = async () => {
    const trimmed = draftCode.trim()
    if (!trimmed) {
      setVoucherCode('')
      setOpen(false)
      return
    }
    setManualError('')

    // Check locally first
    const found = combinedVouchers.find((v) => normalizeCode(v.code) === normalizeCode(trimmed))
    if (found) {
      setVoucherCode(found.code)
      setDraftCode(found.code)
      setOpen(false)
      return
    }

    // Check with backend
    setChecking(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vouchers/check/${encodeURIComponent(trimmed)}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Mã khuyến mãi không tồn tại hoặc đã hết hạn')
      }
      if (setVouchers) {
        setVouchers((prev) => {
          if (prev.some((v) => normalizeCode(v.code) === normalizeCode(data.code))) return prev
          return [data, ...prev]
        })
      }
      saveVoucherToStorage(data)
      setVoucherCode(data.code)
      setDraftCode(data.code)
      setOpen(false)
    } catch (err) {
      setManualError(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <button className="public-voucher-row" type="button" onClick={openPopup}>
        <span className="public-voucher-ticket" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 8.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.5a2.5 2.5 0 0 0 0-5Z" />
            <path d="M9 7.5v9" />
          </svg>
        </span>
        <span className="public-voucher-row-text">
          <strong>Voucher</strong>
          <small>{appliedLabel}</small>
        </span>
        <span className="public-voucher-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
        </span>
      </button>

      {open && (
        <div className="public-voucher-modal-overlay" role="presentation" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="public-voucher-modal" role="dialog" aria-modal="true" aria-labelledby="voucher-picker-title">
            <div className="public-voucher-modal-head">
              <div>
                <h3 id="voucher-picker-title">Voucher</h3>
                <p>Chọn mã phù hợp với tổng tiền phòng hiện tại.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng">×</button>
            </div>

            <div className="public-voucher-options">
              {combinedVouchers.length ? combinedVouchers.map((voucher) => {
                const isSelected = normalizeCode(voucher.code) === normalizeCode(draftCode)
                const isLucky = voucher.isLucky || String(voucher.code || '').toUpperCase().startsWith('LUCKY')
                const calculated = calculateVoucherDiscount(voucher, roomTotal)
                return (
                  <article className={`public-voucher-option${isSelected ? ' is-selected' : ''}`} key={voucher.id || voucher.code}>
                    <div>
                      <span className={isLucky ? 'lucky-badge' : ''}>
                        {isLucky ? `🎉 ${voucher.code}` : voucher.code}
                      </span>
                      <strong>
                        {voucherDiscountText(voucher)}
                        {calculated > 0 && <small style={{ marginLeft: 8, color: '#166534', fontWeight: 600 }}>(-{formatPrice(calculated)})</small>}
                      </strong>
                      <p>{voucher.minOrderValue ? `Cho tiền phòng từ ${formatPrice(voucher.minOrderValue)}` : 'Không yêu cầu giá trị tối thiểu'}</p>
                    </div>
                    <button type="button" onClick={() => handleSelectVoucher(voucher.code)}>
                      {isSelected ? 'Đã chọn' : 'Áp dụng'}
                    </button>
                  </article>
                )
              }) : (
                <div className="public-voucher-empty">Chưa có voucher phù hợp với tổng tiền phòng hiện tại.</div>
              )}
            </div>

            <div className="public-voucher-manual">
              <label>
                <span>Thêm khuyến mãi / Nhập mã</span>
                <input
                  value={draftCode}
                  onChange={(event) => {
                    setDraftCode(event.target.value)
                    setManualError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      confirmVoucher()
                    }
                  }}
                  placeholder="NHẬP MÃ KHUYẾN MÃI"
                />
              </label>
              {manualError && <div className="public-voucher-manual-error">{manualError}</div>}
              {draftVoucher && !manualError && <small>Đã chọn: {draftVoucher.code} ({voucherDiscountText(draftVoucher)})</small>}
            </div>

            <div className="public-voucher-modal-actions">
              {voucherCode && <button type="button" onClick={() => { setDraftCode(''); setVoucherCode(''); setOpen(false); }}>Bỏ mã</button>}
              <button type="button" className="public-voucher-confirm" disabled={checking} onClick={confirmVoucher}>
                {checking ? 'Đang kiểm tra...' : 'Xác nhận'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
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
    identityDocumentNumber: '',
    checkInTarget: criteria?.checkInDate ? dateKeyToDateTimeLocal(criteria.checkInDate, 13) : defaultCheckInValue(),
    checkOutTarget: (criteria?.checkInDate && criteria?.checkOutDate && criteria.checkOutDate > criteria.checkInDate)
      ? dateKeyToDateTimeLocal(criteria.checkOutDate, 11)
      : overnightCheckoutValue(criteria?.checkInDate ? dateKeyToDateTimeLocal(criteria.checkInDate, 13) : defaultCheckInValue()),
    pricePolicyId: '',
  })
  const [roomQuantities, setRoomQuantities] = useState(() => Object.fromEntries(selectedRooms.map((room) => [
    roomKey(room),
    selectedQuantity(room),
  ])))
  const [roomUnits, setRoomUnits] = useState(() => initialRoomUnits(selectedRooms, criteria))
  const initialRoomUnitKeyRef = useRef(roomUnitKey(selectedRooms[0], 1))
  const [policies, setPolicies] = useState([])
  const [serviceOptions, setServiceOptions] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [voucherCode, setVoucherCode] = useState('')
  const [serviceForm, setServiceForm] = useState({ optionKey: '', quantity: 1 })
  const [serviceDialogRoomKey, setServiceDialogRoomKey] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [checkingSchedule, setCheckingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleNotice, setScheduleNotice] = useState('')
  const [roomSchedules, setRoomSchedules] = useState([])
  const [viewingScheduleRoom, setViewingScheduleRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [sePayPayment, setSePayPayment] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (!serviceDialogRoomKey) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setServiceDialogRoomKey(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [serviceDialogRoomKey])

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
    if (form.checkOutTarget) return
    setForm((current) => ({ ...current, checkOutTarget: defaultCheckOutValue(current.checkInTarget) }))
  }, [form.checkInTarget, form.checkOutTarget])

  useEffect(() => {
    const token = getStoredToken()
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch(`${API_BASE_URL}/bookings/price-policies`, { headers: authHeaders }).then((res) => {
        if (!res.ok) throw new Error('Không thể tải gói thuê.')
        return res.json()
      }),
      fetch(`${API_BASE_URL}/bookings/services`, { headers: authHeaders }).then((res) => {
        if (!res.ok) throw new Error('Không thể tải dịch vụ đi kèm.')
        return res.json()
      }),
      fetch(`${API_BASE_URL}/vouchers/active`).then((res) => {
        if (!res.ok) return []
        return res.json()
      }).catch(() => []),
      token ? fetch(`${API_BASE_URL}/users/me`, { headers: authHeaders }).then((res) => {
        if (!res.ok) return null
        return res.json()
      }).catch(() => null) : Promise.resolve(null),
    ])
      .then(([policyData, serviceData, voucherData, profileData]) => {
        const nextPolicies = Array.isArray(policyData) ? policyData : []
        const nextServices = Array.isArray(serviceData) ? serviceData : []
        setPolicies(nextPolicies)
        setServiceOptions(nextServices)
        const savedList = getSavedVouchers()
        const activeList = Array.isArray(voucherData) ? voucherData : []
        const mergedVouchers = [...savedList]
        activeList.forEach((v) => {
          if (!mergedVouchers.some((item) => normalizeCode(item.code) === normalizeCode(v.code))) {
            mergedVouchers.push(v)
          }
        })
        setVouchers(mergedVouchers)
        try {
          const pending = JSON.parse(window.sessionStorage.getItem('homeStayPendingAmenityService') || 'null')
          const matched = nextServices.find(item => item.type === pending?.type && String(item.id) === String(pending?.serviceId))
          if (matched) {
            setServiceForm({ optionKey: serviceKey(matched), quantity: 1 })
            setServiceDialogRoomKey(initialRoomUnitKeyRef.current)
            window.sessionStorage.removeItem('homeStayPendingAmenityService')
          }
        } catch {
          window.sessionStorage.removeItem('homeStayPendingAmenityService')
        }
        setForm((current) => {
          const initialPolicy = nextPolicies.find((policy) => String(policy.id) === String(current.pricePolicyId))
            || nextPolicies[0]
          const nextForm = {
            ...current,
            pricePolicyId: initialPolicy?.id || '',
            ...(profileData ? {
              fullName: profileData.fullName || current.fullName,
              phone: profileData.phone || current.phone,
              email: profileData.email || current.email,
              address: profileData.address || current.address,
              dateOfBirth: profileData.dateOfBirth || current.dateOfBirth,
              identityDocumentNumber: profileData.identityDocumentNumber || current.identityDocumentNumber,
            } : {}),
          }
          return normalizeBookingTime(nextForm, initialPolicy)
        })
      })
      .catch(() => setError('Không thể tải dữ liệu đặt phòng.'))
      .finally(() => setLoadingMeta(false))
  }, [])

  const selectedDayType = bookingDayType(form.checkInTarget)
  const stayBreakdown = useMemo(() => {
    return getStayBreakdown(form.checkInTarget, form.checkOutTarget)
  }, [form.checkInTarget, form.checkOutTarget])
  const availablePolicies = useMemo(() => {
    return policies.filter((policy) =>
      selectedRooms.every((room) => findRoomPolicyPrice(room, policy, selectedDayType))
    )
  }, [policies, selectedDayType, selectedRooms])
  const selectedPolicy = availablePolicies.find((policy) => String(policy.id) === String(form.pricePolicyId)) || availablePolicies[0]
  const timeError = validateBookingTime(form)
  const roomPriceItems = selectedRooms.map((room) => ({
    room,
    price: calculateDynamicRoomPrice(room, form.checkInTarget, form.checkOutTarget),
    quantity: roomQuantities[roomKey(room)] || selectedQuantity(room),
  }))
  const roomTotal = roomPriceItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const serviceTotal = roomUnits.reduce(
    (total, unit) => total + unit.services.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    ),
    0,
  )
  const selectedVoucher = vouchers.find((voucher) => normalizeCode(voucher.code) === normalizeCode(voucherCode))
  const voucherDiscount = calculateVoucherDiscount(selectedVoucher, roomTotal)
  const roomTotalAfterDiscount = Math.max(0, roomTotal - voucherDiscount)
  const voucherEligible = Boolean(selectedVoucher && voucherDiscount > 0)
  const eligibleVouchers = vouchers.filter((voucher) => calculateVoucherDiscount(voucher, roomTotal) > 0)
  const selectedServiceOption = serviceOptions.find((item) => serviceKey(item) === serviceForm.optionKey)
  const serviceDialogRoom = roomUnits.find((unit) => unit.key === serviceDialogRoomKey)
  const selectedServiceQuantity = selectedServiceOption
    ? roomUnits.reduce(
        (total, unit) => total + unit.services
          .filter((item) => item.type === selectedServiceOption.type && item.serviceId === selectedServiceOption.id)
          .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        0,
      )
    : 0
  const selectedInventoryRemaining = String(selectedServiceOption?.type).toUpperCase() === 'INVENTORY'
    ? Math.max(0, Number(selectedServiceOption?.quantityInStock || 0) - selectedServiceQuantity)
    : undefined

  useEffect(() => {
    if (!selectedRooms.length || !form.checkInTarget || !form.checkOutTarget) {
      setScheduleError('')
      setScheduleNotice('')
      setCheckingSchedule(false)
      return undefined
    }

    const checkIn = new Date(form.checkInTarget)
    const checkOut = new Date(form.checkOutTarget)
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      setScheduleError('')
      setScheduleNotice('')
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setScheduleError('')
      setScheduleNotice('')
      setCheckingSchedule(true)
      const fromDate = dateTimeLocalToDateKey(form.checkInTarget)
      const toDate = dateTimeLocalToDateKey(form.checkOutTarget) || fromDate

      Promise.all(selectedRooms.map((room) => {
        const targetId = room.roomId || room.roomTypeId || room.id
        if (!targetId) return Promise.resolve({ room, busySlots: [] })
        return fetch(`${API_BASE_URL}/rooms/${targetId}?fromDate=${fromDate}&toDate=${toDate}`, { signal: controller.signal })
          .then((response) => response.ok ? response.json() : null)
          .then((data) => ({ room, busySlots: data?.busySlots || [] }))
          .catch(() => ({ room, busySlots: [] }))
      }))
        .then((items) => {
          setRoomSchedules(items)
          const conflict = items.find((item) => findOverlappingSlot(item.busySlots, form.checkInTarget, form.checkOutTarget))
          if (conflict) {
            setScheduleError(`${houseTypeName(conflict.room, 'Loại phòng này')} đã có lịch đặt trong khung giờ này. Vui lòng chọn giờ khác.`)
            setScheduleNotice('')
            return
          }

          setScheduleError('')
          if (!isHourlyPolicy(selectedPolicy)) {
            setScheduleNotice('')
            return
          }

          const nextBusy = items
            .map((item) => ({ ...item, slot: findNextBusySlot(item.busySlots, form.checkInTarget) }))
            .filter((item) => item.slot)
            .sort((first, second) => new Date(first.slot.checkInTarget) - new Date(second.slot.checkInTarget))[0]

          if (!nextBusy) {
            setScheduleNotice('')
            return
          }

          const latestCheckout = new Date(nextBusy.slot.checkInTarget)
          latestCheckout.setHours(latestCheckout.getHours() - 1)
          const message = `${houseTypeName(nextBusy.room, 'Loại phòng này')} đã có lịch đặt từ ${formatNoticeTime(nextBusy.slot.checkInTarget)}. Quý khách vui lòng check out trước ${formatNoticeTime(latestCheckout)}.`
          if (checkOut > latestCheckout) {
            setScheduleError(message)
            setScheduleNotice('')
          } else {
            setScheduleNotice(message)
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setScheduleError('')
            setScheduleNotice('')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setCheckingSchedule(false)
        })
    }, 220)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
      setCheckingSchedule(false)
    }
  }, [form.checkInTarget, form.checkOutTarget, selectedPolicy, selectedRooms])

  useEffect(() => {
    if (!availablePolicies.length) return
    if (!availablePolicies.some((policy) => String(policy.id) === String(form.pricePolicyId))) {
      setForm((current) => normalizeBookingTime({ ...current, pricePolicyId: availablePolicies[0].id }, availablePolicies[0]))
    }
  }, [availablePolicies, form.pricePolicyId])

  const updatePolicy = (policyId) => {
    const policy = availablePolicies.find((item) => String(item.id) === String(policyId))
    setError('')
    setScheduleError('')
    setScheduleNotice('')
    setForm((current) => normalizeBookingTime({ ...current, pricePolicyId: policyId }, policy))
  }

  const updateCheckInTarget = (value) => {
    const now = new Date()
    now.setSeconds(0, 0)
    if (value && new Date(value) < now) return
    setError('')
    setScheduleError('')
    setScheduleNotice('')
    setForm((current) => {
      const next = { ...current, checkInTarget: value }
      if (isAutoCheckoutPolicy(selectedPolicy)) {
        return normalizeBookingTime(next, selectedPolicy)
      }
      // Tự động đổi ngày trả phòng thành 2 ngày 1 đêm sau ngày nhận phòng
      return { ...next, checkOutTarget: overnightCheckoutValue(value) }
    })
  }

  const updateCheckOutTarget = (value) => {
    setError('')
    setScheduleError('')
    setScheduleNotice('')
    setForm((current) => ({ ...current, checkOutTarget: value }))
  }

  const updateRoomGuest = (unitKey, field, value) => {
    setRoomUnits((current) => current.map((unit) => {
      if (unit.key !== unitKey) return unit
      const numericValue = Number(value)
      const nextValue = field === 'numberOfAdults'
        ? Math.max(1, Math.min(Number(unit.room.maxAdults || 1), numericValue || 1))
        : Math.max(0, Math.min(Number(unit.room.maxChildren || 0), numericValue || 0))
      return { ...unit, [field]: nextValue }
    }))
  }

  const updateRoomQuantity = (room, nextQuantity) => {
    const maxQuantity = Number(room.availableRooms || 99)
    const quantity = Math.max(1, Math.min(maxQuantity, Number(nextQuantity || 1)))
    const key = roomKey(room)
    setRoomQuantities((current) => ({
      ...current,
      [key]: quantity,
    }))
    setRoomUnits((current) => {
      const orderBySelectedRoom = (units) => selectedRooms.flatMap((selectedRoom) =>
        units
          .filter((unit) => unit.typeKey === roomKey(selectedRoom))
          .sort((first, second) => first.unitIndex - second.unitIndex)
      )
      const sameTypeUnits = current
        .filter((unit) => unit.typeKey === key)
        .sort((first, second) => first.unitIndex - second.unitIndex)
      const otherUnits = current.filter((unit) => unit.typeKey !== key)
      if (quantity <= sameTypeUnits.length) {
        return orderBySelectedRoom([...otherUnits, ...sameTypeUnits.slice(0, quantity)])
      }
      const totalRoomCount = Object.entries(roomQuantities).reduce(
        (sum, [typeKey, currentQuantity]) => sum + (typeKey === key ? quantity : Number(currentQuantity || 0)),
        0,
      )
      const template = sameTypeUnits[0]
      const additions = Array.from(
        { length: quantity - sameTypeUnits.length },
        (_, index) => createRoomUnit(
          room,
          sameTypeUnits.length + index + 1,
          criteria,
          totalRoomCount,
          template,
        ),
      )
      return orderBySelectedRoom([...otherUnits, ...sameTypeUnits, ...additions])
    })
  }

  const addService = () => {
    const option = serviceOptions.find((item) => serviceKey(item) === serviceForm.optionKey)
    if (!option || !serviceDialogRoomKey) return
    const requestedQuantity = Math.max(1, Number(serviceForm.quantity || 1))
    const alreadySelected = roomUnits.reduce(
      (sum, unit) => sum + unit.services
        .filter((item) => item.type === option.type && item.serviceId === option.id)
        .reduce((itemTotal, item) => itemTotal + Number(item.quantity || 0), 0),
      0,
    )
    const availableQuantity = String(option.type).toUpperCase() === 'INVENTORY'
      ? Math.max(0, Number(option.quantityInStock || 0) - alreadySelected)
      : requestedQuantity
    const quantity = Math.min(requestedQuantity, availableQuantity)
    if (quantity <= 0) {
      setError(`Dịch vụ ${option.name} đã được chọn hết số lượng khả dụng.`)
      return
    }
    setRoomUnits((current) => current.map((unit) => {
      if (unit.key !== serviceDialogRoomKey) return unit
      const existing = unit.services.find((item) => item.type === option.type && item.serviceId === option.id)
      const services = existing
        ? unit.services.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item)
        : [...unit.services, {
            type: option.type,
            serviceId: option.id,
            name: option.name,
            price: option.price,
            quantity,
            imageUrl: option.imageUrl,
          }]
      return { ...unit, services }
    }))
    setError('')
    setServiceForm({ optionKey: '', quantity: 1 })
    setServiceDialogRoomKey(null)
  }

  const removeRoomService = (unitKey, service) => {
    setRoomUnits((current) => current.map((unit) => {
      if (unit.key !== unitKey) return unit
      return {
        ...unit,
        services: unit.services.filter((item) =>
          !(item.type === service.type && item.serviceId === service.serviceId)
        ),
      }
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    const token = getStoredToken()
    if (!selectedRooms.length) {
      setError('Vui lòng chọn ít nhất một loại phòng.')
      return
    }
    const unavailableRoom = selectedRooms.find((r) => (r.availableRooms != null && Number(r.availableRooms) <= 0) || r.status === 'MAINTENANCE')
    if (unavailableRoom) {
      setError(`Loại phòng ${houseTypeName(unavailableRoom)} hiện đang bảo trì hoặc tạm thời hết phòng, vui lòng chọn phòng khác.`)
      return
    }

    // Kiểm tra chi tiết các trường thông tin khách hàng
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

    if (timeError) {
      setError(timeError)
      return
    }
    if (!availablePolicies.length || !selectedPolicy) {
      setError('Chưa có gói thuê nào được cấu hình đủ giá cho tất cả phòng đã chọn.')
      return
    }
    if (scheduleError) {
      setError(scheduleError)
      return
    }

    setSubmitting(true)
    setError('')
    fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...form,
        roomId: null,
        roomTypeId: roomTypeIdOf(selectedRooms[0]),
        pricePolicyId: Number(selectedPolicy.id),
        numberOfAdults: roomUnits[0]?.numberOfAdults || 1,
        numberOfChildren: roomUnits[0]?.numberOfChildren || 0,
        rooms: roomUnits.map((unit) => ({
          roomId: null,
          roomTypeId: roomTypeIdOf(unit.room),
          quantity: 1,
          numberOfAdults: Number(unit.numberOfAdults || 1),
          numberOfChildren: Number(unit.numberOfChildren || 0),
          services: unit.services.map((item) => ({
            type: item.type,
            serviceId: item.serviceId,
            quantity: item.quantity,
          })),
        })),
        services: [],
        voucherCode: voucherCode.trim() || null,
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
      <>
        <div className="public-booking-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
          <div className="public-booking-modal public-payment-summary">
          <div className="public-booking-head">
            <div>
              <h2>Tóm tắt đơn đặt phòng</h2>
              <p>Booking {bookingDisplay(paymentSummary)} · {paymentSummary.rooms?.length || roomUnits.length} phòng</p>
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
              {(paymentSummary.rooms || []).map((room, index) => {
                const configuredRoom = roomUnits[index]
                const configuredServiceTotal = configuredRoom?.services.reduce(
                  (sum, service) => sum + Number(service.price || 0) * Number(service.quantity || 0),
                  0,
                ) || 0
                return (
                  <div key={room.bookingDetailId}>
                    <span>
                      {houseTypeName(room)} · Phòng {configuredRoom?.unitIndex || index + 1}
                      <small>
                        {configuredRoom?.services.length
                          ? configuredRoom.services.map((service) => `${service.name} × ${service.quantity}`).join(', ')
                          : 'Không có dịch vụ đi kèm'}
                      </small>
                    </span>
                    <strong>{formatPrice(Number(room.finalRoomAmount ?? room.priceAtBooking ?? 0) + configuredServiceTotal)}</strong>
                  </div>
                )
              })}
            </div>
            <div className="public-payment-grid">
              {paymentSummary.roomDiscountAmount > 0 && (
                <>
                  <div><span>Tiền phòng gốc</span><strong>{formatPrice(paymentSummary.roomChargeBeforeDiscount)}</strong></div>
                  {Number(paymentSummary.memberDiscountAmount || 0) > 0 && (
                    <div><span>Ưu đãi thành viên {Number(paymentSummary.memberDiscountPercent || 0).toLocaleString('vi-VN')}%</span><strong>-{formatPrice(paymentSummary.memberDiscountAmount)}</strong></div>
                  )}
                  {Number(paymentSummary.roomDiscountAmount || 0) - Number(paymentSummary.memberDiscountAmount || 0) > 0 && (
                    <div><span>{paymentSummary.voucherCode ? `Voucher ${paymentSummary.voucherCode}` : 'Ưu đãi'}</span><strong>-{formatPrice(Number(paymentSummary.roomDiscountAmount || 0) - Number(paymentSummary.memberDiscountAmount || 0))}</strong></div>
                  )}
                </>
              )}
              <div><span>Tiền phòng</span><strong>{formatPrice(paymentSummary.roomCharge)}</strong></div>
              <div><span>Dịch vụ</span><strong>{formatPrice(paymentSummary.serviceCharge)}</strong></div>
              <div><span>Tổng tạm tính</span><strong>{formatPrice(paymentSummary.totalAmount)}</strong></div>
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
      <form className="public-booking-modal multi-booking-modal" onSubmit={submit}>
        <div className="public-booking-head">
          <div>
            <h2>Đặt nhiều phòng</h2>
            <p>{roomUnits.length} phòng trong cùng một booking</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="public-booking-body multi-booking-body">
          <section>
            <h3>Thông tin khách hàng</h3>
            <div className="public-booking-grid">
              <label><span>Họ tên *</span><input required placeholder="VD: Nguyễn Văn An" value={form.fullName} onChange={(e) => { setError(''); setForm({ ...form, fullName: e.target.value }) }} /></label>
              <label><span>Số điện thoại *</span><input required placeholder="VD: 0912345678" value={form.phone} onChange={(e) => { setError(''); setForm({ ...form, phone: e.target.value.replace(/[^\d+]/g, '').slice(0, 11) }) }} /></label>
              <label><span>Email *</span><input type="email" required placeholder="VD: email@example.com" value={form.email} onChange={(e) => { setError(''); setForm({ ...form, email: e.target.value }) }} /></label>
              <label><span>Ngày sinh</span><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
              <label><span>Căn cước công dân *</span><input required maxLength={12} placeholder="Đủ 12 chữ số CCCD" value={form.identityDocumentNumber} onChange={(e) => { setError(''); setForm({ ...form, identityDocumentNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }) }} /></label>
              <label className="public-booking-wide"><span>Địa chỉ</span><input placeholder="Địa chỉ thường trú" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            </div>
          </section>

          <section>
            <h3>Thời gian nhận & trả phòng</h3>
            <div className="public-booking-grid">
              <label>
                <span>Nhận phòng</span>
                <LocalizedDateTimeInput
                  ariaLabel="Ngày giờ nhận phòng"
                  required
                  value={form.checkInTarget}
                  min={nowDateTimeLocalMin()}
                  onChange={updateCheckInTarget}
                  busySlots={roomSchedules.flatMap(s => s.busySlots)}
                  rooms={selectedRooms}
                  checkInValue={form.checkInTarget}
                  checkOutValue={form.checkOutTarget}
                  isCheckIn={true}
                />
              </label>
              <label>
                <span>Trả phòng</span>
                <LocalizedDateTimeInput
                  ariaLabel="Ngày giờ trả phòng"
                  required
                  allowBeforeMin
                  invalid={Boolean(timeError)}
                  value={form.checkOutTarget}
                  min={form.checkInTarget || nowDateTimeLocalMin()}
                  onChange={updateCheckOutTarget}
                  disabled={isAutoCheckoutPolicy(selectedPolicy)}
                  busySlots={roomSchedules.flatMap(s => s.busySlots)}
                  rooms={selectedRooms}
                  checkInValue={form.checkInTarget}
                  checkOutValue={form.checkOutTarget}
                  isCheckIn={false}
                />
              </label>
            </div>
            {timeError && <p className="public-booking-field-error">{timeError}</p>}
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', color: '#1e293b', fontSize: 13, display: 'flex', alignItems: 'center' }}>
              <span>
                Thời gian lưu trú: <strong style={{ color: '#0f172a' }}>{stayBreakdown.totalNights === 1 ? '2 ngày 1 đêm' : `${stayBreakdown.totalNights + 1} ngày ${stayBreakdown.totalNights} đêm`}</strong>
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

          <section className="multi-selected-section">
            <h3>Loại phòng trong booking này</h3>
            <div className="multi-selected-rooms">
              {selectedRooms.map((room) => (
                <article key={roomKey(room)}>
                  <div>
                    <strong>{houseTypeName(room)}</strong>
                    <span>{houseTypeName(room)} · tối đa {room.maxAdults || 0} NL · {room.maxChildren || 0} TE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {(() => {
                        const sched = roomSchedules.find((item) => roomKey(item.room) === roomKey(room))
                        const hasConflict = sched && findOverlappingSlot(sched.busySlots, form.checkInTarget, form.checkOutTarget)
                        return (
                          <>
                            {hasConflict ? (
                              <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                ⚠️ Đã kín lịch khung giờ này
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                ✓ Khung giờ này còn trống
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewingScheduleRoom(sched || { room, busySlots: [] })}
                              style={{ fontSize: 11, background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                            >
                              📅 Xem lịch đặt
                            </button>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <b>{formatPrice(roomPriceItems.find((item) => roomKey(item.room) === roomKey(room))?.price || roomPrice(room))}{isHourlyPolicy(selectedPolicy) && <small>/giờ</small>}</b>
                  <label className="room-quantity-field">
                    <span>Số phòng</span>
                    <div className="room-quantity-stepper">
                      <button type="button" onClick={() => updateRoomQuantity(room, (roomQuantities[roomKey(room)] || 1) - 1)}>-</button>
                      <input type="number" min="1" max={room.availableRooms || undefined} value={roomQuantities[roomKey(room)] || 1} onChange={(e) => updateRoomQuantity(room, e.target.value)} />
                      <button type="button" onClick={() => updateRoomQuantity(room, (roomQuantities[roomKey(room)] || 1) + 1)}>+</button>
                    </div>
                  </label>
                </article>
              ))}
            </div>
            <BookingVoucherControl
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              voucherEligible={voucherEligible}
              voucherDiscount={voucherDiscount}
              eligibleVouchers={eligibleVouchers}
              selectedVoucher={selectedVoucher}
              allVouchers={vouchers}
              setVouchers={setVouchers}
              roomTotal={roomTotal}
            />
          </section>

          <section className="multi-room-config-section">
            <div className="multi-room-config-heading">
              <div>
                <h3>Cấu hình từng phòng</h3>
                <p>Chọn số khách và dịch vụ riêng cho từng phòng trong booking.</p>
              </div>
            </div>
            <div className="multi-room-units">
              {roomUnits.map((unit) => {
                const unitServiceTotal = unit.services.reduce(
                  (sum, service) => sum + Number(service.price || 0) * Number(service.quantity || 0),
                  0,
                )
                return (
                  <article className="multi-room-unit" key={unit.key}>
                    <div className="multi-room-unit-head">
                      <div>
                        <span>Phòng {unit.unitIndex}</span>
                        <strong>{houseTypeName(unit.room)}</strong>
                      </div>
                      <b>{formatPrice(roomPriceItems.find((item) => roomKey(item.room) === unit.typeKey)?.price || roomPrice(unit.room))}</b>
                    </div>

                    <div className="multi-room-unit-guests">
                      <label>
                        <span>Người lớn</span>
                        <input
                          type="number"
                          min="1"
                          max={unit.room.maxAdults || undefined}
                          value={unit.numberOfAdults}
                          onChange={(event) => updateRoomGuest(unit.key, 'numberOfAdults', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Trẻ em</span>
                        <input
                          type="number"
                          min="0"
                          max={unit.room.maxChildren || undefined}
                          value={unit.numberOfChildren}
                          onChange={(event) => updateRoomGuest(unit.key, 'numberOfChildren', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="multi-room-unit-services">
                      <div className="multi-room-unit-service-head">
                        <div>
                          <strong>Dịch vụ của phòng này</strong>
                          <span>{unit.services.length ? `${unit.services.length} dịch vụ đã chọn` : 'Chưa chọn dịch vụ'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setServiceForm({ optionKey: '', quantity: 1 })
                            setServiceDialogRoomKey(unit.key)
                          }}
                        >
                          + Thêm dịch vụ
                        </button>
                      </div>

                      {unit.services.length > 0 && (
                        <div className="multi-room-service-list">
                          {unit.services.map((service) => (
                            <div key={`${service.type}-${service.serviceId}`}>
                              <span>
                                <b>{service.name}</b>
                                <small>{formatPrice(service.price)} × {service.quantity}</small>
                              </span>
                              <strong>{formatPrice(Number(service.price) * service.quantity)}</strong>
                              <button
                                type="button"
                                aria-label={`Xóa ${service.name} khỏi phòng ${unit.unitIndex}`}
                                onClick={() => removeRoomService(unit.key, service)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="multi-room-unit-subtotal">
                        <span>Dịch vụ phòng</span>
                        <strong>{formatPrice(unitServiceTotal)}</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          {serviceDialogRoom && (
            <div
              className="public-service-dialog-overlay"
              role="presentation"
              onClick={(event) => event.target === event.currentTarget && setServiceDialogRoomKey(null)}
            >
              <div className="public-service-dialog" role="dialog" aria-modal="true" aria-labelledby="service-dialog-title">
                <div className="public-service-dialog-head">
                  <div>
                    <h3 id="service-dialog-title">Dịch vụ cho {houseTypeName(serviceDialogRoom.room)} – Phòng {serviceDialogRoom.unitIndex}</h3>
                    <p>Dịch vụ được ghi nhận và thanh toán riêng cho phòng này.</p>
                  </div>
                  <button type="button" onClick={() => setServiceDialogRoomKey(null)} aria-label="Đóng">×</button>
                </div>

                <div className="public-service-dialog-list">
                  {serviceOptions.length ? serviceOptions.map((service) => (
                    <button
                      key={serviceKey(service)}
                      type="button"
                      className={serviceForm.optionKey === serviceKey(service) ? 'selected' : ''}
                      onClick={() => setServiceForm((current) => ({ ...current, optionKey: serviceKey(service) }))}
                    >
                      <span className="public-service-avatar">
                        {service.imageUrl ? (
                          <img src={resolveImageUrl(service.imageUrl)} alt={service.name} />
                        ) : service.name?.charAt(0)}
                      </span>
                      <span>
                        <strong>{service.name}</strong>
                        <small>{serviceTypeLabel(service.type)} · {formatPrice(service.price)} / {serviceUnit(service.type)}</small>
                      </span>
                      {String(service.type).toUpperCase() === 'INVENTORY' && (
                        <em>{service.quantityInStock} còn lại</em>
                      )}
                    </button>
                  )) : <p>Hiện chưa có dịch vụ khả dụng.</p>}
                </div>

                <div className="public-service-dialog-footer">
                  <label>
                    <span>Số lượng</span>
                    <input
                      type="number"
                      min="1"
                      max={selectedInventoryRemaining}
                      value={serviceForm.quantity}
                      onChange={(e) => setServiceForm({ ...serviceForm, quantity: e.target.value })}
                    />
                  </label>
                  <div>
                    <button type="button" onClick={() => setServiceDialogRoomKey(null)}>Hủy</button>
                    <button
                      type="button"
                      onClick={addService}
                      disabled={!serviceForm.optionKey || selectedInventoryRemaining === 0}
                    >
                      Thêm dịch vụ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="public-booking-error" style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {checkingSchedule && <div className="public-booking-warning">Đang kiểm tra lịch phòng...</div>}
        {scheduleError && <div className="public-booking-warning">{scheduleError}</div>}
        {scheduleNotice && <div className="public-booking-search-note">{scheduleNotice}</div>}
        {loadingMeta && <div className="public-booking-error">Đang tải thông tin đặt phòng...</div>}

        <div className="public-booking-summary">
          <span>Tiền phòng: <strong>{formatPrice(roomTotal)}{isHourlyPolicy(selectedPolicy) ? ' / giờ đầu' : ''}</strong></span>
          {voucherDiscount > 0 && <span>Voucher: <strong>-{formatPrice(voucherDiscount)}</strong></span>}
          <span>Dịch vụ: <strong>{formatPrice(serviceTotal)}</strong></span>
          <span>Tổng tạm tính: <strong>{formatPrice(roomTotalAfterDiscount + serviceTotal)}</strong></span>
        </div>

        <div className="public-booking-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="submit" disabled={submitting || loadingMeta}>{submitting ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}</button>
        </div>

        {viewingScheduleRoom && (
          <RoomScheduleCalendarModal
            room={viewingScheduleRoom.room}
            initialBusySlots={viewingScheduleRoom.busySlots}
            currentCheckIn={form.checkInTarget}
            currentCheckOut={form.checkOutTarget}
            onSelectCheckIn={(dayKey) => {
              updateCheckInTarget(`${dayKey}T13:00`)
            }}
            onClose={() => setViewingScheduleRoom(null)}
          />
        )}
      </form>
    </div>
  )
}

function BookingCart({ selectedRooms, requestedRooms, onRemove, onOpenBooking }) {
  const selectedCount = selectedRooms.reduce((sum, room) => sum + selectedQuantity(room), 0)
  const isEnough = selectedCount >= requestedRooms

  return (
    <aside className="rooms-booking-cart" aria-label="Booking của bạn">
      <div className="rooms-booking-cart-head">
        <div>
          <h2>Booking của bạn</h2>
          <p>
            Đã chọn {selectedRooms.length} loại · {selectedCount}/{requestedRooms} loại phòng
          </p>
        </div>
        <span className={isEnough ? 'is-ready' : ''}>{isEnough ? 'Đủ phòng' : 'Chưa đủ'}</span>
      </div>
      <div className="rooms-booking-cart-list">
        {selectedRooms.length ? selectedRooms.map((room) => (
          <div key={roomKey(room)}>
            <span>{houseTypeName(room)} × {selectedQuantity(room)}</span>
            <button type="button" onClick={() => onRemove(roomKey(room))} aria-label="Bỏ loại phòng">×</button>
          </div>
        )) : <p>Chọn loại phòng từ danh sách để tạo booking.</p>}
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
  const [luckyReward, setLuckyReward] = useState(null)
  const [unavailableNotice, setUnavailableNotice] = useState('')

  useEffect(() => {
    const hasSearchDates = Boolean(searchCriteria?.checkInDate && searchCriteria?.checkOutDate)
    const params = hasSearchDates ? new URLSearchParams({
      checkInDate: searchCriteria.checkInDate,
      checkOutDate: searchCriteria.checkOutDate,
      rooms: String(searchCriteria.rooms),
      adults: String(searchCriteria.adults),
      children: String(searchCriteria.children),
    }) : null
    const url = params ? `${API_BASE_URL}/rooms/search?${params}` : `${API_BASE_URL}/rooms/types`

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const allRooms = Array.isArray(data) ? data : []
        setRooms(allRooms)

        const targetId = searchCriteria?.focusRoomId || searchCriteria?.roomTypeId
        if (targetId) {
          const matched = allRooms.find((room) => String(room.roomTypeId || room.id || room.roomId) === String(targetId))
          if (matched) {
            setSelectedRooms([{ ...matched, quantity: 1 }])
            writeBookingCart([{ ...matched, quantity: 1 }])
            setUnavailableNotice('')
            setTimeout(() => {
              document.querySelector('.rooms-booking-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 250)
          } else {
            const targetName = searchCriteria?.roomTypeName || 'Hạng phòng bạn chọn'
            const dateRange = hasSearchDates ? `từ ${searchCriteria.checkInDate} đến ${searchCriteria.checkOutDate}` : 'ngày bạn chọn'
            setUnavailableNotice(`⚠️ ${targetName} hiện đã hết phòng ${dateRange}. Dưới đây là các hạng phòng còn trống khác để bạn lựa chọn:`)
          }
        }

        const highest = Math.max(...allRooms.map((room) => roomPrice(room, searchCriteria?.checkInDate)), 0)
        setMaxPrice(Math.max(highest, 100000))
      })
      .catch(() => setError('Không thể tải danh sách phòng.'))
      .finally(() => setLoading(false))
  }, [searchCriteria])

  useEffect(() => {
    if (!rooms.length || !selectedRooms.length) return
    setSelectedRooms((current) => current.map((selectedRoom) => {
      const freshRoom = rooms.find((room) => roomKey(room) === roomKey(selectedRoom))
      return freshRoom ? { ...selectedRoom, ...freshRoom } : selectedRoom
    }))
  }, [rooms])

  useEffect(() => {
    writeBookingCart(selectedRooms)
  }, [selectedRooms])

  const highestPrice = useMemo(() => {
    const highest = Math.max(...rooms.map((room) => roomPrice(room, searchCriteria?.checkInDate)), 0)
    return Math.max(highest, 100000)
  }, [rooms, searchCriteria])

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        const isMaintenance = String(room.status || '').toUpperCase() === 'MAINTENANCE'
        if (isMaintenance) return false
        const isUnavailable = !room.status ? false : (String(room.status).toUpperCase() !== 'AVAILABLE')
        if (isUnavailable) return false
        if (room.availableRooms != null && Number(room.availableRooms) <= 0) return false

        const price = roomPrice(room, searchCriteria?.checkInDate)
        const matchesPrice = price <= maxPrice
        return matchesPrice
      })
      .sort((a, b) => roomPrice(a, searchCriteria?.checkInDate) - roomPrice(b, searchCriteria?.checkInDate))
  }, [rooms, maxPrice, searchCriteria])

  const requestedRooms = searchCriteria?.rooms || Math.max(1, selectedRooms.length || 1)
  const selectedRoomIds = useMemo(() => new Set(selectedRooms.map(roomKey)), [selectedRooms])

  const toggleRoom = (room) => {
    setSelectedRooms((current) => {
      if (current.some((item) => roomKey(item) === roomKey(room))) {
        return current.filter((item) => roomKey(item) !== roomKey(room))
      }
      return [...current, { ...room, quantity: 1 }]
    })
  }

  const removeRoom = (key) => {
    setSelectedRooms((current) => current.filter((room) => roomKey(room) !== key))
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
              criteria={searchCriteria}
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
                <h2>{searchCriteria?.isDefaultRoomTypeList ? 'Tất cả loại phòng' : 'Loại phòng trống phù hợp'}</h2>
                <p>
                  {!searchCriteria?.isDefaultRoomTypeList
                    ? `Từ ${searchCriteria.checkInDate} đến ${searchCriteria.checkOutDate} · cần ${searchCriteria.rooms} phòng`
                    : 'Khách chọn loại phòng, lễ tân sẽ gán phòng cụ thể khi check-in.'}
                </p>
              </div>
              <span>{visibleRooms.length} phù hợp</span>
            </div>

            {unavailableNotice && (
              <div style={{
                background: '#fff7ed',
                border: '1.5px solid #fdba74',
                color: '#9a3412',
                padding: '14px 18px',
                borderRadius: '14px',
                marginBottom: '20px',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <strong>{unavailableNotice}</strong>
              </div>
            )}

            {loading ? (
              <div className="rooms-state">Đang tải danh sách phòng...</div>
            ) : error ? (
              <div className="rooms-state rooms-state-error">{error}</div>
            ) : visibleRooms.length ? (
              <div className="public-rooms-grid" aria-label="Danh sách phòng">
                {visibleRooms.map((room) => (
                  <RoomCard
                    key={roomKey(room)}
                    room={room}
                    criteria={searchCriteria}
                    selected={selectedRoomIds.has(roomKey(room))}
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
            {!getStoredToken()
              ? String(createdBooking.status || '').toUpperCase() === 'CONFIRMED'
                ? `Đã tạo booking ${bookingDisplay(createdBooking)} và thanh toán thành công. Email xác nhận đã được gửi về cho bạn.`
                : `Đã tạo booking ${bookingDisplay(createdBooking)}. Thông tin đặt phòng đã được gửi về email của bạn.`
              : createdBooking.requiresDeposit
              ? `Đã lưu booking ${bookingDisplay(createdBooking)}. Đơn đang chờ thanh toán trước.`
              : `Đã tạo booking ${bookingDisplay(createdBooking)}. Trạng thái: đặt phòng thành công.`}
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
              if (booking?.luckyVoucherCode) {
                setLuckyReward({
                  code: booking.luckyVoucherCode,
                  discountPercent: Number(booking.luckyVoucherDiscountPercent || 8),
                  endDate: booking.luckyVoucherEndDate,
                  bookingCode: bookingDisplay(booking),
                })
              }
            }}
          />
        )}

        {luckyReward && (
          <LuckyVoucherRewardModal
            reward={luckyReward}
            onClose={() => setLuckyReward(null)}
          />
        )}
      </main>
    </div>
  )
}

export default RoomsPage
