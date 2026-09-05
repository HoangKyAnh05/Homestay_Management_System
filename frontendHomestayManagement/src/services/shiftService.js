import { getStoredToken } from './authService'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api/admin/shifts'

function authHeaders() {
  const token = getStoredToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Thao tác không thành công')
  }
  return data
}

export async function getCurrentShiftStatus() {
  const res = await fetch(`${API_BASE_URL}/current-status`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function getReceptionistStaffList() {
  const res = await fetch(`${API_BASE_URL}/receptionists`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function submitShiftHandover(payload) {
  const res = await fetch(`${API_BASE_URL}/handover`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

export async function getShiftHistory(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const res = await fetch(`${API_BASE_URL}/history?${query.toString()}`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function resolveShiftCompensation(id, notes = '') {
  const res = await fetch(`${API_BASE_URL}/${id}/resolve-compensation`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  })
  return parseResponse(res)
}

export async function getFixedFundConfig() {
  const res = await fetch(`${API_BASE_URL}/fund-config`, {
    headers: authHeaders(),
  })
  return parseResponse(res)
}

export async function updateFixedFundConfig(payload) {
  const res = await fetch(`${API_BASE_URL}/fund-config`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(res)
}

