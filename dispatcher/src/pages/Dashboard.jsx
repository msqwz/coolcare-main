import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, CheckCircle, Clock, TrendingUp, Users, Calendar } from 'lucide-react'

export function Dashboard() {
    const { stats, jobs } = useAdmin()

    const cards = [
        { title: 'Заявок всего', value: stats?.total_jobs || 0, icon: <Briefcase color="#0066cc" /> },
        { title: 'В работе', value: stats?.active_jobs || 0, icon: <Clock color="#f59e0b" /> },
        { title: 'Мастера (online)', value: stats?.active_users || 0, icon: <Users color="#10b981" /> },
        { title: 'Выручка (месяц)', value: `${stats?.monthly_revenue?.toLocaleString() || 0} ₽`, icon: <Calendar color="#ef4444" /> },
        { title: 'Выручка общая', value: `${stats?.total_revenue?.toLocaleString() || 0} ₽`, icon: <TrendingUp color="#8b5cf6" /> },
    ]

    const typeLabels = {
        'repair': 'Ремонт',
        'install': 'Установка',
        'service': 'Обслуживание',
        'diagnostic': 'Диагностика',
        'other': 'Прочее'
    }

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Аналитика системы</h2>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {cards.map(card => (
                    <div key={card.title} className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.8rem' }}>{card.title}</span>
                            {card.icon}
                        </div>
                        <strong style={{ fontSize: '1.5rem' }}>{card.value}</strong>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '32px' }}>
                <div className="data-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Последние заявки</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Клиент / Описание</th>
                                <th>Статус</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(jobs || []).slice(0, 5).map(job => (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{job.customer_name || 'Без имени'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.title || 'Без темы'}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${job.status}`}>
                                            {job.status === 'scheduled' ? 'Ожидает' :
                                                job.status === 'active' ? 'В работе' :
                                                    job.status === 'completed' ? 'Завершено' : 'Отменено'}
                                        </span>
                                    </td>
                                    <td>{job.price ? `${job.price} ₽` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="data-card" style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Типы работ</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(stats?.type_distribution || {}).map(([type, count]) => {
                            const percent = Math.round((count / (stats?.total_jobs || 1)) * 100)
                            return (
                                <div key={type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                        <span>{typeLabels[type] || type}</span>
                                        <span style={{ fontWeight: '600' }}>{count} ({percent}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: type === 'repair' ? '#3b82f6' : type === 'install' ? '#10b981' : '#f59e0b',
                                            borderRadius: '4px'
                                        }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
