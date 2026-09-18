/**
 * Utility for calculating stay overdue status and late check-out days.
 * 
 * Rules:
 * - When a room is currently staying (CHECKED_IN) and now > checkOutTarget:
 *   - Overdue < 12h: Overdue by hours (same day overdue warning).
 *   - Overdue >= 12h: Counted as 1 day overdue (+1 day fee).
 *   - Every additional 24h (>= 36h, >= 60h...): Counted as +2 days, +3 days, etc.
 */

export function calculateStayOverdueInfo(checkOutTarget, checkInRecord = null, status = 'CHECKED_IN') {
  if (!checkOutTarget) {
    return {
      isOverdue: false,
      isDueToday: false,
      overdueHours: 0,
      overdueDays: 0,
      message: '',
      shortBadge: '',
    }
  }

  // If already completed/checked out or cancelled, not overdue
  if (
    checkInRecord?.actualCheckOut ||
    ['COMPLETED', 'CANCELLED'].includes(String(status || '').toUpperCase())
  ) {
    return {
      isOverdue: false,
      isDueToday: false,
      overdueHours: 0,
      overdueDays: 0,
      message: '',
      shortBadge: '',
    }
  }

  const now = new Date()
  const target = new Date(checkOutTarget)
  if (Number.isNaN(target.getTime())) {
    return {
      isOverdue: false,
      isDueToday: false,
      overdueHours: 0,
      overdueDays: 0,
      message: '',
      shortBadge: '',
    }
  }

  const diffMs = now.getTime() - target.getTime()

  // Check if due today (same calendar date)
  const isSameDay =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()

  if (diffMs <= 0) {
    return {
      isOverdue: false,
      isDueToday: isSameDay,
      overdueHours: 0,
      overdueDays: 0,
      message: isSameDay ? 'Hôm nay đến hạn trả phòng' : '',
      shortBadge: isSameDay ? 'Trả phòng hôm nay' : '',
    }
  }

  // diffMs > 0 => Overdue!
  const overdueHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))

  // Rule:
  // >= 12h => 1 day
  // >= 36h => 2 days
  // >= 60h => 3 days...
  let overdueDays = 0
  if (overdueHours >= 12) {
    overdueDays = 1 + Math.floor((overdueHours - 12) / 24)
  }

  let message = ''
  let shortBadge = ''

  if (overdueDays >= 1) {
    message = `Đã quá hạn trả phòng ${overdueDays} ngày (tính thêm ${overdueDays} ngày lưu trú)`
    shortBadge = `Quá ${overdueDays} ngày (+${overdueDays} ngày)`
  } else {
    message = `Đã quá giờ trả phòng (${overdueHours} giờ)`
    shortBadge = `Quá ${overdueHours}h`
  }

  return {
    isOverdue: true,
    isDueToday: isSameDay,
    overdueHours,
    overdueDays,
    message,
    shortBadge,
  }
}

export function formatExtensionTime(hours) {
  const h = Number(hours) || 0
  if (h <= 0) return ''
  if (h < 24) {
    return `+${h}h`
  }
  const days = Math.floor(h / 24)
  const rem = h % 24
  if (rem === 0) {
    return `+${days} ngày`
  }
  return `+${days} ngày ${rem}h`
}

export function formatExtensionTitle(hours) {
  const h = Number(hours) || 0
  if (h <= 0) return ''
  if (h < 24) {
    return `Khách đã thuê thêm ${h} giờ`
  }
  const days = Math.floor(h / 24)
  const rem = h % 24
  if (rem === 0) {
    return `Khách đã thuê thêm ${days} ngày`
  }
  return `Khách đã thuê thêm ${days} ngày ${rem} giờ`
}
