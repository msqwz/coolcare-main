-- =========================================================================
-- ЗАЩИТА БАЗЫ ДАННЫХ COOLCARE
-- Этот скрипт удаляет небезопасные публичные политики и закрывает базу данных
-- от прямого доступа из интернета. 
-- =========================================================================

-- 1. Удаляем небезопасные политики, позволяющие доступ ЛЮБОМУ анонимному пользователю
DROP POLICY IF EXISTS "Allow all for anon" ON users;
DROP POLICY IF EXISTS "Allow all for anon" ON jobs;
DROP POLICY IF EXISTS "Allow all for anon" ON sms_codes;
DROP POLICY IF EXISTS "Allow all for anon" ON push_subscriptions;

-- Убеждаемся, что RLS (Row Level Security) включен на всех таблицах
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Теперь доступ к базе будет иметь только backend через Service Role Key.
-- Политики больше создавать не нужно, так как Service Role игнорирует RLS.
