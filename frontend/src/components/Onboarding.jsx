import React, { useState, useEffect } from 'react'
import { Rocket, MapPin, CheckCircle, ChevronRight, Check } from 'lucide-react'
import '../styles/Onboarding.css'

export function Onboarding({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('onboarding_complete')
    if (!hasSeen) {
      setIsVisible(true)
    }
  }, [])

  if (!isVisible) return null

  const handleNext = () => {
    if (slide < 2) {
      setSlide(s => s + 1)
    } else {
      localStorage.setItem('onboarding_complete', 'true')
      setIsVisible(false)
      if (onComplete) onComplete()
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-content">
        <div className="onboarding-slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
          
          {/* Slide 1 */}
          <div className="onboarding-slide">
            <div className="onboarding-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
              <Rocket size={48} />
            </div>
            <h2>Ваша работа под контролем</h2>
            <p>Получайте новые заявки моментально. Вся информация обновляется в реальном времени.</p>
          </div>

          {/* Slide 2 */}
          <div className="onboarding-slide">
            <div className="onboarding-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-color)' }}>
              <MapPin size={48} />
            </div>
            <h2>Вся информация в телефоне</h2>
            <p>Телефоны клиентов, адреса объектов и состав работ — всегда под рукой в удобном виде.</p>
          </div>

          {/* Slide 3 */}
          <div className="onboarding-slide">
            <div className="onboarding-icon" style={{ background: 'var(--success-light)', color: 'var(--success-color)' }}>
              <CheckCircle size={48} />
            </div>
            <h2>Отмечайте статусы</h2>
            <p>От "Назначена" до "Выполнена". Меняйте статусы в один клик и получайте новые задачи.</p>
          </div>

        </div>

        <div className="onboarding-controls">
          <div className="onboarding-dots">
            <div className={`onboarding-dot ${slide === 0 ? 'active' : ''}`} />
            <div className={`onboarding-dot ${slide === 1 ? 'active' : ''}`} />
            <div className={`onboarding-dot ${slide === 2 ? 'active' : ''}`} />
          </div>
          <button className="onboarding-btn btn-primary" onClick={handleNext}>
            {slide === 2 ? (
              <>Начать работу <Check size={20} /></>
            ) : (
              <>Далее <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
