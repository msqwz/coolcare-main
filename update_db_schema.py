
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

def add_column():
    # Supabase-py doesn't have ALTER TABLE. 
    # But we can try to use a little trick or just use the RPC if we had one.
    # Since I don't have SQL access via this client, I'll recommend the user to run it.
    print("WARNING: Please run the following SQL in your Supabase Dashboard:")
    print("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(200);")
    print("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source VARCHAR(100);")
    print("ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;")
    
if __name__ == "__main__":
    add_column()
