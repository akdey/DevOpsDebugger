import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import useAuthStore from '../stores/authStore'
import { useState, useCallback } from 'react'

export interface Document {
  id: number
  title: string
  content: string
  score?: number
}

export function useDocuments() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const [searchError, setSearchError] = useState<string | null>(null)

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.documents.list().then((r) => r.data),
  })

  const uploadMutation = useMutation({
    // Expect a File to be uploaded (used by DocumentUpload component)
    mutationFn: (file: File) => api.documents.upload(file).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  // Search documents semantically
  const searchDocs = useCallback(
    async (query: string): Promise<Document[]> => {
      if (!token) {
        setSearchError('Not authenticated')
        return []
      }

      if (!query.trim()) return []

      try {
        setSearchError(null)

        const q = encodeURIComponent(query)
        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/documents/search?q=${q}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)

        const results = await response.json()
        return results // [{ id, title, content, score }, ...]
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Unknown error')
        return []
      }
    },
    [token]
  )

  return { documentsQuery, uploadMutation, searchDocs, searchError }
}
