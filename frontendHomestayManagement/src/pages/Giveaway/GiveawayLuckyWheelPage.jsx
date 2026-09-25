import { useEffect, useRef, useState } from 'react'
import { getStoredUser } from '../../services/authService'
import './GiveawayLuckyWheelPage.css'

const API_PUBLIC = (import.meta.env.VITE_API_URL || '') + '/api/public/giveaway'

export const DEFAULT_LUXURY_PRIZES = [
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

export function getActiveWheelPrizes() {
  try {
    const saved = localStorage.getItem('la_do_lucky_wheel_custom_prizes')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length >= 4) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Error loading custom wheel prizes:', e)
  }
  return DEFAULT_LUXURY_PRIZES
}

export default function GiveawayLuckyWheelPage() {
  const [wheelPrizes, setWheelPrizes] = useState(getActiveWheelPrizes)
  const [config, setConfig] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    travelPlan: 'Trong tháng này',
    notes: '',
  })
  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [wonResult, setWonResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const canvasRef = useRef(null)
  const confettiCanvasRef = useRef(null)
  const currentRotationRef = useRef(0)

  // Auto-fill user profile if logged in
  useEffect(() => {
    try {
      const user = getStoredUser()
      if (user) {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || user.fullName || user.name || '',
          phone: prev.phone || user.phone || user.phoneNumber || '',
          email: prev.email || user.email || '',
        }))
      }
    } catch {}
  }, [])

  // Listen to cross-tab storage changes when Admin updates prizes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'la_do_lucky_wheel_custom_prizes') {
        setWheelPrizes(getActiveWheelPrizes())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Web Audio synthetic tick sound with dynamic pitch
  const playTickSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(620, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {
      // Audio context might be restricted
    }
  }

  // Fetch config & dynamic wheel prizes
  useEffect(() => {
    fetch(`${API_PUBLIC}/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setConfig(data)
          if (Array.isArray(data.prizes) && data.prizes.length >= 4) {
            setWheelPrizes(data.prizes)
            try {
              localStorage.setItem('la_do_lucky_wheel_custom_prizes', JSON.stringify(data.prizes))
            } catch {}
          }
        }
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
    const total = wheelPrizes.length
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
    wheelPrizes.forEach((prize, i) => {
      const startAngle = i * arc
      const endAngle = startAngle + arc

      const c1 = prize.sliceColor1 || prize.color || (i % 2 === 0 ? '#b91c1c' : '#d97706')
      const c2 = prize.sliceColor2 || prize.color || (i % 2 === 0 ? '#991b1b' : '#b45309')
      const txtColor = prize.textColor || '#ffffff'
      const title = prize.shortTitle || prize.name || prize.fullName || `Quà ${i + 1}`
      const sub = prize.subText || ''

      // Radial slice gradient
      const sliceGrad = ctx.createRadialGradient(center, center, 60, center, center, wheelRadius)
      sliceGrad.addColorStop(0, c1)
      sliceGrad.addColorStop(1, c2)

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

      // 3. Draw Clean Slice Typography
      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + arc / 2)

      // Position text along slice centerline
      const textX = wheelRadius * 0.64

      // Primary Title
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif'
      ctx.fillStyle = txtColor
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
      ctx.shadowBlur = 6
      ctx.fillText(title, textX, sub ? -10 : 0)

      // Secondary Subtext
      if (sub) {
        ctx.font = '600 15px "Plus Jakarta Sans", sans-serif'
        ctx.fillStyle = '#f5f5f4'
        ctx.shadowBlur = 4
        ctx.fillText(sub, textX, 18)
      }

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
    if (document.fonts) {
      document.fonts.ready.then(() => {
        drawWheel()
      })
    }
  }, [wheelPrizes])

  const handleSpinAnotherPhone = () => {
    setHasSpun(false)
    setWonResult(null)
    setErrorMsg('')
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      travelPlan: 'Trong tháng này',
      notes: '',
    })
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.transition = 'none'
      canvas.style.transform = 'rotate(0deg)'
      currentRotationRef.current = 0
    }
    window.scrollTo({ top: 320, behavior: 'smooth' })
  }

  // Unified 1-Click Spin Handler
  const handleStartSpin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (spinning || hasSpun) return
    setErrorMsg('')

    // 1. Form Validations
    if (!formData.fullName || !formData.fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.')
      const input = document.querySelector('input[name="fullName"]')
      if (input) input.focus()
      return
    }
    const phoneRegex = /^(0|\+84)(\d{9})$/
    if (!formData.phone || !phoneRegex.test(formData.phone.trim())) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (10 chữ số).')
      const input = document.querySelector('input[type="tel"]')
      if (input) input.focus()
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !formData.email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail/Email để nhận thông báo xác nhận và bằng chứng trúng thưởng.')
      const input = document.querySelector('input[type="email"]')
      if (input) input.focus()
      return
    }
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Địa chỉ Gmail/Email không đúng định dạng (VD: example@gmail.com).')
      const input = document.querySelector('input[type="email"]')
      if (input) input.focus()
      return
    }

    setSpinning(true)

    try {
      // Step 1: Register lead & get spin token
      const regRes = await fetch(`${API_PUBLIC}/register-spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const regData = await regRes.json()
      if (!regRes.ok) {
        throw new Error(regData.message || 'Không thể đăng ký lượt quay.')
      }
      const token = regData.spinToken

      // Step 2: Spin and get won prize result
      const spinRes = await fetch(`${API_PUBLIC}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinToken: token }),
      })
      const result = await spinRes.json()
      if (!spinRes.ok) {
        throw new Error(result.message || 'Lỗi khi quay số trúng thưởng.')
      }

      // Step 3: Exact Trigonometric Target Angle Calculation
      const total = wheelPrizes.length
      const arcDegrees = 360 / total
      const targetIndex = Number(result.targetIndex ?? 0)

      // In initial coordinates, center of slice targetIndex is at:
      const sliceCenter = targetIndex * arcDegrees + arcDegrees / 2
      // Pointer is at the top (12 o'clock, corresponding to 270 degrees in canvas coordinates)
      let baseRotation = (270 - sliceCenter) % 360
      if (baseRotation < 0) baseRotation += 360

      const currentRot = currentRotationRef.current || 0
      const currentMod = ((currentRot % 360) + 360) % 360
      const extraAngle = ((baseRotation - currentMod) + 360) % 360
      const extraRounds = 6 * 360 // 6 full spectacular rotations
      const finalRotation = currentRot + extraRounds + extraAngle

      currentRotationRef.current = finalRotation

      // Step 4: Apply Smooth Physics Deceleration Animation
      const canvas = canvasRef.current
      if (canvas) {
        canvas.style.transition = 'none'
        canvas.style.transform = `rotate(${currentRot}deg)`
        void canvas.offsetHeight // Force layout reflow
        canvas.style.transition = 'transform 5s cubic-bezier(0.12, 0.98, 0.24, 1)'
        requestAnimationFrame(() => {
          canvas.style.transform = `rotate(${finalRotation}deg)`
        })
      }

      // Step 5: Realistic Decelerating Mechanical Audio Ticks
      let tickCount = 0
      const maxTicks = 32
      const runTicker = (delay) => {
        if (tickCount < maxTicks) {
          playTickSound()
          tickCount++
          const nextDelay = 80 + Math.pow(tickCount / maxTicks, 2.4) * 280
          setTimeout(() => runTicker(nextDelay), nextDelay)
        }
      }
      runTicker(70)

      // Step 6: Reveal Winning Screen after 5.2 seconds
      setTimeout(() => {
        setSpinning(false)
        setHasSpun(true)
        setWonResult(result)
        launchConfetti()
      }, 5200)

    } catch (err) {
      setSpinning(false)
      setErrorMsg(err.message || 'Đã xảy ra lỗi khi quay.')
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

    for (let i = 0; i < 170; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: 0.08,
        life: 140,
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
      <div className="gw-navbar">
        <a href="/home" className="gw-nav-back">
          ← Về Trang Chủ Lá Đỏ Homestay
        </a>
        <div className="gw-nav-links">
          <a href="/rooms" className="gw-nav-link">
            Phòng nghỉ Sa Pa
          </a>
          <a href="/vouchers" className="gw-nav-link">
            Kho Voucher
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
            {/* Elegant Metallic Gold Pointer at Top Center */}
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
              disabled={spinning || hasSpun}
              onClick={handleStartSpin}
              title="Bấm để quay vòng may mắn"
            >
              {spinning ? '...' : hasSpun ? 'XONG' : 'QUAY'}
            </button>
          </div>

          {!hasSpun && (
            <p className="gw-wheel-hint">
              {spinning
                ? '🎰 Vòng quay đang chạy... Chúc bạn may mắn trúng giải thưởng lớn nhất!'
                : '👉 Điền thông tin bên phải và bấm nút "QUAY NGAY" để nhận giải thưởng!'}
            </p>
          )}
        </section>

        {/* Right: Form or Winner Result */}
        <section className="gw-card">
          {errorMsg && (
            <div className="gw-error-banner">
              <div className="gw-error-banner-content">
                <div>
                  <strong>⚠️ Thông báo:</strong> {errorMsg}
                </div>
                <button
                  type="button"
                  className="gw-btn-retry-phone"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, phone: '', email: '' }))
                    setErrorMsg('')
                  }}
                >
                  ✕ Nhập lại
                </button>
              </div>
            </div>
          )}

          {!hasSpun ? (
            <div>
              <div className="gw-card-header">
                <h2 className="gw-card-title">🎁 Thông Tin Nhận Lượt Quay</h2>
                <p className="gw-card-desc">
                  Điền thông tin chính xác để hệ thống gửi thư xác nhận kèm mã thưởng làm bằng chứng nhận giải!
                </p>
              </div>

              <form onSubmit={handleStartSpin}>
                <div className="gw-form-group">
                  <label className="gw-label">Họ và tên của bạn *</label>
                  <input
                    type="text"
                    name="fullName"
                    className="gw-input"
                    placeholder="VD: Nguyễn Thị Mai"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    disabled={spinning}
                  />
                </div>

                <div className="gw-form-group">
                  <div className="gw-label-row">
                    <label className="gw-label">Số điện thoại nhận quà *</label>
                    {formData.phone && !spinning && (
                      <button
                        type="button"
                        className="gw-btn-text-link"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, phone: '' }))
                          setErrorMsg('')
                        }}
                      >
                        Nhập số mới
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    className="gw-input"
                    placeholder="VD: 0912 345 678"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (errorMsg) setErrorMsg('')
                    }}
                    required
                    disabled={spinning}
                  />
                  <span className="gw-field-hint">
                    * Mỗi số điện thoại chỉ được quay 1 lần duy nhất.
                  </span>
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Gmail / Email nhận bằng chứng trúng thưởng *</label>
                  <input
                    type="email"
                    name="email"
                    className="gw-input"
                    placeholder="VD: nguyenvana@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errorMsg) setErrorMsg('')
                    }}
                    required
                    disabled={spinning}
                  />
                  <span className="gw-field-hint">
                    * Bắt buộc nhập Gmail để hệ thống gửi thư xác nhận & bằng chứng nhận thưởng về hộp thư của bạn.
                  </span>
                </div>

                <div className="gw-form-group">
                  <label className="gw-label">Dự định du lịch Sa Pa của bạn</label>
                  <select
                    className="gw-select"
                    value={formData.travelPlan}
                    onChange={(e) => setFormData({ ...formData, travelPlan: e.target.value })}
                    disabled={spinning}
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
                    disabled={spinning}
                  />
                </div>

                <button
                  type="submit"
                  className="gw-btn-submit"
                  disabled={spinning}
                >
                  {spinning ? '🎰 ĐANG QUAY VÒNG SỐ...' : '🎰 BẤM QUAY VÒNG MAY MẮN NGAY!'}
                </button>
              </form>
            </div>
          ) : (
            <div className="gw-winner-box">
              <span className="gw-winner-badge">🏆 CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG</span>
              <h3 className="gw-winner-title">{wonResult?.prizeName}</h3>
              <p className="gw-winner-msg">
                {wonResult?.congratulationsMessage}
              </p>

              <div className="gw-winner-code-wrap">
                <span className="gw-winner-code">{wonResult?.prizeCode}</span>
                <button type="button" className="gw-btn-copy" onClick={handleCopyCode}>
                  {copied ? '✓ Đã chép' : 'Chép mã'}
                </button>
              </div>

              {/* Email Sent Confirmation Alert Card */}
              <div className="gw-email-notice-card">
                <div className="gw-email-notice-icon">✉️</div>
                <div className="gw-email-notice-body">
                  <div className="gw-email-notice-title">Đã gửi bằng chứng trúng thưởng về Gmail!</div>
                  <div className="gw-email-notice-desc">
                    Hệ thống đã tự động gửi thư xác nhận giải thưởng kèm mã voucher <strong>{wonResult?.prizeCode}</strong> đến địa chỉ <strong>{formData.email}</strong>. Quý khách vui lòng kiểm tra hộp thư (hoặc mục Spam/Quảng cáo) để lưu lại bằng chứng nhận thưởng nhé!
                  </div>
                </div>
              </div>

              <p className="gw-winner-expiry">
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

              {/* Spin with another phone button */}
              <button
                type="button"
                className="gw-btn-spin-again"
                onClick={handleSpinAnotherPhone}
              >
                <span>🔄 Quay Lượt Khác (Nhập Số Điện Thoại & Gmail Mới)</span>
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
            <h3 className="gw-modal-title">
              🍁 Liên Hệ Lá Đỏ Homestay Sa Pa
            </h3>
            <p className="gw-modal-desc">
              Quý khách vui lòng cung cấp mã ưu đãi <strong>{wonResult?.prizeCode}</strong> để được nhân viên hỗ trợ giữ phòng và áp dụng giảm giá ngay!
            </p>

            <a href={`tel:${config?.hotline || '0981123456'}`} className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#ef444422', color: '#f87171' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="gw-contact-info">
                <h4>Hotline / Gọi Trực Tiếp</h4>
                <p>{config?.hotline || '0981 123 456'} (Hỗ trợ 24/7)</p>
              </div>
            </a>

            <a href={`https://zalo.me/${config?.zaloNumber || '0981123456'}`} target="_blank" rel="noreferrer" className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#0284c722', color: '#38bdf8' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="gw-contact-info">
                <h4>Chat Zalo Nhận Tư Vấn</h4>
                <p>Nhắn tin Zalo với Quản lý Lá Đỏ Homestay</p>
              </div>
            </a>

            <a href={config?.facebookMessengerUrl || 'https://m.me/ladohomestaysapa'} target="_blank" rel="noreferrer" className="gw-contact-item">
              <div className="gw-contact-icon" style={{ background: '#3b82f622', color: '#60a5fa' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10l3 3 5-5" strokeWidth="2.2" />
                </svg>
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
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span> Vào Trang Chủ Website Khách Hàng</span>
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
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fef08a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(254, 240, 138, 0.3)',
                }}
              >
                <span> Xem Danh Sách Phòng & Giá Ưu Đãi &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
