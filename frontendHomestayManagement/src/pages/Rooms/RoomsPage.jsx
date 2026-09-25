import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import RoomScheduleCalendarModal from '../../components/RoomScheduleCalendar/RoomScheduleCalendarModal'
import CustomDateTimePicker from '../../components/DateTimePicker/CustomDateTimePicker'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import { clearBookingCart, isRoomSelectable, readBookingCart, writeBookingCart } from '../../utils/bookingCart'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import { STAFF_ROLES, roleDefaultPath } from '../../utils/roleUtils'
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

function getUsedVouchers() {
  try {
    const raw = localStorage.getItem('homestay_used_vouchers')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function isVoucherUsed(code) {
  if (!code) return false
  const used = getUsedVouchers()
  return used.some((item) => normalizeCode(item) === normalizeCode(code))
}

function markVoucherAsUsed(code) {
  if (!code) return
  const norm = normalizeCode(code)
  try {
    const used = getUsedVouchers()
    if (!used.some((item) => normalizeCode(item) === norm)) {
      used.push(norm)
      localStorage.setItem('homestay_used_vouchers', JSON.stringify(used))
    }
    const rawSaved = localStorage.getItem('homestay_saved_vouchers')
    const saved = rawSaved ? JSON.parse(rawSaved) : []
    const updated = saved.filter((item) => normalizeCode(item.code) !== norm)
    localStorage.setItem('homestay_saved_vouchers', JSON.stringify(updated))
  } catch {}
}

function getSavedVouchers() {
  try {
    const raw = localStorage.getItem('homestay_saved_vouchers')
    const list = raw ? JSON.parse(raw) : []
    const used = getUsedVouchers()
    return list.filter((v) => v && v.code && !used.some((u) => normalizeCode(u) === normalizeCode(v.code)))
  } catch {
    return []
  }
}

function saveVoucherToStorage(voucher) {
  if (!voucher || !voucher.code) return
  if (isVoucherUsed(voucher.code)) return
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
  const type = String(voucher.discountType || '').toUpperCase()
  let discount = (type === 'PERCENT' || type === 'PERCENTAGE')
    ? Math.round((roomTotal * discountValue) / 100)
    : Math.round(discountValue)
  const maxDiscount = Number(voucher.maxDiscountAmount || 0)
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount)
  return Math.max(0, Math.min(discount, roomTotal))
}

function voucherDiscountText(voucher) {
  if (!voucher) return ''
  const type = String(voucher.discountType || '').toUpperCase()
  if (type === 'PERCENT' || type === 'PERCENTAGE') {
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

function roomWeekdayPrice(room) {
  if (!room) return 0
  if (room.weekdayPrice != null && Number(room.weekdayPrice) > 0) {
    return Number(room.weekdayPrice)
  }
  if (Array.isArray(room.prices) && room.prices.length > 0) {
    const weekdayItem = room.prices.find(
      (p) => String(p.dayType || '').toUpperCase() === 'WEEKDAY' && Number(p.price) > 0
    )
    if (weekdayItem) return Number(weekdayItem.price)
  }
  if (room.price != null && Number(room.price) > 0) return Number(room.price)
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
  date.setHours(14, 0, 0, 0)
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
  const matched = (room.prices || []).find((price) =>
    (String(price.policyName) === String(policy.policyName) || String(price.pricePolicyId) === String(policy.id))
    && String(price.rentType || '').toUpperCase() === String(policy.rentType || '').toUpperCase()
    && String(price.dayType || '').toUpperCase() === String(dayType || '').toUpperCase()
  )
  if (matched) return matched
  const dynamicPrice = calculateDynamicRoomPrice(room, null, null)
  if (dynamicPrice > 0 || (room.price != null && Number(room.price) > 0) || (room.weekdayPrice != null && Number(room.weekdayPrice) > 0)) {
    return { price: dynamicPrice || Number(room.price || room.weekdayPrice || 0) }
  }
  return { price: Number(room.price || room.weekdayPrice || 100000) }
}

function normalizeRentType(rentType) {
  return String(rentType || '').trim().toUpperCase()
}

function isOvernightPolicy(policy) {
  return ['OVERNIGHT', 'NIGHTLY', 'BY_NIGHT'].includes(normalizeRentType(policy?.rentType))
}

function isAutoCheckoutPolicy(policy) {
  return false
}

function isHourlyPolicy(policy) {
  return false
}

function addHoursToDateTimeLocal(value, hours) {
  if (!value || !hours) return value
  const date = new Date(value)
  date.setHours(date.getHours() + Number(hours))
  return toDateTimeLocal(date)
}

function nowDateTimeLocalMin() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return toDateTimeLocal(now)
}

function overnightCheckoutValue(checkInTarget) {
  if (!checkInTarget) return ''
  const date = new Date(checkInTarget)
  date.setDate(date.getDate() + 1)
  date.setHours(11, 0, 0, 0)
  return toDateTimeLocal(date)
}

function normalizeBookingTime(form, policy) {
  if (!form.checkInTarget) return form
  return {
    ...form,
    checkOutTarget: form.checkOutTarget || overnightCheckoutValue(form.checkInTarget),
  }
}

function validateBookingTime(form) {
  if (!form.checkInTarget || !form.checkOutTarget) return ''
  const checkIn = new Date(form.checkInTarget)
  const checkOut = new Date(form.checkOutTarget)
  if (checkOut <= checkIn) {
    return 'Giờ trả phòng phải sau giờ nhận phòng ít nhất 1 đêm (Tối thiểu 2 ngày 1 đêm).'
  }
  const diffHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
  if (diffHours < 18) {
    return 'Thời gian lưu trú tối thiểu là 2 ngày 1 đêm. Vui lòng chọn ngày trả phòng từ ngày hôm sau trở đi.'
  }
  return ''
}

function rentTypeLabel(rentType) {
  const labels = {
    OVERNIGHT: '2 ngày 1 đêm',
    NIGHTLY: '2 ngày 1 đêm',
    BY_NIGHT: '2 ngày 1 đêm',
    DAILY: '2 ngày 1 đêm',
    BY_DAY: '2 ngày 1 đêm',
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
    guestName: template?.guestName || '',
    guestEmail: template?.guestEmail || '',
    guestPhone: template?.guestPhone || '',
    services: [],
  }
}

function initialRoomUnits(selectedRooms, criteria) {
  const totalRoomCount = selectedRooms.reduce((sum, room) => sum + selectedQuantity(room), 0)
  let unitIndexCounter = 1
  return selectedRooms.flatMap((room) =>
    Array.from(
      { length: selectedQuantity(room) },
      () => createRoomUnit(room, unitIndexCounter++, criteria, totalRoomCount),
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
      <a className="home-logo" href="/home">Lá Đỏ Homestay</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Lá Đỏ Tour & Săn Mây">🍁 Lá Đỏ 3D Tour</a>
        <a href="/explore" title="Khám phá xung quanh Lá Đỏ Homestay & Sa Pa">Khám phá xung quanh</a>
        <a href="/rooms" className="home-nav-active">Phòng</a>
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
              {STAFF_ROLES.has(currentUser?.role) && (
                <a href={roleDefaultPath(currentUser.role)}>
                  {currentUser.role === 'ROLE_ADMIN' ? 'Quản lý Lá Đỏ Homestay' : 'Bàn làm việc vận hành'}
                </a>
              )}
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

function RoomCard({ room, selected, onToggle, criteria }) {
  const typeOnly = isRoomTypeSearchResult(room)
  const hasSearchedDates = Boolean(criteria?.checkInDate && criteria?.checkOutDate && !criteria?.isDefaultRoomTypeList)
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
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?redirect=${returnUrl}`)
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
  const isSoldOut = hasSearchedDates ? (Number(room.availableRooms || 0) <= 0) : false
  const isBooked = isSoldOut || (!typeOnly && (String(room.status || '').toUpperCase() === 'BOOKED' || String(room.status || '').toUpperCase() === 'OCCUPIED'))
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

          <span className={`public-room-badge${!isAvailable ? ' is-maintenance' : ''}`}>
            {isMaintenance
              ? '⚠️ Tạm bảo trì'
              : (hasSearchedDates && Number(room.availableRooms || 0) <= 0)
              ? '❌ Hết phòng ngày này'
              : isBooked
              ? '🔒 Đã kín lịch'
              : hasSearchedDates
              ? `Còn ${room.availableRooms || 0} phòng trống`
              : 'Sẵn sàng đặt'}
          </span>
          <button
            type="button"
            className={`public-room-heart-btn${isLiked ? ' is-liked' : ''}`}
            title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onClick={toggleHeart}
            aria-label={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            {isLiked ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#ef4444" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            )}
          </button>
        </div>
      </a>
      <div className="public-room-body">
        <div className="public-room-title-row">
          <h3>{title}</h3>
          <span> {room.averageRating ? Number(room.averageRating).toFixed(1) : '5.0'}</span>
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
        <div className="lucky-reward-sparkles" aria-hidden="true">  </div>
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
              {copied ? '✓ Đã chép' : ' Sao chép'}
            </button>
          </div>
          <div className="lucky-voucher-meta">
            <span>️ Voucher may mắn</span>
            <span>• Hạn dùng 3 tháng</span>
            <span>• Không giới hạn đơn tối thiểu</span>
          </div>
        </div>

        <div className="lucky-reward-footer">
          <button type="button" className="lucky-reward-save-btn" onClick={handleSaveAndCopy}>
            {copied ? '✓ Đã lưu & sao chép mã!' : ' Lưu & Sao chép mã'}
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
    const used = getUsedVouchers()
    return list.filter((voucher) => {
      if (!voucher || !voucher.code) return false
      if (used.some((u) => normalizeCode(u) === normalizeCode(voucher.code))) return false
      if (voucher.usageLimit != null && voucher.usedCount != null && Number(voucher.usedCount) >= Number(voucher.usageLimit)) {
        return false
      }
      return true
    })
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

    if (isVoucherUsed(trimmed)) {
      setManualError('Mã voucher này đã được sử dụng cho đơn đặt trước đó.')
      return
    }

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
      if (isVoucherUsed(data.code) || (data.usageLimit != null && data.usedCount != null && Number(data.usedCount) >= Number(data.usageLimit))) {
        throw new Error('Mã voucher này đã hết lượt sử dụng.')
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
                        {isLucky ? ` ${voucher.code}` : voucher.code}
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
    identityDocumentNumber: currentUser?.identityDocumentNumber || '',
    checkInTarget: criteria?.checkInDate ? dateKeyToDateTimeLocal(criteria.checkInDate, 14) : defaultCheckInValue(),
    checkOutTarget: (criteria?.checkInDate && criteria?.checkOutDate && criteria.checkOutDate > criteria.checkInDate)
      ? dateKeyToDateTimeLocal(criteria.checkOutDate, 12)
      : defaultCheckOutValue(criteria?.checkInDate ? dateKeyToDateTimeLocal(criteria.checkInDate, 14) : defaultCheckInValue()),
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
  const [quantityErrors, setQuantityErrors] = useState({})
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

  const startPayment = (targetSummary = null) => {
    const activeSummary = targetSummary || paymentSummary
    if (!activeSummary) return
    const token = getStoredToken()
    const guestEmail = form.email.trim()
    setPaymentLoading(true)
    setError('')
    fetch(token
      ? `${API_BASE_URL}/payments/sepay/bookings/${activeSummary.bookingId}`
      : `${API_BASE_URL}/payments/sepay/public/bookings/${activeSummary.bookingId}`, {
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
        const used = getUsedVouchers()
        const mergedVouchers = [...savedList]
        activeList.forEach((v) => {
          if (!mergedVouchers.some((item) => normalizeCode(item.code) === normalizeCode(v.code))) {
            mergedVouchers.push(v)
          }
        })
        const availableVouchers = mergedVouchers.filter((v) => {
          if (!v || !v.code) return false
          if (used.some((u) => normalizeCode(u) === normalizeCode(v.code))) return false
          if (v.usageLimit != null && v.usedCount != null && Number(v.usedCount) >= Number(v.usageLimit)) return false
          return true
        })
        setVouchers(availableVouchers)
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
          const overnightPolicy = nextPolicies.find((p) => ['OVERNIGHT', 'DAILY', 'BY_NIGHT', 'BY_DAY'].includes(String(p.rentType || '').toUpperCase()))
          const initialPolicy = nextPolicies.find((policy) => String(policy.id) === String(current.pricePolicyId))
            || overnightPolicy
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
    const list = policies.filter((policy) =>
      selectedRooms.every((room) => findRoomPolicyPrice(room, policy, selectedDayType))
    )
    return list.length ? list : policies
  }, [policies, selectedDayType, selectedRooms])
  const selectedPolicy = availablePolicies.find((policy) => String(policy.id) === String(form.pricePolicyId)) || availablePolicies[0] || policies[0]
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
      const dIn = new Date(form.checkInTarget)
      const dOut = new Date(form.checkOutTarget)
      const fromDate = `${dIn.getFullYear()}-${String(dIn.getMonth() + 1).padStart(2, '0')}-01`
      const lastDayOut = new Date(dOut.getFullYear(), dOut.getMonth() + 2, 0).getDate()
      const toDate = `${dOut.getFullYear()}-${String(dOut.getMonth() + 2).padStart(2, '0')}-${String(lastDayOut).padStart(2, '0')}`

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
    if (!value) return
    const targetDateKey = value.split('T')[0]
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (targetDateKey < todayKey) return
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
    const unit = roomUnits.find((u) => u.key === unitKey)
    if (!unit) return
    const numericValue = Number(value)
    if (field === 'numberOfAdults') {
      const max = Number(unit.room.maxAdults || 1)
      if (isNaN(numericValue) || numericValue < 1) {
        setError(`Phòng ${unit.unitIndex} (${houseTypeName(unit.room)}) cần tối thiểu 1 người lớn. Không thể giảm thêm.`)
        return
      }
      if (numericValue > max) {
        setError(`Phòng ${unit.unitIndex} (${houseTypeName(unit.room)}) chỉ đón tối đa ${max} người lớn. Không thể tăng thêm.`)
        return
      }
    } else if (field === 'numberOfChildren') {
      const max = Number(unit.room.maxChildren || 0)
      if (isNaN(numericValue) || numericValue < 0) {
        setError('Số lượng trẻ em không thể nhỏ hơn 0.')
        return
      }
      if (numericValue > max) {
        setError(`Phòng ${unit.unitIndex} (${houseTypeName(unit.room)}) chỉ đón tối đa ${max} trẻ em. Không thể tăng thêm.`)
        return
      }
    }
    setError('')
    setRoomUnits((current) => current.map((item) => {
      if (item.key !== unitKey) return item
      const nextValue = field === 'numberOfAdults'
        ? Math.max(1, Math.min(Number(item.room.maxAdults || 1), numericValue || 1))
        : field === 'numberOfChildren'
        ? Math.max(0, Math.min(Number(item.room.maxChildren || 0), numericValue || 0))
        : value
      return { ...item, [field]: nextValue }
    }))
  }

  const updateRoomQuantity = (room, nextQuantity) => {
    const key = roomKey(room)
    const maxQuantity = Number(room.availableRooms != null ? room.availableRooms : 99)
    const currentQty = Number(roomQuantities[key] || 1)
    const requested = Number(nextQuantity)

    if (isNaN(requested) || requested < 1) {
      const msg = `Số lượng ${houseTypeName(room)} tối thiểu là 1 phòng. Không thể giảm thêm.`
      setError(msg)
      setQuantityErrors((prev) => ({ ...prev, [key]: msg }))
      return
    }
    if (requested > maxQuantity) {
      const msg = `Loại phòng ${houseTypeName(room)} hiện chỉ còn ${maxQuantity} phòng khả dụng. Không thể tăng thêm.`
      setError(msg)
      setQuantityErrors((prev) => ({ ...prev, [key]: msg }))
      return
    }

    setError('')
    setQuantityErrors((prev) => ({ ...prev, [key]: '' }))
    const quantity = Math.max(1, Math.min(maxQuantity, requested))
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
      let combined = []
      if (quantity <= sameTypeUnits.length) {
        combined = orderBySelectedRoom([...otherUnits, ...sameTypeUnits.slice(0, quantity)])
      } else {
        const totalRoomCount = Object.entries({ ...roomQuantities, [key]: quantity }).reduce(
          (sum, [, currentQuantity]) => sum + Number(currentQuantity || 0),
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
        combined = orderBySelectedRoom([...otherUnits, ...sameTypeUnits, ...additions])
      }
      return combined.map((u, idx) => ({
        ...u,
        unitIndex: idx + 1,
        key: `${roomKey(u.room)}-unit-${idx + 1}`,
      }))
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
    const unavailableRoom = selectedRooms.find((r) => r.status === 'MAINTENANCE')
    if (unavailableRoom) {
      setError(`Loại phòng ${houseTypeName(unavailableRoom)} hiện đang bảo trì, vui lòng chọn phòng khác.`)
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
    const overnightPolicy = policies.find((p) => ['OVERNIGHT', 'DAILY', 'BY_NIGHT', 'BY_DAY'].includes(String(p.rentType || '').toUpperCase()))
    const activePolicy = (selectedPolicy && !isHourlyPolicy(selectedPolicy) ? selectedPolicy : null)
      || overnightPolicy
      || selectedPolicy
      || availablePolicies[0]
      || policies[0]
    if (!activePolicy) {
      setError('Chưa có gói thuê nào được cấu hình trong hệ thống.')
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
        pricePolicyId: Number(activePolicy.id),
        numberOfAdults: roomUnits[0]?.numberOfAdults || 1,
        numberOfChildren: roomUnits[0]?.numberOfChildren || 0,
        rooms: roomUnits.map((unit, index) => {
          const uIdx = unit.unitIndex || (index + 1)
          return {
            roomId: null,
            roomTypeId: roomTypeIdOf(unit.room),
            quantity: 1,
            numberOfAdults: Number(unit.numberOfAdults || 1),
            numberOfChildren: Number(unit.numberOfChildren || 0),
            guestName: unit.guestName?.trim() || (uIdx === 1 ? form.fullName?.trim() : null),
            guestEmail: unit.guestEmail?.trim() || (uIdx === 1 ? form.email?.trim() : null),
            guestPhone: unit.guestPhone?.trim() || (uIdx === 1 ? form.phone?.trim() : null),
            services: unit.services.map((item) => ({
              type: item.type,
              serviceId: item.serviceId,
              quantity: item.quantity,
            })),
          }
        }),
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
        if (voucherCode && voucherCode.trim()) {
          const usedCode = voucherCode.trim()
          markVoucherAsUsed(usedCode)
          setVouchers((prev) => prev.filter((v) => normalizeCode(v.code) !== normalizeCode(usedCode)))
          setVoucherCode('')
        }
        setPaymentSummary(data)
        startPayment(data)
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
            <button type="button" onClick={() => onCreated({ ...paymentSummary, isSavedForLater: true })}>Để sau</button>
            <button type="button" disabled={paymentLoading} onClick={() => startPayment(paymentSummary)}>
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
            onSuccess={(booking) => onCreated({ ...paymentSummary, ...booking, requiresDeposit: false, isPaid: true })}
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
              <label>
                <span>Ngày sinh</span>
                <DateDropdownPicker
                  isDob={true}
                  value={form.dateOfBirth}
                  onChange={(val) => setForm({ ...form, dateOfBirth: val })}
                  placeholder="Chọn ngày sinh..."
                />
              </label>
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
                  busySlots={roomSchedules.flatMap((s, idx) => (s.busySlots || []).map((b) => ({
                    ...b,
                    room: s.room,
                    roomId: s.room?.roomId || s.room?.roomTypeId || s.room?.id,
                    roomNumber: s.room?.roomNumber,
                    roomName: s.room?.name || s.room?.roomTypeName,
                    roomIndex: idx,
                  })))}
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
                  invalid={Boolean(timeError)}
                  value={form.checkOutTarget}
                  min={overnightCheckoutValue(form.checkInTarget) || nowDateTimeLocalMin()}
                  onChange={updateCheckOutTarget}
                  disabled={false}
                  busySlots={roomSchedules.flatMap((s, idx) => (s.busySlots || []).map((b) => ({
                    ...b,
                    room: s.room,
                    roomId: s.room?.roomId || s.room?.roomTypeId || s.room?.id,
                    roomNumber: s.room?.roomNumber,
                    roomName: s.room?.name || s.room?.roomTypeName,
                    roomIndex: idx,
                  })))}
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
                        const isMaint = String(room.status || '').toUpperCase() === 'MAINTENANCE' ||
                          (sched?.busySlots || []).some(s => s.status === 'MAINTENANCE' && s.id === -1)
                        return (
                          <>
                            {isMaint ? (
                              <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                🛠️ Đang bảo trì
                              </span>
                            ) : hasConflict ? (
                              <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                ️ Đã kín lịch khung giờ này
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                ✓ Khung giờ này còn trống
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewingScheduleRoom(sched || { room, busySlots: [] })}
                              style={{ fontSize: 11, background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'underline' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              Xem lịch đặt
                            </button>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <b>{formatPrice(roomPriceItems.find((item) => roomKey(item.room) === roomKey(room))?.price || roomPrice(room))}{isHourlyPolicy(selectedPolicy) && <small>/giờ</small>}</b>
                  <div className="room-quantity-wrapper">
                    <label className="room-quantity-field">
                      <span>Số phòng</span>
                      <div className="room-quantity-stepper">
                        <button type="button" onClick={() => updateRoomQuantity(room, (roomQuantities[roomKey(room)] || 1) - 1)}>-</button>
                        <input type="number" min="1" max={room.availableRooms || undefined} value={roomQuantities[roomKey(room)] || 1} onChange={(e) => updateRoomQuantity(room, e.target.value)} />
                        <button type="button" onClick={() => updateRoomQuantity(room, (roomQuantities[roomKey(room)] || 1) + 1)}>+</button>
                      </div>
                    </label>
                    {quantityErrors[roomKey(room)] && (
                      <span className="room-quantity-inline-error">
                        ️ {quantityErrors[roomKey(room)]}
                      </span>
                    )}
                  </div>
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

          <section className="multi-room-units-section">
            <div className="multi-room-units-head">
              <h3>Số khách & Dịch vụ từng phòng</h3>
              <p>Chọn số khách và dịch vụ riêng cho từng phòng trong booking.</p>
            </div>
            <div className="multi-room-units">
              {roomUnits.map((unit, index) => {
                const currentUnitIndex = unit.unitIndex || (index + 1)
                const unitServiceTotal = unit.services.reduce(
                  (sum, service) => sum + Number(service.price || 0) * Number(service.quantity || 0),
                  0,
                )
                return (
                  <article className="multi-room-unit" key={unit.key || `${unit.typeKey}-${index}`}>
                    <div className="multi-room-unit-head">
                      <div>
                        <span>Phòng {currentUnitIndex}</span>
                        <strong>{unit.room.roomTypeName || unit.room.name || 'Loại phòng'}</strong>
                      </div>
                      <b>{formatPrice(roomPriceItems.find((item) => roomKey(item.room) === unit.typeKey)?.price || roomPrice(unit.room))}</b>
                    </div>

                    <div className="multi-room-unit-guests">
                      <label className="multi-room-guest-field">
                        <span className="multi-room-guest-label">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          Người lớn {unit.room.maxAdults ? <small>(Tối đa {unit.room.maxAdults})</small> : ''}
                        </span>
                        <input
                          type="number"
                          className="multi-room-num-input"
                          min="1"
                          max={unit.room.maxAdults || undefined}
                          value={unit.numberOfAdults}
                          onChange={(event) => updateRoomGuest(unit.key, 'numberOfAdults', event.target.value)}
                        />
                      </label>
                      <label className="multi-room-guest-field">
                        <span className="multi-room-guest-label">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9"/>
                            <circle cx="9" cy="10" r="1" fill="currentColor"/>
                            <circle cx="15" cy="10" r="1" fill="currentColor"/>
                            <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
                          </svg>
                          Trẻ em {unit.room.maxChildren ? <small>(Tối đa {unit.room.maxChildren})</small> : ''}
                        </span>
                        <input
                          type="number"
                          className="multi-room-num-input"
                          min="0"
                          max={unit.room.maxChildren || undefined}
                          value={unit.numberOfChildren}
                          onChange={(event) => updateRoomGuest(unit.key, 'numberOfChildren', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="multi-room-unit-occupants">
                      <div className="multi-room-unit-occupants-title">
                        <span className="occupants-title-badge">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          Khách đại diện phòng {currentUnitIndex}
                        </span>
                        <span className="occupants-title-hint">Mặc định dùng thông tin người đặt</span>
                      </div>

                      <div className="multi-room-unit-guest-grid">
                        <div className="occupant-field-group">
                          <label htmlFor={`guest-name-${unit.key}`}>Họ tên người ở phòng {currentUnitIndex}</label>
                          <div className="occupant-input-wrapper">
                            <span className="occupant-input-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </span>
                            <input
                              id={`guest-name-${unit.key}`}
                              type="text"
                              className="occupant-input"
                              placeholder={form.fullName ? `Mặc định: ${form.fullName}` : "Ví dụ: Nguyễn Văn A"}
                              value={unit.guestName || ''}
                              onChange={(e) => updateRoomGuest(unit.key, 'guestName', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="occupant-field-group">
                          <label htmlFor={`guest-email-${unit.key}`}>Email nhận thông tin phòng {currentUnitIndex}</label>
                          <div className="occupant-input-wrapper">
                            <span className="occupant-input-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                              </svg>
                            </span>
                            <input
                              id={`guest-email-${unit.key}`}
                              type="email"
                              className="occupant-input"
                              placeholder={form.email ? `Mặc định: ${form.email}` : "email@example.com"}
                              value={unit.guestEmail || ''}
                              onChange={(e) => updateRoomGuest(unit.key, 'guestEmail', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="multi-room-unit-services">
                      <div className="multi-room-unit-service-head">
                        <div>
                          <strong>Dịch vụ của phòng này</strong>
                          <span>{unit.services.length ? `${unit.services.length} dịch vụ đã chọn` : 'Chưa chọn dịch vụ'}</span>
                        </div>
                        <button
                          type="button"
                          className="multi-add-service-btn"
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
                                aria-label={`Xóa ${service.name} khỏi phòng ${currentUnitIndex}`}
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
          <div className="public-booking-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {checkingSchedule && <div className="public-booking-warning">⏳ Đang kiểm tra lịch phòng...</div>}
        {scheduleError && <div className="public-booking-warning">⚠️ {scheduleError}</div>}
        {scheduleNotice && <div className="public-booking-search-note" style={{ margin: '8px 22px 0' }}>{scheduleNotice}</div>}
        {loadingMeta && <div className="public-booking-error">⏳ Đang tải thông tin đặt phòng...</div>}

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

function BookingCart({ selectedRooms, requestedRooms, onRemove, onOpenBooking, criteria }) {
  const validSelectedRooms = selectedRooms.filter(isRoomSelectable)
  const selectedCount = validSelectedRooms.reduce((sum, room) => sum + selectedQuantity(room), 0)
  const isEnough = selectedCount >= requestedRooms

  return (
    <aside className="rooms-booking-cart" aria-label="Booking của bạn">
      <div className="rooms-booking-cart-head">
        <div>
          <h2>Booking của bạn</h2>
          <p>
            Đã chọn {validSelectedRooms.length} loại · {selectedCount}/{requestedRooms} phòng
          </p>
        </div>
        <span className={isEnough ? 'is-ready' : ''}>{isEnough ? 'Đủ phòng' : 'Chưa đủ'}</span>
      </div>
      <div className="rooms-booking-cart-list">
        {validSelectedRooms.length ? validSelectedRooms.map((room) => {
          const adults = room.maxAdults || 2
          const children = room.maxChildren || 0
          const bedInfo = room.bedType || room.bed || '1 giường đôi'
          const areaInfo = room.area ? `${room.area}m²` : ''
          const viewInfo = room.view ? room.view : ''

          return (
            <div key={roomKey(room)} className="rooms-booking-cart-item">
              <div className="rooms-booking-cart-item-top">
                <strong className="rooms-booking-cart-item-title">{houseTypeName(room)}</strong>
                <button
                  type="button"
                  className="rooms-booking-cart-item-remove"
                  onClick={() => onRemove(roomKey(room))}
                  aria-label="Bỏ loại phòng"
                  title="Bỏ loại phòng này"
                >
                  ×
                </button>
              </div>

              <div className="rooms-booking-cart-item-specs">
                <span className="cart-spec-badge">
                  Số lượng: <strong>{selectedQuantity(room)} phòng</strong>
                </span>
                <span className="cart-spec-item">
                   Tối đa {adults} người lớn{children > 0 ? ` · ${children} trẻ em` : ''}
                </span>
                <span className="cart-spec-item">
                  ️ {bedInfo}{areaInfo ? ` · ${areaInfo}` : ''}{viewInfo ? ` · ${viewInfo}` : ''}
                </span>
              </div>
            </div>
          )
        }) : (
          <p className="rooms-booking-cart-empty">Chọn loại phòng từ danh sách để tạo booking.</p>
        )}
      </div>
      <button type="button" disabled={!validSelectedRooms.length} onClick={onOpenBooking}>
        Tiếp tục đặt phòng
      </button>
    </aside>
  )
}
function RoomsPage() {
  const initialCriteria = useMemo(() => parseSearchCriteria(), [])
  const [searchCriteria, setSearchCriteria] = useState(initialCriteria)
  const [sidebarDates, setSidebarDates] = useState({
    checkInDate: initialCriteria?.checkInDate || '',
    checkOutDate: initialCriteria?.checkOutDate || '',
    rooms: Math.max(1, Number(initialCriteria?.rooms || 1)),
    adults: Math.max(1, Number(initialCriteria?.adults || 1)),
    children: Math.max(0, Number(initialCriteria?.children || 0)),
  })
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [maxPrice, setMaxPrice] = useState(Infinity)
  const [selectedRooms, setSelectedRooms] = useState(() => readBookingCart())
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)
  const [luckyReward, setLuckyReward] = useState(null)
  const [unavailableNotice, setUnavailableNotice] = useState('')

  // Sync sidebar state when searchCriteria updates
  useEffect(() => {
    if (searchCriteria) {
      setSidebarDates({
        checkInDate: searchCriteria.checkInDate || '',
        checkOutDate: searchCriteria.checkOutDate || '',
        rooms: Math.max(1, Number(searchCriteria.rooms || 1)),
        adults: Math.max(1, Number(searchCriteria.adults || 1)),
        children: Math.max(0, Number(searchCriteria.children || 0)),
      })
    }
  }, [searchCriteria])

  const handleSidebarSearch = () => {
    if (!sidebarDates.checkInDate || !sidebarDates.checkOutDate) {
      alert('Vui lòng chọn cả ngày nhận phòng và ngày trả phòng.')
      return
    }
    if (sidebarDates.checkOutDate <= sidebarDates.checkInDate) {
      alert('Ngày trả phòng phải sau ngày nhận phòng.')
      return
    }
    const nextCriteria = {
      checkInDate: sidebarDates.checkInDate,
      checkOutDate: sidebarDates.checkOutDate,
      rooms: Math.max(1, Number(sidebarDates.rooms) || 1),
      adults: Math.max(1, Number(sidebarDates.adults) || 1),
      children: Math.max(0, Number(sidebarDates.children) || 0),
      isDefaultRoomTypeList: false,
    }
    setSearchCriteria(nextCriteria)
    const newParams = new URLSearchParams({
      checkInDate: nextCriteria.checkInDate,
      checkOutDate: nextCriteria.checkOutDate,
      rooms: String(nextCriteria.rooms),
      adults: String(nextCriteria.adults),
      children: String(nextCriteria.children),
    })
    window.history.replaceState(null, '', `${window.location.pathname}?${newParams.toString()}`)
  }

  const handleResetSidebarSearch = () => {
    const defaultCrit = defaultRoomTypeCriteria()
    setSidebarDates({
      checkInDate: '',
      checkOutDate: '',
      rooms: 1,
      adults: 1,
      children: 0,
    })
    setSearchCriteria(defaultCrit)
    setMaxPrice(Infinity)
    window.history.replaceState(null, '', window.location.pathname)
  }

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
          if (matched && isRoomSelectable(matched)) {
            setSelectedRooms([{ ...matched, quantity: 1 }])
            writeBookingCart([{ ...matched, quantity: 1 }])
            setUnavailableNotice('')
            setTimeout(() => {
              document.querySelector('.rooms-booking-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 250)
          } else {
            const targetName = searchCriteria?.roomTypeName || 'Hạng phòng bạn chọn'
            const dateRange = hasSearchDates ? `từ ${searchCriteria.checkInDate} đến ${searchCriteria.checkOutDate}` : 'ngày bạn chọn'
            setUnavailableNotice(`️ ${targetName} hiện đã hết phòng hoặc đang bảo trì ${dateRange}. Dưới đây là các hạng phòng còn trống khác để bạn lựa chọn:`)
          }
        }
      })
      .catch(() => setError('Không thể tải danh sách phòng.'))
      .finally(() => setLoading(false))
  }, [searchCriteria])

  useEffect(() => {
    if (!rooms.length || !selectedRooms.length) return
    setSelectedRooms((current) => {
      const updated = current
        .map((selectedRoom) => {
          const freshRoom = rooms.find((room) => roomKey(room) === roomKey(selectedRoom))
          return freshRoom ? { ...selectedRoom, ...freshRoom } : selectedRoom
        })
        .filter((room) => {
          const freshRoom = rooms.find((r) => roomKey(r) === roomKey(room))
          return isRoomSelectable(freshRoom || room)
        })
      return updated
    })
  }, [rooms])

  useEffect(() => {
    writeBookingCart(selectedRooms)
  }, [selectedRooms])

  const highestPrice = useMemo(() => {
    const validPrices = rooms.map((room) => roomWeekdayPrice(room)).filter((p) => p > 0)
    const max = validPrices.length > 0 ? Math.max(...validPrices) : 0
    if (max <= 0) return 5000000
    const rounded = Math.ceil(max / 1000000) * 1000000
    return Math.max(rounded, 5000000)
  }, [rooms])

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (!isRoomSelectable(room)) return false
        const filterPrice = roomWeekdayPrice(room)
        const matchesPrice = maxPrice >= highestPrice || filterPrice <= maxPrice
        return matchesPrice
      })
      .sort((a, b) => roomWeekdayPrice(a) - roomWeekdayPrice(b))
  }, [rooms, maxPrice, highestPrice])

  const requestedRooms = searchCriteria?.rooms || Math.max(1, selectedRooms.length || 1)
  const selectedRoomIds = useMemo(() => new Set(selectedRooms.filter(isRoomSelectable).map(roomKey)), [selectedRooms])

  const toggleRoom = (room) => {
    if (!isRoomSelectable(room)) {
      const name = houseTypeName(room)
      const isMaint = String(room.status || '').toUpperCase() === 'MAINTENANCE'
      alert(
        isMaint
          ? `Loại phòng "${name}" hiện đang tạm bảo trì, không thể thêm vào danh sách đặt phòng.`
          : `Loại phòng "${name}" hiện đã hết phòng hoặc không khả dụng, không thể thêm vào danh sách đặt phòng.`
      )
      return
    }
    setSelectedRooms((current) => {
      if (current.some((item) => roomKey(item) === roomKey(room))) {
        return current.filter((item) => roomKey(item) !== roomKey(room))
      }
      return [...current.filter(isRoomSelectable), { ...room, quantity: 1 }]
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

            <div className="rooms-toolbar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a2b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📅</span>
                  <span>Tìm phòng theo ngày</span>
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', color: '#4b5563', fontWeight: 600 }}>Ngày nhận phòng:</span>
                  <DateDropdownPicker
                    value={sidebarDates.checkInDate}
                    onChange={(val) => {
                      setSidebarDates((prev) => {
                        const next = { ...prev, checkInDate: val }
                        if (val) {
                          const parts = val.split('-').map(Number)
                          const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1)
                          const yyyy = nextDay.getFullYear()
                          const mm = String(nextDay.getMonth() + 1).padStart(2, '0')
                          const dd = String(nextDay.getDate()).padStart(2, '0')
                          const nextDayStr = `${yyyy}-${mm}-${dd}`
                          if (!prev.checkOutDate || prev.checkOutDate <= val) {
                            next.checkOutDate = nextDayStr
                          }
                        }
                        return next
                      })
                    }}
                    placeholder="Chọn ngày nhận..."
                    minDate={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', color: '#4b5563', fontWeight: 600 }}>Ngày trả phòng:</span>
                  <DateDropdownPicker
                    value={sidebarDates.checkOutDate}
                    onChange={(val) => setSidebarDates((prev) => ({ ...prev, checkOutDate: val }))}
                    placeholder="Chọn ngày trả..."
                    minDate={sidebarDates.checkInDate ? (() => {
                      const parts = sidebarDates.checkInDate.split('-').map(Number)
                      const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1)
                      const yyyy = nextDay.getFullYear()
                      const mm = String(nextDay.getMonth() + 1).padStart(2, '0')
                      const dd = String(nextDay.getDate()).padStart(2, '0')
                      return `${yyyy}-${mm}-${dd}`
                    })() : new Date().toISOString().slice(0, 10)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: 2 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 'auto', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Số phòng</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={sidebarDates.rooms}
                      onChange={(e) => setSidebarDates((prev) => ({ ...prev, rooms: Math.max(1, Number(e.target.value) || 1) }))}
                      style={{ fontSize: '13px', fontWeight: 700, padding: 0, width: '100%', border: 'none', background: 'transparent' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 'auto', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Người lớn</span>
                    <input
                      type="number"
                      min="1"
                      value={sidebarDates.adults}
                      onChange={(e) => setSidebarDates((prev) => ({ ...prev, adults: Math.max(1, Number(e.target.value) || 1) }))}
                      style={{ fontSize: '13px', fontWeight: 700, padding: 0, width: '100%', border: 'none', background: 'transparent' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 'auto', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Trẻ em</span>
                    <input
                      type="number"
                      min="0"
                      value={sidebarDates.children}
                      onChange={(e) => setSidebarDates((prev) => ({ ...prev, children: Math.max(0, Number(e.target.value) || 0) }))}
                      style={{ fontSize: '13px', fontWeight: 700, padding: 0, width: '100%', border: 'none', background: 'transparent' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={handleSidebarSearch}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#1e3a2b',
                      color: '#ffffff',
                      border: 0,
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(30, 58, 43, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🔍 Tìm kiếm
                  </button>
                  {Boolean(searchCriteria?.checkInDate && searchCriteria?.checkOutDate) && (
                    <button
                      type="button"
                      onClick={handleResetSidebarSearch}
                      title="Xem tất cả loại phòng"
                      style={{
                        padding: '8px 12px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Bỏ lọc
                    </button>
                  )}
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              <div className="rooms-price-filter" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {maxPrice >= highestPrice ? 'Tất cả mức giá' : `Tối đa: ${formatPrice(maxPrice)}`}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>(Giá ngày thường)</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '2px 0 8px' }}>
                  {[
                    { label: 'Tất cả', value: Infinity },
                    { label: '≤ 1tr', value: 1000000 },
                    { label: '≤ 2tr', value: 2000000 },
                    { label: '≤ 3tr', value: 3000000 },
                    { label: '≤ 5tr', value: 5000000 },
                  ].map((preset) => {
                    const isActive = preset.value === Infinity ? maxPrice >= highestPrice : maxPrice === preset.value
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMaxPrice(preset.value === Infinity ? highestPrice : preset.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          border: isActive ? '1.5px solid #1e3a2b' : '1px solid #cbd5e1',
                          background: isActive ? '#1e3a2b' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <input
                  type="range"
                  min="0"
                  max={highestPrice}
                  step="500000"
                  value={maxPrice >= highestPrice ? highestPrice : maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
                <div className="search-filter-range" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  <span>0đ</span>
                  <span>1tr</span>
                  <span>2tr</span>
                  <span>3tr</span>
                  <span>{highestPrice >= 5000000 ? `${highestPrice / 1000000}tr` : formatPrice(highestPrice)}</span>
                </div>
              </div>
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
              const isPaymentConfirmed = !booking?.isSavedForLater && (booking?.isPaid || String(booking?.status).toUpperCase() === 'CONFIRMED')
              if (isPaymentConfirmed && booking?.luckyVoucherCode) {
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
