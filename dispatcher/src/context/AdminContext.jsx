import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [jobs, setJobs] = useState([])
    const [workers, setWorkers] = useState([])

    const loadData = useCallback(async () => {
        try {
            const [s, j, w] = await Promise.all([
                api.getAdminStats(),
                api.getAllJobs(),
                api.getWorkers()
            ])
            setStats(s)
            setJobs(j)
            setWorkers(w)
        } catch (e) {
            console.error('Failed to load admin data:', e)
        }
    }, [])

    const handleLogin = useCallback(async () => {
        setLoading(true)
        try {
            const u = await api.getCurrentUser()
            if (u.role !== 'admin') {
                throw new Error('У вас нет прав администратора')
            }
            setUser(u)
            await loadData()
        } catch (e) {
            console.error(e)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
        } finally {
            setLoading(false)
        }
    }, [loadData])

    useEffect(() => {
        if (user) {
            loadData()

            // Polling for real-time updates every 30 seconds
            const interval = setInterval(() => {
                loadData()
            }, 30000)

            return () => clearInterval(interval)
        }
    }, [user, loadData])

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            handleLogin()
        } else {
            setLoading(false)
        }
    }, [handleLogin])

    const value = {
        user,
        loading,
        stats,
        jobs,
        workers,
        loadData,
        handleLogin,
        setUser,
        setJobs,
        setWorkers
    }

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
    const ctx = useContext(AdminContext)
    if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
    return ctx
}
