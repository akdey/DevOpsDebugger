import { useState, useEffect, useCallback } from 'react'
import useAuthStore from '../stores/authStore'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface HistoryCache {
  [key: string]: CacheEntry<any>
}

const historyCache: HistoryCache = {}

export function useUserHistory(username?: string, limit: number = 50) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore((s) => s.token)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  // Determine endpoint based on whether we're querying ourselves or another user
  const endpoint = username && isAdmin ? `/api/analytics/history/admin/user/${username}` : '/api/analytics/history/user'
  const cacheKey = `${endpoint}?limit=${limit}`

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache
      if (historyCache[cacheKey]) {
        const cached = historyCache[cacheKey]
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data)
          setLoading(false)
          return
        }
      }

      const url = new URL(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${endpoint}`)
      url.searchParams.append('limit', String(limit))

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied - admin access required')
        }
        throw new Error(`API Error: ${response.statusText}`)
      }

      const result = await response.json()
      historyCache[cacheKey] = { data: result, timestamp: Date.now() }
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, limit, token, cacheKey])

  useEffect(() => {
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    fetchData()
  }, [token, fetchData])

  return { data, loading, error, refetch: fetchData }
}
