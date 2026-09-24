import React, { useState, useEffect, useMemo } from 'react'
import './RoomScheduleCalendarModal.css'

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

function toDateKey(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${formatTwoDigits(d.getMonth() + 1)}-${formatTwoDigits(d.getDate())}`
}

function formatDisplayDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const time = `${formatTwoDigits(d.getHours())}:${formatTwoDigits(d.getMinutes())}`
  const date = `${formatTwoDigits(d.getDate())}/${formatTwoDigits(d.getMonth() + 1)}/${d.getFullYear()}`
  return `${time} ${date}`
}

export default function RoomScheduleCalendarModal({
  room,
  initialBusySlots = [],
  currentCheckIn,
  currentCheckOut,
  onClose,
}) {
  const roomName = room?.roomTypeName || room?.name || (room?.roomNumber ? `Phòng ${room.roomNumber}` : (room?.title || 'Phòng'))

  const initialDate = useMemo(() => {
    if (currentCheckIn) {
      const d = new Date(currentCheckIn)
      if (!Number.isNaN(d.getTime())) return d
    }
    return new Date()
  }, [currentCheckIn])

  const [activeYear, setActiveYear] = useState(() => initialDate.getFullYear())
  const [activeMonth, setActiveMonth] = useState(() => initialDate.getMonth())
  const [busySlots, setBusySlots] = useState(() => initialBusySlots || [])
  const [loading, setLoading] = useState(false)

  const targetId = room?.roomId || room?.roomTypeId || room?.id

  useEffect(() => {
    if (!targetId) return

    const fromDate = `${activeYear}-${formatTwoDigits(activeMonth + 1)}-01`
    const lastDay = new Date(activeYear, activeMonth + 1, 0).getDate()
    const toDate = `${activeYear}-${formatTwoDigits(activeMonth + 1)}-${formatTwoDigits(lastDay)}`

    let cancelled = false
    setLoading(true)

    fetch(`${API_BASE_URL}/rooms/${targetId}?fromDate=${fromDate}&toDate=${toDate}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.busySlots) {
          setBusySlots(data.busySlots)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [targetId, activeYear, activeMonth])

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveYear((y) => y - 1)
      setActiveMonth(11)
    } else {
      setActiveMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      setActiveYear((y) => y + 1)
      setActiveMonth(0)
    } else {
      setActiveMonth((m) => m + 1)
    }
  }

  const handleGoToday = () => {
    const today = new Date()
    setActiveYear(today.getFullYear())
    setActiveMonth(today.getMonth())
  }

  const calendarDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate()
    const firstDayOfWeek = (new Date(activeYear, activeMonth, 1).getDay() + 6) % 7 // Monday = 0

    const currentCheckInDate = currentCheckIn ? new Date(currentCheckIn) : null
    const currentCheckOutDate = currentCheckOut ? new Date(currentCheckOut) : null

    const checkInDayKey = currentCheckInDate ? toDateKey(currentCheckInDate) : null
    const checkOutDayKey = currentCheckOutDate ? toDateKey(currentCheckOutDate) : null

    const days = []

    // Padding for days of previous month
    for (let i = 0; i < firstDayOfWeek; i += 1) {
      days.push({ isEmpty: true, key: `empty-${i}` })
    }

    // Actual days of month
    for (let day = 1; day <= daysInMonth; day += 1) {
      const cellDate = new Date(activeYear, activeMonth, day, 0, 0, 0, 0)
      const dayKey = toDateKey(cellDate)
      const isPast = cellDate < today
      const isToday = cellDate.getTime() === today.getTime()

      // Check overlapping with standard homestay night window (14:00 to next day 12:00)
      const dayStart = new Date(activeYear, activeMonth, day, 14, 0, 0)
      const dayEnd = new Date(activeYear, activeMonth, day + 1, 12, 0, 0)

      const matchedSlots = busySlots.filter((slot) => {
        const slotStart = new Date(slot.checkInTarget)
        const slotEnd = new Date(slot.checkOutTarget)
        return slotStart < dayEnd && slotEnd > dayStart
      })

      const isMaintenance = matchedSlots.some((s) => s.status === 'MAINTENANCE')
      const isDirty = matchedSlots.some((s) => s.status === 'DIRTY')
      const isCheckedIn = matchedSlots.some((s) => s.status === 'CHECKED_IN')
      const isConfirmed = matchedSlots.some((s) => s.status === 'CONFIRMED' || s.status === 'COMPLETED')
      const isPending = matchedSlots.some((s) => s.status === 'PENDING')
      const isBooked = isCheckedIn || isConfirmed
      const isBusy = isBooked || isPending || isMaintenance || isDirty

      const isCheckIn = checkInDayKey === dayKey
      const isCheckOut = checkOutDayKey === dayKey
      const isInSelectedRange = Boolean(
        currentCheckInDate &&
        currentCheckOutDate &&
        cellDate >= new Date(currentCheckInDate.getFullYear(), currentCheckInDate.getMonth(), currentCheckInDate.getDate()) &&
        cellDate <= new Date(currentCheckOutDate.getFullYear(), currentCheckOutDate.getMonth(), currentCheckOutDate.getDate())
      )

      days.push({
        isEmpty: false,
        key: dayKey,
        day,
        date: cellDate,
        dayKey,
        isPast,
        isToday,
        isBooked,
        isBusy,
        isMaintenance,
        isDirty,
        isCheckedIn,
        isConfirmed,
        isPending,
        isCheckIn,
        isCheckOut,
        isInSelectedRange,
        matchedSlots,
      })
    }

    return days
  }, [activeYear, activeMonth, busySlots, currentCheckIn, currentCheckOut])

  return (
    <div className="room-schedule-modal-backdrop" onClick={onClose}>
      <div className="room-schedule-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="room-schedule-head">
          <div className="room-schedule-head-content">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Lịch đặt phòng – {roomName}
            </h3>
            <p>Chế độ xem lịch: kiểm tra tình trạng phòng trống và các khung giờ đã được đặt</p>
          </div>
          <button type="button" className="room-schedule-close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="room-schedule-body">
          {/* Calendar Month Navigation */}
          <div className="calendar-month-bar">
            <div className="calendar-month-title">
              <h4>Tháng {activeMonth + 1} / {activeYear}</h4>
              <button type="button" className="calendar-today-btn" onClick={handleGoToday}>
                Hôm nay
              </button>
              {loading && <span style={{ fontSize: 12, color: '#64748b' }}>Đang tải dữ liệu...</span>}
            </div>
            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handlePrevMonth}
                title="Tháng trước"
              >
                ‹
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handleNextMonth}
                title="Tháng sau"
              >
                ›
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="room-schedule-legend">
            <span className="legend-item">
              <span className="legend-dot is-available" />
              Còn trống
            </span>
            <span className="legend-item">
              <span className="legend-dot is-booked" />
              Đã đặt
            </span>
            <span className="legend-item">
              <span className="legend-dot is-pending" />
              Giữ chỗ
            </span>
            <span className="legend-item">
              <span className="legend-dot is-maintenance" />
              Bảo trì / Chờ dọn
            </span>
            {currentCheckIn && (
              <span className="legend-item">
                <span className="legend-dot is-selected" />
                Đang xem
              </span>
            )}
            <span className="legend-item">
              <span className="legend-dot is-past" />
              Ngày đã qua
            </span>
          </div>

          {/* Vivid Calendar Grid */}
          <div className="vivid-calendar-container">
            <div className="vivid-calendar-weekdays">
              {WEEKDAY_NAMES.map((wd, idx) => (
                <span key={idx} className={wd.isWeekend ? 'is-weekend' : ''}>
                  {wd.label}
                </span>
              ))}
            </div>
            <div className="vivid-calendar-days">
              {calendarDays.map((cell) => {
                if (cell.isEmpty) {
                  return <div key={cell.key} className="vivid-day-cell is-empty" />
                }

                const isConflict = (cell.isConfirmed || cell.isCheckedIn || cell.isPending) && (cell.isCheckIn || cell.isInSelectedRange)
                const cellClasses = [
                  'vivid-day-cell',
                  cell.isPast
                    ? 'is-past'
                    : cell.isMaintenance
                    ? 'is-maintenance'
                    : cell.isDirty
                    ? 'is-dirty'
                    : cell.isCheckedIn
                    ? 'is-stay'
                    : cell.isConfirmed
                    ? 'is-booked'
                    : cell.isPending
                    ? 'is-pending'
                    : 'is-available',
                  cell.isToday ? 'is-today' : '',
                  isConflict ? 'is-booked-conflict' : cell.isInSelectedRange ? 'is-selected-range' : '',
                  !cell.isBusy && cell.isCheckIn ? 'is-selected-checkin' : '',
                  !cell.isBusy && cell.isCheckOut ? 'is-selected-checkout' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                let statusText = 'Trống'
                if (cell.isPast) {
                  statusText = ''
                } else if (cell.isMaintenance) {
                  statusText = 'Bảo trì'
                } else if (cell.isDirty) {
                  statusText = 'Chờ dọn'
                } else if (cell.isCheckedIn) {
                  statusText = 'Đang ở'
                } else if (cell.isConfirmed) {
                  statusText = isConflict ? '⚠️ Đã đặt' : 'Đã đặt'
                } else if (cell.isPending) {
                  statusText = 'Giữ chỗ'
                } else if (cell.isCheckIn) {
                  statusText = 'Nhận'
                } else if (cell.isCheckOut) {
                  statusText = 'Trả'
                }

                let cellTitle = 'Phòng còn trống'
                if (cell.isPast) {
                  cellTitle = 'Ngày đã qua'
                } else if (cell.isMaintenance) {
                  cellTitle = '🛠️ Phòng đang tạm khóa để bảo trì / sửa chữa kỹ thuật'
                } else if (cell.isDirty) {
                  cellTitle = '🧹 Phòng đang chờ buồng phòng dọn dẹp'
                } else if (cell.isCheckedIn) {
                  cellTitle = '👥 Phòng đang có khách lưu trú'
                } else if (cell.isConfirmed) {
                  cellTitle = `Đã có khách đặt: ${cell.matchedSlots.map((s) => `${formatDisplayDateTime(s.checkInTarget)} - ${formatDisplayDateTime(s.checkOutTarget)}`).join(', ')}`
                } else if (cell.isPending) {
                  cellTitle = '⏳ Đang có khách giữ chỗ tạm thời (5 phút chờ thanh toán)'
                } else if (cell.isBooked) {
                  cellTitle = `Đã có khách đặt: ${cell.matchedSlots.map((s) => `${formatDisplayDateTime(s.checkInTarget)} - ${formatDisplayDateTime(s.checkOutTarget)}`).join(', ')}`
                }

                return (
                  <div
                    key={cell.key}
                    className={cellClasses}
                    title={cellTitle}
                  >
                    <span className="vivid-day-number">{cell.day}</span>
                    <span className="vivid-day-status">
                      {statusText}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="room-schedule-footer">
          <div className="room-schedule-selected-hint">
            <span>Chế độ xem lịch · Không áp dụng đặt trực tiếp trên bảng lịch này.</span>
          </div>
          <button type="button" className="room-schedule-action-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
