# Деплой на TimeWeb

## Frontend (Vite/React)

1. **Соберите frontend:**
```bash
cd frontend
npm run build
```

2. **Загрузите содержимое папки `dist`** в корень веб-сервера на TimeWeb через FTP или файловый менеджер

3. **Или загрузите весь frontend** и настройте сборку:
   - Папка: `/frontend`
   - Команда сборки: `npm run build`
   - Публикуемая папка: `dist`

## Backend (FastAPI + Telegram Bot)

### Вариант 1: Python приложение

1. Загрузите все файлы проекта на сервер

2. В панели TimeWeb перейдите в **Python-приложения**

3. Создайте новое приложение:
   - **Путь к проекту**: `/home/username/Project-Qwen`
   - **Файл входа**: `app.py`
   - **Python версия**: 3.10 или выше
   - **Порт**: 8000

4. Установите зависимости через SSH:
```bash
cd /home/username/Project-Qwen/backend
pip3 install -r requirements.txt
```

5. Настройте `.env` файл:
```bash
TELEGRAM_BOT_TOKEN=8517100097:AAGkJB2Eg3ourOJx2BT07emaR3fegYKgigs
WEB_APP_URL=https://your-domain.timeweb.ru
API_BASE_URL=https://your-domain.timeweb.ru
YANDEX_MAPS_API_KEY=e1a186ee-6741-4e3f-b7f4-438ed8c61c4b
```

### Вариант 2: Запуск через systemd (если есть VPS)

Создайте файл `/etc/systemd/system/coolcare.service`:

```ini
[Unit]
Description=CoolCare Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/coolcare/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустите:
```bash
sudo systemctl enable coolcare
sudo systemctl start coolcare
sudo systemctl status coolcare
```

## Настройка Telegram бота

1. Откройте @BotFather в Telegram

2. Установите Web App URL:
   - Команда: `/setmenubutton`
   - Выберите бота
   - Введите URL: `https://your-domain.timeweb.ru`

3. Или установите домен:
   - Команда: `/setdomain`
   - Выберите бота
   - Введите домен: `your-domain.timeweb.ru`

## Проверка

1. **Backend**: `https://your-domain.timeweb.ru/health`
   - Должен вернуть: `{"status": "ok", "service": "CoolCare Technician Bot"}`

2. **Frontend**: Откройте `https://your-domain.timeweb.ru` в браузере

3. **Telegram**: Запустите бота, нажмите кнопку "📱 Открыть приложение"

## Важные замечания

- TimeWeb может требовать特定的 настройки для WebSocket (если используются)
- Для production измените пароль в `backend/main.py`:
  ```python
  VALID_PASSWORD = "your-secure-password"
  ```
- Включите HTTPS (TimeWeb предоставляет бесплатные SSL сертификаты)
- Для базы данных используйте PostgreSQL вместо SQLite в production
