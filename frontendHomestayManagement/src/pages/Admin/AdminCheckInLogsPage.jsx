import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { useShiftGuard } from '../../context/ShiftGuardContext'
import { formatClockTime, formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import { houseTypeName } from '../../utils/houseType'
import SePayQrPayment from '../../components/SePayQrPayment/SePayQrPayment'
import AdminLayout from './AdminLayout'
import AdminChangeRoomModal from '../../components/AdminChangeRoom/AdminChangeRoomModal'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import { calculateStayOverdueInfo } from '../../utils/stayOverdue'
import './AdminCheckInLogsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/bookings'

const CHECKOUT_PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Tiền mặt', description: 'Thu trực tiếp tại quầy' },
  { value: 'CARD', label: 'Thẻ', description: 'Quẹt máy POS rồi ghi nhận' },
  { value: 'QR', label: 'QR', description: 'Tạo mã SePay tự động' },
]

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function authUploadHeaders() {
  return { Authorization: `Bearer ${getStoredToken()}` }
}

function parseMoneyInput(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function toDateInputValue(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayRange(refDate = new Date()) {
  const date = new Date(refDate)
  return {
    from: toDateInputValue(date),
    to: toDateInputValue(date),
  }
}

function getWeekRange(refDate = new Date()) {
  const date = new Date(refDate)
  const pastWeek = new Date(date)
  pastWeek.setDate(date.getDate() - 7)
  return {
    from: toDateInputValue(pastWeek),
    to: toDateInputValue(date),
  }
}

function getMonthRange(refDate = new Date()) {
  const date = new Date(refDate)
  const pastMonth = new Date(date)
  pastMonth.setDate(date.getDate() - 30)
  return {
    from: toDateInputValue(pastMonth),
    to: toDateInputValue(date),
  }
}

function getYearRange(refDate = new Date()) {
  const date = new Date(refDate)
  const firstDay = new Date(date.getFullYear(), 0, 1)
  return {
    from: toDateInputValue(firstDay),
    to: toDateInputValue(date),
  }
}

function defaultFromDate() {
  return getWeekRange().from
}

function defaultToDate() {
  return getWeekRange().to
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function parseDateString(dateStr) {
  if (!dateStr) return null
  if (typeof dateStr !== 'string') dateStr = String(dateStr)
  dateStr = dateStr.trim()
  if (!dateStr) return null

  // Match YYYY-MM-DD or YYYY/MM/DD
  let match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) {
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const day = parseInt(match[3], 10)
    return new Date(year, month, day)
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = parseInt(match[3], 10)
    return new Date(year, month, day)
  }

  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

function calculateAge(dateOfBirth) {
  const dob = parseDateString(dateOfBirth)
  if (!dob) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

function toIsoDateString(dateStr) {
  const dob = parseDateString(dateStr)
  if (!dob) return dateStr || ''
  const yyyy = dob.getFullYear()
  const mm = String(dob.getMonth() + 1).padStart(2, '0')
  const dd = String(dob.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
  }
  return labels[String(status || '').toUpperCase()] || status || 'Chưa rõ'
}

function rentTypeLabel(rentType) {
  const labels = {
    HOURLY: 'Theo giờ',
    BY_HOUR: 'Theo giờ',
    DAILY: 'Theo ngày',
    BY_DAY: 'Theo ngày',
    NIGHTLY: 'Theo đêm',
    BY_NIGHT: 'Theo đêm',
  }
  return labels[String(rentType || '').toUpperCase()] || rentType || 'Chưa rõ'
}

function detailStage(detail) {
  if (detail.checkInRecord?.actualCheckOut) return 'completed'
  if (detail.checkInRecord?.actualCheckIn) return 'staying'
  if (String(detail.detailStatus || '').toUpperCase() === 'CANCELLED') return 'cancelled'
  if (detail.checkOutTarget && new Date(detail.checkOutTarget).getTime() < Date.now()) return 'overdue_noshow'
  return 'waiting'
}

function stageLabel(stage) {
  return {
    waiting: 'Chưa check-in',
    overdue_noshow: 'Quá giờ trả phòng',
    staying: 'Đang lưu trú',
    completed: 'Đã trả phòng',
    cancelled: 'Đã hủy',
  }[stage] || stage
}

function bookingMatches(booking, keyword) {
  if (!keyword) return true
  const customer = booking.customer || {}
  const haystack = [
    booking.bookingId,
    booking.bookingCode,
    booking.bookingStatus,
    customer.fullName,
    customer.phone,
    customer.email,
    ...booking.details.flatMap(detail => [
      detail.roomNumber,
      detail.roomTypeName,
      detail.detailStatus,
      detail.bookingDetailId,
    ]),
  ].join(' ').toLowerCase()
  return haystack.includes(keyword)
}

function bookingHasStatus(booking, status) {
  if (!status) return true
  return booking.details.some(detail => detailStage(detail) === status)
}

function BookingListItem({ booking, active, onSelect }) {
  const customer = booking.customer || {}
  const progress = booking.totalDetails ? Math.round((booking.checkedInDetails / booking.totalDetails) * 100) : 0
  const isCompleted = String(booking.bookingStatus || '').toUpperCase() === 'COMPLETED'
    || (booking.totalDetails > 0 && booking.completedDetails === booking.totalDetails)
  const totalExtHours = booking.details.reduce((sum, d) => sum + (Number(d.extensionHours) || 0), 0)

  return (
    <button type="button" className={`acl-booking${active ? ' acl-booking--active' : ''}`} onClick={onSelect}>
      <span className="acl-booking-top">
        <strong>Booking {bookingDisplay(booking)}</strong>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {totalExtHours > 0 && (
            <span className="acl-booking-extend-pill" title={`Khách đã thuê thêm ${totalExtHours} giờ`}>
              +{totalExtHours}h
            </span>
          )}
          <span className={`acl-pill acl-pill--${String(booking.bookingStatus || '').toLowerCase()}`}>
            {statusLabel(booking.bookingStatus)}
          </span>
        </div>
      </span>
      <span className="acl-booking-customer">{customer.fullName || 'Khách chưa có tên'}</span>
      <span className="acl-booking-meta">
        <span>{booking.totalDetails} phòng</span>
        <span>{formatMoney(booking.totalAmount)}</span>
      </span>
      <span className={`acl-progress${isCompleted ? ' acl-progress--completed' : ''}`} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </span>
    </button>
  )
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`acl-summary-card${tone ? ` acl-summary-card--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function resolveEvidenceUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  const apiBase = import.meta.env.VITE_API_URL || ''
  if (url.startsWith('/')) return `${apiBase}${url}`
  return `${apiBase}/${url}`
}

function DetailCard({ detail, actionLoading, housekeepingRequested, onAction }) {
  const stage = detailStage(detail)
  const isCompleted = stage === 'completed'
  const isOverdueNoShow = stage === 'overdue_noshow'
  const canCheckIn = stage === 'waiting'
  const canCheckOut = stage === 'staying'
  const loading = actionLoading === detail.bookingDetailId
  const extHours = Number(detail.extensionHours || 0)
  const overdueInfo = calculateStayOverdueInfo(detail.checkOutTarget, detail.checkInRecord, detail.detailStatus || (stage === 'staying' ? 'CHECKED_IN' : ''))

  const [showDetailModal, setShowDetailModal] = useState(false)

  return (
    <article className={`acl-detail acl-detail--${stage} acl-detail-compact`}>
      <div className="acl-detail-compact-top">
        <div className="acl-room-badge-compact">
          <span className="acl-room-num">{detail.roomNumber ? `P.${detail.roomNumber}` : 'Chưa gán'}</span>
          <span className="acl-room-type">{houseTypeName(detail, 'Phòng')}</span>
        </div>
        <div className="acl-compact-status-group">
          <span className={`acl-stage acl-stage--${stage}`}>{stageLabel(stage)}</span>
          {stage === 'staying' && overdueInfo.isOverdue && (
            <span className="acl-stay-overdue-tag" title={overdueInfo.message}>
              ⚠️ {overdueInfo.shortBadge}
            </span>
          )}
          <span className="acl-tag-rent">{rentTypeLabel(detail.rentType)}</span>
          <span className="acl-tag-price">{formatMoney(detail.priceAtBooking)}</span>
        </div>
      </div>

      <div className="acl-detail-compact-body">
        <div className="acl-compact-schedule-row">
          <div className="acl-schedule-item">
            <span className="acl-schedule-lbl"> Nhận:</span>
            <strong>{formatAppDateTime(detail.checkInTarget)}</strong>
          </div>
          <span className="acl-schedule-arrow">→</span>
          <div className="acl-schedule-item">
            <span className="acl-schedule-lbl">Trả:</span>
            <strong style={extHours > 0 ? { color: '#ea580c' } : {}}>
              {formatAppDateTime(detail.checkOutTarget)}
              {extHours > 0 && <span className="acl-extend-pill">+{extHours}h</span>}
            </strong>
          </div>
        </div>

        <div className="acl-compact-meta-row">
          <span> {detail.numberOfAdults || 1} người lớn{detail.numberOfChildren ? ` · ${detail.numberOfChildren} trẻ em` : ''}</span>
          {detail.checkInRecord?.actualCheckIn && (
            <span className="acl-meta-check-time">✓ Check-in: {formatAppDateTime(detail.checkInRecord.actualCheckIn)}</span>
          )}
          {detail.checkInRecord?.actualCheckOut && (
            <span className="acl-meta-check-time">✓ Check-out: {formatAppDateTime(detail.checkInRecord.actualCheckOut)}</span>
          )}
        </div>
      </div>

      <div className="acl-detail-compact-actions">
        <button
          type="button"
          className="acl-btn-open-modal"
          onClick={() => setShowDetailModal(true)}
        >
           Xem chi tiết lưu trú
        </button>

        <div className="acl-compact-action-btns">
          {isOverdueNoShow && (
            <span className="acl-badge-overdue" title="Đơn đặt phòng này đã quá giờ trả phòng. Không thể thực hiện check-in.">
              ⚠️ Đã quá giờ trả phòng, không thể check-in
            </span>
          )}

          {canCheckOut && (
            <button
              type="button"
              className="acl-btn-changeroom"
              disabled={loading}
              title="Đổi sang phòng cùng loại hoặc loại khác"
              style={{ borderColor: '#0284c7', color: '#0284c7', background: '#f0f9ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => onAction(detail.bookingDetailId, 'change-room')}
            >
              Đổi phòng
            </button>
          )}

          {canCheckIn && (
            <button
              type="button"
              className="acl-btn-checkin"
              disabled={loading}
              onClick={() => onAction(detail.bookingDetailId, 'check-in')}
            >
              {loading ? 'Đang xử lý...' : 'Check-in'}
            </button>
          )}

          {canCheckOut && (
            <>
              <button
                type="button"
                className="acl-btn-add-service"
                disabled={loading}
                title="Ghi thêm nước uống hoặc dịch vụ phát sinh vào hóa đơn"
                onClick={() => onAction(detail.bookingDetailId, 'add-service')}
              >
                + Thêm nước / DV
              </button>
              <button
                type="button"
                className="acl-btn-housekeeping"
                disabled={loading || housekeepingRequested}
                onClick={() => onAction(detail.bookingDetailId, 'housekeeping-request')}
              >
                {loading ? 'Đang gửi...' : housekeepingRequested ? 'Đã yêu cầu KT' : 'Yêu cầu KT'}
              </button>
              <button
                type="button"
                className={`acl-btn-checkout ${detail.housekeepingInspectionCompleted ? 'is-ready' : 'is-disabled'}`}
                disabled={loading || !detail.housekeepingInspectionCompleted}
                title={!detail.housekeepingInspectionCompleted ? 'Chờ housekeeping gửi chi phí kiểm tra phòng' : 'Phòng đã kiểm tra xong, sẵn sàng check-out'}
                onClick={() => onAction(detail.bookingDetailId, 'check-out')}
              >
                {loading ? 'Đang xử lý...' : detail.housekeepingInspectionCompleted ? ' Check-out' : 'Check-out'}
              </button>
            </>
          )}

          {isCompleted && (
            <span className="acl-completed-badge-text">
              ✓ Đã hoàn tất trả phòng
            </span>
          )}
        </div>
      </div>

      {showDetailModal && (
        <StayDetailModal
          detail={detail}
          stage={stage}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </article>
  )
}

function StayDetailModal({ detail, stage, onClose }) {
  const [detailData, setDetailData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const extHours = Number(detail.extensionHours || 0)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/details/${detail.bookingDetailId}`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.bookingDetailId) {
          setDetailData(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [detail.bookingDetailId])

  return (
    <div className="acl-modal-overlay" onClick={onClose}>
      <div className="acl-stay-modal-box" onClick={e => e.stopPropagation()}>
        <div className="acl-stay-modal-header">
          <div className="acl-stay-modal-title">
            <span className="acl-stay-modal-badge">
              {detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'}
            </span>
            <h3>Chi tiết Lưu trú & Đơn Booking #{detail.bookingDetailId}</h3>
            <span className={`acl-stage acl-stage--${stage}`}>{stageLabel(stage)}</span>
          </div>
          <button type="button" className="acl-stay-modal-close" onClick={onClose}></button>
        </div>

        <div className="acl-stay-modal-body">
          {loading && (
            <div className="acl-detail-expand-loading">
              <div className="acl-spinner" /> Đang tải dữ liệu chi tiết lưu trú & hoá đơn...
            </div>
          )}

          {/* Block 1: Thông tin phòng & khách */}
          <div className="acl-modal-section">
            <h4 className="acl-modal-sec-title"> Thông tin Phòng & Đặt phòng</h4>
            <div className="acl-modal-grid-3">
              <div className="acl-modal-cell">
                <span>Loại phòng:</span>
                <strong>{houseTypeName(detail, 'Chưa phân loại')}</strong>
              </div>
              <div className="acl-modal-cell">
                <span>Gói thuê:</span>
                <strong>{rentTypeLabel(detail.rentType)}</strong>
              </div>
              <div className="acl-modal-cell">
                <span>Số lượng khách:</span>
                <strong>{detail.numberOfAdults || 1} người lớn · {detail.numberOfChildren || 0} trẻ em</strong>
              </div>
              <div className="acl-modal-cell">
                <span>Giá phòng tại lúc đặt:</span>
                <strong>{formatMoney(detail.priceAtBooking)}</strong>
              </div>
              {detailData?.customer && (
                <>
                  <div className="acl-modal-cell">
                    <span>Khách đại diện:</span>
                    <strong>{detailData.customer.fullName || '—'}</strong>
                  </div>
                  <div className="acl-modal-cell">
                    <span>Số điện thoại:</span>
                    <strong>{detailData.customer.phone || '—'}</strong>
                  </div>
                  <div className="acl-modal-cell">
                    <span>CCCD/Hộ chiếu:</span>
                    <strong>{detailData.customer.identityDocumentNumber || '—'}</strong>
                  </div>
                  <div className="acl-modal-cell">
                    <span>Email:</span>
                    <strong>{detailData.customer.email || '—'}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Block 2: Quá trình Lưu trú Timeline */}
          <div className="acl-modal-section">
            <h4 className="acl-modal-sec-title">️ Quá trình & Thời gian Lưu trú</h4>
            <div className="acl-modal-grid-4">
              <div className="acl-modal-cell">
                <span>Nhận phòng dự kiến</span>
                <strong>{formatAppDateTime(detail.checkInTarget)}</strong>
              </div>
              <div className="acl-modal-cell">
                <span>Trả phòng dự kiến</span>
                <strong style={extHours > 0 ? { color: '#c2410c' } : {}}>
                  {formatAppDateTime(detail.checkOutTarget)}
                  {extHours > 0 && <span className="acl-extend-tag"> (+{extHours}h thuê thêm)</span>}
                </strong>
              </div>
              <div className="acl-modal-cell acl-modal-cell--actual">
                <span>Check-in thực tế</span>
                <strong style={{ color: '#16a34a' }}>
                  {formatAppDateTime(detail.checkInRecord?.actualCheckIn) || 'Chưa thực hiện'}
                </strong>
              </div>
              <div className="acl-modal-cell acl-modal-cell--actual">
                <span>Check-out thực tế</span>
                <strong style={{ color: '#0284c7' }}>
                  {formatAppDateTime(detail.checkInRecord?.actualCheckOut) || 'Chưa thực hiện'}
                </strong>
              </div>
            </div>
          </div>

          {/* Block 3: Dịch vụ & Nước uống phát sinh */}
          {detailData?.serviceItems && detailData.serviceItems.length > 0 && (
            <div className="acl-modal-section">
              <h4 className="acl-modal-sec-title"> Dịch vụ & Đồ uống phát sinh</h4>
              <div className="acl-modal-table-box">
                <table className="acl-modal-table">
                  <thead>
                    <tr>
                      <th>Dịch vụ / Sản phẩm</th>
                      <th style={{ textAlign: 'center' }}>Số lượng</th>
                      <th style={{ textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.serviceItems.map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.serviceName || s.name}</td>
                        <td style={{ textAlign: 'center' }}>×{s.quantity || 1}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoney(s.unitPrice || s.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney((s.quantity || 1) * (s.unitPrice || s.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Block 4: Báo cáo sự cố & Hỏng hóc */}
          {((detailData?.incidents && detailData.incidents.length > 0) || (detailData?.penaltyItems && detailData.penaltyItems.some(p => p.description?.includes('Bồi thường sự cố') || p.title?.includes('Bồi thường')))) && (
            <div className="acl-modal-section acl-incidents-modal-sec">
              <h4 className="acl-modal-sec-title" style={{ color: '#dc2626' }}>️ Báo Cáo Sự Cố & Đồ Hỏng / Mất Trong Phòng</h4>
              <div className="acl-incident-cards-grid">
                {(detailData.incidents && detailData.incidents.length > 0 ? detailData.incidents : detailData.penaltyItems.filter(p => p.description?.includes('Bồi thường sự cố') || p.title?.includes('Bồi thường')).map(p => ({
                  id: p.id,
                  itemName: p.description?.replace(/^Bồi thường sự cố\s*#\d+:\s*/, '') || p.title,
                  compensationAmount: p.amount,
                  status: 'RESOLVED',
                }))).map((inc, idx) => (
                  <div key={idx} className="acl-incident-item-card">
                    <div className="acl-incident-item-info">
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {inc.itemName || 'Đồ vật sự cố'}
                        {inc.quantity && <span style={{ color: '#64748b', fontWeight: 400 }}> × {inc.quantity}</span>}
                      </div>
                      {inc.description && <p style={{ fontSize: 12, color: '#475569', margin: '4px 0' }}>{inc.description}</p>}
                      <div className="acl-incident-item-sub">
                        <span className="acl-liability-tag">Bồi thường: <strong>{formatMoney(inc.compensationAmount)}</strong></span>
                        <span className="acl-status-tag">{inc.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đang xử lý'}</span>
                      </div>
                    </div>
                    {inc.evidenceImageUrl && (
                      <div className="acl-incident-thumb" onClick={() => setPreviewImage(resolveEvidenceUrl(inc.evidenceImageUrl))} title="Bấm để xem ảnh phóng to">
                        <img src={resolveEvidenceUrl(inc.evidenceImageUrl)} alt={inc.itemName} />
                        <span> Phóng to</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Block 5: Quyết toán hoá đơn */}
          {detailData?.invoice && (
            <div className="acl-modal-section acl-billing-modal-sec">
              <h4 className="acl-modal-sec-title"> Quyết Toán Hoá Đơn</h4>
              <div className="acl-billing-rows">
                <div className="acl-billing-row">
                  <span>Tiền phòng lưu trú:</span>
                  <strong>{formatMoney(detailData.invoice?.roomCharge || detail.priceAtBooking)}</strong>
                </div>
                {detailData.serviceItems && detailData.serviceItems.length > 0 && (
                  <div className="acl-billing-row">
                    <span>Phí dịch vụ & đồ uống phát sinh ({detailData.serviceItems.length} mục):</span>
                    <strong>+{formatMoney(detailData.invoice?.serviceCharge || 0)}</strong>
                  </div>
                )}
                {Number(detailData.extensionAmount || 0) > 0 && (
                  <div className="acl-billing-row">
                    <span>Phí thuê thêm giờ (+{detailData.extensionHours}h):</span>
                    <strong>+{formatMoney(detailData.extensionAmount)}</strong>
                  </div>
                )}
                {Number(detailData.invoice?.penaltyCharge || 0) > 0 && (
                  <div className="acl-billing-row" style={{ color: '#dc2626' }}>
                    <span>Bồi thường đồ hỏng/mất & phụ thu:</span>
                    <strong>+{formatMoney(detailData.invoice?.penaltyCharge)}</strong>
                  </div>
                )}
                <div className="acl-billing-row acl-billing-row--total">
                  <span>Tổng quyết toán hoá đơn:</span>
                  <strong>{formatMoney(detailData.invoice?.totalAmount || detail.priceAtBooking)}</strong>
                </div>
                <div className="acl-billing-row acl-billing-row--paid">
                  <span>Đã thanh toán:</span>
                  <strong>{formatMoney(detailData.paidAmount || detailData.invoice?.totalAmount || detail.priceAtBooking)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="acl-stay-modal-footer">
          <button type="button" className="acl-btn-modal-close" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {previewImage && (
        <div className="acl-image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="acl-image-preview-box" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Ảnh bằng chứng sự cố" />
            <button type="button" className="acl-btn-close-preview" onClick={() => setPreviewImage(null)}> Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}

function createGuestForms(preparation) {
  if (preparation.preRegistered && preparation.registeredGuests?.length) {
    return preparation.registeredGuests.map(guest => ({
      fullName: guest.fullName || '',
      identityDocumentNumber: guest.identityDocumentNumber || '',
      dateOfBirth: toIsoDateString(guest.dateOfBirth) || '',
      email: guest.email || '',
      phone: guest.phone || '',
      address: guest.address || '',
      gender: guest.gender || '',
      nationality: guest.nationality || 'VIETNAM',
    }))
  }
  const total = Number(preparation.numberOfAdults || 0) + Number(preparation.numberOfChildren || 0)
  return Array.from({ length: total }, (_, index) => ({
    fullName: index === 0 ? preparation.customer?.fullName || '' : '',
    identityDocumentNumber: index === 0 ? preparation.customerIdentityDocumentNumber || '' : '',
    dateOfBirth: index === 0 ? toIsoDateString(preparation.customer?.dateOfBirth) || '' : '',
    email: index === 0 ? preparation.customer?.email || '' : '',
    phone: index === 0 ? preparation.customer?.phone || '' : '',
    address: index === 0 ? preparation.customer?.address || '' : '',
    gender: index === 0 ? preparation.customer?.gender || '' : '',
    nationality: 'VIETNAM',
  }))
}

function IdentityCameraModal({ title, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraError, setCameraError] = useState('')
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let active = true
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ chụp ảnh trực tiếp')
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        if (active) setCameraError(err.message || 'Không thể mở camera')
      } finally {
        if (active) setStarting(false)
      }
    }

    startCamera()
    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera chưa sẵn sàng để chụp')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) {
        setCameraError('Không thể tạo ảnh từ camera')
        return
      }
      const file = new File([blob], `cccd-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
      onClose()
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="acl-camera-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="acl-camera-modal" role="dialog" aria-modal="true" aria-labelledby="acl-camera-title">
        <header className="acl-camera-head">
          <div>
            <span>Chụp căn cước</span>
            <h3 id="acl-camera-title">{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </header>
        <div className="acl-camera-frame">
          {cameraError ? (
            <div className="acl-camera-error">{cameraError}</div>
          ) : (
            <>
              {starting && <div className="acl-camera-loading">Đang mở camera...</div>}
              <video ref={videoRef} playsInline muted />
              <div className="acl-camera-guide" aria-hidden="true" />
            </>
          )}
        </div>
        <footer className="acl-camera-actions">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="button" onClick={capture} disabled={starting || Boolean(cameraError)}>
            Chụp ảnh
          </button>
        </footer>
      </section>
    </div>
  )
}

function QuickAddServiceModal({ bookingDetailId, onClose, onCompleted }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [itemType, setItemType] = useState('MINI_BAR')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetch(`${API_BASE}/details/${bookingDetailId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookingDetailId])

  const handleAdd = async () => {
    if (!selectedItemId) return
    setSaving(true)
    setError('')
    try {
      let response
      if (itemType === 'MINI_BAR') {
        response = await fetch(`${API_BASE}/details/${bookingDetailId}/mini-bar`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: Number(selectedItemId), quantity: Number(quantity) || 1 }),
        })
      } else {
        response = await fetch(`${API_BASE}/details/${bookingDetailId}/services`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: Number(selectedItemId), quantity: Number(quantity) || 1, type: 'FACILITY' }),
        })
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể thêm dịch vụ/nước uống')
      setDetail(data)
      setSelectedItemId('')
      setQuantity(1)
      if (onCompleted) await onCompleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (item) => {
    if (!window.confirm(`Xóa mục "${item.name}" khỏi hóa đơn?`)) return
    setSaving(true)
    setError('')
    try {
      const endpoint = item.type === 'MINI_BAR' ? 'mini-bar' : 'services'
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/${endpoint}/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể xóa mục')
      setDetail(data)
      if (onCompleted) await onCompleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="aco-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <section className="aco-modal" style={{ maxWidth: 540 }} role="dialog" aria-modal="true">
        <header className="aco-header">
          <div className="aco-header-label">Thêm Dịch Vụ & Nước Uống</div>
          <div className="aco-header-body">
            <div>
              <h2>{detail ? `Phòng ${detail.roomNumber || ''} · ${detail.customer?.fullName || ''}` : 'Đang tải...'}</h2>
              <p>Ghi nhận nước uống, snack minibar hoặc dịch vụ thêm thẳng vào hóa đơn phòng</p>
            </div>
            <button type="button" className="aco-close" onClick={onClose}>×</button>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Đang tải danh mục...</div>
        ) : (
          <div style={{ padding: '16px 24px' }}>
            {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', borderColor: itemType === 'MINI_BAR' ? '#166534' : '#cbd5e1', background: itemType === 'MINI_BAR' ? '#ecfdf5' : '#fff', color: itemType === 'MINI_BAR' ? '#166534' : '#64748b', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { setItemType('MINI_BAR'); setSelectedItemId('') }}
              >
                 Nước & Minibar
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid', borderColor: itemType === 'FACILITY' ? '#166534' : '#cbd5e1', background: itemType === 'FACILITY' ? '#ecfdf5' : '#fff', color: itemType === 'FACILITY' ? '#166534' : '#64748b', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { setItemType('FACILITY'); setSelectedItemId('') }}
              >
                ️ Dịch Vụ Tiện Ích
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                style={{ flex: 1, padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                <option value="">{itemType === 'MINI_BAR' ? '-- Chọn đồ uống / snack minibar --' : '-- Chọn dịch vụ tiện ích --'}</option>
                {itemType === 'MINI_BAR'
                  ? detail?.miniBarItems?.map(it => <option key={it.id} value={it.id}>{it.name} ({formatMoney(it.price)})</option>)
                  : detail?.facilityServices?.map(it => <option key={it.id} value={it.id}>{it.name} ({formatMoney(it.price)})</option>)}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                style={{ width: 60, padding: '9px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, textAlign: 'center' }}
              />
              <button
                type="button"
                disabled={!selectedItemId || saving}
                onClick={handleAdd}
                style={{ padding: '9px 16px', background: '#166534', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !selectedItemId || saving ? 0.6 : 1 }}
              >
                {saving ? 'Đang thêm...' : '+ Ghi vào HĐ'}
              </button>
            </div>

            {/* Danh sách các dịch vụ & minibar đã ghi nhận vào hóa đơn */}
            <h4 style={{ fontSize: 13, color: '#334155', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Danh sách đã ghi nhận trên hóa đơn ({detail?.serviceItems?.length || 0})
            </h4>
            {(!detail?.serviceItems || detail.serviceItems.length === 0) ? (
              <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>
                Chưa có dịch vụ hoặc nước uống nào được ghi nhận.
              </div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                {detail.serviceItems.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: idx < detail.serviceItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>{it.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>SL: {it.quantity} × {formatMoney(it.unitPrice)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 13, color: '#166534' }}>{formatMoney(it.totalPrice)}</strong>
                      {it.id && (
                        <button
                          type="button"
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 12, cursor: 'pointer' }}
                          title="Xóa mục này"
                          onClick={() => handleRemove(it)}
                        >
                          
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <footer className="aco-footer">
          <button type="button" className="aco-btn-cancel" onClick={onClose}>Đóng</button>
        </footer>
      </section>
    </div>
  )
}

function CheckOutModal({ bookingDetailId, onClose, onCompleted }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [payment, setPayment] = useState(null)
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('QR')
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [cashDialogOpen, setCashDialogOpen] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [cashError, setCashError] = useState('')
  const [error, setError] = useState('')
  const [showAddService, setShowAddService] = useState(false)
  const [itemType, setItemType] = useState('MINI_BAR')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [serviceQty, setServiceQty] = useState(1)
  const [savingService, setSavingService] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/details/${bookingDetailId}`, {
      headers: authHeaders(), signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể tải chi tiết đơn đặt phòng')
        setDetail(data)
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [bookingDetailId])

  const handleAddServiceItem = async () => {
    if (!selectedItemId) return
    setSavingService(true)
    setError('')
    try {
      let response
      if (itemType === 'MINI_BAR') {
        response = await fetch(`${API_BASE}/details/${bookingDetailId}/mini-bar`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: Number(selectedItemId), quantity: Number(serviceQty) || 1 }),
        })
      } else {
        response = await fetch(`${API_BASE}/details/${bookingDetailId}/services`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: Number(selectedItemId), quantity: Number(serviceQty) || 1, type: 'FACILITY' }),
        })
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể thêm nước uống/dịch vụ')
      setDetail(data)
      setSelectedItemId('')
      setServiceQty(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingService(false)
    }
  }

  const handleRemoveServiceItem = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${item.name}" khỏi hóa đơn?`)) return
    setSavingService(true)
    setError('')
    try {
      const endpoint = item.type === 'MINI_BAR' ? 'mini-bar' : 'services'
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/${endpoint}/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể xóa dịch vụ')
      setDetail(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingService(false)
    }
  }

  const submitCheckout = async (counterPaymentMethod) => {
    setCheckingOut(true)
    setError('')
    try {
      const useCounterPayment = Boolean(counterPaymentMethod)
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/${useCounterPayment ? 'checkout-payment' : 'prepare-check-out'}`, {
        method: 'POST',
        headers: authHeaders(),
        ...(useCounterPayment ? { body: JSON.stringify({ paymentMethod: counterPaymentMethod }) } : {}),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể thực hiện check-out')
      if (data.completed) {
        await onCompleted()
      } else {
        setDetail(data.booking)
        setPayment(data.payment)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  const handleCheckOut = async () => {
    if (remaining > 0 && checkoutPaymentMethod === 'CASH') {
      setCashReceived('')
      setCashError('')
      setCashDialogOpen(true)
      return
    }
    const counterPaymentMethod = remaining > 0 && checkoutPaymentMethod === 'CARD' ? 'CARD' : null
    await submitCheckout(counterPaymentMethod)
  }

  const handleConfirmCashPayment = async () => {
    const receivedAmount = parseMoneyInput(cashReceived)
    if (receivedAmount < remaining) {
      setCashError('Số tiền khách đưa chưa đủ để thanh toán hóa đơn.')
      return
    }
    setCashDialogOpen(false)
    await submitCheckout('CASH')
  }

  const inv = detail?.invoice
  const paidAmount = Number(detail?.paidAmount || 0)
  const remaining = inv ? Number(inv.totalAmount || 0) - paidAmount : 0
  const guests = detail?.guests || []
  const primaryGuest = guests.find(g => g.primaryGuest) || guests[0]
  const otherGuests = guests.filter(g => g !== primaryGuest)
  const selectedPaymentMethod = CHECKOUT_PAYMENT_OPTIONS.find(option => option.value === checkoutPaymentMethod) || CHECKOUT_PAYMENT_OPTIONS[0]
  const cashReceivedAmount = parseMoneyInput(cashReceived)
  const cashChangeAmount = Math.max(0, cashReceivedAmount - remaining)
  const cashIsEnough = cashReceivedAmount >= remaining

  const extHours = Number(detail?.extensionHours || 0)
  const totalRoomCharge = Number(inv?.roomCharge ?? detail?.finalRoomAmount ?? detail?.priceAtBooking ?? 0)
  const extAmount = Number(detail?.extensionAmount || (extHours > 0 ? (totalRoomCharge > 0 ? Math.round(totalRoomCharge / 20 * extHours) : extHours * 80000) : 0))
  const baseRoomCharge = Math.max(0, totalRoomCharge - (extHours > 0 ? extAmount : 0))

  function genderLabel(g) {
    return g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : g === 'OTHER' ? 'Khác' : '—'
  }

  return (
    <>
      <div className="aco-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <section className="aco-modal" role="dialog" aria-modal="true" aria-labelledby="aco-title">

          {/* ── Header ── */}
          <header className="aco-header">
            <div className="aco-header-label">Trả phòng</div>
            <div className="aco-header-body">
              <div>
                <h2 id="aco-title">
                  {detail ? `Booking ${bookingDisplay(detail)}` : 'Đang tải...'}
                </h2>
                <p>{detail ? `${detail.customer?.fullName || '—'} · ${detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán phòng'} · ${houseTypeName(detail, '')}` : ''}</p>
              </div>
              <button type="button" className="aco-close" onClick={onClose} aria-label="Đóng">×</button>
            </div>
          </header>

          {/* ── Loading / Error ── */}
          {loading && <div className="aco-state">Đang tải chi tiết đơn đặt phòng...</div>}
          {!loading && error && !detail && <div className="aco-state aco-state--error">{error}</div>}

          {detail && (
            <div className="aco-body">
              <div className="aco-cols">

                {/* ── Cột trái: Thông tin & Khách ── */}
                <div className="aco-left">

                  {/* Tổng quan booking */}
                  <section className="aco-card">
                    <div className="aco-card-title">
                      <svg viewBox="0 0 20 20" fill="none"><path d="M3 10h14M3 6h14M3 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Thông tin đặt phòng
                      {extHours > 0 && (
                        <span className="aco-badge aco-badge--extend" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                           Thuê thêm +{extHours}h
                        </span>
                      )}
                    </div>

                    {extHours > 0 && (
                      <div className="aco-extension-alert">
                        <div className="aco-extension-alert-icon"></div>
                        <div>
                          <strong>Khách đã thuê thêm {extHours} giờ lưu trú</strong>
                          <p>
                            Phụ phí thuê thêm: <b>{formatMoney(extAmount)}</b> · Giờ trả phòng gia hạn: <b>{formatAppDateTime(detail.checkOutTarget)}</b>
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="aco-info-grid">
                      <div className="aco-info-item">
                        <span>Phòng</span>
                        <strong>{detail.roomNumber ? `Phòng ${detail.roomNumber}` : 'Chưa gán'}</strong>
                        <small>{houseTypeName(detail)}</small>
                      </div>
                      <div className="aco-info-item">
                        <span>Nhận phòng</span>
                        <strong>{formatAppDateTime(detail.checkInTarget)}</strong>
                      </div>
                      <div className="aco-info-item">
                        <span>Trả phòng</span>
                        <strong>{formatAppDateTime(detail.checkOutTarget)}</strong>
                        {extHours > 0 && <small style={{ color: '#0284c7', fontWeight: 600 }}>Bao gồm +{extHours}h thuê thêm</small>}
                      </div>
                      <div className="aco-info-item">
                        <span>Số khách</span>
                        <strong>{detail.numberOfAdults || 0} người lớn · {detail.numberOfChildren || 0} trẻ em</strong>
                      </div>
                      {extHours > 0 && (
                        <div className="aco-info-item aco-info-item--extended" style={{ gridColumn: 'span 2' }}>
                          <span>Chi tiết thuê thêm giờ</span>
                          <strong>+{extHours} giờ thuê thêm · Phụ thu: {formatMoney(extAmount)}</strong>
                          <small>Đã tính gộp vào tiền phòng trên hóa đơn thanh toán</small>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Khách lưu trú */}
                  {guests.length > 0 && (
                    <section className="aco-card">
                      <div className="aco-card-title">
                        <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        Khách lưu trú
                        <span className="aco-badge">{guests.length} người</span>
                      </div>

                      {primaryGuest && (
                        <div className="aco-guest aco-guest--primary">
                          <div className="aco-guest-avatar">
                            {(primaryGuest.fullName || '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase()}
                          </div>
                          <div className="aco-guest-info">
                            <div className="aco-guest-name">
                              {primaryGuest.fullName || '—'}
                              <span className="aco-guest-tag">Người đại diện</span>
                            </div>
                            <div className="aco-guest-fields">
                              {primaryGuest.identityDocumentNumber && (
                                <span><em>CCCD</em>{primaryGuest.identityDocumentNumber}</span>
                              )}
                              {primaryGuest.phone && (
                                <span><em>SĐT</em>{primaryGuest.phone}</span>
                              )}
                              {primaryGuest.dateOfBirth && (
                                <span><em>Ngày sinh</em>{new Date(primaryGuest.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                              )}
                              {primaryGuest.gender && (
                                <span><em>Giới tính</em>{genderLabel(primaryGuest.gender)}</span>
                              )}
                              {primaryGuest.email && (
                                <span><em>Email</em>{primaryGuest.email}</span>
                              )}
                              {primaryGuest.address && (
                                <span className="aco-guest-address"><em>Địa chỉ</em>{primaryGuest.address}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {otherGuests.length > 0 && (
                        <div className="aco-guest-others">
                          {otherGuests.map((guest, i) => (
                            <div key={guest.id || i} className="aco-guest aco-guest--other">
                              <div className="aco-guest-avatar aco-guest-avatar--sm">
                                {(guest.fullName || '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase()}
                              </div>
                              <div className="aco-guest-info">
                                <div className="aco-guest-name">
                                  {guest.fullName || '—'}
                                  <span className="aco-guest-tag aco-guest-tag--other">
                                    {i < Number(detail.numberOfAdults || 1) - 1 ? 'Người lớn' : 'Trẻ em'}
                                  </span>
                                </div>
                                <div className="aco-guest-fields">
                                  {guest.identityDocumentNumber && (
                                    <span><em>CCCD</em>{guest.identityDocumentNumber}</span>
                                  )}
                                  {guest.phone && (
                                    <span><em>SĐT</em>{guest.phone}</span>
                                  )}
                                  {guest.dateOfBirth && (
                                    <span><em>Ngày sinh</em>{new Date(guest.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                </div>

                {/* ── Cột phải: Hoá đơn ── */}
                <div className="aco-right">
                  <section className="aco-card aco-card--invoice">
                    <div className="aco-card-title">
                      <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 7h6M7 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Hoá đơn thanh toán
                    </div>

                    {/* Chi phí phát sinh & Thuê thêm */}
                    {(extHours > 0 || detail.serviceItems?.length > 0 || detail.penaltyItems?.length > 0) && (
                      <div className="aco-items">
                        {extHours > 0 && (
                          <div className="aco-item aco-item--extension">
                            <span className="aco-item-name">
                              Thuê thêm giờ lưu trú
                              <small>Gia hạn phòng đến {formatClockTime(detail.checkOutTarget)}</small>
                            </span>
                            <span className="aco-item-qty">+{extHours}h</span>
                            <strong>{formatMoney(extAmount)}</strong>
                          </div>
                        )}
                        {detail.serviceItems?.map((item, i) => (
                          <div key={i} className="aco-item">
                            <span className="aco-item-name">
                              {item.name}
                              <small style={{ color: '#059669', display: 'block', fontSize: 11 }}>
                                {item.type === 'MINI_BAR' ? 'Minibar phòng' : 'Dịch vụ tiện ích'}
                              </small>
                            </span>
                            <span className="aco-item-qty">×{item.quantity}</span>
                            <strong>{formatMoney(item.totalPrice)}</strong>
                            {item.id && (
                              <button
                                type="button"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, marginLeft: 6 }}
                                title="Xóa mục này khỏi hóa đơn"
                                disabled={savingService}
                                onClick={() => handleRemoveServiceItem(item)}
                              >
                                
                              </button>
                            )}
                          </div>
                        ))}
                        {/* Tách bạch Bồi thường đồ hỏng/mất và Phí phạt quy định */}
                        {(() => {
                          const items = detail.penaltyItems || []
                          const isDamage = (it) => it.description?.includes('Bồi thường sự cố') || it.title?.includes('Bồi thường') || it.title?.includes('hỏng')
                          const damageItems = items.filter(isDamage)
                          const fineItems = items.filter((it) => !isDamage(it))

                          return (
                            <>
                              {damageItems.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    ️ Bồi thường đồ hỏng / mất tài sản ({damageItems.length})
                                  </div>
                                  {damageItems.map((item, i) => {
                                    const cleanName = item.description?.startsWith('Bồi thường sự cố')
                                      ? item.description.replace(/^Bồi thường sự cố\s*#\d+:\s*/, '')
                                      : (item.description || item.title)
                                    const incidentTag = item.description?.match(/sự cố\s*#\d+/i)?.[0] || 'Sự cố'
                                    return (
                                      <div key={`dmg-${i}`} className="aco-item aco-item--penalty">
                                        <span className="aco-item-name">
                                          <strong style={{ color: '#b91c1c' }}>{cleanName}</strong>
                                          <small style={{ color: '#64748b' }}>Chi phí đền bù ({incidentTag})</small>
                                        </span>
                                        <span className="aco-item-qty">×1</span>
                                        <strong>{formatMoney(item.amount)}</strong>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {fineItems.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    ️ Phạt vi phạm nội quy ({fineItems.length})
                                  </div>
                                  {fineItems.map((item, i) => (
                                    <div key={`fine-${i}`} className="aco-item aco-item--penalty">
                                      <span className="aco-item-name">
                                        {item.title}
                                        {item.description && <small>{item.description}</small>}
                                      </span>
                                      <span className="aco-item-qty">×1</span>
                                      <strong>{formatMoney(item.amount)}</strong>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}

                    {/* Thêm nhanh nước uống / dịch vụ phát sinh trực tiếp vào hóa đơn */}
                    <div style={{ margin: '12px 0', padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px dashed #86efac' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                           Thêm nước uống / dịch vụ vào hóa đơn
                        </strong>
                        <button
                          type="button"
                          style={{ fontSize: 12, color: '#166534', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => setShowAddService(!showAddService)}
                        >
                          {showAddService ? 'Đóng' : '+ Thêm ngay'}
                        </button>
                      </div>
                      {showAddService && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <button
                              type="button"
                              style={{ padding: '3px 10px', fontSize: 12, borderRadius: 4, border: '1px solid', borderColor: itemType === 'MINI_BAR' ? '#166534' : '#cbd5e1', background: itemType === 'MINI_BAR' ? '#166534' : '#fff', color: itemType === 'MINI_BAR' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setItemType('MINI_BAR'); setSelectedItemId('') }}
                            >
                              Nước / Minibar
                            </button>
                            <button
                              type="button"
                              style={{ padding: '3px 10px', fontSize: 12, borderRadius: 4, border: '1px solid', borderColor: itemType === 'FACILITY' ? '#166534' : '#cbd5e1', background: itemType === 'FACILITY' ? '#166534' : '#fff', color: itemType === 'FACILITY' ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 600 }}
                              onClick={() => { setItemType('FACILITY'); setSelectedItemId('') }}
                            >
                              Dịch vụ tiện ích
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <select
                              value={selectedItemId}
                              onChange={e => setSelectedItemId(e.target.value)}
                              style={{ flex: 1, padding: '7px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                            >
                              <option value="">{itemType === 'MINI_BAR' ? '-- Chọn đồ uống / minibar --' : '-- Chọn dịch vụ tiện ích --'}</option>
                              {itemType === 'MINI_BAR'
                                ? detail.miniBarItems?.map(it => <option key={it.id} value={it.id}>{it.name} · {formatMoney(it.price)}</option>)
                                : detail.facilityServices?.map(it => <option key={it.id} value={it.id}>{it.name} · {formatMoney(it.price)}</option>)}
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={serviceQty}
                              onChange={e => setServiceQty(Math.max(1, Number(e.target.value) || 1))}
                              style={{ width: 46, padding: '7px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, textAlign: 'center', background: '#fff' }}
                            />
                            <button
                              type="button"
                              disabled={!selectedItemId || savingService}
                              onClick={handleAddServiceItem}
                              style={{ padding: '7px 12px', background: '#166534', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: !selectedItemId || savingService ? 0.6 : 1, whiteSpace: 'nowrap' }}
                            >
                              {savingService ? '...' : '+ Ghi vào HĐ'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tổng kết */}
                    <div className="aco-totals">
                      {extHours > 0 ? (
                        <>
                          <div className="aco-total-row">
                            <span>Tiền phòng gốc</span>
                            <strong>{formatMoney(baseRoomCharge)}</strong>
                          </div>
                          <div className="aco-total-row aco-total-row--extended">
                            <span>Thuê thêm (+{extHours}h)</span>
                            <strong>+{formatMoney(extAmount)}</strong>
                          </div>
                        </>
                      ) : (
                        <div className="aco-total-row">
                          <span>Tiền phòng</span>
                          <strong>{formatMoney(inv?.roomCharge)}</strong>
                        </div>
                      )}
                      <div className="aco-total-row">
                        <span>Dịch vụ</span>
                        <strong>{formatMoney(inv?.serviceCharge)}</strong>
                      </div>
                      {(() => {
                        const items = detail.penaltyItems || []
                        const isDamage = (it) => it.description?.includes('Bồi thường sự cố') || it.title?.includes('Bồi thường') || it.title?.includes('hỏng')
                        const damageTotal = items.filter(isDamage).reduce((s, it) => s + Number(it.amount || 0), 0)
                        const fineTotal = items.filter((it) => !isDamage(it)).reduce((s, it) => s + Number(it.amount || 0), 0)

                        if (damageTotal > 0 || fineTotal > 0) {
                          return (
                            <>
                              {damageTotal > 0 && (
                                <div className="aco-total-row aco-total-row--penalty" style={{ color: '#dc2626' }}>
                                  <span>Bồi thường đồ hỏng/mất</span>
                                  <strong>{formatMoney(damageTotal)}</strong>
                                </div>
                              )}
                              {fineTotal > 0 && (
                                <div className="aco-total-row aco-total-row--penalty">
                                  <span>Phạt vi phạm nội quy</span>
                                  <strong>{formatMoney(fineTotal)}</strong>
                                </div>
                              )}
                            </>
                          )
                        }
                        if (Number(inv?.penaltyCharge || 0) > 0) {
                          return (
                            <div className="aco-total-row aco-total-row--penalty">
                              <span>Phụ thu / Phạt</span>
                              <strong>{formatMoney(inv?.penaltyCharge)}</strong>
                            </div>
                          )
                        }
                        return null
                      })()}
                      <div className="aco-total-row aco-total-row--sum">
                        <span>Tổng cộng</span>
                        <strong>{formatMoney(inv?.totalAmount)}</strong>
                      </div>
                      <div className="aco-total-row aco-total-row--paid">
                        <span>Đã thanh toán</span>
                        <strong>{formatMoney(paidAmount)}</strong>
                      </div>
                    </div>

                    {/* Trạng thái cuối */}
                    {remaining > 0 ? (
                      <div className="aco-balance aco-balance--due">
                        <div className="aco-balance-label">Còn lại cần thanh toán</div>
                        <div className="aco-balance-amount">{formatMoney(remaining)}</div>
                        <p>Khách cần thanh toán trước khi trả phòng.</p>
                        <div
                          className="aco-payment-select"
                          onBlur={event => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                              setPaymentMethodOpen(false)
                            }
                          }}
                        >
                          <span className="aco-payment-select-label">Phương thức thanh toán</span>
                          <button
                            type="button"
                            className="aco-payment-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={paymentMethodOpen}
                            onClick={() => setPaymentMethodOpen(open => !open)}
                          >
                            <span>
                              <strong>{selectedPaymentMethod.label}</strong>
                              <small>{selectedPaymentMethod.description}</small>
                            </span>
                            <b aria-hidden="true"></b>
                          </button>
                          {paymentMethodOpen && (
                            <div className="aco-payment-menu" role="listbox" aria-label="Chọn phương thức thanh toán">
                              {CHECKOUT_PAYMENT_OPTIONS.map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`aco-payment-option${checkoutPaymentMethod === option.value ? ' is-selected' : ''}`}
                                  role="option"
                                  aria-selected={checkoutPaymentMethod === option.value}
                                  onClick={() => {
                                    setCheckoutPaymentMethod(option.value)
                                    setPaymentMethodOpen(false)
                                  }}
                                >
                                  <strong>{option.label}</strong>
                                  <span>{option.description}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aco-balance aco-balance--clear">
                        <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="m6.5 10 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <strong>Đã thanh toán đủ</strong>
                          <p>Có thể xác nhận trả phòng ngay.</p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

              </div>

              {error && <div className="aco-error">{error}</div>}
            </div>
          )}

          {detail && (
            <footer className="aco-footer">
              <button type="button" className="aco-btn-cancel" onClick={onClose}>Hủy</button>
              <button
                type="button"
                className={`aco-btn-checkout${remaining > 0 ? ' aco-btn-checkout--pay' : ''}`}
                disabled={checkingOut || loading}
                onClick={handleCheckOut}
              >
                {checkingOut ? (
                  <><span className="aco-spinner" />Đang xử lý...</>
                ) : remaining > 0 ? (
                  checkoutPaymentMethod === 'QR'
                    ? `Tạo QR thanh toán ${formatMoney(remaining)}`
                    : `Xác nhận ${selectedPaymentMethod.label} ${formatMoney(remaining)}`
                ) : (
                  'Xác nhận Check-out'
                )}
              </button>
            </footer>
          )}
        </section>
      </div>

      {payment && (
        <SePayQrPayment
          payment={payment}
          statusUrl={`${API_BASE}/details/${bookingDetailId}`}
          headers={authHeaders()}
          successStatus="COMPLETED"
          statusField="detailStatus"
          title="Thanh toán trước khi trả phòng"
          onSuccess={async () => { setPayment(null); await onCompleted() }}
          onClose={() => setPayment(null)}
        />
      )}

      {cashDialogOpen && (
        <div className="aco-cash-overlay" onClick={event => event.target === event.currentTarget && !checkingOut && setCashDialogOpen(false)}>
          <section className="aco-cash-modal" role="dialog" aria-modal="true" aria-labelledby="aco-cash-title">
            <header>
              <div>
                <span>Thanh toán tiền mặt</span>
                <h3 id="aco-cash-title">Nhập số tiền khách đưa</h3>
              </div>
              <button type="button" onClick={() => setCashDialogOpen(false)} disabled={checkingOut} aria-label="Đóng">×</button>
            </header>

            <div className="aco-cash-summary">
              <div>
                <span>Cần thu</span>
                <strong>{formatMoney(remaining)}</strong>
              </div>
              <label>
                <span>Khách đưa</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={cashReceived}
                  onChange={event => {
                    setCashReceived(event.target.value)
                    setCashError('')
                  }}
                  placeholder="VD: 5200000"
                />
              </label>
              <div className={`aco-cash-change${cashReceived && !cashIsEnough ? ' is-short' : ''}`}>
                <span>{cashReceived && !cashIsEnough ? 'Còn thiếu' : 'Tiền trả lại'}</span>
                <strong>{formatMoney(cashReceived && !cashIsEnough ? remaining - cashReceivedAmount : cashChangeAmount)}</strong>
              </div>
            </div>

            {cashError && <div className="aco-cash-error">{cashError}</div>}

            <footer>
              <button type="button" onClick={() => setCashDialogOpen(false)} disabled={checkingOut}>Hủy</button>
              <button type="button" onClick={handleConfirmCashPayment} disabled={checkingOut || !cashIsEnough}>
                {checkingOut ? <><span className="aco-spinner" />Đang xử lý...</> : 'Xác nhận đã thu tiền'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

function normalizeName(name) {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNameMatch(nameA, nameB) {
  const normA = normalizeName(nameA)
  const normB = normalizeName(nameB)
  if (!normA || !normB) return false
  if (normA === normB) return true
  // Check if words match in order or all words are contained
  const wordsA = normA.split(' ').filter(Boolean)
  const wordsB = normB.split(' ').filter(Boolean)
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    const lastA = wordsA[wordsA.length - 1]
    const lastB = wordsB[wordsB.length - 1]
    const firstA = wordsA[0]
    const firstB = wordsB[0]
    if (lastA === lastB && firstA === firstB) return true
  }
  return normA.includes(normB) || normB.includes(normA)
}

function CheckInModal({ bookingDetailId, onClose, onCompleted }) {
  const [preparation, setPreparation] = useState(null)
  const [roomId, setRoomId] = useState('')
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ocrLoadingIndex, setOcrLoadingIndex] = useState(null)
  const [identityImages, setIdentityImages] = useState({})
  const [cameraTarget, setCameraTarget] = useState(null)
  const [ocrNotice, setOcrNotice] = useState('')
  const [error, setError] = useState('')
  const [repVerified, setRepVerified] = useState(false)
  const [selectedTypeTab, setSelectedTypeTab] = useState('SAME')
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

  const roomTypeGroups = useMemo(() => {
    if (!preparation) return []
    const list = []

    // 1. Same Type group
    const sameRooms = preparation.availableRooms || []
    const sameTypeName = houseTypeName(preparation) || 'Cùng loại'
    if (sameRooms.length > 0 || (!preparation.otherAvailableRooms || preparation.otherAvailableRooms.length === 0)) {
      list.push({
        key: 'SAME',
        name: `Cùng loại: ${sameTypeName}`,
        shortName: sameTypeName,
        badgeText: `Cùng loại: ${sameTypeName} (${sameRooms.length} phòng trống)`,
        rooms: sameRooms,
        isSame: true,
      })
    }

    // 2. Group other available rooms by room type
    const otherRooms = preparation.otherAvailableRooms || []
    const otherMap = new Map()
    otherRooms.forEach(room => {
      const typeName = houseTypeName(room) || 'Loại phòng khác'
      const typeKey = String(room.houseType || room.roomTypeId || typeName)
      if (!otherMap.has(typeKey)) {
        otherMap.set(typeKey, {
          key: typeKey,
          name: typeName,
          shortName: typeName,
          badgeText: `${typeName} (${0} phòng trống)`,
          rooms: [],
          isSame: false,
        })
      }
      otherMap.get(typeKey).rooms.push(room)
    })

    otherMap.forEach(group => {
      group.badgeText = `${group.name} (${group.rooms.length} phòng trống)`
      list.push(group)
    })

    return list
  }, [preparation])

  useEffect(() => {
    if (preparation) {
      if (preparation.availableRooms?.length > 0) {
        setSelectedTypeTab('SAME')
      } else if (roomTypeGroups.length > 0) {
        setSelectedTypeTab(roomTypeGroups[0].key)
      }
    }
  }, [preparation, roomTypeGroups])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/details/${bookingDetailId}/check-in-preparation`, {
      headers: authHeaders(), signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Không thể chuẩn bị thông tin check-in')
        setPreparation(data)
        setRoomId(data.assignedRoom?.id
          ? String(data.assignedRoom.id)
          : data.availableRooms?.[0]?.id 
            ? String(data.availableRooms[0].id) 
            : data.otherAvailableRooms?.[0]?.id 
              ? String(data.otherAvailableRooms[0].id) 
              : '')
        setGuests(createGuestForms(data))
        setIdentityImages({})
        setCameraTarget(null)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [bookingDetailId])

  const updateGuest = (index, field, value) => {
    setGuests(current => current.map((guest, guestIndex) => (
      guestIndex === index ? { ...guest, [field]: value } : guest
    )))
  }

  const selectIdentityImage = (index, side, file) => {
    if (!file) return
    const currentImages = identityImages[index] || {}
    const nextImages = { ...currentImages, [side]: file }
    setIdentityImages(current => ({ ...current, [index]: nextImages }))
    setOcrNotice(
      nextImages.front && nextImages.back
        ? ''
        : `Đã nhận ${side === 'front' ? 'mặt trước' : 'mặt sau'} CCCD cho người lưu trú ${index + 1}. Vui lòng chọn thêm mặt còn lại.`
    )
    if (nextImages.front && nextImages.back) {
      scanIdentityDocument(index, nextImages.front, nextImages.back)
    }
  }

  const openIdentityCamera = (index, side) => {
    setError('')
    setCameraTarget({ index, side })
  }

  const scanIdentityDocument = async (index, imageFront, imageBack) => {
    if (!imageFront || !imageBack) return
    setOcrLoadingIndex(index)
    setOcrNotice('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('image_front', imageFront)
      formData.append('image_back', imageBack)
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/identity-ocr`, {
        method: 'POST',
        headers: authUploadHeaders(),
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể đọc thông tin căn cước')
      if (!data.identityDocumentNumber && !data.fullName) {
        throw new Error('Ảnh tải lên không đúng nhận dạng thẻ CCCD hoặc hình ảnh bị mờ. Vui lòng kiểm tra lại ảnh chụp rõ 2 mặt thẻ Căn cước công dân!')
      }

      // ── Cập nhật thông tin nhận dạng từ OCR ──
      setGuests(current => current.map((guest, guestIndex) => {
        if (guestIndex !== index) return guest
        return {
          ...guest,
          fullName: data.fullName || guest.fullName,
          identityDocumentNumber: data.identityDocumentNumber || guest.identityDocumentNumber,
          dateOfBirth: toIsoDateString(data.dateOfBirth) || guest.dateOfBirth,
          gender: data.gender || guest.gender,
          nationality: data.nationality || guest.nationality || 'VIETNAM',
          address: data.address || guest.address,
        }
      }))

      if (index === 0) {
        setRepVerified(true)
        setOcrNotice(
          `✓ Đã trích xuất thông tin CCCD cho người đại diện: "${data.fullName || guests[0]?.fullName || ''}" (CCCD: ${data.identityDocumentNumber || ''})`
        )
      } else {
        setOcrNotice(`✓ Đã đọc CCCD cho người lưu trú ${index + 1}. Vui lòng kiểm tra lại trước khi xác nhận.`)
      }

      setIdentityImages(current => {
        const next = { ...current }
        delete next[index]
        return next
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setOcrLoadingIndex(null)
    }
  }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/details/${bookingDetailId}/complete-check-in`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          roomId: Number(roomId),
          representativeEmail: guests[0]?.email?.trim() || '',
          guests: guests.map(guest => ({
            ...guest,
            identityDocumentNumber: guest.identityDocumentNumber?.trim() || null,
            dateOfBirth: toIsoDateString(guest.dateOfBirth) || null,
            email: guest.email || null,
            phone: guest.phone || null,
            address: guest.address || null,
            gender: guest.gender || null,
            nationality: guest.nationality || null,
          })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể hoàn tất check-in')
      await onCompleted(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="acl-checkin-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="acl-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="acl-checkin-title">
        <header className="acl-checkin-head">
          <div>
            <span>Tiếp nhận lưu trú</span>
            <h2 id="acl-checkin-title">Check-in booking {bookingDisplay(preparation)}</h2>
            <p>{preparation ? `${preparation.customer?.fullName} · ${houseTypeName(preparation)}` : 'Đang tải thông tin...'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </header>

        {loading ? <div className="acl-checkin-state">Đang chuẩn bị form check-in...</div> : null}
        {!loading && !preparation ? <div className="acl-checkin-state acl-checkin-state--error">{error}</div> : null}

        {preparation ? (
          <form className="acl-checkin-body" onSubmit={submit}>
            <section className="acl-checkin-summary">
              <div><span>Khách đặt phòng</span><strong>{preparation.customer?.fullName || '—'}</strong></div>
              <div><span>Thời gian lưu trú</span><strong>{formatAppDateTime(preparation.checkInTarget)} → {formatAppDateTime(preparation.checkOutTarget)}</strong></div>
              <div><span>Số khách</span><strong>{preparation.numberOfAdults} người lớn · {preparation.numberOfChildren} trẻ em</strong></div>
            </section>

            {preparation.preRegistered && (
              <div className="acl-preregistered-notice">
                Thông tin phòng và người lưu trú đã được đăng ký khi tạo đơn trực tiếp. Có thể chỉnh sửa thông tin khách trước khi xác nhận check-in.
              </div>
            )}

            <section className="acl-checkin-section">
              <div className="acl-checkin-section-head">
                <div>
                  <span>01</span>
                  <div>
                    <h3>{preparation.preRegistered ? 'Phòng đã đặt' : 'Gán phòng trống'}</h3>
                    <p>
                      {preparation.preRegistered
                        ? 'Phòng đã được xác nhận khi tạo đơn trực tiếp.'
                        : 'Chọn phòng thuộc đúng loại hoặc linh hoạt đổi phòng trống khác khi phòng bị bảo trì / trùng lịch.'}
                    </p>
                  </div>
                </div>
              </div>

              {preparation.preRegistered && preparation.assignedRoom ? (
                <div className="acl-room-options">
                  <label className="is-selected acl-room-option--readonly">
                    <input type="radio" checked readOnly />
                    <span>Phòng</span><strong>{preparation.assignedRoom.roomNumber}</strong><small>{houseTypeName(preparation.assignedRoom)}</small>
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Notice Banner */}
                  {preparation.availableRooms?.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#166534', fontSize: '13.5px', fontWeight: 500 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#16a34a', color: '#ffffff', fontSize: 13, fontWeight: 900 }}>✓</span>
                      <span>Còn <strong>{preparation.availableRooms.length}</strong> phòng cùng loại (<strong>{houseTypeName(preparation)}</strong>) đang trống.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #fde68a', color: '#b45309', fontSize: '13.5px', fontWeight: 500 }}>
                      <span style={{ fontSize: 18 }}>⚠️</span>
                      <span><strong>Đã hết phòng cùng loại trống!</strong> Quý khách / Lễ tân vui lòng chọn chuyển sang loại phòng khác bên dưới:</span>
                    </div>
                  )}

                  {/* Room Type Dropdown Selector */}
                  {roomTypeGroups.length > 0 && (() => {
                    const activeGroup = roomTypeGroups.find(g => g.key === selectedTypeTab) || roomTypeGroups[0]
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 4, borderBottom: '1px solid #e2e8f0' }}>
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
                                const isSelected = selectedTypeTab === group.key
                                return (
                                  <button
                                    key={group.key}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTypeTab(group.key)
                                      if (group.rooms.length > 0) {
                                        setRoomId(String(group.rooms[0].id))
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

                  {/* Room Cards Grid */}
                  {(() => {
                    const activeGroup = roomTypeGroups.find(g => g.key === selectedTypeTab) || roomTypeGroups[0]
                    if (!activeGroup || activeGroup.rooms.length === 0) {
                      return (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', fontSize: '13.5px' }}>
                          Loại phòng này hiện không còn phòng trống.
                        </div>
                      )
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                        {activeGroup.rooms.map(room => {
                          const isSelected = String(room.id) === String(roomId)
                          return (
                            <label
                              key={room.id}
                              style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                                background: isSelected ? '#f0f9ff' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="radio"
                                  name="checkin_room_choice"
                                  value={room.id}
                                  checked={isSelected}
                                  onChange={() => setRoomId(String(room.id))}
                                  style={{ accentColor: '#0284c7', width: 17, height: 17, cursor: 'pointer' }}
                                />
                                <strong style={{ fontSize: '15.5px', color: '#0f172a', fontWeight: 800 }}>
                                  Phòng {room.roomNumber}
                                </strong>
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#64748b', marginLeft: 25 }}>
                                {houseTypeName(room)}
                              </div>
                              <div style={{ marginTop: 6, marginLeft: 25 }}>
                                <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                                  Sẵn sàng nhận khách
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {(!preparation.availableRooms || preparation.availableRooms.length === 0) &&
                   (!preparation.otherAvailableRooms || preparation.otherAvailableRooms.length === 0) && (
                    <div className="acl-checkin-warning" style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }}>
                      ❌ Toàn bộ các phòng trong homestay đã kín hoặc đang bảo trì trong thời gian này.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="acl-checkin-section">
              <div className="acl-checkin-section-head">
                <div><span>02</span><div><h3>Thông tin người lưu trú</h3><p>{preparation.preRegistered ? `Đã đăng ký ${guests.length} người lưu trú.` : `Nhập đủ ${guests.length} người lưu trú.`}</p></div></div>
              </div>
              <div className="acl-guest-forms">
                {guests.map((guest, index) => {
                  const isRepresentative = index === 0
                  const isAdult = index < Number(preparation.numberOfAdults || 0)
                  const selectedIdentityImages = identityImages[index] || {}
                  const age = calculateAge(guest.dateOfBirth)
                  const isUnder10 = age !== null && age < 10
                  return (
                    <article className={`acl-guest-form ${isRepresentative ? 'acl-guest-form--rep' : ''}`} key={index}>
                      <div className="acl-guest-form-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong>Người lưu trú {index + 1}</strong>
                          {isRepresentative ? (
                            <>
                              <span className="acl-rep-locked-badge"> Người đại diện (Khách đặt phòng)</span>
                              {repVerified && (
                                <span className="acl-rep-verified-badge">✓ Đã quét CCCD</span>
                              )}
                            </>
                          ) : (
                            <span>{isUnder10 ? 'Trẻ em (<10 tuổi)' : isAdult ? 'Người lớn' : 'Trẻ em'}</span>
                          )}
                        </div>
                        <div className="acl-guest-form-actions">
                          <div className="acl-identity-side">
                            <span>{selectedIdentityImages.front ? 'Đã có mặt trước' : 'Mặt trước'}</span>
                            <label className={`acl-identity-scan${ocrLoadingIndex === index ? ' is-loading' : ''}`}>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={ocrLoadingIndex !== null}
                                onChange={event => {
                                  const file = event.target.files?.[0]
                                  event.target.value = ''
                                  selectIdentityImage(index, 'front', file)
                                }}
                              />
                              Upload
                            </label>
                            <button
                              type="button"
                              className="acl-identity-camera-btn"
                              disabled={ocrLoadingIndex !== null}
                              onClick={() => openIdentityCamera(index, 'front')}
                            >
                              Chụp
                            </button>
                          </div>
                          <div className="acl-identity-side">
                            <span>{selectedIdentityImages.back ? 'Đã có mặt sau' : 'Mặt sau'}</span>
                            <label className={`acl-identity-scan${ocrLoadingIndex === index ? ' is-loading' : ''}`}>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={ocrLoadingIndex !== null}
                                onChange={event => {
                                  const file = event.target.files?.[0]
                                  event.target.value = ''
                                  selectIdentityImage(index, 'back', file)
                                }}
                              />
                              Upload
                            </label>
                            <button
                              type="button"
                              className="acl-identity-camera-btn"
                              disabled={ocrLoadingIndex !== null}
                              onClick={() => openIdentityCamera(index, 'back')}
                            >
                              Chụp
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="acl-guest-fields">
                        <label>
                          <span>Họ và tên *</span>
                          <input
                            required
                            maxLength="100"
                            value={guest.fullName}
                            placeholder="Nhập họ và tên"
                            onChange={event => updateGuest(index, 'fullName', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Căn cước công dân {isUnder10 ? '' : '*'}</span>
                          <input
                            required={!isUnder10}
                            inputMode="numeric"
                            pattern={isUnder10 ? undefined : "[0-9]{12}"}
                            maxLength="12"
                            placeholder={isUnder10 ? "Không bắt buộc (<10 tuổi)" : "12 chữ số CCCD"}
                            title={isUnder10 ? "Trẻ em dưới 10 tuổi không bắt buộc nhập căn cước công dân" : "Căn cước công dân phải gồm đúng 12 chữ số"}
                            value={guest.identityDocumentNumber}
                            onChange={event => updateGuest(index, 'identityDocumentNumber', event.target.value.replace(/\D/g, ''))}
                          />
                        </label>
                        <div className="acl-form-field-group">
                          <label>
                            <span>Ngày sinh</span>
                            <DateDropdownPicker
                              isDob={true}
                              value={guest.dateOfBirth || ''}
                              onChange={val => updateGuest(index, 'dateOfBirth', val)}
                              allowEmpty={true}
                            />
                          </label>
                        </div>
                        <label>
                          <span>Email {isRepresentative ? '*' : ''}</span>
                          <input
                            type="email"
                            required={isRepresentative}
                            maxLength={isRepresentative ? 50 : 100}
                            placeholder="Email nhận link truy cập phòng"
                            title={isRepresentative ? 'Email này sẽ nhận link truy cập dịch vụ của phòng' : 'Vui lòng nhập đúng định dạng email'}
                            value={guest.email}
                            onChange={event => updateGuest(index, 'email', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Số điện thoại</span>
                          <input
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength="10"
                            placeholder="10 chữ số SĐT"
                            title="Số điện thoại phải gồm đúng 10 chữ số"
                            value={guest.phone}
                            onChange={event => updateGuest(index, 'phone', event.target.value.replace(/\D/g, ''))}
                          />
                        </label>
                        <label>
                          <span>Giới tính</span>
                          <select
                            value={guest.gender}
                            onChange={event => updateGuest(index, 'gender', event.target.value)}
                          >
                            <option value="">Chưa chọn</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </label>
                        <label className="acl-guest-field-wide">
                          <span>Địa chỉ</span>
                          <input
                            maxLength="255"
                            placeholder="Địa chỉ thường trú / tạm trú"
                            value={guest.address}
                            onChange={event => updateGuest(index, 'address', event.target.value)}
                          />
                        </label>
                      </div>
                    </article>
                  )
                })}
              </div>
              {ocrNotice && <div className="acl-ocr-notice">{ocrNotice}</div>}
            </section>

            {error && <div className="acl-checkin-warning acl-checkin-warning--error">{error}</div>}
            <footer className="acl-checkin-actions">
              <button type="button" onClick={onClose}>Hủy</button>
              <button type="submit" disabled={saving || !roomId}>
                {saving ? 'Đang check-in...' : `Xác nhận check-in ${guests.length} người`}
              </button>
            </footer>
          </form>
        ) : null}
      </section>
      {cameraTarget && (
        <IdentityCameraModal
          title={`${cameraTarget.side === 'front' ? 'Mặt trước' : 'Mặt sau'} CCCD - Người lưu trú ${cameraTarget.index + 1}`}
          onClose={() => setCameraTarget(null)}
          onCapture={file => selectIdentityImage(cameraTarget.index, cameraTarget.side, file)}
        />
      )}
    </div>
  )
}

function AdminCheckInLogsPage() {
  const { isInShift, guardAction } = useShiftGuard()
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [periodFilter, setPeriodFilter] = useState('week')
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value
    setPeriodFilter(nextPeriod)
    if (nextPeriod === 'day') {
      const range = getDayRange()
      setFromDate(range.from)
      setToDate(range.to)
    } else if (nextPeriod === 'week') {
      const range = getWeekRange()
      setFromDate(range.from)
      setToDate(range.to)
    } else if (nextPeriod === 'month') {
      const range = getMonthRange()
      setFromDate(range.from)
      setToDate(range.to)
    } else if (nextPeriod === 'year') {
      const range = getYearRange()
      setFromDate(range.from)
      setToDate(range.to)
    }
  }

  const handleFromDateChange = (val) => {
    setFromDate(val)
    setPeriodFilter('custom')
  }

  const handleToDateChange = (val) => {
    setToDate(val)
    setPeriodFilter('custom')
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [checkInTargetId, setCheckInTargetId] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('bookingDetailId')
    return value && /^\d+$/.test(value) ? Number(value) : null
  })
  const [checkOutTargetId, setCheckOutTargetId] = useState(null)
  const [changeRoomTargetId, setChangeRoomTargetId] = useState(null)
  const [quickAddTargetId, setQuickAddTargetId] = useState(null)
  const [housekeepingRequestedIds, setHousekeepingRequestedIds] = useState(() => new Set())

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate, toDate })
      const [response, housekeepingResponse] = await Promise.all([
        fetch(`${API_BASE}/check-in-logs?${params}`, { headers: authHeaders() }),
        fetch((import.meta.env.VITE_API_URL || '') + '/api/housekeeping/tasks?status=ALL', { headers: authHeaders() }),
      ])
      const [data, housekeepingData] = await Promise.all([
        response.json().catch(() => ({})),
        housekeepingResponse.json().catch(() => ([])),
      ])
      const hkList = housekeepingResponse.ok && Array.isArray(housekeepingData) ? housekeepingData : []
      const hkCompletedDetailIds = new Set(
        hkList
          .filter(task => String(task.inspectionStatus || '').toUpperCase() === 'COMPLETED')
          .map(task => Number(task.bookingDetailId))
          .filter(Boolean)
      )
      const hkRequestedDetailIds = new Set(
        hkList.map(task => Number(task.bookingDetailId)).filter(Boolean)
      )
      setHousekeepingRequestedIds(hkRequestedDetailIds)

      const rawBookings = Array.isArray(data) ? data : []
      const nextBookings = rawBookings.map(booking => ({
        ...booking,
        details: (booking.details || []).map(detail => ({
          ...detail,
          housekeepingInspectionCompleted: Boolean(
            detail.housekeepingInspectionCompleted || hkCompletedDetailIds.has(Number(detail.bookingDetailId))
          ),
        })),
      }))
      setBookings(nextBookings)
      setSelectedBookingId(current => {
        if (current && nextBookings.some(booking => booking.bookingId === current)) return current
        return nextBookings[0]?.bookingId || null
      })
    } catch (err) {
      if (!silent) {
        setError(err.message)
        setBookings([])
        setSelectedBookingId(null)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    // The request updates loading state before synchronizing with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs()
    const refreshTimer = window.setInterval(() => loadLogs(true), 10_000)
    return () => window.clearInterval(refreshTimer)
  }, [loadLogs])

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return bookings.filter(booking => bookingMatches(booking, keyword) && bookingHasStatus(booking, stageFilter))
  }, [bookings, search, stageFilter])

  const selectedBooking = useMemo(() => {
    return filteredBookings.find(booking => booking.bookingId === selectedBookingId) || filteredBookings[0] || null
  }, [filteredBookings, selectedBookingId])

  const allDetails = bookings.flatMap(booking => booking.details)
  const waitingCount = allDetails.filter(detail => detailStage(detail) === 'waiting').length
  const overdueCount = allDetails.filter(detail => detailStage(detail) === 'overdue_noshow').length
  const stayingCount = allDetails.filter(detail => detailStage(detail) === 'staying').length
  const completedCount = allDetails.filter(detail => detailStage(detail) === 'completed').length

  const runAction = async (bookingDetailId, action) => {
    if (!isInShift) {
      const actionLabels = {
        'check-in': 'Check-in nhận phòng',
        'check-out': 'Check-out trả phòng',
        'add-service': 'Thêm nước / dịch vụ',
        'housekeeping-request': 'Yêu cầu dọn phòng',
      }
      guardAction(null, actionLabels[action] || 'Cập nhật lưu trú')
      return
    }
    if (action === 'check-in') {
      setCheckInTargetId(bookingDetailId)
      return
    }
    if (action === 'check-out') {
      setCheckOutTargetId(bookingDetailId)
      return
    }
    if (action === 'change-room') {
      setChangeRoomTargetId(bookingDetailId)
      return
    }
    if (action === 'add-service') {
      setQuickAddTargetId(bookingDetailId)
      return
    }
    setActionLoading(bookingDetailId)
    setActionError('')
    try {
      const url = action === 'housekeeping-request'
        ? `${import.meta.env.VITE_API_URL || ''}/api/housekeeping/booking-details/${bookingDetailId}/request`
        : `${API_BASE}/details/${bookingDetailId}/${action}`
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể cập nhật lưu trú')
      await loadLogs()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout activePage="check-in-logs">
      <div className="acl-header">
        <div>
          <h1>Nhật ký lưu trú</h1>
          <p>Quản lí check-in theo booking, mỗi booking hiển thị toàn bộ lưu trú theo từng booking detail.</p>
        </div>
        <button type="button" className="acl-refresh" onClick={loadLogs} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <section className="acl-summary">
        <SummaryCard label="Booking trong kỳ" value={bookings.length} />
        <SummaryCard label="Chưa check-in" value={waitingCount} tone="waiting" />
        <SummaryCard label="Đang lưu trú" value={stayingCount} tone="staying" />
        <SummaryCard label="Đã trả phòng" value={completedCount} tone="completed" />
      </section>

      <section className="acl-toolbar">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm booking, khách hàng, số phòng, số điện thoại..." />
        <select
          className="acl-period-select"
          value={periodFilter}
          onChange={handlePeriodChange}
          aria-label="Lọc theo khoảng thời gian"
        >
          <option value="day">Theo ngày</option>
          <option value="week">Theo tuần</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
          {periodFilter === 'custom' && <option value="custom">Tùy chọn</option>}
        </select>
        <div style={{ width: '150px' }}>
          <DateDropdownPicker
            value={fromDate}
            onChange={handleFromDateChange}
            placeholder="Từ ngày..."
            className="date-dropdown-picker--compact"
          />
        </div>
        <div style={{ width: '150px' }}>
          <DateDropdownPicker
            value={toDate}
            onChange={handleToDateChange}
            placeholder="Đến ngày..."
            className="date-dropdown-picker--compact"
          />
        </div>
        <select value={stageFilter} onChange={event => setStageFilter(event.target.value)} aria-label="Trạng thái lưu trú">
          <option value="">Tất cả lưu trú</option>
          <option value="waiting">Chưa check-in</option>
          <option value="overdue_noshow">Quá giờ trả phòng{overdueCount > 0 ? ` (${overdueCount})` : ''}</option>
          <option value="staying">Đang lưu trú</option>
          <option value="completed">Đã trả phòng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </section>

      {error ? <div className="acl-message acl-message--error">{error}</div> : null}
      {actionError ? <div className="acl-message acl-message--error">{actionError}</div> : null}

      <section className="acl-workspace">
        <aside className="acl-booking-panel">
          <div className="acl-panel-title">
            <strong>Danh sách booking</strong>
            <span>{filteredBookings.length} kết quả</span>
          </div>
          {loading ? (
            <div className="acl-empty">Đang tải nhật ký...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="acl-empty">Không có booking phù hợp.</div>
          ) : (
            <div className="acl-booking-list">
              {filteredBookings.map(booking => (
                <BookingListItem
                  key={booking.bookingId}
                  booking={booking}
                  active={selectedBooking?.bookingId === booking.bookingId}
                  onSelect={() => setSelectedBookingId(booking.bookingId)}
                />
              ))}
            </div>
          )}
        </aside>

        <div className="acl-detail-panel">
          {selectedBooking ? (
            <>
              <div className="acl-selected-head">
                <div>
                  <span>Booking {bookingDisplay(selectedBooking)}</span>
                  <h2>{selectedBooking.customer?.fullName || 'Khách chưa có tên'}</h2>
                  <p>
                    Đặt ngày {formatDate(selectedBooking.bookingDate)}
                    {selectedBooking.customer?.phone ? ` · ${selectedBooking.customer.phone}` : ''}
                  </p>
                </div>
                <div className="acl-selected-total">
                  <span>Tổng tiền phòng</span>
                  <strong>{formatMoney(selectedBooking.totalAmount)}</strong>
                </div>
              </div>

              <div className="acl-detail-list">
                {selectedBooking.details.map(detail => (
                  <DetailCard
                    key={detail.bookingDetailId}
                    detail={detail}
                    actionLoading={actionLoading}
                    housekeepingRequested={housekeepingRequestedIds.has(detail.bookingDetailId)}
                    onAction={runAction}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="acl-empty acl-empty--panel">Chọn một booking để xem lưu trú.</div>
          )}
        </div>
      </section>
      {checkInTargetId && (
        <CheckInModal
          bookingDetailId={checkInTargetId}
          onClose={() => setCheckInTargetId(null)}
          onCompleted={async () => {
            setCheckInTargetId(null)
            await loadLogs()
          }}
        />
      )}
      {checkOutTargetId && (
        <CheckOutModal
          bookingDetailId={checkOutTargetId}
          onClose={() => setCheckOutTargetId(null)}
          onCompleted={async () => {
            setCheckOutTargetId(null)
            await loadLogs()
          }}
        />
      )}
      {changeRoomTargetId && (
        <AdminChangeRoomModal
          bookingDetailId={changeRoomTargetId}
          onClose={() => setChangeRoomTargetId(null)}
          onSuccess={async () => {
            setChangeRoomTargetId(null)
            await loadLogs()
          }}
        />
      )}
      {quickAddTargetId && (
        <QuickAddServiceModal
          bookingDetailId={quickAddTargetId}
          onClose={() => setQuickAddTargetId(null)}
          onCompleted={async () => {
            await loadLogs()
          }}
        />
      )}
    </AdminLayout>
  )
}

export default AdminCheckInLogsPage
