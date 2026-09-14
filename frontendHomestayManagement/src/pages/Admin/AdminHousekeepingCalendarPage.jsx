import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import AdminLayout from './AdminLayout'
import './AdminHousekeepingCalendarPage.css'

const API = (import.meta.env.VITE_API_URL || '') + '/api/admin/housekeeping/calendar'

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

const STATUS = {
  AVAILABLE: { label: 'Phòng trống', shortLabel: 'Trống', icon: '🟢', className: 'available', desc: 'Sẵn sàng nhận khách' },
  OCCUPIED: { label: 'Đang có khách', shortLabel: 'Đang ở', icon: '🔴', className: 'occupied', desc: 'Khách đang lưu trú' },
  BOOKED: { label: 'Đã đặt trước', shortLabel: 'Đã đặt', icon: '🔵', className: 'booked', desc: 'Có khách đặt giữ phòng' },
  CLEANING: { label: 'Đang dọn dẹp', shortLabel: 'Đang dọn', icon: '🧹', className: 'cleaning', desc: 'Nhân viên đang vệ sinh' },
  MAINTENANCE: { label: 'Đang bảo trì', shortLabel: 'Bảo trì', icon: '🛠️', className: 'maintenance', desc: 'Phòng sự cố / sửa chữa' },
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
  const dayName = new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long' })
  return dayName.charAt(0).toUpperCase() + dayName.slice(1)
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

  const loadCalendar = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const params = new URLSearchParams({ startDate, days: '7' })
      const response = await fetch(`${API}?${params}`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Không thể tải lịch trạng thái phòng')
      setData(result)
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [startDate])

  useEffect(() => {
    loadCalendar()
    const refreshTimer = window.setInterval(() => loadCalendar(true), 10_000)
    return () => window.clearInterval(refreshTimer)
  }, [loadCalendar])

  const allRoomTypes = useMemo(() => {
    const map = new Map()
    ;(data?.rooms || []).forEach(room => map.set(room.roomTypeId, room.roomTypeName))
    return [...map.entries()].map(([id, name]) => ({ id, name: houseTypeName({ roomTypeId: id, roomTypeName: name }) }))
  }, [data])

  const dates = data?.rooms?.[0]?.days?.map(day => day.date) || Array.from({ length: 7 }, (_, index) => addDays(startDate, index))
  const todayStr = isoDate(new Date())

  const visibleRooms = (data?.rooms || []).filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus = status === 'ALL' || room.days.some(day => day.status === status)
    const matchesRoomType = roomTypeId === 'ALL' || String(room.roomTypeId) === String(roomTypeId)
    return matchesSearch && matchesStatus && matchesRoomType
  })
  const summary = data?.summary || {}

  const chooseCell = async (room, day) => {
    setSelected({ room, day, trace: null, traceLoading: true, traceError: '' })
    try {
      const cutoff = day.checkInTarget || `${day.date}T23:59:59`
      const params = new URLSearchParams({ completedBefore: cutoff })
      const response = await fetch(`${API}/rooms/${room.roomId}/latest-cleaning?${params}`, {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
      })
      const trace = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(trace.message || 'Không thể tải lần vệ sinh gần nhất')
      setSelected(current => current?.room.roomId === room.roomId && current?.day.date === day.date
        ? { ...current, trace, traceLoading: false }
        : current)
    } catch (err) {
      setSelected(current => current?.room.roomId === room.roomId && current?.day.date === day.date
        ? { ...current, traceLoading: false, traceError: err.message }
        : current)
    }
  }

  return (
    <AdminLayout activePage="housekeeping-room-calendar">
      <div className="hkr-page">
        {/* Header bar */}
        <header className="hkr-header">
          <div className="hkr-title-group">
            <span className="hkr-eyebrow">VẬN HÀNH & BẢO TRÌ PHÒNG</span>
            <h1>Lịch trạng thái phòng</h1>
            <p>Bảng theo dõi trực quan trạng thái phòng, đặt phòng, dọn dẹp và bảo trì theo tuần.</p>
          </div>

          <div className="hkr-date-controls">
            <div className="hkr-date-picker-box" style={{ minWidth: 160 }}>
              <DateDropdownPicker
                className="date-dropdown-picker--compact"
                value={startDate}
                onChange={(newDate) => {
                  if (newDate) setStartDate(newDate)
                }}
                allowEmpty={false}
              />
            </div>
            <div className="hkr-date-range-badge">
              📅 {shortDate(dates[0])} — {shortDate(dates[dates.length - 1])}
            </div>
            <div className="hkr-date-nav">
              <button type="button" className="hkr-nav-arrow" onClick={() => setStartDate(addDays(startDate, -7))} title="Tuần trước">
                ‹
              </button>
              <button
                type="button"
                className={`hkr-today-btn ${startDate === todayStr ? 'is-current' : ''}`}
                onClick={() => setStartDate(todayStr)}
              >
                Hôm nay
              </button>
              <button type="button" className="hkr-nav-arrow" onClick={() => setStartDate(addDays(startDate, 7))} title="Tuần sau">
                ›
              </button>
            </div>
          </div>
        </header>

        {/* 5 Visual Summary Stat Cards */}
        <section className="hkr-summary-cards">
          {Object.entries(STATUS).map(([key, item]) => {
            const count = summary[key.toLowerCase()] || 0
            const isActive = status === key
            return (
              <button
                type="button"
                key={key}
                className={`hkr-stat-card is-${item.className} ${isActive ? 'is-active' : ''}`}
                onClick={() => setStatus(current => current === key ? 'ALL' : key)}
              >
                <div className="hkr-stat-top">
                  <span className="hkr-stat-icon">{item.icon}</span>
                  <span className="hkr-stat-count">{count}</span>
                </div>
                <div className="hkr-stat-label">{item.label}</div>
                <div className="hkr-stat-desc">{item.desc}</div>
              </button>
            )
          })}
        </section>

        {/* Filter Toolbar */}
        <div className="hkr-toolbar">
          <div className="hkr-search">
            <span className="hkr-search-icon">🔍</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Tìm nhanh số phòng (101, 202...)"
            />
            {search && (
              <button type="button" className="hkr-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          <select className="hkr-select" value={roomTypeId} onChange={event => setRoomTypeId(event.target.value)}>
            <option value="ALL">🏠 Tất cả loại phòng ({allRoomTypes.length})</option>
            {allRoomTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>

          <select className="hkr-select" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="ALL">🎯 Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([key, item]) => (
              <option key={key} value={key}>{item.icon} {item.label}</option>
            ))}
          </select>

          {status !== 'ALL' && (
            <button type="button" className="hkr-reset-filter" onClick={() => setStatus('ALL')}>
              Xóa bộ lọc trạng thái ✕
            </button>
          )}

          <button type="button" className="hkr-refresh-btn" onClick={() => loadCalendar()} disabled={loading}>
            ↻ Làm mới
          </button>
        </div>

        {error && <div className="hkr-error-banner">⚠️ {error}</div>}

        {/* Main Calendar Grid */}
        <div className="hkr-calendar-wrap">
          <div className="hkr-calendar" style={{ '--day-count': dates.length }}>
            {/* Header: Room corner */}
            <div className="hkr-corner">
              <span className="hkr-corner-title">Phòng</span>
              <small className="hkr-corner-sub">{visibleRooms.length} phòng hiển thị</small>
            </div>

            {/* Header: Day columns */}
            {dates.map(date => {
              const isToday = date === todayStr
              return (
                <div className={`hkr-day-head ${isToday ? 'is-today' : ''}`} key={date}>
                  <div className="hkr-day-name">{weekday(date)}</div>
                  <div className="hkr-day-date">{shortDate(date)}</div>
                  {isToday && <span className="hkr-today-badge">📍 Hôm nay</span>}
                </div>
              )
            })}

            {/* Content Rows */}
            {loading ? (
              <div className="hkr-loading-state">
                <div className="hkr-spinner" />
                <p>Đang tải dữ liệu lịch phòng...</p>
              </div>
            ) : visibleRooms.length === 0 ? (
              <div className="hkr-empty-state">
                <span style={{ fontSize: 36 }}>🔎</span>
                <p>Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại.</p>
                <button type="button" onClick={() => { setSearch(''); setStatus('ALL'); setRoomTypeId('ALL') }}>
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : visibleRooms.map(room => (
              <div className="hkr-row" key={room.roomId}>
                {/* Left sticky room info */}
                <div className="hkr-room-col">
                  <div className="hkr-room-box">
                    <span className="hkr-room-num">P.{room.roomNumber}</span>
                    <span className="hkr-room-type">{houseTypeName(room)}</span>
                  </div>
                </div>

                {/* Day cells for this room */}
                {room.days.map(day => {
                  const meta = STATUS[day.status] || STATUS.AVAILABLE
                  const isCleaningNow = day.housekeepingStatus === 'CLEANING' || day.status === 'CLEANING'
                  const isDirtyNow = day.housekeepingStatus === 'DIRTY'
                  const isToday = day.date === todayStr

                  return (
                    <button
                      type="button"
                      className={`hkr-cell is-${meta.className} ${isToday ? 'is-today-col' : ''}`}
                      key={day.date}
                      onClick={() => chooseCell(room, day)}
                      title="Nhấp để xem chi tiết phòng và lịch vệ sinh"
                    >
                      {/* Top status badge */}
                      <div className="hkr-cell-top">
                        <span className={`hkr-badge is-${meta.className}`}>
                          <span className="hkr-badge-dot" />
                          {meta.shortLabel}
                        </span>

                        {isCleaningNow && day.status !== 'CLEANING' && (
                          <span className="hkr-sub-badge is-cleaning" title="Đang có nhân viên dọn phòng">
                            🧹 Đang dọn
                          </span>
                        )}
                        {isDirtyNow && day.status !== 'CLEANING' && (
                          <span className="hkr-sub-badge is-dirty" title="Phòng cần dọn dẹp">
                            ⚠️ Cần dọn
                          </span>
                        )}
                      </div>

                      {/* Main card info */}
                      <div className="hkr-cell-body">
                        {day.status === 'AVAILABLE' && (
                          <div className="hkr-cell-available">
                            <span className="hkr-avail-icon">✨</span>
                            <span className="hkr-avail-text">Trống</span>
                          </div>
                        )}

                        {day.customerName && (
                          <div className="hkr-cell-guest">
                            <span className="hkr-guest-icon">👤</span>
                            <strong className="hkr-guest-name">{day.customerName}</strong>
                          </div>
                        )}

                        {day.status === 'CLEANING' && (
                          <div className="hkr-cell-cleaner">
                            <span className="hkr-cleaner-icon">🧹</span>
                            <span className="hkr-cleaner-name">{day.assignedHousekeepingName || 'Chưa phân công'}</span>
                          </div>
                        )}

                        {(day.status === 'CLEANING' || isCleaningNow) && day.checklistTotal > 0 && (
                          <div className="hkr-checklist-pill">
                            📋 {day.checklistCompleted || 0}/{day.checklistTotal} việc
                          </div>
                        )}

                        {day.bookingId && (
                          <div className="hkr-booking-tag">
                            🔖 {bookingDisplay(day)}
                          </div>
                        )}

                        {day.status === 'MAINTENANCE' && (
                          <div className="hkr-cell-maint">
                            <span className="hkr-maint-icon">⚠️</span>
                            <span className="hkr-maint-note">{day.note || 'Sự cố / Bảo trì'}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="hkr-legend">
          <span className="hkr-legend-title">Chú thích:</span>
          {Object.entries(STATUS).map(([key, item]) => (
            <span className="hkr-legend-item" key={key}>
              <i className={`is-${item.className}`} /> {item.label}
            </span>
          ))}
          <span className="hkr-legend-item">
            <span style={{ color: '#db2777', fontWeight: 700 }}>🧹 Đang dọn</span>
          </span>
          <span className="hkr-legend-item">
            <span style={{ color: '#d97706', fontWeight: 700 }}>⚠️ Cần dọn</span>
          </span>
        </div>

        {/* Side Drawer Modal */}
        {selected && (
          <div className="hkr-overlay" onClick={event => event.target === event.currentTarget && setSelected(null)}>
            <aside className="hkr-detail">
              <button type="button" className="hkr-close" onClick={() => setSelected(null)} aria-label="Đóng">
                ×
              </button>
              
              <div className="hkr-detail-header">
                <span className="hkr-eyebrow">
                  📅 {weekday(selected.day.date)} · {shortDate(selected.day.date)}
                </span>
                <h2>Phòng {selected.room.roomNumber}</h2>
                <p className="hkr-detail-type">{houseTypeName(selected.room)}</p>
                
                <div className={`hkr-detail-status-pill is-${STATUS[selected.day.status]?.className}`}>
                  {STATUS[selected.day.status]?.icon} {STATUS[selected.day.status]?.label}
                </div>
              </div>

              {/* Guest & Booking details */}
              {selected.day.customerName && (
                <div className="hkr-detail-card">
                  <div className="hkr-detail-card-title">👤 THÔNG TIN KHÁCH LƯU TRÚ</div>
                  <div className="hkr-guest-row">
                    <strong>{selected.day.customerName}</strong>
                    <span className="hkr-badge-code">{bookingDisplay(selected.day)}</span>
                  </div>
                  {selected.day.bookingId && (
                    <div className="hkr-time-grid">
                      <div className="hkr-time-box">
                        <span>Nhận phòng (Check-in)</span>
                        <strong>{dateTime(selected.day.checkInTarget)}</strong>
                      </div>
                      <div className="hkr-time-box">
                        <span>Trả phòng (Check-out)</span>
                        <strong>{dateTime(selected.day.checkOutTarget)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance notice */}
              {selected.day.status === 'MAINTENANCE' && (
                <div className="hkr-detail-card is-maintenance-card">
                  <div className="hkr-detail-card-title">🛠️ THÔNG TIN BẢO TRÌ PHÒNG</div>
                  <p className="hkr-maint-text">{selected.day.note || 'Phòng đang tạm khóa để kiểm tra, sửa chữa và bảo dưỡng thiết bị.'}</p>
                </div>
              )}

              {/* Housekeeping task currently assigned */}
              {selected.day.status === 'CLEANING' && (
                <div className="hkr-detail-card is-cleaning-card">
                  <div className="hkr-detail-card-title">🧹 NHIỆM VỤ DỌN PHÒNG HIỆN TẠI</div>
                  <div className="hkr-cleaner-card">
                    <span className="hkr-cleaner-avatar">
                      {selected.day.assignedHousekeepingName?.charAt(0)?.toUpperCase() || 'H'}
                    </span>
                    <div>
                      <span>Nhân viên phụ trách</span>
                      <strong>{selected.day.assignedHousekeepingName || 'Chưa phân công'}</strong>
                      <small>Tiến độ: {selected.day.checklistCompleted || 0}/{selected.day.checklistTotal || 0} công việc</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest cleaning trace history */}
              <section className="hkr-cleaning-trace">
                <div className="hkr-trace-title">
                  <span>LẦN VỆ SINH HOÀN THÀNH GẦN NHẤT</span>
                  <small>Kiểm tra chất lượng phòng trước khi khách nhận</small>
                </div>

                {selected.traceLoading ? (
                  <div className="hkr-trace-empty">⏳ Đang tải dữ liệu lịch sử vệ sinh...</div>
                ) : selected.traceError ? (
                  <div className="hkr-trace-error">⚠️ {selected.traceError}</div>
                ) : !selected.trace?.housekeepingTaskId ? (
                  <div className="hkr-trace-empty">Chưa có bản ghi vệ sinh nào hoàn thành trước thời điểm này.</div>
                ) : (
                  <>
                    <div className="hkr-cleaner-card">
                      <span className="hkr-cleaner-avatar">
                        {selected.trace.employeeName?.charAt(0)?.toUpperCase() || 'H'}
                      </span>
                      <div>
                        <span>Nhân viên thực hiện</span>
                        <strong>{selected.trace.employeeName || 'Chưa xác định'}</strong>
                        <small>Mã công việc: #{selected.trace.housekeepingTaskId}</small>
                      </div>
                    </div>

                    <div className="hkr-trace-meta">
                      <div><span>Bắt đầu</span><strong>{dateTime(selected.trace.startedAt)}</strong></div>
                      <div><span>Hoàn thành</span><strong>{dateTime(selected.trace.completedAt)}</strong></div>
                      <div><span>Thời lượng</span><strong>{selected.trace.durationMinutes == null ? '—' : `${selected.trace.durationMinutes} phút`}</strong></div>
                    </div>

                    <div className="hkr-trace-checklist">
                      <div className="hkr-trace-checklist-head">
                        <strong>Checklist công việc</strong>
                        <span>
                          {selected.trace.checklistItems?.filter(item => item.completed).length || 0}/{selected.trace.checklistItems?.length || 0}
                        </span>
                      </div>
                      {selected.trace.checklistItems?.length ? (
                        selected.trace.checklistItems.map(item => (
                          <div className={`hkr-trace-item ${item.completed ? 'is-done' : ''}`} key={item.id}>
                            <i>{item.completed ? '✓' : '–'}</i>
                            <div>
                              <strong>{item.title}</strong>
                              {item.completedAt && (
                                <small>{item.completedByName || selected.trace.employeeName} · {dateTime(item.completedAt)}</small>
                              )}
                            </div>
                            <span>{item.required ? 'Bắt buộc' : 'Tùy chọn'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="hkr-trace-empty">Chưa có mục checklist cụ thể.</div>
                      )}
                    </div>

                    {selected.trace.note && (
                      <div className="hkr-trace-note">
                        <span>Ghi chú của nhân viên dọn:</span>
                        <p>{selected.trace.note}</p>
                      </div>
                    )}
                  </>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminHousekeepingCalendarPage

