import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const waiting = useChatStore((s) => s.waitingForResponse)
  const currentAgentDescription = useChatStore((s) => s.currentAgentDescription)

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-white/5 p-3 bg-slate-900">
      <div className="flex gap-3 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={waiting && currentAgentDescription ? `${currentAgentDescription} · Processing…` : 'Ask your DevOps assistant...'}
          disabled={disabled}
          className="flex-1 h-10 px-4 text-sm rounded-full bg-slate-800/70 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
          type="text"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Send message"
        >
          {disabled ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  )
}

export default ChatInput
