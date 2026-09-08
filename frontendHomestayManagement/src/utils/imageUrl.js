import { BACKEND_URL as BACKEND } from '../config/api'

/** Resolve image path: /uploads/* → backend, /home_* etc. → frontend public */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return null
  const cleanUrl = url.trim()
  if (!cleanUrl) return null
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl
  if (cleanUrl.startsWith('/uploads/')) return `${BACKEND}${cleanUrl}`
  if (cleanUrl.startsWith('uploads/')) return `${BACKEND}/${cleanUrl}`
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`
}
