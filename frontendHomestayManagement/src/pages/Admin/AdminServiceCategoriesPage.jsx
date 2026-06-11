import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminServiceCategoriesPage.css'

const API = 'http://localhost:8080/api/admin/services'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function ServiceModal({ type, item, onClose, onSave }) {
  const isFacility = type === 'facility'
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    name: item?.name || '',
    price: item?.price || '',
    isActive: item?.isActive ?? true,
    quantityInStock: item?.quantityInStock ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = isFacility
      ? { name: form.name, price: Number(form.price), isActive: Boolean(form.isActive) }
      : { name: form.name, price: Number(form.price), quantityInStock: Number(form.quantityInStock) }

    try {
      const url = isEdit ? `${API}/${type}/${item.id}` : `${API}/${type}`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể lưu dịch vụ')
      onSave(data, isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="asc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="asc-modal">
        <div className="asc-modal-head">
          <h3>{isEdit ? 'Chỉnh sửa' : 'Thêm'} {isFacility ? 'dịch vụ tiện ích' : 'dịch vụ thuê đồ'}</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="asc-modal-body" onSubmit={handleSubmit}>
          <label className="asc-field">
            <span>Tên dịch vụ</span>
            <input value={form.name} onChange={e => set('name', e.target.value)} required maxLength={100} placeholder="Nhập tên dịch vụ" />
          </label>

          <label className="asc-field">
            <span>Giá</span>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required min="0" step="1000" placeholder="Nhập giá" />
          </label>

          {isFacility ? (
            <label className="asc-check">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <span>Đang hoạt động</span>
            </label>
          ) : (
            <label className="asc-field">
              <span>Số lượng tồn kho</span>
              <input type="number" value={form.quantityInStock} onChange={e => set('quantityInStock', e.target.value)} required min="0" step="1" />
            </label>
          )}

          {error && <p className="asc-error">{error}</p>}

          <div className="asc-modal-actions">
            <button type="button" className="asc-btn asc-btn--ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="asc-btn asc-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ item, type, loading, onClose, onConfirm }) {
  return (
    <div className="asc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="asc-modal asc-modal--sm">
        <div className="asc-modal-head">
          <h3>Xóa dịch vụ</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="asc-modal-body">
          <p className="asc-confirm">
            Bạn có chắc muốn xóa <strong>{item.name}</strong> khỏi {type === 'facility' ? 'dịch vụ tiện ích' : 'dịch vụ thuê đồ'}?
          </p>
          <div className="asc-modal-actions">
            <button type="button" className="asc-btn asc-btn--ghost" onClick={onClose}>Hủy</button>
            <button type="button" className="asc-btn asc-btn--danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminServiceCategoriesPage() {
  const [tab, setTab] = useState('facility')
  const [facilityServices, setFacilityServices] = useState([])
  const [inventoryServices, setInventoryServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const isFacility = tab === 'facility'
  const currentItems = isFacility ? facilityServices : inventoryServices
  const title = isFacility ? 'Dịch vụ tiện ích' : 'Dịch vụ thuê đồ'
  const showToast = (message) => { setToast(message); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/facility`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/inventory`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([facility, inventory]) => {
      setFacilityServices(Array.isArray(facility) ? facility : [])
      setInventoryServices(Array.isArray(inventory) ? inventory : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSearch('')
  }, [tab])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return currentItems
    return currentItems.filter(item => item.name?.toLowerCase().includes(keyword))
  }, [currentItems, search])

  const openCreate = () => {
    setEditItem(null)
    setModalType(tab)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setModalType(tab)
  }

  const applySaved = (saved, isEdit) => {
    const setter = modalType === 'facility' ? setFacilityServices : setInventoryServices
    setter(prev => isEdit ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved])
    setModalType(null)
    setEditItem(null)
    showToast(isEdit ? 'Đã cập nhật dịch vụ' : 'Đã thêm dịch vụ')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/${tab}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Không thể xóa dịch vụ')
      }
      const setter = tab === 'facility' ? setFacilityServices : setInventoryServices
      setter(prev => prev.filter(item => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Đã xóa dịch vụ')
    } catch (err) {
      showToast(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout activePage="service-categories">
      <div className="asc-header">
        <div>
          <h1>Danh mục Dịch vụ</h1>
          <p>Quản lý giá vé tiện ích và dịch vụ thuê đồ có trừ kho.</p>
        </div>
        <button type="button" className="asc-btn asc-btn--primary" onClick={openCreate}>
          + Thêm {isFacility ? 'tiện ích' : 'dịch vụ thuê đồ'}
        </button>
      </div>

      <div className="asc-tabs">
        <button type="button" className={`asc-tab${tab === 'facility' ? ' asc-tab--active' : ''}`} onClick={() => setTab('facility')}>
          Dịch vụ tiện ích
          <span>{facilityServices.length}</span>
        </button>
        <button type="button" className={`asc-tab${tab === 'inventory' ? ' asc-tab--active' : ''}`} onClick={() => setTab('inventory')}>
          Dịch vụ thuê đồ
          <span>{inventoryServices.length}</span>
        </button>
      </div>

      <div className="asc-toolbar">
        <input className="asc-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Tìm trong ${title.toLowerCase()}...`} />
      </div>

      <div className="asc-table-wrap">
        {loading ? (
          <div className="asc-empty">Đang tải...</div>
        ) : filteredItems.length === 0 ? (
          <div className="asc-empty">Không tìm thấy dịch vụ nào.</div>
        ) : (
          <table className="asc-table">
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Giá</th>
                <th>{isFacility ? 'Trạng thái' : 'Tồn kho'}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{isFacility ? 'Tiện ích tính phí' : 'Dịch vụ có quản lý tồn kho'}</small>
                  </td>
                  <td>{formatPrice(item.price)}</td>
                  <td>
                    {isFacility ? (
                      <span className={`asc-badge ${item.isActive ? 'asc-badge--active' : 'asc-badge--inactive'}`}>
                        {item.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                      </span>
                    ) : (
                      <span className={`asc-badge ${item.quantityInStock > 0 ? 'asc-badge--stock' : 'asc-badge--inactive'}`}>
                        {item.quantityInStock} còn lại
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="asc-actions">
                      <button type="button" className="asc-icon-btn asc-icon-btn--edit" title="Chỉnh sửa" onClick={() => openEdit(item)}>
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" className="asc-icon-btn asc-icon-btn--delete" title="Xóa" onClick={() => setDeleteTarget(item)}>
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

      {modalType && (
        <ServiceModal type={modalType} item={editItem} onClose={() => { setModalType(null); setEditItem(null) }} onSave={applySaved} />
      )}
      {deleteTarget && (
        <DeleteModal item={deleteTarget} type={tab} loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
      {toast && <div className="asc-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminServiceCategoriesPage
