import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Map, Settings, LogOut, Users, List as ListIcon } from 'lucide-react'

export function Sidebar() {
    const location = useLocation()

    const menuItems = [
        { title: 'Дашборд', icon: <LayoutDashboard size={20} />, path: '/' },
        { title: 'Заявки', icon: <Briefcase size={20} />, path: '/jobs' },
        { title: 'Список услуг', icon: <ListIcon size={20} />, path: '/services' },
        { title: 'Карта мастеров', icon: <Map size={20} />, path: '/map' },
        { title: 'Мастера', icon: <Users size={20} />, path: '/workers' },
        { title: 'Настройки', icon: <Settings size={20} />, path: '/settings' },
    ]

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/admin/login'
    }

    return (
        <aside className="admin-sidebar">
            <div style={{ padding: '0 18px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
                        <LayoutDashboard size={24} color="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Админ-панель</h1>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.title}</span>
                    </Link>
                ))}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button onClick={handleLogout} className="nav-item" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span>Выйти</span>
                </button>
            </div>
        </aside>
    )
}
