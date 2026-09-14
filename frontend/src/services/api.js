import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle token refresh & errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }

    // Show toast for common errors (except 401 which is handled above)
    if (error.response?.status !== 401) {
      if (error.response?.status >= 500) {
        toast.error('Server error. Please try again.')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission for this action.')
      } else if (error.response?.status === 404) {
        // Don't show toast for 404 — let components handle it
      }
    }

    return Promise.reject(error)
  }
)

export default api
