import { useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import AdminLayout from './AdminLayout'
import './AdminInvoicesPage.css'

const API = (import.meta.env.VITE_API_URL || '') + '/api/admin/invoices'
const PAGE_SIZE = 6

function bookingDisplay(booking) {
  return booking?.bookingCode || `#${booking?.bookingId || ''}`
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

const METHOD_LABEL = {
  CASH: 'Tiền mặt',
  VNPAY: 'VNPAY',
  MOMO: 'MoMo',
  BANK_TRANSFER: 'Chuyển khoản',
}

const STATUS_LABEL = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  PENDING: 'Đang chờ',
}

function methodLabel(method) {
  return METHOD_LABEL[method] || method || 'Chưa thanh toán'
}

function statusLabel(status) {
  return STATUS_LABEL[status] || status || 'Đang chờ'
}

function statusClass(status) {
  if (status === 'SUCCESS') return 'ain-badge ain-badge--success'
  if (status === 'FAILED') return 'ain-badge ain-badge--failed'
  return 'ain-badge ain-badge--pending'
}

function serviceTypeLabel(type) {
  if (type === 'FACILITY') return 'Tiện ích'
  if (type === 'INVENTORY') return 'Thuê đồ'
  if (type === 'MINI_BAR') return 'Mini-bar'
  if (type === 'ADJUSTMENT') return 'Điều chỉnh'
  return 'Dịch vụ'
}

function hasInvoiceVoucher(invoice) {
  return Boolean(invoice?.voucherCode) || Number(invoice?.roomDiscountAmount || 0) > 0
}

function InvoiceDetailModal({ invoice, onClose, onExportExcel, exporting }) {
  return (
    <div className="ain-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ain-modal">
        <div className="ain-modal-head">
          <div>
            <h3>Hóa đơn #{invoice.id}</h3>
            <p>Booking {bookingDisplay(invoice)} · {invoice.customerName}</p>
          </div>
          <div className="ain-modal-actions">
            <button
              type="button"
              className="ain-modal-excel-btn"
              onClick={() => onExportExcel({ invoiceId: invoice.id })}
              disabled={exporting}
            >
              {exporting ? 'Đang tải...' : '📊 Tải hóa đơn Excel'}
            </button>
            <button type="button" className="ain-modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="ain-modal-body">
          <div className="ain-detail-grid">
            {hasInvoiceVoucher(invoice) && (
              <>
                <div><span>Tiền phòng gốc</span><strong>{formatMoney(invoice.roomChargeBeforeDiscount)}</strong></div>
                <div><span>Voucher</span><strong>{invoice.voucherCode || 'Đã áp dụng'}</strong></div>
                <div><span>Số tiền đã giảm</span><strong>-{formatMoney(invoice.roomDiscountAmount)}</strong></div>
              </>
            )}
            <div><span>Tiền phòng</span><strong>{formatMoney(invoice.roomCharge)}</strong></div>
            <div><span>Dịch vụ</span><strong>{formatMoney(invoice.serviceCharge)}</strong></div>
            <div><span>Phạt</span><strong>{formatMoney(invoice.penaltyCharge)}</strong></div>
            <div><span>Tổng hóa đơn</span><strong>{formatMoney(invoice.totalAmount)}</strong></div>
            <div><span>Đã thanh toán</span><strong>{formatMoney(invoice.paidAmount)}</strong></div>
            <div><span>Còn lại</span><strong>{formatMoney(invoice.remainingAmount)}</strong></div>
          </div>

          <div className="ain-detail-section">
            <h4>Chi tiết dịch vụ đã sử dụng</h4>
            {invoice.serviceItems?.length ? (
              <div className="ain-line-list">
                {invoice.serviceItems.map(item => (
                  <div className="ain-line-row" key={`${item.type}-${item.id}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{serviceTypeLabel(item.type)} · SL {item.quantity} × {formatMoney(item.unitPrice)}</span>
                    </div>
                    <strong>{formatMoney(item.totalPrice)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ain-empty ain-empty--sm">Hóa đơn này chưa ghi nhận dịch vụ phát sinh.</div>
            )}
          </div>

          <div className="ain-detail-section">
            <h4>Chi tiết phạt</h4>
            {invoice.penaltyItems?.length ? (
              <div className="ain-line-list">
                {invoice.penaltyItems.map(item => (
                  <div className="ain-line-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description || 'Không có ghi chú'}</span>
                    </div>
                    <strong>{formatMoney(item.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ain-empty ain-empty--sm">Hóa đơn này không có khoản phạt.</div>
            )}
          </div>

          <h4>Lịch sử thanh toán</h4>
          {invoice.payments?.length ? (
            <div className="ain-payment-list">
              {invoice.payments.map(payment => (
                <div className="ain-payment-row" key={payment.id}>
                  <div>
                    <strong>{methodLabel(payment.paymentMethod)}</strong>
                    <span>{payment.transactionNo || 'Không có mã giao dịch'}</span>
                  </div>
                  <div>
                    <strong>{formatMoney(payment.amount)}</strong>
                    <span>{formatAppDateTime(payment.paymentTime)}</span>
                  </div>
                  <span className={statusClass(payment.status)}>{statusLabel(payment.status)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ain-empty ain-empty--sm">Hóa đơn chưa có giao dịch thanh toán.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function getThisWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const pad = (n) => String(n).padStart(2, '0')
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return {
    fromDate: toYMD(monday),
    toDate: toYMD(sunday)
  }
}

function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const initialWeek = useMemo(() => getThisWeekRange(), [])
  const [fromDate, setFromDate] = useState(initialWeek.fromDate)
  const [toDate, setToDate] = useState(initialWeek.toDate)
  const [datePreset, setDatePreset] = useState('THIS_WEEK')
  const exportMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchInvoices = () => {
    setLoading(true)
    setError('')
    fetch(API, { headers: authHeaders() })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách hóa đơn')
        return data
      })
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Không thể tải danh sách hóa đơn'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleExportExcel = async (params = {}) => {
    try {
      setExporting(true)
      setError('')
      const query = new URLSearchParams()
      if (params.invoiceId) query.append('invoiceId', params.invoiceId)
      if (params.bookingId) query.append('bookingId', params.bookingId)
      if (params.fromDate) query.append('fromDate', params.fromDate)
      if (params.toDate) query.append('toDate', params.toDate)

      const url = `${API}/export-excel${query.toString() ? `?${query.toString()}` : ''}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getStoredToken()}` }
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Không thể xuất file Excel')
      }

      const disposition = res.headers.get('content-disposition')
      let filename = 'Hoa_Don_Homestay.xlsx'
      if (disposition) {
        const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
        if (utfMatch && utfMatch[1]) {
          filename = decodeURIComponent(utfMatch[1])
        } else {
          const match = disposition.match(/filename="?([^";]+)"?/i)
          if (match && match[1]) filename = match[1]
        }
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err.message || 'Lỗi khi xuất file Excel')
    } finally {
      setExporting(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return invoices.filter(invoice => {
      const matchSearch = !keyword ||
        String(invoice.id).includes(keyword) ||
        String(invoice.bookingId).includes(keyword) ||
        String(invoice.bookingCode || '').toLowerCase().includes(keyword) ||
        invoice.customerName?.toLowerCase().includes(keyword) ||
        invoice.customerEmail?.toLowerCase().includes(keyword)
      const matchMethod = !methodFilter || invoice.latestPaymentMethod === methodFilter
      const matchStatus = !statusFilter || invoice.latestPaymentStatus === statusFilter
      const matchFrom = !fromDate || (invoice.createdAt && invoice.createdAt.slice(0, 10) >= fromDate)
      const matchTo = !toDate || (invoice.createdAt && invoice.createdAt.slice(0, 10) <= toDate)
      return matchSearch && matchMethod && matchStatus && matchFrom && matchTo
    })
  }, [invoices, search, methodFilter, statusFilter, fromDate, toDate])

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0)
  const paidAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0)
  const remainingAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.remainingAmount || 0), 0)
  const voucherDiscountAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.roomDiscountAmount || 0), 0)
  const unpaidCount = filteredInvoices.filter(invoice => invoice.latestPaymentStatus === 'PENDING' || Number(invoice.remainingAmount || 0) > 0).length
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedInvoices = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const changeSearch = event => {
    setSearch(event.target.value)
    setPage(1)
  }

  const changeMethodFilter = event => {
    setMethodFilter(event.target.value)
    setPage(1)
  }

  const changeStatusFilter = event => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const applyDatePreset = (preset) => {
    setDatePreset(preset)
    setPage(1)
    if (!preset) {
      setFromDate('')
      setToDate('')
      return
    }
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const pad = (n) => String(n).padStart(2, '0')
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (preset === 'THIS_WEEK') {
      const week = getThisWeekRange()
      setFromDate(week.fromDate)
      setToDate(week.toDate)
    } else if (preset === 'TODAY') {
      const todayStr = toYMD(now)
      setFromDate(todayStr)
      setToDate(todayStr)
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      setFromDate(toYMD(start))
      setToDate(toYMD(end))
    } else if (preset === 'LAST_MONTH') {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0)
      setFromDate(toYMD(start))
      setToDate(toYMD(end))
    } else if (preset === 'THIS_QUARTER') {
      const q = Math.floor(month / 3)
      const start = new Date(year, q * 3, 1)
      const end = new Date(year, q * 3 + 3, 0)
      setFromDate(toYMD(start))
      setToDate(toYMD(end))
    } else if (preset === 'THIS_YEAR') {
      setFromDate(`${year}-01-01`)
      setToDate(`${year}-12-31`)
    } else if (preset === 'LAST_YEAR') {
      setFromDate(`${year - 1}-01-01`)
      setToDate(`${year - 1}-12-31`)
    }
  }

  const changeFromDate = event => {
    setFromDate(event.target.value)
    setDatePreset('')
    setPage(1)
  }

  const changeToDate = event => {
    setToDate(event.target.value)
    setDatePreset('')
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setMethodFilter('')
    setStatusFilter('')
    setFromDate('')
    setToDate('')
    setDatePreset('')
    setPage(1)
  }

  return (
    <AdminLayout activePage="invoices">
      <div className="ain-header">
        <div>
          <h1>Quản lý Hóa đơn</h1>
          <p>Tra cứu lịch sử hóa đơn tổng của các đoàn và trạng thái thanh toán.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div className="ain-export-dropdown" ref={exportMenuRef}>
            <button
              type="button"
              className="ain-btn-excel"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={exporting}
              title="Xuất dữ liệu hóa đơn ra file Excel"
            >
              {exporting ? 'Đang xuất...' : '📊 Xuất Excel ▾'}
            </button>
            {showExportMenu && (
              <div className="ain-export-menu">
                <button
                  type="button"
                  className="ain-export-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    handleExportExcel({ fromDate, toDate })
                  }}
                >
                  <strong>📅 Xuất theo bộ lọc ngày</strong>
                  <span>
                    {fromDate && toDate
                      ? `Từ ${fromDate} đến ${toDate}`
                      : fromDate
                      ? `Từ ${fromDate}`
                      : toDate
                      ? `Đến ${toDate}`
                      : 'Chưa chọn ngày (xuất toàn bộ)'}
                  </span>
                </button>
                <button
                  type="button"
                  className="ain-export-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    handleExportExcel()
                  }}
                >
                  <strong>📂 Xuất toàn bộ tất cả hóa đơn</strong>
                  <span>Tải xuống danh sách toàn bộ lịch sử hóa đơn</span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            style={{
              height: '40px',
              padding: '0 16px',
              border: '1px solid #111827',
              borderRadius: '8px',
              background: '#111827',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {loading ? 'Đang tải...' : '↻ Làm mới'}
          </button>
        </div>
      </div>

      <div className="ain-stats" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <div><span>Tổng hóa đơn</span><strong>{filteredInvoices.length}</strong></div>
        <div><span>Tổng tiền hóa đơn</span><strong>{formatMoney(totalAmount)}</strong></div>
        <div><span>Đã thu thực tế</span><strong style={{ color: '#16a34a' }}>{formatMoney(paidAmount)}</strong></div>
        <div><span>Chưa thu (Còn nợ)</span><strong style={{ color: remainingAmount > 0 ? '#dc2626' : '#111827' }}>{formatMoney(remainingAmount)}</strong></div>
        <div><span>Voucher đã giảm</span><strong style={{ color: '#2563eb' }}>{formatMoney(voucherDiscountAmount)}</strong></div>
      </div>

      <div className="ain-toolbar" style={{ alignItems: 'center' }}>
        <input className="ain-search" value={search} onChange={changeSearch} placeholder="Tìm mã hóa đơn, booking, khách hàng..." />
        <select className="ain-select" value={methodFilter} onChange={changeMethodFilter}>
          <option value="">Tất cả phương thức</option>
          <option value="CASH">Tiền mặt</option>
          <option value="VNPAY">VNPAY</option>
          <option value="MOMO">MoMo</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="SEPAY">SEPAY</option>
        </select>
        <select className="ain-select" value={statusFilter} onChange={changeStatusFilter}>
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Thất bại</option>
          <option value="PENDING">Đang chờ</option>
        </select>
        <select
          className="ain-select"
          value={datePreset}
          onChange={(e) => applyDatePreset(e.target.value)}
          style={{ minWidth: '135px', fontWeight: datePreset ? 600 : 400, color: datePreset ? '#0284c7' : 'inherit' }}
          title="Lọc nhanh thời gian: Tuần này, tháng này, năm nay..."
        >
          <option value="">Tùy chọn ngày</option>
          <option value="THIS_WEEK">📆 Tuần này</option>
          <option value="THIS_MONTH">📅 Tháng này</option>
          <option value="LAST_MONTH">⏪ Tháng trước</option>
          <option value="THIS_YEAR">🗓️ Năm nay</option>
          <option value="LAST_YEAR">⏮️ Năm trước</option>
          <option value="TODAY">⚡ Hôm nay</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            className="ain-select"
            value={fromDate}
            onChange={changeFromDate}
            title="Từ ngày lập hóa đơn"
          />
          <span style={{ color: '#6b7280', fontSize: '13px' }}>-</span>
          <input
            type="date"
            className="ain-select"
            value={toDate}
            onChange={changeToDate}
            title="Đến ngày lập hóa đơn"
          />
        </div>
        {(search || methodFilter || statusFilter || fromDate || toDate) && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              height: '40px',
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#f3f4f6',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {error && <div className="ain-error">{error}</div>}

      <div className="ain-table-wrap">
        {loading ? (
          <div className="ain-empty">Đang tải...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="ain-empty">Không tìm thấy hóa đơn nào.</div>
        ) : (
          <table className="ain-table">
            <thead>
              <tr>
                <th>Hóa đơn</th>
                <th>Khách hàng / đoàn</th>
                <th>Tổng tiền</th>
                <th>Voucher</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày lập</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>
                    <strong>#{invoice.id}</strong>
                    <span>Booking {bookingDisplay(invoice)}</span>
                  </td>
                  <td>
                    <strong>{invoice.customerName}</strong>
                    <span>{invoice.customerEmail || 'Chưa có email'}</span>
                  </td>
                  <td>
                    <strong>{formatMoney(invoice.totalAmount)}</strong>
                    <span>Còn lại {formatMoney(invoice.remainingAmount)}</span>
                  </td>
                  <td>
                    {hasInvoiceVoucher(invoice) ? (
                      <div className="ain-voucher-cell">
                        <strong>{invoice.voucherCode || 'Đã áp dụng'}</strong>
                        <span>Giảm {formatMoney(invoice.roomDiscountAmount)}</span>
                      </div>
                    ) : (
                      <span>Không áp dụng</span>
                    )}
                  </td>
                  <td>
                    <strong>{methodLabel(invoice.latestPaymentMethod)}</strong>
                    <span>{formatAppDateTime(invoice.latestPaymentTime)}</span>
                  </td>
                  <td><span className={statusClass(invoice.latestPaymentStatus)}>{statusLabel(invoice.latestPaymentStatus)}</span></td>
                  <td>{formatAppDateTime(invoice.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button type="button" className="ain-detail-btn" onClick={() => setDetailInvoice(invoice)}>
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        className="ain-excel-btn"
                        title="Xuất Excel hóa đơn này"
                        onClick={() => handleExportExcel({ invoiceId: invoice.id })}
                        disabled={exporting}
                      >
                        📊 Excel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredInvoices.length > PAGE_SIZE && (
        <nav className="ain-pagination" aria-label="Phân trang hóa đơn">
          <span>
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredInvoices.length)} / {filteredInvoices.length} hóa đơn
          </span>
          <div>
            <button type="button" disabled={safePage === 1} onClick={() => setPage(current => Math.max(1, current - 1))} aria-label="Trang trước">‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
              <button
                type="button"
                key={pageNumber}
                className={pageNumber === safePage ? 'is-active' : ''}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" disabled={safePage === totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))} aria-label="Trang sau">›</button>
          </div>
        </nav>
      )}

      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onExportExcel={handleExportExcel}
          exporting={exporting}
        />
      )}
    </AdminLayout>
  )
}

export default AdminInvoicesPage
