import os
import logging
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY", "")

if not url or not key:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
    exit(1)

supabase = create_client(url, key)

res = supabase.table("users").select("id, name, phone, latitude, longitude").execute()
if res.data:
    for u in res.data:
        if isinstance(u, dict) and (u.get('latitude') or u.get('longitude')):
            logger.info(f"User: {u.get('name')} ({u.get('phone')}) -> Lat: {u.get('latitude')}, Lng: {u.get('longitude')}")
