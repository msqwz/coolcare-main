import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, Clock, TrendingUp, Users, Calendar, Activity } from 'lucide-react'

export function Dashboard() {
    const { stats, jobs, workers } = useAdmin()
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

    const [selectedDate, setSelectedDate] = useState(null)

    // Статистика по мастерам
    const masterStats = (workers || []).map(w => {
        const workerJobs = (jobs || []).filter(j => j.user_id === w.id)
        const completedJobs = workerJobs.filter(j => j.status === 'completed')
        const revenue = completedJobs.reduce((sum, j) => sum + (j.price || 0), 0)
        return { ...w, jobCount: workerJobs.length, revenue }
    }).sort((a, b) => b.revenue - a.revenue)

    // Календарь (упрощенная логика на текущий месяц)
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const getMastersForDay = (day) => {
        const dateStr = new Date(today.getFullYear(), today.getMonth(), day).toDateString()
        return (workers || []).filter(w =>
            (jobs || []).some(j =>
                j.user_id === w.id &&
                new Date(j.scheduled_at).toDateString() === dateStr
            )
        )
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '800', letterSpacing: '-0.02em', fontSize: '1.8rem' }}>Аналитика системы</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Обзор производительности и графики работ</p>
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
                            <strong style={{ fontSize: '1.8rem', letterSpacing: '-0.03em', fontWeight: '800' }}>{card.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            {/* ОСНОВНОЙ КОНТЕНТ ДАШБОРДА */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', gap: '24px', marginBottom: '32px' }}>

                {/* КАЛЕНДАРЬ ЯВКИ */}
                <div className="data-card glass slide-up" style={{ padding: '24px', animationDelay: '0.2s' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700' }}>Календарь занятости</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', paddingBottom: '8px' }}>{d}</div>
                        ))}
                        {days.map(day => {
                            const masters = getMastersForDay(day)
                            const count = masters.length
                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDate({ day, masters })}
                                    style={{
                                        aspectRatio: '1/1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: count > 0 ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255,255,255,0.4)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        border: '1px solid var(--glass-border)',
                                        position: 'relative',
                                        transition: 'all 0.2s'
                                    }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: count > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{day}</span>
                                    {count > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: '4px', width: '6px', height: '6px',
                                            borderRadius: '50%', background: 'var(--primary)',
                                            boxShadow: '0 0 5px var(--primary)'
                                        }}></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* СТАТИСТИКА ПО МАСТЕРАМ */}
                <div className="data-card glass slide-up" style={{ padding: '24px', animationDelay: '0.3s' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700' }}>Эффективность мастеров</h3>
                    <div className="admin-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                                <tr>
                                    <th>Имя</th>
                                    <th style={{ textAlign: 'center' }}>Заявки</th>
                                    <th style={{ textAlign: 'right' }}>Выручка</th>
                                </tr>
                            </thead>
                            <tbody>
                                {masterStats.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: '600' }}>{m.name || m.phone}</td>
                                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{m.jobCount}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>{m.revenue.toLocaleString()} ₽</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
                {/* КАТЕГОРИИ РАБОТ */}
                <div className="data-card glass slide-up" style={{ padding: '24px', animationDelay: '0.4s' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.1rem', fontWeight: '700' }}>Распределение по типам</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{typeLabels[type] || type}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{count}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>({percent}%)</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: color,
                                            borderRadius: '20px',
                                            transition: 'width 1s ease-out'
                                        }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ПОСЛЕДНИЕ ЗАДАЧИ */}
                <div className="data-card glass slide-up" style={{ padding: '24px', animationDelay: '0.5s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Последние задачи</h3>
                        <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>Все заявки</button>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Клиент</th>
                                <th>Статус</th>
                                <th>Мастер</th>
                                <th style={{ textAlign: 'right' }}>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(jobs || []).slice(0, 5).map(job => (
                                <tr key={job.id}>
                                    <td>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{job.customer_name || 'Без имени'}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{job.title}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${job.status}`} style={{ fontSize: '0.7rem' }}>
                                            {job.status === 'scheduled' ? 'Ожидает' :
                                                job.status === 'active' ? 'В работе' :
                                                    job.status === 'completed' ? 'Готово' : 'Отмена'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {workers.find(w => w.id === job.user_id)?.name || '...'}
                                    </td>
                                    <td style={{ fontWeight: '600', textAlign: 'right', fontSize: '0.9rem' }}>
                                        {job.price ? `${job.price.toLocaleString()} ₽` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* МОДАЛКА ВЫБОРА ДАТЫ */}
            {selectedDate && (
                <div className="modal-overlay" onClick={() => setSelectedDate(null)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="data-card glass animate-fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Мастера на {selectedDate.day} число</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedDate.masters.length > 0 ? selectedDate.masters.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.5)' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                                        {m.name[0]}
                                    </div>
                                    <div style={{ fontWeight: '600' }}>{m.name}</div>
                                </div>
                            )) : (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Нет активных заявок на этот день</div>
                            )}
                        </div>
                        <button className="btn-primary" onClick={() => setSelectedDate(null)} style={{ marginTop: '24px', width: '100%' }}>Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    )
}
