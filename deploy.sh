#!/bin/bash
set -e  # Остановить скрипт при ошибке

echo "🚀 Начало обновления CoolCare..."

cd /var/www/coolcare

# === Настройки ===
VENV_PATH="/var/www/coolcare/venv"
PYTHON="$VENV_PATH/bin/python"
PIP="$VENV_PATH/bin/pip"

# 1. Остановить старый процесс
echo "⏹️  Остановка старого процесса..."
pkill -f "python.*app.py" || true
pkill -f uvicorn || true
sleep 2

# 2. Обновить код
echo "📥 Получение изменений с GitHub..."
git pull origin main

# 3. Обновить зависимости (используем прямой путь к pip!)
echo "📦 Установка зависимостей..."
"$PIP" install -r backend/requirements.txt

# 4. Запустить приложение (используем прямой путь к python)
echo "🚀 Запуск приложения..."
nohup "$PYTHON" app.py > app.log 2>&1 &

echo "✅ Обновление завершено!"
echo "📊 Лог: tail -f app.log"
echo "🔍 Процесс: ps aux | grep app.py"
