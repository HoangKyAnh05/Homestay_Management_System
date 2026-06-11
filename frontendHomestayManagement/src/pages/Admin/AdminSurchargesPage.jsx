import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminServiceCategoriesPage.css'

const API = 'http://localhost:8080/api/admin/services/mini-bar-items'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function MiniBarModal({ item, onClose, onSave }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    name: item?.name || '',
    price: item?.price || '',
    quantityInStock: item?.quantityInStock ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(isEdit ? `${API}/${item.id}` : API, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          quantityInStock: Number(form.quantityInStock),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể lưu mặt hàng')
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
          <h3>{isEdit ? 'Chỉnh sửa' : 'Thêm'} mặt hàng mini-bar</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="asc-modal-body" onSubmit={handleSubmit}>
          <label className="asc-field">
            <span>Tên mặt hàng</span>
            <input value={form.name} onChange={e => set('name', e.target.value)} required maxLength={100} placeholder="Ví dụ: mì ly, bim bim, nước suối..." />
          </label>

          <label className="asc-field">
            <span>Giá</span>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required min="0" step="1000" placeholder="Nhập giá" />
          </label>

          <label className="asc-field">
            <span>Số lượng tồn kho tổng</span>
            <input type="number" value={form.quantityInStock} onChange={e => set('quantityInStock', e.target.value)} required min="0" step="1" />
          </label>

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

function DeleteModal({ item, loading, onClose, onConfirm }) {
  return (
    <div className="asc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="asc-modal asc-modal--sm">
        <div className="asc-modal-head">
          <h3>Xóa mặt hàng</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="asc-modal-body">
          <p className="asc-confirm">
            Bạn có chắc muốn xóa <strong>{item.name}</strong> khỏi danh mục mini-bar?
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

function AdminSurchargesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (message) => { setToast(message); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    fetch(API, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter(item => item.name?.toLowerCase().includes(keyword))
  }, [items, search])

  const totalStock = items.reduce((sum, item) => sum + Number(item.quantityInStock || 0), 0)

  const openCreate = () => {
    setEditItem(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setModalOpen(true)
  }

  const applySaved = (saved, isEdit) => {
    setItems(prev => isEdit ? prev.map(item => item.id === saved.id ? saved : item) : [...prev, saved])
    setModalOpen(false)
    setEditItem(null)
    showToast(isEdit ? 'Đã cập nhật mặt hàng' : 'Đã thêm mặt hàng')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Không thể xóa mặt hàng')
      }
      setItems(prev => prev.filter(item => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Đã xóa mặt hàng')
    } catch (err) {
      showToast(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout activePage="surcharges">
      <div className="asc-header">
        <div>
          <h1>Phụ phí Mini-bar</h1>
          <p>Quản lý thực phẩm đặt sẵn ở phòng và số lượng tồn kho tổng.</p>
        </div>
        <button type="button" className="asc-btn asc-btn--primary" onClick={openCreate}>
          + Thêm mặt hàng
        </button>
      </div>

      <div className="asc-tabs">
        <button type="button" className="asc-tab asc-tab--active">
          Mặt hàng mini-bar
          <span>{items.length}</span>
        </button>
        <button type="button" className="asc-tab" disabled>
          Tồn kho tổng
          <span>{totalStock}</span>
        </button>
      </div>

      <div className="asc-toolbar">
        <input className="asc-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên mặt hàng..." />
      </div>

      <div className="asc-table-wrap">
        {loading ? (
          <div className="asc-empty">Đang tải...</div>
        ) : filteredItems.length === 0 ? (
          <div className="asc-empty">Không tìm thấy mặt hàng nào.</div>
        ) : (
          <table className="asc-table">
            <thead>
              <tr>
                <th>Tên mặt hàng</th>
                <th>Giá bán/phụ phí</th>
                <th>Tồn kho tổng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>Thực phẩm mini-bar đặt sẵn trong phòng</small>
                  </td>
                  <td>{formatPrice(item.price)}</td>
                  <td>
                    <span className={`asc-badge ${item.quantityInStock > 0 ? 'asc-badge--stock' : 'asc-badge--inactive'}`}>
                      {item.quantityInStock} còn lại
                    </span>
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

      {modalOpen && (
        <MiniBarModal item={editItem} onClose={() => { setModalOpen(false); setEditItem(null) }} onSave={applySaved} />
      )}
      {deleteTarget && (
        <DeleteModal item={deleteTarget} loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
      {toast && <div className="asc-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminSurchargesPage
