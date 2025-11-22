import React from 'react'

interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose?: (id: string) => void
}

export function Toast({ id, message, type = 'info', onClose }: ToastProps) {
  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-700'
  return (
    <div className={`rounded-md p-3 text-sm ${bg} text-white`}>{message}
      {onClose && (
        <button className="ml-3" onClick={() => onClose(id)} aria-label="Close">✕</button>
      )}
    </div>
  )
}

export default Toast
