import React from 'react'
import useAuthStore from '../stores/authStore'

export default function SettingsPage() {
  const username = useAuthStore((s) => s.username)
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="p-4 bg-slate-800 rounded">Settings UI (profile, preferences) for {username || 'user'}.</div>
    </div>
  )
}
