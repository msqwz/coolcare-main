import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Plus, Edit, Trash2, X, Check, Save } from 'lucide-react'

function JobModal({ job, workers, onClose, onSave }) {
    const [formData, setFormData] = useState(job || {
        customer_name: '',
        title: '',
        address: '',
        customer_phone: '',
        price: '',
        status: 'scheduled',
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
            <div className="data-card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{job ? 'Редактировать заявку' : 'Новая заявка'}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                        <label>Имя клиента</label>
                        <input required value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Тема/Услуга</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Адрес</label>
                        <input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>Телефон клиента</label>
                            <input value={formData.customer_phone || ''} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Цена (₽)</label>
                            <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
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
                    <div style={{ marginTop: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState(null)

    const filteredJobs = jobs.filter(job => statusFilter === 'all' || job.status === statusFilter)

    const handleUpdateStatus = async (jobId, newStatus) => {
        try {
            await api.adminUpdateJob(jobId, { status: newStatus })
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
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
            loadData() // Refresh stats
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>Управление заявками</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Все статусы</option>
                        <option value="scheduled">Ожидает</option>
                        <option value="active">В работе</option>
                        <option value="completed">Завершено</option>
                        <option value="cancelled">Отменено</option>
                    </select>
                    <button className="btn-primary" onClick={() => { setEditingJob(null); setIsModalOpen(true); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Создать заявку
                    </button>
                </div>
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
                                            <option value="scheduled">Ожидает</option>
                                            <option value="active">В работе</option>
                                            <option value="completed">Завершено</option>
                                            <option value="cancelled">Отменено</option>
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
