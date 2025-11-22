import React from 'react'
import { BookOpen, Globe, ExternalLink, X } from 'lucide-react'

export interface UsedDoc {
  id: number
  title: string
  score: number
}

export interface WebSource {
  title: string
  link: string
  snippet: string
}

interface SourcesDisplayProps {
  usedDocs: UsedDoc[]
  webSources: WebSource[]
  onClose?: () => void
}

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ usedDocs, webSources, onClose }) => {
  if (usedDocs.length === 0 && webSources.length === 0) return null

  return (
    <div className="mt-4 space-y-3">
      {/* Knowledge Base Sources */}
      {usedDocs.length > 0 && (
        <div className="rounded-lg glassmorphism border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-blue-400" />
            <h4 className="font-semibold text-sm text-blue-300">Knowledge Base Sources</h4>
          </div>
          <div className="space-y-2">
            {usedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{doc.title}</p>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                    {(doc.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Sources */}
      {webSources.length > 0 && (
        <div className="rounded-lg glassmorphism border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-cyan-400" />
            <h4 className="font-semibold text-sm text-cyan-300">Web Sources</h4>
          </div>
          <div className="space-y-3">
            {webSources.map((source, idx) => (
              <div key={idx} className="rounded bg-white/5 p-2 hover:bg-white/10 transition">
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <ExternalLink size={14} className="text-cyan-400 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 truncate transition">
                      {source.title}
                    </p>
                    {source.snippet && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{source.snippet}</p>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-xs text-gray-500 hover:text-gray-400 rounded transition flex items-center justify-center gap-1"
        >
          <X size={14} />
          Collapse sources
        </button>
      )}
    </div>
  )
}

export default SourcesDisplay
