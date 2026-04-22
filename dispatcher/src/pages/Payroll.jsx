import React, { useState, useEffect, useMemo } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { useToast } from '@shared/components/Toast'
import { DollarSign, Users, Plus, Minus, Download, Settings, TrendingUp, Award, Briefcase } from 'lucide-react'
import '../pages/Dashboard.css'

export function Payroll() {
    const { users } = useAdmin()
    const { showToast } = useToast()

    const [month, setMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [calculations, setCalculations] = useState([])
    const [settings, setSettings] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [showAdjModal, setShowAdjModal] = useState(false)
    const [editWorker, setEditWorker] = useState(null)
    const [adjForm, setAdjForm] = useState({ user_id: '', amount: '', reason: '', type: 'bonus' })

    useEffect(() => { loadData() }, [month])

    const loadData = async () => {
        setLoading(true)
        try {
            const [calc, sets] = await Promise.all([
                api.getSalaryCalculations(month),
                api.getSalarySettings()
            ])
            setCalculations(calc)
            setSettings(sets)
        } catch (e) {
            showToast('Ошибка загрузки зарплат', 'error')
        }
        setLoading(false)
    }

    const totals = useMemo(() => {
        const totalSalary = calculations.reduce((s, c) => s + c.total_salary, 0)
        const totalRevenue = calculations.reduce((s, c) => s + c.total_revenue, 0)
        const totalJobs = calculations.reduce((s, c) => s + c.job_count, 0)
        return { totalSalary, totalRevenue, totalJobs }
    }, [calculations])

    const handleSaveSettings = async () => {
        if (!editWorker) return
        try {
            await api.updateSalarySettings(editWorker.user_id, {
                percentage: editWorker.percentage,
                fixed_bonus: editWorker.fixed_bonus
            })
            showToast('Настройки сохранены', 'success')
            setShowSettingsModal(false)
            loadData()
        } catch (e) {
            showToast('Ошибка сохранения', 'error')
        }
    }

    const handleAddAdjustment = async () => {
        if (!adjForm.user_id || !adjForm.amount || !adjForm.reason) {
            showToast('Заполните все поля', 'error')
            return
        }
        try {
            const amount = adjForm.type === 'penalty' ? -Math.abs(parseFloat(adjForm.amount)) : Math.abs(parseFloat(adjForm.amount))
            await api.createSalaryAdjustment({
                user_id: parseInt(adjForm.user_id),
                amount,
                reason: adjForm.reason,
                period_month: `${month}-01`
            })
            showToast(adjForm.type === 'bonus' ? 'Бонус добавлен' : 'Штраф добавлен', 'success')
            setShowAdjModal(false)
            setAdjForm({ user_id: '', amount: '', reason: '', type: 'bonus' })
            loadData()
        } catch (e) {
            showToast('Ошибка', 'error')
        }
    }

    const exportPayroll = () => {
        const header = 'Мастер;Заявок;Выручка;%;Зарплата;Бонусы/Штрафы;К выплате'
        const rows = calculations.map(c =>
            `${c.name};${c.job_count};${c.total_revenue};${c.percentage}%;${c.salary_base};${c.adj_total};${c.total_salary}`
        )
        const totalRow = `ИТОГО;${totals.totalJobs};${totals.totalRevenue};;;${totals.totalSalary}`
        const csv = [header, ...rows, '', totalRow].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payroll_${month}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const monthLabel = (() => {
        const [y, m] = month.split('-')
        const names = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        return `${names[parseInt(m)]} ${y}`
    })()

    const workers = useMemo(() =>
        (users || []).filter(u => u.role !== 'admin' && u.role !== 'operator'),
    [users])

    const masterColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899']

    return (
        <div className="dash-root animate-fade-in" style={{ paddingTop: '24px' }}>

            {/* Header */}
            <div className="dash-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={24} /> Зарплаты
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{monthLabel}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        style={{
                            padding: '8px 14px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            background: 'var(--white)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                        }}
                    />
                    <button
                        onClick={() => setShowAdjModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', border: '1px solid var(--border-color)',
                            borderRadius: '12px', background: 'var(--white)',
                            fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <Plus size={15} /> Бонус / Штраф
                    </button>
                    <button
                        onClick={exportPayroll}
                        title="Экспорт CSV"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '38px', height: '38px', border: '1px solid var(--border-color)',
                            borderRadius: '12px', background: 'var(--white)',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <Download size={16} color="var(--text-muted)" />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="dash-kpi-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <div className="dash-kpi-item">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-val">{totals.totalRevenue.toLocaleString('ru')} ₽</span>
                        <span className="kpi-label">Выручка</span>
                    </div>
                </div>
                <div className="dash-kpi-item">
                    <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <DollarSign size={22} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-val">{totals.totalSalary.toLocaleString('ru')} ₽</span>
                        <span className="kpi-label">К выплате</span>
                    </div>
                </div>
                <div className="dash-kpi-item">
                    <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Award size={22} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-val">{totals.totalJobs}</span>
                        <span className="kpi-label">Заявок завершено</span>
                    </div>
                </div>
            </div>

            {/* Payroll Table Card */}
            <div style={{
                background: 'var(--white)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h3 className="card-title" style={{ margin: 0 }}>Ведомость за {monthLabel}</h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                {['Мастер', 'Заявок', 'Выручка', '%', 'Зарплата', 'Бонусы / Штрафы', 'К выплате', ''].map((h, i) => (
                                    <th key={i} style={{
                                        padding: '12px 16px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        color: 'var(--text-muted)',
                                        textAlign: i === 0 ? 'left' : i === 7 ? 'center' : 'right',
                                        whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
                            ) : calculations.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                    <Briefcase size={32} style={{ opacity: 0.3, marginBottom: '8px' }} /><br />
                                    Нет данных за этот период
                                </td></tr>
                            ) : calculations.map((c, idx) => (
                                <tr key={c.user_id} style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.02)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: masterColors[idx % masterColors.length],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 600, fontSize: '0.85rem',
                                                boxShadow: `0 4px 12px ${masterColors[idx % masterColors.length]}40`,
                                            }}>
                                                {(c.name || '?')[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>{c.job_count}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>{c.total_revenue.toLocaleString('ru')} ₽</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '3px 10px',
                                            borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                                            background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
                                        }}>{c.percentage}%</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>{c.salary_base.toLocaleString('ru')} ₽</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        {c.adj_total !== 0 && (
                                            <span style={{
                                                fontWeight: 700, fontSize: '0.85rem',
                                                color: c.adj_total > 0 ? '#10b981' : '#ef4444',
                                            }}>
                                                {c.adj_total > 0 ? '+' : ''}{c.adj_total.toLocaleString('ru')} ₽
                                            </span>
                                        )}
                                        {c.adjustments?.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {c.adjustments.map(a => a.reason).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                                            {c.total_salary.toLocaleString('ru')} ₽
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => { setEditWorker(c); setShowSettingsModal(true) }}
                                            title="Настройки"
                                            style={{
                                                width: '32px', height: '32px', border: '1px solid var(--border-color)',
                                                borderRadius: '8px', background: 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', transition: 'all 0.2s',
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)' }}
                                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent' }}
                                        >
                                            <Settings size={14} color="var(--text-muted)" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {calculations.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'rgba(59, 130, 246, 0.02)' }}>
                                    <td style={{ padding: '16px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Итого</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700 }}>{totals.totalJobs}</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700 }}>{totals.totalRevenue.toLocaleString('ru')} ₽</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{totals.totalSalary.toLocaleString('ru')} ₽</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettingsModal && editWorker && (
                <div onClick={() => setShowSettingsModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{
                        background: 'var(--white)', borderRadius: '20px', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)', maxWidth: '420px', width: '100%',
                    }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>⚙️ Настройки — {editWorker.name}</h3>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>
                                    Процент от выручки (%)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editWorker.percentage}
                                    onChange={e => setEditWorker({ ...editWorker, percentage: parseFloat(e.target.value) || 0 })}
                                    min="0" max="100" step="5"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>
                                    Фикс. бонус за заявку (₽)
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editWorker.fixed_bonus}
                                    onChange={e => setEditWorker({ ...editWorker, fixed_bonus: parseFloat(e.target.value) || 0 })}
                                    min="0" step="50"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowSettingsModal(false)} style={{
                                padding: '8px 20px', border: '1px solid var(--border-color)',
                                borderRadius: '10px', background: 'transparent', fontWeight: 600,
                                cursor: 'pointer', fontSize: '0.85rem',
                            }}>Отмена</button>
                            <button onClick={handleSaveSettings} style={{
                                padding: '8px 20px', border: 'none',
                                borderRadius: '10px', background: 'var(--primary)', color: 'white',
                                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                            }}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {showAdjModal && (
                <div onClick={() => setShowAdjModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{
                        background: 'var(--white)', borderRadius: '20px', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)', maxWidth: '420px', width: '100%',
                    }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                {adjForm.type === 'bonus' ? '🎁 Бонус' : '⚠️ Штраф'}
                            </h3>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Type Toggle */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setAdjForm({ ...adjForm, type: 'bonus' })} style={{
                                    flex: 1, padding: '10px', border: `2px solid ${adjForm.type === 'bonus' ? '#10b981' : 'var(--border-color)'}`,
                                    borderRadius: '12px', background: adjForm.type === 'bonus' ? 'rgba(16,185,129,0.08)' : 'transparent',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    color: adjForm.type === 'bonus' ? '#10b981' : 'var(--text-muted)', transition: 'all 0.2s',
                                }}><Plus size={15} /> Бонус</button>
                                <button onClick={() => setAdjForm({ ...adjForm, type: 'penalty' })} style={{
                                    flex: 1, padding: '10px', border: `2px solid ${adjForm.type === 'penalty' ? '#ef4444' : 'var(--border-color)'}`,
                                    borderRadius: '12px', background: adjForm.type === 'penalty' ? 'rgba(239,68,68,0.08)' : 'transparent',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    color: adjForm.type === 'penalty' ? '#ef4444' : 'var(--text-muted)', transition: 'all 0.2s',
                                }}><Minus size={15} /> Штраф</button>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Мастер</label>
                                <select value={adjForm.user_id} onChange={e => setAdjForm({ ...adjForm, user_id: e.target.value })} style={{
                                    width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)',
                                    borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500, background: 'var(--white)',
                                }}>
                                    <option value="">Выберите мастера</option>
                                    {workers.map(w => <option key={w.id} value={w.id}>{w.name || w.phone}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Сумма (₽)</label>
                                <input type="number" value={adjForm.amount} onChange={e => setAdjForm({ ...adjForm, amount: e.target.value })}
                                    min="0" step="100" placeholder="0"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Причина</label>
                                <input type="text" value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}
                                    placeholder={adjForm.type === 'bonus' ? 'За отличную работу' : 'Опоздание к клиенту'}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAdjModal(false)} style={{
                                padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: '10px',
                                background: 'transparent', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                            }}>Отмена</button>
                            <button onClick={handleAddAdjustment} style={{
                                padding: '8px 20px', border: 'none', borderRadius: '10px',
                                background: adjForm.type === 'bonus' ? '#10b981' : '#ef4444', color: 'white',
                                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                            }}>{adjForm.type === 'bonus' ? 'Добавить бонус' : 'Добавить штраф'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
