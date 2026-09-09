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

function formatDisplayDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatTwoDigits(d.getDate())}/${formatTwoDigits(d.getMonth() + 1)}/${d.getFullYear()}`
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
  onSelectCheckIn,
  onClose,
}) {
  const roomName = room?.roomTypeName || room?.name || room?.roomNumber ? `Phòng ${room.roomNumber || ''}` : (room?.title || 'Phòng')

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
  const [selectedDay, setSelectedDay] = useState(null)

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

      // Check overlapping with any busy slot
      const dayStart = new Date(activeYear, activeMonth, day, 0, 0, 0)
      const dayEnd = new Date(activeYear, activeMonth, day, 23, 59, 59)

      const matchedSlots = busySlots.filter((slot) => {
        const slotStart = new Date(slot.checkInTarget)
        const slotEnd = new Date(slot.checkOutTarget)
        return slotStart < dayEnd && slotEnd > dayStart
      })

      const isBooked = matchedSlots.length > 0

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
        matchedSlots,
        isCheckIn,
        isCheckOut,
        isInSelectedRange,
      })
    }

    return days
  }, [activeYear, activeMonth, busySlots, currentCheckIn, currentCheckOut])

  // Filter slots in the currently viewed month for the detailed list
  const activeMonthSlots = useMemo(() => {
    const monthStart = new Date(activeYear, activeMonth, 1, 0, 0, 0)
    const monthEnd = new Date(activeYear, activeMonth + 1, 0, 23, 59, 59)

    return busySlots
      .filter((slot) => {
        const slotStart = new Date(slot.checkInTarget)
        const slotEnd = new Date(slot.checkOutTarget)
        return slotStart <= monthEnd && slotEnd >= monthStart
      })
      .sort((a, b) => new Date(a.checkInTarget) - new Date(b.checkInTarget))
  }, [busySlots, activeYear, activeMonth])

  return (
    <div className="room-schedule-modal-backdrop" onClick={onClose}>
      <div className="room-schedule-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="room-schedule-head">
          <div className="room-schedule-head-content">
            <h3>📅 Lịch đặt phòng – {roomName}</h3>
            <p>Trực quan các ngày đã có khách đặt và các ngày còn trống trong tháng</p>
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
              {loading && <span style={{ fontSize: 12, color: '#64748b' }}>Đang tải lịch...</span>}
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
              Đã có khách đặt
            </span>
            {currentCheckIn && (
              <span className="legend-item">
                <span className="legend-dot is-selected" />
                Thời gian bạn đang chọn
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

                const cellClasses = [
                  'vivid-day-cell',
                  cell.isPast ? 'is-past' : cell.isBooked ? 'is-booked' : 'is-available',
                  cell.isToday ? 'is-today' : '',
                  cell.isInSelectedRange ? 'is-selected-range' : '',
                  cell.isCheckIn ? 'is-selected-checkin' : '',
                  cell.isCheckOut ? 'is-selected-checkout' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={cellClasses}
                    disabled={cell.isPast}
                    onClick={() => {
                      setSelectedDay(cell)
                      if (!cell.isPast && !cell.isBooked && onSelectCheckIn) {
                        onSelectCheckIn(cell.dayKey)
                      }
                    }}
                    title={
                      cell.isBooked
                        ? `Đã có khách đặt: ${cell.matchedSlots.map((s) => `${formatDisplayDateTime(s.checkInTarget)} - ${formatDisplayDateTime(s.checkOutTarget)}`).join(', ')}`
                        : cell.isPast
                        ? 'Ngày đã qua'
                        : 'Phòng còn trống - bấm để chọn nhận phòng'
                    }
                  >
                    <span className="vivid-day-number">{cell.day}</span>
                    <span className="vivid-day-status">
                      {cell.isCheckIn
                        ? '🎯 Nhận'
                        : cell.isCheckOut
                        ? '🏁 Trả'
                        : cell.isBooked
                        ? '🔴 Đã đặt'
                        : cell.isPast
                        ? ''
                        : '✓ Trống'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Booked Slots List in this Month */}
          <div className="room-schedule-details">
            <h5>🕒 Chi tiết các đợt khách đặt trong Tháng {activeMonth + 1}/{activeYear}</h5>
            {activeMonthSlots.length > 0 ? (
              <div className="busy-slots-list">
                {activeMonthSlots.map((slot, index) => (
                  <div key={slot.bookingDetailId || index} className="busy-slot-card">
                    <div className="busy-slot-times">
                      <strong>Đợt {index + 1}:</strong> Từ <strong>{formatDisplayDateTime(slot.checkInTarget)}</strong>
                      <br />
                      Đến <strong>{formatDisplayDateTime(slot.checkOutTarget)}</strong>
                    </div>
                    <span className="busy-slot-badge">Đã giữ chỗ</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-slots-state">
                ✨ Toàn bộ Tháng {activeMonth + 1}/{activeYear} đang trống! Bạn có thể thoải mái chọn bất kỳ khung giờ nào.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="room-schedule-footer">
          <div className="room-schedule-selected-hint">
            {currentCheckIn && currentCheckOut ? (
              <span>
                Đang chọn: <strong>{formatDisplayDateTime(currentCheckIn)}</strong> ➔ <strong>{formatDisplayDateTime(currentCheckOut)}</strong>
              </span>
            ) : (
              <span>Bấm vào một ngày còn trống để chọn ngày nhận phòng</span>
            )}
          </div>
          <button type="button" className="room-schedule-action-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
