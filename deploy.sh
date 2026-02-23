#!/bin/bash
set -e

echo "🚀 Начало обновления CoolCare..."
cd /var/www/coolcare

# === Настройки ===
VENV_PATH="/var/www/coolcare/venv"
PYTHON="$VENV_PATH/bin/python"

# 1. Остановить старый процесс
echo "⏹️  Остановка старого процесса..."
pkill -f "python.*app.py" || true
pkill -f uvicorn || true
sleep 2

# 2. Обработать локальные изменения перед pull
echo "🔍 Проверка локальных изменений..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Найдены незакоммиченные изменения!"
    echo "📦 Сохраняем в stash..."
    git stash push -m "Auto-stash before deploy $(date +%Y%m%d_%H%M%S)"
    STASHED=1
else
    echo "✅ Локальная история чиста"
    STASHED=0
fi

# 3. Обновить код
echo "📥 Получение изменений с GitHub..."
git pull origin main

# 4. Обновить зависимости
echo "📦 Установка зависимостей..."
"$PYTHON" -m pip install -r backend/requirements.txt

# 5. Вернуть заstash-енные изменения (если были)
if [ "$STASHED" -eq 1 ]; then
    echo "🔄 Восстановление локальных изменений..."
    git stash pop || echo "⚠️  Конфликт при восстановлении stash — разрешите вручную"
fi

# 6. Запустить приложение
echo "🚀 Запуск приложения..."
nohup "$PYTHON" app.py > app.log 2>&1 &

echo "✅ Обновление завершено!"
echo "📊 Лог: tail -f app.log"
echo "🔍 Процесс: ps aux | grep app.py"
