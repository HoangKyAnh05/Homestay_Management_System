import { useEffect, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminRoomsPage.css'

const API_ADMIN_REVIEWS = 'http://localhost:8080/api/admin/reviews'

function authHeaders(isFormData = false) {
  const h = { Authorization: `Bearer ${getStoredToken()}` }
  if (!isFormData) h['Content-Type'] = 'application/json'
  return h
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(API_ADMIN_REVIEWS, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Lỗi server: HTTP ${res.status}`)
      const data = await res.json()
      setReviews(data || [])
    } catch (err) {
      console.warn('Không thể kết nối API Admin Reviews, sử dụng dữ liệu mẫu:', err)
      setErrorMsg(err.message)
      // Mock fallback data for preview
      setReviews([
        {
          reviewId: 1,
          bookingId: 101,
          roomTypeId: 1,
          roomTypeName: 'Suite VIP Căn Hộ View Hồ',
          customerName: 'Nguyễn Văn An',
          customerAvatar: null,
          ratingStars: 5,
          comment: 'Phòng sạch đẹp, góc nhìn ra hồ rất rộng và thơ mộng. Nhân viên phục vụ nhiệt tình!',
          status: 'APPROVED',
          imageUrls: [],
          createdAt: new Date().toISOString()
        },
        {
          reviewId: 2,
          bookingId: 102,
          roomTypeId: 2,
          roomTypeName: 'Standard Double Lãng Mạn',
          customerName: 'Trần Thị Bình',
          customerAvatar: null,
          ratingStars: 4,
          comment: 'Phòng yên tĩnh, giường êm. Chi tiết dịch vụ rất mượt.',
          status: 'APPROVED',
          imageUrls: [],
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (reviewId, newStatus) => {
    setActionLoadingId(reviewId)
    try {
      const res = await fetch(`${API_ADMIN_REVIEWS}/${reviewId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        throw new Error('Cập nhật thất bại')
      }

      setReviews(prev =>
        prev.map(r => (r.reviewId === reviewId ? { ...r, status: newStatus } : r))
      )
    } catch (err) {
      alert(`Lỗi: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filterStatus === 'ALL') return true
    return (r.status || 'APPROVED').toUpperCase() === filterStatus
  })

  return (
    <AdminLayout activeKey="reviews">
      <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              ⭐ Quản Lý Đánh Giá (Admin Review Moderation)
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              Kiểm duyệt bài đánh giá của khách hàng theo Sequence Diagram 3
            </p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Tải lại
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['ALL', 'APPROVED', 'HIDDEN'].map(st => {
            const labelMap = { ALL: 'Tất cả', APPROVED: 'Đã duyệt', HIDDEN: 'Đã ẩn' }
            const active = filterStatus === st
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: active ? '#1e293b' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {labelMap[st]} ({reviews.filter(r => st === 'ALL' || (r.status || 'APPROVED') === st).length})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách đánh giá...</div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', color: '#94a3b8' }}>
            Không tìm thấy bài đánh giá nào.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredReviews.map(r => (
              <div
                key={r.reviewId}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  {/* Customer info & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                      👤 {r.customerName}
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: r.status === 'HIDDEN' ? '#fee2e2' : '#dcfce7',
                        color: r.status === 'HIDDEN' ? '#ef4444' : '#16a34a'
                      }}
                    >
                      {r.status === 'HIDDEN' ? 'ĐÃ ẨN' : 'ĐÃ DUYỆT'}
                    </span>
                  </div>

                  {/* Room Type */}
                  <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: '600', marginBottom: '8px' }}>
                    🏨 {r.roomTypeName} (Đơn #{r.bookingId})
                  </div>

                  {/* Stars */}
                  <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '8px' }}>
                    {'⭐'.repeat(r.ratingStars || 5)} <strong style={{ color: '#334155' }}>{r.ratingStars}.0</strong>
                  </div>

                  {/* Comment */}
                  <p style={{ color: '#334155', fontSize: '13.5px', lineHeight: '1.5', margin: '0 0 12px' }}>
                    "{r.comment}"
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  {r.status === 'HIDDEN' ? (
                    <button
                      onClick={() => handleUpdateStatus(r.reviewId, 'APPROVED')}
                      disabled={actionLoadingId === r.reviewId}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Duyệt lại
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(r.reviewId, 'HIDDEN')}
                      disabled={actionLoadingId === r.reviewId}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      👁️ Ẩn đánh giá
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
