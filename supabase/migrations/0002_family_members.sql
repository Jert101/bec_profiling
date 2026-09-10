-- Resident Profiling Database — family members table
-- Run in the Supabase SQL Editor after 0001_init.sql.

CREATE TABLE IF NOT EXISTS family_members (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resident_id BIGINT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    relationship TEXT,
    sex         TEXT,
    age         INTEGER,
    occupation  TEXT,
    date_added  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS family_members_resident_idx ON family_members (resident_id);

-- Open access for the MVP (same policy style as residents)
CREATE POLICY "family_members_all_access" ON family_members
  FOR ALL
  USING (true)
  WITH CHECK (true);