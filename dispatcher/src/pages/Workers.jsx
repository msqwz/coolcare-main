import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Search, UserCheck, UserX, Shield, ShieldOff } from 'lucide-react'

export function Workers() {
    const { workers, setWorkers } = useAdmin()
    const [searchTerm, setSearchTerm] = useState('')

    const filteredWorkers = (workers || []).filter(w =>
        (w.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        w.phone.includes(searchTerm)
    )

    const handleToggleActive = async (worker) => {
        try {
            const newStatus = !worker.is_active
            await api.updateWorker(worker.id, { is_active: newStatus })
            setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, is_active: newStatus } : w))
        } catch (e) {
            alert('Ошибка: ' + e.message)
        }
    }

    const handleToggleRole = async (worker) => {
        try {
            const newRole = worker.role === 'admin' ? 'master' : 'admin'
            if (!window.confirm(`Вы уверены, что хотите сделать пользователя ${newRole === 'admin' ? 'АДМИНИСТРАТОРОМ' : 'МАСТЕРОМ'}?`)) return

            await api.updateWorker(worker.id, { role: newRole })
            setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, role: newRole } : w))
        } catch (e) {
            alert('Ошибка: ' + e.message)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>Управление мастерами</h2>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по имени или телефону..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="data-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Телефон</th>
                            <th>Роль</th>
                            <th>Статус</th>
                            <th>Дата регистрации</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map(w => (
                            <tr key={w.id}>
                                <td>#{w.id}</td>
                                <td style={{ fontWeight: '600' }}>{w.name || 'Не указано'}</td>
                                <td>{w.phone}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: w.role === 'admin' ? '#fef3c7' : '#f1f5f9',
                                        color: w.role === 'admin' ? '#92400e' : '#475569'
                                    }}>
                                        {w.role === 'admin' ? 'Админ' : 'Мастер'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        color: w.is_active ? '#10b981' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.875rem'
                                    }}>
                                        {w.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                                        {w.is_active ? 'Активен' : 'Заблокирован'}
                                    </span>
                                </td>
                                <td>{new Date(w.created_at).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button
                                            className={`icon-btn ${w.role === 'admin' ? 'warning' : 'info'}`}
                                            title={w.role === 'admin' ? 'Сделать мастером' : 'Сделать админом'}
                                            onClick={() => handleToggleRole(w)}
                                        >
                                            {w.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                        </button>
                                        <button
                                            className={`icon-btn ${w.is_active ? 'danger' : 'success'}`}
                                            title={w.is_active ? 'Заблокировать' : 'Разблокировать'}
                                            onClick={() => handleToggleActive(w)}
                                        >
                                            {w.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
