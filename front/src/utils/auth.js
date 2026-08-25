export function getStoredToken() {
  return localStorage.getItem('jwt_token') || ''
}

export function authHeaders(token = getStoredToken()) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function isProtectedRoute(route) {
  return Boolean(route.meta?.requiresAuth)
}

export function handleUnauthorizedResponse(response, { currentPath = window.location.pathname, redirectToLogin } = {}) {
  if (response.status !== 401) {
    return false
  }

  localStorage.removeItem('jwt_token')
  const loginPath = `/login?redirect=${encodeURIComponent(currentPath)}`

  if (redirectToLogin) {
    redirectToLogin(loginPath)
  } else {
    window.location.href = loginPath
  }

  return true
}

export async function waitForStoredToken({ retries = 5, interval = 20, readToken = getStoredToken } = {}) {
  for (let i = 0; i < retries; i++) {
    const token = readToken()
    if (token) {
      return token
    }

    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  throw new Error('登录 token 写入失败')
}
