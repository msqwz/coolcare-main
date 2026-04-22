import React, { useState, useEffect, useMemo } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { useToast } from '@shared/components/Toast'
import { DollarSign, Users, Calendar, Plus, Minus, Download, Settings, TrendingUp, Award, AlertTriangle } from 'lucide-react'

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

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1><DollarSign size={24} /> Зарплаты</h1>
                    <p className="page-subtitle">{monthLabel}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="form-input"
                        style={{ width: '180px' }}
                    />
                    <button className="btn btn-outline" onClick={() => setShowAdjModal(true)} title="Бонус/Штраф">
                        <Plus size={16} /> Бонус/Штраф
                    </button>
                    <button className="btn btn-outline" onClick={exportPayroll} title="Экспорт CSV">
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totals.totalRevenue.toLocaleString('ru')} ₽</span>
                        <span className="stat-label">Выручка</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                        <DollarSign size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totals.totalSalary.toLocaleString('ru')} ₽</span>
                        <span className="stat-label">К выплате</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        <Award size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totals.totalJobs}</span>
                        <span className="stat-label">Заявок завершено</span>
                    </div>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="card glass">
                <div className="card-header">
                    <h3>Ведомость за {monthLabel}</h3>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Мастер</th>
                                <th style={{ textAlign: 'center' }}>Заявок</th>
                                <th style={{ textAlign: 'right' }}>Выручка</th>
                                <th style={{ textAlign: 'center' }}>%</th>
                                <th style={{ textAlign: 'right' }}>Зарплата</th>
                                <th style={{ textAlign: 'right' }}>Бонусы / Штрафы</th>
                                <th style={{ textAlign: 'right' }}>К выплате</th>
                                <th style={{ textAlign: 'center' }}>⚙️</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</td></tr>
                            ) : calculations.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Нет данных за этот период</td></tr>
                            ) : calculations.map(c => (
                                <tr key={c.user_id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td style={{ textAlign: 'center' }}>{c.job_count}</td>
                                    <td style={{ textAlign: 'right' }}>{c.total_revenue.toLocaleString('ru')} ₽</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                            {c.percentage}%
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{c.salary_base.toLocaleString('ru')} ₽</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {c.adj_total !== 0 && (
                                            <span style={{ color: c.adj_total > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                {c.adj_total > 0 ? '+' : ''}{c.adj_total.toLocaleString('ru')} ₽
                                            </span>
                                        )}
                                        {c.adjustments?.length > 0 && (
                                            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                                                {c.adjustments.map(a => a.reason).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong style={{ fontSize: '15px' }}>{c.total_salary.toLocaleString('ru')} ₽</strong>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => { setEditWorker(c); setShowSettingsModal(true) }}
                                            title="Настройки"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {calculations.length > 0 && (
                            <tfoot>
                                <tr style={{ fontWeight: 700, borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                    <td>ИТОГО</td>
                                    <td style={{ textAlign: 'center' }}>{totals.totalJobs}</td>
                                    <td style={{ textAlign: 'right' }}>{totals.totalRevenue.toLocaleString('ru')} ₽</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style={{ textAlign: 'right', fontSize: '16px' }}>{totals.totalSalary.toLocaleString('ru')} ₽</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettingsModal && editWorker && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚙️ Настройки — {editWorker.name}</h3>
                            <button className="btn-close" onClick={() => setShowSettingsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Процент от выручки (%)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editWorker.percentage}
                                    onChange={e => setEditWorker({ ...editWorker, percentage: parseFloat(e.target.value) || 0 })}
                                    min="0" max="100" step="5"
                                />
                            </div>
                            <div className="form-group">
                                <label>Фикс. бонус за заявку (₽)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editWorker.fixed_bonus}
                                    onChange={e => setEditWorker({ ...editWorker, fixed_bonus: parseFloat(e.target.value) || 0 })}
                                    min="0" step="50"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>Отмена</button>
                            <button className="btn btn-primary" onClick={handleSaveSettings}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Adjustment Modal */}
            {showAdjModal && (
                <div className="modal-overlay" onClick={() => setShowAdjModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{adjForm.type === 'bonus' ? '🎁 Бонус' : '⚠️ Штраф'}</h3>
                            <button className="btn-close" onClick={() => setShowAdjModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Тип</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className={`btn ${adjForm.type === 'bonus' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setAdjForm({ ...adjForm, type: 'bonus' })}
                                        style={{ flex: 1 }}
                                    >
                                        <Plus size={14} /> Бонус
                                    </button>
                                    <button
                                        className={`btn ${adjForm.type === 'penalty' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setAdjForm({ ...adjForm, type: 'penalty' })}
                                        style={{ flex: 1, background: adjForm.type === 'penalty' ? '#ef4444' : undefined }}
                                    >
                                        <Minus size={14} /> Штраф
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Мастер</label>
                                <select
                                    className="form-input"
                                    value={adjForm.user_id}
                                    onChange={e => setAdjForm({ ...adjForm, user_id: e.target.value })}
                                >
                                    <option value="">Выберите мастера</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.name || w.phone}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Сумма (₽)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={adjForm.amount}
                                    onChange={e => setAdjForm({ ...adjForm, amount: e.target.value })}
                                    min="0" step="100"
                                    placeholder="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Причина</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={adjForm.reason}
                                    onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}
                                    placeholder={adjForm.type === 'bonus' ? 'За отличную работу' : 'Опоздание к клиенту'}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowAdjModal(false)}>Отмена</button>
                            <button className="btn btn-primary" onClick={handleAddAdjustment}>
                                {adjForm.type === 'bonus' ? 'Добавить бонус' : 'Добавить штраф'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
