import React from 'react'
import { useChatStore } from '../../stores/chatStore'
import { AgentTimeline } from './AgentTimeline'

export function AgentFlow() {
  const agentSteps = useChatStore((s) => s.agentSteps)
  const showAgentTimeline = useChatStore((s) => s.showAgentTimeline)
  const isConnected = useChatStore((s) => s.isConnected)

  return (
    <div className="p-4 glassmorphism rounded-md h-full overflow-y-auto space-y-4">
      {/* Connection Status */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">Workflow</h3>
        <div className={`text-xs flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Agent Timeline */}
      <AgentTimeline steps={agentSteps} visible={showAgentTimeline} />
    </div>
  )
}

export default AgentFlow
