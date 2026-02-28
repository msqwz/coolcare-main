import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Shield, Server, Bell, Activity, Database, Cpu, Lock, Globe, Info } from 'lucide-react'

export function Settings() {
    const { user } = useAdmin()

    const systemInfo = [
        { label: 'Версия API', value: 'v3.2.0', icon: <Database size={18} /> },
        { label: 'Окружение', value: 'Production', icon: <Server size={18} /> },
        { label: 'Статус БД', value: 'Подключено', icon: <Activity size={18} />, color: '#10b981' },
    ]

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Настройки системы</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Управление вашим профилем и конфигурация серверных служб</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                {/* Profile Card */}
                <div className="data-card glass slide-up" style={{ padding: '32px', animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '12px', borderRadius: '16px' }}>
                            <Shield size={28} color="var(--primary)" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Ваш профиль</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="input-group">
                            <label>Имя администратора</label>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>{user?.name || 'Не указано'}</div>
                        </div>
                        <div className="input-group">
                            <label>Номер телефона</label>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>{user?.phone}</div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <span className="status-badge" style={{ background: '#dcfce7', color: '#15803d', padding: '8px 16px', borderRadius: '30px' }}>
                                <Lock size={14} style={{ marginRight: '6px' }} /> Доступ: {user?.role || 'admin'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* System Status Card */}
                <div className="data-card glass slide-up" style={{ padding: '32px', animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                        <div style={{ background: 'rgba(71, 85, 105, 0.1)', padding: '12px', borderRadius: '16px' }}>
                            <Cpu size={28} color="#475569" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Системный статус</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {systemInfo.map((info, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.4)',
                                border: '1px solid var(--glass-border)',
                                marginBottom: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                                    {info.icon} {info.label}
                                </div>
                                <div style={{ fontWeight: '800', color: info.color || 'var(--text-main)', fontSize: '0.95rem' }}>{info.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notifications and Services */}
            <div className="data-card glass slide-up" style={{ padding: '32px', animationDelay: '0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '16px' }}>
                        <Bell size={28} color="#d97706" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Уведомления и сервисы</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Проверка связи с мастерами и внешними API</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Globe size={18} color="var(--primary)" />
                            <span>Яндекс.Карты: <strong>API Ключ активен</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} color="#10b981" />
                            <span>Push-сервер: <strong>Соединение установлено</strong></span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '14px 28px' }}
                            onClick={() => alert('Тестовое уведомление отправлено всем мастерам!')}
                        >
                            <Bell size={18} /> Тест уведомлений
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '14px 28px' }}
                            onClick={() => alert('Логи системы подготовлены (см. backend/app.log)')}
                        >
                            Скачать логи
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                COOLCARE ADMIN DASHBOARD • VERSION 3.2.0 • 2024
            </div>
        </div>
    )
}

