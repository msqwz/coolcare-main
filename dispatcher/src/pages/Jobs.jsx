import React, { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { api } from '../api'
import { Plus, Edit, Trash2, X, Save, Search as SearchIcon, CheckSquare, Square, Trash, PlusCircle, MapPin, Users, Map } from 'lucide-react'
import { PRIORITY_LIST, JOB_TYPE_LIST, STATUS_LIST, SOURCE_LIST } from '../constants'
import { Portal } from '../components/Portal'
import { AddressMapModal } from '../components/AddressMapModal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmModal'
import { TablePagination, SortableHeader } from '../components/TableUtils'

function JobModal({ job, workers, onClose, onSave }) {
    const toast = useToast()
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
        source: 'avito',
        services: [],
        user_id: (workers && workers.length > 0) ? workers[0].id : ''
    })
    const [predefinedServices, setPredefinedServices] = useState([])
    const [showMap, setShowMap] = useState(false)

    React.useEffect(() => {
        api.getPredefinedServices().then(setPredefinedServices).catch(console.error)
    }, [])

    const calcTotal = (services) => {
        return services.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)
    }

    const handleSelectPredefined = (serviceId) => {
        if (!serviceId) return
        const service = predefinedServices.find(s => s.id === parseInt(serviceId))
        if (service) {
            const newServices = [...(formData.services || []), { description: service.name, price: service.price, quantity: 1 }]
            setFormData({
                ...formData,
                services: newServices,
                price: calcTotal(newServices)
            })
        }
    }

    const addService = () => {
        const newServices = [...(formData.services || []), { description: '', price: '', quantity: 1 }]
        setFormData({
            ...formData,
            services: newServices,
            price: calcTotal(newServices)
        })
    }

    const handleServiceChange = (index, field, value) => {
        const list = [...(formData.services || [])]
        list[index][field] = value
        setFormData({ ...formData, services: list, price: calcTotal(list) })
    }

    const removeService = (index) => {
        const newServices = (formData.services || []).filter((_, i) => i !== index)
        setFormData({
            ...formData,
            services: newServices,
            price: calcTotal(newServices)
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.user_id) {
            toast.warning('Пожалуйста, выберите мастера')
            return
        }
        const dataToSave = {
            ...formData,
            price: formData.price ? parseFloat(formData.price) : 0,
            user_id: parseInt(formData.user_id) || 0,
            customer_phone: formData.customer_phone?.trim() || null,
        }
        onSave(dataToSave)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-container animate-fade-in" style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">{job ? 'Редактировать заявку' : 'Новая заявка'}</h3>
                        <p className="modal-subtitle">Заполните детали заказа и назначьте мастера</p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-section">
                        <div className="form-row-2">
                            <div className="input-group">
                                <label><Users size={12} /> Клиент</label>
                                <input required placeholder="Имя клиента" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Телефон</label>
                                <input placeholder="+7 (___) ___-__-__" value={formData.customer_phone || ''} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: '20px' }}>
                            <label><MapPin size={12} /> Адрес объекта</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input required placeholder="Укажите адрес..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ flex: 1 }} />
                                <button type="button" className="btn-secondary" onClick={() => setShowMap(true)} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}>
                                    <Map size={18} /> На карте
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-row-3">
                            <div className="input-group">
                                <label>Суть заявки</label>
                                <input required placeholder="Что нужно сделать?" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Тип услуги</label>
                                <select className="admin-select" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                    {JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Источник</label>
                                <select className="admin-select" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                                    {SOURCE_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 className="text-sm font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Список работ и запчастей</h4>
                            <button type="button" onClick={addService} className="text-xs font-semibold" style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PlusCircle size={14} /> Добавить позицию
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <select className="admin-select" style={{ flex: 1, height: '44px' }} onChange={e => handleSelectPredefined(e.target.value)} value="">
                                <option value="">Быстрый выбор услуги из прайса...</option>
                                {predefinedServices.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} — {s.price} ₽</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-grid" style={{ gap: '12px' }}>
                            {(formData.services || []).map((srv, idx) => (
                                <div key={idx} className="glass" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 48px', gap: '12px', padding: '12px', borderRadius: '8px', background: 'white' }}>
                                    <input
                                        className="checklist-input"
                                        placeholder="Описание"
                                        value={srv.description}
                                        onChange={e => handleServiceChange(idx, 'description', e.target.value)}
                                        style={{ border: 'none', background: 'var(--bg-main)' }}
                                    />
                                    <input
                                        className="checklist-input"
                                        type="number"
                                        placeholder="Цена"
                                        value={srv.price}
                                        onChange={e => handleServiceChange(idx, 'price', e.target.value)}
                                        style={{ border: 'none', background: 'var(--bg-main)' }}
                                    />
                                    <input
                                        className="checklist-input"
                                        type="number"
                                        placeholder="Кол"
                                        value={srv.quantity}
                                        onChange={e => handleServiceChange(idx, 'quantity', e.target.value)}
                                        style={{ border: 'none', background: 'var(--bg-main)' }}
                                    />
                                    <button type="button" onClick={() => removeService(idx)} className="icon-btn danger" style={{ background: 'none', width: 'auto', height: 'auto' }}><Trash size={18} /></button>
                                </div>
                            ))}
                            {(!formData.services || formData.services.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
                                    <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Список пуст. Выберите услуги из прайса или добавьте вручную.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-row-3" style={{ gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Приоритет</label>
                            <select className="admin-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                {PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Сумма к оплате (₽)</label>
                            <input 
                                type="number" 
                                value={formData.price || ''} 
                                onChange={e => setFormData({ ...formData, price: e.target.value })} 
                                disabled={formData.services && formData.services.length > 0}
                                style={formData.services && formData.services.length > 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            />
                        </div>
                        <div className="input-group">
                            <label>Дата и время визита</label>
                            <input type="datetime-local" value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-section" style={{ background: '#f9f9f9', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        <div className="input-group">
                            <label className="font-semibold" style={{ color: 'var(--primary)' }}>Назначить исполнителя</label>
                            <select required className="admin-select" style={{ background: 'white' }} value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: parseInt(e.target.value) })}>
                                <option value="">— Выбрать мастера из списка —</option>
                                { (workers || []).map(w => (
                                    <option key={w.id} value={w.id}>{w.name || w.phone}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, height: '56px' }}>Отмена</button>
                        <button type="submit" className="btn-primary" style={{ flex: 2, height: '56px' }}>
                            <Save size={20} /> {job ? 'Сохранить изменения' : 'Создать и отправить мастеру'}
                        </button>
                    </div>
                </form>

                {showMap && (
                    <AddressMapModal
                        address={formData.address}
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onSelect={(addr, lat, lng) => {
                            setFormData({ ...formData, address: addr, latitude: lat, longitude: lng })
                            setShowMap(false)
                        }}
                        onClose={() => setShowMap(false)}
                    />
                )}
            </div>
        </div>
    )
}

export function Jobs() {
    const { jobs, setJobs, workers, loadData, hasMoreJobs, loadMoreJobs } = useAdmin()
    const toast = useToast()
    const confirm = useConfirm()
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 15

    const filteredJobs = jobs.filter(job => {
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter
        const matchesSearch = !searchTerm ||
            job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.id.toString().includes(searchTerm)

        return matchesStatus && matchesSearch
    })

    const sortedJobs = [...filteredJobs].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        
        if (sortConfig.key === 'customer_name') {
            aVal = a.customer_name || ''
            bVal = b.customer_name || ''
        } else if (sortConfig.key === 'user_id') {
            aVal = workers.find(w => w.id === a.user_id)?.name || ''
            bVal = workers.find(w => w.id === b.user_id)?.name || ''
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(sortedJobs.length / ITEMS_PER_PAGE) || 1
    const paginatedJobs = sortedJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
        setSortConfig({ key, direction })
    }

    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter])

    React.useEffect(() => {
        const handleOpen = () => {
            setEditingJob(null)
            setIsModalOpen(true)
        }
        window.addEventListener('open-job-modal', handleOpen)
        return () => window.removeEventListener('open-job-modal', handleOpen)
    }, [])

    const handleUpdateStatus = async (jobId, newStatus) => {
        try {
            await api.adminUpdateJob(jobId, { status: newStatus })
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
            loadData()
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
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
            toast.error('Ошибка при сохранении: ' + e.message)
        }
    }

    const handleDeleteJob = async (jobId) => {
        const ok = await confirm({ title: 'Удалить заявку?', message: 'Эта операция необратима.', confirmText: 'Удалить', danger: true })
        if (!ok) return
        try {
            await api.adminDeleteJob(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
            loadData()
        } catch (e) {
            toast.error('Ошибка: ' + e.message)
        }
    }

    return (
        <div className="animate-fade-in" style={{ paddingTop: '24px' }}>

            <div className="glass" style={{ display: 'flex', gap: '20px', marginBottom: '32px', padding: '24px', borderRadius: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="search"
                        placeholder="Поиск по клиенту, адресу или ID..."
                        style={{ paddingLeft: '48px', height: '48px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статус:</span>
                    <select className="admin-select" style={{ minWidth: '200px', height: '48px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Все статусы</option>
                        {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="data-card glass slide-up" style={{ borderRadius: '8px' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <SortableHeader label="Клиент / Тема" sortKey="customer_name" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Адрес объекта" sortKey="address" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Тип / Прогресс" sortKey="job_type" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Исполнитель" sortKey="user_id" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Статус" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedJobs.map(job => {
                            const worker = (workers || []).find(w => w.id === job.user_id)
                            const services = job.services || []
                            const totalAmount = job.price || services.reduce((acc, s) => acc + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)

                            return (
                                <tr key={job.id}>
                                    <td>
                                        <div className="font-semibold text-base tracking-tight">{job.customer_name || 'Без имени'}</div>
                                        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                            <span style={{ color: 'var(--primary)' }}>#{job.id}</span> • {job.title}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '240px' }}>
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {job.address}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-semibold">
                                            {JOB_TYPE_LIST.find(t => t.key === job.job_type)?.label || job.job_type}
                                        </div>
                                        {services.length > 0 && (
                                            <div className="text-xs font-semibold" style={{
                                                color: 'var(--primary)',
                                                marginTop: '6px',
                                                background: '#f5f5f5',
                                                display: 'inline-flex',
                                                padding: '2px 8px',
                                                borderRadius: '8px'
                                            }}>
                                                {services.length} услуг • {totalAmount.toLocaleString()} ₽
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: '6px', fontSize: '0.7rem' }}>
                                                {(worker?.name || 'M')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold">{worker?.name || '—'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <select className={`status-select ${job.status} glass`} style={{ border: 'none', height: '36px', boxShadow: 'none' }} value={job.status} onChange={(e) => handleUpdateStatus(job.id, e.target.value)}>
                                            {STATUS_LIST.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button className="icon-btn info" onClick={() => { setEditingJob(job); setIsModalOpen(true); }}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDeleteJob(job.id)}>
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
                    <div style={{ padding: '100px 40px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.1, marginBottom: '20px' }}><SearchIcon size={64} /></div>
                        <div className="text-xl font-semibold">Ничего не найдено</div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Попробуйте изменить параметры поиска или фильтры</p>
                    </div>
                )}
                <TablePagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredJobs.length}
                    itemName="заявок"
                />
            </div>
            
            {hasMoreJobs && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="btn-secondary" onClick={loadMoreJobs} style={{ height: '44px', padding: '0 32px', borderRadius: '6px' }}>
                        Загрузить более старые заявки из базы
                    </button>
                </div>
            )}

            {isModalOpen && (
                <Portal>
                    <JobModal
                        job={editingJob}
                        workers={workers}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveJob}
                    />
                </Portal>
            )}
        </div>
    )
}
