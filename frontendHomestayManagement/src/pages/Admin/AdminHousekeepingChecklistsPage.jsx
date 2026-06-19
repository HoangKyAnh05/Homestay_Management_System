import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import './AdminHousekeepingChecklistsPage.css'

const API = 'http://localhost:8080/api/admin/housekeeping/checklists'

const STARTER_ITEMS = [
  { title: 'Thay chăn ga gối', description: 'Thay mới và kiểm tra chăn, ga, vỏ gối sạch.', required: true, active: true },
  { title: 'Lau dọn phòng tắm', description: 'Vệ sinh sàn, lavabo, vòi sen và bổ sung đồ dùng.', required: true, active: true },
  { title: 'Bổ sung nước suối tiêu chuẩn', description: 'Bổ sung đúng số lượng nước miễn phí theo tiêu chuẩn phòng.', required: true, active: true },
]

function authHeaders() {
  return { Authorization: `Bearer ${getStoredToken()}`, 'Content-Type': 'application/json' }
}

async function request(path = '', options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } })
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || 'Không thể xử lý cấu hình checklist')
  return data
}

function cloneItems(items) {
  return (items || []).map(item => ({
    title: item.title || '',
    description: item.description || '',
    required: Boolean(item.required),
    active: item.active !== false,
  }))
}

function buildEditor(roomType, roomId) {
  const room = roomId ? roomType?.rooms?.find(item => item.roomId === roomId) : null
  const source = room?.overrideTemplate || roomType?.defaultTemplate
  const inherited = Boolean(room && !room.overrideTemplate)
  return {
    name: source?.name || `Checklist ${roomType?.roomTypeName || ''}`,
    active: source?.active !== false,
    version: inherited ? null : source?.version ?? null,
    items: source?.items?.length ? cloneItems(source.items) : cloneItems(STARTER_ITEMS),
  }
}

function AdminHousekeepingChecklistsPage() {
  const [roomTypes, setRoomTypes] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [editor, setEditor] = useState({ name: '', active: true, version: null, items: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedType = useMemo(
    () => roomTypes.find(item => item.roomTypeId === selectedTypeId) || roomTypes[0] || null,
    [roomTypes, selectedTypeId],
  )
  const selectedRoom = selectedRoomId
    ? selectedType?.rooms?.find(item => item.roomId === selectedRoomId) || null
    : null
  const isInherited = Boolean(selectedRoom && !selectedRoom.hasOverride)
  const isNewDefault = Boolean(selectedType && !selectedRoom && !selectedType.defaultTemplate)

  const loadData = useCallback(async (preferredTypeId, preferredRoomId) => {
    setLoading(true)
    try {
      const data = await request()
      const list = Array.isArray(data) ? data : []
      const type = list.find(item => item.roomTypeId === preferredTypeId) || list[0] || null
      const room = preferredRoomId && type?.rooms?.some(item => item.roomId === preferredRoomId)
        ? preferredRoomId
        : null
      setRoomTypes(list)
      setSelectedTypeId(type?.roomTypeId ?? null)
      setSelectedRoomId(room)
      setEditor(type ? buildEditor(type, room) : { name: '', active: true, version: null, items: [] })
      setDirty(false)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Đồng bộ dữ liệu cấu hình lần đầu với API quản trị.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const canLeaveEditor = () => !dirty || window.confirm('Bạn có thay đổi chưa lưu. Bạn vẫn muốn chuyển checklist?')

  const selectScope = (roomType, roomId = null) => {
    if (!canLeaveEditor()) return
    setSelectedTypeId(roomType.roomTypeId)
    setSelectedRoomId(roomId)
    setEditor(buildEditor(roomType, roomId))
    setDirty(false)
    setError('')
    setNotice('')
  }

  const updateEditor = patch => {
    setEditor(current => ({ ...current, ...patch }))
    setDirty(true)
  }

  const updateItem = (index, patch) => {
    updateEditor({ items: editor.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  }

  const addItem = () => updateEditor({
    items: [...editor.items, { title: '', description: '', required: true, active: true }],
  })

  const removeItem = index => {
    if (editor.items.length === 1) {
      setError('Checklist phải có ít nhất một hạng mục')
      return
    }
    updateEditor({ items: editor.items.filter((_, itemIndex) => itemIndex !== index) })
  }

  const moveItem = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= editor.items.length) return
    const items = [...editor.items]
    ;[items[index], items[nextIndex]] = [items[nextIndex], items[index]]
    updateEditor({ items })
  }

  const save = async () => {
    if (!selectedType) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const path = selectedRoomId
        ? `/rooms/${selectedRoomId}`
        : `/room-types/${selectedType.roomTypeId}`
      await request(path, {
        method: 'PUT',
        body: JSON.stringify(editor),
      })
      await loadData(selectedType.roomTypeId, selectedRoomId)
      setNotice(selectedRoomId ? `Đã lưu checklist riêng cho phòng ${selectedRoom.roomNumber}` : 'Đã lưu checklist mặc định')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetRoom = async () => {
    if (!selectedRoom?.hasOverride || !window.confirm(`Đặt phòng ${selectedRoom.roomNumber} về checklist mặc định của loại phòng?`)) return
    setSaving(true)
    setError('')
    try {
      await request(`/rooms/${selectedRoom.roomId}`, { method: 'DELETE' })
      await loadData(selectedType.roomTypeId, selectedRoom.roomId)
      setNotice(`Phòng ${selectedRoom.roomNumber} đang sử dụng lại checklist mặc định`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalRooms = roomTypes.reduce((sum, type) => sum + (type.rooms?.length || 0), 0)
  const customRooms = roomTypes.reduce((sum, type) => sum + (type.rooms?.filter(room => room.hasOverride).length || 0), 0)
  const configuredTypes = roomTypes.filter(type => type.defaultTemplate).length
  const activeItemCount = editor.items.filter(item => item.active).length

  return (
    <AdminLayout activePage="housekeeping-checklists">
      <div className="hkc-page">
        <header className="hkc-header">
          <div>
            <span className="hkc-eyebrow">TIÊU CHUẨN VỆ SINH</span>
            <h1>Cấu hình checklist</h1>
            <p>Thiết lập tiêu chuẩn theo loại phòng và tùy chỉnh riêng khi một phòng có yêu cầu đặc biệt.</p>
          </div>
          <button type="button" className="hkc-refresh" disabled={loading || saving} onClick={() => loadData(selectedTypeId, selectedRoomId)}>↻ Làm mới</button>
        </header>

        <div className="hkc-stats">
          <div><span>Loại phòng đã cấu hình</span><strong>{configuredTypes}/{roomTypes.length}</strong></div>
          <div><span>Tổng phòng vật lý</span><strong>{totalRooms}</strong></div>
          <div><span>Phòng có tùy chỉnh</span><strong>{customRooms}</strong></div>
          <div><span>Hạng mục đang áp dụng</span><strong>{activeItemCount}</strong></div>
        </div>

        {error && <div className="hkc-alert hkc-alert--error">{error}</div>}
        {notice && <div className="hkc-alert hkc-alert--success">{notice}</div>}

        <div className="hkc-workspace">
          <aside className="hkc-types">
            <div className="hkc-panel-title"><span>Loại phòng</span><b>{roomTypes.length}</b></div>
            {loading ? <div className="hkc-empty-small">Đang tải...</div> : roomTypes.length === 0 ? (
              <div className="hkc-empty-small">Chưa có loại phòng.</div>
            ) : roomTypes.map(type => {
              const active = type.roomTypeId === selectedType?.roomTypeId
              const customized = type.rooms?.filter(room => room.hasOverride).length || 0
              return (
                <button type="button" key={type.roomTypeId} className={`hkc-type${active ? ' is-active' : ''}`} onClick={() => selectScope(type)}>
                  <span className="hkc-type-icon">{type.roomTypeName?.charAt(0)?.toUpperCase()}</span>
                  <span><strong>{type.roomTypeName}</strong><small>{type.rooms?.length || 0} phòng · {customized} tùy chỉnh</small></span>
                  <i className={type.defaultTemplate ? 'is-ready' : ''}>{type.defaultTemplate ? '✓' : '!'}</i>
                </button>
              )
            })}
          </aside>

          <main className="hkc-editor">
            {!selectedType ? (
              <div className="hkc-editor-empty"><b>Chưa có loại phòng để cấu hình</b><span>Hãy tạo loại phòng trong mục Quản lý phòng trước.</span></div>
            ) : (
              <>
                <div className="hkc-scope-head">
                  <div>
                    <span className="hkc-eyebrow">{selectedType.roomTypeName}</span>
                    <h2>{selectedRoom ? `Phòng ${selectedRoom.roomNumber}` : 'Checklist mặc định'}</h2>
                    <p>{selectedRoom ? 'Cấu hình áp dụng riêng cho phòng vật lý này.' : 'Tất cả phòng thuộc loại này sẽ kế thừa checklist bên dưới.'}</p>
                  </div>
                  {selectedRoom && <span className={`hkc-source-badge${isInherited ? '' : ' is-custom'}`}>{isInherited ? 'Đang kế thừa' : 'Đang tùy chỉnh'}</span>}
                </div>

                <div className="hkc-scope-tabs">
                  <button type="button" className={!selectedRoomId ? 'is-active' : ''} onClick={() => selectScope(selectedType)}>
                    <b>Mặc định</b><span>Cho loại phòng</span>
                  </button>
                  {selectedType.rooms?.map(room => (
                    <button type="button" key={room.roomId} className={selectedRoomId === room.roomId ? 'is-active' : ''} onClick={() => selectScope(selectedType, room.roomId)}>
                      <b>Phòng {room.roomNumber}</b><span>{room.hasOverride ? 'Tùy chỉnh riêng' : 'Kế thừa'}</span>
                    </button>
                  ))}
                </div>

                {isInherited && (
                  <div className="hkc-inherit-note">
                    <span>↳</span>
                    <div><b>Đang dùng checklist mặc định</b><p>Chỉnh sửa và lưu sẽ tạo một checklist riêng cho phòng {selectedRoom.roomNumber}.</p></div>
                  </div>
                )}

                <div className="hkc-form-card">
                  <div className="hkc-form-row">
                    <label className="hkc-name-field"><span>Tên checklist</span><input maxLength={120} value={editor.name} onChange={event => updateEditor({ name: event.target.value })} placeholder="Ví dụ: Tiêu chuẩn vệ sinh Deluxe" /></label>
                    <label className="hkc-switch-field"><span>Áp dụng checklist</span><input type="checkbox" checked={editor.active} onChange={event => updateEditor({ active: event.target.checked })} /><i /></label>
                  </div>
                </div>

                <div className="hkc-items-head">
                  <div><span>Hạng mục công việc</span><h3>{editor.items.length} hạng mục</h3></div>
                  <button type="button" onClick={addItem}>＋ Thêm hạng mục</button>
                </div>

                <div className="hkc-items">
                  {editor.items.map((item, index) => (
                    <article className={`hkc-item${item.active ? '' : ' is-disabled'}`} key={index}>
                      <div className="hkc-order">
                        <b>{index + 1}</b>
                        <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label="Đưa lên">↑</button>
                        <button type="button" disabled={index === editor.items.length - 1} onClick={() => moveItem(index, 1)} aria-label="Đưa xuống">↓</button>
                      </div>
                      <div className="hkc-item-fields">
                        <input maxLength={200} value={item.title} onChange={event => updateItem(index, { title: event.target.value })} placeholder="Tên hạng mục vệ sinh" />
                        <textarea maxLength={500} rows={2} value={item.description} onChange={event => updateItem(index, { description: event.target.value })} placeholder="Hướng dẫn hoặc tiêu chuẩn cần đạt (không bắt buộc)" />
                        <div className="hkc-item-options">
                          <label><input type="checkbox" checked={item.required} onChange={event => updateItem(index, { required: event.target.checked })} /><span>Bắt buộc hoàn thành</span></label>
                          <label><input type="checkbox" checked={item.active} onChange={event => updateItem(index, { active: event.target.checked })} /><span>Đang áp dụng</span></label>
                        </div>
                      </div>
                      <button type="button" className="hkc-delete" onClick={() => removeItem(index)} aria-label="Xóa hạng mục">×</button>
                    </article>
                  ))}
                </div>

                <div className="hkc-actions">
                  <div>{selectedRoom?.hasOverride && <button type="button" className="hkc-reset" disabled={saving} onClick={resetRoom}>Đặt lại về mặc định</button>}</div>
                  <span>{dirty ? 'Có thay đổi chưa lưu' : isNewDefault ? 'Chưa có cấu hình đã lưu' : 'Dữ liệu đã đồng bộ'}</span>
                  <button type="button" className="hkc-save" disabled={saving || (!dirty && !isNewDefault)} onClick={save}>{saving ? 'Đang lưu...' : selectedRoom ? 'Lưu cho phòng này' : 'Lưu checklist mặc định'}</button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminHousekeepingChecklistsPage
