#!/bin/bash
set -e

echo "🚀 Начало обновления CoolCare..."
cd /var/www/coolcare

# === Настройки ===
VENV_PATH="/var/www/coolcare/venv"
PYTHON="$VENV_PATH/bin/python"
PIP="$VENV_PATH/bin/pip"
APP_DIR="backend"
APP_ENTRY="main.py"
LOG_FILE="/var/www/coolcare/app.log"
PID_FILE="/var/www/coolcare/app.pid"

# === Функция остановки приложения ===
stop_app() {
    echo "⏹️  Остановка старого процесса..."
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            kill "$OLD_PID" 2>/dev/null || true
            sleep 2
            kill -9 "$OLD_PID" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    pkill -f "python.*$APP_ENTRY" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    sleep 1
}

# === 1. Остановить приложение ===
stop_app

# === 2. Проверка .env ===
echo "🔐 Проверка конфигурации..."
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/.env.example" ]; then
        echo "⚠️  .env не найден! Копируем из .env.example..."
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        echo "❗ Отредактируйте $APP_DIR/.env и вставьте ключи!"
        exit 1
    else
        echo "❌ .env и .env.example не найдены!"
        exit 1
    fi
fi

# === 3. Обработать локальные изменения ===
echo "🔍 Проверка локальных изменений..."
# Игнорируем dist/, app.pid, app.log
git checkout -- frontend/dist/ 2>/dev/null || true
git clean -fd frontend/dist/ 2>/dev/null || true

if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Найдены незакоммиченные изменения!"
    echo "📦 Сохраняем в stash..."
    git stash push -m "Auto-stash before deploy $(date +%Y%m%d_%H%M%S)" -u
    STASHED=1
else
    echo "✅ Локальная история чиста"
    STASHED=0
fi

# === 4. Обновить код из GitHub ===
echo "📥 Получение изменений с GitHub..."
git pull origin main

# === 5. Проверка/создание venv ===
echo "🐍 Проверка виртуального окружения..."
if [ ! -f "$PYTHON" ]; then
    echo "📦 Создаём новое venv..."
    python3 -m venv "$VENV_PATH"
fi

# === 6. Установка зависимостей ===
echo "📦 Установка Python зависимостей..."
"$PIP" install --upgrade pip --quiet
"$PIP" install -r "$APP_DIR/requirements.txt" --quiet

# === 7. Сборка фронтенда ===
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo "🔨 Сборка фронтенда..."
    cd frontend
    npm install --silent
    npm run build --silent
    [ -f "src/sw.js" ] && cp src/sw.js dist/ 2>/dev/null || true
    cd ..
else
    echo "⚠️  Фронтенд не найден, пропускаем сборку"
fi

# === 8. Вернуть stash ===
if [ "$STASHED" -eq 1 ]; then
    echo "🔄 Восстановление локальных изменений..."
    if ! git stash pop; then
        echo "⚠️  Конфликт при восстановлении stash"
        git stash drop 2>/dev/null || true
    fi
fi

# === 9. Запуск приложения ===
echo "🚀 Запуск приложения..."
cd "$APP_DIR"

nohup "$PYTHON" "$APP_ENTRY" > "$LOG_FILE" 2>&1 &
APP_PID=$!
echo $APP_PID > "$PID_FILE"

sleep 3
if kill -0 "$APP_PID" 2>/dev/null; then
    echo "✅ Приложение запущено (PID: $APP_PID)"
else
    echo "❌ Процесс не запустился! Проверьте логи:"
    tail -n 50 "$LOG_FILE"
    exit 1
fi

echo ""
echo "✅ Обновление завершено!"
echo "📊 Лог: tail -f $LOG_FILE"
echo "🔍 Процесс: ps aux | grep $APP_ENTRY"
