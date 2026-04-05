import React, { useState, useCallback, useContext, createContext } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback(({ title, message, confirmText, cancelText, danger }) => {
    return new Promise((resolve) => {
      setState({ title, message, confirmText, cancelText, danger, resolve })
    })
  }, [])

  const handleClose = (result) => {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="confirm-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'confirm-fade-in 0.2s ease',
          }}
          onClick={() => handleClose(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: '20px',
              padding: '32px', maxWidth: '400px', width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
              animation: 'confirm-scale-in 0.25s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {state.danger && (
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', marginBottom: '16px',
              }}>
                ⚠
              </div>
            )}
            <h3 style={{
              margin: '0 0 8px', fontSize: '1.15rem', fontWeight: '800',
              color: '#0f172a', letterSpacing: '-0.01em',
            }}>
              {state.title || 'Подтверждение'}
            </h3>
            <p style={{
              margin: '0 0 24px', fontSize: '0.9rem', fontWeight: '500',
              color: '#64748b', lineHeight: '1.5',
            }}>
              {state.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleClose(false)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: '12px',
                  border: '1px solid #e2e8f0', background: 'white',
                  color: '#475569', fontWeight: '700', fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                {state.cancelText || 'Отмена'}
              </button>
              <button
                onClick={() => handleClose(true)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: '12px',
                  border: 'none',
                  background: state.danger
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: '700', fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'transform 0.2s',
                }}
              >
                {state.confirmText || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes confirm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirm-scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
