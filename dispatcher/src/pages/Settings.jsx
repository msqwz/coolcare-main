import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Shield, Server, Bell, Activity, Database, Cpu } from 'lucide-react'

export function Settings() {
    const { user, stats } = useAdmin()

    const systemInfo = [
        { label: 'Версия API', value: 'v3.2.0', icon: <Database size={16} /> },
        { label: 'Окружение', value: 'Production', icon: <Server size={16} /> },
        { label: 'Статус БД', value: 'Connected', icon: <Activity size={16} />, color: '#10b981' },
    ]

    return (
        <div style={{ maxWidth: '900px' }}>
            <h2 style={{ marginBottom: '24px' }}>Настройки и системная информация</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="data-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '10px' }}>
                            <Shield size={24} color="#0369a1" />
                        </div>
                        <h3 style={{ margin: 0 }}>Администратор</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Имя</div>
                            <div style={{ fontWeight: '600' }}>{user?.name || 'Не указано'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Телефон</div>
                            <div style={{ fontWeight: '600' }}>{user?.phone}</div>
                        </div>
                        <div>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                Доступ разрешен
                            </span>
                        </div>
                    </div>
                </div>

                <div className="data-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '10px' }}>
                            <Cpu size={24} color="#92400e" />
                        </div>
                        <h3 style={{ margin: 0 }}>Система</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {systemInfo.map((info, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: idx < systemInfo.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                    {info.icon} {info.label}
                                </div>
                                <div style={{ fontWeight: '600', color: info.color || '#1e293b', fontSize: '0.9rem' }}>{info.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="data-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}>
                        <Bell size={24} color="#64748b" />
                    </div>
                    <h3 style={{ margin: 0 }}>Уведомления</h3>
                </div>
                <div style={{ color: '#475569', fontSize: '0.925rem', lineHeight: '1.6' }}>
                    Система Push-уведомлений активна. Все мастера получают мгновенные обновления о новых заявках.
                    Интеграция с Yandex Maps работает в штатном режиме.
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>Проверить связь</button>
                    <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>Логи системы</button>
                </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                CoolCare Admin Panel &copy; 2024. All rights reserved.
            </div>
        </div>
    )
}
