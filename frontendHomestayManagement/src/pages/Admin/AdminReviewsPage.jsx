import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import AdminLayout from './AdminLayout'
import './AdminReviewsPage.css'

const API_ADMIN_REVIEWS = 'http://localhost:8080/api/admin/reviews'
const PAGE_SIZE = 8

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getStoredToken()}`,
  }
}

function renderStars(count = 5) {
  const num = Math.max(1, Math.min(5, Math.round(Number(count) || 5)))
  return '★'.repeat(num) + '☆'.repeat(5 - num)
}

function ReviewDetailModal({ review, onClose, onUpdateStatus, actionLoadingId }) {
  if (!review) return null

  const isHidden = (review.status || '').toUpperCase() === 'HIDDEN'
  const isUpdating = actionLoadingId === review.reviewId

  return (
    <div className="arv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="arv-modal">
        <div className="arv-modal-head">
          <div>
            <h3>Chi tiết Đánh giá #{review.reviewId}</h3>
            <p>Đơn đặt phòng #{review.bookingId} · Khách hàng: {review.customerName}</p>
          </div>
          <button type="button" className="arv-modal-close" onClick={onClose} title="Đóng">
            ×
          </button>
        </div>

        <div className="arv-modal-body">
          <div className="arv-modal-grid">
            <div>
              <span>Khách hàng</span>
              <strong>{review.customerName || 'Khách lưu trú'}</strong>
            </div>
            <div>
              <span>Hạng phòng</span>
              <strong>{houseTypeName(review)}</strong>
            </div>
            <div>
              <span>Điểm đánh giá</span>
              <strong style={{ color: '#d97706' }}>
                {renderStars(review.ratingStars)} ({review.ratingStars}.0 / 5.0)
              </strong>
            </div>
            <div>
              <span>Ngày gửi đánh giá</span>
              <strong>{formatDateTime(review.createdAt)}</strong>
            </div>
            <div>
              <span>Trạng thái hiển thị</span>
              <div>
                <span className={`arv-badge ${isHidden ? 'arv-badge--hidden' : 'arv-badge--approved'}`}>
                  {isHidden ? 'ĐÃ ẨN' : 'ĐÃ DUYỆT (HIỂN THỊ)'}
                </span>
              </div>
            </div>
            <div>
              <span>Mã đơn Booking</span>
              <strong>#{review.bookingId}</strong>
            </div>
          </div>

          <div className="arv-modal-section">
            <h4>Nội dung nhận xét & phản hồi:</h4>
            <div className="arv-modal-comment-box">
              "{review.comment || 'Không có bình luận văn bản.'}"
            </div>
          </div>

          {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
            <div className="arv-modal-section">
              <h4>Hình ảnh thực tế đính kèm ({review.imageUrls.length}):</h4>
              <div className="arv-modal-gallery">
                {review.imageUrls.map((img, idx) => (
                  <a key={idx} href={resolveImageUrl(img)} target="_blank" rel="noreferrer" title="Click để phóng to">
                    <img src={resolveImageUrl(img)} alt={`Ảnh đánh giá ${idx + 1}`} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="arv-modal-foot">
          {isHidden ? (
            <button
              type="button"
              className="arv-btn arv-btn--approve"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(review.reviewId, 'APPROVED')}
            >
              {isUpdating ? 'Đang duyệt...' : '✅ Duyệt & Cho phép hiển thị'}
            </button>
          ) : (
            <button
              type="button"
              className="arv-btn arv-btn--hide"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(review.reviewId, 'HIDDEN')}
            >
              {isUpdating ? 'Đang ẩn...' : '👁️ Tạm ẩn bài đánh giá'}
            </button>
          )}
          <button type="button" className="arv-btn arv-btn--detail" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Filters & Search & Sorting
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [page, setPage] = useState(1)

  // Selected review for Modal view
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(API_ADMIN_REVIEWS, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Lỗi máy chủ HTTP ${res.status}`)
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Không thể kết nối API Admin Reviews:', err)
      setErrorMsg(err.message || 'Không thể tải danh sách đánh giá')
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
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Cập nhật trạng thái thất bại')
      }

      setReviews((prev) =>
        prev.map((r) => (r.reviewId === reviewId ? { ...r, status: newStatus } : r))
      )

      if (selectedReview && selectedReview.reviewId === reviewId) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Statistical calculations
  const stats = useMemo(() => {
    const total = reviews.length
    if (total === 0) {
      return { total: 0, average: 0, approved: 0, hidden: 0, fiveStars: 0 }
    }
    const approved = reviews.filter((r) => (r.status || 'APPROVED').toUpperCase() === 'APPROVED').length
    const hidden = reviews.filter((r) => (r.status || '').toUpperCase() === 'HIDDEN').length
    const fiveStars = reviews.filter((r) => Number(r.ratingStars) === 5).length
    const sumStars = reviews.reduce((sum, r) => sum + Number(r.ratingStars || 5), 0)
    const average = (sumStars / total).toFixed(1)

    return { total, average, approved, hidden, fiveStars }
  }, [reviews])

  // Filtered & Sorted list
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Search term (customer, room, comment, booking ID)
        if (search.trim()) {
          const q = search.toLowerCase()
          const name = String(r.customerName || '').toLowerCase()
          const room = String(houseTypeName(r) || '').toLowerCase()
          const comment = String(r.comment || '').toLowerCase()
          const booking = String(r.bookingId || '').toLowerCase()
          if (!name.includes(q) && !room.includes(q) && !comment.includes(q) && !booking.includes(q)) {
            return false
          }
        }

        // Rating filter
        if (ratingFilter) {
          const stars = Number(r.ratingStars || 5)
          if (ratingFilter === '5' && stars !== 5) return false
          if (ratingFilter === '4' && stars !== 4) return false
          if (ratingFilter === '3' && stars !== 3) return false
          if (ratingFilter === 'LOW' && stars > 2) return false
        }

        // Status filter
        if (statusFilter) {
          const st = (r.status || 'APPROVED').toUpperCase()
          if (statusFilter !== st) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        }
        if (sortBy === 'HIGHEST_RATING') {
          return Number(b.ratingStars || 0) - Number(a.ratingStars || 0)
        }
        if (sortBy === 'LOWEST_RATING') {
          return Number(a.ratingStars || 0) - Number(b.ratingStars || 0)
        }
        return 0
      })
  }, [reviews, search, ratingFilter, statusFilter, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE))
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredReviews.slice(start, start + PAGE_SIZE)
  }, [filteredReviews, page])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleRatingChange = (e) => {
    setRatingFilter(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPage(1)
  }

  const [syncing, setSyncing] = useState(false)

  const handleSyncGoogle = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${API_ADMIN_REVIEWS}/sync-google`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Lỗi đồng bộ HTTP ${res.status}`)
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
      alert('Đã đồng bộ thành công các đánh giá 5 sao từ Google Maps & khách lưu trú!')
    } catch (err) {
      alert(`Đồng bộ thất bại: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AdminLayout activePage="reviews">
      <div className="arv-header">
        <div>
          <h1>Quản lý Đánh giá</h1>
          <p>Theo dõi, kiểm duyệt và quản lý các phản hồi, đánh giá chất lượng trải nghiệm của khách hàng.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="arv-refresh-btn"
            style={{
              background: '#047857',
              borderColor: '#047857',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={handleSyncGoogle}
            disabled={syncing || loading}
          >
            {syncing ? 'Đang đồng bộ...' : '🌐 Đồng bộ Google Reviews'}
          </button>
          <button type="button" className="arv-refresh-btn" onClick={fetchReviews} disabled={loading}>
            {loading ? 'Đang tải...' : '↻ Làm mới'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="arv-stats">
        <div>
          <span>Tổng đánh giá</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>Điểm trung bình</span>
          <strong style={{ color: '#d97706' }}>⭐ {stats.average} / 5.0</strong>
        </div>
        <div>
          <span>Đã duyệt (Hiển thị)</span>
          <strong style={{ color: '#16a34a' }}>{stats.approved}</strong>
        </div>
        <div>
          <span>Đã ẩn (Tạm ẩn)</span>
          <strong style={{ color: '#dc2626' }}>{stats.hidden}</strong>
        </div>
        <div>
          <span>Đánh giá 5 sao</span>
          <strong style={{ color: '#2563eb' }}>{stats.fiveStars} lượt</strong>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="arv-toolbar">
        <input
          type="text"
          className="arv-search"
          placeholder="Tìm tên khách hàng, hạng phòng, nội dung, mã đơn..."
          value={search}
          onChange={handleSearchChange}
        />

        <select className="arv-select" value={ratingFilter} onChange={handleRatingChange}>
          <option value="">Tất cả số sao</option>
          <option value="5">5 sao (Tuyệt vời ⭐⭐⭐⭐⭐)</option>
          <option value="4">4 sao (Rất tốt ⭐⭐⭐⭐)</option>
          <option value="3">3 sao (Bình thường ⭐⭐⭐)</option>
          <option value="LOW">1 - 2 sao (Cần lưu ý ⭐)</option>
        </select>

        <select className="arv-select" value={statusFilter} onChange={handleStatusChange}>
          <option value="">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (Đang hiển thị)</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>

        <select className="arv-select" value={sortBy} onChange={handleSortChange}>
          <option value="NEWEST">Mới nhất trước</option>
          <option value="OLDEST">Cũ nhất trước</option>
          <option value="HIGHEST_RATING">Đánh giá cao nhất</option>
          <option value="LOWEST_RATING">Đánh giá thấp nhất</option>
        </select>
      </div>

      {errorMsg && <div className="arv-error">{errorMsg}</div>}

      {/* Reviews Table */}
      <div className="arv-table-wrap">
        {loading ? (
          <div className="arv-empty">Đang tải danh sách đánh giá...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="arv-empty">Không tìm thấy bài đánh giá nào phù hợp với bộ lọc.</div>
        ) : (
          <table className="arv-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Hạng phòng</th>
                <th>Đánh giá</th>
                <th>Nội dung nhận xét</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReviews.map((r) => {
                const isHidden = (r.status || '').toUpperCase() === 'HIDDEN'
                const isUpdating = actionLoadingId === r.reviewId
                const initial = (r.customerName || 'K').trim().charAt(0).toUpperCase()

                return (
                  <tr key={r.reviewId}>
                    <td>
                      <div className="arv-customer-cell">
                        <div className="arv-avatar">
                          {r.customerAvatar ? (
                            <img src={resolveImageUrl(r.customerAvatar)} alt={r.customerName} />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="arv-customer-info">
                          <strong>{r.customerName || 'Khách lưu trú'}</strong>
                          <span>Đơn #{r.bookingId}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="arv-room-cell">
                        <strong>{houseTypeName(r)}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="arv-rating-cell">
                        <span className="arv-stars">{renderStars(r.ratingStars)}</span>
                        <span className="arv-rating-num">{r.ratingStars}.0 / 5.0</span>
                      </div>
                    </td>

                    <td>
                      <div className="arv-comment-cell">
                        <p className="arv-comment-text" title={r.comment}>
                          "{r.comment || 'Không có bình luận văn bản.'}"
                        </p>
                        {Array.isArray(r.imageUrls) && r.imageUrls.length > 0 && (
                          <div className="arv-thumb-list">
                            {r.imageUrls.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={resolveImageUrl(img)}
                                alt="Thumb"
                                className="arv-thumb-img"
                              />
                            ))}
                            {r.imageUrls.length > 3 && (
                              <span style={{ fontSize: '11px', color: '#6b7280', alignSelf: 'center' }}>
                                +{r.imageUrls.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px', color: '#4b5563' }}>
                        {formatDateTime(r.createdAt)}
                      </span>
                    </td>

                    <td>
                      <span className={`arv-badge ${isHidden ? 'arv-badge--hidden' : 'arv-badge--approved'}`}>
                        {isHidden ? 'Đã ẩn' : 'Đã duyệt'}
                      </span>
                    </td>

                    <td>
                      <div className="arv-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="arv-btn arv-btn--detail"
                          onClick={() => setSelectedReview(r)}
                          title="Xem chi tiết đánh giá"
                        >
                          Chi tiết
                        </button>

                        {isHidden ? (
                          <button
                            type="button"
                            className="arv-btn arv-btn--approve"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(r.reviewId, 'APPROVED')}
                            title="Duyệt lại đánh giá này để hiển thị công khai"
                          >
                            {isUpdating ? '...' : 'Duyệt'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="arv-btn arv-btn--hide"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(r.reviewId, 'HIDDEN')}
                            title="Ẩn bài đánh giá này khỏi trang công khai"
                          >
                            {isUpdating ? '...' : 'Ẩn'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredReviews.length > 0 && totalPages > 1 && (
        <div className="arv-pagination">
          <span>
            Hiển thị {(page - 1) * PAGE_SIZE + 1} -{' '}
            {Math.min(page * PAGE_SIZE, filteredReviews.length)} trong tổng số {filteredReviews.length} đánh giá
          </span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={p === page ? 'is-active' : ''}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              »
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onUpdateStatus={handleUpdateStatus}
          actionLoadingId={actionLoadingId}
        />
      )}
    </AdminLayout>
  )
}
