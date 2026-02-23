import React, { useState, useEffect, useRef } from 'react'
import './App.css'

const API_URL = window.location.origin

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token')
    const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...options.headers }
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
    if (response.status === 401) { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); window.location.reload(); throw new Error('Unauthorized') }
    if (!response.ok) { const error = await response.json().catch(() => ({ detail: 'Request failed' })); throw new Error(error.detail || 'Request failed') }
    return response.json()
  },
  async sendCode(phone) { return this.request('/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) }) },
  async verifyCode(phone, code) { return this.request('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }) },
  async getCurrentUser() { return this.request('/auth/me') },
  async getDashboardStats() { return this.request('/dashboard/stats') },
  async getTodayJobs() { return this.request('/jobs/today') },
  async getJobs(status) { return this.request(`/jobs${status ? '?status=' + status : ''}`) },
  async getJob(id) { return this.request(`/jobs/${id}`) },
  async createJob(job) { return this.request('/jobs', { method: 'POST', body: JSON.stringify(job) }) },
  async updateJob(id, job) { return this.request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) }) },
  async deleteJob(id) { return this.request(`/jobs/${id}`, { method: 'DELETE' }) },
}

function validatePhone(phone) { const cleaned = phone.replace(/[\s\-\(\)]/g, ''); return /^\+?[0-9]{10,15}$/.test(cleaned) }
function formatPhone(phone) { const cleaned = phone.replace(/[\s\-\(\)]/g, ''); if (cleaned.startsWith('8')) return '+7' + cleaned.slice(1); if (cleaned.startsWith('7')) return '+' + cleaned; return cleaned }

const STATUS_LIST = [
  { key: 'scheduled', label: 'Назначена', color: '#0066cc' },
  { key: 'active', label: 'В работе', color: '#28a745' },
  { key: 'completed', label: 'Выполнена', color: '#6c757d' }
]

const PRIORITY_LIST = [
  { key: 'low', label: 'Низкий', color: '#dfe6e9' },
  { key: 'medium', label: 'Средний', color: '#ffeaa7' },
  { key: 'high', label: 'Высокий', color: '#fdcb6e' },
  { key: 'urgent', label: 'Срочный', color: '#fab1a0' }
]

const JOB_TYPE_LIST = [
  { key: 'repair', label: 'Ремонт' },
  { key: 'installation', label: 'Установка' },
  { key: 'diagnostics', label: 'Диагностика' },
  { key: 'maintenance', label: 'Обслуживание' }
]

const Icons = {
  home: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  jobs: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>),
  map: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>),
  profile: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>),
  back: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>),
  chevron: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>)
}

function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState(''), [code, setCode] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState(''), [debugCode, setDebugCode] = useState(''), [step, setStep] = useState('phone')
  const handleSendCode = async (e) => { e.preventDefault(); if (!validatePhone(phone)) { setError('Неверный формат'); return }; setLoading(true); setError(''); try { const result = await api.sendCode(formatPhone(phone)); setDebugCode(result.debug_code || '000000'); setStep('code') } catch (err) { setError(err.message) } finally { setLoading(false) } }
  const handleVerifyCode = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { const tokens = await api.verifyCode(formatPhone(phone), code); localStorage.setItem('access_token', tokens.access_token); localStorage.setItem('refresh_token', tokens.refresh_token); onLogin() } catch (err) { setError(err.message) } finally { setLoading(false) } }
  return (
    <div className="login-screen"><div className="login-container"><h1>CoolCare Мастер</h1><p className="subtitle">Приложение для мастеров</p>
      {step === 'phone' ? (<form onSubmit={handleSendCode} className="login-form"><div className="form-group"><label>Номер телефона</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 000-00-00" required /></div>{error && <div className="error">{error}</div>}<button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Отправка...' : 'Получить код'}</button></form>) : (<form onSubmit={handleVerifyCode} className="login-form"><div className="form-group"><label>Код из SMS</label><input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} required /></div>{debugCode && (<div className="debug-code"><p>Ваш код: <strong>{debugCode}</strong></p></div>)}<button type="button" className="btn-link" onClick={() => { setStep('phone'); setDebugCode('') }}>Изменить номер</button>{error && <div className="error">{error}</div>}<button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Проверка...' : 'Войти'}</button></form>)}
    </div></div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false), [user, setUser] = useState(null), [loading, setLoading] = useState(true), [activeTab, setActiveTab] = useState('home'), [selectedJob, setSelectedJob] = useState(null), [showJobForm, setShowJobForm] = useState(false), [jobs, setJobs] = useState([]), [stats, setStats] = useState(null), [todayJobs, setTodayJobs] = useState([])
  useEffect(() => { const token = localStorage.getItem('access_token'); if (token) { api.getCurrentUser().then((userData) => { setUser(userData); setIsAuthenticated(true); loadStats(); loadTodayJobs(); loadJobs() }).catch(() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') }).finally(() => setLoading(false)) } else { setLoading(false) } }, [])
  const loadStats = async () => { try { const statsData = await api.getDashboardStats(); setStats(statsData) } catch (err) { console.error(err) } }
  const loadTodayJobs = async () => { try { const todayJobsData = await api.getTodayJobs(); setTodayJobs(todayJobsData) } catch (err) { console.error(err) } }
  const loadJobs = async () => { try { const jobsData = await api.getJobs(); setJobs(jobsData) } catch (err) { console.error(err) } }
  const handleLogin = () => { setIsAuthenticated(true); api.getCurrentUser().then(setUser).catch(console.error); loadStats(); loadTodayJobs(); loadJobs() }, handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); setIsAuthenticated(false); setUser(null); setJobs([]); setStats(null); setTodayJobs([]) }, handleUpdateUser = (updated) => { setUser(updated) }
  if (loading) return <div className="loading">Загрузка...</div>
  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />
  return (
    <div className="app">
      <header className="app-header">{selectedJob || showJobForm ? (<div className="header-with-back"><button className="btn-back" onClick={() => { setSelectedJob(null); setShowJobForm(false) }}>{Icons.back}</button><h1>{selectedJob ? 'Заявка' : showJobForm ? 'Новая заявка' : 'CoolCare'}</h1></div>) : (<h1>CoolCare</h1>)}<div className="user-info"><span>{user?.name || user?.phone}</span><button onClick={handleLogout} className="btn-small">Выйти</button></div></header>
      <main className="app-main">{selectedJob ? (<JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setSelectedJob(j); loadJobs() }} onDelete={() => { setSelectedJob(null); loadJobs() }} />) : showJobForm ? (<JobForm onClose={() => setShowJobForm(false)} onCreated={() => { setShowJobForm(false); loadJobs(); loadStats(); loadTodayJobs() }} />) : (<>{activeTab === 'home' && <HomeTab stats={stats} todayJobs={todayJobs} onSelectJob={setSelectedJob} />}{activeTab === 'jobs' && <JobsTab onSelectJob={setSelectedJob} onShowForm={() => setShowJobForm(true)} jobs={jobs} setJobs={setJobs} />}{activeTab === 'map' && <MapTab jobs={jobs} />}{activeTab === 'profile' && <ProfileTab user={user} onUpdateUser={handleUpdateUser} />}</>)}</main>
      {!selectedJob && !showJobForm && (<nav className="bottom-nav"><div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="nav-icon">{Icons.home}</span><span className="nav-label">Главная</span></div><div className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}><span className="nav-icon">{Icons.jobs}</span><span className="nav-label">Заявки</span></div><div className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}><span className="nav-icon">{Icons.map}</span><span className="nav-label">Карта</span></div><div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span className="nav-icon">{Icons.profile}</span><span className="nav-label">Профиль</span></div></nav>)}
    </div>
  )
}

function JobsTab({ onSelectJob, onShowForm, jobs, setJobs }) {
  const [filter, setFilter] = useState('')
  const filteredJobs = filter ? jobs.filter(j => j.status === filter) : jobs
  return (
    <div className="tab jobs-tab"><div className="tab-header"><h2>Заявки</h2><button className="btn-primary btn-add" onClick={onShowForm}>+ Новая</button></div><div className="filter-bar"><button className={filter === '' ? 'active' : ''} onClick={() => setFilter('')}>Все</button><button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>Ожидают</button><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>В работе</button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Завершены</button></div><div className="jobs-list">{filteredJobs.length === 0 ? <p className="empty">Нет заявок</p> : filteredJobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />)}</div></div>
  )
}

function HomeTab({ stats, todayJobs, onSelectJob }) {
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  
  const statCards = [
    { label: 'Всего заявок', value: stats?.total_jobs || 0, color: '#0066cc', icon: '📋' },
    { label: 'На сегодня', value: stats?.today_jobs || 0, color: '#28a745', icon: '📅' },
    { label: 'В работе', value: stats?.active_jobs || 0, color: '#ffc107', icon: '🔧' },
    { label: 'Завершено', value: stats?.completed_jobs || 0, color: '#6c757d', icon: '✅' }
  ]

  return (
    <div className="tab home-tab">
      <div className="home-header">
        <h2>Главная</h2>
        <p className="home-date">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ '--stat-color': stat.color }}>
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {stats?.today_revenue > 0 && (
        <div className="revenue-card">
          <span className="revenue-label">Выручка сегодня</span>
          <span className="revenue-value">{stats.today_revenue} ₽</span>
        </div>
      )}

      <div className="today-jobs-section">
        <div className="section-header">
          <h3>Заявки на сегодня</h3>
          <span className="section-count">{todayJobs.length}</span>
        </div>
        <div className="today-jobs-list">
          {todayJobs.length === 0 ? (
            <p className="empty">На сегодня заявок нет</p>
          ) : (
            todayJobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function JobCard({ job, onClick }) {
  const statusConfig = STATUS_LIST.find(s => s.key === job.status) || STATUS_LIST[0], priority = job.priority || 'medium', priorityConfig = PRIORITY_LIST.find(p => p.key === priority) || PRIORITY_LIST[1]
  return (
    <div className="job-card-new" onClick={onClick}><div className="job-card-header"><div className="job-card-tags"><span className="job-card-tag status-tag" style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}>{statusConfig.label}</span><span className="job-card-tag priority-tag" style={{ backgroundColor: priorityConfig.color + '40', color: priorityConfig.color }}>{priorityConfig.label}</span></div><span className="job-card-type">{JOB_TYPE_LIST.find(t => t.key === job.job_type)?.label || 'Заявка'}</span></div><h3 className="job-card-title">{job.customer_name || 'Клиент не указан'}</h3><div className="job-card-info"><div className="job-card-info-row"><span className="job-card-info-icon">📍</span><span className="job-card-info-text">{job.address || 'Адрес не указан'}</span></div><div className="job-card-info-row"><span className="job-card-info-icon">🕐</span><span className="job-card-info-text">{new Date(job.scheduled_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div></div></div>
  )
}

function JobDetail({ job, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: job.customer_name || '',
    description: job.description || '',
    notes: job.notes || '',
    address: job.address || '',
    customer_phone: job.customer_phone || '',
    scheduled_at: job.scheduled_at ? new Date(job.scheduled_at).toISOString().slice(0, 16) : '',
    price: job.price || '',
    latitude: job.latitude,
    longitude: job.longitude,
    status: job.status || 'scheduled',
    priority: job.priority || 'medium',
    job_type: job.job_type || 'repair'
  })
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (newStatus === job.status) return
    setLoading(true)
    try {
      const updated = await api.updateJob(job.id, { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
      onUpdate(updated)
      setFormData({ ...formData, status: newStatus })
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await api.updateJob(job.id, formData)
      onUpdate(updated)
      setIsEditing(false)
    } catch (err) { 
      alert('Ошибка сохранения: ' + err.message)
    }
    finally { setLoading(false) }
  }

  const handleDelete = async () => { if (confirm('Удалить?')) { await api.deleteJob(job.id); onClose() } }
  const handleAddressSelect = (address, lat, lng) => { setFormData({ ...formData, address, latitude: lat, longitude: lng }); setShowMap(false) }
  const statusConfig = STATUS_LIST.find(s => s.key === formData.status) || STATUS_LIST[0]
  const priorityConfig = PRIORITY_LIST.find(p => p.key === formData.priority) || PRIORITY_LIST[1]

  return (
    <div className="job-detail-page">
      <div className="job-detail-header">
        <div className="job-detail-tags">
          <span className="job-detail-tag" style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}>{statusConfig.label}</span>
          <span className="job-detail-tag" style={{ backgroundColor: priorityConfig.color + '40', color: priorityConfig.color }}>{priorityConfig.label}</span>
        </div>
        <span className="job-detail-type">{JOB_TYPE_LIST.find(t => t.key === formData.job_type)?.label || 'Заявка'}</span>
      </div>

      {isEditing ? (
        <div className="job-detail-form">
          <div className="form-group">
            <label>Имя клиента *</label>
            <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Иван Иванов" required />
          </div>
          <div className="form-group">
            <label>Адрес *</label>
            <div className="address-input-group">
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Введите адрес" required />
              <button className="btn-map-select" onClick={() => setShowMap(true)} type="button">📍 Карта</button>
            </div>
          </div>
          <div className="form-group">
            <label>Заметки</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Комментарии" rows={2} />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Приоритет</label>
            <div className="dropdown-wrapper">
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="dropdown-select">
                {PRIORITY_LIST.map(p => (<option key={p.key} value={p.key}>{p.label}</option>))}
              </select>
              <span className="dropdown-icon">{Icons.chevron}</span>
            </div>
          </div>
          <div className="form-group">
            <label>Тип заявки</label>
            <div className="dropdown-wrapper">
              <select value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })} className="dropdown-select">
                {JOB_TYPE_LIST.map(t => (<option key={t.key} value={t.key}>{t.label}</option>))}
              </select>
              <span className="dropdown-icon">{Icons.chevron}</span>
            </div>
          </div>
          <div className="form-group">
            <label>Дата</label>
            <input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Цена</label>
            <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            <button className="btn-secondary" onClick={() => setIsEditing(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <div className="job-detail-content">
          <h2 className="job-detail-title">{job.customer_name || 'Клиент'}</h2>
          <div className="job-detail-section">
            <h3 className="job-detail-section-title">Информация</h3>
            <div className="job-detail-row">
              <span className="job-detail-label">📍 Адрес:</span>
              <span className="job-detail-value">{job.address || 'Не указан'}</span>
            </div>
            {job.notes && (
              <div className="job-detail-row">
                <span className="job-detail-label">📝 Заметки:</span>
                <span className="job-detail-value">{job.notes}</span>
              </div>
            )}
            {job.customer_phone && (
              <div className="job-detail-row">
                <span className="job-detail-label">📞 Телефон:</span>
                <span className="job-detail-value">{job.customer_phone}</span>
              </div>
            )}
            <div className="job-detail-row">
              <span className="job-detail-label">📅 Дата:</span>
              <span className="job-detail-value">{new Date(job.scheduled_at).toLocaleString('ru-RU')}</span>
            </div>
          </div>
          {job.description && (
            <div className="job-detail-section">
              <h3 className="job-detail-section-title">Описание</h3>
              <p className="job-detail-description">{job.description}</p>
            </div>
          )}
          {job.price && (
            <div className="job-detail-section">
              <h3 className="job-detail-section-title">Стоимость</h3>
              <div className="job-detail-row">
                <span className="job-detail-label">💰 Цена:</span>
                <span className="job-detail-value job-detail-price">{job.price} ₽</span>
              </div>
            </div>
          )}
          {job.status !== 'completed' && job.status !== 'cancelled' && (
            <div className="job-detail-section">
              <h3 className="job-detail-section-title">Статус</h3>
              <div className="status-buttons">
                {STATUS_LIST.map((status, i) => (
                  <button key={status.key} className={`status-btn ${i <= STATUS_LIST.findIndex(s => s.key === job.status) ? 'active' : ''} ${i === STATUS_LIST.findIndex(s => s.key === job.status) ? 'current' : ''}`} style={{ '--status-color': status.color }} onClick={() => handleStatusChange(status.key)} disabled={i < STATUS_LIST.findIndex(s => s.key === job.status) || loading}>
                    <span className="status-btn-icon">{i < STATUS_LIST.findIndex(s => s.key === job.status) ? '✓' : i === STATUS_LIST.findIndex(s => s.key === job.status) ? '●' : '○'}</span>
                    <span className="status-btn-label">{status.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="job-detail-actions">
            <button className="btn-edit-full" onClick={() => setIsEditing(true)}>✏️ Редактировать</button>
            <button className="btn-delete-full" onClick={handleDelete}>🗑 Удалить</button>
          </div>
        </div>
      )}
      {showMap && <AddressMapModal address={formData.address} latitude={formData.latitude} longitude={formData.longitude} onSelect={handleAddressSelect} onClose={() => setShowMap(false)} />}
    </div>
  )
}

function JobForm({ onClose, onCreated }) {
  const [formData, setFormData] = useState({ customer_name: '', description: '', notes: '', address: '', customer_phone: '', scheduled_at: '', price: '', status: 'scheduled', priority: 'medium', job_type: 'repair', latitude: null, longitude: null })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Введите имя'
    if (!formData.address.trim()) newErrors.address = 'Введите адрес'
    if (formData.customer_phone && !validatePhone(formData.customer_phone)) newErrors.customer_phone = 'Неверный номер'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.createJob(formData)
      onCreated()
    } catch (err) {
      alert('Ошибка создания: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = (address, lat, lng) => { setFormData({ ...formData, address, latitude: lat, longitude: lng }); setShowMap(false) }

  return (
    <div className="job-form-page">
      <form className="job-form-full" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя клиента *</label>
          <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Иван Иванов" className={errors.customer_name ? 'error' : ''} required />
          {errors.customer_name && <span className="field-error">{errors.customer_name}</span>}
        </div>
        <div className="form-group">
          <label>Адрес *</label>
          <div className="address-input-group">
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Введите адрес" className={errors.address ? 'error' : ''} required />
            <button className="btn-map-select" type="button" onClick={() => setShowMap(true)}>📍 Карта</button>
          </div>
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>
        <div className="form-group">
          <label>Заметки</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Комментарии" rows={2} />
        </div>
        <div className="form-group">
          <label>Телефон</label>
          <input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} className={errors.customer_phone ? 'error' : ''} />
          {errors.customer_phone && <span className="field-error">{errors.customer_phone}</span>}
        </div>
        <div className="form-group">
          <label>Приоритет</label>
          <div className="dropdown-wrapper">
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="dropdown-select">
              {PRIORITY_LIST.map(p => (<option key={p.key} value={p.key}>{p.label}</option>))}
            </select>
            <span className="dropdown-icon">{Icons.chevron}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Тип заявки</label>
          <div className="dropdown-wrapper">
            <select value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })} className="dropdown-select">
              {JOB_TYPE_LIST.map(t => (<option key={t.key} value={t.key}>{t.label}</option>))}
            </select>
            <span className="dropdown-icon">{Icons.chevron}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Дата</label>
          <input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Цена</label>
          <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Описание</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
        </div>
      </form>
      {showMap && <AddressMapModal address={formData.address} latitude={formData.latitude} longitude={formData.longitude} onSelect={handleAddressSelect} onClose={() => setShowMap(false)} />}
    </div>
  )
}

function AddressMapModal({ address, latitude, longitude, onSelect, onClose }) {
  const [selectedAddress, setSelectedAddress] = useState(address || ''), [selectedLat, setSelectedLat] = useState(latitude || 55.76), [selectedLng, setSelectedLng] = useState(longitude || 37.64), mapRef = useRef(null), mapInstance = useRef(null), placemarkRef = useRef(null)
  useEffect(() => {
    if (!window.ymaps || !mapRef.current) return
    const initMap = () => {
      mapInstance.current = new window.ymaps.Map(mapRef.current, { center: [selectedLat, selectedLng], zoom: 14, controls: ['zoomControl', 'fullscreenControl'] })
      placemarkRef.current = new window.ymaps.Placemark([selectedLat, selectedLng], { balloonContent: selectedAddress || 'Точка' }, { draggable: true, preset: 'isDotIcon', iconColor: '#0066cc' })
      mapInstance.current.geoObjects.add(placemarkRef.current)
      placemarkRef.current.events.add('dragend', () => {
        const coords = placemarkRef.current.geometry.getCoordinates()
        setSelectedLat(coords[0])
        setSelectedLng(coords[1])
        window.ymaps.geocode(coords).then((res) => { const first = res.geoObjects.get(0); if (first) setSelectedAddress(first.getAddressLine()) })
      })
      mapInstance.current.events.add('click', (e) => {
        const coords = e.get('coords')
        placemarkRef.current.geometry.setCoordinates(coords)
        setSelectedLat(coords[0])
        setSelectedLng(coords[1])
        window.ymaps.geocode(coords).then((res) => { const first = res.geoObjects.get(0); if (first) setSelectedAddress(first.getAddressLine()) })
      })
    }
    if (window.ymaps.ready) { window.ymaps.ready(initMap) } else { const script = document.createElement('script'); script.src = 'https://api-maps.yandex.ru/2.1/?apikey=e1a186ee-6741-4e3f-b7f4-438ed8c61c4b&lang=ru_RU'; script.onload = () => { if (window.ymaps.ready) window.ymaps.ready(initMap) }; document.head.appendChild(script) }
  }, [])
  const handleSelect = () => { onSelect(selectedAddress, selectedLat, selectedLng) }
  return (
    <div className="modal-overlay" onClick={onClose}><div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Адрес на карте</h2><button className="btn-close" onClick={onClose}>✕</button></div><div className="map-modal-body"><div className="selected-address-display"><span>📍 {selectedAddress || 'Перетащите метку'}</span><span className="coords-display">{selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}</span></div><div ref={mapRef} className="map-select-container" /><div className="map-modal-actions"><button className="btn-secondary" onClick={onClose}>Отмена</button><button className="btn-primary" onClick={handleSelect}>Выбрать</button></div></div></div></div>
  )
}

function MapTab({ jobs }) {
  const mapRef = useRef(null), mapInstance = useRef(null), mapReady = useRef(false)
  useEffect(() => {
    if (!window.ymaps) {
      const script = document.createElement('script')
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=e1a186ee-6741-4e3f-b7f4-438ed8c61c4b&lang=ru_RU'
      script.async = true
      script.onload = () => { if (window.ymaps.ready) { mapReady.current = true; initMap() } }
      document.head.appendChild(script)
    } else { mapReady.current = true; initMap() }
  }, [])
  const initMap = () => { if (!mapRef.current || mapInstance.current) return; mapInstance.current = new window.ymaps.Map(mapRef.current, { center: [55.76, 37.64], zoom: 10, controls: ['zoomControl', 'fullscreenControl'] }) }
  useEffect(() => {
    if (!mapInstance.current || !mapReady.current) return
    mapInstance.current.geoObjects.removeAll()
    jobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return
      const placemark = new window.ymaps.Placemark([job.latitude, job.longitude], { balloonContent: `<div style="padding:12px;"><strong>${job.customer_name || job.title}</strong><br><span style="color:#666;">${job.address}</span></div>` }, { preset: 'isDotIcon', iconColor: STATUS_LIST.find(s => s.key === job.status)?.color || '#666' })
      mapInstance.current.geoObjects.add(placemark)
    })
    if (jobs.filter(j => j.latitude && j.longitude).length > 0) { mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 }) }
  }, [jobs])
  return (
    <div className="tab map-tab"><div className="map-header"><h2>Карта</h2><span className="map-stats">{jobs.filter(j => j.scheduled_at && new Date(j.scheduled_at).toDateString() === new Date().toDateString()).length} заявок сегодня</span></div><div ref={mapRef} className="map-container" />{jobs.filter(j => j.latitude && j.longitude).length === 0 && <p className="empty">Нет координат</p>}</div>
  )
}

function ProfileTab({ user, onUpdateUser }) {
  const [isEditing, setIsEditing] = useState(false), [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' }), [loading, setLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => { setFormData({ name: user?.name || '', email: user?.email || '' }) }, [user])
  const handleSave = async () => { setLoading(true); setError(''); try { const updated = await api.request('/auth/me', { method: 'PUT', body: JSON.stringify(formData) }); onUpdateUser(updated); setIsEditing(false) } catch (err) { setError(err.message) } finally { setLoading(false) } }
  return (
    <div className="tab profile-tab"><div className="profile-header"><h2>Профиль</h2><button className="btn-small" onClick={() => { if (isEditing) { setFormData({ name: user?.name || '', email: user?.email || '' }); setIsEditing(false) } else { setIsEditing(true) } }}>{isEditing ? 'Отмена' : 'Редактировать'}</button></div>{error && <div className="error">{error}</div>}<div className="profile-info"><div className="profile-row"><span className="label">Имя:</span>{isEditing ? <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="profile-input" /> : <span className="value">{user?.name || 'Не указано'}</span>}</div><div className="profile-row"><span className="label">Телефон:</span><span className="value">{user?.phone}</span></div><div className="profile-row"><span className="label">Email:</span>{isEditing ? <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="profile-input" /> : <span className="value">{user?.email || 'Не указано'}</span>}</div><div className="profile-row"><span className="label">Зарегистрирован:</span><span className="value">{new Date(user?.created_at).toLocaleDateString('ru-RU')}</span></div></div>{isEditing && <div className="profile-actions"><button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button></div>}</div>
  )
}
