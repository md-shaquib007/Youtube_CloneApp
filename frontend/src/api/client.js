const API_ROOT = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'chai_access_token'
const REFRESH_KEY = 'chai_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

class ApiClientError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

let refreshPromise = null

async function parseJsonResponse(res) {
  const text = await res.text()
  if (!text) {
    return {
      success: false,
      message: res.statusText || 'Empty response from server',
      errors: [],
      data: null,
    }
  }
  try {
    return JSON.parse(text)
  } catch {
    return {
      success: false,
      message: 'Invalid response from server',
      errors: [],
      data: null,
    }
  }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const res = await fetch(`${API_ROOT}/api/v1/users/refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      })

      const json = await parseJsonResponse(res)
      if (!res.ok || !json.success) return false

      setTokens(json.data.accessToken, json.data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request(base, path, options = {}, retry = true) {
  const headers = { ...options.headers }
  const token = getAccessToken()

  if (token) headers.Authorization = `Bearer ${token}`

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const json = await parseJsonResponse(res)

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request(base, path, options, false)
  }

  if (!res.ok || !json.success) {
    throw new ApiClientError(
      json.message || 'Something went wrong',
      res.status,
      json.errors || []
    )
  }

  return json.data
}

const usersBase = `${API_ROOT}/api/v1/users`
const videosBase = `${API_ROOT}/api/v1/videos`
const subsBase = `${API_ROOT}/api/v1/subscriptions`
const searchBase = `${API_ROOT}/api/v1/search`

export const usersApi = {
  register(formData) {
    return request(usersBase, '/register', { method: 'POST', body: formData })
  },
  login(credentials) {
    return request(usersBase, '/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },
  logout() {
    return request(usersBase, '/logout', { method: 'POST' })
  },
  getCurrentUser() {
    return request(usersBase, '/current-user')
  },
  updateAccount(details) {
    return request(usersBase, '/update-account', {
      method: 'PATCH',
      body: JSON.stringify(details),
    })
  },
  changePassword(passwords) {
    return request(usersBase, '/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    })
  },
  updateAvatar(formData) {
    return request(usersBase, '/avatar', { method: 'PATCH', body: formData })
  },
  updateCoverImage(formData) {
    return request(usersBase, '/cover-image', { method: 'PATCH', body: formData })
  },
  getChannel(username) {
    return request(usersBase, `/c/${encodeURIComponent(username.trim().toLowerCase())}`)
  },
  getHistory() {
    return request(usersBase, '/history')
  },
  verifyEmail(token) {
    return request(usersBase, '/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },
  resendVerification() {
    return request(usersBase, '/resend-verification', { method: 'POST' })
  },
  forgotPassword(email) {
    return request(usersBase, '/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  resetPassword(token, newPassword) {
    return request(usersBase, '/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },
}

export const videosApi = {
  getAll(page = 1, limit = 12) {
    return request(videosBase, `/?page=${page}&limit=${limit}`)
  },
  getById(videoId) {
    return request(videosBase, `/${videoId}`)
  },
  getChannelVideos(username) {
    return request(
      videosBase,
      `/channel/${encodeURIComponent(username.trim().toLowerCase())}`
    )
  },
  publish(formData) {
    return request(videosBase, '/publish', { method: 'POST', body: formData })
  },
  update(videoId, data) {
    return request(videosBase, `/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  delete(videoId) {
    return request(videosBase, `/${videoId}`, { method: 'DELETE' })
  },
  togglePublish(videoId) {
    return request(videosBase, `/toggle/publish/${videoId}`, { method: 'PATCH' })
  },
  recordView(videoId) {
    return request(videosBase, `/view/${videoId}`, { method: 'POST' })
  },
}

export const subscriptionsApi = {
  toggle(channelId) {
    return request(subsBase, `/c/${channelId}`, { method: 'POST' })
  },
  getSubscribed() {
    return request(subsBase, '/')
  },
}

export const searchApi = {
  search(query, type = 'all') {
    const params = new URLSearchParams({ q: query, type })
    return request(searchBase, `/?${params}`)
  },
}

const likesBase = `${API_ROOT}/api/v1/likes`
const commentsBase = `${API_ROOT}/api/v1/comments`
const playlistsBase = `${API_ROOT}/api/v1/playlists`

export const likesApi = {
  toggleVideoLike(videoId) {
    return request(likesBase, `/toggle/v/${videoId}`, { method: 'POST' })
  },
  toggleCommentLike(commentId) {
    return request(likesBase, `/toggle/c/${commentId}`, { method: 'POST' })
  },
  getLikedVideos(page = 1, limit = 12) {
    return request(likesBase, `/videos?page=${page}&limit=${limit}`)
  },
}

export const commentsApi = {
  getVideoComments(videoId, page = 1, limit = 10) {
    return request(commentsBase, `/${videoId}?page=${page}&limit=${limit}`)
  },
  getCommentReplies(commentId, page = 1, limit = 10) {
    return request(commentsBase, `/c/${commentId}/replies?page=${page}&limit=${limit}`)
  },
  addComment(videoId, content, parentCommentId = null) {
    return request(commentsBase, `/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    })
  },
  updateComment(commentId, content) {
    return request(commentsBase, `/c/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })
  },
  deleteComment(commentId) {
    return request(commentsBase, `/c/${commentId}`, { method: 'DELETE' })
  },
}

export const playlistsApi = {
  create(name, description = '', isPrivate = false) {
    return request(playlistsBase, '/', {
      method: 'POST',
      body: JSON.stringify({ name, description, isPrivate }),
    })
  },
  getUserPlaylists(userId) {
    return request(playlistsBase, `/user/${userId}`)
  },
  getById(playlistId) {
    return request(playlistsBase, `/${playlistId}`)
  },
  addVideo(playlistId, videoId) {
    return request(playlistsBase, `/add/${playlistId}/${videoId}`, { method: 'POST' })
  },
  removeVideo(playlistId, videoId) {
    return request(playlistsBase, `/remove/${playlistId}/${videoId}`, { method: 'DELETE' })
  },
  update(playlistId, data) {
    return request(playlistsBase, `/${playlistId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  delete(playlistId) {
    return request(playlistsBase, `/${playlistId}`, { method: 'DELETE' })
  },
}

export const api = usersApi

export { ApiClientError }
