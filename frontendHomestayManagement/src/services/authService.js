const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'
const TOKEN_KEY = 'homeStayAccessToken'
const USER_KEY = 'homeStayUser'
const REMEMBER_KEY = 'homeStayRememberEmail'
let expirationTimer = null

function findAuthStorage() {
  if (localStorage.getItem(TOKEN_KEY)) return localStorage

  // Migrate sessions created before authentication became shared across tabs.
  const legacyToken = sessionStorage.getItem(TOKEN_KEY)
  if (legacyToken) {
    const legacyUser = sessionStorage.getItem(USER_KEY)
    if (legacyUser) localStorage.setItem(USER_KEY, legacyUser)
    localStorage.setItem(TOKEN_KEY, legacyToken)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    return localStorage
  }

  return null
}

function clearStoredAuth() {
  if (expirationTimer) {
    window.clearTimeout(expirationTimer)
    expirationTimer = null
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function readTokenExpiration(token) {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(window.atob(padded))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function redirectAfterExpiration() {
  const path = window.location.pathname
  const target = path.startsWith('/admin') ? '/admin/login' : '/login'
  const protectedCustomerPage = path === '/profile' || path === '/booking-history'

  window.dispatchEvent(new CustomEvent('auth-session-expired'))
  if ((path.startsWith('/admin') || protectedCustomerPage) && path !== target) {
    window.location.replace(target)
  }
}

function expireSession() {
  clearStoredAuth()
  window.setTimeout(redirectAfterExpiration, 0)
}

function scheduleTokenExpiration(token) {
  if (expirationTimer) window.clearTimeout(expirationTimer)
  expirationTimer = null

  const expiresAt = readTokenExpiration(token)
  if (expiresAt == null) return true

  const remaining = expiresAt - Date.now()
  if (remaining <= 0) {
    expireSession()
    return false
  }

  expirationTimer = window.setTimeout(expireSession, Math.min(remaining, 2_147_483_647))
  return true
}

export function getRoleDisplayName(role) {
  switch (role) {
    case 'ROLE_ADMIN': return 'Quản trị viên (Admin)'
    case 'ROLE_RECEPTIONIST': return 'Lễ tân (Receptionist)'
    case 'ROLE_HOUSEKEEPING': return 'Buồng phòng (Housekeeping)'
    case 'ROLE_MARKETING': return 'Marketing'
    case 'ROLE_CUSTOMER':
    case 'ROLE_USER':
    default:
      return 'Khách hàng (Customer)'
  }
}

export function normalizeRole(role) {
  if (!role || role === 'ROLE_USER' || role === 'ROLE_CUSTOMER') {
    return 'ROLE_CUSTOMER'
  }
  return role
}

export function validateSingleRoleSession(incomingRole) {
  const currentStoredUser = getStoredUser()
  if (!currentStoredUser || !currentStoredUser.role) {
    return true
  }

  const currentRoleNormalized = normalizeRole(currentStoredUser.role)
  const incomingRoleNormalized = normalizeRole(incomingRole)

  if (currentRoleNormalized !== incomingRoleNormalized) {
    const currentName = getRoleDisplayName(currentStoredUser.role)
    const incomingName = getRoleDisplayName(incomingRole)
    throw new Error(
      `Trình duyệt này đang có phiên đăng nhập với vai trò "${currentName}". ` +
      `Mỗi phiên trình duyệt Chrome chỉ cho phép đăng nhập các tài khoản cùng một nhóm vai trò (Role). ` +
      `Để đăng nhập tài khoản "${incomingName}", vui lòng Đăng xuất tài khoản hiện tại trước hoặc mở Cửa sổ Ẩn danh (Incognito) / Profile Chrome khác.`
    )
  }

  return true
}

function saveAuthSession(data) {
  clearStoredAuth()
  // Write the user first so the token change is the atomic signal observed by other tabs.
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  localStorage.setItem(TOKEN_KEY, data.accessToken)
  scheduleTokenExpiration(data.accessToken)
}

async function parseJson(response) {
  return response.json().catch(() => ({}))
}

function connectionError() {
  return new Error('Không kết nối được backend. Hãy kiểm tra Spring Boot đã chạy ở cổng 8080.')
}

export async function login(email, password, remember = false) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại')

  saveAuthSession(data)

  if (remember) {
    localStorage.setItem(REMEMBER_KEY, email)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }

  return data
}

export async function adminLogin(email, password) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Đăng nhập nhân viên thất bại')

  saveAuthSession(data)
  return data
}

export async function loginWithGoogle(accessToken) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Đăng nhập Google thất bại')

  saveAuthSession(data)
  return data
}

export async function stayQuickLogin(token) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/stay-quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Đăng nhập nhanh không thành công')

  saveAuthSession(data)
  return data
}

export function getRememberedEmail() {
  return localStorage.getItem(REMEMBER_KEY) || ''
}

export async function register(fullName, email, phone, password) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, password }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) {
    const error = new Error(data.message || 'Đăng ký thất bại')
    if (data.fieldErrors) error.fieldErrors = data.fieldErrors
    throw error
  }
  return data
}

export async function verifyEmail(email, otp) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) {
    const error = new Error(data.message || 'Xác minh thất bại')
    error.code = data.code
    error.status = response.status
    throw error
  }

  saveAuthSession(data)
  return data
}

export async function resendVerifyEmail(email) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/resend-verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Gửi lại mã thất bại')
  return data
}

export async function forgotPassword(email) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Gửi mã OTP thất bại')
  return data
}

export async function verifyOtp(email, otp) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) {
    const error = new Error(data.message || 'Mã OTP không hợp lệ')
    error.code = data.code
    error.status = response.status
    throw error
  }
  return data
}

export async function resetPassword(email, otp, newPassword) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) {
    const error = new Error(data.message || 'Đặt lại mật khẩu thất bại')
    error.code = data.code
    error.status = response.status
    throw error
  }
  return data
}

export async function activateStayAccount(token, password) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/stay-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)
  if (!response.ok) throw new Error(data.message || 'Không thể kích hoạt tài khoản')

  saveAuthSession(data)
  return data
}

async function authorizedRequest(path, options = {}) {
  const token = getStoredToken()

  if (!token) {
    throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
  }

  let response

  try {
    const isFormData = options.body instanceof FormData

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  } catch {
    throw connectionError()
  }

  const data = await parseJson(response)

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStoredAuth()
      if (window.location.pathname !== '/login') {
        setTimeout(() => window.location.assign('/login'), 0)
      }
      throw new Error(data.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    }
    throw new Error(data.message || 'Không thể xử lý yêu cầu')
  }

  return data
}

export async function getCurrentProfile() {
  return authorizedRequest('/users/me')
}

export async function updateCurrentProfile(profile) {
  const data = await authorizedRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })

  const storage = findAuthStorage()
  if (storage) storage.setItem(USER_KEY, JSON.stringify(data))

  return data
}

export async function updateCurrentAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const data = await authorizedRequest('/users/me/avatar', {
    method: 'PUT',
    body: formData,
  })

  const storage = findAuthStorage()
  if (storage) storage.setItem(USER_KEY, JSON.stringify(data))

  return data
}

export function getStoredUser() {
  if (!getStoredToken()) return null
  const storage = findAuthStorage()
  if (!storage) return null

  const userJson = storage.getItem(USER_KEY)

  if (!userJson) {
    return null
  }

  try {
    return JSON.parse(userJson)
  } catch {
    storage.removeItem(USER_KEY)
    return null
  }
}

export function getStoredToken() {
  const storage = findAuthStorage()
  const token = storage ? storage.getItem(TOKEN_KEY) : null
  if (!token) return null
  return scheduleTokenExpiration(token) ? token : null
}

export function logout() {
  clearStoredAuth()
}
