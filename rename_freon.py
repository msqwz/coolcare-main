
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

updates = {
    "ФРЕОН: Дозаправка R410A / R32 (до 100г)": "🔵 ФРЕОН: Дозаправка R410A / R32 (до 100г)",
    "ФРЕОН: Полная заправка 07–09 BTU": "🔵 ФРЕОН: Полная заправка 07-09 BTU",
    "ФРЕОН: Полная заправка 12–14 BTU": "🔵 ФРЕОН: Полная заправка 12-14 BTU",
    "ФРЕОН: Заправка R22 (за 100г)": "🔵 ФРЕОН: Полная заправка R22 (за 100г)",
    "Поиск утечки / Опрессовка": "🔵 ФРЕОН: Поиск утечки / Опрессовка",
}

def update_labels():
    try:
        print("Updating labels for freon category...")
        for old, new in updates.items():
            supabase.table('predefined_services').update({"name": new}).eq("name", old).execute()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_labels()
