import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react'
import './DateDropdownPicker.css'

/**
 * Modern Interactive Calendar Dropdown Picker
 * Renders an input trigger that drops down a full visual calendar popup.
 *
 * @param {string} value - ISO date string 'YYYY-MM-DD'
 * @param {function} onChange - Callback receiving 'YYYY-MM-DD' or ''
 * @param {string} placeholder - Placeholder text
 * @param {boolean} isDob - If true, restricts to past dates & years descend from currentYear down to 1920
 * @param {string} minDate - Minimum selectable date 'YYYY-MM-DD'
 * @param {string} maxDate - Maximum selectable date 'YYYY-MM-DD'
 * @param {number} minYear - Minimum year to display in dropdown
 * @param {number} maxYear - Maximum year to display in dropdown
 * @param {boolean} allowEmpty - Whether user can clear date
 * @param {boolean} disabled - Disable the picker
 * @param {boolean} required - HTML required
 * @param {string} className - Additional CSS classes
 * @param {string} label - Optional label above picker
 * @param {string} id - HTML ID
 */
export default function DateDropdownPicker({
  value = '',
  onChange,
  placeholder = '',
  isDob = false,
  minDate,
  maxDate,
  minYear,
  maxYear,
  allowEmpty = true,
  disabled = false,
  required = false,
  className = '',
  label = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverAlign, setPopoverAlign] = useState('left')
  const containerRef = useRef(null)
  const today = new Date()
  const currentYear = today.getFullYear()
  const todayIso = today.toISOString().slice(0, 10)

  // Auto-detect popover boundary alignment
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.left + 330 > window.innerWidth - 12) {
        setPopoverAlign('right')
      } else {
        setPopoverAlign('left')
      }
    }
  }, [isOpen])

  // Effective min / max dates
  const effectiveMaxDate = maxDate || (isDob ? todayIso : undefined)
  const effectiveMinDate = minDate || (isDob ? '1920-01-01' : undefined)

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value || typeof value !== 'string') return null
    const clean = value.slice(0, 10)
    const [y, m, d] = clean.split('-').map(Number)
    if (y && m && d) {
      return { year: y, month: m - 1, day: d, iso: clean }
    }
    return null
  }, [value])

  // Current view month & year in calendar popup
  const [viewYear, setViewYear] = useState(() => parsedValue ? parsedValue.year : (isDob ? 2000 : currentYear))
  const [viewMonth, setViewMonth] = useState(() => parsedValue ? parsedValue.month : (isDob ? 0 : today.getMonth()))

  // Sync view when value changes or when opened
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year)
      setViewMonth(parsedValue.month)
    }
  }, [value])

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Compute Year Options
  const yearOptions = useMemo(() => {
    const startY = minYear ?? (isDob ? 1920 : currentYear - 15)
    const endY = maxYear ?? (isDob ? currentYear : currentYear + 15)
    const years = []
    if (isDob) {
      for (let y = endY; y >= startY; y--) {
        years.push(y)
      }
    } else {
      for (let y = startY; y <= endY; y++) {
        years.push(y)
      }
    }
    return years
  }, [isDob, currentYear, minYear, maxYear])

  // Month names in Vietnamese
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ]

  // Weekdays header (Monday to Sunday)
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  // Calendar cells generation for 6 weeks (42 days)
  const calendarCells = useMemo(() => {
    const cells = []
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    // getDay: 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Convert to Mon=0 .. Sun=6
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    // 1. Previous month trailing days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevMonthDate = new Date(viewYear, viewMonth - 1, d)
      const y = prevMonthDate.getFullYear()
      const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const iso = `${y}-${m}-${dayStr}`
      cells.push({
        day: d,
        iso,
        isCurrentMonth: false,
        isPrev: true,
        year: y,
        month: prevMonthDate.getMonth(),
      })
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const m = String(viewMonth + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const iso = `${viewYear}-${m}-${dayStr}`
      cells.push({
        day: d,
        iso,
        isCurrentMonth: true,
        year: viewYear,
        month: viewMonth,
      })
    }

    // 3. Next month leading days (fill up to 42 cells)
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextMonthDate = new Date(viewYear, viewMonth + 1, d)
      const y = nextMonthDate.getFullYear()
      const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const iso = `${y}-${m}-${dayStr}`
      cells.push({
        day: d,
        iso,
        isCurrentMonth: false,
        isNext: true,
        year: y,
        month: nextMonthDate.getMonth(),
      })
    }

    return cells
  }, [viewYear, viewMonth])

  // Navigation handlers
  const handlePrevMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectDate = (cell, e) => {
    e.stopPropagation()
    if (isDateDisabled(cell.iso)) return
    if (onChange) {
      onChange(cell.iso)
    }
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    if (onChange) {
      onChange('')
    }
  }

  const handleSelectToday = (e) => {
    e.stopPropagation()
    if (isDateDisabled(todayIso)) return
    if (onChange) {
      onChange(todayIso)
    }
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setIsOpen(false)
  }

  const isDateDisabled = (iso) => {
    if (effectiveMaxDate && iso > effectiveMaxDate) return true
    if (effectiveMinDate && iso < effectiveMinDate) return true
    return false
  }

  // Format display text: DD/MM/YYYY
  const displayText = useMemo(() => {
    if (!parsedValue) return ''
    const { day, month, year } = parsedValue
    return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
  }, [parsedValue])

  const defaultPlaceholder = placeholder || (isDob ? 'Chọn ngày sinh...' : 'Chọn ngày...')

  return (
    <div className={`date-dropdown-picker ${className} ${disabled ? 'ddp--disabled' : ''}`} ref={containerRef}>
      {label && <span className="ddp-label">{label}</span>}

      {/* Input Trigger Button */}
      <div
        id={id}
        className={`ddp-trigger ${isOpen ? 'ddp-trigger--open' : ''} ${!value ? 'ddp-trigger--empty' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) setIsOpen((prev) => !prev)
          }
        }}
      >
        <Calendar className="ddp-trigger-icon" size={17} />
        <span className="ddp-trigger-text">
          {displayText || defaultPlaceholder}
        </span>

        {/* Clear Button */}
        {value && allowEmpty && !disabled && (
          <button
            type="button"
            className="ddp-clear-btn"
            onClick={handleClear}
            title="Xóa ngày"
            aria-label="Xóa ngày"
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown className={`ddp-chevron ${isOpen ? 'ddp-chevron--up' : ''}`} size={16} />
      </div>

      {/* Calendar Popover Dropdown */}
      {isOpen && (
        <div
          className={`ddp-popover ${popoverAlign === 'right' ? 'ddp-popover--right' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Calendar Header with Fast Selectors */}
          <div className="ddp-popover-header">
            <button
              type="button"
              className="ddp-nav-btn"
              onClick={handlePrevMonth}
              title="Tháng trước"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="ddp-selectors">
              {/* Month Select */}
              <select
                className="ddp-month-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                className="ddp-year-select"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="ddp-nav-btn"
              onClick={handleNextMonth}
              title="Tháng sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="ddp-weekdays-grid">
            {weekdays.map((wd, i) => (
              <span key={i} className={`ddp-weekday ${i >= 5 ? 'ddp-weekday--weekend' : ''}`}>
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="ddp-days-grid">
            {calendarCells.map((cell, idx) => {
              const isSelected = parsedValue && parsedValue.iso === cell.iso
              const isToday = cell.iso === todayIso
              const disabledCell = isDateDisabled(cell.iso)

              let cellClasses = 'ddp-day-cell'
              if (!cell.isCurrentMonth) cellClasses += ' ddp-day-cell--other-month'
              if (isSelected) cellClasses += ' ddp-day-cell--selected'
              if (isToday) cellClasses += ' ddp-day-cell--today'
              if (disabledCell) cellClasses += ' ddp-day-cell--disabled'

              return (
                <button
                  type="button"
                  key={idx}
                  className={cellClasses}
                  disabled={disabledCell}
                  onClick={(e) => handleSelectDate(cell, e)}
                  title={cell.iso}
                >
                  <span className="ddp-day-num">{cell.day}</span>
                  {isToday && !isSelected && <span className="ddp-today-dot" />}
                </button>
              )
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="ddp-popover-footer">
            {!isDateDisabled(todayIso) && (
              <button
                type="button"
                className="ddp-footer-btn ddp-btn-today"
                onClick={handleSelectToday}
              >
                Hôm nay
              </button>
            )}
            {allowEmpty && value && (
              <button
                type="button"
                className="ddp-footer-btn ddp-btn-clear"
                onClick={handleClear}
              >
                Xóa
              </button>
            )}
            <button
              type="button"
              className="ddp-footer-btn ddp-btn-close"
              onClick={() => setIsOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
