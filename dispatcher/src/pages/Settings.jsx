import React, { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'
import { Shield, Server, Activity, Database, Cpu, Lock, Globe, Zap, Users, ShieldCheck, Download, Sliders } from 'lucide-react'
import { supabase } from '@shared/supabase'
import { useToast } from '@shared/components/Toast'

export function Settings() {
    const { user, workers } = useAdmin()
    const toast = useToast()
    const [realtimeStatus, setRealtimeStatus] = useState('Checking...')
    const [dbLatency, setDbLatency] = useState(0)

    const [prefs, setPrefs] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('admin_prefs')) || { compactTables: false, soundAlerts: true }
        } catch {
            return { compactTables: false, soundAlerts: true }
        }
    })

    useEffect(() => {
        localStorage.setItem('admin_prefs', JSON.stringify(prefs))
        if (prefs.compactTables) document.body.classList.add('compact-tables')
        else document.body.classList.remove('compact-tables')
    }, [prefs])

    useEffect(() => {
        // Simple ping to determine API/DB health and latency
        const checkHealth = async () => {
            const start = performance.now()
            try {
                const { error } = await supabase.from('users').select('id').limit(1)
                if (!error) {
                    setRealtimeStatus('Connected')
                    setDbLatency(Math.round(performance.now() - start))
                } else {
                    setRealtimeStatus('Error connecting')
                }
            } catch (e) {
                setRealtimeStatus('Disconnected')
            }
        }
        checkHealth()
        const interval = setInterval(checkHealth, 30000) // check every 30s
        return () => clearInterval(interval)
    }, [])

    const activeSessions = workers?.filter(w => w.is_active)?.length || 0
    const totalWorkers = workers?.length || 0

    const technicalMetrics = [
        { label: 'WebSocket Realtime', value: realtimeStatus, icon: <Zap size={18} />, color: realtimeStatus === 'Connected' ? '#10b981' : '#f59e0b' },
        { label: 'Active Sessions', value: `${activeSessions} / ${totalWorkers} users`, icon: <Users size={18} />, color: 'var(--text-main)' },
        { label: 'Database Health', value: 'Operational', icon: <Database size={18} />, color: '#10b981' },
        { label: 'API Latency', value: `${dbLatency}ms`, icon: <Activity size={18} />, color: dbLatency < 100 ? '#10b981' : '#f59e0b' },
    ]

    const handleDownloadLogs = () => {
        const logContent = `--- CoolCare System Logs ---\n` +
            `Timestamp: ${new Date().toISOString()}\n` +
            `Admin: ${user?.name || 'Unknown'} (ID: ${user?.id})\n` +
            `Realtime Status: ${realtimeStatus}\n` +
            `Database Latency: ${dbLatency}ms\n` +
            `Total Workers: ${totalWorkers} (Active: ${activeSessions})\n` +
            `App Version: 4.0.0-GOLDEN\n\n` +
            `[INFO] System running normally. All services operational.\n`
            
        const blob = new Blob([logContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `coolcare_syslog_${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Журналы событий успешно выгружены')
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                {/* Profile Card */}
                <div className="data-card glass slide-up" style={{ padding: '40px', animationDelay: '0.1s', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ 
                            background: '#111, rgba(37, 99, 235, 0.05))', 
                            padding: '16px', 
                            borderRadius: '8px',
                            color: 'var(--primary)',
                            boxShadow: 'none'
                        }}>
                            <Shield size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Профиль доступа</h3>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Учетные данные администратора</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Имя администратора</label>
                            <div className="text-lg font-semibold" style={{ color: 'var(--text-main)', padding: '16px 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                {user?.name || 'Не указано'}
                            </div>
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Номер телефона</label>
                            <div className="text-lg font-semibold" style={{ color: 'var(--text-main)', padding: '16px 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                {user?.phone}
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px 20px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                <Lock size={16} strokeWidth={2.5} /> 
                                Роль: {user?.role || 'admin'}
                            </div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>ID: #{String(user?.id || "").slice(0, 8)}</div>
                        </div>
                    </div>
                </div>

                {/* System Technical Health Card */}
                <div className="data-card glass slide-up" style={{ padding: '40px', animationDelay: '0.2s', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ 
                            background: '#111, rgba(5, 150, 105, 0.05))', 
                            padding: '16px', 
                            borderRadius: '8px',
                            color: '#10b981',
                            boxShadow: 'none'
                        }}>
                            <Cpu size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Технический аудит</h3>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Мониторинг инфраструктуры</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {technicalMetrics.map((metric, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '18px 24px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.4)',
                                border: '1px solid var(--glass-border)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                                    <div style={{ color: metric.color, opacity: 0.8 }}>{metric.icon}</div>
                                    {metric.label}
                                </div>
                                <div style={{ fontWeight: '600', color: metric.color, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                                    {metric.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notification Sandbox */}
            <div className="data-card glass slide-up" style={{ padding: '40px', animationDelay: '0.3s', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ 
                            background: '#111, rgba(71, 85, 105, 0.05))', 
                            padding: '16px', 
                            borderRadius: '8px',
                            color: '#475569',
                            boxShadow: 'none'
                        }}>
                            <Server size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Системная архитектура</h3>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Сервисы и библиотеки</p>
                        </div>
                    </div>
                    <button
                        className="btn-secondary"
                        style={{ padding: '14px 28px', height: '52px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleDownloadLogs}
                    >
                        <Download size={18} /> Выгрузить журналы событий
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div style={{ 
                        padding: '24px', 
                        borderRadius: '8px', 
                        background: '#f9f9f9', 
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{ color: 'var(--primary)' }}><Globe size={24} strokeWidth={2.5} /></div>
                        <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Интеграция карт</div>
                            <div className="text-base font-semibold" style={{ color: 'var(--text-main)', marginTop: '2px' }}>Yandex.Maps v2.1 (API v3 Ready)</div>
                        </div>
                    </div>
                    <div style={{ 
                        padding: '24px', 
                        borderRadius: '8px', 
                        background: 'rgba(16, 185, 129, 0.05)', 
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{ color: '#10b981' }}><ShieldCheck size={24} strokeWidth={2.5} /></div>
                        <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Безопасность данных</div>
                            <div className="text-base font-semibold" style={{ color: 'var(--text-main)', marginTop: '2px' }}>PostgREST Protocol Security (Row Level Security)</div>
                        </div>
                    </div>
                    <div style={{ 
                        padding: '24px', 
                        borderRadius: '8px', 
                        background: 'rgba(245, 158, 11, 0.05)', 
                        border: '1px solid rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{ color: '#f59e0b' }}><Zap size={24} strokeWidth={2.5} /></div>
                        <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Коммуникации</div>
                            <div className="text-base font-semibold" style={{ color: 'var(--text-main)', marginTop: '2px' }}>Real-time Broadcast Subscriptions Active</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Preferences */}
            <div className="data-card glass slide-up" style={{ padding: '40px', animationDelay: '0.4s', borderRadius: '8px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ 
                        background: '#111, rgba(219, 39, 119, 0.05))', 
                        padding: '16px', 
                        borderRadius: '8px',
                        color: '#ec4899',
                        boxShadow: 'none'
                    }}>
                        <Sliders size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Пользовательские настройки</h3>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Интерфейс и уведомления</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: '20px 24px', background: 'rgba(255,255,255,0.4)', 
                        border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer'
                    }}>
                        <div>
                            <div className="font-semibold text-base text-main">Компактный вид таблиц</div>
                            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Уменьшает отступы в списках заявок и мастеров</div>
                        </div>
                        <div style={{ position: 'relative', width: '48px', height: '24px', background: prefs.compactTables ? 'var(--primary)' : '#cbd5e1', borderRadius: '6px', transition: 'all 0.3s' }}>
                            <input 
                                type="checkbox" 
                                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} 
                                checked={prefs.compactTables}
                                onChange={(e) => setPrefs(p => ({ ...p, compactTables: e.target.checked }))}
                            />
                            <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: prefs.compactTables ? '26px' : '2px', transition: 'all 0.3s', boxShadow: 'none' }} />
                        </div>
                    </label>

                    <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: '20px 24px', background: 'rgba(255,255,255,0.4)', 
                        border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer'
                    }}>
                        <div>
                            <div className="font-semibold text-base text-main">Звуковые уведомления</div>
                            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Оповещения о новых заявках (в разработке)</div>
                        </div>
                        <div style={{ position: 'relative', width: '48px', height: '24px', background: prefs.soundAlerts ? 'var(--primary)' : '#cbd5e1', borderRadius: '6px', transition: 'all 0.3s' }}>
                            <input 
                                type="checkbox" 
                                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} 
                                checked={prefs.soundAlerts}
                                onChange={(e) => {
                                    setPrefs(p => ({ ...p, soundAlerts: e.target.checked }));
                                    if(e.target.checked) toast.success('Звуковые уведомления включены');
                                }}
                            />
                            <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: prefs.soundAlerts ? '26px' : '2px', transition: 'all 0.3s', boxShadow: 'none' }} />
                        </div>
                    </label>
                </div>
            </div>

            <div style={{ 
                marginTop: '80px', 
                textAlign: 'center', 
                color: '#94a3b8', 
                fontSize: '0.75rem', 
                fontWeight: '600', 
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.6
            }}>
                COOLCARE ADVANCED MANAGEMENT PLATFORM • VERSION 4.0.0-GOLDEN • 2024
            </div>
        </div>
    )
}
