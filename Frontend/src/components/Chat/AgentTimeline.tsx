import React from 'react'
import { AgentStep } from '../../types/chat'
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'

interface AgentTimelineProps {
  steps: AgentStep[]
  visible: boolean
}

export function AgentTimeline({ steps, visible }: AgentTimelineProps) {
  if (!visible || steps.length === 0) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'starting':
        return <Clock size={16} className="text-blue-400 animate-spin" />
      case 'complete':
        return <CheckCircle size={16} className="text-green-400" />
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  const getDuration = (started?: number, completed?: number) => {
    if (!started || !completed) return null
    const duration = completed - started
    return `${duration}ms`
  }

  return (
    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 border border-slate-700/50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200">Agent Workflow</h3>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={`${step.agent}-${index}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              {getStatusIcon(step.status)}
              {index < steps.length - 1 && (
                <div className="w-0.5 h-6 bg-slate-600 mt-1" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium text-cyan-300">{step.agent}</span>
                  {step.using_mcp && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                      MCP
                    </span>
                  )}
                </div>
                {getDuration(step.startedAt, step.completedAt) && (
                  <span className="text-xs text-gray-400">
                    {getDuration(step.startedAt, step.completedAt)}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
              
              {step.status === 'error' && step.payload?.error && (
                <p className="text-xs text-red-400 mt-1">{step.payload.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentTimeline
