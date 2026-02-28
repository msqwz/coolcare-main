import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, Clock, TrendingUp, Users, Calendar, Activity } from 'lucide-react'

export function Dashboard() {
    const { stats, jobs } = useAdmin()
    const [period, setPeriod] = useState('week')

    const cards = [
        { title: 'Всего заявок', value: stats?.total_jobs || 0, icon: <Briefcase color="#3b82f6" />, trend: '+5%' },
        { title: 'В работе', value: stats?.active_jobs || 0, icon: <Activity color="#f59e0b" />, trend: 'Live' },
        { title: 'Мастера (online)', value: stats?.active_users || 0, icon: <Users color="#10b981" />, trend: '12 активных' },
        { title: 'Выручка (месяц)', value: `${stats?.monthly_revenue?.toLocaleString() || 0} ₽`, icon: <Calendar color="#ef4444" />, trend: '+12.5%' },
    ]

    const typeLabels = {
        'repair': 'Ремонт',
        'install': 'Установка',
        'service': 'Обслуживание',
        'diagnostic': 'Диагностика',
        'other': 'Прочее'
    }

    // Имитация динамических данных для графика в зависимости от периода
    const chartPaths = {
        'day': "M10,80 Q40,40 70,60 T130,30 T190,50",
        'week': "M10,90 C40,70 70,85 100,50 130,60 160,30 190,40",
        'month': "M10,95 C30,90 60,40 90,60 C120,80 150,20 190,10"
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '800', letterSpacing: '-0.02em', fontSize: '1.8rem' }}>Аналитика системы</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Обзор производительности и финансовых показателей</p>
                </div>
                <div className="glass" style={{ padding: '6px', borderRadius: '14px', display: 'flex', gap: '4px' }}>
                    {['day', 'week', 'month'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: period === p ? 'var(--primary)' : 'transparent',
                                color: period === p ? 'white' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats-grid">
                {cards.map(card => (
                    <div key={card.title} className="stat-card glass slide-up" style={{ animationDelay: '0.1s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ padding: '10px', borderRadius: '14px', background: 'rgba(255,255,255,0.6)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                {card.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: card.trend.includes('+') ? '#10b981' : '#64748b', background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '20px' }}>
                                {card.trend}
                            </span>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>{card.title}</div>
                            <strong style={{ fontSize: '1.8rem', letterSpacing: '-0.03em' }}>{card.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="data-card glass slide-up" style={{ padding: '28px', animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Динамика доходов</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Анализ по периоду: {period === 'day' ? 'Сегодня' : period === 'week' ? '7 дней' : '30 дней'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>+12%</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>к прошлому периоду</div>
                        </div>
                    </div>

                    <div style={{ position: 'relative', height: '180px' }}>
                        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.3 }} />
                                    <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            <path
                                d={`${chartPaths[period]} L 190,100 L 10,100 Z`}
                                fill="url(#grad)"
                                style={{ transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            />
                            <path
                                d={chartPaths[period]}
                                fill="none"
                                stroke="var(--primary)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'url(#glow)' }}
                            />
                            {/* Интерактивные точки */}
                            {[10, 40, 70, 100, 130, 160, 190].map((x, i) => (
                                <circle key={i} cx={x} cy="50" r="3" fill="var(--white)" stroke="var(--primary)" strokeWidth="2" style={{ cursor: 'pointer' }} />
                            ))}
                        </svg>
                    </div>
                </div>

                <div className="data-card glass slide-up" style={{ padding: '28px', animationDelay: '0.3s' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '28px', fontSize: '1.2rem', fontWeight: '700' }}>Категории работ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {Object.entries(stats?.type_distribution || {}).map(([type, count]) => {
                            const percent = Math.round((count / (stats?.total_jobs || 1)) * 100)
                            const colors = {
                                'repair': '#3b82f6',
                                'install': '#10b981',
                                'service': '#f59e0b',
                                'diagnostic': '#8b5cf6',
                                'other': '#64748b'
                            }
                            const color = colors[type] || colors.other
                            return (
                                <div key={type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{typeLabels[type] || type}</span>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{count} ({percent}%)</span>
                                    </div>
                                    <div style={{ height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                            borderRadius: '20px',
                                            transition: 'width 1s ease-out'
                                        }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="data-card glass slide-up" style={{ padding: '28px', animationDelay: '0.4s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Последние задачи</h3>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Все заявки</button>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Клиент / Тема</th>
                            <th>Статус</th>
                            <th>Мастер</th>
                            <th style={{ textAlign: 'right' }}>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(jobs || []).slice(0, 5).map(job => (
                            <tr key={job.id}>
                                <td>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{job.customer_name || 'Без имени'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{job.title}</div>
                                </td>
                                <td>
                                    <span className={`status-badge ${job.status}`}>
                                        {job.status === 'scheduled' ? 'Ожидает' :
                                            job.status === 'active' ? 'В работе' :
                                                job.status === 'completed' ? 'Готово' : 'Отмена'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {workers.find(w => w.id === job.user_id)?.name || '...'}
                                </td>
                                <td style={{ fontWeight: '800', textAlign: 'right', fontSize: '1rem' }}>
                                    {job.price ? `${job.price.toLocaleString()} ₽` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
