import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export function Dashboard() {
    const { stats, jobs } = useAdmin()

    const cards = [
        { title: 'Заявок всего', value: stats?.total_jobs || 0, icon: <Briefcase color="#0066cc" /> },
        { title: 'В работе', value: stats?.active_jobs || 0, icon: <Clock color="#f59e0b" /> },
        { title: 'Завершено', value: stats?.completed_jobs || 0, icon: <CheckCircle color="#10b981" /> },
        { title: 'Выручка общая', value: `${stats?.total_revenue?.toLocaleString() || 0} ₽`, icon: <TrendingUp color="#8b5cf6" /> },
    ]

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Обзор системы</h2>

            <div className="stats-grid">
                {cards.map(card => (
                    <div key={card.title} className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span>{card.title}</span>
                            {card.icon}
                        </div>
                        <strong>{card.value}</strong>
                    </div>
                ))}
            </div>

            <h3 style={{ marginBottom: '16px' }}>Последние заявки</h3>
            <div className="data-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Клиент / Описание</th>
                            <th>Адрес</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(jobs || []).slice(0, 10).map(job => (
                            <tr key={job.id}>
                                <td>#{job.id}</td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{job.customer_name || 'Без имени'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.title || 'Без темы'}</div>
                                </td>
                                <td>{job.address}</td>
                                <td>{job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : '-'}</td>
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
        </div>
    )
}
