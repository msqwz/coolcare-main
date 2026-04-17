import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

services = [
    {"name": "Базовое ТО 07–09 BTU (до 25 м²)", "price": 2500},
    {"name": "Базовое ТО 12–14 BTU (до 35 м²)", "price": 3000},
    {"name": "Базовое ТО 18–24 BTU (до 70 м²)", "price": 4000},
    {"name": "Полный сервис с разбором блока (07-12 BTU)", "price": 4500},
    {"name": "Мойка внешнего блока (АВД)", "price": 1500},
    {"name": "Чистка дренажной системы (устранение течи)", "price": 2000},
    {"name": "Антибактериальная обработка", "price": 1000},
    {"name": "Дозаправка R410A / R32 (до 100г)", "price": 600},
    {"name": "Полная заправка 07–09 BTU", "price": 3500},
    {"name": "Полная заправка 12–14 BTU", "price": 4500},
    {"name": "Заправка R22 (за 100г)", "price": 1000},
    {"name": "Поиск утечки / Опрессовка", "price": 2000},
    {"name": "Диагностика", "price": 1000},
    {"name": "Замена пускового конденсатора (с деталью)", "price": 3500},
    {"name": "Плата управления (инвертор)", "price": 6500},
    {"name": "Плата управления (on/off)", "price": 4500},
    {"name": "Замена вентилятора", "price": 4000},
    {"name": "Замена компрессора (только работа)", "price": 10000},
    {"name": "Вакуумирование системы", "price": 1500},
]

def add_services():
    try:
        print(f"Adding {len(services)} services to database...")
        res = supabase.table('predefined_services').insert(services).execute()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_services()
