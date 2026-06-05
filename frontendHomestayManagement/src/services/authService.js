const API_BASE_URL = 'http://localhost:8080/api'
const TOKEN_KEY = 'homeStayAccessToken'
const USER_KEY = 'homeStayUser'

export async function login(email, password) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error('Không kết nối được backend. Hãy kiểm tra Spring Boot đã chạy ở cổng 8080.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại')
  }

  localStorage.setItem(TOKEN_KEY, data.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))

  return data
}

export async function loginWithGoogle(accessToken) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    })
  } catch {
    throw new Error('Khong ket noi duoc backend. Hay kiem tra Spring Boot da chay o cong 8080.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Dang nhap Google that bai')
  }

  localStorage.setItem(TOKEN_KEY, data.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))

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
    throw new Error('Không kết nối được backend. Hãy kiểm tra Spring Boot đã chạy ở cổng 8080.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
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

  localStorage.setItem(USER_KEY, JSON.stringify(data))

  return data
}

export async function updateCurrentAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const data = await authorizedRequest('/users/me/avatar', {
    method: 'PUT',
    body: formData,
  })

  localStorage.setItem(USER_KEY, JSON.stringify(data))

  return data
}

export function getStoredUser() {
  const userJson = localStorage.getItem(USER_KEY)

  if (!userJson) {
    return null
  }

  try {
    return JSON.parse(userJson)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
