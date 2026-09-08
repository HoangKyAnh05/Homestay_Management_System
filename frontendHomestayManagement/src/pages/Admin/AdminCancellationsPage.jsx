import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import AdminLayout from './AdminLayout'
import './AdminCancellationsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/bookings'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function AdminCancellationsPage() {
  const [cancellations, setCancellations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [confirmModalData, setConfirmModalData] = useState(null)
  const [copySuccess, setCopySuccess] = useState('')

  const fetchCancellations = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/cancellations`, { headers: authHeaders() })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách đơn hủy')
      setCancellations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCancellations()
  }, [])

  const handleCopyText = (text, label) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopySuccess(`Đã sao chép ${label}`)
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const handleConfirmRefund = async (bookingId) => {
    setActionLoadingId(bookingId)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/${bookingId}/confirm-refund`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể xác nhận hoàn tiền')
      setConfirmModalData(null)
      await fetchCancellations()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = cancellations.length
    const pending = cancellations.filter((c) => c.refundStatus === 'PENDING_REFUND')
    const completed = cancellations.filter((c) => c.refundStatus === 'REFUNDED')
    const totalPendingAmount = pending.reduce((sum, c) => sum + Number(c.refundAmount || 0), 0)
    const totalRefundedAmount = completed.reduce((sum, c) => sum + Number(c.refundAmount || 0), 0)

    return {
      total,
      pendingCount: pending.length,
      completedCount: completed.length,
      totalPendingAmount,
      totalRefundedAmount,
    }
  }, [cancellations])

  // Filtered List
  const filteredList = useMemo(() => {
    return cancellations.filter((item) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && item.refundStatus === 'PENDING_REFUND') ||
        (statusFilter === 'REFUNDED' && item.refundStatus === 'REFUNDED') ||
        (statusFilter === 'NO_REFUND' && (item.refundStatus === 'NO_REFUND' || !item.refundStatus))

      if (!matchStatus) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        item.bookingCode?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.customerPhone?.toLowerCase().includes(q) ||
        item.customerEmail?.toLowerCase().includes(q) ||
        item.cancellationReason?.toLowerCase().includes(q) ||
        item.refundInfo?.toLowerCase().includes(q)
      )
    })
  }, [cancellations, statusFilter, search])

  return (
    <AdminLayout activePage="cancellations" title="Quản lý Hủy phòng & Hoàn tiền">
      <div className="ac-page">
        {/* Metric Cards */}
        <div className="ac-metrics-grid">
          <div className="ac-metric-card">
            <span className="ac-metric-label">Tổng số đơn hủy</span>
            <strong className="ac-metric-value">{metrics.total}</strong>
            <span className="ac-metric-sub">Đã hủy trên toàn hệ thống</span>
          </div>

          <div className="ac-metric-card ac-metric-card--pending">
            <span className="ac-metric-label">Chờ hoàn tiền</span>
            <strong className="ac-metric-value ac-text-pending">{metrics.pendingCount}</strong>
            <span className="ac-metric-sub">
              Cần chuyển: <strong>{formatMoney(metrics.totalPendingAmount)}</strong>
            </span>
          </div>

          <div className="ac-metric-card ac-metric-card--completed">
            <span className="ac-metric-label">Đã hoàn tiền xong</span>
            <strong className="ac-metric-value ac-text-completed">{metrics.completedCount}</strong>
            <span className="ac-metric-sub">
              Đã chuyển: <strong>{formatMoney(metrics.totalRefundedAmount)}</strong>
            </span>
          </div>
        </div>

        {copySuccess && <div className="ac-toast-banner">✓ {copySuccess}</div>}
        {error && <div className="ac-error-banner">{error}</div>}

        {/* Filter Toolbar */}
        <div className="ac-toolbar">
          <div className="ac-search-box">
            <svg className="ac-search-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm mã booking, tên khách, SĐT, STK, lý do..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="ac-clear-btn" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </div>

          <div className="ac-filter-tabs">
            <button
              type="button"
              className={`ac-tab-btn ${statusFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả ({metrics.total})
            </button>
            <button
              type="button"
              className={`ac-tab-btn ac-tab-btn--pending ${statusFilter === 'PENDING' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Chờ hoàn tiền ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`ac-tab-btn ac-tab-btn--completed ${statusFilter === 'REFUNDED' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('REFUNDED')}
            >
              Đã hoàn tiền ({metrics.completedCount})
            </button>
            <button
              type="button"
              className={`ac-tab-btn ${statusFilter === 'NO_REFUND' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('NO_REFUND')}
            >
              Không hoàn tiền
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="ac-loading-state">
            <span className="ac-spinner" /> Đang tải danh sách đơn hủy & hoàn tiền...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="ac-empty-state">
            <div className="ac-empty-icon">📁</div>
            <h3>Không tìm thấy đơn hủy nào</h3>
            <p>Không có dữ liệu phù hợp với bộ lọc tìm kiếm hiện tại.</p>
          </div>
        ) : (
          <div className="ac-table-container">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Mã Booking</th>
                  <th>Khách hàng</th>
                  <th>Lịch trình & Thời gian hủy</th>
                  <th>Lý do hủy</th>
                  <th>Đã thanh toán</th>
                  <th>Tỷ lệ & Hoàn tiền</th>
                  <th>Thông tin nhận hoàn</th>
                  <th>Trạng thái xử lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const isPending = item.refundStatus === 'PENDING_REFUND'
                  const isRefunded = item.refundStatus === 'REFUNDED'
                  return (
                    <tr key={item.bookingId} className={isPending ? 'ac-row--pending' : ''}>
                      <td>
                        <div className="ac-booking-code-box">
                          <strong>{item.bookingCode}</strong>
                          <button
                            type="button"
                            className="ac-mini-copy-btn"
                            title="Sao chép mã đơn"
                            onClick={() => handleCopyText(item.bookingCode, 'Mã booking')}
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="ac-customer-cell">
                          <strong className="ac-customer-name">{item.customerName || 'Khách vãng lai'}</strong>
                          <div className="ac-customer-sub">
                            {item.customerPhone && (
                              <span
                                className="ac-clickable-copy"
                                title="Click để sao chép SĐT"
                                onClick={() => handleCopyText(item.customerPhone, 'SĐT khách')}
                              >
                                📞 {item.customerPhone}
                              </span>
                            )}
                            {item.customerEmail && <span className="ac-email-text">✉ {item.customerEmail}</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ac-time-cell">
                          <div className="ac-time-row">
                            <span className="ac-time-label">Check-in:</span>
                            <span>{formatAppDateTime(item.checkInTarget, { weekday: 'short' })}</span>
                          </div>
                          <div className="ac-time-row">
                            <span className="ac-time-label">Hủy lúc:</span>
                            <span className="ac-cancelled-time">{formatAppDateTime(item.cancelledAt, { weekday: 'short' })}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ac-reason-cell" title={item.cancellationReason}>
                          {item.cancellationReason || 'Không cung cấp lý do'}
                        </div>
                      </td>

                      <td>
                        <strong className="ac-paid-amount">{formatMoney(item.paidAmount)}</strong>
                      </td>

                      <td>
                        <div className="ac-refund-cell">
                          <span className={`ac-rate-badge ac-rate-badge--${item.refundRate === 100 ? 'green' : item.refundRate === 50 ? 'yellow' : 'gray'}`}>
                            {item.refundRate !== null && item.refundRate !== undefined ? `${item.refundRate}%` : '0%'}
                          </span>
                          <strong className="ac-refund-amount">{formatMoney(item.refundAmount)}</strong>
                        </div>
                      </td>

                      <td>
                        <div className="ac-refund-info-cell">
                          {item.refundInfo ? (
                            <div className="ac-refund-info-content">
                              <span>{item.refundInfo}</span>
                              <button
                                type="button"
                                className="ac-mini-copy-btn"
                                title="Sao chép toàn bộ thông tin nhận tiền"
                                onClick={() => handleCopyText(item.refundInfo, 'Thông tin nhận hoàn tiền')}
                              >
                                📋
                              </button>
                            </div>
                          ) : (
                            <span className="ac-text-muted">—</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {isRefunded ? (
                          <div className="ac-status-badge ac-status-badge--refunded">
                            ✓ Đã hoàn tiền
                            {item.refundHandledBy && (
                              <span className="ac-handler-sub">bởi {item.refundHandledBy}</span>
                            )}
                            {item.refundCompletedAt && (
                              <span className="ac-time-sub">{formatAppDateTime(item.refundCompletedAt)}</span>
                            )}
                          </div>
                        ) : isPending ? (
                          <div className="ac-status-badge ac-status-badge--pending">
                            ⏳ Chờ chuyển khoản
                          </div>
                        ) : (
                          <div className="ac-status-badge ac-status-badge--no-refund">
                            Không hoàn tiền
                          </div>
                        )}
                      </td>

                      <td>
                        {isPending ? (
                          <button
                            type="button"
                            className="ac-action-btn ac-action-btn--refund"
                            onClick={() => setConfirmModalData(item)}
                            disabled={actionLoadingId === item.bookingId}
                          >
                            {actionLoadingId === item.bookingId ? 'Đang lưu...' : 'Xác nhận hoàn tiền'}
                          </button>
                        ) : (
                          <span className="ac-text-muted">Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModalData && (
          <div className="ac-modal-overlay" onClick={() => setConfirmModalData(null)}>
            <div className="ac-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="ac-modal-header">
                <h3>Xác nhận Đã Chuyển Khoản Hoàn Tiền</h3>
                <button type="button" className="ac-modal-close" onClick={() => setConfirmModalData(null)}>
                  ×
                </button>
              </div>

              <div className="ac-modal-body">
                <div className="ac-modal-info-box">
                  <div className="ac-modal-row">
                    <span>Mã Booking:</span>
                    <strong>{confirmModalData.bookingCode}</strong>
                  </div>
                  <div className="ac-modal-row">
                    <span>Khách hàng:</span>
                    <strong>{confirmModalData.customerName} ({confirmModalData.customerPhone})</strong>
                  </div>
                  <div className="ac-modal-row">
                    <span>Số tiền hoàn trả:</span>
                    <strong className="ac-modal-refund-highlight">{formatMoney(confirmModalData.refundAmount)}</strong>
                  </div>
                  <div className="ac-modal-row">
                    <span>Tỷ lệ áp dụng:</span>
                    <span className="ac-rate-badge ac-rate-badge--green">{confirmModalData.refundRate}%</span>
                  </div>
                  <div className="ac-modal-divider" />
                  <div className="ac-modal-bank-info">
                    <span className="ac-modal-bank-label">Thông tin nhận tiền của khách:</span>
                    <div className="ac-modal-bank-text">
                      {confirmModalData.refundInfo || 'Khách chưa để lại thông tin STK'}
                    </div>
                  </div>
                </div>

                <p className="ac-modal-guide-text">
                  ⚠️ Hãy đảm bảo rằng bạn hoặc bộ phận kế toán đã thực hiện lệnh chuyển khoản <strong>{formatMoney(confirmModalData.refundAmount)}</strong> thành công tới khách hàng trước khi bấm xác nhận.
                </p>

                <div className="ac-modal-actions">
                  <button
                    type="button"
                    className="ac-btn-cancel"
                    onClick={() => setConfirmModalData(null)}
                    disabled={actionLoadingId === confirmModalData.bookingId}
                  >
                    Đóng / Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="ac-btn-confirm"
                    onClick={() => handleConfirmRefund(confirmModalData.bookingId)}
                    disabled={actionLoadingId === confirmModalData.bookingId}
                  >
                    {actionLoadingId === confirmModalData.bookingId
                      ? 'Đang lưu xác nhận...'
                      : '✓ Đã chuyển khoản xong, xác nhận'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminCancellationsPage
