
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

# Dictionary of old -> new names for technical maintenance
updates = {
    "Базовое ТО 07–09 BTU (до 25 м²)": "🟢 ТО: 07-09 BTU (до 25 м²)",
    "Базовое ТО 12–14 BTU (до 35 м²)": "🟢 ТО: 12-14 BTU (до 35 м²)",
    "Базовое ТО 18–24 BTU (до 70 м²)": "🟢 ТО: 18-24 BTU (до 70 м²)",
    "Полный сервис с разбором блока (07-12 BTU)": "🟢 СЕРВИС: Разбор блока (07-12 BTU)",
    "Мойка внешнего блока (АВД)": "🟢 ЧИСТКА: Мойка внешнего блока (АВД)",
    "Чистка дренажной системы (устранение течи)": "🟢 ЧИСТКА: Дренажная система",
    "Антибактериальная обработка": "🟢 ЧИСТКА: Антибактериальная обработка",
}

def update_labels():
    try:
        print("Updating labels for maintenance category...")
        for old, new in updates.items():
            supabase.table('predefined_services').update({"name": new}).eq("name", old).execute()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_labels()
