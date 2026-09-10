-- Resident Profiling Database — auth (access codes) + dynamic form fields
-- Run in the Supabase SQL Editor after 0003_personal_fields.sql.

-- ---------- 1. Hashing helper (pgcrypto) ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- 2. App users (login codes, stored as SHA-256 hashes) ----------
CREATE TABLE IF NOT EXISTS app_users (
    role_key  TEXT PRIMARY KEY,          -- 'admin' | 'moderator'
    role      TEXT NOT NULL,             -- display name
    code_hash TEXT NOT NULL              -- hex sha256 of the access code
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_users FROM PUBLIC;
REVOKE ALL ON app_users FROM anon;
REVOKE ALL ON app_users FROM authenticated;

-- Seed default codes: admin = 0000, moderator = 1111
INSERT INTO app_users (role_key, role, code_hash) VALUES
    ('admin',      'Admin',     encode(digest('0000', 'sha256'), 'hex')),
    ('moderator',  'Moderator', encode(digest('1111', 'sha256'), 'hex'))
ON CONFLICT (role_key) DO NOTHING;

-- Login: checks the entered PIN against the stored hash.
-- Returns the role_key ('admin' | 'moderator') or NULL.
CREATE OR REPLACE FUNCTION app_login(pin TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT role_key FROM app_users
    WHERE code_hash = encode(digest(pin, 'sha256'), 'hex')
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION app_login(TEXT) TO anon;

-- Change a user's access code. Authorized only with the current admin PIN.
-- Returns the updated role name, or one of: 'auth_required' | 'invalid_pin' | 'not_found'
CREATE OR REPLACE FUNCTION app_change_code(target_key TEXT, new_pin TEXT, admin_pin TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    updated_role TEXT;
BEGIN
    PERFORM 1 FROM app_users
      WHERE role_key = 'admin'
        AND code_hash = encode(digest(admin_pin, 'sha256'), 'hex');
    IF NOT FOUND THEN
        RETURN 'auth_required';
    END IF;

    IF new_pin IS NULL OR length(btrim(new_pin)) < 1 THEN
        RETURN 'invalid_pin';
    END IF;

    UPDATE app_users
       SET code_hash = encode(digest(new_pin, 'sha256'), 'hex')
     WHERE role_key = target_key
     RETURNING role_key INTO updated_role;

    IF updated_role IS NULL THEN
        RETURN 'not_found';
    END IF;

    RETURN updated_role;
END;
$$;

GRANT EXECUTE ON FUNCTION app_change_code(TEXT, TEXT, TEXT) TO anon;

-- ---------- 3. Dynamic form field configuration ----------
-- Admin can show/hide fields, rename labels, change options & required state.
CREATE TABLE IF NOT EXISTS form_fields (
    name       TEXT PRIMARY KEY,   -- column / field key
    section    TEXT NOT NULL,      -- displayed section heading
    label      TEXT NOT NULL,
    type       TEXT NOT NULL,      -- text | date | number | select | multiselect | flag | textarea | repeater
    options    TEXT[] DEFAULT '{}',
    required   BOOLEAN DEFAULT FALSE,
    enabled    BOOLEAN DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_fields_all_access" ON form_fields
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO form_fields (name, section, label, type, options, required, enabled, sort_order) VALUES
    -- Personal information
    ('first_name',       'Personal information', 'First name',                    'text',       '{}',                                                                                    TRUE,  TRUE,  10),
    ('middle_name',      'Personal information', 'Middle name',                   'text',       '{}',                                                                                    FALSE, TRUE,  11),
    ('last_name',        'Personal information', 'Last name',                     'text',       '{}',                                                                                    TRUE,  TRUE,  12),
    ('suffix',           'Personal information', 'Suffix',                        'text',       '{}',                                                                                    FALSE, TRUE,  13),
    ('sex',              'Personal information', 'Sex',                           'select',     ARRAY['Male','Female'],                                                                   FALSE, TRUE,  14),
    ('date_of_birth',    'Personal information', 'Date of birth',                 'date',       '{}',                                                                                    FALSE, TRUE,  15),
    ('civil_status',     'Personal information', 'Civil status',                  'select',     ARRAY['Single','Married','Widowed','Separated','Annulled','Live-in'],                   FALSE, TRUE,  16),
    ('religion',         'Personal information', 'Religion',                      'select',     ARRAY['Roman Catholic','Iglesia ni Cristo','Islam','Protestant','Seventh-day Adventist','Jehovah''s Witnesses','Aglipayan','Born Again Christian','Other','None / Prefer not to say'], FALSE, TRUE,  17),
    ('parish',           'Personal information', 'Parish',                        'select',     ARRAY['St. Michael the Archangel Cathedral','San Lorenzo Ruiz Parish','Our Lady of Fatima Parish','San Roque Parish','Immaculate Conception Parish (Bahayan)','Resurrection of the Lord Filipino-Chinese Catholic Community','San Pedro Calungsod Parish (Kabacsanan)','Our Lady of Perpetual Help Shrine (Tibanga)','Corpus Christi Parish (Tubod)','Lord of the Holy Cross Parish','San Vicente Ferrer Parish','Birhen sa Sto. Rosario Parish (Pala-o)','Inahan sa Kinabuhi (ISK) Parish','San Isidro Labrador Parish (Buru-un)','Other / Outside Iligan City'], FALSE, TRUE, 18),
    ('occupation',       'Personal information', 'Occupation',                    'text',       '{}',                                                                                    FALSE, TRUE,  19),
    ('matrimony',        'Personal information', 'Matrimony',                     'select',     ARRAY['Civil','Church'],                                                                  FALSE, TRUE,  20),
    ('matrimony_date',   'Personal information', 'Matrimony date',                'date',       '{}',                                                                                    FALSE, TRUE,  21),
    ('bec_cell_name',    'Personal information', 'BEC / Cell Name',               'text',       '{}',                                                                                    FALSE, TRUE,  22),
    ('sacraments',       'Personal information', 'Sacraments',                    'multiselect',ARRAY['Baptism','Confirmation','Eucharist','Confession','Anointing of the Sick','Holy Orders','Matrimony'], FALSE, TRUE, 23),

    -- Address
    ('province',         'Address', 'Province',              'select', '{}', FALSE, TRUE, 30),
    ('city_municipality','Address', 'City / Municipality',   'select', '{}', FALSE, TRUE, 31),
    ('barangay',         'Address', 'Barangay',              'select', '{}', FALSE, TRUE, 32),
    ('street_sitio',     'Address', 'Street / Sitio',        'text',   '{}', FALSE, TRUE, 33),
    ('contact_number',   'Address', 'Contact number',        'text',   '{}', FALSE, TRUE, 34),

    -- Family
    ('mother_name',      'Family', 'Mother''s name',         'text',   '{}', FALSE, TRUE, 40),
    ('father_name',      'Family', 'Father''s name',         'text',   '{}', FALSE, TRUE, 41),
    ('family_members',   'Family members', 'Family members', 'repeater','{}', FALSE, TRUE, 50),

    -- Household
    ('household_number', 'Household', 'Household number',            'text',   '{}', FALSE, TRUE, 60),
    ('household_members','Household', 'Household members (count)',   'number', '{}', FALSE, TRUE, 61),
    ('household_head',   'Household', 'Household head',              'text',   '{}', FALSE, TRUE, 62),

    -- Flags & consent
    ('is_pwd',           'Flags & consent', 'PWD',              'flag', '{}', FALSE, TRUE, 70),
    ('is_senior',        'Flags & consent', 'Senior citizen',   'flag', '{}', FALSE, TRUE, 71),
    ('is_4ps',           'Flags & consent', '4Ps beneficiary',  'flag', '{}', FALSE, TRUE, 72),
    ('is_indigent',      'Flags & consent', 'Indigent',         'flag', '{}', FALSE, TRUE, 73),
    ('consent_given',    'Flags & consent', 'Consent given',    'flag', '{}', FALSE, TRUE, 74),

    -- Notes
    ('notes',            'Notes', 'Notes / remarks', 'textarea', '{}', FALSE, TRUE, 80),
    ('recorded_by',      'Notes', 'Recorded by',     'text',     '{}', FALSE, TRUE, 81)

ON CONFLICT (name) DO NOTHING;