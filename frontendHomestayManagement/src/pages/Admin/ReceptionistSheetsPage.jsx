import { useEffect, useMemo, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { formatDateTime as formatAppDateTime } from '../../utils/dateTimeFormat'
import AdminLayout from './AdminLayout'
import './ReceptionistSheetsPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/sheets'

function authHeaders() {
  const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || ''
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export default function ReceptionistSheetsPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'TEMPORARY_RESIDENCE', 'DASHBOARD_REPORTS', 'INVOICES'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [exportingToday, setExportingToday] = useState(false)
  const [previewInvoiceFile, setPreviewInvoiceFile] = useState(null)
  const [invoiceHtml, setInvoiceHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [previewExcelFile, setPreviewExcelFile] = useState(null)
  const [excelData, setExcelData] = useState(null)
  const [excelLoading, setExcelLoading] = useState(false)
  const [excelError, setExcelError] = useState('')
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [sheetSearch, setSheetSearch] = useState('')

  const iframeRef = useRef(null)

  const fetchFiles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/files`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        throw new Error('Không thể tải danh sách file sheet')
      }
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu file')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  // Export temporary residence for today
  const handleExportToday = async () => {
    setExportingToday(true)
    try {
      const res = await fetch(`${API_BASE}/generate-temporary-residence`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Xuất bảng kê tạm trú thất bại')
      await fetchFiles()
      setActiveTab('TEMPORARY_RESIDENCE')
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo bảng kê')
    } finally {
      setExportingToday(false)
    }
  }

  // Handle preview Invoice HTML
  const handlePreviewInvoice = async (file) => {
    setPreviewInvoiceFile(file)
    setInvoiceHtml('')
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await fetch(`${API_BASE}/preview-invoice?fileName=${encodeURIComponent(file.fileName)}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Không thể tải nội dung hóa đơn')
      const html = await res.text()
      setInvoiceHtml(html)
    } catch (err) {
      setPreviewError(err.message || 'Lỗi đọc hóa đơn')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle preview Excel Sheet
  const handlePreviewExcel = async (file) => {
    setPreviewExcelFile(file)
    setExcelData(null)
    setExcelLoading(true)
    setExcelError('')
    setActiveSheetIndex(0)
    setSheetSearch('')
    try {
      const res = await fetch(
        `${API_BASE}/preview-excel?folder=${encodeURIComponent(file.folder)}&fileName=${encodeURIComponent(file.fileName)}`,
        {
          headers: authHeaders(),
        }
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Không thể đọc file Excel')
      }
      const data = await res.json()
      setExcelData(data)
    } catch (err) {
      setExcelError(err.message || 'Lỗi phân tích bảng tính Excel')
    } finally {
      setExcelLoading(false)
    }
  }

  // Handle Download file
  const handleDownload = (file) => {
    const downloadUrl = (import.meta.env.VITE_API_URL || '') + file.downloadUrl
    const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || ''

    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải xuống file')
        return res.blob()
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      })
      .catch((err) => {
        alert(err.message || 'Lỗi tải file')
      })
  }

  // Counts
  const counts = useMemo(() => {
    const res = {
      ALL: files.length,
      TEMPORARY_RESIDENCE: 0,
      DASHBOARD_REPORTS: 0,
      INVOICES: 0,
    }
    files.forEach((f) => {
      if (f.folder === 'TEMPORARY_RESIDENCE') res.TEMPORARY_RESIDENCE++
      else if (f.folder === 'DASHBOARD_REPORTS') res.DASHBOARD_REPORTS++
      else if (f.folder === 'INVOICES') res.INVOICES++
    })
    return res
  }, [files])

  // Filtered list
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeTab !== 'ALL' && f.folder !== activeTab) return false
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = f.fileName.toLowerCase().includes(query)
        const matchLabel = f.folderLabel?.toLowerCase().includes(query)
        if (!matchName && !matchLabel) return false
      }
      if (selectedDate) {
        const fileDate = f.lastModified ? f.lastModified.substring(0, 10) : ''
        const nameHasDate = f.fileName.includes(selectedDate)
        if (fileDate !== selectedDate && !nameHasDate) return false
      }
      return true
    })
  }, [files, activeTab, searchTerm, selectedDate])

  const printIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    }
  }

  const printExcelTable = () => {
    const printContent = document.getElementById('rsheet-excel-printable')
    if (!printContent) return
    const win = window.open('', '_blank', 'height=700,width=1000')
    win.document.write('<html><head><title>' + (previewExcelFile?.fileName || 'Bảng Tính') + '</title>')
    win.document.write('<style>')
    win.document.write(`
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
      h2 { margin-bottom: 12px; color: #0f172a; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
      th { background-color: #f1f5f9; font-weight: bold; }
      @media print {
        @page { size: landscape; margin: 10mm; }
      }
    `)
    win.document.write('</style></head><body>')
    win.document.write('<h2>' + (previewExcelFile?.fileName || 'Bảng Tính Homestay') + '</h2>')
    win.document.write(printContent.innerHTML)
    win.document.write('</body></html>')
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }

  const currentSheet = excelData?.sheets?.[activeSheetIndex]
  const displayedRows = useMemo(() => {
    if (!currentSheet || !currentSheet.data) return []
    if (!sheetSearch.trim()) return currentSheet.data
    const q = sheetSearch.toLowerCase().trim()
    return currentSheet.data.filter((row, idx) => {
      if (idx === 0) return true // Keep header row
      return row.some((cell) => cell && cell.toString().toLowerCase().includes(q))
    })
  }, [currentSheet, sheetSearch])

  return (
    <AdminLayout>
      <div className="rsheet-page">
        {/* Page Header */}
        <div className="rsheet-header">
          <div>
            <h1 className="rsheet-title">Quản Lý Bảng Tính & File Sheet Homestay</h1>
            <p className="rsheet-subtitle">
              Tra cứu, xem trực tiếp & tải file Excel bảng kê tạm trú công an (exports), báo cáo doanh thu và hóa đơn (invoice) trực tuyến.
            </p>
          </div>
          <div className="rsheet-header-actions">
            <button
              type="button"
              className="rsheet-btn rsheet-btn--primary"
              onClick={handleExportToday}
              disabled={exportingToday}
            >
              <svg viewBox="0 0 24 24" className="rsheet-btn-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              {exportingToday ? 'Đang tạo bảng kê...' : 'Tạo Bảng Kê Tạm Trú Hôm Nay'}
            </button>
            <button
              type="button"
              className="rsheet-btn rsheet-btn--secondary"
              onClick={fetchFiles}
              disabled={loading}
              title="Làm mới danh sách"
            >
              <svg viewBox="0 0 24 24" className="rsheet-btn-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="rsheet-stats-grid">
          <div
            className={`rsheet-stat-card ${activeTab === 'TEMPORARY_RESIDENCE' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('TEMPORARY_RESIDENCE')}
          >
            <div className="rsheet-stat-icon rsheet-stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="rsheet-stat-info">
              <span className="rsheet-stat-label">Bảng Kê Tạm Trú (Công An)</span>
              <div className="rsheet-stat-value-group">
                <span className="rsheet-stat-number">{counts.TEMPORARY_RESIDENCE}</span>
                <span className="rsheet-stat-desc">thư mục exports/temporary-residence</span>
              </div>
            </div>
          </div>

          <div
            className={`rsheet-stat-card ${activeTab === 'DASHBOARD_REPORTS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('DASHBOARD_REPORTS')}
          >
            <div className="rsheet-stat-icon rsheet-stat-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="rsheet-stat-info">
              <span className="rsheet-stat-label">Báo Cáo Vận Hành & Tuần</span>
              <div className="rsheet-stat-value-group">
                <span className="rsheet-stat-number">{counts.DASHBOARD_REPORTS}</span>
                <span className="rsheet-stat-desc">thư mục exports/dashboard-reports</span>
              </div>
            </div>
          </div>

          <div
            className={`rsheet-stat-card ${activeTab === 'INVOICES' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('INVOICES')}
          >
            <div className="rsheet-stat-icon rsheet-stat-icon--orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div className="rsheet-stat-info">
              <span className="rsheet-stat-label">Hóa Đơn Khách Hàng (HTML / Sheet)</span>
              <div className="rsheet-stat-value-group">
                <span className="rsheet-stat-number">{counts.INVOICES}</span>
                <span className="rsheet-stat-desc">thư mục invoive/ & invoice/</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Tabs Bar */}
        <div className="rsheet-controls">
          <div className="rsheet-tabs">
            <button
              type="button"
              className={`rsheet-tab ${activeTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất Cả ({counts.ALL})
            </button>
            <button
              type="button"
              className={`rsheet-tab ${activeTab === 'TEMPORARY_RESIDENCE' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('TEMPORARY_RESIDENCE')}
            >
              📑 Bảng Kê Tạm Trú ({counts.TEMPORARY_RESIDENCE})
            </button>
            <button
              type="button"
              className={`rsheet-tab ${activeTab === 'DASHBOARD_REPORTS' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('DASHBOARD_REPORTS')}
            >
              📊 Báo Cáo Vận Hành ({counts.DASHBOARD_REPORTS})
            </button>
            <button
              type="button"
              className={`rsheet-tab ${activeTab === 'INVOICES' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('INVOICES')}
            >
              🧾 Hóa Đơn ({counts.INVOICES})
            </button>
          </div>

          <div className="rsheet-filters">
            <div className="rsheet-search-wrapper">
              <svg viewBox="0 0 24 24" className="rsheet-search-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên file, mã hóa đơn, mã đơn..."
                className="rsheet-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="rsheet-search-clear" onClick={() => setSearchTerm('')}>
                  ×
                </button>
              )}
            </div>

            <div className="rsheet-date-filter">
              <input
                type="date"
                className="rsheet-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                title="Lọc theo ngày"
              />
              {selectedDate && (
                <button type="button" className="rsheet-date-clear" onClick={() => setSelectedDate('')} title="Bỏ lọc ngày">
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Table / List */}
        <div className="rsheet-content-card">
          {loading ? (
            <div className="rsheet-loading">
              <div className="rsheet-spinner" />
              <p>Đang tải danh sách các file sheet và hóa đơn...</p>
            </div>
          ) : error ? (
            <div className="rsheet-error">
              <p>{error}</p>
              <button type="button" className="rsheet-btn rsheet-btn--secondary" onClick={fetchFiles}>
                Thử lại
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="rsheet-empty">
              <svg viewBox="0 0 24 24" className="rsheet-empty-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="rsheet-empty-text">Không tìm thấy file nào phù hợp với bộ lọc</p>
              {(searchTerm || selectedDate || activeTab !== 'ALL') && (
                <button
                  type="button"
                  className="rsheet-btn rsheet-btn--secondary"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDate('')
                    setActiveTab('ALL')
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="rsheet-table-wrapper">
              <table className="rsheet-table">
                <thead>
                  <tr>
                    <th>Tên File & Loại</th>
                    <th>Thư Mục / Danh Mục</th>
                    <th>Dung Lượng</th>
                    <th>Thời Gian Lưu / Tạo</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const isExcel = file.fileType === 'EXCEL'
                    const isHtml = file.fileType === 'HTML'
                    return (
                      <tr key={file.id} className="rsheet-row">
                        <td>
                          <div className="rsheet-file-cell">
                            <div className={`rsheet-file-badge rsheet-file-badge--${file.fileType.toLowerCase()}`}>
                              {isExcel ? 'XLSX' : isHtml ? 'HTML' : file.fileType}
                            </div>
                            <div className="rsheet-file-details">
                              <span className="rsheet-file-name" title={file.fileName}>
                                {file.fileName}
                              </span>
                              <span className="rsheet-file-path">{file.extraInfo}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`rsheet-folder-tag rsheet-folder-tag--${file.folder.toLowerCase()}`}
                          >
                            {file.folderLabel}
                          </span>
                        </td>
                        <td>
                          <span className="rsheet-size-tag">{file.formattedSize}</span>
                        </td>
                        <td>
                          <span className="rsheet-date-text">
                            {formatAppDateTime(file.lastModified)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="rsheet-row-actions">
                            {isExcel && (
                              <button
                                type="button"
                                className="rsheet-action-btn rsheet-action-btn--excel-preview"
                                onClick={() => handlePreviewExcel(file)}
                                title="Xem trực tiếp bảng tính Excel trên web"
                              >
                                <svg viewBox="0 0 24 24" className="rsheet-action-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Xem Sheet
                              </button>
                            )}
                            {isHtml && (
                              <button
                                type="button"
                                className="rsheet-action-btn rsheet-action-btn--preview"
                                onClick={() => handlePreviewInvoice(file)}
                                title="Xem trước và in hóa đơn"
                              >
                                <svg viewBox="0 0 24 24" className="rsheet-action-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Xem / In
                              </button>
                            )}
                            <button
                              type="button"
                              className="rsheet-action-btn rsheet-action-btn--download"
                              onClick={() => handleDownload(file)}
                              title="Tải file về máy tính"
                            >
                              <svg viewBox="0 0 24 24" className="rsheet-action-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Tải Về
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice HTML Preview Modal */}
        {previewInvoiceFile && (
          <div className="rsheet-modal-backdrop" onClick={() => setPreviewInvoiceFile(null)}>
            <div className="rsheet-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rsheet-modal-head">
                <div className="rsheet-modal-title-group">
                  <div className="rsheet-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Xem Trước Hóa Đơn Điện Tử</h3>
                    <p>{previewInvoiceFile.fileName}</p>
                  </div>
                </div>
                <div className="rsheet-modal-actions">
                  <button
                    type="button"
                    className="rsheet-btn rsheet-btn--primary"
                    onClick={printIframe}
                    disabled={previewLoading || !invoiceHtml}
                  >
                    <svg viewBox="0 0 24 24" className="rsheet-btn-icon" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    In Hóa Đơn
                  </button>
                  <button
                    type="button"
                    className="rsheet-btn rsheet-btn--secondary"
                    onClick={() => handleDownload(previewInvoiceFile)}
                  >
                    Tải File
                  </button>
                  <button type="button" className="rsheet-close-btn" onClick={() => setPreviewInvoiceFile(null)}>
                    ×
                  </button>
                </div>
              </div>

              <div className="rsheet-modal-body">
                {previewLoading ? (
                  <div className="rsheet-loading">
                    <div className="rsheet-spinner" />
                    <p>Đang tải nội dung hóa đơn...</p>
                  </div>
                ) : previewError ? (
                  <div className="rsheet-error">
                    <p>{previewError}</p>
                    <button
                      type="button"
                      className="rsheet-btn rsheet-btn--secondary"
                      onClick={() => handlePreviewInvoice(previewInvoiceFile)}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    srcDoc={invoiceHtml}
                    title="Invoice Preview"
                    className="rsheet-iframe"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Excel Spreadsheet Viewer Modal */}
        {previewExcelFile && (
          <div className="rsheet-modal-backdrop" onClick={() => setPreviewExcelFile(null)}>
            <div className="rsheet-modal rsheet-modal--excel" onClick={(e) => e.stopPropagation()}>
              <div className="rsheet-modal-head">
                <div className="rsheet-modal-title-group">
                  <div className="rsheet-modal-icon rsheet-modal-icon--excel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Trình Xem Bảng Tính Excel Online</h3>
                    <p>{previewExcelFile.fileName}</p>
                  </div>
                </div>
                <div className="rsheet-modal-actions">
                  <button
                    type="button"
                    className="rsheet-btn rsheet-btn--primary"
                    onClick={printExcelTable}
                    disabled={excelLoading || !excelData}
                  >
                    <svg viewBox="0 0 24 24" className="rsheet-btn-icon" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    In Bảng Tính
                  </button>
                  <button
                    type="button"
                    className="rsheet-btn rsheet-btn--secondary"
                    onClick={() => handleDownload(previewExcelFile)}
                  >
                    Tải File (.xlsx)
                  </button>
                  <button type="button" className="rsheet-close-btn" onClick={() => setPreviewExcelFile(null)}>
                    ×
                  </button>
                </div>
              </div>

              {/* Excel Sheet Controls & Tabs */}
              {excelData && excelData.sheets && excelData.sheets.length > 0 && (
                <div className="rsheet-excel-toolbar">
                  <div className="rsheet-excel-sheet-tabs">
                    {excelData.sheets.map((sheet, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`rsheet-excel-sheet-tab ${activeSheetIndex === idx ? 'is-active' : ''}`}
                        onClick={() => setActiveSheetIndex(idx)}
                      >
                        📄 {sheet.sheetName || `Sheet ${idx + 1}`} ({sheet.totalRows} dòng)
                      </button>
                    ))}
                  </div>
                  <div className="rsheet-excel-search">
                    <input
                      type="text"
                      placeholder="Lọc dữ liệu trong sheet..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="rsheet-excel-search-input"
                    />
                    {sheetSearch && (
                      <button
                        type="button"
                        className="rsheet-excel-search-clear"
                        onClick={() => setSheetSearch('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="rsheet-modal-body rsheet-modal-body--excel">
                {excelLoading ? (
                  <div className="rsheet-loading">
                    <div className="rsheet-spinner" />
                    <p>Đang đọc và phân tích bảng tính Excel...</p>
                  </div>
                ) : excelError ? (
                  <div className="rsheet-error">
                    <p>{excelError}</p>
                    <button
                      type="button"
                      className="rsheet-btn rsheet-btn--secondary"
                      onClick={() => handlePreviewExcel(previewExcelFile)}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : !currentSheet || displayedRows.length === 0 ? (
                  <div className="rsheet-empty">
                    <p>Bảng tính không có dữ liệu để hiển thị</p>
                  </div>
                ) : (
                  <div className="rsheet-excel-grid-container" id="rsheet-excel-printable">
                    <table className="rsheet-excel-table">
                      <thead>
                        {displayedRows.length > 0 && (
                          <tr>
                            <th className="rsheet-excel-row-header">#</th>
                            {displayedRows[0].map((headerText, colIdx) => (
                              <th key={colIdx} className="rsheet-excel-col-header">
                                {headerText || `Cột ${colIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {displayedRows.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            <td className="rsheet-excel-row-num">{rowIdx + 1}</td>
                            {Array.from({ length: currentSheet.totalColumns || displayedRows[0].length }).map((_, cIdx) => (
                              <td key={cIdx} className="rsheet-excel-cell">
                                {row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
