import React, { useState, useEffect, useCallback } from 'react'
import AdminLayout from './AdminLayout'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { useShiftGuard } from '../../context/ShiftGuardContext'
import './AdminIncidentsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/incidents'
const ROOMS_API = (import.meta.env.VITE_API_URL || '') + '/api/rooms'
const BACKEND = (import.meta.env.VITE_API_URL || '') + ''

function authHeaders() {
  return {
    Authorization: `Bearer ${getStoredToken()}`,
    'Content-Type': 'application/json',
  }
}

function resolveImage(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  if (url.startsWith('/uploads/')) return `${BACKEND}${url}`
  return url
}

function formatMoney(amount) {
  if (!amount && amount !== 0) return '0đ'
  return `${Number(amount).toLocaleString('vi-VN')}đ`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function AdminIncidentsPage() {
  const currentUser = getStoredUser()
  const role = currentUser?.role || ''
  const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN'
  const { isInShift, guardAction } = useShiftGuard()

  const fileInputRef = React.useRef(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [incidents, setIncidents] = useState([])
  const [summary, setSummary] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Report Form State
  const [reportForm, setReportForm] = useState({
    roomId: '',
    itemName: '',
    quantity: 1,
    incidentType: 'DAMAGED',
    severity: 'MEDIUM',
    estimatedCost: '',
    description: '',
    evidenceImageUrl: '',
  })

  // Action Form State
  const [actionForm, setActionForm] = useState({
    status: 'REPORTED',
    liability: 'CUSTOMER',
    compensationAmount: '',
    chargeToInvoice: true,
    adminNotes: '',
  })

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tải ảnh lên từ máy tính.')
      }
      setReportForm((prev) => ({ ...prev, evidenceImageUrl: data.url }))
    } catch (err) {
      setError(err.message || 'Lỗi khi upload ảnh')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)

      const [incRes, sumRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE}?${params.toString()}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/summary`, { headers: authHeaders() }),
        fetch(ROOMS_API, { headers: authHeaders() }).catch(() => null),
      ])

      if (incRes.ok) {
        const incData = await incRes.json()
        setIncidents(Array.isArray(incData) ? incData : [])
      } else {
        setError('Không thể tải danh sách đồ hỏng & mất.')
      }

      if (sumRes.ok) {
        const sumData = await sumRes.json()
        setSummary(sumData)
      }

      if (roomsRes && roomsRes.ok) {
        const roomsData = await roomsRes.json()
        setRooms(Array.isArray(roomsData) ? roomsData : [])
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenActionModal = (incident) => {
    setSelectedIncident(incident)
    setActionForm({
      status: incident.status || 'REPORTED',
      liability: incident.liability || 'CUSTOMER',
      compensationAmount: incident.compensationAmount != null ? incident.compensationAmount : (incident.estimatedCost || ''),
      chargeToInvoice: true,
      adminNotes: incident.adminNotes || '',
    })
    setShowActionModal(true)
  }

  const handleSaveAction = async (e) => {
    e.preventDefault()
    if (!selectedIncident) return
    setSubmitting(true)
    setError('')
    try {
      // 1. Cập nhật quyết định bồi thường nếu có
      if (actionForm.liability) {
        const compRes = await fetch(`${API_BASE}/${selectedIncident.id}/compensation`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            liability: actionForm.liability,
            compensationAmount: actionForm.compensationAmount ? Number(actionForm.compensationAmount) : 0,
            chargeToInvoice: actionForm.chargeToInvoice,
            adminNotes: actionForm.adminNotes,
          }),
        })
        if (!compRes.ok) {
          const errData = await compRes.json().catch(() => ({}))
          throw new Error(errData.message || 'Lỗi khi cập nhật bồi thường')
        }
      }

      // 2. Cập nhật trạng thái sự cố nếu thay đổi
      if (actionForm.status !== selectedIncident.status) {
        const statusRes = await fetch(`${API_BASE}/${selectedIncident.id}/status`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            status: actionForm.status,
            adminNotes: actionForm.adminNotes,
          }),
        })
        if (!statusRes.ok) {
          const errData = await statusRes.json().catch(() => ({}))
          throw new Error(errData.message || 'Lỗi khi cập nhật trạng thái')
        }
      }

      setSuccessMsg('Đã lưu quyết định xử lý sự cố thành công.')
      setShowActionModal(false)
      setSelectedIncident(null)
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReport = async (e) => {
    e.preventDefault()
    if (!reportForm.roomId || !reportForm.itemName) {
      setError('Vui lòng chọn phòng và nhập tên đồ vật.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          roomId: Number(reportForm.roomId),
          itemName: reportForm.itemName,
          quantity: Number(reportForm.quantity) || 1,
          incidentType: reportForm.incidentType,
          severity: reportForm.severity,
          estimatedCost: reportForm.estimatedCost ? Number(reportForm.estimatedCost) : null,
          description: reportForm.description,
          evidenceImageUrl: reportForm.evidenceImageUrl,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Không thể tạo báo cáo sự cố')
      }

      setSuccessMsg('Báo cáo đồ hỏng/mất đã được gửi thành công.')
      setShowReportModal(false)
      setReportForm({
        roomId: '',
        itemName: '',
        quantity: 1,
        incidentType: 'DAMAGED',
        severity: 'MEDIUM',
        estimatedCost: '',
        description: '',
        evidenceImageUrl: '',
      })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickResolve = async (incident) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/${incident.id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'RESOLVED',
          adminNotes: incident.adminNotes ? `${incident.adminNotes} · Đã xử lý xong` : 'Đã xử lý xong sự cố và mở lại phòng đón khách',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Không thể cập nhật trạng thái')
      }
      setSuccessMsg(`✓ Đã hoàn tất xử lý sự cố cho phòng ${incident.roomNumber}. Phòng đã sẵn sàng đón khách!`)
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi sự cố này?')) return
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        setSuccessMsg('Đã xóa sự cố thành công.')
        loadData()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.message || 'Không thể xóa sự cố.')
      }
    } catch {
      setError('Lỗi kết nối khi xóa sự cố.')
    }
  }

  const filteredIncidents = incidents.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (item.itemName && item.itemName.toLowerCase().includes(q)) ||
      (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
      (item.reportedByName && item.reportedByName.toLowerCase().includes(q)) ||
      (item.bookingCode && item.bookingCode.toLowerCase().includes(q))
    )
  })

  return (
    <AdminLayout activePage="housekeeping-incidents">
      <div className="incidents-page">
        {/* Header */}
        <div className="incidents-header">
          <div className="incidents-title-group">
            <h1>Quản lý Đồ hỏng hóc & Bị mất</h1>
            <p>Tiếp nhận báo cáo từ Housekeeping, xác minh tài sản hư hại và quản lý bồi thường</p>
          </div>
          <div className="incidents-actions-group">
            <button
              type="button"
              className="btn-refresh"
              onClick={loadData}
              title="Làm mới danh sách"
            >
              🔄 Làm mới
            </button>
            <button
              type="button"
              className="btn-incident-report"
              onClick={() => {
                guardAction(() => {
                  setError('')
                  setShowReportModal(true)
                }, 'Báo đồ hỏng / mất')
              }}
            >
              ⚠️ + Báo đồ hỏng / mất
            </button>
          </div>
        </div>

        {/* Thông báo Alert */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
            {successMsg}
          </div>
        )}

        {/* Stats Summary Cards */}
        {summary && (
          <div className="incidents-stats-grid">
            <div className="stat-card">
              <span className="stat-card__label">Tổng số sự cố</span>
              <span className="stat-card__value">{summary.totalIncidents}</span>
            </div>
            <div className="stat-card stat-card--warning">
              <span className="stat-card__label">Chờ xử lý</span>
              <span className="stat-card__value">{summary.reportedCount}</span>
            </div>
            <div className="stat-card stat-card--info">
              <span className="stat-card__label">Đang khắc phục</span>
              <span className="stat-card__value">{summary.inProgressCount}</span>
            </div>
            <div className="stat-card stat-card--success">
              <span className="stat-card__label">Đã giải quyết</span>
              <span className="stat-card__value">{summary.resolvedCount}</span>
            </div>
            <div className="stat-card stat-card--danger">
              <span className="stat-card__label">Đồ bị hỏng hóc</span>
              <span className="stat-card__value">{summary.damagedCount}</span>
            </div>
            <div className="stat-card stat-card--purple">
              <span className="stat-card__label">Đồ thất lạc / mất</span>
              <span className="stat-card__value">{summary.lostCount}</span>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <span className="stat-card__label">Cần bảo trì</span>
              <span className="stat-card__value" style={{ color: '#0284c7' }}>{summary.maintenanceCount || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Tổng tiền bồi thường</span>
              <span className="stat-card__value" style={{ color: '#059669', fontSize: 20 }}>
                {formatMoney(summary.totalCompensationAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Toolbar & Filter */}
        <div className="incidents-toolbar">
          <div className="filter-group">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="REPORTED">Chờ xử lý (Mới báo)</option>
              <option value="IN_PROGRESS">Đang xử lý / Sửa chữa</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="DISMISSED">Đã bỏ qua / Hủy</option>
            </select>

            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="DAMAGED">💥 Đồ hỏng hóc (Damaged)</option>
              <option value="LOST">🔍 Đồ bị mất (Lost)</option>
              <option value="MAINTENANCE">🛠️ Phòng cần bảo trì (Maintenance)</option>
            </select>
          </div>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm đồ vật, số phòng, nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table of Incidents */}
        <div className="incidents-table-container">
          {loading ? (
            <div className="empty-state">Đang tải danh sách sự cố đồ hỏng/mất...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <p>Chưa có báo cáo đồ hỏng hóc hoặc bị mất nào trong bộ lọc này.</p>
            </div>
          ) : (
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Phòng</th>
                  <th>Đồ vật / Tài sản</th>
                  <th>Phân loại</th>
                  <th>Mức độ</th>
                  <th>Người báo cáo</th>
                  <th>Booking liên quan</th>
                  <th>Trách nhiệm & Bồi thường</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>#{item.id}</strong>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{formatDateTime(item.reportedAt)}</div>
                    </td>
                    <td>
                      <span className="room-badge">Phòng {item.roomNumber}</span>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{item.roomTypeName}</div>
                    </td>
                    <td>
                      <strong>{item.itemName}</strong>
                      <span style={{ marginLeft: 4, color: '#64748b' }}>× {item.quantity}</span>
                      {item.description && (
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`type-pill ${item.incidentType === 'LOST' ? 'type-pill--lost' : item.incidentType === 'MAINTENANCE' ? 'type-pill--maintenance' : 'type-pill--damaged'}`}>
                        {item.incidentType === 'LOST' ? '🔍 Bị mất' : item.incidentType === 'MAINTENANCE' ? '🛠️ Cần bảo trì' : '💥 Hỏng hóc'}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-tag severity--${item.severity ? item.severity.toLowerCase() : 'medium'}`}>
                        {item.severity === 'CRITICAL' ? 'Khẩn cấp' : item.severity === 'HIGH' ? 'Cao' : item.severity === 'LOW' ? 'Thấp' : 'Trung bình'}
                      </span>
                    </td>
                    <td>
                      <div>{item.reportedByName}</div>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>Housekeeping</div>
                    </td>
                    <td>
                      {item.bookingCode ? (
                        <div>
                          <strong>{item.bookingCode}</strong>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{item.customerName || 'Khách lưu trú'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {item.liability === 'CUSTOMER' ? (
                        <div>
                          <span className="liability-text liability-customer">Khách đền:</span>
                          <strong style={{ marginLeft: 4, color: '#dc2626' }}>{formatMoney(item.compensationAmount)}</strong>
                        </div>
                      ) : item.liability === 'HOMESTAY' ? (
                        <span className="liability-text liability-homestay">Homestay bảo trì</span>
                      ) : item.liability === 'NONE' ? (
                        <span className="liability-text liability-none">Miễn bồi thường</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>Chưa xác định</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status--${item.status ? item.status.toLowerCase() : 'reported'}`}>
                        {item.status === 'RESOLVED'
                          ? 'Đã giải quyết'
                          : item.status === 'IN_PROGRESS'
                          ? 'Đang xử lý'
                          : item.status === 'DISMISSED'
                          ? 'Đã bỏ qua'
                          : 'Chờ xử lý'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {isAdmin && item.status !== 'RESOLVED' && item.status !== 'DISMISSED' && (
                          <button
                            type="button"
                            className="btn-action-resolve"
                            onClick={() => handleQuickResolve(item)}
                            title="Hoàn tất xử lý sự cố và mở lại phòng đón khách"
                          >
                            ✓ Xử lý xong
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-action-view"
                          onClick={() => handleOpenActionModal(item)}
                        >
                          {isAdmin ? (item.status === 'RESOLVED' ? 'Chi tiết' : 'Xử lý') : 'Chi tiết'}
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => handleDelete(item.id)}
                            title="Xóa bản ghi"
                          >
                            🗑️
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

        {/* Mobile Card List (< 768px) */}
        {!loading && filteredIncidents.length > 0 && (
          <div className="incidents-cards-mobile">
            {filteredIncidents.map((item) => (
              <div className="incident-card-item" key={item.id}>
                <div className="incident-card-top">
                  <div>
                    <span className="incident-card-id">#{item.id}</span>
                    <span className="room-badge" style={{ marginLeft: 6 }}>Phòng {item.roomNumber}</span>
                    <span style={{ marginLeft: 6, fontSize: 12, color: '#64748b' }}>{item.roomTypeName}</span>
                  </div>
                  <span className={`status-pill status--${item.status ? item.status.toLowerCase() : 'reported'}`}>
                    {item.status === 'RESOLVED'
                      ? 'Đã giải quyết'
                      : item.status === 'IN_PROGRESS'
                      ? 'Đang xử lý'
                      : item.status === 'DISMISSED'
                      ? 'Đã bỏ qua'
                      : 'Chờ xử lý'}
                  </span>
                </div>
                <div className="incident-card-body">
                  <div className="incident-card-item-title">
                    <strong>{item.itemName}</strong>
                    <span style={{ color: '#64748b', marginLeft: 4 }}>× {item.quantity}</span>
                    <span className={`type-pill ${item.incidentType === 'LOST' ? 'type-pill--lost' : item.incidentType === 'MAINTENANCE' ? 'type-pill--maintenance' : 'type-pill--damaged'}`} style={{ marginLeft: 8 }}>
                      {item.incidentType === 'LOST' ? '🔍 Bị mất' : item.incidentType === 'MAINTENANCE' ? '🛠️ Cần bảo trì' : '💥 Hỏng hóc'}
                    </span>
                  </div>
                  {item.description && (
                    <div className="incident-card-desc">{item.description}</div>
                  )}
                  <div className="incident-card-meta">
                    <div><span>Thời gian:</span> {formatDateTime(item.reportedAt)}</div>
                    <div><span>Người báo cáo:</span> {item.reportedByName} (Housekeeping)</div>
                    {item.bookingCode && (
                      <div><span>Booking:</span> {item.bookingCode} ({item.customerName || 'Khách lưu trú'})</div>
                    )}
                    <div>
                      <span>Trách nhiệm:</span>{' '}
                      {item.liability === 'CUSTOMER' ? (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>Khách đền: {formatMoney(item.compensationAmount)}</span>
                      ) : item.liability === 'HOMESTAY' ? (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>Homestay bảo trì</span>
                      ) : item.liability === 'NONE' ? (
                        <span style={{ color: '#16a34a' }}>Miễn bồi thường</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Chưa xác định</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="incident-card-actions">
                  <button
                    type="button"
                    className="btn-action-view incident-card-btn-view"
                    onClick={() => handleOpenActionModal(item)}
                  >
                    {isAdmin ? (item.status === 'RESOLVED' ? '👁️ Xem chi tiết' : '⚡ Xử lý / Chi tiết') : '👁️ Xem chi tiết'}
                  </button>
                  {isAdmin && item.status !== 'RESOLVED' && item.status !== 'DISMISSED' && (
                    <button
                      type="button"
                      className="btn-action-resolve incident-card-btn-resolve"
                      onClick={() => handleQuickResolve(item)}
                      title="Hoàn tất xử lý sự cố"
                    >
                      ✓ Xử lý xong
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-action-delete incident-card-btn-delete"
                      onClick={() => handleDelete(item.id)}
                      title="Xóa bản ghi"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Báo Cáo Đồ Hỏng / Mất Mới */}
        {showReportModal && (
          <div className="incident-modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="incident-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ Báo Cáo Đồ Bị Hỏng Hóc / Mất</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowReportModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateReport}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Phòng xảy ra sự cố *</label>
                      <select
                        className="form-select"
                        value={reportForm.roomId}
                        onChange={(e) => setReportForm({ ...reportForm, roomId: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn phòng --</option>
                        {rooms.map((r) => (
                          <option key={r.id || r.roomId} value={r.id || r.roomId}>
                            Phòng {r.roomNumber} ({r.roomTypeName || r.name || 'Phòng'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Phân loại sự cố *</label>
                      <select
                        className="form-select"
                        value={reportForm.incidentType}
                        onChange={(e) => setReportForm({ ...reportForm, incidentType: e.target.value })}
                        required
                      >
                        <option value="DAMAGED">💥 Hỏng hóc (Vỡ, rách, hỏng điện...)</option>
                        <option value="LOST">🔍 Bị mất (Thất lạc, thiếu đồ...)</option>
                        <option value="MAINTENANCE">🛠️ Phòng cần bảo trì (Sửa chữa, bảo dưỡng...)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tên đồ vật / tài sản *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Điều khiển tivi, Khăn tắm, Ly thủy tinh, Đường ống nước..."
                        value={reportForm.itemName}
                        onChange={(e) => setReportForm({ ...reportForm, itemName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={reportForm.quantity}
                        onChange={(e) => setReportForm({ ...reportForm, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mức độ nghiêm trọng</label>
                      <select
                        className="form-select"
                        value={reportForm.severity}
                        onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                      >
                        <option value="LOW">Thấp (Trầy xước nhỏ, đồ phụ)</option>
                        <option value="MEDIUM">Trung bình (Đồ dùng thường ngày)</option>
                        <option value="HIGH">Cao (Đồ có giá trị hoặc cản trở phòng)</option>
                        <option value="CRITICAL">Khẩn cấp (Ảnh hưởng an toàn, không thể đón khách)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Chi phí ước tính (VND)</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        className="form-input"
                        placeholder="VD: 150000"
                        value={reportForm.estimatedCost}
                        onChange={(e) => setReportForm({ ...reportForm, estimatedCost: e.target.value })}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Hình ảnh bằng chứng hiện trường</label>
                      <div className="image-upload-wrapper">
                        <div className="image-upload-actions">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            style={{ display: 'none' }}
                            onChange={handleImageFileSelect}
                          />
                          <button
                            type="button"
                            className="btn-upload-file"
                            disabled={uploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploadingImage ? (
                              <>
                                <span className="upload-spinner" />
                                Đang tải ảnh lên...
                              </>
                            ) : (
                              <>📁 Chọn ảnh từ máy tính (PC)</>
                            )}
                          </button>
                          <span className="upload-tip">hoặc nhập link URL ảnh bên dưới</span>
                        </div>

                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://... hoặc link ảnh chụp hiện trường"
                          value={reportForm.evidenceImageUrl}
                          onChange={(e) => setReportForm({ ...reportForm, evidenceImageUrl: e.target.value })}
                        />

                        {reportForm.evidenceImageUrl && (
                          <div className="image-preview-card">
                            <img src={resolveImage(reportForm.evidenceImageUrl)} alt="Xem trước ảnh sự cố" />
                            <button
                              type="button"
                              className="btn-remove-preview"
                              title="Xóa ảnh"
                              onClick={() => setReportForm({ ...reportForm, evidenceImageUrl: '' })}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Mô tả hiện trạng chi tiết</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Mô tả vị trí, nguyên nhân hoặc hiện trạng đồ vật khi phát hiện..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-refresh"
                    onClick={() => setShowReportModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-incident-report"
                    disabled={submitting || uploadingImage}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Admin Xử Lý Sự Cố & Quyết Định Bồi Thường / Nhân viên xem chi tiết */}
        {showActionModal && selectedIncident && (
          <div className="incident-modal-overlay" onClick={() => setShowActionModal(false)}>
            <div className="incident-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isAdmin ? `🛠️ Xử Lý Sự Cố: ${selectedIncident.itemName}` : `🔍 Chi Tiết Sự Cố: ${selectedIncident.itemName}`}</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowActionModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSaveAction}>
                <div className="modal-body">
                  {/* Thông tin sự cố */}
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>
                        Phòng: <strong>{selectedIncident.roomNumber}</strong> ({selectedIncident.roomTypeName})
                      </span>
                      <span>
                        Loại: <strong>{selectedIncident.incidentType === 'LOST' ? 'Bị mất' : (selectedIncident.incidentType === 'MAINTENANCE' ? 'Cần bảo trì' : 'Hỏng hóc')}</strong> (SL: {selectedIncident.quantity})
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>
                      Báo cáo bởi: <strong>{selectedIncident.reportedByName}</strong> · {formatDateTime(selectedIncident.reportedAt)}
                    </div>
                    {selectedIncident.bookingCode && (
                      <div style={{ color: '#2563eb', fontSize: 13, marginTop: 4 }}>
                        Khách: <strong>{selectedIncident.customerName}</strong> ({selectedIncident.customerPhone}) · Mã đơn: <strong>{selectedIncident.bookingCode}</strong>
                      </div>
                    )}
                    {selectedIncident.description && (
                      <div style={{ marginTop: 8, fontStyle: 'italic', color: '#475569', fontSize: 13 }}>
                        "{selectedIncident.description}"
                      </div>
                    )}
                    {selectedIncident.evidenceImageUrl && (
                      <div className="evidence-preview-box">
                        <img src={resolveImage(selectedIncident.evidenceImageUrl)} alt="Bằng chứng hiện trường" />
                      </div>
                    )}
                  </div>

                  {/* Quyết định nghiệp vụ của Admin */}
                  {isAdmin ? (
                    <div className="decision-card">
                      <h3>⚖️ Quyết định xử lý & Trách nhiệm (Dành cho Quản trị viên)</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Trạng thái tiến độ</label>
                          <select
                            className="form-select"
                            value={actionForm.status}
                            onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                          >
                            <option value="REPORTED">Chờ xử lý (Chưa can thiệp)</option>
                            <option value="IN_PROGRESS">Đang xử lý (Khóa phòng bảo trì - Chặn khách đặt)</option>
                            <option value="RESOLVED">Đã giải quyết (Hoàn tất - Mở lại phòng đón khách)</option>
                            <option value="DISMISSED">Bỏ qua / Hủy sự cố (Mở lại phòng)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Bên chịu trách nhiệm</label>
                          <select
                            className="form-select"
                            value={actionForm.liability}
                            onChange={(e) => setActionForm({ ...actionForm, liability: e.target.value })}
                          >
                            <option value="CUSTOMER">Khách bồi thường (Tính phí khách)</option>
                            <option value="HOMESTAY">Homestay tự chịu (Bảo trì nội bộ)</option>
                            <option value="NONE">Miễn trừ / Không bồi thường</option>
                          </select>
                        </div>

                        {actionForm.liability === 'CUSTOMER' && (
                          <>
                            <div className="form-group">
                              <label>Số tiền bồi thường (VND)</label>
                              <input
                                type="number"
                                min="0"
                                step="10000"
                                className="form-input"
                                placeholder="Nhập số tiền đền bù..."
                                value={actionForm.compensationAmount}
                                onChange={(e) => setActionForm({ ...actionForm, compensationAmount: e.target.value })}
                              />
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={actionForm.chargeToInvoice}
                                  onChange={(e) => setActionForm({ ...actionForm, chargeToInvoice: e.target.checked })}
                                />
                                <span>Cộng vào hóa đơn booking của khách</span>
                              </label>
                            </div>
                          </>
                        )}

                        <div className="form-group full-width">
                          <label>Ghi chú chỉ đạo / Quá trình xử lý của Quản trị viên</label>
                          <textarea
                            className="form-textarea"
                            placeholder="VD: Khách đã xác nhận làm vỡ cốc, đã thu phụ phí 100.000đ khi checkout..."
                            value={actionForm.adminNotes}
                            onChange={(e) => setActionForm({ ...actionForm, adminNotes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="decision-card">
                      <h3>⚖️ Thông Tin Xử Lý Từ Quản Trị Viên</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: 10 }}>
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Trạng thái xử lý:</span>
                          <strong style={{ fontSize: 14, color: selectedIncident.status === 'RESOLVED' ? '#16a34a' : '#d97706' }}>
                            {selectedIncident.status === 'RESOLVED'
                              ? '✓ Đã giải quyết'
                              : selectedIncident.status === 'IN_PROGRESS'
                              ? '⏳ Đang xử lý'
                              : selectedIncident.status === 'DISMISSED'
                              ? 'Đã bỏ qua'
                              : 'Chờ Quản trị viên xử lý'}
                          </strong>
                        </div>
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Trách nhiệm:</span>
                          <strong style={{ fontSize: 14 }}>
                            {selectedIncident.liability === 'CUSTOMER'
                              ? `Khách bồi thường: ${formatMoney(selectedIncident.compensationAmount)}`
                              : selectedIncident.liability === 'HOMESTAY'
                              ? 'Homestay tự bảo trì'
                              : selectedIncident.liability === 'NONE'
                              ? 'Miễn bồi thường'
                              : 'Đang chờ Quản trị viên chỉ đạo'}
                          </strong>
                        </div>
                        {selectedIncident.adminNotes && (
                          <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Ghi chú của Quản trị viên:</span>
                            <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                              {selectedIncident.adminNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-refresh"
                    onClick={() => setShowActionModal(false)}
                  >
                    Đóng
                  </button>
                  {isAdmin && selectedIncident.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      className="btn-action-resolve"
                      style={{ padding: '10px 18px', fontSize: 14 }}
                      onClick={async () => {
                        try {
                          setSubmitting(true)
                          // 1. Save compensation decision
                          if (actionForm.liability) {
                            await fetch(`${API_BASE}/${selectedIncident.id}/compensation`, {
                              method: 'PUT',
                              headers: authHeaders(),
                              body: JSON.stringify({
                                liability: actionForm.liability,
                                compensationAmount: actionForm.compensationAmount ? Number(actionForm.compensationAmount) : 0,
                                chargeToInvoice: actionForm.chargeToInvoice,
                                adminNotes: actionForm.adminNotes,
                              }),
                            })
                          }

                          // 2. Set status RESOLVED
                          const res = await fetch(`${API_BASE}/${selectedIncident.id}/status`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify({
                              status: 'RESOLVED',
                              adminNotes: actionForm.adminNotes ? `${actionForm.adminNotes} · Đã xử lý xong` : 'Đã xử lý xong sự cố và mở lại phòng đón khách',
                            }),
                          })
                          if (!res.ok) {
                            const errData = await res.json().catch(() => ({}))
                            throw new Error(errData.message || 'Lỗi khi cập nhật trạng thái')
                          }
                          setSuccessMsg(`✓ Đã hoàn tất xử lý sự cố cho phòng ${selectedIncident.roomNumber}. Khoản bồi thường đã được cập nhật vào hóa đơn và phòng đã mở lại!`)
                          setShowActionModal(false)
                          setSelectedIncident(null)
                          loadData()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      disabled={submitting}
                    >
                      ✓ Xử lý xong & Mở phòng
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="submit"
                      className="btn-incident-report"
                      style={{ background: '#2563eb' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Đang lưu...' : 'Lưu quyết định xử lý'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
