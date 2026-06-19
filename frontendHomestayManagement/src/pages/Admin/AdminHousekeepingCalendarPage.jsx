import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminHousekeepingCalendarPage.css'

const API = 'http://localhost:8080/api/admin/housekeeping/calendar'
const STATUS = {
  AVAILABLE: { label: 'Trống', className: 'available' },
  BOOKED: { label: 'Đã đặt', className: 'booked' },
  OCCUPIED: { label: 'Có khách', className: 'occupied' },
  CLEANING: { label: 'Đang dọn', className: 'cleaning' },
  MAINTENANCE: { label: 'Bảo trì', className: 'maintenance' },
}

function isoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

function shortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function weekday(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })
}

function dateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function AdminHousekeepingCalendarPage() {
  const [startDate, setStartDate] = useState(() => isoDate(new Date()))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roomTypeId, setRoomTypeId] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ startDate, days: '7' })
      const response = await fetch(`${API}?${params}`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Không thể tải lịch trạng thái phòng')
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [startDate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCalendar()
  }, [loadCalendar])

  const allRoomTypes = useMemo(() => {
    const map = new Map()
    ;(data?.rooms || []).forEach(room => map.set(room.roomTypeId, room.roomTypeName))
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [data])

  const dates = data?.rooms?.[0]?.days?.map(day => day.date) || Array.from({ length: 7 }, (_, index) => addDays(startDate, index))
  const visibleRooms = (data?.rooms || []).filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus = status === 'ALL' || room.days.some(day => day.status === status)
    const matchesRoomType = roomTypeId === 'ALL' || String(room.roomTypeId) === String(roomTypeId)
    return matchesSearch && matchesStatus && matchesRoomType
  })
  const summary = data?.summary || {}

  const chooseCell = (room, day) => setSelected({ room, day })

  return (
    <AdminLayout activePage="housekeeping-room-calendar">
      <div className="hkr-page">
        <header className="hkr-header">
          <div><span className="hkr-eyebrow">VẬN HÀNH PHÒNG</span><h1>Lịch trạng thái phòng</h1><p>Theo dõi đặt phòng, lưu trú, vệ sinh và bảo trì trên cùng một lịch.</p></div>
          <div className="hkr-date-nav">
            <button type="button" onClick={() => setStartDate(addDays(startDate, -7))}>‹</button>
            <button type="button" className="hkr-today" onClick={() => setStartDate(isoDate(new Date()))}>Hôm nay</button>
            <button type="button" onClick={() => setStartDate(addDays(startDate, 7))}>›</button>
          </div>
        </header>

        <section className="hkr-summary">
          {Object.entries(STATUS).map(([key, item]) => (
            <button type="button" key={key} className={status === key ? 'is-active' : ''} onClick={() => setStatus(current => current === key ? 'ALL' : key)}>
              <i className={`is-${item.className}`} /><span>{item.label}</span><strong>{summary[key.toLowerCase()] || 0}</strong>
            </button>
          ))}
        </section>

        <div className="hkr-toolbar">
          <div className="hkr-search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm số phòng..." /></div>
          <select value={roomTypeId} onChange={event => setRoomTypeId(event.target.value)}>
            <option value="ALL">Tất cả loại phòng</option>
            {allRoomTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
          <select value={status} onChange={event => setStatus(event.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
          </select>
          <button type="button" className="hkr-refresh" onClick={loadCalendar} disabled={loading}>↻ Làm mới</button>
        </div>

        {error && <div className="hkr-error">{error}</div>}

        <div className="hkr-calendar-wrap">
          <div className="hkr-calendar" style={{ '--day-count': dates.length }}>
            <div className="hkr-corner"><span>Phòng</span><small>{visibleRooms.length} phòng</small></div>
            {dates.map(date => {
              const today = date === isoDate(new Date())
              return <div className={`hkr-day-head${today ? ' is-today' : ''}`} key={date}><span>{weekday(date)}</span><strong>{shortDate(date)}</strong>{today && <i>Hôm nay</i>}</div>
            })}

            {loading ? <div className="hkr-loading">Đang tải lịch phòng...</div> : visibleRooms.length === 0 ? <div className="hkr-loading">Không có phòng phù hợp bộ lọc.</div> : visibleRooms.map(room => (
              <div className="hkr-row" key={room.roomId}>
                <div className="hkr-room"><span>{room.roomNumber}</span><div><strong>Phòng {room.roomNumber}</strong><small>{room.roomTypeName}</small></div></div>
                {room.days.map(day => {
                  const meta = STATUS[day.status] || STATUS.AVAILABLE
                  return (
                    <button type="button" className={`hkr-cell is-${meta.className}`} key={day.date} onClick={() => chooseCell(room, day)}>
                      <span className="hkr-status"><i />{meta.label}</span>
                      {day.customerName && <strong>{day.customerName}</strong>}
                      {day.status === 'CLEANING' && <strong>{day.assignedHousekeepingName || 'Chưa phân công'}</strong>}
                      {day.status === 'CLEANING' && day.checklistTotal > 0 && <small>Checklist {day.checklistCompleted}/{day.checklistTotal}</small>}
                      {day.bookingId && <small>Booking #{day.bookingId}</small>}
                      {day.status === 'AVAILABLE' && <small>Sẵn sàng nhận khách</small>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="hkr-legend">{Object.entries(STATUS).map(([key, item]) => <span key={key}><i className={`is-${item.className}`} />{item.label}</span>)}</div>

        {selected && (
          <div className="hkr-overlay" onClick={event => event.target === event.currentTarget && setSelected(null)}>
            <aside className="hkr-detail">
              <button type="button" className="hkr-close" onClick={() => setSelected(null)}>×</button>
              <span className="hkr-eyebrow">{weekday(selected.day.date)} · {shortDate(selected.day.date)}</span>
              <h2>Phòng {selected.room.roomNumber}</h2><p>{selected.room.roomTypeName}</p>
              <div className={`hkr-detail-status is-${STATUS[selected.day.status]?.className}`}><i />{STATUS[selected.day.status]?.label}</div>
              {selected.day.customerName && <div className="hkr-detail-block"><span>Khách lưu trú</span><strong>{selected.day.customerName}</strong><small>Booking #{selected.day.bookingId}</small></div>}
              {selected.day.bookingId && <div className="hkr-detail-grid"><div><span>Nhận phòng</span><strong>{dateTime(selected.day.checkInTarget)}</strong></div><div><span>Trả phòng</span><strong>{dateTime(selected.day.checkOutTarget)}</strong></div></div>}
              {selected.day.status === 'CLEANING' && <div className="hkr-detail-block"><span>Nhân viên phụ trách</span><strong>{selected.day.assignedHousekeepingName || 'Chưa phân công'}</strong><small>Checklist {selected.day.checklistCompleted || 0}/{selected.day.checklistTotal || 0}</small></div>}
              {selected.day.note && <div className="hkr-detail-block"><span>Ghi chú</span><strong>{selected.day.note}</strong></div>}
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminHousekeepingCalendarPage
