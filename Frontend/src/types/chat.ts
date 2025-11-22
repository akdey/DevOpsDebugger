export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'sent' | 'error'
  used_docs?: any[]
  used_mcp?: string
  web_sources?: any[]
}

export interface AgentStep {
  agent: string
  status: 'starting' | 'complete' | 'error'
  description: string
  using_mcp?: boolean
  payload?: Record<string, any>
  startedAt?: number
  completedAt?: number
}

export interface AgentEvent {
  type: 'agent_event'
  agent: string
  status: 'starting' | 'complete' | 'error'
  description: string
  using_mcp?: boolean
  payload?: {
    result?: Record<string, any>
    error?: string
    answer?: string
    agent_steps?: any[]
    used_mcp?: string
  }
}

export interface ConnectInfo {
  info: 'connected'
  user: string
}

export interface WebSocketMessage {
  agent: string
  status: string
  payload?: Record<string, any>
}
