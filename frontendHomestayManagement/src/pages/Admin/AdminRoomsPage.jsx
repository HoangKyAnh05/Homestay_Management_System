import { useEffect, useRef, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import AdminLayout from './AdminLayout'
import './AdminRoomsPage.css'

const API = 'http://localhost:8080/api/admin/rooms'
const DEPOSIT_API = `${API}/deposit-policies`
const PAGE_SIZE = 6

function authHeaders(isFormData = false) {
  const h = { Authorization: `Bearer ${getStoredToken()}` }
  if (!isFormData) h['Content-Type'] = 'application/json'
  return h
}

const STATUS_LABEL = {
  AVAILABLE: 'Trống',
  OCCUPIED: 'Có khách',
  CLEANING: 'Dọn dẹp',
  MAINTENANCE: 'Bảo trì',
}
const STATUS_OPTIONS = Object.keys(STATUS_LABEL)

function statusBadgeClass(s) {
  return {
    AVAILABLE: 'badge badge--active',
    OCCUPIED: 'badge badge--admin',
    CLEANING: 'badge badge--manager',
    MAINTENANCE: 'badge badge--inactive',
  }[s] || 'badge badge--default'
}

function formatPrice(p) {
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

// ─────────────────────────────────────────────────────────
// Modal loại phòng (tạo / sửa)
// ─────────────────────────────────────────────────────────
function RoomTypeModal({ roomType, depositPolicies, onClose, onSave }) {
  const isEdit = !!roomType
  const [form, setForm] = useState({
    name: roomType?.name || '',
    basePrice: roomType?.basePrice || '',
    maxAdults: roomType?.maxAdults || 2,
    maxChildren: roomType?.maxChildren || 0,
    depositPolicyId: roomType?.depositPolicyId || '',
    description: roomType?.description || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(isEdit ? `${API}/types/${roomType.id}` : `${API}/types`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          basePrice: Number(form.basePrice),
          maxAdults: Number(form.maxAdults),
          maxChildren: Number(form.maxChildren),
          depositPolicyId: form.depositPolicyId ? Number(form.depositPolicyId) : null,
        }),
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
          <h3>{isEdit ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="arm-modal-body" onSubmit={handleSubmit}>
          <label className="arm-field"><span>Tên loại phòng</span>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Phòng Studio, Deluxe..." />
          </label>
          <label className="arm-field"><span>Giá / đêm (VNĐ)</span>
            <input type="number" value={form.basePrice} onChange={e => set('basePrice', e.target.value)} required min={1} placeholder="500000" />
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

// ─────────────────────────────────────────────────────────
// Modal quản lí ảnh phòng vật lý
// ─────────────────────────────────────────────────────────
function ImagesModal({ room, onClose, onUpdate }) {
  const [images, setImages] = useState(room.images || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch(`${API}/${room.id}/images`, {
        method: 'POST',
        headers: authHeaders(true),
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload thất bại')
      setImages(data.images)
      onUpdate(data)
    } catch (err) { setError(err.message) }
    finally { setUploading(false); fileRef.current.value = '' }
  }

  const handleDelete = async (imageId) => {
    setError('')
    try {
      const res = await fetch(`${API}/${room.id}/images/${imageId}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      setImages(data.images)
      onUpdate(data)
    } catch (err) { setError(err.message) }
  }

  const handleSetPrimary = async (imageId) => {
    setError('')
    try {
      const res = await fetch(`${API}/${room.id}/images/${imageId}/primary`, {
        method: 'PATCH', headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi')
      setImages(data.images)
      onUpdate(data)
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

          {images.length === 0 ? (
            <p className="arm-no-images">Chưa có ảnh nào.</p>
          ) : (
            <div className="arm-images-grid">
              {images.map(img => (
                <div key={img.id} className={`arm-img-card${img.primary ? ' arm-img-card--primary' : ''}`}>
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

          <div className="arm-modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="arm-btn arm-btn--primary" onClick={onClose}>Xong</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Modal phòng vật lý (tạo / sửa)
// ─────────────────────────────────────────────────────────
function RoomModal({ room, roomTypes, onClose, onSave }) {
  const isEdit = !!room
  const [form, setForm] = useState({
    roomNumber: room?.roomNumber || '',
    roomTypeId: room?.roomTypeId || roomTypes[0]?.id || '',
    status: room?.status || 'AVAILABLE',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(isEdit ? `${API}/${room.id}` : API, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
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

// ─────────────────────────────────────────────────────────
// Modal xác nhận xoá
// ─────────────────────────────────────────────────────────
function ConfirmDeleteModal({ title, desc, onClose, onConfirm, loading }) {
  return (
    <div className="arm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arm-modal arm-modal--sm">
        <div className="arm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="arm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="arm-modal-body">
          <p style={{ margin: '0 0 24px', color: '#374151' }}>{desc}</p>
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

// ─────────────────────────────────────────────────────────
// Tab 1: Loại phòng
// ─────────────────────────────────────────────────────────
function DepositPolicyModal({ policy, onClose, onSave }) {
  const isEdit = !!policy
  const [form, setForm] = useState({
    policyName: policy?.policyName || '',
    calculationType: policy?.calculationType || 'PERCENTAGE',
    policyValue: policy?.policyValue || '',
    description: policy?.description || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(isEdit ? `${DEPOSIT_API}/${policy.id}` : DEPOSIT_API, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
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
            <input type="number" value={form.policyValue} onChange={e => set('policyValue', e.target.value)} required min={1} placeholder={form.calculationType === 'PERCENTAGE' ? '50' : '200000'} />
          </label>
          <label className="arm-field"><span>Mô tả</span>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} maxLength={255} placeholder="Mô tả chính sách..." />
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

function DepositPoliciesTab({ depositPolicies, setDepositPolicies, showToast }) {
  const [modalPolicy, setModalPolicy] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${DEPOSIT_API}/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setDepositPolicies(prev => prev.filter(policy => policy.id !== deleteTarget.id))
      showToast('Đã xoá chính sách đặt cọc')
      setDeleteTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="arm-toolbar">
        <button className="arm-btn arm-btn--primary" type="button" onClick={() => setModalPolicy(null)}>+ Thêm chính sách đặt cọc</button>
      </div>
      <div className="arm-table-wrap">
        {depositPolicies.length === 0 ? <div className="arm-empty">Chưa có chính sách đặt cọc nào.</div> : (
          <table className="arm-table">
            <thead><tr><th>Tên chính sách</th><th>Cách tính</th><th>Giá trị</th><th>Mô tả</th><th></th></tr></thead>
            <tbody>
              {depositPolicies.map(policy => (
                <tr key={policy.id}>
                  <td className="arm-fw">{policy.policyName}</td>
                  <td>{policy.calculationType === 'PERCENTAGE' ? 'Theo phần trăm' : 'Số tiền cố định'}</td>
                  <td>{policy.calculationType === 'PERCENTAGE' ? `${Number(policy.policyValue)}%` : formatPrice(policy.policyValue)}</td>
                  <td>{policy.description || 'Chưa có'}</td>
                  <td>
                    <div className="arm-actions">
                      <button type="button" className="arm-icon-btn arm-icon-btn--edit" title="Sửa" onClick={() => setModalPolicy(policy)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" className="arm-icon-btn arm-icon-btn--delete" title="Xoá" onClick={() => setDeleteTarget(policy)}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modalPolicy !== undefined && (
        <DepositPolicyModal policy={modalPolicy} onClose={() => setModalPolicy(undefined)}
          onSave={(saved, isEdit) => {
            setDepositPolicies(prev => isEdit ? prev.map(policy => policy.id === saved.id ? saved : policy) : [...prev, saved])
            setModalPolicy(undefined)
            showToast(isEdit ? 'Đã cập nhật chính sách đặt cọc' : 'Đã tạo chính sách đặt cọc')
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Xoá chính sách đặt cọc"
          desc={`Xoá chính sách "${deleteTarget.policyName}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting} />
      )}
    </>
  )
}

function RoomTypesTab({ roomTypes, setRoomTypes, depositPolicies, showToast }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalType, setModalType] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => setPage(1), [search])

  const filtered = roomTypes.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/types/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setRoomTypes(prev => prev.filter(t => t.id !== deleteTarget.id))
      showToast('Đã xoá loại phòng')
      setDeleteTarget(null)
    } catch (err) { showToast(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="arm-toolbar">
        <input className="arm-search" placeholder="Tìm loại phòng..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="arm-btn arm-btn--primary" type="button" onClick={() => setModalType(null)}>+ Thêm loại phòng</button>
      </div>

      <div className="arm-table-wrap">
        {filtered.length === 0 ? <div className="arm-empty">Không có loại phòng nào.</div> : (
          <table className="arm-table">
            <thead><tr>
              <th>Tên loại phòng</th>
              <th>Giá / đêm</th>
              <th>Sức chứa</th>
              <th>Chính sách đặt cọc</th>
              <th>Số phòng</th>
              <th></th>
            </tr></thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id}>
                  <td className="arm-fw">{t.name}</td>
                  <td>{formatPrice(t.basePrice)}</td>
                  <td>{t.maxAdults} NL · {t.maxChildren} TE</td>
                  <td>{t.depositPolicyName || 'Chưa cấu hình'}</td>
                  <td>{t.roomCount} phòng</td>
                  <td>
                    <div className="arm-actions">
                      <button type="button" className="arm-icon-btn arm-icon-btn--edit" title="Sửa" onClick={() => setModalType(t)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" className="arm-icon-btn arm-icon-btn--delete" title="Xoá" onClick={() => setDeleteTarget(t)}>
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            setRoomTypes(prev => isEdit ? prev.map(t => t.id===saved.id ? { ...saved, roomCount: t.roomCount } : t) : [...prev, saved])
            setModalType(undefined)
            showToast(isEdit ? 'Đã cập nhật loại phòng' : 'Đã tạo loại phòng mới')
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Xoá loại phòng"
          desc={`Xoá loại phòng "${deleteTarget.name}"? Chỉ xoá được khi không còn phòng vật lý nào thuộc loại này.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Tab 2: Phòng vật lý
// ─────────────────────────────────────────────────────────
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
    const mst = !filterStatus || r.status === filterStatus
    return ms && mst
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
      const res = await fetch(`${API}/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      applyRooms(rooms.filter(r => r.id !== deleteTarget.id))
      showToast('Đã xoá phòng')
      setDeleteTarget(null)
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
        <button
          className="arm-btn arm-btn--primary"
          type="button"
          disabled={roomTypes.length === 0}
          title={roomTypes.length === 0 ? 'Cần tạo loại phòng trước' : undefined}
          onClick={() => setModalRoom(null)}
        >
          + Thêm phòng
        </button>
      </div>

      <div className="arm-table-wrap">
        {filtered.length === 0 ? <div className="arm-empty">Không có phòng nào.</div> : (
          <table className="arm-table">
            <thead><tr>
              <th>Ảnh đại diện</th>
              <th>Số phòng</th>
              <th>Loại phòng</th>
              <th>Trạng thái</th>
              <th>Ảnh</th>
              <th></th>
            </tr></thead>
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
                    <td>
                      <div className="arm-actions">
                        <button type="button" className="arm-icon-btn arm-icon-btn--edit" title="Sửa" onClick={() => setModalRoom(r)}>
                          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" className="arm-icon-btn arm-icon-btn--delete" title="Xoá" onClick={() => setDeleteTarget(r)}>
                          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
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
            const next = isEdit ? rooms.map(r => r.id === saved.id ? saved : r) : [...rooms, saved]
            applyRooms(next)
            setModalRoom(undefined)
            showToast(isEdit ? 'Đã cập nhật phòng' : 'Đã tạo phòng mới')
          }} />
      )}
      {imagesTarget && (
        <ImagesModal room={imagesTarget} onClose={() => setImagesTarget(null)}
          onUpdate={updated => {
            applyRooms(rooms.map(r => r.id === updated.id ? updated : r))
            setImagesTarget(updated)
          }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Xoá phòng"
          desc={`Xoá phòng #${deleteTarget.roomNumber}? Tất cả ảnh của phòng này cũng sẽ bị xoá.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Trang chính
// ─────────────────────────────────────────────────────────
function AdminRoomsPage({ activePage = 'rooms' }) {
  const [tab, setTab] = useState('types')
  const [depositPolicies, setDepositPolicies] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    Promise.all([
      fetch(DEPOSIT_API, { headers: authHeaders() }),
      fetch(`${API}/types`, { headers: authHeaders() }),
      fetch(API, { headers: authHeaders() }),
    ])
      .then(async ([policiesRes, typesRes, roomsRes]) => {
        if (!policiesRes.ok || !typesRes.ok || !roomsRes.ok) {
          const err = await (!policiesRes.ok ? policiesRes : typesRes.ok ? roomsRes : typesRes).json().catch(() => ({}))
          throw new Error(err.message || 'Không thể tải dữ liệu phòng')
        }
        const [policies, types, rms] = await Promise.all([policiesRes.json(), typesRes.json(), roomsRes.json()])
        const roomList = Array.isArray(rms) ? rms : []
        setDepositPolicies(Array.isArray(policies) ? policies : [])
        setRooms(roomList)
        setRoomTypes(syncRoomCounts(Array.isArray(types) ? types : [], roomList))
      })
      .catch(err => showToast(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout activePage={activePage}>
      <div className="arm-header">
        <div>
          <h1>Quản lí Phòng</h1>
          <p>{roomTypes.length} loại phòng · {rooms.length} phòng vật lý</p>
        </div>
      </div>

      <div className="arm-tabs">
        <button type="button" className={`arm-tab${tab==='deposit'?' arm-tab--active':''}`} onClick={() => setTab('deposit')}>
          Chính sách đặt cọc
        </button>
        <button type="button" className={`arm-tab${tab==='types'?' arm-tab--active':''}`} onClick={() => setTab('types')}>
          Loại phòng
        </button>
        <button type="button" className={`arm-tab${tab==='rooms'?' arm-tab--active':''}`} onClick={() => setTab('rooms')}>
          Phòng vật lý
        </button>
      </div>

      {loading ? (
        <div className="arm-empty" style={{ padding: 48 }}>Đang tải...</div>
      ) : tab === 'deposit' ? (
        <DepositPoliciesTab depositPolicies={depositPolicies} setDepositPolicies={setDepositPolicies} showToast={showToast} />
      ) : tab === 'types' ? (
        <RoomTypesTab roomTypes={roomTypes} setRoomTypes={setRoomTypes} depositPolicies={depositPolicies} showToast={showToast} />
      ) : (
        <RoomsTab rooms={rooms} setRooms={setRooms} setRoomTypes={setRoomTypes} roomTypes={roomTypes} showToast={showToast} />
      )}

      {toast && <div className="arm-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminRoomsPage
