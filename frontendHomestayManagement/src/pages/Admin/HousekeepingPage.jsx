import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './HousekeepingPage.css'

const API = 'http://localhost:8080/api/housekeeping'

const TABS = [
  { key: 'PENDING', label: 'Chờ kiểm tra' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { key: 'INSPECTED', label: 'Đã gửi chi phí' },
  { key: 'COMPLETED', label: 'Đã dọn xong' },
]

function authHeaders() {
  return { Authorization: `Bearer ${getStoredToken()}`, 'Content-Type': 'application/json' }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không thể xử lý yêu cầu housekeeping')
  return data
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function time(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function matchesTab(task, tab) {
  if (tab === 'PENDING') return task.inspectionStatus === 'PENDING'
  if (tab === 'IN_PROGRESS') return task.inspectionStatus === 'IN_PROGRESS'
  if (tab === 'INSPECTED') return task.inspectionStatus === 'COMPLETED' && task.cleaningStatus !== 'COMPLETED'
  return task.cleaningStatus === 'COMPLETED'
}

function StatusBadge({ task }) {
  if (task.cleaningStatus === 'COMPLETED') return <span className="hk-badge hk-badge--done">Đã dọn xong</span>
  if (task.inspectionStatus === 'COMPLETED') return <span className="hk-badge hk-badge--inspected">Đã gửi chi phí</span>
  if (task.inspectionStatus === 'IN_PROGRESS') return <span className="hk-badge hk-badge--working">Đang xử lý</span>
  return <span className="hk-badge hk-badge--pending">Chờ kiểm tra</span>
}

function TaskCard({ task, active, onClick }) {
  return (
    <button type="button" className={`hk-task-card${active ? ' hk-task-card--active' : ''}`} onClick={onClick}>
      <div className="hk-task-card__top">
        <div className="hk-room-mark">{task.roomNumber}</div>
        <StatusBadge task={task} />
      </div>
      <h3>Phòng {task.roomNumber}</h3>
      <p>{task.customerName || 'Khách lưu trú'} · Booking #{task.bookingId}</p>
      <div className="hk-task-meta">
        <span>Trả phòng {time(task.checkOutTarget)}</span>
        <strong>{money(task.totalMiniBarCharge)}</strong>
      </div>
      {task.assignedHousekeepingName && <small>Phụ trách: {task.assignedHousekeepingName}</small>}
    </button>
  )
}

function TaskDetail({ task, busy, onStart, onSubmitInspection, onCompleteCleaning, onClose }) {
  const [quantities, setQuantities] = useState(() => Object.fromEntries((task?.miniBarItems || []).map(item => [item.itemId, item.quantityUsed || 0])))
  const [note, setNote] = useState(() => task?.note || '')

  if (!task) {
    return (
      <div className="hk-detail hk-detail--empty">
        <div className="hk-empty-icon">✓</div>
        <h3>Chọn một phòng để xử lý</h3>
        <p>Thông tin minibar và tiến độ dọn phòng sẽ xuất hiện tại đây.</p>
      </div>
    )
  }

  const inspectionDone = task.inspectionStatus === 'COMPLETED'
  const started = Boolean(task.startedAt)
  const total = (task.miniBarItems || []).reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(quantities[item.itemId] || 0), 0,
  )

  const changeQuantity = (item, delta) => {
    if (inspectionDone) return
    setQuantities(current => {
      const next = Math.max(0, Math.min(item.quantityInStock, Number(current[item.itemId] || 0) + delta))
      return { ...current, [item.itemId]: next }
    })
  }

  const submitInspection = () => onSubmitInspection({
    items: task.miniBarItems.map(item => ({ itemId: item.itemId, quantityUsed: Number(quantities[item.itemId] || 0) })),
    note,
  })

  return (
    <section className="hk-detail">
      <div className="hk-detail__head">
        <div>
          <span className="hk-eyebrow">Booking #{task.bookingId}</span>
          <h2>Phòng {task.roomNumber}</h2>
          <p>{task.customerName} {task.customerPhone ? `· ${task.customerPhone}` : ''}</p>
        </div>
        <button type="button" className="hk-close" onClick={onClose} aria-label="Đóng">×</button>
      </div>

      <div className="hk-progress">
        <div className={started ? 'is-done' : 'is-current'}><i>1</i><span>Nhận việc</span></div>
        <div className={inspectionDone ? 'is-done' : started ? 'is-current' : ''}><i>2</i><span>Gửi chi phí</span></div>
        <div className={task.cleaningStatus === 'COMPLETED' ? 'is-done' : inspectionDone ? 'is-current' : ''}><i>3</i><span>Dọn xong</span></div>
      </div>

      {!started ? (
        <div className="hk-start-box">
          <span>Phòng đang chờ nhân viên nhận việc</span>
          <button type="button" className="hk-primary" disabled={busy} onClick={onStart}>
            {busy ? 'Đang nhận...' : 'Bắt đầu kiểm tra'}
          </button>
        </div>
      ) : (
        <>
          <div className="hk-section-title">
            <div><span>Mini-bar</span><h3>Đồ ăn, thức uống đã sử dụng</h3></div>
            {inspectionDone && <span className="hk-lock">Đã khóa kết quả</span>}
          </div>

          <div className="hk-items">
            {task.miniBarItems.length === 0 ? (
              <div className="hk-no-items">Chưa có mặt hàng mini-bar trong danh mục.</div>
            ) : task.miniBarItems.map(item => (
              <div className="hk-item" key={item.itemId}>
                <div className="hk-item__icon">{item.name?.charAt(0)?.toUpperCase()}</div>
                <div className="hk-item__name"><strong>{item.name}</strong><span>{money(item.unitPrice)} / sản phẩm</span></div>
                <div className="hk-stepper">
                  <button type="button" disabled={inspectionDone || busy || !quantities[item.itemId]} onClick={() => changeQuantity(item, -1)}>−</button>
                  <b>{quantities[item.itemId] || 0}</b>
                  <button type="button" disabled={inspectionDone || busy || quantities[item.itemId] >= item.quantityInStock} onClick={() => changeQuantity(item, 1)}>+</button>
                </div>
                <strong className="hk-item__total">{money(Number(item.unitPrice) * Number(quantities[item.itemId] || 0))}</strong>
              </div>
            ))}
          </div>

          <label className="hk-note">
            <span>Ghi chú tình trạng phòng</span>
            <textarea maxLength={1000} disabled={inspectionDone || busy} value={note} onChange={event => setNote(event.target.value)} placeholder="Ví dụ: thiếu 1 khăn tắm, điều hòa hoạt động bình thường..." />
          </label>

          <div className="hk-summary">
            <div><span>Tổng chi phí minibar</span><strong>{money(total)}</strong></div>
            {!inspectionDone ? (
              <button type="button" className="hk-primary" disabled={busy} onClick={submitInspection}>
                {busy ? 'Đang gửi...' : 'Gửi chi phí cho lễ tân'}
              </button>
            ) : task.cleaningStatus !== 'COMPLETED' ? (
              <div className="hk-cleaning-action">
                <p><b>Chi phí đã gửi.</b> Lễ tân có thể checkout, bạn tiếp tục dọn phòng.</p>
                <button type="button" className="hk-primary" disabled={busy} onClick={onCompleteCleaning}>
                  {busy ? 'Đang hoàn tất...' : 'Hoàn tất dọn phòng'}
                </button>
              </div>
            ) : (
              <div className="hk-complete-message">✓ Phòng đã sẵn sàng đón khách mới</div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function HousekeepingPage() {
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('PENDING')
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await apiRequest('/tasks?status=ALL')
      setTasks(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The request updates loading state before synchronizing with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks()
    const timer = window.setInterval(() => loadTasks(true), 20000)
    return () => window.clearInterval(timer)
  }, [loadTasks])

  const selected = tasks.find(task => task.id === selectedId) || null
  const visibleTasks = useMemo(() => tasks.filter(task => matchesTab(task, tab)), [tasks, tab])
  const count = key => tasks.filter(task => matchesTab(task, key)).length

  const runAction = async (path, options, success) => {
    setBusy(true); setError(''); setNotice('')
    try {
      const updated = await apiRequest(path, options)
      setTasks(current => current.map(task => task.id === updated.id ? updated : task))
      setSelectedId(updated.id)
      setNotice(success)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout activePage="housekeeping">
      <div className="hk-page">
        <header className="hk-page-head">
          <div><span className="hk-eyebrow">Vận hành phòng</span><h1>Housekeeping</h1><p>Kiểm tra chi phí trước checkout và theo dõi tiến độ dọn phòng.</p></div>
          <button type="button" className="hk-refresh" onClick={() => loadTasks()} disabled={loading}>↻ Làm mới</button>
        </header>

        <div className="hk-stats">
          <div><span>Chờ kiểm tra</span><strong>{count('PENDING')}</strong></div>
          <div><span>Đang xử lý</span><strong>{count('IN_PROGRESS')}</strong></div>
          <div><span>Đã gửi lễ tân</span><strong>{count('INSPECTED')}</strong></div>
          <div><span>Hoàn thành</span><strong>{count('COMPLETED')}</strong></div>
        </div>

        {error && <div className="hk-alert hk-alert--error">{error}</div>}
        {notice && <div className="hk-alert hk-alert--success">{notice}</div>}

        <div className="hk-tabs">
          {TABS.map(item => <button type="button" key={item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => { setTab(item.key); setSelectedId(null) }}>{item.label}<b>{count(item.key)}</b></button>)}
        </div>

        <div className="hk-workspace">
          <div className="hk-list">
            {loading ? <div className="hk-list-empty">Đang tải công việc...</div> : visibleTasks.length === 0 ? <div className="hk-list-empty"><b>Không có phòng trong nhóm này</b><span>Danh sách sẽ tự cập nhật khi có yêu cầu mới.</span></div> : visibleTasks.map(task => <TaskCard key={task.id} task={task} active={task.id === selectedId} onClick={() => setSelectedId(task.id)} />)}
          </div>
          <TaskDetail
            key={selected ? `${selected.id}-${selected.version}-${selected.inspectionStatus}-${selected.cleaningStatus}` : 'empty'}
            task={selected}
            busy={busy}
            onClose={() => setSelectedId(null)}
            onStart={() => runAction(`/tasks/${selected.id}/start`, { method: 'POST' }, `Đã nhận phòng ${selected.roomNumber}`)}
            onSubmitInspection={body => runAction(`/tasks/${selected.id}/inspection`, { method: 'PUT', body: JSON.stringify(body) }, 'Đã gửi chi phí cho lễ tân')}
            onCompleteCleaning={() => runAction(`/tasks/${selected.id}/complete-cleaning`, { method: 'POST' }, `Phòng ${selected.roomNumber} đã sẵn sàng`)}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default HousekeepingPage
