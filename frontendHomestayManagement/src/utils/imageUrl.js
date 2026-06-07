const BACKEND = 'http://localhost:8080'

/** Resolve image path: /uploads/* → backend, /home_* etc. → frontend public */
export function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return `${BACKEND}${url}`
  return url
}
