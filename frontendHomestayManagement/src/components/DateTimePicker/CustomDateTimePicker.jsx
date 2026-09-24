import React, { useState, useEffect, useMemo, useRef } from 'react'
import './CustomDateTimePicker.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const WEEKDAY_NAMES = [
  { label: 'Th 2', isWeekend: false },
  { label: 'Th 3', isWeekend: false },
  { label: 'Th 4', isWeekend: false },
  { label: 'Th 5', isWeekend: false },
  { label: 'Th 6', isWeekend: false },
  { label: 'Th 7', isWeekend: true },
  { label: 'CN', isWeekend: true },
]

function formatTwoDigits(num) {
  return String(num).padStart(2, '0')
}

function toDateTimeLocal(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = formatTwoDigits(date.getMonth() + 1)
  const day = formatTwoDigits(date.getDate())
  const hour = formatTwoDigits(date.getHours())
  const minute = formatTwoDigits(date.getMinutes())
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function formatDateTimeDisplay(value) {
  if (!value) return ''
  const [datePart, timePart = ''] = String(value).split('T')
  const [year, month, day] = datePart.split('-')
  const [hourText = '', minute = '00'] = timePart.split(':')
  if (!year || !month || !day) return value
  const hour = Number(hourText || 0)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = formatTwoDigits(hour % 12 || 12)
  return `${day}/${month}/${year} ${displayHour}:${minute} ${period}`
}

export function getRoomShortLabel(room, index) {
  if (!room) return `Phòng ${index + 1}`
  if (room.roomNumber) return `P.${room.roomNumber}`
  if (room.roomTypeName) {
    const clean = room.roomTypeName.replace(/^(phòng|loại phòng)\s*/i, '').trim()
    return clean.length > 10 ? clean.slice(0, 9) + '…' : clean
  }
  if (room.name) {
    const clean = room.name.replace(/^(phòng|loại phòng)\s*/i, '').trim()
    return clean.length > 10 ? clean.slice(0, 9) + '…' : clean
  }
  return `P.${index + 1}`
}

export function getRoomFullLabel(room, index) {
  if (!room) return `Phòng ${index + 1}`
  const num = room.roomNumber ? `P.${room.roomNumber}` : ''
  const name = room.roomTypeName || room.name || room.houseTypeName || ''
  if (num && name) return `${num} - ${name}`
  if (num) return num
  if (name) return name
  return `Phòng ${index + 1}`
}

/**
 * Checks if a busy slot conflicts with checking in or checking out on a specific dateKey.
 * Homestay standard check-in: 14:00 (02:00 PM)
 * Homestay standard check-out: 12:00 (12:00 PM)
 */
export function isSlotBusyOnDate(slot, dateKey) {
  if (!slot || !slot.checkInTarget || !slot.checkOutTarget) return false
  const slotStart = new Date(slot.checkInTarget)
  const slotEnd = new Date(slot.checkOutTarget)
  if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) return false

  const [y, m, d] = dateKey.split('-').map(Number)

  // Standard day window for the dateKey (homestay check-in 14:00 to next day checkout 12:00)
  const dayStart = new Date(y, m - 1, d, 14, 0, 0, 0)
  const dayEnd = new Date(y, m - 1, d + 1, 12, 0, 0, 0)

  // The room is occupied on dateKey if slot overlaps [dayStart, dayEnd]
  return slotStart < dayEnd && slotEnd > dayStart
}

export default function CustomDateTimePicker({
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
  align = isCheckIn ? 'left' : 'right',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current value parts
  const parsedValueDate = useMemo(() => {
    if (value) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) return d
    }
    if (min) {
      const d = new Date(min)
      if (!Number.isNaN(d.getTime())) return d
    }
    return new Date()
  }, [value, min])

  const [viewYear, setViewYear] = useState(() => parsedValueDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsedValueDate.getMonth())
  const [fetchedBusySlots, setFetchedBusySlots] = useState([])

  // Keep view year & month synced when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Normalized list of rooms to check
  const activeRooms = useMemo(() => {
    if (rooms && rooms.length > 0) return rooms
    if (roomTargetId) return [{ id: roomTargetId, roomId: roomTargetId }]
    return []
  }, [rooms, roomTargetId])

  // Fetch busy slots for viewed month if rooms or roomTargetId provided
  useEffect(() => {
    const targets = []
    if (roomTargetId) {
      targets.push({ id: roomTargetId, room: null })
    } else if (rooms && rooms.length) {
      rooms.forEach((r, idx) => {
        const id = r.roomId || r.roomTypeId || r.id
        if (id && !targets.some((t) => String(t.id) === String(id))) {
          targets.push({ id, room: r, index: idx })
        }
      })
    }

    if (!targets.length) {
      setFetchedBusySlots([])
      return
    }

    const fromDate = `${viewYear}-${formatTwoDigits(viewMonth + 1)}-01`
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate()
    const toDate = `${viewYear}-${formatTwoDigits(viewMonth + 1)}-${formatTwoDigits(lastDay)}`

    let cancelled = false
    Promise.all(
      targets.map(({ id, room, index }) =>
        fetch(`${API_BASE_URL}/rooms/${id}?fromDate=${fromDate}&toDate=${toDate}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) =>
            (data?.busySlots || []).map((slot) => ({
              ...slot,
              roomId: id,
              room: slot.room || room,
              roomNumber: slot.roomNumber || room?.roomNumber,
              roomName: slot.roomName || room?.name || room?.roomTypeName,
              roomIndex: index,
            }))
          )
          .catch(() => [])
      )
    )
      .then((slotLists) => {
        if (!cancelled) {
          setFetchedBusySlots(slotLists.flat())
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [viewYear, viewMonth, roomTargetId, rooms])

  // Combined busy slots with room tagging
  const allBusySlots = useMemo(() => {
    const map = new Map()
    const combine = [...(busySlots || []), ...(fetchedBusySlots || [])]
    combine.forEach((slot) => {
      if (slot && slot.checkInTarget && slot.checkOutTarget) {
        const roomId = slot.roomId || slot.room?.roomId || slot.room?.roomTypeId || slot.room?.id || ''
        const key = `${roomId}_${slot.checkInTarget}_${slot.checkOutTarget}_${slot.status || ''}`
        map.set(key, slot)
      }
    })
    return Array.from(map.values())
  }, [busySlots, fetchedBusySlots])

  // Close when clicking outside
  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('touchstart', handlePointerDown)
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen])

  // Generate calendar grid for viewYear & viewMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0, Sunday = 6

    const days = []

    // Previous month filler days
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i
      const prevDate = new Date(viewYear, viewMonth - 1, d)
      const dateKey = `${prevDate.getFullYear()}-${formatTwoDigits(prevDate.getMonth() + 1)}-${formatTwoDigits(prevDate.getDate())}`
      days.push({
        date: prevDate,
        dateKey,
        dayNum: d,
        isOutside: true,
      })
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d)
      const dateKey = `${viewYear}-${formatTwoDigits(viewMonth + 1)}-${formatTwoDigits(d)}`
      days.push({
        date: curDate,
        dateKey,
        dayNum: d,
        isOutside: false,
      })
    }

    // Next month filler days (grid up to 35 or 42 cells)
    const remainingCells = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i)
      const dateKey = `${nextDate.getFullYear()}-${formatTwoDigits(nextDate.getMonth() + 1)}-${formatTwoDigits(nextDate.getDate())}`
      days.push({
        date: nextDate,
        dateKey,
        dayNum: i,
        isOutside: true,
      })
    }

    return days
  }, [viewYear, viewMonth])

  // Detailed occupancy calculation per day for active rooms
  // Detailed occupancy calculation per day for active rooms with comprehensive reason detection
  const getDayRoomOccupancy = (dateKey) => {
    const matchedSlots = allBusySlots.filter((slot) =>
      isSlotBusyOnDate(slot, dateKey)
    )
    const isBusy = matchedSlots.length > 0

    let primaryReason = 'AVAILABLE'
    let reasonDetail = ''
    if (matchedSlots.some(s => s.status === 'MAINTENANCE')) {
      primaryReason = 'MAINTENANCE'
      reasonDetail = 'Phòng đang tạm khóa để bảo trì / sửa chữa sự cố kỹ thuật'
    } else if (matchedSlots.some(s => s.status === 'DIRTY')) {
      primaryReason = 'DIRTY'
      reasonDetail = 'Phòng đang bẩn, chờ buồng phòng dọn dẹp và nghiệm thu'
    } else if (matchedSlots.some(s => s.status === 'CHECKED_IN')) {
      primaryReason = 'CHECKED_IN'
      reasonDetail = 'Phòng đang có khách lưu trú thực tế'
    } else if (matchedSlots.some(s => s.status === 'PENDING')) {
      primaryReason = 'PENDING'
      reasonDetail = 'Đang có khách giữ chỗ tạm thời (5 phút chờ thanh toán)'
    } else if (isBusy) {
      primaryReason = 'CONFIRMED'
      reasonDetail = 'Đã có khách đặt và xác nhận thành công'
    }

    if (!activeRooms || activeRooms.length <= 1) {
      return {
        isMulti: false,
        totalRooms: 1,
        busyRooms: isBusy ? [{ label: 'Phòng này', fullLabel: 'Phòng này' }] : [],
        freeRooms: !isBusy ? [{ label: 'Phòng này', fullLabel: 'Phòng này' }] : [],
        isAllBusy: isBusy,
        isPartiallyBusy: false,
        isAllFree: !isBusy,
        matchedSlots,
        primaryReason,
        reasonDetail,
      }
    }

    const busyRooms = []
    const freeRooms = []

    activeRooms.forEach((room, idx) => {
      const roomId = room.roomId || room.roomTypeId || room.id
      const roomLabel = getRoomShortLabel(room, idx)
      const roomFull = getRoomFullLabel(room, idx)

      // Find busy slots for this specific room
      const roomSlots = allBusySlots.filter((slot) => {
        const slotRoomId = slot.roomId || slot.room?.roomId || slot.room?.roomTypeId || slot.room?.id
        if (slotRoomId && roomId) return String(slotRoomId) === String(roomId)
        if (slot.roomNumber && room.roomNumber) return String(slot.roomNumber) === String(room.roomNumber)
        return true
      })

      const isRoomBusy = roomSlots.some((slot) =>
        isSlotBusyOnDate(slot, dateKey)
      )

      const info = {
        ...room,
        id: roomId,
        label: roomLabel,
        fullLabel: roomFull,
      }

      if (isRoomBusy) {
        busyRooms.push(info)
      } else {
        freeRooms.push(info)
      }
    })

    return {
      isMulti: true,
      totalRooms: activeRooms.length,
      busyRooms,
      freeRooms,
      isAllBusy: busyRooms.length === activeRooms.length,
      isPartiallyBusy: busyRooms.length > 0 && busyRooms.length < activeRooms.length,
      isAllFree: busyRooms.length === 0,
      matchedSlots,
      primaryReason,
      reasonDetail,
    }
  }

  // Today key
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${formatTwoDigits(today.getMonth() + 1)}-${formatTwoDigits(today.getDate())}`

  const selectedDateKey = value ? value.split('T')[0] : ''
  const checkInDateKey = checkInValue ? checkInValue.split('T')[0] : ''
  const checkOutDateKey = checkOutValue ? checkOutValue.split('T')[0] : ''

  // Month navigation
  const handlePrevMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const minDateKey = min ? min.split('T')[0] : ''
  const isTodayDisabled = (!isCheckIn && checkInDateKey && todayKey <= checkInDateKey) ||
    (!allowBeforeMin && minDateKey && todayKey < minDateKey)

  // Time / Date builder with fixed homestay policy (14:00 checkin, 12:00 checkout)
  const commitNewDateTime = (newDateKey) => {
    const targetDateKey = newDateKey || selectedDateKey || todayKey
    const hour24 = isCheckIn ? 14 : 12
    const formatted = `${targetDateKey}T${formatTwoDigits(hour24)}:00`

    if (!allowBeforeMin) {
      if (minDateKey && targetDateKey < minDateKey) return
      if (targetDateKey < todayKey) return
    }
    if (!isCheckIn && checkInDateKey && targetDateKey <= checkInDateKey) {
      return
    }

    onChange(formatted)
  }

  // Select day
  const handleSelectDay = (day) => {
    if (day.isOutside) return
    if (!allowBeforeMin) {
      if (day.dateKey < todayKey) return
      if (minDateKey && day.dateKey < minDateKey) return
    }
    if (!isCheckIn && checkInDateKey && day.dateKey <= checkInDateKey) return
    commitNewDateTime(day.dateKey)
    setIsOpen(false)
  }

  // Select Today
  const handleSelectToday = (e) => {
    e.stopPropagation()
    if (isTodayDisabled) return
    const now = new Date()
    commitNewDateTime(todayKey)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setIsOpen(false)
  }

  return (
    <div className="custom-datetime-container" ref={containerRef}>
      <div
        className={`custom-datetime-input-wrapper${isOpen ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${invalid ? ' is-invalid' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <input
          className="custom-datetime-text-input"
          type="text"
          aria-label={ariaLabel}
          placeholder={isCheckIn ? 'dd/mm/yyyy 02:00 PM' : 'dd/mm/yyyy 12:00 PM'}
          value={formatDateTimeDisplay(value)}
          disabled={disabled}
          required={required}
          readOnly
        />
        <button
          className="custom-datetime-icon-btn"
          type="button"
          disabled={disabled}
          aria-label={`Mở bảng chọn ${ariaLabel}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) setIsOpen((prev) => !prev)
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 2v3M17 2v3M3.5 9h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <path d="M8 13h3v3H8z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={`custom-datetime-dropdown align-${align}`} onClick={(e) => e.stopPropagation()}>
          {/* Policy Notice Header */}
          <div className="custom-datetime-policy-notice">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Chính sách Homestay: <strong>{isCheckIn ? 'Nhận phòng từ 14:00 (02:00 PM)' : 'Trả phòng trước 12:00 (12:00 PM)'}</strong>
            </span>
          </div>

          {/* Multi-Room Header if >= 2 rooms */}
          {activeRooms && activeRooms.length >= 2 && (
            <div className="custom-datetime-rooms-header">
              <div className="rooms-header-title">
                <span>Lịch đặt {activeRooms.length} phòng đang chọn:</span>
              </div>
              <div className="rooms-tags-list">
                {activeRooms.map((r, i) => (
                  <span key={i} className="room-item-tag">
                    {getRoomFullLabel(r, i)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Header Navigation */}
          <div className="custom-datetime-header">
            <div className="custom-datetime-title-box">
              <select
                className="custom-datetime-month-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                className="custom-datetime-year-select"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const y = new Date().getFullYear() - 1 + i
                  return <option key={y} value={y}>{y}</option>
                })}
              </select>
            </div>
            <div className="custom-datetime-nav-buttons">
              <button
                className="custom-datetime-nav-btn"
                type="button"
                aria-label="Tháng trước"
                onClick={handlePrevMonth}
              >
                ‹
              </button>
              <button
                className="custom-datetime-nav-btn"
                type="button"
                aria-label="Tháng sau"
                onClick={handleNextMonth}
              >
                ›
              </button>
            </div>
          </div>

          {/* Main Calendar Grid */}
          <div className="custom-datetime-main">
            <div className="custom-datetime-calendar-pane">
              <div className="custom-datetime-weekdays">
                {WEEKDAY_NAMES.map((w, idx) => (
                  <span
                    key={idx}
                    className={`custom-datetime-weekday-label${w.isWeekend ? ' is-weekend' : ''}`}
                  >
                    {w.label}
                  </span>
                ))}
              </div>

              <div className="custom-datetime-days-grid">
                {calendarDays.map((day, idx) => {
                  const isPast = day.dateKey < todayKey && !allowBeforeMin
                  const isBeforeMin = Boolean(minDateKey) && day.dateKey < minDateKey && !allowBeforeMin
                  const isBeforeCheckIn = !isCheckIn && Boolean(checkInDateKey) && day.dateKey <= checkInDateKey
                  const isDisabled = day.isOutside || isPast || isBeforeMin || isBeforeCheckIn

                  const isToday = day.dateKey === todayKey
                  const isSelected = day.dateKey === selectedDateKey
                  const isInRange = checkInDateKey && checkOutDateKey
                    && day.dateKey > checkInDateKey && day.dateKey < checkOutDateKey

                  const occupancy = getDayRoomOccupancy(day.dateKey)

                  let badgeText = 'Trống'
                  let badgeClass = 'status-available'
                  let cellTitle = 'Ngày còn trống - Sẵn sàng đón khách'

                  if (isDisabled) {
                    if (isBeforeCheckIn) {
                      badgeText = 'Khóa'
                      badgeClass = 'status-disabled'
                      cellTitle = '🔒 Không thể trả phòng trước hoặc cùng ngày nhận phòng (Quy tắc lưu trú)'
                    } else if (isPast) {
                      badgeText = ''
                      badgeClass = 'status-past'
                      cellTitle = '⏰ Ngày đã qua trong quá khứ'
                    } else if (isBeforeMin) {
                      badgeText = 'Khóa'
                      badgeClass = 'status-disabled'
                      cellTitle = '🔒 Không khả dụng trước mốc thời gian tối thiểu'
                    } else {
                      badgeText = 'Khóa'
                      badgeClass = 'status-disabled'
                      cellTitle = '🔒 Ngày không khả dụng'
                    }
                  } else if (!occupancy.isMulti) {
                    if (occupancy.isAllBusy) {
                      if (occupancy.primaryReason === 'MAINTENANCE') {
                        badgeText = 'Bảo trì'
                        badgeClass = 'status-maintenance'
                        cellTitle = '🛠️ Phòng đang tạm khóa để bảo trì / sửa chữa sự cố kỹ thuật'
                      } else if (occupancy.primaryReason === 'DIRTY') {
                        badgeText = 'Chờ dọn'
                        badgeClass = 'status-dirty'
                        cellTitle = '🧹 Phòng đang chờ buồng phòng dọn dẹp và nghiệm thu'
                      } else if (occupancy.primaryReason === 'CHECKED_IN') {
                        badgeText = 'Đang ở'
                        badgeClass = 'status-stay'
                        cellTitle = '👥 Phòng đang có khách lưu trú thực tế'
                      } else if (occupancy.primaryReason === 'PENDING') {
                        badgeText = 'Giữ chỗ'
                        badgeClass = 'status-pending'
                        cellTitle = '⏳ Đang có khách giữ chỗ tạm thời (5 phút chờ thanh toán)'
                      } else {
                        badgeText = 'Đã đặt'
                        badgeClass = 'status-busy'
                        cellTitle = isCheckIn
                          ? '📅 Ngày này đã có khách cọc/xác nhận (kín từ 14:00)'
                          : '📅 Ngày này đã kín phòng trước 12:00 (Cần 2 tiếng dọn dẹp)'
                      }
                    } else {
                      badgeText = 'Trống'
                      badgeClass = 'status-available'
                      cellTitle = isCheckIn
                        ? '✅ Phòng trống - Có thể nhận phòng từ 14:00 (02:00 PM)'
                        : '✅ Phòng trống - Trả phòng trước 12:00 (12:00 PM)'
                    }
                  } else {
                    if (occupancy.isAllBusy) {
                      badgeText = `Kín cả ${occupancy.totalRooms}P`
                      badgeClass = 'status-busy'
                      cellTitle = `🚫 Đã kín tất cả ${occupancy.totalRooms} phòng (${occupancy.busyRooms.map((r) => r.fullLabel).join(', ')})`
                    } else if (occupancy.isPartiallyBusy) {
                      badgeText = `Kín ${occupancy.busyRooms.length}/${occupancy.totalRooms}P`
                      badgeClass = 'status-partial'
                      cellTitle = `⚠️ Hết phòng cục bộ: Kín [${occupancy.busyRooms.map((r) => r.fullLabel).join(', ')}] • Còn trống [${occupancy.freeRooms.map((r) => r.fullLabel).join(', ')}]`
                    } else {
                      badgeText = `Trống ${occupancy.totalRooms}P`
                      badgeClass = 'status-available'
                      cellTitle = `✅ Còn trống tất cả ${occupancy.totalRooms} phòng (${occupancy.freeRooms.map((r) => r.fullLabel).join(', ')})`
                    }
                  }

                  let cellClass = 'custom-datetime-day-cell'
                  if (day.isOutside) cellClass += ' is-outside-month'
                  if (isDisabled) cellClass += ' is-disabled'
                  if (isPast) cellClass += ' is-past'
                  if (isBeforeCheckIn) cellClass += ' is-before-checkin'
                  if (isToday) cellClass += ' is-today'
                  if (isSelected) cellClass += ' is-selected'
                  if (!isDisabled && occupancy.isAllBusy) cellClass += ' is-busy'
                  if (!isDisabled && occupancy.isPartiallyBusy) cellClass += ' is-busy-partial'
                  if (isInRange) cellClass += ' is-in-range'

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isDisabled}
                      className={cellClass}
                      onClick={() => handleSelectDay(day)}
                      title={cellTitle}
                    >
                      <span className="custom-datetime-day-number">{day.dayNum}</span>
                      {!day.isOutside && badgeText && (
                        <span className={`custom-datetime-day-status-badge ${badgeClass}`}>
                          {badgeText}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer with Legend and Close */}
          <div className="custom-datetime-footer">
            <div className="custom-datetime-legend">
              <div className="custom-datetime-legend-item">
                <span className="custom-datetime-legend-dot dot-busy" />
                <span>Kín phòng</span>
              </div>
              {activeRooms && activeRooms.length >= 2 && (
                <div className="custom-datetime-legend-item">
                  <span className="custom-datetime-legend-dot dot-partial" />
                  <span>Kín 1 phần</span>
                </div>
              )}
              <div className="custom-datetime-legend-item">
                <span className="custom-datetime-legend-dot dot-available" />
                <span>Trống</span>
              </div>
            </div>

            <div className="custom-datetime-actions">
              <button
                type="button"
                className="custom-datetime-action-btn btn-today"
                disabled={isTodayDisabled}
                onClick={handleSelectToday}
              >
                Hôm nay
              </button>
              <button
                type="button"
                className="custom-datetime-action-btn btn-done"
                onClick={() => setIsOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
