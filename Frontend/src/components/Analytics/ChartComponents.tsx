import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'

// Loading skeleton
export const ChartSkeleton: React.FC<{height?: string}> = ({ height = 'h-96' }) => (
  <div className={`w-full ${height} bg-white/5 rounded-lg animate-pulse`} />
)

// Line Chart Component
interface LineChartProps {
  data: Array<{ key: string; count: number }>
  title?: string
  height?: number
}

export const QuestionsTimeSeriesChart: React.FC<LineChartProps> = ({ data, title, height = 400 }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="key" stroke="#999" />
        <YAxis stroke="#999" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Questions" />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

// Area Chart Component (for tags time series)
interface AreaChartProps {
  data: any[]
  tags: string[]
  title?: string
  height?: number
}

const COLORS_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

export const TagsTimeSeriesChart: React.FC<AreaChartProps> = ({ data, tags, title, height = 400 }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="key" stroke="#999" />
        <YAxis stroke="#999" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <Legend />
        {tags.map((tag, idx) => (
          <Area
            key={tag}
            type="monotone"
            dataKey={tag}
            stackId="1"
            stroke={COLORS_PALETTE[idx % COLORS_PALETTE.length]}
            fill={COLORS_PALETTE[idx % COLORS_PALETTE.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

// Pie Chart Component
interface PieChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  height?: number
}

export const DistributionPieChart: React.FC<PieChartProps> = ({ data, title, height = 300 }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
)

// Bar Chart Component
interface BarChartProps {
  data: any[]
  dataKey: string
  title?: string
  height?: number
  xAxisKey?: string
}

export const ComparisonBarChart: React.FC<BarChartProps> = ({ data, dataKey, title, height = 400, xAxisKey = 'name' }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey={xAxisKey} stroke="#999" />
        <YAxis stroke="#999" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <Legend />
        <Bar dataKey={dataKey} fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// User Comparison Multi-Bar Chart
interface UserComparisonData {
  user: string
  total_questions: number
  mcp_used_count: number
  mcp_usage_rate: number
  avg_tags_per_question: number
}

export const UserComparisonChart: React.FC<{ data: UserComparisonData[]; title?: string; height?: number }> = ({
  data,
  title,
  height = 400,
}) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="user" stroke="#999" />
        <YAxis stroke="#999" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <Legend />
        <Bar dataKey="total_questions" fill="#3b82f6" name="Total Questions" radius={[8, 8, 0, 0]} />
        <Bar dataKey="mcp_used_count" fill="#10b981" name="MCP Used" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// Scatter Chart for Tag Volume
interface ScatterPoint {
  tag: string
  frequency: number
  avg_per_q: number
}

export const ScatterTagsChart: React.FC<{ data: ScatterPoint[]; title?: string; height?: number }> = ({
  data,
  title,
  height = 400,
}) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="frequency" name="Tag Frequency" stroke="#999" />
        <YAxis dataKey="avg_per_q" name="Avg per Question" stroke="#999" />
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter name="Tags" data={data} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  </div>
)

// Heatmap Component (Tag Correlation)
interface HeatmapData {
  tags: string[]
  heatmap: Record<string, Record<string, number>>
}

export const TagCorrelationHeatmap: React.FC<{ data: HeatmapData; title?: string }> = ({ data, title }) => {
  const maxValue = Math.max(...Object.values(data.heatmap).flatMap(row => Object.values(row)))

  const getIntensity = (count: number) => count / maxValue

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {data.tags.map((tag) => (
                <th key={tag} className="p-2 text-xs font-semibold text-center">
                  {tag}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tags.map((tag1) => (
              <tr key={tag1}>
                <td className="p-2 font-semibold text-sm">{tag1}</td>
                {data.tags.map((tag2) => {
                  const count = data.heatmap[tag1]?.[tag2] || 0
                  const intensity = getIntensity(count)
                  return (
                    <td
                      key={`${tag1}-${tag2}`}
                      className="p-2 text-center text-xs font-semibold border border-white/10"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${intensity * 0.8})`,
                        color: intensity > 0.5 ? '#fff' : '#999',
                      }}
                      title={`${tag1} × ${tag2}: ${count}`}
                    >
                      {count}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Activity Heatmap (Day × Hour)
interface ActivityData {
  heatmap: Record<string, Record<string, number>>
  days_back: number
}

export const ActivityHeatmap: React.FC<{ data: ActivityData; title?: string }> = ({ data, title }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  const maxValue = Math.max(...days.flatMap(day => Object.values(data.heatmap[day] || {})))

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(100,116,139,0.2)'
    const intensity = count / maxValue
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.7})`
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1"></th>
              {hours.map((h) => (
                <th key={h} className="p-1 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="p-1 font-semibold">{day}</td>
                {hours.map((h) => {
                  const count = data.heatmap[day]?.[h] || 0
                  return (
                    <td
                      key={`${day}-${h}`}
                      className="p-1 border border-white/5"
                      style={{
                        backgroundColor: getColor(count),
                        width: '25px',
                        height: '25px',
                        textAlign: 'center',
                      }}
                      title={`${day} ${h}: ${count} questions`}
                    >
                      {count > 0 ? count : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
