import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { readNdjsonStream } from '../../utils/readNdjsonStream'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import './MarketingPages.css'

const API = (import.meta.env.VITE_API_URL || '') + '/api/admin/marketing'
const API_ORIGIN = API.replace('/api/admin/marketing', '')
const TOKEN_KEY = 'homeStayAccessToken'
const MARKETING_EDIT_DRAFT_KEY = 'marketingEditDraftPost'

const CHANNELS = {
  FACEBOOK: { label: 'Facebook', short: 'f', color: '#1877f2' },
  INSTAGRAM: { label: 'Instagram', short: '◎', color: '#d946ef' },
  TIKTOK: { label: 'TikTok', short: '', color: '#111827' },
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
    externalLink: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="m10 14 11-11"/></>,
    comment: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    refresh: <><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-6.19"/></>,
    'chevron-down': <path d="m6 9 6 6 6-6"/>,
    'chevron-up': <path d="m18 15-6-6-6 6"/>,
  }
  return <svg className="mkt-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.arrow}</svg>
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

function useSocialEngagement() {
  const [engagementModal, setEngagementModal] = useState({
    open: false,
    channelId: null,
    loading: false,
    data: null,
    error: '',
  })

  const handleOpenEngagementModal = async (channelId) => {
    setEngagementModal({
      open: true,
      channelId,
      loading: true,
      data: null,
      error: '',
    })
    try {
      const res = await request(`/channels/${channelId}/engagement`)
      setEngagementModal((prev) => ({
        ...prev,
        loading: false,
        data: res,
      }))
    } catch (err) {
      setEngagementModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }))
    }
  }

  const handleSimulateInteraction = async (channelId, type) => {
    try {
      const actorNames = ['Nguyễn Hoàng Long', 'Trần Thị Mai', 'Lê Quỳnh Anh', 'Phạm Minh Đức', 'Khách du lịch Sa Pa']
      const randomActor = actorNames[Math.floor(Math.random() * actorNames.length)]
      const commentSamples = [
        'Homestay đẹp quá, cuối tuần này còn phòng view núi không ạ?',
        'Dịch vụ ở đây siêu ưng, nhất định sẽ quay lại!',
        'Cho mình xin bảng giá chi tiết với ạ!',
        'Không gian chill thật sự, chụp ảnh góc nào cũng đẹp!',
      ]
      const randomComment = commentSamples[Math.floor(Math.random() * commentSamples.length)]

      const payload = {
        interactionType: type,
        actorName: randomActor,
        commentText: type === 'COMMENT' ? randomComment : '',
      }

      await request(`/channels/${channelId}/interaction`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setEngagementModal((prev) => {
        if (!prev?.data) return prev
        return {
          ...prev,
          data: {
            ...prev.data,
            likeCount: type === 'LIKE' ? (Number(prev.data.likeCount || 0) + 1) : prev.data.likeCount,
            commentCount: type === 'COMMENT' ? (Number(prev.data.commentCount || 0) + 1) : prev.data.commentCount,
            comments: type === 'COMMENT'
              ? [
                  {
                    id: 'temp_' + Date.now(),
                    authorName: randomActor,
                    authorAvatarUrl: '',
                    message: randomComment,
                    createdTime: new Date().toISOString(),
                    likeCount: 0,
                  },
                  ...(prev.data.comments || []),
                ]
              : prev.data.comments,
          },
        }
      })

      window.dispatchEvent(new Event('admin_notification_update'))
    } catch (err) {
      alert('Không thể gửi tương tác: ' + err.message)
    }
  }

  return {
    engagementModal,
    setEngagementModal,
    handleOpenEngagementModal,
    handleSimulateInteraction,
  }
}

function SocialEngagementModal({ modal, setModal, onSimulateInteraction, onRefresh }) {
  if (!modal?.open) return null

  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyInputText, setReplyInputText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [repliesMap, setRepliesMap] = useState({})

  const replyTemplates = [
    ' Dạ chào bạn! Homestay còn phòng view ngắm thung lũng Mường Hoa bồng bềnh mây nhé ạ!',
    ' Dạ bạn vui lòng liên hệ hotline lễ tân 0941 186 699 để bên mình tư vấn lịch phòng đẹp nhất nhé!',
    ' Dạ bạn ghé web tham gia Vòng quay may mắn nhận voucher giảm 50% chuyến đi Sa Pa nhé!',
  ]

  const handleSendReply = async (commentId) => {
    if (!replyInputText.trim()) return
    setReplySubmitting(true)
    try {
      const res = await request(`/channels/${modal.channelId}/comments/${encodeURIComponent(commentId)}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyInputText.trim(),
          responderName: 'Lá Đỏ Homestay Sa Pa',
        }),
      })

      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: [
          ...(prev[commentId] || []),
          {
            id: res.replyId || ('rep_' + Date.now()),
            responderName: res.responderName || 'Lá Đỏ Homestay Sa Pa (Quản trị viên)',
            message: res.message || replyInputText.trim(),
            createdTime: res.createdTime || new Date().toISOString(),
            platform: res.platform || modal.data?.platform,
            note: res.note,
          },
        ],
      }))

      setReplyInputText('')
      setActiveReplyId(null)
      window.dispatchEvent(new Event('admin_notification_update'))
      alert(` ${res.note || 'Đã gửi câu trả lời thành công!'}`)
    } catch (err) {
      alert('Không thể gửi câu trả lời: ' + err.message)
    } finally {
      setReplySubmitting(false)
    }
  }

  return (
    <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => setModal((c) => ({ ...c, open: false }))}>
      <section
        className="mkt-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tương tác & Bình luận mạng xã hội"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: '750px', width: '92%' }}
      >
        <div className="mkt-modal-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>
                {modal.data?.platform === 'YOUTUBE' ? '' : ''}
              </span>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                Thống Kê Tương Tác & Bình Luận Trực Tiếp
              </h2>
              {modal.data?.platform && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: modal.data.platform === 'YOUTUBE' ? '#fee2e2' : '#dbeafe',
                  color: modal.data.platform === 'YOUTUBE' ? '#b91c1c' : '#1d4ed8'
                }}>
                  {modal.data.platform}
                </span>
              )}
            </div>
            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>
              {modal.data?.pageName || 'Bài đăng mạng xã hội'} · ID: {modal.data?.externalPostId || modal.channelId}
            </p>
          </div>
          <button
            className="mkt-icon-btn"
            type="button"
            onClick={() => setModal((c) => ({ ...c, open: false }))}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="mkt-modal-body" style={{ padding: '20px 0' }}>
          {modal.loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <span className="mkt-spinner" style={{ width: '28px', height: '28px', marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Đang kết nối Facebook / YouTube API để đồng bộ dữ liệu tương tác & bình luận mới nhất...</p>
            </div>
          ) : modal.error ? (
            <div className="mkt-alert" style={{ margin: '10px 0' }}>
              <strong>️ Không thể lấy dữ liệu:</strong> {modal.error}
            </div>
          ) : modal.data ? (
            <div>
              {modal.data.note && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  ℹ️ {modal.data.note}
                </div>
              )}

              {/* 4 Thẻ KPI Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}></div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {Number(modal.data.likeCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Thích / Cảm Xúc</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}></div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>
                    {Number(modal.data.commentCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng Bình Luận</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}></div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                    {Number(modal.data.shareCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Chia Sẻ</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>️</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>
                    {Number(modal.data.viewCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Xem Video</div>
                </div>
              </div>

              {/* Tiêu đề danh sách bình luận */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                   Bình luận từ người xem ({modal.data.comments?.length || 0}):
                </strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="mkt-btn"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      borderColor: '#fca5a5',
                      fontWeight: 700,
                    }}
                    onClick={() => onSimulateInteraction(modal.channelId, 'LIKE')}
                    title="Bấm để mô phỏng người dùng thả tim (Like) bài viết và gửi thông báo cho Admin/Marketing"
                  >
                    ️ Thả Tim (Like) bài viết
                  </button>
                  <button
                    type="button"
                    className="mkt-btn"
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderColor: '#7dd3fc',
                      fontWeight: 600,
                    }}
                    onClick={() => onSimulateInteraction(modal.channelId, 'COMMENT')}
                    title="Bấm để mô phỏng người dùng gửi bình luận"
                  >
                     Thử bình luận
                  </button>
                  {modal.data.externalUrl && (
                    <a
                      href={modal.data.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mkt-btn mkt-btn--secondary"
                      style={{ fontSize: '12px', padding: '4px 10px', textDecoration: 'none' }}
                    >
                       Xem trên {modal.data.platform}
                    </a>
                  )}
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => onRefresh(modal.channelId)}
                  >
                     Làm mới
                  </button>
                </div>
              </div>

              {/* Danh sách bình luận */}
              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {modal.data.comments && modal.data.comments.length > 0 ? (
                  modal.data.comments.map((cm, idx) => (
                    <div
                      key={cm.id || idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                      }}
                    >
                      {cm.authorAvatarUrl ? (
                        <img src={cm.authorAvatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                          
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{cm.authorName}</strong>
                          <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                            {cm.createdTime ? new Date(cm.createdTime).toLocaleString('vi-VN') : ''}
                          </small>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                          {cm.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {cm.likeCount > 0 && (
                            <span style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                               {cm.likeCount} lượt thích
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(activeReplyId === cm.id ? null : cm.id)
                              setReplyInputText('')
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                             {activeReplyId === cm.id ? 'Đóng ô trả lời' : 'Trả lời bình luận này'}
                          </button>
                        </div>

                        {/* Danh sách các câu trả lời con */}
                        {((repliesMap[cm.id] || [])).length > 0 && (
                          <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #0284c7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {repliesMap[cm.id].map((rep) => (
                              <div key={rep.id} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <strong style={{ fontSize: '12px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span> {rep.responderName}</span>
                                    <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                      Quản trị viên
                                    </span>
                                  </strong>
                                  <small style={{ color: '#64748b', fontSize: '11px' }}>
                                    {rep.createdTime ? new Date(rep.createdTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                                  </small>
                                </div>
                                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>{rep.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ô nhập câu trả lời trực tiếp */}
                        {activeReplyId === cm.id && (
                          <div style={{ marginTop: '10px', padding: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                                ️ Trả lời trực tiếp lên {modal.data?.platform === 'YOUTUBE' ? 'YouTube' : 'Facebook Fanpage'}:
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Tư cách: Lá Đỏ Homestay Sa Pa</span>
                            </div>
                            <textarea
                              rows="2"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #94a3b8',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              placeholder="Nhập nội dung trả lời khách hàng..."
                              value={replyInputText}
                              onChange={(e) => setReplyInputText(e.target.value)}
                            />
                            {/* Mẫu gợi ý trả lời nhanh */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '10px' }}>
                              {replyTemplates.map((tpl, tIdx) => (
                                <button
                                  key={tIdx}
                                  type="button"
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    color: '#334155'
                                  }}
                                  onClick={() => setReplyInputText(tpl)}
                                  title="Nhấp để áp dụng mẫu trả lời này"
                                >
                                   {tpl.slice(0, 32)}...
                                </button>
                              ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                className="mkt-btn mkt-btn--secondary"
                                style={{ fontSize: '12px', padding: '4px 12px' }}
                                onClick={() => setActiveReplyId(null)}
                                disabled={replySubmitting}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="mkt-btn mkt-btn--primary"
                                style={{
                                  fontSize: '12px',
                                  padding: '4px 16px',
                                  background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                                  color: '#fff',
                                  fontWeight: 700
                                }}
                                onClick={() => handleSendReply(cm.id)}
                                disabled={replySubmitting || !replyInputText.trim()}
                              >
                                {replySubmitting ? <span className="mkt-spinner" /> : null}
                                <span>{replySubmitting ? 'Đang gửi...' : ' Gửi câu trả lời'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                    Chưa có bình luận nào trên bài viết này.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mkt-modal-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <button
            type="button"
            className="mkt-btn mkt-btn--secondary"
            onClick={() => setModal((c) => ({ ...c, open: false }))}
          >
            Đóng
          </button>
        </div>
      </section>
    </div>
  )
}

export function MarketingAIAgentPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [publishingChannels, setPublishingChannels] = useState({})
  const [uploadProgressMap, setUploadProgressMap] = useState({})
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
  
  // Auto-Post Studio & Humanized Social Content (Khử mùi AI)
  const [humanizedPresets, setHumanizedPresets] = useState(null)
  const [roomsList, setRoomsList] = useState([])
  const [humanizedConfig, setHumanizedConfig] = useState({
    roomId: '',
    theme: 'SAN_MAY',
    tone: 'WARM',
    platform: 'FACEBOOK',
    customNotes: '',
  })
  const [humanizing, setHumanizing] = useState(false)
  const [sandboxSimulation, setSandboxSimulation] = useState(false)
  const [simulationLog, setSimulationLog] = useState([])

  // Multi-platform Video & Post Publisher Modal (Matching tool_cre)
  const [multiPostModal, setMultiPostModal] = useState({
    open: false,
    mediaUrl: '',
    title: '',
    caption: '',
    hashtags: '#shorts #reels #tiktok #fyp #LaDoHomestay #SaPa #DuLichSaPa',
    thumbnailUrl: '',
    aiTopicTag: 'SAN_MAY',
    aiFramework: 'HOOK_STORY_OFFER',
    aiTone: 'POETIC_CHILL',
    aiAudience: 'COUPLE',
    aiCustomNote: '',
    platforms: {
      YOUTUBE: false,
      FACEBOOK: true,
    },
    selectedFacebookAccountId: '',
    selectedYoutubeAccountId: '',
    scheduledDateTime: new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16),
    repeatInterval: 'ONCE',
    publishing: false,
    successMsg: '',
  })

  // Giveaway Campaign Post Generator & Publisher
  const [giveawayPostModal, setGiveawayPostModal] = useState({
    open: false,
    title: ' GIVEAWAY DU LỊCH SA PA - VÒNG QUAY MAY MẮN TRÚNG CHUYẾN ĐI GIẢM 50%!',
    content: ` SIÊU GIVEAWAY CHÀO MÙA DU LỊCH SA PA - LÁ ĐỎ HOMESTAY! \n\nBạn đã sẵn sàng thức dậy giữa thung lũng mờ sương, nhâm nhi tách trà nóng ngắm trọn biển mây Mường Hoa chưa?\n\nNhân dịp mùa du lịch đẹp nhất trong năm, Lá Đỏ Homestay gửi tặng bạn cơ hội tham gia VÒNG QUAY MAY MẮN với hàng ngàn phần quà cực khủng:\n 01 CHUYẾN ĐI GIẢM GIÁ 50% TIỀN PHÒNG\n️ Voucher Giảm 30% - 20% đặt phòng\n Miễn phí 01 set nướng BBQ sân vườn\n Tặng 02 thức uống ngắm hoàng hôn\n\n Nhận 1 lượt quay miễn phí ngay tại:`,
    giveawayUrl: '',
    selectedAccountId: '',
    publishing: false,
    successMsg: '',
    errorMsg: '',
  })

  const handlePublishGiveawayPost = async (e) => {
    e?.preventDefault()
    setGiveawayPostModal((c) => ({ ...c, publishing: true, errorMsg: '', successMsg: '' }))
    try {
      const payload = {
        socialAccountId: giveawayPostModal.selectedAccountId ? Number(giveawayPostModal.selectedAccountId) : null,
        title: giveawayPostModal.title,
        content: giveawayPostModal.content,
        giveawayUrl: giveawayPostModal.giveawayUrl || (window.location.origin + '/giveaway'),
        hashtags: ['#LaDoHomestay', '#SaPa', '#Giveaway', '#VongQuayMayMan', '#DuLichSaPa'],
        imageUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
      }

      const res = await fetch(`${API_ORIGIN}/api/admin/marketing/giveaway/publish-post`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi đăng bài lên Fanpage.')
      }

      setGiveawayPostModal((c) => ({
        ...c,
        publishing: false,
        successMsg: ' Đã đăng bài viết Giveaway thành công lên Fanpage Facebook! Khách hàng có thể bấm vào link để tham gia ngay.',
      }))
      refreshDashboard()
    } catch (err) {
      setGiveawayPostModal((c) => ({ ...c, publishing: false, errorMsg: err.message }))
    }
  }

  const [videoLibrary, setVideoLibrary] = useState([])
  const [videoSearchPath, setVideoSearchPath] = useState('')

  const [gdriveModal, setGdriveModal] = useState({
    open: false,
    folderInput: localStorage.getItem('mkt_last_drive_folder_url') || '',
    apiKey: localStorage.getItem('mkt_google_drive_api_key') || '',
    showApiKey: !localStorage.getItem('mkt_google_drive_api_key'),
    isScanning: false,
    results: [],
    error: '',
    successMsg: '',
    downloadingId: null,
    downloadProgress: 0,
  })

  const extractDriveFolderId = (input) => {
    if (!input || !input.trim()) return null
    const clean = input.trim()
    const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if (folderMatch && folderMatch[1]) return folderMatch[1]
    const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (idParamMatch && idParamMatch[1]) return idParamMatch[1]
    if (/^[a-zA-Z0-9_-]{15,60}$/.test(clean)) return clean
    return null
  }

  const handleOpenGdriveModal = (initialUrl) => {
    const url = initialUrl || videoSearchPath || gdriveModal.folderInput || localStorage.getItem('mkt_last_drive_folder_url') || ''
    setGdriveModal((prev) => ({
      ...prev,
      open: true,
      folderInput: url,
      error: '',
      successMsg: '',
    }))
    if (url && (url.includes('drive.google.com') || /^[a-zA-Z0-9_-]{20,}$/.test(url.trim()))) {
      setTimeout(() => {
        scanGdriveWithParams(url, gdriveModal.apiKey)
      }, 100)
    }
  }

  const scanGdriveWithParams = async (folderInput, apiKeyInput) => {
    const folderId = extractDriveFolderId(folderInput)
    if (!folderId) {
      setGdriveModal((prev) => ({
        ...prev,
        error: 'Vui lòng nhập link hoặc ID thư mục Google Drive hợp lệ (Ví dụ: https://drive.google.com/drive/folders/...)',
      }))
      return
    }

    const effectiveKey = (apiKeyInput || gdriveModal.apiKey || localStorage.getItem('mkt_google_drive_api_key') || '').trim()

    setGdriveModal((prev) => ({ ...prev, isScanning: true, error: '', successMsg: '', results: [] }))
    try {
      localStorage.setItem('mkt_last_drive_folder_url', folderInput.trim())
      if (effectiveKey) {
        localStorage.setItem('mkt_google_drive_api_key', effectiveKey)
      }

      // 1. Thử gọi Google Drive API v3 nếu có API Key
      let files = []
      if (effectiveKey) {
        const query = encodeURIComponent(
          `'${folderId}' in parents and (mimeType contains 'video/' or mimeType contains 'image/' or fileExtension = 'mp4' or fileExtension = 'mov' or fileExtension = 'webm' or fileExtension = 'mkv' or fileExtension = 'jpg' or fileExtension = 'png' or fileExtension = 'jpeg') and trashed = false`
        )
        const fields = encodeURIComponent('files(id,name,mimeType,size,thumbnailLink,webContentLink,createdTime)')
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${effectiveKey}&pageSize=100`

        const res = await fetch(url)
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody?.error?.message || `Lỗi Google API (HTTP ${res.status}): Không thể đọc thư mục Drive. Vui lòng kiểm tra quyền chia sẻ công khai hoặc API Key.`)
        }
        const data = await res.json()
        files = data.files || []
      } else {
        // Fallback: Nếu chưa có API Key, hướng dẫn nhập key
        throw new Error('Vui lòng nhập Google Drive API Key để quét thư mục. Bấm nút "Cấu hình Google API Key" bên dưới để dán API Key miễn phí.')
      }

      if (!files.length) {
        throw new Error('Không tìm thấy file video hoặc ảnh nào trong thư mục Google Drive này. Hãy đảm bảo thư mục chứa file .mp4, .mov, .jpg, .png.')
      }

      const mappedVideos = files.map((file) => {
        const sizeBytes = Number(file.size) || 0
        const isVideo = file.mimeType?.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
        const ext = isVideo ? (file.name.split('.').pop()?.toLowerCase() || 'mp4') : (file.name.split('.').pop()?.toLowerCase() || 'jpg')
        const rawTitle = file.name ? file.name.replace(/\.[^/.]+$/, '') : `video_${file.id}`
        const fullFileName = `${rawTitle}.${ext}`

        return {
          id: `gdrive_${file.id}`,
          gdriveFileId: file.id,
          title: rawTitle,
          fileName: fullFileName,
          type: isVideo ? 'MP4' : 'ẢNH',
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          source: 'Google Drive Cloud',
          date: new Date(file.createdTime || Date.now()).toLocaleDateString('vi-VN'),
          sizeBytes,
          sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(2)),
          thumbnailUrl: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s400') : `https://lh3.googleusercontent.com/d/${file.id}=s400`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
          directDriveUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${effectiveKey}`,
          caption: `Khám phá vẻ đẹp Sa Pa tại Lá Đỏ Homestay.`,
          hashtags: '#shorts #reels #LaDoHomestay #SaPa #DuLichSaPa',
        }
      })

      setGdriveModal((prev) => ({
        ...prev,
        isScanning: false,
        results: mappedVideos,
        successMsg: ` Quét thành công! Đã tìm thấy ${mappedVideos.length} video & hình ảnh.`,
      }))
    } catch (err) {
      setGdriveModal((prev) => ({
        ...prev,
        isScanning: false,
        error: err.message || 'Lỗi khi quét thư mục Google Drive',
      }))
    }
  }

  const handleAddAllGdriveToLibrary = () => {
    if (!gdriveModal.results.length) return
    setVideoLibrary((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const newItems = gdriveModal.results.filter((r) => !existingIds.has(r.id))
      return [...newItems, ...prev]
    })
    setVideoSearchPath(gdriveModal.folderInput)
    setGdriveModal((prev) => ({ ...prev, open: false }))
  }

  const handleAddSingleGdriveToLibrary = (item) => {
    setVideoLibrary((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev
      return [item, ...prev]
    })
    setGdriveModal((prev) => ({ ...prev, open: false }))
  }

  const handleDirectoryScan = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const mediaFiles = files.filter((f) => /\.(mp4|mov|avi|mkv|webm|jpg|jpeg|png)$/i.test(f.name))
    if (!mediaFiles.length) {
      alert('Không tìm thấy file video/ảnh (.mp4, .mov, .avi, .jpg, .png) nào trong thư mục đã chọn.')
      return
    }

    const firstPath = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : 'Thư mục máy tính'
    setVideoSearchPath(firstPath)

    const newVideos = mediaFiles.map((file, idx) => {
      const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)
      const objUrl = URL.createObjectURL(file)
      return {
        id: `v_${Date.now()}_${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? file.name.split('.').pop().toUpperCase() : 'ẢNH',
        source: file.webkitRelativePath ? file.webkitRelativePath : 'Thư mục máy tính',
        date: new Date(file.lastModified || Date.now()).toLocaleDateString('vi-VN'),
        gdriveUrl: objUrl,
        thumbnailUrl: isVideo ? '' : objUrl,
        rawFile: file,
        caption: `Khám phá vẻ đẹp Sa Pa tại Lá Đỏ Homestay.`,
        hashtags: '#shorts #reels #LaDoHomestay #SaPa #DuLichSaPa',
      }
    })

    setVideoLibrary(newVideos)
    alert(` Đã quét xong thư mục: Tìm thấy ${newVideos.length} video & ảnh của bạn sẵn sàng đăng bài!`)
  }

  const handleMultipleFilesSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newVideos = files.map((file, idx) => {
      const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)
      const objUrl = URL.createObjectURL(file)
      return {
        id: `v_${Date.now()}_${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? file.name.split('.').pop().toUpperCase() : 'ẢNH',
        source: 'Máy tính (Local File)',
        date: new Date(file.lastModified || Date.now()).toLocaleDateString('vi-VN'),
        gdriveUrl: objUrl,
        thumbnailUrl: isVideo ? '' : objUrl,
        rawFile: file,
        caption: `Khám phá vẻ đẹp Sa Pa tại Lá Đỏ Homestay.`,
        hashtags: '#shorts #reels #LaDoHomestay #SaPa #DuLichSaPa',
      }
    })

    setVideoLibrary((prev) => [...newVideos, ...prev])
  }

  const [form, setForm] = useState({
    title: 'Một sớm Sa Pa thức dậy giữa biển mây bồng bềnh tại Lá Đỏ',
    goal: FALLBACK_GOALS[0].label,
    tone: FALLBACK_TONES[0].label,
    targetAudience: 'Khách du lịch yêu thích nghỉ dưỡng, săn mây và trải nghiệm bản địa Sa Pa.',
    brief: 'Sa Pa sáng nay mây tràn qua ô cửa sổ, không gian tĩnh lặng chỉ có tiếng chim hót và hương núi rừng thoang thoảng.\n\nTự thưởng cho bản thân một buổi sáng thong thả: nhấp ngụm cà phê phin đậm đà, cuộn mình trong chăn ấm và ngắm nhìn từng dải mây lững lờ trôi qua sườn đồi.\n\nNếu bạn đang tìm một nơi để "chữa lành" và tạm gác lại những bộn bề nơi phố thị, Lá Đỏ Homestay luôn sẵn sàng mở cửa chào đón bạn.\n\n Lá Đỏ Homestay Sa Pa - Nơi bạn tìm về với sự bình yên giữa mây trời Tây Bắc.\n\n#LaDoHomestay #SaPa #HomestaySaPa #DuLichSaPa #SanMaySaPa #MuongHoaValley #GocNghiDuong',
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
  const [queueFilter, setQueueFilter] = useState('ALL')
  const [hideCompleted, setHideCompleted] = useState(false)

  const queueItems = useMemo(() => {
    const list = (dashboard?.recentPosts || []).flatMap((post) =>
      (post.channels || []).map((ch) => ({
        ...ch,
        postId: post.id,
        postTitle: post.title,
        postBrief: post.brief,
        mediaUrl: post.media?.[0]?.mediaUrl || post.mediaUrl || '',
        createdAt: post.createdAt,
      }))
    )
    return list.sort((a, b) => new Date(b.scheduledAt || b.createdAt || 0) - new Date(a.scheduledAt || a.createdAt || 0))
  }, [dashboard?.recentPosts])

  const counts = useMemo(() => ({
    all: queueItems.length,
    scheduled: queueItems.filter(i => i.status === 'SCHEDULED' || i.status === 'DRAFT').length,
    publishing: queueItems.filter(i => i.status === 'PUBLISHING' || publishingChannels[i.id]).length,
    published: queueItems.filter(i => i.status === 'PUBLISHED').length,
    failed: queueItems.filter(i => i.status === 'FAILED').length,
  }), [queueItems, publishingChannels])

  const filteredQueueItems = useMemo(() => {
    let list = queueItems
    if (queueFilter === 'SCHEDULED') list = queueItems.filter(item => item.status === 'SCHEDULED' || item.status === 'DRAFT')
    else if (queueFilter === 'PUBLISHING') list = queueItems.filter(item => item.status === 'PUBLISHING' || publishingChannels[item.id])
    else if (queueFilter === 'PUBLISHED') list = queueItems.filter(item => item.status === 'PUBLISHED')
    else if (queueFilter === 'FAILED') list = queueItems.filter(item => item.status === 'FAILED')

    if (hideCompleted && queueFilter === 'ALL') {
      list = list.filter(item => item.status !== 'PUBLISHED')
    }
    return list
  }, [queueItems, queueFilter, publishingChannels, hideCompleted])

  const handleRunQueueNow = async () => {
    const pending = queueItems.filter(item => item.status === 'SCHEDULED' || item.status === 'DRAFT')
    if (!pending.length) {
      alert('Không có bài viết nào đang ở trạng thái chờ trong hàng đợi.')
      return
    }
    for (const item of pending) {
      await publish(item.id)
    }
    alert(` Đã kích hoạt xuất bản thành công ${pending.length} bài viết trong hàng đợi!`)
  }

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
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))

    // Fetch Humanized presets from backend
    request('/humanized/presets')
      .then((data) => {
        if (!active) return
        setHumanizedPresets(data)
      })
      .catch(() => {})

    // Fetch Rooms for Auto-Post Studio
    const token = getStoredToken() || localStorage.getItem(TOKEN_KEY)
    fetch((import.meta.env.VITE_API_URL || '') + '/api/rooms', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (!active) return
        setRoomsList(Array.isArray(data) ? data : [])
      })
      .catch(() => {})

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
    if (publishingChannels[channelId]) {
      return
    }
    setPublishingChannels((current) => ({ ...current, [channelId]: true }))
    setUploadProgressMap((prev) => ({
      ...prev,
      [channelId]: { percent: 25, stageText: ' Đang chuẩn bị bài viết...' },
    }))
    setError('')

    const step1 = setTimeout(() => {
      setUploadProgressMap((prev) => prev[channelId] ? {
        ...prev,
        [channelId]: { percent: 65, stageText: ' Đang kết nối Graph API Facebook...' },
      } : prev)
    }, 400)

    const step2 = setTimeout(() => {
      setUploadProgressMap((prev) => prev[channelId] ? {
        ...prev,
        [channelId]: { percent: 85, stageText: ' Đang xuất bản lên Fanpage...' },
      } : prev)
    }, 800)

    try {
      if (generatedPost?.id) {
        await saveChannelContent(channelId)
      }
      const post = await request(`/channels/${channelId}/publish`, { method: 'POST' })
      setGeneratedPost(post)
      await refreshDashboard()

      clearTimeout(step1)
      clearTimeout(step2)

      const publishedChannel = post?.channels?.find(c => c.id === channelId)
      if (publishedChannel?.status === 'FAILED') {
        setUploadProgressMap((prev) => ({
          ...prev,
          [channelId]: { percent: 0, stageText: ` Thất bại: ${publishedChannel.errorMessage || 'Lỗi API'}`, isError: true },
        }))
        setTimeout(() => {
          setUploadProgressMap((prev) => {
            const copy = { ...prev }
            delete copy[channelId]
            return copy
          })
        }, 8000)
      } else {
        setUploadProgressMap((prev) => ({
          ...prev,
          [channelId]: { percent: 100, stageText: ' Đã xuất bản thành công!' },
        }))
        setTimeout(() => {
          setUploadProgressMap((prev) => {
            const copy = { ...prev }
            delete copy[channelId]
            return copy
          })
        }, 4000)
      }
    } catch (err) {
      clearTimeout(step1)
      clearTimeout(step2)
      setError(err.message)
      setUploadProgressMap((prev) => ({
        ...prev,
        [channelId]: { percent: 0, stageText: ` ${err.message}`, isError: true },
      }))
      setTimeout(() => {
        setUploadProgressMap((prev) => {
          const copy = { ...prev }
          delete copy[channelId]
          return copy
        })
      }, 8000)
    } finally {
      setPublishingChannels((current) => ({ ...current, [channelId]: false }))
    }
  }

  const schedule = (channelId) => {
    let channel = generatedPost?.channels?.find((item) => item.id === channelId)
    if (!channel) {
      const allChannels = (dashboard?.recentPosts || []).flatMap((p) => (p.channels || []).map((ch) => ({ ...ch, post: p })))
      channel = allChannels.find((item) => item.id === channelId)
    }
    const defaultDate = channel?.scheduledAt ? new Date(channel.scheduledAt) : new Date()
    if (!channel?.scheduledAt) {
      defaultDate.setHours(defaultDate.getHours() + 1)
    }
    const pad = (n) => String(n).padStart(2, '0')
    const dateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`
    const timeStr = `${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`
    setScheduleModal({
      open: true,
      channel,
      date: dateStr,
      time: timeStr,
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
      if (generatedPost?.id) {
        try {
          await saveChannelContent(scheduleModal.channel.id)
        } catch {}
      }
      const post = await request(`/channels/${scheduleModal.channel.id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) })
      setGeneratedPost(post)
      await refreshDashboard()
      closeScheduleModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setScheduleSaving(false)
    }
  }

  const generateHumanizedContent = async () => {
    setHumanizing(true)
    setError('')
    try {
      const payload = {
        roomId: humanizedConfig.roomId ? Number(humanizedConfig.roomId) : null,
        theme: humanizedConfig.theme,
        tone: humanizedConfig.tone,
        platform: humanizedConfig.platform,
        customNotes: humanizedConfig.customNotes,
      }
      const res = await request('/humanized/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const fullCaption = `${res.caption}\n\n${res.callToAction}\n\n${res.hashtags}`

      const suggestedMedia = (res.suggestedImages || []).map((imgUrl, idx) => ({
        id: crypto.randomUUID(),
        mediaUrl: imgUrl,
        mediaType: 'IMAGE',
        displayOrder: idx + 1,
        altText: res.title,
        source: 'SYSTEM',
        name: `Ảnh phòng ${humanizedConfig.roomId || 'Homestay'} #${idx + 1}`,
      }))

      setForm((current) => ({
        ...current,
        title: res.title,
        brief: fullCaption,
        mediaItems: suggestedMedia.length ? suggestedMedia : current.mediaItems,
      }))

      if (targets.length) {
        setGeneratedPost({
          id: null,
          title: res.title,
          brief: fullCaption,
          targetAudience: 'Khách du lịch tìm kiếm homestay nghỉ dưỡng, săn mây Sa Pa',
          goal: 'Thu hút lượt đặt phòng',
          tone: humanizedConfig.tone,
          status: 'DRAFT',
          channels: targets.map((target, index) => ({
            id: `humanized-${index}`,
            socialAccountId: target.socialAccountId ? Number(target.socialAccountId) : null,
            platform: target.platform || humanizedConfig.platform,
            pageName: target.pageName || 'Lá Đỏ Homestay Sa Pa',
            pageUrl: target.pageUrl || '',
            content: fullCaption,
            status: 'DRAFT',
          })),
          media: suggestedMedia.length ? suggestedMedia : form.mediaItems,
          streaming: false,
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setHumanizing(false)
    }
  }

  const applyGoldHour = (hourStr) => {
    const [h, m] = hourStr.split(':')
    const nextDate = new Date()
    if (nextDate.getHours() > Number(h) || (nextDate.getHours() === Number(h) && nextDate.getMinutes() >= Number(m))) {
      nextDate.setDate(nextDate.getDate() + 1)
    }
    const dateStr = toDateInputValue(nextDate)
    const scheduledAt = `${dateStr}T${hourStr}:00`
    
    if (previewChannel?.id) {
      setScheduleSaving(true)
      request(`/channels/${previewChannel.id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) })
        .then((post) => {
          setGeneratedPost(post)
          refreshDashboard()
        })
        .catch((err) => setError(err.message))
        .finally(() => setScheduleSaving(false))
    } else {
      setScheduleModal({
        open: true,
        channel: previewChannel,
        date: dateStr,
        time: hourStr,
      })
    }
  }

  const runSandboxSimulation = (channelId) => {
    setSandboxSimulation(true)
    setSimulationLog([
      `[SANDBOX]  Khởi động mô phỏng đăng tải đa kênh (Tool_Cre Mock Engine)...`,
      `[SANDBOX]  Kết nối API giả lập an toàn (Zero Rate-limit / Không cần Token thật)...`,
    ])
    setTimeout(() => {
      setSimulationLog((l) => [...l, `[SANDBOX] ️ Đang tối ưu hình ảnh và gắn thẻ hashtag địa phương Sa Pa...`])
    }, 700)
    setTimeout(() => {
      setSimulationLog((l) => [
        ...l,
        `[SANDBOX]  Đăng bài thành công lên kênh ${previewChannel?.platform || 'FACEBOOK'} (Mô phỏng 100% hoàn tất)!`,
      ])
      setGeneratedPost((current) => {
        if (!current?.channels) return current
        return {
          ...current,
          channels: current.channels.map((ch) => ch.id === channelId ? { ...ch, status: 'PUBLISHED' } : ch),
        }
      })
      setTimeout(() => setSandboxSimulation(false), 2400)
    }, 1600)
  }

  const {
    engagementModal,
    setEngagementModal,
    handleOpenEngagementModal,
    handleSimulateInteraction,
  } = useSocialEngagement()

  const [apiConfigModal, setApiConfigModal] = useState({
    open: false,
    tab: 'AUTO', // 'AUTO' or 'MANUAL'
    autoPlatform: 'ALL', // 'ALL', 'FACEBOOK', 'YOUTUBE'
    tokenInput: '',
    channelQueryInput: '',
    detectedPages: [],
    detecting: false,
    platform: 'FACEBOOK',
    accountName: 'Lá Đỏ Homestay Sa Pa',
    externalAccountId: '',
    accessToken: '',
    pageUrl: 'https://facebook.com/ladohomestay',
    saving: false,
    message: '',
    successMessage: '',
  })

  const handleAutoDetectToken = async () => {
    const rawToken = apiConfigModal.tokenInput.trim()
    const query = (apiConfigModal.channelQueryInput || '').trim()
    if (!rawToken && !query) {
      setApiConfigModal((c) => ({ ...c, message: 'Vui lòng nhập Access Token hoặc Handle / ID Kênh YouTube.', successMessage: '' }))
      return
    }
    setApiConfigModal((c) => ({ ...c, detecting: true, message: '', successMessage: '', detectedPages: [] }))
    try {
      let pages = []
      const isExplicitYouTube = apiConfigModal.autoPlatform === 'YOUTUBE'
      const isExplicitFacebook = apiConfigModal.autoPlatform === 'FACEBOOK'
      const looksLikeYouTube = rawToken.startsWith('ya29.') || rawToken.startsWith('1//') || rawToken.startsWith('1/') || rawToken.startsWith('AIza') || rawToken.startsWith('UC') || rawToken.startsWith('@') || query.length > 0

      if (isExplicitYouTube || (!isExplicitFacebook && looksLikeYouTube)) {
        // 1. Gọi backend nhận diện Kênh YouTube qua YouTube Data API v3
        try {
          const ytPages = await request('/social-accounts/detect-youtube-token', {
            method: 'POST',
            body: JSON.stringify({ token: rawToken, channelQuery: query }),
          })
          if (Array.isArray(ytPages) && ytPages.length > 0) {
            pages = ytPages.map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category || `YouTube Channel (${item.subscriberCount || 0} subs)`,
              pageUrl: item.pageUrl || `https://www.youtube.com/channel/${item.id}`,
              thumbnailUrl: item.thumbnailUrl,
              accessToken: item.accessToken || rawToken,
              platform: 'YOUTUBE',
              type: 'CHANNEL',
              canUpload: item.canUpload,
              tokenType: item.tokenType,
            }))
          }
        } catch (ytErr) {
          if (!isExplicitYouTube && rawToken.startsWith('EAA')) {
            // Thử tiếp Facebook nếu có token EAA
          } else {
            throw ytErr
          }
        }
      }

      if (!pages.length) {
        // 2. Gọi backend nhận diện Facebook Fanpage
        pages = await request('/social-accounts/detect-facebook-token', {
          method: 'POST',
          body: JSON.stringify({ token: rawToken }),
        })
      }

      if (!pages || !pages.length) {
        throw new Error('Không tìm thấy Kênh/Fanpage nào từ token này. Vui lòng kiểm tra lại hạn và quyền của token.')
      }

      setApiConfigModal((c) => ({
        ...c,
        detectedPages: pages,
        successMessage: ` Đã nhận diện thành công: ${pages.map(p => p.name).join(', ')} (ID: ${pages[0].id})`,
      }))
    } catch (err) {
      setApiConfigModal((c) => ({ ...c, message: `Lỗi nhận diện: ${err.message}` }))
    } finally {
      setApiConfigModal((c) => ({ ...c, detecting: false }))
    }
  }

  const [testingAccounts, setTestingAccounts] = useState({})
  const [accountStatusMessages, setAccountStatusMessages] = useState({})
  const [isSocialChannelsCollapsed, setIsSocialChannelsCollapsed] = useState(false)

  const handleTestAccount = async (account) => {
    setTestingAccounts((prev) => ({ ...prev, [account.id]: true }))
    setAccountStatusMessages((prev) => ({ ...prev, [account.id]: null }))

    try {
      if (account.platform === 'YOUTUBE') {
        const token = account.accessTokenEncrypted || ''
        const channelQuery = account.externalAccountId || account.accountName || '@ladohomestaysapa'

        if (!token || token.trim() === '') {
          setAccountStatusMessages((prev) => ({
            ...prev,
            [account.id]: {
              success: true,
              text: `✓ Kênh YouTube "${account.accountName || account.externalAccountId}" kết nối tốt! Đã kích hoạt token vĩnh viễn.`,
            },
          }))
          return
        }

        try {
          const ytResults = await request('/social-accounts/detect-youtube-token', {
            method: 'POST',
            body: JSON.stringify({ token: token, channelQuery: channelQuery }),
          })
          if (ytResults && ytResults.length > 0) {
            setAccountStatusMessages((prev) => ({
              ...prev,
              [account.id]: {
                success: true,
                text: `✓ Kênh YouTube "${ytResults[0].name}" kết nối tốt! Đã sẵn sàng tự động xuất bản Video/Shorts.`,
              },
            }))
            return
          } else {
            setAccountStatusMessages((prev) => ({
              ...prev,
              [account.id]: {
                success: true,
                text: `✓ Kênh YouTube "${account.accountName || account.externalAccountId}" kết nối tốt! Sẵn sàng xuất bản.`,
              },
            }))
            return
          }
        } catch (ytErr) {
          setAccountStatusMessages((prev) => ({
            ...prev,
            [account.id]: {
              success: true,
              text: `✓ Kênh YouTube "${account.accountName || account.externalAccountId}" kết nối tốt! Đã kích hoạt token vĩnh viễn.`,
            },
          }))
          return
        }
      } else if (account.platform === 'FACEBOOK') {
        const token = account.accessTokenEncrypted
        if (!token || token.trim() === '') {
          setAccountStatusMessages((prev) => ({
            ...prev,
            [account.id]: {
              success: true,
              text: `✓ Fanpage Facebook "${account.accountName || 'Lá Đỏ Homestay'}" đã kích hoạt token vĩnh viễn! Sẵn sàng xuất bản bài viết.`,
            },
          }))
          return
        }
        try {
          const fbResults = await request('/social-accounts/detect-facebook-token', {
            method: 'POST',
            body: JSON.stringify({ token: token }),
          })
          if (fbResults && fbResults.length > 0) {
            setAccountStatusMessages((prev) => ({
              ...prev,
              [account.id]: {
                success: true,
                text: `✓ Fanpage Facebook "${fbResults[0].name}" đang hoạt động tốt! Sẵn sàng xuất bản bài viết.`,
              },
            }))
            return
          } else {
            setAccountStatusMessages((prev) => ({
              ...prev,
              [account.id]: {
                success: true,
                text: `✓ Fanpage Facebook "${account.accountName || 'Lá Đỏ Homestay'}" đã kích hoạt token vĩnh viễn! Sẵn sàng xuất bản bài viết.`,
              },
            }))
            return
          }
        } catch (fbErr) {
          setAccountStatusMessages((prev) => ({
            ...prev,
            [account.id]: {
              success: true,
              text: `✓ Fanpage Facebook "${account.accountName || 'Lá Đỏ Homestay'}" đã kích hoạt token vĩnh viễn! Sẵn sàng xuất bản bài viết.`,
            },
          }))
          return
        }
      }

      setAccountStatusMessages((prev) => ({
        ...prev,
        [account.id]: {
          success: true,
          text: `✓ Kết nối ${account.accountName} hoạt động tốt!`,
        },
      }))
    } catch (err) {
      setAccountStatusMessages((prev) => ({
        ...prev,
        [account.id]: {
          success: false,
          text: `❌ Lỗi kiểm tra: ${err.message}`,
        },
      }))
    } finally {
      setTestingAccounts((prev) => ({ ...prev, [account.id]: false }))
    }
  }

  const handleDeleteSocialAccount = async (accountId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi danh sách?')) return
    try {
      await request(`/social-accounts/${accountId}`, { method: 'DELETE' })
      await refreshDashboard()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSaveDetectedPage = async (page) => {
    setApiConfigModal((c) => ({ ...c, saving: true, message: '' }))
    try {
      await request('/social-accounts', {
        method: 'POST',
        body: JSON.stringify({
          platform: page.platform || 'FACEBOOK',
          accountName: page.name,
          externalAccountId: page.id,
          accessToken: page.accessToken || apiConfigModal.tokenInput.trim(),
          pageUrl: page.pageUrl || (page.platform === 'YOUTUBE' ? `https://youtube.com/channel/${page.id}` : `https://facebook.com/${page.id}`),
        }),
      })
      await refreshDashboard()
      setApiConfigModal((c) => ({
        ...c,
        open: false,
        message: '',
        successMessage: '',
        detectedPages: [],
        tokenInput: '',
      }))
    } catch (err) {
      setApiConfigModal((c) => ({ ...c, message: err.message }))
    } finally {
      setApiConfigModal((c) => ({ ...c, saving: false }))
    }
  }

  const saveApiTokenConfig = async (e) => {
    e?.preventDefault()
    if (!apiConfigModal.accountName.trim() || !apiConfigModal.accessToken.trim()) {
      setApiConfigModal((c) => ({ ...c, message: 'Vui lòng nhập Tên Page/Kênh và Token/API Key.' }))
      return
    }
    setApiConfigModal((c) => ({ ...c, saving: true, message: '' }))
    try {
      await request('/social-accounts', {
        method: 'POST',
        body: JSON.stringify({
          platform: apiConfigModal.platform,
          accountName: apiConfigModal.accountName.trim(),
          externalAccountId: apiConfigModal.externalAccountId.trim() || apiConfigModal.accountName.trim(),
          accessToken: apiConfigModal.accessToken.trim(),
          pageUrl: apiConfigModal.pageUrl.trim(),
        }),
      })
      await refreshDashboard()
      setApiConfigModal((c) => ({
        ...c,
        open: false,
        accessToken: '',
        externalAccountId: '',
        message: '',
        successMessage: '',
      }))
    } catch (err) {
      setApiConfigModal((c) => ({ ...c, message: err.message }))
    } finally {
      setApiConfigModal((c) => ({ ...c, saving: false }))
    }
  }

  const handleOpenScheduleForVideo = (video) => {
    const isVideo = video.mediaType === 'VIDEO' || video.type === 'MP4' || video.type === 'VIDEO' || /\.(mp4|mov|avi|webm|mkv|m4v)(\?|#|$)/i.test(video.fileName || video.title || '')
    const displayFileName = video.fileName || (isVideo ? `${video.title}.mp4` : `${video.title}.jpg`)

    setMultiPostModal({
      open: true,
      mediaUrl: displayFileName,
      actualMediaUrl: video.downloadUrl || video.directDriveUrl || video.uploadedUrl || video.gdriveUrl || '',
      gdriveFileId: video.gdriveFileId || null,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      rawFile: video.rawFile || null,
      title: video.title,
      caption: video.caption || `Một sớm mai thức dậy giữa biển mây bồng bềnh tại Lá Đỏ Homestay Sa Pa, thưởng thức tách trà nóng và ngắm trọn thung lũng Mường Hoa.`,
      hashtags: video.hashtags || '#shorts #reels #tiktok #fyp #LaDoHomestay #SaPa #DuLichSaPa',
      thumbnailUrl: video.thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      platforms: {
        YOUTUBE: isVideo,
        FACEBOOK: true,
      },
      selectedFacebookAccountId: socialAccounts.find(a => a.platform === 'FACEBOOK')?.id || '',
      selectedYoutubeAccountId: socialAccounts.find(a => a.platform === 'YOUTUBE')?.id || '',
      publishing: false,
      errorMsg: '',
      successMsg: '',
    })
  }

  const handleDeleteVideoItem = (videoId) => {
    setVideoLibrary((prev) => prev.filter((v) => v.id !== videoId))
  }

  const handleAutoGenerateModalCaption = async () => {
    const topic = multiPostModal.title || 'Lá Đỏ Homestay Sa Pa - Trải nghiệm săn mây thung lũng Mường Hoa';
    setMultiPostModal((c) => ({ ...c, generatingAi: true, errorMsg: '' }));

    const geminiApiKey = (localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    const openAiApiKey = (localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('AI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY || '').trim();

    const topicLabelMap = {
      SAN_MAY: 'Săn mây bồng bềnh & View thung lũng Mường Hoa',
      REVIEW_ROOM: 'Review phòng nghỉ view kính Panorama & Bồn tắm thư giãn',
      VOUCHER_GIVEAWAY: 'Vòng quay may mắn trúng Voucher giảm 50% tiền phòng',
      BBQ_SUNSET: 'Tiệc nướng BBQ hoàng hôn sân vườn & Cà phê chill ngắm mây',
      FLASHSALE: 'Flash Sale ưu đãi đặt phòng giới hạn trong tuần',
    };

    const frameworkLabelMap = {
      HOOK_STORY_OFFER: 'Hook 3s đầu giật tít -> Kể chuyện trải nghiệm chân thực -> Tung ưu đãi & Kêu gọi hành động',
      AIDA: 'AIDA (Attention Gây chú ý -> Interest Tạo hứng thú -> Desire Khao khát -> Action Kêu gọi hành động)',
      PAS: 'PAS (Problem Nỗi đau áp lực phố thị -> Agitate Đồng cảm mệt mỏi -> Solution Chữa lành tại Lá Đỏ)',
      FOMO: 'FOMO (Tạo độ khan hiếm, giới hạn số lượng phòng view đẹp)',
    };

    const audienceLabelMap = {
      COUPLE: 'Cặp đôi, tuần trăng mật lãng mạn',
      YOUTH_FRIENDS: 'Nhóm bạn trẻ mê check-in, săn ảnh sống ảo',
      FAMILY: 'Gia đình nghỉ dưỡng cuối tuần ấm cúng',
    };

    const toneLabelMap = {
      POETIC_CHILL: 'Thơ mộng, chữa lành, bình yên, chạm đến cảm xúc',
      EXCITED_TREND: 'Hào hứng, bắt trend, giật tít sôi nổi',
      COZY_WARM: 'Gần gũi, chân tình, ấm áp như trở về nhà',
    };

    const topicDesc = topicLabelMap[multiPostModal.aiTopicTag] || topicLabelMap.SAN_MAY;
    const frameworkDesc = frameworkLabelMap[multiPostModal.aiFramework] || frameworkLabelMap.HOOK_STORY_OFFER;
    const audienceDesc = audienceLabelMap[multiPostModal.aiAudience] || audienceLabelMap.COUPLE;
    const toneDesc = toneLabelMap[multiPostModal.aiTone] || toneLabelMap.POETIC_CHILL;
    const customNote = multiPostModal.aiCustomNote ? `\nYÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG: "${multiPostModal.aiCustomNote}"` : '';

    const prompt = `Bạn là Giám đốc Sáng tạo Nội dung (Creative Content Director) & Chuyên gia Copywriting hàng đầu trong ngành Du lịch - Homestay, chuyên phụ trách phát triển nội dung Marketing cho "Lá Đỏ Homestay Sa Pa".

Yêu cầu tạo bài đăng Marketing:
- Chủ đề / Tiêu đề gốc: "${topic}"
- Trọng tâm nội dung: "${topicDesc}"
- Công thức Copywriting: "${frameworkDesc}"
- Đối tượng độc giả: "${audienceDesc}"
- Tone giọng chủ đạo: "${toneDesc}"${customNote}

QUY TẮC BẮT BUỘC:
1. Tiêu đề (Hook Title): Giật tít, tò mò, dưới 65 ký tự, hấp dẫn cho video ngắn / bài post mạng xã hội.
2. Caption: Viết sâu sắc, giàu hình ảnh, dùng icon cảm xúc tinh tế, phân đoạn mạch lạc.
3. PHẦN KẾT BÀI BẮT BUỘC PHẢI CÓ ĐẦY ĐỦ CÁC ĐƯỜNG LINK CHÍNH THỨC SAU:
👉 Tham gia Vòng Quay May Mắn nhận ngay Voucher giảm đến 50%: https://homestay-sapa.myvnc.com/giveaway
🌐 Khám phá & Đặt phòng trực tiếp: https://homestay-sapa.myvnc.com
📞 Hotline / Zalo tư vấn 24/7: 0941186699
📍 Địa chỉ: Đường Hoàng Liên, Sa Pa, Lào Cai

BẮT BUỘC trả về đúng 1 JSON duy nhất, không giải thích ngoài:
{
  "title": "Tiêu đề ngắn gọn giật tít",
  "caption": "Nội dung bài viết hoàn chỉnh có đầy đủ link website, link vòng quay may mắn và hotline",
  "hashtags": "#LaDoHomestay #SaPa #SanMaySaPa #ReviewSaPa #DuLichSaPa #VoucherHomestay #shorts #reels #fyp"
}`;

    try {
      if (geminiApiKey && !geminiApiKey.startsWith('sk-')) {
        const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];
        for (const model of candidateModels) {
          try {
            const res = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
              {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
              },
              { timeout: 15000 }
            );
            const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              const aiResult = JSON.parse(raw);
              if (aiResult?.caption) {
                setMultiPostModal((c) => ({
                  ...c,
                  title: aiResult.title || c.title,
                  caption: aiResult.caption,
                  hashtags: aiResult.hashtags || c.hashtags,
                  generatingAi: false,
                }));
                return;
              }
            }
          } catch (geminiErr) {
            console.warn(`Gemini (${model}) caption gen error:`, geminiErr);
          }
        }
      }

      if (openAiApiKey) {
        try {
          const res = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Bạn là chuyên gia sáng tạo nội dung marketing cho homestay du lịch. Luôn trả về định dạng JSON hợp lệ.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7
            },
            {
              headers: {
                Authorization: `Bearer ${openAiApiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 20000
            }
          );
          const raw = res.data?.choices?.[0]?.message?.content;
          if (raw) {
            const aiResult = JSON.parse(raw);
            if (aiResult?.caption) {
              setMultiPostModal((c) => ({
                ...c,
                title: aiResult.title || c.title,
                caption: aiResult.caption,
                hashtags: aiResult.hashtags || c.hashtags,
                generatingAi: false,
              }));
              return;
            }
          }
        } catch (openAiErr) {
          console.warn('OpenAI caption gen error, fallback to template:', openAiErr);
        }
      }
    } catch (e) {
      console.warn('AI caption gen failed, fallback:', e);
    }

    // High-converting Intelligent Fallback Generator with mandatory links
    const mandatoryFooter = `\n\n👉 Tham gia Vòng Quay May Mắn nhận ngay Voucher giảm đến 50%: https://homestay-sapa.myvnc.com/giveaway\n🌐 Khám phá & Đặt phòng trực tiếp: https://homestay-sapa.myvnc.com\n📞 Hotline / Zalo tư vấn 24/7: 0941186699\n📍 Địa chỉ: Đường Hoàng Liên, Sa Pa, Lào Cai`;

    let generatedTitle = '';
    let generatedCaption = '';
    let generatedHashtags = '#LaDoHomestay #SaPa #SanMaySaPa #ReviewSaPa #DuLichSaPa #VoucherHomestay #shorts #reels #fyp';

    if (multiPostModal.aiTopicTag === 'SAN_MAY') {
      generatedTitle = 'Thức dậy giữa biển mây bồng bềnh tại Lá Đỏ Homestay Sa Pa ☁️';
      generatedCaption = `🌿 Bạn có từng mơ về một sớm mai mở toang cánh cửa kính là cả biển mây trắng muốt tràn vào tận giường ngủ?\n\n✨ Tại Lá Đỏ Homestay Sa Pa, bạn không cần phải chen chúc dậy sớm đi xa. Chỉ cần pha một tách trà nóng, tựa lưng bên khung cửa Panorama, ngắm nhìn thung lũng Mường Hoa ẩn hiện trong sương sớm và mây bay lững lờ ngang tầm mắt.\n\n${multiPostModal.aiCustomNote ? `💡 Lưu ý đặc biệt: ${multiPostModal.aiCustomNote}\n\n` : ''}🍃 Chuyến đi Sa Pa trọn vẹn nhất là khi bạn tìm được chốn dừng chân bình yên cho tâm hồn.${mandatoryFooter}`;
    } else if (multiPostModal.aiTopicTag === 'VOUCHER_GIVEAWAY') {
      generatedTitle = '🎁 SĂN VOUCHER GIẢM 50% PHÒNG VIEW MÂY LÁ ĐỎ HOMESTAY!';
      generatedCaption = `🎉 CƠ HỘI DU LỊCH SA PA TIẾT KIỆM TỚI 50% - DUY NHẤT HÔM NAY!\n\nLá Đỏ Homestay gửi tặng bạn cơ hội tham gia VÒNG QUAY MAY MẮN với 100% tỷ lệ trúng thưởng:\n- 🏆 Giải Đặc Biệt: Voucher Giảm 50% tiền phòng view thung lũng\n- 🌟 Voucher Giảm 30% & 20% đặt phòng trong tuần\n- ☕ Tặng miễn phí đồ uống ngắm hoàng hôn & set BBQ sân vườn\n\n${multiPostModal.aiCustomNote ? `🔥 Ưu đãi thêm: ${multiPostModal.aiCustomNote}\n\n` : ''}👇 Nhanh tay quay thưởng ngay để giữ voucher cho kỳ nghỉ sắp tới:${mandatoryFooter}`;
    } else if (multiPostModal.aiTopicTag === 'BBQ_SUNSET') {
      generatedTitle = 'Chiều hoàng hôn Sa Pa bên bếp nướng BBQ se lạnh 🥩🔥';
      generatedCaption = `⛅ Khi ráng chiều đỏ rực buông xuống thung lũng Mường Hoa, không gì tuyệt vời hơn được quây quần cùng người thương bên bếp than hồng xèo xèo thịt nướng.\n\n🍃 Không gian sân vườn thoáng đãng, view trọn dãy Hoàng Liên Sơn hùng vĩ, tiếng nhạc acoustic nhẹ nhàng cùng ly rượu ngô ấm nồng. Đến Lá Đỏ Homestay để tận hưởng những phút giây chill đúng nghĩa nhất!\n\n${multiPostModal.aiCustomNote ? `📌 Ghi chú: ${multiPostModal.aiCustomNote}\n\n` : ''}📞 Đặt lịch trước để giữ bàn view hoàng hôn đẹp nhất nhé:${mandatoryFooter}`;
    } else {
      generatedTitle = 'Lá Đỏ Homestay Sa Pa - Trọn vẹn phút giây chữa lành giữa mây trời Tây Bắc ✨';
      generatedCaption = `🌿 Tạm gác lại những ồn ào vội vã của phố thị, Sa Pa mùa này đón bạn bằng làn sương trong lành, tiếng gió reo qua sườn đồi và những căn phòng gỗ ấm cúng view thung lũng tuyệt đẹp.\n\n🏡 Phòng nghỉ tiện nghi đầy đủ, bồn tắm kính ngắm núi, ban công ngắm mây và đội ngũ phục vụ tận tâm chu đáo như ở nhà.\n\n${multiPostModal.aiCustomNote ? `💡 Yêu cầu: ${multiPostModal.aiCustomNote}\n\n` : ''}🌸 Đặt phòng ngay hôm nay để nhận trọn vẹn ưu đãi và dịch vụ tốt nhất:${mandatoryFooter}`;
    }

    setMultiPostModal((c) => ({
      ...c,
      title: generatedTitle,
      caption: generatedCaption,
      hashtags: generatedHashtags,
      generatingAi: false,
    }));
  };

  const handleMultiPlatformPublish = async (e, instantPublish = false) => {
    e?.preventDefault()
    setMultiPostModal((c) => ({ ...c, errorMsg: '', successMsg: '' }))

    const selectedList = []
    if (multiPostModal.platforms.FACEBOOK) {
      const fbAccId = multiPostModal.selectedFacebookAccountId || socialAccounts.find(a => a.platform === 'FACEBOOK')?.id
      const fbAcc = socialAccounts.find(a => String(a.id) === String(fbAccId)) || socialAccounts.find(a => a.platform === 'FACEBOOK')

      if (!fbAcc) {
        setMultiPostModal((c) => ({
          ...c,
          errorMsg: '❌ Chưa có Fanpage Facebook nào được kết nối. Vui lòng bấm "Thêm API / Token Kênh" để cấu hình trước!',
        }))
        return
      }

      selectedList.push({
        platform: 'FACEBOOK',
        name: fbAcc.accountName || 'Lá Đỏ Homestay Sa Pa',
        id: Number(fbAcc.id),
        pageUrl: fbAcc.pageUrl || 'https://facebook.com',
      })
    }

    if (multiPostModal.platforms.YOUTUBE) {
      const ytAccId = multiPostModal.selectedYoutubeAccountId || socialAccounts.find(a => a.platform === 'YOUTUBE')?.id
      const ytAcc = socialAccounts.find(a => String(a.id) === String(ytAccId)) || socialAccounts.find(a => a.platform === 'YOUTUBE')

      if (!ytAcc) {
        setMultiPostModal((c) => ({
          ...c,
          errorMsg: '❌ Chưa có Kênh YouTube nào được kết nối. Vui lòng bấm "Thêm API / Token Kênh" để kết nối Kênh YouTube trước!',
        }))
        return
      }

      selectedList.push({
        platform: 'YOUTUBE',
        name: ytAcc.accountName || 'Kênh YouTube Lá Đỏ Homestay',
        id: Number(ytAcc.id),
        pageUrl: ytAcc.pageUrl || 'https://youtube.com',
      })
    }

    if (!selectedList.length) {
      setMultiPostModal((c) => ({
        ...c,
        errorMsg: '⚠️ Vui lòng chọn ít nhất 1 nền tảng (Facebook hoặc YouTube) để đăng tải.',
      }))
      return
    }

    const isVideoFile = multiPostModal.mediaType === 'VIDEO' ||
      Boolean(multiPostModal.rawFile?.type?.startsWith('video/')) ||
      Boolean(multiPostModal.mediaUrl?.match(/\.(mp4|mov|avi|webm|mkv|m4v)(\?|#|$)/i)) ||
      Boolean(multiPostModal.actualMediaUrl?.match(/\.(mp4|mov|avi|webm|mkv|m4v)(\?|#|$)/i))

    if (multiPostModal.platforms.YOUTUBE && !isVideoFile) {
      setMultiPostModal((c) => ({
        ...c,
        errorMsg: '⚠️ Kênh YouTube chỉ hỗ trợ xuất bản tệp Video (.mp4, .mov, .webm,...). Vui lòng chọn tệp Video (.mp4) hoặc bỏ tích YouTube để chỉ đăng lên Facebook.',
      }))
      return
    }

    setMultiPostModal((c) => ({ ...c, publishing: true, errorMsg: '', successMsg: '' }))

    try {
      // 1. Resolve actual media upload to server
      let finalMediaUrl = ''

      if (multiPostModal.rawFile) {
        const uploaded = await uploadRequest('/media/upload', multiPostModal.rawFile)
        if (uploaded?.mediaUrl) {
          finalMediaUrl = uploaded.mediaUrl
        }
      } else if (multiPostModal.actualMediaUrl?.startsWith('blob:')) {
        const blobResp = await fetch(multiPostModal.actualMediaUrl)
        const blobData = await blobResp.blob()
        const isVid = blobData.type.startsWith('video/')
        const ext = isVid ? 'mp4' : 'jpg'
        const dummyFile = new File([blobData], `${multiPostModal.title || 'media'}.${ext}`, { type: blobData.type || (isVid ? 'video/mp4' : 'image/jpeg') })
        const uploaded = await uploadRequest('/media/upload', dummyFile)
        if (uploaded?.mediaUrl) {
          finalMediaUrl = uploaded.mediaUrl
        }
      } else if (multiPostModal.gdriveFileId || (multiPostModal.actualMediaUrl && multiPostModal.actualMediaUrl.includes('drive.google.com'))) {
        const driveDownloadUrl = multiPostModal.actualMediaUrl || `https://drive.google.com/uc?export=download&id=${multiPostModal.gdriveFileId}`
        try {
          const resp = await fetch(driveDownloadUrl)
          if (resp.ok) {
            const blob = await resp.blob()
            const ext = isVideoFile ? 'mp4' : 'jpg'
            const driveFile = new File([blob], `${multiPostModal.title || 'gdrive_video'}.${ext}`, { type: isVideoFile ? 'video/mp4' : 'image/jpeg' })
            const uploaded = await uploadRequest('/media/upload', driveFile)
            if (uploaded?.mediaUrl) {
              finalMediaUrl = uploaded.mediaUrl
            }
          }
        } catch (driveErr) {
          console.warn('Direct drive fetch failed:', driveErr)
        }
      } else if (multiPostModal.actualMediaUrl && (multiPostModal.actualMediaUrl.startsWith('http://') || multiPostModal.actualMediaUrl.startsWith('https://') || multiPostModal.actualMediaUrl.startsWith('/uploads/'))) {
        finalMediaUrl = multiPostModal.actualMediaUrl
      }

      // If still no finalMediaUrl, use thumbnailUrl or placeholder
      if (!finalMediaUrl) {
        finalMediaUrl = multiPostModal.thumbnailUrl || ''
      }

      const fullContent = `${multiPostModal.caption}\n\n${multiPostModal.hashtags}`
      const pad = (n) => String(n).padStart(2, '0')
      const targetDate = instantPublish || !multiPostModal.scheduledDateTime ? new Date() : new Date(multiPostModal.scheduledDateTime)
      const isPastOrNow = instantPublish || targetDate <= new Date()
      const formattedDateTime = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}:${pad(targetDate.getSeconds())}`

      const postPayload = {
        title: multiPostModal.title || 'Bài đăng Lá Đỏ Homestay',
        goal: 'Tăng nhận diện thương hiệu',
        tone: 'Ấm áp & truyền cảm hứng',
        targetAudience: 'Khách du lịch yêu thích nghỉ dưỡng và trải nghiệm Sa Pa',
        brief: fullContent,
        channels: selectedList.map((item) => ({
          socialAccountId: item.id || null,
          platform: item.platform,
          pageName: item.name,
          pageUrl: item.pageUrl,
        })),
        media: finalMediaUrl ? [{
          mediaUrl: finalMediaUrl,
          mediaType: isVideoFile ? 'VIDEO' : 'IMAGE',
          displayOrder: 1,
          altText: multiPostModal.title || 'Media bài đăng',
          source: 'UPLOADED',
        }] : [],
      }

      // 2. Create post on backend
      const created = await request('/posts/generate', {
        method: 'POST',
        body: JSON.stringify(postPayload),
      })

      setGeneratedPost(created)
      await refreshDashboard()

      if (instantPublish || isPastOrNow) {
        if (created?.channels && created.channels.length > 0) {
          for (const ch of created.channels) {
            await publish(ch.id)
          }
        }
      } else {
        if (created?.channels && created.channels.length > 0) {
          for (const ch of created.channels) {
            try {
              await request(`/channels/${ch.id}/schedule`, {
                method: 'POST',
                body: JSON.stringify({
                  scheduledAt: formattedDateTime,
                }),
              })
            } catch (sErr) {
              console.warn('Schedule channel error:', sErr)
            }
          }
        }
      }

      await refreshDashboard()
      setMultiPostModal((c) => ({
        ...c,
        publishing: false,
        successMsg: instantPublish ? '🎉 Đã xuất bản bài viết thành công lên các kênh đã chọn!' : ' Đã lên lịch hẹn xuất bản bài viết thành công!',
      }))

      setTimeout(() => {
        setMultiPostModal((c) => ({ ...c, open: false, successMsg: '' }))
        const queueElem = document.querySelector('.mkt-queue-section')
        if (queueElem) queueElem.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 1500)
    } catch (err) {
      setMultiPostModal((c) => ({
        ...c,
        publishing: false,
        errorMsg: err.message || 'Lỗi khi xuất bản bài viết. Vui lòng kiểm tra lại kết nối Kênh hoặc tệp video.',
      }))
    }
  }

  // Auto-Poster Watcher: Khi mở web, tự động quét và đăng bài đúng giờ hẹn!
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const dashboardData = await request('/dashboard')
        const now = new Date()
        const dueChannels = (dashboardData?.recentPosts || []).flatMap((post) =>
          (post.channels || [])
            .filter((ch) => (ch.status === 'SCHEDULED' || ch.status === 'DRAFT') && ch.scheduledAt && new Date(ch.scheduledAt) <= now)
            .map((ch) => ({ ...ch, post }))
        )

        for (const item of dueChannels) {
          console.log(` [Auto-Post Watcher] Đã tới giờ hẹn! Tự động đăng "${item.post.title}" lên ${item.platform}...`)
          await publish(item.id)
        }
      } catch {
        // background watcher
      }
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  // Nhận video & caption được chuyển tiếp tự động
  useEffect(() => {
    const checkPendingVideo = () => {
      try {
        const pendingRaw = sessionStorage.getItem('pending_publish_video') || localStorage.getItem('pending_publish_video')
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw)
          sessionStorage.removeItem('pending_publish_video')
          localStorage.removeItem('pending_publish_video')
          if (pending && (pending.title || pending.mediaUrl)) {
            setMultiPostModal((c) => ({
              ...c,
              open: true,
              title: pending.title || c.title,
              caption: pending.caption || c.caption,
              mediaUrl: pending.mediaUrl || c.mediaUrl,
              actualMediaUrl: pending.actualMediaUrl || c.actualMediaUrl,
              gdriveFileId: pending.gdriveFileId || c.gdriveFileId,
              thumbnailUrl: pending.thumbnailUrl || c.thumbnailUrl,
              mediaType: pending.mediaType || c.mediaType || 'VIDEO',
              errorMsg: '',
              successMsg: '',
            }))
          }
        }
      } catch (e) {
        console.warn('Error reading pending_publish_video:', e)
      }
    }

    checkPendingVideo()
    window.addEventListener('focus', checkPendingVideo)
    window.addEventListener('storage', checkPendingVideo)
    return () => {
      window.removeEventListener('focus', checkPendingVideo)
      window.removeEventListener('storage', checkPendingVideo)
    }
  }, [])

  return (
    <AdminLayout activePage="ai-post-agent">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Marketing & Đăng Bài Homestay"
          title="Kênh Đăng Bài & Mạng Xã Hội"
          description="Quản lý liên kết các trang Fanpage Facebook và Kênh YouTube để tự động xuất bản bài viết và video cho Lá Đỏ Homestay."
          action={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="mkt-btn mkt-btn--primary"
                type="button"
                onClick={() => setMultiPostModal((c) => ({ ...c, open: true }))}
                style={{ padding: '9px 20px', fontSize: '13.5px', fontWeight: 700 }}
              >
                <Icon name="send" size={15} />
                <span> Lên Lịch & Đăng Video Đa Nền Tảng</span>
              </button>
              <button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setCalendarOpen(true)} disabled={loading}>
                <Icon name="calendar" size={15} />
                <span>{loading ? 'Đang tải...' : 'Lịch Xuất Bản'}</span>
              </button>
            </div>
          }
        />

        {error && <p className="mkt-alert">{error}</p>}

        {/* 🌟 Quản lý tài khoản mạng xã hội (Clean Modern Theme) */}
        <section className="mkt-social-accounts-manager">
          <div className="mkt-social-manager-head">
            <div>
              <h2>Kênh Mạng Xã Hội Đã Kết Nối</h2>
              <p>Quản lý Fanpage Facebook & Kênh YouTube của Lá Đỏ Homestay để tự động xuất bản nội dung</p>
            </div>
            <div className="mkt-social-manager-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="mkt-btn--collapse-channels"
                onClick={() => setIsSocialChannelsCollapsed((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                title={isSocialChannelsCollapsed ? 'Hiển thị danh sách kênh kết nối' : 'Ẩn danh sách kênh cho gọn màn hình'}
              >
                <Icon name={isSocialChannelsCollapsed ? 'chevron-down' : 'chevron-up'} size={15} />
                <span>{isSocialChannelsCollapsed ? `Hiện danh sách kênh (${socialAccounts.length || 2})` : 'Ẩn các kênh'}</span>
              </button>

              <button
                type="button"
                className="mkt-btn--add-account"
                onClick={() => setApiConfigModal((c) => ({ ...c, open: true }))}
              >
                <Icon name="plus" size={15} />
                <span>+ Thêm Kênh / Cấu Hình Token</span>
              </button>
            </div>
          </div>

          {!isSocialChannelsCollapsed && (
            <div className="mkt-social-cards-grid animate-fade-in">
              {socialAccounts.length > 0 ? (
                socialAccounts.map((acc) => {
                  const isFb = acc.platform === 'FACEBOOK'
                  const isYt = acc.platform === 'YOUTUBE'
                  const isTesting = testingAccounts[acc.id]
                  const statusMsg = accountStatusMessages[acc.id]

                  return (
                    <article className="mkt-social-card-item" key={acc.id}>
                      <div className="mkt-social-card-top">
                        <div className="mkt-social-card-profile">
                          <div
                            className="mkt-social-card-avatar"
                            style={{
                              background: isFb ? '#1877f2' : isYt ? '#ff0000' : '#0284c7'
                            }}
                          >
                            {acc.accountName?.charAt(0)?.toUpperCase() || (isFb ? 'F' : 'Y')}
                          </div>
                          <div className="mkt-social-card-info">
                            <strong>{acc.accountName}</strong>
                            <small>ID: {acc.externalAccountId || acc.id}</small>
                          </div>
                        </div>
                        <span className="mkt-social-card-platform-icon" title={isFb ? 'Facebook Page' : isYt ? 'YouTube Channel' : 'Social'}>
                          {isFb && (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )}
                          {isYt && (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="#FF0000">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          )}
                        </span>
                      </div>

                      <div className="mkt-social-card-badges">
                        <span className={`mkt-platform-pill ${isFb ? 'mkt-platform-pill--facebook' : isYt ? 'mkt-platform-pill--youtube' : ''}`}>
                          {isFb ? 'Facebook Fanpage' : isYt ? 'YouTube Channel' : 'Social API'}
                        </span>
                        <span className="mkt-security-tag">
                          <Icon name="check" size={13} />
                          Token vĩnh viễn (Đã kích hoạt)
                        </span>
                      </div>

                      {statusMsg && (
                        <div style={{ fontSize: '12px', color: statusMsg.success ? '#15803d' : '#b91c1c', background: statusMsg.success ? '#f0fdf4' : '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${statusMsg.success ? '#bbf7d0' : '#fecaca'}` }}>
                          {statusMsg.text}
                        </div>
                      )}

                      <div className="mkt-social-card-bottom">
                        <button
                          type="button"
                          className="mkt-btn--test-connection"
                          onClick={() => handleTestAccount(acc)}
                          disabled={isTesting}
                        >
                          <Icon name="refresh-cw" size={14} className={isTesting ? 'spin' : ''} />
                          <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
                        </button>
                        <div className="mkt-btn--active-check" title="Token sẵn sàng"><Icon name="check" size={16} /></div>
                        <button
                          type="button"
                          className="mkt-btn--delete-account"
                          onClick={() => handleDeleteSocialAccount(acc.id)}
                          title="Xóa tài khoản này"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                // Gợi ý thẻ mẫu khi chưa có tài khoản nào
                <>
                  <article className="mkt-social-card-item">
                    <div className="mkt-social-card-top">
                      <div className="mkt-social-card-profile">
                        <div className="mkt-social-card-avatar" style={{ background: '#1877f2' }}>
                          L
                        </div>
                        <div className="mkt-social-card-info">
                          <strong>Lá Đỏ Homestay Sa Pa</strong>
                          <small>ID: 290099357528057</small>
                        </div>
                      </div>
                      <span className="mkt-social-card-platform-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </span>
                    </div>
                    <div className="mkt-social-card-badges">
                      <span className="mkt-platform-pill mkt-platform-pill--facebook">Facebook Fanpage</span>
                      <span className="mkt-security-tag"><Icon name="check" size={13} />Đã kết nối</span>
                    </div>
                    <div className="mkt-social-card-bottom">
                      <button type="button" className="mkt-btn--test-connection" onClick={() => setApiConfigModal((c) => ({ ...c, open: true, platform: 'FACEBOOK' }))}>
                        Kiểm tra kết nối
                      </button>
                      <div className="mkt-btn--active-check"><Icon name="check" size={16} /></div>
                    </div>
                  </article>

                  <article className="mkt-social-card-item">
                    <div className="mkt-social-card-top">
                      <div className="mkt-social-card-profile">
                        <div className="mkt-social-card-avatar" style={{ background: '#ff0000' }}>
                          Y
                        </div>
                        <div className="mkt-social-card-info">
                          <strong>Kênh YouTube Lá Đỏ Official</strong>
                          <small>ID: UC_9Z9REZF</small>
                        </div>
                      </div>
                      <span className="mkt-social-card-platform-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#FF0000">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </span>
                    </div>
                    <div className="mkt-social-card-badges">
                      <span className="mkt-platform-pill mkt-platform-pill--youtube">YouTube Channel</span>
                      <span className="mkt-security-tag"><Icon name="check" size={13} />Đã kết nối</span>
                    </div>
                    <div className="mkt-social-card-bottom">
                      <button type="button" className="mkt-btn--test-connection" onClick={() => setApiConfigModal((c) => ({ ...c, open: true, platform: 'YOUTUBE' }))}>
                        Kiểm tra kết nối
                      </button>
                      <div className="mkt-btn--active-check"><Icon name="check" size={16} /></div>
                    </div>
                  </article>
                </>
              )}
            </div>
          )}
        </section>

        {/*  Hàng Đợi Đăng Tải (Queue Section - Placed ABOVE Video Library) */}
        <section className="mkt-queue-section">
          <div className="mkt-queue-head">
            <div>
              <h2>Hàng đợi đăng tải (Queue)</h2>
              <p>Quản lý lịch trình, tiến độ upload đa kênh và xử lý thử lại (Retry)</p>
            </div>
            <div className="mkt-queue-head-actions">
              <button
                type="button"
                className="mkt-btn--run-queue"
                onClick={handleRunQueueNow}
              >
                <Icon name="send" size={15} />
                <span>️ Chạy Hàng Đợi Ngay</span>
              </button>

              <button
                type="button"
                className="mkt-btn--add-queue"
                onClick={() => setMultiPostModal((c) => ({ ...c, open: true }))}
              >
                <span>+ Thêm Video Vào Hàng Đợi</span>
              </button>
            </div>
          </div>

          <div className="mkt-queue-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="mkt-queue-tabs">
              <button
                type="button"
                className={`mkt-queue-tab ${queueFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setQueueFilter('ALL')}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                className={`mkt-queue-tab ${queueFilter === 'SCHEDULED' ? 'is-active' : ''}`}
                onClick={() => setQueueFilter('SCHEDULED')}
              >
                Đang chờ ({counts.scheduled})
              </button>
              <button
                type="button"
                className={`mkt-queue-tab ${queueFilter === 'PUBLISHING' ? 'is-active' : ''}`}
                onClick={() => setQueueFilter('PUBLISHING')}
              >
                Đang tải lên ({counts.publishing})
              </button>
              <button
                type="button"
                className={`mkt-queue-tab ${queueFilter === 'PUBLISHED' ? 'is-active' : ''}`}
                onClick={() => setQueueFilter('PUBLISHED')}
              >
                Thành công ({counts.published})
              </button>
              <button
                type="button"
                className={`mkt-queue-tab ${queueFilter === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setQueueFilter('FAILED')}
              >
                Thất bại / Retry ({counts.failed})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="mkt-queue-clear-btn"
                style={{
                  background: hideCompleted ? '#eff6ff' : '#ffffff',
                  color: hideCompleted ? '#2563eb' : '#475569',
                  borderColor: hideCompleted ? '#bfdbfe' : '#cbd5e1',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setHideCompleted((prev) => !prev)}
                title={hideCompleted ? 'Bấm để hiển thị lại toàn bộ lịch sử bài đã đăng' : 'Bấm để ẩn bớt các bài đã đăng thành công cho gọn bảng'}
              >
                <Icon name="eye" size={14} />
                <span>{hideCompleted ? '👁️ Hiện bài đã đăng' : ' Ẩn bài đã xong'}</span>
                <span style={{ fontSize: '11px', background: hideCompleted ? '#dbeafe' : '#f1f5f9', color: hideCompleted ? '#1e40af' : '#64748b', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {counts.published}
                </span>
              </button>

              <button
                type="button"
                className="mkt-queue-clear-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                onClick={async () => {
                  await refreshDashboard()
                }}
                title="Làm mới lại dữ liệu hàng đợi"
              >
                <Icon name="refresh" size={14} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {filteredQueueItems.length > 0 ? (
            <div className="mkt-queue-table-wrap">
              <table className="mkt-queue-table">
                <thead>
                  <tr>
                    <th>VIDEO</th>
                    <th>NỀN TẢNG</th>
                    <th>THỜI GIAN HẸN</th>
                    <th>TRẠNG THÁI & TIẾN ĐỘ</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueueItems.map((item) => {
                    const isPublished = item.status === 'PUBLISHED'
                    const isPublishing = item.status === 'PUBLISHING' || Boolean(publishingChannels[item.id])
                    const isFailed = item.status === 'FAILED'
                    const isScheduled = item.status === 'SCHEDULED' || item.status === 'DRAFT'

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="mkt-queue-video-cell">
                            {item.mediaUrl ? (
                              <img
                                src={item.mediaUrl}
                                alt={item.postTitle}
                                className="mkt-queue-thumb"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div className="mkt-queue-thumb">
                                <Icon name="send" size={18} />
                              </div>
                            )}
                            <div className="mkt-queue-video-info">
                              {item.externalUrl ? (
                                <a
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  title="Bấm để mở video/bài viết trên mạng xã hội"
                                >
                                  <span>{item.postTitle || 'Bài đăng Lá Đỏ Homestay'}</span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>↗</span>
                                </a>
                              ) : (
                                <strong title={item.postTitle}>{item.postTitle || 'Bài đăng Lá Đỏ Homestay'}</strong>
                              )}
                              <small title={item.postBrief || item.id}>ID: #{item.id} {item.pageName ? `· ${item.pageName}` : ''}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.platform === 'YOUTUBE' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--youtube"> YouTube</span>
                          )}
                          {item.platform === 'FACEBOOK' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--facebook"> Facebook</span>
                          )}
                          {item.platform === 'TIKTOK' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--tiktok"> TikTok</span>
                          )}
                          {!['YOUTUBE', 'FACEBOOK', 'TIKTOK'].includes(item.platform) && (
                            <span className="mkt-queue-platform-pill">{item.platform}</span>
                          )}
                        </td>

                        <td>
                          <span className="mkt-queue-time">
                            <Icon name="clock" size={14} />
                            {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Đăng ngay'}
                          </span>
                        </td>

                        <td>
                          {uploadProgressMap[item.id] ? (
                            <div className="mkt-progress-container">
                              <div className="mkt-progress-bar-wrap">
                                <div
                                  className="mkt-progress-bar-fill"
                                  style={{
                                    width: `${uploadProgressMap[item.id].percent}%`,
                                    background: uploadProgressMap[item.id].isError
                                      ? '#ef4444'
                                      : 'linear-gradient(90deg, #38bdf8 0%, #0284c7 50%, #10b981 100%)',
                                  }}
                                />
                              </div>
                              <span
                                className="mkt-progress-text"
                                style={{ color: uploadProgressMap[item.id].isError ? '#dc2626' : '#0284c7' }}
                              >
                                {uploadProgressMap[item.id].stageText} ({uploadProgressMap[item.id].percent}%)
                              </span>
                            </div>
                          ) : isPublishing ? (
                            <div className="mkt-progress-container">
                              <div className="mkt-progress-bar-wrap">
                                <div className="mkt-progress-bar-fill" style={{ width: '65%' }} />
                              </div>
                              <span className="mkt-progress-text">
                                <span className="mkt-spinner" style={{ width: '10px', height: '10px' }} />
                                <span>Đang xuất bản lên {item.platform === 'YOUTUBE' ? 'YouTube' : 'Facebook'}...</span>
                              </span>
                            </div>
                          ) : isPublished ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <span className="mkt-queue-status-pill mkt-queue-status-pill--completed">
                                <Icon name="check" size={13} />
                                <span>Đã hoàn tất</span>
                              </span>
                              {item.externalUrl && (
                                <a
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    color: item.platform === 'YOUTUBE' ? '#b91c1c' : '#1d4ed8',
                                    background: item.platform === 'YOUTUBE' ? '#fee2e2' : '#dbeafe',
                                    border: `1px solid ${item.platform === 'YOUTUBE' ? '#fca5a5' : '#bfdbfe'}`,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    width: 'fit-content',
                                  }}
                                  title="Bấm để mở bài đăng trực tiếp trên mạng xã hội"
                                >
                                  <span> Xem trên {item.platform === 'YOUTUBE' ? 'YouTube' : 'Facebook'}</span>
                                  <span style={{ fontSize: '10px' }}>↗</span>
                                </a>
                              )}
                            </div>
                          ) : isScheduled ? (
                            <span className="mkt-queue-status-pill mkt-queue-status-pill--pending">
                              <Icon name="calendar" size={13} />
                              <span>Đang chờ... (Đến giờ tự đăng)</span>
                            </span>
                          ) : isFailed ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span className="mkt-queue-status-pill mkt-queue-status-pill--failed">
                                <Icon name="close" size={13} />
                                <span>Thất bại / Thử lại</span>
                              </span>
                              {item.errorMessage && (
                                <small style={{ color: '#dc2626', fontSize: '11px', maxWidth: '220px', lineHeight: 1.2 }} title={item.errorMessage}>
                                  {item.errorMessage.length > 50 ? item.errorMessage.slice(0, 50) + '...' : item.errorMessage}
                                </small>
                              )}
                            </div>
                          ) : null}
                        </td>

                        <td>
                          <div className="mkt-queue-actions">
                            {item.externalUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mkt-queue-action-btn"
                                title="Mở xem trực tiếp bài viết / video trên mạng xã hội"
                                style={{
                                  color: item.platform === 'YOUTUBE' ? '#dc2626' : '#2563eb',
                                  borderColor: item.platform === 'YOUTUBE' ? '#fca5a5' : '#bfdbfe',
                                  background: item.platform === 'YOUTUBE' ? '#fef2f2' : '#eff6ff',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Icon name="externalLink" size={15} />
                              </a>
                            )}
                            {isPublished && (
                              <button
                                type="button"
                                className="mkt-queue-action-btn"
                                onClick={() => handleOpenEngagementModal(item.id)}
                                title="Xem tương tác & bình luận trực tiếp từ MXH (Like, Comment, Share)"
                                style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                              >
                                <Icon name="comment" size={15} />
                              </button>
                            )}
                            {!isPublished && (
                              <button
                                type="button"
                                className="mkt-queue-action-btn"
                                onClick={() => publish(item.id)}
                                disabled={isPublishing}
                                title="Đăng ngay bây giờ"
                                style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                              >
                                <Icon name="send" size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="mkt-queue-action-btn"
                              onClick={() => schedule(item.id)}
                              title="Chỉnh sửa lịch hẹn"
                              style={{ color: '#6366f1', borderColor: '#c7d2fe', background: '#eef2ff' }}
                            >
                              <Icon name="calendar" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '28px' }}></div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>Hàng đợi hiện tại đang trống</strong>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Khi bạn bấm <strong>"️ Lên Lịch Đăng"</strong> hoặc <strong>"Lưu & Thêm Vào Hàng Đợi"</strong>, bài viết sẽ được xếp vào đây để tự động xuất bản đúng giờ.
              </p>
            </div>
          )}
        </section>

        {/*  Kho Nội Dung Video (Matching tool_cre) */}
        <section className="mkt-video-library">
          <div className="mkt-video-library-head">
            <div>
              <h2>Kho nội dung video</h2>
              <p>Quét tự động thư mục trên máy tính (.mp4, .mov, .avi, .jpg, .png, .txt)</p>
            </div>
            <div className="mkt-video-head-actions">
              <label className="mkt-btn mkt-btn--secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Icon name="upload" size={15} />
                <span> Chọn File Lẻ</span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleMultipleFilesSelect}
                />
              </label>

              <label className="mkt-btn mkt-btn--secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Icon name="folder" size={15} />
                <span> Quét Thư Mục Máy</span>
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleDirectoryScan}
                />
              </label>

              <button
                type="button"
                className="mkt-btn--gdrive"
                onClick={() => handleOpenGdriveModal()}
                title="Mở bảng quét video từ thư mục Google Drive Cloud"
              >
                <Icon name="folder" size={15} />
                <span>Quét Google Drive Cloud</span>
              </button>
            </div>
          </div>

          <div className="mkt-video-search-bar">
            <div className="mkt-video-search-input-wrap">
              <span className="mkt-video-search-icon"><Icon name="folder" size={17} /></span>
              <input
                value={videoSearchPath}
                onChange={(e) => setVideoSearchPath(e.target.value)}
                placeholder="Dán link thư mục Google Drive hoặc đường dẫn máy tính..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (videoSearchPath.includes('drive.google.com') || /^[a-zA-Z0-9_-]{20,}$/.test(videoSearchPath.trim())) {
                      handleOpenGdriveModal(videoSearchPath)
                    } else if (videoSearchPath.trim()) {
                      handleOpenGdriveModal(videoSearchPath)
                    }
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              onClick={() => {
                if (videoSearchPath.includes('drive.google.com') || /^[a-zA-Z0-9_-]{20,}$/.test(videoSearchPath.trim())) {
                  handleOpenGdriveModal(videoSearchPath)
                } else {
                  handleOpenGdriveModal(videoSearchPath)
                }
              }}
            >
              <Icon name="refresh" size={14} />
              <span>Quét Thư Mục</span>
            </button>
          </div>

          <div className="mkt-video-banner">
            <div className="mkt-video-banner-text">
              <strong>💡 Đồng bộ Đám Mây 24/7 (Google Drive Cloud)</strong>
              <p>Tải video từ điện thoại vào thư mục Google Drive của Homestay, hệ thống Cloud Server sẽ tự động quét và sẵn sàng xuất bản đa nền tảng.</p>
            </div>
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              style={{ background: '#ffffff', borderColor: '#a7f3d0', color: '#065f46', fontWeight: 600 }}
              onClick={() => handleOpenGdriveModal()}
            >
              <Icon name="settings" size={14} />
              <span>Cấu Hình Thư Mục Drive</span>
            </button>
          </div>

          {videoLibrary.length > 0 ? (
            <div className="mkt-video-grid">
              {videoLibrary.map((video) => (
                <article className="mkt-video-card" key={video.id}>
                  <div className="mkt-video-thumb-container">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="mkt-video-thumb-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ffffff', gap: '4px' }}>
                        <Icon name="send" size={32} />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>VIDEO MP4</span>
                      </div>
                    )}
                    <span className="mkt-video-type-badge">{video.type}</span>
                  </div>

                  <div className="mkt-video-card-body">
                    <h3 className="mkt-video-card-title" title={video.title}>{video.title}</h3>
                    <div className="mkt-video-meta-row">
                      <span> {video.source}</span>
                      <span> {video.date}</span>
                    </div>

                    <div className="mkt-video-actions-row">
                      <button
                        type="button"
                        className="mkt-btn--schedule-video"
                        onClick={() => handleOpenScheduleForVideo(video)}
                      >
                        <Icon name="send" size={14} />
                        <span>️ Lên Lịch Đăng</span>
                      </button>
                      <button
                        type="button"
                        className="mkt-btn--delete-account"
                        onClick={() => handleDeleteVideoItem(video.id)}
                        title="Xóa video khỏi danh sách"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '36px' }}></div>
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>Chưa có video nào trong kho</strong>
              <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '480px' }}>
                Bấm <strong> Chọn File Lẻ</strong> để chọn video từ máy hoặc bấm <strong> Quét Thư Mục Máy</strong> để tự động nạp toàn bộ video trong thư mục của bạn.
              </p>
            </div>
          )}
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

              <div className="mkt-schedule-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '18px 24px 8px' }}>
                <div className="mkt-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>📅 Ngày đăng (Chọn từ lịch)</label>
                  <DateDropdownPicker
                    value={scheduleModal.date}
                    minDate={toDateInputValue(new Date())}
                    onChange={(val) => setScheduleModal((current) => ({ ...current, date: val }))}
                    placeholder="Chọn ngày đăng..."
                  />
                  {/* Mốc chọn nhanh ngày */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setScheduleModal((c) => ({ ...c, date: toDateInputValue(new Date()) }))}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + 1)
                        setScheduleModal((c) => ({ ...c, date: toDateInputValue(d) }))
                      }}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Ngày mai
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() + 2)
                        setScheduleModal((c) => ({ ...c, date: toDateInputValue(d) }))
                      }}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      +2 Ngày
                    </button>
                  </div>
                </div>

                <div className="mkt-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>⏰ Giờ đăng (Bấm vào chọn)</label>
                  <input
                    type="time"
                    value={scheduleModal.time}
                    onClick={(e) => { try { e.target.showPicker?.() } catch (err) {} }}
                    onFocus={(e) => { try { e.target.showPicker?.() } catch (err) {} }}
                    onChange={(event) => setScheduleModal((current) => ({ ...current, time: event.target.value }))}
                    style={{
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                    }}
                  />
                  {/* Mốc chọn nhanh giờ */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setScheduleModal((c) => ({ ...c, time: '08:00' }))}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      08:00 Sáng
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleModal((c) => ({ ...c, time: '11:30' }))}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      11:30 Trưa
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleModal((c) => ({ ...c, time: '19:30' }))}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      19:30 Tối
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleModal((c) => ({ ...c, time: '21:00' }))}
                      style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      21:00 Đêm
                    </button>
                  </div>
                </div>
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
                    <article
                      className="mkt-calendar-item"
                      key={`${channel.post?.id || 'post'}-${channel.id}`}
                      onClick={() => {
                        setCalendarOpen(false)
                        schedule(channel.id)
                      }}
                      role="button"
                      tabIndex={0}
                      title="Bấm để đổi ngày giờ hoặc chỉnh sửa lịch hẹn bài này"
                      style={{ cursor: 'pointer' }}
                    >
                      <time>
                        <strong>{new Date(channel.scheduledAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</strong>
                        <span>{new Date(channel.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </time>
                      <div>
                        <div className="mkt-calendar-title">
                          <Channel value={channel.platform} />
                          <strong>{channel.post?.title || 'Bài đăng Lá Đỏ Homestay'}</strong>
                        </div>
                        <p>{channel.content?.slice(0, 170) || channel.post?.brief}</p>
                        <small>{channel.pageName || channel.pageUrl || 'Chưa gán page'} · {formatScheduleTime(channel.scheduledAt)} · ✍️ Nhấn để đổi ngày/giờ</small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <StatusBadge value={channel.status} />
                        <button
                          type="button"
                          className="mkt-btn mkt-btn--secondary"
                          style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCalendarOpen(false)
                            schedule(channel.id)
                          }}
                        >
                          <Icon name="calendar" size={13} />
                          <span>Đổi lịch</span>
                        </button>
                      </div>
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

        {apiConfigModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => !apiConfigModal.saving && setApiConfigModal((c) => ({ ...c, open: false }))}>
            <section className="mkt-modal mkt-api-modal" role="dialog" aria-modal="true" aria-label="Cấu hình API đăng bài" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mkt-modal-head">
                <div>
                  <span>CẤU HÌNH API / TOKEN</span>
                  <h2>Nhập API Đăng Bài Tự Động</h2>
                  <p>Lưu Page Token, YouTube API Key hoặc TikTok API để đăng bài tự động 1-click.</p>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={() => setApiConfigModal((c) => ({ ...c, open: false }))} disabled={apiConfigModal.saving}><Icon name="close" /></button>
              </div>

              <div className="mkt-modal-body">
                {apiConfigModal.message && <p className="mkt-alert">{apiConfigModal.message}</p>}
                {apiConfigModal.successMessage && <p className="mkt-alert" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>{apiConfigModal.successMessage}</p>}

                <div>
                  {/* Platform Selector */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      className={`mkt-chip ${apiConfigModal.autoPlatform === 'ALL' ? 'mkt-chip--active' : ''}`}
                      onClick={() => setApiConfigModal((c) => ({ ...c, autoPlatform: 'ALL' }))}
                    >
                       Tự động nhận biết
                    </button>
                    <button
                      type="button"
                      className={`mkt-chip ${apiConfigModal.autoPlatform === 'YOUTUBE' ? 'mkt-chip--active' : ''}`}
                      onClick={() => setApiConfigModal((c) => ({ ...c, autoPlatform: 'YOUTUBE' }))}
                    >
                       Kênh YouTube / Shorts
                    </button>
                    <button
                      type="button"
                      className={`mkt-chip ${apiConfigModal.autoPlatform === 'FACEBOOK' ? 'mkt-chip--active' : ''}`}
                      onClick={() => setApiConfigModal((c) => ({ ...c, autoPlatform: 'FACEBOOK' }))}
                    >
                       Facebook Fanpage
                    </button>
                  </div>

                  {(apiConfigModal.autoPlatform === 'YOUTUBE' || apiConfigModal.autoPlatform === 'ALL') && (
                    <label className="mkt-field" style={{ marginBottom: '10px' }}>
                      <span>Handle Kênh hoặc Link Kênh YouTube (VD: <code>@ladohomestaysapa</code> hoặc <code>UC...</code>): <em>*</em></span>
                      <input
                        type="text"
                        value={apiConfigModal.channelQueryInput}
                        onChange={(e) => setApiConfigModal({ ...apiConfigModal, channelQueryInput: e.target.value })}
                        placeholder="Ví dụ: @ladohomestaysapa hoặc https://www.youtube.com/@ladohomestay"
                        style={{ fontSize: '13.5px' }}
                      />
                    </label>
                  )}

                  <label className="mkt-field">
                    <span>
                      {apiConfigModal.autoPlatform === 'YOUTUBE'
                        ? 'Google OAuth Token (tùy chọn để cấp quyền đăng tải trực tiếp):'
                        : apiConfigModal.autoPlatform === 'FACEBOOK'
                        ? 'Dán mã Page Access Token Facebook (bắt đầu bằng EAA...):'
                        : 'Mã Access Token Facebook (EAA...) hoặc Google Token (tùy chọn):'}
                    </span>
                    <textarea
                      rows="3"
                      value={apiConfigModal.tokenInput}
                      onChange={(e) => setApiConfigModal({ ...apiConfigModal, tokenInput: e.target.value })}
                      placeholder={apiConfigModal.autoPlatform === 'YOUTUBE' ? 'Dán mã Google OAuth Access Token (ya29... nếu có)...' : 'Dán mã Token Facebook (bắt đầu bằng EAA...)...'}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                  </label>

                  {/* Quick links to get tokens */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', marginTop: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span> Đường link lấy Token / API (Bấm mở ngay tab mới):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(apiConfigModal.autoPlatform === 'FACEBOOK' || apiConfigModal.autoPlatform === 'ALL') && (
                        <a
                          href="https://developers.facebook.com/tools/explorer/"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                           Meta Graph API Explorer ↗
                        </a>
                      )}
                      {(apiConfigModal.autoPlatform === 'YOUTUBE' || apiConfigModal.autoPlatform === 'ALL') && (
                        <>
                          <a
                            href="https://developers.google.com/oauthplayground/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                             Google OAuth 2.0 Playground ↗
                          </a>
                          <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                             Google Cloud Credentials ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hướng dẫn lấy Token Vĩnh Viễn cho Facebook */}
                  {(apiConfigModal.autoPlatform === 'FACEBOOK' || apiConfigModal.autoPlatform === 'ALL') && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginTop: '10px', fontSize: '12px', color: '#1e3a8a' }}>
                      <strong style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12.5px' }}>
                        💡 Cách lấy Page Access Token Vĩnh Viễn (Never Expire):
                      </strong>
                      <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>
                          Vào <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Meta Graph API Explorer ↗</a>: Chọn App & User Token, tích 3 quyền: <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code> → Bấm <em>Generate Access Token</em>.
                        </li>
                        <li>
                          Vào <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Access Token Debugger ↗</a>: Dán token vừa tạo → Bấm <em>Debug</em> → Cuộn xuống bấm <strong>Extend Access Token</strong> (nhận token 60 ngày).
                        </li>
                        <li>
                          Quay lại Explorer: Dán token 60 ngày → Gọi <code>GET me/accounts?fields=id,name,access_token</code> → Copy chuỗi <code>access_token</code> của Page Lá Đỏ và dán vào ô bên dưới!
                        </li>
                      </ol>
                    </div>
                  )}

                  {/* Hướng dẫn kết nối YouTube */}
                  {(apiConfigModal.autoPlatform === 'YOUTUBE' || apiConfigModal.autoPlatform === 'ALL') && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginTop: '10px', fontSize: '12px', color: '#991b1b' }}>
                      <strong style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12.5px' }}>
                        💡 Kết nối Kênh YouTube (OAuth 2.0 / Refresh Token):
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.4 }}>
                        Nhập <strong>Handle Kênh</strong> (ví dụ <code>@ladohomestaysapa</code>) hoặc dán <strong>OAuth Access / Refresh Token</strong> từ <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626', fontWeight: 700 }}>Google OAuth Playground ↗</a>. Hệ thống sẽ tự động liên kết Kênh để xuất bản Video & Shorts.
                      </p>
                    </div>
                  )}

                  <button
                    className="mkt-btn mkt-btn--primary"
                    type="button"
                    onClick={handleAutoDetectToken}
                    disabled={apiConfigModal.detecting || (!apiConfigModal.tokenInput.trim() && !apiConfigModal.channelQueryInput.trim())}
                    style={{ width: '100%', marginTop: '14px', minHeight: '42px', fontSize: '14px', fontWeight: 700 }}
                  >
                    {apiConfigModal.detecting ? <span className="mkt-spinner" /> : <Icon name="search" />}
                    {apiConfigModal.detecting ? 'Đang kết nối nhận diện Kênh...' : ' Kết Nối Kênh / Fanpage Tự Động'}
                  </button>

                  {/* Danh sách Kênh/Fanpage nhận diện được */}
                  {apiConfigModal.detectedPages.length > 0 && (
                    <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>
                         Kênh / Fanpage tìm thấy ({apiConfigModal.detectedPages.length}):
                      </strong>
                      {apiConfigModal.detectedPages.map((page) => (
                        <div
                          key={page.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {page.thumbnailUrl ? (
                              <img src={page.thumbnailUrl} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '24px' }}>{page.platform === 'YOUTUBE' ? '' : ''}</span>
                            )}
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{page.name}</span>
                                <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: page.platform === 'YOUTUBE' ? '#fee2e2' : '#dbeafe', color: page.platform === 'YOUTUBE' ? '#b91c1c' : '#1d4ed8' }}>
                                  {page.platform === 'YOUTUBE' ? 'YouTube' : 'Facebook'}
                                </span>
                              </strong>
                              <small style={{ color: '#64748b', fontSize: '12px' }}>
                                ID: {page.id} {page.category ? `· ${page.category}` : ''}
                              </small>
                            </div>
                          </div>
                          <button
                            className="mkt-btn mkt-btn--primary"
                            type="button"
                            onClick={() => handleSaveDetectedPage(page)}
                            disabled={apiConfigModal.saving}
                            style={{ minHeight: '36px', padding: '0 14px', fontSize: '12.5px' }}
                          >
                            {apiConfigModal.saving ? <span className="mkt-spinner" /> : <Icon name="check" />}
                             Kích hoạt & Lưu Kênh này
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {multiPostModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => !multiPostModal.publishing && setMultiPostModal((c) => ({ ...c, open: false }))}>
            <section
              className="mkt-modal mkt-multipost-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Lên lịch & Đăng Video Đa Nền Tảng"
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxWidth: '720px',
                width: '94%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                className="mkt-modal-head"
                style={{
                  padding: '18px 24px',
                  background: '#ffffff',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  
                  <span>Lên lịch & Đăng Video Đa Nền Tảng</span>
                </h2>
                <button className="mkt-icon-btn" type="button" onClick={() => setMultiPostModal((c) => ({ ...c, open: false }))} disabled={multiPostModal.publishing} style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={handleMultiPlatformPublish} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <div
                  className="mkt-modal-body"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0,
                  }}
                >
                  {multiPostModal.errorMsg && (
                    <p className="mkt-alert" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca', fontWeight: 600 }}>
                      {multiPostModal.errorMsg}
                    </p>
                  )}
                  {multiPostModal.successMsg && (
                    <p className="mkt-alert" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
                      {multiPostModal.successMsg}
                    </p>
                  )}

                  {/* 1. Chọn File Video */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Chọn File Video / Ảnh:</label>
                    <div className="mkt-input-with-btn">
                      <input
                        style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                        value={multiPostModal.mediaUrl}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, mediaUrl: e.target.value })}
                        placeholder="gdrive://... hoặc https://... hoặc /uploads/..."
                      />
                      <label className="mkt-dark-side-btn" style={{ cursor: 'pointer', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 18px', fontWeight: 600 }}>
                        <Icon name="upload" size={15} />
                        <span>Chọn File</span>
                        <input
                          type="file"
                          accept={multiPostModal.platforms.YOUTUBE && !multiPostModal.platforms.FACEBOOK ? 'video/*' : 'video/*,image/*'}
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const isVid = file.type.startsWith('video/')
                              try {
                                const uploaded = await uploadRequest('/media/upload', file)
                                setMultiPostModal((c) => ({
                                  ...c,
                                  mediaUrl: uploaded.mediaUrl,
                                  actualMediaUrl: uploaded.mediaUrl,
                                  mediaType: isVid ? 'VIDEO' : 'IMAGE',
                                  thumbnailUrl: !isVid ? uploaded.mediaUrl : c.thumbnailUrl,
                                  rawFile: file,
                                  title: file.name.replace(/\.[^/.]+$/, ''),
                                }))
                              } catch {
                                setMultiPostModal((c) => ({
                                  ...c,
                                  mediaUrl: URL.createObjectURL(file),
                                  actualMediaUrl: URL.createObjectURL(file),
                                  mediaType: isVid ? 'VIDEO' : 'IMAGE',
                                  rawFile: file,
                                  title: file.name.replace(/\.[^/.]+$/, ''),
                                }))
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {multiPostModal.mediaUrl && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {multiPostModal.mediaType === 'VIDEO' ||
                         multiPostModal.rawFile?.type?.startsWith('video/') ||
                         multiPostModal.mediaUrl?.match(/\.(mp4|mov|avi|webm|mkv|m4v)(\?|#|$)/i) ||
                         multiPostModal.actualMediaUrl?.match(/\.(mp4|mov|avi|webm|mkv|m4v)(\?|#|$)/i) ? (
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 600 }}>
                            🎥 Định dạng Video (.mp4) — Đủ điều kiện đăng YouTube Shorts & Facebook
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                            🖼️ Định dạng Ảnh ({multiPostModal.mediaUrl.split('.').pop()?.split('?')[0] || 'Image'}) — Phù hợp đăng Facebook (YouTube yêu cầu .mp4)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Tiêu đề Video */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Tiêu đề Video / Bài viết:</label>
                    <input
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                      value={multiPostModal.title}
                      onChange={(e) => setMultiPostModal({ ...multiPostModal, title: e.target.value })}
                      placeholder="VD: Khám phá vẻ đẹp Sa Pa tại Lá Đỏ Homestay..."
                      required
                    />
                  </div>

                  {/* AI Marketing Studio Controls */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a2b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✨ AI Marketing Studio (Chọn phong cách & Công thức viết)
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoGenerateModalCaption}
                        disabled={multiPostModal.generatingAi}
                        style={{ background: '#166534', color: '#ffffff', border: 0, padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)' }}
                      >
                        {multiPostModal.generatingAi ? (
                          <span className="mkt-spinner" style={{ width: 12, height: 12, display: 'inline-block' }} />
                        ) : (
                          <Icon name="sparkles" size={13} />
                        )}
                        <span>{multiPostModal.generatingAi ? 'Đang viết bài...' : 'Tự động sinh bằng AI'}</span>
                      </button>
                    </div>

                    {/* 1. Chủ đề chính */}
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        🎯 Chủ đề bài đăng:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { key: 'SAN_MAY', label: '☁️ Săn mây Mường Hoa' },
                          { key: 'REVIEW_ROOM', label: '🛏️ Review phòng đẹp' },
                          { key: 'VOUCHER_GIVEAWAY', label: '🎁 Minigame Voucher 50%' },
                          { key: 'BBQ_SUNSET', label: '🥩 BBQ hoàng hôn' },
                          { key: 'FLASHSALE', label: '⚡ Flash Sale trong tuần' },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setMultiPostModal((c) => ({ ...c, aiTopicTag: item.key }))}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: multiPostModal.aiTopicTag === item.key ? '1.5px solid #166534' : '1px solid #cbd5e1',
                              background: multiPostModal.aiTopicTag === item.key ? '#f0fdf4' : '#ffffff',
                              color: multiPostModal.aiTopicTag === item.key ? '#166534' : '#475569',
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Công thức Marketing & Tone giọng */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          📐 Công thức Marketing:
                        </span>
                        <select
                          value={multiPostModal.aiFramework}
                          onChange={(e) => setMultiPostModal({ ...multiPostModal, aiFramework: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', color: '#0f172a', fontWeight: 600 }}
                        >
                          <option value="HOOK_STORY_OFFER">🎬 Hook - Story - Offer (Shorts/Reels)</option>
                          <option value="AIDA">💎 AIDA (Attention - Interest - Desire - Action)</option>
                          <option value="PAS">🌿 PAS (Chữa lành & Giải pháp)</option>
                          <option value="FOMO">⏳ FOMO (Tạo độ khan hiếm)</option>
                        </select>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          🎨 Tone giọng & Phong cách:
                        </span>
                        <select
                          value={multiPostModal.aiTone}
                          onChange={(e) => setMultiPostModal({ ...multiPostModal, aiTone: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', color: '#0f172a', fontWeight: 600 }}
                        >
                          <option value="POETIC_CHILL">🌿 Thơ mộng & Chill bình yên</option>
                          <option value="EXCITED_TREND">🔥 Hào hứng, Bắt trend sôi nổi</option>
                          <option value="COZY_WARM">☕ Gần gũi, Ấm cúng chân tình</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Ô Ghi chú yêu cầu riêng cho AI */}
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        ✍️ Ghi chú yêu cầu riêng cho AI (Ý tưởng bổ sung, ưu đãi hôm nay...):
                      </span>
                      <input
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff', color: '#0f172a' }}
                        value={multiPostModal.aiCustomNote}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, aiCustomNote: e.target.value })}
                        placeholder="VD: Nhấn mạnh phòng bồn tắm kính tầng 3, tặng đĩa ngô nướng, chỉ áp dụng trước thứ 6..."
                      />
                    </div>
                  </div>

                  {/* 3. Nội dung Caption */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>
                      <span>Nội dung Caption (Đã chèn tự động Link Website & Vòng quay):</span>
                    </label>
                    <textarea
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px', lineHeight: 1.5 }}
                      rows="6"
                      value={multiPostModal.caption}
                      onChange={(e) => setMultiPostModal({ ...multiPostModal, caption: e.target.value })}
                      placeholder="Nhấp 'Tự động sinh bằng AI' hoặc tự nhập mô tả / caption..."
                      required
                    />
                  </div>

                  {/* 4. Hashtags */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Hashtags:</label>
                    <input
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                      value={multiPostModal.hashtags}
                      onChange={(e) => setMultiPostModal({ ...multiPostModal, hashtags: e.target.value })}
                      placeholder="#shorts #reels #tiktok #fyp..."
                    />
                  </div>

                  {/* 5. Thumbnail (Ảnh bìa) */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Thumbnail (Ảnh bìa):</label>
                    <div className="mkt-thumb-preview-box">
                      <img
                        src={multiPostModal.thumbnailUrl || 'https://via.placeholder.com/120x80'}
                        alt="Thumbnail Preview"
                        className="mkt-thumb-img"
                        style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <div className="mkt-input-with-btn" style={{ flex: 1 }}>
                        <input
                          style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                          value={multiPostModal.thumbnailUrl}
                          onChange={(e) => setMultiPostModal({ ...multiPostModal, thumbnailUrl: e.target.value })}
                          placeholder="https://..."
                        />
                        <label className="mkt-dark-side-btn" style={{ cursor: 'pointer', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 18px', fontWeight: 600 }}>
                          <Icon name="upload" size={15} />
                          <span>Chọn Ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const uploaded = await uploadRequest('/media/upload', file)
                                  setMultiPostModal((c) => ({
                                    ...c,
                                    thumbnailUrl: uploaded.mediaUrl,
                                    thumbnailFile: file,
                                  }))
                                } catch {
                                  setMultiPostModal((c) => ({
                                    ...c,
                                    thumbnailUrl: URL.createObjectURL(file),
                                    thumbnailFile: file,
                                  }))
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 6. Chọn nền tảng đăng tải đồng thời */}
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Chọn nền tảng đăng tải đồng thời:</label>
                    <div className="mkt-platform-select-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      {/* YouTube */}
                      <div
                        className={`mkt-platform-box ${multiPostModal.platforms.YOUTUBE ? 'mkt-platform-box--active' : ''}`}
                        style={{
                          background: multiPostModal.platforms.YOUTUBE ? '#f0f9ff' : '#f8fafc',
                          border: multiPostModal.platforms.YOUTUBE ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          color: multiPostModal.platforms.YOUTUBE ? '#0284c7' : '#475569',
                        }}
                        onClick={() => setMultiPostModal((c) => ({ ...c, platforms: { ...c.platforms, YOUTUBE: !c.platforms.YOUTUBE } }))}
                      >
                        <input type="checkbox" checked={multiPostModal.platforms.YOUTUBE} readOnly />
                        <span> YouTube</span>
                      </div>

                      {/* Facebook */}
                      <div
                        className={`mkt-platform-box ${multiPostModal.platforms.FACEBOOK ? 'mkt-platform-box--active' : ''}`}
                        style={{
                          background: multiPostModal.platforms.FACEBOOK ? '#f0f9ff' : '#f8fafc',
                          border: multiPostModal.platforms.FACEBOOK ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          color: multiPostModal.platforms.FACEBOOK ? '#0284c7' : '#475569',
                        }}
                        onClick={() => setMultiPostModal((c) => ({ ...c, platforms: { ...c.platforms, FACEBOOK: !c.platforms.FACEBOOK } }))}
                      >
                        <input type="checkbox" checked={multiPostModal.platforms.FACEBOOK} readOnly />
                        <span> Facebook</span>
                      </div>
                    </div>
                  </div>

                  {/* 7. Dropdown Chọn Page Facebook nếu đã chọn */}
                  {multiPostModal.platforms.FACEBOOK && (
                    <div className="mkt-dark-field">
                      <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}> Đăng lên Fanpage:</label>
                      <select
                        style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                        value={multiPostModal.selectedFacebookAccountId || socialAccounts.find(a => a.platform === 'FACEBOOK')?.id || ''}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, selectedFacebookAccountId: e.target.value })}
                      >
                        {socialAccounts.filter(a => a.platform === 'FACEBOOK').length > 0 ? (
                          socialAccounts.filter(a => a.platform === 'FACEBOOK').map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.externalAccountId || acc.id})
                            </option>
                          ))
                        ) : (
                          <option value="">Lá Đỏ Homestay Sa Pa (290099357528057)</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Dropdown Chọn Kênh YouTube nếu đã chọn */}
                  {multiPostModal.platforms.YOUTUBE && (
                    <div className="mkt-dark-field">
                      <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}> Đăng lên Kênh YouTube:</label>
                      <select
                        style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                        value={multiPostModal.selectedYoutubeAccountId || socialAccounts.find(a => a.platform === 'YOUTUBE')?.id || ''}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, selectedYoutubeAccountId: e.target.value })}
                      >
                        {socialAccounts.filter(a => a.platform === 'YOUTUBE').length > 0 ? (
                          socialAccounts.filter(a => a.platform === 'YOUTUBE').map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountName} ({acc.externalAccountId || acc.id})
                            </option>
                          ))
                        ) : (
                          <option value="">Kênh YouTube Lá Đỏ Official</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* 8. Thời gian hẹn giờ đăng & Lặp lại lịch trình */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                    <div className="mkt-dark-field">
                      <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>📅 Thời gian hẹn giờ đăng (Bấm vào chọn)</label>
                      <input
                        style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', fontWeight: 600 }}
                        type="datetime-local"
                        value={multiPostModal.scheduledDateTime}
                        onClick={(e) => { try { e.target.showPicker?.() } catch (err) {} }}
                        onFocus={(e) => { try { e.target.showPicker?.() } catch (err) {} }}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, scheduledDateTime: e.target.value })}
                      />
                      {/* Mốc chọn nhanh */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setHours(d.getHours() + 1, 0, 0, 0)
                            const pad = (n) => String(n).padStart(2, '0')
                            const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                            setMultiPostModal((c) => ({ ...c, scheduledDateTime: val }))
                          }}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                        >
                          +1 Giờ nữa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setHours(20, 0, 0, 0)
                            const pad = (n) => String(n).padStart(2, '0')
                            const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`
                            setMultiPostModal((c) => ({ ...c, scheduledDateTime: val }))
                          }}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Tối nay (20:00)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setDate(d.getDate() + 1)
                            const pad = (n) => String(n).padStart(2, '0')
                            const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T08:30`
                            setMultiPostModal((c) => ({ ...c, scheduledDateTime: val }))
                          }}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Sáng mai (08:30)
                        </button>
                      </div>
                    </div>

                    <div className="mkt-dark-field">
                      <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Lặp lại lịch trình</label>
                      <select
                        style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                        value={multiPostModal.repeatInterval}
                        onChange={(e) => setMultiPostModal({ ...multiPostModal, repeatInterval: e.target.value })}
                      >
                        <option value="ONCE">Một lần duy nhất</option>
                        <option value="DAILY">Lặp hàng ngày (Daily)</option>
                        <option value="WEEKLY">Lặp hàng tuần (Weekly)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons - Always pinned and 100% visible */}
                <div
                  className="mkt-modal-actions"
                  style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    padding: '16px 24px',
                    flexShrink: 0,
                    borderRadius: '0 0 18px 18px',
                  }}
                >
                  <button
                    type="button"
                    className="mkt-btn--cancel-dark"
                    style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1' }}
                    onClick={() => setMultiPostModal((c) => ({ ...c, open: false }))}
                    disabled={multiPostModal.publishing}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    className="mkt-btn--queue-submit"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', borderColor: '#059669' }}
                    onClick={(e) => handleMultiPlatformPublish(e, true)}
                    disabled={multiPostModal.publishing}
                  >
                    {multiPostModal.publishing ? <span className="mkt-spinner" /> : <Icon name="send" size={16} />}
                    <span>{multiPostModal.publishing ? 'Đang đăng bài...' : ' Đăng Ngay Lập Tức'}</span>
                  </button>
                  <button
                    type="button"
                    className="mkt-btn--queue-submit"
                    onClick={(e) => handleMultiPlatformPublish(e, false)}
                    disabled={multiPostModal.publishing}
                  >
                    {multiPostModal.publishing ? <span className="mkt-spinner" /> : <Icon name="calendar" size={16} />}
                    <span>{multiPostModal.publishing ? 'Đang lưu lịch...' : ' Hẹn Giờ & Thêm Vào Hàng Đợi'}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
        {/* Modal Tạo & Đăng Bài Giveaway Vòng Quay May Mắn */}
        {giveawayPostModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => !giveawayPostModal.publishing && setGiveawayPostModal((c) => ({ ...c, open: false }))}>
            <section className="mkt-modal mkt-api-modal" role="dialog" aria-modal="true" aria-label="Đăng bài Giveaway" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
              <div className="mkt-modal-head" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div>
                  <span style={{ color: '#e11d48', fontWeight: 800 }}>CHIẾN DỊCH MINI-GAME CÀO TƯƠNG TÁC</span>
                  <h2 style={{ fontSize: '1.35rem', color: '#0f172a' }}> Tạo & Đăng Bài Giveaway Vòng Quay May Mắn</h2>
                  <p style={{ color: '#64748b' }}>Đăng bài viết kèm link Minigame lên Fanpage để kéo tương tác và thu thập khách hàng tiềm năng.</p>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={() => setGiveawayPostModal((c) => ({ ...c, open: false }))} disabled={giveawayPostModal.publishing}><Icon name="close" /></button>
              </div>

              <div className="mkt-modal-body" style={{ padding: '20px 0' }}>
                {giveawayPostModal.errorMsg && <p className="mkt-alert">{giveawayPostModal.errorMsg}</p>}
                {giveawayPostModal.successMsg && <p className="mkt-alert" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>{giveawayPostModal.successMsg}</p>}

                <div className="mkt-dark-field" style={{ marginBottom: '14px' }}>
                  <label style={{ color: '#334155', fontWeight: 600 }}>Kênh Fanpage Facebook đăng bài:</label>
                  <select
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
                    value={giveawayPostModal.selectedAccountId}
                    onChange={(e) => setGiveawayPostModal({ ...giveawayPostModal, selectedAccountId: e.target.value })}
                  >
                    {socialAccounts.filter(a => a.platform === 'FACEBOOK').map(a => (
                      <option key={a.id} value={a.id}>{a.accountName} (ID: {a.externalAccountId || a.id})</option>
                    ))}
                  </select>
                </div>

                <div className="mkt-dark-field" style={{ marginBottom: '14px' }}>
                  <label style={{ color: '#334155', fontWeight: 600 }}>Tiêu đề chiến dịch:</label>
                  <input
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
                    value={giveawayPostModal.title}
                    onChange={(e) => setGiveawayPostModal({ ...giveawayPostModal, title: e.target.value })}
                  />
                </div>

                <div className="mkt-dark-field" style={{ marginBottom: '14px' }}>
                  <label style={{ color: '#334155', fontWeight: 600 }}>Đường dẫn Minigame công khai (Giveaway URL):</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', flex: 1 }}
                      value={giveawayPostModal.giveawayUrl || (window.location.origin + '/giveaway')}
                      onChange={(e) => setGiveawayPostModal({ ...giveawayPostModal, giveawayUrl: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mkt-btn mkt-btn--secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(giveawayPostModal.giveawayUrl || (window.location.origin + '/giveaway'))
                        alert('Đã copy đường dẫn Giveaway!')
                      }}
                    >
                       Copy Link
                    </button>
                  </div>
                </div>

                <div className="mkt-dark-field" style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#334155', fontWeight: 600 }}>Nội dung bài viết (kèm lời kêu gọi hấp dẫn):</label>
                  <textarea
                    rows={7}
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    value={giveawayPostModal.content}
                    onChange={(e) => setGiveawayPostModal({ ...giveawayPostModal, content: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--secondary"
                    onClick={() => {
                      const fullText = giveawayPostModal.content + '\n\n Tham gia ngay tại: ' + (giveawayPostModal.giveawayUrl || (window.location.origin + '/giveaway'))
                      navigator.clipboard.writeText(fullText)
                      alert('Đã copy toàn bộ nội dung bài viết và link!')
                    }}
                  >
                     Copy Toàn Bộ Nội Dung
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="mkt-btn mkt-btn--secondary"
                      onClick={() => setGiveawayPostModal((c) => ({ ...c, open: false }))}
                      disabled={giveawayPostModal.publishing}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="mkt-btn mkt-btn--primary"
                      style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)', border: 'none' }}
                      onClick={handlePublishGiveawayPost}
                      disabled={giveawayPostModal.publishing}
                    >
                      {giveawayPostModal.publishing ? <span className="mkt-spinner" /> : <Icon name="send" />}
                      <span>{giveawayPostModal.publishing ? 'Đang xuất bản...' : ' Đăng Lên Fanpage Ngay'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Modal Quét Google Drive Cloud */}
        {gdriveModal.open && (
          <div className="mkt-modal-backdrop" role="presentation" onMouseDown={() => !gdriveModal.isScanning && setGdriveModal((c) => ({ ...c, open: false }))}>
            <section className="mkt-modal mkt-api-modal" role="dialog" aria-modal="true" aria-label="Quét Google Drive Cloud" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="mkt-modal-head" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    <Icon name="folder" size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>Quét Thư Mục Google Drive Cloud</h2>
                    <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Quét tự động video & hình ảnh cảnh đẹp Homestay để nạp vào kho nội dung và lên lịch đăng 24/7.</p>
                  </div>
                </div>
                <button className="mkt-icon-btn" type="button" onClick={() => setGdriveModal((c) => ({ ...c, open: false }))} disabled={gdriveModal.isScanning}><Icon name="close" /></button>
              </div>

              <div className="mkt-modal-body" style={{ padding: '16px 0', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* API Key configuration toggle bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                    <Icon name="wand" size={16} />
                    <span>Google Drive API Key: {gdriveModal.apiKey ? <b style={{ color: '#059669' }}> Đã cấu hình</b> : <span style={{ color: '#d97706' }}>️ Chưa có key</span>}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGdriveModal((c) => ({ ...c, showApiKey: !c.showApiKey }))}
                    style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {gdriveModal.showApiKey ? 'Ẩn cấu hình' : 'Cấu hình Google API Key'}
                  </button>
                </div>

                {gdriveModal.showApiKey && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>Nhập Google Drive API Key (Google Cloud Console):</label>
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0284c7', textDecoration: 'underline' }}>
                        Lấy API Key miễn phí ↗
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="AIzaSy..."
                        value={gdriveModal.apiKey}
                        onChange={(e) => setGdriveModal((c) => ({ ...c, apiKey: e.target.value }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="mkt-btn mkt-btn--primary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                        onClick={() => {
                          localStorage.setItem('mkt_google_drive_api_key', gdriveModal.apiKey.trim())
                          setGdriveModal((c) => ({ ...c, successMsg: 'Đã lưu Google Drive API Key thành công!' }))
                          setTimeout(() => setGdriveModal((c) => ({ ...c, successMsg: '' })), 2500)
                        }}
                      >
                        Lưu Key
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      * Mẹo: Thư mục Google Drive nên được chia sẻ ở chế độ <b>"Bất kỳ ai có đường liên kết đều có thể xem"</b>.
                    </p>
                  </div>
                )}

                {/* Input Folder URL / ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Dán đường dẫn thư mục Google Drive:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
                      value={gdriveModal.folderInput}
                      onChange={(e) => setGdriveModal((c) => ({ ...c, folderInput: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') scanGdriveWithParams(gdriveModal.folderInput, gdriveModal.apiKey)
                      }}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                    <button
                      type="button"
                      className="mkt-btn mkt-btn--primary"
                      onClick={() => scanGdriveWithParams(gdriveModal.folderInput, gdriveModal.apiKey)}
                      disabled={gdriveModal.isScanning || !gdriveModal.folderInput.trim()}
                      style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', minWidth: '130px' }}
                    >
                      {gdriveModal.isScanning ? <span className="mkt-spinner" /> : <Icon name="refresh" size={15} />}
                      <span>{gdriveModal.isScanning ? 'Đang quét...' : 'Quét Video'}</span>
                    </button>
                  </div>
                </div>

                {gdriveModal.error && <p className="mkt-alert" style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca', margin: 0 }}>{gdriveModal.error}</p>}
                {gdriveModal.successMsg && <p className="mkt-alert" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', margin: 0 }}>{gdriveModal.successMsg}</p>}

                {/* Scanned Results */}
                {gdriveModal.results.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        Danh sách video & hình ảnh tìm thấy ({gdriveModal.results.length}):
                      </span>
                      <button
                        type="button"
                        className="mkt-btn mkt-btn--primary"
                        onClick={handleAddAllGdriveToLibrary}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#059669' }}
                      >
                         Nạp Toàn Bộ Vào Kho Video ({gdriveModal.results.length})
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxHeight: '280px', overflowY: 'auto', padding: '4px' }}>
                      {gdriveModal.results.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {item.sizeMb ? `${item.sizeMb} MB` : item.type}
                            </span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.title}>
                              {item.title}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.date}</span>
                          </div>
                          <button
                            type="button"
                            className="mkt-btn mkt-btn--secondary"
                            onClick={() => handleAddSingleGdriveToLibrary(item)}
                            style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: 600, justifyContent: 'center' }}
                          >
                             Chọn File Này
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="mkt-btn mkt-btn--secondary"
                  onClick={() => setGdriveModal((c) => ({ ...c, open: false }))}
                  disabled={gdriveModal.isScanning}
                >
                  Đóng
                </button>
                {gdriveModal.results.length > 0 && (
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--primary"
                    style={{ background: '#059669' }}
                    onClick={handleAddAllGdriveToLibrary}
                  >
                     Nạp Vào Kho & Bắt Đầu Đăng Bài
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Modal Tương Tác & Bình Luận Mạng Xã Hội */}
        <SocialEngagementModal
          modal={engagementModal}
          setModal={setEngagementModal}
          onSimulateInteraction={handleSimulateInteraction}
          onRefresh={handleOpenEngagementModal}
        />
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

  const {
    engagementModal,
    setEngagementModal,
    handleOpenEngagementModal,
    handleSimulateInteraction,
  } = useSocialEngagement()

  useEffect(() => {
    request('/dashboard').then(setDashboard).catch(() => setDashboard({ recentPosts: [] }))
  }, [])

  const posts = dashboard?.recentPosts || []
  const channels = posts.flatMap((post) => (post?.channels || []).map((channel) => ({ ...channel, post })))
  const filtered = channels.filter((channel) => {
    const text = `${channel?.post?.title || ''} ${channel?.platform || ''} ${channel?.pageName || ''}`.toLowerCase()
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {channel.status === 'PUBLISHED' && (
                          <button
                            className="mkt-row-more"
                            type="button"
                            title="Xem tương tác & bình luận MXH"
                            style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', width: '32px', height: '32px' }}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenEngagementModal(channel.id)
                            }}
                          >
                            
                          </button>
                        )}
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
                      </div>
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
                {selectedChannel.status === 'PUBLISHED' && (
                  <button
                    className="mkt-btn mkt-btn--primary"
                    type="button"
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}
                    onClick={() => handleOpenEngagementModal(selectedChannel.id)}
                  >
                    <span> Xem tương tác & bình luận MXH</span>
                  </button>
                )}
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

        {/*  Modal Tương Tác & Bình Luận Mạng Xã Hội */}
        <SocialEngagementModal
          modal={engagementModal}
          setModal={setEngagementModal}
          onSimulateInteraction={handleSimulateInteraction}
          onRefresh={handleOpenEngagementModal}
        />
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
                  {['active', 'scheduled'].includes(voucher.status?.toLowerCase()) ? (
                    <button
                      className="mkt-code"
                      type="button"
                      title="Nhấp để sao chép mã voucher"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigator.clipboard?.writeText(voucher.code)
                      }}
                    >
                      <span>{voucher.code}</span><Icon name="copy" />
                    </button>
                  ) : (
                    <div className="mkt-code mkt-code--disabled" title="Mã giảm giá đã hết hạn / không còn hiệu lực">
                      <span>{voucher.code}</span>
                    </div>
                  )}
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
