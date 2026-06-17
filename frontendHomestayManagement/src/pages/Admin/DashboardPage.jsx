import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './DashboardPage.css'

const API_BASE = 'http://localhost:8080/api/admin/dashboard'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
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
  date.setDate(date.getDate() - 29)
  return toDateInputValue(date)
}

function defaultToDate() {
  return toDateInputValue(new Date())
}

function formatMoney(value) {
  const amount = Number(value || 0)
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} tr`
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

function totalValue(items) {
  return items.reduce((sum, item) => sum + Number(item.value || 0), 0)
}

function KpiCard({ label, value, hint, tone }) {
  return (
    <article className={`dash-kpi${tone ? ` dash-kpi--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

function RevenueChart({ data }) {
  const max = Math.max(...data.map(item => Number(item.totalRevenue || 0)), 1)
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100
    const y = 100 - (Number(item.totalRevenue || 0) / max) * 82 - 8
    return `${x},${y}`
  }).join(' ')

  return (
    <section className="dash-panel dash-panel--large">
      <div className="dash-panel-head">
        <div>
          <h2>Doanh thu theo ngày</h2>
          <p>Tổng doanh thu hóa đơn, gồm tiền phòng, dịch vụ và phạt/phụ thu.</p>
        </div>
      </div>
      <div className="dash-revenue-scroll">
        <div className="dash-revenue-chart" style={{ '--chart-days': Math.max(data.length, 1) }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Biểu đồ doanh thu">
            <polyline points={points} />
          </svg>
          <div className="dash-bars">
            {data.map(item => {
              const height = Math.max(4, (Number(item.totalRevenue || 0) / max) * 100)
              return (
                <div className="dash-bar-day" key={item.date}>
                  <span className="dash-bar" style={{ height: `${height}%` }} title={`${formatShortDate(item.date)}: ${formatMoney(item.totalRevenue)}`} />
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

function OccupancyChart({ data }) {
  const average = data.length
    ? data.reduce((sum, item) => sum + Number(item.occupancyRate || 0), 0) / data.length
    : 0

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <h2>Công suất phòng</h2>
          <p>Tỉ lệ phòng có khách theo từng ngày.</p>
        </div>
        <strong>{average.toFixed(1)}%</strong>
      </div>
      <div className="dash-occupancy">
        {data.map(item => (
          <div className="dash-occ-row" key={item.date}>
            <span>{formatShortDate(item.date)}</span>
            <div><i style={{ width: `${Math.min(100, Number(item.occupancyRate || 0))}%` }} /></div>
            <strong>{Number(item.occupancyRate || 0).toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

const REVENUE_PALETTE = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#64748b']
const STATUS_PALETTE = ['#22c55e', '#0ea5e9', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b']

function DonutChart({ title, subtitle, items, type = 'money', palette = REVENUE_PALETTE }) {
  const total = totalValue(items)
  const colors = palette
  let cursor = 0
  const gradient = items.length && total > 0
    ? items.map((item, index) => {
      const value = Number(item.value || 0)
      const start = cursor
      cursor += (value / total) * 100
      return `${colors[index % colors.length]} ${start}% ${cursor}%`
    }).join(', ')
    : '#e5e7eb 0 100%'

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="dash-donut-wrap">
        <div className="dash-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <span>{type === 'money' ? formatMoney(total) : formatNumber(total)}</span>
        </div>
        <div className="dash-legend">
          {items.map((item, index) => (
            <div key={item.name}>
              <i style={{ background: colors[index % colors.length] }} />
              <span>{type === 'status' ? statusLabel(item.name) : item.name}</span>
              <strong>{type === 'money' ? formatMoney(item.value) : formatNumber(item.count || item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RankingPanel({ title, subtitle, items, valueType = 'money' }) {
  const max = Math.max(...items.map(item => Number(item.value || item.count || 0)), 1)

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
          return (
            <div className="dash-rank-row" key={item.name}>
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

function DashboardPage() {
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    // The request updates loading state before synchronizing with the dashboard API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary()
  }, [loadSummary])

  const kpis = summary?.kpis || {}
  const roomTypeItems = useMemo(() => summary?.roomTypeBreakdown || [], [summary])

  return (
    <AdminLayout activePage="dashboard">
      <div className="dash-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Phân tích doanh thu, công suất phòng, booking và hiệu quả khai thác phòng.</p>
        </div>
        <div className="dash-actions">
          <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} />
          <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
          <button type="button" onClick={loadSummary} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
        </div>
      </div>

      {error ? <div className="dash-message dash-message--error">{error}</div> : null}

      <section className="dash-kpis">
        <KpiCard label="Doanh thu" value={formatMoney(kpis.totalRevenue)} hint="Tổng hóa đơn trong kỳ" tone="revenue" />
        <KpiCard label="Booking" value={formatNumber(kpis.bookingCount)} hint="Booking có lưu trú trong kỳ" tone="booking" />
        <KpiCard label="Công suất TB" value={`${Number(kpis.averageOccupancyRate || 0).toFixed(1)}%`} hint={`${formatNumber(kpis.occupiedRoomNights)} phòng-ngày đã dùng`} tone="occupancy" />
        <KpiCard label="Tổng phòng" value={formatNumber(kpis.totalRooms)} hint="Số phòng đang quản lý" tone="rooms" />
      </section>

      {loading && !summary ? (
        <div className="dash-empty dash-empty--page">Đang tải dữ liệu tổng quan...</div>
      ) : summary ? (
        <>
          <div className="dash-grid dash-grid--top">
            <RevenueChart data={summary.revenueTrend || []} />
            <DonutChart
              title="Cơ cấu doanh thu"
              subtitle="Tỉ trọng tiền phòng, dịch vụ và phạt/phụ thu."
              items={summary.revenueBreakdown || []}
              palette={REVENUE_PALETTE}
            />
          </div>

          <div className="dash-grid">
            <OccupancyChart data={summary.occupancyTrend || []} />
            <DonutChart
              title="Trạng thái lưu trú"
              subtitle="Số booking detail theo trạng thái."
              items={summary.bookingStatusBreakdown || []}
              type="status"
              palette={STATUS_PALETTE}
            />
          </div>

          <div className="dash-grid">
            <RankingPanel title="Top phòng theo doanh thu" subtitle="Doanh thu đặt phòng ước tính theo booking detail." items={summary.topRooms || []} />
            <RankingPanel title="Loại phòng được đặt nhiều" subtitle="Số lượt đặt theo từng loại phòng." items={roomTypeItems} valueType="count" />
          </div>
        </>
      ) : (
        <div className="dash-empty dash-empty--page">Chưa có dữ liệu để hiển thị.</div>
      )}
    </AdminLayout>
  )
}

export default DashboardPage
