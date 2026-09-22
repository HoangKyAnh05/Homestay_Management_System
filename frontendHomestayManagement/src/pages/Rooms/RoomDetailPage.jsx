import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import { clearBookingCart, isRoomSelectable, readBookingCart } from '../../utils/bookingCart'
import { formatClockTime, formatVietnameseDate } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import CustomDateTimePicker from '../../components/DateTimePicker/CustomDateTimePicker'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
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
    DAILY: '2 ngày 1 đêm',
    BY_DAY: '2 ngày 1 đêm',
    HOURLY: 'Theo giờ',
    COMBO: 'Combo',
  }
  return labels[String(rentType || '').toUpperCase()] || '2 ngày 1 đêm'
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
  date.setHours(14, 0, 0, 0)
  return toDateTimeLocalValue(date)
}

function defaultCheckOutValue(checkInValue) {
  const date = new Date(checkInValue)
  date.setDate(date.getDate() + 1)
  date.setHours(11, 0, 0, 0)
  return toDateTimeLocalValue(date)
}

function nowDateTimeLocalMin() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
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
    const rentTypeUpper = String(price.rentType || '').toUpperCase()
    const policyUpper = String(price.policyName || '').toUpperCase().trim()
    if (
      rentTypeUpper.includes('HOUR') ||
      rentTypeUpper.includes('COMBO') ||
      policyUpper.includes('COMBO') ||
      policyUpper.includes('GIỜ') ||
      policyUpper.includes('GIO') ||
      policyUpper.includes('2 GIỜ') ||
      policyUpper.includes('4 GIỜ') ||
      policyUpper.includes('ĐÊM') ||
      policyUpper.includes('DEM') ||
      policyUpper.includes('OVERNIGHT') ||
      policyUpper === 'NGÀY' ||
      policyUpper === 'NGAY'
    ) {
      return
    }
    const cleanPolicyName = 'Thuê theo ngày'
    const key = `${cleanPolicyName}-${price.rentType || 'DAILY'}`
    const current = groups.get(key) || {
      policyName: cleanPolicyName,
      rentType: price.rentType || 'DAILY',
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
  const [isVideoSelected, setIsVideoSelected] = useState(false)
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
  const groupedPrices = useMemo(() => {
    const list = groupPrices(room?.prices || [])
    if (list.length > 0) return list
    if (room?.weekdayPrice != null || room?.weekendPrice != null) {
      return [{
        policyName: 'Lưu trú tiêu chuẩn (từ 2N1Đ)',
        rentType: 'DAILY',
        weekdayPrice: room.weekdayPrice || 0,
        weekendPrice: room.weekendPrice || room.weekdayPrice || 0,
      }]
    }
    return []
  }, [room])

  const isMaintenance = String(room?.status || '').toUpperCase() === 'MAINTENANCE'
  const isSoldOut = room?.availableRooms != null && Number(room.availableRooms) <= 0
  const isDirectBooked = String(room?.status || '').toUpperCase() === 'BOOKED' || String(room?.status || '').toUpperCase() === 'OCCUPIED'

  const hasScheduleConflict = useMemo(() => {
    if (!room?.busySlots?.length) return false
    const checkIn = initialBookingData.checkInTarget ? new Date(initialBookingData.checkInTarget) : null
    const checkOut = initialBookingData.checkOutTarget ? new Date(initialBookingData.checkOutTarget) : null
    if (!checkIn || !checkOut || Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false

    return room.busySlots.some((slot) => {
      const slotIn = new Date(slot.checkInTarget)
      const slotOut = new Date(slot.checkOutTarget)
      return !Number.isNaN(slotIn.getTime()) && !Number.isNaN(slotOut.getTime()) && slotIn < checkOut && slotOut > checkIn
    })
  }, [room?.busySlots, initialBookingData.checkInTarget, initialBookingData.checkOutTarget])

  const isBookedOrConflicted = isMaintenance || isSoldOut || isDirectBooked || hasScheduleConflict

  const openBookingModal = () => {
    if (!room || isBookedOrConflicted) return
    const storedRooms = readBookingCart().filter(isRoomSelectable)
    const currentRoom = roomDetailToCartRoom(room)
    if (!isRoomSelectable(currentRoom)) return
    const hasCurrentRoom = storedRooms.some((item) => String(item.roomTypeId || item.id) === String(currentRoom.roomTypeId))
    setMultiBookingRooms(hasCurrentRoom ? storedRooms : [...storedRooms, currentRoom])
    setBookingModalOpen(true)
  }

  const [reviews, setReviews] = useState([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token') || localStorage.getItem('accessToken') || ''

  const targetRoomTypeId = Number(room?.roomTypeId || room?.id || roomId)

  useEffect(() => {
    if (!targetRoomTypeId) return
    // Fetch public reviews
    fetch(`${API_BASE_URL}/public/reviews/room-type/${targetRoomTypeId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data.filter((r) => (r.status || 'APPROVED').toUpperCase() !== 'HIDDEN') : []))
      .catch(() => setReviews([]))

    // Check wishlist status
    const activeToken = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token') || localStorage.getItem('accessToken')
    if (activeToken) {
      fetch(`${API_BASE_URL}/customer/wishlist/check/${targetRoomTypeId}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
        .then((res) => (res.ok ? res.json() : false))
        .then((resData) => {
          const liked = typeof resData === 'boolean' ? resData : Boolean(resData?.isWishlisted ?? resData?.wishlisted)
          setIsWishlisted(liked)
        })
        .catch(() => {})
    } else {
      setIsWishlisted(false)
    }
  }, [targetRoomTypeId, token])

  const toggleWishlist = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const activeToken = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token') || localStorage.getItem('accessToken')
    if (!activeToken) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?redirect=${returnUrl}`)
      return
    }
    const finalRoomTypeId = Number(room?.roomTypeId || room?.id || targetRoomTypeId)
    if (!finalRoomTypeId) return

    const previousState = isWishlisted
    const nextState = !previousState
    setIsWishlisted(nextState)

    try {
      const res = await fetch(`${API_BASE_URL}/customer/wishlist/toggle/${finalRoomTypeId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` },
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (typeof data.isWishlisted === 'boolean') {
          setIsWishlisted(data.isWishlisted)
        } else if (typeof data.wishlisted === 'boolean') {
          setIsWishlisted(data.wishlisted)
        }
      } else {
        setIsWishlisted(previousState)
      }
    } catch {
      setIsWishlisted(previousState)
    }
  }

  const averageRatingCalculated = useMemo(() => {
    if (reviews && reviews.length > 0) {
      const totalStars = reviews.reduce((sum, rev) => sum + (Number(rev.ratingStars) || 5), 0)
      return (totalStars / reviews.length).toFixed(1)
    }
    return room?.averageRating ? Number(room.averageRating).toFixed(1) : '5.0'
  }, [reviews, room?.averageRating])

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
                  className="room-detail-wishlist-btn"
                  onClick={toggleWishlist}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  aria-label={isWishlisted ? 'Bỏ lưu phòng' : 'Lưu phòng'}
                  title={isWishlisted ? 'Bỏ lưu phòng' : 'Lưu phòng'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: '22px',
                      height: '22px',
                      fill: isWishlisted ? '#ef4444' : 'none',
                      stroke: isWishlisted ? '#ef4444' : '#64748b',
                      strokeWidth: '2',
                    }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                <div className="room-detail-rating">
                  ★ {averageRatingCalculated} ({reviews.length} đánh giá)
                </div>
              </div>
            </section>

            <section className="room-detail-layout">
              <aside className="room-detail-media-panel" aria-label="Ảnh phòng">
                <div className="room-detail-main-photo" style={{ position: 'relative', overflow: 'hidden', background: '#020617' }}>
                  {isVideoSelected && room?.videoUrl ? (
                    <video
                      src={resolveImageUrl(room.videoUrl)}
                      controls
                      autoPlay
                      playsInline
                      className="room-detail-video-player"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : selectedImage ? (
                    <img src={resolveImageUrl(selectedImage)} alt={houseTypeName(room, 'Loại phòng')} />
                  ) : (
                    <div>Lá Đỏ Homestay</div>
                  )}
                </div>
                <div className="room-detail-thumbs">
                  {room?.videoUrl && (
                    <button
                      type="button"
                      className={`room-thumb-video-btn${isVideoSelected ? ' room-thumb-active' : ''}`}
                      onClick={() => setIsVideoSelected(true)}
                      title="Xem video preview phòng"
                      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      <img
                        src={resolveImageUrl(room.primaryImageUrl || imageUrls[0])}
                        alt="Video preview"
                        style={{ filter: 'brightness(0.65)' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '11px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                          background: isVideoSelected ? 'rgba(225, 29, 72, 0.45)' : 'rgba(0,0,0,0.25)',
                        }}
                      >
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>▶</span>
                        <span style={{ fontSize: '10px', marginTop: 2 }}>Video</span>
                      </span>
                    </button>
                  )}
                  {imageUrls.slice(0, 6).map((url) => (
                    <button
                      key={url}
                      type="button"
                      className={!isVideoSelected && selectedImage === url ? 'room-thumb-active' : ''}
                      onClick={() => {
                        setIsVideoSelected(false)
                        setSelectedImage(url)
                      }}
                    >
                      <img src={resolveImageUrl(url)} alt="Ảnh phòng" />
                    </button>
                  ))}
                </div>
              </aside>

              <div className="room-detail-content">
                {/* Thông tin loại phòng chi tiết */}
                <section className="room-info-section" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>Thông tin loại phòng</h2>
                    <span style={{ fontSize: '13px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
                      ⚡ Nhận phòng từ 2 ngày 1 đêm
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>
                    {room.description || 'Không gian nghỉ dưỡng tiện nghi, view núi săn mây lý tưởng tại Lá Đỏ Sanctuary, Sa Pa.'}
                  </p>
                  <div className="room-info-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      👥 Sức chứa: {room.maxAdults || 0} người lớn, {room.maxChildren || 0} trẻ em
                    </span>
                    <span style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      🔑 Bố trí phòng: Lễ tân sắp xếp tự động khi check-in
                    </span>
                    <span className={room.depositPolicyId ? 'room-deposit-chip' : 'room-deposit-chip room-deposit-chip--free'} style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>
                      💳 {depositText(room)}
                    </span>
                    <span style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      ⏱️ Nhận phòng: 14:00 | Trả phòng: 11:00
                    </span>
                  </div>
                </section>

                <section className="room-booking-panel room-booking-panel--compact">
                  <div className="room-booking-head">
                    <div>
                      <h2>Đặt loại phòng này</h2>
                      <p style={{ color: isBookedOrConflicted ? '#dc2626' : undefined, fontWeight: isBookedOrConflicted ? 600 : undefined }}>
                        {isMaintenance
                          ? '️ Hạng phòng này hiện đang tạm bảo trì.'
                          : isBookedOrConflicted
                          ? '️ Hạng phòng này đã có khách đặt trước trong khung giờ bạn chọn.'
                          : 'Chọn thời gian lưu trú (từ 2 ngày 1 đêm trở lên) để tạo đơn đặt phòng ngay.'}
                      </p>
                    </div>
                    <button
                      className={`room-detail-cta${isBookedOrConflicted ? ' is-disabled' : ''}`}
                      type="button"
                      disabled={isBookedOrConflicted}
                      onClick={openBookingModal}
                      title={isBookedOrConflicted ? (isMaintenance ? 'Phòng đang bảo trì' : 'Phòng đã có khách đặt trước trong khung giờ này') : undefined}
                    >
                      {isMaintenance ? 'Đang bảo trì' : isBookedOrConflicted ? 'Đã kín lịch' : 'Chọn lịch đặt phòng'}
                    </button>
                  </div>
                </section>

                <section className="room-info-section room-price-section" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0 }}>Bảng giá lưu trú (Áp dụng từ 2 ngày 1 đêm)</h2>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Đơn vị: VNĐ / đêm</span>
                  </div>
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
                  <h2>Đánh giá từ khách hàng (★ {averageRatingCalculated})</h2>
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
