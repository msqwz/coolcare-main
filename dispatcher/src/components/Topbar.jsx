import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Plus, Settings, LogOut, CheckCircle, Clock } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'

const PAGE_TITLES = {
  '/': 'Дашборд',
  '/jobs': 'Заявки',
  '/workers': 'Мастера',
  '/map': 'Карта',
  '/services': 'Услуги',
  '/marketing': 'Реклама',
  '/payroll': 'Зарплаты',
  '/settings': 'Настройки',
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, jobs, workers } = useAdmin()
  const title = PAGE_TITLES[location.pathname] || 'CoolCare'

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/admin/login'
  }

  const searchResults = {
      jobs: (jobs || []).filter(j => (j.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (j.phone || '').includes(searchQuery)).slice(0, 3),
      workers: (workers || []).filter(w => (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.phone || '').includes(searchQuery)).slice(0, 3)
  }

  const recentEvents = (jobs || []).slice(0, 5)
  const unreadCount = recentEvents.filter(j => j.status === 'scheduled').length

  const dropdownStyle = { position: 'absolute', top: '100%', marginTop: '8px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '8px' }
  const menuItemStyle = { padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s', fontSize: '0.875rem', fontWeight: 600 }

  return (
    <header className="admin-topbar" style={{ padding: '0 32px', borderBottom: '1px solid var(--border-color)', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', position: 'relative', zIndex: 50 }}>
      <div className="topbar-left">
        <h1 className="topbar-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>{title}</h1>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {location.pathname === '/jobs' && (
           <button className="btn-primary" onClick={() => window.dispatchEvent(new Event('open-job-modal'))} style={{ height: '36px', padding: '0 16px', borderRadius: '6px', fontSize: '0.875rem' }}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Создать заявку
           </button>
        )}
        {location.pathname === '/workers' && (
           <button className="btn-primary" onClick={() => window.dispatchEvent(new Event('open-worker-modal'))} style={{ height: '36px', padding: '0 16px', borderRadius: '6px', fontSize: '0.875rem' }}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Добавить участника
           </button>
        )}
        {location.pathname === '/services' && (
           <button className="btn-primary" onClick={() => window.dispatchEvent(new Event('open-service-modal'))} style={{ height: '36px', padding: '0 16px', borderRadius: '6px', fontSize: '0.875rem' }}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Создать услугу
           </button>
        )}

        <div className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
          <Search size={16} className="topbar-search-icon" style={{ left: '12px' }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(e.target.value.length > 0)
            }}
            onFocus={() => { if(searchQuery.length > 0) setIsSearchOpen(true) }}
            className="topbar-search-input"
            style={{ paddingLeft: '40px', background: '#f5f5f5', border: 'none', borderRadius: '6px', height: '36px', fontSize: '0.875rem' }}
          />
          {isSearchOpen && (
              <div style={{ ...dropdownStyle, left: 0, width: '300px', padding: '12px' }}>
                 {searchQuery.length > 0 && searchResults.jobs.length === 0 && searchResults.workers.length === 0 && (
                     <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ничего не найдено</div>
                 )}
                 {searchResults.jobs.length > 0 && (
                     <div style={{ marginBottom: '12px' }}>
                         <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', padding: '0 8px' }}>Заявки</div>
                         {searchResults.jobs.map(j => (
                             <div key={j.id} onClick={() => { navigate('/jobs'); setIsSearchOpen(false) }} style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                 <div>
                                     <div className="font-semibold text-sm tracking-tight">{j.customer_name || 'Без имени'}</div>
                                     <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{j.phone}</div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
                 {searchResults.workers.length > 0 && (
                     <div>
                         <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', padding: '0 8px' }}>Мастера</div>
                         {searchResults.workers.map(w => (
                             <div key={w.id} onClick={() => { navigate('/workers'); setIsSearchOpen(false) }} style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                  <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '10px', background: '#111', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(w.name||'M')[0].toUpperCase()}</div>
                                  <div className="font-semibold text-sm">{w.name || w.phone}</div>
                             </div>
                         ))}
                     </div>
                 )}
              </div>
          )}
        </div>

        <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="topbar-icon-btn" title="Уведомления" onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ background: isNotifOpen ? '#f5f5f5' : 'transparent', border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="topbar-badge" style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />}
            </button>
            {isNotifOpen && (
                <div style={{ ...dropdownStyle, right: '-10px', width: '320px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span className="font-semibold text-sm">Уведомления</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--primary)', background: 'rgba(17,17,17,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{unreadCount} новых</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                        {recentEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px' }}>Нет событий</div>
                        ) : recentEvents.map(event => (
                            <div key={event.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: event.status === 'scheduled' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: event.status === 'scheduled' ? '#3b82f6' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {event.status === 'scheduled' ? <Clock size={16} /> : <CheckCircle size={16} />}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm tracking-tight" style={{ lineHeight: 1.2 }}>
                                        {event.status === 'scheduled' ? 'Новая заявка создана' : 'Статус заявки обновлен'}
                                    </div>
                                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Заказчик: {event.customer_name || 'Без имени'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="topbar-user" ref={profileRef} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px', background: isProfileOpen ? '#f5f5f5' : 'transparent', transition: 'background 0.2s' }} onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <div className="topbar-avatar" style={{ background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <span className="topbar-user-name" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Admin'}</span>
          
          {isProfileOpen && (
              <div style={{ ...dropdownStyle, right: 0, width: '220px', padding: '8px' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <div className="font-semibold text-sm">{user?.name || 'Admin'}</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{user?.phone || ''}</div>
                  </div>
                  <div onClick={() => { navigate('/settings'); setIsProfileOpen(false) }} style={menuItemStyle} onMouseEnter={e => e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <Settings size={16} style={{ color: 'var(--text-muted)' }} /> Настройки
                  </div>
                  <div onClick={handleLogout} style={{ ...menuItemStyle, color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <LogOut size={16} /> Выйти из аккаунта
                  </div>
              </div>
          )}
        </div>
      </div>
    </header>
  )
}
