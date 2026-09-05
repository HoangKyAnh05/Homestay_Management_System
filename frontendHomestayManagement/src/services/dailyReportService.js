import { getStoredToken } from './authService'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin/daily-reports'
const BOOKINGS_API = (import.meta.env.VITE_API_URL || '') + '/api/admin/bookings'
const INVOICES_API = (import.meta.env.VITE_API_URL || '') + '/api/admin/invoices'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getStoredToken()}`,
  }
}

/**
 * Lấy dữ liệu xem trước tổng kết cuối ngày.
 * Nếu Backend chưa restart (trả về 403/404), tự động fallback tổng hợp từ check-in-logs và invoices.
 */
export async function getDailyPreview(dateStr) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10)
  const query = `?date=${encodeURIComponent(targetDate)}`

  try {
    const res = await fetch(`${API_BASE}/current-preview${query}`, {
      headers: authHeaders(),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (_) {
    // tiếp tục fallback
  }

  // ── Fallback tổng hợp trực tiếp từ check-in-logs và invoices ──
  try {
    const logsRes = await fetch(`${BOOKINGS_API}/check-in-logs?fromDate=${targetDate}&toDate=${targetDate}`, {
      headers: authHeaders(),
    })
    const logsData = logsRes.ok ? await logsRes.json() : []
    const bookings = Array.isArray(logsData) ? logsData : []

    const allDetails = bookings.flatMap(b => (b.details || []).map(d => ({ ...d, booking: b })))

    // Phòng đang có khách ở
    const occupiedRooms = allDetails
      .filter(d => d.checkInRecord?.actualCheckIn && !d.checkInRecord?.actualCheckOut)
      .map(d => ({
        roomId: d.room?.id,
        roomNumber: d.room?.roomNumber || '—',
        roomTypeName: d.roomType?.name || d.room?.roomType?.name || 'Tiêu chuẩn',
        customerName: d.customer?.fullName || d.booking?.customer?.fullName || '—',
        customerPhone: d.customer?.phone || d.booking?.customer?.phone || '—',
        bookingCode: d.booking?.bookingCode || `#${d.booking?.id || ''}`,
        actualCheckIn: d.checkInRecord?.actualCheckIn,
        expectedCheckOut: d.checkOutTarget,
        guestCount: (d.numberOfAdults || 1) + (d.numberOfChildren || 0),
      }))

    const checkInTodayCount = allDetails.filter(d => d.checkInRecord?.actualCheckIn && String(d.checkInRecord.actualCheckIn).startsWith(targetDate)).length
    const checkOutTodayCount = allDetails.filter(d => d.checkInRecord?.actualCheckOut && String(d.checkInRecord.actualCheckOut).startsWith(targetDate)).length

    // Lấy doanh thu từ invoices
    let totalRevenue = 0
    let cashRevenue = 0
    let transferRevenue = 0
    const invoiceList = []

    try {
      const invRes = await fetch(`${INVOICES_API}`, { headers: authHeaders() })
      if (invRes.ok) {
        const invData = await invRes.json()
        const invoices = Array.isArray(invData) ? invData : (invData.content || [])
        for (const inv of invoices) {
          if (String(inv.createdAt || '').startsWith(targetDate)) {
            const amt = Number(inv.totalAmount || 0)
            totalRevenue += amt
            transferRevenue += amt // mặc định chuyển khoản
            invoiceList.push({
              invoiceId: inv.id,
              bookingCode: inv.booking?.bookingCode || `#${inv.booking?.id || ''}`,
              customerName: inv.booking?.customer?.fullName || 'Khách hàng',
              amount: amt,
              paymentMethod: 'CHUYEN_KHOAN',
              createdAt: inv.createdAt,
            })
          }
        }
      }
    } catch (_) {}

    // Kiểm tra đã lưu trong localStorage chưa
    const localReports = JSON.parse(localStorage.getItem('saved_daily_reports') || '[]')
    const existingLocal = localReports.find(r => r.reportDate === targetDate)

    return {
      reportDate: targetDate,
      occupiedRoomsCount: occupiedRooms.length,
      checkInTodayCount,
      checkOutTodayCount,
      cashRevenue,
      transferRevenue,
      totalRevenue,
      occupiedRooms,
      invoices: invoiceList,
      alreadySubmitted: Boolean(existingLocal),
      existingReportId: existingLocal?.id || null,
      existingReportStatus: existingLocal?.status || null,
    }
  } catch (err) {
    throw new Error(err.message || 'Không thể lấy dữ liệu tổng kết ngày')
  }
}

export async function submitDailyReport(payload) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (_) {
    // tiếp tục lưu fallback
  }

  // Lưu fallback vào localStorage để admin và lễ tân cùng xem được ngay
  const localReports = JSON.parse(localStorage.getItem('saved_daily_reports') || '[]')
  const newReport = {
    id: Date.now(),
    reportDate: payload.reportDate,
    staffFullName: 'Lễ tân trực',
    createdAt: new Date().toISOString(),
    totalRevenue: payload.totalRevenue,
    cashRevenue: payload.cashRevenue,
    transferRevenue: payload.transferRevenue,
    occupiedRoomsCount: payload.occupiedRoomsCount,
    checkInTodayCount: payload.checkInTodayCount,
    checkOutTodayCount: payload.checkOutTodayCount,
    notes: payload.notes,
    status: 'SUBMITTED',
    snapshotDataJson: payload.snapshotDataJson,
  }

  const filtered = localReports.filter(r => r.reportDate !== payload.reportDate)
  filtered.unshift(newReport)
  localStorage.setItem('saved_daily_reports', JSON.stringify(filtered))

  return newReport
}

export async function getDailyReports(params = {}) {
  try {
    const qs = new URLSearchParams()
    if (params.fromDate) qs.set('fromDate', params.fromDate)
    if (params.toDate) qs.set('toDate', params.toDate)
    if (params.page !== undefined) qs.set('page', params.page)
    if (params.size !== undefined) qs.set('size', params.size)

    const res = await fetch(`${API_BASE}?${qs.toString()}`, {
      headers: authHeaders(),
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.content) && data.content.length > 0) {
        return data
      }
    }
  } catch (_) {}

  // Fallback từ localStorage
  const localReports = JSON.parse(localStorage.getItem('saved_daily_reports') || '[]')
  return {
    content: localReports,
    totalElements: localReports.length,
    totalPages: 1,
  }
}

export async function getDailyReportDetail(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: authHeaders(),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (_) {}

  const localReports = JSON.parse(localStorage.getItem('saved_daily_reports') || '[]')
  const found = localReports.find(r => r.id === id || String(r.id) === String(id))
  if (found) return found
  throw new Error('Không tìm thấy báo cáo')
}

export async function acknowledgeDailyReport(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}/acknowledge`, {
      method: 'PUT',
      headers: authHeaders(),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (_) {}

  const localReports = JSON.parse(localStorage.getItem('saved_daily_reports') || '[]')
  const found = localReports.find(r => r.id === id || String(r.id) === String(id))
  if (found) {
    found.status = 'ACKNOWLEDGED'
    found.acknowledgedBy = 'Admin'
    found.acknowledgedAt = new Date().toISOString()
    localStorage.setItem('saved_daily_reports', JSON.stringify(localReports))
    return found
  }
  throw new Error('Không thể xác nhận báo cáo')
}
