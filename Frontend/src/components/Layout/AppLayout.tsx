import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className="h-screen flex bg-[radial-gradient(1200px_600px_at_10%_20%,_rgba(59,130,246,0.03),_transparent),radial-gradient(1000px_500px_at_90%_80%,_rgba(6,182,212,0.02),_transparent),linear-gradient(180deg,var(--bg-1),var(--bg-2))]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 app-container overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
