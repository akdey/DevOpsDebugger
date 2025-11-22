import React from 'react'
import { Sun, Moon } from 'lucide-react'

export default function TopBar() {
  // TopBar intentionally minimal: title on left and theme toggle on right

  const appTitle = (import.meta as any).env?.VITE_APP_TITLE || 'PipeLight'
  const [theme, setTheme] = React.useState<string | null>(null)

  React.useEffect(() => {
    const t = localStorage.getItem('pl_theme') || 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('pl_theme', next)
  }

  return (
    <header className="flex items-center justify-between p-3 border-b border-white/5 glassmorphism">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold"><span className="brand-gradient">{appTitle}</span></h3>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded hover:bg-white/3" aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
