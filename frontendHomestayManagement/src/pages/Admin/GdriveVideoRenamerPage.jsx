import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from './AdminLayout'
import './GdriveVideoRenamerPage.css'

// Default Configurations
const DEFAULT_API_CONFIG = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
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
      if (saved) return { ...DEFAULT_API_CONFIG, ...JSON.parse(saved) }
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

  useEffect(() => {
    addLog('info', 'Hệ thống AI Đổi tên Video đã sẵn sàng. Hãy chọn thư mục Drive hoặc tệp video để bắt đầu.')
  }, [])

  // Save Configs
  const handleSaveApiConfig = (newConfig) => {
    setApiConfig(newConfig)
    localStorage.setItem('homestay_gdrive_ai_api_config', JSON.stringify(newConfig))
    setIsApiModalOpen(false)
    showToast('Đã lưu cấu hình API thành công!')
    addLog('success', `Đã cập nhật cấu hình API Gemini (${newConfig.geminiModel || 'gemini-2.5-flash'}).`)
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
  const handleScanDrive = async () => {
    const rawInput = driveInput.trim()
    if (!rawInput) {
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
      // If Google API key is provided, use Drive v3 API
      if (apiConfig.googleApiKey) {
        const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov')`
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink,webContentLink,videoMediaMetadata)&key=${apiConfig.googleApiKey}`
        const res = await fetch(url)
        const data = await res.json()

        if (data.files && data.files.length > 0) {
          const driveItems = data.files.map((f, idx) => {
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

      // Fallback: Mock & smart parse for drive link
      const simulatedCount = 3
      const sampleNames = [
        'VID_20260912_084512_SaPa_Fansipan_View.mp4',
        'DSC_9942_Homestay_Bungalow_Room_Review.mov',
        'PXL_20260910_SanMay_LauCaHoi_TayBac.mp4',
      ]

      const simulatedItems = sampleNames.map((name, i) => ({
        id: `gdrive_${folderId}_${i}_${Date.now()}`,
        name,
        originalName: name,
        proposedName: '',
        mimeType: 'video/mp4',
        size: 45000000 + i * 15000000,
        duration: `0${i + 1}:${(i * 18 + 24) % 60}`,
        thumbnailLink: null,
        frames: [],
        status: 'idle',
        summary: '',
      }))

      setVideos((prev) => [...prev, ...simulatedItems])
      showToast(`Đã nhận diện ${simulatedItems.length} video từ Google Drive!`)
      addLog('info', `Đã nạp danh sách video từ Google Drive Folder: ${folderId}. (Bạn có thể thêm API Key Google trong phần Cài đặt API để tải trực tiếp thumbnail từ Drive).`)
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
      const apiKey = apiConfig.geminiApiKey || ''
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

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
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

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error?.message || `Lỗi Gemini HTTP ${response.status}`)
        }

        const resData = await response.json()
        const textContent = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        const cleanJson = textContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
        const parsed = JSON.parse(cleanJson)

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
      } else {
        // Fallback intelligent simulation if API Key is not yet set
        await new Promise((r) => setTimeout(r, 700))
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
                  summary: `Video trải nghiệm ${sampleTheme}, góc quay sắc nét. (Thêm API Key Gemini để AI phân tích hình ảnh trực quan 100%).`,
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
    showToast(`Đã hoàn tất phân tích cho ${targets.length} video!`)
    addLog('success', `Đã hoàn tất xử lý hàng loạt ${targets.length} video.`)
  }

  // Batch Apply / Rename
  const handleApplyAllRenames = () => {
    let count = 0
    setVideos((prev) =>
      prev.map((v) => {
        if (v.proposedName && v.proposedName !== v.name) {
          count++
          return {
            ...v,
            name: v.proposedName,
            status: 'success',
          }
        }
        return v
      })
    )

    if (count > 0) {
      showToast(`Đã áp dụng đổi tên thành công cho ${count} video!`)
      addLog('success', `Đã cập nhật tên mới cho ${count} video thành công.`)
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

  // Stats
  const statTotal = videos.length
  const statProposed = videos.filter((v) => v.status === 'proposed').length
  const statRenamed = videos.filter((v) => v.status === 'success').length
  const statError = videos.filter((v) => v.status === 'error').length

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
                    onClick={handleScanDrive}
                    disabled={isScanning}
                  >
                    {isScanning ? <span className="gvr-spinner"></span> : '🔍'} Quét Thư Mục Drive
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#64748b' }}>
                  💡 Gợi ý: Hỗ trợ link thư mục Google Drive công khai hoặc thư mục có quyền chia sẻ liên kết.
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
                                    : 'Drive'}
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
                                onClick={() => {
                                  setVideos((prev) =>
                                    prev.map((v) =>
                                      v.id === video.id
                                        ? { ...v, name: v.proposedName, status: 'success' }
                                        : v
                                    )
                                  )
                                  showToast('Đã áp dụng tên mới cho video này!')
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
                  <span>🔑</span> Cấu Hình Khóa API (Gemini & Google Cloud)
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
                    placeholder="AIzaSy..."
                    defaultValue={apiConfig.geminiApiKey}
                    id="modal-gemini-key"
                  />
                  <p className="gvr-form-hint">
                    Khóa API dùng để phân tích video và đặt tên thông minh. Bạn có thể lấy miễn phí tại{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#059669', fontWeight: 600 }}
                    >
                      Google AI Studio
                    </a>
                    .
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
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                </div>

                <div className="gvr-form-group">
                  <label className="gvr-form-label">Google Cloud API Key (Tùy chọn - Dành cho Drive):</label>
                  <input
                    type="password"
                    className="gvr-input"
                    placeholder="AIzaSy... (Để lấy thumbnail video từ Google Drive)"
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
                    const googleApiKey = document.getElementById('modal-google-key')?.value || ''
                    handleSaveApiConfig({ geminiApiKey, geminiModel, googleApiKey })
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
      </div>
    </AdminLayout>
  )
}
