import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Settings as SettingsIcon, Shield, Server, Bell } from 'lucide-react'

export function Settings() {
    const { user } = useAdmin()

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '24px' }}>Настройки системы</h2>

            <div className="data-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f1f5f9', p: '10px', borderRadius: '8px' }}>
                        <Shield size={24} color="#0066cc" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Ваш профиль</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Данные администратора</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', fontSize: '0.925rem' }}>
                    <div style={{ color: '#64748b' }}>Имя:</div>
                    <div style={{ fontWeight: '600' }}>{user?.name || 'Не указано'}</div>

                    <div style={{ color: '#64748b' }}>Телефон:</div>
                    <div style={{ fontWeight: '600' }}>{user?.phone}</div>

                    <div style={{ color: '#64748b' }}>Роль:</div>
                    <div>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            Администратор
                        </span>
                    </div>
                </div>
            </div>

            <div className="data-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f1f5f9', p: '10px', borderRadius: '8px' }}>
                        <Server size={24} color="#10b981" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Статус сервера</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Техническая информация</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', fontSize: '0.925rem' }}>
                    <div style={{ color: '#64748b' }}>API URL:</div>
                    <div style={{ color: '#475569', fontFamily: 'monospace' }}>{window.location.origin}</div>

                    <div style={{ color: '#64748b' }}>Сборка:</div>
                    <div style={{ color: '#475569' }}>v3.0.0 (Admin Dispatcher)</div>

                    <div style={{ color: '#64748b' }}>Push Notifications:</div>
                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bell size={14} /> Активны
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ID вашей сессии: {localStorage.getItem('access_token')?.slice(-10)}
                </p>
            </div>
        </div>
    )
}
