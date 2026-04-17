import os
import sys

# Ensure we are in the root of the project
project_root = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(project_root, 'backend')

# Add backend to path to import database
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from database import supabase
    from collections import Counter

    print(f"Checking database using Supabase URL: {supabase.supabase_url}")
    
    res = supabase.table('predefined_services').select('id, name').execute()
    if not res.data:
        print("No services found in predefined_services.")
        sys.exit(0)
        
    names = [r['name'] for r in res.data]
    counts = Counter(names)
    dupes = {name: count for name, count in counts.items() if count > 1}
    
    if dupes:
        print(f"FOUND {len(dupes)} DUPLICATE NAMES:")
        for name, count in dupes.items():
            ids = [r['id'] for r in res.data if r['name'] == name]
            print(f" - '{name}': {count} times (IDs: {ids})")
        
        print("\nTo fix this, you can delete the extra IDs.")
    else:
        print("No duplicates found by name in predefined_services table.")
        print(f"Total services: {len(res.data)}")

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
