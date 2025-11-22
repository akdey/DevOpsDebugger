import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { Button } from '../../components/Common/Button'
import { Input } from '../../components/Common/Input'
import { Zap, Cpu, MessageSquare, Code2, BookOpen, TrendingUp, Clock, Activity, AlertCircle, Play, RefreshCw } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string |null>(null)
  const [animationIndex, setAnimationIndex] = useState(0)
  const [leftTab, setLeftTab] = useState<'agents' | 'kb' | 'recent' | 'metrics'>('agents')
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()

  const agenticFeatures = [
    { icon: Cpu, label: 'Self-Healing Agents', desc: 'Autonomous remediation and playbook execution' },
    { icon: BookOpen, label: 'Live Knowledge Base', desc: 'Indexed docs, runbooks & change logs' },
    { icon: TrendingUp, label: 'Predictive Insights', desc: 'Anomaly detection & capacity forecasting' },
  ]

  // Mocked examples: latest searches, KB counts, and agent timeline
  const latestSearches = [
    { query: 'pod crashloopBackOff', time: '2m', score: 94 },
    { query: 'db migration stuck', time: '12m', score: 89 },
    { query: 'increase node pool', time: '1h', score: 82 },
  ]

  const kbStats = { documents: 1247, agents: 24, automations: 156 }

  const agentTimeline = [
    { time: 'Now', title: 'Agent: Canary deploy', status: 'running', icon: Play },
    { time: '3m', title: 'Agent: Health check', status: 'success', icon: RefreshCw },
    { time: '10m', title: 'Agent: Rollback', status: 'alert', icon: AlertCircle },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationIndex((prev) => (prev + 1) % agenticFeatures.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    try {
      if (!username || !password) {
        setError('Username and password are required')
        return
      }
      await login(username, password)
      // decide where to send user based on role
      const roles = JSON.parse(sessionStorage.getItem('roles') || '[]') as string[]
      if (roles.includes('admin')) navigate('/analytics')
      else navigate('/chat')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    }
  }

  const currentFeature = agenticFeatures[animationIndex]
  const CurrentIcon = currentFeature.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_10%_20%,rgba(59,130,246,0.08),transparent),radial-gradient(500px_350px_at_90%_80%,rgba(6,182,212,0.08),transparent)]" />

      <div className="relative max-w-5xl w-full mx-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Features showcase */}
          <div className="hidden lg:block space-y-8 px-4">
            {/* Logo & Branding */}
            <div className="flex items-center gap-3 mb-12">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">PipeLight</h2>
                <p className="text-xs text-gray-400">Agentic Intelligence for Infrastructure</p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all">
                <div className="flex items-start gap-3">
                  <Cpu className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-white text-sm">Intelligent Agent</h3>
                    <p className="text-xs text-gray-300 mt-1">AI-powered task execution & workflow orchestration</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
                <div className="flex items-start gap-3">
                  <MessageSquare className="text-cyan-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-white text-sm">Conversational Interface</h3>
                    <p className="text-xs text-gray-300 mt-1">Chat naturally with your infrastructure</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all">
                <div className="flex items-start gap-3">
                  <Code2 className="text-purple-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-white text-sm">DevOps Focused</h3>
                    <p className="text-xs text-gray-300 mt-1">Container orchestration, CI/CD, infrastructure as code</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating feature highlight */}
            <div className="mt-8 p-4 rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-slate-800/50 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <CurrentIcon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{currentFeature.label}</p>
                  <p className="text-xs text-gray-400">{currentFeature.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border border-gray-700/30 backdrop-blur-xl shadow-2xl">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 flex items-center gap-2 justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">DevOps RAG</h2>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-sm text-gray-300">Sign in to your agentic DevOps assistant</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-slate-700/40 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-700/40 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={!!loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-xs text-gray-400 text-center">
              By signing in, you agree to our terms of service and acknowledge our privacy policy.
            </div>

            {/* Quick info badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 pt-6 border-t border-gray-700/30">
              <div className="text-center">
                <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI-Powered</p>
                <p className="text-xs text-gray-400 mt-1">Agents</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Real-time</p>
                <p className="text-xs text-gray-400 mt-1">Execution</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Enterprise</p>
                <p className="text-xs text-gray-400 mt-1">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
