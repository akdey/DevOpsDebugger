import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import ChatPage from './pages/chat/ChatPage'
import DocumentsPage from './pages/admin/DocumentsPage'
import UsersPage from './pages/admin/UsersPage'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import SettingsPage from './pages/SettingsPage'
import AppLayout from './components/Layout/AppLayout'
import useAuthStore from './stores/authStore'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  return isAdmin ? children : <Navigate to="/chat" replace />
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChatPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="documents" element={<AdminRoute><DocumentsPage /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="analytics" element={<AdminRoute><AnalyticsDashboard /></AdminRoute>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </div>
  )
}
