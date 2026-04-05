import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Search, UserCheck, UserX, Shield, ShieldOff, Trash2, Plus, X, Save, Edit2 } from 'lucide-react'
import { Portal } from '../components/Portal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmModal'
import { TablePagination, SortableHeader } from '../components/TableUtils'

export function Workers() {
    const { user, workers, setWorkers } = useAdmin()
    const toast = useToast()
    const confirm = useConfirm()
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingId, setLoadingId] = useState(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingWorker, setEditingWorker] = useState(null)
    const [formData, setFormData] = useState({ name: '', phone: '', role: 'master', telegram_chat_id: '', permissions: [] })
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 15

    const filteredWorkers = (workers || []).filter(w =>
        (w.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        w.phone.includes(searchTerm)
    )

    const sortedWorkers = [...filteredWorkers].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'name') {
            aVal = a.name || a.phone || ''
            bVal = b.name || b.phone || ''
        } else if (sortConfig.key === 'role') {
            const roleOrder = { admin: 2, operator: 1, master: 0 }
            aVal = roleOrder[a.role] || 0
            bVal = roleOrder[b.role] || 0
        } else if (sortConfig.key === 'status') {
            aVal = a.is_active ? 1 : 0
            bVal = b.is_active ? 1 : 0
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(sortedWorkers.length / ITEMS_PER_PAGE) || 1
    const paginatedWorkers = sortedWorkers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
        setSortConfig({ key, direction })
    }

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    React.useEffect(() => {
        const handleOpen = () => setIsAddModalOpen(true)
        window.addEventListener('open-worker-modal', handleOpen)
        return () => window.removeEventListener('open-worker-modal', handleOpen)
    }, [])

    const handleToggleActive = async (worker) => {
        try {
            setLoadingId(worker.id)
            const newStatus = !worker.is_active
            await api.updateWorker(worker.id, { is_active: newStatus })
            setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, is_active: newStatus } : w))
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    const handleToggleRole = async (worker) => {
        try {
            const roles = ['master', 'operator', 'admin']
            const nextRole = roles[(roles.indexOf(worker.role || 'master') + 1) % roles.length]
            const ok = await confirm({ title: 'Изменить роль?', message: `Вы уверены, что хотите изменить роль пользователя на \n${nextRole.toUpperCase()}?`, confirmText: 'Изменить', danger: nextRole === 'admin' })
            if (!ok) return

            setLoadingId(worker.id)
            await api.updateWorker(worker.id, { role: nextRole })
            setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, role: nextRole } : w))
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    const handleDeleteWorker = async (worker) => {
        const ok = await confirm({ title: 'Удалить сотрудника?', message: `Вы действительно хотите БЕЗВОЗВРАТНО УДАЛИТЬ пользователя ${worker.name || worker.phone}?`, confirmText: 'Удалить', danger: true })
        if (!ok) return
        try {
            setLoadingId(worker.id)
            await api.deleteWorker(worker.id)
            setWorkers(prev => prev.filter(w => w.id !== worker.id))
        } catch (e) {
            toast.error('Ошибка при удалении: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoadingId('new')
            let phone = formData.phone
            if (!phone.startsWith('+')) phone = '+' + phone.replace(/\D/g, '')

            const newWorker = await api.createWorker({ ...formData, phone })
            setWorkers(prev => [newWorker, ...prev])
            setIsAddModalOpen(false)
            setFormData({ name: '', phone: '', role: 'master', telegram_chat_id: '', permissions: [] })
        } catch (e) {
            toast.error('Ошибка при создании: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    const openEditModal = (worker) => {
        setEditingWorker(worker)
        setFormData({
            name: worker.name || '',
            phone: worker.phone || '',
            role: worker.role || 'master',
            telegram_chat_id: worker.telegram_chat_id || '',
            permissions: worker.permissions || []
        })
        setIsEditModalOpen(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoadingId(editingWorker.id)
            let phone = formData.phone
            if (!phone.startsWith('+')) phone = '+' + phone.replace(/\D/g, '')

            await api.updateWorker(editingWorker.id, { ...formData, phone })
            setWorkers(prev => prev.map(w => w.id === editingWorker.id ? { ...w, ...formData, phone } : w))
            setIsEditModalOpen(false)
            setEditingWorker(null)
        } catch (e) {
            toast.error('Ошибка при сохранении: ' + e.message)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="animate-fade-in" style={{ paddingTop: '24px' }}>

            <div className="glass" style={{ padding: '24px', borderRadius: '8px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="search"
                        placeholder="Поиск по имени, телефону или ID..."
                        style={{ paddingLeft: '48px', height: '48px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)', paddingRight: '12px' }}>
                    Всего участников: <span style={{ color: 'var(--text-main)' }}>{workers?.length || 0}</span>
                </div>
            </div>

            <div className="data-card glass slide-up" style={{ borderRadius: '8px' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <SortableHeader label="Сотрудник" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Контакты" sortKey="phone" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Роль" sortKey="role" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Статус" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedWorkers.map(w => (
                            <tr key={w.id} style={{ opacity: loadingId === w.id ? 0.6 : 1 }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="user-avatar" style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            background: w.role === 'admin' ? '#111' : '#111',
                                            color: w.role === 'admin' ? 'white' : 'var(--text-main)'
                                        }}>
                                            {(w.name || 'M')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-base tracking-tight">{w.name || 'Не указано'}</div>
                                            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                                                ID: <span style={{ color: 'var(--primary)' }}>#{w.id}</span> • Регистрация {new Date(w.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="text-sm font-semibold">{w.phone}</div>
                                    {w.telegram_chat_id && (
                                        <div className="text-xs font-semibold" style={{ color: '#0ea5e9', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0ea5e9' }}></div> Telegram Connected
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        background: w.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                        color: w.role === 'admin' ? '#1d4ed8' : '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {w.role === 'admin' ? 'Администратор' : w.role === 'operator' ? 'Оператор' : 'Мастер'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{
                                        color: w.is_active ? '#10b981' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        <div className={`status-dot ${w.is_active ? 'online' : ''}`} style={{ background: w.is_active ? '#10b981' : '#ef4444', animation: w.is_active ? 'pulse 2s infinite' : 'none' }}></div>
                                        {w.is_active ? 'Активен' : 'Доступ ограничен'}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {user?.role === 'admin' ? (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                className="icon-btn info"
                                                onClick={() => openEditModal(w)}
                                                disabled={loadingId === w.id}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="icon-btn"
                                                style={{ color: 'var(--text-muted)' }}
                                                onClick={() => handleToggleRole(w)}
                                                disabled={loadingId === w.id}
                                                title={w.role === 'admin' ? 'Понизить роль' : 'Повысить роль'}
                                            >
                                                {w.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>
                                            <button
                                                className={`icon-btn ${w.is_active ? 'warning' : 'success'}`}
                                                onClick={() => handleToggleActive(w)}
                                                disabled={loadingId === w.id}
                                                title={w.is_active ? 'Заблокировать' : 'Разблокировать'}
                                            >
                                                {w.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDeleteWorker(w)}
                                                disabled={loadingId === w.id}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Только просмотр</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredWorkers.length === 0 && (
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.1, marginBottom: '20px' }}><Search size={64} /></div>
                        <div className="text-xl font-semibold">Команда не найдена</div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Попробуйте изменить параметры поиска</p>
                    </div>
                )}
                <TablePagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredWorkers.length}
                    itemName="участников"
                />
            </div>

            {(isAddModalOpen || isEditModalOpen) && (
                <Portal>
                    <div className="modal-overlay" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                        <div className="modal-container animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                            <div className="modal-header">
                                <div>
                                    <h3 className="modal-title">{isAddModalOpen ? 'Новый сотрудник' : 'Редактирование'}</h3>
                                    <p className="modal-subtitle">{isAddModalOpen ? 'Добавление мастера или диспетчера' : 'Изменение данных сотрудника'}</p>
                                </div>
                                <button className="icon-btn" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}><X size={20} /></button>
                            </div>

                            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
                                <div className="input-group">
                                    <label>Полное имя</label>
                                    <input
                                        type="text"
                                        placeholder="Иван Иванов"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Номер телефона</label>
                                    <input
                                        type="tel"
                                        placeholder="+7 (___) ___-__-__"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-row-2">
                                    <div className="input-group">
                                        <label>Роль в системе</label>
                                        <select
                                            className="admin-select"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="master">Мастер</option>
                                            <option value="operator">Оператор</option>
                                            <option value="admin">Администратор</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.role === 'operator' && (
                                    <div className="input-group">
                                        <label>Доступ к разделам (для оператора)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                            {[
                                                { id: 'dashboard', label: 'Дашборд' },
                                                { id: 'jobs', label: 'Заявки' },
                                                { id: 'map', label: 'Карта' },
                                                { id: 'workers', label: 'Мастера' },
                                                { id: 'services', label: 'Услуги' },
                                                { id: 'settings', label: 'Настройки' }
                                            ].map(perm => (
                                                <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.permissions?.includes(perm.id)}
                                                        onChange={e => {
                                                            const newPerms = e.target.checked 
                                                                ? [...(formData.permissions || []), perm.id]
                                                                : (formData.permissions || []).filter(p => p !== perm.id)
                                                            setFormData({ ...formData, permissions: newPerms })
                                                        }}
                                                    />
                                                    {perm.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isAddModalOpen && (
                                    <div className="glass text-xs font-semibold" style={{ padding: '16px', borderRadius: '6px', background: '#f9f9f9', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                        <strong style={{ color: 'var(--primary)' }}>Важно:</strong> Для получения уведомлений мастер должен запустить бота и передать свой Chat ID.
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, height: '52px' }} onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Отмена</button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ flex: 2, height: '52px' }}
                                        disabled={loadingId === (isAddModalOpen ? 'new' : editingWorker?.id)}
                                    >
                                        {loadingId === (isAddModalOpen ? 'new' : editingWorker?.id) ? 'Сохранение...' : <><Save size={20} /> Сохранить данные</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    )
}
