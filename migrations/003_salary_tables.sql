-- ============================================
-- CoolCare: Зарплатный модуль
-- Запустить в Supabase SQL Editor
-- ============================================

-- === Настройки зарплаты мастера ===
CREATE TABLE IF NOT EXISTS salary_settings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00,
    fixed_bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- === Бонусы и штрафы ===
CREATE TABLE IF NOT EXISTS salary_adjustments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    period_month DATE NOT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- === RLS ===
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_salary_settings" ON salary_settings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_salary_adjustments" ON salary_adjustments FOR SELECT TO anon USING (true);
