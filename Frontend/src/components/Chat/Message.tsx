import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Message as MessageType } from '../../types/chat'
import { Clock, CheckCircle, AlertCircle, Zap, Database, ChevronDown, ChevronUp } from 'lucide-react'
import { SourcesDisplay } from './SourcesDisplay'

interface MessageProps {
  message: MessageType
  sourcesOpen?: boolean
  onToggleSources?: () => void
}

export function Message({ message, sourcesOpen = false, onToggleSources }: MessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="text-xs text-gray-500 italic">{message.content}</div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="flex items-end gap-3">
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-slate-700/40 flex items-center justify-center text-sm text-cyan-200">A</div>
        )}

        <div
          className={`max-w-lg px-4 py-3 rounded-xl shadow-md backdrop-blur-sm border ${
            isUser
              ? 'bg-gradient-to-r from-blue-600/80 to-cyan-500/80 text-white rounded-br-none border-blue-400/30 transform transition hover:-translate-y-0.5'
              : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-100 rounded-bl-none border-white/20'
          }`}
        >
          <div className="text-sm break-words leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Show metadata for assistant messages */}
          {!isUser && (message.used_mcp || (message.used_docs?.length ?? 0) > 0 || (message.web_sources?.length ?? 0) > 0) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {message.used_mcp && (
                    <div className="flex items-center gap-2 text-xs text-cyan-300">
                      <Zap size={14} />
                      <span>MCP: <strong>{message.used_mcp}</strong></span>
                    </div>
                  )}
                  {message.used_docs && message.used_docs.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <Database size={14} />
                      <span>Docs Used: <strong>{message.used_docs.length}</strong></span>
                    </div>
                  )}
                  {message.web_sources && message.web_sources.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-300">
                      <AlertCircle size={14} />
                      <span>Web Sources: <strong>{message.web_sources.length}</strong></span>
                    </div>
                  )}
                </div>
                <div>
                  {(message.used_docs?.length || message.web_sources?.length) ? (
                    <button onClick={onToggleSources} className="p-1 text-gray-300 hover:text-white rounded">
                      {sourcesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  ) : null}
                </div>

              </div>

              {sourcesOpen && ((message.used_docs?.length ?? 0) > 0 || (message.web_sources?.length ?? 0) > 0) && (
                <SourcesDisplay usedDocs={message.used_docs || []} webSources={message.web_sources || []} />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-300 flex items-center gap-2">
              {isUser && message.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span className="text-xs">Sending…</span>
                </div>
              )}
              {isUser && message.status === 'error' && (
                <div className="flex items-center gap-1 text-red-400"><AlertCircle size={14} /> Failed</div>
              )}
              {isUser && message.status === 'sent' && (
                <CheckCircle size={14} className="text-blue-100" />
              )}
            </div>
          </div>
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-sm font-bold">Y</div>
        )}
      </div>
    </div>
  )
}

export default Message
