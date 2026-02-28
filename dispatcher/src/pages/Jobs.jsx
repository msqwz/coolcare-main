import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Search, Filter, Edit, Trash2, X, Check } from 'lucide-react'

export function Jobs() {
    const { jobs, setJobs, loadData } = useAdmin()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [editingJob, setEditingJob] = useState(null)

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            (job.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (job.address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (job.id.toString()).includes(searchTerm)

        const matchesStatus = statusFilter === 'all' || job.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleUpdateStatus = async (jobId, newStatus) => {
        try {
            await api.adminUpdateJob(jobId, { status: newStatus })
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
        } catch (e) {
            alert('Ошибка при обновлении статуса: ' + e.message)
        }
    }

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) return
        try {
            await api.adminDeleteJob(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
        } catch (e) {
            alert('Ошибка при удалении: ' + e.message)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>Управление заявками</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Поиск по клиенту, адресу..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="admin-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Все статусы</option>
                        <option value="scheduled">Ожидает</option>
                        <option value="active">В работе</option>
                        <option value="completed">Завершено</option>
                        <option value="cancelled">Отменено</option>
                    </select>
                </div>
            </div>

            <div className="data-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Клиент / Тема</th>
                            <th>Адрес</th>
                            <th>Мастер (ID)</th>
                            <th>Статус</th>
                            <th>Сумма</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredJobs.map(job => (
                            <tr key={job.id}>
                                <td>#{job.id}</td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{job.customer_name || 'Без имени'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.title || 'Без темы'}</div>
                                </td>
                                <td>{job.address}</td>
                                <td>#{job.user_id}</td>
                                <td>
                                    <select
                                        className={`status-select ${job.status}`}
                                        value={job.status}
                                        onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                                    >
                                        <option value="scheduled">Ожидает</option>
                                        <option value="active">В работе</option>
                                        <option value="completed">Завершено</option>
                                        <option value="cancelled">Отменено</option>
                                    </select>
                                </td>
                                <td>{job.price ? `${job.price} ₽` : '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button className="icon-btn danger" onClick={() => handleDeleteJob(job.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredJobs.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Заявки не найдены
                    </div>
                )}
            </div>
        </div>
    )
}
