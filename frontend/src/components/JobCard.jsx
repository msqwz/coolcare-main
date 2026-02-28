import React from 'react'
import { STATUS_LIST, PRIORITY_LIST, JOB_TYPE_LIST } from '../constants'

export function JobCard({ job, onClick, onAddressClick }) {
  const statusConfig = STATUS_LIST.find((s) => s.key === job.status) || STATUS_LIST[0]
  const priorityConfig =
    PRIORITY_LIST.find((p) => p.key === (job.priority || 'medium')) || PRIORITY_LIST[1]
  return (
    <div className="job-card-new" onClick={onClick}>
      <div className="job-card-header">
        <div className="job-card-tags">
          <span
            className="job-card-tag status-tag"
            style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
          <span
            className="job-card-tag priority-tag"
            style={{ backgroundColor: priorityConfig.color + '40', color: priorityConfig.color }}
          >
            {priorityConfig.label}
          </span>
        </div>
        <span className="job-card-type">
          {JOB_TYPE_LIST.find((t) => t.key === job.job_type)?.label || 'Заявка'}
        </span>
      </div>
      <h3 className="job-card-title">{job.customer_name || 'Клиент не указан'}</h3>
      <div className="job-card-info">
        <div className="job-card-info-row">
          <span className="job-card-info-icon">📍</span>
          {job.address ? (
            <button
              type="button"
              className="job-card-address-link"
              onClick={(e) => {
                e.stopPropagation()
                onAddressClick?.(job)
              }}
            >
              {job.address}
            </button>
          ) : (
            <span className="job-card-info-text">Адрес не указан</span>
          )}
        </div>
        {job.scheduled_at && (
          <div className="job-card-info-row">
            <span className="job-card-info-icon">🕐</span>
            <span className="job-card-info-text">
              {new Date(job.scheduled_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
        <div className="job-card-info-row" style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-color)', fontWeight: '500' }}>Стоимость:</span>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {(job.price || (job.services || []).reduce((acc, s) => acc + (parseFloat(s.price) || 0) * (parseInt(s.quantity) || 1), 0)).toLocaleString()} ₽
          </span>
        </div>
      </div>
    </div>
  )
}
