import React, { useEffect, useMemo, useState } from 'react'
import { PullToRefreshWrapper } from './PullToRefreshWrapper'
import { JobCard } from './JobCard'
import { Icons } from './Icons'

const DAY_TRACKER_STORAGE_KEY = 'coolcare_calendar_day_tracker_v1'
const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

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

function getMonthGrid(anchorDate) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - mondayOffset)
  const days = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + i)
    days.push(day)
  }
  return days
}

function getJobsForDate(jobs, date) {
  const ds = toDateKey(date)
  return jobs.filter((j) => j.scheduled_at && toDateKeyFromIso(j.scheduled_at) === ds)
}

export function CalendarTab({ jobs, onSelectJob, onAddressClick, onRefresh }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [dayTracker, setDayTracker] = useState(loadDayTracker)

  useEffect(() => {
    localStorage.setItem(DAY_TRACKER_STORAGE_KEY, JSON.stringify(dayTracker))
  }, [dayTracker])

  const dayJobs = useMemo(
    () => getJobsForDate(jobs, selectedDate),
    [jobs, selectedDate]
  )

  const monthGrid = useMemo(() => getMonthGrid(currentMonth), [currentMonth])
  const selectedDayType = getDayType(selectedDate, dayTracker)

  const goPrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

  const goToday = () => {
    const now = new Date()
    setSelectedDate(now)
    setCurrentMonth(now)
  }

  const monthLabel = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  const setSelectedDayType = (type) => {
    const key = toDateKey(selectedDate)
    setDayTracker((prev) => {
      const next = { ...prev }
      if (type === 'auto') delete next[key]
      else next[key] = type
      return next
    })
  }

  const dayStats = useMemo(() => {
    const total = dayJobs.length
    const completed = dayJobs.filter((j) => j.status === 'completed').length
    const active = dayJobs.filter((j) => j.status === 'active').length
    const scheduled = dayJobs.filter((j) => j.status === 'scheduled').length
    return { total, completed, active, scheduled }
  }, [dayJobs])

  return (
    <PullToRefreshWrapper onRefresh={onRefresh}>
      <div className="tab calendar-tab">
        <div className="calendar-header">
          <h2>Календарь</h2>
          <button className="btn-small" onClick={goToday}>Сегодня</button>
        </div>
        <div className="calendar-nav">
          <button className="btn-calendar-nav" onClick={goPrevMonth} aria-label="Предыдущий месяц">
            {Icons.chevronLeft}
          </button>
          <div className="calendar-date-label">{monthLabel}</div>
          <button className="btn-calendar-nav" onClick={goNextMonth} aria-label="Следующий месяц">
            {Icons.chevronRight}
          </button>
        </div>
        <div className="calendar-month-grid">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="calendar-month-weekday">{day}</div>
          ))}
          {monthGrid.map((date) => {
            const inCurrentMonth = date.getMonth() === currentMonth.getMonth()
            const isToday = toDateKey(date) === toDateKey(new Date())
            const isSelected = toDateKey(date) === toDateKey(selectedDate)
            const dayType = getDayType(date, dayTracker)
            const jobsCount = getJobsForDate(jobs, date).length
            return (
              <button
                key={`${date.toISOString()}-cell`}
                type="button"
                className={`calendar-month-day ${inCurrentMonth ? '' : 'outside'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayType}`}
                onClick={() => setSelectedDate(date)}
              >
                <span>{date.getDate()}</span>
                {jobsCount > 0 && <small>{jobsCount}</small>}
              </button>
            )
          })}
        </div>
        <div className="calendar-day-type-toggle">
          <span className={`calendar-day-badge ${selectedDayType}`}>
            {selectedDayType === 'workday' ? 'Рабочий день' : 'Выходной'}
          </span>
          <div className="calendar-day-type-buttons">
            <button
              type="button"
              className={!dayTracker[toDateKey(selectedDate)] ? 'active' : ''}
              onClick={() => setSelectedDayType('auto')}
            >
              Авто
            </button>
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
      </div>
    </PullToRefreshWrapper>
  )
}
