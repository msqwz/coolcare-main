import React, { useState, useCallback, useMemo, useContext, createContext, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onRemove, 300)
    }, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  const typeStyles = {
    success: { bg: '#10b981', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    warning: { bg: '#f59e0b', icon: '⚠' },
    info: { bg: '#3b82f6', icon: 'ℹ' },
  }

  const s = typeStyles[toast.type] || typeStyles.info

  return (
    <div
      className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 20px', borderRadius: '14px',
        background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: `1px solid ${s.bg}20`, maxWidth: '420px', width: '100%',
        animation: exiting ? 'toast-slide-out 0.3s ease forwards' : 'toast-slide-in 0.35s ease',
      }}
    >
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: `${s.bg}15`, color: s.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '900', fontSize: '14px', flexShrink: 0,
      }}>
        {s.icon}
      </div>
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.4' }}>
        {toast.message}
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(onRemove, 300) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', fontSize: '18px', padding: '4px',
          lineHeight: '1', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 5000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
