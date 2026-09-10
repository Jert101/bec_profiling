-- Resident Profiling Database — Supabase migration
-- Run this in the Supabase SQL Editor (or via `supabase db push`).

-- Enable trigram search for faster ILIKE filtering
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS residents (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name       TEXT NOT NULL,
    middle_name      TEXT,
    last_name        TEXT NOT NULL,
    suffix           TEXT,
    sex              TEXT,
    date_of_birth    DATE,
    civil_status     TEXT,
    religion         TEXT,
    parish           TEXT,
    barangay         TEXT,
    street_sitio     TEXT,
    city_municipality TEXT,
    province         TEXT,
    contact_number   TEXT,
    occupation       TEXT,
    mother_name      TEXT,
    father_name      TEXT,
    household_number TEXT,
    household_members INTEGER,
    household_head   TEXT,
    is_pwd           BOOLEAN DEFAULT FALSE,
    is_senior        BOOLEAN DEFAULT FALSE,
    is_4ps           BOOLEAN DEFAULT FALSE,
    is_indigent      BOOLEAN DEFAULT FALSE,
    consent_given    BOOLEAN DEFAULT FALSE,
    notes            TEXT,
    recorded_by      TEXT,
    date_recorded    TIMESTAMPTZ DEFAULT NOW()
);

-- Standard name sort order
CREATE INDEX IF NOT EXISTS residents_name_idx ON residents (last_name, first_name);

-- Index the searchable text fields with trigram for ILIKE '%...%' queries
CREATE INDEX IF NOT EXISTS residents_first_name_trgm_idx ON residents USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_middle_name_trgm_idx ON residents USING gin (middle_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_last_name_trgm_idx ON residents USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_barangay_trgm_idx ON residents USING gin (barangay gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_city_trgm_idx ON residents USING gin (city_municipality gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_occupation_trgm_idx ON residents USING gin (occupation gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_contact_trgm_idx ON residents USING gin (contact_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS residents_religion_trgm_idx ON residents USING gin (religion gin_trgm_ops);