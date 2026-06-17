import { useEffect, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminUsersPage.css'

const API = 'http://localhost:8080/api/admin/users'
const BACKEND = 'http://localhost:8080'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

const ROLE_LABEL = {
  ROLE_ADMIN: 'Admin',
  ROLE_RECEPTIONIST: 'Receptionist',
  ROLE_CUSTOMER: 'Customer',
  ROLE_HOUSEKEEPING: 'Housekeeping',
  ROLE_MARKETING: 'Marketing',
}

function isCustomerRole(role) {
  return role === 'ROLE_CUSTOMER'
}

function getRoleNameById(roles, roleId) {
  return roles.find(r => String(r.id) === String(roleId))?.name
}

function roleBadgeClass(role) {
  const map = {
    ROLE_ADMIN: 'badge--admin',
    ROLE_RECEPTIONIST: 'badge--recep',
    ROLE_CUSTOMER: 'badge--customer',
  }
  return `badge ${map[role] || 'badge--default'}`
}

function getInitials(name, email) {
  if (name) return name.split(' ').filter(Boolean).slice(-2).map(p => p[0]).join('').toUpperCase()
  return email?.[0]?.toUpperCase() || '?'
}

function getAvatarUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BACKEND}${url}`
}

const BOOKING_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(value || 0))
}

// ── Modal thêm mới ────────────────────────────────────────
function CreateUserModal({ roles, entityLabel, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    roleId: roles[0]?.id || '', isActive: true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const selectedRole = getRoleNameById(roles, form.roleId)
  const phoneMaxLength = isCustomerRole(selectedRole) ? 10 : 15

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, roleId: Number(form.roleId) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="aum-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aum-modal">
        <div className="aum-modal-head">
          <h3>Thêm {entityLabel} mới</h3>
          <button type="button" className="aum-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="aum-modal-body" onSubmit={handleSubmit}>
          <label className="aum-field"><span>Họ và tên</span>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Nhập họ tên" />
          </label>
          <label className="aum-field"><span>Email</span>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="email@example.com" />
          </label>
          <label className="aum-field"><span>Số điện thoại</span>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Số điện thoại (tuỳ chọn)" maxLength={phoneMaxLength} />
          </label>
          <label className="aum-field"><span>Mật khẩu</span>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} placeholder="Tối thiểu 6 ký tự" />
          </label>
          <label className="aum-field"><span>Role</span>
            <select value={form.roleId} onChange={e => set('roleId', e.target.value)}>
              {roles.map(r => <option key={r.id} value={r.id}>{ROLE_LABEL[r.name] || r.name}</option>)}
            </select>
          </label>
          {error && <p className="aum-error">{error}</p>}
          <div className="aum-modal-actions">
            <button type="button" className="aum-btn aum-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="aum-btn aum-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : `Tạo ${entityLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal chỉnh sửa ───────────────────────────────────────
function EditUserModal({ user, roles, entityLabel, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    roleId: user.roleId || roles[0]?.id || '',
    isActive: user.isActive,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const selectedRole = getRoleNameById(roles, form.roleId)
  const phoneMaxLength = isCustomerRole(selectedRole) ? 10 : 15

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${API}/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, roleId: Number(form.roleId) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const avatarUrl = getAvatarUrl(user.avatarUrl)

  return (
    <div className="aum-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aum-modal">
        <div className="aum-modal-head">
          <h3>Chỉnh sửa {entityLabel}</h3>
          <button type="button" className="aum-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="aum-modal-body" onSubmit={handleSubmit}>
          {/* Avatar */}
          <div className="aum-edit-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.fullName} className="aum-edit-avatar-img" />
              : <span className="aum-avatar aum-avatar--lg">{getInitials(user.fullName, user.email)}</span>
            }
            <div>
              <p className="aum-edit-name">{user.fullName || '—'}</p>
              <p className="aum-edit-email">{user.email}</p>
            </div>
          </div>

          <label className="aum-field"><span>Họ và tên</span>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Nhập họ tên" />
          </label>
          <label className="aum-field"><span>Email</span>
            <input type="email" value={user.email} readOnly className="aum-input--readonly" />
          </label>
          <label className="aum-field"><span>Số điện thoại</span>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Số điện thoại (tuỳ chọn)" maxLength={phoneMaxLength} />
          </label>
          <label className="aum-field"><span>Role</span>
            <select value={form.roleId} onChange={e => set('roleId', e.target.value)}>
              {roles.map(r => <option key={r.id} value={r.id}>{ROLE_LABEL[r.name] || r.name}</option>)}
            </select>
          </label>

          {error && <p className="aum-error">{error}</p>}
          <div className="aum-modal-actions">
            <button type="button" className="aum-btn aum-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="aum-btn aum-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal xác nhận deactivate ─────────────────────────────
function DeactivateModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="aum-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aum-modal aum-modal--sm">
        <div className="aum-modal-head">
          <h3>Vô hiệu hoá tài khoản</h3>
          <button type="button" className="aum-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="aum-modal-body">
          <p style={{ margin: '0 0 24px', color: '#374151' }}>
            Tài khoản <strong>{user.fullName || user.email}</strong> sẽ bị vô hiệu hoá và không thể đăng nhập. Bạn có chắc?
          </p>
          <div className="aum-modal-actions">
            <button type="button" className="aum-btn aum-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="button" className="aum-btn aum-btn--danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Vô hiệu hoá'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal xác nhận activate ───────────────────────────────
function ActivateModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="aum-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aum-modal aum-modal--sm">
        <div className="aum-modal-head">
          <h3>Kích hoạt tài khoản</h3>
          <button type="button" className="aum-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="aum-modal-body">
          <p style={{ margin: '0 0 24px', color: '#374151' }}>
            Kích hoạt lại tài khoản <strong>{user.fullName || user.email}</strong>? Người dùng sẽ có thể đăng nhập trở lại.
          </p>
          <div className="aum-modal-actions">
            <button type="button" className="aum-btn aum-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="button" className="aum-btn aum-btn--primary" onClick={onConfirm} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerHistoryModal({ user, onClose }) {
  const [history, setHistory] = useState(null)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API}/${user.id}/booking-history`, { headers: authHeaders(), signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải lịch sử đặt phòng')
        setHistory(data)
        setSelectedBookingId(data.bookings?.[0]?.bookingId ?? null)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [user.id])

  useEffect(() => {
    const handleKeyDown = event => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const selectedBooking = history?.bookings?.find(item => item.bookingId === selectedBookingId)

  return (
    <div className="aum-overlay aum-history-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="aum-history-modal" role="dialog" aria-modal="true" aria-labelledby="customer-history-title">
        <header className="aum-history-head">
          <div className="aum-history-customer">
            {getAvatarUrl(user.avatarUrl)
              ? <img src={getAvatarUrl(user.avatarUrl)} alt="" className="aum-avatar aum-avatar--img" />
              : <span className="aum-avatar">{getInitials(user.fullName, user.email)}</span>}
            <div>
              <span className="aum-history-eyebrow">Lịch sử đặt phòng</span>
              <h2 id="customer-history-title">{user.fullName || user.email}</h2>
              <p>{user.phone || 'Chưa có SĐT'} · {user.identityDocumentNumber ? `CCCD ${user.identityDocumentNumber}` : 'Chưa có CCCD'}</p>
            </div>
          </div>
          <button type="button" className="aum-history-close" onClick={onClose} aria-label="Đóng">×</button>
        </header>

        {loading ? <div className="aum-history-state"><span className="aum-spinner" />Đang tải lịch sử...</div> : null}
        {!loading && error ? <div className="aum-history-state aum-history-state--error">{error}</div> : null}
        {!loading && !error && history?.bookings?.length === 0 ? (
          <div className="aum-history-state">
            <strong>Chưa có booking</strong>
            <span>Khách hàng này chưa từng đặt phòng trong hệ thống.</span>
          </div>
        ) : null}

        {!loading && !error && selectedBooking ? (
          <div className="aum-history-layout">
            <aside className="aum-booking-list">
              <div className="aum-booking-list-head">
                <strong>{history.bookingCount} booking</strong>
                <span>Mới nhất trước</span>
              </div>
              {history.bookings.map(booking => (
                <button
                  type="button"
                  key={booking.bookingId}
                  className={`aum-booking-item${booking.bookingId === selectedBookingId ? ' is-active' : ''}`}
                  onClick={() => setSelectedBookingId(booking.bookingId)}
                >
                  <span className="aum-booking-item-top">
                    <strong>#{booking.bookingId}</strong>
                    <i className={`aum-history-status status--${String(booking.status).toLowerCase()}`}>
                      {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                    </i>
                  </span>
                  <span>Đặt lúc {formatDateTime(booking.bookingDate)}</span>
                  <span>{booking.roomCount} phòng · {booking.totalAdults + booking.totalChildren} khách</span>
                  <b>{formatMoney(booking.totalAmount)}</b>
                </button>
              ))}
            </aside>

            <main className="aum-booking-detail">
              <div className="aum-booking-summary">
                <div>
                  <span>Booking #{selectedBooking.bookingId}</span>
                  <h3>{formatMoney(selectedBooking.totalAmount)}</h3>
                  <p>Ngày đặt: {formatDateTime(selectedBooking.bookingDate)}</p>
                </div>
                <div className="aum-booking-totals">
                  <span><i>Tiền phòng</i><b>{formatMoney(selectedBooking.roomCharge)}</b></span>
                  <span><i>Dịch vụ</i><b>{formatMoney(selectedBooking.serviceCharge)}</b></span>
                  {Number(selectedBooking.penaltyCharge) > 0 && <span><i>Phụ thu/phạt</i><b>{formatMoney(selectedBooking.penaltyCharge)}</b></span>}
                </div>
              </div>

              <div className="aum-room-list">
                {selectedBooking.rooms.map((room, index) => (
                  <article className="aum-history-room" key={room.bookingDetailId}>
                    <div className="aum-room-title">
                      <span className="aum-room-index">{index + 1}</span>
                      <div>
                        <h4>{room.roomNumber ? `Phòng ${room.roomNumber}` : 'Chưa gán phòng'}</h4>
                        <p>{room.roomTypeName || 'Chưa phân loại'} · {room.rentType || '—'}</p>
                      </div>
                      <strong>{formatMoney(room.priceAtBooking)}</strong>
                    </div>

                    <div className="aum-stay-grid">
                      <div><span>Nhận phòng dự kiến</span><strong>{formatDateTime(room.checkInTarget)}</strong></div>
                      <div><span>Trả phòng dự kiến</span><strong>{formatDateTime(room.checkOutTarget)}</strong></div>
                      <div><span>Check-in thực tế</span><strong>{formatDateTime(room.actualCheckIn)}</strong></div>
                      <div><span>Check-out thực tế</span><strong>{formatDateTime(room.actualCheckOut)}</strong></div>
                    </div>

                    <div className="aum-room-meta">
                      <span>{room.numberOfAdults || 0} người lớn</span>
                      <span>{room.numberOfChildren || 0} trẻ em</span>
                      <span>{BOOKING_STATUS_LABEL[room.status] || room.status}</span>
                    </div>

                    <div className="aum-history-section">
                      <div className="aum-history-section-title"><h5>Người lưu trú</h5><span>{room.guests.length} người</span></div>
                      {room.guests.length ? (
                        <div className="aum-guest-grid">
                          {room.guests.map(guest => (
                            <div className="aum-guest-card" key={guest.id}>
                              <div><strong>{guest.fullName}</strong>{guest.primaryGuest && <span>Đại diện</span>}</div>
                              <p>{guest.identityDocumentType || 'CCCD'}: {guest.identityDocumentNumber || '—'}</p>
                              <p>Ngày sinh: {formatDate(guest.dateOfBirth)} · {guest.gender || '—'}</p>
                              <p>{guest.phone || 'Chưa có SĐT'} · {guest.nationality || '—'}</p>
                              {guest.address && <p>{guest.address}</p>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="aum-history-empty-row">Chưa cập nhật thông tin người lưu trú.</p>}
                    </div>

                    <div className="aum-history-section">
                      <div className="aum-history-section-title"><h5>Dịch vụ</h5><span>{room.services.length} mục</span></div>
                      {room.services.length ? (
                        <div className="aum-service-list">
                          {room.services.map(service => (
                            <div key={service.id}>
                              <span><strong>{service.name}</strong><small>{service.type === 'FACILITY' ? 'Tiện ích' : 'Sản phẩm'} · SL {service.quantity}</small></span>
                              <b>{formatMoney(service.totalAmount)}</b>
                            </div>
                          ))}
                        </div>
                      ) : <p className="aum-history-empty-row">Booking này không sử dụng dịch vụ.</p>}
                    </div>
                  </article>
                ))}
              </div>
            </main>
          </div>
        ) : null}
      </section>
    </div>
  )
}

// ── Trang chính ───────────────────────────────────────────
const PAGE_SIZE = 6

function AdminUsersPage({ userType = 'employees' }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [activateTarget, setActivateTarget] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [toast, setToast] = useState('')
  const [historyTarget, setHistoryTarget] = useState(null)
  const isCustomerPage = userType === 'customers'
  const entityLabel = isCustomerPage ? 'khách hàng' : 'nhân viên'
  const pageTitle = isCustomerPage ? 'Quản lý khách hàng' : 'Quản lý nhân viên'
  const activePage = isCustomerPage ? 'customers' : 'employees'
  const roleBelongsToPage = (role) => isCustomerPage ? isCustomerRole(role) : !isCustomerRole(role)
  const pageRoles = roles.filter(r => roleBelongsToPage(r.name))

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    Promise.all([
      fetch(API, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/roles`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([u, r]) => {
      setUsers(Array.isArray(u) ? u : [])
      setRoles(Array.isArray(r) ? r : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setFilterRole('')
    setPage(1)
  }, [userType])

  useEffect(() => { setPage(1) }, [search, filterRole])

  const filtered = users.filter(u => {
    const matchPage = roleBelongsToPage(u.role)
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      (isCustomerPage && u.identityDocumentNumber?.includes(search.trim()))
    const matchRole = !filterRole || u.role === filterRole
    return matchPage && matchSearch && matchRole
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleToggleActive = async (targetUser, newActive) => {
    setToggling(true)
    try {
      const res = await fetch(`${API}/${targetUser.id}/toggle-active`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: newActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      setUsers(prev => prev.map(u => u.id === data.id ? data : u))
      showToast(newActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hoá tài khoản')
    } catch (err) {
      showToast(err.message)
    } finally {
      setToggling(false)
      setDeactivateTarget(null)
      setActivateTarget(null)
    }
  }

  return (
    <AdminLayout activePage={activePage}>
      <div className="aum-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{filtered.length} tài khoản {entityLabel} trong hệ thống</p>
        </div>
        <button className="aum-btn aum-btn--primary" type="button" onClick={() => setCreateOpen(true)} disabled={pageRoles.length === 0}>
          + Thêm {entityLabel}
        </button>
      </div>

      <div className="aum-filters">
        <input className="aum-search" placeholder={isCustomerPage ? 'Tìm theo tên, email, CCCD...' : 'Tìm theo tên, email...'}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="aum-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tất cả role</option>
          {pageRoles.map(r => <option key={r.id} value={r.name}>{ROLE_LABEL[r.name] || r.name}</option>)}
        </select>
      </div>

      <div className="aum-table-wrap">
        {loading ? (
          <div className="aum-empty">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="aum-empty">Không tìm thấy {entityLabel} nào.</div>
        ) : (
          <table className="aum-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                {isCustomerPage && <th>CCCD</th>}
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id} className={!u.isActive ? 'aum-row--inactive' : ''}>
                  <td>
                    <div className="aum-user-cell">
                      {getAvatarUrl(u.avatarUrl)
                        ? <img src={getAvatarUrl(u.avatarUrl)} alt={u.fullName} className="aum-avatar aum-avatar--img" />
                        : <span className="aum-avatar">{getInitials(u.fullName, u.email)}</span>
                      }
                      {isCustomerPage ? (
                        <button type="button" className="aum-user-name-btn" onClick={() => setHistoryTarget(u)}>
                          {u.fullName || '—'}
                        </button>
                      ) : <span>{u.fullName || '—'}</span>}
                    </div>
                  </td>
                  <td className="aum-text-secondary">{u.email}</td>
                  <td className="aum-text-secondary">{u.phone || '—'}</td>
                  {isCustomerPage && <td className="aum-text-secondary">{u.identityDocumentNumber || '—'}</td>}
                  <td><span className={roleBadgeClass(u.role)}>{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge--active' : 'badge--inactive'}`}>
                      {u.isActive ? 'Hoạt động' : 'Bị khoá'}
                    </span>
                  </td>
                  <td className="aum-text-secondary">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td>
                    <div className="aum-actions">
                      {/* Nút kích hoạt — chỉ hiện khi tài khoản bị khoá */}
                      {!u.isActive && (
                        <button type="button" className="aum-icon-btn aum-icon-btn--activate" title="Kích hoạt"
                          onClick={() => setActivateTarget(u)}>
                          <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                        </button>
                      )}
                      {/* Nút sửa */}
                      <button type="button" className="aum-icon-btn aum-icon-btn--edit" title="Chỉnh sửa"
                        onClick={() => setEditTarget(u)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {/* Nút khoá — chỉ hiện khi tài khoản đang active */}
                      {u.isActive && (
                        <button type="button" className="aum-icon-btn aum-icon-btn--delete" title="Vô hiệu hoá"
                          onClick={() => setDeactivateTarget(u)}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="aum-pagination">
          <span className="aum-pagination-info">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} tài khoản
          </span>
          <div className="aum-pagination-controls">
            <button type="button" className="aum-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} type="button"
                className={`aum-page-btn${p === page ? ' aum-page-btn--active' : ''}`}
                onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" className="aum-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateUserModal roles={pageRoles} entityLabel={entityLabel} onClose={() => setCreateOpen(false)}
          onSave={saved => { setUsers(prev => [...prev, saved]); setCreateOpen(false); showToast(`Đã tạo ${entityLabel} mới`) }} />
      )}
      {editTarget && (
        <EditUserModal user={editTarget} roles={pageRoles} entityLabel={entityLabel} onClose={() => setEditTarget(null)}
          onSave={saved => { setUsers(prev => prev.map(u => u.id === saved.id ? saved : u)); setEditTarget(null); showToast(`Đã cập nhật ${entityLabel}`) }} />
      )}
      {deactivateTarget && (
        <DeactivateModal user={deactivateTarget} loading={toggling}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={() => handleToggleActive(deactivateTarget, false)} />
      )}
      {activateTarget && (
        <ActivateModal user={activateTarget} loading={toggling}
          onClose={() => setActivateTarget(null)}
          onConfirm={() => handleToggleActive(activateTarget, true)} />
      )}
      {historyTarget && <CustomerHistoryModal user={historyTarget} onClose={() => setHistoryTarget(null)} />}

      {toast && <div className="aum-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminUsersPage
