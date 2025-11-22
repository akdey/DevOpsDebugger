import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md font-medium disabled:opacity-60 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:shadow-md'
      : variant === 'outline'
      ? 'border border-white/10 text-white bg-transparent hover:bg-white/3'
      : 'bg-transparent text-white hover:bg-white/5'

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  )
}

export default Button
