import React, { useState, useEffect, useCallback } from 'react'
import { getDailyPreview, submitDailyReport } from '../../services/dailyReportService'
import { getStoredUser } from '../../services/authService'
import DateDropdownPicker from '../Common/DateDropdownPicker'
import './DailyClosingModal.css'

function toDateInput(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DailyClosingModal({ isOpen, onClose, onSuccess }) {
  const user = getStoredUser()
  const [selectedDate, setSelectedDate] = useState(() => toDateInput(new Date()))
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = useCallback(async (dateStr) => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await getDailyPreview(dateStr)
      setPreviewData(res)
    } catch (err) {
      setError(err.message || 'Không thể tải số liệu tổng kết')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadData(selectedDate)
    }
  }, [isOpen, selectedDate, loadData])

  if (!isOpen) return null

  const handleDateChange = (val) => {
    if (val) setSelectedDate(val)
  }

  const handleSubmit = async () => {
    if (!previewData) return
    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    try {
      const payload = {
        reportDate: selectedDate,
        notes: notes.trim(),
        cashRevenue: previewData.cashRevenue || 0,
        transferRevenue: previewData.transferRevenue || 0,
        totalRevenue: previewData.totalRevenue || 0,
        occupiedRoomsCount: previewData.occupiedRoomsCount || 0,
        checkInTodayCount: previewData.checkInTodayCount || 0,
        checkOutTodayCount: previewData.checkOutTodayCount || 0,
        snapshotDataJson: JSON.stringify({
          occupiedRooms: previewData.occupiedRooms || [],
          invoices: previewData.invoices || [],
          generatedAt: new Date().toISOString(),
          staffName: user?.fullName || user?.email,
        }),
      }

      await submitDailyReport(payload)
      setSuccessMsg('Đã gửi báo cáo tổng kết cuối ngày cho Quản trị viên (Admin) thành công!')
      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      // Tải lại preview để cập nhật trạng thái alreadySubmitted
      await loadData(selectedDate)
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi báo cáo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dcm-overlay" onClick={onClose}>
      <div className="dcm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dcm-header">
          <div className="dcm-header-left">
            <h2> Tổng Kết Cuối Ngày & Báo Cáo Admin</h2>
            <p>Tổng hợp doanh thu, các phòng đang lưu trú và gửi báo cáo cho Quản trị viên</p>
          </div>
          <div className="dcm-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '160px' }}>
              <DateDropdownPicker
                value={selectedDate}
                onChange={handleDateChange}
                allowEmpty={false}
                placeholder="Chọn ngày..."
                className="date-dropdown-picker--compact"
              />
            </div>
            <button type="button" className="dcm-close-btn" onClick={onClose} title="Đóng">
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dcm-body">
          {error && <div className="dcm-alert-error">️ {error}</div>}
          {successMsg && <div className="dcm-alert-success"> {successMsg}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              Đang tổng hợp số liệu ngày {selectedDate}...
            </div>
          ) : previewData ? (
            <>
              {/* Thống kê nhanh */}
              <div className="dcm-stats-grid">
                <div className="dcm-stat-card dcm-stat-card--occupied">
                  <div className="dcm-stat-icon">️</div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Phòng đang có khách</span>
                    <span className="dcm-stat-value">{previewData.occupiedRoomsCount} phòng</span>
                  </div>
                </div>

                <div className="dcm-stat-card dcm-stat-card--checkin">
                  <div className="dcm-stat-icon"></div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Đã Check-in hôm nay</span>
                    <span className="dcm-stat-value">{previewData.checkInTodayCount} lượt</span>
                  </div>
                </div>

                <div className="dcm-stat-card dcm-stat-card--checkout">
                  <div className="dcm-stat-icon"></div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Đã Check-out hôm nay</span>
                    <span className="dcm-stat-value">{previewData.checkOutTodayCount} lượt</span>
                  </div>
                </div>
              </div>

              {/* Danh sách phòng đang có khách ở */}
              <div className="dcm-section">
                <h3 className="dcm-section-title">
                  <span> Danh sách các phòng đang có khách lưu trú ({previewData.occupiedRooms?.length || 0})</span>
                </h3>
                <div className="dcm-table-wrapper">
                  <table className="dcm-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Hạng phòng</th>
                        <th>Khách hàng</th>
                        <th>Số điện thoại</th>
                        <th>Mã Booking</th>
                        <th>Thời gian Check-in</th>
                        <th>Dự kiến Check-out</th>
                        <th>Khách</th>
                        <th style={{ color: '#15803d' }}>Tiền cọc / Đã trả</th>
                        <th style={{ color: '#b91c1c' }}>Tiền còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.occupiedRooms && previewData.occupiedRooms.length > 0 ? (
                        previewData.occupiedRooms.map((r, i) => {
                          const deposit = Number(r.depositAmount || 0)
                          const remaining = Number(r.remainingAmount || 0)
                          return (
                            <tr key={i}>
                              <td>
                                <span className="dcm-room-badge">{r.roomNumber}</span>
                              </td>
                              <td><strong>{r.roomTypeName}</strong></td>
                              <td><strong>{r.customerName}</strong></td>
                              <td>{r.customerPhone}</td>
                              <td><small style={{ color: '#64748b' }}>{r.bookingCode}</small></td>
                              <td>{formatDateTime(r.actualCheckIn)}</td>
                              <td>{formatDateTime(r.expectedCheckOut)}</td>
                              <td>{r.guestCount} người</td>
                              <td>
                                <span style={{ color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                                  {formatMoney(deposit)}
                                </span>
                              </td>
                              <td>
                                {remaining > 0 ? (
                                  <span style={{ color: '#dc2626', fontWeight: 700, background: '#fee2e2', padding: '3px 8px', borderRadius: '6px' }}>
                                    {formatMoney(remaining)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px' }}>
                                    0đ (Đã thu đủ)
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="10" className="dcm-empty-text">
                            Hiện không có phòng nào đang có khách lưu trú qua đêm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chi tiết Doanh thu bóc tách Tiền mặt & Chuyển khoản */}
              <div className="dcm-section">
                <h3 className="dcm-section-title">
                  <span>Chi tiết nguồn thu trong ngày {selectedDate}</span>
                </h3>

                <div className="dcm-revenue-grid">
                  <div className="dcm-rev-box dcm-rev-box--cash">
                    <div>
                      <div className="dcm-rev-label">
                        <span className="dcm-dot dcm-dot--green"></span>
                        <strong>TIỀN MẶT THU TẠI QUẦY (BÀN GIAO KÉT):</strong>
                      </div>
                      <small style={{ color: '#059669', fontSize: 11 }}>Tiền mặt lễ tân đã thu từ khách trong ngày</small>
                    </div>
                    <div className="dcm-rev-amount dcm-rev-amount--cash">
                      {formatMoney(previewData.cashRevenue)}
                    </div>
                  </div>

                  <div className="dcm-rev-box dcm-rev-box--transfer">
                    <div>
                      <div className="dcm-rev-label">
                        <span className="dcm-dot dcm-dot--blue"></span>
                        <strong>CHUYỂN KHOẢN / VNPAY:</strong>
                      </div>
                      <small style={{ color: '#2563eb', fontSize: 11 }}>Tiền đã vào trực tiếp tài khoản homestay</small>
                    </div>
                    <div className="dcm-rev-amount dcm-rev-amount--transfer">
                      {formatMoney(previewData.transferRevenue)}
                    </div>
                  </div>
                </div>

                {/* Khối Tổng doanh thu nổi bật */}
                <div className="dcm-total-revenue-card">
                  <div>
                    <div className="dcm-total-title">TỔNG THU TRONG NGÀY {selectedDate}</div>
                    <div className="dcm-total-sub">
                      Tổng tiền mặt tại quầy + Chuyển khoản ngân hàng phát sinh trong ngày
                    </div>
                  </div>
                  <div className="dcm-total-number">
                    {formatMoney(previewData.totalRevenue)}
                  </div>
                </div>
              </div>

              {/* Ghi chú của lễ tân dặn dò Admin */}
              <div className="dcm-section">
                <h3 className="dcm-section-title">
                  <span>Ghi chú & Dặn dò gửi Quản trị viên (Admin)</span>
                </h3>
                <textarea
                  className="dcm-notes-textarea"
                  placeholder="Nhập ghi chú cho Admin (ví dụ: Số tiền mặt đã bỏ két an toàn, phòng 102 mai xin trả muộn 1h, khách phòng 201 để quên sạc,...)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="dcm-footer">
          <div className="dcm-footer-status">
            {previewData?.alreadySubmitted && (
              <span className="dcm-badge-submitted">
                 Đã gửi báo cáo ngày này (Trạng thái: {previewData.existingReportStatus === 'ACKNOWLEDGED' ? 'Admin đã xem' : 'Chờ Admin duyệt'})
              </span>
            )}
          </div>
          <div className="dcm-footer-actions">
            <button type="button" className="dcm-btn-cancel" onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className="dcm-btn-submit"
              disabled={submitting || loading || !previewData}
              onClick={handleSubmit}
            >
              <span>{submitting ? 'Đang gửi báo cáo...' : previewData?.alreadySubmitted ? ' Cập nhật & Gửi lại cho Admin' : ' Gửi Báo Cáo Cho Admin'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
