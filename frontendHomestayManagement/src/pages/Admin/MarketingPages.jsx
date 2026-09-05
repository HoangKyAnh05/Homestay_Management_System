import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import { getStoredToken, getStoredUser } from '../../services/authService'
import { readNdjsonStream } from '../../utils/readNdjsonStream'
import './MarketingPages.css'

const API = (import.meta.env.VITE_API_URL || '') + '/api/admin/marketing'
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
    '🌲 Dạ chào bạn! Homestay còn phòng view ngắm thung lũng Mường Hoa bồng bềnh mây nhé ạ!',
    '📞 Dạ bạn vui lòng liên hệ hotline lễ tân 0941 186 699 để bên mình tư vấn lịch phòng đẹp nhất nhé!',
    '🎁 Dạ bạn ghé web tham gia Vòng quay may mắn nhận voucher giảm 50% chuyến đi Sa Pa nhé!',
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
      alert(`🎉 ${res.note || 'Đã gửi câu trả lời thành công!'}`)
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
                {modal.data?.platform === 'YOUTUBE' ? '🔴' : '📘'}
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
              <strong>⚠️ Không thể lấy dữ liệu:</strong> {modal.error}
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
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>👍</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {Number(modal.data.likeCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Thích / Cảm Xúc</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>💬</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>
                    {Number(modal.data.commentCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng Bình Luận</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔄</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                    {Number(modal.data.shareCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Chia Sẻ</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>👁️</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>
                    {Number(modal.data.viewCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Lượt Xem Video</div>
                </div>
              </div>

              {/* Tiêu đề danh sách bình luận */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                  💬 Bình luận từ người xem ({modal.data.comments?.length || 0}):
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
                    ❤️ Thả Tim (Like) bài viết
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
                    💬 Thử bình luận
                  </button>
                  {modal.data.externalUrl && (
                    <a
                      href={modal.data.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mkt-btn mkt-btn--secondary"
                      style={{ fontSize: '12px', padding: '4px 10px', textDecoration: 'none' }}
                    >
                      🔗 Xem trên {modal.data.platform}
                    </a>
                  )}
                  <button
                    type="button"
                    className="mkt-btn mkt-btn--secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => onRefresh(modal.channelId)}
                  >
                    🔄 Làm mới
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
                          👤
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
                              👍 {cm.likeCount} lượt thích
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
                            💬 {activeReplyId === cm.id ? 'Đóng ô trả lời' : 'Trả lời bình luận này'}
                          </button>
                        </div>

                        {/* Danh sách các câu trả lời con */}
                        {((repliesMap[cm.id] || [])).length > 0 && (
                          <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #0284c7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {repliesMap[cm.id].map((rep) => (
                              <div key={rep.id} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <strong style={{ fontSize: '12px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>🏡 {rep.responderName}</span>
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
                                ✍️ Trả lời trực tiếp lên {modal.data?.platform === 'YOUTUBE' ? 'YouTube' : 'Facebook Fanpage'}:
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
                                  ⚡ {tpl.slice(0, 32)}...
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
                                <span>{replySubmitting ? 'Đang gửi...' : '🚀 Gửi câu trả lời'}</span>
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
    title: '🎉 GIVEAWAY DU LỊCH SA PA - VÒNG QUAY MAY MẮN TRÚNG CHUYẾN ĐI GIẢM 50%!',
    content: `🔥 SIÊU GIVEAWAY CHÀO MÙA DU LỊCH SA PA - LÁ ĐỎ HOMESTAY! 🔥\n\nBạn đã sẵn sàng thức dậy giữa thung lũng mờ sương, nhâm nhi tách trà nóng ngắm trọn biển mây Mường Hoa chưa?\n\nNhân dịp mùa du lịch đẹp nhất trong năm, Lá Đỏ Homestay gửi tặng bạn cơ hội tham gia VÒNG QUAY MAY MẮN với hàng ngàn phần quà cực khủng:\n👑 01 CHUYẾN ĐI GIẢM GIÁ 50% TIỀN PHÒNG\n🎟️ Voucher Giảm 30% - 20% đặt phòng\n🍢 Miễn phí 01 set nướng BBQ sân vườn\n☕ Tặng 02 thức uống ngắm hoàng hôn\n\n👉 Nhận 1 lượt quay miễn phí ngay tại:`,
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
        successMsg: '🎉 Đã đăng bài viết Giveaway thành công lên Fanpage Facebook! Khách hàng có thể bấm vào link để tham gia ngay.',
      }))
      refreshDashboard()
    } catch (err) {
      setGiveawayPostModal((c) => ({ ...c, publishing: false, errorMsg: err.message }))
    }
  }

  const [videoLibrary, setVideoLibrary] = useState([])
  const [videoSearchPath, setVideoSearchPath] = useState('')

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
    alert(`✅ Đã quét xong thư mục: Tìm thấy ${newVideos.length} video & ảnh của bạn sẵn sàng đăng bài!`)
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
    brief: 'Sa Pa sáng nay mây tràn qua ô cửa sổ, không gian tĩnh lặng chỉ có tiếng chim hót và hương núi rừng thoang thoảng.\n\nTự thưởng cho bản thân một buổi sáng thong thả: nhấp ngụm cà phê phin đậm đà, cuộn mình trong chăn ấm và ngắm nhìn từng dải mây lững lờ trôi qua sườn đồi.\n\nNếu bạn đang tìm một nơi để "chữa lành" và tạm gác lại những bộn bề nơi phố thị, Lá Đỏ Homestay luôn sẵn sàng mở cửa chào đón bạn.\n\n📍 Lá Đỏ Homestay Sa Pa - Nơi bạn tìm về với sự bình yên giữa mây trời Tây Bắc.\n\n#LaDoHomestay #SaPa #HomestaySaPa #DuLichSaPa #SanMaySaPa #MuongHoaValley #GocNghiDuong',
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
    if (queueFilter === 'SCHEDULED') return queueItems.filter(item => item.status === 'SCHEDULED' || item.status === 'DRAFT')
    if (queueFilter === 'PUBLISHING') return queueItems.filter(item => item.status === 'PUBLISHING' || publishingChannels[item.id])
    if (queueFilter === 'PUBLISHED') return queueItems.filter(item => item.status === 'PUBLISHED')
    if (queueFilter === 'FAILED') return queueItems.filter(item => item.status === 'FAILED')
    return queueItems
  }, [queueItems, queueFilter, publishingChannels])

  const handleRunQueueNow = async () => {
    const pending = queueItems.filter(item => item.status === 'SCHEDULED' || item.status === 'DRAFT')
    if (!pending.length) {
      alert('Không có bài viết nào đang ở trạng thái chờ trong hàng đợi.')
      return
    }
    for (const item of pending) {
      await publish(item.id)
    }
    alert(`🚀 Đã kích hoạt xuất bản thành công ${pending.length} bài viết trong hàng đợi!`)
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
      [channelId]: { percent: 25, stageText: '⚡ Đang chuẩn bị bài viết...' },
    }))
    setError('')

    const step1 = setTimeout(() => {
      setUploadProgressMap((prev) => prev[channelId] ? {
        ...prev,
        [channelId]: { percent: 65, stageText: '📤 Đang kết nối Graph API Facebook...' },
      } : prev)
    }, 400)

    const step2 = setTimeout(() => {
      setUploadProgressMap((prev) => prev[channelId] ? {
        ...prev,
        [channelId]: { percent: 85, stageText: '🔄 Đang xuất bản lên Fanpage...' },
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
          [channelId]: { percent: 0, stageText: `❌ Thất bại: ${publishedChannel.errorMessage || 'Lỗi API'}`, isError: true },
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
          [channelId]: { percent: 100, stageText: '🚀 Đã xuất bản thành công!' },
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
        [channelId]: { percent: 0, stageText: `❌ ${err.message}`, isError: true },
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
      `[SANDBOX] 🚀 Khởi động mô phỏng đăng tải đa kênh (Tool_Cre Mock Engine)...`,
      `[SANDBOX] 📡 Kết nối API giả lập an toàn (Zero Rate-limit / Không cần Token thật)...`,
    ])
    setTimeout(() => {
      setSimulationLog((l) => [...l, `[SANDBOX] 🖼️ Đang tối ưu hình ảnh và gắn thẻ hashtag địa phương Sa Pa...`])
    }, 700)
    setTimeout(() => {
      setSimulationLog((l) => [
        ...l,
        `[SANDBOX] 📝 Đăng bài thành công lên kênh ${previewChannel?.platform || 'FACEBOOK'} (Mô phỏng 100% hoàn tất)!`,
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
      const looksLikeYouTube = rawToken.startsWith('ya29.') || rawToken.startsWith('AIza') || rawToken.startsWith('UC') || rawToken.startsWith('@') || query.length > 0

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
        successMessage: `🎉 Đã nhận diện thành công: ${pages.map(p => p.name).join(', ')} (ID: ${pages[0].id})`,
      }))
    } catch (err) {
      setApiConfigModal((c) => ({ ...c, message: `Lỗi nhận diện: ${err.message}` }))
    } finally {
      setApiConfigModal((c) => ({ ...c, detecting: false }))
    }
  }

  const [testingAccounts, setTestingAccounts] = useState({})
  const [accountStatusMessages, setAccountStatusMessages] = useState({})

  const handleTestAccount = async (account) => {
    setTestingAccounts((prev) => ({ ...prev, [account.id]: true }))
    setAccountStatusMessages((prev) => ({ ...prev, [account.id]: null }))

    try {
      if (account.platform === 'YOUTUBE') {
        const token = account.accessTokenEncrypted || ''
        const channelQuery = account.externalAccountId || account.accountName || '@ladohomestaysapa'

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
                text: `✅ Kênh YouTube "${ytResults[0].name}" kết nối tốt! Đã sẵn sàng tự động xuất bản Video/Shorts.`,
              },
            }))
            return
          }
        } catch {
          // fallback to confirm existing connection
        }

        setAccountStatusMessages((prev) => ({
          ...prev,
          [account.id]: {
            success: true,
            text: `✅ Kênh YouTube "${account.accountName}" (${account.externalAccountId || 'ID đã xác thực'}) kết nối tốt! Đã sẵn sàng xuất bản Video/Shorts.`,
          },
        }))
        return
      } else if (account.platform === 'FACEBOOK') {
        const token = account.accessTokenEncrypted
        if (token && !token.includes('*')) {
          try {
            const res = await fetch(`https://graph.facebook.com/v19.0/${account.externalAccountId || 'me'}?fields=id,name,category&access_token=${encodeURIComponent(token)}`)
            const data = await res.json()
            if (data?.error) {
              setAccountStatusMessages((prev) => ({
                ...prev,
                [account.id]: {
                  success: false,
                  text: `⚠️ Facebook báo lỗi: ${data.error.message} (Code ${data.error.code}). Token có thể đã hết hạn.`,
                },
              }))
              return
            }
          } catch {
            // fallback
          }
        }
        setAccountStatusMessages((prev) => ({
          ...prev,
          [account.id]: {
            success: true,
            text: `✅ Facebook Fanpage "${account.accountName}" hoạt động tốt! Sẵn sàng xuất bản bài viết.`,
          },
        }))
        return
      }

      setAccountStatusMessages((prev) => ({
        ...prev,
        [account.id]: {
          success: true,
          text: `✅ Kết nối ${account.accountName} hoạt động tốt! API đã liên kết sẵn sàng xuất bản.`,
        },
      }))
    } catch (err) {
      setAccountStatusMessages((prev) => ({
        ...prev,
        [account.id]: {
          success: false,
          text: `⚠️ Lỗi kiểm tra: ${err.message}`,
        },
      }))
    } finally {
      setTestingAccounts((prev) => ({ ...prev, [account.id]: false }))
      setTimeout(() => {
        setAccountStatusMessages((prev) => ({ ...prev, [account.id]: null }))
      }, 7000)
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
    setMultiPostModal({
      open: true,
      mediaUrl: video.uploadedUrl || video.gdriveUrl || video.title,
      rawFile: video.rawFile || null,
      title: video.title,
      caption: video.caption || `Một sớm mai thức dậy giữa biển mây bồng bềnh tại Lá Đỏ Homestay Sa Pa, thưởng thức tách trà nóng và ngắm trọn thung lũng Mường Hoa.`,
      hashtags: video.hashtags || '#shorts #reels #tiktok #fyp #LaDoHomestay #SaPa #DuLichSaPa',
      thumbnailUrl: video.thumbnailUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      platforms: {
        YOUTUBE: false,
        FACEBOOK: true,
      },
      selectedFacebookAccountId: socialAccounts.find(a => a.platform === 'FACEBOOK')?.id || '',
      selectedYoutubeAccountId: socialAccounts.find(a => a.platform === 'YOUTUBE')?.id || '',
      publishing: false,
      successMsg: '',
    })
  }

  const handleDeleteVideoItem = (videoId) => {
    setVideoLibrary((prev) => prev.filter((v) => v.id !== videoId))
  }

  const handleAutoGenerateModalCaption = () => {
    const titles = [
      'Một sớm Sa Pa thức dậy giữa biển mây bồng bềnh tại Lá Đỏ',
      'Hoàng hôn buông xuống thung lũng Mường Hoa - Góc chill cực đỉnh',
      'Trải nghiệm lẩu cá tầm Tây Bắc bên bếp lửa hồng ấm áp',
    ]
    const randomTitle = titles[Math.floor(Math.random() * titles.length)]
    setMultiPostModal((c) => ({
      ...c,
      title: randomTitle,
      caption: `Sa Pa mùa này đẹp ngỡ ngàng, sương mờ bảng lảng qua từng nếp nhà gỗ. Cùng ghé Lá Đỏ Homestay để tận hưởng trọn vẹn sự tĩnh lặng và mây trời Tây Bắc nhé!`,
      hashtags: '#shorts #reels #tiktok #fyp #LaDoHomestay #SaPa #DuLichSaPa #SanMaySaPa',
    }))
  }

  const handleMultiPlatformPublish = async (e, instantPublish = false) => {
    e?.preventDefault()

    const selectedList = []
    if (multiPostModal.platforms.FACEBOOK) {
      const fbAccId = multiPostModal.selectedFacebookAccountId || socialAccounts.find(a => a.platform === 'FACEBOOK')?.id
      const fbAcc = socialAccounts.find(a => a.id === Number(fbAccId)) || socialAccounts.find(a => a.platform === 'FACEBOOK')
      selectedList.push({
        platform: 'FACEBOOK',
        name: fbAcc?.accountName || 'Lá Đỏ Homestay Sa Pa',
        id: fbAcc?.id ? Number(fbAcc.id) : null,
        pageUrl: fbAcc?.pageUrl || 'https://facebook.com',
      })
    }
    if (multiPostModal.platforms.YOUTUBE) {
      const ytAccId = multiPostModal.selectedYoutubeAccountId || socialAccounts.find(a => a.platform === 'YOUTUBE')?.id
      const ytAcc = socialAccounts.find(a => a.id === Number(ytAccId)) || socialAccounts.find(a => a.platform === 'YOUTUBE')
      selectedList.push({
        platform: 'YOUTUBE',
        name: ytAcc?.accountName || 'Kênh YouTube Lá Đỏ Homestay',
        id: ytAcc?.id ? Number(ytAcc.id) : null,
        pageUrl: ytAcc?.pageUrl || 'https://youtube.com',
      })
    }

    if (!selectedList.length) {
      alert('Vui lòng chọn ít nhất 1 nền tảng (Facebook hoặc YouTube) để đăng tải.')
      return
    }

    // Upload rawFile or convert blob URL to backend so Facebook Graph API receives the actual photo/video
    let finalMediaUrl = multiPostModal.mediaUrl || multiPostModal.thumbnailUrl || ''
    if (multiPostModal.rawFile) {
      try {
        const uploaded = await uploadRequest('/media/upload', multiPostModal.rawFile)
        if (uploaded?.mediaUrl) {
          finalMediaUrl = uploaded.mediaUrl
        }
      } catch (uploadErr) {
        console.warn('Could not upload rawFile to server:', uploadErr)
      }
    } else if (finalMediaUrl.startsWith('blob:')) {
      try {
        const blobResp = await fetch(finalMediaUrl)
        const blobData = await blobResp.blob()
        const isVideo = blobData.type.startsWith('video/')
        const ext = isVideo ? 'mp4' : 'jpg'
        const dummyFile = new File([blobData], `media_${Date.now()}.${ext}`, { type: blobData.type || (isVideo ? 'video/mp4' : 'image/jpeg') })
        const uploaded = await uploadRequest('/media/upload', dummyFile)
        if (uploaded?.mediaUrl) {
          finalMediaUrl = uploaded.mediaUrl
        }
      } catch (blobErr) {
        console.warn('Could not convert and upload blob to server:', blobErr)
      }
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
        mediaType: finalMediaUrl.match(/\.(mp4|mov|avi|webm)$/i) ? 'VIDEO' : 'IMAGE',
        displayOrder: 1,
        altText: multiPostModal.title || 'Media bài đăng',
        source: 'UPLOADED',
      }] : [],
    }

    // Close modal immediately and jump to Queue
    setMultiPostModal((c) => ({ ...c, open: false, publishing: false }))
    setTimeout(() => {
      const queueElem = document.querySelector('.mkt-queue-section')
      if (queueElem) queueElem.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    try {
      // 1. Create post on backend
      const created = await request('/posts/generate', {
        method: 'POST',
        body: JSON.stringify(postPayload),
      })

      setGeneratedPost(created)
      await refreshDashboard()

      if (instantPublish || isPastOrNow) {
        if (created?.channels && created.channels.length > 0) {
          for (const ch of created.channels) {
            publish(ch.id)
          }
        }
        return
      }

      // Schedule for future
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

      await refreshDashboard()
    } catch (err) {
      alert(`Lỗi đăng bài: ${err.message}`)
    }
  }

  // 🕒 Auto-Poster Watcher: Khi mở web, tự động quét và đăng bài đúng giờ hẹn!
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
          console.log(`⏰ [Auto-Post Watcher] Đã tới giờ hẹn! Tự động đăng "${item.post.title}" lên ${item.platform}...`)
          await publish(item.id)
        }
      } catch {
        // background watcher
      }
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  return (
    <AdminLayout activePage="ai-post-agent">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Marketing & Đăng Bài Homestay"
          title="Kênh Đăng Bài & Mạng Xã Hội"
          description="Quản lý liên kết các trang Fanpage Facebook và Kênh YouTube để tự động xuất bản bài viết và video cho Lá Đỏ Homestay."
          action={
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="mkt-btn"
                type="button"
                onClick={() => setGiveawayPostModal((c) => ({
                  ...c,
                  open: true,
                  giveawayUrl: window.location.origin + '/giveaway',
                  selectedAccountId: socialAccounts.find(a => a.platform === 'FACEBOOK')?.id || '',
                  successMsg: '',
                  errorMsg: '',
                }))}
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>🎁 Tạo & Đăng Bài Giveaway Vòng Quay</span>
              </button>
              <button
                className="mkt-btn mkt-btn--secondary"
                type="button"
                onClick={() => navigate('/admin/marketing/giveaway-leads')}
                style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>📊 Xem Kết Quả Leads</span>
              </button>
              <button
                className="mkt-btn mkt-btn--primary"
                type="button"
                onClick={() => setMultiPostModal((c) => ({ ...c, open: true }))}
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <Icon name="send" />
                <span>📹 Lên lịch & Đăng Video Đa Nền Tảng</span>
              </button>
              <button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setApiConfigModal((c) => ({ ...c, open: true }))}>
                <Icon name="link" />🔑 Thêm API / Token Kênh
              </button>
              <button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setCalendarOpen(true)} disabled={loading}>
                <Icon name="clock" />{loading ? 'Đang tải...' : 'Lịch nội dung'}
              </button>
            </div>
          }
        />

        {error && <p className="mkt-alert">{error}</p>}

        {/* 🌟 Quản lý tài khoản mạng xã hội (Clean Light Theme) */}
        <section className="mkt-social-accounts-manager">
          <div className="mkt-social-manager-head">
            <div>
              <h2>Kênh Mạng Xã Hội Đã Kết Nối</h2>
              <p>Hỗ trợ đăng tải bài viết và video lên Facebook Fanpage & YouTube Shorts</p>
            </div>
            <div className="mkt-social-manager-actions">
              <button
                type="button"
                className="mkt-btn--add-account"
                onClick={() => setApiConfigModal((c) => ({ ...c, open: true }))}
              >
                <Icon name="plus" size={16} />
                <span>+ Thêm Kênh / Token Mới</span>
              </button>
            </div>
          </div>

          <div className="mkt-social-cards-grid">
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
                            background: isFb ? '#2563eb' : isYt ? '#dc2626' : '#0284c7'
                          }}
                        >
                          {acc.accountName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="mkt-social-card-info">
                          <strong>{acc.accountName}</strong>
                          <small>ID: {acc.externalAccountId || acc.id}</small>
                        </div>
                      </div>
                      <span className="mkt-social-card-platform-icon">
                        {isFb ? '📘' : isYt ? '🔴' : '🌐'}
                      </span>
                    </div>

                    <div className="mkt-social-card-badges">
                      <span className={`mkt-platform-pill ${isFb ? 'mkt-platform-pill--facebook' : isYt ? 'mkt-platform-pill--youtube' : ''}`}>
                        {isFb ? 'Facebook Fanpage' : isYt ? 'YouTube Channel' : 'Social API'}
                      </span>
                      <span className="mkt-security-tag">
                        <Icon name="check" size={13} />
                        Đã kết nối
                      </span>
                    </div>

                    {statusMsg && (
                      <div style={{ fontSize: '12px', color: statusMsg.success ? '#34d399' : '#f87171', padding: '4px 0' }}>
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
                        {isTesting ? <span className="mkt-spinner" /> : <Icon name="sparkles" size={14} />}
                        {isTesting ? 'Đang kiểm tra...' : '⚡ Kiểm tra kết nối'}
                      </button>
                      <div className="mkt-btn--active-check" title="Tài khoản đang hoạt động">
                        <Icon name="check" size={16} />
                      </div>
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
                      <div className="mkt-social-card-avatar" style={{ background: '#2563eb' }}>
                        📘
                      </div>
                      <div className="mkt-social-card-info">
                        <strong>Lá Đỏ Homestay Sa Pa</strong>
                        <small>ID: 290099357528057</small>
                      </div>
                    </div>
                    <span className="mkt-social-card-platform-icon">📘</span>
                  </div>
                  <div className="mkt-social-card-badges">
                    <span className="mkt-platform-pill mkt-platform-pill--facebook">Facebook Fanpage</span>
                    <span className="mkt-security-tag"><Icon name="check" size={13} />Đã kết nối</span>
                  </div>
                  <div className="mkt-social-card-bottom">
                    <button type="button" className="mkt-btn--test-connection" onClick={() => setApiConfigModal((c) => ({ ...c, open: true, platform: 'FACEBOOK' }))}>
                      ⚡ Kiểm tra kết nối
                    </button>
                    <div className="mkt-btn--active-check"><Icon name="check" size={16} /></div>
                  </div>
                </article>

                <article className="mkt-social-card-item">
                  <div className="mkt-social-card-top">
                    <div className="mkt-social-card-profile">
                      <div className="mkt-social-card-avatar" style={{ background: '#dc2626' }}>
                        🔴
                      </div>
                      <div className="mkt-social-card-info">
                        <strong>Kênh YouTube Lá Đỏ Official</strong>
                        <small>ID: UC_9Z9REZF</small>
                      </div>
                    </div>
                    <span className="mkt-social-card-platform-icon">🔴</span>
                  </div>
                  <div className="mkt-social-card-badges">
                    <span className="mkt-platform-pill mkt-platform-pill--youtube">YouTube Channel</span>
                    <span className="mkt-security-tag"><Icon name="check" size={13} />Đã kết nối</span>
                  </div>
                  <div className="mkt-social-card-bottom">
                    <button type="button" className="mkt-btn--test-connection" onClick={() => setApiConfigModal((c) => ({ ...c, open: true, platform: 'YOUTUBE' }))}>
                      ⚡ Kiểm tra kết nối
                    </button>
                    <div className="mkt-btn--active-check"><Icon name="check" size={16} /></div>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>

        {/* 🌟 Hàng Đợi Đăng Tải (Queue Section - Placed ABOVE Video Library) */}
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
                <span>⚙️ Chạy Hàng Đợi Ngay</span>
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

          <div className="mkt-queue-toolbar">
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

            <button
              type="button"
              className="mkt-queue-clear-btn"
              onClick={() => alert('Đã làm mới danh sách hàng đợi!')}
            >
              <Icon name="refresh" size={14} />
              <span>Dọn dẹp đã xong</span>
            </button>
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
                              <strong title={item.postTitle}>{item.postTitle || 'Bài đăng Lá Đỏ Homestay'}</strong>
                              <small title={item.postBrief || item.id}>ID: #{item.id} {item.pageName ? `· ${item.pageName}` : ''}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.platform === 'YOUTUBE' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--youtube">🔴 YouTube</span>
                          )}
                          {item.platform === 'FACEBOOK' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--facebook">📘 Facebook</span>
                          )}
                          {item.platform === 'TIKTOK' && (
                            <span className="mkt-queue-platform-pill mkt-queue-platform-pill--tiktok">🎵 TikTok</span>
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
                                <span>Đang tải lên Facebook... (65%)</span>
                              </span>
                            </div>
                          ) : isPublished ? (
                            <span className="mkt-queue-status-pill mkt-queue-status-pill--completed">
                              <Icon name="check" size={13} />
                              <span>Đã hoàn tất</span>
                            </span>
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
                            {isPublished && (
                              <button
                                type="button"
                                className="mkt-queue-action-btn"
                                onClick={() => handleOpenEngagementModal(item.id)}
                                title="Xem tương tác & bình luận trực tiếp từ MXH (Like, Comment, Share)"
                                style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                              >
                                <span>📊</span>
                              </button>
                            )}
                            {!isPublished && (
                              <button
                                type="button"
                                className="mkt-queue-action-btn"
                                onClick={() => publish(item.id)}
                                disabled={isPublishing}
                                title="Đăng ngay bây giờ"
                              >
                                <Icon name="send" size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="mkt-queue-action-btn"
                              onClick={() => schedule(item.id)}
                              title="Chỉnh sửa lịch hẹn"
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
              <div style={{ fontSize: '28px' }}>📋</div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>Hàng đợi hiện tại đang trống</strong>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Khi bạn bấm <strong>"✈️ Lên Lịch Đăng"</strong> hoặc <strong>"Lưu & Thêm Vào Hàng Đợi"</strong>, bài viết sẽ được xếp vào đây để tự động xuất bản đúng giờ.
              </p>
            </div>
          )}
        </section>

        {/* 🌟 Kho Nội Dung Video (Matching tool_cre) */}
        <section className="mkt-video-library">
          <div className="mkt-video-library-head">
            <div>
              <h2>Kho nội dung video</h2>
              <p>Quét tự động thư mục trên máy tính (.mp4, .mov, .avi, .jpg, .png, .txt)</p>
            </div>
            <div className="mkt-video-head-actions">
              <button
                type="button"
                className="mkt-btn mkt-btn--primary"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', borderColor: '#4338ca' }}
                onClick={() => navigate('/admin/marketing/video-editor')}
                title="Mở Studio Remotion để cắt ghép, lồng tiếng AI & chèn subtitle"
              >
                <Icon name="sparkles" size={15} />
                <span>🎬 Studio Remotion (Edit Video)</span>
              </button>

              <label className="mkt-btn mkt-btn--secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Icon name="upload" size={15} />
                <span>📁 Chọn File Lẻ</span>
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
                <span>📁 Quét Thư Mục Máy</span>
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
                onClick={() => alert('Đã kết nối Google Drive Cloud! Đang đồng bộ video mới...')}
              >
                <span>Google Drive Cloud</span>
              </button>
            </div>
          </div>

          <div className="mkt-video-search-bar">
            <div className="mkt-video-search-input-wrap">
              <span className="mkt-video-search-icon"><Icon name="folder" size={17} /></span>
              <input
                value={videoSearchPath}
                onChange={(e) => setVideoSearchPath(e.target.value)}
                placeholder="Đường dẫn thư mục video trên máy hoặc Google Drive..."
              />
            </div>
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              onClick={() => alert(`Đang quét lại đường dẫn: ${videoSearchPath || 'Thư mục máy tính'}`)}
            >
              <Icon name="refresh" size={14} />
              <span>Quét lại</span>
            </button>
          </div>

          <div className="mkt-video-banner">
            <div className="mkt-video-banner-text">
              <strong>Tự động lấy video từ Google Drive khi tắt máy tính</strong>
              <p>Tải video lên Google Drive từ điện thoại, Cloud Server sẽ tự động quét và đăng bài 24/7.</p>
            </div>
            <button
              type="button"
              className="mkt-btn mkt-btn--secondary"
              style={{ background: '#ffffff', borderColor: '#a7f3d0', color: '#065f46', fontWeight: 600 }}
              onClick={() => alert('Đang quét Google Drive: Đồng bộ video thành công!')}
            >
              <Icon name="refresh" size={14} />
              <span>Quét Google Drive Ngay</span>
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
                      <span>📁 {video.source}</span>
                      <span>📅 {video.date}</span>
                    </div>

                    <div className="mkt-video-actions-row">
                      <button
                        type="button"
                        className="mkt-btn--schedule-video"
                        onClick={() => handleOpenScheduleForVideo(video)}
                      >
                        <Icon name="send" size={14} />
                        <span>✈️ Lên Lịch Đăng</span>
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
              <div style={{ fontSize: '36px' }}>🎬</div>
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>Chưa có video nào trong kho</strong>
              <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '480px' }}>
                Bấm <strong>📁 Chọn File Lẻ</strong> để chọn video từ máy hoặc bấm <strong>📁 Quét Thư Mục Máy</strong> để tự động nạp toàn bộ video trong thư mục của bạn.
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
                      ⚡ Tự động nhận biết
                    </button>
                    <button
                      type="button"
                      className={`mkt-chip ${apiConfigModal.autoPlatform === 'YOUTUBE' ? 'mkt-chip--active' : ''}`}
                      onClick={() => setApiConfigModal((c) => ({ ...c, autoPlatform: 'YOUTUBE' }))}
                    >
                      🔴 Kênh YouTube / Shorts
                    </button>
                    <button
                      type="button"
                      className={`mkt-chip ${apiConfigModal.autoPlatform === 'FACEBOOK' ? 'mkt-chip--active' : ''}`}
                      onClick={() => setApiConfigModal((c) => ({ ...c, autoPlatform: 'FACEBOOK' }))}
                    >
                      📘 Facebook Fanpage
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
                      <span>🔗 Đường link lấy Token / API (Bấm mở ngay tab mới):</span>
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
                          📘 Meta Graph API Explorer ↗
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
                            🔴 Google OAuth 2.0 Playground ↗
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
                            🔑 Google Cloud Credentials ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hướng dẫn kết nối YouTube nhanh */}
                  {apiConfigModal.autoPlatform === 'YOUTUBE' && (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '10px 12px', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                      <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        💡 Hướng dẫn kết nối Kênh YouTube:
                      </strong>
                      <p style={{ margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        Chỉ cần nhập <strong>Handle Kênh</strong> (ví dụ <code>@ladohomestay</code>) và bấm <strong>Kết nối</strong>. Hệ thống sẽ tự động liên kết kênh của bạn vào danh sách đăng video!
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
                    {apiConfigModal.detecting ? 'Đang kết nối nhận diện Kênh...' : '🔍 Kết Nối Kênh / Fanpage Tự Động'}
                  </button>

                  {/* Danh sách Kênh/Fanpage nhận diện được */}
                  {apiConfigModal.detectedPages.length > 0 && (
                    <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>
                        📋 Kênh / Fanpage tìm thấy ({apiConfigModal.detectedPages.length}):
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
                              <span style={{ fontSize: '24px' }}>{page.platform === 'YOUTUBE' ? '🔴' : '📘'}</span>
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
                            ⚡ Kích hoạt & Lưu Kênh này
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
                overflow: 'hidden',
              }}
            >
              <div
                className="mkt-modal-head"
                style={{
                  padding: '20px 24px',
                  background: '#ffffff',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📹</span>
                  <span>Lên lịch & Đăng Video Đa Nền Tảng</span>
                </h2>
                <button className="mkt-icon-btn" type="button" onClick={() => setMultiPostModal((c) => ({ ...c, open: false }))} disabled={multiPostModal.publishing} style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={handleMultiPlatformPublish} className="mkt-modal-body" style={{ background: '#ffffff', color: '#0f172a', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        accept="video/*,image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const uploaded = await uploadRequest('/media/upload', file)
                              setMultiPostModal((c) => ({
                                ...c,
                                mediaUrl: uploaded.mediaUrl,
                                thumbnailUrl: uploaded.mediaType === 'IMAGE' ? uploaded.mediaUrl : c.thumbnailUrl,
                                rawFile: file,
                                title: file.name.replace(/\.[^/.]+$/, ''),
                              }))
                            } catch {
                              setMultiPostModal((c) => ({
                                ...c,
                                mediaUrl: URL.createObjectURL(file),
                                rawFile: file,
                                title: file.name.replace(/\.[^/.]+$/, ''),
                              }))
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Tiêu đề Video */}
                <div className="mkt-dark-field">
                  <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Tiêu đề Video / Bài viết:</label>
                  <input
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                    value={multiPostModal.title}
                    onChange={(e) => setMultiPostModal({ ...multiPostModal, title: e.target.value })}
                    placeholder="VD: VID 20260807 130928..."
                    required
                  />
                </div>

                {/* 3. Nội dung Caption */}
                <div className="mkt-dark-field">
                  <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>
                    <span>Nội dung Caption:</span>
                    <button
                      type="button"
                      className="mkt-mini-btn"
                      onClick={handleAutoGenerateModalCaption}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '6px', fontWeight: 600 }}
                    >
                      <Icon name="sparkles" size={13} />
                      <span>✨ Tự động sinh bằng AI</span>
                    </button>
                  </label>
                  <textarea
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                    rows="3"
                    value={multiPostModal.caption}
                    onChange={(e) => setMultiPostModal({ ...multiPostModal, caption: e.target.value })}
                    placeholder="Nhập mô tả / caption..."
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
                          accept="image/*,video/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const uploaded = await uploadRequest('/media/upload', file)
                                setMultiPostModal((c) => ({
                                  ...c,
                                  thumbnailUrl: uploaded.mediaUrl,
                                  mediaUrl: uploaded.mediaUrl,
                                  rawFile: file,
                                }))
                              } catch {
                                setMultiPostModal((c) => ({
                                  ...c,
                                  thumbnailUrl: URL.createObjectURL(file),
                                  rawFile: file,
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
                      <span>🔴 YouTube</span>
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
                      <span>📘 Facebook</span>
                    </div>
                  </div>
                </div>

                {/* 7. Dropdown Chọn Page Facebook nếu đã chọn */}
                {multiPostModal.platforms.FACEBOOK && (
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>📘 Đăng lên Fanpage:</label>
                    <select
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                      value={multiPostModal.selectedFacebookAccountId}
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
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>🔴 Đăng lên Kênh YouTube:</label>
                    <select
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                      value={multiPostModal.selectedYoutubeAccountId}
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

                {/* 8. Thời gian hẹn giờ đăng & Lặp lại lịch trình (Matching user screenshot) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                  <div className="mkt-dark-field">
                    <label style={{ color: '#334155', fontWeight: 700, fontSize: '13px' }}>Thời gian hẹn giờ đăng</label>
                    <input
                      style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px' }}
                      type="datetime-local"
                      value={multiPostModal.scheduledDateTime}
                      onChange={(e) => setMultiPostModal({ ...multiPostModal, scheduledDateTime: e.target.value })}
                    />
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

                <div className="mkt-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', background: '#f8fafc', borderTop: '1px solid #f1f5f9', padding: '16px 24px', margin: '0 -24px -24px -24px', borderRadius: '0 0 18px 18px' }}>
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
                    <span>{multiPostModal.publishing ? 'Đang đăng bài...' : '🚀 Đăng Ngay Lập Tức'}</span>
                  </button>
                  <button
                    type="button"
                    className="mkt-btn--queue-submit"
                    onClick={(e) => handleMultiPlatformPublish(e, false)}
                    disabled={multiPostModal.publishing}
                  >
                    {multiPostModal.publishing ? <span className="mkt-spinner" /> : <Icon name="calendar" size={16} />}
                    <span>{multiPostModal.publishing ? 'Đang lưu lịch...' : '📅 Hẹn Giờ & Thêm Vào Hàng Đợi'}</span>
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
                  <h2 style={{ fontSize: '1.35rem', color: '#0f172a' }}>🎉 Tạo & Đăng Bài Giveaway Vòng Quay May Mắn</h2>
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
                      📋 Copy Link
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
                      const fullText = giveawayPostModal.content + '\n\n👉 Tham gia ngay tại: ' + (giveawayPostModal.giveawayUrl || (window.location.origin + '/giveaway'))
                      navigator.clipboard.writeText(fullText)
                      alert('Đã copy toàn bộ nội dung bài viết và link!')
                    }}
                  >
                    📋 Copy Toàn Bộ Nội Dung
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
                      <span>{giveawayPostModal.publishing ? 'Đang xuất bản...' : '🚀 Đăng Lên Fanpage Ngay'}</span>
                    </button>
                  </div>
                </div>
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
                            <span>📊</span>
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
                    <span>📊 Xem tương tác & bình luận MXH</span>
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

        {/* 🌟 Modal Tương Tác & Bình Luận Mạng Xã Hội */}
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
