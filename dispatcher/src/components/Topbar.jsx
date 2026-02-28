import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { Bell, Search, User } from 'lucide-react'

export function Topbar() {
    const { user } = useAdmin()

    return (
        <header className="admin-topbar">
            <div style={{ flex: 1 }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

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
