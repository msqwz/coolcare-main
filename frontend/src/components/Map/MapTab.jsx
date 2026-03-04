import React, { useEffect, useRef, useState } from 'react'
import { loadYandexMaps } from './loadYandexMaps'
import { DEFAULT_CENTER, STATUS_LIST } from '../../constants'

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

export function MapTab({ jobs }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [routeDate, setRouteDate] = useState(() => toDateStr(new Date()))

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

  const jobsWithCoords = jobs.filter((j) => {
    if (!j.latitude || !j.longitude) return false;
    if (!j.scheduled_at) return false;
    const jobDate = toDateStr(new Date(j.scheduled_at));
    return jobDate === routeDate;
  });

  const todayCount = jobsWithCoords.length;

  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.geoObjects.removeAll()

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

      placemark.events.add('click', (e) => {
        e.preventDefault();
        window.open(`https://yandex.ru/maps/?rtext=~${job.latitude},${job.longitude}`, '_blank');
      });

      mapInstance.current.geoObjects.add(placemark)
    })

    if (jobsWithCoords.length > 1) {
      mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 50,
      })
    } else if (jobsWithCoords.length === 1) {
      mapInstance.current.setCenter([jobsWithCoords[0].latitude, jobsWithCoords[0].longitude], 14)
    }
  }, [jobsWithCoords])

  return (
    <div className="tab map-tab">
      <div className="map-header">
        <h2>Карта</h2>
        <span className="map-stats">{todayCount} заявок в этот день</span>
      </div>
      <div className="map-route-controls">
        <input
          type="date"
          value={routeDate}
          onChange={(e) => setRouteDate(e.target.value)}
          className="map-date-input"
        />
      </div>
      <div ref={mapRef} className="map-container" style={{ flex: 1, minHeight: '300px', borderRadius: '12px', overflow: 'hidden' }} />
      {jobsWithCoords.length === 0 && (
        <p className="empty">Нет заявок с координатами на выбранную дату</p>
      )}
    </div>
  )
}
