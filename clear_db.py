
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
    exit(1)

supabase = create_client(url, key)

def clear_database():
    try:
        # DELETING JOBS FIRST
        print("Cleaning table: jobs...")
        supabase.table('jobs').delete().neq('id', -1).execute() # Deletes all
        
        # CLEANING SMS CODES
        print("Cleaning table: sms_codes...")
        supabase.table('sms_codes').delete().neq('id', -1).execute()
        
        # CLEANING SUBSCRIPTIONS
        print("Cleaning table: push_subscriptions...")
        supabase.table('push_subscriptions').delete().neq('id', -1).execute()
        
        # DELETING WORKERS (except Admins)
        print("Cleaning table: users (keeping admins)...")
        # We delete users who ARE NOT admins or who are not current active login 
        # (keeping all admins for safety)
        res = supabase.table('users').delete().neq('role', 'admin').execute()
        print(f"Deleted {len(res.data) if res.data else 0} non-admin users.")
        
        print("--- DATABASE CLEANUP COMPLETE ---")
        print("Ready for clean start.")
        
    except Exception as e:
        print(f"Cleanup failed: {e}")

if __name__ == "__main__":
    clear_database()
