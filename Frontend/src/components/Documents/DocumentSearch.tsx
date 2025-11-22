import React, { useState, useEffect } from 'react'
import { Search, List, Loader, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'

interface Document {
  id: number
  title: string
  content: string
  score?: number
}

interface DocumentSearchProps {
  refreshTrigger?: number
}

export function DocumentSearch({ refreshTrigger }: DocumentSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null)
  const [showingAll, setShowingAll] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a search query.',
      })
      return
    }

    setLoading(true)
    setMessage(null)
    setShowingAll(false)

    try {
      const response = await api.documents.search(query)
      setResults(response.data)
      if (response.data.length === 0) {
        setMessage({
          type: 'info',
          text: 'No results found. Try different keywords.',
        })
      }
    } catch (error: any) {
      const errorText = error.response?.data?.detail || error.message || 'Search failed'
      setMessage({
        type: 'error',
        text: `Error: ${errorText}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleListAll = async () => {
    setLoading(true)
    setMessage(null)
    setShowingAll(true)
    setQuery('')

    try {
      const response = await api.documents.list()
      setResults(response.data)
      if (response.data.length === 0) {
        setMessage({
          type: 'info',
          text: 'No documents found.',
        })
      }
    } catch (error: any) {
      const errorText = error.response?.data?.detail || error.message || 'Failed to fetch documents'
      setMessage({
        type: 'error',
        text: `Error: ${errorText}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Refresh results when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      handleListAll()
    }
  }, [refreshTrigger])

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Search size={20} className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Search Documents</h3>
        </div>

        <p className="text-sm text-gray-300">Search documents by topic using AI-powered semantic search.</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 'How to set up CI/CD?'"
            className="flex-1 px-4 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search
              </>
            )}
          </button>

          <button
            onClick={handleListAll}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading && showingAll ? (
              <>
                <Loader size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <List size={18} />
                Show All
              </>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              message.type === 'error'
                ? 'bg-red-900/20 border-red-700/30 text-red-300'
                : 'bg-blue-900/20 border-blue-700/30 text-blue-300'
            }`}
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{message.text}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {showingAll ? `All Documents (${results.length})` : `Search Results (${results.length})`}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((doc, index) => (
              <div
                key={`${doc.id}-${index}`}
                className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-cyan-300">{doc.title}</h4>
                  </div>
                  {doc.score !== undefined && (
                    <div className="text-xs px-2 py-1 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
                      {(doc.score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-300 line-clamp-2">
                  {doc.content.substring(0, 200)}
                  {doc.content.length > 200 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentSearch
