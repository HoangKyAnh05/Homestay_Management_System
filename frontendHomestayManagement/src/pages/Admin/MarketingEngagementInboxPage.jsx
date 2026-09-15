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
  BLOG: (
    <svg className="platform-icon blog" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
}

const AI_TONES = [
  { key: 'WARM', label: '🌿 Thân thiện & Lịch thiệp', desc: 'Xưng hô ấm áp, mến khách' },
  { key: 'BOOKING_INQUIRY', label: '📅 Tư vấn & Check phòng', desc: 'Mời kiểm tra ngày & báo giá tốt' },
  { key: 'GRATITUDE', label: '❤️ Cảm ơn & Tri ân', desc: 'Ghi nhận đóng góp chân thành' },
  { key: 'PROMO', label: '🎁 Voucher ưu đãi 10%', desc: 'Tặng mã giảm giá khuyến mãi' },
]

const QUICK_TEMPLATES = [
  { label: 'Chào & cảm ơn', text: 'Dạ chào bạn! Cảm ơn bạn đã luôn quan tâm và ủng hộ Lá Đỏ Homestay Sa Pa nhé ạ! Chúc bạn ngày mới an lành! 🌸✨' },
  { label: 'Mời check lịch phòng', text: 'Dạ chào bạn! Hiện bên mình còn một số phòng view núi và săn mây cực đẹp ạ. Bạn dự định đi vào ngày nào để Lá Đỏ kiểm tra và báo giá ưu đãi nhất nhé!' },
  { label: 'Hướng dẫn nhắn tin riêng', text: 'Dạ bạn nhắn tin trực tiếp cho Fanpage/Zalo để nhân viên tư vấn gửi hình ảnh phòng thực tế và hỗ trợ giữ lịch nhanh nhất ạ! 🌿' },
  { label: 'Tặng mã voucher giảm 10%', text: 'Dạ cảm ơn bạn! Lá Đỏ Homestay gửi tặng bạn mã voucher giảm 10% khi đặt phòng trực tiếp trong tháng này nhé. Nhắn inbox ngay để nhận ưu đãi nha! 🎁' },
]

export default function MarketingEngagementInboxPage() {
  const [posts, setPosts] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [comments, setComments] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, UNREPLIED, REPLIED

  // Reply Composer State
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [selectedTone, setSelectedTone] = useState('WARM')
  const [generatingAi, setGeneratingAi] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyStatusMap, setReplyStatusMap] = useState({}) // commentId -> status: 'UNREPLIED' | 'REPLIED' | 'FLAGGED'

  // Live Toast & Notifications
  const [toastMessage, setToastMessage] = useState(null)
  const [notifications, setNotifications] = useState([])
  const audioRef = useRef(null)

  // Load Posts & Channels
  const fetchPosts = async () => {
    setLoadingPosts(true)
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const postList = Array.isArray(data) ? data : []
        setPosts(postList)

        // Find all channels from published posts
        const allChannels = []
        postList.forEach((p) => {
          if (Array.isArray(p.channels)) {
            p.channels.forEach((c) => {
              allChannels.push({
                ...c,
                postTitle: p.title,
                postBrief: p.brief,
                postCreatedAt: p.createdAt,
              })
            })
          }
        })

        if (allChannels.length > 0 && !selectedChannel) {
          selectChannel(allChannels[0])
        }
      }
    } catch (err) {
      console.error('Error fetching marketing posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Load Channel Engagement & Comments
  const selectChannel = async (channel) => {
    setSelectedChannel(channel)
    setLoadingComments(true)
    setActiveCommentId(null)
    setReplyText('')
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/channels/${channel.id}/engagement`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
        const commentList = Array.isArray(data.comments) ? data.comments : []
        setComments(commentList)
      } else {
        setMetrics(null)
        setComments([])
      }
    } catch (err) {
      console.error('Error fetching engagement metrics:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  // Sync all channels metrics
  const handleSyncAll = async () => {
    setSyncingAll(true)
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/channels/sync-all-metrics`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const result = await res.json()
        showToast(`Đã đồng bộ chỉ số từ mạng xã hội (${result.syncedCount || 0} bài đăng)!`, 'success')
        await fetchPosts()
        if (selectedChannel) {
          await selectChannel(selectedChannel)
        }
      } else {
        showToast('Đồng bộ thất bại, vui lòng kiểm tra kết nối tài khoản.', 'error')
      }
    } catch (err) {
      showToast('Lỗi khi gửi yêu cầu đồng bộ.', 'error')
    } finally {
      setSyncingAll(false)
    }
  }

  // AI Suggestion Reply
  const handleGenerateAiReply = async (comment, tone = selectedTone) => {
    setGeneratingAi(true)
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/comments/suggest-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postTitle: selectedChannel?.postTitle || '',
          postContent: selectedChannel?.content || selectedChannel?.postBrief || '',
          commentText: comment.message || '',
          tone: tone,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.suggestedReply) {
          setReplyText(data.suggestedReply)
          showToast('Đã tạo câu trả lời gợi ý bằng AI!', 'info')
        }
      } else {
        showToast('Không thể lấy gợi ý AI, sử dụng mẫu mặc định.', 'warning')
      }
    } catch (err) {
      console.error('AI suggest reply error:', err)
    } finally {
      setGeneratingAi(false)
    }
  }

  // Submit Reply
  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi.', 'warning')
      return
    }

    setSubmittingReply(true)
    const token = getStoredToken()
    try {
      const res = await fetch(`${API_BASE}/api/admin/marketing/channels/${selectedChannel.id}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyText.trim(),
          responderName: 'Lá Đỏ Homestay Sa Pa (Quản trị viên)',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        showToast('Đã xuất bản câu trả lời thành công!', 'success')
        setReplyStatusMap((prev) => ({ ...prev, [commentId]: 'REPLIED' }))
        
        // Add new reply to comments list locally
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              const existingReplies = Array.isArray(c.replies) ? c.replies : []
              return {
                ...c,
                replies: [
                  ...existingReplies,
                  {
                    id: data.replyId || `rep_${Date.now()}`,
                    authorName: data.responderName || 'Lá Đỏ Homestay Sa Pa',
                    authorAvatar: data.responderAvatar || '',
                    message: replyText.trim(),
                    publishedAt: new Date().toISOString(),
                    isAdmin: true,
                  },
                ],
              }
            }
            return c
          })
        )

        setReplyText('')
        setActiveCommentId(null)
      } else {
        showToast('Gửi câu trả lời thất bại.', 'error')
      }
    } catch (err) {
      showToast('Lỗi mạng khi gửi câu trả lời.', 'error')
    } finally {
      setSubmittingReply(false)
    }
  }

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type, id: Date.now() })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Initial Load
  useEffect(() => {
    fetchPosts()
  }, [])

  // Flatten all channels from posts
  const allChannelsList = useMemo(() => {
    const list = []
    posts.forEach((p) => {
      if (Array.isArray(p.channels)) {
        p.channels.forEach((c) => {
          list.push({
            ...c,
            postTitle: p.title,
            postBrief: p.brief,
            postCreatedAt: p.createdAt,
          })
        })
      }
    })
    return list
  }, [posts])

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return allChannelsList.filter((c) => {
      const matchPlatform = platformFilter === 'ALL' || c.platform === platformFilter
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !searchQuery ||
        (c.postTitle && c.postTitle.toLowerCase().includes(q)) ||
        (c.pageName && c.pageName.toLowerCase().includes(q)) ||
        (c.content && c.content.toLowerCase().includes(q))
      return matchPlatform && matchSearch
    })
  }, [allChannelsList, platformFilter, searchQuery])

  // Filtered Comments
  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      const status = replyStatusMap[comment.id] || (comment.replies && comment.replies.length > 0 ? 'REPLIED' : 'UNREPLIED')
      if (statusFilter === 'UNREPLIED' && status === 'REPLIED') return false
      if (statusFilter === 'REPLIED' && status !== 'REPLIED') return false
      if (statusFilter === 'FLAGGED' && status !== 'FLAGGED') return false
      return true
    })
  }, [comments, statusFilter, replyStatusMap])

  // Stats
  const totalCommentsCount = comments.length
  const unrepliedCount = comments.filter(
    (c) => (replyStatusMap[c.id] || (c.replies && c.replies.length > 0 ? 'REPLIED' : 'UNREPLIED')) === 'UNREPLIED'
  ).length

  return (
    <AdminLayout activePage="engagement-inbox">
      <div className="engagement-inbox-shell">
        {/* Floating Toast */}
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

        {/* Top KPI & Action Bar */}
        <header className="inbox-header-card">
          <div className="inbox-header-title-wrap">
            <div className="inbox-badge-live">
              <span className="live-pulse" /> LIVE STREAM
            </div>
            <h1>Hộp thư Tương tác & Trả lời Bình luận</h1>
            <p className="inbox-subtitle">
              Quản lý phản hồi khách hàng tập trung trên Facebook Fanpage, YouTube, TikTok và Travel Blog cùng Trợ lý AI Lá Đỏ.
            </p>
          </div>

          <div className="inbox-header-actions">
            <button
              className={`btn-sync-all ${syncingAll ? 'syncing' : ''}`}
              onClick={handleSyncAll}
              disabled={syncingAll}
              title="Đồng bộ lại toàn bộ số like, share, comment từ MXH"
            >
              <svg className="sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>{syncingAll ? 'Đang đồng bộ...' : 'Đồng bộ chỉ số MXH'}</span>
            </button>
          </div>
        </header>

        {/* 4 Stats Cards */}
        <div className="inbox-summary-grid">
          <div className="summary-card stat-posts">
            <div className="stat-icon-wrap">📢</div>
            <div className="stat-content">
              <span className="stat-label">Tổng bài đăng</span>
              <strong className="stat-val">{allChannelsList.length}</strong>
              <span className="stat-hint">kênh xuất bản</span>
            </div>
          </div>

          <div className="summary-card stat-comments">
            <div className="stat-icon-wrap">💬</div>
            <div className="stat-content">
              <span className="stat-label">Bình luận bài này</span>
              <strong className="stat-val">{totalCommentsCount}</strong>
              <span className="stat-hint">lượt tương tác</span>
            </div>
          </div>

          <div className="summary-card stat-unreplied">
            <div className="stat-icon-wrap">⚡</div>
            <div className="stat-content">
              <span className="stat-label">Chưa trả lời</span>
              <strong className="stat-val">{unrepliedCount}</strong>
              <span className="stat-hint">cần chăm sóc</span>
            </div>
          </div>

          <div className="summary-card stat-rate">
            <div className="stat-icon-wrap">📈</div>
            <div className="stat-content">
              <span className="stat-label">Tỷ lệ tương tác</span>
              <strong className="stat-val">
                {metrics?.engagementRate != null ? `${Number(metrics.engagementRate).toFixed(1)}%` : '4.8%'}
              </strong>
              <span className="stat-hint">trên toàn bộ lượt xem</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="inbox-main-layout">
          {/* Left Column: Channels & Posts Selector */}
          <aside className="inbox-channels-sidebar">
            <div className="sidebar-search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm bài đăng hoặc kênh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Platform Filter Tabs */}
            <div className="platform-filter-tabs">
              <button
                className={`tab-btn ${platformFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('ALL')}
              >
                Tất cả
              </button>
              <button
                className={`tab-btn ${platformFilter === 'FACEBOOK' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('FACEBOOK')}
              >
                Facebook
              </button>
              <button
                className={`tab-btn ${platformFilter === 'YOUTUBE' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('YOUTUBE')}
              >
                YouTube
              </button>
              <button
                className={`tab-btn ${platformFilter === 'TIKTOK' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('TIKTOK')}
              >
                TikTok
              </button>
            </div>

            {/* Channel List */}
            <div className="channels-scroll-list">
              {loadingPosts ? (
                <div className="inbox-loading-state">
                  <div className="spinner" />
                  <p>Đang tải danh sách bài đăng...</p>
                </div>
              ) : filteredChannels.length === 0 ? (
                <div className="inbox-empty-state">
                  <p>Không có bài đăng nào phù hợp bộ lọc.</p>
                </div>
              ) : (
                filteredChannels.map((chan) => {
                  const isSelected = selectedChannel?.id === chan.id
                  const platformKey = chan.platform || 'FACEBOOK'
                  return (
                    <div
                      key={chan.id}
                      className={`channel-item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectChannel(chan)}
                    >
                      <div className="channel-item-header">
                        <span className={`channel-platform-tag tag-${platformKey.toLowerCase()}`}>
                          {PLATFORM_ICONS[platformKey]}
                          {platformKey}
                        </span>
                        <span className="channel-status-badge">{chan.status || 'PUBLISHED'}</span>
                      </div>
                      <h4 className="channel-post-title" title={chan.postTitle}>
                        {chan.postTitle || 'Bài đăng marketing'}
                      </h4>
                      <p className="channel-page-name">
                        📍 {chan.pageName || 'Lá Đỏ Homestay Sa Pa'}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Right Column: Active Conversation Stream */}
          <main className="inbox-thread-pane">
            {selectedChannel ? (
              <>
                {/* Active Post Summary Banner */}
                <div className="selected-post-banner">
                  <div className="post-banner-header">
                    <div className="post-platform-info">
                      {PLATFORM_ICONS[selectedChannel.platform || 'FACEBOOK']}
                      <div>
                        <h3>{selectedChannel.postTitle || 'Bài viết'}</h3>
                        <p className="post-meta">
                          Kênh: <strong>{selectedChannel.pageName || 'Lá Đỏ Homestay Fanpage'}</strong>
                          {selectedChannel.externalUrl && (
                            <a
                              href={selectedChannel.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="view-external-link"
                            >
                              Xem trên {selectedChannel.platform} ↗
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Post KPI Mini-Cards */}
                  <div className="post-kpi-bar">
                    <div className="kpi-mini">
                      <span className="kpi-icon">❤️</span>
                      <div>
                        <span className="kpi-num">{metrics?.likeCount || 0}</span>
                        <span className="kpi-lbl">Thích</span>
                      </div>
                    </div>
                    <div className="kpi-mini">
                      <span className="kpi-icon">💬</span>
                      <div>
                        <span className="kpi-num">{metrics?.commentCount || comments.length}</span>
                        <span className="kpi-lbl">Bình luận</span>
                      </div>
                    </div>
                    <div className="kpi-mini">
                      <span className="kpi-icon">🔄</span>
                      <div>
                        <span className="kpi-num">{metrics?.shareCount || 0}</span>
                        <span className="kpi-lbl">Chia sẻ</span>
                      </div>
                    </div>
                    <div className="kpi-mini">
                      <span className="kpi-icon">👁️</span>
                      <div>
                        <span className="kpi-num">{metrics?.viewCount || metrics?.reachCount || 0}</span>
                        <span className="kpi-lbl">Lượt xem</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Comment Status */}
                <div className="comments-filter-toolbar">
                  <div className="filter-group">
                    <span className="toolbar-label">Lọc bình luận:</span>
                    <button
                      className={`filter-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('ALL')}
                    >
                      Tất cả ({comments.length})
                    </button>
                    <button
                      className={`filter-chip ${statusFilter === 'UNREPLIED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('UNREPLIED')}
                    >
                      ⚡ Chưa trả lời ({unrepliedCount})
                    </button>
                    <button
                      className={`filter-chip ${statusFilter === 'REPLIED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('REPLIED')}
                    >
                      ✅ Đã trả lời ({comments.length - unrepliedCount})
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="comments-stream-container">
                  {loadingComments ? (
                    <div className="inbox-loading-state">
                      <div className="spinner" />
                      <p>Đang tải danh sách bình luận...</p>
                    </div>
                  ) : filteredComments.length === 0 ? (
                    <div className="inbox-empty-comments">
                      <div className="empty-icon">💬</div>
                      <h4>Chưa có bình luận nào phù hợp</h4>
                      <p>Bình luận mới từ khách hàng sẽ xuất hiện tự động tại đây khi có tương tác.</p>
                    </div>
                  ) : (
                    filteredComments.map((comment) => {
                      const isReplying = activeCommentId === comment.id
                      const isReplied =
                        replyStatusMap[comment.id] === 'REPLIED' ||
                        (comment.replies && comment.replies.length > 0)

                      return (
                        <div key={comment.id} className={`comment-bubble-card ${isReplying ? 'replying' : ''}`}>
                          <div className="comment-main-row">
                            <img
                              src={
                                comment.authorAvatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
                              }
                              alt={comment.authorName}
                              className="comment-avatar"
                            />
                            <div className="comment-body">
                              <div className="comment-author-bar">
                                <strong className="author-name">{comment.authorName || 'Khách hàng'}</strong>
                                <span className="comment-time">
                                  {comment.publishedAt
                                    ? new Date(comment.publishedAt).toLocaleString('vi-VN')
                                    : 'Vừa xong'}
                                </span>
                                {isReplied ? (
                                  <span className="badge-replied">✅ Đã trả lời</span>
                                ) : (
                                  <span className="badge-unreplied">⚡ Chưa trả lời</span>
                                )}
                              </div>
                              <p className="comment-content-text">{comment.message}</p>

                              {/* Comment Meta & Action Controls */}
                              <div className="comment-actions-bar">
                                <button
                                  className={`action-btn-reply ${isReplying ? 'active' : ''}`}
                                  onClick={() => {
                                    if (isReplying) {
                                      setActiveCommentId(null)
                                      setReplyText('')
                                    } else {
                                      setActiveCommentId(comment.id)
                                      setReplyText('')
                                    }
                                  }}
                                >
                                  ✍️ {isReplying ? 'Đóng soạn thảo' : 'Trả lời bình luận'}
                                </button>

                                <button
                                  className="action-btn-ai"
                                  onClick={() => {
                                    setActiveCommentId(comment.id)
                                    handleGenerateAiReply(comment, selectedTone)
                                  }}
                                  title="Trợ lý AI phân tích và đề xuất câu trả lời chuẩn xác"
                                >
                                  ✨ Gợi ý AI (1-Click)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Existing Replies Thread */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="nested-replies-list">
                              {comment.replies.map((rep) => (
                                <div key={rep.id} className="nested-reply-item">
                                  <img
                                    src={
                                      rep.authorAvatar ||
                                      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&auto=format&fit=crop'
                                    }
                                    alt={rep.authorName}
                                    className="reply-avatar"
                                  />
                                  <div className="reply-body">
                                    <div className="reply-header">
                                      <strong className="reply-author">
                                        {rep.authorName} {rep.isAdmin && <span className="admin-tag">Admin</span>}
                                      </strong>
                                      <span className="reply-time">
                                        {rep.publishedAt
                                          ? new Date(rep.publishedAt).toLocaleString('vi-VN')
                                          : 'Vừa xong'}
                                      </span>
                                    </div>
                                    <p className="reply-text">{rep.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Reply Composer Box */}
                          {isReplying && (
                            <div className="inline-reply-composer">
                              <div className="composer-header">
                                <span className="composer-title">
                                  Phản hồi với tư cách: <strong>Lá Đỏ Homestay Sa Pa (Quản trị viên)</strong>
                                </span>
                              </div>

                              {/* AI Style Presets */}
                              <div className="ai-tones-selector">
                                <span className="tones-title">💡 Chọn phong cách AI:</span>
                                <div className="tones-chips-grid">
                                  {AI_TONES.map((tone) => (
                                    <button
                                      key={tone.key}
                                      type="button"
                                      className={`tone-chip ${selectedTone === tone.key ? 'active' : ''}`}
                                      onClick={() => {
                                        setSelectedTone(tone.key)
                                        handleGenerateAiReply(comment, tone.key)
                                      }}
                                      title={tone.desc}
                                    >
                                      {tone.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Quick Templates */}
                              <div className="quick-templates-bar">
                                <span className="tpl-title">Mẫu nhanh:</span>
                                {QUICK_TEMPLATES.map((tpl, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="tpl-btn"
                                    onClick={() => setReplyText(tpl.text)}
                                  >
                                    {tpl.label}
                                  </button>
                                ))}
                              </div>

                              {/* Textarea */}
                              <div className="composer-textarea-wrap">
                                <textarea
                                  rows={3}
                                  placeholder="Nhập nội dung câu trả lời gửi đến khách hàng..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  disabled={generatingAi || submittingReply}
                                />
                                {generatingAi && (
                                  <div className="ai-generating-overlay">
                                    <div className="spinner small" />
                                    <span>AI đang tạo câu trả lời tối ưu...</span>
                                  </div>
                                )}
                              </div>

                              {/* Composer Footer Actions */}
                              <div className="composer-footer">
                                <span className="char-count">{replyText.length} ký tự</span>
                                <div className="composer-btn-group">
                                  <button
                                    type="button"
                                    className="btn-cancel-reply"
                                    onClick={() => {
                                      setActiveCommentId(null)
                                      setReplyText('')
                                    }}
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-submit-reply"
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={submittingReply || !replyText.trim()}
                                  >
                                    {submittingReply ? 'Đang xuất bản...' : 'Gửi câu trả lời 🚀'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="inbox-no-channel-selected">
                <div className="empty-icon">👈</div>
                <h3>Chọn một bài đăng từ danh sách bên trái</h3>
                <p>Xem toàn bộ chỉ số like, share, bình luận và trả lời tương tác nhanh chóng.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </AdminLayout>
  )
}
