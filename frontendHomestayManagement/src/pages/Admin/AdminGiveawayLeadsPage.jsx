import { useEffect, useState } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import { getStoredToken } from '../../services/authService'
import './AdminGiveawayLeadsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/marketing/giveaway'
const API_MARKETING = (import.meta.env.VITE_API_URL || '') + '/api/admin/marketing'

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
  const [prizeFilter, setPrizeFilter] = useState('ALL')
  const [selectedLead, setSelectedLead] = useState(null)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: 'NEW', staffNote: '' })

  const handleQuickBooking = (cust, prize) => {
    const payload = {
      customerName: cust.fullName,
      customerPhone: cust.phone,
      customerEmail: cust.email || '',
      voucherCode: prize?.prizeCode || cust.allPrizes?.[0]?.prizeCode || '',
      notes: `Khách từ Minigame Giveaway. ${cust.travelPlan ? `Kế hoạch: ${cust.travelPlan}. ` : ''}${cust.notes ? `Ghi chú: ${cust.notes}` : ''}`,
    }
    sessionStorage.setItem('pending_booking_lead', JSON.stringify(payload))
    window.location.href = '/admin/bookings'
  }

  // Giveaway Post Creation Modal State
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const [socialAccounts, setSocialAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [postTitle, setPostTitle] = useState('🎉 MINI GAME VÒNG QUAY MAY MẮN - TRÚNG VOUCHER NGHỈ DƯỠNG ĐẾN 50% TẠI LÁ ĐỎ HOMESTAY!')
  const [postContent, setPostContent] = useState(`✨ CHÀO ĐÓN MÙA SĂN MÂY - THAM GIA VÒNG QUAY MAY MẮN NHẬN NGAY QUÀ KHỦNG! ✨

🌿 Bạn đang lên kế hoạch du lịch Sa Pa tận hưởng không khí trong lành, ngắm mây bồng bềnh và thung lũng Mường Hoa thơ mộng?
🎁 Lá Đỏ Homestay gửi tặng bạn cơ hội nhận hàng loạt voucher ưu đãi siêu hấp dẫn:
- 🏆 Giải Đặc Biệt: Voucher Giảm 50% tổng hóa đơn đặt phòng
- 🌟 Giải Nhất: Voucher Giảm 30% phòng view núi
- 🎈 Giải Nhì: Voucher Giảm 20% & Voucher Giảm 10%
- ☕ Cùng hàng trăm voucher Miễn phí Cà phê sáng & Dịch vụ BBQ sân vườn!

👇 Cách thức tham gia cực kỳ đơn giản:
1️⃣ Bấm vào đường link bên dưới để vào trang Vòng Quay May Mắn.
2️⃣ Nhập thông tin & Quay thưởng ngay - 100% trúng quà!
3️⃣ Lưu lại mã Voucher để áp dụng khi đặt phòng trực tuyến hoặc qua hotline.`)
  const [giveawayUrl, setGiveawayUrl] = useState(() => `${window.location.origin}/giveaway`)
  const [hashtags, setHashtags] = useState('#LaDoHomestay #SaPa #Giveaway #VongQuayMayMan #DuLichSaPa #HomestaySaPa #SanMaySaPa')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('')
  const [publishErrorMsg, setPublishErrorMsg] = useState('')

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_MARKETING}/social-auth/accounts`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setSocialAccounts(data || [])
        if (data && data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(String(data[0].id))
        }
      }
    } catch {
      // Ignored
    }
  }

  const handleOpenCreatePostModal = () => {
    fetchAccounts()
    setIsCreatePostModalOpen(true)
    setPublishSuccessMsg('')
    setPublishErrorMsg('')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setPublishErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token')
      const res = await fetch(`${API_MARKETING}/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error('Không thể tải ảnh lên máy chủ')
      const data = await res.json()
      if (data.url) {
        setImageUrl(data.url)
      }
    } catch (err) {
      setPublishErrorMsg(err.message || 'Lỗi khi tải ảnh')
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePublishGiveaway = async (e) => {
    e.preventDefault()
    if (!postTitle.trim() || !postContent.trim()) {
      setPublishErrorMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết!')
      return
    }
    setPublishing(true)
    setPublishSuccessMsg('')
    setPublishErrorMsg('')

    try {
      const payload = {
        socialAccountId: selectedAccountId ? Number(selectedAccountId) : null,
        title: postTitle.trim(),
        content: postContent.trim(),
        giveawayUrl: giveawayUrl.trim(),
        hashtags: hashtags ? hashtags.split(' ').map(s => s.trim()).filter(Boolean) : [],
        imageUrls: imageUrl ? [imageUrl.trim()] : []
      }

      const res = await fetch(`${API_BASE}/publish-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Đăng bài thất bại')
      }

      setPublishSuccessMsg(data.message || '🎉 Đã xuất bản bài viết Giveaway thành công lên Fanpage!')
      setTimeout(() => {
        setIsCreatePostModalOpen(false)
        setPublishSuccessMsg('')
      }, 2500)
    } catch (err) {
      setPublishErrorMsg(err.message || 'Có lỗi xảy ra khi xuất bản bài viết')
    } finally {
      setPublishing(false)
    }
  }

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

  const displayedCustomers = groupedCustomers.filter((cust) => {
    if (prizeFilter === 'ALL') return true
    if (prizeFilter === '50') return cust.allPrizes.some(p => (p.discountPercent >= 50) || p.prizeName?.includes('50%'))
    if (prizeFilter === '30') return cust.allPrizes.some(p => (p.discountPercent === 30) || p.prizeName?.includes('30%'))
    if (prizeFilter === '20') return cust.allPrizes.some(p => (p.discountPercent === 20) || p.prizeName?.includes('20%'))
    if (prizeFilter === '10') return cust.allPrizes.some(p => (p.discountPercent === 10) || p.prizeName?.includes('10%'))
    if (prizeFilter === 'OTHER') return cust.allPrizes.some(p => !p.discountPercent || p.discountPercent === 0 || p.prizeName?.includes('BBQ') || p.prizeName?.includes('Cà phê'))
    return true
  })

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
        return <span className="gw-badge gw-badge--new"> Mới - Chưa liên hệ</span>
      case 'CONTACTED':
        return <span className="gw-badge gw-badge--contacted"> Đang tư vấn</span>
      case 'BOOKED':
        return <span className="gw-badge gw-badge--booked"> Đã chốt phòng</span>
      case 'CANCELLED':
        return <span className="gw-badge gw-badge--cancelled"> Hủy / Không nghe</span>
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
            <h1> Khách Hàng Tiềm Năng & MiniGame Giveaway</h1>
            <p>Dữ liệu cào tương tác, khách hàng tham gia Vòng quay may mắn từ Fanpage & Mạng xã hội</p>
          </div>
          <div className="gw-leads-actions">
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleExportExcel}
            >
               Xuất File Excel (.xlsx)
            </button>
            <button
              type="button"
              className="mkt-btn mkt-btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleOpenCreatePostModal}
            >
               Đăng Bài Giveaway Mới
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
              🔔
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
              ✅
            </div>
            <div className="gw-stat-info">
              <h3>{stats?.bookedCount || 0}</h3>
              <p>Đã Chốt Đặt Phòng</p>
            </div>
          </div>

          <div className="gw-stat-card">
            <div className="gw-stat-icon" style={{ background: '#fdf4ff', color: '#c026d3' }}>
              🎁
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
            <span style={{ fontSize: '15px' }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm Họ tên, Số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="gw-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 700 }}>Trạng thái:</label>
              <select
                className="gw-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
              >
                <option value="ALL">Tất cả ({totalLeads})</option>
                <option value="NEW">🟢 Mới - Chưa liên hệ</option>
                <option value="CONTACTED">🟡 Đang tư vấn</option>
                <option value="BOOKED">🔵 Đã chốt đặt phòng</option>
                <option value="CANCELLED">⚪ Hủy / Không nghe máy</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 700 }}>Giải thưởng:</label>
              <select
                className="gw-filter-select"
                value={prizeFilter}
                onChange={(e) => setPrizeFilter(e.target.value)}
              >
                <option value="ALL">Tất cả giải thưởng</option>
                <option value="50">🔥 Giảm 50% tiền phòng</option>
                <option value="30">🌟 Giảm 30%</option>
                <option value="20">🎈 Giảm 20%</option>
                <option value="10">✨ Giảm 10%</option>
                <option value="OTHER">🍖 Set BBQ / Dịch vụ</option>
              </select>
            </div>
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
                ) : displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Không tìm thấy khách hàng tiềm năng phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((cust) => {
                    const topPrize = cust.allPrizes.reduce((max, p) => (p.discountPercent > (max?.discountPercent || 0) ? p : max), cust.allPrizes[0])
                    return (
                      <tr key={cust.key}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{cust.fullName}</div>
                          {cust.email && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{cust.email}</div>}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{cust.phone}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                            {cust.travelPlan || 'Chưa rõ'}
                          </div>
                          {cust.notes && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', maxWidth: '240px', marginTop: '2px' }}>
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
                                fontSize: '0.82rem',
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
                                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 3 }}>
                                  {topPrize.prizeCode}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Không có</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {cust.createdAt ? new Date(cust.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                        </td>
                        <td>{renderStatusBadge(cust.status)}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div className="gw-action-btn-group" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              className="gw-action-btn gw-action-btn--detail"
                              onClick={() => setDetailCustomer(cust)}
                              title="Xem chi tiết khách hàng và lịch sử giải thưởng"
                            >
                              Chi tiết
                            </button>
                            <a
                              href={`https://zalo.me/${cust.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="gw-action-btn gw-action-btn--zalo"
                              title="Nhắn tin Zalo với khách hàng"
                            >
                              Zalo
                            </a>
                            <a
                              href={`tel:${cust.phone}`}
                              className="gw-action-btn gw-action-btn--call"
                              title="Gọi điện thoại trực tiếp"
                            >
                              Gọi
                            </a>
                            <button
                              type="button"
                              className="gw-action-btn gw-action-btn--status"
                              onClick={() => handleOpenStatusModal(cust)}
                              title="Cập nhật trạng thái tư vấn & ghi chú"
                            >
                              Cập nhật
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
                  style={{
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setDetailCustomer(null)}
                  title="Đóng"
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginTop: 2 }}> {detailCustomer.travelPlan || 'Chưa rõ'}</div>
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
                     Danh Sách Giải Thưởng & Voucher Đã Trúng ({detailCustomer.allPrizes.length})
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
                                  {p.prizeCode} 
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
                    Chat Zalo
                  </a>
                  <a
                    href={`tel:${detailCustomer.phone}`}
                    className="mkt-btn"
                    style={{ background: '#166534', color: '#fff', padding: '8px 14px', borderRadius: 6, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Gọi ngay
                  </a>
                </div>
                <button
                  type="button"
                  className="mkt-btn mkt-btn--primary"
                  onClick={() => {
                    handleOpenStatusModal(detailCustomer)
                  }}
                >
                  Cập nhật trạng thái
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Status Modal */}
        {selectedLead && (
          <div className="gw-admin-modal-backdrop" onClick={() => setSelectedLead(null)}>
            <div className="gw-admin-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                  Cập Nhật Trạng Thái Khách Hàng
                </h3>
                <button
                  type="button"
                  style={{
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setSelectedLead(null)}
                  title="Đóng"
                >
                  ✕
                </button>
              </div>
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

        {/* Giveaway Post Creation Modal */}
        {isCreatePostModalOpen && (
          <div className="gw-admin-modal-backdrop" onClick={() => !publishing && setIsCreatePostModalOpen(false)}>
            <div className="gw-admin-modal gw-post-modal" onClick={(e) => e.stopPropagation()}>
              <div className="gw-modal-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="gw-modal-head-icon">🎁</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                      Đăng Bài Giveaway Vòng Quay May Mắn
                    </h3>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                      Tạo & xuất bản bài viết tặng voucher trực tiếp lên Fanpage & Kênh Marketing
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="gw-modal-close-btn"
                  onClick={() => setIsCreatePostModalOpen(false)}
                  disabled={publishing}
                >
                  ✕
                </button>
              </div>

              {publishSuccessMsg && (
                <div className="gw-alert-success">
                  <span>🎉</span>
                  <div>{publishSuccessMsg}</div>
                </div>
              )}

              {publishErrorMsg && (
                <div className="gw-alert-error">
                  <span>⚠️</span>
                  <div>{publishErrorMsg}</div>
                </div>
              )}

              <form onSubmit={handlePublishGiveaway} className="gw-post-form">
                {/* Channel / Fanpage Selection */}
                <div className="gw-form-group">
                  <label className="gw-form-label">
                    <span>📢 Kênh đăng bài (Facebook Fanpage):</span>
                  </label>
                  <select
                    className="gw-form-select"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    disabled={publishing}
                  >
                    {socialAccounts.length > 0 ? (
                      socialAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName || acc.pageName || 'Fanpage'} ({acc.platform || 'FACEBOOK'})
                        </option>
                      ))
                    ) : (
                      <option value="">Tự động chọn Facebook Fanpage mặc định</option>
                    )}
                  </select>
                </div>

                {/* Quick Templates */}
                <div className="gw-templates-bar">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Mẫu nhanh:</span>
                  <button
                    type="button"
                    className="gw-template-btn"
                    onClick={() => {
                      setPostTitle('🎉 MINI GAME VÒNG QUAY MAY MẮN - TRÚNG VOUCHER NGHỈ DƯỠNG ĐẾN 50% TẠI LÁ ĐỎ HOMESTAY!')
                      setPostContent(`✨ CHÀO ĐÓN MÙA SĂN MÂY - THAM GIA VÒNG QUAY MAY MẮN NHẬN NGAY QUÀ KHỦNG! ✨\n\n🌿 Bạn đang lên kế hoạch du lịch Sa Pa tận hưởng không khí trong lành, ngắm mây bồng bềnh và thung lũng Mường Hoa thơ mộng?\n🎁 Lá Đỏ Homestay gửi tặng bạn cơ hội nhận hàng loạt voucher ưu đãi siêu hấp dẫn:\n- 🏆 Giải Đặc Biệt: Voucher Giảm 50% tổng hóa đơn đặt phòng\n- 🌟 Giải Nhất: Voucher Giảm 30% phòng view núi\n- 🎈 Giải Nhì: Voucher Giảm 20% & Voucher Giảm 10%\n- ☕ Cùng hàng trăm voucher Miễn phí Cà phê sáng & Dịch vụ BBQ sân vườn!\n\n👇 Cách thức tham gia cực kỳ đơn giản:\n1️⃣ Bấm vào đường link bên dưới để vào trang Vòng Quay May Mắn.\n2️⃣ Nhập thông tin & Quay thưởng ngay - 100% trúng quà!\n3️⃣ Lưu lại mã Voucher để áp dụng khi đặt phòng trực tuyến hoặc qua hotline.`)
                    }}
                  >
                    🏔️ Mùa Săn Mây Sa Pa
                  </button>
                  <button
                    type="button"
                    className="gw-template-btn"
                    onClick={() => {
                      setPostTitle('🔥 ĐẠI TIỆC GIVEAWAY ĐẦU TUẦN - VÒNG QUAY 100% TRÚNG THƯỞNG TẠI LÁ ĐỎ!')
                      setPostContent(`🎁 VÒNG QUAY TRI ÂN KHÁCH HÀNG - RINH VOUCHER NGHỈ DƯỠNG MIỄN PHÍ! 🎁\n\nBạn muốn tìm chốn bình yên, thức giấc đón mây bay qua ô cửa kính view trọn dãy Hoàng Liên Sơn hùng vĩ?\n👉 Chỉ cần 10 giây quay thưởng để nhận ngay:\n✨ Voucher giảm trực tiếp 50% tiền phòng\n✨ Voucher giảm 30% & 20% đặt phòng trong tuần\n✨ Tặng kèm set đồ nướng BBQ chill sân vườn\n\n👇 Bấm link bên dưới để quay ngay hôm nay:`)
                    }}
                  >
                    🔥 Tri Ân Khách Hàng
                  </button>
                </div>

                {/* Post Title */}
                <div className="gw-form-group">
                  <label className="gw-form-label">
                    <span>Tiêu đề bài viết:</span>
                    <span className="gw-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="gw-form-input"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài đăng hấp dẫn..."
                    required
                    disabled={publishing}
                  />
                </div>

                {/* Post Content */}
                <div className="gw-form-group">
                  <label className="gw-form-label">
                    <span>Nội dung bài viết:</span>
                    <span className="gw-required">*</span>
                  </label>
                  <textarea
                    rows={6}
                    className="gw-form-textarea"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Nhập nội dung chi tiết bài viết giveaway..."
                    required
                    disabled={publishing}
                  />
                </div>

                {/* Giveaway Link & Hashtags Grid */}
                <div className="gw-form-row">
                  <div className="gw-form-group" style={{ flex: 1 }}>
                    <label className="gw-form-label">
                      <span>🔗 Link trang MiniGame:</span>
                    </label>
                    <input
                      type="url"
                      className="gw-form-input"
                      value={giveawayUrl}
                      onChange={(e) => setGiveawayUrl(e.target.value)}
                      placeholder="https://ladohomestay.vn/giveaway"
                      disabled={publishing}
                    />
                  </div>

                  <div className="gw-form-group" style={{ flex: 1 }}>
                    <label className="gw-form-label">
                      <span>🏷️ Hashtags:</span>
                    </label>
                    <input
                      type="text"
                      className="gw-form-input"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      placeholder="#LaDoHomestay #SaPa #Giveaway"
                      disabled={publishing}
                    />
                  </div>
                </div>

                {/* Image Upload / Attachment */}
                <div className="gw-form-group">
                  <label className="gw-form-label">
                    <span>🖼️ Hình ảnh bài viết (Banner / Poster):</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="gw-form-input"
                      style={{ flex: 1 }}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Dán đường link ảnh hoặc tải ảnh từ máy tính..."
                      disabled={publishing || uploadingImage}
                    />
                    <label className="gw-upload-btn">
                      {uploadingImage ? '⏳ Đang tải...' : '📁 Tải Ảnh Lên'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                        disabled={publishing || uploadingImage}
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="gw-image-preview">
                      <img src={imageUrl} alt="Preview bài viết" />
                      <button
                        type="button"
                        className="gw-remove-image-btn"
                        onClick={() => setImageUrl('')}
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="gw-modal-footer">
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--secondary"
                    onClick={() => setIsCreatePostModalOpen(false)}
                    disabled={publishing}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="mkt-btn mkt-btn--primary"
                    style={{ minWidth: 160 }}
                    disabled={publishing || uploadingImage}
                  >
                    {publishing ? '⏳ Đang Xuất Bản...' : '🚀 Đăng Ngay Lên Fanpage'}
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
