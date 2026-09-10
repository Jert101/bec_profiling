-- Resident Profiling Database — extra personal information fields
-- Run in the Supabase SQL Editor after 0002_family_members.sql.

ALTER TABLE residents ADD COLUMN IF NOT EXISTS matrimony TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS matrimony_date DATE;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS bec_cell_name TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS sacraments TEXT[] DEFAULT '{}';

-- Make the BEC / cell name searchable like the other text fields
CREATE INDEX IF NOT EXISTS residents_bec_cell_name_trgm_idx
  ON residents USING gin (bec_cell_name gin_trgm_ops);