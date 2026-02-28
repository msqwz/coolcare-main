import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, Clock, TrendingUp, Users, Calendar, Activity } from 'lucide-react'

export function Dashboard() {
    const { stats, jobs } = useAdmin()

    const cards = [
        { title: 'Всего заявок', value: stats?.total_jobs || 0, icon: <Briefcase color="#3b82f6" /> },
        { title: 'В работе', value: stats?.active_jobs || 0, icon: <Activity color="#f59e0b" /> },
        { title: 'Мастера (online)', value: stats?.active_users || 0, icon: <Users color="#10b981" /> },
        { title: 'Выручка (месяц)', value: `${stats?.monthly_revenue?.toLocaleString() || 0} ₽`, icon: <Calendar color="#ef4444" /> },
    ]

    const typeLabels = {
        'repair': 'Ремонт',
        'install': 'Установка',
        'service': 'Обслуживание',
        'diagnostic': 'Диагностика',
        'other': 'Прочее'
    }

    // Простой SVG график для выручки (имитация динамики)
    const chartPoints = "10,90 40,70 70,85 100,50 130,60 160,30 190,40"

    return (
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Аналитика системы</h2>

            <div className="stats-grid">
                {cards.map(card => (
                    <div key={card.title} className="stat-card glass">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.title}</span>
                            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.5)' }}>
                                {card.icon}
                            </div>
                        </div>
                        <strong style={{ fontSize: '1.8rem', marginTop: '12px' }}>{card.value}</strong>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="data-card glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Динамика выручки</h3>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>+12% к прошлой неделе</span>
                    </div>
                    <svg viewBox="0 0 200 100" style={{ width: '100%', height: '120px' }}>
                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
                                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                        <path d={`M ${chartPoints} L 190,100 L 10,100 Z`} fill="url(#grad)" />
                        <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            points={chartPoints}
                        />
                    </svg>
                </div>

                <div className="data-card glass" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem' }}>Типы работ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(stats?.type_distribution || {}).map(([type, count]) => {
                            const percent = Math.round((count / (stats?.total_jobs || 1)) * 100)
                            return (
                                <div key={type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: '500' }}>{typeLabels[type] || type}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{count} ({percent}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, ${type === 'repair' ? '#3b82f6' : type === 'install' ? '#10b981' : '#f59e0b'}, #fff)`,
                                            borderRadius: '10px'
                                        }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="data-card glass" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Свежие задачи</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Клиент</th>
                            <th>Тема</th>
                            <th>Статус</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(jobs || []).slice(0, 5).map(job => (
                            <tr key={job.id}>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{job.customer_name || 'Без имени'}</div>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{job.title}</td>
                                <td>
                                    <span className={`status-badge ${job.status}`}>
                                        {job.status === 'scheduled' ? 'Ожидает' :
                                            job.status === 'active' ? 'В работе' :
                                                job.status === 'completed' ? 'Завершено' : 'Отменено'}
                                    </span>
                                </td>
                                <td style={{ fontWeight: '700' }}>{job.price ? `${job.price} ₽` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
