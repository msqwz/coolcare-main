import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Bell, Search, User } from 'lucide-react'

export function Topbar() {
    const { user } = useAdmin()

    return (
        <header className="admin-topbar">
            <div className="topbar-search" style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                    type="text"
                    placeholder="Поиск по заявкам..."
                    style={{ padding: '8px 16px 8px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px' }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    <Bell size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || 'Администратор'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.role}</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                        <User size={24} style={{ margin: '0 auto' }} />
                    </div>
                </div>
            </div>
        </header>
    )
}
