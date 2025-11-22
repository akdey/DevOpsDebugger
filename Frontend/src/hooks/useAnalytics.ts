import { useState, useEffect, useCallback } from 'react'
import useAuthStore from '../stores/authStore'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AnalyticsCache {
  [key: string]: CacheEntry<any>
}

const analyticsCache: AnalyticsCache = {}

export function useAnalytics<T>(
  endpoint: string,
  queryParams?: Record<string, any>,
  skipCache?: boolean
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore((s) => s.token)

  const cacheKey = `${endpoint}?${new URLSearchParams(queryParams || {}).toString()}`

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache
      if (!skipCache && analyticsCache[cacheKey]) {
        const cached = analyticsCache[cacheKey]
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data)
          setLoading(false)
          return
        }
      }

      const url = new URL(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${endpoint}`)
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const result = await response.json()
      analyticsCache[cacheKey] = { data: result, timestamp: Date.now() }
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, queryParams, token, cacheKey, skipCache])

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
