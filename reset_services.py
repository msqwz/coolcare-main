import os
import sys

# Ensure we are in the root of the project
project_root = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(project_root, 'backend')

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from database import supabase
    print("Clearing predefined_services table...")
    # Delete all (Supabase requires a filter, using a broad one or RPC)
    # Using 'neq' with an impossible value to clear all
    supabase.table('predefined_services').delete().neq('id', -1).execute()
    print("Success! Table cleared.")

    # Now re-seed with the clean list from the original seed script logic
    from seed_services import services
    print(f"Re-seeding with {len(services)} clean services...")
    supabase.table('predefined_services').insert(services).execute()
    print("Success! Services re-seeded with clean text.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
