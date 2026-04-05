import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Edit, Trash2, X, Save, Search as SearchIcon } from 'lucide-react'
import { Portal } from '../components/Portal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmModal'
import { TablePagination, SortableHeader } from '../components/TableUtils'

export function Services() {
    const toast = useToast()
    const confirm = useConfirm()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingService, setEditingService] = useState(null)
    const [formData, setFormData] = useState({ name: '', price: 0 })
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadServices()
    }, [])

    const loadServices = async () => {
        try {
            const data = await api.getPredefinedServices()
            setServices(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            if (editingService) {
                await api.updatePredefinedService(editingService.id, formData)
            } else {
                await api.createPredefinedService(formData)
            }
            setIsModalOpen(false)
            setEditingService(null)
            setFormData({ name: '', price: 0 })
            loadServices()
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
        }
    }

    const handleDelete = async (id) => {
        const ok = await confirm({ title: 'Удалить услугу?', message: 'Услуга будет удалена из прайс-листа.', confirmText: 'Удалить', danger: true })
        if (!ok) return
        try {
            await api.deletePredefinedService(id)
            loadServices()
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
        }
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 15

    const sortedServices = [...filteredServices].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(sortedServices.length / ITEMS_PER_PAGE) || 1
    const paginatedServices = sortedServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
        setSortConfig({ key, direction })
    }

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    React.useEffect(() => {
        const handleOpen = () => {
            setEditingService(null)
            setFormData({ name: '', price: 0 })
            setIsModalOpen(true)
        }
        window.addEventListener('open-service-modal', handleOpen)
        return () => window.removeEventListener('open-service-modal', handleOpen)
    }, [])

    return (
        <div className="animate-fade-in" style={{ paddingTop: '24px' }}>

            <div className="glass" style={{ display: 'flex', gap: '20px', marginBottom: '32px', padding: '24px', borderRadius: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="search"
                        placeholder="Поиск по названию услуги..."
                        style={{ paddingLeft: '48px', height: '48px', width: '100%' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)', paddingRight: '12px' }}>
                    Всего услуг: <span style={{ color: 'var(--text-main)' }}>{services.length}</span>
                </div>
            </div>

            <div className="data-card glass slide-up" style={{ borderRadius: '8px' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <SortableHeader label="Название услуги" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Стоимость (₽)" sortKey="price" currentSort={sortConfig} onSort={handleSort} />
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedServices.map(service => (
                            <tr key={service.id}>
                                <td>
                                    <div className="font-semibold text-base tracking-tight">{service.name}</div>
                                    <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>ID: {service.id}</div>
                                </td>
                                <td>
                                    <div className="text-base font-semibold" style={{ color: 'var(--primary)' }}>
                                        {service.price.toLocaleString()} ₽
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button className="icon-btn info" onClick={() => {
                                            setEditingService(service)
                                            setFormData({ name: service.name, price: service.price })
                                            setIsModalOpen(true)
                                        }}>
                                            <Edit size={18} />
                                        </button>
                                        <button className="icon-btn danger" onClick={() => handleDelete(service.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredServices.length === 0 && !loading && (
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.1, marginBottom: '20px' }}><SearchIcon size={64} /></div>
                        <div className="text-xl font-semibold">Услуги не найдены</div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Попробуйте изменить параметры поиска или добавьте новую услугу</p>
                    </div>
                )}
                <TablePagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredServices.length}
                    itemName="услуг"
                />
            </div>

            {isModalOpen && (
                <Portal>
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="modal-container animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                            <div className="modal-header">
                                <div>
                                    <h3 className="modal-title">{editingService ? 'Редактировать услугу' : 'Новая услуга'}</h3>
                                    <p className="modal-subtitle">Параметры услуги в прайс-листе</p>
                                </div>
                                <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
                                <div className="input-group">
                                    <label>Название услуги</label>
                                    <input 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Напр.: Полная диагностика сплит-системы"
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Стоимость по умолчанию (₽)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.price} 
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, height: '52px' }} onClick={() => setIsModalOpen(false)}>Отмена</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, height: '52px' }}>
                                        <Save size={20} /> Сохранить услугу
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
