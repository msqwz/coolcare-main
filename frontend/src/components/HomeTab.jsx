import React from 'react'
import { PullToRefreshWrapper } from './PullToRefreshWrapper'
import { JobCard } from './JobCard'

export function HomeTab({ stats, todayJobs, onSelectJob, onAddressClick, isOnline, onRefresh }) {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const statCards = [
    { label: 'Всего заявок', value: stats?.total_jobs || 0, color: '#0066cc', icon: '📋' },
    { label: 'На сегодня', value: stats?.today_jobs || 0, color: '#28a745', icon: '📅' },
    { label: 'В работе', value: stats?.active_jobs || 0, color: '#ffc107', icon: '🔧' },
    { label: 'Завершено', value: stats?.completed_jobs || 0, color: '#6c757d', icon: '✅' },
  ]

  return (
    <PullToRefreshWrapper onRefresh={onRefresh}>
      <div className="tab home-tab">
        <div className="home-header">
          <h2>Главная</h2>
          <p className="home-date">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        </div>
        {!isOnline && (
          <div className="offline-banner">📡 Оффлайн — данные из кэша</div>
        )}
        <div className="stats-grid">
          {statCards.map((stat, i) => (
            <div key={i} className="stat-card" style={{ '--stat-color': stat.color }}>
              <div className="stat-card-icon">{stat.icon}</div>
              <div className="stat-card-info">
                <span className="stat-card-value">{stat.value}</span>
                <span className="stat-card-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
        {stats?.today_revenue > 0 && (
          <div className="revenue-card">
            <span className="revenue-label">Выручка сегодня</span>
            <span className="revenue-value">{stats.today_revenue} ₽</span>
          </div>
        )}
        <div className="today-jobs-section">
          <div className="section-header">
            <h3>Заявки на сегодня</h3>
            <span className="section-count">{todayJobs.length}</span>
          </div>
          <div className="today-jobs-list">
            {todayJobs.length === 0 ? (
              <p className="empty">На сегодня заявок нет</p>
            ) : (
              todayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => onSelectJob(job)}
                  onAddressClick={onAddressClick}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </PullToRefreshWrapper>
  )
}
