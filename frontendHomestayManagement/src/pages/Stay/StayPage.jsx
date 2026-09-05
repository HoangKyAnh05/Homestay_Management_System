import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { houseTypeName } from '../../utils/houseType'
import { resolveImageUrl } from '../../utils/imageUrl'
import './StayPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/stays'

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
    services: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="8" /></>,
    orders: <><path d="M7 4h10M7 9h10M7 14h7M7 19h5" /><path d="M4 4h.01M4 9h.01M4 14h.01M4 19h.01" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
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
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [notice, setNotice] = useState('')

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

  const handleLogout = () => {
    logout()
    window.location.replace('/login?next=/stay')
  }

  return (
    <main className="stay-page">
      <header className="stay-header">
        <div className="stay-header-copy">
          <span>HOME STAYS</span>
          <strong>Xin chào, {user?.fullName?.split(' ').at(-1) || 'bạn'}!</strong>
        </div>
        <div className="stay-header-actions">
          <a href="/profile" className="stay-user-avatar" aria-label="Thông tin cá nhân">
            {user?.avatarUrl
              ? <img src={resolveImageUrl(user.avatarUrl)} alt="" />
              : <span>{(user?.fullName || user?.email || 'H').trim().charAt(0).toUpperCase()}</span>}
          </a>
          <button type="button" onClick={handleLogout} aria-label="Đăng xuất">
            <svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>
          </button>
        </div>
      </header>

      <div className="stay-content">
        {loading && <div className="stay-state">Đang chuẩn bị thông tin kỳ lưu trú...</div>}
        {!loading && error && <div className="stay-error" role="alert">{error}</div>}
        {!loading && !error && stays.length === 0 && (
          <section className="stay-empty">
            <span>⌁</span>
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
                  <button type="button" onClick={() => setActiveTab('services')}><span><ServiceIcon type="FACILITY" /></span><b>Gọi dịch vụ</b><small>Tiện ích tận phòng</small><i>→</i></button>
                  <button type="button" onClick={() => setActiveTab('orders')}><span><NavIcon type="orders" /></span><b>Chi phí dịch vụ</b><small>{formatMoney(selectedStayTotal)}</small><i>→</i></button>
                </section>

                <section className="stay-section">
                  <div className="stay-section-title"><div><span>DÀNH CHO PHÒNG CỦA BẠN</span><h2>Dịch vụ nổi bật</h2></div><button type="button" onClick={() => setActiveTab('services')}>Xem tất cả</button></div>
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
