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

  // Fetch busy slots for viewed month if rooms or roomTargetId provided
  useEffect(() => {
    const targets = []
    if (roomTargetId) targets.push(roomTargetId)
    else if (rooms && rooms.length) {
      rooms.forEach((r) => {
        const id = r.roomId || r.roomTypeId || r.id
        if (id && !targets.includes(id)) targets.push(id)
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
    Promise.all(targets.map((targetId) =>
      fetch(`${API_BASE_URL}/rooms/${targetId}?fromDate=${fromDate}&toDate=${toDate}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data?.busySlots || [])
        .catch(() => [])
    ))
      .then((slotLists) => {
        if (!cancelled) {
          const combined = slotLists.flat()
          setFetchedBusySlots(combined)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [viewYear, viewMonth, roomTargetId, rooms])

  // Combined busy slots
  const allBusySlots = useMemo(() => {
    const map = new Map()
    const combine = [...(busySlots || []), ...(fetchedBusySlots || [])]
    combine.forEach((slot) => {
      if (slot && slot.checkInTarget && slot.checkOutTarget) {
        const key = `${slot.checkInTarget}_${slot.checkOutTarget}_${slot.status || ''}`
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

  // Check if a day has busy slots
  const isDayBusy = (dateKey) => {
    if (!allBusySlots || !allBusySlots.length) return false
    const dayStart = `${dateKey}T00:00:00`
    const dayEnd = `${dateKey}T23:59:59`
    return allBusySlots.some((slot) => {
      const slotStart = slot.checkInTarget
      const slotEnd = slot.checkOutTarget
      if (!slotStart || !slotEnd) return false
      return slotStart < dayEnd && slotEnd > dayStart
    })
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

  // Time / Date builder with fixed homestay policy (14:00 checkin, 12:00 checkout)
  const commitNewDateTime = (newDateKey) => {
    const targetDateKey = newDateKey || selectedDateKey || todayKey
    const hour24 = isCheckIn ? 14 : 12
    const formatted = `${targetDateKey}T${formatTwoDigits(hour24)}:00`

    if (!allowBeforeMin && min && formatted < min) {
      return
    }

    onChange(formatted)
  }

  // Select day
  const handleSelectDay = (day) => {
    if (day.isOutside) return
    const isPast = day.dateKey < todayKey && !allowBeforeMin
    if (isPast) return
    commitNewDateTime(day.dateKey)
    setIsOpen(false)
  }

  // Select Today
  const handleSelectToday = (e) => {
    e.stopPropagation()
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
                  const isToday = day.dateKey === todayKey
                  const isSelected = day.dateKey === selectedDateKey
                  const busy = isDayBusy(day.dateKey)
                  const isInRange = checkInDateKey && checkOutDateKey
                    && day.dateKey > checkInDateKey && day.dateKey < checkOutDateKey

                  let cellClass = 'custom-datetime-day-cell'
                  if (day.isOutside) cellClass += ' is-outside-month'
                  if (isPast) cellClass += ' is-past'
                  if (isToday) cellClass += ' is-today'
                  if (isSelected) cellClass += ' is-selected'
                  if (busy) cellClass += ' is-busy'
                  if (isInRange) cellClass += ' is-in-range'

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isPast || day.isOutside}
                      className={cellClass}
                      onClick={() => handleSelectDay(day)}
                      title={busy ? 'Ngày này đã có khách đặt' : 'Ngày còn trống'}
                    >
                      <span className="custom-datetime-day-number">{day.dayNum}</span>
                      {!day.isOutside && (
                        <span className={`custom-datetime-day-status-badge ${busy ? 'status-busy' : 'status-available'}`}>
                          {busy ? 'Đã đặt' : 'Trống'}
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
                <span>Đã đặt</span>
              </div>
              <div className="custom-datetime-legend-item">
                <span className="custom-datetime-legend-dot dot-available" />
                <span>Trống</span>
              </div>
              <div className="custom-datetime-legend-item">
                <span className="custom-datetime-legend-dot dot-selected" />
                <span>Đang chọn</span>
              </div>
            </div>

            <div className="custom-datetime-actions">
              <button
                type="button"
                className="custom-datetime-action-btn btn-today"
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
