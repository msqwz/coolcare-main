-- ============================================
-- CoolCare: RLS Policies
-- Запустить в Supabase SQL Editor
-- ============================================

-- === 1. Включаем RLS на таблицах ===
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_codes ENABLE ROW LEVEL SECURITY;

-- === 2. Jobs: чтение для anon (real-time подписки) ===
CREATE POLICY "anon_select_jobs" ON jobs
    FOR SELECT TO anon
    USING (true);

-- === 3. Jobs: полный доступ для service_role (бэкенд) ===
-- service_role обходит RLS автоматически, политика не нужна

-- === 4. Users: чтение для anon (real-time подписки) ===
CREATE POLICY "anon_select_users" ON users
    FOR SELECT TO anon
    USING (true);

-- === 5. Блокировка записи для anon (все мутации через API) ===
-- По умолчанию anon не может INSERT/UPDATE/DELETE — это и нужно
-- Все записи идут через бэкенд с service_role

-- === 6. Push subscriptions: только service_role ===
-- RLS включён, политик для anon нет → anon не может ни читать, ни писать

-- === 7. SMS codes: только service_role ===
-- Аналогично — полная изоляция
