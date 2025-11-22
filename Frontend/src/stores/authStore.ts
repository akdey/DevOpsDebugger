import { create } from 'zustand'
import { API_BASE_URL } from '../services/constants'

interface AuthState {
  token: string | null
  username: string | null
  roles: string[]
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: sessionStorage.getItem('token') || null,
  username: sessionStorage.getItem('username') || null,
  roles: JSON.parse(sessionStorage.getItem('roles') || '[]'),
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Login failed')
      }

      const data = await res.json()
      const token = data.access_token
      // try to parse roles and username from token if backend doesn't return them
      let parsedRoles: string[] = []
      let parsedUsername: string | null = data.username || null
      try {
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload))
        if (!parsedUsername) parsedUsername = decoded.username || decoded.sub || null
        if (decoded.roles) parsedRoles = decoded.roles
        if (!parsedRoles.length && decoded.role) parsedRoles = Array.isArray(decoded.role) ? decoded.role : [decoded.role]
      } catch (e) {
        // ignore parse errors
      }

      sessionStorage.setItem('token', token)
      if (parsedUsername) sessionStorage.setItem('username', parsedUsername)
      sessionStorage.setItem('roles', JSON.stringify(parsedRoles || []))

      set({ token, username: parsedUsername, roles: parsedRoles || [], loading: false })
    } catch (err: any) {
      set({ error: err?.message || 'Login failed', loading: false })
      throw err
    }
  },

  register: async (username: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Registration failed')
      }

      const data = await res.json()
      const token = data.access_token
      let parsedRoles: string[] = []
      let parsedUsername: string | null = data.username || null
      try {
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload))
        if (!parsedUsername) parsedUsername = decoded.username || decoded.sub || null
        if (decoded.roles) parsedRoles = decoded.roles
        if (!parsedRoles.length && decoded.role) parsedRoles = Array.isArray(decoded.role) ? decoded.role : [decoded.role]
      } catch (e) {}

      sessionStorage.setItem('token', token)
      if (parsedUsername) sessionStorage.setItem('username', parsedUsername)
      sessionStorage.setItem('roles', JSON.stringify(parsedRoles || []))

      set({ token, username: parsedUsername, roles: parsedRoles || [], loading: false })
    } catch (err: any) {
      set({ error: err?.message || 'Registration failed', loading: false })
      throw err
    }
  },

  logout: () => {
    sessionStorage.clear()
    set({ token: null, username: null, roles: [], error: null })
  },

  isAuthenticated: () => !!get().token,

  isAdmin: () => get().roles.includes('admin'),
  hasRole: (role: string) => get().roles.includes(role),
}))

export default useAuthStore
