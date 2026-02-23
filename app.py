#!/usr/bin/env python3
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')

os.chdir(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

print("🚀 Запуск CoolCare PWA сервера...")
import uvicorn
from main import app

uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
