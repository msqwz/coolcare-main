import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, Clock, TrendingUp, Users, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Portal } from '../components/Portal'

export function Dashboard() {
    const { stats, jobs, workers } = useAdmin()
    const [period, setPeriod] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())

    const calculateJobTotal = (j) => {
        const p = parseFloat(j.price || 0)
        if (p > 0) return p
        return (j.services || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)
    }

    const getRevenueByPeriod = (p) => {
        const now = new Date()
        let startDate = new Date()
        if (p === 'day') startDate.setHours(0, 0, 0, 0)
        else if (p === 'week') startDate.setDate(now.getDate() - 7)
        else if (p === 'month') startDate.setMonth(now.getMonth(), 1)

        return (jobs || [])
            .filter(j => j.status === 'completed' && j.completed_at && new Date(j.completed_at) >= startDate)
            .reduce((sum, j) => sum + calculateJobTotal(j), 0)
    }

    const cards = [
        { title: 'Всего заявок', value: stats?.total_jobs || 0, icon: <Briefcase color="#3b82f6" />, trend: '+5%' },
        { title: 'В работе', value: stats?.active_jobs || 0, icon: <Activity color="#f59e0b" />, trend: 'Live' },
        { title: 'Мастера (online)', value: stats?.active_users || 0, icon: <Users color="#10b981" />, trend: '12 активных' },
        { title: `Выручка (${period === 'day' ? 'день' : period === 'week' ? 'неделя' : 'месяц'})`, value: `${getRevenueByPeriod(period).toLocaleString()} ₽`, icon: <Calendar color="#ef4444" />, trend: '+12.5%' },
    ]

    const typeLabels = {
        'repair': 'Ремонт',
        'install': 'Установка',
        'service': 'Обслуживание',
        'diagnostic': 'Диагностика',
        'maintenance': 'Тех. обслуживание',
        'other': 'Прочее'
    }

    const [selectedDate, setSelectedDate] = useState(null)

    // Статистика по мастерам
    const masterStats = (workers || []).map(w => {
        const workerJobs = (jobs || []).filter(j => j.user_id === w.id)
        const completedJobs = workerJobs.filter(j => j.status === 'completed')
        const revenue = completedJobs.reduce((sum, j) => sum + calculateJobTotal(j), 0)
        return { ...w, jobCount: workerJobs.length, revenue }
    }).sort((a, b) => b.revenue - a.revenue)

    // Календарь
    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = (date) => {
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
        return day === 0 ? 6 : day - 1 // Понедельник = 0
    }

    const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) }, (_, i) => i)

    const getMastersForDay = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
        return (workers || []).filter(w =>
            (jobs || []).some(j =>
                j.user_id === w.id &&
                new Date(j.scheduled_at).toDateString() === dateStr
            )
        )
    }

    const changeMonth = (offset) => {
        const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
        setCurrentDate(nextDate)
    }

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]

    return (
        <div className="animate-fade-in">
            <div className="admin-topbar" style={{ padding: 0, marginBottom: '32px' }}>
                <h2 className="modal-title">Аналитика системы</h2>
                <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: '12px' }}>
                    {['day', 'week', 'month'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={period === p ? 'btn-active' : ''}
                            style={{
                                padding: '6px 16px',
                                border: 'none',
                                background: period === p ? 'white' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: period === p ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stats-grid">
                {cards.map(card => (
                    <div key={card.title} className="stat-card glass slide-up">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="form-section" style={{ padding: '10px', background: 'rgba(255,255,255,0.6)' }}>
                                {card.icon}
                            </div>
                            <span className="status-badge" style={{
                                color: card.trend.includes('+') ? '#10b981' : '#64748b',
                                background: 'rgba(255,255,255,0.5)'
                            }}>
                                {card.trend}
                            </span>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div className="modal-subtitle" style={{ marginBottom: '4px', fontWeight: '600' }}>{card.title}</div>
                            <strong style={{ fontSize: '1.8rem', letterSpacing: '-0.03em', fontWeight: '800' }}>{card.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            {/* ОСНОВНОЙ КОНТЕНТ ДАШБОРДА */}
            <div className="form-row-2" style={{ gridTemplateColumns: '1.2fr 1.3fr', marginBottom: '32px' }}>
                {/* КАЛЕНДАРЬ ЯВКИ */}
                <div className="data-card glass slide-up" style={{ padding: '24px' }}>
                    <div className="modal-header" style={{ marginBottom: '20px' }}>
                        <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Календарь занятости</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => changeMonth(-1)} className="icon-btn glass"><ChevronLeft size={16} /></button>
                                <button onClick={() => changeMonth(1)} className="icon-btn glass"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', paddingBottom: '8px' }}>{d}</div>
                        ))}
                        {emptyDays.map(i => <div key={`empty-${i}`} />)}
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
                <div className="data-card glass slide-up" style={{ padding: '24px' }}>
                    <h3 className="modal-title" style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Эффективность мастеров</h3>
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

            <div className="form-row-2" style={{ gridTemplateColumns: '1fr 2fr', marginBottom: '32px' }}>
                {/* КАТЕГОРИИ РАБОТ */}
                <div className="data-card glass slide-up" style={{ padding: '24px' }}>
                    <h3 className="modal-title" style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Распределение по типам</h3>
                    <div className="form-grid" style={{ gap: '16px' }}>
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
                <div className="data-card glass slide-up" style={{ padding: '24px' }}>
                    <div className="modal-header" style={{ marginBottom: '20px' }}>
                        <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Последние заявки</h3>
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
                                        {calculateJobTotal(job).toLocaleString()} ₽
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* МОДАЛКА ВЫБОРА ДАТЫ */}
            {selectedDate && (
                <Portal>
                    <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
                        <div className="modal-container animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <h3 className="modal-title" style={{ marginBottom: '20px' }}>Мастера на {selectedDate.day} число</h3>
                            <div className="form-grid" style={{ gap: '12px' }}>
                                {selectedDate.masters.length > 0 ? selectedDate.masters.map(m => (
                                    <div key={m.id} className="checklist-item glass" style={{ background: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                                            {(m.name || 'M')[0].toUpperCase()}
                                        </div>
                                        <div style={{ fontWeight: '600' }}>{m.name || m.phone}</div>
                                    </div>
                                )) : (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Нет активных заявок на этот день</div>
                                )}
                            </div>
                            <button className="btn-primary" onClick={() => setSelectedDate(null)} style={{ marginTop: '24px', width: '100%' }}>Закрыть</button>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    )
}
