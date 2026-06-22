import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

class MemoryStorage {
  constructor(sharedData = new Map()) {
    this.data = sharedData
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null
  }

  setItem(key, value) {
    this.data.set(key, String(value))
  }

  removeItem(key) {
    this.data.delete(key)
  }

  clear() {
    this.data.clear()
  }
}

const sharedLocalData = new Map()
globalThis.localStorage = new MemoryStorage(sharedLocalData)
globalThis.sessionStorage = new MemoryStorage()
globalThis.window = {
  atob,
  clearTimeout,
  setTimeout,
  location: { pathname: '/', assign() {}, replace() {} },
  dispatchEvent() {},
}

const authService = await import('../src/services/authService.js')
const { STAFF_ROLES, roleDefaultPath } = await import('../src/utils/roleUtils.js')

beforeEach(() => {
  sharedLocalData.clear()
  globalThis.sessionStorage = new MemoryStorage()
  globalThis.fetch = undefined
})

test('login stores one shared authentication session even when remember is false', async () => {
  const user = { id: 1, role: 'ROLE_ADMIN' }
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ accessToken: 'shared-token', user }),
  })

  await authService.adminLogin('admin@example.com', 'secret', false)

  assert.equal(localStorage.getItem('homeStayAccessToken'), 'shared-token')
  assert.deepEqual(JSON.parse(localStorage.getItem('homeStayUser')), user)
  assert.equal(sessionStorage.getItem('homeStayAccessToken'), null)
})

test('another tab reads the shared session for every staff role', () => {
  const expectedPaths = {
    ROLE_ADMIN: '/admin',
    ROLE_RECEPTIONIST: '/admin/receptionist',
    ROLE_HOUSEKEEPING: '/admin/housekeeping/tasks',
    ROLE_MARKETING: '/admin/marketing/ai-agent',
  }

  for (const [role, defaultPath] of Object.entries(expectedPaths)) {
    localStorage.setItem('homeStayUser', JSON.stringify({ id: role, role }))
    localStorage.setItem('homeStayAccessToken', `${role}-token`)
    globalThis.sessionStorage = new MemoryStorage()

    assert.equal(STAFF_ROLES.has(role), true)
    assert.equal(authService.getStoredToken(), `${role}-token`)
    assert.equal(authService.getStoredUser().role, role)
    assert.equal(roleDefaultPath(role), defaultPath)
  }
})

test('legacy per-tab session is migrated once to shared storage', () => {
  sessionStorage.setItem('homeStayUser', JSON.stringify({ id: 3, role: 'ROLE_ADMIN' }))
  sessionStorage.setItem('homeStayAccessToken', 'legacy-token')

  assert.equal(authService.getStoredToken(), 'legacy-token')
  assert.equal(localStorage.getItem('homeStayAccessToken'), 'legacy-token')
  assert.equal(sessionStorage.getItem('homeStayAccessToken'), null)
})

test('logout removes authentication from shared and legacy storage', () => {
  localStorage.setItem('homeStayAccessToken', 'shared-token')
  localStorage.setItem('homeStayUser', '{}')
  sessionStorage.setItem('homeStayAccessToken', 'legacy-token')
  sessionStorage.setItem('homeStayUser', '{}')

  authService.logout()

  assert.equal(localStorage.getItem('homeStayAccessToken'), null)
  assert.equal(localStorage.getItem('homeStayUser'), null)
  assert.equal(sessionStorage.getItem('homeStayAccessToken'), null)
  assert.equal(sessionStorage.getItem('homeStayUser'), null)
})
