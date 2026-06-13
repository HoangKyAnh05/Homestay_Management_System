export function formatClockTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = date.getHours() >= 12 ? 'PM' : 'AM'
  return `${hours}:${minutes} ${period}`
}

export function formatVietnameseDate(value, options = {}) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const formatterOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  if (options.weekday) {
    formatterOptions.weekday = options.weekday
  }
  return new Intl.DateTimeFormat('vi-VN', formatterOptions).format(date)
}

export function formatDateTime(value, options = {}) {
  if (!value) return options.fallback || 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return options.fallback || 'Chưa có'
  return `${formatClockTime(date)} ${formatVietnameseDate(date, { weekday: options.weekday })}`
}
