import assert from 'node:assert/strict'
import { authHeaders, getStoredToken, handleUnauthorizedResponse, isProtectedRoute, waitForStoredToken } from './auth.js'

const storage = new Map()
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null
  },
  setItem(key, value) {
    storage.set(key, value)
  },
  removeItem(key) {
    storage.delete(key)
  },
  clear() {
    storage.clear()
  },
}

localStorage.clear()
assert.equal(getStoredToken(), '')
assert.deepEqual(authHeaders(''), { 'Content-Type': 'application/json' })

localStorage.setItem('jwt_token', 'abc.def.ghi')
assert.equal(getStoredToken(), 'abc.def.ghi')
assert.deepEqual(authHeaders(getStoredToken()), {
  'Content-Type': 'application/json',
  Authorization: 'Bearer abc.def.ghi',
})

assert.equal(isProtectedRoute({ meta: { requiresAuth: true } }), true)
assert.equal(isProtectedRoute({ meta: {} }), false)

localStorage.setItem('jwt_token', 'expired.jwt.token')
let redirectedTo = null
assert.equal(
  handleUnauthorizedResponse(
    { status: 401 },
    {
      currentPath: '/notes?page=1',
      redirectToLogin(path) {
        redirectedTo = path
      },
    }
  ),
  true
)
assert.equal(localStorage.getItem('jwt_token'), null)
assert.equal(redirectedTo, '/login?redirect=%2Fnotes%3Fpage%3D1')

localStorage.setItem('jwt_token', 'valid.jwt.token')
redirectedTo = null
assert.equal(
  handleUnauthorizedResponse(
    { status: 200 },
    {
      currentPath: '/notes',
      redirectToLogin(path) {
        redirectedTo = path
      },
    }
  ),
  false
)
assert.equal(localStorage.getItem('jwt_token'), 'valid.jwt.token')
assert.equal(redirectedTo, null)

let tokenReadAttempts = 0
const confirmedToken = await waitForStoredToken({
  retries: 3,
  interval: 0,
  readToken() {
    tokenReadAttempts++
    return tokenReadAttempts === 2 ? 'written.jwt.token' : ''
  },
})
assert.equal(confirmedToken, 'written.jwt.token')
assert.equal(tokenReadAttempts, 2)

await assert.rejects(
  waitForStoredToken({
    retries: 1,
    interval: 0,
    readToken() {
      return ''
    },
  }),
  /登录 token 写入失败/
)

console.log('auth helpers tests passed')
