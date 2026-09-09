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

const HOURS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const MINUTES = ['00', '15', '30', '45']
const PERIODS = ['AM', 'PM']

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
  const [hourText = '', minute = ''] = timePart.split(':')
  if (!year || !month || !day || !hourText || !minute) return value
  const hour = Number(hourText)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = formatTwoDigits(hour % 12 || 12)
  return `${day}/${month}/${year} ${displayHour}:${minute} ${period}`
}

function parseDateTimeDisplay(text) {
  if (!text) return ''
  const match = String(text).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
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

  // Keep view year & month synced when value changes significantly
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Extract selected time (12h hour, minute, period)
  const currentHour24 = parsedValueDate.getHours()
  const currentHour12 = formatTwoDigits(currentHour24 % 12 || 12)
  const currentMinute = formatTwoDigits(Math.floor(parsedValueDate.getMinutes() / 15) * 15)
  const currentPeriod = currentHour24 >= 12 ? 'PM' : 'AM'

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

    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i
      const date = new Date(viewYear, viewMonth - 1, dayNum)
      days.push({
        date,
        dayNum,
        isOutside: true,
        dateKey: `${date.getFullYear()}-${formatTwoDigits(date.getMonth() + 1)}-${formatTwoDigits(dayNum)}`,
      })
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      days.push({
        date,
        dayNum: d,
        isOutside: false,
        dateKey: `${viewYear}-${formatTwoDigits(viewMonth + 1)}-${formatTwoDigits(d)}`,
      })
    }

    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(viewYear, viewMonth + 1, i)
      days.push({
        date,
        dayNum: i,
        isOutside: true,
        dateKey: `${date.getFullYear()}-${formatTwoDigits(date.getMonth() + 1)}-${formatTwoDigits(i)}`,
      })
    }

    return days
  }, [viewYear, viewMonth])

  // Helper check if day has busy slot
  const isDayBusy = (dateKey) => {
    if (!allBusySlots.length || !dateKey) return false
    const dayStart = new Date(`${dateKey}T00:00:00`)
    const dayEnd = new Date(`${dateKey}T23:59:59`)

    return allBusySlots.some((slot) => {
      if (!slot.checkInTarget || !slot.checkOutTarget) return false
      const slotStart = new Date(slot.checkInTarget)
      const slotEnd = new Date(slot.checkOutTarget)
      if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) return false
      return slotStart < dayEnd && slotEnd > dayStart
    })
  }

  // Today key
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${formatTwoDigits(today.getMonth() + 1)}-${formatTwoDigits(today.getDate())}`

  // Min date key
  const minDateKey = min ? min.split('T')[0] : ''
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

  // Time / Date builder
  const commitNewDateTime = (newDateKey, newHour12, newMin, newPeriod) => {
    const targetDateKey = newDateKey || selectedDateKey || todayKey
    const targetHour12 = Number(newHour12 || currentHour12)
    const targetMin = newMin || currentMinute || '00'
    const targetPeriod = newPeriod || currentPeriod

    let hour24 = (targetHour12 % 12) + (targetPeriod === 'PM' ? 12 : 0)
    const formatted = `${targetDateKey}T${formatTwoDigits(hour24)}:${formatTwoDigits(targetMin)}`

    if (!allowBeforeMin && min && formatted < min) {
      // Don't commit if before min
      return
    }

    onChange(formatted)
  }

  // Select day
  const handleSelectDay = (day) => {
    if (day.isOutside) return
    const isPast = day.dateKey < todayKey && !allowBeforeMin
    if (isPast) return
    commitNewDateTime(day.dateKey, currentHour12, currentMinute, currentPeriod)
  }

  // Select hour
  const handleSelectHour = (h) => {
    commitNewDateTime(selectedDateKey, h, currentMinute, currentPeriod)
  }

  // Select minute
  const handleSelectMinute = (m) => {
    commitNewDateTime(selectedDateKey, currentHour12, m, currentPeriod)
  }

  // Select period
  const handleSelectPeriod = (p) => {
    commitNewDateTime(selectedDateKey, currentHour12, currentMinute, p)
  }

  // Select Today
  const handleSelectToday = (e) => {
    e.stopPropagation()
    const now = new Date()
    const defaultHour = isCheckIn ? 14 : 12
    const nowHour12 = formatTwoDigits(defaultHour % 12 || 12)
    const nowPeriod = defaultHour >= 12 ? 'PM' : 'AM'
    commitNewDateTime(todayKey, nowHour12, '00', nowPeriod)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
  }

  // Manual input handling
  const handleManualBlur = (e) => {
    const parsed = parseDateTimeDisplay(e.target.value)
    if (parsed) {
      if (allowBeforeMin || !min || parsed >= min) {
        onChange(parsed)
        return
      }
    }
    e.target.value = formatDateTimeDisplay(value)
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
          placeholder="dd/mm/yyyy hh:mm AM/PM"
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
          {/* Header */}
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

          {/* Main Content: Calendar + Time Selector */}
          <div className="custom-datetime-main">
            {/* Calendar Pane */}
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

            {/* Time Selector Pane (12h format matching native picker) */}
            <div className="custom-datetime-time-pane">
              {/* Hours 01-12 */}
              <div className="custom-datetime-time-group">
                <span className="custom-datetime-time-header-label">Giờ</span>
                <div className="custom-datetime-time-column" title="Chọn Giờ">
                  {HOURS_12.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`custom-datetime-time-item${h === currentHour12 ? ' is-active' : ''}`}
                      onClick={() => handleSelectHour(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes 00, 15, 30, 45 */}
              <div className="custom-datetime-time-group">
                <span className="custom-datetime-time-header-label">Phút</span>
                <div className="custom-datetime-time-column" title="Chọn Phút">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`custom-datetime-time-item${m === currentMinute ? ' is-active' : ''}`}
                      onClick={() => handleSelectMinute(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM / PM */}
              <div className="custom-datetime-time-group">
                <span className="custom-datetime-time-header-label">Buổi</span>
                <div className="custom-datetime-time-column" title="Buổi">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`custom-datetime-time-item${p === currentPeriod ? ' is-active' : ''}`}
                      onClick={() => handleSelectPeriod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
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
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
