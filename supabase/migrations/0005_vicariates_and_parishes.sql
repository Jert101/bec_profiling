-- 0005: Vicariate field + admin-managed Vicariates & Parishes
-- Run in the Supabase SQL Editor after 0004_auth_and_form_fields.sql.

ALTER TABLE residents ADD COLUMN IF NOT EXISTS vicariate TEXT;

-- Admin-managed hierarchy: a Vicariate has many Parishes.
CREATE TABLE IF NOT EXISTS vicariates (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS parishes (
    id            BIGSERIAL PRIMARY KEY,
    vicariate_id  BIGINT NOT NULL REFERENCES vicariates(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    UNIQUE (vicariate_id, name)
);

ALTER TABLE vicariates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vicariates_all_access" ON vicariates;
CREATE POLICY "vicariates_all_access" ON vicariates
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parishes_all_access" ON parishes;
CREATE POLICY "parishes_all_access" ON parishes
  FOR ALL USING (true) WITH CHECK (true);

-- Add the Vicariate field to the dynamic form (between Religion and Parish),
-- and shift the fields after it down by one. Safe if form_fields is absent.
DO $$
BEGIN
    IF to_regclass('public.form_fields') IS NOT NULL THEN
        INSERT INTO form_fields (name, section, label, type, options, required, enabled, sort_order)
        VALUES ('vicariate', 'Personal information', 'Vicariate', 'select', '{}', FALSE, TRUE, 18)
        ON CONFLICT (name) DO NOTHING;

        UPDATE form_fields SET sort_order = 19 WHERE name = 'parish';
        UPDATE form_fields SET sort_order = 20 WHERE name = 'occupation';
        UPDATE form_fields SET sort_order = 21 WHERE name = 'matrimony';
        UPDATE form_fields SET sort_order = 22 WHERE name = 'matrimony_date';
        UPDATE form_fields SET sort_order = 23 WHERE name = 'bec_cell_name';
        UPDATE form_fields SET sort_order = 24 WHERE name = 'sacraments';
    END IF;
END $$;