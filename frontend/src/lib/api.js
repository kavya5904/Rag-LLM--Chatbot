import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password }).then((r) => r.data)

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)

// ── Sessions ────────────────────────────────────────────────────────────────

/** @returns {Promise<import('../types').SessionSummary[]>} */
export const getSessions = () => api.get('/sessions').then(r => r.data)

export const getDocuments = () => api.get('/documents').then(r => r.data)

/**
 * @param {string|null} title
 * @param {string|null} documentName
 * @returns {Promise<import('../types').SessionSummary>}
 */
export const createSession = (title = null, documentName = null) =>
  api.post('/sessions', {
    title: title || undefined,
    document_name: documentName || undefined,
  }).then(r => r.data)

/**
 * @param {number} id
 * @returns {Promise<import('../types').SessionDetail>}
 */
export const getSession = (id) => api.get(`/sessions/${id}`).then(r => r.data)

/**
 * @param {number} id
 */
export const deleteSession = (id) => api.delete(`/sessions/${id}`)

/**
 * @param {number} id
 * @param {string} title
 * @returns {Promise<import('../types').SessionSummary>}
 */
export const renameSession = (id, title) =>
  api.patch(`/sessions/${id}`, { title }).then(r => r.data)

/**
 * @param {number} sessionId
 * @param {string} message
 * @param {string|null} documentName
 * @returns {Promise<import('../types').ChatResponse>}
 */
export const sendMessage = (sessionId, message, documentName = null) =>
  api.post('/chat', {
    session_id: sessionId,
    message,
    document_name: documentName || undefined,
  }).then(r => r.data)

/**
 * @param {File} file
 * @returns {Promise<import('../types').UploadResponse>}
 */
export const uploadPDF = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
