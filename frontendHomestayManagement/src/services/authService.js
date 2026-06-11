const API_BASE_URL = 'http://localhost:8080/api'
const TOKEN_KEY = 'homeStayAccessToken'
const USER_KEY = 'homeStayUser'
const REMEMBER_KEY = 'homeStayRememberEmail'

function getAuthStorage(remember) {
  return remember ? localStorage : sessionStorage
}

function findAuthStorage() {
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage
  if (localStorage.getItem(TOKEN_KEY)) return localStorage
  return null
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function saveAuthSession(data, remember = true) {
  clearStoredAuth()
  const storage = getAuthStorage(remember)
  storage.setItem(TOKEN_KEY, data.accessToken)
  storage.setItem(USER_KEY, JSON.stringify(data.user))
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

  saveAuthSession(data, remember)

  if (remember) {
    localStorage.setItem(REMEMBER_KEY, email)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }

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

  saveAuthSession(data, true)
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
  if (!response.ok) throw new Error(data.message || 'Đăng ký thất bại')
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
  if (!response.ok) throw new Error(data.message || 'Xác minh thất bại')

  saveAuthSession(data, true)
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
  if (!response.ok) throw new Error(data.message || 'Mã OTP không hợp lệ')
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
  if (!response.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại')
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
  return storage ? storage.getItem(TOKEN_KEY) : null
}

export function logout() {
  clearStoredAuth()
}
