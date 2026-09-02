import { useEffect, useState } from 'react'
import {
  getCurrentShiftStatus,
  getReceptionistStaffList,
  submitShiftHandover,
} from '../../services/shiftService'
import { getStoredUser } from '../../services/authService'
import './ShiftHandoverModal.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ'
}

export default function ShiftHandoverModal({ isOpen, onClose, onSuccess }) {
  const currentUser = getStoredUser()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [statusData, setStatusData] = useState(null)
  const [receptionists, setReceptionists] = useState([])

  // Form states
  const [outgoingEmail, setOutgoingEmail] = useState('')
  const [outgoingPassword, setOutgoingPassword] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [isSufficient, setIsSufficient] = useState(null) // true = Đủ tiền, false = Thiếu tiền, null = Chưa chọn
  const [shortageAmount, setShortageAmount] = useState('')
  const [shortageReason, setShortageReason] = useState('')
  const [compensationDeadline, setCompensationDeadline] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)

    Promise.all([
      getCurrentShiftStatus(),
      getReceptionistStaffList(),
    ])
      .then(([statusRes, listRes]) => {
        setStatusData(statusRes)
        const staffList = Array.isArray(listRes) ? listRes : []
        setReceptionists(staffList)

        // Điền mặc định số tiền dự kiến
        if (statusRes?.expectedCash !== undefined) {
          setActualCash(String(statusRes.expectedCash))
        }

        // Tự động chọn người ca trước nếu có
        const prevEmail = statusRes?.activeShift?.incomingStaffEmail || statusRes?.lastHandover?.incomingStaffEmail
        if (prevEmail && staffList.some((r) => r.email === prevEmail)) {
          setOutgoingEmail(prevEmail)
        } else if (staffList.length > 0) {
          setOutgoingEmail(staffList[0].email)
        }
      })
      .catch((err) => {
        setErrorMessage(
          err.message || 'Không thể tải dữ liệu ca làm. Vui lòng kiểm tra và restart lại server backend Spring Boot để nạp các API mới.'
        )
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  // Tự động tính chênh lệch khi người dùng nhập actualCash
  const expectedCash = Number(statusData?.expectedCash || 0)
  const expectedVal = expectedCash
  const actualVal = Number(actualCash || 0)
  const diffVal = actualVal - expectedCash

  const handleSelectSufficient = () => {
    setIsSufficient(true)
    setShortageAmount('')
    setShortageReason('')
    setCompensationDeadline('')
  }

  const handleSelectShortage = () => {
    setIsSufficient(false)
    if (diffVal < 0) {
      setShortageAmount(String(Math.abs(diffVal)))
    } else if (Number(actualCash) < expectedCash) {
      setShortageAmount(String(expectedCash - Number(actualCash)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!outgoingEmail) {
      setErrorMessage('Vui lòng chọn nhân viên giao ca (ca trước)')
      return
    }

    if (outgoingEmail.trim().toLowerCase() === currentUser?.email?.toLowerCase()) {
      setErrorMessage('Người giao ca và người nhận ca phải là 2 nick/tài khoản khác nhau!')
      return
    }

    if (!outgoingPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu xác nhận của nhân viên giao ca')
      return
    }

    if (actualCash === '' || isNaN(Number(actualCash)) || Number(actualCash) < 0) {
      setErrorMessage('Vui lòng nhập số tiền mặt thực tế bàn giao hợp lệ')
      return
    }

    if (isSufficient === null) {
      setErrorMessage('Vui lòng chọn tích "Đã kiểm tra đối soát đủ tiền" hoặc "Thiếu tiền"')
      return
    }

    if (isSufficient === false) {
      const numShortage = Number(shortageAmount)
      if (!shortageAmount || isNaN(numShortage) || numShortage <= 0) {
        setErrorMessage('Vui lòng nhập số tiền thiếu lớn hơn 0 VNĐ')
        return
      }
      if (numShortage > expectedCash) {
        setErrorMessage(
          `Số tiền thiếu (${formatMoney(numShortage)}) không được vượt quá số tiền của ca chuyển giao (${formatMoney(expectedCash)})!`
        )
        return
      }
      if (!shortageReason.trim()) {
        setErrorMessage('Vui lòng điền rõ lý do thiếu tiền')
        return
      }
      if (!compensationDeadline) {
        setErrorMessage('Vui lòng chọn thời gian cam kết bù tiền vào quỹ')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        outgoingEmail,
        outgoingPassword,
        actualCash: Number(actualCash),
        isSufficient,
        shortageAmount: isSufficient ? null : Number(shortageAmount),
        shortageReason: isSufficient ? null : shortageReason.trim(),
        compensationDeadline: isSufficient ? null : compensationDeadline,
        notes: notes.trim() || null,
      }

      const res = await submitShiftHandover(payload)
      setSuccessMessage('Giao ca thành công! Bạn đã chính thức vào ca làm việc.')
      if (onSuccess) onSuccess(res)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMessage(err.message || 'Giao ca thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sh-modal-header">
          <div className="sh-modal-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h3>Biên bản Đối soát & Giao ca Lễ tân</h3>
            <p>Bàn giao quỹ tiền mặt, kiểm tra đối soát và xác nhận vào ca làm</p>
          </div>
          <button type="button" className="sh-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="sh-modal-loading">Đang tải dữ liệu ca làm và đối soát quỹ...</div>
        ) : (
          <form className="sh-modal-form" onSubmit={handleSubmit}>
            {/* 1. KHỐI HAI TÀI KHOẢN GIAO & NHẬN */}
            <div className="sh-section-title">
              <span className="sh-badge-step">1</span>
              <span>Xác thực hai nhân viên bàn giao ca (2 tài khoản khác nhau)</span>
            </div>

            <div className="sh-staff-grid">
              {/* Người sau - Người nhận ca (Tài khoản hiện tại) */}
              <div className="sh-staff-card sh-staff-card--incoming">
                <div className="sh-staff-tag">👤 Người sau (Vào ca làm)</div>
                <div className="sh-staff-body">
                  <strong>{currentUser?.fullName || currentUser?.email}</strong>
                  <span>{currentUser?.email}</span>
                  <small className="sh-staff-note">Tài khoản đang đăng nhập</small>
                </div>
              </div>

              {/* Người trước - Người giao ca */}
              <div className="sh-staff-card sh-staff-card--outgoing">
                <div className="sh-staff-tag">🤝 Người trước (Giao ca)</div>
                <div className="sh-staff-body">
                  <label className="sh-field-label" htmlFor="sh-outgoing-select">
                    Chọn nhân viên giao ca:
                  </label>
                  <select
                    id="sh-outgoing-select"
                    className="sh-select"
                    value={outgoingEmail}
                    onChange={(e) => setOutgoingEmail(e.target.value)}
                    required
                  >
                    {receptionists.length === 0 ? (
                      <option value="">Không tìm thấy nhân viên khác</option>
                    ) : (
                      receptionists.map((r) => (
                        <option key={r.email} value={r.email}>
                          {r.fullName} ({r.email})
                        </option>
                      ))
                    )}
                  </select>

                  <label className="sh-field-label" htmlFor="sh-outgoing-pwd">
                    Mật khẩu xác nhận người giao ca:
                  </label>
                  <input
                    id="sh-outgoing-pwd"
                    type="password"
                    className="sh-input"
                    placeholder="Nhập mật khẩu để ký giao ca"
                    value={outgoingPassword}
                    onChange={(e) => setOutgoingPassword(e.target.value)}
                    required
                  />
                  <small className="sh-staff-hint">
                    ⚠️ Người giao ca và người nhận ca phải là 2 nick khác nhau.
                  </small>
                </div>
              </div>
            </div>

            {/* 2. KHỐI ĐỐI SOÁT TIỀN MẶT ĐƠN GIẢN */}
            <div className="sh-section-title">
              <span className="sh-badge-step">2</span>
              <span>Đối soát tiền mặt trong ca</span>
            </div>

            <div className="sh-reconcile-box">
              <div className="sh-reconcile-row">
                <span>Quỹ tiền mặt đầu ca:</span>
                <strong>{formatMoney(statusData?.initialCash || 0)}</strong>
              </div>
              <div className="sh-reconcile-row">
                <span>Doanh thu tiền mặt hệ thống ghi nhận trong ca:</span>
                <strong>+ {formatMoney(statusData?.cashRevenueInShift || 0)}</strong>
              </div>
              <div className="sh-reconcile-row sh-reconcile-row--expected">
                <span>Tổng tiền mặt hệ thống dự kiến:</span>
                <strong className="sh-highlight-money">{formatMoney(expectedVal)}</strong>
              </div>
              <div className="sh-reconcile-row sh-reconcile-row--actual">
                <label htmlFor="sh-actual-cash">
                  <span>Tiền mặt thực tế đếm được khi bàn giao (VNĐ):</span>
                </label>
                <div className="sh-actual-input-wrap">
                  <input
                    id="sh-actual-cash"
                    type="number"
                    min="0"
                    step="1000"
                    className="sh-input sh-input--cash"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="Nhập tiền mặt thực tế"
                    required
                  />
                </div>
              </div>
              {actualCash !== '' && (
                <div className={`sh-diff-badge ${diffVal < 0 ? 'sh-diff-badge--shortage' : 'sh-diff-badge--ok'}`}>
                  {diffVal === 0 ? (
                    '✅ Khớp 100% so với hệ thống'
                  ) : diffVal < 0 ? (
                    `⚠️ Chênh lệch thiếu: -${formatMoney(Math.abs(diffVal))}`
                  ) : (
                    `ℹ️ Thừa tiền: +${formatMoney(diffVal)}`
                  )}
                </div>
              )}

              <div className="sh-handover-transfer-note">
                💡 <strong>Kế thừa quỹ ca làm:</strong> Toàn bộ số tiền thực tế bàn giao <strong>{formatMoney(actualCash || 0)}</strong> (gồm tiền quỹ đầu ca + doanh thu tiền mặt thu được trong ca này) sẽ được chuyển giao đầy đủ 100% làm <strong>Quỹ tiền mặt đầu ca</strong> cho nhân viên nhận ca tiếp theo ({currentUser?.fullName || 'bạn'}).
              </div>
            </div>

            {/* 3. NÚT TÍCH ĐÃ KIỂM TRA ĐỐI SOÁT ĐỦ TIỀN & THIẾU TIỀN */}
            <div className="sh-section-title">
              <span className="sh-badge-step">3</span>
              <span>Kết quả kiểm tra đối soát & Xác nhận vào ca</span>
            </div>

            <div className="sh-check-options">
              {/* Nút tích: Đã kiểm tra đối soát đủ tiền */}
              <div
                className={`sh-check-card ${isSufficient === true ? 'sh-check-card--selected-ok' : ''}`}
                onClick={handleSelectSufficient}
              >
                <input
                  type="radio"
                  id="sh-opt-sufficient"
                  name="cashCheck"
                  checked={isSufficient === true}
                  onChange={handleSelectSufficient}
                />
                <label htmlFor="sh-opt-sufficient" className="sh-check-label">
                  <div className="sh-check-title">
                    <span className="sh-icon-check">✓</span>
                    <span>Đã kiểm tra đối soát đủ tiền</span>
                  </div>
                  <p className="sh-check-desc">
                    Xác nhận tiền mặt thực tế khớp đúng và đủ số tiền đối soát, sẵn sàng vào ca làm.
                  </p>
                </label>
              </div>

              {/* Nút tích: Thiếu tiền */}
              <div
                className={`sh-check-card ${isSufficient === false ? 'sh-check-card--selected-warn' : ''}`}
                onClick={handleSelectShortage}
              >
                <input
                  type="radio"
                  id="sh-opt-shortage"
                  name="cashCheck"
                  checked={isSufficient === false}
                  onChange={handleSelectShortage}
                />
                <label htmlFor="sh-opt-shortage" className="sh-check-label">
                  <div className="sh-check-title sh-check-title--warn">
                    <span className="sh-icon-warn">!</span>
                    <span>Thiếu tiền (Ghi nhận biên bản & hẹn bù)</span>
                  </div>
                  <p className="sh-check-desc">
                    Phát hiện hụt tiền mặt. Ghi nhận số tiền thiếu, lý do và thời hạn hoàn bù vào quỹ.
                  </p>
                </label>
              </div>
            </div>

            {/* KHỐI NHẬP THÔNG TIN THIẾU TIỀN (KHI CHỌN NÚT TÍCH THIẾU) */}
            {isSufficient === false && (
              <div className="sh-shortage-panel">
                <div className="sh-shortage-title">
                  <span>⚠️ Chi tiết thiếu hụt & Cam kết hoàn bù</span>
                </div>

                <div className="sh-shortage-grid">
                  <div className="sh-field">
                    <label htmlFor="sh-shortage-amt">
                      Số tiền thiếu (VNĐ) <span className="sh-req">*</span>
                    </label>
                    <input
                      id="sh-shortage-amt"
                      type="number"
                      min="1000"
                      max={expectedCash}
                      step="1000"
                      className={`sh-input ${Number(shortageAmount) > expectedCash ? 'sh-input--error' : ''}`}
                      placeholder={`Tối đa: ${expectedCash}`}
                      value={shortageAmount}
                      onChange={(e) => setShortageAmount(e.target.value)}
                      required
                    />
                    {Number(shortageAmount) > expectedCash ? (
                      <small style={{ color: '#dc2626', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                        ⚠️ Số tiền thiếu không được vượt quá số tiền của ca ({formatMoney(expectedCash)})!
                      </small>
                    ) : expectedCash > 0 ? (
                      <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        Tối đa: <b>{formatMoney(expectedCash)}</b>
                      </small>
                    ) : null}
                  </div>

                  <div className="sh-field">
                    <label htmlFor="sh-shortage-time">
                      Thời gian bù tiền <span className="sh-req">*</span>
                    </label>
                    <input
                      id="sh-shortage-time"
                      type="datetime-local"
                      className="sh-input"
                      value={compensationDeadline}
                      onChange={(e) => setCompensationDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="sh-field">
                  <label htmlFor="sh-shortage-reason">
                    Lý do thiếu tiền <span className="sh-req">*</span>
                  </label>
                  <textarea
                    id="sh-shortage-reason"
                    rows="2"
                    className="sh-textarea"
                    placeholder="Nhập cụ thể lý do thiếu tiền (vd: thối nhầm tiền cho khách, chi mua đồ quầy lễ tân chưa bổ sung hóa đơn...)"
                    value={shortageReason}
                    onChange={(e) => setShortageReason(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* 4. GHI CHÚ BÀN GIAO THÊM */}
            <div className="sh-field">
              <label htmlFor="sh-notes">Ghi chú bàn giao ca (tùy chọn):</label>
              <textarea
                id="sh-notes"
                rows="2"
                className="sh-textarea"
                placeholder="Bàn giao chìa khóa, danh sách phòng check-in muộn, yêu cầu đặc biệt của khách..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* CẢNH BÁO / THÀNH CÔNG */}
            {errorMessage && <div className="sh-alert sh-alert--error">{errorMessage}</div>}
            {successMessage && <div className="sh-alert sh-alert--success">{successMessage}</div>}

            {/* NÚT THAO TÁC */}
            <div className="sh-modal-actions">
              <button type="button" className="sh-btn-cancel" onClick={onClose} disabled={submitting}>
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="sh-btn-submit"
                disabled={submitting || isSufficient === null}
              >
                {submitting ? 'Đang xác nhận giao ca...' : 'Xác nhận giao ca & Vào ca làm'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
