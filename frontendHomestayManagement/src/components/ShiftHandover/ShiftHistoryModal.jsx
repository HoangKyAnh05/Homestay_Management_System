import { useEffect, useState } from 'react'
import { getShiftHistory, resolveShiftCompensation } from '../../services/shiftService'
import './ShiftHistoryModal.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ'
}

function formatDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ShiftHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterCompensation, setFilterCompensation] = useState('')
  const [actionShiftId, setActionShiftId] = useState(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filterCompensation) {
        params.compensationStatus = filterCompensation
      }
      const data = await getShiftHistory(params)
      setHistory(data.content || [])
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử giao ca')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, filterCompensation])

  if (!isOpen) return null

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!actionShiftId) return
    setResolving(true)
    try {
      await resolveShiftCompensation(actionShiftId, resolveNote)
      setActionShiftId(null)
      setResolveNote('')
      loadHistory()
    } catch (err) {
      alert(err.message || 'Lỗi khi xác nhận bù tiền')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-modal--history" onClick={(e) => e.stopPropagation()}>
        <div className="sh-modal-header">
          <div className="sh-modal-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3>Lịch Sử Đối Soát & Giao Ca</h3>
            <p>Nhật ký tất cả các ca làm việc, đối soát quỹ và theo dõi bù tiền</p>
          </div>
          <button type="button" className="sh-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="sh-history-toolbar">
          <div className="sh-filter-group">
            <button
              type="button"
              className={`sh-filter-pill ${filterCompensation === '' ? 'sh-filter-pill--active' : ''}`}
              onClick={() => setFilterCompensation('')}
            >
              Tất cả ca
            </button>
            <button
              type="button"
              className={`sh-filter-pill ${filterCompensation === 'PENDING' ? 'sh-filter-pill--active' : ''}`}
              onClick={() => setFilterCompensation('PENDING')}
            >
              ⚠️ Cần bù tiền
            </button>
            <button
              type="button"
              className={`sh-filter-pill ${filterCompensation === 'RESOLVED' ? 'sh-filter-pill--active' : ''}`}
              onClick={() => setFilterCompensation('RESOLVED')}
            >
              ✅ Đã bù tiền
            </button>
          </div>

          <button type="button" className="sh-btn-refresh" onClick={loadHistory} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        <div className="sh-history-body">
          {error && <div className="sh-alert sh-alert--error">{error}</div>}

          {loading ? (
            <div className="sh-modal-loading">Đang tải lịch sử giao ca...</div>
          ) : history.length === 0 ? (
            <div className="sh-empty-state">Chưa có bản ghi giao ca nào phù hợp.</div>
          ) : (
            <div className="sh-history-list">
              {history.map((s) => (
                <div key={s.id} className="sh-history-item">
                  <div className="sh-hi-top">
                    <div className="sh-hi-time">
                      <strong>{formatDateTime(s.handoverTime)}</strong>
                      <span className={`sh-hi-badge sh-hi-badge--${s.status.toLowerCase()}`}>
                        {s.status === 'ACTIVE' ? 'Đang trực' : 'Đã bàn giao'}
                      </span>
                    </div>

                    <div className="sh-hi-cash-status">
                      {s.cashStatus === 'ENOUGH' ? (
                        <span className="sh-badge-enough">✓ Đủ tiền đối soát</span>
                      ) : (
                        <span className="sh-badge-shortage">
                          ⚠️ Thiếu {formatMoney(s.shortageAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sh-hi-staffs">
                    <div className="sh-hi-staff">
                      <small>Người giao ca:</small>
                      <strong>{s.outgoingStaffName || s.outgoingStaffEmail}</strong>
                    </div>
                    <div className="sh-hi-arrow">➔</div>
                    <div className="sh-hi-staff">
                      <small>Người nhận ca:</small>
                      <strong>{s.incomingStaffName || s.incomingStaffEmail}</strong>
                    </div>
                  </div>

                  <div className="sh-hi-finance-row">
                    <div>
                      <span>Quỹ đầu ca:</span>
                      <strong>{formatMoney(s.initialCash)}</strong>
                    </div>
                    <div>
                      <span>Doanh thu ca:</span>
                      <strong>{formatMoney(s.systemCash - s.initialCash)}</strong>
                    </div>
                    <div>
                      <span>Tiền bàn giao thực tế:</span>
                      <strong>{formatMoney(s.actualCash)}</strong>
                    </div>
                  </div>

                  {s.cashStatus === 'SHORTAGE' && (
                    <div className="sh-hi-shortage-box">
                      <div>
                        <strong>Lý do thiếu:</strong> {s.shortageReason || 'Không có ghi chú'}
                      </div>
                      <div>
                        <strong>Hạn bù tiền:</strong> {formatDateTime(s.compensationDeadline)}
                      </div>
                      <div className="sh-hi-comp-status">
                        <strong>Trạng thái bù:</strong>{' '}
                        {s.compensationStatus === 'RESOLVED' ? (
                          <span className="sh-comp-resolved">
                            Đã hoàn bù ({formatDateTime(s.compensationResolvedAt)})
                            {s.compensationNotes ? ` - Ghi chú: ${s.compensationNotes}` : ''}
                          </span>
                        ) : (
                          <span className="sh-comp-pending">Chờ hoàn bù</span>
                        )}
                        {s.compensationStatus === 'PENDING' && (
                          <button
                            type="button"
                            className="sh-btn-resolve"
                            onClick={() => setActionShiftId(s.id)}
                          >
                            Xác nhận đã bù tiền
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {s.notes && (
                    <div className="sh-hi-notes">
                      <strong>Ghi chú:</strong> {s.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal xác nhận bù tiền */}
        {actionShiftId && (
          <div className="sh-sub-modal-overlay">
            <div className="sh-sub-modal">
              <h4>Xác nhận đã bù đủ tiền vào quỹ</h4>
              <p>Biên bản ca #{actionShiftId}</p>
              <form onSubmit={handleResolve}>
                <div className="sh-field">
                  <label htmlFor="sh-res-note">Ghi chú xác nhận (tùy chọn):</label>
                  <input
                    id="sh-res-note"
                    type="text"
                    className="sh-input"
                    placeholder="VD: Đã nộp đủ 200k tiền mặt vào két"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                </div>
                <div className="sh-modal-actions">
                  <button
                    type="button"
                    className="sh-btn-cancel"
                    onClick={() => setActionShiftId(null)}
                    disabled={resolving}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="sh-btn-submit" disabled={resolving}>
                    {resolving ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
