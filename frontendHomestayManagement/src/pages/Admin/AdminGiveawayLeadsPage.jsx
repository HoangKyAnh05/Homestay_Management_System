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
  const [detailCustomer, setDetailCustomer] = useState(null)
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
        size: '50',
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

  // Nhóm các lượt quay theo khách hàng (1 khách hàng hiển thị 1 dòng trên CRM)
  const groupedCustomers = (leads || []).reduce((acc, lead) => {
    const key = (lead.phone || lead.email || lead.fullName || String(lead.id)).trim().toLowerCase()
    let found = acc.find(c => c.key === key)
    if (!found) {
      found = {
        key,
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        travelPlan: lead.travelPlan,
        notes: lead.notes,
        status: lead.status,
        staffNote: lead.staffNote,
        createdAt: lead.createdAt,
        allPrizes: [],
        rawLeads: [],
      }
      acc.push(found)
    }
    found.rawLeads.push(lead)
    if (lead.prizeName || lead.prizeCode) {
      found.allPrizes.push({
        id: lead.id,
        prizeName: lead.prizeName,
        prizeCode: lead.prizeCode,
        discountPercent: lead.discountPercent,
        createdAt: lead.createdAt,
        status: lead.status,
      })
    }
    if (lead.status === 'BOOKED' || (lead.status === 'CONTACTED' && found.status === 'NEW')) {
      found.status = lead.status
    }
    if (lead.notes && !found.notes) found.notes = lead.notes
    if (lead.travelPlan && (!found.travelPlan || found.travelPlan === 'Chưa rõ')) found.travelPlan = lead.travelPlan
    return acc
  }, [])

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

  const handleOpenStatusModal = (cust) => {
    setSelectedLead(cust)
    setStatusForm({
      status: cust.status || 'NEW',
      staffNote: cust.staffNote || '',
    })
  }

  const handleSaveStatus = async (e) => {
    e.preventDefault()
    if (!selectedLead) return
    setUpdating(true)
    try {
      const targetId = selectedLead.id
      const res = await fetch(`${API_BASE}/leads/${targetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(statusForm),
      })
      if (!res.ok) throw new Error('Cập nhật thất bại')
      setSelectedLead(null)
      if (detailCustomer && detailCustomer.key === selectedLead.key) {
        setDetailCustomer(prev => prev ? { ...prev, status: statusForm.status, staffNote: statusForm.staffNote } : null)
      }
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
                  <th>Ưu Đãi / Voucher</th>
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
                ) : groupedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Chưa có khách hàng nào tham gia minigame. Hãy chia sẻ link <strong>/giveaway</strong> lên Facebook để thu hút khách!
                    </td>
                  </tr>
                ) : (
                  groupedCustomers.map((cust) => {
                    const topPrize = cust.allPrizes.reduce((max, p) => (p.discountPercent > (max?.discountPercent || 0) ? p : max), cust.allPrizes[0])
                    return (
                      <tr key={cust.key}>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{cust.fullName}</strong>
                          {cust.email && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cust.email}</div>}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{cust.phone}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                            📅 {cust.travelPlan || 'Chưa rõ'}
                          </div>
                          {cust.notes && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', maxWidth: '240px' }}>
                              &ldquo;{cust.notes}&rdquo;
                            </div>
                          )}
                        </td>
                        <td>
                          {cust.allPrizes.length > 1 ? (
                            <span
                              onClick={() => setDetailCustomer(cust)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                background: '#fdf4ff',
                                color: '#9333ea',
                                border: '1px solid #e9d5ff',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                              title="Bấm để xem danh sách tất cả voucher"
                            >
                              🎁 {cust.allPrizes.length} giải thưởng trúng
                            </span>
                          ) : topPrize ? (
                            <div>
                              <div style={{ fontWeight: 700, color: topPrize.discountPercent >= 50 ? '#dc2626' : '#2563eb', fontSize: '0.88rem' }}>
                                {topPrize.prizeName}
                              </div>
                              {topPrize.prizeCode && (
                                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>
                                  {topPrize.prizeCode}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Không có</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {cust.createdAt ? new Date(cust.createdAt).toLocaleString('vi-VN') : ''}
                        </td>
                        <td>{renderStatusBadge(cust.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="gw-action-btn-group" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="gw-action-btn"
                              style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1', fontWeight: 600 }}
                              onClick={() => setDetailCustomer(cust)}
                              title="Xem chi tiết khách hàng và lịch sử giải thưởng"
                            >
                              🔍 Chi tiết
                            </button>
                            <a
                              href={`https://zalo.me/${cust.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="gw-action-btn gw-action-btn--zalo"
                              title="Nhắn tin Zalo"
                            >
                              💬 Zalo
                            </a>
                            <a
                              href={`tel:${cust.phone}`}
                              className="gw-action-btn gw-action-btn--call"
                              title="Gọi điện"
                            >
                              📞 Gọi
                            </a>
                            <button
                              type="button"
                              className="gw-action-btn"
                              onClick={() => handleOpenStatusModal(cust)}
                              title="Cập nhật trạng thái"
                            >
                              ✏️ Cập nhật
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
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

        {/* Modal Chi tiết khách hàng tiềm năng */}
        {detailCustomer && (
          <div className="gw-admin-modal-backdrop" onClick={() => setDetailCustomer(null)}>
            <div className="gw-admin-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Hồ Sơ Khách Hàng Tiềm Năng
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#0f172a' }}>
                    {detailCustomer.fullName}
                  </h3>
                </div>
                <button
                  type="button"
                  style={{ border: 'none', background: '#f1f5f9', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#64748b' }}
                  onClick={() => setDetailCustomer(null)}
                >
                  ✕
                </button>
              </div>

              {/* Thông tin liên hệ & Kế hoạch */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Số điện thoại</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{detailCustomer.phone}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Email</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{detailCustomer.email || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Kế hoạch lưu trú</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginTop: 2 }}>📅 {detailCustomer.travelPlan || 'Chưa rõ'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Trạng thái chăm sóc</span>
                  <div style={{ marginTop: 2 }}>{renderStatusBadge(detailCustomer.status)}</div>
                </div>
                {detailCustomer.notes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Nhu cầu / Ghi chú của khách</span>
                    <div style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', marginTop: 2 }}>
                      &ldquo;{detailCustomer.notes}&rdquo;
                    </div>
                  </div>
                )}
                {detailCustomer.staffNote && (
                  <div style={{ gridColumn: 'span 2', background: '#fefce8', padding: '8px 10px', borderRadius: 6, border: '1px solid #fef08a' }}>
                    <span style={{ fontSize: 11, color: '#854d0e', textTransform: 'uppercase', fontWeight: 700 }}>Ghi chú nhân viên tư vấn:</span>
                    <div style={{ fontSize: 13, color: '#713f12', marginTop: 2 }}>
                      {detailCustomer.staffNote}
                    </div>
                  </div>
                )}
              </div>

              {/* Danh sách các giải thưởng/voucher đã quay trúng */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>
                    🎁 Danh Sách Giải Thưởng & Voucher Đã Trúng ({detailCustomer.allPrizes.length})
                  </h4>
                </div>
                {detailCustomer.allPrizes.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                    Chưa có giải thưởng
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '8px 12px' }}>Giải thưởng</th>
                          <th style={{ padding: '8px 12px' }}>Mã Voucher</th>
                          <th style={{ padding: '8px 12px' }}>Ưu đãi</th>
                          <th style={{ padding: '8px 12px' }}>Thời gian trúng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailCustomer.allPrizes.map((p, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                              {p.prizeName}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {p.prizeCode ? (
                                <span
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.prizeCode)
                                    alert(`Đã sao chép mã voucher: ${p.prizeCode}`)
                                  }}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    background: '#f1f5f9',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    color: '#0f172a',
                                  }}
                                  title="Bấm để sao chép mã"
                                >
                                  {p.prizeCode} 📋
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: p.discountPercent >= 50 ? '#dc2626' : '#166534' }}>
                              Giảm {p.discountPercent}%
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={`https://zalo.me/${detailCustomer.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mkt-btn"
                    style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    💬 Chat Zalo
                  </a>
                  <a
                    href={`tel:${detailCustomer.phone}`}
                    className="mkt-btn"
                    style={{ background: '#166534', color: '#fff', padding: '8px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    📞 Gọi Ngay
                  </a>
                </div>
                <button
                  type="button"
                  className="mkt-btn mkt-btn--primary"
                  onClick={() => {
                    handleOpenStatusModal(detailCustomer)
                  }}
                >
                  ✏️ Cập Nhật Trạng Thái
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Status Modal */}
        {selectedLead && (
          <div className="gw-admin-modal-backdrop" onClick={() => setSelectedLead(null)}>
            <div className="gw-admin-modal" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                Cập Nhật Trạng Thái Khách Hàng
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
                Khách: <strong>{selectedLead.fullName}</strong> ({selectedLead.phone})
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
