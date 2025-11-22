import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL } from './constants'
import useAuthStore from '../stores/authStore'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  // Read token from sessionStorage for JWT flow
  const token = sessionStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      sessionStorage.clear()
      try {
        useAuthStore.getState().logout()
      } catch (e) {
        // ignore
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const api = {
  health: () => apiClient.get('/health'),
  documents: {
    list: () => apiClient.get('/api/documents'),
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiClient.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    search: (q: string) => apiClient.get(`/api/documents/search?q=${encodeURIComponent(q)}`),
  },
  users: {
    create: (data: { username: string; token: string; roles: string[] }) => apiClient.post('/api/users', data),
    list: () => apiClient.get('/api/users'),
  },
}

export default apiClient
