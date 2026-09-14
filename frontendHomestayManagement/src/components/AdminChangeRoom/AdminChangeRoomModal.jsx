import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getStoredToken } from '../../services/authService'
import './AdminChangeRoomModal.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

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
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const typeDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [notes, setNotes] = useState('')
  const [oldRoomStatus, setOldRoomStatus] = useState('MAINTENANCE')
  const [newCheckOutTarget, setNewCheckOutTarget] = useState('')
  const [priceAdjustment, setPriceAdjustment] = useState(0)
  const [isComplimentaryUpgrade, setIsComplimentaryUpgrade] = useState(false)
  const [effectiveOption, setEffectiveOption] = useState('NOW') // 'NOW' or 'MID_STAY'
  const [effectiveFromDate, setEffectiveFromDate] = useState('')

  const roomTypeGroups = useMemo(() => {
    if (!data) return []
    const list = []
    
    // 1. Same type
    const validSame = (data.sameTypeRooms || []).filter(
      (r) => r.roomId !== data.currentRoomId && r.roomNumber !== data.currentRoomNumber && r.status !== 'OCCUPIED'
    )
    if (data.hasSameTypeAvailable || validSame.length > 0 || (!data.otherTypes || data.otherTypes.length === 0)) {
      list.push({
        key: 'SAME',
        name: `Cùng loại: ${data.currentRoomTypeName || 'Phòng hiện tại'}`,
        badgeText: `Cùng loại: ${data.currentRoomTypeName || 'Phòng hiện tại'} (${validSame.length} phòng trống)`,
        rooms: validSame,
      })
    }

    // 2. Other types
    (data.otherTypes || []).forEach((ot) => {
      const validOther = (ot.availableRooms || []).filter(
        (r) => r.roomId !== data.currentRoomId && r.roomNumber !== data.currentRoomNumber && r.status !== 'OCCUPIED'
      )
      list.push({
        key: String(ot.roomTypeId),
        name: ot.roomTypeName,
        badgeText: `${ot.roomTypeName} (${validOther.length} phòng trống)`,
        rooms: validOther,
      })
    })

    return list
  }, [data])

  // Fetch available rooms
  useEffect(() => {
    if (!bookingDetailId) return
    setLoading(true)
    setError('')

    const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || ''
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
        const validSame = (resData.sameTypeRooms || []).filter(
          (r) => r.roomId !== resData.currentRoomId && r.roomNumber !== resData.currentRoomNumber && r.status !== 'OCCUPIED'
        )
        if (resData.hasSameTypeAvailable && validSame.length > 0) {
          setSelectedRoomId(validSame[0].roomId)
          setSelectedRoomTypeTab('SAME')
        } else if (resData.otherTypes?.length > 0) {
          const firstType = resData.otherTypes.find(
            (ot) => (ot.availableRooms || []).some((r) => r.roomId !== resData.currentRoomId && r.roomNumber !== resData.currentRoomNumber && r.status !== 'OCCUPIED')
          ) || resData.otherTypes[0]
          setSelectedRoomTypeTab(String(firstType.roomTypeId))
          const validFirstTypeRooms = (firstType.availableRooms || []).filter(
            (r) => r.roomId !== resData.currentRoomId && r.roomNumber !== resData.currentRoomNumber && r.status !== 'OCCUPIED'
          )
          if (validFirstTypeRooms.length > 0) {
            setSelectedRoomId(validFirstTypeRooms[0].roomId)
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
      setIsComplimentaryUpgrade(true)
      setPriceAdjustment(0)
    } else {
      setOldRoomStatus('DIRTY')
      setIsComplimentaryUpgrade(false)
    }
  }

  const handleComplimentaryToggle = (checked) => {
    setIsComplimentaryUpgrade(checked)
    if (checked) {
      setPriceAdjustment(0)
      setOldRoomStatus('MAINTENANCE')
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

    const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const payload = {
      newRoomId: Number(selectedRoomId),
      reason,
      notes: notes.trim() || undefined,
      oldRoomStatusAfterChange: (reason === 'ROOM_ISSUE' || isComplimentaryUpgrade) ? 'MAINTENANCE' : oldRoomStatus,
      newCheckOutTarget: newCheckOutTarget || undefined,
      priceAdjustment: isComplimentaryUpgrade ? 0 : (Number(priceAdjustment) || 0),
      isComplimentaryUpgrade: isComplimentaryUpgrade,
      effectiveFromDate: effectiveOption === 'MID_STAY' && effectiveFromDate ? effectiveFromDate : undefined,
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

                {/* Room Type Dropdown Selector */}
                {roomTypeGroups.length > 0 && (() => {
                  const activeGroup = roomTypeGroups.find(g => g.key === selectedRoomTypeTab) || roomTypeGroups[0]
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 10, borderBottom: '1px solid #e2e8f0', marginBottom: 12 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span>Chọn loại phòng:</span>
                      </div>

                      <div ref={typeDropdownRef} style={{ position: 'relative', minWidth: 260, flex: '1 1 260px', maxWidth: 400 }}>
                        <button
                          type="button"
                          onClick={() => setIsTypeDropdownOpen(prev => !prev)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            width: '100%',
                            padding: '9px 14px',
                            borderRadius: 8,
                            border: '1.5px solid #0284c7',
                            background: '#f0f9ff',
                            color: '#0369a1',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span>🛏️</span>
                            <span>{activeGroup?.badgeText || 'Chọn loại phòng'}</span>
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              flexShrink: 0,
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {isTypeDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 6px)',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#ffffff',
                              borderRadius: 10,
                              border: '1.5px solid #cbd5e1',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                              overflow: 'hidden',
                              padding: '6px',
                            }}
                          >
                            {roomTypeGroups.map(group => {
                              const isSelected = selectedRoomTypeTab === group.key
                              return (
                                <button
                                  key={group.key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoomTypeTab(group.key)
                                    if (group.rooms.length > 0) {
                                      setSelectedRoomId(group.rooms[0].roomId)
                                    }
                                    setIsTypeDropdownOpen(false)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: isSelected ? '#0284c7' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#1e293b',
                                    fontWeight: isSelected ? 700 : 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.12s ease',
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = '#f1f5f9'
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isSelected && <span>✓</span>}
                                    <span>{group.name}</span>
                                  </span>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      background: isSelected ? 'rgba(255,255,255,0.25)' : (group.rooms.length > 0 ? '#dcfce7' : '#fee2e2'),
                                      color: isSelected ? '#ffffff' : (group.rooms.length > 0 ? '#15803d' : '#b91c1c'),
                                    }}
                                  >
                                    {group.rooms.length} phòng trống
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Rooms Grid */}
                {(() => {
                  const activeGroup = roomTypeGroups.find(g => g.key === selectedRoomTypeTab) || roomTypeGroups[0]
                  if (!activeGroup || activeGroup.rooms.length === 0) {
                    return <p className="acrm-empty-text">Loại phòng này hiện không còn phòng trống.</p>
                  }
                  return (
                    <div className="acrm-rooms-grid">
                      {activeGroup.rooms.map((r) => (
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
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Step 3: Split stay & Complimentary Upgrade options */}
              <div className="acrm-section">
                <label className="acrm-label">3. Tùy chọn nâng cao & Chia chặng lưu trú</label>

                {/* Complimentary upgrade card */}
                <div className={`acrm-upgrade-card ${isComplimentaryUpgrade ? 'is-active' : ''}`}>
                  <label className="acrm-upgrade-label">
                    <input
                      type="checkbox"
                      className="acrm-checkbox"
                      checked={isComplimentaryUpgrade}
                      onChange={(e) => handleComplimentaryToggle(e.target.checked)}
                    />
                    <div className="acrm-upgrade-text">
                      <div className="acrm-upgrade-title">
                        <span>🏷️ Miễn phí nâng hạng phòng do sự cố (Complimentary Upgrade Tag)</span>
                        <span className="acrm-tag-free">0đ PHỤ THU</span>
                      </div>
                      <p className="acrm-upgrade-desc">
                        Tự động miễn phí toàn bộ tiền chênh lệch loại phòng mới. Tự động đưa phòng cũ sang trạng thái Bảo trì & ghi nhận mã sự cố kỹ thuật.
                      </p>
                    </div>
                  </label>
                  {isComplimentaryUpgrade && (
                    <div className="acrm-upgrade-banner">
                      ✨ Đã kích hoạt <strong>Miễn phí nâng hạng</strong>: Tiền phụ thu cố định <strong>0 VNĐ</strong>. Dịch vụ minibar đã dùng tại phòng cũ sẽ được tự động gắn nhãn lưu vết trên hóa đơn tổng.
                    </div>
                  )}
                </div>

                {/* Split stay timing selector */}
                <div className="acrm-split-stay-box">
                  <label className="acrm-field-label">⏳ Thời điểm áp dụng đổi phòng (Chia chặng / Split-stay):</label>
                  <div className="acrm-split-options">
                    <label className={`acrm-split-radio ${effectiveOption === 'NOW' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="effectiveOption"
                        value="NOW"
                        checked={effectiveOption === 'NOW'}
                        onChange={() => setEffectiveOption('NOW')}
                      />
                      <span>Đổi ngay bây giờ (Chuyển phòng lập tức cho các đêm còn lại)</span>
                    </label>
                    <label className={`acrm-split-radio ${effectiveOption === 'MID_STAY' ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="effectiveOption"
                        value="MID_STAY"
                        checked={effectiveOption === 'MID_STAY'}
                        onChange={() => setEffectiveOption('MID_STAY')}
                      />
                      <span>Đổi giữa chừng từ ngày/giờ cụ thể (Khách ở phòng cũ đến mốc này)</span>
                    </label>
                  </div>
                  {effectiveOption === 'MID_STAY' && (
                    <div className="acrm-effective-date-field">
                      <label className="acrm-sublabel">Chọn ngày giờ bắt đầu chuyển sang phòng mới:</label>
                      <input
                        type="datetime-local"
                        className="acrm-input"
                        value={effectiveFromDate}
                        onChange={(e) => setEffectiveFromDate(e.target.value)}
                      />
                      <small className="acrm-field-hint">Hệ thống sẽ ghi nhận lịch ở phòng cũ từ lúc check-in đến thời điểm này, và phòng mới cho quãng thời gian còn lại.</small>
                    </div>
                  )}
                </div>

                <div className="acrm-grid-2col" style={{ marginTop: 14 }}>
                  {/* Old Room Status */}
                  <div className="acrm-field">
                    <label className="acrm-field-label">Trạng thái phòng cũ ({data?.currentRoomNumber}) sau khi chuyển:</label>
                    <select
                      className="acrm-select"
                      value={reason === 'ROOM_ISSUE' ? 'MAINTENANCE' : oldRoomStatus}
                      disabled={reason === 'ROOM_ISSUE'}
                      onChange={(e) => setOldRoomStatus(e.target.value)}
                    >
                      <option value="MAINTENANCE">🛠️ BẢO TRÌ (Phòng bị sự cố/lỗi kỹ thuật - Tự động thiết lập)</option>
                      <option value="DIRTY">🧹 CẦN DỌN DẸP (Khách vừa chuyển đi)</option>
                      <option value="AVAILABLE">✨ SẴN SÀNG ĐÓN KHÁCH (Phòng còn sạch)</option>
                    </select>
                  </div>

                  {/* Price adjustment */}
                  <div className="acrm-field">
                    <label className="acrm-field-label">Điều chỉnh tiền phòng (+ / - VNĐ):</label>
                    <input
                      type="number"
                      className="acrm-input"
                      placeholder="0"
                      disabled={isComplimentaryUpgrade}
                      value={isComplimentaryUpgrade ? 0 : priceAdjustment}
                      onChange={(e) => setPriceAdjustment(e.target.value)}
                    />
                    <small className="acrm-field-hint">
                      {isComplimentaryUpgrade
                        ? 'Khóa 0đ do đang chọn miễn phí nâng hạng sự cố.'
                        : 'Nhập số tiền chênh lệch (nếu nâng hạng phòng hoặc phụ thu thêm giờ).'}
                    </small>
                  </div>
                </div>

                {/* Extend check out target if reason is EXTEND_STAY */}
                {reason === 'EXTEND_STAY' && (
                  <div className="acrm-field" style={{ marginTop: 12 }}>
                    <label className="acrm-field-label">Giờ trả phòng mới (Gia hạn):</label>
                    <input
                      type="datetime-local"
                      className="acrm-input"
                      value={newCheckOutTarget}
                      onChange={(e) => setNewCheckOutTarget(e.target.value)}
                    />
                  </div>
                )}

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
