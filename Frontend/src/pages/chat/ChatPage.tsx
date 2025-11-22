import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import { useChatStore } from '../../stores/chatStore'
import ChatMessages from '../../components/Chat/ChatMessages'
import ChatInput from '../../components/Chat/ChatInput'
import AgentFlow from '../../components/Chat/AgentFlow'

export default function ChatPage() {
  const { sendMessage } = useChat()
  const waiting = useChatStore((s) => s.waitingForResponse)
  const sidebarOpen = useChatStore((s) => s.sidebarOpen)
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen)

  return (
    <div className="h-full w-full flex gap-0">
      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
        <ChatMessages />
        <ChatInput onSend={sendMessage} disabled={waiting} />
      </div>

      {/* Agent flow sidebar - animated */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 h-full border-l border-white/5 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-gray-400 hover:text-gray-200" />
            </button>

            <AgentFlow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
