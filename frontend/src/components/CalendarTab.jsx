import React, { useEffect, useMemo, useState } from 'react'
import { PullToRefreshWrapper } from './PullToRefreshWrapper'
import { JobCard } from './JobCard'
import { Icons } from './Icons'

const DAY_TRACKER_STORAGE_KEY = 'coolcare_calendar_day_tracker_v1'

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateKeyFromIso(isoString) {
  const dt = new Date(isoString)
  if (Number.isNaN(dt.getTime())) return null
  return toDateKey(dt)
}

function loadDayTracker() {
  try {
    const raw = localStorage.getItem(DAY_TRACKER_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getDayType(date, tracker) {
  const key = toDateKey(date)
  return tracker[key] || (isWeekend(date) ? 'weekend' : 'workday')
}

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
  const ds = toDateKey(date)
  return jobs.filter((j) => j.scheduled_at && toDateKeyFromIso(j.scheduled_at) === ds)
}

export function CalendarTab({ jobs, onSelectJob, onAddressClick, onRefresh }) {
  const [viewMode, setViewMode] = useState('day')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [dayTracker, setDayTracker] = useState(loadDayTracker)
  const [dateInput, setDateInput] = useState(() => toDateKey(new Date()))

  useEffect(() => {
    localStorage.setItem(DAY_TRACKER_STORAGE_KEY, JSON.stringify(dayTracker))
  }, [dayTracker])

  useEffect(() => {
    setDateInput(toDateKey(selectedDate))
  }, [selectedDate])

  const dayJobs = useMemo(
    () => getJobsForDate(jobs, selectedDate),
    [jobs, selectedDate]
  )

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const selectedDayType = getDayType(selectedDate, dayTracker)

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
    const now = new Date()
    setSelectedDate(now)
    setDateInput(toDateKey(now))
  }

  const dayLabel = selectedDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const weekLabel = `${weekDates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const setSelectedDayType = (type) => {
    const key = toDateKey(selectedDate)
    setDayTracker((prev) => ({ ...prev, [key]: type }))
  }

  const dayStats = useMemo(() => {
    const total = dayJobs.length
    const completed = dayJobs.filter((j) => j.status === 'completed').length
    const active = dayJobs.filter((j) => j.status === 'active').length
    const scheduled = dayJobs.filter((j) => j.status === 'scheduled').length
    return { total, completed, active, scheduled }
  }, [dayJobs])

  const handleDatePick = () => {
    if (!dateInput) return
    const [y, m, d] = dateInput.split('-').map(Number)
    const nextDate = new Date(y, m - 1, d)
    if (Number.isNaN(nextDate.getTime())) return
    setSelectedDate(nextDate)
  }

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
        <div className="calendar-date-search">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
          <button type="button" className="btn-small" onClick={handleDatePick}>
            Перейти к дате
          </button>
        </div>
        <div className="calendar-day-type-toggle">
          <span className={`calendar-day-badge ${selectedDayType}`}>
            {selectedDayType === 'workday' ? 'Рабочий день' : 'Выходной'}
          </span>
          <div className="calendar-day-type-buttons">
            <button
              type="button"
              className={selectedDayType === 'workday' ? 'active' : ''}
              onClick={() => setSelectedDayType('workday')}
            >
              Рабочий
            </button>
            <button
              type="button"
              className={selectedDayType === 'weekend' ? 'active' : ''}
              onClick={() => setSelectedDayType('weekend')}
            >
              Выходной
            </button>
          </div>
        </div>
        <div className="calendar-summary-grid">
          <div className="calendar-summary-card">
            <span>На дату</span>
            <strong>{dayStats.total}</strong>
          </div>
          <div className="calendar-summary-card">
            <span>В работе</span>
            <strong>{dayStats.active}</strong>
          </div>
          <div className="calendar-summary-card">
            <span>Ожидают</span>
            <strong>{dayStats.scheduled}</strong>
          </div>
          <div className="calendar-summary-card">
            <span>Завершено</span>
            <strong>{dayStats.completed}</strong>
          </div>
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
        ) : (
          <div className="calendar-week-view">
            <div className="calendar-week-grid">
              {weekDates.map((date) => {
                const dayJobsFor = getJobsForDate(jobs, date)
                const isToday =
                  date.toDateString() === new Date().toDateString()
                const dayType = getDayType(date, dayTracker)
                return (
                  <div
                    key={date.toISOString()}
                    className={`calendar-week-day ${isToday ? 'today' : ''} ${dayType === 'weekend' ? 'weekend' : 'workday'}`}
                  >
                    <div className="calendar-week-day-header">
                      <span className="week-day-name">
                        {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </span>
                      <span className="week-day-num">{date.getDate()}</span>
                      <span className={`calendar-week-day-type ${dayType}`}>
                        {dayType === 'workday' ? 'Раб.' : 'Вых.'}
                      </span>
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
