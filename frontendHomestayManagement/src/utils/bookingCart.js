const BOOKING_CART_KEY = 'homestay_public_booking_rooms'

export function readBookingCart() {
  try {
    const raw = window.sessionStorage.getItem(BOOKING_CART_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function writeBookingCart(rooms) {
  try {
    window.sessionStorage.setItem(BOOKING_CART_KEY, JSON.stringify(Array.isArray(rooms) ? rooms : []))
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
