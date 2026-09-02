import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import {
  getShiftHistory,
  resolveShiftCompensation,
  getFixedFundConfig,
  updateFixedFundConfig,
} from '../../services/shiftService'
import './AdminShiftHandoversPage.css'

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

export default function AdminShiftHandoversPage() {
  const [activeTab, setActiveTab] = useState('history') // 'history' | 'fund-config'
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterCompensation, setFilterCompensation] = useState('')
  const [filterCashStatus, setFilterCashStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Modals
  const [actionShiftId, setActionShiftId] = useState(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null)

  // Cấu hình Quỹ cố định
  const [fundConfig, setFundConfig] = useState(null)
  const [fundAmountInput, setFundAmountInput] = useState('1000000')
  const [fundModeInput, setFundModeInput] = useState('FIXED')
  const [reasonInput, setReasonInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [savingFund, setSavingFund] = useState(false)
  const [fundSaveSuccess, setFundSaveSuccess] = useState('')
  const [fundSaveError, setFundSaveError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filterCompensation) params.compensationStatus = filterCompensation
      if (filterCashStatus) params.cashStatus = filterCashStatus
      if (fromDate) params.fromDate = `${fromDate}T00:00:00`
      if (toDate) params.toDate = `${toDate}T23:59:59`

      const [res, fundRes] = await Promise.all([
        getShiftHistory(params),
        getFixedFundConfig().catch(() => null),
      ])
      setShifts(res.content || [])
      if (fundRes) {
        setFundConfig(fundRes)
        setFundAmountInput(String(fundRes.fundAmount || 1000000))
        setFundModeInput(fundRes.fundMode || 'FIXED')
        setDescriptionInput(fundRes.description || '')
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đối soát giao ca')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterCompensation, filterCashStatus, fromDate, toDate])

  const handleSaveFundConfig = async (e) => {
    e.preventDefault()
    setFundSaveError('')
    setFundSaveSuccess('')

    const numAmount = parseFloat(fundAmountInput)
    if (isNaN(numAmount) || numAmount < 0) {
      setFundSaveError('Vui lòng nhập số tiền quỹ hợp lệ (>= 0 VNĐ)')
      return
    }

    setSavingFund(true)
    try {
      const updated = await updateFixedFundConfig({
        fundAmount: numAmount,
        fundMode: fundModeInput,
        reason: reasonInput,
        description: descriptionInput,
      })
      setFundConfig(updated)
      setFundSaveSuccess('Đã cập nhật cấu hình quỹ tiền mặt thành công!')
      setReasonInput('')
    } catch (err) {
      setFundSaveError(err.message || 'Không thể cập nhật cấu hình quỹ')
    } finally {
      setSavingFund(false)
    }
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!actionShiftId) return
    setResolving(true)
    try {
      await resolveShiftCompensation(actionShiftId, resolveNote)
      setActionShiftId(null)
      setResolveNote('')
      loadData()
    } catch (err) {
      alert(err.message || 'Không thể xác nhận bù tiền')
    } finally {
      setResolving(false)
    }
  }

  // Thống kê nhanh
  const totalShifts = shifts.length
  const shortageShifts = shifts.filter((s) => s.cashStatus === 'SHORTAGE')
  const pendingCompensationShifts = shifts.filter((s) => s.compensationStatus === 'PENDING')
  const totalPendingShortageMoney = pendingCompensationShifts.reduce(
    (sum, s) => sum + Number(s.shortageAmount || 0),
    0
  )

  return (
    <AdminLayout activePage="shifts">
      <div className="ash-page">
        {/* Header */}
        <div className="ash-header">
          <div>
            <h1>Quản Lý Đối Soát & Giao Ca Lễ Tân</h1>
            <p>Admin giám sát biên bản bàn giao quỹ, đối soát tiền mặt và tiến độ xử lý bù tiền</p>
          </div>
          <div className="ash-header-actions">
            <button type="button" className="ash-btn-refresh" onClick={loadData} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* Tabs chuyển đổi màn hình */}
        <div className="ash-tabs">
          <button
            type="button"
            className={`ash-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Biên Bản & Đối Soát Giao Ca
            <span className="ash-tab-badge">{totalShifts}</span>
          </button>

          <button
            type="button"
            className={`ash-tab ${activeTab === 'fund-config' ? 'active' : ''}`}
            onClick={() => setActiveTab('fund-config')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Quản Lý Quỹ Cố Định Quầy
            {fundConfig && (
              <span className="ash-tab-badge ash-tab-badge--green">
                {formatMoney(fundConfig.fundAmount)}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Lịch sử & Đối soát Giao ca */}
        {activeTab === 'history' && (
          <>
            {/* Thống kê cards */}
            <div className="ash-stats-grid">
              <div className="ash-stat-card">
                <div className="ash-stat-icon ash-stat-icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <span>Tổng số ca bàn giao</span>
                  <strong>{totalShifts} ca</strong>
                </div>
              </div>

              <div className="ash-stat-card">
                <div className="ash-stat-icon ash-stat-icon--green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <span>Ca đủ tiền đối soát</span>
                  <strong>{totalShifts - shortageShifts.length} ca</strong>
                </div>
              </div>

              <div className="ash-stat-card">
                <div className="ash-stat-icon ash-stat-icon--amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <span>Ca phát hiện thiếu tiền</span>
                  <strong>{shortageShifts.length} ca</strong>
                </div>
              </div>

              <div className="ash-stat-card">
                <div className="ash-stat-icon ash-stat-icon--rose">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <span>Tiền thiếu chờ hoàn bù</span>
                  <strong style={{ color: '#e11d48' }}>
                    {formatMoney(totalPendingShortageMoney)}
                  </strong>
                  <small style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>
                    ({pendingCompensationShifts.length} ca chưa bù)
                  </small>
                </div>
              </div>
            </div>

        {/* Toolbar bộ lọc */}
        <div className="ash-filter-toolbar">
          <div className="ash-filter-item">
            <label>Đối soát tiền:</label>
            <select
              value={filterCashStatus}
              onChange={(e) => setFilterCashStatus(e.target.value)}
              className="ash-select"
            >
              <option value="">Tất cả</option>
              <option value="ENOUGH">Đủ tiền</option>
              <option value="SHORTAGE">Thiếu tiền</option>
            </select>
          </div>

          <div className="ash-filter-item">
            <label>Trạng thái bù:</label>
            <select
              value={filterCompensation}
              onChange={(e) => setFilterCompensation(e.target.value)}
              className="ash-select"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ hoàn bù</option>
              <option value="RESOLVED">Đã hoàn bù</option>
            </select>
          </div>

          <div className="ash-filter-item">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ash-input"
            />
          </div>

          <div className="ash-filter-item">
            <label>Đến ngày:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ash-input"
            />
          </div>
        </div>

        {/* Error message */}
        {error && <div className="ash-alert ash-alert--error">{error}</div>}

        {/* Table data */}
        <div className="ash-table-container">
          {loading ? (
            <div className="ash-loading">Đang tải danh sách biên bản giao ca...</div>
          ) : shifts.length === 0 ? (
            <div className="ash-empty">Không tìm thấy biên bản giao ca nào phù hợp điều kiện lọc.</div>
          ) : (
            <table className="ash-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Thời gian giao</th>
                  <th>Người giao ca (Ca trước)</th>
                  <th>Người nhận ca (Ca sau)</th>
                  <th>Quỹ đầu ca</th>
                  <th>Doanh thu ca</th>
                  <th>Thực tế bàn giao</th>
                  <th>Kết quả đối soát</th>
                  <th>Xử lý bù tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>#{s.id}</strong>
                    </td>
                    <td>
                      <div className="ash-cell-time">
                        <span>{formatDateTime(s.handoverTime)}</span>
                        <span className={`ash-badge-status ash-badge-status--${s.status.toLowerCase()}`}>
                          {s.status === 'ACTIVE' ? 'Đang trực' : 'Đã bàn giao'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{s.outgoingStaffName || '—'}</strong>
                      <div className="ash-cell-sub">{s.outgoingStaffEmail}</div>
                    </td>
                    <td>
                      <strong>{s.incomingStaffName || '—'}</strong>
                      <div className="ash-cell-sub">{s.incomingStaffEmail}</div>
                    </td>
                    <td>{formatMoney(s.initialCash)}</td>
                    <td>{formatMoney(s.systemCash - s.initialCash)}</td>
                    <td>
                      <strong className="ash-money-actual">{formatMoney(s.actualCash)}</strong>
                    </td>
                    <td>
                      {s.cashStatus === 'ENOUGH' ? (
                        <span className="ash-badge-enough">✓ Đủ tiền</span>
                      ) : (
                        <div className="ash-shortage-cell">
                          <span className="ash-badge-shortage">
                            ⚠️ Thiếu {formatMoney(s.shortageAmount)}
                          </span>
                          <small title={s.shortageReason}>Lý do: {s.shortageReason || '—'}</small>
                          <small>Hạn: {formatDateTime(s.compensationDeadline)}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      {s.cashStatus === 'SHORTAGE' ? (
                        s.compensationStatus === 'RESOLVED' ? (
                          <div className="ash-comp-resolved">
                            <span>✅ Đã bù đủ</span>
                            <small>{formatDateTime(s.compensationResolvedAt)}</small>
                          </div>
                        ) : (
                          <div className="ash-comp-pending">
                            <span>⏳ Chờ bù tiền</span>
                            <button
                              type="button"
                              className="ash-btn-resolve-sm"
                              onClick={() => setActionShiftId(s.id)}
                            >
                              Duyệt bù tiền
                            </button>
                          </div>
                        )
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ash-btn-detail"
                        onClick={() => setSelectedShiftDetail(s)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>
        )}

        {/* Tab 2: Quản lý Quỹ Cố Định */}
        {activeTab === 'fund-config' && (
          <div className="ash-fund-config-container">
            {fundSaveSuccess && (
              <div className="ash-alert ash-alert--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{fundSaveSuccess}</span>
              </div>
            )}
            {fundSaveError && (
              <div className="ash-alert ash-alert--error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{fundSaveError}</span>
              </div>
            )}

            <div className="ash-fund-grid">
              {/* Cột trái: Form cấu hình quỹ */}
              <div className="ash-fund-card">
                <div className="ash-fund-card-header">
                  <div>
                    <h3>Cài Đặt Mức Quỹ Tiền Mặt Quầy Lễ Tân</h3>
                    <p>Quy định số tiền mặt giữ lại trong két để thối tiền cho khách</p>
                  </div>
                  <span className="ash-badge-active">Đang áp dụng</span>
                </div>

                <form onSubmit={handleSaveFundConfig}>
                  <div className="ash-field">
                    <label>Số tiền quỹ quầy (VNĐ):</label>
                    <div className="ash-fund-input-wrapper">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        className="ash-input ash-fund-amount-input"
                        value={fundAmountInput}
                        onChange={(e) => setFundAmountInput(e.target.value)}
                        placeholder="Nhập số tiền quỹ..."
                        required
                      />
                      <span className="ash-fund-currency">VNĐ</span>
                    </div>

                    <div className="ash-fund-chips">
                      <span className="ash-chip-label">Chọn nhanh:</span>
                      {[500000, 1000000, 1500000, 2000000, 3000000, 5000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`ash-chip ${Number(fundAmountInput) === amt ? 'selected' : ''}`}
                          onClick={() => setFundAmountInput(String(amt))}
                        >
                          {formatMoney(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ash-field">
                    <label>Quy tắc tính Quỹ đầu ca khi Lễ tân giao ca:</label>
                    <div className="ash-mode-radio-group">
                      <label className={`ash-mode-card ${fundModeInput === 'FIXED' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="fundMode"
                          value="FIXED"
                          checked={fundModeInput === 'FIXED'}
                          onChange={(e) => setFundModeInput(e.target.value)}
                        />
                        <div className="ash-mode-info">
                          <strong>Cố định theo mức cài đặt (Khuyên dùng)</strong>
                          <p>
                            Mỗi ca mới mở ra luôn bắt đầu bằng đúng <b>{formatMoney(fundAmountInput)}</b>.
                            Toàn bộ tiền mặt doanh thu ca trước sẽ được rút nộp về két chính/chủ homestay.
                          </p>
                        </div>
                      </label>

                      <label className={`ash-mode-card ${fundModeInput === 'ACCUMULATIVE' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="fundMode"
                          value="ACCUMULATIVE"
                          checked={fundModeInput === 'ACCUMULATIVE'}
                          onChange={(e) => setFundModeInput(e.target.value)}
                        />
                        <div className="ash-mode-info">
                          <strong>Kế thừa thực tế ca trước</strong>
                          <p>
                            Số tiền thực tế bàn giao của ca trước sẽ được chuyển giao toàn bộ làm Quỹ đầu ca cho ca sau (không rút tiền định kỳ).
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="ash-field">
                    <label>Lý do điều chỉnh quỹ (nếu thay đổi):</label>
                    <input
                      type="text"
                      className="ash-input"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      placeholder="VD: Bổ sung tiền lẻ thối cuối tuần, Giảm quỹ ngày thường..."
                    />
                  </div>

                  <div className="ash-field">
                    <label>Mô tả / Hướng dẫn thêm cho Lễ tân:</label>
                    <textarea
                      rows={2}
                      className="ash-input"
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      placeholder="Ghi chú quy định bảo quản quỹ két..."
                    />
                  </div>

                  <button type="submit" className="ash-btn-submit-fund" disabled={savingFund}>
                    {savingFund ? 'Đang lưu cấu hình...' : 'Lưu Thay Đổi Quỹ Cố Định'}
                  </button>
                </form>
              </div>

              {/* Cột phải: Info card & Audit log */}
              <div className="ash-fund-sidebar">
                <div className="ash-fund-summary-card">
                  <h4>Thông Tin Quỹ Hiện Tại</h4>
                  <div className="ash-summary-row">
                    <span>Mức quỹ đang áp dụng:</span>
                    <strong className="ash-summary-money">
                      {fundConfig ? formatMoney(fundConfig.fundAmount) : '1.000.000đ'}
                    </strong>
                  </div>
                  <div className="ash-summary-row">
                    <span>Cơ chế quỹ đầu ca:</span>
                    <span className="ash-summary-tag">
                      {fundConfig?.fundMode === 'FIXED' ? 'Cố định mỗi ca' : 'Kế thừa ca trước'}
                    </span>
                  </div>
                  <div className="ash-summary-row">
                    <span>Người cập nhật:</span>
                    <span>{fundConfig?.updatedByName || 'Admin'}</span>
                  </div>
                  <div className="ash-summary-row">
                    <span>Thời gian cập nhật:</span>
                    <span>{formatDateTime(fundConfig?.updatedAt)}</span>
                  </div>
                </div>

                {/* Nhật ký thay đổi */}
                <div className="ash-fund-logs-card">
                  <h4>Lịch Sử Điều Chỉnh Quỹ</h4>
                  {fundConfig?.adjustmentLogs && fundConfig.adjustmentLogs.length > 0 ? (
                    <div className="ash-logs-list">
                      {fundConfig.adjustmentLogs.map((log) => (
                        <div key={log.id} className="ash-log-item">
                          <div className="ash-log-header">
                            <span className="ash-log-time">{formatDateTime(log.adjustedAt)}</span>
                            <span className="ash-log-author">{log.adjustedByName}</span>
                          </div>
                          <div className="ash-log-diff">
                            {log.oldAmount !== null && (
                              <span className="ash-old-amt">{formatMoney(log.oldAmount)}</span>
                            )}
                            {log.oldAmount !== null && <span className="ash-arrow">→</span>}
                            <span className="ash-new-amt">{formatMoney(log.newAmount)}</span>
                          </div>
                          {log.reason && <p className="ash-log-reason">“{log.reason}”</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ash-no-logs">Chưa có lần điều chỉnh quỹ nào</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal chi tiết biên bản */}
        {selectedShiftDetail && (
          <div className="ash-sub-modal-overlay" onClick={() => setSelectedShiftDetail(null)}>
            <div className="ash-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ash-detail-head">
                <h3>Biên bản đối soát giao ca #{selectedShiftDetail.id}</h3>
                <button
                  type="button"
                  className="ash-close-btn"
                  onClick={() => setSelectedShiftDetail(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ash-detail-body">
                <div className="ash-detail-row">
                  <span>Thời gian bàn giao:</span>
                  <strong>{formatDateTime(selectedShiftDetail.handoverTime)}</strong>
                </div>
                <div className="ash-detail-row">
                  <span>Người giao ca (Ca trước):</span>
                  <strong>
                    {selectedShiftDetail.outgoingStaffName} ({selectedShiftDetail.outgoingStaffEmail})
                  </strong>
                </div>
                <div className="ash-detail-row">
                  <span>Người nhận ca (Ca sau):</span>
                  <strong>
                    {selectedShiftDetail.incomingStaffName} ({selectedShiftDetail.incomingStaffEmail})
                  </strong>
                </div>
                <div className="ash-detail-row">
                  <span>Quỹ tiền mặt đầu ca:</span>
                  <strong>{formatMoney(selectedShiftDetail.initialCash)}</strong>
                </div>
                <div className="ash-detail-row">
                  <span>Doanh thu tiền mặt hệ thống ghi nhận:</span>
                  <strong>{formatMoney(selectedShiftDetail.systemCash - selectedShiftDetail.initialCash)}</strong>
                </div>
                <div className="ash-detail-row">
                  <span>Tổng tiền mặt hệ thống dự kiến:</span>
                  <strong>{formatMoney(selectedShiftDetail.systemCash)}</strong>
                </div>
                <div className="ash-detail-row">
                  <span>Tiền mặt thực tế đếm được khi bàn giao:</span>
                  <strong style={{ color: '#0284c7', fontSize: '16px' }}>
                    {formatMoney(selectedShiftDetail.actualCash)}
                  </strong>
                </div>
                <div className="ash-detail-row">
                  <span>Kết quả đối soát:</span>
                  <strong>
                    {selectedShiftDetail.cashStatus === 'ENOUGH'
                      ? 'Đủ tiền'
                      : `Thiếu ${formatMoney(selectedShiftDetail.shortageAmount)}`}
                  </strong>
                </div>

                {selectedShiftDetail.cashStatus === 'SHORTAGE' && (
                  <div className="ash-detail-shortage-box">
                    <div>
                      <strong>Lý do thiếu:</strong> {selectedShiftDetail.shortageReason || '—'}
                    </div>
                    <div>
                      <strong>Thời hạn cam kết bù:</strong>{' '}
                      {formatDateTime(selectedShiftDetail.compensationDeadline)}
                    </div>
                    <div>
                      <strong>Tình trạng bù tiền:</strong>{' '}
                      {selectedShiftDetail.compensationStatus === 'RESOLVED'
                        ? `Đã hoàn bù (${formatDateTime(selectedShiftDetail.compensationResolvedAt)})`
                        : 'Chưa bù (Đang chờ)'}
                    </div>
                    {selectedShiftDetail.compensationNotes && (
                      <div>
                        <strong>Ghi chú duyệt bù:</strong> {selectedShiftDetail.compensationNotes}
                      </div>
                    )}
                  </div>
                )}

                {selectedShiftDetail.notes && (
                  <div className="ash-detail-row">
                    <span>Ghi chú bàn giao thêm:</span>
                    <p style={{ margin: 0 }}>{selectedShiftDetail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal duyệt bù tiền */}
        {actionShiftId && (
          <div className="ash-sub-modal-overlay" onClick={() => setActionShiftId(null)}>
            <div className="ash-sub-modal" onClick={(e) => e.stopPropagation()}>
              <h4>Admin duyệt đã hoàn bù tiền vào quỹ</h4>
              <p>Biên bản ca #{actionShiftId}</p>
              <form onSubmit={handleResolve}>
                <div className="ash-field">
                  <label htmlFor="ash-res-note">Ghi chú xác nhận của Admin:</label>
                  <input
                    id="ash-res-note"
                    type="text"
                    className="ash-input"
                    placeholder="VD: Đã kiểm tra két, nhân viên đã nộp đủ tiền thiếu"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                </div>
                <div className="ash-modal-actions">
                  <button
                    type="button"
                    className="ash-btn-cancel"
                    onClick={() => setActionShiftId(null)}
                    disabled={resolving}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="ash-btn-submit" disabled={resolving}>
                    {resolving ? 'Đang duyệt...' : 'Xác nhận đã bù'}
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
