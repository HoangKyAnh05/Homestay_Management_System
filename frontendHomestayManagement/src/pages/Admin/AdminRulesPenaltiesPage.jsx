import { useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminServiceCategoriesPage.css'

const API = 'http://localhost:8080/api/admin/rules-penalties'

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` }
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
}

function RulesPenaltyModal({ item, onClose, onSave }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    title: item?.title || '',
    penaltyAmount: item?.penaltyAmount || '',
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
          title: form.title,
          penaltyAmount: Number(form.penaltyAmount),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Không thể lưu nội quy/phạt')
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
          <h3>{isEdit ? 'Chỉnh sửa' : 'Thêm'} nội quy & phạt</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="asc-modal-body" onSubmit={handleSubmit}>
          <label className="asc-field">
            <span>Nội quy / hành vi vi phạm</span>
            <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={255} placeholder="Ví dụ: Hút thuốc trong phòng" />
          </label>

          <label className="asc-field">
            <span>Mức phạt mặc định</span>
            <input type="number" value={form.penaltyAmount} onChange={e => set('penaltyAmount', e.target.value)} required min="0" step="1000" placeholder="Nhập mức phạt" />
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
          <h3>Xóa nội quy</h3>
          <button type="button" className="asc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="asc-modal-body">
          <p className="asc-confirm">
            Bạn có chắc muốn xóa nội quy <strong>{item.title}</strong>?
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

function AdminRulesPenaltiesPage() {
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
    return items.filter(item => item.title?.toLowerCase().includes(keyword))
  }, [items, search])

  const totalPenaltyAmount = items.reduce((sum, item) => sum + Number(item.penaltyAmount || 0), 0)

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
    showToast(isEdit ? 'Đã cập nhật nội quy/phạt' : 'Đã thêm nội quy/phạt')
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
        throw new Error(data.message || 'Không thể xóa nội quy/phạt')
      }
      setItems(prev => prev.filter(item => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Đã xóa nội quy/phạt')
    } catch (err) {
      showToast(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout activePage="rules">
      <div className="asc-header">
        <div>
          <h1>Cấu hình Nội quy & Phạt</h1>
          <p>Quản lý danh mục nội quy và mức phạt mặc định khi khách vi phạm.</p>
        </div>
        <button type="button" className="asc-btn asc-btn--primary" onClick={openCreate}>
          + Thêm nội quy
        </button>
      </div>

      <div className="asc-tabs">
        <button type="button" className="asc-tab asc-tab--active">
          Nội quy & phạt
          <span>{items.length}</span>
        </button>
        {/*<button type="button" className="asc-tab" disabled>*/}
        {/*  Tổng mức phạt mẫu*/}
        {/*  <span>{formatPrice(totalPenaltyAmount)}</span>*/}
        {/*</button>*/}
      </div>

      <div className="asc-toolbar">
        <input className="asc-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo nội quy hoặc hành vi vi phạm..." />
      </div>

      <div className="asc-table-wrap">
        {loading ? (
          <div className="asc-empty">Đang tải...</div>
        ) : filteredItems.length === 0 ? (
          <div className="asc-empty">Không tìm thấy nội quy nào.</div>
        ) : (
          <table className="asc-table">
            <thead>
              <tr>
                <th>Nội quy / hành vi vi phạm</th>
                <th>Mức phạt mặc định</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small>Áp dụng khi ghi nhận phạt trong quá trình lưu trú</small>
                  </td>
                  <td>
                    <span className="asc-badge asc-badge--stock">{formatPrice(item.penaltyAmount)}</span>
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
        <RulesPenaltyModal item={editItem} onClose={() => { setModalOpen(false); setEditItem(null) }} onSave={applySaved} />
      )}
      {deleteTarget && (
        <DeleteModal item={deleteTarget} loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
      {toast && <div className="asc-toast">{toast}</div>}
    </AdminLayout>
  )
}

export default AdminRulesPenaltiesPage
