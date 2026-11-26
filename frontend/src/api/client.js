import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('baladi_access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('baladi_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('baladi_access', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('baladi_access')
          localStorage.removeItem('baladi_refresh')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

export async function login(username, password) {
  const { data } = await api.post('/auth/login/', { username, password })
  localStorage.setItem('baladi_access', data.access)
  localStorage.setItem('baladi_refresh', data.refresh)
  return data
}

export function logout() {
  localStorage.removeItem('baladi_access')
  localStorage.removeItem('baladi_refresh')
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem('baladi_access'))
}
