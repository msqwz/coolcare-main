import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Plus, Edit, Trash2, X, Save, Search as SearchIcon } from 'lucide-react'
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
        user_id: workers[0]?.id || ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
        }}>
            <div className="data-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{job ? 'Редактировать заявку' : 'Новая заявка'}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                    <div className="input-group">
                        <label>Тема / Короткое описание</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div className="input-group">
                        <label>Полное описание работ</label>
                        <textarea rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>Приоритет</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                {PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Тип работы</label>
                            <select className="admin-select" style={{ width: '100%' }} value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                {JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>Цена (₽)</label>
                            <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Дата и время</label>
                            <input type="datetime-local" value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Назначить мастера</label>
                        <select required className="admin-select" style={{ width: '100%' }} value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: parseInt(e.target.value) })}>
                            <option value="">Выберите мастера</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name || w.phone} (ID: {w.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Заметки для мастера</label>
                        <textarea rows={1} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                            <Save size={18} /> Сохранить
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
            loadData() // Refresh dashboard stats
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Управление заявками</h2>
                <button
                    className="btn-primary"
                    onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
                    style={{
                        width: 'auto',
                        padding: '10px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 102, 204, 0.3)',
                        borderRadius: '10px'
                    }}
                >
                    <Plus size={20} strokeWidth={2.5} /> Создать заявку
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="search"
                        placeholder="Поиск по имени, адресу, ID..."
                        style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.95rem' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="admin-select" style={{ minWidth: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Все статусы</option>
                    {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
            </div>

            <div className="data-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Клиент / Тема</th>
                            <th>Адрес</th>
                            <th>Мастер</th>
                            <th>Статус</th>
                            <th>Сумма</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredJobs.map(job => {
                            const worker = workers.find(w => w.id === job.user_id)
                            return (
                                <tr key={job.id}>
                                    <td>#{job.id}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{job.customer_name || 'Без имени'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.title || 'Без темы'}</div>
                                    </td>
                                    <td>{job.address}</td>
                                    <td>{worker?.name || worker?.phone || `ID: ${job.user_id}`}</td>
                                    <td>
                                        <select className={`status-select ${job.status}`} value={job.status} onChange={(e) => handleUpdateStatus(job.id, e.target.value)}>
                                            {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                        </select>
                                    </td>
                                    <td>{job.price ? `${job.price} ₽` : '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button className="icon-btn info" onClick={() => { setEditingJob(job); setIsModalOpen(true); }}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDeleteJob(job.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredJobs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Заявки не найдены</div>}
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
