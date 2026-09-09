import React, { useState, useEffect } from 'react'
import { getStoredUser, getStoredToken } from '../../services/authService'
import './CustomerVouchersPage.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ'
}

function formatDate(dateStr) {
  if (!dateStr) return 'Không giới hạn'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function authHeaders() {
  const token = getStoredToken() || localStorage.getItem('homeStayAccessToken') || localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const REWARD_PACKAGES = [
  {
    id: 'PACKAGE_20K',
    title: 'Voucher Lá Đỏ 20.000đ',
    points: 5,
    discountDisplay: '20.000đ',
    desc: 'Áp dụng cho đơn đặt phòng từ 200.000đ. Hạn dùng 30 ngày.',
    badge: 'Cần 5 Điểm',
    icon: '☕',
  },
  {
    id: 'PACKAGE_50K',
    title: 'Voucher Lá Đỏ 50.000đ',
    points: 10,
    discountDisplay: '50.000đ',
    desc: 'Áp dụng cho đơn đặt phòng từ 400.000đ. Hạn dùng 30 ngày.',
    badge: 'Cần 10 Điểm',
    icon: '🎫',
    popular: true,
  },
  {
    id: 'PACKAGE_100K',
    title: 'Voucher Lá Đỏ 100.000đ',
    points: 20,
    discountDisplay: '100.000đ',
    desc: 'Áp dụng cho đơn đặt phòng từ 800.000đ. Hạn dùng 30 ngày.',
    badge: 'Cần 20 Điểm',
    icon: '🏷️',
    popular: true,
  },
  {
    id: 'PACKAGE_10PCT',
    title: 'Voucher Giảm 10% Tối Đa 150K',
    points: 30,
    discountDisplay: 'Giảm 10%',
    desc: 'Áp dụng cho đơn đặt phòng từ 600.000đ. Tối đa 150.000đ. Hạn dùng 30 ngày.',
    badge: 'Cần 30 Điểm',
    icon: '✨',
  },
  {
    id: 'PACKAGE_200K',
    title: 'Voucher Tri Ân 200.000đ',
    points: 50,
    discountDisplay: '200.000đ',
    desc: 'Áp dụng cho đơn đặt phòng từ 1.500.000đ. Hạn dùng 45 ngày.',
    badge: 'Cần 50 Điểm',
    icon: '💎',
  },
  {
    id: 'PACKAGE_500K',
    title: 'Voucher VIP Lá Đỏ 500.000đ',
    points: 100,
    discountDisplay: '500.000đ',
    desc: 'Áp dụng cho đơn đặt phòng từ 3.000.000đ. Hạn dùng 60 ngày.',
    badge: 'Cần 100 Điểm',
    icon: '👑',
  },
]

export default function CustomerVouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [myRedeemedVouchers, setMyRedeemedVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'REDEEM_POINTS' | 'MY_REDEEMED' | 'HOMESTAY' | 'LUCKY'
  const [copiedCode, setCopiedCode] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemedSuccessModal, setRedeemedSuccessModal] = useState(null)

  useEffect(() => {
    const user = getStoredUser()
    setCurrentUser(user)
    fetchVouchers()
    if (getStoredToken()) {
      fetchUserProfile()
      fetchMyRedeemedVouchers()
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
      }
    } catch {
      // Ignored
    }
  }

  const fetchMyRedeemedVouchers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/vouchers/my-redeemed`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setMyRedeemedVouchers(Array.isArray(data) ? data : [])
      }
    } catch {
      // Ignored
    }
  }

  const fetchVouchers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/active`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Không thể tải danh sách voucher')
      const data = await res.json()
      setVouchers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Lỗi khi tải voucher')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 2500)
  }

  const handleApply = (code) => {
    window.location.assign(`/rooms?voucher=${encodeURIComponent(code)}`)
  }

  const handleRedeem = async (pkg) => {
    if (!getStoredToken()) {
      alert('Vui lòng đăng nhập để thực hiện đổi voucher bằng điểm tích lũy.')
      window.location.assign('/login?redirect=/vouchers')
      return
    }

    const currentPts = userProfile?.memberPoints ?? currentUser?.memberPoints ?? 0
    if (currentPts < pkg.points) {
      alert(`Bạn hiện có ${currentPts} điểm thưởng, chưa đủ ${pkg.points} điểm để đổi gói này. Hãy đặt phòng thêm tại homestay để tích lũy điểm nhé!`)
      return
    }

    if (!window.confirm(`Xác nhận đổi ${pkg.points} điểm thưởng lấy "${pkg.title}"?`)) {
      return
    }

    setRedeeming(true)
    try {
      const res = await fetch(`${API_BASE_URL}/customer/vouchers/redeem`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Đổi điểm thất bại')
      
      setRedeemedSuccessModal(data)
      // Refresh user points and list
      fetchUserProfile()
      fetchMyRedeemedVouchers()
    } catch (err) {
      alert(err.message || 'Lỗi trong quá trình đổi điểm')
    } finally {
      setRedeeming(false)
    }
  }

function getUsedVouchers() {
  try {
    const raw = localStorage.getItem('homestay_used_vouchers')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

  const currentPoints = userProfile?.memberPoints ?? currentUser?.memberPoints ?? 0
  const discountPercent = userProfile?.memberDiscountPercent ?? currentUser?.memberDiscountPercent ?? 0

  const filteredVouchers = vouchers.filter((v) => {
    const used = getUsedVouchers()
    const isUsed = used.some((u) => String(u || '').trim().toUpperCase() === String(v.code || '').trim().toUpperCase())
    if (isUsed) return false
    if (v.usageLimit != null && v.usedCount != null && Number(v.usedCount) >= Number(v.usageLimit)) return false

    if (activeTab === 'HOMESTAY') {
      return !v.code?.startsWith('LUCKY-') && !v.code?.startsWith('SPIN-')
    }
    if (activeTab === 'LUCKY') {
      return v.code?.startsWith('LUCKY-') || v.code?.startsWith('SPIN-')
    }
    return true
  })

  return (
    <div className="cvp-container">
      {/* Top Bar / Header */}
      <header className="cvp-header">
        <div className="cvp-header-left">
          <a href="/home" className="cvp-back-btn">
            ← Trang chủ
          </a>
          <div>
            <h1 className="cvp-title">Kho Voucher & Đổi Điểm Thưởng</h1>
            <p className="cvp-subtitle">Sưu tầm voucher khuyến mãi và đổi điểm tích lũy lấy mã giảm giá độc quyền</p>
          </div>
        </div>
        <div className="cvp-header-right">
          <a href="/rooms" className="cvp-book-now-btn">
            Đặt phòng ngay
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="cvp-main">
        {/* Loyalty Point Member Card Banner */}
        <div className="cvp-loyalty-card">
          <div className="cvp-loyalty-left">
            <span className="cvp-loyalty-eyebrow">Thành Viên Lá Đỏ Homestay</span>
            <h2>{userProfile?.fullName || currentUser?.fullName || 'Khách Hàng Thân Thiết'}</h2>
            <div className="cvp-loyalty-stats">
              <div className="cvp-stat-item">
                <span className="cvp-stat-label">Điểm Thưởng Tích Lũy</span>
                <strong className="cvp-stat-number">{currentPoints} <small>điểm</small></strong>
              </div>
              <div className="cvp-stat-divider" />
              <div className="cvp-stat-item">
                <span className="cvp-stat-label">Ưu Đãi Hạng Thành Viên</span>
                <strong className="cvp-stat-number">
                  {discountPercent > 0 ? `Giảm ${discountPercent}%` : 'Tích 1 điểm / 1 triệu'}
                </strong>
              </div>
            </div>
            <p className="cvp-loyalty-tip">
              💡 Mỗi 1.000.000đ khi đặt phòng bạn sẽ tích được 1 điểm thưởng. Dùng điểm để đổi mã voucher bên dưới!
            </p>
          </div>
          <div className="cvp-loyalty-right">
            <button
              type="button"
              className="cvp-loyalty-btn"
              onClick={() => setActiveTab('REDEEM_POINTS')}
            >
              🎁 Đổi Voucher Bằng Điểm
            </button>
            {getStoredToken() ? (
              <button
                type="button"
                className="cvp-loyalty-sub-btn"
                onClick={() => setActiveTab('MY_REDEEMED')}
              >
                Voucher của tôi ({myRedeemedVouchers.length})
              </button>
            ) : (
              <a href="/login?redirect=/vouchers" className="cvp-loyalty-sub-btn">
                Đăng nhập để tích điểm
              </a>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="cvp-tabs-wrapper">
          <div className="cvp-tabs">
            <button
              type="button"
              className={`cvp-tab-btn ${activeTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả voucher ({vouchers.length})
            </button>
            <button
              type="button"
              className={`cvp-tab-btn cvp-tab-btn--highlight ${activeTab === 'REDEEM_POINTS' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('REDEEM_POINTS')}
            >
              ✨ Đổi Điểm Thưởng ({REWARD_PACKAGES.length} gói)
            </button>
            {getStoredToken() && (
              <button
                type="button"
                className={`cvp-tab-btn ${activeTab === 'MY_REDEEMED' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('MY_REDEEMED')}
              >
                🎟️ Voucher Tôi Đã Đổi ({myRedeemedVouchers.length})
              </button>
            )}
            <button
              type="button"
              className={`cvp-tab-btn ${activeTab === 'HOMESTAY' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('HOMESTAY')}
            >
              Khuyến mãi Homestay
            </button>
            <button
              type="button"
              className={`cvp-tab-btn ${activeTab === 'LUCKY' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('LUCKY')}
            >
              Minigame Lucky
            </button>
          </div>
        </div>

        {/* TAB 1 & 4 & 5: PUBLIC VOUCHERS LIST */}
        {(activeTab === 'ALL' || activeTab === 'HOMESTAY' || activeTab === 'LUCKY') && (
          <>
            {loading && (
              <div className="cvp-status-box">
                <div className="cvp-spinner" />
                <p>Đang tìm kiếm ưu đãi tốt nhất cho bạn...</p>
              </div>
            )}

            {error && !loading && (
              <div className="cvp-error-box">
                <p>⚠️ {error}</p>
                <button type="button" onClick={fetchVouchers} className="cvp-retry-btn">
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && filteredVouchers.length > 0 && (
              <div className="cvp-grid">
                {filteredVouchers.map((v) => {
                  const isPercentage = String(v.discountType).toUpperCase() === 'PERCENTAGE'
                  const discountDisplay = isPercentage ? `${v.discountValue}%` : formatPrice(v.discountValue)
                  const isLucky = v.code?.startsWith('LUCKY-') || v.code?.startsWith('SPIN-')

                  return (
                    <div key={v.id || v.code} className={`cvp-card ${isLucky ? 'is-lucky' : ''}`}>
                      <div className="cvp-card-left">
                        <span className="cvp-discount-tag">{isPercentage ? 'GIẢM' : 'GIẢM TRỰC TIẾP'}</span>
                        <strong className="cvp-discount-value">{discountDisplay}</strong>
                        {v.maxDiscountAmount && isPercentage && (
                          <span className="cvp-max-discount">Tối đa {formatPrice(v.maxDiscountAmount)}</span>
                        )}
                      </div>

                      <div className="cvp-card-right">
                        <div className="cvp-card-header">
                          <h3 className="cvp-card-name">{v.name || 'Mã giảm giá phòng'}</h3>
                          {isLucky && <span className="cvp-badge-lucky">May mắn</span>}
                        </div>

                        <p className="cvp-card-desc">
                          {v.description || `Áp dụng giảm ${discountDisplay} cho tổng hóa đơn phòng.`}
                        </p>

                        <div className="cvp-card-meta">
                          <div className="cvp-meta-item">
                            <span>Đơn tối thiểu:</span>
                            <strong>{Number(v.minOrderAmount || 0) > 0 ? formatPrice(v.minOrderAmount) : '0đ'}</strong>
                          </div>
                          <div className="cvp-meta-item">
                            <span>Hạn dùng:</span>
                            <strong>{formatDate(v.endDate)}</strong>
                          </div>
                        </div>

                        <div className="cvp-card-actions">
                          <div className="cvp-code-box">
                            <span className="cvp-code-text">{v.code}</span>
                            <button
                              type="button"
                              className="cvp-btn-copy"
                              onClick={() => handleCopy(v.code)}
                              title="Sao chép mã"
                            >
                              {copiedCode === v.code ? '✓ Đã chép' : 'Sao chép'}
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cvp-btn-use"
                            onClick={() => handleApply(v.code)}
                          >
                            Áp dụng ngay →
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && !error && filteredVouchers.length === 0 && (
              <div className="cvp-empty-box">
                <div className="cvp-empty-icon">🎟️</div>
                <h3>Chưa có mã giảm giá nào trong mục này</h3>
                <p>Hãy quay lại sau hoặc theo dõi các sự kiện khuyến mãi của Lá Đỏ Homestay để nhận ưu đãi mới nhất!</p>
                <a href="/giveaway" className="cvp-giveaway-link">
                  🎯 Thử vận may tại Vòng quay may mắn
                </a>
              </div>
            )}
          </>
        )}

        {/* TAB 2: REDEEM VOUCHER WITH POINTS */}
        {activeTab === 'REDEEM_POINTS' && (
          <div className="cvp-redeem-section">
            <div className="cvp-section-header">
              <div>
                <h3>Đổi Điểm Thưởng Lấy Mã Giảm Giá Độc Quyền</h3>
                <p>Bạn đang có: <strong style={{ color: '#166534', fontSize: '1.1rem' }}>{currentPoints} điểm</strong>. Chọn gói ưu đãi bạn muốn quy đổi:</p>
              </div>
            </div>

            {/* Bảng quy tắc cộng điểm theo hóa đơn */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#166534', fontSize: '14.5px' }}>
                <span>🎯 Quy tắc tích lũy điểm thưởng khi đặt phòng:</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '13px'
              }}>
                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Đơn 400K - 799K</div>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>+5 điểm thưởng</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Đơn 800K - 1.49M</div>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>+12 điểm thưởng</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Đơn 1.5M - 2.99M</div>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>+25 điểm thưởng</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Đơn 3.0M - 4.99M</div>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>+50 điểm thưởng</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b' }}>Đơn từ 5.0M trở lên</div>
                  <strong style={{ color: '#b45309', fontSize: '14px' }}>+100 điểm thưởng 👑</strong>
                </div>
              </div>
            </div>

            <div className="cvp-redeem-grid">
              {REWARD_PACKAGES.map((pkg) => {
                const canRedeem = currentPoints >= pkg.points
                return (
                  <div key={pkg.id} className={`cvp-redeem-card ${pkg.popular ? 'is-popular' : ''}`}>
                    {pkg.popular && <span className="cvp-popular-badge">Phổ biến nhất</span>}
                    <div className="cvp-redeem-icon">{pkg.icon}</div>
                    <h4 className="cvp-redeem-title">{pkg.title}</h4>
                    <div className="cvp-redeem-price">
                      <span>Mức giảm</span>
                      <strong>{pkg.discountDisplay}</strong>
                    </div>
                    <p className="cvp-redeem-desc">{pkg.desc}</p>

                    <div className="cvp-redeem-footer">
                      <div className="cvp-points-required">
                        <span>Chi phí đổi</span>
                        <strong>{pkg.points} điểm</strong>
                      </div>
                      <button
                        type="button"
                        className={`cvp-btn-redeem ${canRedeem ? 'can-redeem' : 'cannot-redeem'}`}
                        disabled={redeeming}
                        onClick={() => handleRedeem(pkg)}
                      >
                        {redeeming ? 'Đang đổi...' : canRedeem ? 'Đổi ngay' : `Cần thêm ${pkg.points - currentPoints} điểm`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MY REDEEMED VOUCHERS */}
        {activeTab === 'MY_REDEEMED' && (
          <div className="cvp-my-redeemed-section">
            <div className="cvp-section-header">
              <div>
                <h3>Danh Sách Voucher Bạn Đã Đổi Bằng Điểm ({myRedeemedVouchers.length})</h3>
                <p>Các mã giảm giá riêng được cấp từ điểm thưởng tích lũy của bạn</p>
              </div>
            </div>

            {myRedeemedVouchers.length === 0 ? (
              <div className="cvp-empty-box">
                <div className="cvp-empty-icon">🎁</div>
                <h3>Bạn chưa đổi voucher nào bằng điểm</h3>
                <p>Hãy tích lũy điểm khi đặt phòng và quy đổi các voucher hấp dẫn tại mục &ldquo;Đổi Điểm Thưởng&rdquo; nhé!</p>
                <button
                  type="button"
                  className="cvp-giveaway-link"
                  onClick={() => setActiveTab('REDEEM_POINTS')}
                >
                  Khám phá các gói đổi điểm ngay →
                </button>
              </div>
            ) : (
              <div className="cvp-grid">
                {myRedeemedVouchers.map((v) => {
                  const isPercentage = String(v.discountType).toUpperCase() === 'PERCENTAGE'
                  const discountDisplay = isPercentage ? `${v.discountValue}%` : formatPrice(v.discountValue)
                  const isUsed = v.status === 'USED'
                  const isExpired = v.status === 'EXPIRED'

                  return (
                    <div key={v.id || v.code} className={`cvp-card ${isUsed ? 'is-used' : ''} ${isExpired ? 'is-expired' : ''}`}>
                      <div className="cvp-card-left" style={{ background: isUsed || isExpired ? '#94a3b8' : '#166534' }}>
                        <span className="cvp-discount-tag">ĐÃ ĐỔI</span>
                        <strong className="cvp-discount-value">{discountDisplay}</strong>
                        {v.maxDiscountAmount && isPercentage && (
                          <span className="cvp-max-discount">Tối đa {formatPrice(v.maxDiscountAmount)}</span>
                        )}
                      </div>

                      <div className="cvp-card-right">
                        <div className="cvp-card-header">
                          <h3 className="cvp-card-name">Voucher Đổi Điểm Riêng Của Bạn</h3>
                          {isUsed ? (
                            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ĐÃ SỬ DỤNG</span>
                          ) : isExpired ? (
                            <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>HẾT HẠN</span>
                          ) : (
                            <span style={{ fontSize: 11, background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>KHẢ DỤNG</span>
                          )}
                        </div>

                        <div className="cvp-card-meta">
                          <div className="cvp-meta-item">
                            <span>Đơn tối thiểu:</span>
                            <strong>{Number(v.minOrderValue || 0) > 0 ? formatPrice(v.minOrderValue) : '0đ'}</strong>
                          </div>
                          <div className="cvp-meta-item">
                            <span>Hạn dùng:</span>
                            <strong>{formatDate(v.endDate)}</strong>
                          </div>
                        </div>

                        {!isUsed && !isExpired ? (
                          <div className="cvp-card-actions">
                            <div className="cvp-code-box">
                              <span className="cvp-code-text">{v.code}</span>
                              <button
                                type="button"
                                className="cvp-btn-copy"
                                onClick={() => handleCopy(v.code)}
                                title="Sao chép mã"
                              >
                                {copiedCode === v.code ? '✓ Đã chép' : 'Sao chép'}
                              </button>
                            </div>

                            <button
                              type="button"
                              className="cvp-btn-use"
                              onClick={() => handleApply(v.code)}
                            >
                              Dùng ngay →
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                            {isUsed ? 'Mã này đã được áp dụng cho đơn đặt phòng trước đó.' : 'Mã đã hết hạn sử dụng.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Success Modal When Redeemed */}
      {redeemedSuccessModal && (
        <div className="cvp-modal-backdrop" onClick={() => setRedeemedSuccessModal(null)}>
          <div className="cvp-modal" onClick={e => e.stopPropagation()}>
            <div className="cvp-modal-icon">🎉</div>
            <h3>Đổi Voucher Thành Công!</h3>
            <p>Bạn đã quy đổi thành công mã voucher giảm giá:</p>

            <div className="cvp-modal-code-card">
              <span className="cvp-modal-code-label">Mã Giảm Giá Của Bạn</span>
              <div className="cvp-modal-code-value">{redeemedSuccessModal.code}</div>
              <p className="cvp-modal-code-meta">
                Mức giảm: <strong>{redeemedSuccessModal.discountType === 'PERCENTAGE' ? `${redeemedSuccessModal.discountValue}%` : formatPrice(redeemedSuccessModal.discountValue)}</strong>
                {' · '}Hạn dùng đến: <strong>{formatDate(redeemedSuccessModal.endDate)}</strong>
              </p>
              <button
                type="button"
                className="cvp-modal-copy-btn"
                onClick={() => handleCopy(redeemedSuccessModal.code)}
              >
                {copiedCode === redeemedSuccessModal.code ? '✓ Đã sao chép mã!' : '📋 Sao chép mã ngay'}
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', margin: '14px 0 0 0' }}>
              Điểm thưởng còn lại: <strong>{redeemedSuccessModal.remainingPoints} điểm</strong>
            </p>

            <div className="cvp-modal-actions">
              <button
                type="button"
                className="cvp-modal-btn-close"
                onClick={() => {
                  setRedeemedSuccessModal(null)
                  setActiveTab('MY_REDEEMED')
                }}
              >
                Xem trong kho voucher của tôi
              </button>
              <button
                type="button"
                className="cvp-modal-btn-apply"
                onClick={() => handleApply(redeemedSuccessModal.code)}
              >
                Đặt phòng ngay với mã này →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
