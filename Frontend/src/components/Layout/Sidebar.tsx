import React from 'react'
import { NavLink } from 'react-router-dom'
import { MessageCircle, FileText, Users, Settings, LogOut, Menu, Plus, BarChart3 } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  updatedAt: number
}

export default function Sidebar() {
  const username = useAuthStore((s) => s.username)
  const roles = useAuthStore((s) => s.roles)
  const messages = useChatStore((s) => s.messages)
  const clearChat = useChatStore((s) => s.clearChat)

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return localStorage.getItem('pl_sidebar_collapsed') === 'true' } catch { return false }
  })
  const [convos, setConvos] = React.useState<Conversation[]>(() => {
    try { return JSON.parse(localStorage.getItem('pl_conversations') || '[]') } catch { return [] }
  })

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('pl_sidebar_collapsed', next ? 'true' : 'false') } catch {}
  }

  const saveConversation = () => {
    if (!messages || messages.length === 0) return
    const titleSource = messages.find((m) => m.role === 'user')?.content || messages[0].content || 'Chat'
    const title = titleSource.slice(0, 80)
    const conv: Conversation = { id: Date.now().toString(), title, lastMessage: messages[messages.length - 1]?.content, updatedAt: Date.now() }
    const next = [conv, ...convos].slice(0, 50)
    setConvos(next)
    try { localStorage.setItem('pl_conversations', JSON.stringify(next)) } catch {}
    clearChat()
  }

  const loadConversation = (c: Conversation) => {
    // For now, just clear current chat and set a small system message noting the loaded convo
    clearChat()
    const st = useChatStore.getState()
    st.addMessage('system', `Loaded conversation: ${c.title}`)
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} p-2 h-full min-h-0 flex flex-col glassmorphism border-r border-white/5 transition-all duration-200 overflow-hidden` }>
      <div className="flex items-center gap-3 mb-2 justify-between">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <div className="pl-2">
              <div className="text-sm font-semibold">PipeLight</div>
              <div className="text-xs text-gray-400">Assistant</div>
            </div>
          )}
        </div>
        <button onClick={toggle} className="p-2 rounded hover:bg-white/3" title={collapsed ? 'Expand' : 'Collapse'}>
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavLink to="/chat" title="Chat" className={({ isActive }) => `flex items-center gap-3 ${collapsed ? 'justify-center px-2 py-2' : 'p-3'} rounded-md transition ${isActive ? 'bg-white/5 border-l-4 border-gradient-to-r border-blue-400' : 'hover:bg-white/3'}`}>
          <MessageCircle size={18} /> {!collapsed && <span className="font-medium">Chat</span>}
        </NavLink>

        {roles.includes('admin') && (
          <>
            <NavLink to="/documents" title="Documents" className={({ isActive }) => `flex items-center gap-3 ${collapsed ? 'justify-center px-2 py-2' : 'p-3'} rounded-md transition ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}>
              <FileText size={18} /> {!collapsed && <span className="font-medium">Documents</span>}
            </NavLink>
            <NavLink to="/users" title="Users" className={({ isActive }) => `flex items-center gap-3 ${collapsed ? 'justify-center px-2 py-2' : 'p-3'} rounded-md transition ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}>
              <Users size={18} /> {!collapsed && <span className="font-medium">Users</span>}
            </NavLink>
            <NavLink to="/analytics" title="Analytics" className={({ isActive }) => `flex items-center gap-3 ${collapsed ? 'justify-center px-2 py-2' : 'p-3'} rounded-md transition ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}>
              <BarChart3 size={18} /> {!collapsed && <span className="font-medium">Analytics</span>}
            </NavLink>
          </>
        )}

        <NavLink to="/settings" title="Settings" className={({ isActive }) => `flex items-center gap-3 ${collapsed ? 'justify-center px-2 py-2' : 'p-3'} rounded-md transition ${isActive ? 'bg-white/5' : 'hover:bg-white/3'}`}>
          <Settings size={18} /> {!collapsed && <span className="font-medium">Settings</span>}
        </NavLink>

        <div className="mt-3">
          <div className="border-t border-white/5 pt-3 px-2">
            <button onClick={saveConversation} title="New chat" className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition bg-white/5 hover:bg-white/8 ${collapsed ? 'py-2 px-2' : ''}`}>
              <Plus size={18} />
              {!collapsed && <span className="font-medium">New Chat</span>}
            </button>
            {!collapsed && <div className="text-xs text-gray-400 mt-3 mb-2">History</div>}
          </div>

          {!collapsed && (
            <div className="space-y-2 mt-2 px-1">
              {convos.length === 0 && (<div className="text-xs text-gray-500 px-2">No conversations yet</div>)}
              {convos.map((c) => (
                <button key={c.id} onClick={() => loadConversation(c)} className="w-full text-left px-2 py-2 rounded hover:bg-white/3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-700/40 flex items-center justify-center text-xs">C</div>
                  <div>
                    <div className="text-sm">{c.title}</div>
                    <div className="text-xxs text-gray-400">{new Date(c.updatedAt).toLocaleString()}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </nav>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700/40 flex items-center justify-center text-sm">{username ? username.charAt(0).toUpperCase() : 'G'}</div>
            {!collapsed && (
              <div>
                <div className="text-sm">{username || 'Guest'}</div>
                <div className="text-xs text-gray-400">{roles.includes('admin') ? 'Admin' : 'User'}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/settings" title="Settings" className="p-2 rounded hover:bg-white/3">
              <Settings size={16} />
            </NavLink>
            <button onClick={() => useAuthStore.getState().logout()} title="Logout" className="p-2 rounded hover:bg-white/3">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
