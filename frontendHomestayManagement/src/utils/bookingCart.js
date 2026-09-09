const BOOKING_CART_KEY = 'homestay_public_booking_rooms'

export function isRoomSelectable(room) {
  if (!room) return false
  const status = String(room.status || '').trim().toUpperCase()
  if (['MAINTENANCE', 'INACTIVE', 'DISABLED', 'BOOKED', 'OCCUPIED', 'UNAVAILABLE'].includes(status)) {
    return false
  }
  if (room.status && !['AVAILABLE', 'ACTIVE'].includes(status)) {
    return false
  }
  if (room.availableRooms !== undefined && room.availableRooms !== null) {
    if (Number(room.availableRooms) <= 0) return false
  }
  return true
}

export function readBookingCart() {
  try {
    const raw = window.sessionStorage.getItem(BOOKING_CART_KEY)
    const data = raw ? JSON.parse(raw) : []
    const list = Array.isArray(data) ? data : []
    return list.filter(isRoomSelectable)
  } catch {
    return []
  }
}

export function writeBookingCart(rooms) {
  try {
    const validRooms = (Array.isArray(rooms) ? rooms : []).filter(isRoomSelectable)
    window.sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(validRooms))
  } catch {
    // Session storage can be unavailable in private browsing; the UI still works for the current page state.
  }
}

export function clearBookingCart() {
  try {
    window.sessionStorage.removeItem(BOOKING_CART_KEY)
  } catch {
    // Ignore storage cleanup failures.
  }
}

