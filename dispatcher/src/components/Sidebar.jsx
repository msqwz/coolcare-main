import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Map, Settings, LogOut, Users } from 'lucide-react'

export function Sidebar() {
    const location = useLocation()

    const menuItems = [
        { title: 'Дашборд', icon: <LayoutDashboard size={20} />, path: '/' },
        { title: 'Заявки', icon: <Briefcase size={20} />, path: '/jobs' },
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
            <div className="sidebar-logo">
                <LayoutDashboard size={32} />
                <span>CoolCare Admin</span>
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
