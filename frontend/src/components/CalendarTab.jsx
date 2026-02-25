import React, { useState, useMemo } from 'react'
import { PullToRefreshWrapper } from './PullToRefreshWrapper'
import { JobCard } from './JobCard'
import { Icons } from './Icons'

function getWeekDates(centerDate) {
  const d = new Date(centerDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    dates.push(x)
  }
  return dates
}

function getJobsForDate(jobs, date) {
  const ds = date.toISOString().slice(0, 10)
  return jobs.filter((j) => j.scheduled_at && j.scheduled_at.slice(0, 10) === ds)
}

export function CalendarTab({ jobs, onSelectJob, onRefresh }) {
  const [viewMode, setViewMode] = useState('day')
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const dayJobs = useMemo(
    () => getJobsForDate(jobs, selectedDate),
    [jobs, selectedDate]
  )

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  const goPrev = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') d.setDate(d.getDate() - 1)
    else d.setDate(d.getDate() - 7)
    setSelectedDate(d)
  }

  const goNext = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') d.setDate(d.getDate() + 1)
    else d.setDate(d.getDate() + 7)
    setSelectedDate(d)
  }

  const goToday = () => {
    setSelectedDate(new Date())
  }

  const dayLabel = selectedDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const weekLabel = `${weekDates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <PullToRefreshWrapper onRefresh={onRefresh}>
      <div className="tab calendar-tab">
        <div className="calendar-header">
          <h2>Календарь</h2>
          <div className="calendar-view-toggle">
            <button
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              День
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Неделя
            </button>
          </div>
        </div>
        <div className="calendar-nav">
          <button className="btn-calendar-nav" onClick={goPrev} aria-label="Назад">
            {Icons.chevronLeft}
          </button>
          <button className="calendar-date-label" onClick={goToday}>
            {viewMode === 'day' ? dayLabel : weekLabel}
          </button>
          <button className="btn-calendar-nav" onClick={goNext} aria-label="Вперёд">
            {Icons.chevronRight}
          </button>
        </div>

        {viewMode === 'day' ? (
          <div className="calendar-day-view">
            <div className="calendar-day-jobs">
              {dayJobs.length === 0 ? (
                <p className="empty">На выбранную дату заявок нет</p>
              ) : (
                dayJobs
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  .map((job) => (
                    <JobCard key={job.id} job={job} onClick={() => onSelectJob(job)} />
                  ))
              )}
            </div>
          </div>
        ) : (
          <div className="calendar-week-view">
            <div className="calendar-week-grid">
              {weekDates.map((date) => {
                const dayJobsFor = getJobsForDate(jobs, date)
                const isToday =
                  date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={date.toISOString()}
                    className={`calendar-week-day ${isToday ? 'today' : ''}`}
                  >
                    <div className="calendar-week-day-header">
                      <span className="week-day-name">
                        {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </span>
                      <span className="week-day-num">{date.getDate()}</span>
                    </div>
                    <div className="calendar-week-day-jobs">
                      {dayJobsFor
                        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                        .slice(0, 3)
                        .map((job) => (
                          <div
                            key={job.id}
                            className="calendar-week-job"
                            onClick={() => onSelectJob(job)}
                          >
                            {job.customer_name || 'Клиент'}
                            {job.scheduled_at && (
                              <span className="calendar-week-job-time">
                                {new Date(job.scheduled_at).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        ))}
                      {dayJobsFor.length > 3 && (
                        <span className="calendar-week-more">
                          +{dayJobsFor.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PullToRefreshWrapper>
  )
}
