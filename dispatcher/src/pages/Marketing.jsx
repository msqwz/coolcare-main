import React, { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'
import { PlusCircle, Megaphone, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import { SOURCE_LIST } from '../constants'
import { useToast } from '@shared/components/Toast'

export function Marketing() {
    const { jobs } = useAdmin()
    const toast = useToast()
    const [spends, setSpends] = useState([])
    const [newSpend, setNewSpend] = useState({ date: new Date().toISOString().slice(0, 10), source: 'avito', amount: '' })

    useEffect(() => {
        const stored = localStorage.getItem('coolcare_marketing_spends')
        if (stored) {
            try { 
                setSpends(JSON.parse(stored)) 
            } catch (e) {
                console.error("Failed to parse marketing spends", e)
            }
        }
    }, [])

    const saveSpends = (newSpends) => {
        setSpends(newSpends)
        localStorage.setItem('coolcare_marketing_spends', JSON.stringify(newSpends))
    }

    const addSpend = (e) => {
        e.preventDefault()
        const amount = parseFloat(newSpend.amount)
        if (!amount || isNaN(amount)) {
            return toast.error('Введите корректную сумму')
        }
        
        const item = { 
            id: Date.now(), 
            date: newSpend.date,
            source: newSpend.source, 
            amount: amount 
        }
        
        saveSpends([item, ...spends])
        setNewSpend({ ...newSpend, amount: '' })
        toast.success('Затраты добавлены')
    }

    const removeSpend = (id) => {
        saveSpends(spends.filter(s => s.id !== id))
        toast.success('Запись удалена')
    }

    // Calculations
    const sourceMetrics = SOURCE_LIST.map(src => {
        const sourceJobs = jobs.filter(j => j.source === src.key)
        const completedJobs = sourceJobs.filter(j => j.status === 'completed')
        
        const revenue = completedJobs.reduce((acc, job) => {
            const price = parseFloat(job.price)
            if (price) return acc + price
            
            const services = job.services || []
            const srvTotal = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)
            return acc + srvTotal
        }, 0)
        
        const totalSpend = spends.filter(s => s.source === src.key).reduce((sum, s) => sum + parseFloat(s.amount), 0)

        const cpl = sourceJobs.length > 0 ? totalSpend / sourceJobs.length : 0 // Cost per lead (заявка)
        const cac = completedJobs.length > 0 ? totalSpend / completedJobs.length : 0 // Cost per acquisition (клиент)
        const profit = revenue - totalSpend

        return {
            ...src,
            totalJobs: sourceJobs.length,
            completedJobs: completedJobs.length,
            revenue,
            totalSpend,
            cpl,
            cac,
            profit
        }
    })

    const totalMetrics = sourceMetrics.reduce((acc, curr) => ({
        totalJobs: acc.totalJobs + curr.totalJobs,
        completedJobs: acc.completedJobs + curr.completedJobs,
        revenue: acc.revenue + curr.revenue,
        totalSpend: acc.totalSpend + curr.totalSpend,
        profit: acc.profit + curr.profit
    }), { totalJobs: 0, completedJobs: 0, revenue: 0, totalSpend: 0, profit: 0 })

    return (
        <div className="animate-fade-in" style={{ paddingTop: '24px' }}>

            {/* Карточки сводки */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>ОБЩИЕ ЗАТРАТЫ</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--danger)', marginTop: '8px' }}>
                        {totalMetrics.totalSpend.toLocaleString()} ₽
                    </div>
                </div>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>ВЫРУЧКА</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--primary)', marginTop: '8px' }}>
                        {totalMetrics.revenue.toLocaleString()} ₽
                    </div>
                </div>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>ПРИБЫЛЬ С РЕКЛАМЫ (ROI)</div>
                    <div className="text-3xl font-bold" style={{ 
                        color: totalMetrics.profit >= 0 ? '#16a34a' : 'var(--danger)', 
                        marginTop: '8px' 
                    }}>
                        {totalMetrics.profit > 0 ? '+' : ''}{totalMetrics.profit.toLocaleString()} ₽
                    </div>
                </div>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>ВСЕГО ЗАЯВОК</div>
                    <div className="text-3xl font-bold" style={{ marginTop: '8px' }}>
                        {totalMetrics.totalJobs} <span className="text-sm" style={{ color: '#16a34a' }}>({totalMetrics.completedJobs} усп.)</span>
                    </div>
                </div>
            </div>

            <div className="form-grid" style={{ gap: '24px', gridTemplateColumns: '1fr', alignItems: 'flex-start' }}>
                <div className="data-card glass slide-up" style={{ padding: '24px', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} /> Эффективность источников
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Источник</th>
                                    <th>Заявок (Всего)</th>
                                    <th>Успешных</th>
                                    <th>Затраты (₽)</th>
                                    <th>Выручка (₽)</th>
                                    <th>Прибыль (₽)</th>
                                    <th title="Стоимость одной заявки (Cost Per Lead)">CPL (Заявка)</th>
                                    <th title="Стоимость успешного клиента (Customer Acquisition Cost)">CAC (Клиент)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sourceMetrics.map(m => (
                                    <tr key={m.key}>
                                        <td className="font-semibold">{m.label}</td>
                                        <td>{m.totalJobs}</td>
                                        <td style={{ color: '#16a34a' }}>{m.completedJobs}</td>
                                        <td style={{ color: 'var(--danger)' }}>{m.totalSpend.toLocaleString()}</td>
                                        <td style={{ color: 'var(--primary)' }}>{m.revenue.toLocaleString()}</td>
                                        <td style={{ 
                                            color: m.profit >= 0 ? '#16a34a' : 'var(--danger)', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {m.profit > 0 ? '+' : ''}{m.profit.toLocaleString()}
                                        </td>
                                        <td>{Math.round(m.cpl).toLocaleString()} ₽</td>
                                        <td>{Math.round(m.cac).toLocaleString()} ₽</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
                        * Расчеты ведутся на основе загруженных в таблицу заявок (последние 50) и добавленных затрат ниже. Для более точной картины загрузите старые заявки на странице "Заявки".
                    </div>
                </div>

                <div className="data-card glass slide-up" style={{ padding: '24px', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={18} /> Учет затрат на рекламу
                    </h3>
                    
                    <form onSubmit={addSpend} style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: '1 1 200px' }}>
                            <label>Дата оплаты</label>
                            <input 
                                type="date" 
                                value={newSpend.date} 
                                onChange={e => setNewSpend({...newSpend, date: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="input-group" style={{ flex: '2 1 200px' }}>
                            <label>Источник / Площадка</label>
                            <select 
                                className="admin-select" 
                                value={newSpend.source} 
                                onChange={e => setNewSpend({...newSpend, source: e.target.value})}
                            >
                                {SOURCE_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: '1 1 200px' }}>
                            <label>Сумма затрат (₽)</label>
                            <input 
                                type="number" 
                                min="0" 
                                value={newSpend.amount} 
                                onChange={e => setNewSpend({...newSpend, amount: e.target.value})} 
                                placeholder="Например: 5000" 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <PlusCircle size={18} /> Добавить
                        </button>
                    </form>

                    <h4 className="text-sm font-semibold" style={{ marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>История добавленных затрат</h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {spends.length === 0 ? (
                            <div className="text-sm font-medium" style={{ color: 'var(--text-muted)', padding: '16px 0' }}>
                                Вы еще не добавили ни одной записи о затратах на рекламу.
                            </div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Дата</th>
                                        <th>Источник</th>
                                        <th>Сумма</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spends.map(s => (
                                        <tr key={s.id}>
                                            <td className="text-sm">{new Date(s.date).toLocaleDateString('ru-RU')}</td>
                                            <td className="font-medium">{SOURCE_LIST.find(x => x.key === s.source)?.label || s.source}</td>
                                            <td className="font-semibold" style={{ color: 'var(--danger)' }}>-{s.amount.toLocaleString()} ₽</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    className="icon-btn danger" 
                                                    onClick={() => removeSpend(s.id)} 
                                                    style={{ width: 'auto', height: 'auto', background: 'none' }} 
                                                    title="Удалить запись"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
