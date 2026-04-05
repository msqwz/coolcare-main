import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { Briefcase, Activity, Percent, TrendingUp, BarChart3, DollarSign, Clock, CheckCircle } from 'lucide-react'
import './Dashboard.css'

export function Dashboard() {
    const { stats, jobs, workers } = useAdmin()
    const [period, setPeriod] = useState('month')

    const calculateJobTotal = (j) => {
        const p = parseFloat(j.price || 0)
        if (p > 0) return p
        return (j.services || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)
    }

    const getPeriodData = (p) => {
        const now = new Date()
        let startDate = new Date()
        if (p === 'day') startDate.setHours(0, 0, 0, 0)
        else if (p === 'week') startDate.setDate(now.getDate() - 7)
        else if (p === 'month') startDate.setMonth(now.getMonth(), 1)
        
        const periodJobs = (jobs || []).filter(j => new Date(j.created_at || j.scheduled_at) >= startDate || new Date(j.completed_at) >= startDate)
        const completed = periodJobs.filter(j => j.status === 'completed')
        const active = periodJobs.filter(j => j.status === 'active' || j.status === 'scheduled')
        
        const rev = completed.reduce((sum, j) => sum + calculateJobTotal(j), 0)
        const avg = completed.length > 0 ? Math.round(rev / completed.length) : 0
        const winRate = periodJobs.length > 0 ? Math.round((completed.length / periodJobs.length) * 100) : 0
        
        return { rev, avg, winRate, completed: completed.length, active: active.length, total: periodJobs.length }
    }

    const periodData = getPeriodData(period)
    const activeJobs = (jobs || []).filter(j => j.status === 'active').length
    const periodLabel = period === 'day' ? 'День' : period === 'week' ? 'Неделю' : 'Месяц'

    const typeLabels = {
        repair: 'Ремонт', install: 'Установка', service: 'Обслуживание',
        diagnostic: 'Диагностика', maintenance: 'Тех. обслуживание', other: 'Прочее'
    }
    const typeColors = {
        repair: '#3b82f6', install: '#10b981', service: '#f59e0b',
        diagnostic: '#8b5cf6', maintenance: '#06b6d4', other: '#64748b'
    }

    const masterStats = (workers || []).map(w => {
        const wj = (jobs || []).filter(j => j.user_id === w.id)
        const completed = wj.filter(j => j.status === 'completed')
        const revenue = completed.reduce((sum, j) => sum + calculateJobTotal(j), 0)
        return { ...w, jobCount: wj.length, completedCount: completed.length, revenue }
    }).sort((a, b) => b.revenue - a.revenue)

    const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0,0,0,0)
        const nextD = new Date(d)
        nextD.setDate(nextD.getDate() + 1)
        
        const dayRev = (jobs || [])
            .filter(j => j.status === 'completed' && j.completed_at && new Date(j.completed_at) >= d && new Date(j.completed_at) < nextD)
            .reduce((sum, j) => sum + calculateJobTotal(j), 0)
            
        return {
            label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
            rev: dayRev
        }
    }).reverse() // Fix: make chronologically correct (oldest to newest)
    
    // Fix: correct order for rendering, reverse is better for charts (left to right = old to new)
    const maxDayRev = Math.max(...last7Days.map(d => d.rev), 1)

    return (
        <div className="dash-root animate-fade-in" style={{ paddingTop: '24px' }}>

            <div className="dash-kpi-strip" style={{ marginBottom: '24px' }}>
                <div className="dash-kpi-item" style={{ padding: '20px' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Briefcase size={22} /></div>
                    <div className="kpi-data">
                        <span className="kpi-val">{periodData.total}</span>
                        <span className="kpi-label">Заявок за {periodLabel}</span>
                    </div>
                </div>
                <div className="dash-kpi-item" style={{ padding: '20px' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Activity size={22} /></div>
                    <div className="kpi-data">
                        <span className="kpi-val">{activeJobs}</span>
                        <span className="kpi-label">В работе сейчас</span>
                    </div>
                </div>
                <div className="dash-kpi-item" style={{ padding: '20px' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Percent size={22} /></div>
                    <div className="kpi-data">
                        <span className="kpi-val">{periodData.winRate}%</span>
                        <span className="kpi-label">Успешных ({periodLabel.toLowerCase()})</span>
                    </div>
                </div>
                <div className="dash-kpi-item" style={{ padding: '20px' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><DollarSign size={22} /></div>
                    <div className="kpi-data">
                        <span className="kpi-val">{periodData.avg.toLocaleString()} ₽</span>
                        <span className="kpi-label">Средний чек ({periodLabel.toLowerCase()})</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }} className="dash-middle-grid">
                
                <div className="data-card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: 56, height: 56 }}><TrendingUp size={28} /></div>
                            <div>
                                <div className="kpi-val" style={{ fontSize: '2rem' }}>{periodData.rev.toLocaleString()} ₽</div>
                                <div className="kpi-label">Выручка за {periodLabel}</div>
                            </div>
                        </div>
                        <div className="dash-period-switcher" style={{ padding: '4px', background: 'rgba(0,0,0,0.02)', display: 'flex', gap: '4px' }}>
                            {['day', 'week', 'month'].map(p => (
                                <button 
                                    key={p} 
                                    className={`dash-period-btn ${period === p ? 'active' : ''}`} 
                                    onClick={() => setPeriod(p)} 
                                    style={{ padding: '6px 16px', fontSize: '0.75rem', background: period === p ? '#fff' : 'transparent', boxShadow: period === p ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                                    {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                        {last7Days.map((d, i) => {
                            const pct = Math.max((d.rev / maxDayRev) * 100, 4)
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <div style={{ width: 'min(40px, 100%)', height: `${pct}%`, background: 'linear-gradient(to top, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.8))', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`${d.rev} ₽`}>
                                            <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                {d.rev > 0 ? (d.rev > 999 ? (d.rev/1000).toFixed(1)+'k' : d.rev) : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.label}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="data-card glass" style={{ padding: '24px', flex: 1 }}>
                        <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={18} style={{ color: 'var(--primary)' }}/> Распределение услуг
                        </h3>
                        {Object.keys(stats?.type_distribution || {}).length === 0 ? (
                             <div className="text-muted text-sm font-semibold" style={{ textAlign: 'center', marginTop: '20px' }}>Нет данных</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(stats?.type_distribution || {}).map(([type, count]) => {
                                    const percent = Math.round((count / (stats?.total_jobs || 1)) * 100)
                                    const color = typeColors[type] || typeColors.other
                                    return (
                                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                                            <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{typeLabels[type] || type}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{count}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>{percent}%</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%' }}>
                <div className="data-card glass" style={{ padding: '24px' }}>
                    <h3 className="card-title">Рейтинг мастеров</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {masterStats.map((m, i) => (
                            <div key={m.id} className="dash-master-row">
                                <span className="master-rank">{i + 1}</span>
                                <div className="master-avatar" style={{ background: i === 0 ? '#111' : i === 1 ? '#333' : i === 2 ? '#555' : '#777', color: '#fff' }}>
                                    {(m.name || 'M')[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="font-semibold text-sm tracking-tight" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.phone}</div>
                                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{m.completedCount} выполнено</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{m.revenue.toLocaleString()} ₽</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="data-card glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>Последние события</h3>
                        <span className="text-xs font-semibold" style={{ color: 'var(--primary)', cursor: 'pointer' }}>Все заявки</span>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                        {(jobs || []).slice(0, 8).map(job => {
                            const worker = (workers || []).find(w => w.id === job.user_id)
                            const statusCfg = {
                                scheduled: { label: 'Ожидает', cls: 'scheduled' },
                                active: { label: 'В работе', cls: 'active' },
                                completed: { label: 'Готово', cls: 'completed' },
                                cancelled: { label: 'Отмена', cls: 'cancelled' },
                            }
                            const sc = statusCfg[job.status] || statusCfg.scheduled
                            return (
                                <div key={job.id} className="dash-recent-row">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="font-semibold text-sm tracking-tight" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.customer_name || 'Без имени'}</div>
                                        <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{worker?.name || 'Мастер не назначен'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span className={`status-badge ${sc.cls}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{sc.label}</span>
                                        <div className="font-semibold text-sm">{calculateJobTotal(job).toLocaleString()} ₽</div>
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
