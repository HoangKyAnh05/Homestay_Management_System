import { useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import './MarketingPages.css'

const CHANNELS = {
  facebook: { label: 'Facebook', short: 'f', color: '#1877f2' },
  instagram: { label: 'Instagram', short: '◎', color: '#d946ef' },
  tiktok: { label: 'TikTok', short: '♪', color: '#111827' },
}

const LOGS = [
  { id: 'POST-1028', title: 'Chạm vào bình yên giữa lòng Đà Lạt', channel: 'facebook', campaign: 'Mùa hè chữa lành', date: '30/06/2026 · 19:30', status: 'scheduled', reach: '—', engagement: '—' },
  { id: 'POST-1027', title: 'Một sáng thức dậy giữa rừng thông', channel: 'instagram', campaign: 'Mùa hè chữa lành', date: '29/06/2026 · 20:15', status: 'published', reach: '12.8K', engagement: '8,4%' },
  { id: 'POST-1026', title: 'Room tour: Pine View Studio', channel: 'tiktok', campaign: 'Khám phá phòng', date: '28/06/2026 · 18:00', status: 'published', reach: '31.2K', engagement: '12,1%' },
  { id: 'POST-1025', title: 'Ưu đãi giữa tuần — nghỉ 3 trả 2', channel: 'facebook', campaign: 'Stay longer', date: '27/06/2026 · 11:45', status: 'failed', reach: '—', engagement: '—' },
  { id: 'POST-1024', title: 'Góc ban công dành cho hai người', channel: 'instagram', campaign: 'Khoảnh khắc tại nhà', date: '26/06/2026 · 20:00', status: 'draft', reach: '—', engagement: '—' },
  { id: 'POST-1023', title: 'Bữa sáng địa phương tại Home Stays', channel: 'facebook', campaign: 'Ẩm thực bản địa', date: '25/06/2026 · 07:30', status: 'published', reach: '9.6K', engagement: '6,7%' },
]

const INITIAL_VOUCHERS = [
  { code: 'HELLOJULY', name: 'Chào tháng 7', type: 'percent', value: 15, min: '1.500.000đ', used: 38, limit: 100, period: '01/07 – 15/07/2026', status: 'scheduled' },
  { code: 'STAY3PAY2', name: 'Ở 3 đêm, ưu đãi 1 đêm', type: 'amount', value: 600000, min: '3.000.000đ', used: 67, limit: 80, period: '10/06 – 31/07/2026', status: 'active' },
  { code: 'WEEKDAY10', name: 'Giảm giá giữa tuần', type: 'percent', value: 10, min: '1.000.000đ', used: 124, limit: 200, period: '01/06 – 31/08/2026', status: 'active' },
  { code: 'WELCOME200', name: 'Chào khách hàng mới', type: 'amount', value: 200000, min: '1.200.000đ', used: 200, limit: 200, period: '01/04 – 30/06/2026', status: 'expired' },
]

const STATUS = {
  published: ['Đã đăng', 'success'],
  scheduled: ['Đã lên lịch', 'info'],
  draft: ['Bản nháp', 'neutral'],
  failed: ['Đăng lỗi', 'danger'],
  active: ['Đang hoạt động', 'success'],
  expired: ['Đã kết thúc', 'neutral'],
  paused: ['Tạm dừng', 'warning'],
}

function Icon({ name, size = 18 }) {
  const paths = {
    sparkles: <><path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z"/><path d="m5 13-.8 2.2L2 16l2.2.8L5 19l.8-2.2L8 16l-2.2-.8L5 13Z"/><path d="m18 13-1 2.7-2.7 1 2.7 1 1 2.7 1-2.7 2.7-1-2.7-1L18 13Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    ticket: <><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M13 5v2M13 10v4M13 17v2"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    wand: <><path d="m15 4 5 5L8 21H3v-5Z"/><path d="m6 14 5 5M6 3v4M4 5h4M18 14v4M16 16h4"/></>,
  }
  return <svg className="mkt-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function StatusBadge({ value }) {
  const [label, tone] = STATUS[value] || [value, 'neutral']
  return <span className={`mkt-status mkt-status--${tone}`}><i />{label}</span>
}

function Channel({ value, label = true }) {
  const channel = CHANNELS[value]
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

export function MarketingAIAgentPage() {
  const [channels, setChannels] = useState(['facebook', 'instagram'])
  const [tone, setTone] = useState('Ấm áp & truyền cảm hứng')
  const [goal, setGoal] = useState('Tăng nhận diện thương hiệu')
  const [brief, setBrief] = useState('Giới thiệu không gian nghỉ dưỡng yên tĩnh giữa rừng thông, phù hợp cho cặp đôi muốn “chữa lành” cuối tuần.')
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')

  const toggleChannel = (value) => {
    setChannels(current => current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value])
  }

  const generate = () => {
    if (!brief.trim()) {
      setMessage('Hãy nhập mô tả ngắn để AI có chất liệu sáng tạo.')
      return
    }
    if (!channels.length) {
      setMessage('Chọn ít nhất một kênh đăng bài.')
      return
    }
    setMessage('')
    setGenerated(true)
  }

  const copyPost = async () => {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <AdminLayout activePage="ai-post-agent">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Trợ lý nội dung"
          title="AI Agent Đăng bài"
          description="Biến ý tưởng thành nội dung phù hợp từng kênh và lên lịch trong vài phút."
          action={<button className="mkt-btn mkt-btn--secondary" type="button"><Icon name="clock" />Xem lịch nội dung</button>}
        />

        <div className="mkt-ai-grid">
          <section className="mkt-card mkt-compose">
            <div className="mkt-section-title">
              <span className="mkt-section-number">01</span>
              <div><h2>Thiết lập bài đăng</h2><p>Cho AI biết mục tiêu và câu chuyện bạn muốn kể.</p></div>
            </div>

            <div className="mkt-field">
              <label>Kênh đăng bài <em>*</em></label>
              <div className="mkt-channel-options">
                {Object.keys(CHANNELS).map((key) => (
                  <button key={key} type="button" className={channels.includes(key) ? 'is-selected' : ''} onClick={() => toggleChannel(key)}>
                    <Channel value={key} />{channels.includes(key) && <Icon name="check" size={15} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mkt-form-row">
              <label className="mkt-field">Mục tiêu bài viết
                <select value={goal} onChange={event => setGoal(event.target.value)}>
                  <option>Tăng nhận diện thương hiệu</option>
                  <option>Thu hút lượt đặt phòng</option>
                  <option>Quảng bá ưu đãi</option>
                  <option>Tăng tương tác cộng đồng</option>
                </select>
              </label>
              <label className="mkt-field">Giọng điệu
                <select value={tone} onChange={event => setTone(event.target.value)}>
                  <option>Ấm áp & truyền cảm hứng</option>
                  <option>Trẻ trung & gần gũi</option>
                  <option>Sang trọng & tinh tế</option>
                  <option>Hài hước & bắt trend</option>
                </select>
              </label>
            </div>

            <label className="mkt-field">
              <span>Ý tưởng hoặc mô tả ngắn <em>*</em><small>{brief.length}/500</small></span>
              <textarea maxLength="500" rows="5" value={brief} onChange={event => setBrief(event.target.value)} placeholder="Ví dụ: Quảng bá phòng Pine View cho kỳ nghỉ cuối tuần..." />
            </label>

            <div className="mkt-upload">
              <span><Icon name="image" size={22} /></span>
              <div><strong>Thêm ảnh hoặc video</strong><p>Kéo thả tệp vào đây hoặc chọn từ thư viện phòng</p></div>
              <button type="button">Chọn tệp</button>
            </div>

            {message && <p className="mkt-inline-error">{message}</p>}
            <button className="mkt-btn mkt-btn--primary mkt-generate" type="button" onClick={generate}>
              <Icon name="wand" />Tạo nội dung với AI <span>⌘ Enter</span>
            </button>
          </section>

          <aside className="mkt-card mkt-preview">
            <div className="mkt-preview-head">
              <div><span>XEM TRƯỚC</span><h2>Nội dung đề xuất</h2></div>
              <button type="button" onClick={copyPost}><Icon name={copied ? 'check' : 'copy'} />{copied ? 'Đã sao chép' : 'Sao chép'}</button>
            </div>

            <div className="mkt-preview-tabs">
              {(channels.length ? channels : ['facebook']).map((channel, index) => (
                <button className={index === 0 ? 'is-active' : ''} type="button" key={channel}><Channel value={channel} /></button>
              ))}
            </div>

            <div className="mkt-social-card">
              <div className="mkt-social-author">
                <span className="mkt-brand-avatar">H</span>
                <div><strong>Home Stays</strong><small>Được tài trợ · 🌐</small></div>
                <Icon name="more" />
              </div>
              <div className="mkt-social-copy">
                {generated ? (
                  <>
                    <p><strong>Đôi khi, điều ta cần chỉ là một cuối tuần thật chậm. 🌲</strong></p>
                    <p>Thức giấc giữa mùi thông dịu nhẹ, nhâm nhi tách cà phê bên ô cửa và để thành phố ở lại phía sau.</p>
                    <p>Home Stays đang chờ bạn viết nên một kỳ nghỉ thật riêng. Đặt phòng hôm nay để nhận ưu đãi 15% cho hành trình tháng 7.</p>
                    <p className="mkt-hashtags">#HomeStays #DaLatGetaway #ChuaLanh #WeekendEscape</p>
                  </>
                ) : (
                  <div className="mkt-empty-preview"><Icon name="sparkles" size={28} /><strong>Nội dung của bạn sẽ xuất hiện tại đây</strong><span>Điền thông tin và chọn “Tạo nội dung với AI”.</span></div>
                )}
              </div>
              <div className="mkt-social-image"><div><Icon name="image" size={28} /><span>Ảnh phòng Pine View</span></div></div>
              <div className="mkt-social-stats"><span>❤️ 2,4K</span><span>128 bình luận · 46 lượt chia sẻ</span></div>
            </div>

            <div className="mkt-preview-actions">
              <button className="mkt-btn mkt-btn--secondary" type="button"><Icon name="calendar" />Lên lịch</button>
              <button className="mkt-btn mkt-btn--primary" type="button"><Icon name="send" />Đăng ngay</button>
            </div>
          </aside>
        </div>

        <section className="mkt-card mkt-suggestions">
          <div className="mkt-suggestions-title"><span><Icon name="sparkles" /></span><div><h2>Gợi ý nội dung hôm nay</h2><p>Dựa trên lịch đặt phòng và xu hướng tương tác gần đây.</p></div></div>
          <div className="mkt-suggestion-list">
            {[
              ['Ưu đãi lấp đầy ngày thường', 'Còn 6 phòng trống từ Thứ 2 – Thứ 5', 'Ưu đãi'],
              ['Một ngày tại Home Stays', 'Video hậu trường đang có tương tác tốt', 'Reels'],
              ['Review từ khách hàng', 'Bạn có 8 đánh giá 5 sao mới trong tuần', 'Cộng đồng'],
            ].map(item => <button type="button" key={item[0]}><span>{item[2]}</span><strong>{item[0]}</strong><small>{item[1]}</small><Icon name="arrow" /></button>)}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

export function MarketingPostLogsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(LOGS[1])

  const filteredLogs = useMemo(() => LOGS.filter(log => {
    const matchesQuery = `${log.title} ${log.id} ${log.campaign}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'all' || log.status === status)
  }), [query, status])

  return (
    <AdminLayout activePage="post-logs">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Theo dõi chiến dịch"
          title="Nhật ký bài đăng"
          description="Theo dõi trạng thái xuất bản và hiệu quả nội dung trên mọi kênh."
          action={<button className="mkt-btn mkt-btn--primary" type="button"><Icon name="plus" />Tạo bài đăng</button>}
        />

        <section className="mkt-metrics">
          <MetricCard icon="send" label="Bài đã đăng" value="42" detail="+8 trong tháng này" tone="blue" />
          <MetricCard icon="calendar" label="Đã lên lịch" value="7" detail="Trong 14 ngày tới" tone="violet" />
          <MetricCard icon="eye" label="Tổng tiếp cận" value="184.2K" detail="+18,6% so với tháng trước" tone="green" />
          <MetricCard icon="trend" label="Tương tác TB" value="8,7%" detail="Cao hơn 2,1% ngành lưu trú" tone="orange" />
        </section>

        <section className="mkt-card mkt-table-card">
          <div className="mkt-toolbar">
            <div className="mkt-search"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm theo nội dung, mã bài..." /></div>
            <div className="mkt-filter-tabs">
              {[['all', 'Tất cả'], ['published', 'Đã đăng'], ['scheduled', 'Đã lên lịch'], ['draft', 'Bản nháp'], ['failed', 'Đăng lỗi']].map(([value, label]) => (
                <button className={status === value ? 'is-active' : ''} type="button" key={value} onClick={() => setStatus(value)}>{label}</button>
              ))}
            </div>
            <button className="mkt-icon-btn" type="button" title="Bộ lọc nâng cao"><Icon name="filter" /></button>
          </div>

          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead><tr><th>Nội dung</th><th>Kênh</th><th>Thời gian</th><th>Trạng thái</th><th>Tiếp cận</th><th>Tương tác</th><th /></tr></thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} onClick={() => setSelected(log)} className={selected?.id === log.id ? 'is-selected' : ''}>
                    <td><strong>{log.title}</strong><small>{log.id} · {log.campaign}</small></td>
                    <td><Channel value={log.channel} /></td>
                    <td>{log.date}</td>
                    <td><StatusBadge value={log.status} /></td>
                    <td><strong>{log.reach}</strong></td>
                    <td>{log.engagement}</td>
                    <td><button className="mkt-row-more" type="button"><Icon name="more" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filteredLogs.length && <div className="mkt-empty-table"><Icon name="search" size={26} /><strong>Không tìm thấy bài đăng</strong><span>Thử thay đổi từ khóa hoặc trạng thái lọc.</span></div>}
          <footer className="mkt-table-footer"><span>Hiển thị {filteredLogs.length} / {LOGS.length} bài đăng</span><div><button type="button" disabled>‹</button><button type="button" className="is-active">1</button><button type="button">2</button><button type="button">›</button></div></footer>
        </section>

        {selected && (
          <section className="mkt-card mkt-log-detail">
            <div className="mkt-log-detail-copy">
              <span>CHI TIẾT BÀI ĐĂNG</span>
              <h2>{selected.title}</h2>
              <p>{selected.id} · Chiến dịch {selected.campaign}</p>
            </div>
            <div><small>Kênh</small><Channel value={selected.channel} /></div>
            <div><small>Thời gian</small><strong>{selected.date}</strong></div>
            <div><small>Trạng thái</small><StatusBadge value={selected.status} /></div>
            <button className="mkt-btn mkt-btn--secondary" type="button">Xem nội dung <Icon name="arrow" /></button>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}

export function MarketingVouchersPage() {
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')
  const [form, setForm] = useState({ name: '', code: '', type: 'percent', value: '', min: '', limit: '', start: '', end: '' })
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => vouchers.filter(voucher => {
    const matches = `${voucher.code} ${voucher.name}`.toLowerCase().includes(query.toLowerCase())
    return matches && (status === 'all' || voucher.status === status)
  }), [query, status, vouchers])

  const copyCode = (code) => {
    setCopiedCode(code)
    window.setTimeout(() => setCopiedCode(''), 1400)
  }

  const saveVoucher = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập tên chương trình.'
    if (!form.code.trim()) nextErrors.code = 'Vui lòng nhập mã voucher.'
    if (!form.value || Number(form.value) <= 0) nextErrors.value = 'Giá trị phải lớn hơn 0.'
    if (!form.start || !form.end) nextErrors.period = 'Vui lòng chọn thời gian áp dụng.'
    if (form.start && form.end && form.start > form.end) nextErrors.period = 'Ngày kết thúc phải sau ngày bắt đầu.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setVouchers(current => [{
      code: form.code.toUpperCase(),
      name: form.name,
      type: form.type,
      value: Number(form.value),
      min: form.min ? `${Number(form.min).toLocaleString('vi-VN')}đ` : '0đ',
      used: 0,
      limit: Number(form.limit) || 100,
      period: `${form.start.split('-').reverse().join('/')} – ${form.end.split('-').reverse().join('/')}`,
      status: 'scheduled',
    }, ...current])
    setModalOpen(false)
    setForm({ name: '', code: '', type: 'percent', value: '', min: '', limit: '', start: '', end: '' })
    setErrors({})
  }

  return (
    <AdminLayout activePage="vouchers">
      <div className="mkt-page">
        <PageHeader
          eyebrow="Khuyến mãi"
          title="Mã giảm giá"
          description="Tạo và quản lý ưu đãi giúp tăng tỷ lệ lấp đầy và giữ chân khách hàng."
          action={<button className="mkt-btn mkt-btn--primary" type="button" onClick={() => setModalOpen(true)}><Icon name="plus" />Tạo voucher</button>}
        />

        <section className="mkt-metrics">
          <MetricCard icon="ticket" label="Đang hoạt động" value="2" detail="1 chương trình sắp bắt đầu" tone="green" />
          <MetricCard icon="trend" label="Lượt sử dụng" value="229" detail="+24% trong tháng này" tone="blue" />
          <MetricCard icon="sparkles" label="Doanh thu từ voucher" value="86,4tr" detail="32% doanh thu tháng 6" tone="violet" />
          <MetricCard icon="eye" label="Tỷ lệ chuyển đổi" value="14,8%" detail="+3,2% so với không ưu đãi" tone="orange" />
        </section>

        <section className="mkt-card mkt-voucher-panel">
          <div className="mkt-toolbar">
            <div className="mkt-search"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã hoặc tên voucher..." /></div>
            <div className="mkt-filter-tabs">
              {[['all', 'Tất cả'], ['active', 'Đang chạy'], ['scheduled', 'Sắp diễn ra'], ['expired', 'Đã kết thúc']].map(([value, label]) => (
                <button className={status === value ? 'is-active' : ''} type="button" key={value} onClick={() => setStatus(value)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="mkt-voucher-grid">
            {filtered.map(voucher => {
              const percentage = Math.min(100, (voucher.used / voucher.limit) * 100)
              return (
                <article className="mkt-voucher" key={voucher.code}>
                  <div className={`mkt-voucher-accent mkt-voucher-accent--${STATUS[voucher.status]?.[1] || 'neutral'}`} />
                  <div className="mkt-voucher-head">
                    <div><StatusBadge value={voucher.status} /><h2>{voucher.name}</h2></div>
                    <button className="mkt-row-more" type="button"><Icon name="more" /></button>
                  </div>
                  <div className="mkt-voucher-value">
                    <strong>{voucher.type === 'percent' ? `${voucher.value}%` : `${(voucher.value / 1000).toLocaleString('vi-VN')}K`}</strong>
                    <span>GIẢM<br />TỐI ĐA</span>
                  </div>
                  <button className="mkt-code" type="button" onClick={() => copyCode(voucher.code)}>
                    <span>{voucher.code}</span><Icon name={copiedCode === voucher.code ? 'check' : 'copy'} />{copiedCode === voucher.code && <small>Đã chép</small>}
                  </button>
                  <dl>
                    <div><dt>Đơn tối thiểu</dt><dd>{voucher.min}</dd></div>
                    <div><dt>Thời gian</dt><dd>{voucher.period}</dd></div>
                  </dl>
                  <div className="mkt-usage">
                    <div><span>Đã sử dụng</span><strong>{voucher.used}/{voucher.limit}</strong></div>
                    <i><b style={{ width: `${percentage}%` }} /></i>
                  </div>
                </article>
              )
            })}
          </div>
          {!filtered.length && <div className="mkt-empty-table"><Icon name="ticket" size={27} /><strong>Không tìm thấy voucher</strong><span>Thử thay đổi từ khóa hoặc bộ lọc.</span></div>}
        </section>
      </div>

      {modalOpen && (
        <div className="mkt-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setModalOpen(false)}>
          <form className="mkt-modal" onSubmit={saveVoucher}>
            <header><div><span className="mkt-eyebrow"><Icon name="ticket" size={14} />Ưu đãi mới</span><h2>Tạo voucher</h2><p>Thiết lập điều kiện áp dụng cho chương trình khuyến mãi.</p></div><button type="button" onClick={() => setModalOpen(false)}><Icon name="close" /></button></header>
            <div className="mkt-modal-body">
              <label className="mkt-field">Tên chương trình <em>*</em>
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Chào tháng 7" />
                {errors.name && <small className="mkt-error">{errors.name}</small>}
              </label>
              <div className="mkt-form-row">
                <label className="mkt-field">Mã voucher <em>*</em>
                  <input className="is-uppercase" value={form.code} maxLength="20" onChange={event => setForm({ ...form, code: event.target.value.replace(/\s/g, '') })} placeholder="HELLOJULY" />
                  {errors.code && <small className="mkt-error">{errors.code}</small>}
                </label>
                <label className="mkt-field">Loại giảm giá
                  <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="percent">Theo phần trăm (%)</option><option value="amount">Số tiền cố định (đ)</option></select>
                </label>
              </div>
              <div className="mkt-form-row">
                <label className="mkt-field">Giá trị giảm <em>*</em>
                  <div className="mkt-input-suffix"><input type="number" value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} placeholder="15" /><span>{form.type === 'percent' ? '%' : 'đ'}</span></div>
                  {errors.value && <small className="mkt-error">{errors.value}</small>}
                </label>
                <label className="mkt-field">Đơn hàng tối thiểu
                  <div className="mkt-input-suffix"><input type="number" value={form.min} onChange={event => setForm({ ...form, min: event.target.value })} placeholder="1500000" /><span>đ</span></div>
                </label>
              </div>
              <div className="mkt-form-row">
                <label className="mkt-field">Ngày bắt đầu <em>*</em><input type="date" value={form.start} onChange={event => setForm({ ...form, start: event.target.value })} /></label>
                <label className="mkt-field">Ngày kết thúc <em>*</em><input type="date" value={form.end} onChange={event => setForm({ ...form, end: event.target.value })} /></label>
              </div>
              {errors.period && <small className="mkt-error mkt-error--block">{errors.period}</small>}
              <label className="mkt-field">Giới hạn lượt sử dụng
                <input type="number" value={form.limit} onChange={event => setForm({ ...form, limit: event.target.value })} placeholder="100" />
              </label>
            </div>
            <footer><button className="mkt-btn mkt-btn--secondary" type="button" onClick={() => setModalOpen(false)}>Hủy</button><button className="mkt-btn mkt-btn--primary" type="submit"><Icon name="check" />Tạo voucher</button></footer>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}
