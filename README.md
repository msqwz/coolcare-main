# CoolCare PWA

Progressive Web App для мастеров по ремонту и обслуживанию кондиционеров.

## Возможности

- **PWA** — установка на телефон, работа в оффлайне
- **SMS-аутентификация** — вход по номеру телефона (код хранится в БД, для продакшена — интеграция с SMS-провайдером)
- **Заявки** — создание, редактирование, удаление, статусы (Назначена, В работе, Выполнена, Отменена)
- **Календарь** — просмотр заявок по дням и неделям
- **Карта** — Yandex Maps, метки заявок
- **Оптимизация маршрута** — порядок визитов по адресам (алгоритм nearest-neighbour)
- **Поиск и фильтры** — по имени, адресу, типу заявки, статусу
- **Push-уведомления** — напоминания о заявках за N минут до времени
- **Дашборд** — статистика заявок и выручки

## Технологии

| Слой      | Стек              |
| --------- | ----------------- |
| Frontend  | React 18, Vite 5, React Router |
| Backend   | FastAPI, Uvicorn  |
| БД        | Supabase (PostgreSQL) |
| Карты     | Yandex Maps API   |

## Установка

### Локальная разработка

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # настроить переменные
python main.py         # или python ../app.py из корня

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173  
API: http://localhost:8000

### Docker

```bash
docker build -t coolcare-pwa .
docker run -p 8000:8000 coolcare-pwa
```

### Продакшен (сборка фронта)

```bash
cd frontend && npm install && npm run build
cd .. && python app.py
```

FastAPI раздаёт статику из `frontend/dist` и API на порту 8000.

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Описание |
| ---------- | -------- |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_KEY` | Anon/Service ключ Supabase |
| `JWT_SECRET` | Секрет для JWT (обязательно сменить в продакшене) |
| `JWT_EXPIRE_HOURS` | Срок действия access token (по умолчанию 24) |
| `VAPID_PUBLIC_KEY` | Публичный VAPID ключ (Web Push) |
| `VAPID_PRIVATE_KEY` | Приватный VAPID ключ |
| `PUSH_REMINDER_MINUTES` | За сколько минут до заявки отправлять push (по умолчанию 30) |

Генерация VAPID: `pip install py_vapid && python backend/scripts/gen_vapid.py`

### Frontend (`frontend/.env`)

| Переменная | Описание |
| ---------- | -------- |
| `VITE_API_URL` | URL API (если не совпадает с origin) |
| `VITE_YANDEX_MAPS_API_KEY` | Ключ Yandex Maps API |

## API

### Аутентификация

- `POST /auth/send-code` — отправка кода (тело: `{ "phone": "+7999..." }`)
- `POST /auth/verify-code` — проверка кода, получение токенов
- `POST /auth/refresh` — обновление access token (тело: `{ "refresh_token": "..." }`)
- `GET /auth/me` — текущий пользователь
- `PUT /auth/me` — обновление профиля

### Заявки

- `GET /jobs` — список заявок (`?status=` опционально)
- `GET /jobs/today` — заявки на сегодня
- `GET /jobs/route/optimize?date=YYYY-MM-DD` — оптимизированный порядок визитов
- `GET /jobs/{id}` — одна заявка
- `POST /jobs` — создать
- `PUT /jobs/{id}` — обновить
- `DELETE /jobs/{id}` — удалить

### Push

- `GET /push/vapid-public` — публичный VAPID ключ
- `POST /push/subscribe` — сохранить подписку

### Прочее

- `GET /dashboard/stats` — статистика
- `GET /health` — проверка состояния

## Структура проекта

```
coolcare-main/
├── app.py                 # Точка входа (uvicorn)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── constants.js
│   │   ├── context/       # AppContext
│   │   ├── components/    # LoginScreen, JobCard, JobDetail, JobForm, ...
│   │   ├── components/Map/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── offlineStorage.js
│   │   └── sw.js
│   └── public/
├── backend/
│   ├── main.py            # Роуты API
│   ├── auth.py            # JWT, SMS-коды
│   ├── database.py        # Supabase
│   ├── schemas.py
│   ├── push_service.py
│   ├── supabase_schema.sql
│   └── scripts/gen_vapid.py
├── Dockerfile
└── package.json           # root scripts
```

## Деплой

1. Выполнить `supabase_schema.sql` в Supabase (включая `push_subscriptions`).
2. Настроить переменные окружения.
3. Собрать фронт: `cd frontend && npm run build`.
4. Запустить: `python app.py` (или через systemd/gunicorn).

Подробности для Timeweb — см. `TIMEWEB_DEPLOY.md`.

## Планы на будущее

- [ ] **Реальная отправка SMS** — интеграция с SMS.ru, Twilio или аналогом
- [ ] **Клиенты** — отдельная сущность «Клиент», связь заявок с клиентами
- [ ] **Расширенная аналитика** — графики по периодам, выручка по типам работ
- [ ] **Экспорт** — PDF/Excel по заявкам и выручке
- [ ] **Маршрут от текущей геопозиции** — старт оптимизации от местоположения мастера
- [ ] **Чек-листы** — шаблоны работ по типам заявок
- [ ] **Фотоотчёты** — прикрепление фото к заявкам
- [ ] **Мультимастер** — учёт нескольких мастеров, распределение заявок
- [ ] **Чаты с клиентами** — уведомления, обмен сообщениями
- [ ] **Тёмная тема** — переключатель темы
- [ ] **Тесты** — unit (pytest, Vitest) и E2E (Playwright)
- [ ] **Refresh token на фронте** — автоматическое обновление при 401 вместо перезагрузки
- [ ] **Rate limiting** — ограничение запросов к `/auth/send-code`
- [ ] **Ужесточение CORS** — явный список origins вместо `*`

## Лицензия

MIT
