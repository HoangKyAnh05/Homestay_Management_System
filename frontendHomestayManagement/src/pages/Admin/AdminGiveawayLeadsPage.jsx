import { useEffect, useState } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import { getStoredToken } from '../../services/authService'
import './AdminGiveawayLeadsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/marketing/giveaway'

function authHeader() {
  const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function AdminGiveawayLeadsPage() {
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [totalLeads, setTotalLeads] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedLead, setSelectedLead] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: 'NEW', staffNote: '' })

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // Ignored
    }
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: '15',
      })
      if (search.trim()) params.append('search', search.trim())
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)

      const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setLeads(data.content || [])
        setTotalLeads(data.totalElements || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchLeads()
  }

  const handleExportExcel = async () => {
    try {
      const res = await fetch(`${API_BASE}/leads/export`, { headers: authHeader() })
      if (!res.ok) throw new Error('Không thể xuất file')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `khach_hang_tiem_nang_giveaway_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Lỗi khi tải file Excel')
    }
  }

  const handleOpenStatusModal = (lead) => {
    setSelectedLead(lead)
    setStatusForm({
      status: lead.status || 'NEW',
      staffNote: lead.staffNote || '',
    })
  }

  const handleSaveStatus = async (e) => {
    e.preventDefault()
    if (!selectedLead) return
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(statusForm),
      })
      if (!res.ok) throw new Error('Cập nhật thất bại')
      setSelectedLead(null)
      fetchLeads()
      fetchStats()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="gw-badge gw-badge--new">🔴 Mới - Chưa liên hệ</span>
      case 'CONTACTED':
        return <span className="gw-badge gw-badge--contacted">🟡 Đang tư vấn</span>
      case 'BOOKED':
        return <span className="gw-badge gw-badge--booked">🟢 Đã chốt phòng</span>
      case 'CANCELLED':
        return <span className="gw-badge gw-badge--cancelled">⚪ Hủy / Không nghe</span>
      default:
        return <span className="gw-badge">{status}</span>
    }
  }

  return (
    <AdminLayout activePage="giveaway-leads">
      <div className="gw-leads-page">
        {/* Header */}
        <div className="gw-leads-header">
          <div className="gw-leads-title-wrap">
            <h1>🎁 Khách Hàng Tiềm Năng & MiniGame Giveaway</h1>
            <p>Dữ liệu cào tương tác, khách hàng tham gia Vòng quay may mắn từ Fanpage & Mạng xã hội</p>
          </div>
          <div className="gw-leads-actions">
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleExportExcel}
            >
              📥 Xuất File Excel (.xlsx)
            </button>
            <button
              type="button"
              className="mkt-btn mkt-btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/admin/marketing/ai-agent')}
            >
              🚀 Đăng Bài Giveaway Mới
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="gw-stats-grid">
          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              👥
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.totalInteractions || 0}</h3>
              <p>Tổng Khách Tương Tác</p>
            </div>
          </div>

          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              🔥
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.newLeadsCount || 0}</h3>
              <p>Leads Mới Chưa Liên Hệ</p>
            </div>
          </div>

          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#fefce8', color: '#ca8a04' }}>
              💬
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.contactedCount || 0}</h3>
              <p>Đang Tư Vấn Chăm Sóc</p>
            </div>
          </div>

          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              🎉
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.bookedCount || 0}</h3>
              <p>Đã Chốt Đặt Phòng</p>
            </div>
          </div>

          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#fdf4ff', color: '#c026d3' }}>
              👑
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.topPrizesWon || 0}</h3>
              <p>Khách Trúng Giảm 50%</p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="gw-toolbar">
          <form onSubmit={handleSearchSubmit} className="gw-search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm Họ tên, Số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="gw-filter-group">
            <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Lọc trạng thái:</label>
            <select
              className="gw-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
            >
              <option value="ALL">Tất cả ({totalLeads})</option>
              <option value="NEW">Mới - Chưa liên hệ</option>
              <option value="CONTACTED">Đang tư vấn</option>
              <option value="BOOKED">Đã chốt đặt phòng</option>
              <option value="CANCELLED">Hủy / Không nghe máy</option>
            </select>
          </div>
        </div>

        {/* Table Leads */}
        <div className="gw-table-card">
          <div className="gw-table-wrap">
            <table className="gw-table">
              <thead>
                <tr>
                  <th>Khách Hàng</th>
                  <th>Số Điện Thoại</th>
                  <th>Kế Hoạch & Nhu Cầu</th>
                  <th>Giải Thưởng Trúng</th>
                  <th>Thời Gian</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      Đang tải danh sách khách hàng tiềm năng...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Chưa có khách hàng nào tham gia minigame. Hãy chia sẻ link <strong>/giveaway</strong> lên Facebook để thu hút khách!
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{lead.fullName}</strong>
                        {lead.email && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{lead.email}</div>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{lead.phone}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                          📅 {lead.travelPlan || 'Chưa rõ'}
                        </div>
                        {lead.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', maxWidth: '240px' }}>
                            &ldquo;{lead.notes}&rdquo;
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: lead.discountPercent >= 50 ? '#dc2626' : '#2563eb' }}>
                          {lead.prizeName}
                        </div>
                        {lead.prizeCode && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>
                            {lead.prizeCode}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleString('vi-VN') : ''}
                      </td>
                      <td>{renderStatusBadge(lead.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="gw-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                          <a
                            href={`https://zalo.me/${lead.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="gw-action-btn gw-action-btn--zalo"
                            title="Nhắn tin Zalo"
                          >
                            💬 Zalo
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="gw-action-btn gw-action-btn--call"
                            title="Gọi điện"
                          >
                            📞 Gọi
                          </a>
                          <button
                            type="button"
                            className="gw-action-btn"
                            onClick={() => handleOpenStatusModal(lead)}
                            title="Cập nhật trạng thái"
                          >
                            ✏️ Cập nhật
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="gw-action-btn"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              >
                &larr; Trang trước
              </button>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="gw-action-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Trang sau &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Edit Status Modal */}
        {selectedLead && (
          <div className="gw-admin-modal-backdrop" onClick={() => setSelectedLead(null)}>
            <div className="gw-admin-modal" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                Cập Nhật Trạng Thái Khách Hàng
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
                Khách: <strong>{selectedLead.fullName}</strong> ({selectedLead.phone}) - Giải: <strong>{selectedLead.prizeName}</strong>
              </p>

              <form onSubmit={handleSaveStatus}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Trạng thái chăm sóc:
                  </label>
                  <select
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  >
                    <option value="NEW">Mới - Chưa liên hệ</option>
                    <option value="CONTACTED">Đang tư vấn / Đã liên hệ</option>
                    <option value="BOOKED">Đã chốt đặt phòng thành công</option>
                    <option value="CANCELLED">Hủy / Khách không nghe máy</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ghi chú tư vấn của nhân viên:
                  </label>
                  <textarea
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="VD: Khách muốn nhận phòng view mây ngày 15/9, đã gửi ảnh phòng qua Zalo..."
                    value={statusForm.staffNote}
                    onChange={(e) => setStatusForm({ ...statusForm, staffNote: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--secondary"
                    onClick={() => setSelectedLead(null)}
                    disabled={updating}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="mkt-btn mkt-btn--primary" disabled={updating}>
                    {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
