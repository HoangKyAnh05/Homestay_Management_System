import React, { useState, useEffect, useMemo, useRef } from 'react'
import AdminLayout from './AdminLayout'
import { getStoredToken } from '../../services/authService'
import './MarketingEngagementInboxPage.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

const PLATFORM_ICONS = {
  FACEBOOK: (
    <svg className="platform-icon fb" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  YOUTUBE: (
    <svg className="platform-icon yt" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  TIKTOK: (
    <svg className="platform-icon tt" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.02 3.25-1.54 3.3-3.34.02-3.95.01-7.9.01-11.85z"/>
    </svg>
  ),
}

export const parseCommentTimestamp = (comment) => {
  if (!comment) return Date.now()

  // 1. If timestampMs is a valid numeric epoch timestamp (> 1000000000000)
  if (typeof comment.timestampMs === 'number' && comment.timestampMs > 1000000000000) {
    return comment.timestampMs
  }
  if (typeof comment.timestampMs === 'string' && !isNaN(Number(comment.timestampMs)) && Number(comment.timestampMs) > 1000000000000) {
    return Number(comment.timestampMs)
  }

  const raw = comment.publishedAt || comment.createdTime || comment.createdAt || ''
  if (!raw || typeof raw !== 'string') return Date.now()

  const str = raw.trim().toLowerCase()

  // 2. Relative strings
  if (str === 'vừa xong' || str === 'just now') {
    return Date.now()
  }
  if (str === 'hôm qua' || str === 'yesterday') {
    return Date.now() - 24 * 60 * 60 * 1000
  }

  // Minute match: "31 phút", "31 phút trước", "15m", "15 min"
  const minMatch = str.match(/(\d+)\s*(phút|min|m|minute|minutes)\b/i)
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10)
    if (!isNaN(mins)) return Date.now() - mins * 60 * 1000
  }

  // Hour match: "3 giờ", "3 giờ trước", "2h", "2 hr", "2 hours"
  const hrMatch = str.match(/(\d+)\s*(giờ|hour|hours|h|hr|hrs)\b/i)
  if (hrMatch) {
    const hrs = parseInt(hrMatch[1], 10)
    if (!isNaN(hrs)) return Date.now() - hrs * 60 * 60 * 1000
  }

  // Day match: "2 ngày", "2 ngày trước", "3d", "3 days"
  const dayMatch = str.match(/(\d+)\s*(ngày|day|days|d)\b/i)
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10)
    if (!isNaN(days)) return Date.now() - days * 24 * 60 * 60 * 1000
  }

  // Week match: "1 tuần", "2 tuần trước", "1w"
  const wkMatch = str.match(/(\d+)\s*(tuần|week|weeks|w)\b/i)
  if (wkMatch) {
    const wks = parseInt(wkMatch[1], 10)
    if (!isNaN(wks)) return Date.now() - wks * 7 * 24 * 60 * 60 * 1000
  }

  // Month match: "1 tháng", "2 tháng trước", "1 mo"
  const moMatch = str.match(/(\d+)\s*(tháng|month|months|mo)\b/i)
  if (moMatch) {
    const mos = parseInt(moMatch[1], 10)
    if (!isNaN(mos)) return Date.now() - mos * 30 * 24 * 60 * 60 * 1000
  }

  // Year match: "1 năm", "2 năm trước", "1y"
  const yrMatch = str.match(/(\d+)\s*(năm|year|years|y|yr)\b/i)
  if (yrMatch) {
    const yrs = parseInt(yrMatch[1], 10)
    if (!isNaN(yrs)) return Date.now() - yrs * 365 * 24 * 60 * 60 * 1000
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (ddmmyyyyMatch) {
    const d = parseInt(ddmmyyyyMatch[1], 10)
    const m = parseInt(ddmmyyyyMatch[2], 10) - 1
    const y = parseInt(ddmmyyyyMatch[3], 10)
    const parsedDate = new Date(y, m, d)
    if (!isNaN(parsedDate.getTime())) return parsedDate.getTime()
  }

  // 4. Standard Date.parse
  const parsed = Date.parse(raw)
  if (!isNaN(parsed)) return parsed

  return Date.now()
}

const formatCommentTime = (timeStr, timestampMs) => {
  if (typeof timestampMs === 'number' && timestampMs > 1000000000000) {
    const d = new Date(timestampMs)
    return isNaN(d.getTime()) ? (timeStr || 'Vừa xong') : d.toLocaleString('vi-VN')
  }
  if (!timeStr) return 'Vừa xong'
  if (typeof timeStr === 'string' && (timeStr.includes('trước') || timeStr.includes('ago') || timeStr.includes('Vừa') || timeStr.includes('phút') || timeStr.includes('giờ') || timeStr.includes('ngày') || timeStr.includes('m') || timeStr.includes('h') || timeStr.includes('d'))) {
    return timeStr
  }
  try {
    const d = new Date(timeStr)
    return isNaN(d.getTime()) ? String(timeStr) : d.toLocaleString('vi-VN')
  } catch {
    return String(timeStr)
  }
}

export const formatDisplayDateVN = (dateStr) => {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

function generateCalendarDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)
  const leadingDays = (firstDay.getDay() + 6) % 7 // Monday = 0
  const totalDays = lastDay.getDate()
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()

  const cells = []
  // Leading days from previous month
  for (let i = leadingDays - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const m = monthIndex === 0 ? 11 : monthIndex - 1
    const y = monthIndex === 0 ? year - 1 : year
    cells.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      month: monthIndex,
      year: year,
      isCurrentMonth: true,
      dateStr: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  // Trailing days to fill grid
  const remaining = (7 - (cells.length % 7)) % 7
  for (let t = 1; t <= remaining; t++) {
    const m = monthIndex === 11 ? 0 : monthIndex + 1
    const y = monthIndex === 11 ? year + 1 : year
    cells.push({
      day: t,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(t).padStart(2, '0')}`
    })
  }

  return cells
}

export const cleanAuthorName = (author) => {
  if (!author) return 'Khách hàng'
  let clean = String(author).split('\n')[0].trim()
  clean = clean.replace(/^@/, '')
  clean = clean.replace(/•\s*.*/g, '')
  clean = clean.replace(/\s*·?\s*\d+\s*(giờ|phút|ngày|tháng|năm|tuần|giây|h|m|d|w|s|hr|min|yr)\s*(trước|ago)?\b.*/gi, '')
  clean = clean.replace(/\s*·?\s*(vừa xong|just now|hôm qua|yesterday)\b.*/gi, '')
  return clean.trim() || 'Khách hàng'
}

export const cleanDisplayMessage = (rawMsg, authorName) => {
  if (!rawMsg) return ''
  let text = String(rawMsg).trim()
  if (authorName) {
    const cleanAuth = String(authorName).replace(/^@/, '').trim()
    if (cleanAuth) {
      const authRegex = new RegExp('^@?' + cleanAuth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(•|·|-)?\\s*', 'gi')
      text = text.replace(authRegex, '')
    }
  }
  text = text.replace(/^@[a-zA-Z0-9_.-]+\s*(•|·|-)?\s*/gi, '')
  text = text.replace(/^[•·\s]*\d+\s*(phút|giờ|ngày|tháng|năm|tuần|giây|m|h|d|s|hr|min|yr|minutos|horas|hours|minutes|days|weeks|months|years)\s*(trước|ago)?\s*/gi, '')
  text = text.replace(/^[•·\s]*(vừa xong|just now|hôm qua|yesterday)\s*/gi, '')
  text = text
    .replace(/✨\s*(ai\s*lá\s*đỏ|ai\s*lado|ai)/gi, '')
    .replace(/\b(ai\s*lá\s*đỏ|ai\s*lado)\b/gi, '')
    .replace(/\b\d+\s*(phản hồi|câu trả lời|repl(y|ies))\b/gi, '')
    .replace(/\b(xem|view)\s+(\d+\s+)?(phản hồi|câu trả lời|repl(y|ies))\b/gi, '')
    .replace(/\b(phản hồi|reply|trả lời)\b/gi, '')
    .replace(/\b(thích|like|dislike|không thích|chia sẻ|share)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text || rawMsg
}

const isOwnPageComment = (c) => {
  if (!c) return false
  const author = (c.authorName || '').toLowerCase().trim()
  const msg = (c.message || '').toLowerCase().trim()

  // Filter out system UI widgets, sponsored ads, domain cards, and post promotion CTAs
  const systemKeywords = [
    'đáng chú ý', 'quảng bá thước phim', 'quảng bá bài viết', 'tạo quảng cáo',
    'được tài trợ', 'sponsored', 'start tiktok ads', 'tiktok ads', 'quản lý trang',
    'giới thiệu', 'chi tiết', 'xem thông tin chi tiết', 'gợi ý cho bạn', 'bài viết đề xuất',
    'tin ảnh và video', 'thước phim', 'reels', 'bí quyết dành cho trang', 'cài đặt ngay',
    'tìm hiểu thêm', 'gửi tin nhắn', 'mọi người sẽ không nhìn thấy phần này', 'trừ khi bạn ghim',
    'không có thông tin chi tiết', 'travel this national day', 'cebupacificr.com',
    'canva giáo dục', 'canva.com', 'residential proxies', 'web.io', 'getstarted.tiktok.com',
    'elevenlabs.io', 'đăng ký canva', 'shopee', 'shopeeshopee', 'lazada', 'tiki', 'suno.com', 'suno',
    'the perfect sound', 'sound for your content'
  ]

  if (systemKeywords.some(kw => author.includes(kw) || msg.includes(kw))) {
    return true
  }

  // Filter pure domain text or domain extensions (e.g. .vn, .com, canva.com, web.io, shopee.vn)
  if (
    msg === '.vn' ||
    msg === '.com' ||
    msg === '.net' ||
    msg === '.org' ||
    msg.startsWith('.vn') ||
    msg.startsWith('.com') ||
    /^\.?[a-z0-9-]*\.(com|io|vn|net|org|edu|ai|co|info|biz|me|store|shop)(\s+.*)?$/i.test(msg)
  ) {
    return true
  }

  // Filter messages that have no meaningful text (just punctuation or 1-2 chars)
  if (msg.replace(/[\p{P}\p{S}\s]/gu, '').length < 2) {
    return true
  }

  const brandKeywords = [
    'lá đỏ homestay', 'la do homestay', 'lado homestay', 'lá đỏ', 'lado official',
    'quản trị viên', 'admin', 'tác giả', 'author', 'homestay lá đỏ', 'lá đỏ homestay sa pa', 'quản trị viên homestay'
  ]
  if (brandKeywords.some(kw => author.includes(kw))) return true
  const signatures = [
    'chào mừng bạn đến với lá đỏ',
    'hẹn gặp bạn tại lá đỏ',
    'cảm ơn bạn đã quan tâm lá đỏ',
    'để cùng ngắm mây mường hoa'
  ]
  if (signatures.some(sig => msg.includes(sig))) return true
  return false
}

export default function MarketingEngagementInboxPage() {
  // Main Synced Comments State (From all 3 extensions)
  const [allComments, setAllComments] = useState([])
  const [syncedCounts, setSyncedCounts] = useState({
    total: 0,
    facebook: 0,
    tiktok: 0,
    youtube: 0
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activePlatformTab, setActivePlatformTab] = useState('ALL') // 'ALL' | 'FACEBOOK' | 'TIKTOK' | 'YOUTUBE'
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'UNREPLIED' | 'REPLIED'
  const [dateFilter, setDateFilter] = useState('ALL') // 'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCalendarPopover, setShowCalendarPopover] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [activeDatePicking, setActiveDatePicking] = useState('START') // 'START' | 'END'
  const calendarPopoverRef = useRef(null)

  // Auto Scan State for 3 platforms
  const [scanningPlatform, setScanningPlatform] = useState(null)
  const [lastSyncStatus, setLastSyncStatus] = useState({
    FACEBOOK: null,
    TIKTOK: null,
    YOUTUBE: null,
  })

  // Customizable Target URLs with LocalStorage persistence
  const FB_DEFAULT = 'https://www.facebook.com/profile.php?id=61590865271672'
  const TT_DEFAULT = 'https://www.tiktok.com/tiktokstudio/comment'
  const YT_DEFAULT = 'https://studio.youtube.com/channel/UCCpVihhnIhiappSzpZa46DA/comments/inbox?filter=%5B%7B%22isDisabled%22%3Afalse%2C%22isPinned%22%3Atrue%2C%22name%22%3A%22SORT_BY%22%2C%22value%22%3A%22SORT_BY_MOST_RELEVANT%22%7D%2C%7B%22name%22%3A%22ENGAGED_STATUS%22%2C%22value%22%3A%5B%22COMMENT_CATEGORY_NOT_ENGAGED%22%5D%7D%2C%7B%22name%22%3A%22PARENT_ENTITY_CONTENT_TYPE%22%2C%22value%22%3A%5B%22PARENT_ENTITY_CONTENT_TYPE_WATCH%22%2C%22PARENT_ENTITY_CONTENT_TYPE_SHORT%22%2C%22PARENT_ENTITY_CONTENT_TYPE_CREATOR_POST%22%5D%7D%5D'

  const [urls, setUrls] = useState({
    FACEBOOK: localStorage.getItem('lado_scan_url_fb') || FB_DEFAULT,
    TIKTOK: localStorage.getItem('lado_scan_url_tt') || TT_DEFAULT,
    YOUTUBE: localStorage.getItem('lado_scan_url_yt') || YT_DEFAULT,
  })

  const updateScanUrl = (platform, val) => {
    setUrls(prev => {
      const next = { ...prev, [platform]: val }
      if (platform === 'FACEBOOK') localStorage.setItem('lado_scan_url_fb', val)
      if (platform === 'TIKTOK') localStorage.setItem('lado_scan_url_tt', val)
      if (platform === 'YOUTUBE') localStorage.setItem('lado_scan_url_yt', val)
      return next
    })
  }

  // Live Toast Alert
  const [toastMessage, setToastMessage] = useState(null)
  const pollTimerRef = useRef(null)

  // Fetch all synced comments from backend
  const fetchAllSyncedComments = async (silent = false) => {
    if (!silent) setLoading(true)
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/comments/all-synced`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const rawList = Array.isArray(data.allComments) ? data.allComments : []
        const commentsList = rawList.filter(c => !isOwnPageComment(c))
        setAllComments(commentsList)
        setSyncedCounts({
          total: commentsList.length,
          facebook: commentsList.filter(c => c.platform === 'FACEBOOK').length,
          tiktok: commentsList.filter(c => c.platform === 'TIKTOK').length,
          youtube: commentsList.filter(c => c.platform === 'YOUTUBE').length,
        })
      }
    } catch (err) {
      console.error('Error fetching all synced comments:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Handle 1-Click Auto Scan for 3 platforms
  const handleTriggerAutoScan = (platform) => {
    setActivePlatformTab(platform)
    let baseUrl = ''
    if (platform === 'FACEBOOK') {
      baseUrl = (urls.FACEBOOK && urls.FACEBOOK.startsWith('http')) ? urls.FACEBOOK : FB_DEFAULT
    } else if (platform === 'TIKTOK') {
      baseUrl = (urls.TIKTOK && urls.TIKTOK.startsWith('http')) ? urls.TIKTOK : TT_DEFAULT
    } else if (platform === 'YOUTUBE') {
      baseUrl = (urls.YOUTUBE && urls.YOUTUBE.startsWith('http')) ? urls.YOUTUBE : YT_DEFAULT
    } else {
      baseUrl = FB_DEFAULT
    }

    // 1. Post message to Extension Bridge
    try {
      window.postMessage({
        type: 'LADO_TRIGGER_AUTO_SCAN',
        platform: platform,
        reset: true
      }, '*')
    } catch (e) {}

    // 2. Set chrome.storage.local directly if available
    try {
      if (typeof window !== 'undefined' && window.chrome && window.chrome.storage && window.chrome.storage.local) {
        window.chrome.storage.local.set({
          pendingAutoScan: {
            platform: platform,
            reset: true,
            timestamp: Date.now()
          }
        })
      }
    } catch (e) {}

    // 3. For Facebook append query param, for YouTube/TikTok open clean URL
    let scanUrl = baseUrl
    if (platform === 'FACEBOOK') {
      const separator = baseUrl.includes('?') ? '&' : '?'
      scanUrl = `${baseUrl}${separator}lado_auto_scan=true&reset=true`
    }

    // Open target tab
    window.open(scanUrl, '_blank')

    setScanningPlatform(platform)
    showToast(`🚀 Đã mở tab ${platform}! Extension đang tự động xóa dữ liệu cũ, quét bình luận và đồng bộ về đây...`, 'info')

    // Fast Polling loop (every 1.5s for 30 seconds) to capture incoming comments
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    let pollCount = 0

    pollTimerRef.current = setInterval(async () => {
      pollCount++
      await fetchAllSyncedComments(true)

      if (pollCount >= 20) {
        clearInterval(pollTimerRef.current)
        setScanningPlatform(null)
        setLastSyncStatus((prev) => ({
          ...prev,
          [platform]: { time: new Date().toLocaleTimeString('vi-VN'), success: true }
        }))
        showToast(`✅ Đã hoàn tất chu kỳ quét và đồng bộ từ ${platform}!`, 'success')
      }
    }, 1500)
  }

  // Helper to normalize Facebook direct post/reel URLs
  const normalizeFacebookPostUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return ''
    try {
      const clean = rawUrl.trim()
      if (clean.includes('/people/') || clean.includes('/messages') || clean.includes('/notifications') || clean.includes('/friends')) {
        return ''
      }
      const full = clean.startsWith('http') ? clean : 'https://www.facebook.com' + (clean.startsWith('/') ? '' : '/') + clean
      const u = new URL(full)
      const path = u.pathname

      // Reel / Reels / Share Reel
      const reelMatch = path.match(/\/(?:reel|reels|share\/r)\/(\d+)/i) || u.search.match(/reel_id=(\d+)/i)
      if (reelMatch && reelMatch[1]) {
        return `https://www.facebook.com/reel/${reelMatch[1]}`
      }

      // Watch / Video
      const videoMatch = path.match(/\/videos\/(\d+)/i) || u.searchParams.get('v')
      if (videoMatch) {
        const vId = typeof videoMatch === 'string' ? videoMatch : videoMatch[1]
        if (vId && /^\d+$/.test(vId)) {
          return `https://www.facebook.com/watch/?v=${vId}`
        }
      }

      // Permalink / Story FBID
      const storyFbid = u.searchParams.get('story_fbid') || u.searchParams.get('fbid')
      const pageId = u.searchParams.get('id') || '61590865271672'
      if (storyFbid && /^\d+$/.test(storyFbid)) {
        return `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${pageId}`
      }

      // Direct Post / Share Post
      const postMatch = path.match(/\/(?:posts|share\/p)\/([a-zA-Z0-9_-]+)/i)
      if (postMatch && postMatch[1]) {
        return full.split('?')[0]
      }

      // Photo permalink
      if (path.includes('photo') && (u.searchParams.has('fbid') || u.searchParams.has('set'))) {
        return full
      }

      return ''
    } catch (e) {
      return ''
    }
  }

  // Helper to normalize TikTok URLs
  const normalizeTikTokUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return ''
    try {
      const clean = rawUrl.trim()
      if (!clean) return ''
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean
      }
      if (clean.startsWith('@') || clean.startsWith('/')) {
        return `https://www.tiktok.com${clean.startsWith('/') ? '' : '/'}${clean}`
      }
      if (clean.includes('tiktok.com')) {
        return `https://${clean}`
      }
      return ''
    } catch (e) {
      return ''
    }
  }

  // Helper to normalize YouTube URLs
  const normalizeYouTubeUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return ''
    try {
      const clean = rawUrl.trim()
      if (!clean) return ''
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean
      }
      if (clean.startsWith('/watch') || clean.startsWith('watch?')) {
        return `https://www.youtube.com${clean.startsWith('/') ? '' : '/'}${clean}`
      }
      if (clean.startsWith('/video') || clean.startsWith('/channel') || clean.startsWith('/comments')) {
        return `https://studio.youtube.com${clean.startsWith('/') ? '' : '/'}${clean}`
      }
      if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
        return `https://${clean}`
      }
      if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return `https://www.youtube.com/watch?v=${clean}`
      }
      return ''
    } catch (e) {
      return ''
    }
  }

  // Go Directly to Post/Video on Social Platform to Reply
  const handleGoToPlatformReply = (comment) => {
    if (!comment) return
    const platform = (comment.platform || 'FACEBOOK').toUpperCase().trim()
    const rawTargetUrl = (comment.postUrl || comment.commentUrl || comment.videoUrl || '').trim()
    let targetUrl = ''

    if (platform === 'FACEBOOK') {
      const normalized = normalizeFacebookPostUrl(rawTargetUrl)
      targetUrl = normalized || urls.FACEBOOK || FB_DEFAULT
    } else if (platform === 'TIKTOK') {
      targetUrl = TT_DEFAULT
    } else if (platform === 'YOUTUBE') {
      targetUrl = YT_DEFAULT
    } else {
      targetUrl = rawTargetUrl || FB_DEFAULT
    }

    const cleanMsg = cleanDisplayMessage(comment.message, comment.authorName)
    const cleanAuthor = cleanAuthorName(comment.authorName)

    // 1. Post message to Extension Bridge
    try {
      window.postMessage({
        type: 'LADO_SET_PENDING_HIGHLIGHT',
        payload: {
          commentText: cleanMsg,
          authorName: cleanAuthor,
          platform: platform,
          postUrl: targetUrl,
          timestamp: Date.now()
        }
      }, '*')
    } catch (e) {}

    // 2. Also try direct extension storage if available
    try {
      if (typeof window !== 'undefined' && window.chrome && window.chrome.storage && window.chrome.storage.local) {
        window.chrome.storage.local.set({
          pendingHighlight: {
            commentText: cleanMsg,
            authorName: cleanAuthor,
            platform: platform,
            postUrl: targetUrl,
            timestamp: Date.now()
          }
        })
      }
    } catch (e) {}

    // Open clean target page in new tab
    window.open(targetUrl, '_blank')

    const platformName = platform === 'FACEBOOK' ? 'Facebook' : platform === 'YOUTUBE' ? 'YouTube Studio' : 'TikTok Studio'
    showToast(`🚀 Đang chuyển sang ${platformName}! Extension sẽ tự động định vị khoanh đỏ bình luận của ${cleanAuthor} và mở sẵn ô trả lời AI!`, 'info')
  }

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type, id: Date.now() })
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  // Initial Load & Polling setup
  useEffect(() => {
    fetchAllSyncedComments()

    // Background periodic poll every 5s
    const bgTimer = setInterval(() => {
      fetchAllSyncedComments(true)
    }, 5000)

    return () => {
      clearInterval(bgTimer)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  // Auto-close calendar popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarPopoverRef.current && !calendarPopoverRef.current.contains(e.target)) {
        setShowCalendarPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Date strings and calendar cells
  const todayStr = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }, [])

  const calendarDays = useMemo(() => {
    return generateCalendarDays(calendarViewDate.getFullYear(), calendarViewDate.getMonth())
  }, [calendarViewDate])

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))
  }

  const handleDayCellClick = (dateStr) => {
    if (activeDatePicking === 'START' || !customStartDate) {
      setCustomStartDate(dateStr)
      if (customEndDate && dateStr > customEndDate) {
        setCustomEndDate('')
      }
      setActiveDatePicking('END')
      setDateFilter('CUSTOM')
    } else {
      if (dateStr < customStartDate) {
        setCustomStartDate(dateStr)
        setCustomEndDate('')
        setActiveDatePicking('END')
      } else {
        setCustomEndDate(dateStr)
        setDateFilter('CUSTOM')
        setShowCalendarPopover(false)
      }
    }
  }

  const handleQuickCalendarPreset = (type) => {
    const now = new Date()
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (type === 'TODAY') {
      const t = fmt(now)
      setCustomStartDate(t)
      setCustomEndDate(t)
    } else if (type === 'YESTERDAY') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const yt = fmt(y)
      setCustomStartDate(yt)
      setCustomEndDate(yt)
    } else if (type === '7DAYS') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      setCustomStartDate(fmt(s))
      setCustomEndDate(fmt(now))
    } else if (type === '30DAYS') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      setCustomStartDate(fmt(s))
      setCustomEndDate(fmt(now))
    } else if (type === 'THIS_MONTH') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      setCustomStartDate(fmt(first))
      setCustomEndDate(fmt(now))
    }
    setDateFilter('CUSTOM')
    setShowCalendarPopover(false)
  }

  // Base list filtered by platform and date (for summary cards & counts)
  const platformAndDateComments = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime()
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime()

    return allComments.filter((c) => {
      if (isOwnPageComment(c)) return false
      if (activePlatformTab !== 'ALL' && c.platform !== activePlatformTab) return false

      if (dateFilter !== 'ALL') {
        const commentTime = parseCommentTimestamp(c)
        if (dateFilter === 'TODAY') {
          if (commentTime < startOfToday) return false
        } else if (dateFilter === '7DAYS') {
          if (commentTime < sevenDaysAgo) return false
        } else if (dateFilter === '30DAYS') {
          if (commentTime < thirtyDaysAgo) return false
        } else if (dateFilter === 'CUSTOM') {
          if (customStartDate) {
            const startMs = new Date(customStartDate + 'T00:00:00').getTime()
            if (!isNaN(startMs) && commentTime < startMs) return false
          }
          if (customEndDate) {
            const endMs = new Date(customEndDate + 'T23:59:59.999').getTime()
            if (!isNaN(endMs) && commentTime > endMs) return false
          }
        }
      }
      return true
    })
  }, [allComments, activePlatformTab, dateFilter, customStartDate, customEndDate])

  // Filtered comments based on active platform tab & status & date & search query
  const filteredComments = useMemo(() => {
    return platformAndDateComments.filter((c) => {
      // Status filter
      const isReplied = Array.isArray(c.replies) && c.replies.length > 0
      if (statusFilter === 'UNREPLIED' && isReplied) return false
      if (statusFilter === 'REPLIED' && !isReplied) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchAuthor = (c.authorName || '').toLowerCase().includes(q)
        const matchMsg = (c.message || '').toLowerCase().includes(q)
        const matchVideo = (c.videoTitle || '').toLowerCase().includes(q)
        if (!matchAuthor && !matchMsg && !matchVideo) return false
      }

      return true
    })
  }, [platformAndDateComments, statusFilter, searchQuery])

  // Current tab counts based on date selection
  const currentTabTotal = platformAndDateComments.length
  const currentTabUnreplied = platformAndDateComments.filter((c) => !c.replies || c.replies.length === 0).length
  const currentTabReplied = currentTabTotal - currentTabUnreplied
  const responseRate = currentTabTotal > 0 ? Math.round((currentTabReplied / currentTabTotal) * 100) : 100

  return (
    <AdminLayout activePage="engagement-inbox">
      <div className="engagement-inbox-shell">
        {/* Floating Toast Alert */}
        {toastMessage && (
          <div className={`inbox-toast-alert toast-${toastMessage.type}`}>
            <span className="toast-icon">
              {toastMessage.type === 'success' && '✅'}
              {toastMessage.type === 'error' && '❌'}
              {toastMessage.type === 'warning' && '⚠️'}
              {toastMessage.type === 'info' && '💡'}
            </span>
            <span className="toast-text">{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header Card */}
        <header className="inbox-header-card">
          <div className="inbox-header-title-wrap">
            <div className="inbox-badge-live">
              <span className="live-pulse" /> ĐỒNG BỘ REAL-TIME EXTENSION
            </div>
            <h1>Bảng Thống kê & Quản lý Tương tác Đa nền tảng</h1>
            <p className="inbox-subtitle">
              Tự động quét và thu thập bình luận khách hàng từ <b>Facebook Fanpage</b>, <b>TikTok Studio</b> và <b>YouTube Studio</b> với Trợ lý AI Lá Đỏ.
            </p>
          </div>
        </header>

        {/* 🌟 3 QUICK ACTION BUTTONS: AUTO-SCAN & SYNC SUITE */}
        <section className="auto-scan-control-suite">
          <div className="suite-header-compact">
            <div className="suite-title-box">
              <span className="suite-icon">⚡</span>
              <div>
                <h3 className="suite-title">TỰ ĐỘNG QUÉT & ĐỒNG BỘ BÌNH LUẬN (1-CLICK AUTO-SCAN)</h3>
                <p className="suite-desc">
                  Chọn nền tảng mạng xã hội bên dưới để tiện ích tự động mở trang, quét toàn bộ bình luận mới nhất và đồng bộ trực tiếp vào Hộp thư.
                </p>
              </div>
            </div>
            {scanningPlatform && (
              <div className="suite-active-scanner-badge">
                <span className="scanner-live-dot" />
                <span>Đang quét <strong>{scanningPlatform}</strong>...</span>
              </div>
            )}
          </div>

          <div className="auto-scan-buttons-row">
            {/* Button 1: Facebook Fanpage */}
            <button
              type="button"
              className={`btn-scan-action btn-scan-fb ${scanningPlatform === 'FACEBOOK' ? 'scanning-active' : ''}`}
              onClick={() => handleTriggerAutoScan('FACEBOOK')}
              disabled={scanningPlatform === 'FACEBOOK'}
              title="Mở Facebook Fanpage và tự động quét bình luận"
            >
              <div className="btn-scan-content">
                <div className="btn-scan-main">
                  {PLATFORM_ICONS.FACEBOOK}
                  <span className="btn-scan-text">
                    {scanningPlatform === 'FACEBOOK' ? 'Đang quét Facebook...' : '🚀 Quét Facebook Fanpage'}
                  </span>
                </div>
                <span className="btn-scan-count">{syncedCounts.facebook} bình luận</span>
              </div>
            </button>

            {/* Button 2: TikTok Studio */}
            <button
              type="button"
              className={`btn-scan-action btn-scan-tt ${scanningPlatform === 'TIKTOK' ? 'scanning-active' : ''}`}
              onClick={() => handleTriggerAutoScan('TIKTOK')}
              disabled={scanningPlatform === 'TIKTOK'}
              title="Mở TikTok Studio và tự động quét bình luận"
            >
              <div className="btn-scan-content">
                <div className="btn-scan-main">
                  {PLATFORM_ICONS.TIKTOK}
                  <span className="btn-scan-text">
                    {scanningPlatform === 'TIKTOK' ? 'Đang quét TikTok...' : '🚀 Quét TikTok Studio'}
                  </span>
                </div>
                <span className="btn-scan-count">{syncedCounts.tiktok} bình luận</span>
              </div>
            </button>

            {/* Button 3: YouTube Studio */}
            <button
              type="button"
              className={`btn-scan-action btn-scan-yt ${scanningPlatform === 'YOUTUBE' ? 'scanning-active' : ''}`}
              onClick={() => handleTriggerAutoScan('YOUTUBE')}
              disabled={scanningPlatform === 'YOUTUBE'}
              title="Mở YouTube Studio và tự động quét bình luận"
            >
              <div className="btn-scan-content">
                <div className="btn-scan-main">
                  {PLATFORM_ICONS.YOUTUBE}
                  <span className="btn-scan-text">
                    {scanningPlatform === 'YOUTUBE' ? 'Đang quét YouTube...' : '🚀 Quét YouTube Studio'}
                  </span>
                </div>
                <span className="btn-scan-count">{syncedCounts.youtube} bình luận</span>
              </div>
            </button>
          </div>
        </section>

        {/* 🌟 PLATFORM NAVIGATOR TABS */}
        <div className="platform-navigator-bar">
          <button
            className={`nav-tab-btn ${activePlatformTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('ALL')}
          >
            <span className="tab-icon">🌟</span>
            <span>Tất cả nền tảng</span>
            <span className="tab-badge">{syncedCounts.total}</span>
          </button>

          <button
            className={`nav-tab-btn tab-fb ${activePlatformTab === 'FACEBOOK' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('FACEBOOK')}
          >
            {PLATFORM_ICONS.FACEBOOK}
            <span>Facebook Fanpage</span>
            <span className="tab-badge">{syncedCounts.facebook}</span>
          </button>

          <button
            className={`nav-tab-btn tab-tt ${activePlatformTab === 'TIKTOK' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('TIKTOK')}
          >
            {PLATFORM_ICONS.TIKTOK}
            <span>TikTok Studio</span>
            <span className="tab-badge">{syncedCounts.tiktok}</span>
          </button>

          <button
            className={`nav-tab-btn tab-yt ${activePlatformTab === 'YOUTUBE' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('YOUTUBE')}
          >
            {PLATFORM_ICONS.YOUTUBE}
            <span>YouTube Studio</span>
            <span className="tab-badge">{syncedCounts.youtube}</span>
          </button>
        </div>

        {/* 🌟 4 DYNAMIC MODERN STATS CARDS */}
        <div className="inbox-summary-grid">
          <div className="summary-card stat-comments">
            <div className="stat-icon-wrap">💬</div>
            <div className="stat-content">
              <span className="stat-label">Tổng bình luận đã quét</span>
              <strong className="stat-val">{currentTabTotal}</strong>
              <span className="stat-hint">{activePlatformTab === 'ALL' ? '3 nền tảng MXH' : activePlatformTab}</span>
            </div>
          </div>

          <div className="summary-card stat-unreplied">
            <div className="stat-icon-wrap">⚡</div>
            <div className="stat-content">
              <span className="stat-label">Chưa phản hồi</span>
              <strong className="stat-val">{currentTabUnreplied}</strong>
              <span className="stat-hint">cần chăm sóc ngay</span>
            </div>
          </div>

          <div className="summary-card stat-posts">
            <div className="stat-icon-wrap">✅</div>
            <div className="stat-content">
              <span className="stat-label">Đã phản hồi</span>
              <strong className="stat-val">{currentTabReplied}</strong>
              <span className="stat-hint">đã gửi câu trả lời</span>
            </div>
          </div>

          <div className="summary-card stat-rate">
            <div className="stat-icon-wrap">📈</div>
            <div className="stat-content">
              <span className="stat-label">Tỷ lệ phản hồi</span>
              <strong className="stat-val">{responseRate}%</strong>
              <span className="stat-hint">hiệu suất chăm sóc khách</span>
            </div>
          </div>
        </div>

        {/* 🌟 UNIFIED COMMENTS MANAGEMENT FEED */}
        <section className="comments-management-section">
          <div className="section-toolbar">
            <div className="toolbar-top-row">
              <div className="toolbar-search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên khách, nội dung bình luận hoặc video..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              <div className="toolbar-filter-chips">
                <span className="filter-label">Trạng thái:</span>
                <button
                  className={`chip-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  Tất cả ({currentTabTotal})
                </button>
                <button
                  className={`chip-btn ${statusFilter === 'UNREPLIED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('UNREPLIED')}
                >
                  ⚡ Chưa trả lời ({currentTabUnreplied})
                </button>
                <button
                  className={`chip-btn ${statusFilter === 'REPLIED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('REPLIED')}
                >
                  ✅ Đã trả lời ({currentTabReplied})
                </button>
              </div>
            </div>

            {/* Date Filter Row */}
            <div className="toolbar-date-row" ref={calendarPopoverRef}>
              <div className="toolbar-date-chips">
                <span className="filter-label date-label">
                  <svg className="date-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Ngày bình luận:
                </span>
                <button
                  type="button"
                  className={`chip-date-btn ${dateFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    setDateFilter('ALL')
                    setShowCalendarPopover(false)
                  }}
                >
                  Tất cả thời gian
                </button>
                <button
                  type="button"
                  className={`chip-date-btn ${dateFilter === 'TODAY' ? 'active' : ''}`}
                  onClick={() => {
                    setDateFilter('TODAY')
                    setShowCalendarPopover(false)
                  }}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  className={`chip-date-btn ${dateFilter === '7DAYS' ? 'active' : ''}`}
                  onClick={() => {
                    setDateFilter('7DAYS')
                    setShowCalendarPopover(false)
                  }}
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  className={`chip-date-btn ${dateFilter === '30DAYS' ? 'active' : ''}`}
                  onClick={() => {
                    setDateFilter('30DAYS')
                    setShowCalendarPopover(false)
                  }}
                >
                  30 ngày qua
                </button>
                <button
                  type="button"
                  className={`chip-date-btn ${dateFilter === 'CUSTOM' ? 'active' : ''}`}
                  onClick={() => {
                    setDateFilter('CUSTOM')
                    setShowCalendarPopover(!showCalendarPopover)
                  }}
                >
                  📅 Chọn ngày theo lịch...
                </button>
              </div>

              {/* Custom Click-Only Date Trigger Controls */}
              {dateFilter === 'CUSTOM' && (
                <div className="custom-date-trigger-container">
                  <div className="custom-date-buttons-bar">
                    <button
                      type="button"
                      className={`btn-date-selector ${activeDatePicking === 'START' && showCalendarPopover ? 'active-picker' : ''}`}
                      onClick={() => {
                        setActiveDatePicking('START')
                        setShowCalendarPopover(true)
                      }}
                    >
                      <span className="selector-title">Từ ngày:</span>
                      <strong className="selector-date-text">
                        {customStartDate ? formatDisplayDateVN(customStartDate) : 'Chọn ngày bắt đầu'}
                      </strong>
                      <span className="selector-cal-icon">📅</span>
                    </button>

                    <span className="date-arrow-icon">➔</span>

                    <button
                      type="button"
                      className={`btn-date-selector ${activeDatePicking === 'END' && showCalendarPopover ? 'active-picker' : ''}`}
                      onClick={() => {
                        setActiveDatePicking('END')
                        setShowCalendarPopover(true)
                      }}
                    >
                      <span className="selector-title">Đến ngày:</span>
                      <strong className="selector-date-text">
                        {customEndDate ? formatDisplayDateVN(customEndDate) : 'Chọn ngày kết thúc'}
                      </strong>
                      <span className="selector-cal-icon">📅</span>
                    </button>

                    {(customStartDate || customEndDate) && (
                      <button
                        type="button"
                        className="btn-clear-custom-date"
                        onClick={() => {
                          setCustomStartDate('')
                          setCustomEndDate('')
                          setDateFilter('ALL')
                          setShowCalendarPopover(false)
                        }}
                        title="Bỏ lọc theo khoảng ngày"
                      >
                        ✕ Xóa bộ lọc
                      </button>
                    )}
                  </div>

                  {/* 🌟 ULTRA-CLEAN CLICK-TO-PICK CALENDAR POPOVER */}
                  {showCalendarPopover && (
                    <div className="calendar-click-popover">
                      {/* Top guide banner */}
                      <div className="cal-guide-header">
                        <span className="cal-guide-icon">👉</span>
                        <span>
                          {activeDatePicking === 'START'
                            ? 'Click ngày trên lịch để chọn ngày bắt đầu (Từ ngày):'
                            : 'Click ngày trên lịch để chọn ngày kết thúc (Đến ngày):'}
                        </span>
                        <div className="cal-active-tag">
                          {activeDatePicking === 'START' ? 'Đang chọn: Từ ngày' : 'Đang chọn: Đến ngày'}
                        </div>
                      </div>

                      {/* Quick presets row */}
                      <div className="cal-presets-row">
                        <button type="button" onClick={() => handleQuickCalendarPreset('TODAY')}>Hôm nay</button>
                        <button type="button" onClick={() => handleQuickCalendarPreset('YESTERDAY')}>Hôm qua</button>
                        <button type="button" onClick={() => handleQuickCalendarPreset('7DAYS')}>7 ngày qua</button>
                        <button type="button" onClick={() => handleQuickCalendarPreset('30DAYS')}>30 ngày qua</button>
                        <button type="button" onClick={() => handleQuickCalendarPreset('THIS_MONTH')}>Tháng này</button>
                      </div>

                      {/* Month navigator */}
                      <div className="cal-month-nav">
                        <button type="button" className="btn-nav-arrow" onClick={handlePrevMonth} title="Tháng trước">
                          ◀
                        </button>
                        <span className="cal-month-title">
                          Tháng {calendarViewDate.getMonth() + 1}, {calendarViewDate.getFullYear()}
                        </span>
                        <button type="button" className="btn-nav-arrow" onClick={handleNextMonth} title="Tháng sau">
                          ▶
                        </button>
                      </div>

                      {/* Weekday headers */}
                      <div className="cal-weekdays-grid">
                        <span>T2</span>
                        <span>T3</span>
                        <span>T4</span>
                        <span>T5</span>
                        <span>T6</span>
                        <span>T7</span>
                        <span>CN</span>
                      </div>

                      {/* Days grid */}
                      <div className="cal-days-grid">
                        {calendarDays.map((cell, idx) => {
                          const isStart = cell.dateStr === customStartDate
                          const isEnd = cell.dateStr === customEndDate
                          const inRange = customStartDate && customEndDate && cell.dateStr > customStartDate && cell.dateStr < customEndDate
                          const isToday = cell.dateStr === todayStr

                          let cellClasses = ['cal-day-btn']
                          if (!cell.isCurrentMonth) cellClasses.push('not-current-month')
                          if (isToday) cellClasses.push('is-today')
                          if (isStart) cellClasses.push('is-start-date')
                          if (isEnd) cellClasses.push('is-end-date')
                          if (inRange) cellClasses.push('in-range')

                          return (
                            <button
                              key={`${cell.dateStr}_${idx}`}
                              type="button"
                              className={cellClasses.join(' ')}
                              onClick={() => handleDayCellClick(cell.dateStr)}
                              title={formatDisplayDateVN(cell.dateStr)}
                            >
                              {cell.day}
                            </button>
                          )
                        })}
                      </div>

                      {/* Bottom Footer Actions */}
                      <div className="cal-popover-footer">
                        <div className="cal-selected-summary">
                          {customStartDate && (
                            <span>Từ: <b>{formatDisplayDateVN(customStartDate)}</b></span>
                          )}
                          {customEndDate && (
                            <span> - Đến: <b>{formatDisplayDateVN(customEndDate)}</b></span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-done-calendar"
                          onClick={() => setShowCalendarPopover(false)}
                        >
                          Xong / Đóng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="comments-feed-container">
            {loading ? (
              <div className="inbox-loading-state">
                <div className="spinner" />
                <p>Đang tải danh sách bình luận đã quét...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="inbox-empty-comments">
                <div className="empty-icon">💬</div>
                <h4>Chưa có bình luận nào cho bộ lọc này</h4>
                <p>Bấm nút <b>🚀 Quét mạng xã hội</b> ở trên để tiện ích quét các bình luận mới nhất về hệ thống!</p>
              </div>
            ) : (
              filteredComments.map((comment) => {
                const isReplied = Array.isArray(comment.replies) && comment.replies.length > 0
                const platformKey = comment.platform || 'FACEBOOK'

                return (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-card-top-bar">
                      <span className={`platform-badge tag-${platformKey.toLowerCase()}`}>
                        {PLATFORM_ICONS[platformKey]}
                        <span>{platformKey}</span>
                      </span>

                      {comment.videoTitle && (
                        <span className="comment-video-title" title={comment.videoTitle}>
                          🎬 {comment.videoTitle}
                        </span>
                      )}

                      {isReplied ? (
                        <span className="badge-replied">✅ Đã trả lời</span>
                      ) : (
                        <span className="badge-unreplied">⚡ Chưa trả lời</span>
                      )}
                    </div>

                    <div className="comment-main-row">
                      <img
                        src={
                          comment.authorAvatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
                        }
                        alt={comment.authorName}
                        className="comment-avatar"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
                        }}
                      />
                      <div className="comment-body">
                        <div className="comment-author-bar">
                          <strong className="author-name">{cleanAuthorName(comment.authorName)}</strong>
                          <span className="comment-time">
                            {formatCommentTime(comment.publishedAt, comment.timestampMs)}
                          </span>
                        </div>

                        <p className="comment-content-text">{cleanDisplayMessage(comment.message, comment.authorName)}</p>

                        {/* Action Controls - Mở bài viết trực tiếp trên nền tảng để trả lời */}
                        <div className="comment-actions-bar">
                          <button
                            type="button"
                            className={`action-btn-go-platform btn-go-${platformKey.toLowerCase()}`}
                            onClick={() => handleGoToPlatformReply(comment)}
                            title={`Mở bài viết trên ${platformKey} để trả lời bằng AI Lá Đỏ`}
                          >
                            <span className="btn-icon">↗️</span>
                            <span>
                              Mở {platformKey === 'FACEBOOK' ? 'bài viết Facebook' : platformKey === 'YOUTUBE' ? 'video YouTube' : 'TikTok'} để trả lời
                            </span>
                            <span className="ai-badge-hint">✨ Có nút AI Lá Đỏ</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies List */}
                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                      <div className="nested-replies-list">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="nested-reply-card">
                            <div className="reply-avatar-box">
                              <span className="reply-admin-icon">🍁</span>
                            </div>
                            <div className="reply-content-box">
                              <div className="reply-author-line">
                                <strong>{reply.authorName || 'Lá Đỏ Homestay Sa Pa'}</strong>
                                <span className="reply-admin-tag">Quản trị viên</span>
                                <span className="reply-time">{formatCommentTime(reply.publishedAt, reply.timestampMs)}</span>
                              </div>
                              <p className="reply-text">{reply.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
