import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import AdminLayout from './AdminLayout'
import './AdminInvoicesPage.css'

const API = 'http://localhost:8080/api/admin/invoices'
const PAGE_SIZE = 6

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

function InvoiceDetailModal({ invoice, onClose }) {
  return (
    <div className="ain-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ain-modal">
        <div className="ain-modal-head">
          <div>
            <h3>Hóa đơn #{invoice.id}</h3>
            <p>Booking #{invoice.bookingId} · {invoice.customerName}</p>
          </div>
          <button type="button" className="ain-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ain-modal-body">
          <div className="ain-detail-grid">
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

function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch(API, { headers: authHeaders() })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách hóa đơn')
        return data
      })
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Không thể tải danh sách hóa đơn'))
      .finally(() => setLoading(false))
  }, [])

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return invoices.filter(invoice => {
      const matchSearch = !keyword ||
        String(invoice.id).includes(keyword) ||
        String(invoice.bookingId).includes(keyword) ||
        invoice.customerName?.toLowerCase().includes(keyword) ||
        invoice.customerEmail?.toLowerCase().includes(keyword)
      const matchMethod = !methodFilter || invoice.latestPaymentMethod === methodFilter
      const matchStatus = !statusFilter || invoice.latestPaymentStatus === statusFilter
      return matchSearch && matchMethod && matchStatus
    })
  }, [invoices, search, methodFilter, statusFilter])

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0)
  const paidAmount = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0)
  const pendingCount = filteredInvoices.filter(invoice => invoice.latestPaymentStatus === 'PENDING').length
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

  return (
    <AdminLayout activePage="invoices">
      <div className="ain-header">
        <div>
          <h1>Quản lý Hóa đơn</h1>
          <p>Tra cứu lịch sử hóa đơn tổng của các đoàn và trạng thái thanh toán.</p>
        </div>
      </div>

      <div className="ain-stats">
        <div><span>Tổng hóa đơn</span><strong>{filteredInvoices.length}</strong></div>
        <div><span>Tổng tiền</span><strong>{formatMoney(totalAmount)}</strong></div>
        <div><span>Đã thu thành công</span><strong>{formatMoney(paidAmount)}</strong></div>
        <div><span>Đang chờ</span><strong>{pendingCount}</strong></div>
      </div>

      <div className="ain-toolbar">
        <input className="ain-search" value={search} onChange={changeSearch} placeholder="Tìm mã hóa đơn, booking, khách hàng..." />
        <select className="ain-select" value={methodFilter} onChange={changeMethodFilter}>
          <option value="">Tất cả phương thức</option>
          <option value="CASH">Tiền mặt</option>
          <option value="VNPAY">VNPAY</option>
          <option value="MOMO">MoMo</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
        </select>
        <select className="ain-select" value={statusFilter} onChange={changeStatusFilter}>
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Thất bại</option>
          <option value="PENDING">Đang chờ</option>
        </select>
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
                    <span>Booking #{invoice.bookingId}</span>
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
                    <strong>{methodLabel(invoice.latestPaymentMethod)}</strong>
                    <span>{formatAppDateTime(invoice.latestPaymentTime)}</span>
                  </td>
                  <td><span className={statusClass(invoice.latestPaymentStatus)}>{statusLabel(invoice.latestPaymentStatus)}</span></td>
                  <td>{formatAppDateTime(invoice.createdAt)}</td>
                  <td>
                    <button type="button" className="ain-detail-btn" onClick={() => setDetailInvoice(invoice)}>
                      Chi tiết
                    </button>
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

      {detailInvoice && <InvoiceDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)} />}
    </AdminLayout>
  )
}

export default AdminInvoicesPage
