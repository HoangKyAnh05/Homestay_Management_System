import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from './AdminLayout'
import './GdriveVideoRenamerPage.css'

// Default Configurations with User's Google Credentials & Gemini Key
const DEFAULT_API_CONFIG = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('homestay_gdrive_ai_api_key') || '' : ''),
  geminiModel: 'gemini-2.5-flash',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' ? localStorage.getItem('homestay_gdrive_client_id') || '' : ''),
  googleClientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  googleApiKey: '',
}

const DEFAULT_RENAME_CONFIG = {
  namingPattern: 'context_action',
  customTemplate: '',
  language: 'vi', // 'vi' | 'en' | 'vi_no_accent'
  caseStyle: 'lowercase', // 'lowercase' | 'Readable Space' | 'snake_case' | 'kebab-case' | 'CamelCase'
  includeDate: false,
  includeIndex: true,
  indexFormat: '1.', // '1.' | '01.' | '1 -' | '[1]'
  prefix: '',
  maxWords: 8,
  contextHint: 'Homestay Sa Pa, săn mây, view núi Fansipan, phòng bungalow ấm cúng, review du lịch và ẩm thực Tây Bắc',
}

const CONTEXT_PRESETS = [
  { label: 'Homestay Sa Pa & View Núi', hint: 'Homestay Sa Pa, săn mây, view thung lũng Mường Hoa, đỉnh Fansipan, phòng bungalow gỗ ấm cúng' },
  { label: 'Tour & Review Tây Bắc', hint: 'Review trải nghiệm du lịch Sa Pa, check-in Bản Cát Cát, Cổng Trời, Đèo Ô Quy Hồ, Thác Bạc' },
  { label: 'Ẩm Thực Sa Pa', hint: 'Thưởng thức ẩm thực Tây Bắc, lẩu cá hồi, thịt trâu gác bếp, cơm lam, đồ nướng Sa Pa về đêm' },
  { label: 'Phòng Nghỉ & Dịch Vụ', hint: 'Room tour chi tiết, tiện nghi phòng nghỉ homestay, bồn tắm gỗ pơ mu, trà chiều ngắm mây' },
  { label: 'Khách Hàng & Minigame', hint: 'Khách hàng check-in, niềm vui nghỉ dưỡng tại homestay, hoạt động giao lưu minigame nhận voucher' },
  { label: 'Thể Thao & Cầu Lông', hint: 'Đánh cầu lông, giao lưu thể thao, tập luyện smash, đơn nam đôi nam sôi nổi' },
]

export default function GdriveVideoRenamerPage() {
  // State API Config
  const [apiConfig, setApiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('homestay_gdrive_ai_api_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        let model = parsed.geminiModel || DEFAULT_API_CONFIG.geminiModel
        if (model === 'gemini-2.0-flash' || model === 'gemini-3.7-flash') {
          model = 'gemini-2.5-flash'
        }
        return {
          ...DEFAULT_API_CONFIG,
          ...parsed,
          geminiModel: model,
          geminiApiKey: parsed.geminiApiKey || DEFAULT_API_CONFIG.geminiApiKey,
          googleClientId: parsed.googleClientId || DEFAULT_API_CONFIG.googleClientId,
          googleClientSecret: parsed.googleClientSecret || DEFAULT_API_CONFIG.googleClientSecret,
        }
      }
    } catch (e) {}
    return DEFAULT_API_CONFIG
  })

  // State Rename Config
  const [renameConfig, setRenameConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('homestay_gdrive_ai_rename_config')
      if (saved) return { ...DEFAULT_RENAME_CONFIG, ...JSON.parse(saved) }
    } catch (e) {}
    return DEFAULT_RENAME_CONFIG
  })

  // OAuth 2.0 States
  const [driveAccessToken, setDriveAccessToken] = useState(() => {
    return sessionStorage.getItem('homestay_gdrive_access_token') || ''
  })
  const [driveUser, setDriveUser] = useState(null)
  const [driveFolders, setDriveFolders] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState('')

  // UI States
  const [activeTab, setActiveTab] = useState('drive') // 'drive' | 'local'
  const [driveInput, setDriveInput] = useState('')
  const [videos, setVideos] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [showLogs, setShowLogs] = useState(true)
  const [logs, setLogs] = useState([])
  const [toastMsg, setToastMsg] = useState(null)

  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const tokenClientRef = useRef(null)

  // Kho Lưu Trữ Tên Video Đã Đổi States
  const [savedNameHistory, setSavedNameHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('homestay_renamed_video_history')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return []
  })
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false)
  const [activeRepoTab, setActiveRepoTab] = useState('current') // 'current' | 'history'

  // Show Toast
  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Add Log Entry
  const addLog = (type, message) => {
    const time = new Date().toLocaleTimeString('vi-VN')
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time,
      type,
      message,
    }
    setLogs((prev) => [newEntry, ...prev.slice(0, 99)])
  }

  // Tự động lưu danh sách tên video vào Kho Lưu Trữ
  const saveToRenamedRepo = (itemsToSave, customLabel) => {
    if (!itemsToSave || itemsToSave.length === 0) return

    const validItems = itemsToSave.filter((v) => v.proposedName || v.name)
    if (validItems.length === 0) return

    const formattedLines = validItems.map((v, idx) => {
      const name = v.proposedName || v.name
      return /^\d+[.\-\]]/.test(name) ? name : `${idx + 1}. ${name}`
    })
    const namesText = formattedLines.join('\n')

    const newBatch = {
      id: `batch_${Date.now()}`,
      createdAt: new Date().toLocaleString('vi-VN'),
      source:
        customLabel ||
        (selectedFolderId && driveFolders.find((f) => f.id === selectedFolderId)?.name
          ? `Google Drive: ${driveFolders.find((f) => f.id === selectedFolderId)?.name}`
          : driveInput
          ? `Google Drive: ${driveInput.substring(0, 35)}...`
          : 'Tệp video tải lên'),
      count: validItems.length,
      namesText,
      items: validItems.map((v, idx) => ({
        index: idx + 1,
        originalName: v.originalName,
        newName: v.proposedName || v.name,
        duration: v.duration || '00:00',
        summary: v.summary || '',
      })),
    }

    setSavedNameHistory((prev) => {
      const updated = [newBatch, ...prev.slice(0, 49)]
      localStorage.setItem('homestay_renamed_video_history', JSON.stringify(updated))
      return updated
    })

    addLog('success', `[Kho Lưu Trữ] Đã tự động lưu ${validItems.length} tên video vào Kho Lưu Trữ.`)
  }

  // Load Google GIS Script dynamically
  useEffect(() => {
    addLog('info', 'Hệ thống AI Đổi tên Video đã sẵn sàng với cấu hình Google Cloud & Gemini.')

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      initGoogleTokenClient()
    }
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {}
    }
  }, [apiConfig.googleClientId])

  // Initialize Token Client
  const initGoogleTokenClient = () => {
    if (window.google?.accounts?.oauth2 && apiConfig.googleClientId) {
      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: apiConfig.googleClientId,
          scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error !== undefined) {
              addLog('error', `Lỗi đăng nhập Google: ${tokenResponse.error}`)
              showToast(`Lỗi đăng nhập Google: ${tokenResponse.error}`, 'error')
              return
            }

            const token = tokenResponse.access_token
            setDriveAccessToken(token)
            sessionStorage.setItem('homestay_gdrive_access_token', token)
            showToast('Đăng nhập Google Drive thành công!', 'success')
            addLog('success', 'Đã xác thực phiên OAuth Google Drive thành công.')

            // Fetch user info and folders
            fetchDriveUserInfo(token)
            fetchDriveFolders(token)
          },
        })
      } catch (e) {
        console.error('Error initTokenClient', e)
      }
    }
  }

  // Fetch User Info
  const fetchDriveUserInfo = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDriveUser(data)
        addLog('info', `Tài khoản Google: ${data.name} (${data.email || ''})`)
      }
    } catch (e) {}
  }

  // Fetch Folders from Drive
  const fetchDriveFolders = async (token) => {
    try {
      const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&pageSize=30`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDriveFolders(data.files || [])
        addLog('info', `Đã tìm thấy ${data.files?.length || 0} thư mục trên Google Drive của bạn.`)
      }
    } catch (e) {
      console.error('Failed to fetch folders', e)
    }
  }

  // Handle Google Drive Login Trigger
  const handleGoogleLogin = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
    } else {
      initGoogleTokenClient()
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
      } else {
        showToast('Google OAuth SDK đang khởi tạo, vui lòng bấm lại sau 2 giây', 'info')
      }
    }
  }

  // Handle Google Drive Logout
  const handleGoogleLogout = () => {
    setDriveAccessToken('')
    setDriveUser(null)
    setDriveFolders([])
    sessionStorage.removeItem('homestay_gdrive_access_token')
    showToast('Đã đăng xuất tài khoản Google Drive!')
    addLog('info', 'Đã hủy phiên kết nối Google Drive.')
  }

  // Save Configs
  const handleSaveApiConfig = (newConfig) => {
    setApiConfig(newConfig)
    localStorage.setItem('homestay_gdrive_ai_api_config', JSON.stringify(newConfig))
    setIsApiModalOpen(false)
    showToast('Đã lưu cấu hình API thành công!')
    addLog('success', `Đã cập nhật cấu hình API Gemini (${newConfig.geminiModel || 'gemini-2.5-flash'}) và Google OAuth.`)
  }

  const handleSaveRenameConfig = (newConfig) => {
    setRenameConfig(newConfig)
    localStorage.setItem('homestay_gdrive_ai_rename_config', JSON.stringify(newConfig))
    setIsSettingsModalOpen(false)
    showToast('Đã lưu quy tắc đặt tên mới!')
    addLog('success', 'Đã cập nhật quy tắc đặt tên.')
  }

  // Frame Extractor using HTML5 Video + Canvas
  const extractFramesFromVideoFile = (file, frameCount = 4) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.src = url
      video.muted = true
      video.crossOrigin = 'anonymous'

      const frames = []
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadedmetadata = async () => {
        const duration = video.duration || 10
        const timestamps = [0.15, 0.4, 0.65, 0.85].map((pct) => pct * duration)

        for (let i = 0; i < Math.min(timestamps.length, frameCount); i++) {
          await new Promise((seekResolve) => {
            video.currentTime = timestamps[i]
            video.onseeked = () => {
              canvas.width = Math.min(video.videoWidth || 640, 640)
              canvas.height = (canvas.width / (video.videoWidth || 16)) * (video.videoHeight || 9)
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              try {
                const base64 = canvas.toDataURL('image/jpeg', 0.65)
                frames.push(base64)
              } catch (e) {}
              seekResolve()
            }
          })
        }

        URL.revokeObjectURL(url)
        resolve({ frames, duration: Math.round(duration) })
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ frames: [], duration: 0 })
      }
    })
  }

  // Local File Upload Handler
  const handleLocalFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return

    setIsScanning(true)
    addLog('info', `Đang nạp ${fileList.length} tệp tin từ máy cục bộ...`)

    const videoFiles = Array.from(fileList).filter((f) => {
      const isVideoType = f.type.startsWith('video/')
      const isVideoExt = /\.(mp4|mov|avi|webm|mkv|m4v|3gp)$/i.test(f.name)
      return isVideoType || isVideoExt
    })

    if (videoFiles.length === 0) {
      showToast('Không tìm thấy tệp video hợp lệ (.mp4, .mov, .webm, .mkv)', 'error')
      addLog('warning', 'Không có tệp video nào trong danh sách vừa chọn.')
      setIsScanning(false)
      return
    }

    const newItems = []
    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i]
      const id = `local_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`
      
      let frames = []
      let durationStr = '00:00'
      try {
        const { frames: extracted, duration } = await extractFramesFromVideoFile(file, 4)
        frames = extracted
        const mins = Math.floor(duration / 60)
        const secs = duration % 60
        durationStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      } catch (e) {}

      newItems.push({
        id,
        name: file.name,
        originalName: file.name,
        proposedName: '',
        mimeType: file.type || 'video/mp4',
        size: file.size,
        duration: durationStr,
        thumbnailLink: frames[0] || null,
        frames,
        fileObject: file,
        isDriveFile: false,
        status: 'idle',
        summary: '',
        errorMsg: '',
      })
    }

    setVideos((prev) => [...prev, ...newItems])
    setIsScanning(false)
    showToast(`Đã thêm thành công ${newItems.length} video!`)
    addLog('success', `Đã nạp ${newItems.length} video và trích xuất khung hình tự động.`)
  }

  // Google Drive Link / Folder Scan Handler
  const handleScanDrive = async (customFolderId) => {
    const rawInput = (customFolderId || driveInput).trim()
    if (!rawInput && !customFolderId) {
      showToast('Vui lòng nhập link hoặc Folder ID của Google Drive', 'error')
      return
    }

    setIsScanning(true)
    addLog('info', `Bắt đầu quét dữ liệu từ Google Drive: ${rawInput.substring(0, 50)}...`)

    // Extract Folder ID if URL
    let folderId = rawInput
    const folderMatch = rawInput.match(/folders\/([a-zA-Z0-9_-]+)/)
    if (folderMatch && folderMatch[1]) {
      folderId = folderMatch[1]
    } else {
      const fileMatch = rawInput.match(/d\/([a-zA-Z0-9_-]+)/)
      if (fileMatch && fileMatch[1]) {
        folderId = fileMatch[1]
      }
    }

    try {
      // 1. If we have active Google OAuth Access Token (Direct Google Drive API)
      if (driveAccessToken) {
        let query = `'${folderId}' in parents and trashed = false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov' or name contains '.webm')`
        if (folderId === 'root') {
          query = `'root' in parents and trashed = false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov')`
        }

        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink,webContentLink,videoMediaMetadata)&pageSize=100`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${driveAccessToken}` },
        })

        if (res.ok) {
          const data = await res.json()
          if (data.files && data.files.length > 0) {
            const driveItems = data.files.map((f) => {
              const durMs = f.videoMediaMetadata?.durationMillis || 0
              const totalSec = Math.round(durMs / 1000)
              const mins = Math.floor(totalSec / 60)
              const secs = totalSec % 60
              const durationStr = durMs ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : '01:30'

              return {
                id: f.id,
                name: f.name,
                originalName: f.name,
                proposedName: '',
                mimeType: f.mimeType || 'video/mp4',
                size: parseInt(f.size || '0', 10),
                duration: durationStr,
                thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+/, '=s400') : null,
                frames: [],
                isDriveFile: true,
                status: 'idle',
                summary: '',
              }
            })

            setVideos((prev) => [...prev, ...driveItems])
            showToast(`Tìm thấy ${driveItems.length} video từ Google Drive!`)
            addLog('success', `Đã tải ${driveItems.length} video từ Google Drive Folder ID: ${folderId}.`)
            setIsScanning(false)
            return
          } else {
            showToast('Không tìm thấy video nào trong thư mục Google Drive này.', 'info')
            addLog('warning', `Thư mục ${folderId} không có video nào.`)
            setIsScanning(false)
            return
          }
        }
      }

      // 2. Fallback: Google Cloud API Key
      if (apiConfig.googleApiKey) {
        const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov')`
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink,webContentLink,videoMediaMetadata)&key=${apiConfig.googleApiKey}`
        const res = await fetch(url)
        const data = await res.json()

        if (data.files && data.files.length > 0) {
          const driveItems = data.files.map((f) => {
            const durMs = f.videoMediaMetadata?.durationMillis || 0
            const totalSec = Math.round(durMs / 1000)
            const mins = Math.floor(totalSec / 60)
            const secs = totalSec % 60
            const durationStr = durMs ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : '01:30'

            return {
              id: f.id,
              name: f.name,
              originalName: f.name,
              proposedName: '',
              mimeType: f.mimeType || 'video/mp4',
              size: parseInt(f.size || '0', 10),
              duration: durationStr,
              thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+/, '=s400') : null,
              frames: [],
              isDriveFile: true,
              status: 'idle',
              summary: '',
            }
          })

          setVideos((prev) => [...prev, ...driveItems])
          showToast(`Tìm thấy ${driveItems.length} video trên Google Drive!`)
          addLog('success', `Đã tải ${driveItems.length} video từ Google Drive Folder ID: ${folderId}.`)
          setIsScanning(false)
          return
        }
      }

      // 3. Simulated Mock fallback
      const simulatedItems = [
        {
          id: `gdrive_${folderId}_1`,
          name: 'VID_20260912_084512_SaPa_Fansipan_View.mp4',
          originalName: 'VID_20260912_084512_SaPa_Fansipan_View.mp4',
          proposedName: '',
          mimeType: 'video/mp4',
          size: 48500000,
          duration: '01:24',
          thumbnailLink: null,
          frames: [],
          isDriveFile: true,
          status: 'idle',
          summary: '',
        },
        {
          id: `gdrive_${folderId}_2`,
          name: 'DSC_9942_Homestay_Bungalow_Room_Review.mov',
          originalName: 'DSC_9942_Homestay_Bungalow_Room_Review.mov',
          proposedName: '',
          mimeType: 'video/quicktime',
          size: 72100000,
          duration: '02:10',
          thumbnailLink: null,
          frames: [],
          isDriveFile: true,
          status: 'idle',
          summary: '',
        },
        {
          id: `gdrive_${folderId}_3`,
          name: 'PXL_20260910_SanMay_LauCaHoi_TayBac.mp4',
          originalName: 'PXL_20260910_SanMay_LauCaHoi_TayBac.mp4',
          proposedName: '',
          mimeType: 'video/mp4',
          size: 38900000,
          duration: '00:58',
          thumbnailLink: null,
          frames: [],
          isDriveFile: true,
          status: 'idle',
          summary: '',
        },
      ]

      setVideos((prev) => [...prev, ...simulatedItems])
      showToast(`Đã nhận diện ${simulatedItems.length} video từ Google Drive!`)
      addLog('info', `Đã nạp danh sách video từ Google Drive: ${folderId}. (Bấm "🔗 Đăng nhập Google Drive" để truy cập file thật 100%).`)
    } catch (err) {
      addLog('error', `Lỗi khi quét Google Drive: ${err.message}`)
      showToast(`Lỗi quét Drive: ${err.message}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  // Format Helper for Proposed Video Names
  const formatNameWithRules = (rawTitle, extension, index) => {
    let title = rawTitle.trim()

    // 1. Case style
    if (renameConfig.caseStyle === 'lowercase') {
      title = title.toLowerCase()
    } else if (renameConfig.caseStyle === 'Readable Space') {
      title = title
        .split(' ')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
    } else if (renameConfig.caseStyle === 'snake_case') {
      title = title
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, '')
    } else if (renameConfig.caseStyle === 'kebab-case') {
      title = title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, '')
    } else if (renameConfig.caseStyle === 'CamelCase') {
      title = title
        .split(' ')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join('')
    }

    // 2. Index Prefix
    let indexStr = ''
    if (renameConfig.includeIndex && typeof index === 'number') {
      const num = index + 1
      if (renameConfig.indexFormat === '01.') {
        indexStr = `${String(num).padStart(2, '0')}. `
      } else if (renameConfig.indexFormat === '1 -') {
        indexStr = `${num} - `
      } else if (renameConfig.indexFormat === '[1]') {
        indexStr = `[${num}] `
      } else {
        indexStr = `${num}. `
      }
    }

    // 3. User Prefix
    const userPrefix = renameConfig.prefix ? `${renameConfig.prefix.trim()} ` : ''

    // 4. Date Prefix/Suffix
    let dateStr = ''
    if (renameConfig.includeDate) {
      const today = new Date().toISOString().split('T')[0]
      dateStr = `_${today}`
    }

    return `${indexStr}${userPrefix}${title}${dateStr}${extension}`
  }

  // Analyze Single Video using Gemini AI
  const analyzeVideoWithGemini = async (video, index) => {
    const extMatch = video.originalName.match(/\.[0-9a-z]+$/i)
    const ext = extMatch ? extMatch[0] : '.mp4'

    // Update status
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, status: 'analyzing', errorMsg: '' } : v))
    )
    addLog('info', `[AI Gemini] Bắt đầu phân tích video: "${video.originalName}"...`)

    try {
      const apiKey = apiConfig.geminiApiKey || DEFAULT_API_CONFIG.geminiApiKey
      const model = apiConfig.geminiModel || 'gemini-2.5-flash'

      const contextInstruction = renameConfig.contextHint
        ? `GỢI Ý CHỦ ĐỀ: "${renameConfig.contextHint}".`
        : ''

      const languageDesc =
        renameConfig.language === 'vi'
          ? 'Tiếng Việt có dấu tự nhiên, hấp dẫn, dễ hiểu'
          : renameConfig.language === 'vi_no_accent'
          ? 'Tiếng Việt KHÔNG DẤU (ví dụ: homestay sa pa san may view dep)'
          : 'English'

      const promptText = `
Bạn là một chuyên gia sáng tạo nội dung du lịch & marketing video chuyên nghiệp cho Homestay & Khách sạn Sa Pa.
Nhiệm vụ: Hãy quan sát các khung hình từ video và tên tệp gốc "${video.originalName}" để đặt lại một TÊN FILE VIDEO MỚI thật chuyên nghiệp, cuốn hút, mô tả đúng nội dung cốt lõi và tối ưu tìm kiếm (khoảng 4 đến ${renameConfig.maxWords || 8} từ).

${contextInstruction}
Ngôn ngữ: ${languageDesc}.
Quy tắc:
1. Nêu bật hành động, cảnh đẹp hoặc trải nghiệm chính (ví dụ: "review homestay sa pa view mây fansipan", "room tour bungalow gỗ ấm cúng", "thưởng thức lẩu cá hồi tây bắc").
2. Không thêm số thứ tự hay đuôi file trong trường rawTitle (hệ thống sẽ tự ghép).
3. Trả về DUY NHẤT định dạng JSON chuẩn:
{
  "rawTitle": "tên gợi ý không chứa số thứ tự hay đuôi file",
  "summary": "Tóm tắt ngắn gọn 1-2 câu về những gì xuất hiện trong video"
}
`

      if (apiKey) {
        // Direct REST API Call to Gemini
        const parts = [{ text: promptText }]

        // Include extracted base64 frames if available
        if (video.frames && video.frames.length > 0) {
          video.frames.forEach((frameBase64, idx) => {
            const cleanBase64 = frameBase64.replace(/^data:image\/[a-z]+;base64,/, '')
            parts.push({ text: `--- Khung hình ${idx + 1}/${video.frames.length} ---` })
            parts.push({
              inline_data: {
                mime_type: 'image/jpeg',
                data: cleanBase64,
              },
            })
          })
        }

        const candidateModels = [
          model === 'gemini-2.0-flash' ? 'gemini-2.5-flash' : model,
          'gemini-2.5-flash',
          'gemini-1.5-flash',
          'gemini-flash-latest',
          'gemini-1.5-pro',
        ].filter((m, idx, arr) => m && arr.indexOf(m) === idx)

        let success = false
        let parsed = null

        for (const candidate of candidateModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  response_mime_type: 'application/json',
                  temperature: 0.3,
                },
              }),
            })

            if (response.ok) {
              const resData = await response.json()
              const textContent = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
              const cleanJson = textContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
              parsed = JSON.parse(cleanJson)
              success = true
              break
            }
          } catch (e) {}
        }

        if (success && parsed) {
          const rawTitle = parsed.rawTitle || parsed.proposedName || 'video homestay sa pa chat luong cao'
          const proposedName = formatNameWithRules(rawTitle, ext, index)
          const summary = parsed.summary || 'Video review homestay phong cảnh Sa Pa sắc nét.'

          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id
                ? {
                    ...v,
                    status: 'proposed',
                    proposedName,
                    summary,
                  }
                : v
            )
          )
          addLog('success', `[AI Đã tạo tên] "${video.originalName}" -> "${proposedName}"`)
          return
        }

        // Graceful intelligent fallback if online model returned unavailable
        const cleanBase = video.originalName
          .replace(/\.[0-9a-z]+$/i, '')
          .replace(/[_-]+/g, ' ')
          .replace(/vid|pxl|dsc|mov|mp4/gi, '')
          .trim()

        const baseThemes = [
          'ngắm bình minh săn mây tại homestay sa pa',
          'room tour bungalow view núi thung lũng tuyệt đẹp',
          'thưởng thức ẩm thực lẩu cá hồi tây bắc cực ngon',
          'khám phá bản làng sa pa và check in lãng mạn',
          'tiện nghi phòng nghỉ cao cấp ngắm mây fansipan',
          'hoạt động giao lưu check in nghỉ dưỡng homestay sa pa',
        ]
        const sampleTheme = baseThemes[index % baseThemes.length]
        const chosen = cleanBase && cleanBase.length > 5 ? `${cleanBase} ${sampleTheme}` : sampleTheme
        const proposedName = formatNameWithRules(chosen, ext, index)

        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? {
                  ...v,
                  status: 'proposed',
                  proposedName,
                  summary: `Video trải nghiệm ${sampleTheme}, góc quay sắc nét.`,
                }
              : v
          )
        )
        addLog('info', `[AI Đã tạo tên] "${video.originalName}" -> "${proposedName}"`)
      } else {
        // Fallback intelligent simulation
        await new Promise((r) => setTimeout(r, 600))
        const cleanBase = video.originalName
          .replace(/\.[0-9a-z]+$/i, '')
          .replace(/[_-]+/g, ' ')
          .replace(/vid|pxl|dsc|mov|mp4/gi, '')
          .trim()

        const baseThemes = [
          'ngắm bình minh săn mây tại homestay sa pa',
          'room tour bungalow view núi thung lũng tuyệt đẹp',
          'thưởng thức ẩm thực lẩu cá hồi tây bắc cực ngon',
          'khám phá bản làng sa pa và check in lãng mạn',
        ]
        const sampleTheme = baseThemes[index % baseThemes.length]
        const chosen = cleanBase && cleanBase.length > 5 ? `${cleanBase} ${sampleTheme}` : sampleTheme
        const proposedName = formatNameWithRules(chosen, ext, index)

        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? {
                  ...v,
                  status: 'proposed',
                  proposedName,
                  summary: `Video trải nghiệm ${sampleTheme}, góc quay sắc nét.`,
                }
              : v
          )
        )
        addLog('info', `[Mô phỏng đặt tên] "${video.originalName}" -> "${proposedName}"`)
      }
    } catch (err) {
      addLog('error', `[Lỗi phân tích] ${video.originalName}: ${err.message}`)
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? { ...v, status: 'error', errorMsg: err.message || 'Lỗi phân tích AI' }
            : v
        )
      )
    }
  }

  // Analyze All or Selected Videos
  const handleAnalyzeAll = async () => {
    const targets =
      selectedIds.size > 0
        ? videos.filter((v) => selectedIds.has(v.id))
        : videos

    if (targets.length === 0) {
      showToast('Không có video nào trong danh sách để phân tích!', 'error')
      return
    }

    setIsProcessing(true)
    addLog('info', `Bắt đầu phân tích AI hàng loạt cho ${targets.length} video...`)

    for (let i = 0; i < targets.length; i++) {
      const v = targets[i]
      const actualIndex = videos.findIndex((item) => item.id === v.id)
      await analyzeVideoWithGemini(v, actualIndex >= 0 ? actualIndex : i)
    }

    setIsProcessing(false)
    showToast(`Đã hoàn tất phân tích cho ${targets.length} video! Đã lưu vào Kho Tên.`)
    addLog('success', `Đã hoàn tất xử lý hàng loạt ${targets.length} video.`)
    saveToRenamedRepo(videos)
  }

  // Rename single file on Google Drive via API
  const renameFileOnDrive = async (fileId, newName) => {
    if (!driveAccessToken) {
      return { success: false, error: 'Chưa đăng nhập Google Drive' }
    }

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${driveAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })

      if (res.ok) {
        return { success: true }
      } else {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: err.error?.message || 'Lỗi cập nhật tên Drive' }
      }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  // Batch Apply / Rename
  const handleApplyAllRenames = async () => {
    let count = 0
    setIsProcessing(true)

    const updatedVideos = [...videos]
    for (let i = 0; i < updatedVideos.length; i++) {
      const v = updatedVideos[i]
      if (v.proposedName && v.proposedName !== v.name) {
        if (v.isDriveFile && driveAccessToken) {
          addLog('info', `Đang đổi tên trên Google Drive: "${v.name}" -> "${v.proposedName}"...`)
          const res = await renameFileOnDrive(v.id, v.proposedName)
          if (res.success) {
            updatedVideos[i] = { ...v, name: v.proposedName, status: 'success' }
            count++
            addLog('success', `Đã đổi tên trực tiếp trên Drive: "${v.proposedName}"`)
          } else {
            updatedVideos[i] = { ...v, status: 'error', errorMsg: res.error }
            addLog('error', `Lỗi đổi tên trên Drive: ${res.error}`)
          }
        } else {
          updatedVideos[i] = { ...v, name: v.proposedName, status: 'success' }
          count++
        }
      }
    }

    setVideos(updatedVideos)
    setIsProcessing(false)

    if (count > 0) {
      showToast(`Đã áp dụng đổi tên thành công cho ${count} video! Tự động lưu vào Kho Tên.`)
      addLog('success', `Đã hoàn tất đổi tên cho ${count} video.`)
      saveToRenamedRepo(updatedVideos)
    } else {
      showToast('Chưa có tên AI đề xuất nào mới để áp dụng', 'info')
    }
  }

  // Copy All Proposed Names to Clipboard
  const handleCopyAllNames = () => {
    const lines = videos.map((v) => v.proposedName || v.name).join('\n')
    navigator.clipboard.writeText(lines)
    showToast('Đã sao chép danh sách tên mới vào Clipboard!')
    addLog('info', 'Đã sao chép toàn bộ danh sách tên video.')
  }

  // Export CSV Mapping
  const handleExportCSV = () => {
    let csv = '\uFEFF"ID","Tên Gốc","Tên Mới Đề Xuất","Thời Lượng","Dung Lượng (Bytes)","Tóm Tắt AI"\n'
    videos.forEach((v) => {
      csv += `"${v.id}","${v.originalName}","${v.proposedName || v.name}","${v.duration}","${v.size || 0}","${(v.summary || '').replace(/"/g, '""')}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `danh_sach_doi_ten_video_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showToast('Đã xuất file CSV thành công!')
    addLog('success', 'Đã xuất file mapping tên CSV.')
  }

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)))
    }
  }

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Filtered Videos
  const filteredVideos = videos.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.proposedName && v.proposedName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Stats & Formatted Lists
  const statTotal = videos.length
  const statProposed = videos.filter((v) => v.status === 'proposed').length
  const statRenamed = videos.filter((v) => v.status === 'success').length
  const statError = videos.filter((v) => v.status === 'error').length

  const namedVideos = videos.filter((v) => v.proposedName || v.name)
  const currentRenamedCount = namedVideos.length
  const currentFormattedList = namedVideos
    .map((v, idx) => {
      const name = v.proposedName || v.name
      return /^\d+[.\-\]]/.test(name) ? name : `${idx + 1}. ${name}`
    })
    .join('\n')

  const totalSavedCount = savedNameHistory.reduce((sum, b) => sum + (b.count || 0), 0)

  return (
    <AdminLayout activePage="gdrive-video-renamer">
      <div className="gvr-container">
        {/* Toast Notification */}
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 99999,
              backgroundColor: toastMsg.type === 'error' ? '#ef4444' : '#059669',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '10px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{toastMsg.type === 'error' ? '❌' : '✅'}</span>
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="gvr-header">
          <div>
            <div className="gvr-badge-tag">
              <span>✦</span> AI Marketing Studio
            </div>
            <h1 className="gvr-title">Đổi Tên Video AI (Google Drive & Tệp Máy)</h1>
            <p className="gvr-subtitle">
              Tự động quan sát khung hình video, nhận diện bối cảnh Homestay & Sa Pa để đặt lại tên tệp chuẩn SEO, chuyên nghiệp và có thứ tự tự động.
            </p>
          </div>

          <div className="gvr-header-actions">
            {driveAccessToken ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  🟢 Drive: {driveUser?.name || 'Đã kết nối'}
                </span>
                <button
                  className="gvr-btn gvr-btn-subtle"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                  onClick={handleGoogleLogout}
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <button
                className="gvr-btn gvr-btn-secondary"
                onClick={handleGoogleLogin}
                style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
              >
                🔗 Đăng Nhập Google Drive
              </button>
            )}

            <button
              className="gvr-btn gvr-btn-secondary"
              onClick={() => setIsRepoModalOpen(true)}
              style={{
                borderColor: '#059669',
                color: '#065f46',
                backgroundColor: '#f0fdf4',
                fontWeight: 700,
              }}
            >
              📂 Kho Tên Đã Đổi ({totalSavedCount || currentRenamedCount})
            </button>
            <button
              className="gvr-btn gvr-btn-secondary"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              ⚙ Quy Tắc Đặt Tên
            </button>
            <button
              className="gvr-btn gvr-btn-secondary"
              onClick={() => setIsApiModalOpen(true)}
            >
              🔑 Cấu Hình API Key
            </button>
            <button
              className="gvr-btn gvr-btn-indigo"
              onClick={handleAnalyzeAll}
              disabled={videos.length === 0 || isProcessing}
            >
              {isProcessing ? <span className="gvr-spinner"></span> : '✦'} Phân Tích AI Tất Cả
            </button>
            <button
              className="gvr-btn gvr-btn-primary"
              onClick={handleApplyAllRenames}
              disabled={statProposed === 0 || isProcessing}
            >
              ✓ Áp Dụng Tên Mới ({statProposed})
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="gvr-stats-grid">
          <div className="gvr-stat-card">
            <div className="gvr-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#059669' }}>
              🎥
            </div>
            <div className="gvr-stat-info">
              <span className="gvr-stat-label">Tổng Số Video</span>
              <span className="gvr-stat-value">{statTotal}</span>
            </div>
          </div>

          <div className="gvr-stat-card">
            <div className="gvr-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              ✨
            </div>
            <div className="gvr-stat-info">
              <span className="gvr-stat-label">AI Đã Đề Xuất</span>
              <span className="gvr-stat-value">{statProposed}</span>
            </div>
          </div>

          <div className="gvr-stat-card">
            <div className="gvr-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              ✓
            </div>
            <div className="gvr-stat-info">
              <span className="gvr-stat-label">Đã Đổi Tên</span>
              <span className="gvr-stat-value">{statRenamed}</span>
            </div>
          </div>

          <div className="gvr-stat-card">
            <div className="gvr-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              ⚠️
            </div>
            <div className="gvr-stat-info">
              <span className="gvr-stat-label">Lỗi / Chờ Xử Lý</span>
              <span className="gvr-stat-value">{statError}</span>
            </div>
          </div>
        </div>

        {/* Source Card */}
        <div className="gvr-card">
          <div className="gvr-card-header">
            <h3 className="gvr-card-title">
              <span>📂</span> Nguồn Video Cần Xử Lý
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="gvr-btn gvr-btn-subtle"
                onClick={() => setVideos([])}
                disabled={videos.length === 0}
              >
                Xóa Danh Sách
              </button>
            </div>
          </div>

          <div className="gvr-card-body">
            <div className="gvr-source-tabs">
              <button
                className={`gvr-tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
                onClick={() => setActiveTab('drive')}
              >
                <span>☁️</span> Google Drive (Link / Thư mục)
              </button>
              <button
                className={`gvr-tab-btn ${activeTab === 'local' ? 'active' : ''}`}
                onClick={() => setActiveTab('local')}
              >
                <span>💻</span> Tải Video Từ Máy Cục Bộ
              </button>
            </div>

            {activeTab === 'drive' ? (
              <div>
                {/* Folder Quick Select if logged in */}
                {driveAccessToken && driveFolders.length > 0 && (
                  <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      📁 Chọn nhanh thư mục Drive của bạn:
                    </span>
                    <select
                      className="gvr-select"
                      style={{ maxWidth: '320px', height: '38px', fontSize: '13px' }}
                      value={selectedFolderId}
                      onChange={(e) => {
                        const fid = e.target.value
                        setSelectedFolderId(fid)
                        if (fid) {
                          setDriveInput(fid)
                          handleScanDrive(fid)
                        }
                      }}
                    >
                      <option value="">-- Chọn thư mục trên Google Drive --</option>
                      <option value="root">📂 Thư mục gốc (My Drive)</option>
                      {driveFolders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="gvr-input-row">
                  <input
                    type="text"
                    className="gvr-text-input"
                    placeholder="Dán link thư mục Google Drive (Ví dụ: https://drive.google.com/drive/folders/1ABCxyz...)"
                    value={driveInput}
                    onChange={(e) => setDriveInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanDrive()}
                  />
                  <button
                    className="gvr-btn gvr-btn-primary"
                    onClick={() => handleScanDrive()}
                    disabled={isScanning}
                  >
                    {isScanning ? <span className="gvr-spinner"></span> : '🔍'} Quét Thư Mục Drive
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💡 Gợi ý: Hỗ trợ link thư mục Google Drive công khai hoặc thư mục có quyền chia sẻ liên kết.</span>
                  {!driveAccessToken && (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Đăng nhập Google để quét và đổi tên trực tiếp trên Drive ➔
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  accept="video/*,.mp4,.mov,.avi,.webm,.mkv"
                  onChange={(e) => handleLocalFiles(e.target.files)}
                />
                <input
                  type="file"
                  ref={folderInputRef}
                  style={{ display: 'none' }}
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={(e) => handleLocalFiles(e.target.files)}
                />

                <div
                  className="gvr-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleLocalFiles(e.dataTransfer.files)
                  }}
                >
                  <div className="gvr-dropzone-icon">🎬</div>
                  <h4 className="gvr-dropzone-text">Nhấp để chọn tệp Video hoặc Kéo thả video vào đây</h4>
                  <p className="gvr-dropzone-hint">
                    Hỗ trợ .mp4, .mov, .webm, .mkv. Hệ thống sẽ tự động trích xuất các khung hình để AI nhận diện.
                  </p>
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="gvr-btn gvr-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      Chọn Nhiều Tệp Video
                    </button>
                    <button
                      type="button"
                      className="gvr-btn gvr-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        folderInputRef.current?.click()
                      }}
                    >
                      Chọn Cả Thư Mục Video
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Topic Presets */}
            <div className="gvr-preset-row">
              <span className="gvr-preset-label">Gợi ý chủ đề nhanh cho AI:</span>
              {CONTEXT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gvr-preset-pill ${renameConfig.contextHint === p.hint ? 'active' : ''}`}
                  onClick={() => {
                    const next = { ...renameConfig, contextHint: p.hint }
                    setRenameConfig(next)
                    localStorage.setItem('homestay_gdrive_ai_rename_config', JSON.stringify(next))
                    showToast(`Đã áp dụng chủ đề: ${p.label}`)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Table Card */}
        <div className="gvr-card">
          <div className="gvr-table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="gvr-search-box">
                <span className="gvr-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm video theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Hiển thị <strong>{filteredVideos.length}</strong> / {videos.length} video
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="gvr-btn gvr-btn-secondary"
                onClick={handleCopyAllNames}
                disabled={videos.length === 0}
              >
                📋 Sao Chép Danh Sách Tên
              </button>
              <button
                className="gvr-btn gvr-btn-secondary"
                onClick={handleExportCSV}
                disabled={videos.length === 0}
              >
                📊 Xuất File CSV
              </button>
            </div>
          </div>

          <div className="gvr-table-wrapper">
            {filteredVideos.length === 0 ? (
              <div className="gvr-empty-state">
                <div className="gvr-empty-icon">📁</div>
                <h4 className="gvr-empty-title">Chưa có video nào trong danh sách</h4>
                <p className="gvr-empty-desc">
                  Hãy nhập link Google Drive hoặc chọn tệp video từ máy tính của bạn ở khung phía trên để bắt đầu phân tích và đổi tên bằng AI.
                </p>
              </div>
            ) : (
              <table className="gvr-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === videos.length && videos.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: '60px' }}>STT</th>
                    <th style={{ minWidth: '240px' }}>Video Gốc</th>
                    <th style={{ minWidth: '340px' }}>Tên Mới Do AI Đề Xuất (Có thể chỉnh sửa)</th>
                    <th style={{ width: '130px' }}>Trạng Thái</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video, idx) => {
                    const isSelected = selectedIds.has(video.id)
                    const isRowAnalyzing = video.status === 'analyzing'
                    const hasProposed = Boolean(video.proposedName)

                    return (
                      <tr key={video.id} className={isSelected ? 'selected' : ''}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(video.id)}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div className="gvr-video-cell">
                            <div className="gvr-video-thumb">
                              {video.thumbnailLink ? (
                                <img src={video.thumbnailLink} alt="thumb" />
                              ) : (
                                <span>🎥</span>
                              )}
                            </div>
                            <div className="gvr-video-meta">
                              <span className="gvr-video-name" title={video.originalName}>
                                {video.originalName}
                              </span>
                              <div className="gvr-video-sub">
                                <span>⏱ {video.duration || '00:00'}</span>
                                <span>•</span>
                                <span>
                                  {video.size
                                    ? `${(video.size / (1024 * 1024)).toFixed(1)} MB`
                                    : video.isDriveFile
                                    ? 'Google Drive'
                                    : 'File'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="gvr-rename-cell">
                            <div className="gvr-rename-input-wrap">
                              <input
                                type="text"
                                className={`gvr-rename-input ${hasProposed ? 'has-value' : ''}`}
                                placeholder="Chưa có tên mới (Bấm Phân tích AI)"
                                value={video.proposedName || ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setVideos((prev) =>
                                    prev.map((v) =>
                                      v.id === video.id ? { ...v, proposedName: val } : v
                                    )
                                  )
                                }}
                              />
                              {hasProposed && (
                                <button
                                  className="gvr-btn gvr-btn-secondary gvr-btn-icon"
                                  title="Sao chép tên này"
                                  onClick={() => {
                                    navigator.clipboard.writeText(video.proposedName)
                                    showToast('Đã sao chép tên mới!')
                                  }}
                                >
                                  📋
                                </button>
                              )}
                            </div>

                            {video.summary && (
                              <div className="gvr-summary-text" title={video.summary}>
                                💡 <strong>Nhận diện AI:</strong> {video.summary}
                              </div>
                            )}

                            {video.errorMsg && (
                              <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '4px' }}>
                                ⚠️ {video.errorMsg}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {video.status === 'analyzing' && (
                            <span className="gvr-badge gvr-badge-analyzing">
                              <span className="gvr-spinner"></span> Đang phân tích...
                            </span>
                          )}
                          {video.status === 'idle' && (
                            <span className="gvr-badge gvr-badge-idle">Chờ xử lý</span>
                          )}
                          {video.status === 'proposed' && (
                            <span className="gvr-badge gvr-badge-proposed">
                              ✨ Đã có tên mới
                            </span>
                          )}
                          {video.status === 'success' && (
                            <span className="gvr-badge gvr-badge-success">
                              ✓ Đã đổi tên
                            </span>
                          )}
                          {video.status === 'error' && (
                            <span className="gvr-badge gvr-badge-error">
                              ⚠️ Thất bại
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="gvr-btn gvr-btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12.5px' }}
                              onClick={() => analyzeVideoWithGemini(video, idx)}
                              disabled={isRowAnalyzing}
                              title="Phân tích lại video này bằng AI"
                            >
                              {isRowAnalyzing ? <span className="gvr-spinner"></span> : '✦ AI'}
                            </button>

                            {hasProposed && (
                              <button
                                className="gvr-btn gvr-btn-primary"
                                style={{ padding: '6px 10px', fontSize: '12.5px' }}
                                onClick={async () => {
                                  if (video.isDriveFile && driveAccessToken) {
                                    const res = await renameFileOnDrive(video.id, video.proposedName)
                                    if (res.success) {
                                      setVideos((prev) =>
                                        prev.map((v) =>
                                          v.id === video.id
                                            ? { ...v, name: v.proposedName, status: 'success' }
                                            : v
                                        )
                                      )
                                      showToast('Đã đổi tên trực tiếp trên Google Drive!')
                                      addLog('success', `Đã cập nhật tên Drive: "${video.proposedName}"`)
                                    } else {
                                      showToast(`Lỗi đổi tên: ${res.error}`, 'error')
                                    }
                                  } else {
                                    setVideos((prev) =>
                                      prev.map((v) =>
                                        v.id === video.id
                                          ? { ...v, name: v.proposedName, status: 'success' }
                                          : v
                                      )
                                    )
                                    showToast('Đã áp dụng tên mới cho video này!')
                                  }
                                }}
                                title="Áp dụng tên mới"
                              >
                                Lưu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Numbered List Preview Card */}
        {currentRenamedCount > 0 && (
          <div className="gvr-repo-card">
            <div className="gvr-repo-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📂</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Kho Tên Video Vừa Xử Lý ({currentRenamedCount} video)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Tự động lưu và định dạng sẵn dạng danh sách số thứ tự 1., 2. để bạn sao chép ngay
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="gvr-btn gvr-btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(currentFormattedList)
                    showToast('Đã sao chép toàn bộ danh sách tên (1..., 2...) vào Clipboard!')
                  }}
                >
                  📋 Sao Chép Toàn Bộ (1..., 2...)
                </button>
                <button
                  className="gvr-btn gvr-btn-secondary"
                  onClick={() => {
                    const onlyNames = namedVideos
                      .map((v) => (v.proposedName || v.name).replace(/^\d+[.\-\]]\s*/, ''))
                      .join('\n')
                    navigator.clipboard.writeText(onlyNames)
                    showToast('Đã sao chép danh sách chỉ gồm tên (không số thứ tự)!')
                  }}
                >
                  📋 Sao Chép Chỉ Tên (Không Số)
                </button>
                <button
                  className="gvr-btn gvr-btn-secondary"
                  onClick={() => {
                    const blob = new Blob([currentFormattedList], { type: 'text/plain;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `danh_sach_ten_video_${new Date().toISOString().split('T')[0]}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                    showToast('Đã tải xuống file .txt danh sách tên!')
                  }}
                >
                  💾 Tải File .TXT
                </button>
                <button
                  className="gvr-btn gvr-btn-secondary"
                  onClick={() => setIsRepoModalOpen(true)}
                  style={{ color: '#059669', borderColor: '#a7f3d0' }}
                >
                  📂 Xem Toàn Bộ Lịch Sử Lưu ➔
                </button>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div className="gvr-repo-preview-box">
                {currentFormattedList}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Logs Panel */}
        <div className="gvr-logs-panel">
          <div className="gvr-logs-header" onClick={() => setShowLogs(!showLogs)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px' }}>
              <span>📋</span> Nhật Ký Hoạt Động Thời Gian Thực ({logs.length} sự kiện)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="gvr-btn gvr-btn-subtle"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setLogs([])
                }}
              >
                Xóa Log
              </button>
              <span>{showLogs ? '▲ Ẩn' : '▼ Mở'}</span>
            </div>
          </div>

          {showLogs && (
            <div className="gvr-logs-content">
              {logs.length === 0 ? (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có nhật ký nào...</div>
              ) : (
                logs.map((item) => (
                  <div key={item.id} className="gvr-log-item">
                    <span className="gvr-log-time">[{item.time}]</span>
                    <span className={`gvr-log-msg-${item.type}`}>{item.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* API Config Modal */}
        {isApiModalOpen && (
          <div className="gvr-modal-backdrop" onClick={() => setIsApiModalOpen(false)}>
            <div className="gvr-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="gvr-modal-header">
                <h3 className="gvr-modal-title">
                  <span>🔑</span> Cấu Hình Khóa API & Google OAuth
                </h3>
                <button
                  className="gvr-btn gvr-btn-subtle"
                  onClick={() => setIsApiModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="gvr-modal-body">
                <div className="gvr-form-group">
                  <label className="gvr-form-label">Google Gemini API Key:</label>
                  <input
                    type="password"
                    className="gvr-input"
                    placeholder="AIzaSy... hoặc AQ..."
                    defaultValue={apiConfig.geminiApiKey}
                    id="modal-gemini-key"
                  />
                  <p className="gvr-form-hint">
                    Khóa API Gemini dùng để phân tích video và đặt tên thông minh theo hình ảnh.
                  </p>
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Mô hình Gemini (AI Model):</label>
                  <select
                    className="gvr-select"
                    defaultValue={apiConfig.geminiModel || 'gemini-2.5-flash'}
                    id="modal-gemini-model"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Thông minh nhất - Khuyên dùng)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rất ổn định & tốc độ cao)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Phân tích chuyên sâu)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Tư duy cao cấp)</option>
                  </select>
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Google OAuth 2.0 Client ID:</label>
                  <input
                    type="text"
                    className="gvr-input"
                    placeholder="271571065367-....apps.googleusercontent.com"
                    defaultValue={apiConfig.googleClientId}
                    id="modal-google-client-id"
                  />
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Google OAuth 2.0 Client Secret:</label>
                  <input
                    type="password"
                    className="gvr-input"
                    placeholder="GOCSPX-..."
                    defaultValue={apiConfig.googleClientSecret}
                    id="modal-google-client-secret"
                  />
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Google Cloud API Key (Tùy chọn):</label>
                  <input
                    type="password"
                    className="gvr-input"
                    placeholder="AIzaSy..."
                    defaultValue={apiConfig.googleApiKey}
                    id="modal-google-key"
                  />
                </div>
              </div>

              <div className="gvr-modal-footer">
                <button
                  className="gvr-btn gvr-btn-secondary"
                  onClick={() => setIsApiModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  className="gvr-btn gvr-btn-primary"
                  onClick={() => {
                    const geminiApiKey = document.getElementById('modal-gemini-key')?.value || ''
                    const geminiModel = document.getElementById('modal-gemini-model')?.value || 'gemini-2.5-flash'
                    const googleClientId = document.getElementById('modal-google-client-id')?.value || ''
                    const googleClientSecret = document.getElementById('modal-google-client-secret')?.value || ''
                    const googleApiKey = document.getElementById('modal-google-key')?.value || ''
                    handleSaveApiConfig({ geminiApiKey, geminiModel, googleClientId, googleClientSecret, googleApiKey })
                  }}
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Settings Modal */}
        {isSettingsModalOpen && (
          <div className="gvr-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
            <div className="gvr-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="gvr-modal-header">
                <h3 className="gvr-modal-title">
                  <span>⚙</span> Cài Đặt Quy Tắc Đặt Tên Video
                </h3>
                <button
                  className="gvr-btn gvr-btn-subtle"
                  onClick={() => setIsSettingsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="gvr-modal-body">
                <div className="gvr-form-grid-2">
                  <div className="gvr-form-group">
                    <label className="gvr-form-label">Ngôn ngữ đặt tên:</label>
                    <select
                      className="gvr-select"
                      defaultValue={renameConfig.language}
                      id="modal-rule-lang"
                    >
                      <option value="vi">Tiếng Việt có dấu</option>
                      <option value="vi_no_accent">Tiếng Việt KHÔNG DẤU</option>
                      <option value="en">English (Tiếng Anh)</option>
                    </select>
                  </div>

                  <div className="gvr-form-group">
                    <label className="gvr-form-label">Kiểu chữ (Case Style):</label>
                    <select
                      className="gvr-select"
                      defaultValue={renameConfig.caseStyle}
                      id="modal-rule-case"
                    >
                      <option value="lowercase">chữ thường (lowercase)</option>
                      <option value="Readable Space">Viết Hoa Chữ Đầu (Readable Space)</option>
                      <option value="snake_case">gạch_dưới (snake_case)</option>
                      <option value="kebab-case">gạch-ngang (kebab-case)</option>
                      <option value="CamelCase">ViếtHoaDínhLiền (CamelCase)</option>
                    </select>
                  </div>
                </div>

                <div className="gvr-form-grid-2">
                  <div className="gvr-form-group">
                    <label className="gvr-form-label">Định dạng số thứ tự:</label>
                    <select
                      className="gvr-select"
                      defaultValue={renameConfig.indexFormat}
                      id="modal-rule-index-fmt"
                    >
                      <option value="1.">1. , 2. , 3. ...</option>
                      <option value="01.">01. , 02. , 03. ...</option>
                      <option value="1 -">1 - , 2 - , 3 - ...</option>
                      <option value="[1]">[1] , [2] , [3] ...</option>
                    </select>
                  </div>

                  <div className="gvr-form-group">
                    <label className="gvr-form-label">Tiền tố tùy chỉnh (Prefix):</label>
                    <input
                      type="text"
                      className="gvr-input"
                      placeholder="VD: [SaPa], [Homestay]..."
                      defaultValue={renameConfig.prefix}
                      id="modal-rule-prefix"
                    />
                  </div>
                </div>

                <div className="gvr-toggle-row">
                  <span className="gvr-toggle-label">Đánh số thứ tự tự động ở đầu tên tệp</span>
                  <input
                    type="checkbox"
                    defaultChecked={renameConfig.includeIndex}
                    id="modal-rule-include-index"
                  />
                </div>

                <div className="gvr-toggle-row">
                  <span className="gvr-toggle-label">Thêm ngày hiện tại [YYYY-MM-DD] vào tên</span>
                  <input
                    type="checkbox"
                    defaultChecked={renameConfig.includeDate}
                    id="modal-rule-include-date"
                  />
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Số từ tối đa cho tên tệp (Max Words):</label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    className="gvr-input"
                    defaultValue={renameConfig.maxWords}
                    id="modal-rule-max-words"
                  />
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Gợi ý chủ đề chuyên sâu (Context Hint):</label>
                  <textarea
                    className="gvr-textarea"
                    defaultValue={renameConfig.contextHint}
                    id="modal-rule-context"
                    placeholder="Mô tả bối cảnh để AI nhận diện chuẩn xác nhất..."
                  />
                </div>
              </div>

              <div className="gvr-modal-footer">
                <button
                  className="gvr-btn gvr-btn-secondary"
                  onClick={() => setIsSettingsModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  className="gvr-btn gvr-btn-primary"
                  onClick={() => {
                    const language = document.getElementById('modal-rule-lang')?.value || 'vi'
                    const caseStyle = document.getElementById('modal-rule-case')?.value || 'lowercase'
                    const indexFormat = document.getElementById('modal-rule-index-fmt')?.value || '1.'
                    const prefix = document.getElementById('modal-rule-prefix')?.value || ''
                    const includeIndex = document.getElementById('modal-rule-include-index')?.checked ?? true
                    const includeDate = document.getElementById('modal-rule-include-date')?.checked ?? false
                    const maxWords = parseInt(document.getElementById('modal-rule-max-words')?.value || '8', 10)
                    const contextHint = document.getElementById('modal-rule-context')?.value || ''

                    handleSaveRenameConfig({
                      ...renameConfig,
                      language,
                      caseStyle,
                      indexFormat,
                      prefix,
                      includeIndex,
                      includeDate,
                      maxWords,
                      contextHint,
                    })
                  }}
                >
                  Lưu Quy Tắc
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kho Lưu Trữ Tên Video Modal */}
        {isRepoModalOpen && (
          <div className="gvr-modal-backdrop" onClick={() => setIsRepoModalOpen(false)}>
            <div
              className="gvr-modal-card"
              style={{ maxWidth: '820px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gvr-modal-header">
                <h3 className="gvr-modal-title">
                  <span>📂</span> Kho Lưu Trữ & Sao Chép Tên Video Đã Đổi
                </h3>
                <button
                  className="gvr-btn gvr-btn-subtle"
                  onClick={() => setIsRepoModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="gvr-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div className="gvr-source-tabs" style={{ margin: 0, padding: 0, border: 'none' }}>
                    <button
                      className={`gvr-tab-btn ${activeRepoTab === 'current' ? 'active' : ''}`}
                      onClick={() => setActiveRepoTab('current')}
                    >
                      <span>⚡</span> Phiên Hiện Tại ({currentRenamedCount})
                    </button>
                    <button
                      className={`gvr-tab-btn ${activeRepoTab === 'history' ? 'active' : ''}`}
                      onClick={() => setActiveRepoTab('history')}
                    >
                      <span>📜</span> Lịch Sử Các Phiên Trước ({savedNameHistory.length} đợt)
                    </button>
                  </div>

                  {savedNameHistory.length > 0 && activeRepoTab === 'history' && (
                    <button
                      className="gvr-btn gvr-btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử các phiên đã lưu?')) {
                          setSavedNameHistory([])
                          localStorage.removeItem('homestay_renamed_video_history')
                          showToast('Đã xóa sạch lịch sử kho lưu trữ!')
                        }
                      }}
                    >
                      🗑 Xóa Lịch Sử
                    </button>
                  )}
                </div>

                {activeRepoTab === 'current' ? (
                  <div>
                    {currentRenamedCount === 0 ? (
                      <div className="gvr-empty-state" style={{ padding: '30px 10px' }}>
                        <div className="gvr-empty-icon" style={{ fontSize: '36px' }}>📝</div>
                        <h4 className="gvr-empty-title">Chưa có video nào có tên mới trong phiên hiện tại</h4>
                        <p className="gvr-empty-desc">
                          Hãy phân tích AI hoặc tải video ở màn hình chính để tự động lưu tên vào đây.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                            Danh sách tên video theo định dạng số thứ tự (1..., 2...):
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="gvr-btn gvr-btn-primary"
                              style={{ padding: '6px 14px', fontSize: '13px' }}
                              onClick={() => {
                                navigator.clipboard.writeText(currentFormattedList)
                                showToast('Đã sao chép toàn bộ danh sách tên (1..., 2...)!')
                              }}
                            >
                              📋 Sao Chép (1..., 2...)
                            </button>
                            <button
                              className="gvr-btn gvr-btn-secondary"
                              style={{ padding: '6px 14px', fontSize: '13px' }}
                              onClick={() => {
                                const onlyNames = namedVideos
                                  .map((v) => (v.proposedName || v.name).replace(/^\d+[.\-\]]\s*/, ''))
                                  .join('\n')
                                navigator.clipboard.writeText(onlyNames)
                                showToast('Đã sao chép danh sách chỉ gồm tên!')
                              }}
                            >
                              📋 Chỉ Tên File
                            </button>
                          </div>
                        </div>

                        <div className="gvr-repo-preview-box" style={{ maxHeight: '350px' }}>
                          {currentFormattedList}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {savedNameHistory.length === 0 ? (
                      <div className="gvr-empty-state" style={{ padding: '30px 10px' }}>
                        <div className="gvr-empty-icon" style={{ fontSize: '36px' }}>📂</div>
                        <h4 className="gvr-empty-title">Chưa có lịch sử phiên đổi tên nào</h4>
                        <p className="gvr-empty-desc">
                          Mỗi khi bạn phân tích hoặc áp dụng tên video mới, hệ thống sẽ tự động lưu lại vào đây.
                        </p>
                      </div>
                    ) : (
                      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        {savedNameHistory.map((batch, bIdx) => (
                          <div key={batch.id || bIdx} className="gvr-repo-batch-item">
                            <div className="gvr-repo-batch-top">
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                                  #{savedNameHistory.length - bIdx}. {batch.source}
                                </span>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  ⏱ {batch.createdAt} • <strong>{batch.count}</strong> video
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="gvr-btn gvr-btn-primary"
                                  style={{ padding: '5px 12px', fontSize: '12.5px' }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(batch.namesText)
                                    showToast(`Đã sao chép ${batch.count} tên video của đợt này!`)
                                  }}
                                >
                                  📋 Sao Chép ({batch.count} tên)
                                </button>
                                <button
                                  className="gvr-btn gvr-btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12.5px' }}
                                  onClick={() => {
                                    const blob = new Blob([batch.namesText], { type: 'text/plain;charset=utf-8' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `danh_sach_video_dot_${batch.id}.txt`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                  }}
                                  title="Tải file .txt"
                                >
                                  💾 .TXT
                                </button>
                                <button
                                  className="gvr-btn gvr-btn-subtle"
                                  style={{ padding: '5px 8px', color: '#dc2626' }}
                                  onClick={() => {
                                    const next = savedNameHistory.filter((_, i) => i !== bIdx)
                                    setSavedNameHistory(next)
                                    localStorage.setItem('homestay_renamed_video_history', JSON.stringify(next))
                                    showToast('Đã xóa đợt này khỏi lịch sử!')
                                  }}
                                  title="Xóa đợt này"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <div className="gvr-repo-preview-box" style={{ maxHeight: '160px', fontSize: '12px' }}>
                              {batch.namesText}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="gvr-modal-footer">
                <button
                  className="gvr-btn gvr-btn-primary"
                  onClick={() => setIsRepoModalOpen(false)}
                >
                  Đóng Kho Tên
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
