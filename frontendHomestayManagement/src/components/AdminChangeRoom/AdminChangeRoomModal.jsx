import React, { useState, useEffect } from 'react'
import './AdminChangeRoomModal.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export default function AdminChangeRoomModal({
  bookingDetailId,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [reason, setReason] = useState('ROOM_ISSUE')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [selectedRoomTypeTab, setSelectedRoomTypeTab] = useState('SAME') // 'SAME' or other roomTypeId
  const [notes, setNotes] = useState('')
  const [oldRoomStatus, setOldRoomStatus] = useState('MAINTENANCE')
  const [newCheckOutTarget, setNewCheckOutTarget] = useState('')
  const [priceAdjustment, setPriceAdjustment] = useState(0)

  // Fetch available rooms
  useEffect(() => {
    if (!bookingDetailId) return
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(`${API_BASE_URL}/admin/bookings/details/${bookingDetailId}/available-change-rooms`, {
      headers,
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Không tải được danh sách phòng trống')
        return json
      })
      .then((resData) => {
        setData(resData)
        if (resData.hasSameTypeAvailable && resData.sameTypeRooms?.length > 0) {
          setSelectedRoomId(resData.sameTypeRooms[0].roomId)
          setSelectedRoomTypeTab('SAME')
        } else if (resData.otherTypes?.length > 0) {
          const firstType = resData.otherTypes[0]
          setSelectedRoomTypeTab(String(firstType.roomTypeId))
          if (firstType.availableRooms?.length > 0) {
            setSelectedRoomId(firstType.availableRooms[0].roomId)
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Đã có lỗi xảy ra khi tải dữ liệu phòng')
      })
      .finally(() => setLoading(false))
  }, [bookingDetailId])

  // Sync default old room status when reason changes
  const handleReasonChange = (newReason) => {
    setReason(newReason)
    if (newReason === 'ROOM_ISSUE') {
      setOldRoomStatus('MAINTENANCE')
    } else {
      setOldRoomStatus('DIRTY')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng mới cần chuyển đến')
      return
    }

    setSubmitting(true)
    setError('')

    const token = localStorage.getItem('token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const payload = {
      newRoomId: Number(selectedRoomId),
      reason,
      notes: notes.trim() || undefined,
      oldRoomStatusAfterChange: oldRoomStatus,
      newCheckOutTarget: newCheckOutTarget || undefined,
      priceAdjustment: Number(priceAdjustment) || 0,
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings/details/${bookingDetailId}/change-room`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Không thể thực hiện đổi phòng')

      if (onSuccess) onSuccess(json)
      onClose()
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi đổi phòng')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="acrm-backdrop" onClick={onClose}>
      <div className="acrm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Modal Header */}
        <div className="acrm-header">
          <div className="acrm-header-info">
            <div className="acrm-title-wrapper">
              <svg viewBox="0 0 24 24" className="acrm-title-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <h3>Đổi Phòng Cho Khách</h3>
            </div>
            {data && (
              <p className="acrm-subtitle">
                Khách: <strong>{data.customerName || 'Khách lưu trú'}</strong> | Mã đơn: <strong>{data.bookingCode}</strong> | Phòng hiện tại: <span className="acrm-current-badge">{data.currentRoomNumber} ({data.currentRoomTypeName})</span>
              </p>
            )}
          </div>
          <button type="button" className="acrm-close-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="acrm-body">
          {loading ? (
            <div className="acrm-loading">
              <div className="acrm-spinner" />
              <p>Đang kiểm tra các phòng trống khả dụng...</p>
            </div>
          ) : error && !data ? (
            <div className="acrm-error-state">
              <p>{error}</p>
              <button type="button" onClick={onClose} className="acrm-btn-secondary">Đóng</button>
            </div>
          ) : (
            <form id="change-room-form" onSubmit={handleSubmit} className="acrm-form">
              {error && <div className="acrm-alert-error">{error}</div>}

              {/* Step 1: Reason Selection */}
              <div className="acrm-section">
                <label className="acrm-label">1. Lý do đổi phòng <span className="acrm-req">*</span></label>
                <div className="acrm-reason-grid">
                  <label className={`acrm-reason-card ${reason === 'ROOM_ISSUE' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="changeReason"
                      value="ROOM_ISSUE"
                      checked={reason === 'ROOM_ISSUE'}
                      onChange={() => handleReasonChange('ROOM_ISSUE')}
                    />
                    <div className="acrm-reason-content">
                      <span className="acrm-reason-title">Phòng gặp sự cố / Bị lỗi</span>
                      <span className="acrm-reason-desc">Máy lạnh, nước, thiết bị hỏng (Tự động đưa phòng cũ vào bảo trì)</span>
                    </div>
                  </label>

                  <label className={`acrm-reason-card ${reason === 'EXTEND_STAY' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="changeReason"
                      value="EXTEND_STAY"
                      checked={reason === 'EXTEND_STAY'}
                      onChange={() => handleReasonChange('EXTEND_STAY')}
                    />
                    <div className="acrm-reason-content">
                      <span className="acrm-reason-title">Khách đặt thêm giờ / Gia hạn</span>
                      <span className="acrm-reason-desc">Phòng hiện tại bị trùng lịch khách sau, chuyển phòng trống khác</span>
                    </div>
                  </label>

                  <label className={`acrm-reason-card ${reason === 'CUSTOMER_REQUEST' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="changeReason"
                      value="CUSTOMER_REQUEST"
                      checked={reason === 'CUSTOMER_REQUEST'}
                      onChange={() => handleReasonChange('CUSTOMER_REQUEST')}
                    />
                    <div className="acrm-reason-content">
                      <span className="acrm-reason-title">Khách yêu cầu đổi phòng</span>
                      <span className="acrm-reason-desc">Muốn chuyển tầng, đổi hướng view hoặc nâng cấp phòng</span>
                    </div>
                  </label>

                  <label className={`acrm-reason-card ${reason === 'OTHER' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="changeReason"
                      value="OTHER"
                      checked={reason === 'OTHER'}
                      onChange={() => handleReasonChange('OTHER')}
                    />
                    <div className="acrm-reason-content">
                      <span className="acrm-reason-title">Lý do điều phối khác</span>
                      <span className="acrm-reason-desc">Sắp xếp tối ưu phòng của khách sạn</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 2: Available Rooms Selection */}
              <div className="acrm-section">
                <label className="acrm-label">2. Chọn phòng mới chuyển đến <span className="acrm-req">*</span></label>

                {/* Same type status notice */}
                {data?.hasSameTypeAvailable ? (
                  <div className="acrm-notice acrm-notice--success">
                    <svg viewBox="0 0 20 20" className="acrm-notice-icon" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Còn <strong>{data.sameTypeRooms.length}</strong> phòng cùng loại (<strong>{data.currentRoomTypeName}</strong>) đang trống.</span>
                  </div>
                ) : (
                  <div className="acrm-notice acrm-notice--warning">
                    <svg viewBox="0 0 20 20" className="acrm-notice-icon" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Đã hết phòng cùng loại trống!</strong> Quý khách / Lễ tân vui lòng chọn chuyển sang loại phòng khác bên dưới:</span>
                  </div>
                )}

                {/* Room Type Tabs */}
                <div className="acrm-type-tabs">
                  {data?.hasSameTypeAvailable && (
                    <button
                      type="button"
                      className={`acrm-type-tab ${selectedRoomTypeTab === 'SAME' ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedRoomTypeTab('SAME')
                        if (data.sameTypeRooms?.length > 0) setSelectedRoomId(data.sameTypeRooms[0].roomId)
                      }}
                    >
                      Cùng loại: {data.currentRoomTypeName} ({data.sameTypeRooms?.length || 0})
                    </button>
                  )}
                  {data?.otherTypes?.map((ot) => (
                    <button
                      key={ot.roomTypeId}
                      type="button"
                      className={`acrm-type-tab ${selectedRoomTypeTab === String(ot.roomTypeId) ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedRoomTypeTab(String(ot.roomTypeId))
                        if (ot.availableRooms?.length > 0) setSelectedRoomId(ot.availableRooms[0].roomId)
                      }}
                    >
                      {ot.roomTypeName} ({ot.availableRooms?.length || 0} phòng trống)
                    </button>
                  ))}
                </div>

                {/* Rooms Grid */}
                <div className="acrm-rooms-grid">
                  {selectedRoomTypeTab === 'SAME' ? (
                    data?.sameTypeRooms?.length > 0 ? (
                      data.sameTypeRooms.map((r) => (
                        <label
                          key={r.roomId}
                          className={`acrm-room-card ${selectedRoomId === r.roomId ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="selectedRoom"
                            value={r.roomId}
                            checked={selectedRoomId === r.roomId}
                            onChange={() => setSelectedRoomId(r.roomId)}
                          />
                          <div className="acrm-room-card-body">
                            <span className="acrm-room-number">Phòng {r.roomNumber}</span>
                            <span className="acrm-room-type-tag">{r.roomTypeName}</span>
                            <span className="acrm-room-status-tag">Sẵn sàng nhận khách</span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="acrm-empty-text">Không có phòng cùng loại nào khả dụng.</p>
                    )
                  ) : (
                    (() => {
                      const curType = data?.otherTypes?.find((ot) => String(ot.roomTypeId) === selectedRoomTypeTab)
                      if (!curType || curType.availableRooms?.length === 0) {
                        return <p className="acrm-empty-text">Loại phòng này hiện không còn phòng trống.</p>
                      }
                      return curType.availableRooms.map((r) => (
                        <label
                          key={r.roomId}
                          className={`acrm-room-card ${selectedRoomId === r.roomId ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="selectedRoom"
                            value={r.roomId}
                            checked={selectedRoomId === r.roomId}
                            onChange={() => setSelectedRoomId(r.roomId)}
                          />
                          <div className="acrm-room-card-body">
                            <span className="acrm-room-number">Phòng {r.roomNumber}</span>
                            <span className="acrm-room-type-tag">{r.roomTypeName}</span>
                            <span className="acrm-room-status-tag">Sẵn sàng nhận khách</span>
                          </div>
                        </label>
                      ))
                    })()
                  )}
                </div>
              </div>

              {/* Step 3: Additional Options */}
              <div className="acrm-section">
                <div className="acrm-grid-2col">
                  {/* Old Room Status */}
                  <div className="acrm-field">
                    <label className="acrm-field-label">Trạng thái phòng cũ ({data?.currentRoomNumber}) sau khi chuyển:</label>
                    <select
                      className="acrm-select"
                      value={oldRoomStatus}
                      onChange={(e) => setOldRoomStatus(e.target.value)}
                    >
                      <option value="MAINTENANCE">Chuyển sang BẢO TRÌ (Phòng bị sự cố/lỗi kỹ thuật)</option>
                      <option value="DIRTY">Chuyển sang CẦN DỌN DẸP (Khách vừa chuyển đi)</option>
                      <option value="AVAILABLE">SẴN SÀNG ĐÓN KHÁCH (Phòng còn sạch)</option>
                    </select>
                  </div>

                  {/* Extend check out target if reason is EXTEND_STAY */}
                  {reason === 'EXTEND_STAY' && (
                    <div className="acrm-field">
                      <label className="acrm-field-label">Giờ trả phòng mới (Gia hạn):</label>
                      <input
                        type="datetime-local"
                        className="acrm-input"
                        value={newCheckOutTarget}
                        onChange={(e) => setNewCheckOutTarget(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Price adjustment */}
                  <div className="acrm-field">
                    <label className="acrm-field-label">Điều chỉnh tiền phòng (+ / - VNĐ):</label>
                    <input
                      type="number"
                      className="acrm-input"
                      placeholder="0"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(e.target.value)}
                    />
                    <small className="acrm-field-hint">Nhập số tiền chênh lệch (nếu nâng hạng phòng hoặc phụ thu thêm giờ).</small>
                  </div>
                </div>

                {/* Notes */}
                <div className="acrm-field" style={{ marginTop: 12 }}>
                  <label className="acrm-field-label">Mô tả sự cố / Ghi chú đổi phòng:</label>
                  <textarea
                    className="acrm-textarea"
                    rows="2"
                    placeholder="Ví dụ: Máy lạnh hỏng cánh quạt gió, đã chuyển khách sang P202 và tạo phiếu bảo trì..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="acrm-footer">
          <button type="button" className="acrm-btn-secondary" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="change-room-form"
            className="acrm-btn-primary"
            disabled={submitting || loading || !selectedRoomId}
          >
            {submitting ? 'Đang xử lý đổi phòng...' : 'Xác nhận Đổi Phòng'}
          </button>
        </div>
      </div>
    </div>
  )
}
