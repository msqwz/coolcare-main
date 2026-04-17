import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    address: '',
    preferred_time: '',
    description: ''
  })


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/public/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: `Заявка с сайта`
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setFormData({ customer_name: '', customer_phone: '', address: '', preferred_time: '', description: '' })
        }, 5000)
      } else {
        const err = await response.json()
        alert('Ошибка: ' + (err.detail || 'Не удалось отправить заявку'))
      }
    } catch (err) {
      alert('Ошибка сети. Проверьте подключение к серверу.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="landing-page">
      <section className="hero">
        <div className="landing-container">
          <div className="location-badge animate-fade">
            <span>📍</span> Ростов-на-Дону • Батайск • Аксай
          </div>
          <h1 className="animate-fade">Чистый воздух в вашем доме — наша цель</h1>
          <p className="animate-fade" style={{ animationDelay: '0.1s' }}>
            Профессиональное обслуживание кондиционеров с гарантией 1 год. 
            Работаем по всей Ростовской области. Выезд в день обращения.
          </p>
          <button 
            className="btn-primary animate-fade" 
            style={{ animationDelay: '0.2s' }}
            onClick={() => {
              const el = document.getElementById('booking')
              el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Оставить заявку
          </button>
        </div>
      </section>

      <section className="advantages-section">
        <div className="landing-container">
          <div className="section-title animate-fade">
            <h2>Почему выбирают нас?</h2>
            <p>Мы заботимся о вашем комфорте и долговечности вашей техники</p>
          </div>
          <div className="advantages-grid">
            <div className="adv-card animate-fade" style={{ animationDelay: '0.1s' }}>
              <span className="adv-icon">🕒</span>
              <h3>Быстрый выезд</h3>
              <p>Мастер будет у вас в течение 1-2 часов или в любое удобное для вас время.</p>
            </div>
            <div className="adv-card animate-fade" style={{ animationDelay: '0.2s' }}>
              <span className="adv-icon">🛡️</span>
              <h3>Гарантия 1 год</h3>
              <p>Предоставляем официальную гарантию на все выполненные работы и запчасти.</p>
            </div>
            <div className="adv-card animate-fade" style={{ animationDelay: '0.3s' }}>
              <span className="adv-icon">💎</span>
              <h3>Качество</h3>
              <p>Используем только профессиональное оборудование и сертифицированную химию.</p>
            </div>
            <div className="adv-card animate-fade" style={{ animationDelay: '0.4s' }}>
              <span className="adv-icon">💰</span>
              <h3>Честная цена</h3>
              <p>Стоимость работ фиксируется до начала ремонта и не меняется в процессе.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="landing-container">
          <div className="section-title">
            <h2>Результаты нашей работы</h2>
            <p>Посмотрите, как преображается техника после профессиональной чистки</p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-item animate-fade">
              <div className="gallery-header">Чистка внутреннего блока (испаритель)</div>
              <div className="gallery-photos">
                <div className="photo-box before-box">
                  <div className="photo-label">До</div>
                  <img src="/images/before_1.png" alt="Dirty AC" />
                </div>
                <div className="photo-box after-box">
                  <div className="photo-label">После</div>
                  <img src="/images/after_1.png" alt="Clean AC" />
                </div>
              </div>
            </div>
            <div className="gallery-item animate-fade" style={{ animationDelay: '0.2s' }}>
              <div className="gallery-header">Мойка внешнего блока (АВД)</div>
              <div className="gallery-photos">
                <div className="photo-box before-box">
                  <div className="photo-label">До</div>
                  <img src="/images/before_2.png" alt="Dirty Outdoor" />
                </div>
                <div className="photo-box after-box">
                  <div className="photo-label">После</div>
                  <img src="/images/after_2.png" alt="Clean Outdoor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="landing-container">
          <div className="section-title">
            <h2>Создание заявки</h2>
            <p>Заполните форму, и наш оператор свяжется с вами в течение 10 минут</p>
          </div>

          <div className="booking-single-column">

            <div className="form-column">
              <div className="booking-form-card">
                {submitted ? (
                  <div className="booking-success animate-fade">
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                    <h2>Заявка принята!</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Мастер свяжется с вами в ближайшее время для подтверждения.</p>
                  </div>
                ) : (
                  <>
                    <h3>Оставьте заявку</h3>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label>Ваше имя</label>
                        <input 
                          type="text" 
                          placeholder="Иван Иванов" 
                          required 
                          value={formData.customer_name}
                          onChange={e => setFormData({...formData, customer_name: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Номер телефона</label>
                        <input 
                          type="tel" 
                          placeholder="+7 (___) ___-__-__" 
                          required 
                          value={formData.customer_phone}
                          onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Адрес (город, улица, дом)</label>
                        <input 
                          type="text" 
                          placeholder="г. Ростов-на-Дону, ул. ..." 
                          required 
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Удобное время для визита</label>
                        <input 
                          type="text" 
                          placeholder="Например: Завтра после 14:00" 
                          value={formData.preferred_time}
                          onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Что случилось? (комментарий)</label>
                        <textarea 
                          rows="3" 
                          placeholder="Опишите вашу проблему, чтобы оператор мог подготовиться к звонку"
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                      </div>

                      <div className="submit-area">
                        <button type="submit" className="btn-primary" disabled={loading}>
                          {loading ? 'Отправка...' : 'Отправить заявку'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                          Нажимая кнопку, вы соглашаетесь с условиями обработки данных
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '60px 0', borderTop: '1px solid var(--border)', marginTop: '80px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; 2026 CoolCare Professional Service. Работаем без выходных.</p>
      </footer>
    </div>
  )
}

export default App
