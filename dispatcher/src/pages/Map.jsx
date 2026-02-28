import React, { useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

export function Map() {
    const { jobs } = useAdmin()

    useEffect(() => {
        // Инициализация карты Yandex
        if (!window.ymaps) return

        window.ymaps.ready(() => {
            const mapContainer = document.getElementById('admin-map')
            if (!mapContainer) return

            mapContainer.innerHTML = ''

            const map = new window.ymaps.Map('admin-map', {
                center: [55.751574, 37.573856], // Москва по умолчанию
                zoom: 10,
                controls: ['zoomControl', 'fullscreenControl']
            })

            const clusterer = new window.ymaps.Clusterer({
                preset: 'islands#invertedBlueClusterIcons',
                groupByCoordinates: false,
            })

            const points = jobs
                .filter(j => j.latitude && j.longitude)
                .map(job => {
                    const preset = job.status === 'completed' ? 'islands#greenCircleDotIcon' :
                        job.status === 'active' ? 'islands#orangeCircleDotIcon' :
                            'islands#blueCircleDotIcon'

                    return new window.ymaps.Placemark([job.latitude, job.longitude], {
                        balloonContentHeader: job.customer_name || 'Без имени',
                        balloonContentBody: `
                            <div>
                                <strong>${job.title || 'Заявка'}</strong><br/>
                                ${job.address}<br/>
                                <span class="status-badge ${job.status}">${job.status}</span>
                            </div>
                        `,
                        hintContent: job.customer_name
                    }, {
                        preset: preset
                    })
                })

            clusterer.add(points)
            map.geoObjects.add(clusterer)

            if (points.length > 0) {
                map.setBounds(clusterer.getBounds(), { checkZoomRange: true, zoomMargin: 50 })
            }
        })
    }, [jobs])

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '16px' }}>Карта всех заявок</h2>
            <div id="admin-map" className="data-card" style={{ flex: 1, minHeight: '400px' }}>
                {!window.ymaps && (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        Загрузка карт... (Проверьте подключение скрипта Яндекс.Карт в index.html)
                    </div>
                )}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#0066cc' }}></span> Ожидает
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></span> В работе
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></span> Завершено
                </div>
            </div>
        </div>
    )
}
