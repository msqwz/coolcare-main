-- ============================================
-- CoolCare: Telegram-бот для клиентов
-- Запустить в Supabase SQL Editor
-- ============================================

-- === Клиенты Telegram ===
CREATE TABLE IF NOT EXISTS client_telegram (
    id SERIAL PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT,
    state TEXT NOT NULL DEFAULT 'idle',
    state_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- === Оценки работы мастера ===
CREATE TABLE IF NOT EXISTS job_ratings (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
    chat_id TEXT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(job_id)
);

-- === Связь заявки с Telegram клиентом (для уведомлений) ===
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_chat_id TEXT;

-- === RLS ===
ALTER TABLE client_telegram ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_job_ratings" ON job_ratings FOR SELECT TO anon USING (true);
