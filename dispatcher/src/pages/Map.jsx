// Map v3 — Premium Real-time Monitor
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useAdmin } from '../context/AdminContext'
import {
    MapPin, Users, Briefcase, Filter, Search, ChevronRight,
    Navigation, Eye, EyeOff, Layers, Clock, CheckCircle2,
    AlertCircle, XCircle, User, Phone, Calendar, Crosshair,
    Maximize2, Zap
} from 'lucide-react'
import './Map.css'

const STATUS_CONFIG = {
    scheduled: { label: 'Назначена', color: '#3b82f6', preset: 'islands#blueCircleDotIcon' },
    active: { label: 'В работе', color: '#f59e0b', preset: 'islands#orangeCircleDotIcon' },
    completed: { label: 'Выполнена', color: '#10b981', preset: 'islands#greenCircleDotIcon' },
    cancelled: { label: 'Отменена', color: '#ef4444', preset: 'islands#redCircleDotIcon' },
}

export function Map() {
    const { jobs, workers } = useAdmin()
    const mapInstanceRef = useRef(null)
    const [selectedId, setSelectedId] = useState(null)
    const [viewMode, setViewMode] = useState('all') // all | workers | jobs
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const allJobs = useMemo(() => jobs || [], [jobs])
    const allWorkers = useMemo(() => workers || [], [workers])

    const geoJobs = useMemo(() => allJobs.filter(j => j.latitude && j.longitude), [allJobs])
    const geoWorkers = useMemo(() => allWorkers.filter(w => w.latitude && w.longitude), [allWorkers])

    const filteredMasters = useMemo(() =>
        geoWorkers.filter(w => (w.name || w.phone || '').toLowerCase().includes(searchTerm.toLowerCase()))
        , [geoWorkers, searchTerm])

    // === INITIALIZE YMAPS ===
    useEffect(() => {
        if (!window.ymaps) return
        window.ymaps.ready(() => {
            if (mapInstanceRef.current) return
            const map = new window.ymaps.Map('admin-map-v3', {
                center: [55.751574, 37.573856],
                zoom: 10,
                controls: []
            }, {
                suppressMapOpenBlock: true
            })
            mapInstanceRef.current = map
        })
    }, [])

    // === RENDER MARKERS ===
    useEffect(() => {
        if (!mapInstanceRef.current || !window.ymaps) return
        const map = mapInstanceRef.current
        map.geoObjects.removeAll()

        // Workers
        if (viewMode === 'all' || viewMode === 'workers') {
            geoWorkers.forEach(w => {
                const isActive = allJobs.some(j => j.user_id === w.id && j.status === 'active')
                const placemark = new window.ymaps.Placemark([w.latitude, w.longitude], {
                    hintContent: w.name || w.phone,
                    balloonContent: `
                        <div class="map-balloon">
                            <strong>👷 ${w.name || w.phone}</strong>
                            <p>${isActive ? '🚀 В процессе работы' : '☕️ Свободен'}</p>
                            <button class="balloon-btn">Подробнее</button>
                        </div>
                    `
                }, {
                    preset: isActive ? 'islands#orangePersonIcon' : 'islands#bluePersonIcon',
                    iconColor: isActive ? '#f59e0b' : '#3b82f6'
                })
                map.geoObjects.add(placemark)
            })
        }

        // Jobs
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

        // Autozoom
        if (map.geoObjects.getLength() > 0) {
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 })
        }
    }, [geoWorkers, geoJobs, viewMode, allJobs])

    const focusOn = (coords) => {
        if (!mapInstanceRef.current) return
        mapInstanceRef.current.setCenter(coords, 14, { duration: 500 })
    }

    return (
        <div className="map-v3-root">
            <div id="admin-map-v3" className="map-v3-canvas"></div>

            {/* FLOATING SIDEBAR */}
            <div className={`map-v3-sidebar glass ${sidebarOpen ? 'open' : ''}`}>
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <ChevronRight style={{ transform: sidebarOpen ? 'rotate(180deg)' : '0' }} />
                </button>

                <div className="map-sidebar-content">
                    <div className="map-sidebar-header">
                        <h3>Мониторинг</h3>
                        <div className="map-view-switcher">
                            <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>Все</button>
                            <button className={viewMode === 'workers' ? 'active' : ''} onClick={() => setViewMode('workers')}>Мастера</button>
                            <button className={viewMode === 'jobs' ? 'active' : ''} onClick={() => setViewMode('jobs')}>Заявки</button>
                        </div>
                    </div>

                    <div className="map-search-box glass">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Найти мастера..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="map-list-scroll">
                        <h4 className="list-section-title"><Users size={14} /> Мастера ({geoWorkers.length})</h4>
                        {filteredMasters.map(w => (
                            <div key={w.id} className="map-worker-card glass" onClick={() => focusOn([w.latitude, w.longitude])}>
                                <div className="worker-avatar-mini">{w.name?.[0] || 'W'}</div>
                                <div className="worker-info-mini">
                                    <div className="worker-name-mini">{w.name || w.phone}</div>
                                    <div className="worker-status-mini">
                                        {allJobs.some(j => j.user_id === w.id && j.status === 'active') ?
                                            <span className="text-orange">🚀 На выезде</span> :
                                            <span className="text-blue">☕️ Свободен</span>
                                        }
                                    </div>
                                </div>
                                <Crosshair size={14} className="locate-icon" />
                            </div>
                        ))}
                    </div>

                    <div className="map-stats-footer glass">
                        <div className="map-stat-item">
                            <span className="stat-val">{geoJobs.length}</span>
                            <span className="stat-lbl">Заявок на карте</span>
                        </div>
                        <div className="map-stat-item">
                            <span className="stat-val">{geoWorkers.length}</span>
                            <span className="stat-lbl">Мастеров онлайн</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAP OVERLAYS */}
            <div className="map-v3-controls">
                <button className="control-btn glass" title="Моё положение"><Navigation size={20} /></button>
                <button className="control-btn glass" title="Слои"><Layers size={20} /></button>
                <button className="control-btn glass" title="Весь город"><Maximize2 size={20} /></button>
            </div>
        </div>
    )
}
