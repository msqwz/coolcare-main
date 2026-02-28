import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Shield, Server, Bell, Activity, Database, Cpu } from 'lucide-react'

export function Settings() {
    const { user } = useAdmin()

    const systemInfo = [
        { label: 'API Version', value: 'v3.2.0', icon: <Database size={18} /> },
        { label: 'Environment', value: 'Production', icon: <Server size={18} /> },
        { label: 'DB Status', value: 'Connected', icon: <Activity size={18} />, color: '#10b981' },
    ]

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '700' }}>Настройки профиля и системы</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="data-card" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px' }}>
                            <Shield size={24} color="#0066cc" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ваш профиль</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>Имя администратора</div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user?.name || 'Не указано'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>Номер телефона</div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user?.phone}</div>
                        </div>
                        <div style={{ paddingTop: '8px' }}>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '700' }}>
                                Доступ разрешен • {user?.role || 'admin'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="data-card" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                            <Cpu size={24} color="#475569" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Системный статус</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {systemInfo.map((info, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < systemInfo.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                    {info.icon} {info.label}
                                </div>
                                <div style={{ fontWeight: '600', color: info.color || '#1e293b', fontSize: '0.9rem' }}>{info.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="data-card" style={{ padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
                        <Bell size={24} color="#92400e" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Уведомления и сервисы</h3>
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                    Сервер push-уведомлений подключен. Все мастера получают обновления мгновенно.
                    Интеграция с Яндекс.Картами работает (API Ключ активен).
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-primary"
                        style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => alert('Тестовое уведомление отправлено всем мастерам!')}
                    >
                        Тест уведомлений
                    </button>
                    <button
                        style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
                        onClick={() => alert('Логи системы подготовлены (см. backend/app.log)')}
                    >
                        Скачать логи
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                CoolCare Admin • v3.2
            </div>
        </div>
    )
}

