import React, { useState } from 'react'
import { api } from '../api'

export function Login() {
    const [phone, setPhone] = useState('')
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
        <div className="login-container">
            <div className="login-box">
                <h1>CoolCare Admin</h1>
                {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}

                {step === 1 ? (
                    <>
                        <div className="input-group">
                            <label>Номер телефона</label>
                            <input
                                type="tel"
                                placeholder="+7 (___) ___-__-__"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>
                        <button className="btn-primary" onClick={handleSendCode} disabled={loading}>
                            {loading ? 'Отправка...' : 'Получить код'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="input-group">
                            <label>Код из СМС</label>
                            <input
                                type="text"
                                placeholder="000000"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                            />
                        </div>
                        <button className="btn-primary" onClick={handleVerify} disabled={loading}>
                            {loading ? 'Войти' : 'Подтвердить'}
                        </button>
                        <button
                            style={{ background: 'none', border: 'none', color: '#64748b', marginTop: '16px', cursor: 'pointer' }}
                            onClick={() => setStep(1)}
                        >
                            Вернуться назад
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
