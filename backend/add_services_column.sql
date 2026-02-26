-- Run this SQL in your Supabase SQL Editor to add the services JSON column needed for the checklist feature:
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
