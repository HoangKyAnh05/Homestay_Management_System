import React, { useState, useEffect, useCallback } from 'react'
import { getDailyReports, getDailyReportDetail, acknowledgeDailyReport } from '../../services/dailyReportService'
import './DailyClosingModal.css'

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

export default function AdminDailyReportsModal({ isOpen, onClose }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [acknowledging, setAcknowledging] = useState(false)
  const [msg, setMsg] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await getDailyReports({ size: 30 })
      setReports(res.content || [])
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadReports()
      setSelectedReport(null)
    }
  }, [isOpen, loadReports])

  if (!isOpen) return null

  const handleAcknowledge = async (id) => {
    setAcknowledging(true)
    try {
      const updated = await acknowledgeDailyReport(id)
      setSelectedReport(updated)
      await loadReports()
      setMsg('Đã xác nhận kiểm tra báo cáo thành công!')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setAcknowledging(false)
    }
  }

  // Phân tích snapshot JSON
  let snapshot = null
  if (selectedReport?.snapshotDataJson) {
    try {
      snapshot = JSON.parse(selectedReport.snapshotDataJson)
    } catch (_) {}
  }

  return (
    <div className="dcm-overlay" onClick={onClose}>
      <div className="dcm-modal" style={{ maxWidth: 1000 }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dcm-header">
          <div className="dcm-header-left">
            <h2>📋 Quản Trị: Danh Sách Báo Cáo Cuối Ngày Của Lễ Tân</h2>
            <p>Kiểm tra doanh thu, danh sách phòng có khách và xác nhận báo cáo từ nhân viên</p>
          </div>
          <button type="button" className="dcm-close-btn" onClick={onClose} title="Đóng">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="dcm-body">
          {msg && <div className="dcm-alert-success">✅ {msg}</div>}

          {selectedReport ? (
            /* Chi tiết 1 báo cáo */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ← Quay lại danh sách
                </button>

                <div>
                  <span style={{ fontSize: 14, color: '#64748b', marginRight: 12 }}>
                    Người lập: <strong>{selectedReport.staffFullName || selectedReport.staffUsername}</strong> • Gửi lúc: {formatDateTime(selectedReport.createdAt)}
                  </span>
                  <span className={`dcm-badge-submitted`} style={{
                    background: selectedReport.status === 'ACKNOWLEDGED' ? '#dbeafe' : '#dcfce7',
                    color: selectedReport.status === 'ACKNOWLEDGED' ? '#1e40af' : '#15803d',
                  }}>
                    {selectedReport.status === 'ACKNOWLEDGED' ? `Admin đã xác nhận (${selectedReport.acknowledgedBy || ''})` : 'Chờ Admin xác nhận'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="dcm-stats-grid" style={{ marginBottom: 16 }}>
                <div className="dcm-stat-card dcm-stat-card--occupied">
                  <div className="dcm-stat-icon">🛏️</div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Phòng đang có khách</span>
                    <span className="dcm-stat-value">{selectedReport.occupiedRoomsCount} phòng</span>
                  </div>
                </div>

                <div className="dcm-stat-card dcm-stat-card--checkin">
                  <div className="dcm-stat-icon">📥</div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Check-in trong ngày</span>
                    <span className="dcm-stat-value">{selectedReport.checkInTodayCount} lượt</span>
                  </div>
                </div>

                <div className="dcm-stat-card dcm-stat-card--checkout">
                  <div className="dcm-stat-icon">📤</div>
                  <div className="dcm-stat-info">
                    <span className="dcm-stat-label">Check-out trong ngày</span>
                    <span className="dcm-stat-value">{selectedReport.checkOutTodayCount} lượt</span>
                  </div>
                </div>
              </div>

              {/* Highlight Doanh thu */}
              <div className="dcm-section" style={{ marginBottom: 16 }}>
                <div className="dcm-revenue-grid">
                  <div className="dcm-rev-box">
                    <span className="dcm-rev-label">💵 Tiền mặt tại quầy:</span>
                    <span className="dcm-rev-amount" style={{ color: '#059669' }}>
                      {formatMoney(selectedReport.cashRevenue)}
                    </span>
                  </div>
                  <div className="dcm-rev-box">
                    <span className="dcm-rev-label">💳 Chuyển khoản ngân hàng:</span>
                    <span className="dcm-rev-amount" style={{ color: '#2563eb' }}>
                      {formatMoney(selectedReport.transferRevenue)}
                    </span>
                  </div>
                </div>

                <div className="dcm-total-revenue-card">
                  <div>
                    <div className="dcm-total-title">TỔNG DOANH THU TRONG NGÀY ({selectedReport.reportDate})</div>
                    <div className="dcm-total-sub">Đã được nhân viên đối soát và gửi lên</div>
                  </div>
                  <div className="dcm-total-number">
                    {formatMoney(selectedReport.totalRevenue)}
                  </div>
                </div>
              </div>

              {/* Danh sách phòng snapshot */}
              {snapshot?.occupiedRooms && snapshot.occupiedRooms.length > 0 && (
                <div className="dcm-section" style={{ marginBottom: 16 }}>
                  <h3 className="dcm-section-title">
                    <span>🏠 Danh sách phòng lưu trú lúc gửi báo cáo ({snapshot.occupiedRooms.length})</span>
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
                          <th>Nhận phòng</th>
                          <th>Dự kiến trả</th>
                          <th>Số khách</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.occupiedRooms.map((r, i) => (
                          <tr key={i}>
                            <td><span className="dcm-room-badge">{r.roomNumber}</span></td>
                            <td>{r.roomTypeName}</td>
                            <td><strong>{r.customerName}</strong></td>
                            <td>{r.customerPhone}</td>
                            <td><small>{r.bookingCode}</small></td>
                            <td>{formatDateTime(r.actualCheckIn)}</td>
                            <td>{formatDateTime(r.expectedCheckOut)}</td>
                            <td>{r.guestCount} khách</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              {selectedReport.notes && (
                <div className="dcm-section" style={{ marginBottom: 16 }}>
                  <h3 className="dcm-section-title">
                    <span>📝 Ghi chú dặn dò của Lễ tân</span>
                  </h3>
                  <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', color: '#334155', fontStyle: 'italic' }}>
                    {selectedReport.notes}
                  </div>
                </div>
              )}

              {/* Nút xác nhận */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                {selectedReport.status !== 'ACKNOWLEDGED' && (
                  <button
                    type="button"
                    className="dcm-btn-submit"
                    disabled={acknowledging}
                    onClick={() => handleAcknowledge(selectedReport.id)}
                  >
                    <span>{acknowledging ? 'Đang xác nhận...' : '✅ Xác Nhận Đã Xem & Kiểm Tra Báo Cáo'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Danh sách báo cáo */
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Đang tải danh sách báo cáo...
                </div>
              ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Chưa có báo cáo cuối ngày nào được gửi.
                </div>
              ) : (
                <div className="dcm-table-wrapper">
                  <table className="dcm-table">
                    <thead>
                      <tr>
                        <th>Ngày Báo Cáo</th>
                        <th>Người Lập</th>
                        <th>Phòng Có Khách</th>
                        <th>Tiền Mặt</th>
                        <th>Chuyển Khoản</th>
                        <th>Tổng Doanh Thu</th>
                        <th>Trạng Thái</th>
                        <th>Thời Gian Gửi</th>
                        <th>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((rpt) => (
                        <tr key={rpt.id}>
                          <td><strong>{rpt.reportDate}</strong></td>
                          <td>{rpt.staffFullName || rpt.staffUsername}</td>
                          <td>{rpt.occupiedRoomsCount} phòng</td>
                          <td style={{ color: '#059669', fontWeight: 600 }}>{formatMoney(rpt.cashRevenue)}</td>
                          <td style={{ color: '#2563eb', fontWeight: 600 }}>{formatMoney(rpt.transferRevenue)}</td>
                          <td><strong style={{ color: '#0284c7', fontSize: 14 }}>{formatMoney(rpt.totalRevenue)}</strong></td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              background: rpt.status === 'ACKNOWLEDGED' ? '#dbeafe' : '#fef3c7',
                              color: rpt.status === 'ACKNOWLEDGED' ? '#1e40af' : '#92400e',
                            }}>
                              {rpt.status === 'ACKNOWLEDGED' ? 'Đã xem' : 'Mới gửi'}
                            </span>
                          </td>
                          <td><small style={{ color: '#64748b' }}>{formatDateTime(rpt.createdAt)}</small></td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedReport(rpt)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #0284c7',
                                background: '#eff6ff',
                                color: '#0284c7',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dcm-footer">
          <div>
            <small style={{ color: '#64748b' }}>Hệ thống quản lý Homestay - Báo cáo cuối ngày</small>
          </div>
          <button type="button" className="dcm-btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>

      </div>
    </div>
  )
}
