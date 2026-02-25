import React, { useEffect, useRef, useState } from 'react'
import { loadYandexMaps } from './loadYandexMaps'
import { api } from '../../api'
import { DEFAULT_CENTER } from '../../constants'
import { STATUS_LIST } from '../../constants'

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

export function MapTab({ jobs }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const multiRouteRef = useRef(null)
  const [routeDate, setRouteDate] = useState(() => toDateStr(new Date()))
  const [routeData, setRouteData] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    loadYandexMaps().then(() => {
      if (!mapRef.current || mapInstance.current) return
      mapInstance.current = new window.ymaps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        controls: ['zoomControl', 'fullscreenControl'],
      })
    })
  }, [])

  const jobsWithCoords = jobs.filter((j) => j.latitude && j.longitude)
  const todayCount = jobs.filter(
    (j) =>
      j.scheduled_at &&
      new Date(j.scheduled_at).toDateString() === new Date().toDateString()
  ).length

  const handleOptimizeRoute = async () => {
    setRouteLoading(true)
    try {
      const data = await api.getRouteOptimize(routeDate)
      setRouteData(data)
    } catch (err) {
      alert('Ошибка: ' + (err.message || 'Не удалось построить маршрут'))
    } finally {
      setRouteLoading(false)
    }
  }

  const clearRoute = () => {
    setRouteData(null)
  }

  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.geoObjects.removeAll()
    multiRouteRef.current = null

    if (routeData && routeData.jobs && routeData.jobs.length >= 2) {
      try {
        const points = routeData.jobs.map((j) => [j.latitude, j.longitude])
        const multiRoute = new window.ymaps.multiRouter.MultiRoute(
          {
            referencePoints: points,
          },
          {
            boundsAutoApply: true,
            wayPointStartIconColor: '#0066cc',
            wayPointFinishIconColor: '#28a745',
          }
        )
        mapInstance.current.geoObjects.add(multiRoute)
        multiRouteRef.current = multiRoute
      } catch (e) {
        console.warn('MultiRoute failed, showing placemarks', e)
      }
    }

    if (!multiRouteRef.current) {
      jobsWithCoords.forEach((job) => {
        const placemark = new window.ymaps.Placemark(
          [job.latitude, job.longitude],
          {
            balloonContent: `<div style="padding:12px"><strong>${job.customer_name || job.title || 'Заявка'}</strong><br><span style="color:#666">${job.address || ''}</span></div>`,
          },
          {
            preset: 'islands#blueCircleDotIcon',
            iconColor: STATUS_LIST.find((s) => s.key === job.status)?.color || '#666',
          }
        )
        mapInstance.current.geoObjects.add(placemark)
      })
      if (jobsWithCoords.length > 1) {
        mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), {
          checkZoomRange: true,
          zoomMargin: 50,
        })
      }
    }
  }, [jobs, routeData, jobsWithCoords])

  return (
    <div className="tab map-tab">
      <div className="map-header">
        <h2>Карта</h2>
        <span className="map-stats">{todayCount} заявок сегодня</span>
      </div>
      <div className="map-route-controls">
        <input
          type="date"
          value={routeDate}
          onChange={(e) => setRouteDate(e.target.value)}
          className="map-date-input"
        />
        {routeData ? (
          <div className="map-route-info">
            <span>
              Маршрут: ~{routeData.total_distance_km} км, {routeData.jobs.length} точек
            </span>
            <button className="btn-small" onClick={clearRoute}>
              Сбросить
            </button>
          </div>
        ) : (
          <button
            className="btn-primary btn-optimize"
            onClick={handleOptimizeRoute}
            disabled={routeLoading}
          >
            {routeLoading ? 'Построение...' : 'Оптимизировать маршрут'}
          </button>
        )}
      </div>
      <div ref={mapRef} className="map-container" />
      {jobsWithCoords.length === 0 && !routeData && (
        <p className="empty">Нет заявок с координатами</p>
      )}
    </div>
  )
}
