import React from 'react'
import { useUserHistory } from '../../hooks/useUserHistory'
import { MetricCard, LoadingCard, ErrorCard } from './CardComponents'
import { ExternalLink, MessageSquare, Tag } from 'lucide-react'

interface UserHistoryViewProps {
  username?: string
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({ username }) => {
  const { data, loading, error, refetch } = useUserHistory(username)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <LoadingCard key={i} height="h-24" />
            ))}
        </div>
        <LoadingCard height="h-96" />
      </div>
    )
  }

  if (error) {
    return <ErrorCard error={error} title="User History" onRetry={refetch} />
  }

  if (!data) {
    return <div className="text-center text-gray-400 py-8">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">
          {username ? `${username}'s History` : 'My History'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">Questions and interactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Questions"
          value={data.stats.total_questions}
          icon="❓"
        />
        <MetricCard
          title="Answered"
          value={data.stats.answered}
          subtitle={`${((data.stats.answered / data.stats.total_questions) * 100).toFixed(1)}%`}
          icon="✅"
        />
        <MetricCard
          title="With MCP"
          value={data.stats.with_mcp}
          subtitle="Used external search"
          icon="🔗"
        />
        <MetricCard
          title="Avg Answer Length"
          value={`${(data.stats.avg_answer_length / 100).toFixed(0)}c`}
          subtitle={`${data.stats.avg_answer_length} chars`}
          icon="📝"
        />
      </div>

      {/* Recent Questions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Questions</h3>
        <div className="space-y-3">
          {data.recent.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No questions yet</div>
          ) : (
            data.recent.map((q: any) => (
              <QuestionCard key={q.id} question={q} />
            ))
          )}
        </div>
      </div>

      {/* Pagination info */}
      <div className="text-xs text-gray-500 text-center py-4">
        Showing {data.total_returned} of {data.stats.total_questions} questions
      </div>
    </div>
  )
}

interface QuestionCardProps {
  question: any
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  return (
    <div className="p-4 rounded-lg glassmorphism border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-sm leading-relaxed flex-1">{question.question}</h4>
        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
          {new Date(question.timestamp).toLocaleDateString()}
        </span>
      </div>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {question.tags.map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Answer Preview */}
      <div className="mb-3 p-3 rounded bg-white/5 border border-white/10">
        <p className="text-sm text-gray-300 line-clamp-3">
          <MessageSquare size={14} className="inline mr-2" />
          {question.final_answer.substring(0, 200)}
          {question.final_answer.length > 200 ? '...' : ''}
        </p>
      </div>

      {/* MCP Results */}
      {question.used_mcp && question.mcp_results && question.mcp_results.length > 0 && (
        <div className="mb-3 p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-cyan-300">📚 Sources via {question.used_mcp}</span>
          </div>
          <ul className="space-y-2">
            {question.mcp_results.map((result: any, idx: number) => (
              <li key={idx}>
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition"
                >
                  <ExternalLink size={12} />
                  {result.title}
                </a>
                {result.snippet && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">{result.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent Steps */}
      {question.agent_steps && question.agent_steps.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Steps:</span>
          {question.agent_steps.map((step: any, idx: number) => (
            <span key={idx} className="flex items-center gap-1">
              {step.status === 'done' ? '✅' : '⏳'} {step.agent}
              {idx < question.agent_steps.length - 1 && ' →'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserHistoryView
