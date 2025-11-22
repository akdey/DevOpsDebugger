import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWebSocketClient, WebSocketClient } from '../services/websocket'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'

export function useChat() {
  const wsRef = useRef<WebSocketClient | null>(null)
  const connectingRef = useRef(false)
  const token = useAuthStore((s) => s.token)
  const addMessage = useChatStore((s) => s.addMessage)
  const addMessageWithId = useChatStore((s) => s.addMessageWithId)
  const setMessageStatus = useChatStore((s) => s.setMessageStatus)
  const setWaiting = useChatStore((s) => s.setWaiting)
  const updateAgentStep = useChatStore((s) => s.updateAgentStep)
  const setConnected = useChatStore((s) => s.setConnected)

  const navigate = useNavigate()

  const connectWebSocket = useCallback(() => {
    // prevent multiple simultaneous connection attempts
    if (connectingRef.current || wsRef.current) return
    
    if (!token) {
      // no token - force login
      sessionStorage.clear()
      try { useAuthStore.getState().logout() } catch (e) {}
      navigate('/login')
      return
    }
    
    connectingRef.current = true
    const client = createWebSocketClient({
      token,
      onMessage: (data) => {
        console.debug('[useChat] received message:', data)
        
        // Handle connection info
        if (data?.info === 'connected') {
          console.debug('[useChat] connected as', data.user)
          return
        }

        // Handle chat response
        if (data?.type === 'chatresponse') {
          // chatresponse can use different field names depending on server version
          const answer = data.answer || data.message || data.payload?.answer
          const used_docs = data.used_docs || data.payload?.used_docs || []
          const used_mcp = data.used_mcp || data.payload?.used_mcp
          const web_sources = data.web_sources || data.payload?.web_sources || []

          // Clear current agent when chat response is received
          useChatStore.getState().setCurrentAgent(null, false, null)

          // Add message with metadata if answer exists, but avoid duplicates
          if (answer) {
            const st = useChatStore.getState()
            const recentAssistant = st.messages.slice(-12).filter((m) => m.role === 'assistant')
            const duplicate = recentAssistant.find((m) => (m.content || '').trim() === String(answer).trim())
            if (!duplicate) {
              addMessage('assistant', String(answer), {
                used_docs: used_docs || [],
                used_mcp: used_mcp || undefined,
                web_sources: web_sources || [],
              })
            } else {
              // If duplicate content exists, merge metadata into existing message so sources are preserved
              console.debug('[useChat] merging metadata into existing assistant message', { id: duplicate.id })
              try {
                useChatStore.getState().setMessageMetadata(duplicate.id, {
                  used_docs: used_docs || [],
                  used_mcp: used_mcp || undefined,
                  web_sources: web_sources || [],
                })
              } catch (e) {
                console.warn('[useChat] failed to merge metadata', e)
              }
            }
          }
          return
        }

        // Handle agent events
        if (data?.type === 'agent_event') {
          const event = data
          const { agent, status, description, using_mcp, payload } = event
          
          updateAgentStep(agent, status, description, using_mcp, payload)
          
          if (status === 'starting') {
            useChatStore.getState().setCurrentAgent(agent, using_mcp, description)
          }
          
          if (status === 'complete') {
            // Clear current agent when any agent completes
            useChatStore.getState().setCurrentAgent(null, false, null)
            
            // Extract and store sources from Synthesizer or Workflow complete
            if ((agent === 'Synthesizer' || agent === 'Workflow') && payload) {
              const usedDocs = payload.used_docs || []
              const webSources = payload.web_sources || []
              useChatStore.getState().setSources(usedDocs, webSources)
            }

            // Handle final answer
            if (agent === 'Workflow' && payload?.answer) {
              // Mark pending user messages as sent and stop waiting
              const st = useChatStore.getState()
              st.messages.filter((m) => m.status === 'pending').forEach((m) => st.setMessageStatus(m.id, 'sent'))
              st.setWaiting(false)
              // Add final answer but avoid duplicates (some servers send both chatresponse and agent_event)
              const finalAnswer = String(payload.answer)
              const st2 = useChatStore.getState()
              const recentAssistant2 = st2.messages.slice(-6).filter((m) => m.role === 'assistant')
              const duplicateFinal = recentAssistant2.some((m) => (m.content || '').trim() === finalAnswer.trim())
              if (!duplicateFinal) {
                addMessage('assistant', finalAnswer)
              } else {
                console.debug('[useChat] skipped duplicate final Workflow answer')
              }
            }
          }
        }
      },
      onError: () => {
        setConnected(false)
      },
      onClose: (evt) => {
        setConnected(false)
        wsRef.current = null
        // If server closed with 1008 (policy/unauthorized), clear session and redirect to login
        const code = (evt as CloseEvent | undefined)?.code
        if (code === 1008) {
          sessionStorage.clear()
          try {
            useAuthStore.getState().logout()
          } catch (e) {}
          navigate('/login')
        }
      },
    })

    client.connect().then(() => {
      wsRef.current = client
      connectingRef.current = false
      setConnected(true)
    }).catch(() => {
      connectingRef.current = false
      setConnected(false)
    })
  }, [token, addMessage, updateAgentStep, setConnected, navigate])

  const sendMessage = useCallback((message: string) => {
    if (!wsRef.current) return
    // reset agent timeline for new message
    useChatStore.getState().resetAgentTimeline()
    // open sidebar when message is sent
    useChatStore.getState().setSidebarOpen(true)
    // create optimistic message with pending status
    const id = Date.now().toString()
    addMessageWithId('user', message, id, 'pending')
    // mark we're waiting for response
    setWaiting(true)
    try {
      wsRef.current.send(message)
      // if socket is open, mark message as sent immediately
      if (wsRef.current.isOpen && wsRef.current.isOpen()) {
        setMessageStatus(id, 'sent')
      }
    } catch (e) {
      // mark message as error
      setMessageStatus(id, 'error')
      setWaiting(false)
    }
  }, [addMessageWithId, setMessageStatus, setWaiting])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }
    connectingRef.current = false
  }, [])

  useEffect(() => {
    connectWebSocket()
    return () => disconnect()
  }, [token, connectWebSocket, disconnect])

  return { sendMessage }
}
