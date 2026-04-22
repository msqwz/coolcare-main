import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import {
    LayoutDashboard, Briefcase, Settings, Map, Users,
    Wrench, ChevronRight, Zap, Megaphone, DollarSign
} from 'lucide-react'

export function Sidebar() {
    const { user } = useAdmin()

    // Helper to check if user has access to a specific key
    const hasAccess = (permKey) => {
        if (!user) return false
        if (user.role === 'admin') return true
        if (user.role === 'operator') {
            return user.permissions?.includes(permKey)
        }
        return false // Masters shouldn't be in the admin panel by default
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
                {hasAccess('dashboard') && (
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                        <LayoutDashboard size={18} />
                        <span>Дашборд</span>
                        <ChevronRight size={14} className="nav-arrow" />
                    </NavLink>
                )}

                {hasAccess('jobs') && (
                    <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Briefcase size={18} />
                        <span>Заявки</span>
                        <ChevronRight size={14} className="nav-arrow" />
                    </NavLink>
                )}

                {(hasAccess('map') || hasAccess('workers') || hasAccess('services') || hasAccess('marketing') || hasAccess('payroll')) && <div className="nav-group-title">Управление</div>}
                
                {hasAccess('map') && (
                    <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Map size={18} />
                        <span>Карта</span>
                        <ChevronRight size={14} className="nav-arrow" />
                    </NavLink>
                )}

                {hasAccess('workers') && (
                    <NavLink to="/workers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={18} />
                        <span>Мастера</span>
                    </NavLink>
                )}

                {hasAccess('services') && (
                    <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Wrench size={18} />
                        <span>Услуги</span>
                    </NavLink>
                )}

                {hasAccess('marketing') && (
                    <NavLink to="/marketing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Megaphone size={18} />
                        <span>Реклама</span>
                    </NavLink>
                )}

                {hasAccess('payroll') && (
                    <NavLink to="/payroll" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <DollarSign size={18} />
                        <span>Зарплаты</span>
                        <ChevronRight size={14} className="nav-arrow" />
                    </NavLink>
                )}

                {hasAccess('settings') && (
                    <>
                        <div className="nav-group-title">Система</div>
                        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Settings size={18} />
                            <span>Настройки</span>
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    )
}
