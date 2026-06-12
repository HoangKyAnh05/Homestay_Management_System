import { useEffect, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import AdminLayout from './AdminLayout'
import './AdminRoomsPage.css'

const API        = 'http://localhost:8080/api/admin/rooms'
const DEPOSIT_API = `${API}/deposit-policies`
const PRICE_API  = 'http://localhost:8080/api/admin/price-config'
const PAGE_SIZE  = 6

function authHeaders(isFormData = false) {
  const h = { Authorization: `Bearer ${getStoredToken()}` }
  if (!isFormData) h['Content-Type'] = 'application/json'
  return h
}

// ── Lookup helpers ─────────────────────────────────────────────────
const STATUS_LABEL = {
  AVAILABLE: 'Trống', OCCUPIED: 'Có khách',
  CLEANING: 'Dọn dẹp', MAINTENANCE: 'Bảo trì',
}
const STATUS_OPTIONS = Object.keys(STATUS_LABEL)

const RENT_TYPE_LABEL = {
  OVERNIGHT: 'Qua đêm', HOURLY: 'Theo giờ',
  COMBO: 'Combo giờ', DAILY: 'Theo ngày',
}
const RENT_TYPE_OPTIONS = Object.keys(RENT_TYPE_LABEL)

const DAY_TYPE_LABEL = { WEEKDAY: 'Ngày thường', WEEKEND: 'Cuối tuần' }
const DAY_TYPE_OPTIONS = Object.keys(DAY_TYPE_LABEL)

function statusBadgeClass(s) {
  return ({ AVAILABLE:'badge badge--active', OCCUPIED:'badge badge--admin',
    CLEANING:'badge badge--manager', MAINTENANCE:'badge badge--inactive' })[s] || 'badge badge--default'
}

function formatPrice(p) {
  if (p == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(p) + 'đ'
}

function formatDepositPolicy(policy) {
  if (!policy) return 'Chưa cấu hình'
  const value = policy.calculationType === 'PERCENTAGE'
    ? `${Number(policy.policyValue || 0)}%`
    : formatPrice(policy.policyValue)
  return `${policy.policyName} · ${value}`
}

function syncRoomCounts(roomTypes, rooms) {
  const counts = {}
  rooms.forEach(r => { counts[r.roomTypeId] = (counts[r.roomTypeId] || 0) + 1 })
  return roomTypes.map(t => ({ ...t, roomCount: counts[t.id] || 0 }))
}

function primaryImage(images) {
  return images?.find(i => i.primary) || images?.[0]
}

// ─────────────────────────────────────────────────────────────────────
// Modal loại phòng (tạo / sửa)
// ─────────────────────────────────────────────────────────────────────
function RoomTypeModal({ roomType, depositPolicies, onClose, onSave }) {
  const isEdit = !!roomType
  const [form, setForm] = useState({
    name:           roomType?.name || '',
    maxAdults:      roomType?.maxAdults || 2,
    maxChildren:    roomType?.maxChildren || 0,
    depositPolicyId:roomType?.depositPolicyId || '',
    description:    roomType?.description || '',
  })
  const [error, setSaving] = useState('')
  const [saving, setSavingState] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving('')
    setSavingState(true)
    try {
      const res = await fetch(isEdit ? `${API}/types/${roomType.id}` : `${API}/types`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          maxAdults:  Number(form.maxAdults),
          maxChildren:Number(form.maxChildren),
          depositPolicyId: form.depositPolicyId ? Number(form.depositPolicyId) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data, isEdit)
    } catch (err) { setSaving(err.message) }
    finally { setSavingState(false) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal">
        <div className="arm-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Tên loại phòng</span>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Phòng Studio, Deluxe..." />
          </label>
          <div className="arm-field-row">
            <label className="arm-field"><span>Người lớn tối đa</span>
              <input type="number" value={form.maxAdults} onChange={e => set('maxAdults', e.target.value)} required min={1} />
            </label>
            <label className="arm-field"><span>Trẻ em tối đa</span>
              <input type="number" value={form.maxChildren} onChange={e => set('maxChildren', e.target.value)} required min={0} />
            </label>
          </div>
          <label className="arm-field"><span>Chính sách đặt cọc mặc định</span>
            <select value={form.depositPolicyId} onChange={e => set('depositPolicyId', e.target.value)}>
              <option value="">Chưa cấu hình</option>
              {depositPolicies.map(policy => (
                <option key={policy.id} value={policy.id}>{formatDepositPolicy(policy)}</option>
              ))}
            </select>
          </label>
          <label className="arm-field"><span>Mô tả</span>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Mô tả loại phòng..." />
          </label>
          {error && <p className="arm-error">{error}</p>}
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="arm-btn arm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal ảnh phòng vật lý
// ─────────────────────────────────────────────────────────────────────
function ImagesModal({ room, onClose, onUpdate }) {
  const [images, setImages] = useState(room.images || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch(`${API}/${room.id}/images`, { method:'POST', headers:authHeaders(true), body:formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload thất bại')
      setImages(data.images); onUpdate(data)
    } catch (err) { setError(err.message) }
    finally { setUploading(false); fileRef.current.value = '' }
  }

  const handleDelete = async (imageId) => {
    setError('')
    try {
      const res = await fetch(`${API}/${room.id}/images/${imageId}`, { method:'DELETE', headers:authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      setImages(data.images); onUpdate(data)
    } catch (err) { setError(err.message) }
  }

  const handleSetPrimary = async (imageId) => {
    setError('')
    try {
      const res = await fetch(`${API}/${room.id}/images/${imageId}/primary`, { method:'PATCH', headers:authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      setImages(data.images); onUpdate(data)
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal arm-modal--wide">
        <div className="arm-modal-head">
          <h3>Ảnh phòng — #{room.roomNumber}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="arm-modal-body">
          <label className="arm-upload-zone">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} hidden />
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>{uploading ? 'Đang tải lên...' : 'Nhấn để tải ảnh lên (JPG, PNG, WEBP)'}</span>
          </label>
          {error && <p className="arm-error">{error}</p>}
          {images.length === 0 ? <p className="arm-no-images">Chưa có ảnh nào.</p> : (
            <div className="arm-images-grid">
              {images.map(img => (
                <div key={img.id} className={`arm-img-card${img.primary?' arm-img-card--primary':''}`}>
                  <img src={resolveImageUrl(img.imageUrl)} alt="" loading="lazy" />
                  {img.primary && <span className="arm-img-primary-badge">Ảnh chính</span>}
                  <div className="arm-img-actions">
                    {!img.primary && (
                      <button type="button" title="Đặt làm ảnh chính" onClick={() => handleSetPrimary(img.id)}>
                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </button>
                    )}
                    <button type="button" className="arm-img-del" title="Xoá ảnh" onClick={() => handleDelete(img.id)}>
                      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="arm-modal-actions" style={{ marginTop:8 }}>
            <button type="button" className="arm-btn arm-btn--primary" onClick={onClose}>Xong</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal phòng vật lý
// ─────────────────────────────────────────────────────────────────────
function RoomModal({ room, roomTypes, onClose, onSave }) {
  const isEdit = !!room
  const [form, setForm] = useState({
    roomNumber: room?.roomNumber || '',
    roomTypeId: room?.roomTypeId || roomTypes[0]?.id || '',
    status:     room?.status || 'AVAILABLE',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch(isEdit ? `${API}/${room.id}` : API, {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...form, roomTypeId: Number(form.roomTypeId) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data, isEdit)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal">
        <div className="arm-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Số phòng</span>
            <input value={form.roomNumber} onChange={e => set('roomNumber', e.target.value)} required placeholder="101, 202..." maxLength={10} />
          </label>
          <label className="arm-field"><span>Loại phòng</span>
            <select value={form.roomTypeId} onChange={e => set('roomTypeId', e.target.value)}>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="arm-field"><span>Trạng thái</span>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          {error && <p className="arm-error">{error}</p>}
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="arm-btn arm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal xác nhận xoá (dùng chung)
// ─────────────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ title, desc, onClose, onConfirm, loading }) {
  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal arm-modal--sm">
        <div className="arm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="arm-modal-body">
          <p style={{ margin:'0 0 24px', color:'#374151' }}>{desc}</p>
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="button" className="arm-btn arm-btn--danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'Đang xoá...' : 'Xoá'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal chính sách đặt cọc
// ─────────────────────────────────────────────────────────────────────
function DepositPolicyModal({ policy, onClose, onSave }) {
  const isEdit = !!policy
  const [form, setForm] = useState({
    policyName:      policy?.policyName || '',
    calculationType: policy?.calculationType || 'PERCENTAGE',
    policyValue:     policy?.policyValue || '',
    description:     policy?.description || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch(isEdit ? `${DEPOSIT_API}/${policy.id}` : DEPOSIT_API, {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...form, policyValue: Number(form.policyValue) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data, isEdit)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal">
        <div className="arm-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa chính sách đặt cọc' : 'Thêm chính sách đặt cọc'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Tên chính sách</span>
            <input value={form.policyName} onChange={e => set('policyName', e.target.value)} required maxLength={50} placeholder="Đặt cọc 50%" />
          </label>
          <label className="arm-field"><span>Cách tính</span>
            <select value={form.calculationType} onChange={e => set('calculationType', e.target.value)}>
              <option value="PERCENTAGE">Theo phần trăm</option>
              <option value="FIXED_AMOUNT">Số tiền cố định</option>
            </select>
          </label>
          <label className="arm-field"><span>{form.calculationType === 'PERCENTAGE' ? 'Phần trăm cọc' : 'Số tiền cọc'}</span>
            <input type="number" value={form.policyValue} onChange={e => set('policyValue', e.target.value)} required min={1}
              placeholder={form.calculationType === 'PERCENTAGE' ? '50' : '200000'} />
          </label>
          <label className="arm-field"><span>Mô tả</span>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} maxLength={255} />
          </label>
          {error && <p className="arm-error">{error}</p>}
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="arm-btn arm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo chính sách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal Gói thuê (PricePolicy)
// ─────────────────────────────────────────────────────────────────────
function PricePolicyModal({ policy, onClose, onSave }) {
  const isEdit = !!policy
  const [form, setForm] = useState({
    policyName:      policy?.policyName || '',
    rentType:        policy?.rentType || 'OVERNIGHT',
    standardCheckIn: policy?.standardCheckIn || '',
    standardCheckOut:policy?.standardCheckOut || '',
    limitHours:      policy?.limitHours || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const body = {
        policyName:       form.policyName,
        rentType:         form.rentType,
        standardCheckIn:  form.standardCheckIn || null,
        standardCheckOut: form.standardCheckOut || null,
        limitHours:       form.limitHours ? Number(form.limitHours) : null,
      }
      const url = isEdit ? `${PRICE_API}/policies/${policy.id}` : `${PRICE_API}/policies`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data, isEdit)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal">
        <div className="arm-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa gói thuê' : 'Thêm gói thuê mới'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Tên gói thuê</span>
            <input value={form.policyName} onChange={e => set('policyName', e.target.value)} required maxLength={50}
              placeholder="VD: Thuê qua đêm, Combo 3 giờ..." />
          </label>
          <label className="arm-field"><span>Loại hình tính giá</span>
            <select value={form.rentType} onChange={e => set('rentType', e.target.value)}>
              {RENT_TYPE_OPTIONS.map(r => (
                <option key={r} value={r}>{RENT_TYPE_LABEL[r]} ({r})</option>
              ))}
            </select>
          </label>
          <div className="arm-field-row">
            <label className="arm-field"><span>Giờ nhận phòng chuẩn</span>
              <input type="time" value={form.standardCheckIn} onChange={e => set('standardCheckIn', e.target.value)} />
            </label>
            <label className="arm-field"><span>Giờ trả phòng chuẩn</span>
              <input type="time" value={form.standardCheckOut} onChange={e => set('standardCheckOut', e.target.value)} />
            </label>
          </div>
          {form.rentType === 'COMBO' && (
            <label className="arm-field"><span>Số giờ combo (bắt buộc với COMBO)</span>
              <input type="number" value={form.limitHours} onChange={e => set('limitHours', e.target.value)}
                required min={1} placeholder="VD: 3" />
            </label>
          )}
          {error && <p className="arm-error">{error}</p>}
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="arm-btn arm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo gói thuê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal Cấu hình giá (RoomPriceConfig)
// ─────────────────────────────────────────────────────────────────────
function PriceConfigModal({ config, roomTypes, policies, onClose, onSave }) {
  const isEdit = !!config
  const [form, setForm] = useState({
    roomTypeId:    config?.roomTypeId   || roomTypes[0]?.id || '',
    pricePolicyId: config?.pricePolicyId || policies[0]?.id || '',
    dayType:       config?.dayType      || 'WEEKDAY',
    price:         config?.price        || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedPolicy = policies.find(p => p.id === Number(form.pricePolicyId))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const body = {
        roomTypeId:    Number(form.roomTypeId),
        pricePolicyId: Number(form.pricePolicyId),
        dayType:       form.dayType,
        price:         Number(form.price),
      }
      const url = isEdit ? `${PRICE_API}/configs/${config.id}` : `${PRICE_API}/configs`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      onSave(data, isEdit)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal">
        <div className="arm-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa cấu hình giá' : 'Thêm cấu hình giá'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Loại phòng</span>
            <select value={form.roomTypeId} onChange={e => set('roomTypeId', e.target.value)}>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="arm-field"><span>Gói thuê</span>
            <select value={form.pricePolicyId} onChange={e => set('pricePolicyId', e.target.value)}>
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policyName} ({RENT_TYPE_LABEL[p.rentType] || p.rentType}
                  {p.limitHours ? ` · ${p.limitHours}h` : ''})
                </option>
              ))}
            </select>
          </label>
          {selectedPolicy && (
            <div className="arm-policy-hint">
              {selectedPolicy.standardCheckIn && <span>🕐 Check-in: {selectedPolicy.standardCheckIn}</span>}
              {selectedPolicy.standardCheckOut && <span>🕐 Check-out: {selectedPolicy.standardCheckOut}</span>}
            </div>
          )}
          <label className="arm-field"><span>Loại ngày</span>
            <select value={form.dayType} onChange={e => set('dayType', e.target.value)}>
              {DAY_TYPE_OPTIONS.map(d => <option key={d} value={d}>{DAY_TYPE_LABEL[d]}</option>)}
            </select>
          </label>
          <label className="arm-field"><span>Giá (VNĐ)</span>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
              required min={1} placeholder="VD: 500000" />
          </label>
          {error && <p className="arm-error">{error}</p>}
          <div className="arm-modal-actions">
            <button type="button" className="arm-btn arm-btn--ghost" onClick={onClose}>Huỷ</button>
            <button type="submit" className="arm-btn arm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo cấu hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tab: Chính sách đặt cọc
// ─────────────────────────────────────────────────────────────────────
function DepositPoliciesTab({ depositPolicies, setDepositPolicies, showToast }) {
  const [modalPolicy, setModalPolicy] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${DEPOSIT_API}/${deleteTarget.id}`, { method:'DELETE', headers:authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setDepositPolicies(prev => prev.filter(p => p.id !== deleteTarget.id))
      showToast('Đã xoá chính sách đặt cọc'); setDeleteTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="arm-toolbar">
        <button className="arm-btn arm-btn--primary" type="button" onClick={() => setModalPolicy(null)}>
          + Thêm chính sách đặt cọc
        </button>
      </div>
      <div className="arm-table-wrap">
        {depositPolicies.length === 0 ? <div className="arm-empty">Chưa có chính sách đặt cọc nào.</div> : (
          <table className="arm-table">
            <thead><tr><th>Tên chính sách</th><th>Cách tính</th><th>Giá trị</th><th>Mô tả</th><th></th></tr></thead>
            <tbody>
              {depositPolicies.map(p => (
                <tr key={p.id}>
                  <td className="arm-fw">{p.policyName}</td>
                  <td>{p.calculationType === 'PERCENTAGE' ? 'Theo phần trăm' : 'Số tiền cố định'}</td>
                  <td>{p.calculationType === 'PERCENTAGE' ? `${Number(p.policyValue)}%` : formatPrice(p.policyValue)}</td>
                  <td>{p.description || 'Chưa có'}</td>
                  <td><div className="arm-actions">
                    <button type="button" className="arm-icon-btn arm-icon-btn--edit" onClick={() => setModalPolicy(p)}>
                      <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button type="button" className="arm-icon-btn arm-icon-btn--delete" onClick={() => setDeleteTarget(p)}>
                      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modalPolicy !== undefined && (
        <DepositPolicyModal policy={modalPolicy} onClose={() => setModalPolicy(undefined)}
          onSave={(saved, isEdit) => {
            setDepositPolicies(prev => isEdit ? prev.map(p => p.id===saved.id ? saved : p) : [...prev, saved])
            setModalPolicy(undefined)
            showToast(isEdit ? 'Đã cập nhật' : 'Đã tạo chính sách đặt cọc')
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal title="Xoá chính sách đặt cọc" desc={`Xoá "${deleteTarget.policyName}"?`}
          onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tab: Loại phòng  — với dropdown lọc giá theo gói thuê
// ─────────────────────────────────────────────────────────────────────
function RoomTypesTab({ roomTypes, setRoomTypes, depositPolicies, pricePolicies, priceConfigs, showToast }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // ID của gói thuê đang được chọn để hiển thị giá ('' = hiển thị placeholder)
  const [selectedPolicyId, setSelectedPolicyId] = useState('')
  const [modalType, setModalType] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => setPage(1), [search])

  const filtered = roomTypes.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  /**
   * Lấy giá từ priceConfigs cho 1 loại phòng + 1 gói thuê.
   * Trả về object { WEEKDAY: price, WEEKEND: price } hoặc null.
   */
  const getPriceForType = (roomTypeId) => {
    if (!selectedPolicyId) return null
    const matching = priceConfigs.filter(
      c => c.roomTypeId === roomTypeId && c.pricePolicyId === Number(selectedPolicyId)
    )
    if (!matching.length) return null
    return matching.reduce((acc, c) => ({ ...acc, [c.dayType]: c.price }), {})
  }

  const selectedPolicy = pricePolicies.find(p => p.id === Number(selectedPolicyId))

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/types/${deleteTarget.id}`, { method:'DELETE', headers:authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setRoomTypes(prev => prev.filter(t => t.id !== deleteTarget.id))
      showToast('Đã xoá loại phòng'); setDeleteTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeleting(false) }
  }

  // Nhãn cột giá dựa theo gói đang chọn
  const priceColLabel = selectedPolicy
    ? `Giá · ${selectedPolicy.policyName}${selectedPolicy.limitHours ? ` (${selectedPolicy.limitHours}h)` : ''}`
    : 'Giá'

  return (
    <>
      <div className="arm-toolbar">
        <input className="arm-search" placeholder="Tìm loại phòng..." value={search} onChange={e => setSearch(e.target.value)} />

        {/* ── Dropdown lọc gói giá ── */}
        <div className="arm-price-filter">
          <span className="arm-price-filter-label">Xem giá theo:</span>
          <select
            className="arm-select"
            value={selectedPolicyId}
            onChange={e => setSelectedPolicyId(e.target.value)}
          >
            <option value="">— Chọn gói thuê —</option>
            {pricePolicies.map(p => (
              <option key={p.id} value={p.id}>
                {p.policyName}
                {p.limitHours ? ` (${p.limitHours}h)` : ''}
              </option>
            ))}
          </select>
        </div>

        <button className="arm-btn arm-btn--primary" type="button" onClick={() => setModalType(null)}>
          + Thêm loại phòng
        </button>
      </div>

      <div className="arm-table-wrap">
        {filtered.length === 0 ? <div className="arm-empty">Không có loại phòng nào.</div> : (
          <table className="arm-table">
            <thead><tr>
              <th>Tên loại phòng</th>
              <th>
                {priceColLabel}
                {selectedPolicy && <span className="arm-price-col-sub"> — chọn gói ở trên để xem giá</span>}
              </th>
              <th>Sức chứa</th>
              <th>Chính sách đặt cọc</th>
              <th>Số phòng</th>
              <th></th>
            </tr></thead>
            <tbody>
              {paginated.map(t => {
                const prices = getPriceForType(t.id)
                return (
                  <tr key={t.id}>
                    <td className="arm-fw">{t.name}</td>
                    <td>
                      {!selectedPolicyId ? (
                        <span className="arm-price-hint">← Chọn gói để xem giá</span>
                      ) : prices ? (
                        <div className="arm-price-cell">
                          {prices.WEEKDAY != null && (
                            <span className="arm-price-badge arm-price-badge--weekday">
                              T2–T6: {formatPrice(prices.WEEKDAY)}
                            </span>
                          )}
                          {prices.WEEKEND != null && (
                            <span className="arm-price-badge arm-price-badge--weekend">
                              T7–CN: {formatPrice(prices.WEEKEND)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="arm-price-hint arm-price-hint--none">Chưa cấu hình</span>
                      )}
                    </td>
                    <td>{t.maxAdults} NL · {t.maxChildren} TE</td>
                    <td>{t.depositPolicyName || 'Chưa cấu hình'}</td>
                    <td>{t.roomCount} phòng</td>
                    <td><div className="arm-actions">
                      <button type="button" className="arm-icon-btn arm-icon-btn--edit" onClick={() => setModalType(t)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" className="arm-icon-btn arm-icon-btn--delete" onClick={() => setDeleteTarget(t)}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="arm-pagination">
          <span>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} / {filtered.length}</span>
          <div>
            <button className="arm-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`arm-page-btn${p===page?' arm-page-btn--active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button className="arm-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      )}

      {modalType !== undefined && (
        <RoomTypeModal roomType={modalType} depositPolicies={depositPolicies} onClose={() => setModalType(undefined)}
          onSave={(saved, isEdit) => {
            setRoomTypes(prev => isEdit ? prev.map(t => t.id===saved.id ? { ...saved, roomCount:t.roomCount } : t) : [...prev, saved])
            setModalType(undefined)
            showToast(isEdit ? 'Đã cập nhật loại phòng' : 'Đã tạo loại phòng mới')
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal title="Xoá loại phòng"
          desc={`Xoá loại phòng "${deleteTarget.name}"? Chỉ xoá được khi không còn phòng vật lý nào.`}
          onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tab: Phòng vật lý
// ─────────────────────────────────────────────────────────────────────
function RoomsTab({ rooms, setRooms, setRoomTypes, roomTypes, showToast }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [modalRoom, setModalRoom] = useState(undefined)
  const [imagesTarget, setImagesTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => setPage(1), [search, filterStatus])

  const filtered = rooms.filter(r => {
    const ms = !search || r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.roomTypeName?.toLowerCase().includes(search.toLowerCase())
    return ms && (!filterStatus || r.status === filterStatus)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const applyRooms = (nextRooms) => {
    setRooms(nextRooms)
    setRoomTypes(prev => syncRoomCounts(prev, nextRooms))
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, { method:'DELETE', headers:authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      applyRooms(rooms.filter(r => r.id !== deleteTarget.id))
      showToast('Đã xoá phòng'); setDeleteTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="arm-toolbar">
        <input className="arm-search" placeholder="Tìm số phòng, loại phòng..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="arm-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button className="arm-btn arm-btn--primary" type="button"
          disabled={roomTypes.length === 0} title={roomTypes.length === 0 ? 'Cần tạo loại phòng trước' : undefined}
          onClick={() => setModalRoom(null)}>
          + Thêm phòng
        </button>
      </div>

      <div className="arm-table-wrap">
        {filtered.length === 0 ? <div className="arm-empty">Không có phòng nào.</div> : (
          <table className="arm-table">
            <thead><tr><th>Ảnh đại diện</th><th>Số phòng</th><th>Loại phòng</th><th>Trạng thái</th><th>Ảnh</th><th></th></tr></thead>
            <tbody>
              {paginated.map(r => {
                const thumb = primaryImage(r.images)
                return (
                  <tr key={r.id}>
                    <td>
                      {thumb
                        ? <img src={resolveImageUrl(thumb.imageUrl)} alt={`Phòng ${r.roomNumber}`} className="arm-thumb" />
                        : <div className="arm-thumb arm-thumb--empty" />}
                    </td>
                    <td className="arm-fw">#{r.roomNumber}</td>
                    <td>{r.roomTypeName}</td>
                    <td><span className={statusBadgeClass(r.status)}>{STATUS_LABEL[r.status] || r.status}</span></td>
                    <td>
                      <button type="button" className="arm-img-count-btn" onClick={() => setImagesTarget(r)}>
                        🖼 {r.images?.length || 0} ảnh
                      </button>
                    </td>
                    <td><div className="arm-actions">
                      <button type="button" className="arm-icon-btn arm-icon-btn--edit" onClick={() => setModalRoom(r)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" className="arm-icon-btn arm-icon-btn--delete" onClick={() => setDeleteTarget(r)}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="arm-pagination">
          <span>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} / {filtered.length}</span>
          <div>
            <button className="arm-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`arm-page-btn${p===page?' arm-page-btn--active':''}`} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button className="arm-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      )}

      {modalRoom !== undefined && (
        <RoomModal room={modalRoom} roomTypes={roomTypes} onClose={() => setModalRoom(undefined)}
          onSave={(saved, isEdit) => {
            applyRooms(isEdit ? rooms.map(r => r.id===saved.id ? saved : r) : [...rooms, saved])
            setModalRoom(undefined)
            showToast(isEdit ? 'Đã cập nhật phòng' : 'Đã tạo phòng mới')
          }} />
      )}
      {imagesTarget && (
        <ImagesModal room={imagesTarget} onClose={() => setImagesTarget(null)}
          onUpdate={updated => {
            applyRooms(rooms.map(r => r.id===updated.id ? updated : r))
            setImagesTarget(updated)
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal title="Xoá phòng"
          desc={`Xoá phòng #${deleteTarget.roomNumber}? Tất cả ảnh cũng sẽ bị xoá.`}
          onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tab: Cấu hình giá (PricePolicy + RoomPriceConfig)
// ─────────────────────────────────────────────────────────────────────
function PriceConfigTab({ roomTypes, pricePolicies, setPricePolicies, priceConfigs, setPriceConfigs, showToast }) {
  // Sub-tab trong tab cấu hình giá
  const [subTab, setSubTab] = useState('configs')

  // ── Gói thuê state ──
  const [modalPolicy, setModalPolicy] = useState(undefined)
  const [deletePolicyTarget, setDeletePolicyTarget] = useState(null)
  const [deletingPolicy, setDeletingPolicy] = useState(false)

  // ── Cấu hình giá state ──
  const [filterRoomType, setFilterRoomType] = useState('')
  const [filterPolicy, setFilterPolicy] = useState('')
  const [modalConfig, setModalConfig] = useState(undefined)
  const [deleteConfigTarget, setDeleteConfigTarget] = useState(null)
  const [deletingConfig, setDeletingConfig] = useState(false)

  const handleDeletePolicy = async () => {
    setDeletingPolicy(true)
    try {
      const res = await fetch(`${PRICE_API}/policies/${deletePolicyTarget.id}`, { method:'DELETE', headers:authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setPricePolicies(prev => prev.filter(p => p.id !== deletePolicyTarget.id))
      showToast('Đã xoá gói thuê'); setDeletePolicyTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeletingPolicy(false) }
  }

  const handleDeleteConfig = async () => {
    setDeletingConfig(true)
    try {
      const res = await fetch(`${PRICE_API}/configs/${deleteConfigTarget.id}`, { method:'DELETE', headers:authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setPriceConfigs(prev => prev.filter(c => c.id !== deleteConfigTarget.id))
      showToast('Đã xoá cấu hình giá'); setDeleteConfigTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeletingConfig(false) }
  }

  const filteredConfigs = priceConfigs.filter(c => {
    const mrt = !filterRoomType || c.roomTypeId === Number(filterRoomType)
    const mp  = !filterPolicy   || c.pricePolicyId === Number(filterPolicy)
    return mrt && mp
  })

  return (
    <>
      {/* Sub-tabs */}
      <div className="arm-subtabs">
        <button type="button"
          className={`arm-subtab${subTab==='configs'?' arm-subtab--active':''}`}
          onClick={() => setSubTab('configs')}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
          </svg>
          Ma trận giá
        </button>
        <button type="button"
          className={`arm-subtab${subTab==='policies'?' arm-subtab--active':''}`}
          onClick={() => setSubTab('policies')}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>
          </svg>
          Gói thuê ({pricePolicies.length})
        </button>
      </div>

      {/* ── Sub-tab: Ma trận giá ── */}
      {subTab === 'configs' && (
        <>
          <div className="arm-toolbar">
            <select className="arm-select" value={filterRoomType} onChange={e => setFilterRoomType(e.target.value)}>
              <option value="">Tất cả loại phòng</option>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="arm-select" value={filterPolicy} onChange={e => setFilterPolicy(e.target.value)}>
              <option value="">Tất cả gói thuê</option>
              {pricePolicies.map(p => <option key={p.id} value={p.id}>{p.policyName}</option>)}
            </select>
            <button className="arm-btn arm-btn--primary" type="button"
              disabled={roomTypes.length === 0 || pricePolicies.length === 0}
              title={roomTypes.length === 0 ? 'Cần tạo loại phòng trước' : pricePolicies.length === 0 ? 'Cần tạo gói thuê trước' : undefined}
              onClick={() => setModalConfig(null)}>
              + Thêm cấu hình giá
            </button>
          </div>

          {(roomTypes.length === 0 || pricePolicies.length === 0) && (
            <div className="arm-info-banner">
              💡 Cần có ít nhất 1 <strong>loại phòng</strong> và 1 <strong>gói thuê</strong> trước khi cấu hình giá.
            </div>
          )}

          <div className="arm-table-wrap">
            {filteredConfigs.length === 0 ? (
              <div className="arm-empty">Chưa có cấu hình giá nào{filterRoomType || filterPolicy ? ' phù hợp với bộ lọc' : ''}.</div>
            ) : (
              <table className="arm-table">
                <thead><tr>
                  <th>Loại phòng</th>
                  <th>Gói thuê</th>
                  <th>Loại hình</th>
                  <th>Loại ngày</th>
                  <th>Giá</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {filteredConfigs.map(c => (
                    <tr key={c.id}>
                      <td className="arm-fw">{c.roomTypeName}</td>
                      <td>{c.policyName}</td>
                      <td>
                        <span className={`arm-rent-badge arm-rent-badge--${c.rentType?.toLowerCase()}`}>
                          {RENT_TYPE_LABEL[c.rentType] || c.rentType}
                        </span>
                      </td>
                      <td>
                        <span className={`arm-day-badge${c.dayType==='WEEKEND'?' arm-day-badge--weekend':''}`}>
                          {DAY_TYPE_LABEL[c.dayType] || c.dayType}
                        </span>
                      </td>
                      <td className="arm-price-strong">{formatPrice(c.price)}</td>
                      <td><div className="arm-actions">
                        <button type="button" className="arm-icon-btn arm-icon-btn--edit" onClick={() => setModalConfig(c)}>
                          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" className="arm-icon-btn arm-icon-btn--delete" onClick={() => setDeleteConfigTarget(c)}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Sub-tab: Gói thuê ── */}
      {subTab === 'policies' && (
        <>
          <div className="arm-toolbar">
            <button className="arm-btn arm-btn--primary" type="button" onClick={() => setModalPolicy(null)}>
              + Thêm gói thuê
            </button>
          </div>
          <div className="arm-table-wrap">
            {pricePolicies.length === 0 ? (
              <div className="arm-empty">Chưa có gói thuê nào. Hãy tạo gói đầu tiên!</div>
            ) : (
              <table className="arm-table">
                <thead><tr>
                  <th>Tên gói thuê</th>
                  <th>Loại hình</th>
                  <th>Giờ nhận phòng</th>
                  <th>Giờ trả phòng</th>
                  <th>Giới hạn giờ</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {pricePolicies.map(p => (
                    <tr key={p.id}>
                      <td className="arm-fw">{p.policyName}</td>
                      <td>
                        <span className={`arm-rent-badge arm-rent-badge--${p.rentType?.toLowerCase()}`}>
                          {RENT_TYPE_LABEL[p.rentType] || p.rentType}
                        </span>
                      </td>
                      <td>{p.standardCheckIn || '—'}</td>
                      <td>{p.standardCheckOut || '—'}</td>
                      <td>{p.limitHours ? `${p.limitHours} giờ` : '—'}</td>
                      <td><div className="arm-actions">
                        <button type="button" className="arm-icon-btn arm-icon-btn--edit" onClick={() => setModalPolicy(p)}>
                          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" className="arm-icon-btn arm-icon-btn--delete" onClick={() => setDeletePolicyTarget(p)}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {modalPolicy !== undefined && (
        <PricePolicyModal policy={modalPolicy} onClose={() => setModalPolicy(undefined)}
          onSave={(saved, isEdit) => {
            setPricePolicies(prev => isEdit ? prev.map(p => p.id===saved.id ? saved : p) : [...prev, saved])
            setModalPolicy(undefined)
            showToast(isEdit ? 'Đã cập nhật gói thuê' : 'Đã tạo gói thuê mới')
          }} />
      )}
      {deletePolicyTarget && (
        <ConfirmDeleteModal title="Xoá gói thuê"
          desc={`Xoá gói "${deletePolicyTarget.policyName}"? Chỉ xoá được khi không có cấu hình giá nào dùng gói này.`}
          onClose={() => setDeletePolicyTarget(null)} onConfirm={handleDeletePolicy} loading={deletingPolicy} />
      )}
      {modalConfig !== undefined && (
        <PriceConfigModal config={modalConfig} roomTypes={roomTypes} policies={pricePolicies}
          onClose={() => setModalConfig(undefined)}
          onSave={(saved, isEdit) => {
            setPriceConfigs(prev => isEdit ? prev.map(c => c.id===saved.id ? saved : c) : [...prev, saved])
            setModalConfig(undefined)
            showToast(isEdit ? 'Đã cập nhật cấu hình giá' : 'Đã tạo cấu hình giá')
          }} />
      )}
      {deleteConfigTarget && (
        <ConfirmDeleteModal title="Xoá cấu hình giá"
          desc={`Xoá giá "${deleteConfigTarget.policyName} · ${DAY_TYPE_LABEL[deleteConfigTarget.dayType]}" cho phòng ${deleteConfigTarget.roomTypeName}?`}
          onClose={() => setDeleteConfigTarget(null)} onConfirm={handleDeleteConfig} loading={deletingConfig} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Trang chính
// ─────────────────────────────────────────────────────────────────────
function AdminRoomsPage({ activePage = 'rooms' }) {
  const [tab, setTab] = useState('types')
  const [depositPolicies, setDepositPolicies] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [rooms, setRooms] = useState([])
  const [pricePolicies, setPricePolicies] = useState([])
  const [priceConfigs, setPriceConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    Promise.all([
      fetch(DEPOSIT_API,              { headers: authHeaders() }),
      fetch(`${API}/types`,            { headers: authHeaders() }),
      fetch(API,                       { headers: authHeaders() }),
      fetch(`${PRICE_API}/policies`,   { headers: authHeaders() }),
      fetch(`${PRICE_API}/configs`,    { headers: authHeaders() }),
    ])
      .then(async ([polRes, typRes, rmRes, ppRes, pcRes]) => {
        const all = [polRes, typRes, rmRes, ppRes, pcRes]
        const failed = all.find(r => !r.ok)
        if (failed) { const d = await failed.json().catch(() => ({})); throw new Error(d.message || 'Không thể tải dữ liệu') }
        const [policies, types, rms, pps, pcs] = await Promise.all(all.map(r => r.json()))
        const roomList = Array.isArray(rms) ? rms : []
        setDepositPolicies(Array.isArray(policies) ? policies : [])
        setRooms(roomList)
        setRoomTypes(syncRoomCounts(Array.isArray(types) ? types : [], roomList))
        setPricePolicies(Array.isArray(pps) ? pps : [])
        setPriceConfigs(Array.isArray(pcs) ? pcs : [])
      })
      .catch(err => showToast(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout activePage={activePage}>
      <div className="arm-header">
        <div>
          <h1>Quản lí Phòng</h1>
          <p>{roomTypes.length} loại phòng · {rooms.length} phòng vật lý · {pricePolicies.length} gói thuê</p>
        </div>
      </div>

      <div className="arm-tabs">
        {[
          { key:'deposit', label:'Chính sách đặt cọc' },
          { key:'types',   label:'Loại phòng' },
          { key:'rooms',   label:'Phòng vật lý' },
          { key:'pricing', label:'Cấu hình giá 💰' },
        ].map(t => (
          <button key={t.key} type="button"
            className={`arm-tab${tab===t.key?' arm-tab--active':''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="arm-empty" style={{ padding:48 }}>Đang tải...</div>
      ) : tab === 'deposit' ? (
        <DepositPoliciesTab depositPolicies={depositPolicies} setDepositPolicies={setDepositPolicies} showToast={showToast} />
      ) : tab === 'types' ? (
        <RoomTypesTab
          roomTypes={roomTypes} setRoomTypes={setRoomTypes}
          depositPolicies={depositPolicies}
          pricePolicies={pricePolicies}
          priceConfigs={priceConfigs}
          showToast={showToast} />
      ) : tab === 'rooms' ? (
        <RoomsTab rooms={rooms} setRooms={setRooms} setRoomTypes={setRoomTypes} roomTypes={roomTypes} showToast={showToast} />
      ) : (
        <PriceConfigTab
          roomTypes={roomTypes}
          pricePolicies={pricePolicies} setPricePolicies={setPricePolicies}
          priceConfigs={priceConfigs}  setPriceConfigs={setPriceConfigs}
          showToast={showToast} />
      )}

      {toast && <div className="arm-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminRoomsPage
