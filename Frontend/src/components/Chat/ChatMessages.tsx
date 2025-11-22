import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import Message from './Message'
import { SourcesDisplay } from './SourcesDisplay'

export function ChatMessages() {
  const messages = useChatStore((s) => s.messages)
  const usedDocs = useChatStore((s) => s.usedDocs)
  const webSources = useChatStore((s) => s.webSources)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastLength = useRef<number>(messages.length)
  // per-message sources open state (true = expanded)
  const [sourcesOpenMap, setSourcesOpenMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const shouldScroll = container.scrollTop + container.clientHeight >= container.scrollHeight - 150

    // if user was near bottom (or messages were just added), scroll to bottom
    if (shouldScroll || messages.length > lastLength.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
    lastLength.current = messages.length
  }, [messages])

  // When messages change, open sources for the most recent assistant message and minimize previous assistant sources
  useEffect(() => {
    if (!messages || messages.length === 0) return
    // find last assistant message
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return
    const newMap: Record<string, boolean> = {}
    messages.forEach((m) => {
      if (m.role === 'assistant') {
        // open only for the latest assistant message
        newMap[m.id] = m.id === lastAssistant.id
      }
    })
    setSourcesOpenMap(newMap)
  }, [messages])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent to-slate-900/40 min-h-0">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation to see messages here</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              sourcesOpen={sourcesOpenMap[msg.id] ?? false}
              onToggleSources={() => setSourcesOpenMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default ChatMessages
