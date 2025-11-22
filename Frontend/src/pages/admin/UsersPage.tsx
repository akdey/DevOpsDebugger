import React, { useState } from 'react'
import useAuthStore from '../../stores/authStore'
import apiClient from '../../services/api'

interface UserForm {
  username: string
  password: string
  role: string
}

export default function UsersPage() {
  const roles = useAuthStore((s) => s.roles)
  if (!roles.includes('admin')) return <div className="p-6">Access Denied</div>
  const [form, setForm] = useState<UserForm>({ username: '', password: '', role: 'user' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (!form.username.trim() || !form.password.trim()) {
      setError('username and password required')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.post('/api/users', { username: form.username, password: form.password, role: form.role })
      setResult(res.data)
      setForm({ username: '', password: '', role: 'user' })
    } catch (err: any) {
      setError(err?.message || 'Create user failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Users (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} className="w-full p-2 rounded bg-slate-800 border border-white/5" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} className="w-full p-2 rounded bg-slate-800 border border-white/5" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} className="w-full p-2 rounded bg-slate-800 border border-white/5">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {result && <div className="text-sm text-green-400">Created user: {result.username}</div>}
        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600">{loading ? 'Creating…' : 'Create User'}</button>
        </div>
      </form>
    </div>
  )
}
