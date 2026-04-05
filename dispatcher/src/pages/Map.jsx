// Map v4 — Static sidebar layout
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useAdmin } from '../context/AdminContext'
import {
    Users, Search, Crosshair, Navigation, Layers, Maximize2
} from 'lucide-react'
import { useToast } from '@shared/components/Toast'
import './Map.css'

const STATUS_CONFIG = {
    scheduled: { label: 'Назначена', color: '#111', preset: 'islands#blueCircleDotIcon' },
    active: { label: 'В работе', color: '#f59e0b', preset: 'islands#orangeCircleDotIcon' },
    completed: { label: 'Выполнена', color: '#10b981', preset: 'islands#greenCircleDotIcon' },
    cancelled: { label: 'Отменена', color: '#ef4444', preset: 'islands#redCircleDotIcon' },
}

export function Map() {
    const { jobs, workers } = useAdmin()
    const toast = useToast()
    const mapInstanceRef = useRef(null)
    const [viewMode, setViewMode] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState(['scheduled', 'active', 'completed', 'cancelled'])
    const [mapType, setMapType] = useState('yandex#map')

    const allJobs = useMemo(() => jobs || [], [jobs])
    const allWorkers = useMemo(() => workers || [], [workers])

    const geoJobs = useMemo(() => allJobs.filter(j => j.latitude && j.longitude && statusFilter.includes(j.status)), [allJobs, statusFilter])
    const geoWorkers = useMemo(() => allWorkers.filter(w => w.latitude && w.longitude), [allWorkers])

    const filteredMasters = useMemo(() =>
        allWorkers.filter(w => (w.name || w.phone || '').toLowerCase().includes(searchTerm.toLowerCase()))
        , [allWorkers, searchTerm])

    useEffect(() => {
        if (!window.ymaps) return
        window.ymaps.ready(() => {
            if (mapInstanceRef.current) return
            const map = new window.ymaps.Map('admin-map-v3', {
                center: [47.2357, 39.7015],
                zoom: 11,
                controls: []
            }, {
                suppressMapOpenBlock: true
            })
            mapInstanceRef.current = map
        })
    }, [])

    useEffect(() => {
        if (!mapInstanceRef.current || !window.ymaps) return
        const map = mapInstanceRef.current
        map.geoObjects.removeAll()

        if (viewMode === 'all' || viewMode === 'workers') {
            geoWorkers.forEach(w => {
                const isActive = allJobs.some(j => j.user_id === w.id && j.status === 'active')
                const placemark = new window.ymaps.Placemark([w.latitude, w.longitude], {
                    hintContent: w.name || w.phone,
                    balloonContent: `
                        <div class="map-balloon">
                            <strong>👷 ${w.name || w.phone}</strong>
                            <p>${isActive ? '🚀 В процессе работы' : '☕️ Свободен'}</p>
                        </div>
                    `
                }, {
                    preset: isActive ? 'islands#orangePersonIcon' : 'islands#bluePersonIcon',
                    iconColor: isActive ? '#f59e0b' : '#3b82f6'
                })
                map.geoObjects.add(placemark)
            })
        }

        if (viewMode === 'all' || viewMode === 'jobs') {
            const clusterer = new window.ymaps.Clusterer({ preset: 'islands#invertedBlueClusterIcons' })
            const jobPoints = geoJobs.map(j => {
                const cfg = STATUS_CONFIG[j.status] || STATUS_CONFIG.scheduled
                return new window.ymaps.Placemark([j.latitude, j.longitude], {
                    balloonContentHeader: j.customer_name,
                    balloonContentBody: j.address
                }, {
                    preset: cfg.preset,
                    iconColor: cfg.color
                })
            })
            clusterer.add(jobPoints)
            map.geoObjects.add(clusterer)
        }

        if (map.geoObjects.getLength() > 0) {
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 })
        }
    }, [geoWorkers, geoJobs, viewMode, allJobs, statusFilter])

    const focusOn = (coords) => {
        if (!mapInstanceRef.current) return
        mapInstanceRef.current.setCenter(coords, 14, { duration: 500 })
    }

    const handleMyLocation = () => {
        if (!mapInstanceRef.current) return
        if (navigator.geolocation) {
            toast.info('Определение геопозиции...')
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.latitude, position.coords.longitude]
                    mapInstanceRef.current.setCenter(coords, 14, { duration: 500 })
                },
                () => {
                    toast.error('Не удалось определить позицию')
                }
            )
        } else {
            toast.warning('Геолокация не поддерживается')
        }
    }

    const handleToggleLayers = () => {
        if (!mapInstanceRef.current) return
        const map = mapInstanceRef.current
        const types = ['yandex#map', 'yandex#satellite', 'yandex#hybrid']
        const nextType = types[(types.indexOf(mapType) + 1) % types.length]
        map.setType(nextType)
        setMapType(nextType)
    }

    const handleFitAll = () => {
        if (!mapInstanceRef.current) return
        const map = mapInstanceRef.current
        if (map.geoObjects.getLength() > 0) {
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 })
        } else {
            map.setCenter([47.2357, 39.7015], 11, { duration: 500 })
        }
    }

    return (
        <div className="map-v4-layout">
            {/* LEFT — STATIC PANEL */}
            <div className="map-v4-panel">
                <h3 className="map-panel-title">Мониторинг</h3>

                <div className="map-view-switcher">
                    <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>Все</button>
                    <button className={viewMode === 'workers' ? 'active' : ''} onClick={() => setViewMode('workers')}>Мастера</button>
                    <button className={viewMode === 'jobs' ? 'active' : ''} onClick={() => setViewMode('jobs')}>Заявки</button>
                </div>

                <div className="map-status-filters">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const isOn = statusFilter.includes(key)
                        const count = allJobs.filter(j => j.status === key && j.latitude && j.longitude).length
                        return (
                            <button
                                key={key}
                                className={`map-status-chip ${isOn ? 'on' : ''}`}
                                style={{ '--chip-color': cfg.color }}
                                onClick={() => setStatusFilter(prev =>
                                    isOn ? prev.filter(s => s !== key) : [...prev, key]
                                )}
                            >
                                <span className="chip-dot" />
                                {cfg.label}
                                <span className="chip-count">{count}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="map-search-box">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Найти мастера..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="map-list-scroll">
                    <h4 className="list-section-title"><Users size={14} /> Мастера ({allWorkers.length})</h4>
                    {filteredMasters.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '12px', textAlign: 'center' }}>
                            Мастера не найдены
                        </div>
                    )}
                    {filteredMasters.map(w => {
                        const hasGeo = w.latitude && w.longitude
                        return (
                            <div key={w.id} className="map-worker-card" onClick={() => hasGeo && focusOn([w.latitude, w.longitude])} style={{ opacity: hasGeo ? 1 : 0.6, cursor: hasGeo ? 'pointer' : 'default' }}>
                                <div className="worker-avatar-mini">
                                    {w.name?.[0] || 'W'}
                                    <div className="worker-status-dot" style={{ 
                                        background: !hasGeo ? '#94a3b8' : allJobs.some(j => j.user_id === w.id && j.status === 'active') ? '#f59e0b' : '#10b981'
                                    }} />
                                </div>
                                <div className="worker-info-mini">
                                    <div className="worker-name-mini">{w.name || w.phone}</div>
                                    <div className="worker-status-mini">
                                        {!hasGeo ? (
                                            <span style={{ color: '#94a3b8' }}>Нет GPS</span>
                                        ) : allJobs.some(j => j.user_id === w.id && j.status === 'active') ? (
                                            <span className="text-orange">На выезде</span>
                                        ) : (
                                            <span style={{ color: '#10b981' }}>Свободен</span>
                                        )}
                                    </div>
                                </div>
                                {hasGeo && <Crosshair size={14} className="locate-icon" />}
                            </div>
                        )
                    })}
                </div>

                <div className="map-stats-footer">
                    <div className="map-stat-item">
                        <span className="stat-val">{geoJobs.length}</span>
                        <span className="stat-lbl">Заявок</span>
                    </div>
                    <div className="map-stat-item">
                        <span className="stat-val">{geoWorkers.length}/{allWorkers.length}</span>
                        <span className="stat-lbl">GPS / Всего</span>
                    </div>
                </div>
            </div>

            {/* RIGHT — MAP */}
            <div className="map-v4-map-area">
                <div id="admin-map-v3" className="map-v4-canvas" />
                <div className="map-v4-controls">
                    <button className="control-btn glass" onClick={handleMyLocation} title="Моё положение"><Navigation size={18} /></button>
                    <button className="control-btn glass" onClick={handleToggleLayers} title="Слои"><Layers size={18} /></button>
                    <button className="control-btn glass" onClick={handleFitAll} title="Весь город"><Maximize2 size={18} /></button>
                </div>
            </div>
        </div>
    )
}
