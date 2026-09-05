// Centralized API configuration supporting both local, LAN, tunnel and cloud deployment
export const BACKEND_URL = import.meta.env.VITE_API_URL || ''
export const API_BASE_URL = `${BACKEND_URL}/api`
