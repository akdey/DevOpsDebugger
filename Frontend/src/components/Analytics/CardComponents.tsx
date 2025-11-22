import React from 'react'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

// KPI Card Component
interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend = 'neutral',
  trendValue,
}) => (
  <div className="p-4 rounded-lg glassmorphism border border-white/10 hover:border-white/20 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs uppercase text-gray-400 tracking-wide">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {icon && <div className="text-2xl opacity-50">{icon}</div>}
    </div>
    {trendValue !== undefined && (
      <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
        {trend === 'up' && <TrendingUp size={14} />}
        {trend === 'down' && <TrendingDown size={14} />}
        <span>{trend === 'neutral' ? '–' : trend === 'up' ? '+' : ''}{trendValue}%</span>
      </div>
    )}
  </div>
)

// Agent Efficiency Card
interface AgentData {
  agent: string
  count: number
}

export const AgentEfficiencyCard: React.FC<{ agents: AgentData[]; avgSteps: number }> = ({ agents, avgSteps }) => (
  <div className="p-4 rounded-lg glassmorphism border border-white/10">
    <h3 className="text-lg font-semibold mb-4">🤖 Agent Performance</h3>
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.agent} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{agent.agent}</span>
              <span className="text-xs text-gray-400">{agent.count} runs</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                style={{ width: `${(agent.count / Math.max(...agents.map(a => a.count))) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400">Avg steps per question: <span className="text-white font-semibold">{avgSteps.toFixed(1)}</span></p>
      </div>
    </div>
  </div>
)

// Insights Card
interface InsightsData {
  insights: string
  recommendations: string[]
  total_questions: number
  analyzed_at: string
}

export const InsightsCard: React.FC<{ data: InsightsData | null; loading: boolean }> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-4 rounded-lg glassmorphism border border-white/10 h-64 animate-pulse">
        <div className="bg-white/5 h-full rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 rounded-lg glassmorphism border border-red-500/30 bg-red-500/5">
        <div className="flex gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-sm text-red-300">Failed to load insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg glassmorphism border border-white/10">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>💡</span> AI Insights
      </h3>
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{data.insights}</p>

      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <span>📋</span> Recommendations
      </h4>
      <ul className="space-y-2 mb-4">
        {data.recommendations.map((rec, idx) => (
          <li key={idx} className="text-sm text-gray-300 flex gap-2">
            <span className="text-blue-400 font-semibold flex-shrink-0">{idx + 1}.</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-500">
        Analyzed at {new Date(data.analyzed_at).toLocaleString()} ({data.total_questions} questions)
      </p>
    </div>
  )
}

// Forecast Card
interface PredictionData {
  prediction: string
  confidence: 'low' | 'medium' | 'high'
  trend: 'increasing' | 'decreasing' | 'stable'
  growth_rate_percent: number
  recent_7d: number
  prev_7d: number
}

export const ForecastCard: React.FC<{ data: PredictionData | null; loading: boolean }> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-4 rounded-lg glassmorphism border border-white/10 h-64 animate-pulse">
        <div className="bg-white/5 h-full rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 rounded-lg glassmorphism border border-red-500/30 bg-red-500/5">
        <div className="flex gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-sm text-red-300">Failed to load forecast</p>
        </div>
      </div>
    )
  }

  const confidenceColors = {
    low: 'text-yellow-400 bg-yellow-400/10',
    medium: 'text-blue-400 bg-blue-400/10',
    high: 'text-green-400 bg-green-400/10',
  }

  const trendEmoji = data.trend === 'increasing' ? '📈' : data.trend === 'decreasing' ? '📉' : '➡️'

  return (
    <div className="p-4 rounded-lg glassmorphism border border-white/10">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>🔮</span> Forecast
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Trend</span>
          <span className="text-sm font-semibold flex items-center gap-2">
            {trendEmoji}
            {data.trend.toUpperCase()} ({data.growth_rate_percent > 0 ? '+' : ''}{data.growth_rate_percent.toFixed(1)}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Confidence</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${confidenceColors[data.confidence]}`}>
            {data.confidence.toUpperCase()}
          </span>
        </div>

        <div className="py-3 border-t border-b border-white/10">
          <p className="text-sm text-gray-300 leading-relaxed">{data.prediction}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-white/5">
            <p className="text-xs text-gray-400">Last 7 days</p>
            <p className="text-lg font-bold">{data.recent_7d}</p>
          </div>
          <div className="p-2 rounded bg-white/5">
            <p className="text-xs text-gray-400">Previous 7 days</p>
            <p className="text-lg font-bold">{data.prev_7d}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Card
export const LoadingCard: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`p-4 rounded-lg glassmorphism border border-white/10 ${height} animate-pulse`}>
    <div className="bg-white/5 h-full rounded" />
  </div>
)

// Error Card
interface ErrorCardProps {
  error: string
  title?: string
  onRetry?: () => void
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ error, title = 'Error', onRetry }) => (
  <div className="p-4 rounded-lg glassmorphism border border-red-500/30 bg-red-500/5">
    <div className="flex gap-3 justify-between items-start">
      <div className="flex gap-3">
        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-red-300">{title}</p>
          <p className="text-xs text-red-200 mt-1">{error}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1 rounded bg-red-400/20 hover:bg-red-400/30 text-red-300 transition"
        >
          Retry
        </button>
      )}
    </div>
  </div>
)
