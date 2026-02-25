import React, { useState, useEffect } from 'react'
import { api } from '../api'

export function ProfileTab({ user, onUpdateUser, isOnline }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pushStatus, setPushStatus] = useState('') // '', 'loading', 'enabled', 'error', 'unsupported'

  useEffect(() => {
    setFormData({ name: user?.name || '', email: user?.email || '' })
  }, [user])

  const enablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported')
      return
    }
    setPushStatus('loading')
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') {
        setPushStatus('error')
        return
      }
      const { vapid_public } = await api.getVapidPublic()
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapid_public,
      })
      await api.pushSubscribe(sub.toJSON())
      setPushStatus('enabled')
    } catch (err) {
      console.error('Push subscribe error:', err)
      setPushStatus('error')
    }
  }

  const handleSave = async () => {
    if (!isOnline) {
      setError('Нет подключения к интернету')
      return
    }
    setLoading(true)
    setError('')
    try {
      const updated = await api.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      onUpdateUser(updated)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab profile-tab">
      <div className="profile-header">
        <h2>Профиль</h2>
        <button
          className="btn-small"
          onClick={() => {
            if (isEditing) {
              setFormData({ name: user?.name || '', email: user?.email || '' })
              setIsEditing(false)
            } else {
              setIsEditing(true)
            }
          }}
        >
          {isEditing ? 'Отмена' : 'Редактировать'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {!isOnline && (
        <div className="offline-banner">📡 Оффлайн — редактирование недоступно</div>
      )}
      <div className="profile-info">
        <div className="profile-row">
          <span className="label">Имя:</span>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="profile-input"
            />
          ) : (
            <span className="value">{user?.name || 'Не указано'}</span>
          )}
        </div>
        <div className="profile-row">
          <span className="label">Телефон:</span>
          <span className="value">{user?.phone}</span>
        </div>
        <div className="profile-row">
          <span className="label">Email:</span>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="profile-input"
            />
          ) : (
            <span className="value">{user?.email || 'Не указано'}</span>
          )}
        </div>
        <div className="profile-row">
          <span className="label">Зарегистрирован:</span>
          <span className="value">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
          </span>
        </div>
        <div className="profile-row profile-push">
          <span className="label">Уведомления:</span>
          <span className="value">
            {pushStatus === 'unsupported' && 'Не поддерживается'}
            {pushStatus === 'error' && 'Ошибка настройки'}
            {pushStatus === 'enabled' && 'Включены'}
            {pushStatus === 'loading' && 'Настройка...'}
            {(!pushStatus || pushStatus === '') && (
              <button
                type="button"
                className="btn-small"
                onClick={enablePush}
                disabled={!isOnline}
              >
                Включить напоминания
              </button>
            )}
          </span>
        </div>
      </div>
      {isEditing && (
        <div className="profile-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || !isOnline}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  )
}
