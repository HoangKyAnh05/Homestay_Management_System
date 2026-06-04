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
