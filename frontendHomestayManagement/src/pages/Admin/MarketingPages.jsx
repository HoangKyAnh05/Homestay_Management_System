import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { readNdjsonStream } from '../../utils/readNdjsonStream'
import './MarketingPages.css'

const API = 'http://localhost:8080/api/admin/marketing'
const API_ORIGIN = API.replace('/api/admin/marketing', '')
const TOKEN_KEY = 'homeStayAccessToken'
const MARKETING_EDIT_DRAFT_KEY = 'marketingEditDraftPost'

const CHANNELS = {
  FACEBOOK: { label: 'Facebook', short: 'f', color: '#1877f2' },
  INSTAGRAM: { label: 'Instagram', short: '◎', color: '#d946ef' },
  TIKTOK: { label: 'TikTok', short: '♪', color: '#111827' },
  ZALO: { label: 'Zalo', short: 'Z', color: '#0068ff' },
  LINKEDIN: { label: 'LinkedIn', short: 'in', color: '#0a66c2' },
}

const FALLBACK_GOALS = [
  { id: 'goal-1', label: 'Tăng nhận diện thương hiệu' },
  { id: 'goal-2', label: 'Thu hút lượt đặt phòng' },
  { id: 'goal-3', label: 'Quảng bá ưu đãi' },
  { id: 'goal-4', label: 'Tăng tương tác cộng đồng' },
]

const FALLBACK_TONES = [
  { id: 'tone-1', label: 'Ấm áp & truyền cảm hứng' },
  { id: 'tone-2', label: 'Trẻ trung & gần gũi' },
  { id: 'tone-3', label: 'Sang trọng & tinh tế' },
  { id: 'tone-4', label: 'Hài hước & bắt trend' },
]

const STATUS = {
  PUBLISHED: ['Đã đăng', 'success'],
  SCHEDULED: ['Đã lên lịch', 'info'],
  PUBLISHING: ['Đang đăng', 'info'],
  QUEUED: ['Đang xếp hàng', 'warning'],
  WAITING_FOR_USER_ACTION: ['Chờ thao tác', 'warning'],
  DRAFT: ['Bản nháp', 'neutral'],
  FAILED: ['Đăng lỗi', 'danger'],
  active: ['Đang hoạt động', 'success'],
  scheduled: ['Đã lên lịch', 'info'],
  expired: ['Đã kết thúc', 'neutral'],
}

function authHeaders() {
  const token = getStoredToken() || localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || localStorage.getItem('adminToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...options.headers },
    })
  } catch {
    throw new Error('Không thể kết nối máy chủ marketing. Hãy kiểm tra Spring Boot đang chạy ở cổng 8080.')
  }
  if (!response.ok) {
    const rawMessage = await response.text()
    let message
    try {
      const parsed = JSON.parse(rawMessage)
      message = parsed.message || parsed.errorMessage || parsed.error || rawMessage
    } catch {
      message = rawMessage
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(message || 'Phiên đăng nhập không có quyền truy cập Marketing. Hãy đăng nhập bằng tài khoản ADMIN hoặc MARKETING.')
    }
    throw new Error(message || 'Không thể kết nối máy chủ marketing.')
  }
  if (response.status === 204) return null
  return response.json()
}

async function uploadRequest(path, file) {
  const formData = new FormData()
  formData.append('file', file)
  const token = getStoredToken() || localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || localStorage.getItem('adminToken')
  let response
  try {
    response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
  } catch {
    throw new Error('Không thể tải file lên máy chủ marketing.')
  }
  if (!response.ok) {
    const rawMessage = await response.text()
    let message
    try {
      const parsed = JSON.parse(rawMessage)
      message = parsed.message || parsed.errorMessage || parsed.error || rawMessage
    } catch {
      message = rawMessage
    }
    throw new Error(message || 'Không thể tải file lên.')
  }
  return response.json()
}

function Icon({ name, size = 18 }) {
  const paths = {
    sparkles: <><path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z"/><path d="m5 13-.8 2.2L2 16l2.2.8L5 19l.8-2.2L8 16l-2.2-.8L5 13Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    ticket: <><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M13 5v14"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    wand: <><path d="m15 4 5 5L8 21H3v-5Z"/><path d="m6 14 5 5M6 3v4M4 5h4"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2M9 10v8M15 10v8"/><path d="M5 6l1 15h12l1-15"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></>,
  }
  return <svg className="mkt-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function StatusBadge({ value }) {
  const [label, tone] = STATUS[value] || [value, 'neutral']
  return <span className={`mkt-status mkt-status--${tone}`}><i />{label}</span>
}

function Channel({ value, label = true }) {
  const channel = CHANNELS[value] || { label: value, short: value?.slice(0, 1) || '?', color: '#667085' }
  return (
    <span className="mkt-channel">
      <i style={{ background: channel.color }}>{channel.short}</i>
      {label && channel.label}
    </span>
  )
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="mkt-page-header">
      <div>
        <span className="mkt-eyebrow"><Icon name="sparkles" size={14} />{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

function MetricCard({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <article className="mkt-metric">
      <span className={`mkt-metric-icon mkt-metric-icon--${tone}`}><Icon name={icon} /></span>
      <div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>
    </article>
  )
}

function optionValues(options, fallback) {
  return options?.length ? options : fallback
}

function resolveMediaUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return `${API_ORIGIN}/${value}`
}

function toDateInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}

function toTimeInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toTimeString().slice(0, 5)
}

function formatScheduleTime(value) {
  if (!value) return 'Chưa chọn thời gian'
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)
}

function toDateTimeInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function fromDateTimeInputValue(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function voucherFormFromItem(voucher = null) {
  return {
    code: voucher?.code || '',
    discountType: voucher?.discountType || 'PERCENT',
    discountValue: voucher?.discountValue ?? '',
    minOrderValue: voucher?.minOrderValue ?? '',
    maxDiscountAmount: voucher?.maxDiscountAmount ?? '',
    startDate: toDateTimeInputValue(voucher?.startDate),
    endDate: toDateTimeInputValue(voucher?.endDate),
    usageLimit: voucher?.usageLimit ?? '',
  }
}

function voucherPayload(form) {
  const nullableNumber = (value) => value === '' || value == null ? null : Number(value)
  return {
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderValue: nullableNumber(form.minOrderValue),
    maxDiscountAmount: nullableNumber(form.maxDiscountAmount),
    startDate: fromDateTimeInputValue(form.startDate),
    endDate: fromDateTimeInputValue(form.endDate),
    usageLimit: form.usageLimit === '' || form.usageLimit == null ? null : Number.parseInt(form.usageLimit, 10),
  }
}

function voucherDiscountLabel(voucher) {
  if (!voucher) return ''
  if (voucher.discountType === 'PERCENT') return `${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}%`
  return formatMoney(voucher.discountValue)
}

function voucherPeriod(voucher) {
  const format = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '∞'
  return `${format(voucher.startDate)} - ${format(voucher.endDate)}`
}

export function MarketingAIAgentPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [publishingChannels, setPublishingChannels] = useState({})
  const [scheduleModal, setScheduleModal] = useState({ open: false, channel: null, date: '', time: '' })
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [reloadModal, setReloadModal] = useState({ open: false, instruction: '' })
  const [reloadingContent, setReloadingContent] = useState(false)
  const [error, setError] = useState('')
  const [generatedPost, setGeneratedPost] = useState(null)
  const [copied, setCopied] = useState(false)
  const [newOption, setNewOption] = useState({ GOAL: '', TONE: '' })
  const [socialAuth, setSocialAuth] = useState({ platform: 'FACEBOOK', sessionId: '', url: '', status: '', accounts: [], loading: false, message: '' })
  const [form, setForm] = useState({
    title: 'Bài đăng nghỉ dưỡng cuối tuần',
    goal: FALLBACK_GOALS[0].label,
    tone: FALLBACK_TONES[0].label,
    targetAudience: 'Cặp đôi trẻ, gia đình nhỏ hoặc nhóm bạn muốn nghỉ dưỡng cuối tuần.',
    brief: 'Giới thiệu không gian nghỉ dưỡng yên tĩnh giữa rừng thông, phù hợp cho cặp đôi muốn chữa lành cuối tuần.',
    mediaUrl: '',
    mediaItems: [],
  })
  const [targets, setTargets] = useState([
    { id: crypto.randomUUID(), platform: 'FACEBOOK', socialAccountId: '', pageName: '', pageUrl: '' },
  ])

  const goals = optionValues(dashboard?.goals, FALLBACK_GOALS)
  const tones = optionValues(dashboard?.tones, FALLBACK_TONES)
  const socialAccounts = useMemo(() => dashboard?.socialAccounts || [], [dashboard?.socialAccounts])
  const previewChannel = generatedPost?.channels?.[0]
  const previewMediaItems = generatedPost?.id ? (generatedPost.media || []) : form.mediaItems
  const scheduledItems = useMemo(() => {
    const items = (dashboard?.recentPosts || []).flatMap((post) => (post.channels || [])
      .filter((channel) => channel.scheduledAt || channel.status === 'SCHEDULED')
      .map((channel) => ({ ...channel, post })))
    return items.sort((a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0))
  }, [dashboard?.recentPosts])
  const savedAccountLookup = useMemo(() => {
    const map = new Map()
    socialAccounts.forEach((account) => {
      if (account.externalAccountId) {
        map.set(`${account.platform || ''}:${account.externalAccountId}`, account)
      }
    })
    return map
  }, [socialAccounts])
  const connectedAccounts = useMemo(() => {
    const map = new Map()
    socialAuth.accounts.forEach((account) => {
      const platform = account.platform || socialAuth.platform
      const key = `${platform || ''}:${account.accountId || account.platformUid || account.displayName || ''}`
      if (!map.has(key)) {
        const saved = account.accountId ? savedAccountLookup.get(`${platform}:${account.accountId}`) : null
        map.set(key, saved ? {
          ...account,
          localSocialAccountId: account.localSocialAccountId || saved.id,
          displayName: account.displayName || saved.accountName,
          pageUrl: account.pageUrl || saved.pageUrl,
        } : account)
      }
    })
    return Array.from(map.values())
  }, [savedAccountLookup, socialAuth.accounts, socialAuth.platform])

  useEffect(() => {
    let active = true
    request('/dashboard')
      .then((data) => {
        if (!active) return
        setDashboard(data)
        setForm((current) => ({
          ...current,
          goal: data.goals?.[0]?.label || current.goal,
          tone: data.tones?.[0]?.label || current.tone,
        }))
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const accountsByPlatform = useMemo(() => {
    const map = new Map()
    socialAccounts.forEach((account) => {
      const list = map.get(account.platform) || []
      list.push(account)
      map.set(account.platform, list)
    })
    return map
  }, [socialAccounts])

  const refreshDashboard = async () => {
    const data = await request('/dashboard')
    setDashboard(data)
    return data
  }

  const updateTarget = (id, patch) => {
    setTargets((current) => current.map((target) => {
      if (target.id !== id) return target
      const next = { ...target, ...patch }
      if (patch.socialAccountId) {
        const account = socialAccounts.find((item) => String(item.id) === String(patch.socialAccountId))
        if (account) {
          next.platform = account.platform
          next.pageName = account.accountName
          next.pageUrl = account.pageUrl || ''
        }
      }
      return next
    }))
    if (patch.socialAccountId && generatedPost?.channels?.length) {
      const account = socialAccounts.find((item) => String(item.id) === String(patch.socialAccountId))
      if (account) {
        setGeneratedPost((current) => {
          if (!current?.channels?.length) return current
          const targetIndex = targets.findIndex((target) => target.id === id)
          const nextChannels = current.channels.map((channel, index) => {
            const sameRow = targetIndex >= 0 ? index === targetIndex : false
            const samePlatform = channel.platform === account.platform
            if (!sameRow && !samePlatform) return channel
            return {
              ...channel,
              socialAccountId: account.id,
              platform: account.platform,
              pageName: account.accountName,
              pageUrl: account.pageUrl || '',
            }
          })
          return { ...current, channels: nextChannels }
        })
      }
    }
  }

  const addTarget = () => {
    setTargets((current) => [...current, { id: crypto.randomUUID(), platform: 'FACEBOOK', socialAccountId: '', pageName: '', pageUrl: '' }])
  }

  const removeTarget = (id) => {
    setTargets((current) => current.length === 1 ? current : current.filter((target) => target.id !== id))
  }

  const loadPostIntoEditor = (post, preferredChannelId = null) => {
    if (!post) return
    const orderedChannels = [...(post.channels || [])].sort((first, second) => {
      if (!preferredChannelId) return 0
      if (String(first.id) === String(preferredChannelId)) return -1
      if (String(second.id) === String(preferredChannelId)) return 1
      return 0
    })
    const editablePost = { ...post, channels: orderedChannels }
    setForm((current) => ({
      ...current,
      title: editablePost.title || current.title,
      goal: editablePost.goal || current.goal,
      tone: editablePost.tone || current.tone,
      targetAudience: editablePost.targetAudience || '',
      brief: editablePost.brief || '',
      mediaUrl: '',
      mediaItems: (editablePost.media || []).map((media, index) => ({
        id: media.id || `${media.mediaUrl}-${index}`,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType || 'IMAGE',
        displayOrder: media.displayOrder || index + 1,
        altText: media.altText || '',
        source: media.source || 'UPLOADED',
        name: media.altText || media.mediaUrl,
      })),
    }))
    setTargets((orderedChannels.length ? orderedChannels : []).map((channel) => ({
      id: crypto.randomUUID(),
      platform: channel.platform || 'FACEBOOK',
      socialAccountId: channel.socialAccountId ? String(channel.socialAccountId) : '',
      pageName: channel.pageName || '',
      pageUrl: channel.pageUrl || '',
    })))
    if (!orderedChannels.length) {
      setTargets([{ id: crypto.randomUUID(), platform: 'FACEBOOK', socialAccountId: '', pageName: '', pageUrl: '' }])
    }
    setGeneratedPost(editablePost)
    setCalendarOpen(false)
    setError('')
  }

  const normalizeDraftPayload = (payload) => {
    const post = payload?.post || payload
    if (!post) return null
    const selectedChannel = payload?.channel
    if (!selectedChannel?.id) {
      return { post, preferredChannelId: payload?.channelId || null }
    }
    const channels = post.channels?.length ? post.channels : []
    const found = channels.some((channel) => String(channel.id) === String(selectedChannel.id))
    const mergedChannels = found
      ? channels.map((channel) => String(channel.id) === String(selectedChannel.id) ? { ...channel, ...selectedChannel } : channel)
      : [selectedChannel, ...channels]
    return {
      post: { ...post, channels: mergedChannels },
      preferredChannelId: selectedChannel.id,
    }
  }

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(MARKETING_EDIT_DRAFT_KEY)
    const params = new URLSearchParams(window.location.search)
    const queryPostId = params.get('editPostId')
    const queryChannelId = params.get('channelId')
    if (!rawDraft && !queryPostId) return
    sessionStorage.removeItem(MARKETING_EDIT_DRAFT_KEY)
    const timer = window.setTimeout(() => {
      ;(async () => {
        try {
          const stored = rawDraft ? JSON.parse(rawDraft) : {}
          const postId = stored?.postId || stored?.post?.id || stored?.id || queryPostId
          const channelId = stored?.channelId || stored?.channel?.id || queryChannelId || null
          if (postId) {
            const freshPost = await request(`/posts/${postId}`)
            loadPostIntoEditor(freshPost, channelId)
            if (queryPostId) {
              window.history.replaceState(null, '', '/admin/marketing/ai-agent')
            }
            return
          }
          const draft = normalizeDraftPayload(stored)
          if (draft?.post) {
            loadPostIntoEditor(draft.post, draft.preferredChannelId)
          }
        } catch {
          setError('Không thể mở lại bản nháp từ Nhật ký bài đăng.')
        }
      })()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const addOption = async (optionType) => {
    const label = newOption[optionType].trim()
    if (!label) return
    await request('/options', { method: 'POST', body: JSON.stringify({ optionType, label }) })
    setNewOption((current) => ({ ...current, [optionType]: '' }))
    await refreshDashboard()
  }

  const deleteOption = async (id) => {
    if (typeof id === 'string') return
    await request(`/options/${id}`, { method: 'DELETE' })
    await refreshDashboard()
  }

  const updateSocialAuth = (patch) => {
    setSocialAuth((current) => ({ ...current, ...patch }))
  }

  const startSocialAuth = async () => {
    const user = getStoredUser()
    if (!['ROLE_ADMIN', 'ROLE_MARKETING'].includes(user?.role)) {
      updateSocialAuth({ message: 'Bạn cần đăng nhập bằng tài khoản ADMIN hoặc MARKETING để kết nối social.' })
      return
    }
    updateSocialAuth({ loading: true, message: '', accounts: [] })
    try {
      const data = await request('/social-auth/start', {
        method: 'POST',
        body: JSON.stringify({ platform: socialAuth.platform }),
      })
      updateSocialAuth({
        sessionId: data.sessionId || '',
        url: data.url || '',
        status: 'PENDING',
        message: data.url ? 'Đã mở cửa sổ xác thực. Sau khi cấp quyền, bấm “Kiểm tra kết nối”.' : 'Backend chưa trả URL xác thực.',
      })
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      updateSocialAuth({ message: err.message })
    } finally {
      updateSocialAuth({ loading: false })
    }
  }

  const checkSocialAuth = async () => {
    if (!socialAuth.sessionId) {
      updateSocialAuth({ message: 'Chưa có phiên kết nối. Hãy bấm “Kết nối social” trước.' })
      return
    }
    updateSocialAuth({ loading: true, message: '' })
    try {
      const data = await request(`/social-auth/status?platform=${encodeURIComponent(socialAuth.platform)}&sessionId=${encodeURIComponent(socialAuth.sessionId)}`)
      const accounts = [
        ...(data.accounts || []),
        ...(data.selectableAccounts || []),
      ]
      const normalizedAccounts = accounts.length
        ? accounts
        : data.accountId ? [{ accountId: data.accountId, platform: socialAuth.platform, displayName: data.accountId }] : []
      updateSocialAuth({
        status: data.status || 'UNKNOWN',
        accounts: normalizedAccounts,
        message: normalizedAccounts.length ? 'Đã tìm thấy tài khoản. Hãy bấm “Lưu vào thư viện”.' : `Trạng thái hiện tại: ${data.status || 'UNKNOWN'}`,
      })
    } catch (err) {
      updateSocialAuth({ message: err.message })
    } finally {
      updateSocialAuth({ loading: false })
    }
  }

  const loadConnectedAccounts = async () => {
    updateSocialAuth({ loading: true, message: '' })
    try {
      const accounts = await request(`/social-auth/accounts?platform=${encodeURIComponent(socialAuth.platform)}`)
      updateSocialAuth({
        accounts: accounts || [],
        message: accounts?.length ? 'Đã tải tài khoản đã kết nối từ MySQL.' : 'Chưa có tài khoản nào đã kết nối trong MySQL.',
      })
    } catch (err) {
      updateSocialAuth({ message: err.message })
    } finally {
      updateSocialAuth({ loading: false })
    }
  }

  const saveConnectedAccount = async (account) => {
    if (!account.accountId) return
    const saved = await request('/social-accounts', {
      method: 'POST',
      body: JSON.stringify({
        platform: account.platform || socialAuth.platform,
        accountName: account.displayName || account.platformUid || account.accountId,
        pageUrl: account.pageUrl || '',
        externalAccountId: account.accountId,
      }),
    })
    setSocialAuth((current) => ({
      ...current,
      accounts: current.accounts.map((item) => item.accountId === account.accountId
        ? { ...item, localSocialAccountId: saved.id, displayName: saved.accountName, pageUrl: saved.pageUrl }
        : item),
    }))
    updateSocialAuth({ message: 'Đã lưu page vào thư viện đăng bài.' })
    await refreshDashboard()
  }

  const deleteConnectedAccount = async (account) => {
    const localId = account.localSocialAccountId || socialAccounts.find((item) => item.platform === (account.platform || socialAuth.platform) && item.externalAccountId === account.accountId)?.id
    if (localId) {
      await request(`/social-accounts/${localId}`, { method: 'DELETE' })
      await refreshDashboard()
    }
    setSocialAuth((current) => ({
      ...current,
      accounts: current.accounts.filter((item) => item.accountId !== account.accountId),
      message: localId ? 'Đã xóa tài khoản khỏi thư viện.' : 'Đã xóa tài khoản khỏi danh sách hiển thị.',
    }))
  }

  const uploadMarketingMedia = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setMediaUploading(true)
    setError('')
    try {
      const uploadedItems = []
      for (const file of files) {
        const uploaded = await uploadRequest('/media/upload', file)
        uploadedItems.push({
          id: crypto.randomUUID(),
          mediaUrl: uploaded.mediaUrl,
          mediaType: uploaded.mediaType || (file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'),
          displayOrder: 0,
          altText: uploaded.originalFilename || file.name,
          source: 'UPLOADED',
          name: uploaded.originalFilename || file.name,
        })
      }
      const baseItems = generatedPost?.id ? (generatedPost.media || []) : form.mediaItems
      const nextItems = [...baseItems, ...uploadedItems].map((item, index) => ({ ...item, displayOrder: index + 1 }))
      setForm((current) => ({ ...current, mediaItems: nextItems }))
      if (generatedPost?.id) {
        setGeneratedPost((current) => current ? { ...current, media: nextItems } : current)
        await persistPostMedia(generatedPost.id, nextItems)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setMediaUploading(false)
    }
  }

  const addManualMedia = () => {
    const mediaUrl = form.mediaUrl.trim()
    if (!mediaUrl) return
    const mediaType = /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(mediaUrl) ? 'VIDEO' : 'IMAGE'
    const baseItems = generatedPost?.id ? (generatedPost.media || []) : form.mediaItems
    const nextItems = [
      ...baseItems,
      {
        id: crypto.randomUUID(),
        mediaUrl,
        mediaType,
        displayOrder: baseItems.length + 1,
        altText: '',
        source: 'URL',
        name: mediaUrl,
      },
    ]
    setForm((current) => ({ ...current, mediaUrl: '', mediaItems: nextItems }))
    if (generatedPost?.id) {
      setGeneratedPost((current) => current ? { ...current, media: nextItems } : current)
      persistPostMedia(generatedPost.id, nextItems).catch((err) => setError(err.message))
    }
  }

  const removeMediaItem = (id) => {
    const baseItems = generatedPost?.id ? (generatedPost.media || []) : form.mediaItems
    const nextItems = baseItems
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, displayOrder: index + 1 }))
    setForm((current) => ({
      ...current,
      mediaItems: nextItems,
    }))
    if (generatedPost?.id) {
      setGeneratedPost((current) => current ? { ...current, media: nextItems } : current)
      persistPostMedia(generatedPost.id, nextItems).catch((err) => setError(err.message))
    }
  }

  const removePreviewMedia = (media) => {
    const sameMedia = (item) => {
      if (media.id && item.id && String(item.id) === String(media.id)) return true
      return item.mediaUrl === media.mediaUrl
    }
    const baseItems = generatedPost?.id ? (generatedPost.media || []) : form.mediaItems
    const nextItems = baseItems
      .filter((item) => !sameMedia(item))
      .map((item, index) => ({ ...item, displayOrder: index + 1 }))
    setForm((current) => ({ ...current, mediaItems: nextItems }))
    if (generatedPost?.id) {
      setGeneratedPost((current) => current ? { ...current, media: nextItems } : current)
      persistPostMedia(generatedPost.id, nextItems).catch((err) => setError(err.message))
    }
  }

  const mediaPayload = (items) => items.map((media, index) => ({
    mediaUrl: media.mediaUrl,
    mediaType: media.mediaType || 'IMAGE',
    displayOrder: index + 1,
    altText: media.altText || media.name || '',
    source: media.source || 'UPLOADED',
  }))

  const persistPostMedia = async (postId, items) => {
    const post = await request(`/posts/${postId}/media`, {
      method: 'PATCH',
      body: JSON.stringify(mediaPayload(items)),
    })
    setGeneratedPost(post)
    setForm((current) => ({
      ...current,
      mediaItems: (post.media || []).map((media, index) => ({
        id: media.id || `${media.mediaUrl}-${index}`,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType || 'IMAGE',
        displayOrder: media.displayOrder || index + 1,
        altText: media.altText || '',
        source: media.source || 'UPLOADED',
        name: media.altText || media.mediaUrl,
      })),
    }))
    await refreshDashboard()
    return post
  }

  const generate = async () => {
    if (!form.brief.trim()) {
      setError('Hãy nhập mô tả ngắn để AI có chất liệu sáng tạo.')
      return
    }
    if (!targets.length) {
      setError('Chọn ít nhất một page/kênh đăng bài.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        brief: form.brief,
        targetAudience: form.targetAudience,
        goal: form.goal,
        tone: form.tone,
        channels: targets.map((target) => ({
          socialAccountId: target.socialAccountId ? Number(target.socialAccountId) : null,
          platform: target.platform,
          pageName: target.pageName,
          pageUrl: target.pageUrl,
        })),
        media: mediaPayload(form.mediaItems),
      }
      let streamedContent = ''
      setGeneratedPost({
        id: null,
        title: form.title,
        brief: form.brief,
        targetAudience: form.targetAudience,
        goal: form.goal,
        tone: form.tone,
        status: 'DRAFT',
        channels: targets.map((target, index) => ({
          id: `stream-${index}`,
          socialAccountId: target.socialAccountId ? Number(target.socialAccountId) : null,
          platform: target.platform,
          pageName: target.pageName,
          pageUrl: target.pageUrl,
          content: '',
          status: 'DRAFT',
        })),
        media: form.mediaItems,
        streaming: true,
      })
      const response = await fetch(`${API}/posts/generate/stream`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Không thể tạo nội dung marketing.')
      }
      await readNdjsonStream(response, (event) => {
        const payload = event.payload || {}
        if (event.type === 'delta') {
          streamedContent += payload.text || ''
          setGeneratedPost((current) => current ? {
            ...current,
            channels: (current.channels || []).map((channel) => ({ ...channel, content: streamedContent })),
          } : current)
        } else if (event.type === 'done') {
          setGeneratedPost(payload.post)
        } else if (event.type === 'error') {
          throw new Error(payload.message || 'Không thể tạo nội dung marketing.')
        }
      })
      await refreshDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const copyPost = async () => {
    if (!previewChannel?.content) return
    await navigator.clipboard?.writeText(previewChannel.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const updatePreviewContent = (channelId, value) => {
    setGeneratedPost((current) => {
      if (!current?.channels?.length) return current
      return {
        ...current,
        channels: current.channels.map((channel) => channel.id === channelId ? { ...channel, content: value } : channel),
      }
    })
  }

  const saveChannelContent = async (channelId) => {
    if (!generatedPost?.id) {
      return true
    }
    const channel = generatedPost?.channels?.find((item) => item.id === channelId)
    if (!channel?.content?.trim()) {
      setError('Nội dung bài đăng không được để trống.')
      return false
    }
    try {
      const post = await request(`/channels/${channelId}/content`, {
        method: 'PATCH',
        body: JSON.stringify({ content: channel.content, hashtags: channel.hashtags || '' }),
      })
      setGeneratedPost(post)
      await refreshDashboard()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const submitReloadContent = async () => {
    if (!previewChannel?.id) return
    if (!reloadModal.instruction.trim()) {
      setError('Vui lòng nhập yêu cầu cho đoạn văn mới.')
      return
    }
    setReloadingContent(true)
    setError('')
    try {
      const post = await request(`/channels/${previewChannel.id}/regenerate-content`, {
        method: 'POST',
        body: JSON.stringify({ instruction: reloadModal.instruction.trim() }),
      })
      setGeneratedPost(post)
      await refreshDashboard()
      setReloadModal({ open: false, instruction: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setReloadingContent(false)
    }
  }

  const publish = async (channelId) => {
    const channel = generatedPost?.channels?.find((item) => item.id === channelId)
    if (!channel?.socialAccountId) {
      setError('Kênh này chưa gán page/tài khoản social đã kết nối. Hãy chọn page trong danh sách thay vì “Nhập link thủ công”, rồi tạo lại bài.')
      return
    }
    if (channel.status === 'PUBLISHED' || publishingChannels[channelId]) {
      return
    }
    setPublishingChannels((current) => ({ ...current, [channelId]: true }))
    setError('')
    try {
      const saved = await saveChannelContent(channelId)
      if (!saved) return
      const post = await request(`/channels/${channelId}/publish`, { method: 'POST' })
      setGeneratedPost(post)
      await refreshDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setPublishingChannels((current) => ({ ...current, [channelId]: false }))
    }
  }

  const schedule = (channelId) => {
    const channel = generatedPost?.channels?.find((item) => item.id === channelId)
    const defaultDate = channel?.scheduledAt ? new Date(channel.scheduledAt) : new Date()
    if (!channel?.scheduledAt) {
      defaultDate.setHours(defaultDate.getHours() + 1)
    }
    setScheduleModal({
      open: true,
      channel,
      date: toDateInputValue(defaultDate),
      time: toTimeInputValue(defaultDate),
    })
  }

  const closeScheduleModal = () => {
    if (scheduleSaving) return
    setScheduleModal({ open: false, channel: null, date: '', time: '' })
  }

  const submitSchedule = async () => {
    if (!scheduleModal.channel?.id) return
    if (!scheduleModal.date || !scheduleModal.time) {
      setError('Vui lòng chọn đủ ngày và giờ đăng.')
      return
    }
    const scheduledAt = `${scheduleModal.date}T${scheduleModal.time}:00`
    if (new Date(scheduledAt) <= new Date()) {
      setError('Thời gian đăng phải lớn hơn thời điểm hiện tại.')
      return
    }
    setScheduleSaving(true)
    setError('')
    try {
      const saved = await saveChannelContent(scheduleModal.channel.id)
      if (!saved) return
      const post = await request(`/channels/${scheduleModal.channel.id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) })
      setGeneratedPost(post)
      await refreshDashboard()
      closeScheduleModal()
      setCalendarOpen(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setScheduleSaving(false)
    }
  }

  return (
    <AdminLayout activePage="ai-post-agent">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Trợ lý nội dung"
          title="AI Agent Đăng bài"
          description="Tạo nội dung bằng AI, gán nhiều page cho từng kênh, lên lịch hoặc đăng social có kiểm soát log."
          action={<button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setCalendarOpen(true)} disabled={loading}><Icon name="clock" />{loading ? 'Đang tải...' : 'Lịch nội dung'}</button>}
        />

        {error && <p className="mkt-alert">{error}</p>}

        <div className="mkt-ai-grid">
          <section className="mkt-card mkt-compose">
            <div className="mkt-section-title">
              <span className="mkt-section-number">01</span>
              <div><h2>Thiết lập bài đăng</h2><p>Cho AI biết mục tiêu, giọng điệu và nơi cần đăng.</p></div>
            </div>

            <label className="mkt-field">Tiêu đề nội bộ
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>

            <div className="mkt-form-row">
              <label className="mkt-field">Mục tiêu bài viết
                <select value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })}>
                  {goals.map((goal) => <option key={goal.id} value={goal.label}>{goal.label}</option>)}
                </select>
              </label>
              <label className="mkt-field">Giọng điệu
                <select value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })}>
                  {tones.map((tone) => <option key={tone.id} value={tone.label}>{tone.label}</option>)}
                </select>
              </label>
            </div>

            <div className="mkt-option-manager">
              <OptionEditor title="Mục tiêu" type="GOAL" options={goals} value={newOption.GOAL} onChange={(value) => setNewOption({ ...newOption, GOAL: value })} onAdd={addOption} onDelete={deleteOption} />
              <OptionEditor title="Giọng điệu" type="TONE" options={tones} value={newOption.TONE} onChange={(value) => setNewOption({ ...newOption, TONE: value })} onAdd={addOption} onDelete={deleteOption} />
            </div>

            <label className="mkt-field">
              <span>Đối tượng khách hàng <small>{form.targetAudience.length}/300</small></span>
              <input
                maxLength="300"
                value={form.targetAudience}
                onChange={(event) => setForm({ ...form, targetAudience: event.target.value })}
                placeholder="VD: Cặp đôi trẻ, gia đình có trẻ nhỏ, khách doanh nghiệp cần nghỉ dưỡng..."
              />
            </label>

            <label className="mkt-field">
              <span>Ý tưởng hoặc mô tả ngắn <em>*</em><small>{form.brief.length}/2000</small></span>
              <textarea maxLength="2000" rows="5" value={form.brief} onChange={(event) => setForm({ ...form, brief: event.target.value })} />
            </label>

            <div className="mkt-targets">
              <div className="mkt-subhead">
                <div><strong>Kênh & page đăng bài</strong><small>Có thể thêm nhiều page cho cùng một kênh.</small></div>
                <button className="mkt-mini-btn" type="button" onClick={addTarget}><Icon name="plus" size={15} />Thêm kênh/page</button>
              </div>
              {targets.map((target) => (
                <div className="mkt-target-row mkt-post-target-row" key={target.id}>
                  <select value={target.platform} onChange={(event) => updateTarget(target.id, { platform: event.target.value, socialAccountId: '' })}>
                    {Object.entries(CHANNELS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                  </select>
                  <select value={target.socialAccountId} onChange={(event) => updateTarget(target.id, { socialAccountId: event.target.value })}>
                    <option value="">Nhập link thủ công</option>
                    {(accountsByPlatform.get(target.platform) || []).map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
                  </select>
                  <input value={target.pageName} onChange={(event) => updateTarget(target.id, { pageName: event.target.value })} placeholder="Tên page" />
                  <input value={target.pageUrl} onChange={(event) => updateTarget(target.id, { pageUrl: event.target.value })} placeholder="Link page cần đăng" />
                  <button type="button" onClick={() => removeTarget(target.id)} title="Xóa"><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>

            <section className="mkt-social-form mkt-auth-panel">
              <div className="mkt-subhead">
                <div>
                  <strong>Kết nối page social vào thư viện</strong>
                  <small>Không cần nhập External Account ID. Backend lấy page/accountId qua OAuth và lưu vào MySQL.</small>
                </div>
              </div>
              <div className="mkt-auth-row">
                <select value={socialAuth.platform} onChange={(event) => updateSocialAuth({ platform: event.target.value, sessionId: '', url: '', status: '', accounts: [], message: '' })}>
                  {Object.entries(CHANNELS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                </select>
                <button className="mkt-btn mkt-btn--primary" type="button" onClick={startSocialAuth} disabled={socialAuth.loading}>
                  <Icon name="link" />Kết nối social
                </button>
                <button className="mkt-btn mkt-btn--secondary" type="button" onClick={checkSocialAuth} disabled={socialAuth.loading || !socialAuth.sessionId}>
                  Kiểm tra kết nối
                </button>
                <button className="mkt-btn mkt-btn--secondary" type="button" onClick={loadConnectedAccounts} disabled={socialAuth.loading}>
                  Tải tài khoản đã kết nối
                </button>
              </div>
              {socialAuth.message && <p className="mkt-auth-message">{socialAuth.message}</p>}
              {socialAuth.url && (
                <a className="mkt-auth-link" href={socialAuth.url} target="_blank" rel="noreferrer">Mở lại cửa sổ xác thực</a>
              )}
              {connectedAccounts.length > 0 && (
                <div className="mkt-connected-list">
                  {connectedAccounts.map((account) => (
                    <article className="mkt-connected-account" key={account.accountId}>
                      <div>
                        <strong>{account.displayName || account.platformUid || account.accountId}</strong>
                        <small>{account.platform || socialAuth.platform} · {account.accountId}</small>
                      </div>
                      <div className="mkt-connected-actions">
                        {account.localSocialAccountId ? (
                          <span className="mkt-saved-pill"><Icon name="check" size={14} />Đã lưu</span>
                        ) : (
                          <button className="mkt-mini-btn" type="button" onClick={() => saveConnectedAccount(account)}>
                            <Icon name="plus" size={15} />Lưu vào thư viện
                          </button>
                        )}
                        <button className="mkt-mini-btn mkt-mini-btn--danger" type="button" onClick={() => deleteConnectedAccount(account)}>
                          <Icon name="trash" size={15} />Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <label className="mkt-field">Link ảnh/video
              <span>
                <input value={form.mediaUrl} onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} placeholder="https://... hoặc /uploads/marketing/..." />
                <button className="mkt-mini-btn" type="button" onClick={addManualMedia} disabled={!form.mediaUrl.trim()}><Icon name="plus" size={14} />Thêm link</button>
              </span>
            </label>

            <div className="mkt-upload">
              <span><Icon name="image" /></span>
              <div>
                <strong>{form.mediaItems.length ? `Đã gắn ${form.mediaItems.length} ảnh/video` : 'Tải nhiều ảnh/video từ máy tính'}</strong>
                <p>Hỗ trợ chọn nhiều file cùng lúc. Với Facebook, nhiều ảnh sẽ được đăng cùng một bài viết.</p>
              </div>
              <label className="mkt-upload-btn">
                {mediaUploading ? 'Đang tải...' : 'Chọn file'}
                <input type="file" accept="image/*,video/*" onChange={uploadMarketingMedia} disabled={mediaUploading} multiple hidden />
              </label>
            </div>

            {form.mediaItems.length > 0 && (
              <div className="mkt-media-list">
                {form.mediaItems.map((media, index) => (
                  <article key={media.id}>
                    <span>{String(media.mediaType || '').toUpperCase() === 'VIDEO' ? <Icon name="send" size={16} /> : <Icon name="image" size={16} />}</span>
                    <div>
                      <strong>{index + 1}. {media.name || media.altText || media.mediaUrl}</strong>
                      <small>{media.mediaType || 'IMAGE'} · {media.mediaUrl}</small>
                    </div>
                    <button type="button" onClick={() => removeMediaItem(media.id)} title="Xóa media"><Icon name="trash" size={14} /></button>
                  </article>
                ))}
              </div>
            )}

            <button className="mkt-btn mkt-btn--primary mkt-generate" type="button" onClick={generate} disabled={saving}>
              <Icon name="wand" />{saving ? 'AI đang tạo...' : 'Tạo nội dung với AI'}
            </button>
          </section>

          <aside className="mkt-card mkt-preview">
            <div className="mkt-preview-head">
              <div><span>XEM TRƯỚC</span><h2>Nội dung đề xuất</h2></div>
              <div className="mkt-preview-tools">
                <button type="button" onClick={() => setReloadModal({ open: true, instruction: '' })} disabled={!generatedPost?.id || !previewChannel?.id || reloadingContent}><Icon name="sparkles" />Tạo lại</button>
                <button type="button" onClick={copyPost}><Icon name={copied ? 'check' : 'copy'} />{copied ? 'Đã sao chép' : 'Sao chép'}</button>
              </div>
            </div>

            <div className="mkt-preview-tabs">
              {(generatedPost?.channels?.length ? generatedPost.channels : targets).map((channel, index) => (
                <button className={index === 0 ? 'is-active' : ''} type="button" key={channel.id}><Channel value={channel.platform} /></button>
              ))}
            </div>

            <div className="mkt-social-card">
              <div className="mkt-social-author">
                <span className="mkt-brand-avatar">H</span>
                <div><strong>{previewChannel?.pageName || 'Home Stays'}</strong><small>Được hỗ trợ bởi AI · 🌐</small></div>
              </div>
              <div className="mkt-social-copy">
                {previewChannel?.content ? (
                  <label className="mkt-editable-copy">
                    <span>Nội dung đề xuất — có thể chỉnh sửa trước khi đăng</span>
                    <textarea
                      value={previewChannel.content}
                      onChange={(event) => updatePreviewContent(previewChannel.id, event.target.value)}
                      onBlur={() => saveChannelContent(previewChannel.id)}
                      rows={10}
                    />
                  </label>
                ) : (
                  <div className="mkt-empty-preview"><Icon name="sparkles" size={28} /><strong>Nội dung sẽ xuất hiện tại đây</strong><span>Điền thông tin và chọn “Tạo nội dung với AI”.</span></div>
                )}
              </div>
              <div className={`mkt-social-image ${previewMediaItems.length ? 'has-media' : ''}`}>
                {previewMediaItems.length ? (
                  <div className={`mkt-preview-media-grid mkt-preview-media-grid--${Math.min(previewMediaItems.length, 4)}`}>
                    {previewMediaItems.slice(0, 4).map((media, index) => (
                      <figure key={media.id || media.mediaUrl || index}>
                        {String(media.mediaType || '').toUpperCase() === 'VIDEO' ? (
                          <video src={resolveMediaUrl(media.mediaUrl)} controls muted />
                        ) : (
                          <img src={resolveMediaUrl(media.mediaUrl)} alt={media.altText || 'Media bài đăng'} />
                        )}
                        <button type="button" onClick={() => removePreviewMedia(media)} title="Xóa ảnh/video này" aria-label="Xóa ảnh/video này">
                          <Icon name="close" size={14} />
                        </button>
                        {index === 3 && previewMediaItems.length > 4 ? <figcaption>+{previewMediaItems.length - 4}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div><Icon name="image" size={28} /><span>Ảnh/video bài đăng</span></div>
                )}
              </div>
            </div>

            {generatedPost?.id && generatedPost?.channels?.length > 0 && (
              <div className="mkt-channel-actions">
                {generatedPost.channels.map((channel) => (
                  <article key={channel.id}>
                    {(() => {
                      const isPublishing = Boolean(publishingChannels[channel.id])
                      const isPublished = channel.status === 'PUBLISHED'
                      const disablePublish = !channel.socialAccountId || isPublishing || isPublished
                      return (
                        <>
                    <div><Channel value={channel.platform} /><small>{channel.pageName || channel.pageUrl || 'Chưa gán page'}</small></div>
                    <StatusBadge value={channel.status} />
                    {channel.errorMessage && <p>{channel.errorMessage}</p>}
                    <div>
                      <button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => schedule(channel.id)}><Icon name="calendar" />Lên lịch</button>
                      <button className="mkt-btn mkt-btn--primary" type="button" onClick={() => publish(channel.id)} disabled={disablePublish} title={!channel.socialAccountId ? 'Cần chọn page/tài khoản social đã kết nối trước khi đăng thật.' : isPublished ? 'Bài này đã đăng thành công.' : undefined}>{isPublishing ? <span className="mkt-spinner" /> : <Icon name="send" />}{isPublishing ? 'Đang đăng...' : isPublished ? 'Đã đăng' : 'Đăng ngay'}</button>
                    </div>
                        </>
                      )
                    })()}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>

        <section className="mkt-card mkt-suggestions">
          <div className="mkt-suggestions-title"><span><Icon name="sparkles" /></span><div><h2>Gợi ý nội dung hôm nay</h2><p>Dựa trên lịch đặt phòng, ưu đãi và tương tác gần đây.</p></div></div>
          <div className="mkt-suggestion-list">
            {(dashboard?.suggestions || []).slice(0, 3).map((item) => (
              <button type="button" key={`${item.id}-${item.title}`} onClick={() => setForm({ ...form, title: item.title, brief: item.description || form.brief })}>
                <span>{item.suggestionType}</span><strong>{item.title}</strong><small>{item.description}</small><Icon name="arrow" />
              </button>
            ))}
          </div>
        </section>

        {scheduleModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={closeScheduleModal}>
            <section className="mkt-modal mkt-schedule-modal" role="dialog" aria-modal="true" aria-label="Lên lịch đăng bài" onMouseDown={(event) => event.stopPropagation()}>
              <div className="mkt-modal-head">
                <div>
                  <span>LÊN LỊCH ĐĂNG</span>
                  <h2>Chọn ngày và giờ đăng</h2>
                  <p>{scheduleModal.channel?.pageName || scheduleModal.channel?.pageUrl || 'Kênh đăng bài'}</p>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={closeScheduleModal}><Icon name="close" /></button>
              </div>

              <div className="mkt-schedule-form">
                <label className="mkt-field">Ngày đăng
                  <input type="date" value={scheduleModal.date} min={toDateInputValue(new Date())} onChange={(event) => setScheduleModal((current) => ({ ...current, date: event.target.value }))} />
                </label>
                <label className="mkt-field">Giờ đăng
                  <input type="time" value={scheduleModal.time} onChange={(event) => setScheduleModal((current) => ({ ...current, time: event.target.value }))} />
                </label>
              </div>

              <div className="mkt-schedule-summary">
                <Icon name="calendar" />
                <div>
                  <strong>{formatScheduleTime(`${scheduleModal.date || toDateInputValue()}T${scheduleModal.time || '00:00'}:00`)}</strong>
                  <span>{scheduleModal.channel?.content?.slice(0, 120) || 'Nội dung sẽ được đăng theo lịch đã chọn.'}</span>
                </div>
              </div>

              <div className="mkt-modal-actions">
                <button className="mkt-btn mkt-btn--secondary" type="button" onClick={closeScheduleModal} disabled={scheduleSaving}>Hủy</button>
                <button className="mkt-btn mkt-btn--primary" type="button" onClick={submitSchedule} disabled={scheduleSaving}>{scheduleSaving ? <span className="mkt-spinner" /> : <Icon name="calendar" />}{scheduleSaving ? 'Đang lưu...' : 'Lưu lịch đăng'}</button>
              </div>
            </section>
          </div>
        )}

        {reloadModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => !reloadingContent && setReloadModal({ open: false, instruction: '' })}>
            <section className="mkt-modal mkt-reload-modal" role="dialog" aria-modal="true" aria-label="Tạo lại nội dung đề xuất" onMouseDown={(event) => event.stopPropagation()}>
              <div className="mkt-modal-head">
                <div>
                  <span>TẠO LẠI NỘI DUNG</span>
                  <h2>Bạn muốn đoạn văn mới như thế nào?</h2>
                  <p>AI sẽ dựa trên bài hiện tại và yêu cầu của bạn để viết một phiên bản mới.</p>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={() => setReloadModal({ open: false, instruction: '' })} disabled={reloadingContent}><Icon name="close" /></button>
              </div>
              <div className="mkt-modal-body">
                <label className="mkt-field">Yêu cầu cho AI
                  <textarea
                    rows="6"
                    value={reloadModal.instruction}
                    onChange={(event) => setReloadModal((current) => ({ ...current, instruction: event.target.value }))}
                    placeholder="Ví dụ: viết ngắn gọn hơn, mở đầu khác đi, nhấn mạnh ưu đãi cuối tuần, giọng hài hước hơn..."
                  />
                </label>
              </div>
              <div className="mkt-modal-actions">
                <button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setReloadModal({ open: false, instruction: '' })} disabled={reloadingContent}>Hủy</button>
                <button className="mkt-btn mkt-btn--primary" type="button" onClick={submitReloadContent} disabled={reloadingContent}>{reloadingContent ? <span className="mkt-spinner" /> : <Icon name="sparkles" />}{reloadingContent ? 'AI đang tạo...' : 'Tạo đoạn văn mới'}</button>
              </div>
            </section>
          </div>
        )}

        {calendarOpen && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => setCalendarOpen(false)}>
            <section className="mkt-modal mkt-calendar-modal" role="dialog" aria-modal="true" aria-label="Lịch nội dung" onMouseDown={(event) => event.stopPropagation()}>
              <div className="mkt-modal-head">
                <div>
                  <span>LỊCH NỘI DUNG</span>
                  <h2>Các bài đã set lịch</h2>
                  <p>{scheduledItems.length ? `${scheduledItems.length} nội dung đang chờ đăng` : 'Chưa có nội dung nào được lên lịch.'}</p>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={() => setCalendarOpen(false)}><Icon name="close" /></button>
              </div>

              {scheduledItems.length ? (
                <div className="mkt-calendar-list">
                  {scheduledItems.map((channel) => (
                    <article className="mkt-calendar-item" key={`${channel.post.id}-${channel.id}`} onClick={() => loadPostIntoEditor(channel.post, channel.id)} role="button" tabIndex={0} onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        loadPostIntoEditor(channel.post, channel.id)
                      }
                    }}>
                      <time>
                        <strong>{new Date(channel.scheduledAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</strong>
                        <span>{new Date(channel.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </time>
                      <div>
                        <div className="mkt-calendar-title">
                          <Channel value={channel.platform} />
                          <strong>{channel.post.title}</strong>
                        </div>
                        <p>{channel.content?.slice(0, 170) || channel.post.brief}</p>
                        <small>{channel.pageName || channel.pageUrl || 'Chưa gán page'} · {formatScheduleTime(channel.scheduledAt)} · Nhấn để chỉnh sửa</small>
                      </div>
                      <StatusBadge value={channel.status} />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mkt-empty-calendar">
                  <Icon name="calendar" size={32} />
                  <strong>Chưa có lịch đăng nào</strong>
                  <span>Hãy tạo nội dung, chọn page rồi bấm “Lên lịch”.</span>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function OptionEditor({ title, type, options, value, onChange, onAdd, onDelete }) {
  return (
    <div className="mkt-option-box">
      <div><strong>{title}</strong><button type="button" onClick={() => onAdd(type)}><Icon name="plus" size={14} /></button></div>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Thêm ${title.toLowerCase()}`} />
      <div className="mkt-option-chips">
        {options.map((option) => (
          <span key={option.id}>{option.label}<button type="button" onClick={() => onDelete(option.id)}><Icon name="close" size={12} /></button></span>
        ))}
      </div>
    </div>
  )
}

export function MarketingPostLogsPage() {
  const pageSize = 10
  const [dashboard, setDashboard] = useState(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedChannel, setSelectedChannel] = useState(null)

  useEffect(() => {
    request('/dashboard').then(setDashboard).catch(() => setDashboard({ recentPosts: [] }))
  }, [])

  const posts = dashboard?.recentPosts || []
  const channels = posts.flatMap((post) => post.channels.map((channel) => ({ ...channel, post })))
  const filtered = channels.filter((channel) => {
    const text = `${channel.post.title} ${channel.platform} ${channel.pageName || ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (status === 'ALL' || channel.status === status)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const paginated = filtered.slice(pageStart, pageStart + pageSize)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
  const selectedMedia = selectedChannel?.post?.media || []
  const selectedIsDraft = selectedChannel?.status === 'DRAFT' || selectedChannel?.post?.status === 'DRAFT'

  const continueEditingDraft = () => {
    if (!selectedChannel?.post) return
    sessionStorage.setItem(MARKETING_EDIT_DRAFT_KEY, JSON.stringify({
      postId: selectedChannel.post.id,
      channelId: selectedChannel.id,
    }))
    setSelectedChannel(null)
    navigate(`/admin/marketing/ai-agent?editPostId=${encodeURIComponent(selectedChannel.post.id)}&channelId=${encodeURIComponent(selectedChannel.id)}`)
  }

  return (
    <AdminLayout activePage="post-logs">
      <div className="mkt-page">
        <PageHeader eyebrow="Theo dõi chiến dịch" title="Nhật ký bài đăng" description="Theo dõi trạng thái xuất bản và hiệu quả nội dung trên mọi kênh." />
        <section className="mkt-metrics">
          <MetricCard icon="send" label="Đã đăng" value={dashboard?.publishedChannels || 0} detail="Tổng kênh/page đã publish" tone="blue" />
          <MetricCard icon="calendar" label="Đã lên lịch" value={dashboard?.scheduledChannels || 0} detail="Đang chờ đăng" tone="violet" />
          <MetricCard icon="eye" label="Tổng tiếp cận" value={dashboard?.totalReach || 0} detail="Từ social metrics" tone="green" />
          <MetricCard icon="trend" label="Tương tác TB" value={`${dashboard?.averageEngagementRate || 0}%`} detail="Snapshot mới nhất" tone="orange" />
        </section>
        <section className="mkt-card mkt-table-card">
          <div className="mkt-toolbar">
            <div className="mkt-search"><Icon name="search" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Tìm theo nội dung, page..." /></div>
            <div className="mkt-filter-tabs">
              {['ALL', 'PUBLISHED', 'SCHEDULED', 'DRAFT', 'FAILED'].map((item) => (
                <button
                  className={status === item ? 'is-active' : ''}
                  type="button"
                  key={item}
                  onClick={() => {
                    setStatus(item)
                    setPage(1)
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead><tr><th>Nội dung</th><th>Kênh</th><th>Page</th><th>Thời gian</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {paginated.map((channel) => (
                  <tr
                    key={channel.id}
                    className={selectedChannel?.id === channel.id ? 'is-selected' : ''}
                    onClick={() => setSelectedChannel(channel)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedChannel(channel)
                      }
                    }}
                    title="Nhấn để xem chi tiết bài đăng"
                  >
                    <td><strong>{channel.post.title}</strong><small>{channel.post.goal}</small></td>
                    <td><Channel value={channel.platform} /></td>
                    <td>{channel.pageName || channel.pageUrl || '—'}</td>
                    <td>{channel.postedAt || channel.scheduledAt ? formatScheduleTime(channel.postedAt || channel.scheduledAt) : '—'}</td>
                    <td><StatusBadge value={channel.status} /></td>
                    <td>
                      <button
                        className="mkt-row-more"
                        type="button"
                        title="Xem chi tiết"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedChannel(channel)
                        }}
                      >
                        <Icon name="arrow" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <div className="mkt-empty-table"><Icon name="search" size={26} /><strong>Chưa có bài đăng</strong><span>Hãy tạo bài từ AI Agent để nhật ký có dữ liệu.</span></div>}
          {filtered.length > 0 && (
            <div className="mkt-table-footer">
              <span>
                Hiển thị {pageStart + 1}-{Math.min(pageStart + pageSize, filtered.length)} / {filtered.length} dòng
              </span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>‹</button>
                {pageNumbers.map((item) => (
                  <button className={currentPage === item ? 'is-active' : ''} type="button" key={item} onClick={() => setPage(item)}>{item}</button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>›</button>
              </div>
            </div>
          )}
        </section>

        {selectedChannel && (
          <div className="mkt-modal-backdrop" onMouseDown={() => setSelectedChannel(null)}>
            <section className="mkt-modal mkt-post-log-modal" role="dialog" aria-modal="true" aria-labelledby="post-log-detail-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span className="mkt-modal-eyebrow">Chi tiết bài đăng</span>
                  <h2 id="post-log-detail-title">{selectedChannel.post.title}</h2>
                  <p>{selectedChannel.pageName || selectedChannel.pageUrl || 'Chưa gán page'} · {CHANNELS[selectedChannel.platform]?.label || selectedChannel.platform}</p>
                </div>
                <button type="button" onClick={() => setSelectedChannel(null)} aria-label="Đóng"><Icon name="close" /></button>
              </header>

              <div className="mkt-modal-body">
                <div className="mkt-post-log-summary">
                  <div><small>Trạng thái</small><StatusBadge value={selectedChannel.status} /></div>
                  <div><small>Thời gian đăng/lên lịch</small><strong>{selectedChannel.postedAt || selectedChannel.scheduledAt ? formatScheduleTime(selectedChannel.postedAt || selectedChannel.scheduledAt) : 'Chưa có'}</strong></div>
                  <div><small>Mục tiêu</small><strong>{selectedChannel.post.goal || '—'}</strong></div>
                  <div><small>Giọng điệu</small><strong>{selectedChannel.post.tone || '—'}</strong></div>
                  <div><small>Đối tượng</small><strong>{selectedChannel.post.targetAudience || '—'}</strong></div>
                </div>

                <section className="mkt-post-log-section">
                  <h3>Nội dung đã tạo/đăng</h3>
                  <div className="mkt-post-log-content">
                    {selectedChannel.content || 'Chưa có nội dung.'}
                    {selectedChannel.hashtags ? <p className="mkt-post-log-hashtags">{selectedChannel.hashtags}</p> : null}
                  </div>
                </section>

                <section className="mkt-post-log-section">
                  <h3>Brief ban đầu</h3>
                  <p className="mkt-post-log-brief">{selectedChannel.post.brief || '—'}</p>
                </section>

                <section className="mkt-post-log-section">
                  <h3>Media đính kèm</h3>
                  {selectedMedia.length ? (
                    <div className="mkt-post-log-media-grid">
                      {selectedMedia.map((media) => (
                        <div className="mkt-post-log-media" key={media.id || media.mediaUrl}>
                          {String(media.mediaType || '').toUpperCase() === 'VIDEO' ? (
                            <video src={resolveMediaUrl(media.mediaUrl)} controls />
                          ) : (
                            <img src={resolveMediaUrl(media.mediaUrl)} alt={media.altText || 'Media bài đăng'} />
                          )}
                          <span>{media.source || media.mediaType || 'MEDIA'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mkt-post-log-muted">Bài đăng này chưa gắn ảnh/video.</p>
                  )}
                </section>

                {(selectedChannel.errorMessage || selectedChannel.externalPostId || selectedChannel.externalUrl) && (
                  <section className="mkt-post-log-section">
                    <h3>Kết quả đăng bài</h3>
                    <div className="mkt-post-log-result">
                      {selectedChannel.externalPostId ? <div><small>ID bài đăng ngoài</small><strong>{selectedChannel.externalPostId}</strong></div> : null}
                      {selectedChannel.externalUrl ? <div><small>Link bài đăng</small><a href={selectedChannel.externalUrl} target="_blank" rel="noreferrer">{selectedChannel.externalUrl}</a></div> : null}
                      {selectedChannel.errorMessage ? <div className="is-error"><small>Lỗi</small><strong>{selectedChannel.errorMessage}</strong></div> : null}
                    </div>
                  </section>
                )}
              </div>

              <footer>
                {selectedIsDraft ? (
                  <button className="mkt-btn mkt-btn--primary" type="button" onClick={continueEditingDraft}>
                    <Icon name="wand" />Tiếp tục chỉnh sửa
                  </button>
                ) : null}
                {selectedChannel.externalUrl ? (
                  <a className="mkt-btn mkt-btn--primary" href={selectedChannel.externalUrl} target="_blank" rel="noreferrer"><Icon name="link" />Mở bài đăng</a>
                ) : null}
                <button className="mkt-btn" type="button" onClick={() => setSelectedChannel(null)}>Đóng</button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export function MarketingVouchersPage() {
  const [query, setQuery] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', voucher: null })
  const [form, setForm] = useState(() => voucherFormFromItem())

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return vouchers
    return vouchers.filter((voucher) => `${voucher.code} ${voucher.discountType} ${voucher.status}`.toLowerCase().includes(value))
  }, [query, vouchers])

  const refreshVouchers = async () => {
    const data = await request('/vouchers')
    setVouchers(data || [])
    return data || []
  }

  useEffect(() => {
    let active = true
    request('/vouchers')
      .then((data) => {
        if (active) setVouchers(data || [])
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const openCreateModal = () => {
    setForm(voucherFormFromItem())
    setModal({ open: true, mode: 'create', voucher: null })
    setError('')
  }

  const openVoucherDetail = async (voucher) => {
    setError('')
    try {
      const detail = await request(`/vouchers/${voucher.id}`)
      setForm(voucherFormFromItem(detail))
      setModal({ open: true, mode: 'edit', voucher: detail })
    } catch (err) {
      setError(err.message)
    }
  }

  const closeVoucherModal = () => {
    if (saving) return
    setModal({ open: false, mode: 'create', voucher: null })
    setForm(voucherFormFromItem())
  }

  const updateVoucherField = (field, value) => {
    setForm((current) => ({ ...current, [field]: field === 'code' ? value.toUpperCase() : value }))
  }

  const saveVoucher = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = voucherPayload(form)
      const isEdit = modal.mode === 'edit' && modal.voucher?.id
      await request(isEdit ? `/vouchers/${modal.voucher.id}` : '/vouchers', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      await refreshVouchers()
      setModal({ open: false, mode: 'create', voucher: null })
      setForm(voucherFormFromItem())
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout activePage="vouchers">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Khuyến mãi"
          title="Mã giảm giá"
          description="Tạo và quản lý ưu đãi giúp tăng tỷ lệ lấp đầy và giữ chân khách hàng."
          action={<button className="mkt-btn mkt-btn--primary" type="button" onClick={openCreateModal}><Icon name="plus" />Tạo voucher</button>}
        />

        <section className="mkt-card mkt-voucher-panel">
          <div className="mkt-toolbar">
            <div className="mkt-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã voucher..." /></div>
            {error ? <span className="mkt-inline-error">{error}</span> : null}
          </div>

          {loading ? (
            <div className="mkt-empty-table"><span className="mkt-spinner" /><strong>Đang tải voucher...</strong></div>
          ) : (
            <div className="mkt-voucher-grid">
              {filtered.map((voucher) => (
                <article
                  className="mkt-voucher"
                  key={voucher.id}
                  role="button"
                  tabIndex={0}
                  title="Xem chi tiết và chỉnh sửa voucher"
                  onClick={() => openVoucherDetail(voucher)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openVoucherDetail(voucher)
                    }
                  }}
                >
                  <span className={`mkt-voucher-accent mkt-voucher-accent--${STATUS[voucher.status]?.[1] || 'neutral'}`} />
                  <div className="mkt-voucher-head"><div><StatusBadge value={voucher.status} /><h2>{voucher.code}</h2></div><Icon name="arrow" /></div>
                  <div className="mkt-voucher-value"><strong>{voucherDiscountLabel(voucher)}</strong><span>Giảm<br />giá</span></div>
                  <button
                    className="mkt-code"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigator.clipboard?.writeText(voucher.code)
                    }}
                  >
                    <span>{voucher.code}</span><Icon name="copy" />
                  </button>
                  <dl>
                    <div><dt>Đơn tối thiểu</dt><dd>{formatMoney(voucher.minOrderValue)}</dd></div>
                    <div><dt>Thời gian</dt><dd>{voucherPeriod(voucher)}</dd></div>
                  </dl>
                  <div className="mkt-usage">
                    <div><span>Đã sử dụng</span><strong>{voucher.usedCount || 0}/{voucher.usageLimit || '∞'}</strong></div>
                    <i><b style={{ width: `${voucher.usageLimit ? Math.min(100, ((voucher.usedCount || 0) / voucher.usageLimit) * 100) : 0}%` }} /></i>
                  </div>
                </article>
              ))}
              {!filtered.length && <div className="mkt-empty-table mkt-voucher-empty"><Icon name="ticket" size={30} /><strong>Chưa có voucher</strong><span>Bấm Tạo voucher để tạo mã giảm giá đầu tiên.</span></div>}
            </div>
          )}
        </section>

        {modal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={closeVoucherModal}>
            <section className="mkt-modal mkt-voucher-modal" role="dialog" aria-modal="true" aria-labelledby="voucher-modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span className="mkt-modal-eyebrow">{modal.mode === 'edit' ? 'Chi tiết voucher' : 'Tạo voucher'}</span>
                  <h2 id="voucher-modal-title">{modal.mode === 'edit' ? form.code || 'Voucher' : 'Voucher mới'}</h2>
                  <p>{modal.mode === 'edit' ? `Đã sử dụng ${modal.voucher?.usedCount || 0} lượt` : 'Nhập thông tin ưu đãi để áp dụng cho booking.'}</p>
                </div>
                <button type="button" onClick={closeVoucherModal} aria-label="Đóng"><Icon name="close" /></button>
              </header>

              <form onSubmit={saveVoucher}>
                <div className="mkt-modal-body">
                  <div className="mkt-voucher-detail-strip">
                    <div><small>Trạng thái</small><StatusBadge value={modal.voucher?.status || 'scheduled'} /></div>
                    <div><small>Giá trị</small><strong>{form.discountValue ? voucherDiscountLabel({ discountType: form.discountType, discountValue: form.discountValue }) : 'Chưa nhập'}</strong></div>
                    <div><small>Thời gian</small><strong>{voucherPeriod({ startDate: fromDateTimeInputValue(form.startDate), endDate: fromDateTimeInputValue(form.endDate) })}</strong></div>
                  </div>

                  {error ? <div className="mkt-form-error">{error}</div> : null}

                  <div className="mkt-form-row">
                    <label className="mkt-field">Mã voucher
                      <input className="is-uppercase" value={form.code} onChange={(event) => updateVoucherField('code', event.target.value)} maxLength={20} placeholder="VD: SUMMER20" required />
                    </label>
                    <label className="mkt-field">Loại giảm giá
                      <select value={form.discountType} onChange={(event) => updateVoucherField('discountType', event.target.value)}>
                        <option value="PERCENT">Theo phần trăm</option>
                        <option value="AMOUNT">Số tiền cố định</option>
                      </select>
                    </label>
                  </div>

                  <div className="mkt-form-row">
                    <label className="mkt-field">Giá trị giảm
                      <div className="mkt-input-suffix">
                        <input type="number" min="0" step={form.discountType === 'PERCENT' ? '1' : '1000'} value={form.discountValue} onChange={(event) => updateVoucherField('discountValue', event.target.value)} required />
                        <span>{form.discountType === 'PERCENT' ? '%' : 'VND'}</span>
                      </div>
                    </label>
                    <label className="mkt-field">Giảm tối đa
                      <input type="number" min="0" step="1000" value={form.maxDiscountAmount} onChange={(event) => updateVoucherField('maxDiscountAmount', event.target.value)} placeholder={form.discountType === 'PERCENT' ? 'Bắt buộc với %' : 'Không bắt buộc'} />
                    </label>
                  </div>

                  <div className="mkt-form-row">
                    <label className="mkt-field">Đơn tối thiểu
                      <input type="number" min="0" step="1000" value={form.minOrderValue} onChange={(event) => updateVoucherField('minOrderValue', event.target.value)} />
                    </label>
                    <label className="mkt-field">Giới hạn lượt dùng
                      <input type="number" min={modal.voucher?.usedCount || 0} step="1" value={form.usageLimit} onChange={(event) => updateVoucherField('usageLimit', event.target.value)} placeholder="Để trống nếu không giới hạn" />
                    </label>
                  </div>

                  <div className="mkt-form-row">
                    <label className="mkt-field">Bắt đầu
                      <input type="datetime-local" value={form.startDate} onChange={(event) => updateVoucherField('startDate', event.target.value)} />
                    </label>
                    <label className="mkt-field">Kết thúc
                      <input type="datetime-local" value={form.endDate} onChange={(event) => updateVoucherField('endDate', event.target.value)} />
                    </label>
                  </div>
                </div>

                <footer>
                  <button className="mkt-btn mkt-btn--secondary" type="button" onClick={closeVoucherModal} disabled={saving}>Hủy</button>
                  <button className="mkt-btn mkt-btn--primary" type="submit" disabled={saving}>{saving ? <span className="mkt-spinner" /> : <Icon name="check" />}{modal.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo voucher'}</button>
                </footer>
              </form>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
