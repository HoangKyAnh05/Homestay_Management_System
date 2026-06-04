import { useState } from 'react'

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const months = [
  {
    title: 'June 2026',
    monthIndex: 5,
    leading: 0,
    days: 30,
  },
  {
    title: 'July 2026',
    monthIndex: 6,
    leading: 2,
    days: 31,
  },
]

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <path d="M5 4h14a2 2 0 0 1 2 2v16H3V6a2 2 0 0 1 2-2Z" />
      <path d="m8 15 2 2 4-5" />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M4 21a6 6 0 0 1 12 0" />
      <path d="M18 8a3 3 0 0 1 0 6" />
      <path d="M17 17a5 5 0 0 1 5 4" />
    </svg>
  )
}

function formatMainDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) {
    return false
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

function isBetweenDates(date, startDate, endDate) {
  if (!startDate || !endDate) {
    return false
  }

  return date > startDate && date < endDate
}

function CounterRow({ label, hint, value, min, onDecrease, onIncrease }) {
  return (
    <div className="guest-counter-row">
      <div>
        <strong>{label}</strong>
        {hint && <span>{hint}</span>}
      </div>
      <div className="counter-controls">
        <button type="button" disabled={value <= min} onClick={onDecrease} aria-label={`Giảm ${label}`}>
          -
        </button>
        <b>{value}</b>
        <button type="button" onClick={onIncrease} aria-label={`Tăng ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

function MonthCalendar({ month, checkInDate, checkOutDate, onSelectDate }) {
  const cells = [
    ...Array.from({ length: month.leading }, (_, index) => ({ key: `empty-${index}` })),
    ...Array.from({ length: month.days }, (_, index) => ({ key: index + 1, day: index + 1 })),
  ]

  return (
    <div className="calendar-month">
      <h3>{month.title}</h3>
      <div className="calendar-weekdays">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="calendar-days">
        {cells.map((cell) => {
          if (!cell.day) {
            return <span key={cell.key} className="calendar-empty" />
          }

          const date = new Date(2026, month.monthIndex, cell.day)
          const isStart = isSameDate(date, checkInDate)
          const isEnd = isSameDate(date, checkOutDate)
          const isInRange = isBetweenDates(date, checkInDate, checkOutDate)

          return (
            <button
              key={cell.key}
              type="button"
              className={[
                'calendar-day',
                isStart ? 'is-selected is-start' : '',
                isEnd ? 'is-selected is-end' : '',
                isInRange ? 'is-in-range' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CalendarDropdown({ checkInDate, checkOutDate, onSelectDate }) {
  return (
    <div className="calendar-dropdown">
      <div className="calendar-tabs">
        <button className="is-active" type="button">
          Calendar
        </button>
        <button type="button">I&apos;m flexible</button>
      </div>

      <div className="calendar-body">
        <button className="calendar-nav calendar-prev" type="button" aria-label="Tháng trước">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button className="calendar-nav calendar-next" type="button" aria-label="Tháng sau">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {months.map((month) => (
          <MonthCalendar
            key={month.title}
            month={month}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </div>
  )
}

function HomeSearch() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeDateField, setActiveDateField] = useState('checkin')
  const [checkInDate, setCheckInDate] = useState(new Date(2026, 5, 14))
  const [checkOutDate, setCheckOutDate] = useState(new Date(2026, 5, 15))
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  const guestSummary = `${adults} người lớn`
  const roomSummary = `${rooms} phòng${children > 0 ? `, ${children} trẻ em` : ''}`

  const openCalendar = (field) => {
    setActiveDateField(field)
    setIsCalendarOpen(true)
    setIsGuestOpen(false)
  }

  const handleSelectDate = (date) => {
    if (activeDateField === 'checkout') {
      if (date <= checkInDate) {
        setCheckInDate(date)
        setCheckOutDate(null)
        setActiveDateField('checkout')
        return
      }

      setCheckOutDate(date)
      setIsCalendarOpen(false)
      setActiveDateField('checkin')
      return
    }

    setCheckInDate(date)

    if (checkOutDate && date < checkOutDate) {
      setActiveDateField('checkout')
      return
    }

    setCheckOutDate(null)
    setActiveDateField('checkout')
  }

  return (
    <section className="home-search-card" aria-label="Tìm phòng">
      <div className="home-search-grid">
        <div className="date-range-wrap">
          <button
            className="search-date-field"
            type="button"
            aria-expanded={isCalendarOpen}
            onClick={() => openCalendar('checkin')}
          >
            <CalendarIcon />
            <span>
              <b>{formatMainDate(checkInDate)}</b>
              <small>{formatWeekday(checkInDate)}</small>
            </span>
          </button>

          <button
            className="search-date-field"
            type="button"
            aria-expanded={isCalendarOpen}
            onClick={() => openCalendar('checkout')}
          >
            <CalendarIcon />
            <span>
              <b>{checkOutDate ? formatMainDate(checkOutDate) : 'Chọn ngày'}</b>
              <small>{checkOutDate ? formatWeekday(checkOutDate) : 'Ngày trả phòng'}</small>
            </span>
          </button>

          {isCalendarOpen && (
            <CalendarDropdown
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        <div className="guest-select-wrap">
          <button
            className="guest-select"
            type="button"
            aria-expanded={isGuestOpen}
            onClick={() => {
              setIsGuestOpen((current) => !current)
              setIsCalendarOpen(false)
            }}
          >
            <GuestsIcon />
            <span>
              <b>{guestSummary}</b>
              <small>{roomSummary}</small>
            </span>
            <svg className="chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isGuestOpen && (
            <div className="guest-dropdown">
              <CounterRow
                label="Phòng"
                value={rooms}
                min={1}
                onDecrease={() => setRooms((current) => Math.max(1, current - 1))}
                onIncrease={() => setRooms((current) => current + 1)}
              />
              <CounterRow
                label="Người lớn"
                hint="Từ 18 tuổi trở lên"
                value={adults}
                min={1}
                onDecrease={() => setAdults((current) => Math.max(1, current - 1))}
                onIncrease={() => setAdults((current) => current + 1)}
              />
              <CounterRow
                label="Trẻ em"
                hint="Từ 0-17 tuổi"
                value={children}
                min={0}
                onDecrease={() => setChildren((current) => Math.max(0, current - 1))}
                onIncrease={() => setChildren((current) => current + 1)}
              />
            </div>
          )}
        </div>

        <button className="search-submit" type="button">
          Tìm kiếm
        </button>
      </div>
    </section>
  )
}

export default HomeSearch
