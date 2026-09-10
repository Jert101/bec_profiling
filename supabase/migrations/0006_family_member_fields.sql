-- 0006: Family member fields — Category + Sacraments
-- Run in the Supabase SQL Editor after 0005_vicariates_and_parishes.sql.

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS sacraments TEXT[] DEFAULT '{}';