import React, { useState } from 'react'
import { api } from '../api'

export function Login() {
    const [phone, setPhone] = useState('+7')
    const [code, setCode] = useState('')
    const [step, setStep] = useState(1)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendCode = async () => {
        setLoading(true)
        setError('')
        try {
            await api.sendCode(phone)
            setStep(2)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await api.verifyCode(phone, code)
            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('refresh_token', data.refresh_token)

            // Проверка роли
            const user = await api.getCurrentUser()
            if (user.role !== 'admin') {
                throw new Error('Доступ запрещен. Требуется роль администратора.')
            }

            window.location.href = '/admin/'
        } catch (e) {
            setError(e.message)
            localStorage.clear()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div className="animate-fade-in" style={{
                width: '100%',
                maxWidth: '320px',
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
                        CoolCare
                    </h1>
                    <p style={{ color: '#666', marginTop: '4px', fontSize: '0.875rem' }}>
                        Панель управления
                    </p>
                </div>

                {error && (
                    <div style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: '1.4'
                    }}>
                        <span style={{ marginTop: '2px' }}>•</span> {error}
                    </div>
                )}

                {step === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '8px' }}>
                                Номер телефона
                            </label>
                            <input
                                type="tel"
                                placeholder="+7 (___) ___-__-__"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e5e5',
                                    padding: '0 12px',
                                    outline: 'none',
                                    color: '#111',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#111'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                            />
                        </div>
                        <button
                            onClick={handleSendCode}
                            disabled={loading}
                            style={{ 
                                height: '40px', 
                                borderRadius: '4px', 
                                fontSize: '0.875rem', 
                                fontWeight: '500', 
                                backgroundColor: '#111',
                                color: '#fff',
                                border: 'none',
                                cursor: loading ? 'default' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                marginTop: '8px',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => { if(!loading) e.target.style.opacity = '0.85' }}
                            onMouseLeave={(e) => { if(!loading) e.target.style.opacity = '1' }}
                        >
                            {loading ? 'Секунду...' : 'Продолжить'}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '8px' }}>
                                Код из СМС
                            </label>
                            <input
                                type="text"
                                placeholder="······"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    letterSpacing: '0.1em',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e5e5',
                                    padding: '0 12px',
                                    outline: 'none',
                                    color: '#111',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                    textAlign: 'center'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#111'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            style={{ 
                                height: '40px', 
                                borderRadius: '4px', 
                                fontSize: '0.875rem', 
                                fontWeight: '500', 
                                backgroundColor: '#111',
                                color: '#fff',
                                border: 'none',
                                cursor: loading ? 'default' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                marginTop: '8px',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => { if(!loading) e.target.style.opacity = '0.85' }}
                            onMouseLeave={(e) => { if(!loading) e.target.style.opacity = '1' }}
                        >
                            {loading ? 'Проверка...' : 'Войти'}
                        </button>
                        <button
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#666', 
                                marginTop: '8px', 
                                cursor: 'pointer', 
                                fontSize: '0.75rem', 
                                textDecoration: 'underline',
                                textUnderlineOffset: '4px'
                            }}
                            onClick={() => setStep(1)}
                        >
                            Назад к вводу телефона
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
