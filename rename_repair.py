
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

updates = {
    "РЕМОНТ: Диагностика": "🔴 РЕМОНТ: Диагностика (выявление поломки)",
    "РЕМОНТ: Замена пускового конденсатора (с деталью)": "🔴 РЕМОНТ: Замена конденсатора (с деталью)",
    "РЕМОНТ: Плата управления (инвертор)": "🔴 РЕМОНТ: Плата управления (инвертор)",
    "РЕМОНТ: Плата управления (on/off)": "🔴 РЕМОНТ: Плата управления (on/off)",
    "РЕМОНТ: Замена вентилятора": "🔴 РЕМОНТ: Замена вентилятора",
    "РЕМОНТ: Замена компрессора (только работа)": "🔴 РЕМОНТ: Замена компрессора (работа)",
    "РЕМОНТ: Вакуумирование системы": "🔴 РЕМОНТ: Вакуумирование системы",
}

def update_labels():
    try:
        print("Updating labels for repair category...")
        for old, new in updates.items():
            supabase.table('predefined_services').update({"name": new}).eq("name", old).execute()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_labels()
