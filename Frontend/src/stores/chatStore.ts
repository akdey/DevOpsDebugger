import { create } from 'zustand'
import { Message, AgentStep } from '../types/chat'

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

interface ChatState {
  messages: Message[]
  agentSteps: AgentStep[]
  isConnected: boolean
  waitingForResponse: boolean
  currentAgent: string | null
  currentAgentMcp?: boolean
  currentAgentDescription?: string | null
  usedDocs: UsedDoc[]
  webSources: WebSource[]
  showAgentTimeline: boolean
  sidebarOpen: boolean
  addMessage: (role: 'user' | 'assistant' | 'system', content: string, metadata?: { used_docs?: any[]; used_mcp?: string; web_sources?: any[] }) => void
  addMessageWithId: (role: 'user' | 'assistant' | 'system', content: string, id?: string, status?: 'pending' | 'sent' | 'error', metadata?: { used_docs?: any[]; used_mcp?: string; web_sources?: any[] }) => void
  setMessageStatus: (id: string, status: 'pending' | 'sent' | 'error') => void
  setWaiting: (v: boolean) => void
  setConnected: (connected: boolean) => void
  updateAgentStep: (agent: string, status: 'starting' | 'complete' | 'error', description: string, using_mcp?: boolean, payload?: Record<string, any>) => void
  setCurrentAgent: (agent: string | null, mcp?: boolean, description?: string | null) => void
  setSources: (usedDocs: UsedDoc[], webSources: WebSource[]) => void
  resetAgentTimeline: () => void
  hideAgentTimeline: () => void
  setSidebarOpen: (open: boolean) => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  agentSteps: [],
  isConnected: false,
  waitingForResponse: false,
  currentAgent: null,
  currentAgentMcp: false,
  currentAgentDescription: null,
  usedDocs: [],
  webSources: [],
  showAgentTimeline: false,
  sidebarOpen: false,
  setWaiting: (v: boolean) => set({ waitingForResponse: v }),
  addMessage: (role, content, metadata) =>
    set((state) => {
      const id = Date.now().toString()
      const norm = normalizeMetadata(metadata)
      try {
        console.debug('[chatStore] addMessage', { id, role, content, norm })
      } catch {}
      return { messages: [...state.messages, { id, role, content, timestamp: new Date(), status: 'sent', ...norm } as Message] }
    }),
  addMessageWithId: (role, content, id = Date.now().toString(), status = 'sent', metadata) =>
    set((state) => {
      const norm = normalizeMetadata(metadata)
      try {
        console.debug('[chatStore] addMessageWithId', { id, role, content, norm })
      } catch {}
      return { messages: [...state.messages, { id, role, content, timestamp: new Date(), status, ...norm } as Message] }
    }),
  setMessageStatus: (id, status) =>
    set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, status } : m)) })),
  setConnected: (connected) => set({ isConnected: connected }),
  updateAgentStep: (agent, status, description, using_mcp, payload) =>
    set((state) => {
      const existing = state.agentSteps.find((s) => s.agent === agent)
      const base: any = { agent, status, description, using_mcp, payload }
      if (status === 'starting') base.startedAt = Date.now()
      if (status === 'complete' || status === 'error') base.completedAt = Date.now()
      const updated = existing ? { ...existing, ...base } : base
      const newSteps = existing ? state.agentSteps.map((s) => (s.agent === agent ? updated : s)) : [...state.agentSteps, updated]
      return { agentSteps: newSteps, showAgentTimeline: true }
    }),
  setCurrentAgent: (agent, mcp, description) => set({ currentAgent: agent, currentAgentMcp: mcp || false, currentAgentDescription: description || null }),
  setSources: (usedDocs, webSources) => set({ usedDocs, webSources }),
  setMessageMetadata: (id, metadata) =>
    set((state) => {
      const norm = normalizeMetadata(metadata)
      return { messages: state.messages.map((m) => (m.id === id ? { ...m, ...norm } : m)) }
    }),
  resetAgentTimeline: () => set({ agentSteps: [], currentAgent: null, showAgentTimeline: false }),
  hideAgentTimeline: () => set({ showAgentTimeline: false }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  clearChat: () => set({ messages: [], agentSteps: [], waitingForResponse: false, currentAgent: null, currentAgentMcp: false, usedDocs: [], webSources: [], showAgentTimeline: false, sidebarOpen: false }),
}))

export default useChatStore

// Helper: normalize incoming metadata into consistent keys used_docs and web_sources
function normalizeMetadata(metadata?: { [k: string]: any } | undefined) {
  if (!metadata) return {}
  const used_docs = metadata.used_docs || metadata.docs || metadata.documents || metadata.usedDocs || metadata.documents_used || []
  const web_sources = metadata.web_sources || metadata.websearches || metadata.web_searches || metadata.webSources || metadata.web || []
  const used_mcp = metadata.used_mcp || metadata.usedMcp || metadata.with_mcp || metadata.used_mcp_name || undefined
  return { used_docs, web_sources, used_mcp }
}
