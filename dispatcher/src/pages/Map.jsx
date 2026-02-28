import React, { useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

export function Map() {
    const { jobs, workers } = useAdmin()

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
                controls: ['zoomControl']
            }, {
                suppressMapOpenBlock: true,
                yandexMapDisablePoiInteractivity: true
            })

            const jobClusterer = new window.ymaps.Clusterer({
                preset: 'islands#invertedBlueClusterIcons',
                groupByCoordinates: false,
            })

            const jobPoints = jobs
                .filter(j => j.latitude && j.longitude)
                .map(job => {
                    const preset = job.status === 'completed' ? 'islands#greenCircleDotIcon' :
                        job.status === 'active' ? 'islands#orangeCircleDotIcon' :
                            'islands#blueCircleDotIcon'

                    return new window.ymaps.Placemark([job.latitude, job.longitude], {
                        balloonContentHeader: job.customer_name || 'Без имени',
                        balloonContentBody: `
                            <div style="font-family: sans-serif; padding: 5px;">
                                <strong style="display: block; margin-bottom: 5px;">${job.title || 'Заявка'}</strong>
                                <div style="font-size: 13px; color: #666;">${job.address}</div>
                            </div>
                        `,
                        hintContent: job.customer_name
                    }, {
                        preset: preset
                    })
                })

            const workerPoints = workers
                .filter(w => w.latitude && w.longitude)
                .map(worker => {
                    return new window.ymaps.Placemark([worker.latitude, worker.longitude], {
                        balloonContentHeader: worker.name || worker.phone,
                        balloonContentBody: `
                            <div style="font-family: sans-serif; padding: 5px;">
                                <strong>Мастер: ${worker.name || 'Без имени'}</strong><br/>
                                Тел: ${worker.phone}<br/>
                                <span style="color: #666; font-size: 12px;">Последняя активность: ${new Date().toLocaleTimeString()}</span>
                            </div>
                        `,
                        hintContent: `Мастер: ${worker.name || worker.phone}`
                    }, {
                        preset: 'islands#redUserIcon'
                    })
                })

            jobClusterer.add(jobPoints)
            map.geoObjects.add(jobClusterer)

            workerPoints.forEach(p => map.geoObjects.add(p))

            const allPoints = [...jobPoints, ...workerPoints]
            if (allPoints.length > 0) {
                const bounds = map.geoObjects.getBounds()
                if (bounds) {
                    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 })
                }
            }
        })
    }, [jobs, workers])

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '32px', gap: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Карта объектов</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Визуализация заказов и местоположения персонала</p>
                </div>
            </div>

            <div id="admin-map" className="data-card" style={{ flex: 1, minHeight: '400px', borderRadius: '16px', overflow: 'hidden' }}>
                {!window.ymaps && (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        Загрузка карт...
                    </div>
                )}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#64748b' }}>
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
