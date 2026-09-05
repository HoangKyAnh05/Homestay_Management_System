import { useEffect, useRef, useState } from 'react'
import './GiveawayLuckyWheelPage.css'

const API_PUBLIC = (import.meta.env.VITE_API_URL || '') + '/api/public/giveaway'

const LUXURY_PRIZES = [
  {
    index: 0,
    shortTitle: 'GIẢM 50%',
    subText: 'Toàn Chuyến Đi',
    fullName: 'Chuyến Đi Giảm Giá 50%',
    codePrefix: 'LADO50',
    discountPercent: 50,
    sliceColor1: '#b91c1c',
    sliceColor2: '#991b1b',
    textColor: '#fef08a',
  },
  {
    index: 1,
    shortTitle: 'GIẢM 30%',
    subText: 'Tiền Phòng Sa Pa',
    fullName: 'Voucher Giảm 30% Tiền Phòng',
    codePrefix: 'LADO30',
    discountPercent: 30,
    sliceColor1: '#d97706',
    sliceColor2: '#b45309',
    textColor: '#fef08a',
  },
  {
    index: 2,
    shortTitle: 'TẶNG BBQ',
    subText: 'Tiệc Nướng Sân Vườn',
    fullName: 'Tặng 01 Set Nướng BBQ Sân Vườn',
    codePrefix: 'LADOBBQ',
    discountPercent: 0,
    sliceColor1: '#15803d',
    sliceColor2: '#166534',
    textColor: '#ffffff',
  },
  {
    index: 3,
    shortTitle: 'GIẢM 20%',
    subText: 'Phòng View Săn Mây',
    fullName: 'Voucher Giảm 20% Tiền Phòng',
    codePrefix: 'LADO20',
    discountPercent: 20,
    sliceColor1: '#be185d',
    sliceColor2: '#9d174d',
    textColor: '#ffffff',
  },
  {
    index: 4,
    shortTitle: '02 ĐỒ UỐNG',
    subText: 'Ngắm Hoàng Hôn',
    fullName: 'Miễn Phí 02 Đồ Uống Ngắm Hoàng Hôn',
    codePrefix: 'LADODRINK',
    discountPercent: 0,
    sliceColor1: '#0d9488',
    sliceColor2: '#0f766e',
    textColor: '#ffffff',
  },
  {
    index: 5,
    shortTitle: 'VOUCHER 100K',
    subText: 'Đặt Phòng Ngay',
    fullName: 'Voucher Giảm 100K Khi Đặt Phòng',
    codePrefix: 'LADO100K',
    discountPercent: 10,
    sliceColor1: '#ea580c',
    sliceColor2: '#c2410c',
    textColor: '#ffffff',
  },
]

export default function GiveawayLuckyWheelPage() {
  const [config, setConfig] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    travelPlan: 'Trong tháng này',
    notes: '',
  })
  const [spinToken, setSpinToken] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [wonResult, setWonResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const canvasRef = useRef(null)
  const confettiCanvasRef = useRef(null)
  const currentRotationRef = useRef(0)

  // Web Audio synthetic tick sound
  const playTickSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(580, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {
      // Audio context might be restricted
    }
  }

  // Fetch config
  useEffect(() => {
    fetch(`${API_PUBLIC}/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setConfig(data)
      })
      .catch(() => {})
  }, [])

  // Draw Luxury Wheel (High-DPI Retina 800x800)
  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 800
    const center = size / 2
    const outerRadius = center - 16
    const rimWidth = 24
    const wheelRadius = outerRadius - rimWidth
    const total = LUXURY_PRIZES.length
    const arc = (2 * Math.PI) / total

    ctx.clearRect(0, 0, size, size)

    // 1. Draw Outer Metallic Gold Rim
    const rimGrad = ctx.createRadialGradient(center, center, wheelRadius, center, center, outerRadius)
    rimGrad.addColorStop(0, '#b45309')
    rimGrad.addColorStop(0.3, '#f59e0b')
    rimGrad.addColorStop(0.6, '#fef08a')
    rimGrad.addColorStop(0.85, '#d97706')
    rimGrad.addColorStop(1, '#78350f')

    ctx.beginPath()
    ctx.arc(center, center, outerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = rimGrad
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#451a03'
    ctx.stroke()

    // Decorative incandescent light bulbs around the rim
    const bulbCount = 24
    const bulbRadius = 6
    const bulbDistance = outerRadius - rimWidth / 2
    for (let b = 0; b < bulbCount; b++) {
      const bAngle = (b * 2 * Math.PI) / bulbCount
      const bx = center + Math.cos(bAngle) * bulbDistance
      const by = center + Math.sin(bAngle) * bulbDistance

      ctx.beginPath()
      ctx.arc(bx, by, bulbRadius, 0, 2 * Math.PI)
      ctx.fillStyle = b % 2 === 0 ? '#fffbeb' : '#fef08a'
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#92400e'
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // 2. Draw Wheel Slices
    LUXURY_PRIZES.forEach((prize, i) => {
      const startAngle = i * arc
      const endAngle = startAngle + arc

      // Radial slice gradient
      const sliceGrad = ctx.createRadialGradient(center, center, 60, center, center, wheelRadius)
      sliceGrad.addColorStop(0, prize.sliceColor1)
      sliceGrad.addColorStop(1, prize.sliceColor2)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, wheelRadius, startAngle, endAngle)
      ctx.lineTo(center, center)
      ctx.fillStyle = sliceGrad
      ctx.fill()

      // Golden divider line
      ctx.lineWidth = 2.5
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)'
      ctx.stroke()

      // 3. Draw Clean Slice Typography (2 Lines - Never overlaps center hub!)
      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + arc / 2)

      // Position text along slice centerline: distance is 62% of wheelRadius
      const textX = wheelRadius * 0.64

      // Primary Title (e.g. GIẢM 50%)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif'
      ctx.fillStyle = prize.textColor
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
      ctx.shadowBlur = 6
      ctx.fillText(prize.shortTitle, textX, -10)

      // Secondary Subtext (e.g. Toàn Chuyến Đi)
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif'
      ctx.fillStyle = '#f5f5f4'
      ctx.shadowBlur = 4
      ctx.fillText(prize.subText, textX, 18)

      ctx.restore()
    })

    // 4. Center Golden Bezel
    const centerHubRadius = 78
    const hubGrad = ctx.createRadialGradient(center, center, 10, center, center, centerHubRadius)
    hubGrad.addColorStop(0, '#fef08a')
    hubGrad.addColorStop(0.5, '#f59e0b')
    hubGrad.addColorStop(1, '#92400e')

    ctx.beginPath()
    ctx.arc(center, center, centerHubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.lineWidth = 3
    ctx.strokeStyle = '#451a03'
    ctx.stroke()
  }

  useEffect(() => {
    drawWheel()
  }, [])

  // Handle Form Submit -> Register Spin
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.')
      return
    }
    const phoneRegex = /^(0|\+84)(\d{9})$/
    if (!phoneRegex.test(formData.phone.trim())) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (10 chữ số).')
      return
    }

    try {
      const res = await fetch(`${API_PUBLIC}/register-spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Không thể nhận lượt quay.')
      }
      setSpinToken(data.spinToken)
      setErrorMsg('')
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Trigger Spin Action
  const handleSpinWheel = async () => {
    if (!spinToken || spinning || hasSpun) return
    setSpinning(true)
    setErrorMsg('')

    try {
      const res = await fetch(`${API_PUBLIC}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinToken }),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || 'Lỗi khi quay số.')
      }

      // Calculate Rotation
      const total = LUXURY_PRIZES.length
      const arcDegrees = 360 / total
      const targetIndex = result.targetIndex
      // Pointer is at top (270 degrees in standard canvas angles)
      const targetAngle = 270 - (targetIndex * arcDegrees + arcDegrees / 2)
      const extraRounds = 5 * 360
      const finalRotation = currentRotationRef.current + extraRounds + (targetAngle - (currentRotationRef.current % 360)) + 360

      currentRotationRef.current = finalRotation

      const canvas = canvasRef.current
      if (canvas) {
        canvas.style.transform = `rotate(${finalRotation}deg)`
      }

      // Sound ticker
      let ticks = 0
      const tickInterval = setInterval(() => {
        playTickSound()
        ticks++
        if (ticks > 26) clearInterval(tickInterval)
      }, 145)

      setTimeout(() => {
        clearInterval(tickInterval)
        setSpinning(false)
        setHasSpun(true)
        setWonResult(result)
        launchConfetti()
      }, 4500)
    } catch (err) {
      setSpinning(false)
      setErrorMsg(err.message)
    }
  }

  // Confetti Celebration
  const launchConfetti = () => {
    const canvas = confettiCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#ffffff']

    for (let i = 0; i < 160; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: 0.08,
        life: 130,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let active = false
      particles.forEach((p) => {
        if (p.life > 0) {
          active = true
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.22
          p.life--
          p.tiltAngle += p.tiltSpeed

          ctx.beginPath()
          ctx.lineWidth = p.size / 2
          ctx.strokeStyle = p.color
          ctx.moveTo(p.x + p.tilt, p.y)
          ctx.lineTo(p.x, p.y + p.tilt)
          ctx.stroke()
        }
      })
      if (active) requestAnimationFrame(animate)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    animate()
  }

  const handleCopyCode = () => {
    if (wonResult?.prizeCode) {
      navigator.clipboard.writeText(wonResult.prizeCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="gw-page">
      <canvas id="gw-confetti-canvas" ref={confettiCanvasRef} />

      {/* Top Navigation Bar */}
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <a href="/home" style={{ color: '#fef08a', textDecoration: 'none', fontSize: '13.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', padding: '7px 16px', borderRadius: '30px', border: '1px solid rgba(254, 240, 138, 0.25)' }}>
          ← Về Trang Chủ Lá Đỏ Homestay
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/rooms" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Phòng nghỉ
          </a>
          <a href="/home#about" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Giới thiệu
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="gw-hero">
        <div className="gw-brand-badge">🍁 Lá Đỏ Homestay Sa Pa • Tri Ân Du Khách</div>
        <h1 className="gw-title">VÒNG QUAY MAY MẮN • SĂN MÂY SA PA</h1>
        <p className="gw-subtitle">
          Chào đón bạn đến với thiên đường nghỉ dưỡng giữa thung lũng Mường Hoa! Điền thông tin nhận ngay 1 lượt quay miễn phí với cơ hội trúng chuyến đi giảm giá 50% cùng nhiều phần quà hấp dẫn.
        </p>
      </header>

      {/* Main Grid */}
      <div className="gw-container">
        {/* Left: The Wheel */}
        <section className="gw-wheel-section">
          <div className="gw-wheel-wrapper">
            {/* Elegant Metallic Gold Pointer */}
            <div className="gw-wheel-pointer">
              <svg viewBox="0 0 38 46" fill="none">
                <polygon points="19,46 2,4 36,4" fill="url(#goldPtrGrad)" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="19" cy="12" r="6" fill="#b91c1c" stroke="#fef08a" strokeWidth="2" />
                <defs>
                  <linearGradient id="goldPtrGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Canvas 800x800 for Ultra Sharp Text */}
            <canvas ref={canvasRef} className="gw-wheel-canvas" width={800} height={800} />

            {/* Center Spin Hub Button */}
            <button
              type="button"
              className="gw-wheel-center-btn"
              disabled={!spinToken || spinning || hasSpun}
              onClick={handleSpinWheel}
            >
              {spinning ? '...' : hasSpun ? 'XONG' : 'QUAY'}
            </button>
          </div>

          {!spinToken && (
            <p style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: 600, marginTop: '10px' }}>
              👉 Vui lòng điền thông tin bên cạnh để nhận 1 lượt quay miễn phí!
            </p>
          )}
          {spinToken && !hasSpun && (
            <p style={{ color: '#34d399', fontSize: '1rem', fontWeight: 700, marginTop: '10px' }}>
              ✨ Đã cấp lượt quay! Bạn hãy bấm nút &quot;QUAY&quot; ở tâm vòng quay!
            </p>
          )}
        </section>

        {/* Right: Form or Winner Result */}
        <section className="gw-card">
          {errorMsg && (
            <div style={{ background: '#f43f5e22', border: '1px solid #f43f5e', color: '#fda4af', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.92rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {!hasSpun ? (
            <div>
              <div className="gw-card-header">
                <h2 className="gw-card-title">🎁 Thông Tin Nhận Lượt Quay</h2>
                <p className="gw-card-desc">Thông tin của bạn được bảo mật tuyệt đối và chỉ dùng để trao mã ưu đãi đặt phòng trực tiếp.</p>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="gw-form-group">
                  <label className="gw-label">Họ và tên của bạn *</label>
                  <input
                    type="text"
                    className="gw-input"
                    placeholder="VD: Nguyễn Thị Mai"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={Boolean(spinToken)}
                  />
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Số điện thoại nhận quà *</label>
                  <input
                    type="tel"
                    className="gw-input"
                    placeholder="VD: 0912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={Boolean(spinToken)}
                  />
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Email (Nhận xác nhận voucher)</label>
                  <input
                    type="email"
                    className="gw-input"
                    placeholder="VD: ban@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={Boolean(spinToken)}
                  />
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Dự định du lịch Sa Pa của bạn</label>
                  <select
                    className="gw-select"
                    value={formData.travelPlan}
                    onChange={(e) => setFormData({ ...formData, travelPlan: e.target.value })}
                    disabled={Boolean(spinToken)}
                  >
                    <option value="Cuối tuần này">Cuối tuần này</option>
                    <option value="Trong tháng này">Trong tháng này</option>
                    <option value="Tháng sau">Tháng sau</option>
                    <option value="Mùa săn mây / Thu Đông">Mùa săn mây / Thu Đông</option>
                    <option value="Dịp Lễ / Tết sắp tới">Dịp Lễ / Tết sắp tới</option>
                  </select>
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Mong muốn trải nghiệm tại Lá Đỏ</label>
                  <textarea
                    className="gw-textarea"
                    placeholder="VD: Thích phòng ban công ngắm biển mây, cần dịch vụ BBQ nướng ngoài trời..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={Boolean(spinToken)}
                  />
                </div>

                {!spinToken ? (
                  <button type="submit" className="gw-btn-submit">
                    🎯 NHẬN LƯỢT QUAY MIỄN PHÍ NGAY
                  </button>
                ) : (
                  <button type="button" className="gw-btn-submit" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} onClick={handleSpinWheel} disabled={spinning}>
                    {spinning ? 'ĐANG QUAY VÒNG SỐ...' : '🎰 BẤM QUAY VÒNG MAY MẮN NGAY!'}
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="gw-winner-box">
              <span className="gw-winner-badge">🏆 CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG</span>
              <h3 className="gw-winner-title">{wonResult?.prizeName}</h3>
              <p style={{ color: '#e7e5e4', fontSize: '0.96rem', lineHeight: 1.5 }}>
                {wonResult?.congratulationsMessage}
              </p>

              <div className="gw-winner-code-wrap">
                <span className="gw-winner-code">{wonResult?.prizeCode}</span>
                <button type="button" className="gw-btn-copy" onClick={handleCopyCode}>
                  {copied ? '✓ Đã chép' : 'Chép mã'}
                </button>
              </div>

              <p style={{ color: '#a8a29e', fontSize: '0.85rem' }}>
                ⏳ {wonResult?.voucherExpiry || 'Hạn dùng: 30 ngày kể từ ngày nhận'}.
              </p>

              {/* Contact Button */}
              <button
                type="button"
                className="gw-btn-contact-now"
                onClick={() => setShowContactModal(true)}
              >
                📞 BẤM LIÊN HỆ ĐẶT PHÒNG & NHẬN GIẢI NGAY
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal Contact Popup */}
      {showContactModal && (
        <div className="gw-modal-backdrop" onClick={() => setShowContactModal(false)}>
          <div className="gw-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gw-modal-close" onClick={() => setShowContactModal(false)}>
              &times;
            </button>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 800, color: '#fef08a', marginBottom: '8px' }}>
              🍁 Liên Hệ Lá Đỏ Homestay Sa Pa
            </h3>
            <p style={{ color: '#d6d3d1', fontSize: '0.92rem', marginBottom: '22px', lineHeight: 1.5 }}>
              Quý khách vui lòng cung cấp mã ưu đãi <strong>{wonResult?.prizeCode}</strong> để được nhân viên hỗ trợ giữ phòng và áp dụng giảm giá ngay!
            </p>

            <a href={`tel:${config?.hotline || '0981123456'}`} className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#ef444422', color: '#f87171' }}>
                📞
              </div>
              <div className="gw-contact-info">
                <h4>Hotline / Gọi Trực Tiếp</h4>
                <p>{config?.hotline || '0981 123 456'} (Hỗ trợ 24/7)</p>
              </div>
            </a>

            <a href={`https://zalo.me/${config?.zaloNumber || '0981123456'}`} target="_blank" rel="noreferrer" className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#0284c722', color: '#38bdf8' }}>
                💬
              </div>
              <div className="gw-contact-info">
                <h4>Chat Zalo Nhận Tư Vấn</h4>
                <p>Nhắn tin Zalo với Quản lý Lá Đỏ Homestay</p>
              </div>
            </a>

            <a href={config?.facebookMessengerUrl || 'https://m.me/ladohomestaysapa'} target="_blank" rel="noreferrer" className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#3b82f622', color: '#60a5fa' }}>
                🌐
              </div>
              <div className="gw-contact-info">
                <h4>Facebook Messenger</h4>
                <p>Nhắn tin trực tiếp qua Fanpage Lá Đỏ Homestay</p>
              </div>
            </a>

            {/* Prominent Website Customer Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>🌐 Vào Trang Chủ Website Khách Hàng</span>
              </a>

              <a
                href="/rooms"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#38bdf8',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <span>🏡 Xem Danh Sách Phòng & Giá Ưu Đãi &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
