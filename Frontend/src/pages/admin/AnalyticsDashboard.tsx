import React, { useState, lazy, Suspense } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { ChartSkeleton } from '../../components/Analytics/ChartComponents'

// Lazy-load heavier chart components to reduce initial bundle and layout thrash
const QuestionsTimeSeriesChart = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.QuestionsTimeSeriesChart })))
const TagsTimeSeriesChart = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.TagsTimeSeriesChart })))
const DistributionPieChart = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.DistributionPieChart })))
const UserComparisonChart = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.UserComparisonChart })))
const ScatterTagsChart = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.ScatterTagsChart })))
const TagCorrelationHeatmap = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.TagCorrelationHeatmap })))
const ActivityHeatmap = lazy(() => import('../../components/Analytics/ChartComponents').then(m => ({ default: m.ActivityHeatmap })))
import {
  MetricCard,
  AgentEfficiencyCard,
  InsightsCard,
  ForecastCard,
  LoadingCard,
  ErrorCard,
} from '../../components/Analytics/CardComponents'
import { RefreshCw } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [bucket, setBucket] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [daysBack, setDaysBack] = useState(30)

  // Fetch all analytics data
  const questionsTS: any = useAnalytics('/api/analytics/charts/questions-timeseries', {
    bucket,
    days_back: daysBack,
  })
  const tagsTS: any = useAnalytics('/api/analytics/charts/tags-timeseries', {
    bucket,
    days_back: daysBack,
    top_n: 5,
  })
  const distribution: any = useAnalytics('/api/analytics/charts/distribution')
  const userComparison: any = useAnalytics('/api/analytics/charts/user-comparison')
  const tagCorrelation: any = useAnalytics('/api/analytics/charts/tag-correlation', { top_n: 10 })
  const successRate: any = useAnalytics('/api/analytics/charts/success-rate')
  const insights: any = useAnalytics('/api/analytics/charts/insights')
  const predictions: any = useAnalytics('/api/analytics/charts/predictions')
  const agentEfficiency: any = useAnalytics('/api/analytics/charts/agent-efficiency')
  const activityHeatmap: any = useAnalytics('/api/analytics/charts/heatmap-hours', { days_back: daysBack })
  const scatterTags: any = useAnalytics('/api/analytics/charts/scatter-tags-volume')

  const refetchAll = () => {
    ;[
      questionsTS,
      tagsTS,
      distribution,
      userComparison,
      tagCorrelation,
      successRate,
      insights,
      predictions,
      agentEfficiency,
      activityHeatmap,
      scatterTags,
    ].forEach((q) => q.refetch())
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">DevOps Assistant System Metrics & Insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Period:</label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as any)}
              className="px-3 py-1 rounded bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Days:</label>
            <input
              type="number"
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-sm text-white"
            />
          </div>
          <button
            onClick={refetchAll}
            className="p-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition"
            title="Refresh all data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {successRate.loading ? (
          Array(4)
            .fill(null)
            .map((_, i) => <LoadingCard key={i} height="h-24" />)
        ) : successRate.error ? (
          <ErrorCard error={successRate.error} title="KPI Cards" onRetry={successRate.refetch} />
        ) : successRate.data ? (
          <>
            <MetricCard
              title="Answer Rate"
              value={`${(successRate.data.answered_rate * 100).toFixed(1)}%`}
              subtitle={`${successRate.data.answered}/${successRate.data.total_questions}`}
              icon="✅"
              trend="up"
              trendValue={5.2}
            />
            <MetricCard
              title="MCP Usage Rate"
              value={`${(successRate.data.mcp_rate * 100).toFixed(1)}%`}
              subtitle={`${successRate.data.with_mcp} questions`}
              icon="🔗"
              trend="up"
              trendValue={12.1}
            />
            <MetricCard
              title="Avg Answer Length"
              value={`${(successRate.data.avg_answer_length / 100).toFixed(0)}c`}
              subtitle={`${successRate.data.avg_answer_length} chars`}
              icon="📝"
            />
            <MetricCard
              title="Total Questions"
              value={successRate.data.total_questions}
              subtitle="All time"
              icon="❓"
            />
          </>
        ) : null}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Questions Time Series */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
            {questionsTS.loading ? (
              <ChartSkeleton height="h-72" />
            ) : questionsTS.error ? (
              <ErrorCard error={questionsTS.error} title="Questions Trend" onRetry={questionsTS.refetch} />
            ) : questionsTS.data ? (
              <Suspense fallback={<ChartSkeleton height="h-72" />}>
                <QuestionsTimeSeriesChart data={questionsTS.data.buckets} title="Questions Over Time" height={320} />
              </Suspense>
            ) : null}
        </div>

        {/* Success Rate Forecast */}
        <div>{predictions.data && <ForecastCard data={predictions.data} loading={predictions.loading} />}</div>

        {/* Tags Time Series */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10 lg:col-span-2">
            {tagsTS.loading ? (
              <ChartSkeleton height="h-72" />
            ) : tagsTS.error ? (
              <ErrorCard error={tagsTS.error} title="Tags Trend" onRetry={tagsTS.refetch} />
            ) : tagsTS.data ? (
              <Suspense fallback={<ChartSkeleton height="h-72" />}>
                <TagsTimeSeriesChart data={tagsTS.data.buckets} tags={tagsTS.data.top_tags} title="Top Tags Over Time" height={320} />
              </Suspense>
            ) : null}
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By User */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {distribution.loading ? (
            <ChartSkeleton height="h-56" />
          ) : distribution.error ? (
            <ErrorCard error={distribution.error} title="By User" onRetry={distribution.refetch} />
          ) : distribution.data ? (
            <Suspense fallback={<ChartSkeleton height="h-56" />}>
              <DistributionPieChart data={distribution.data.by_user} title="Questions by User" height={250} />
            </Suspense>
          ) : null}
        </div>

        {/* By Tag */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {distribution.loading ? (
            <ChartSkeleton height="h-56" />
          ) : distribution.error ? (
            <ErrorCard error={distribution.error} title="By Tag" onRetry={distribution.refetch} />
          ) : distribution.data ? (
            <Suspense fallback={<ChartSkeleton height="h-56" />}>
              <DistributionPieChart data={distribution.data.by_tag} title="Questions by Tag" height={250} />
            </Suspense>
          ) : null}
        </div>

        {/* MCP Usage */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {distribution.loading ? (
            <ChartSkeleton height="h-56" />
          ) : distribution.error ? (
            <ErrorCard error={distribution.error} title="MCP Usage" onRetry={distribution.refetch} />
          ) : distribution.data ? (
            <Suspense fallback={<ChartSkeleton height="h-56" />}>
              <DistributionPieChart data={distribution.data.mcp_usage} title="MCP Tools Usage" height={250} />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Detailed Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Comparison */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {userComparison.loading ? (
            <ChartSkeleton height="h-72" />
          ) : userComparison.error ? (
            <ErrorCard error={userComparison.error} title="User Comparison" onRetry={userComparison.refetch} />
          ) : userComparison.data ? (
            <Suspense fallback={<ChartSkeleton height="h-72" />}>
              <UserComparisonChart data={userComparison.data.users} title="User Activity Metrics" height={320} />
            </Suspense>
          ) : null}
        </div>

        {/* Tag Scatter */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {scatterTags.loading ? (
            <ChartSkeleton height="h-72" />
          ) : scatterTags.error ? (
            <ErrorCard error={scatterTags.error} title="Tag Analysis" onRetry={scatterTags.refetch} />
          ) : scatterTags.data ? (
            <Suspense fallback={<ChartSkeleton height="h-72" />}>
              <ScatterTagsChart data={scatterTags.data.points} title="Tag Frequency Analysis" height={320} />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Insights */}
        <div>{insights.data && <InsightsCard data={insights.data} loading={insights.loading} />}</div>

        {/* Agent Efficiency */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {agentEfficiency.loading ? (
            <LoadingCard height="h-64" />
          ) : agentEfficiency.error ? (
            <ErrorCard error={agentEfficiency.error} title="Agent Efficiency" onRetry={agentEfficiency.refetch} />
          ) : agentEfficiency.data ? (
            <AgentEfficiencyCard
              agents={agentEfficiency.data.agents}
              avgSteps={agentEfficiency.data.avg_steps_per_question}
            />
          ) : null}
        </div>
      </div>

      {/* Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Heatmap */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10">
          {activityHeatmap.loading ? (
            <ChartSkeleton height="h-72" />
          ) : activityHeatmap.error ? (
            <ErrorCard
              error={activityHeatmap.error}
              title="Activity Heatmap"
              onRetry={activityHeatmap.refetch}
            />
          ) : activityHeatmap.data ? (
            <Suspense fallback={<ChartSkeleton height="h-72" />}>
              <ActivityHeatmap data={activityHeatmap.data} title="Activity by Day & Hour" />
            </Suspense>
          ) : null}
        </div>

        {/* Tag Correlation */}
        <div className="glassmorphism rounded-lg p-4 border border-white/10 overflow-auto">
          {tagCorrelation.loading ? (
            <ChartSkeleton height="h-96" />
          ) : tagCorrelation.error ? (
            <ErrorCard
              error={tagCorrelation.error}
              title="Tag Correlation"
              onRetry={tagCorrelation.refetch}
            />
          ) : tagCorrelation.data ? (
            <Suspense fallback={<ChartSkeleton height="h-96" />}>
              <TagCorrelationHeatmap data={tagCorrelation.data} title="Tag Correlation Matrix" />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 py-4">
        <p>Dashboard auto-refreshes every 5 minutes. Data is cached locally.</p>
      </div>
    </div>
  )
}
