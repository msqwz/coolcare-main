import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import {
  cacheJobs, getCachedJobs, cacheJob, removeCachedJob,
  cacheStats, getCachedStats,
  cacheUser, getCachedUser, clearUserCache,
  addToSyncQueue, processSyncQueue
} from './offlineStorage'

const API_URL = window.location.origin
const YANDEX_MAPS_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || 'e1a186ee-6741-4e3f-b7f4-438ed8c61c4b'

// Ростов-на-Дону — центр карт по умолчанию
const DEFAULT_CENTER = [47.2357, 39.7015]

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
  async verifyCode(phone, code) { return this.request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) }) },
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
  home: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
  jobs: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>),
  map: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>),
  profile: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>),
  back: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>),
  chevron: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>),
  offline: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" /></svg>),
  sync: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>),
}

// ==================== Pull to Refresh ====================

function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef(null)
  const threshold = 80

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!pulling) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120))
      if (diff > 10) e.preventDefault()
    }
  }, [pulling])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && onRefresh) {
      setRefreshing(true)
      try { await onRefresh() } catch (e) { console.error(e) }
      setRefreshing(false)
    }
    setPulling(false)
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return { containerRef, pullDistance, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd }
}

function PullToRefreshWrapper({ onRefresh, children }) {
  const { containerRef, pullDistance, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(onRefresh)

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ position: 'relative', minHeight: '100%' }}>
      {(pullDistance > 0 || refreshing) && (
        <div className="pull-indicator" style={{ height: pullDistance > 0 ? pullDistance : 50, opacity: refreshing ? 1 : Math.min(pullDistance / 80, 1) }}>
          <div className={`pull-spinner ${refreshing ? 'spinning' : ''}`}>
            {refreshing ? '🔄' : pullDistance >= 80 ? '⬆️' : '⬇️'}
          </div>
          <span className="pull-text">{refreshing ? 'Обновление...' : pullDistance >= 80 ? 'Отпустите' : 'Потяните вниз'}</span>
        </div>
      )}
      <div style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none', transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  )
}

// ==================== Хук онлайн-статуса ====================

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [])
  return isOnline
}

// ==================== Login ====================

function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState(''), [code, setCode] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState(''), [debugCode, setDebugCode] = useState(''), [step, setStep] = useState('phone')
  const isOnline = useOnlineStatus()

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!isOnline) { setError('Нет подключения к интернету'); return }
    if (!validatePhone(phone)) { setError('Неверный формат телефона'); return }
    setLoading(true); setError('')
    try {
      const result = await api.sendCode(formatPhone(phone))
      if (result.debug_code) setDebugCode(result.debug_code)
      setStep('code')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!isOnline) { setError('Нет подключения к интернету'); return }
    if (!code || code.length < 4) { setError('Введите полный код'); return }
    setLoading(true); setError('')
    try {
      const tokens = await api.verifyCode(formatPhone(phone), code)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      onLogin()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>❄️ CoolCare</h1>
        <p className="subtitle">Приложение для мастеров</p>
        {!isOnline && <div className="offline-banner">📡 Нет подключения — вход невозможен</div>}
        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="login-form">
            <div className="form-group"><label>Номер телефона</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 000-00-00" required /></div>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading || !isOnline}>{loading ? 'Отправка...' : 'Получить код'}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="form-group"><label>Код из SMS</label><input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" maxLength={6} required autoFocus /></div>
            {debugCode && (<div className="debug-code"><p>Ваш код: <strong>{debugCode}</strong></p></div>)}
            <button type="button" className="btn-link" onClick={() => { setStep('phone'); setDebugCode(''); setCode('') }}>← Изменить номер</button>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading || !isOnline}>{loading ? 'Проверка...' : 'Войти'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

// ==================== App ====================

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false), [user, setUser] = useState(null), [loading, setLoading] = useState(true), [activeTab, setActiveTab] = useState('home'), [selectedJob, setSelectedJob] = useState(null), [showJobForm, setShowJobForm] = useState(false), [jobs, setJobs] = useState([]), [stats, setStats] = useState(null), [todayJobs, setTodayJobs] = useState([])
  const [syncing, setSyncing] = useState(false)
  const isOnline = useOnlineStatus()

  useEffect(() => { if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(console.error) } }, [])

  useEffect(() => { if (isOnline && isAuthenticated) syncOfflineActions() }, [isOnline, isAuthenticated])

  const syncOfflineActions = async () => {
    setSyncing(true)
    try {
      const result = await processSyncQueue(api.request.bind(api))
      if (result.synced > 0) { loadJobs(); loadStats(); loadTodayJobs() }
    } catch (err) { console.error('Sync error:', err) }
    finally { setSyncing(false) }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      if (navigator.onLine) {
        api.getCurrentUser().then((u) => { setUser(u); cacheUser(u); setIsAuthenticated(true); loadStats(); loadTodayJobs(); loadJobs() }).catch(() => loadFromCache()).finally(() => setLoading(false))
      } else { loadFromCache().finally(() => setLoading(false)) }
    } else { setLoading(false) }
  }, [])

  const loadFromCache = async () => {
    try {
      const cachedUser = await getCachedUser()
      if (cachedUser) { setUser(cachedUser); setIsAuthenticated(true) }
      const cachedStats = await getCachedStats()
      if (cachedStats) setStats(cachedStats)
      const cachedJobs = await getCachedJobs()
      if (cachedJobs.length > 0) { setJobs(cachedJobs); const today = new Date().toISOString().slice(0, 10); setTodayJobs(cachedJobs.filter(j => j.scheduled_at && j.scheduled_at.slice(0, 10) === today)) }
    } catch (err) { console.error('Cache load error:', err) }
  }

  const loadStats = async () => { try { const d = await api.getDashboardStats(); setStats(d); cacheStats(d) } catch (e) { const c = await getCachedStats(); if (c) setStats(c) } }
  const loadTodayJobs = async () => { try { setTodayJobs(await api.getTodayJobs()) } catch (e) { console.error(e) } }
  const loadJobs = async () => { try { const d = await api.getJobs(); setJobs(d); cacheJobs(d) } catch (e) { const c = await getCachedJobs(); if (c.length > 0) setJobs(c) } }

  const handleRefresh = async () => { await Promise.all([loadStats(), loadTodayJobs(), loadJobs()]) }

  const handleLogin = () => { setIsAuthenticated(true); api.getCurrentUser().then((u) => { setUser(u); cacheUser(u) }).catch(console.error); loadStats(); loadTodayJobs(); loadJobs() }
  const handleLogout = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); clearUserCache(); setIsAuthenticated(false); setUser(null); setJobs([]); setStats(null); setTodayJobs([]) }
  const handleUpdateUser = (updated) => { setUser(updated); cacheUser(updated) }

  if (loading) return <div className="loading">Загрузка...</div>
  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="app">
      <header className="app-header">
        {selectedJob || showJobForm ? (
          <div className="header-with-back"><button className="btn-back" onClick={() => { setSelectedJob(null); setShowJobForm(false) }}>{Icons.back}</button><h1>{selectedJob ? 'Заявка' : 'Новая заявка'}</h1></div>
        ) : <h1>❄️ CoolCare</h1>}
        <div className="user-info">
          {!isOnline && <span className="offline-indicator" title="Оффлайн">{Icons.offline}</span>}
          {syncing && <span className="sync-indicator" title="Синхронизация...">{Icons.sync}</span>}
          <span>{user?.name || user?.phone}</span>
          <button onClick={handleLogout} className="btn-small">Выйти</button>
        </div>
      </header>
      <main className="app-main">
        {selectedJob ? (
          <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setSelectedJob(j); loadJobs() }} onDelete={() => { setSelectedJob(null); loadJobs() }} isOnline={isOnline} />
        ) : showJobForm ? (
          <JobForm onClose={() => setShowJobForm(false)} onCreated={() => { setShowJobForm(false); loadJobs(); loadStats(); loadTodayJobs() }} isOnline={isOnline} />
        ) : (
          <>
            {activeTab === 'home' && <HomeTab stats={stats} todayJobs={todayJobs} onSelectJob={setSelectedJob} isOnline={isOnline} onRefresh={handleRefresh} />}
            {activeTab === 'jobs' && <JobsTab onSelectJob={setSelectedJob} onShowForm={() => setShowJobForm(true)} jobs={jobs} onRefresh={handleRefresh} />}
            {activeTab === 'map' && <MapTab jobs={jobs} />}
            {activeTab === 'profile' && <ProfileTab user={user} onUpdateUser={handleUpdateUser} isOnline={isOnline} />}
          </>
        )}
      </main>
      {!selectedJob && !showJobForm && (
        <nav className="bottom-nav">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="nav-icon">{Icons.home}</span><span className="nav-label">Главная</span></div>
          <div className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}><span className="nav-icon">{Icons.jobs}</span><span className="nav-label">Заявки</span></div>
          <div className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}><span className="nav-icon">{Icons.map}</span><span className="nav-label">Карта</span></div>
          <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span className="nav-icon">{Icons.profile}</span><span className="nav-label">Профиль</span></div>
        </nav>
      )}
    </div>
  )
}

// ==================== Tabs ====================

function HomeTab({ stats, todayJobs, onSelectJob, isOnline, onRefresh }) {
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const statCards = [
    { label: 'Всего заявок', value: stats?.total_jobs || 0, color: '#0066cc', icon: '📋' },
    { label: 'На сегодня', value: stats?.today_jobs || 0, color: '#28a745', icon: '📅' },
    { label: 'В работе', value: stats?.active_jobs || 0, color: '#ffc107', icon: '🔧' },
    { label: 'Завершено', value: stats?.completed_jobs || 0, color: '#6c757d', icon: '✅' }
  ]

  return (
    <PullToRefreshWrapper onRefresh={onRefresh}>
      <div className="tab home-tab">
        <div className="home-header">
          <h2>Главная</h2>
          <p className="home-date">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        </div>
        {!isOnline && <div className="offline-banner">📡 Оффлайн — данные из кэша</div>}
        <div className="stats-grid">
          {statCards.map((stat, i) => (
            <div key={i} className="stat-card" style={{ '--stat-color': stat.color }}>
              <div className="stat-card-icon">{stat.icon}</div>
              <div className="stat-card-info"><span className="stat-card-value">{stat.value}</span><span className="stat-card-label">{stat.label}</span></div>
            </div>
          ))}
        </div>
        {stats?.today_revenue > 0 && (<div className="revenue-card"><span className="revenue-label">Выручка сегодня</span><span className="revenue-value">{stats.today_revenue} ₽</span></div>)}
        <div className="today-jobs-section">
          <div className="section-header"><h3>Заявки на сегодня</h3><span className="section-count">{todayJobs.length}</span></div>
          <div className="today-jobs-list">
            {todayJobs.length === 0 ? <p className="empty">На сегодня заявок нет</p> : todayJobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />)}
          </div>
        </div>
      </div>
    </PullToRefreshWrapper>
  )
}

function JobsTab({ onSelectJob, onShowForm, jobs, onRefresh }) {
  const [filter, setFilter] = useState('')
  const filteredJobs = filter ? jobs.filter(j => j.status === filter) : jobs
  return (
    <PullToRefreshWrapper onRefresh={onRefresh}>
      <div className="tab jobs-tab">
        <div className="tab-header"><h2>Заявки</h2><button className="btn-primary btn-add" onClick={onShowForm}>+ Новая</button></div>
        <div className="filter-bar">
          <button className={filter === '' ? 'active' : ''} onClick={() => setFilter('')}>Все</button>
          <button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>Ожидают</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>В работе</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Завершены</button>
        </div>
        <div className="jobs-list">{filteredJobs.length === 0 ? <p className="empty">Нет заявок</p> : filteredJobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />)}</div>
      </div>
    </PullToRefreshWrapper>
  )
}

function JobCard({ job, onClick }) {
  const statusConfig = STATUS_LIST.find(s => s.key === job.status) || STATUS_LIST[0]
  const priorityConfig = PRIORITY_LIST.find(p => p.key === (job.priority || 'medium')) || PRIORITY_LIST[1]
  return (
    <div className="job-card-new" onClick={onClick}>
      <div className="job-card-header">
        <div className="job-card-tags">
          <span className="job-card-tag status-tag" style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}>{statusConfig.label}</span>
          <span className="job-card-tag priority-tag" style={{ backgroundColor: priorityConfig.color + '40', color: priorityConfig.color }}>{priorityConfig.label}</span>
        </div>
        <span className="job-card-type">{JOB_TYPE_LIST.find(t => t.key === job.job_type)?.label || 'Заявка'}</span>
      </div>
      <h3 className="job-card-title">{job.customer_name || 'Клиент не указан'}</h3>
      <div className="job-card-info">
        <div className="job-card-info-row"><span className="job-card-info-icon">📍</span><span className="job-card-info-text">{job.address || 'Адрес не указан'}</span></div>
        {job.scheduled_at && <div className="job-card-info-row"><span className="job-card-info-icon">🕐</span><span className="job-card-info-text">{new Date(job.scheduled_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>}
      </div>
    </div>
  )
}

// ==================== Job Detail ====================

function JobDetail({ job, onClose, onUpdate, onDelete, isOnline }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: job.customer_name || '',
    description: job.description || '',
    notes: job.notes || '',
    address: job.address || '',
    customer_phone: job.customer_phone || '',
    scheduled_at: job.scheduled_at ? toLocalDatetime(job.scheduled_at) : '',
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
    const updateData = { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
    try {
      if (isOnline) { const updated = await api.updateJob(job.id, updateData); onUpdate(updated); cacheJob(updated) }
      else { await addToSyncQueue({ type: 'UPDATE_JOB', jobId: job.id, data: updateData }); const updated = { ...job, ...updateData }; onUpdate(updated); cacheJob(updated) }
      setFormData({ ...formData, status: newStatus })
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setLoading(true)
    const saveData = { ...formData }
    // Конвертируем дату в ISO для API
    if (saveData.scheduled_at) saveData.scheduled_at = new Date(saveData.scheduled_at).toISOString()
    try {
      if (isOnline) { const updated = await api.updateJob(job.id, saveData); onUpdate(updated); cacheJob(updated) }
      else { await addToSyncQueue({ type: 'UPDATE_JOB', jobId: job.id, data: saveData }); const updated = { ...job, ...saveData }; onUpdate(updated); cacheJob(updated) }
      setIsEditing(false)
    } catch (err) { alert('Ошибка сохранения: ' + err.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить заявку?')) return
    try {
      if (isOnline) { await api.deleteJob(job.id) } else { await addToSyncQueue({ type: 'DELETE_JOB', jobId: job.id }) }
      removeCachedJob(job.id); onClose()
    } catch (err) { alert(err.message) }
  }

  const handleAddressSelect = (address, lat, lng) => { setFormData({ ...formData, address, latitude: lat, longitude: lng }); setShowMap(false) }
  const statusConfig = STATUS_LIST.find(s => s.key === formData.status) || STATUS_LIST[0]
  const priorityConfig = PRIORITY_LIST.find(p => p.key === formData.priority) || PRIORITY_LIST[1]

  return (
    <div className="job-detail-page">
      {!isOnline && <div className="offline-banner">📡 Оффлайн — изменения синхронизируются позже</div>}
      <div className="job-detail-header">
        <div className="job-detail-tags">
          <span className="job-detail-tag" style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}>{statusConfig.label}</span>
          <span className="job-detail-tag" style={{ backgroundColor: priorityConfig.color + '40', color: priorityConfig.color }}>{priorityConfig.label}</span>
        </div>
        <span className="job-detail-type">{JOB_TYPE_LIST.find(t => t.key === formData.job_type)?.label || 'Заявка'}</span>
      </div>

      {isEditing ? (
        <div className="job-detail-form">
          <div className="form-group"><label>Имя клиента *</label><input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Иван Иванов" required /></div>
          <div className="form-group"><label>Адрес *</label><div className="address-input-group"><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Введите адрес" required /><button className="btn-map-select" onClick={() => setShowMap(true)} type="button">📍 Карта</button></div></div>
          <div className="form-group"><label>Заметки</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Комментарии" rows={2} /></div>
          <div className="form-group"><label>Телефон клиента</label><input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} /></div>
          <div className="form-group"><label>Приоритет</label><div className="dropdown-wrapper"><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="dropdown-select">{PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select><span className="dropdown-icon">{Icons.chevron}</span></div></div>
          <div className="form-group"><label>Тип заявки</label><div className="dropdown-wrapper"><select value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })} className="dropdown-select">{JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select><span className="dropdown-icon">{Icons.chevron}</span></div></div>
          <div className="form-group"><label>Дата и время</label><input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} min="2024-01-01T00:00" max="2030-12-31T23:59" /></div>
          <div className="form-group"><label>Цена (₽)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0" /></div>
          <div className="form-group"><label>Описание работ</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
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
            <div className="job-detail-row"><span className="job-detail-label">📍 Адрес:</span><span className="job-detail-value">{job.address || 'Не указан'}</span></div>
            {job.notes && <div className="job-detail-row"><span className="job-detail-label">📝 Заметки:</span><span className="job-detail-value">{job.notes}</span></div>}
            {job.customer_phone && <div className="job-detail-row"><span className="job-detail-label">📞 Телефон:</span><a href={`tel:${job.customer_phone}`} className="job-detail-value" style={{ color: 'var(--primary-color)' }}>{job.customer_phone}</a></div>}
            {job.scheduled_at && <div className="job-detail-row"><span className="job-detail-label">📅 Дата:</span><span className="job-detail-value">{new Date(job.scheduled_at).toLocaleString('ru-RU')}</span></div>}
          </div>
          {job.description && <div className="job-detail-section"><h3 className="job-detail-section-title">Описание</h3><p className="job-detail-description">{job.description}</p></div>}
          {job.price && <div className="job-detail-section"><h3 className="job-detail-section-title">Стоимость</h3><div className="job-detail-row"><span className="job-detail-label">💰 Цена:</span><span className="job-detail-value job-detail-price">{job.price} ₽</span></div></div>}
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

// ==================== Job Form ====================

/** Конвертирует ISO/datetime строку в формат для datetime-local input */
function toLocalDatetime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

function JobForm({ onClose, onCreated, isOnline }) {
  const [formData, setFormData] = useState({
    customer_name: '', description: '', notes: '', address: '', customer_phone: '',
    scheduled_at: '', price: '', status: 'scheduled', priority: 'medium',
    job_type: 'repair', latitude: null, longitude: null
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Введите имя клиента'
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
      const submitData = { ...formData }
      // Конвертируем дату в ISO
      if (submitData.scheduled_at) submitData.scheduled_at = new Date(submitData.scheduled_at).toISOString()
      if (isOnline) { await api.createJob(submitData) }
      else {
        const tempJob = { ...submitData, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: 0, _offline: true }
        await cacheJob(tempJob)
        await addToSyncQueue({ type: 'CREATE_JOB', data: submitData })
      }
      onCreated()
    } catch (err) { alert('Ошибка создания: ' + err.message) }
    finally { setLoading(false) }
  }

  const handleAddressSelect = (address, lat, lng) => { setFormData({ ...formData, address, latitude: lat, longitude: lng }); setShowMap(false) }

  return (
    <div className="job-form-page">
      {!isOnline && <div className="offline-banner">📡 Оффлайн — заявка синхронизируется позже</div>}
      <form className="job-form-full" onSubmit={handleSubmit}>
        <div className="form-group"><label>Имя клиента *</label><input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Иван Иванов" className={errors.customer_name ? 'error' : ''} required />{errors.customer_name && <span className="field-error">{errors.customer_name}</span>}</div>
        <div className="form-group"><label>Адрес *</label><div className="address-input-group"><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="ул. Пушкинская, 10" className={errors.address ? 'error' : ''} required /><button className="btn-map-select" type="button" onClick={() => setShowMap(true)}>📍</button></div>{errors.address && <span className="field-error">{errors.address}</span>}</div>
        <div className="form-group"><label>Заметки</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Комментарии к заявке" rows={2} /></div>
        <div className="form-group"><label>Телефон клиента</label><input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} placeholder="+7 (999) 000-00-00" className={errors.customer_phone ? 'error' : ''} />{errors.customer_phone && <span className="field-error">{errors.customer_phone}</span>}</div>
        <div className="form-group"><label>Приоритет</label><div className="dropdown-wrapper"><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="dropdown-select">{PRIORITY_LIST.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select><span className="dropdown-icon">{Icons.chevron}</span></div></div>
        <div className="form-group"><label>Тип заявки</label><div className="dropdown-wrapper"><select value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })} className="dropdown-select">{JOB_TYPE_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select><span className="dropdown-icon">{Icons.chevron}</span></div></div>
        <div className="form-group"><label>Дата и время</label><input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} min="2024-01-01T00:00" max="2030-12-31T23:59" /></div>
        <div className="form-group"><label>Цена (₽)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0" min="0" /></div>
        <div className="form-group"><label>Описание работ</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Описание работ" rows={2} /></div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Создание...' : isOnline ? 'Создать заявку' : 'Создать (оффлайн)'}</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
        </div>
      </form>
      {showMap && <AddressMapModal address={formData.address} latitude={formData.latitude} longitude={formData.longitude} onSelect={handleAddressSelect} onClose={() => setShowMap(false)} />}
    </div>
  )
}

// ==================== Map ====================

function loadYandexMaps() {
  return new Promise((resolve) => {
    if (window.ymaps) { if (window.ymaps.ready) window.ymaps.ready(resolve); else resolve(); return }
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_KEY}&lang=ru_RU`
    script.async = true
    script.onload = () => { if (window.ymaps && window.ymaps.ready) window.ymaps.ready(resolve); else resolve() }
    document.head.appendChild(script)
  })
}

function AddressMapModal({ address, latitude, longitude, onSelect, onClose }) {
  const initLat = latitude || DEFAULT_CENTER[0]
  const initLng = longitude || DEFAULT_CENTER[1]
  const [selectedAddress, setSelectedAddress] = useState(address || '')
  const [selectedLat, setSelectedLat] = useState(initLat)
  const [selectedLng, setSelectedLng] = useState(initLng)
  const mapRef = useRef(null), mapInstance = useRef(null), placemarkRef = useRef(null)

  useEffect(() => {
    loadYandexMaps().then(() => {
      if (!mapRef.current || mapInstance.current) return
      mapInstance.current = new window.ymaps.Map(mapRef.current, { center: [selectedLat, selectedLng], zoom: 14, controls: ['zoomControl', 'fullscreenControl'] })
      placemarkRef.current = new window.ymaps.Placemark([selectedLat, selectedLng], { balloonContent: selectedAddress || 'Точка' }, { draggable: true, preset: 'islands#blueCircleDotIcon' })
      mapInstance.current.geoObjects.add(placemarkRef.current)
      const updateAddress = (coords) => {
        setSelectedLat(coords[0]); setSelectedLng(coords[1])
        window.ymaps.geocode(coords).then((res) => { const first = res.geoObjects.get(0); if (first) setSelectedAddress(first.getAddressLine()) })
      }
      placemarkRef.current.events.add('dragend', () => updateAddress(placemarkRef.current.geometry.getCoordinates()))
      mapInstance.current.events.add('click', (e) => { const coords = e.get('coords'); placemarkRef.current.geometry.setCoordinates(coords); updateAddress(coords) })
    })
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>Адрес на карте</h2><button className="btn-close" onClick={onClose}>✕</button></div>
        <div className="map-modal-body">
          <div className="selected-address-display"><span>📍 {selectedAddress || 'Нажмите на карту или перетащите метку'}</span><span className="coords-display">{selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}</span></div>
          <div ref={mapRef} className="map-select-container" />
          <div className="map-modal-actions"><button className="btn-secondary" onClick={onClose}>Отмена</button><button className="btn-primary" onClick={() => onSelect(selectedAddress, selectedLat, selectedLng)}>Выбрать</button></div>
        </div>
      </div>
    </div>
  )
}

function MapTab({ jobs }) {
  const mapRef = useRef(null), mapInstance = useRef(null)
  useEffect(() => {
    loadYandexMaps().then(() => {
      if (!mapRef.current || mapInstance.current) return
      mapInstance.current = new window.ymaps.Map(mapRef.current, { center: DEFAULT_CENTER, zoom: 11, controls: ['zoomControl', 'fullscreenControl'] })
    })
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.geoObjects.removeAll()
    const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude)
    jobsWithCoords.forEach((job) => {
      const placemark = new window.ymaps.Placemark([job.latitude, job.longitude], { balloonContent: `<div style="padding:12px"><strong>${job.customer_name || job.title || 'Заявка'}</strong><br><span style="color:#666">${job.address || ''}</span></div>` }, { preset: 'islands#blueCircleDotIcon', iconColor: STATUS_LIST.find(s => s.key === job.status)?.color || '#666' })
      mapInstance.current.geoObjects.add(placemark)
    })
    if (jobsWithCoords.length > 1) { mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 }) }
  }, [jobs])

  const todayCount = jobs.filter(j => j.scheduled_at && new Date(j.scheduled_at).toDateString() === new Date().toDateString()).length
  return (
    <div className="tab map-tab">
      <div className="map-header"><h2>Карта</h2><span className="map-stats">{todayCount} заявок сегодня</span></div>
      <div ref={mapRef} className="map-container" />
      {jobs.filter(j => j.latitude && j.longitude).length === 0 && <p className="empty">Нет заявок с координатами</p>}
    </div>
  )
}

// ==================== Profile ====================

function ProfileTab({ user, onUpdateUser, isOnline }) {
  const [isEditing, setIsEditing] = useState(false), [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' }), [loading, setLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => { setFormData({ name: user?.name || '', email: user?.email || '' }) }, [user])

  const handleSave = async () => {
    if (!isOnline) { setError('Нет подключения к интернету'); return }
    setLoading(true); setError('')
    try { const updated = await api.request('/auth/me', { method: 'PUT', body: JSON.stringify(formData) }); onUpdateUser(updated); setIsEditing(false) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="tab profile-tab">
      <div className="profile-header"><h2>Профиль</h2><button className="btn-small" onClick={() => { if (isEditing) { setFormData({ name: user?.name || '', email: user?.email || '' }); setIsEditing(false) } else setIsEditing(true) }}>{isEditing ? 'Отмена' : 'Редактировать'}</button></div>
      {error && <div className="error">{error}</div>}
      {!isOnline && <div className="offline-banner">📡 Оффлайн — редактирование недоступно</div>}
      <div className="profile-info">
        <div className="profile-row"><span className="label">Имя:</span>{isEditing ? <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="profile-input" /> : <span className="value">{user?.name || 'Не указано'}</span>}</div>
        <div className="profile-row"><span className="label">Телефон:</span><span className="value">{user?.phone}</span></div>
        <div className="profile-row"><span className="label">Email:</span>{isEditing ? <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="profile-input" /> : <span className="value">{user?.email || 'Не указано'}</span>}</div>
        <div className="profile-row"><span className="label">Зарегистрирован:</span><span className="value">{user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}</span></div>
      </div>
      {isEditing && <div className="profile-actions"><button className="btn-primary" onClick={handleSave} disabled={loading || !isOnline}>{loading ? 'Сохранение...' : 'Сохранить'}</button></div>}
    </div>
  )
}
