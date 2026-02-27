import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { validateEmail } from '../lib/utils'

export function ProfileTab({ user, onUpdateUser, onLogout, isOnline }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [pushStatus, setPushStatus] = useState('') // '', 'loading', 'enabled', 'error', 'no_https', 'no_browser', 'no_server', 'denied'

  useEffect(() => {
    setFormData({ name: user?.name || '', email: user?.email || '' })
    setEmailError('')
  }, [user])

  const enablePush = async () => {
    if (!window.isSecureContext) {
      setPushStatus('no_https')
      return
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !navigator.serviceWorker) {
      setPushStatus('no_browser')
      return
    }
    setPushStatus('loading')
    try {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          setPushStatus('denied')
          return
        }
      } else if (Notification.permission !== 'granted') {
        setPushStatus('denied')
        return
      }
      const { vapid_public } = await api.getVapidPublic()
      const reg = await navigator.serviceWorker.ready
      if (!reg.pushManager) {
        setPushStatus('no_browser')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapid_public,
      })
      await api.pushSubscribe(sub.toJSON())
      setPushStatus('enabled')
    } catch (err) {
      console.error('Push subscribe error:', err)
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('not configured') || msg.includes('503') || msg.includes('push')) {
        setPushStatus('no_server')
      } else if (msg.includes('permission') || msg.includes('denied')) {
        setPushStatus('denied')
      } else {
        setPushStatus('error')
      }
    }
  }

  const handleSave = async () => {
    if (!isOnline) {
      setError('Нет подключения к интернету')
      return
    }
    const email = formData.email.trim()
    if (email && !validateEmail(email)) {
      setEmailError('Введите корректный email')
      return
    }
    setLoading(true)
    setError('')
    setEmailError('')
    try {
      const updated = await api.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ ...formData, email }),
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
              onChange={(e) => {
                const email = e.target.value
                setFormData({ ...formData, email })
                if (!email.trim() || validateEmail(email)) setEmailError('')
                else setEmailError('Введите корректный email')
              }}
              className={`profile-input ${emailError ? 'error' : ''}`}
            />
          ) : (
            <span className="value">{user?.email || 'Не указано'}</span>
          )}
        </div>
        {isEditing && emailError && <div className="field-error" style={{ padding: '0 18px 14px' }}>{emailError}</div>}
        <div className="profile-row">
          <span className="label">Зарегистрирован:</span>
          <span className="value">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
          </span>
        </div>
        <div className="profile-row profile-push">
          <span className="label">Уведомления:</span>
          <span className="value">
            {pushStatus === 'no_https' && 'Нужен HTTPS или localhost'}
            {pushStatus === 'no_browser' && 'Ваш браузер не поддерживает. На iOS добавьте приложение на главный экран.'}
            {pushStatus === 'no_server' && 'Сервер не настроен (VAPID ключи)'}
            {pushStatus === 'denied' && 'Разрешение отклонено'}
            {pushStatus === 'error' && 'Ошибка настройки. Проверьте консоль.'}
            {pushStatus === 'enabled' && 'Включены'}
            {pushStatus === 'loading' && 'Настройка...'}
            {['no_https', 'no_browser', 'no_server', 'denied', 'error'].includes(pushStatus) && (
              <button type="button" className="btn-small" onClick={() => setPushStatus('')} style={{ marginLeft: 8 }}>
                Повторить
              </button>
            )}
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
      {isEditing ? (
        <div className="profile-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || !isOnline || !!emailError}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      ) : (
        <div className="profile-actions" style={{ marginTop: '20px' }}>
          <button
            className="btn-primary"
            style={{ background: 'var(--danger-color)', width: '100%' }}
            onClick={onLogout}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
