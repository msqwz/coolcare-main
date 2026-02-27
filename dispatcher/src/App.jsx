import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'

// Заглушки для других страниц
const Placeholder = ({ title }) => <div className="p-8"><h2>{title}</h2><p>Раздел в разработке...</p></div>

function ProtectedLayout({ children }) {
  const { user, loading } = useAdmin()

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Загрузка...</div>
  if (!user) return <Navigate to="/login" />

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/admin">
      <AdminProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } />

          <Route path="/jobs" element={
            <ProtectedLayout>
              <Placeholder title="Все заявки" />
            </ProtectedLayout>
          } />

          <Route path="/map" element={
            <ProtectedLayout>
              <Placeholder title="Карта мастеров" />
            </ProtectedLayout>
          } />

          <Route path="/workers" element={
            <ProtectedLayout>
              <Placeholder title="Мастера" />
            </ProtectedLayout>
          } />

          <Route path="/settings" element={
            <ProtectedLayout>
              <Placeholder title="Настройки" />
            </ProtectedLayout>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  )
}

export default App
