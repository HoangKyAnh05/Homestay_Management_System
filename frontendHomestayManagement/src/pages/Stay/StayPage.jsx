import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import './StayPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/stays'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

function authHeaders(json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${getStoredToken()}`,
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function ServiceIcon({ type }) {
  if (type === 'INVENTORY') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8.5 12 4l7 4.5v10.2a1.3 1.3 0 0 1-1.3 1.3H6.3A1.3 1.3 0 0 1 5 18.7V8.5Z" />
        <path d="M9 20v-6h6v6M8.5 9.5h7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
      <path d="m18.5 16 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
    </svg>
  )
}

function NavIcon({ type }) {
  const paths = {
    home: <><path d="m4 11 8-7 8 7" /><path d="M6.5 10v10h11V10M10 20v-6h4v6" /></>,
    extend: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M12 14v4M10 16h4" /></>,
    services: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="8" /></>,
    orders: <><path d="M7 4h10M7 9h10M7 14h7M7 19h5" /><path d="M4 4h.01M4 9h.01M4 14h.01M4 19h.01" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type] || paths.home}</svg>
}

function sourceLabel(source) {
  return source === 'STAY' ? 'Gọi trong kỳ ở' : 'Đã đặt trước'
}

async function fetchPortalData() {
  const [staysResponse, servicesResponse] = await Promise.all([
    fetch(`${API_BASE}/current`, { headers: authHeaders() }),
    fetch(`${API_BASE}/services`, { headers: authHeaders() }),
  ])
  const stayData = await staysResponse.json().catch(() => [])
  const serviceData = await servicesResponse.json().catch(() => [])
  if ([401, 403].includes(staysResponse.status) || [401, 403].includes(servicesResponse.status)) {
    logout()
    window.location.replace('/login?next=/stay')
    throw new Error('Phiên đăng nhập đã hết hạn.')
  }
  if (!staysResponse.ok) throw new Error(stayData.message || 'Không thể tải kỳ lưu trú.')
  if (!servicesResponse.ok) throw new Error(serviceData.message || 'Không thể tải dịch vụ.')
  return {
    stays: Array.isArray(stayData) ? stayData : [],
    services: Array.isArray(serviceData) ? serviceData : [],
  }
}

function StayPage() {
  const user = getStoredUser()
  const [stays, setStays] = useState([])
  const [services, setServices] = useState([])
  const [selectedAccessId, setSelectedAccessId] = useState('')
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') === 'extend' || window.location.hash === '#extend' ? 'extend' : 'home'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [notice, setNotice] = useState('')

  // Extension state
  const [extDays, setExtDays] = useState(1)
  const [checkingExt, setCheckingExt] = useState(false)
  const [extResult, setExtResult] = useState(null)
  const [extSaving, setExtSaving] = useState(false)
  const [extError, setExtError] = useState('')
  const [extSuccess, setExtSuccess] = useState('')

  const applyPortalData = (portalData) => {
    setStays(portalData.stays)
    setServices(portalData.services)
    setSelectedAccessId(current => (
      portalData.stays.some(stay => String(stay.accessId) === String(current))
        ? current
        : portalData.stays[0]?.accessId ? String(portalData.stays[0].accessId) : ''
    ))
  }

  const refreshPortal = async () => {
    setLoading(true)
    setError('')
    try {
      applyPortalData(await fetchPortalData())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!getStoredToken()) {
      window.location.replace('/login?next=/stay')
      return undefined
    }
    let cancelled = false
    fetchPortalData()
      .then(data => {
        if (!cancelled) {
          setStays(data.stays)
          setServices(data.services)
          setSelectedAccessId(data.stays[0]?.accessId ? String(data.stays[0].accessId) : '')
        }
      })
      .catch(loadError => {
        if (!cancelled) setError(loadError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedStay = useMemo(
    () => stays.find(stay => String(stay.accessId) === String(selectedAccessId)) || stays[0],
    [selectedAccessId, stays],
  )

  const allOrders = useMemo(
    () => stays.flatMap(stay => (stay.services || []).map(service => ({ ...service, roomNumber: stay.roomNumber }))),
    [stays],
  )
  const selectedStayTotal = useMemo(
    () => (selectedStay?.services || []).reduce((total, service) => total + Number(service.totalAmount || 0), 0),
    [selectedStay],
  )

  // Extension check handler
  const checkExtension = async (targetDays) => {
    if (!selectedStay?.bookingId) return
    setCheckingExt(true)
    setExtError('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my/${selectedStay.bookingId}/check-extension`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          bookingDetailId: selectedStay.bookingDetailId,
          additionalHours: null,
          additionalDays: targetDays,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra tình trạng phòng')
      setExtResult(data)
    } catch (err) {
      setExtError(err.message)
    } finally {
      setCheckingExt(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'extend' && selectedStay?.bookingId) {
      checkExtension(extDays)
    }
  }, [activeTab, selectedStay, extDays])

  const handleConfirmExtend = async (switchRoomId = null) => {
    if (!selectedStay?.bookingId) return
    setExtSaving(true)
    setExtError('')
    setExtSuccess('')
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my/${selectedStay.bookingId}/extend`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          bookingDetailId: selectedStay.bookingDetailId,
          additionalHours: null,
          additionalDays: extDays,
          switchRoomId: switchRoomId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể gia hạn lưu trú')
      setExtSuccess(
        switchRoomId
          ? '✓ Đã chuyển đổi sang phòng mới thành công! Bạn có thể tiếp tục lưu trú.'
          : `✓ Đã gia hạn thành công thêm ${extDays} ngày! Chúc bạn có kỳ nghỉ tuyệt vời!`
      )
      await refreshPortal()
      setTimeout(() => {
        checkExtension(extDays)
      }, 1000)
    } catch (err) {
      setExtError(err.message)
    } finally {
      setExtSaving(false)
    }
  }

  const orderService = async () => {
    if (!selectedStay || !selectedService) return
    setOrdering(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/${selectedStay.accessId}/services`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          serviceId: selectedService.id,
          type: selectedService.type,
          quantity,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể gửi yêu cầu dịch vụ.')
      setSelectedService(null)
      setNotice(`Đã ghi nhận ${data.service?.serviceName} cho phòng ${data.roomNumber}.`)
      await refreshPortal()
    } catch (orderError) {
      setError(orderError.message)
    } finally {
      setOrdering(false)
    }
  }

  const handleExitToHome = () => {
    window.location.assign('/home')
  }

  return (
    <main className="stay-page">
      <header className="stay-header">
        <div className="stay-header-copy">
          <span>HOME STAYS</span>
          <strong>Xin chào, {user?.fullName?.split(' ').at(-1) || 'bạn'}!</strong>
        </div>
        <div className="stay-header-actions">
          <a href="/profile" className="stay-user-avatar" aria-label="Thông tin cá nhân" title="Thông tin cá nhân">
            {user?.avatarUrl
              ? <img src={resolveImageUrl(user.avatarUrl)} alt="" />
              : <span>{(user?.fullName || user?.email || 'H').trim().charAt(0).toUpperCase()}</span>}
          </a>
          <a href="/home" className="stay-exit-btn" title="Về trang chủ" aria-label="Về trang chủ">
            <svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>
          </a>
        </div>
      </header>

      <div className="stay-content">
        {loading && <div className="stay-state">Đang chuẩn bị thông tin kỳ lưu trú...</div>}
        {!loading && error && <div className="stay-error" role="alert">{error}</div>}
        {!loading && !error && stays.length === 0 && (
          <section className="stay-empty">
            <span>🏠</span>
            <h1>Hiện không có kỳ lưu trú đang hoạt động</h1>
            <p>Khi bạn check-in, thông tin phòng và dịch vụ sẽ xuất hiện tại đây.</p>
            <a href="/home">Về trang chủ</a>
          </section>
        )}

        {!loading && stays.length > 0 && (
          <>
            {stays.length > 1 && (
              <div className="stay-room-switcher" aria-label="Chọn phòng">
                {stays.map(stay => (
                  <button
                    type="button"
                    key={stay.accessId}
                    className={String(stay.accessId) === String(selectedStay?.accessId) ? 'active' : ''}
                    onClick={() => setSelectedAccessId(String(stay.accessId))}
                  >
                    Phòng {stay.roomNumber}
                  </button>
                ))}
              </div>
            )}

            {notice && <div className="stay-notice" role="status">{notice}</div>}

            {activeTab === 'home' && selectedStay && (
              <>
                <section className="stay-room-card">
                  <div className="stay-room-card-shade" />
                  <div className="stay-room-card-content">
                    <div className="stay-room-card-top">
                      <span><i /> ĐANG LƯU TRÚ</span>
                      <b>{houseTypeName(selectedStay)}</b>
                    </div>
                    <div className="stay-room-title">
                      <small>PHÒNG CỦA BẠN</small>
                      <h1>{selectedStay.roomNumber}</h1>
                      <p>Booking {selectedStay.bookingCode || `#${selectedStay.bookingId}`}</p>
                    </div>
                    <div className="stay-dates">
                      <div><span>NHẬN PHÒNG</span><strong>{formatDateTime(selectedStay.actualCheckIn)}</strong></div>
                      <div><span>TRẢ PHÒNG DỰ KIẾN</span><strong>{formatDateTime(selectedStay.checkOutTarget)}</strong></div>
                    </div>
                  </div>
                </section>

                <section className="stay-quick">
                  <button type="button" onClick={() => setActiveTab('extend')}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                    <b>Book thêm ngày</b>
                    <small>Gia hạn lưu trú</small>
                    <i>→</i>
                  </button>
                  <button type="button" onClick={() => setActiveTab('services')}>
                    <span><ServiceIcon type="FACILITY" /></span>
                    <b>Gọi dịch vụ</b>
                    <small>Tiện ích tận phòng</small>
                    <i>→</i>
                  </button>
                  <button type="button" onClick={() => setActiveTab('orders')}>
                    <span><NavIcon type="orders" /></span>
                    <b>Chi phí dịch vụ</b>
                    <small>{formatMoney(selectedStayTotal)}</small>
                    <i>→</i>
                  </button>
                </section>

                <section className="stay-section">
                  <div className="stay-section-title">
                    <div><span>DÀNH CHO PHÒNG CỦA BẠN</span><h2>Dịch vụ nổi bật</h2></div>
                    <button type="button" onClick={() => setActiveTab('services')}>Xem tất cả</button>
                  </div>
                  <div className="stay-featured">
                    {services.slice(0, 3).map(service => (
                      <button type="button" key={`${service.type}-${service.id}`} onClick={() => { setSelectedService(service); setQuantity(1) }}>
                        <span><ServiceIcon type={service.type} /></span>
                        <strong>{service.name}</strong>
                        <small>{formatMoney(service.price)}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* TAB BOOK THÊM NGÀY / GIA HẠN LƯU TRÚ */}
            {activeTab === 'extend' && selectedStay && (
              <section className="stay-section" style={{ marginTop: '8px' }}>
                <div className="stay-section-title">
                  <div>
                    <span>GIA HẠN PHÒNG</span>
                    <h2>Book Thêm Ngày / Gia Hạn Lưu Trú</h2>
                  </div>
                  <button type="button" onClick={() => setActiveTab('home')}>← Về phòng</button>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                    marginBottom: '20px'
                  }}
                >
                  {extResult?.warningNotice && (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '16px',
                        lineHeight: '1.5'
                      }}
                    >
                      {extResult.warningNotice}
                    </div>
                  )}

                  {extError && (
                    <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px' }}>
                      {extError}
                    </div>
                  )}
                  {extSuccess && (
                    <div style={{ background: '#f0fdf4', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: 600 }}>
                      {extSuccess}
                    </div>
                  )}

                  {/* Info Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', background: '#f8fafc', borderRadius: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Phòng đang ở</div>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>Phòng {selectedStay.roomNumber} ({houseTypeName(selectedStay)})</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Giờ trả phòng hiện tại</div>
                      <strong style={{ fontSize: '15px', color: '#ea580c' }}>{formatDateTime(selectedStay.checkOutTarget || extResult?.currentCheckOut)}</strong>
                    </div>
                  </div>

                  {/* Days Selection */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      Chọn số ngày muốn book thêm (trả phòng lúc 11:00 trưa):
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[1, 2, 3, 5, 7].map((d) => (
                        <button
                          key={d}
                          type="button"
                          style={{
                            flex: '1 0 calc(50% - 8px)',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: extDays === d ? '2px solid #174f3b' : '1px solid #cbd5e1',
                            background: extDays === d ? '#174f3b' : '#ffffff',
                            color: extDays === d ? '#ffffff' : '#1e293b',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setExtDays(d)}
                        >
                          +{d} Ngày {d === 1 ? '(đến 11:00 ngày mai)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Check Result Box */}
                  {checkingExt ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      ⏳ Đang kiểm tra phòng trống theo thời gian thực...
                    </div>
                  ) : extResult ? (
                    extResult.currentRoomAvailable ? (
                      /* Room is free */
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px', marginTop: '12px' }}>
                        <div style={{ color: '#166534', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>✓ Phòng còn trống</div>
                        <p style={{ fontSize: '13px', color: '#15803d', margin: '0 0 14px' }}>{extResult.message}</p>
                        <div style={{ background: '#ffffff', borderRadius: '10px', padding: '12px', display: 'grid', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Thời gian trả phòng mới:</span>
                            <strong>{formatDateTime(extResult.newCheckOut)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Thời gian gia hạn:</span>
                            <strong>+{extResult.additionalDays || extDays} ngày</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                            <span style={{ color: '#334155', fontWeight: 600 }}>Phí gia hạn lưu trú:</span>
                            <strong style={{ color: '#16a34a', fontSize: '17px' }}>{formatMoney(extResult.extensionFee)}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#174f3b',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(23, 79, 59, 0.2)'
                          }}
                          disabled={extSaving}
                          onClick={() => handleConfirmExtend(null)}
                        >
                          {extSaving ? 'Đang xử lý...' : `✓ Xác nhận Book thêm ngày (${formatMoney(extResult.extensionFee)})`}
                        </button>
                      </div>
                    ) : (
                      /* Room is booked by another customer */
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px', padding: '18px', marginTop: '12px' }}>
                        <div style={{ color: '#c2410c', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>⚠️ Phòng đã có khách đặt trước</div>
                        <p style={{ fontSize: '13px', color: '#9a3412', margin: '0 0 14px' }}>
                          Phòng {extResult.roomNumber} đã có khách khác đặt trước cho ngày mai. Bạn có thể chọn đổi sang phòng trống khác dưới đây để tiếp tục lưu trú:
                        </p>

                        {extResult.alternativeRooms && extResult.alternativeRooms.length > 0 ? (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {extResult.alternativeRooms.map((alt) => (
                              <div key={alt.roomId} style={{ background: '#ffffff', border: '1px solid #ffedd5', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>Phòng {alt.roomNumber}</strong>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>{alt.roomTypeName} · Tối đa {alt.capacityAdults} người</span>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                                    {formatMoney(alt.totalPrice)} (+{extResult.additionalDays || extDays} ngày)
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ea580c',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                  disabled={extSaving}
                                  onClick={() => handleConfirmExtend(alt.roomId)}
                                >
                                  {extSaving ? 'Đang đổi...' : 'Đổi sang phòng này →'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: '#64748b' }}>Hiện tại các phòng khác cũng đã kín lịch cho ngày này.</div>
                        )}
                      </div>
                    )
                  ) : null}
                </div>
              </section>
            )}

            {activeTab === 'services' && (
              <section className="stay-section stay-service-section">
                <div className="stay-section-title"><div><span>DANH MỤC DỊCH VỤ</span><h2>Bạn đặt dịch vụ gì ?  </h2></div></div>
                <p className="stay-room-context">Yêu cầu sẽ được ghi nhận cho phòng <strong>{selectedStay?.roomNumber}</strong>.</p>
                <div className="stay-service-list">
                  {services.map(service => (
                    <article key={`${service.type}-${service.id}`}>
                      <div className="stay-service-image">
                        {service.imageUrl
                          ? <img src={resolveImageUrl(service.imageUrl)} alt="" />
                          : <span><ServiceIcon type={service.type} /></span>}
                      </div>
                      <div><strong>{service.name}</strong><small>{service.type === 'INVENTORY' ? 'Thuê vật dụng' : 'Dịch vụ tiện ích'}</small><b>{formatMoney(service.price)}</b></div>
                      <button type="button" onClick={() => { setSelectedService(service); setQuantity(1); setNotice('') }}>+</button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="stay-section stay-service-section">
                <div className="stay-section-title"><div><span>CHI PHÍ TRONG KỲ Ở</span><h2>Dịch vụ đã sử dụng</h2></div></div>
                {allOrders.length === 0 ? (
                  <div className="stay-orders-empty">Bạn chưa gọi dịch vụ nào trong kỳ lưu trú này.</div>
                ) : (
                  <div className="stay-order-list">
                    {allOrders.map(order => (
                      <article key={`${order.source || 'STAY'}-${order.id}-${order.roomNumber}`}>
                        <span><ServiceIcon type={order.type} /></span>
                        <div><strong>{order.serviceName}</strong><small>{sourceLabel(order.source)} · Phòng {order.roomNumber} · SL {order.quantity}</small></div>
                        <b>{formatMoney(order.totalAmount)}</b>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {stays.length > 0 && (
        <nav className="stay-bottom-nav">
          <button type="button" className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}><span><NavIcon type="home" /></span>Phòng</button>

          <button type="button" className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}><span><NavIcon type="services" /></span>Dịch vụ</button>
          <button type="button" className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}><span><NavIcon type="orders" /></span>Đã gọi</button>
        </nav>
      )}

      {selectedService && (
        <div className="stay-sheet-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedService(null)}>
          <section className="stay-sheet" role="dialog" aria-modal="true">
            <div className="stay-sheet-handle" />
            <span>{selectedService.type === 'INVENTORY' ? 'THUÊ VẬT DỤNG' : 'DỊCH VỤ TIỆN ÍCH'}</span>
            <h2>{selectedService.name}</h2>
            <p>Gửi đến phòng <strong>{selectedStay?.roomNumber}</strong></p>
            <div className="stay-quantity">
              <span>Số lượng</span>
              <div><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button><b>{quantity}</b><button type="button" onClick={() => setQuantity(value => Math.min(20, value + 1))}>+</button></div>
            </div>
            <div className="stay-sheet-total"><span>Tạm tính</span><strong>{formatMoney(Number(selectedService.price) * quantity)}</strong></div>
            <button className="stay-order-button" type="button" disabled={ordering} onClick={orderService}>{ordering ? 'Đang gửi...' : 'Xác nhận gọi dịch vụ'}</button>
          </section>
        </div>
      )}
    </main>
  )
}

export default StayPage
