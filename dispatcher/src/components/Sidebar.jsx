// Premium Sidebar v2
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Briefcase, Settings, Map, Users,
    MessageSquare, Wrench, BarChart3, LogOut, User,
    ChevronRight, Zap, List as ListIcon
} from 'lucide-react'

export function Sidebar() {
    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/admin/login'
    }

    return (
        <aside className="admin-sidebar glass">
            <div className="sidebar-logo-container">
                <div className="sidebar-logo">
                    <div className="logo-box">
                        <Zap size={22} fill="white" color="white" />
                    </div>
                    <span>CoolCare <small>Pro</small></span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group-title">Основное</div>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                    <LayoutDashboard size={18} />
                    <span>Дашборд</span>
                    <ChevronRight size={14} className="nav-arrow" />
                </NavLink>

                <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Briefcase size={18} />
                    <span>Заявки</span>
                    <ChevronRight size={14} className="nav-arrow" />
                </NavLink>

                <div className="nav-group-title">Управление</div>
                <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Map size={18} />
                    <span>Карта мастеров</span>
                    <div className="nav-badge">LIVE</div>
                </NavLink>

                <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={18} />
                    <span>Чат</span>
                </NavLink>

                <NavLink to="/workers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>Мастера</span>
                </NavLink>

                <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Wrench size={18} />
                    <span>Услуги</span>
                </NavLink>

                <div className="nav-group-title">Система</div>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={18} />
                    <span>Настройки</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-card glass">
                    <div className="user-avatar">AD</div>
                    <div className="user-info">
                        <div className="user-name">Администратор</div>
                        <div className="user-role">Главный диспетчер</div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn" title="Выйти">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
