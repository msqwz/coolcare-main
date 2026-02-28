import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Plus, Edit, Trash2, X, Save, Search as SearchIcon, CheckSquare, Square, Trash } from 'lucide-react'
import { PRIORITY_LIST, JOB_TYPE_LIST, STATUS_LIST } from '../constants'

function JobModal({ job, workers, onClose, onSave }) {
    const [formData, setFormData] = useState(job || {
        customer_name: '',
        title: '',
        description: '',
        notes: '',
        address: '',
        customer_phone: '',
        price: '',
        status: 'scheduled',
        priority: 'medium',
        job_type: 'repair',
        scheduled_at: '',
        checklist: [],
        user_id: workers[0]?.id || ''
    })

    const [newItem, setNewItem] = useState('')

    const addChecklistItem = () => {
        if (!newItem.trim()) return
        setFormData({
            ...formData,
            checklist: [...(formData.checklist || []), { text: newItem, done: false }]
        })
        setNewItem('')
    }

    const toggleChecklistItem = (index) => {
        const list = [...(formData.checklist || [])]
        list[index].done = !list[index].done
        setFormData({ ...formData, checklist: list })
    }

    const removeChecklistItem = (index) => {
        setFormData({
            ...formData,
            checklist: (formData.checklist || []).filter((_, i) => i !== index)
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
        }}>
            <div className="data-card glass animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{job ? 'Редактировать заявку' : 'Новая заявка'}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Имя клиента</label>
                            <input required value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Телефон клиента</label>
                            <input value={formData.customer_phone || ''} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Адрес</label>
                        <input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Тема заявки</label>
                            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Тип работы</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                {JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Чек-лист секция */}
                    <div className="data-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '16px', color: '#334155' }}>Чек-лист задач</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <input
                                style={{ flex: 1 }}
                                placeholder="Добавить пункт..."
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                            />
                            <button type="button" onClick={addChecklistItem} className="btn-primary" style={{ width: 'auto', padding: '0 15px' }}>+</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(formData.checklist || []).map((item, idx) => (
                                <div key={idx} className="checklist-item">
                                    <button type="button" onClick={() => toggleChecklistItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        {item.done ? <CheckSquare size={20} color="#2563eb" /> : <Square size={20} color="#94a3b8" />}
                                    </button>
                                    <span style={{ flex: 1, fontSize: '0.9rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#94a3b8' : '#1e293b' }}>{item.text}</span>
                                    <button type="button" onClick={() => removeChecklistItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Приоритет</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                {PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Цена (₽)</label>
                            <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Дата начала</label>
                            <input type="datetime-local" value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Назначить мастера</label>
                        <select required className="admin-select" style={{ width: '100%' }} value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: parseInt(e.target.value) })}>
                            <option value="">Выберите мастера</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name || w.phone}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', fontSize: '1rem' }}>
                            <Save size={20} /> Сохранить изменения
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function Jobs() {
    const { jobs, setJobs, workers, loadData } = useAdmin()
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState(null)

    const filteredJobs = jobs.filter(job => {
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter
        const matchesSearch = !searchTerm ||
            job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.id.toString().includes(searchTerm)

        return matchesStatus && matchesSearch
    })

    const handleUpdateStatus = async (jobId, newStatus) => {
        try {
            await api.adminUpdateJob(jobId, { status: newStatus })
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
            loadData()
        } catch (e) {
            alert('Ошибка: ' + e.message)
        }
    }

    const handleSaveJob = async (formData) => {
        try {
            if (editingJob) {
                const updated = await api.adminUpdateJob(editingJob.id, formData)
                setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j))
            } else {
                const created = await api.adminCreateJob(formData)
                setJobs(prev => [created, ...prev])
            }
            setIsModalOpen(false)
            setEditingJob(null)
            loadData()
        } catch (e) {
            alert('Ошибка при сохранении: ' + e.message)
        }
    }

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Удалить эту заявку?')) return
        try {
            await api.adminDeleteJob(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
            loadData()
        } catch (e) {
            alert('Ошибка: ' + e.message)
        }
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Управление заявками</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Создание, планирование и мониторинг рабочих процессов</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
                    style={{ padding: '14px 32px' }}
                >
                    <Plus size={22} strokeWidth={2.5} /> Создать заявку
                </button>
            </div>

            <div className="glass" style={{ display: 'flex', gap: '20px', marginBottom: '32px', padding: '24px', borderRadius: '20px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="search"
                        placeholder="Поиск по клиенту, адресу или ID..."
                        style={{ paddingLeft: '50px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Фильтр:</span>
                    <select className="admin-select" style={{ minWidth: '220px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Все статусы</option>
                        {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="data-card glass slide-up">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Клиент / Тема</th>
                            <th>Адрес объекта</th>
                            <th>Тип / Прогресс</th>
                            <th>Исполнитель</th>
                            <th>Статус</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredJobs.map(job => {
                            const worker = workers.find(w => w.id === job.user_id)
                            const checklist = job.checklist || []
                            const doneCount = checklist.filter(i => i.done).length
                            const isFullyDone = checklist.length > 0 && doneCount === checklist.length

                            return (
                                <tr key={job.id} style={{ transition: 'background 0.2s' }}>
                                    <td>
                                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>{job.customer_name || 'Без имени'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>#{job.id} • {job.title}</div>
                                    </td>
                                    <td style={{ maxWidth: '220px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.4' }}>
                                        {job.address}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                            {JOB_TYPE_LIST.find(t => t.key === job.job_type)?.label || job.job_type}
                                        </div>
                                        {checklist.length > 0 && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: isFullyDone ? '#10b981' : '#64748b',
                                                marginTop: '6px',
                                                fontWeight: '800',
                                                background: isFullyDone ? '#dcfce7' : 'rgba(0,0,0,0.05)',
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '20px'
                                            }}>
                                                задачи: {doneCount}/{checklist.length}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800' }}>
                                                {(worker?.name || 'M')[0]}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{worker?.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <select className={`status-select ${job.status} glass`} value={job.status} onChange={(e) => handleUpdateStatus(job.id, e.target.value)}>
                                            {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            <button className="icon-btn info glass" onClick={() => { setEditingJob(job); setIsModalOpen(true); }}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn danger glass" onClick={() => handleDeleteJob(job.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredJobs.length === 0 && (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>Ничего не найдено</div>
                        <p style={{ margin: 0 }}>Попробуйте изменить параметры поиска или фильтры</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <JobModal
                    job={editingJob}
                    workers={workers}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveJob}
                />
            )}
        </div>
    )
}
