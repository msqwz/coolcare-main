import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Jobs } from './pages/Jobs'
import { Workers } from './pages/Workers'
import { Map } from './pages/Map'
import { Settings } from './pages/Settings'
import { Services } from './pages/Services'
import { Marketing } from './pages/Marketing'
import { Payroll } from './pages/Payroll'
import { ToastProvider } from '@shared/components/Toast'
import { ConfirmProvider } from '@shared/components/ConfirmModal'


function ProtectedLayout({ children, requiredPermission }) {
  const { user, loading } = useAdmin()

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Загрузка...</div>
  if (!user) return <Navigate to="/login" />

  // Access control
  if (user.role === 'admin') {
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

  if (user.role === 'operator') {
    if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
      return <Navigate to="/" /> // Redirect to dashboard or first allowed page
    }
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

  // Masters or unknown roles don't belong here
  return <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter basename="/admin" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <ConfirmProvider>
          <AdminProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={
                <ProtectedLayout requiredPermission="dashboard">
                  <Dashboard />
                </ProtectedLayout>
              } />

              <Route path="/jobs" element={
                <ProtectedLayout requiredPermission="jobs">
                  <Jobs />
                </ProtectedLayout>
              } />

              <Route path="/map" element={
                <ProtectedLayout requiredPermission="map">
                  <Map />
                </ProtectedLayout>
              } />

              <Route path="/workers" element={
                <ProtectedLayout requiredPermission="workers">
                  <Workers />
                </ProtectedLayout>
              } />

              <Route path="/services" element={
                <ProtectedLayout requiredPermission="services">
                  <Services />
                </ProtectedLayout>
              } />

              <Route path="/marketing" element={
                <ProtectedLayout requiredPermission="marketing">
                  <Marketing />
                </ProtectedLayout>
              } />

              <Route path="/payroll" element={
                <ProtectedLayout requiredPermission="payroll">
                  <Payroll />
                </ProtectedLayout>
              } />

              <Route path="/settings" element={
                <ProtectedLayout requiredPermission="settings">
                  <Settings />
                </ProtectedLayout>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AdminProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
