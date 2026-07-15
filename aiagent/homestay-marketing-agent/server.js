import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'

loadDotEnv()

const config = {
  port: numberEnv('PORT', 8787),
  authToken: process.env.AIAGENT_AUTH_TOKEN ?? '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openRouterBaseUrl: trimTrailingSlash(process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'),
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  openRouterSiteUrl: process.env.OPENROUTER_SITE_URL ?? 'http://localhost:5173',
  openRouterAppName: process.env.OPENROUTER_APP_NAME ?? 'Homestay Marketing AI Agent',
  aiToEarnBaseUrl: trimTrailingSlash(process.env.AITOEARN_SERVER_BASE_URL ?? ''),
  aiToEarnApiKey: process.env.AITOEARN_SERVER_API_KEY ?? '',
  requirePublish: boolEnv('AITOEARN_REQUIRE_PUBLISH', true),
}

function loadDotEnv() {
  if (!existsSync('.env')) {
    return
  }
  const content = readFileSync('.env', 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const pathname = requestUrl.pathname

    if (req.method === 'GET' && pathname === '/health') {
      return json(res, 200, {
        status: 'ok',
        service: 'homestay-marketing-agent',
        openRouterConfigured: Boolean(config.openRouterApiKey),
        aiToEarnConfigured: Boolean(config.aiToEarnBaseUrl),
      })
    }

    if (!isAuthorized(req)) {
      return json(res, 401, { success: false, errorCode: 'UNAUTHORIZED', errorMessage: 'Invalid AI Agent token.' })
    }

    if (req.method === 'POST' && pathname === '/api/homestay/marketing/generate') {
      const body = await readJson(req)
      const generated = await generateMarketingCopy(body)
      return json(res, 200, { success: true, ...generated })
    }

    if (req.method === 'POST' && pathname === '/api/homestay/social/auth/start') {
      const body = await readJson(req)
      const data = await startAiToEarnAccountAuth(body)
      return json(res, 200, { success: true, data })
    }

    if (req.method === 'GET' && pathname === '/api/homestay/social/auth/status') {
      const data = await getAiToEarnAccountAuthStatus({
        platform: requestUrl.searchParams.get('platform'),
        sessionId: requestUrl.searchParams.get('sessionId'),
      })
      return json(res, 200, { success: true, data })
    }

    if (req.method === 'GET' && pathname === '/api/homestay/social/accounts') {
      const data = await listAiToEarnAccounts({ platform: requestUrl.searchParams.get('platform') })
      return json(res, 200, { success: true, data })
    }

    if (req.method === 'POST' && pathname === '/api/homestay/marketing/publish') {
      const body = await readJson(req)
      const generated = await generateMarketingCopy({
        title: body.post?.title,
        brief: body.post?.brief,
        goal: body.post?.goal,
        tone: body.post?.tone,
        channels: [body.channel],
        media: body.media,
      })
      const publishResult = await publishToAiToEarn(body, generated)
      return json(res, 200, {
        success: publishResult.success,
        status: publishResult.status,
        generatedContent: generated.content,
        generatedHashtags: generated.hashtags,
        provider: generated.provider,
        model: generated.model,
        flowId: publishResult.flowId,
        taskId: publishResult.taskId,
        externalPostId: publishResult.externalPostId,
        externalUrl: publishResult.externalUrl,
        rawAiResponse: generated.rawAiResponse,
        rawPublishResponse: publishResult.rawPublishResponse,
        errorCode: publishResult.errorCode,
        errorMessage: publishResult.errorMessage,
      })
    }

    return json(res, 404, { success: false, errorCode: 'NOT_FOUND', errorMessage: 'Endpoint not found.' })
  } catch (error) {
    return json(res, 500, {
      success: false,
      errorCode: error.code ?? 'AIAGENT_ERROR',
      errorMessage: error.message ?? 'Marketing AI Agent failed.',
    })
  }
})

server.listen(config.port, () => {
  console.log(`Homestay Marketing AI Agent listening on http://127.0.0.1:${config.port}`)
})

async function generateMarketingCopy(input) {
  if (!config.openRouterApiKey) {
    throw Object.assign(new Error('Missing OPENROUTER_API_KEY in aiagent/homestay-marketing-agent/.env.'), { code: 'OPENROUTER_KEY_MISSING' })
  }

  const channel = Array.isArray(input.channels) && input.channels.length > 0 ? input.channels[0] : {}
  const prompt = [
    'Bạn là AI marketing chuyên viết bài quảng bá homestay bằng tiếng Việt.',
    'Hãy tạo nội dung đăng social ngắn gọn, tự nhiên, có CTA và hashtag.',
    'Chỉ trả JSON hợp lệ theo schema: {"content":"...","hashtags":"#tag #tag","title":"..."}',
    '',
    `Tiêu đề chiến dịch: ${input.title ?? ''}`,
    `Mục tiêu: ${input.goal ?? ''}`,
    `Giọng điệu: ${input.tone ?? ''}`,
    `Nền tảng: ${channel.platform ?? ''}`,
    `Page/kênh: ${channel.pageName ?? ''}`,
    `Brief: ${input.brief ?? ''}`,
  ].join('\n')

  const response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openRouterApiKey}`,
      'HTTP-Referer': config.openRouterSiteUrl,
      'X-Title': config.openRouterAppName,
    },
    body: JSON.stringify({
      model: config.openRouterModel,
      messages: [
        { role: 'system', content: 'You are a concise Vietnamese social media marketing copywriter. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.75,
    }),
  })

  const rawText = await response.text()
  if (!response.ok) {
    throw Object.assign(new Error(`OpenRouter returned HTTP ${response.status}: ${rawText}`), { code: `OPENROUTER_HTTP_${response.status}` })
  }

  const rawJson = JSON.parse(rawText)
  const text = rawJson.choices?.[0]?.message?.content ?? ''
  const parsed = parseJsonFromModel(text)
  return {
    content: parsed.content || text,
    hashtags: parsed.hashtags || '#HomeStays #HomestayVietNam #DuLichNghiDuong',
    title: parsed.title || input.title,
    provider: 'openrouter',
    model: config.openRouterModel,
    rawAiResponse: rawJson,
  }
}

async function publishToAiToEarn(body, generated) {
  if (!config.aiToEarnBaseUrl) {
    if (config.requirePublish) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'AITOEARN_CONFIG_MISSING',
        errorMessage: 'Missing AITOEARN_SERVER_BASE_URL in aiagent/homestay-marketing-agent/.env.',
      }
    }
    return { success: true, status: 'PUBLISHING' }
  }

  const payload = buildAiToEarnPayload(body, generated)
  try {
    const rawJson = await aiToEarnRequest('/v2/channels/publish/flows', { method: 'POST', body: payload, unwrapData: false })
    const data = rawJson.data ?? rawJson
    const task = Array.isArray(data.tasks) && data.tasks.length > 0 ? data.tasks[0] : data
    const errorMessage = task.errorMsg ?? task.errorMessage
    return {
      success: !errorMessage,
      status: mapAiToEarnStatus(task.status),
      flowId: data.flowId,
      taskId: task.id ?? task.taskId,
      externalPostId: task.platformWorkId ?? task.dataId,
      externalUrl: task.workLink ?? task.externalUrl,
      rawPublishResponse: rawJson,
      errorCode: errorMessage ? 'AITOEARN_TASK_FAILED' : undefined,
      errorMessage,
    }
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      rawPublishResponse: error.rawResponse,
      errorCode: error.code ?? 'AITOEARN_ERROR',
      errorMessage: error.message,
    }
  }
}

async function startAiToEarnAccountAuth(input) {
  const platform = toAiToEarnPlatform(input.platform)
  const data = await aiToEarnRequest(`/v2/channels/accounts/auth/${platform}`, {
    query: {
      callbackUrl: input.callbackUrl,
      redirectUri: input.redirectUri,
      groupId: input.groupId,
    },
  })
  return {
    platform: normalizePlatform(input.platform),
    sessionId: data.sessionId,
    url: data.url,
    expiresAt: data.expiresAt,
  }
}

async function getAiToEarnAccountAuthStatus(input) {
  if (!input.sessionId) {
    throw Object.assign(new Error('Missing sessionId.'), { code: 'AITOEARN_SESSION_ID_MISSING' })
  }
  const platform = toAiToEarnPlatform(input.platform)
  const data = await aiToEarnRequest(`/v2/channels/accounts/auth/${platform}/status/${encodeURIComponent(input.sessionId)}`)
  return {
    sessionId: data.sessionId ?? input.sessionId,
    status: data.status ?? 'UNKNOWN',
    requiresSelection: Boolean(data.requiresSelection),
    expiresAt: data.expiresAt,
    accountId: data.accountId,
    accountIds: Array.isArray(data.accountIds) ? data.accountIds : [],
    accounts: normalizeAiToEarnAccounts(data.accounts),
    selectableAccounts: normalizeAiToEarnAccounts(data.selectableAccounts),
  }
}

async function listAiToEarnAccounts(input = {}) {
  const data = await aiToEarnRequest('/v2/channels/accounts')
  let accounts = normalizeAiToEarnAccounts(data)
  const platform = normalizePlatform(input.platform)
  if (platform) {
    accounts = accounts.filter(account => normalizePlatform(account.platform) === platform)
  }
  return accounts
}

async function aiToEarnRequest(path, options = {}) {
  if (!config.aiToEarnBaseUrl) {
    throw Object.assign(new Error('Missing AITOEARN_SERVER_BASE_URL in aiagent/homestay-marketing-agent/.env.'), { code: 'AITOEARN_CONFIG_MISSING' })
  }
  const url = new URL(`${config.aiToEarnBaseUrl}${path.startsWith('/') ? path : `/${path}`}`)
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, value)
    }
  })
  const headers = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (config.aiToEarnApiKey) {
    headers['x-api-key'] = config.aiToEarnApiKey
  }
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const rawText = await response.text()
  let rawJson = null
  try {
    rawJson = rawText ? JSON.parse(rawText) : {}
  } catch {
    rawJson = { raw: rawText }
  }
  if (!response.ok) {
    const message = rawJson.errorMessage ?? rawJson.message ?? `AiToEarn returned HTTP ${response.status}`
    throw Object.assign(new Error(message), {
      code: `AITOEARN_HTTP_${response.status}`,
      rawResponse: rawJson,
    })
  }
  return options.unwrapData === false ? rawJson : (rawJson.data ?? rawJson)
}

function buildAiToEarnPayload(body, generated) {
  const media = Array.isArray(body.media) ? body.media : []
  const mediaPayload = media.filter(item => item.url).map(item => ({ url: item.url, metadata: { type: item.type, altText: item.altText } }))
  const platformOption = parseOption(body.channel?.platformOptionJson)
  return {
    flowId: `hms-marketing-${body.channel?.id ?? Date.now()}-${Date.now()}`,
    content: {
      title: generated.title ?? body.post?.title,
      body: generated.content,
      media: mediaPayload,
      cover: mediaPayload[0],
    },
    publishAt: toPublishAt(body.channel?.scheduledAt),
    context: {
      source: 'homestay-management',
      taskId: body.taskId,
      type: media.some(item => String(item.type).toUpperCase() === 'VIDEO') ? 'VIDEO' : 'ImageText',
      materialId: String(body.post?.id ?? ''),
    },
    items: [
      {
        accountId: body.socialAccount?.externalAccountId,
        platform: toAiToEarnPlatform(body.channel?.platform ?? body.socialAccount?.platform),
        option: platformOption,
      },
    ],
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > 2_000_000) {
        reject(Object.assign(new Error('Request body too large.'), { code: 'PAYLOAD_TOO_LARGE' }))
      }
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(Object.assign(new Error('Invalid JSON body.'), { code: 'INVALID_JSON' }))
      }
    })
    req.on('error', reject)
  })
}

function isAuthorized(req) {
  if (!config.authToken) {
    return false
  }
  const header = req.headers.authorization ?? ''
  return header === `Bearer ${config.authToken}`
}

function parseJsonFromModel(text) {
  const trimmed = String(text ?? '').trim()
  const withoutFence = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  try {
    return JSON.parse(withoutFence)
  } catch {
    const start = withoutFence.indexOf('{')
    const end = withoutFence.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(withoutFence.slice(start, end + 1))
      } catch {
        return {}
      }
    }
    return {}
  }
}

function parseOption(value) {
  if (!value) {
    return {}
  }
  try {
    return JSON.parse(value)
  } catch {
    return { rawOption: value }
  }
}

function toPublishAt(value) {
  if (!value) {
    return new Date().toISOString()
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function toAiToEarnPlatform(platform) {
  const normalized = String(platform ?? '').trim().toUpperCase()
  const map = {
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    TIKTOK: 'tiktok',
    YOUTUBE: 'youtube',
    LINKEDIN: 'linkedin',
    PINTEREST: 'pinterest',
    THREADS: 'threads',
    TWITTER: 'twitter',
    X: 'twitter',
  }
  return map[normalized] ?? normalized.toLowerCase()
}

function normalizePlatform(platform) {
  const normalized = String(platform ?? '').trim().toUpperCase()
  const map = {
    TWITTER: 'X',
  }
  return normalized ? (map[normalized] ?? normalized) : ''
}

function normalizeAiToEarnAccounts(input) {
  const list = firstArray(input)
  return list
    .map((item) => ({
      accountId: firstValue(item, ['accountId', 'id', '_id']),
      platform: normalizePlatform(firstValue(item, ['platform', 'type', 'accountType'])),
      platformUid: firstValue(item, ['platformUid', 'uid', 'openId', 'userId']),
      displayName: firstValue(item, ['displayName', 'accountName', 'nickname', 'name', 'title']),
      avatarUrl: firstValue(item, ['avatarUrl', 'avatar', 'picture']),
      pageUrl: firstValue(item, ['pageUrl', 'link', 'url', 'homepage']),
    }))
    .filter(account => account.accountId)
}

function firstArray(input) {
  if (!input) return []
  if (Array.isArray(input)) return input
  for (const key of ['accounts', 'selectableAccounts', 'records', 'items', 'rows', 'list', 'data']) {
    if (Array.isArray(input[key])) {
      return input[key]
    }
  }
  return []
}

function firstValue(input, keys) {
  for (const key of keys) {
    const value = input?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value)
    }
  }
  return ''
}

function mapAiToEarnStatus(value) {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (['-1', 'FAIL', 'FAILED'].includes(normalized)) return 'FAILED'
  if (['1', 'RELEASED', 'PUBLISHED'].includes(normalized)) return 'PUBLISHED'
  if (['6', 'QUEUED'].includes(normalized)) return 'QUEUED'
  if (['7', 'PLATFORM_SCHEDULED', 'SCHEDULED'].includes(normalized)) return 'SCHEDULED'
  if (['8', 'WAITING_FOR_USER_ACTION'].includes(normalized)) return 'WAITING_FOR_USER_ACTION'
  return 'PUBLISHING'
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function trimTrailingSlash(value) {
  return String(value ?? '').replace(/\/+$/, '')
}

function numberEnv(name, fallback) {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolEnv(name, fallback) {
  if (!(name in process.env)) {
    return fallback
  }
  return ['1', 'true', 'yes', 'on'].includes(String(process.env[name]).toLowerCase())
}
