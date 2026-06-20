import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, getStoredUser, logout } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import '../Home/HomePage.css'
import './AmenitiesPage.css'

const amenityGroups = [
  { id: 'all', label: 'Tất cả' },
  { id: 'room', label: 'Trong phòng' },
  { id: 'shared', label: 'Không gian chung' },
  { id: 'service', label: 'Dịch vụ hỗ trợ' },
  { id: 'dining', label: 'Ẩm thực' },
]

const amenities = [
  {
    id: 1,
    name: 'Wi-Fi tốc độ cao',
    category: 'room',
    categoryLabel: 'Trong phòng',
    price: 0,
    schedule: 'Phục vụ 24/7',
    location: 'Toàn bộ khuôn viên',
    description: 'Kết nối ổn định trong phòng và mọi không gian chung, phù hợp cả nghỉ dưỡng lẫn làm việc từ xa.',
    image: '/home_1/image_2.jpg',
    icon: 'wifi',
    featured: true,
  },
  {
    id: 2,
    name: 'Bếp dùng chung',
    category: 'shared',
    categoryLabel: 'Không gian chung',
    price: 0,
    schedule: '06:00 – 22:00',
    location: 'Nhà sinh hoạt chung',
    description: 'Không gian bếp thoáng, đầy đủ dụng cụ cơ bản để bạn tự chuẩn bị những bữa ăn ấm cúng.',
    image: '/home_2/image_1.jpg',
    icon: 'kitchen',
    featured: true,
  },
  {
    id: 3,
    name: 'Sân vườn thư giãn',
    category: 'shared',
    categoryLabel: 'Không gian chung',
    price: 0,
    schedule: '06:00 – 22:00',
    location: 'Sân vườn phía sau',
    description: 'Khoảng xanh yên tĩnh để đọc sách, trò chuyện và tận hưởng không khí trong lành.',
    image: '/home_3/image_3.jpg',
    icon: 'fire',
    featured: true,
  },
  {
    id: 4,
    name: 'Bãi đỗ xe riêng',
    category: 'shared',
    categoryLabel: 'Không gian chung',
    price: 0,
    schedule: 'Phục vụ 24/7',
    location: 'Cổng chính Home Stays',
    description: 'Khu vực đỗ xe trong khuôn viên, thuận tiện di chuyển và được giám sát thường xuyên.',
    image: '/home_4/image_1.jpg',
    icon: 'parking',
    featured: true,
  },
  {
    id: 5,
    name: 'Dọn phòng theo yêu cầu',
    category: 'service',
    categoryLabel: 'Dịch vụ hỗ trợ',
    price: 0,
    schedule: '08:00 – 17:00',
    location: 'Tại phòng',
    description: 'Đội ngũ buồng phòng hỗ trợ làm sạch và bổ sung vật dụng để kỳ lưu trú luôn thoải mái.',
    image: '/home_4/image_2.jpg',
    icon: 'sparkle',
  },
  {
    id: 6,
    name: 'Hỗ trợ lễ tân',
    category: 'service',
    categoryLabel: 'Dịch vụ hỗ trợ',
    price: 0,
    schedule: 'Phục vụ 24/7',
    location: 'Quầy lễ tân',
    description: 'Luôn sẵn sàng hỗ trợ thông tin lưu trú, hành lý và những nhu cầu thiết yếu trong chuyến đi.',
    image: '/home_5/image_1.jpg',
    icon: 'shirt',
  },
  {
    id: 7,
    name: 'Điều hòa & nước nóng',
    category: 'room',
    categoryLabel: 'Trong phòng',
    price: 0,
    schedule: 'Phục vụ 24/7',
    location: 'Tất cả hạng phòng',
    description: 'Hệ thống điều hòa và nước nóng riêng, được kiểm tra trước mỗi lượt khách nhận phòng.',
    image: '/home_5/image_2.jpg',
    icon: 'temperature',
  },
  {
    id: 8,
    name: 'Không gian dùng bữa',
    category: 'dining',
    categoryLabel: 'Ẩm thực',
    price: 0,
    schedule: '06:00 – 22:00',
    location: 'Nhà ăn tầng trệt',
    description: 'Không gian dùng bữa chung thoáng sáng, phù hợp cho gia đình và nhóm bạn quây quần.',
    image: '/home_5/image_3.jpg',
    icon: 'coffee',
  },
]

const API_BASE_URL = 'http://localhost:8080/api'
const PENDING_SERVICE_KEY = 'homeStayPendingAmenityService'
const serviceImages = ['/home_3/image_3.jpg', '/home_5/image_1.jpg', '/home_5/image_3.jpg', '/home_2/image_2.jpg']

function serviceDescription(name) {
  const normalized = String(name || '').toLowerCase()
  if (normalized.includes('giặt')) return 'Chăm sóc trang phục thuận tiện trong suốt kỳ nghỉ của bạn.'
  if (normalized.includes('bbq') || normalized.includes('nướng')) return 'Chuẩn bị cho một buổi tối ấm cúng bên gia đình và bạn bè.'
  if (normalized.includes('sáng') || normalized.includes('ăn')) return 'Thưởng thức hương vị địa phương ngay tại Home Stays.'
  if (normalized.includes('xe') || normalized.includes('đón')) return 'Di chuyển nhẹ nhàng hơn với sự hỗ trợ từ đội ngũ của chúng tôi.'
  return 'Dịch vụ bổ sung giúp kỳ lưu trú của bạn thoải mái và trọn vẹn hơn.'
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function AmenityIcon({ type }) {
  const paths = {
    wifi: <><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M8.5 16a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></>,
    kitchen: <><path d="M6 2v8"/><path d="M3 2v5a3 3 0 0 0 6 0V2"/><path d="M6 10v12"/><path d="M15 2v20"/><path d="M15 2c4 2 5 7 0 10"/></>,
    fire: <path d="M12 22c4.4 0 8-3.6 8-8 0-3.4-2-6.4-5-8 .2 2.4-.8 4.2-2.2 5.1.1-3.8-2-7.2-5.3-9.1.3 4-3.5 6.7-3.5 12 0 4.4 3.6 8 8 8Z"/>,
    parking: <><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></>,
    sparkle: <><path d="m12 3-1.3 3.7L7 8l3.7 1.3L12 13l1.3-3.7L17 8l-3.7-1.3L12 3Z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14Z"/><path d="M18 14v8"/><path d="M14 18h8"/></>,
    shirt: <path d="m8 3-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0Z"/>,
    temperature: <><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/></>,
    coffee: <><path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 10h1a3 3 0 0 1 0 6h-1"/><path d="M7 4v1M11 3v2M15 4v1"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
}

function UserAvatar({ user }) {
  const avatarUrl = resolveImageUrl(user?.avatarUrl)
  return (
    <span className="home-user-avatar" aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : (
        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
      )}
    </span>
  )
}

function AmenitiesHeader() {
  const currentUser = getStoredUser()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <header className="home-header amenities-header">
      <a className="home-logo" href="/home">Home Stays</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/rooms">Phòng</a>
        <a href="/amenities" className="home-nav-active">Tiện nghi</a>
        <a href="/home#contact">Liên hệ</a>
        <a href="/home#about">Giới thiệu</a>
      </nav>
      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen(value => !value)}>
            <UserAvatar user={currentUser} />
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              <a href="/booking-history">Lịch sử đặt phòng</a>
              <a href="/profile">Thông tin cá nhân</a>
              <button type="button" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-actions"><a href="/login">Đăng nhập</a><a href="/register">Đăng ký</a></div>
      )}
    </header>
  )
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

function AmenitiesPage() {
  const [activeGroup, setActiveGroup] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [databaseServices, setDatabaseServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const [eligibleBookings, setEligibleBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const visibleAmenities = useMemo(() => amenities.filter(item => {
    const matchesGroup = activeGroup === 'all' || item.category === activeGroup
    const matchesPrice = priceFilter === 'all'
      || (priceFilter === 'free' ? item.price === 0 : item.price > 0)
    return matchesGroup && matchesPrice
  }), [activeGroup, priceFilter])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE_URL}/amenities`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ([]))
        if (!response.ok) throw new Error('Không thể tải dịch vụ lúc này.')
        return data
      })
      .then(data => setDatabaseServices(Array.isArray(data) ? data : []))
      .catch(error => {
        if (error.name !== 'AbortError') setServicesError(error.message)
      })
      .finally(() => setServicesLoading(false))
    return () => controller.abort()
  }, [])

  const rememberService = (service) => {
    window.sessionStorage.setItem(PENDING_SERVICE_KEY, JSON.stringify({
      type: 'FACILITY', serviceId: service.id, name: service.name,
    }))
  }

  const chooseService = async (service) => {
    setSuccessMessage('')
    setModalError('')
    rememberService(service)
    const token = getStoredToken()
    if (!token) {
      window.location.assign('/login?next=/amenities')
      return
    }
    setModalLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/amenities/eligible-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ([]))
      if (!response.ok) throw new Error(data.message || 'Không thể kiểm tra đơn đặt phòng.')
      if (!Array.isArray(data) || data.length === 0) {
        window.location.assign('/rooms?from=amenities')
        return
      }
      setSelectedService(service)
      setEligibleBookings(data)
      setSelectedBookingId(String(data[0].bookingId))
      setQuantity(1)
    } catch (error) {
      setModalError(error.message)
      setSelectedService(service)
    } finally {
      setModalLoading(false)
    }
  }

  const addServiceToBooking = async () => {
    const token = getStoredToken()
    if (!token || !selectedService || !selectedBookingId) return
    setModalLoading(true)
    setModalError('')
    try {
      const response = await fetch(`${API_BASE_URL}/amenities/bookings/${selectedBookingId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceId: selectedService.id, quantity: Number(quantity) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Không thể thêm dịch vụ vào đơn đặt phòng.')
      window.sessionStorage.removeItem(PENDING_SERVICE_KEY)
      setSelectedService(null)
      setSuccessMessage(`Đã thêm ${data.serviceName} vào booking #${data.bookingId}.`)
    } catch (error) {
      setModalError(error.message)
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="amenities-page">
      <AmenitiesHeader />
      <main>
        <section className="amenities-hero">
          <img src="/banner.png" alt="Không gian tiện nghi tại Home Stays" />
          <div className="amenities-hero-overlay" />
          <div className="amenities-hero-content">
            <span>TRỌN VẸN TỪ NHỮNG ĐIỀU NHỎ NHẤT</span>
            <h1>Tiện nghi dành cho<br />kỳ nghỉ của bạn</h1>
            <p>Từ căn phòng ấm áp đến khoảng sân xanh, mọi trải nghiệm đều được chuẩn bị để bạn thực sự thảnh thơi.</p>
            <a href="#explore">Khám phá tiện nghi <span>↓</span></a>
          </div>
          <div className="amenities-hero-note">
            <strong>24/7</strong><span>Luôn sẵn sàng<br />hỗ trợ bạn</span>
          </div>
        </section>

        <section className="bookable-services" id="services">
          <div className="bookable-services-head">
            <div><span>MỚI TẠI HOME STAYS</span><h2>Dịch vụ cho chuyến đi</h2><p>Thêm trực tiếp vào booking hiện tại hoặc chọn trước khi bắt đầu đặt phòng.</p></div>
            <a href="/booking-history">Xem chuyến đi của bạn</a>
          </div>
          {successMessage && <div className="amenities-success" role="status">✓ {successMessage}</div>}
          {servicesLoading ? (
            <div className="services-state">Đang tải dịch vụ...</div>
          ) : servicesError ? (
            <div className="services-state services-state-error">{servicesError}</div>
          ) : databaseServices.length === 0 ? (
            <div className="services-state">Hiện chưa có dịch vụ bổ sung đang hoạt động.</div>
          ) : (
            <div className="bookable-services-grid">
              {databaseServices.map((service, index) => (
                <article className="bookable-service-card" key={service.id}>
                  <div className="bookable-service-photo">
                    <img src={serviceImages[index % serviceImages.length]} alt={service.name} loading="lazy" />
                    <span>Dịch vụ</span>
                  </div>
                  <div className="bookable-service-body">
                    <h3>{service.name}</h3>
                    <p>{serviceDescription(service.name)}</p>
                    <div><strong>{Number(service.price) === 0 ? 'Miễn phí' : formatPrice(service.price)}</strong><span>/ lần</span></div>
                    <button type="button" disabled={modalLoading} onClick={() => chooseService(service)}>
                      {modalLoading ? 'Đang kiểm tra...' : 'Thêm vào chuyến đi'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="amenities-intro" id="explore">
          <div className="amenities-kicker">TRẢI NGHIỆM TẠI HOME STAYS</div>
          <div className="amenities-intro-grid">
            <h2>Không chỉ là một<br />nơi để nghỉ.</h2>
            <p>Mỗi tiện nghi tại Home Stays được chọn lọc để bạn có thể sống chậm lại, kết nối với thiên nhiên và tận hưởng thời gian bên những người thân yêu.</p>
          </div>
          <div className="amenities-highlights">
            {amenities.filter(item => item.featured).map((item, index) => (
              <article className="amenities-highlight-card" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="amenities-highlight-shade" />
                <span>0{index + 1}</span>
                <div><AmenityIcon type={item.icon} /><h3>{item.name}</h3><p>{item.location}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="amenities-catalog">
          <div className="amenities-catalog-head">
            <div><span className="amenities-kicker">DANH MỤC TIỆN NGHI</span><h2>Mọi thứ bạn cần,<br />ngay tại đây.</h2></div>
            <p>Khám phá các tiện nghi và dịch vụ được thiết kế cho một kỳ lưu trú dễ chịu, thuận tiện và đáng nhớ.</p>
          </div>

          <div className="amenities-filters" aria-label="Bộ lọc tiện nghi">
            <div className="amenities-group-tabs">
              {amenityGroups.map(group => (
                <button key={group.id} type="button" className={activeGroup === group.id ? 'active' : ''} onClick={() => setActiveGroup(group.id)}>{group.label}</button>
              ))}
            </div>
            <select aria-label="Lọc theo chi phí" value={priceFilter} onChange={event => setPriceFilter(event.target.value)}>
              <option value="all">Mọi mức phí</option>
              <option value="free">Miễn phí</option>
              <option value="paid">Có tính phí</option>
            </select>
          </div>

          <div className="amenities-result-count">{visibleAmenities.length} tiện nghi phù hợp</div>
          <div className="amenities-grid">
            {visibleAmenities.map(item => (
              <article className="amenity-card" key={item.id}>
                <div className="amenity-card-image">
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span className={item.price === 0 ? 'free' : 'paid'}>{item.price === 0 ? 'Miễn phí' : `Từ ${formatPrice(item.price)}`}</span>
                </div>
                <div className="amenity-card-body">
                  <div className="amenity-card-title"><span><AmenityIcon type={item.icon} /></span><div><small>{item.categoryLabel}</small><h3>{item.name}</h3></div></div>
                  <p>{item.description}</p>
                  <dl>
                    <div><dt>Thời gian</dt><dd>{item.schedule}</dd></div>
                    <div><dt>Vị trí</dt><dd>{item.location}</dd></div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="amenities-cta">
          <img src="/home_1/image.png" alt="Kỳ nghỉ tại Home Stays" />
          <div className="amenities-cta-shade" />
          <div><span>ĐÃ SẴN SÀNG CHO CHUYẾN ĐI?</span><h2>Chọn căn phòng<br />dành riêng cho bạn.</h2><p>Những ngày bình yên đang chờ ở Home Stays.</p><a href="/rooms">Khám phá phòng <b>→</b></a></div>
        </section>
      </main>

      {selectedService && (
        <div className="amenity-modal-overlay" onMouseDown={event => event.target === event.currentTarget && setSelectedService(null)}>
          <section className="amenity-reservation-modal" role="dialog" aria-modal="true" aria-labelledby="amenity-modal-title">
            <button className="amenity-modal-close" type="button" aria-label="Đóng" onClick={() => setSelectedService(null)}>×</button>
            <div className="amenity-modal-heading"><span>THÊM DỊCH VỤ</span><h2 id="amenity-modal-title">{selectedService.name}</h2><p>Chọn chuyến đi bạn muốn sử dụng dịch vụ này.</p></div>
            {modalError && <div className="amenity-modal-error">{modalError}</div>}
            {eligibleBookings.length > 0 && (
              <>
                <div className="amenity-booking-list">
                  {eligibleBookings.map(booking => (
                    <label className={String(booking.bookingId) === selectedBookingId ? 'selected' : ''} key={booking.bookingId}>
                      <input type="radio" name="booking" value={booking.bookingId} checked={String(booking.bookingId) === selectedBookingId} onChange={event => setSelectedBookingId(event.target.value)} />
                      <span><strong>Booking #{booking.bookingId} · {booking.roomTypeName}</strong><small>{formatDateTime(booking.checkInTarget)} → {formatDateTime(booking.checkOutTarget)} · {booking.roomCount} phòng</small></span>
                      <b>{booking.status}</b>
                    </label>
                  ))}
                </div>
                <div className="amenity-quantity-row"><span>Số lượng</span><div><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(value => Math.min(20, value + 1))}>+</button></div></div>
                <div className="amenity-total-row"><span>Tổng cộng</span><strong>{formatPrice(Number(selectedService.price) * quantity)}</strong></div>
                <button className="amenity-confirm-button" type="button" disabled={modalLoading} onClick={addServiceToBooking}>{modalLoading ? 'Đang thêm...' : 'Xác nhận thêm dịch vụ'}</button>
              </>
            )}
          </section>
        </div>
      )}

      <footer className="amenities-footer">
        <div><a className="home-logo" href="/home">Home Stays</a><p>Ngôi nhà thứ hai của bạn giữa thiên nhiên.</p></div>
        <nav><a href="/rooms">Phòng</a><a href="/amenities">Tiện nghi</a><a href="/home#contact">Liên hệ</a><a href="/home#about">Giới thiệu</a></nav>
        <p>© 2026 Home Stays. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default AmenitiesPage
