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
        scheduled_at: new Date().toISOString().slice(0, 16),
        checklist: [],
        user_id: workers && workers.length > 0 ? workers[0].id : ''
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
        if (!formData.user_id) {
            alert('Пожалуйста, выберите мастера')
            return
        }
        // Принудительно приводим к числу, если это строка
        const dataToSave = {
            ...formData,
            price: formData.price ? parseFloat(formData.price) : 0,
            user_id: parseInt(formData.user_id) || 0
        }
        onSave(dataToSave)
    }

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
            padding: '40px 20px', overflowY: 'auto'
        }}>
            <div className="data-card glass animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{job ? 'Редактирование' : 'Новая заявка'}</h3>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Заполните данные для назначения мастера</p>
                    </div>
                    <button className="icon-btn glass" onClick={onClose} style={{ width: '40px', height: '40px' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Имя клиента</label>
                            <input required placeholder="Иван Иванов" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Телефон клиента</label>
                            <input placeholder="+7 (999) 000-00-00" value={formData.customer_phone || ''} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontWeight: '600', marginBottom: '8px' }}>Адрес объекта</label>
                        <input required placeholder="г. Москва, ул. Ленина, д. 1" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Тема / Неисправность</label>
                            <input required placeholder="Например: Ремонт кондиционера" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Тип работы</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                {JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.3)' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Чек-лист задач</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <input
                                style={{ flex: 1, height: '44px' }}
                                placeholder="Что нужно сделать?"
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                            />
                            <button type="button" onClick={addChecklistItem} className="btn-primary" style={{ width: 'auto', padding: '0 20px', height: '44px' }}>Добавить</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(formData.checklist || []).map((item, idx) => (
                                <div key={idx} className="checklist-item glass" style={{ padding: '10px 14px', borderRadius: '12px', background: 'white' }}>
                                    <button type="button" onClick={() => toggleChecklistItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        {item.done ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
                                    </button>
                                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '500', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#94a3b8' : 'var(--text-main)' }}>{item.text}</span>
                                    <button type="button" onClick={() => removeChecklistItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Приоритет</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                {PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Цена (₽)</label>
                            <input type="number" placeholder="0" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontWeight: '600', marginBottom: '8px' }}>Дата и время</label>
                            <input type="datetime-local" value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ fontWeight: '600', marginBottom: '8px' }}>Назначить исполнителя</label>
                        <select required className="admin-select" style={{ width: '100%' }} value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: parseInt(e.target.value) })}>
                            <option value="">Выберите мастера...</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name || w.phone}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <button type="submit" className="btn-primary" style={{ height: '56px', width: '100%', fontSize: '1rem', fontWeight: '700' }}>
                            <Save size={20} style={{ marginRight: '8px' }} /> {job ? 'Сохранить изменения' : 'Создать заявку'}
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
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{job.customer_name || 'Без имени'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>#{job.id} • {job.title}</div>
                                    </td>
                                    <td style={{ maxWidth: '220px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400', lineHeight: '1.4' }}>
                                        {job.address}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
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
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '600' }}>
                                                {(worker?.name || 'M')[0]}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{worker?.name || '-'}</span>
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
