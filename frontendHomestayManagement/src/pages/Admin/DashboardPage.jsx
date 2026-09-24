import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import './DashboardPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/dashboard'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toDateInputValue(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFromDate() {
  const date = new Date()
  const currentDay = date.getDate()
  date.setMonth(date.getMonth() - 1)
  if (date.getDate() !== currentDay) {
    date.setDate(0)
  }
  return toDateInputValue(date)
}

function defaultToDate() {
  const date = new Date()
  const currentDay = date.getDate()
  date.setMonth(date.getMonth() + 1)
  if (date.getDate() !== currentDay) {
    date.setDate(0)
  }
  return toDateInputValue(date)
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

function formatExactMoney(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}

function formatShortDate(value) {
  if (!value) return ''
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}`
}

function formatFullDate(value) {
  if (!value) return ''
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đang lưu trú',
    COMPLETED: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
    UNKNOWN: 'Chưa rõ',
  }
  return labels[String(status || '').toUpperCase()] || status
}

function statusDescription(status) {
  const descs = {
    COMPLETED: 'Khách đã trả phòng, hoàn tất thanh toán hóa đơn tổng và check-out thành công.',
    PENDING: 'Đơn đặt phòng mới tạo, đang chờ lễ tân/quản trị viên duyệt hoặc chờ đặt cọc.',
    CONFIRMED: 'Đã đặt cọc/xác nhận thành công, đang chờ khách đến nhận phòng (Check-in).',
    CHECKED_IN: 'Khách đã làm thủ tục nhận phòng và hiện đang lưu trú tại homestay.',
    CANCELLED: 'Đơn đặt phòng đã bị hủy bởi khách hàng hoặc quản trị viên.',
  }
  return descs[String(status || '').toUpperCase()] || 'Trạng thái lưu trú trong hệ thống.'
}

function totalValue(items) {
  return items.reduce((sum, item) => sum + Number(item.value || 0), 0)
}

/**
 * Modal soi chi tiết giải trình số liệu & công thức toán học khi BẤM (Click)
 */
function MetricInspectModal({ info, onClose }) {
  if (!info) return null

  return (
    <div className="dash-inspect-modal-overlay" onClick={onClose}>
      <div className="dash-inspect-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-inspect-modal-header">
          <div>
            <span className="dash-inspect-badge">BẢNG GIẢI TRÌNH SỐ LIỆU CHI TIẾT</span>
            <h3>{info.title}</h3>
            {info.subtitle && <p>{info.subtitle}</p>}
          </div>
          <button type="button" className="dash-inspect-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="dash-inspect-modal-body">
          {info.formula && (
            <div className="dash-inspect-section">
              <div className="dash-inspect-label">Công thức tính toán:</div>
              <div className="dash-inspect-formula dash-inspect-formula--lg">
                <code>{info.formula}</code>
              </div>
            </div>
          )}

          {info.calculation && (
            <div className="dash-inspect-section">
              <div className="dash-inspect-label">Diễn giải phép tính cụ thể:</div>
              <div className="dash-inspect-calc dash-inspect-calc--lg">
                {info.calculation}
              </div>
            </div>
          )}

          {Array.isArray(info.breakdown) && info.breakdown.length > 0 && (
            <div className="dash-inspect-section">
              <div className="dash-inspect-label">Bảng phân rã chi tiết từng hạng mục:</div>
              <div className="dash-inspect-table dash-inspect-table--bordered">
                {info.breakdown.map((item, idx) => (
                  <div className="dash-inspect-row" key={idx}>
                    <div className="dash-inspect-row-left">
                      <div>
                        <strong>{item.label}</strong>
                        {item.desc && <small>{item.desc}</small>}
                      </div>
                    </div>
                    <div className="dash-inspect-row-right">
                      <strong>{item.value}</strong>
                      {item.percent && <span className="dash-pill-pct">{item.percent}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {info.source && (
            <div className="dash-inspect-source-box">
              <strong>Nguồn dữ liệu & Cơ sở đối soát:</strong>
              <p>{info.source}</p>
            </div>
          )}
        </div>

        <div className="dash-inspect-modal-footer">
          <button type="button" className="btn-dash-inspect-done" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, hint, tone, inspectInfo, onInspectClick }) {
  return (
    <article
      className={`dash-kpi${tone ? ` dash-kpi--${tone}` : ''} dash-inspectable`}
      onClick={() => onInspectClick(inspectInfo)}
      title="Bấm vào để xem chi tiết giải trình & công thức tính toán"
    >
      <div className="dash-kpi-header">
        <span>{label}</span>
        <span className="dash-inspect-hint-icon" title="Bấm xem chi tiết & công thức">ℹ️</span>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

function formatCompactMoney(value) {
  const num = Number(value || 0)
  if (num === 0) return '0đ'
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace('.0', '') + 'tr'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0) + 'k'
  }
  return num + 'đ'
}

function RevenueChart({ data, onInspectClick }) {
  const max = Math.max(...data.map(item => Number(item.totalRevenue || 0)), 1)
  const totalPeriodRevenue = data.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0)
  const totalRoom = data.reduce((sum, item) => sum + Number(item.roomRevenue || 0), 0)
  const totalService = data.reduce((sum, item) => sum + Number(item.serviceRevenue || 0), 0)
  const totalPenalty = data.reduce((sum, item) => sum + Number(item.penaltyRevenue || 0), 0)

  return (
    <section className="dash-panel dash-panel--large">
      <div className="dash-panel-head">
        <div>
          <h2>📊 Doanh thu theo ngày (Thực tế)</h2>
          <p>Biểu đồ cột trực quan: Tiền phòng (Xanh) + Dịch vụ (Cam) + Phạt/Phụ thu (Tím). <em>(Bấm vào từng cột để xem chi tiết giải trình)</em></p>
        </div>
        <div className="dash-revenue-legend-head">
          <span className="dash-leg-tag dash-leg-room">🟦 Phòng: {formatCompactMoney(totalRoom)}</span>
          <span className="dash-leg-tag dash-leg-service">🟧 Dịch vụ: {formatCompactMoney(totalService)}</span>
          <span className="dash-leg-tag dash-leg-penalty">🟪 Phạt: {formatCompactMoney(totalPenalty)}</span>
          <strong className="dash-leg-total">💰 Tổng: {formatExactMoney(totalPeriodRevenue)}</strong>
        </div>
      </div>
      <div className="dash-revenue-scroll">
        <div className="dash-revenue-chart" style={{ '--chart-days': Math.max(data.length, 1) }}>
          <div className="dash-bars">
            {data.map(item => {
              const total = Number(item.totalRevenue || 0)
              const room = Number(item.roomRevenue || 0)
              const service = Number(item.serviceRevenue || 0)
              const penalty = Number(item.penaltyRevenue || 0)
              const totalHeight = Math.max(total > 0 ? 8 : 2, (total / max) * 100)

              const roomPct = total > 0 ? (room / total) * 100 : 0
              const servicePct = total > 0 ? (service / total) * 100 : 0
              const penaltyPct = total > 0 ? (penalty / total) * 100 : 0

              const dayInspectInfo = {
                title: `Doanh thu Ngày ${formatFullDate(item.date)}`,
                subtitle: `Tổng cộng ${formatExactMoney(total)} phát sinh trong ngày`,
                formula: 'Doanh thu ngày = Tiền phòng + Dịch vụ + Phạt/Phụ thu của các hóa đơn xuất trong ngày',
                calculation: `${formatExactMoney(room)} (Phòng) + ${formatExactMoney(service)} (Dịch vụ) + ${formatExactMoney(penalty)} (Phạt) = ${formatExactMoney(total)}`,
                breakdown: [
                  {
                    icon: '🏨',
                    label: 'Tiền phòng',
                    value: formatExactMoney(room),
                    percent: total > 0 ? `${roomPct.toFixed(1)}%` : '0%',
                    desc: 'Doanh thu thuê phòng trong ngày',
                  },
                  {
                    icon: '🥤',
                    label: 'Dịch vụ',
                    value: formatExactMoney(service),
                    percent: total > 0 ? `${servicePct.toFixed(1)}%` : '0%',
                    desc: 'Minibar, ăn uống, thuê đồ',
                  },
                  {
                    icon: '⚠️',
                    label: 'Phạt & Phụ thu',
                    value: formatExactMoney(penalty),
                    percent: total > 0 ? `${penaltyPct.toFixed(1)}%` : '0%',
                    desc: 'Phụ thu thêm giờ, quá số người, bồi thường đồ hỏng',
                  },
                ],
                source: `Tất cả hóa đơn có ngày tạo createdAt = ${item.date}`,
              }

              return (
                <div
                  className="dash-bar-day dash-inspectable"
                  key={item.date}
                  onClick={() => onInspectClick(dayInspectInfo)}
                  title={`Bấm để xem chi tiết doanh thu ngày ${formatFullDate(item.date)}`}
                >
                  <div className="dash-bar-value-label">
                    {total > 0 ? formatCompactMoney(total) : ''}
                  </div>
                  <div className="dash-stacked-bar-container" style={{ height: `${totalHeight}%` }}>
                    {penaltyPct > 0 && <span className="dash-bar-segment dash-bar-seg--penalty" style={{ height: `${penaltyPct}%` }} title={`Phạt: ${formatExactMoney(penalty)}`} />}
                    {servicePct > 0 && <span className="dash-bar-segment dash-bar-seg--service" style={{ height: `${servicePct}%` }} title={`Dịch vụ: ${formatExactMoney(service)}`} />}
                    {roomPct > 0 && <span className="dash-bar-segment dash-bar-seg--room" style={{ height: `${roomPct}%` }} title={`Tiền phòng: ${formatExactMoney(room)}`} />}
                    {total === 0 && <span className="dash-bar-segment dash-bar-seg--zero" style={{ height: '100%' }} />}
                  </div>
                  <small>{formatShortDate(item.date)}</small>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function OccupancyChart({ data, totalRooms, onInspectClick }) {
  const average = data.length
    ? data.reduce((sum, item) => sum + Number(item.occupancyRate || 0), 0) / data.length
    : 0

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <h2>🏨 Công suất phòng</h2>
          <p>Tỉ lệ phòng có khách từng ngày. <em>(Dễ hiểu: Số phòng có khách / Tổng số phòng)</em></p>
        </div>
        <div className="dash-occupancy-avg-badge">
          Trung bình: <strong>{average.toFixed(1)}%</strong>
        </div>
      </div>
      <div className="dash-occupancy">
        {data.map(item => {
          const occRate = Number(item.occupancyRate || 0)
          const occRooms = Number(item.occupiedRooms || 0)
          const roomsCount = Number(item.totalRooms || totalRooms || 1)
          const freeRooms = Math.max(0, roomsCount - occRooms)

          const occInspectInfo = {
            title: `Công suất phòng Ngày ${formatFullDate(item.date)}`,
            subtitle: `${occRooms}/${roomsCount} phòng có khách lưu trú`,
            formula: 'Công suất ngày = (Số phòng có khách trong ngày / Tổng số phòng) × 100%',
            calculation: `${occRooms} phòng có khách / ${roomsCount} phòng tổng × 100% = ${occRate.toFixed(1)}%`,
            breakdown: [
              {
                icon: '👥',
                label: 'Phòng đang có khách',
                value: `${occRooms} phòng`,
                percent: `${occRate.toFixed(1)}%`,
                desc: 'Phòng đang có booking lưu trú qua ngày này',
              },
              {
                icon: '🚪',
                label: 'Phòng còn trống',
                value: `${freeRooms} phòng`,
                percent: `${(100 - occRate).toFixed(1)}%`,
                desc: 'Phòng sẵn sàng đón khách mới',
              },
            ],
            source: `Dữ liệu check-in/check-out thực tế của ngày ${item.date}`,
          }

          return (
            <div
              className="dash-occ-row dash-inspectable"
              key={item.date}
              onClick={() => onInspectClick(occInspectInfo)}
              title={`Bấm để xem chi tiết công suất ngày ${formatFullDate(item.date)}`}
            >
              <span className="dash-occ-date">{formatShortDate(item.date)}</span>
              <div className="dash-occ-bar-track">
                <i
                  style={{
                    width: `${Math.min(100, occRate)}%`,
                    background: occRate > 75 ? '#10b981' : occRate > 40 ? '#0284c7' : '#94a3b8',
                  }}
                />
              </div>
              <div className="dash-occ-numbers">
                <span className="dash-occ-room-counts">{occRooms}/{roomsCount} phòng</span>
                <strong>{occRate.toFixed(1)}%</strong>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const REVENUE_PALETTE = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#64748b']
const STATUS_PALETTE = ['#22c55e', '#0ea5e9', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b']

function DonutChart({ title, subtitle, items, type = 'money', palette = REVENUE_PALETTE, onInspectClick }) {
  const total = totalValue(items)
  const colors = palette
  let cursor = 0
  const gradient = items.length && total > 0
    ? items.map((item, index) => {
      const value = Number(item.value || item.count || 0)
      const start = cursor
      cursor += (value / total) * 100
      return `${colors[index % colors.length]} ${start}% ${cursor}%`
    }).join(', ')
    : '#e5e7eb 0 100%'

  const wholeInspectInfo = {
    title: `Cơ cấu ${title}`,
    subtitle: `Tổng cộng ${type === 'money' ? formatExactMoney(total) : `${formatNumber(total)} lượt`}`,
    formula: 'Tỉ trọng từng phần (%) = (Giá trị hạng mục / Tổng giá trị) × 100%',
    calculation: `Tổng giá trị biểu đồ: ${type === 'money' ? formatExactMoney(total) : `${formatNumber(total)} lượt`}`,
    breakdown: items.map((item, idx) => {
      const val = Number(item.value || item.count || 0)
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0
      return {
        icon: '',
        label: type === 'status' ? statusLabel(item.name) : item.name,
        value: type === 'money' ? formatExactMoney(val) : `${formatNumber(val)} lượt`,
        percent: `${pct}%`,
        desc: type === 'status' ? statusDescription(item.name) : `Hạng mục ${item.name}`,
      }
    }),
    source: type === 'money' ? 'Bảng Hóa đơn (Invoices)' : 'Bảng Nhật ký lưu trú (BookingDetail)',
  }

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="dash-donut-wrap">
        <div
          className="dash-donut dash-inspectable"
          style={{ background: `conic-gradient(${gradient})` }}
          onClick={() => onInspectClick(wholeInspectInfo)}
          title="Bấm để xem chi tiết cơ cấu tỉ trọng"
        >
          <span>{type === 'money' ? formatMoney(total) : formatNumber(total)}</span>
        </div>
        <div className="dash-legend">
          {items.map((item, index) => {
            const val = Number(item.value || item.count || 0)
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            const itemLabel = type === 'status' ? statusLabel(item.name) : item.name

            const itemInspectInfo = {
              title: `${title}: ${itemLabel}`,
              subtitle: `Chiếm ${pct}% trong tổng thể`,
              formula: `Tỉ trọng (%) = (Giá trị [${itemLabel}] / Tổng [${type === 'money' ? formatMoney(total) : total}]) × 100%`,
              calculation: `${type === 'money' ? formatExactMoney(val) : `${formatNumber(val)} lượt`} / ${type === 'money' ? formatExactMoney(total) : `${formatNumber(total)} lượt`} × 100% = ${pct}%`,
              breakdown: [
                {
                  icon: '',
                  label: itemLabel,
                  value: type === 'money' ? formatExactMoney(val) : `${formatNumber(val)} lượt`,
                  percent: `${pct}%`,
                  desc: type === 'status' ? statusDescription(item.name) : `Đóng góp ${pct}% vào tổng doanh thu`,
                },
              ],
              source: type === 'money' ? 'Bảng Hóa đơn (Invoices)' : 'Bảng Nhật ký lưu trú (BookingDetail)',
            }

            return (
              <div
                key={item.name}
                className="dash-inspectable"
                onClick={() => onInspectClick(itemInspectInfo)}
                title={`Bấm để xem chi tiết ${itemLabel}`}
              >
                <i style={{ background: colors[index % colors.length] }} />
                <span>{itemLabel}</span>
                <strong>{type === 'money' ? formatMoney(item.value) : formatNumber(item.count || item.value)}</strong>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RankingPanel({ title, subtitle, items, valueType = 'money', totalBasis = 0, onInspectClick }) {
  const max = Math.max(...items.map(item => Number(item.value || item.count || 0)), 1)
  const totalRankValue = items.reduce((sum, item) => sum + Number(item.value || item.count || 0), 0)

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="dash-ranking">
        {items.length ? items.map((item, index) => {
          const value = Number(item.value || item.count || 0)
          const sharePct = totalRankValue > 0 ? ((value / totalRankValue) * 100).toFixed(1) : '0'

          const rankInspectInfo = {
            title: `Xếp hạng #${index + 1}: ${item.name}`,
            subtitle: valueType === 'money' ? `Doanh thu mang lại: ${formatExactMoney(value)}` : `Số lượt đặt: ${formatNumber(value)} lượt`,
            formula: valueType === 'money'
              ? `Doanh thu phòng = Tổng giá thuê phòng (priceAtBooking) từ tất cả booking gán cho [${item.name}]`
              : `Số lượt đặt = Tổng số booking detail thuộc [${item.name}]`,
            calculation: valueType === 'money'
              ? `${formatExactMoney(value)} mang lại (chiếm ${sharePct}% tổng doanh thu các phòng trong danh sách)`
              : `${formatNumber(value)} lượt đặt (chiếm ${sharePct}% tổng lượt đặt trong danh sách)`,
            breakdown: [
              {
                icon: '',
                label: `Vị trí #${index + 1}`,
                value: valueType === 'money' ? formatExactMoney(value) : `${formatNumber(value)} lượt`,
                percent: `${sharePct}%`,
                desc: valueType === 'money' ? `Đóng góp doanh thu phòng lưu trú` : `Mức độ phổ biến được khách chọn`,
              },
            ],
            source: 'Bảng BookingDetail & Room',
          }

          return (
            <div
              className="dash-rank-row dash-inspectable"
              key={item.name}
              onClick={() => onInspectClick(rankInspectInfo)}
              title={`Bấm để xem chi tiết ${item.name}`}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <i><b style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></i>
              </div>
              <em>{valueType === 'money' ? formatMoney(item.value) : `${formatNumber(item.count)} lượt`}</em>
            </div>
          )
        }) : (
          <div className="dash-empty">Chưa có dữ liệu trong kỳ.</div>
        )}
      </div>
    </section>
  )
}

function CashStatisticsSection({ cashStats, fromDate, toDate, onInspectClick }) {
  if (!cashStats) return null

  const cashToday = Number(cashStats.cashToday || 0)
  const cashThisWeek = Number(cashStats.cashThisWeek || 0)
  const cashThisMonth = Number(cashStats.cashThisMonth || 0)
  const cashInRange = Number(cashStats.cashInFilterRange || 0)
  const transferInRange = Number(cashStats.transferInFilterRange || 0)
  const totalInRange = Number(cashStats.totalInFilterRange || (cashInRange + transferInRange))

  const trendData = cashStats.dailyCashTrend || []
  const transactions = cashStats.recentCashTransactions || []

  const maxVal = Math.max(...trendData.map(d => Math.max(Number(d.cashAmount || 0), Number(d.transferAmount || 0))), 1)

  const cashTodayInspect = {
    title: 'Tiền mặt thu trong ngày hôm nay',
    subtitle: `Hôm nay đã thu ${formatExactMoney(cashToday)} bằng tiền mặt`,
    formula: 'Tiền mặt hôm nay = SUM(Payment.amount WHERE paymentMethod = "CASH" AND status = "SUCCESS" AND paymentTime trong ngày hôm nay)',
    calculation: `Tổng cộng: ${formatExactMoney(cashToday)} tiền mặt`,
    breakdown: [
      { icon: '💵', label: 'Tiền mặt hôm nay', value: formatExactMoney(cashToday), desc: 'Các giao dịch tiền mặt đã thu từ 00:00 hôm nay' }
    ],
    source: 'Bảng Payments (giao dịch thanh toán tiền mặt)'
  }

  const cashWeekInspect = {
    title: 'Tiền mặt thu trong tuần này',
    subtitle: `Tuần này đã thu ${formatExactMoney(cashThisWeek)} bằng tiền mặt`,
    formula: 'Tiền mặt tuần này = SUM(Payment.amount WHERE paymentMethod = "CASH" AND status = "SUCCESS" AND paymentTime từ Thứ Hai đến nay)',
    calculation: `Tổng cộng: ${formatExactMoney(cashThisWeek)} tiền mặt trong tuần`,
    breakdown: [
      { icon: '💵', label: 'Tiền mặt tuần này', value: formatExactMoney(cashThisWeek), desc: 'Các giao dịch tiền mặt từ đầu tuần (Thứ 2) đến nay' }
    ],
    source: 'Bảng Payments (giao dịch thanh toán tiền mặt)'
  }

  const cashMonthInspect = {
    title: 'Tiền mặt thu trong tháng này',
    subtitle: `Tháng này đã thu ${formatExactMoney(cashThisMonth)} bằng tiền mặt`,
    formula: 'Tiền mặt tháng này = SUM(Payment.amount WHERE paymentMethod = "CASH" AND status = "SUCCESS" AND paymentTime từ ngày 1 của tháng đến nay)',
    calculation: `Tổng cộng: ${formatExactMoney(cashThisMonth)} tiền mặt trong tháng`,
    breakdown: [
      { icon: '💵', label: 'Tiền mặt tháng này', value: formatExactMoney(cashThisMonth), desc: 'Các giao dịch tiền mặt từ đầu tháng đến nay' }
    ],
    source: 'Bảng Payments (giao dịch thanh toán tiền mặt)'
  }

  return (
    <section className="dash-cash-section">
      <div className="dash-cash-section-head">
        <div>
          <h2>💵 Thống kê Thu tiền mặt & Chuyển khoản tự động</h2>
          <p>Hệ thống tự động tổng hợp tiền mặt phát sinh từ các đơn trong ngày, tuần, tháng và đối soát dòng tiền thanh toán.</p>
        </div>
        <div className="dash-cash-badge-pill">
          <span>⚡ Tự động cập nhật</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="dash-cash-kpis-grid">
        <div
          className="dash-cash-kpi-card dash-inspectable"
          onClick={() => onInspectClick(cashTodayInspect)}
          title="Bấm để xem chi tiết tiền mặt hôm nay"
        >
          <div className="dash-cash-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <span>📅</span>
          </div>
          <div className="dash-cash-kpi-info">
            <span className="dash-cash-kpi-label">Tiền mặt Hôm nay</span>
            <strong className="dash-cash-kpi-value" style={{ color: '#059669' }}>{formatExactMoney(cashToday)}</strong>
            <small className="dash-cash-kpi-sub">Thu trong ngày {new Date().toLocaleDateString('vi-VN')}</small>
          </div>
        </div>

        <div
          className="dash-cash-kpi-card dash-inspectable"
          onClick={() => onInspectClick(cashWeekInspect)}
          title="Bấm để xem chi tiết tiền mặt tuần này"
        >
          <div className="dash-cash-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <span>📆</span>
          </div>
          <div className="dash-cash-kpi-info">
            <span className="dash-cash-kpi-label">Tiền mặt Tuần này</span>
            <strong className="dash-cash-kpi-value" style={{ color: '#2563eb' }}>{formatExactMoney(cashThisWeek)}</strong>
            <small className="dash-cash-kpi-sub">Từ đầu tuần (Thứ Hai) đến nay</small>
          </div>
        </div>

        <div
          className="dash-cash-kpi-card dash-inspectable"
          onClick={() => onInspectClick(cashMonthInspect)}
          title="Bấm để xem chi tiết tiền mặt tháng này"
        >
          <div className="dash-cash-kpi-icon" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <span>🗓️</span>
          </div>
          <div className="dash-cash-kpi-info">
            <span className="dash-cash-kpi-label">Tiền mặt Tháng này</span>
            <strong className="dash-cash-kpi-value" style={{ color: '#9333ea' }}>{formatExactMoney(cashThisMonth)}</strong>
            <small className="dash-cash-kpi-sub">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</small>
          </div>
        </div>

        <div className="dash-cash-kpi-card dash-cash-kpi-card--range">
          <div className="dash-cash-kpi-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <span>⚖️</span>
          </div>
          <div className="dash-cash-kpi-info">
            <span className="dash-cash-kpi-label">Trong kỳ lọc ({formatShortDate(fromDate)} → {formatShortDate(toDate)})</span>
            <div className="dash-cash-split-values">
              <span>Tiền mặt: <strong style={{ color: '#059669' }}>{formatCompactMoney(cashInRange)}</strong></span>
              <span>Chuyển khoản: <strong style={{ color: '#2563eb' }}>{formatCompactMoney(transferInRange)}</strong></span>
            </div>
            <small className="dash-cash-kpi-sub">Tổng thu: <strong>{formatExactMoney(totalInRange)}</strong></small>
          </div>
        </div>
      </div>

      {/* Daily Cash vs Transfer Chart */}
      <div className="dash-cash-chart-panel">
        <div className="dash-panel-head">
          <div>
            <h3>📈 Biểu đồ so sánh Tiền mặt & Chuyển khoản theo ngày</h3>
            <p>Đối chiếu lượng tiền mặt thu tại quầy với tiền chuyển khoản online từng ngày trong kỳ lọc.</p>
          </div>
          <div className="dash-revenue-legend-head">
            <span className="dash-leg-tag" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              💵 Tiền mặt: {formatCompactMoney(cashInRange)}
            </span>
            <span className="dash-leg-tag" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              💳 Chuyển khoản: {formatCompactMoney(transferInRange)}
            </span>
          </div>
        </div>

        <div className="dash-cash-chart-scroll">
          <div className="dash-cash-chart" style={{ '--cash-days': Math.max(trendData.length, 1) }}>
            <div className="dash-cash-bars-wrapper">
              {trendData.map(item => {
                const c = Number(item.cashAmount || 0)
                const t = Number(item.transferAmount || 0)
                const cHeight = Math.max(c > 0 ? 8 : 2, (c / maxVal) * 100)
                const tHeight = Math.max(t > 0 ? 8 : 2, (t / maxVal) * 100)

                return (
                  <div className="dash-cash-day-col" key={item.date} title={`Ngày ${formatFullDate(item.date)}: Tiền mặt ${formatExactMoney(c)} | Chuyển khoản ${formatExactMoney(t)}`}>
                    <div className="dash-cash-dual-bars">
                      <div className="dash-cash-bar dash-cash-bar--cash" style={{ height: `${cHeight}%` }}>
                        {c > 0 && <span className="dash-cash-bar-label">{formatCompactMoney(c)}</span>}
                      </div>
                      <div className="dash-cash-bar dash-cash-bar--transfer" style={{ height: `${tHeight}%` }}>
                        {t > 0 && <span className="dash-cash-bar-label">{formatCompactMoney(t)}</span>}
                      </div>
                    </div>
                    <span className="dash-cash-day-date">{formatShortDate(item.date)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cash Transactions Table */}
      <div className="dash-cash-table-panel">
        <div className="dash-panel-head">
          <div>
            <h3>📝 Danh sách các khoản tiền mặt phát sinh trong kỳ</h3>
            <p>Chi tiết các đơn thanh toán bằng tiền mặt để quản trị viên và kế toán đối soát.</p>
          </div>
          <span className="dash-cash-table-count">Tổng {transactions.length} giao dịch</span>
        </div>

        {transactions.length === 0 ? (
          <div className="dash-empty" style={{ padding: '32px 0' }}>Không có giao dịch tiền mặt nào phát sinh trong khoảng thời gian đã chọn.</div>
        ) : (
          <div className="dash-cash-table-wrapper">
            <table className="dash-cash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Mục đích</th>
                  <th>Thời gian thu</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 30).map((tx, idx) => (
                  <tr key={tx.paymentId || idx}>
                    <td><strong>{idx + 1}</strong></td>
                    <td><span className="dash-cash-code">{tx.bookingCode || '—'}</span></td>
                    <td><strong>{tx.customerName || 'Khách vãng lai'}</strong></td>
                    <td>
                      <span className="dash-cash-purpose-badge">
                        {tx.paymentPurpose === 'BOOKING' ? 'Đặt cọc phòng' : tx.paymentPurpose === 'CHECKOUT' ? 'Thanh toán check-out' : tx.paymentPurpose || 'Thanh toán'}
                      </span>
                    </td>
                    <td>{tx.paymentTime ? new Date(tx.paymentTime).toLocaleString('vi-VN') : '—'}</td>
                    <td><strong className="dash-cash-amount">{formatExactMoney(tx.amount)}</strong></td>
                    <td><span className="dash-cash-status-tag">✓ Đã thu</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function WeeklyReportsModal({
  onClose,
  reports,
  loading,
  generating,
  message,
  onGenerateNow,
  onDownload,
}) {
  return (
    <div className="dash-inspect-overlay" onClick={onClose}>
      <div className="dash-inspect-modal dash-weekly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-inspect-modal-header">
          <div>
            <span className="dash-inspect-badge"> BÁO CÁO TUẦN TỰ ĐỘNG</span>
            <h3>Bản Báo Cáo Excel Tự Động Hàng Tuần</h3>
            <p>Hệ thống tự động tổng hợp số liệu 7 ngày và sinh file Excel vào lúc 06:00 sáng Thứ Hai hàng tuần.</p>
          </div>
          <button type="button" className="dash-inspect-modal-close-btn" onClick={onClose}></button>
        </div>

        <div className="dash-inspect-modal-body">
          <div className="dash-weekly-actions-bar">
            <button
              type="button"
              className="dash-btn-generate-now"
              onClick={onGenerateNow}
              disabled={generating}
            >
              {generating ? ' Đang tạo bản tuần này...' : ' Tạo ngay báo cáo tuần này'}
            </button>
            {message && <span className="dash-weekly-msg">{message}</span>}
          </div>

          {loading ? (
            <div className="dash-weekly-loading">Đang tải danh sách báo cáo tuần...</div>
          ) : reports.length === 0 ? (
            <div className="dash-weekly-empty">
              <p>Chưa có bản báo cáo tuần nào được lưu trữ.</p>
              <small>Hệ thống sẽ tự động tạo vào 06:00 thứ Hai, hoặc bạn có thể bấm nút "Tạo ngay báo cáo tuần này" ở trên.</small>
            </div>
          ) : (
            <div className="dash-weekly-list">
              {reports.map((report) => (
                <div className="dash-weekly-item" key={report.fileName}>
                  <div className="dash-weekly-item-icon"></div>
                  <div className="dash-weekly-item-info">
                    <strong>{report.dateRangeLabel || report.fileName}</strong>
                    <span>
                      {report.fileName} · {(report.fileSizeBytes / 1024).toFixed(1)} KB · Tạo: {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dash-weekly-download-btn"
                    onClick={() => onDownload(report.fileName)}
                  >
                    ⬇️ Tải Excel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-inspect-modal-footer">
          <button type="button" className="btn-dash-inspect-done" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State cho Xuất Excel & Báo cáo tuần
  const [exporting, setExporting] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [generatingWeekly, setGeneratingWeekly] = useState(false)
  const [weeklyMessage, setWeeklyMessage] = useState('')

  // State cho Modal Click Soi Chi Tiết & Giải Trình
  const [modalInspectInfo, setModalInspectInfo] = useState(null)

function triggerFileDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    window.URL.revokeObjectURL(url)
    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }
  }, 2000)
}

  const handleExportExcel = async () => {
    try {
      setExporting(true)
      setError('')
      const response = await fetch(`${API_BASE}/export-excel?fromDate=${fromDate}&toDate=${toDate}`, {
        headers: authHeaders(),
      })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.message || `Lỗi (${response.status}): Không thể xuất file Excel báo cáo.`)
      }
      const rawBlob = await response.blob()
      const excelBlob = new Blob([rawBlob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      triggerFileDownload(excelBlob, `Bao_Cao_Tong_Quan_${fromDate}_Den_${toDate}.xlsx`)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const loadWeeklyReports = async () => {
    try {
      setLoadingWeekly(true)
      setWeeklyMessage('')
      const response = await fetch(`${API_BASE}/weekly-reports`, {
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Không thể tải danh sách báo cáo tuần.')
      const data = await response.json()
      setWeeklyReports(data)
    } catch (err) {
      setWeeklyMessage(err.message)
    } finally {
      setLoadingWeekly(false)
    }
  }

  const handleDownloadWeekly = async (fileName) => {
    try {
      const response = await fetch(`${API_BASE}/weekly-reports/download?file=${encodeURIComponent(fileName)}`, {
        headers: authHeaders(),
      })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.message || `Lỗi (${response.status}): Không thể tải file báo cáo tuần.`)
      }
      const rawBlob = await response.blob()
      const excelBlob = new Blob([rawBlob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      triggerFileDownload(excelBlob, fileName)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleGenerateWeeklyNow = async () => {
    try {
      setGeneratingWeekly(true)
      setWeeklyMessage('')
      const response = await fetch(`${API_BASE}/weekly-reports/generate-now`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Không thể tạo báo cáo tuần.')
      setWeeklyMessage(' Đã tạo thành công bản báo cáo tuần mới nhất!')
      loadWeeklyReports()
    } catch (err) {
      setWeeklyMessage(' ' + err.message)
    } finally {
      setGeneratingWeekly(false)
    }
  }

  const loadSummary = useCallback(async () => {
    if (fromDate > toDate) {
      setError('Ngày bắt đầu không được sau ngày kết thúc.')
      setSummary(null)
      return
    }

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ fromDate, toDate })
      const response = await fetch(`${API_BASE}/summary?${params}`, { headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể tải dữ liệu tổng quan')
      setSummary(data)
    } catch (err) {
      setError(err.message)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleInspectClick = (info) => {
    setModalInspectInfo(info)
  }

  const kpis = summary?.kpis || {}
  const roomTypeItems = useMemo(() => summary?.roomTypeBreakdown || [], [summary])

  // Tính số ngày trong kỳ lọc
  const daysInPeriod = useMemo(() => {
    if (!fromDate || !toDate) return 30
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const diffTime = Math.abs(end - start)
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1)
  }, [fromDate, toDate])

  // Chuẩn bị thông tin giải trình chi tiết cho 4 thẻ KPI
  const revenueKpiInfo = useMemo(() => {
    const totalRev = Number(kpis.totalRevenue || 0)
    const roomRev = Number(kpis.roomRevenue || 0)
    const servRev = Number(kpis.serviceRevenue || 0)
    const penRev = Number(kpis.penaltyRevenue || 0)
    return {
      title: 'Doanh thu thuần trong kỳ',
      subtitle: `Kỳ báo cáo: ${formatFullDate(fromDate)} đến ${formatFullDate(toDate)} (${daysInPeriod} ngày)`,
      formula: 'Tổng Doanh Thu = Tổng Tiền Phòng + Tổng Phí Dịch Vụ + Tổng Phạt/Phụ Thu',
      calculation: `${formatExactMoney(roomRev)} (Tiền phòng) + ${formatExactMoney(servRev)} (Dịch vụ) + ${formatExactMoney(penRev)} (Phạt) = ${formatExactMoney(totalRev)}`,
      breakdown: [
        {
          icon: '🏨',
          label: 'Doanh thu Tiền phòng',
          value: formatExactMoney(roomRev),
          percent: totalRev > 0 ? `${((roomRev / totalRev) * 100).toFixed(1)}%` : '0%',
          desc: 'Tổng tiền thuê phòng thực thu từ các hóa đơn',
        },
        {
          icon: '🥤',
          label: 'Doanh thu Dịch vụ',
          value: formatExactMoney(servRev),
          percent: totalRev > 0 ? `${((servRev / totalRev) * 100).toFixed(1)}%` : '0%',
          desc: 'Tiện ích, đồ uống, giặt là, thuê xe máy',
        },
        {
          icon: '⚠️',
          label: 'Phạt & Phụ phí',
          value: formatExactMoney(penRev),
          percent: totalRev > 0 ? `${((penRev / totalRev) * 100).toFixed(1)}%` : '0%',
          desc: 'Phụ thu quá giờ, thêm người, bồi thường đồ hỏng',
        },
      ],
      source: 'Bảng Hóa đơn (Invoices) hoàn tất thanh toán trong khoảng thời gian đã chọn',
    }
  }, [kpis, fromDate, toDate, daysInPeriod])

  const bookingKpiInfo = useMemo(() => {
    const bookingCount = Number(kpis.bookingCount || 0)
    const statusItems = summary?.bookingStatusBreakdown || []
    return {
      title: 'Tổng số đơn Đặt phòng (Bookings)',
      subtitle: `Có ${bookingCount} đơn booking phát sinh lưu trú trong kỳ`,
      formula: 'Tổng Booking = COUNT(DISTINCT Booking ID có ngày lưu trú giao thoa với kỳ lọc)',
      calculation: `Ghi nhận ${bookingCount} đơn đặt phòng duy nhất với các trạng thái lưu trú bên dưới`,
      breakdown: statusItems.map((item) => ({
        icon: '📋',
        label: statusLabel(item.name),
        value: `${formatNumber(item.count || item.value)} lượt phòng`,
        desc: statusDescription(item.name),
      })),
      source: 'Bảng Booking & BookingDetail từ ngày ' + formatFullDate(fromDate) + ' đến ' + formatFullDate(toDate),
    }
  }, [kpis, summary, fromDate, toDate])

  const occupancyKpiInfo = useMemo(() => {
    const avgRate = Number(kpis.averageOccupancyRate || 0)
    const occupiedNights = Number(kpis.occupiedRoomNights || 0)
    const totalRooms = Number(kpis.totalRooms || 0)
    const totalCapacityNights = totalRooms * daysInPeriod
    return {
      title: 'Công suất phòng trung bình (Average Occupancy Rate)',
      subtitle: `Đo lường hiệu suất lấp đầy phòng trong suốt ${daysInPeriod} ngày`,
      formula: 'Công suất TB = (Tổng phòng-đêm đã dùng / (Tổng số phòng × Số ngày trong kỳ)) × 100%',
      calculation: `${formatNumber(occupiedNights)} phòng·ngày / (${totalRooms} phòng × ${daysInPeriod} ngày) × 100% = ${avgRate.toFixed(1)}%`,
      breakdown: [
        {
          icon: '🛏️',
          label: 'Số phòng-đêm đã sử dụng',
          value: `${formatNumber(occupiedNights)} phòng·ngày`,
          desc: 'Tổng số đêm có khách lưu trú tại các phòng',
        },
        {
          icon: '🚪',
          label: 'Tổng công suất tối đa khả dụng',
          value: `${formatNumber(totalCapacityNights)} phòng·ngày`,
          desc: `${totalRooms} phòng × ${daysInPeriod} ngày trong kỳ`,
        },
        {
          icon: '📊',
          label: 'Tỉ lệ khai thác đạt được',
          value: `${avgRate.toFixed(1)}%`,
          desc: 'Mức độ lấp đầy thực tế so với tiềm năng tối đa',
        },
      ],
      source: 'Tổng hợp dữ liệu lưu trú từng ngày từ bảng BookingDetail',
    }
  }, [kpis, daysInPeriod])

  const roomsKpiInfo = useMemo(() => {
    const totalRooms = Number(kpis.totalRooms || 0)
    return {
      title: 'Tổng số lượng phòng trong hệ thống',
      subtitle: `${totalRooms} phòng vật lý đang được quản lý`,
      formula: 'Tổng phòng = COUNT(Phòng trong hệ thống Homestay)',
      calculation: `Hệ thống hiện có ${totalRooms} phòng đang sẵn sàng tiếp đón khách lưu trú`,
      breakdown: (summary?.topRooms || []).map((item) => ({
        icon: '🏠',
        label: item.name,
        value: 'Đang hoạt động',
        desc: `Doanh thu tạo ra trong kỳ: ${formatMoney(item.value)}`,
      })),
      source: 'Bảng Phòng (Rooms) trong cơ sở dữ liệu Homestay',
    }
  }, [kpis, summary])

  const maintenanceKpiInfo = useMemo(() => {
    const maintCost = Number(kpis.maintenanceExpense || 0)
    return {
      title: 'Chi phí bảo trì & sửa chữa nội bộ',
      subtitle: `Tổng chi phí Homestay tự chi trả trong kỳ: ${formatFullDate(fromDate)} đến ${formatFullDate(toDate)}`,
      formula: 'Tổng Chi Phí Bảo Trì = SUM(Chi phí các sự cố có Trách nhiệm = Homestay tự chịu)',
      calculation: `Ghi nhận tổng chi phí ${formatExactMoney(maintCost)} từ các sự cố phòng/thiết bị do Homestay chịu`,
      breakdown: [
        {
          icon: '🛠️',
          label: 'Chi phí sửa chữa & bảo trì',
          value: formatExactMoney(maintCost),
          percent: '100%',
          desc: 'Chi phí vật tư, linh kiện thay thế, công thợ sửa chữa do Homestay chi trả',
        },
      ],
      source: 'Bảng Báo cáo sự cố phòng (Room Incidents) với bên chịu trách nhiệm là Homestay',
    }
  }, [kpis, fromDate, toDate])

  return (
    <AdminLayout activePage="dashboard">
      <div className="dash-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Phân tích doanh thu, công suất phòng, booking và hiệu quả khai thác phòng.</p>
        </div>
        <div className="dash-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '175px', minWidth: '165px' }}>
            <DateDropdownPicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="Từ ngày..."
              className="date-dropdown-picker--compact"
            />
          </div>
          <div style={{ width: '175px', minWidth: '165px' }}>
            <DateDropdownPicker
              value={toDate}
              onChange={(val) => setToDate(val)}
              placeholder="Đến ngày..."
              className="date-dropdown-picker--compact"
            />
          </div>
          <button type="button" onClick={loadSummary} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
          <button
            type="button"
            className="dash-btn-excel"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            title="Xuất toàn bộ số liệu tổng quan ra file Excel (.xlsx)"
          >
            {exporting ? (
              <>Đang xuất Excel...</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="8" y1="13" x2="16" y2="13"></line>
                  <line x1="8" y1="17" x2="16" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Xuất Excel báo cáo
              </>
            )}
          </button>
        </div>
      </div>

      {error ? <div className="dash-message dash-message--error">{error}</div> : null}

      <section className="dash-kpis">
        <KpiCard
          label="Doanh thu"
          value={formatMoney(kpis.totalRevenue)}
          hint="Tổng hóa đơn trong kỳ"
          tone="revenue"
          inspectInfo={revenueKpiInfo}
          onInspectClick={handleInspectClick}
        />
        <KpiCard
          label="Phí bảo trì nội bộ"
          value={formatMoney(kpis.maintenanceExpense || 0)}
          hint="Homestay tự bảo trì"
          tone="maintenance"
          inspectInfo={maintenanceKpiInfo}
          onInspectClick={handleInspectClick}
        />
        <KpiCard
          label="Booking"
          value={formatNumber(kpis.bookingCount)}
          hint="Booking có lưu trú trong kỳ"
          tone="booking"
          inspectInfo={bookingKpiInfo}
          onInspectClick={handleInspectClick}
        />
        <KpiCard
          label="Công suất TB"
          value={`${Number(kpis.averageOccupancyRate || 0).toFixed(1)}%`}
          hint={`${formatNumber(kpis.occupiedRoomNights)} phòng-ngày đã dùng`}
          tone="occupancy"
          inspectInfo={occupancyKpiInfo}
          onInspectClick={handleInspectClick}
        />
        <KpiCard
          label="Tổng phòng"
          value={formatNumber(kpis.totalRooms)}
          hint="Số phòng đang quản lý"
          tone="rooms"
          inspectInfo={roomsKpiInfo}
          onInspectClick={handleInspectClick}
        />
      </section>

      {loading && !summary ? (
        <div className="dash-empty dash-empty--page">Đang tải dữ liệu tổng quan...</div>
      ) : summary ? (
        <>
          <div className="dash-grid dash-grid--top">
            <RevenueChart
              data={summary.revenueTrend || []}
              onInspectClick={handleInspectClick}
            />
            <DonutChart
              title="Cơ cấu doanh thu"
              subtitle="Tỉ trọng tiền phòng, dịch vụ và phạt/phụ thu."
              items={summary.revenueBreakdown || []}
              palette={REVENUE_PALETTE}
              onInspectClick={handleInspectClick}
            />
          </div>

          <CashStatisticsSection
            cashStats={summary.cashStatistics}
            fromDate={fromDate}
            toDate={toDate}
            onInspectClick={handleInspectClick}
          />

          <div className="dash-grid">
            <OccupancyChart
              data={summary.occupancyTrend || []}
              totalRooms={Number(kpis.totalRooms || 10)}
              onInspectClick={handleInspectClick}
            />
            <DonutChart
              title="Trạng thái lưu trú"
              subtitle="Số booking detail theo trạng thái."
              items={summary.bookingStatusBreakdown || []}
              type="status"
              palette={STATUS_PALETTE}
              onInspectClick={handleInspectClick}
            />
          </div>

          <div className="dash-grid">
            <RankingPanel
              title="Top phòng theo doanh thu"
              subtitle="Doanh thu đặt phòng ước tính theo booking detail."
              items={summary.topRooms || []}
              totalBasis={Number(kpis.roomRevenue || 0)}
              onInspectClick={handleInspectClick}
            />
            <RankingPanel
              title="Loại phòng được đặt nhiều"
              subtitle="Số lượt đặt theo từng loại phòng."
              items={roomTypeItems}
              valueType="count"
              totalBasis={summary.bookingStatusBreakdown ? totalValue(summary.bookingStatusBreakdown) : 0}
              onInspectClick={handleInspectClick}
            />
          </div>
        </>
      ) : (
        <div className="dash-empty dash-empty--page">Chưa có dữ liệu để hiển thị.</div>
      )}

      {/* Modal Click Soi Chi Tiết & Giải Trình */}
      {modalInspectInfo && (
        <MetricInspectModal
          info={modalInspectInfo}
          onClose={() => setModalInspectInfo(null)}
        />
      )}

      {/* Modal Quản lý & Tải Báo Cáo Tuần Tự Động */}
      {showWeeklyModal && (
        <WeeklyReportsModal
          onClose={() => setShowWeeklyModal(false)}
          reports={weeklyReports}
          loading={loadingWeekly}
          generating={generatingWeekly}
          message={weeklyMessage}
          onGenerateNow={handleGenerateWeeklyNow}
          onDownload={handleDownloadWeekly}
        />
      )}
    </AdminLayout>
  )
}

export default DashboardPage
