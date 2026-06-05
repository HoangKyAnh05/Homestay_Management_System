import { useEffect, useMemo, useState } from 'react'
import {
  getCurrentProfile,
  getStoredUser,
  logout,
  updateCurrentAvatar,
  updateCurrentProfile,
} from '../../services/authService'
import './ProfilePage.css'

const MAX_AVATAR_SIZE = 10 * 1024 * 1024

const emptyProfile = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  avatarUrl: '',
  role: '',
}

function ProfilePage() {
  const storedUser = useMemo(() => getStoredUser(), [])
  const [profile, setProfile] = useState(storedUser || emptyProfile)
  const [formData, setFormData] = useState(storedUser || emptyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!storedUser) {
      window.location.assign('/login')
      return
    }

    const loadProfile = async () => {
      try {
        const data = await getCurrentProfile()
        const normalizedProfile = normalizeProfile(data)
        setProfile(normalizedProfile)
        setFormData(normalizedProfile)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [storedUser])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleEdit = () => {
    setMessage('')
    setErrorMessage('')
    setFormData(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
    setMessage('')
    setErrorMessage('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setIsSaving(true)

    try {
      const updatedProfile = await updateCurrentProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address,
      })

      const normalizedProfile = normalizeProfile(updatedProfile)
      setProfile(normalizedProfile)
      setFormData(normalizedProfile)
      setIsEditing(false)
      setMessage('Thông tin cá nhân đã được cập nhật')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMessage('')
      setErrorMessage('Anh dai dien khong duoc vuot qua 10MB')
      event.target.value = ''
      return
    }

    setMessage('')
    setErrorMessage('')
    setIsUploadingAvatar(true)

    try {
      const updatedProfile = await updateCurrentAvatar(file)
      const normalizedProfile = normalizeProfile(updatedProfile)
      setProfile(normalizedProfile)
      setFormData(normalizedProfile)
      setMessage('Ảnh đại diện đã được cập nhật')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  if (!storedUser) {
    return null
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <a className="profile-logo" href="/home">
          Home Stays
        </a>
        <nav className="profile-nav" aria-label="Điều hướng tài khoản">
          <a href="/home">Trang chủ</a>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </nav>
      </header>

      <section className="profile-shell" aria-labelledby="profile-title">
        <div className="profile-title-row">
          <div>
            <p>Tài khoản</p>
            <h1 id="profile-title">Thông tin cá nhân</h1>
          </div>
          {!isEditing && (
            <button className="profile-primary" type="button" onClick={handleEdit}>
              Chỉnh sửa thông tin cá nhân
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="profile-panel">Đang tải thông tin...</div>
        ) : (
          <>
            {message && <p className="profile-success">{message}</p>}
            {errorMessage && <p className="profile-error">{errorMessage}</p>}

            <section className="profile-summary" aria-label="Tóm tắt hồ sơ">
              <label className="profile-avatar" title="Cập nhật ảnh đại diện">
                <span className="profile-avatar-frame">
                  {profile.avatarUrl ? (
                    <img src={getAssetUrl(profile.avatarUrl)} alt={profile.fullName || profile.email} />
                  ) : (
                    <span>{getInitials(profile.fullName || profile.email)}</span>
                  )}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                <span className="profile-camera" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 7h8l1.5 2H20v10H4V9h2.5L8 7Z" />
                    <circle cx="12" cy="14" r="3" />
                  </svg>
                </span>
              </label>
              <div className="profile-summary-copy">
                <h2>{profile.fullName || profile.email}</h2>
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20V8l8-5 8 5v12" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                  Thành viên
                </p>
                <span>{profile.role || 'ROLE_CUSTOMER'}</span>
              </div>
              {isUploadingAvatar && <small>Đang tải ảnh...</small>}
            </section>

            <div className="profile-panel">
            {isEditing ? (
              <form className="profile-form" onSubmit={handleSave}>
                <ProfileInput
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <ProfileInput label="Email" name="email" value={formData.email} readOnly />
                <ProfileInput
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <ProfileInput
                  label="Ngày sinh"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                <ProfileInput
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
                <div className="profile-form-actions">
                  <button className="profile-secondary" type="button" onClick={handleCancel}>
                    Hủy
                  </button>
                  <button className="profile-primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <ProfileField label="Họ và tên" value={profile.fullName} />
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Số điện thoại" value={profile.phone} />
                <ProfileField label="Ngày sinh" value={profile.dateOfBirth} />
                <ProfileField label="Địa chỉ" value={profile.address} />
                <ProfileField label="Vai trò" value={profile.role} />
              </div>
            )}
          </div>
          </>
        )}
      </section>
    </main>
  )
}

function ProfileInput({ label, type = 'text', ...props }) {
  return (
    <label className="profile-input">
      <span>{label}</span>
      <input type={type} {...props} />
    </label>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span>{label}</span>
      <strong>{value || 'Chưa cập nhật'}</strong>
    </div>
  )
}

function normalizeProfile(profile) {
  return {
    ...emptyProfile,
    ...profile,
    dateOfBirth: profile?.dateOfBirth || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    avatarUrl: profile?.avatarUrl || '',
  }
}

function getAssetUrl(url) {
  if (!url || url.startsWith('http')) {
    return url
  }

  return `http://localhost:8080${url}`
}

function getInitials(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default ProfilePage
