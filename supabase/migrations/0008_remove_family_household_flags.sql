-- 0008: Drop the "Family", "Household", and "Flags & consent" columns from residents,
-- remove their form_fields rows, and fold Address fields into Personal information.

ALTER TABLE residents
  DROP COLUMN IF EXISTS mother_name,
  DROP COLUMN IF EXISTS father_name,
  DROP COLUMN IF EXISTS household_number,
  DROP COLUMN IF EXISTS household_members,
  DROP COLUMN IF EXISTS household_head,
  DROP COLUMN IF EXISTS is_pwd,
  DROP COLUMN IF EXISTS is_senior,
  DROP COLUMN IF EXISTS is_4ps,
  DROP COLUMN IF EXISTS is_indigent,
  DROP COLUMN IF EXISTS consent_given;

DO $$
BEGIN
    IF to_regclass('public.form_fields') IS NOT NULL THEN
        DELETE FROM form_fields
        WHERE name IN (
            'mother_name', 'father_name',
            'household_number', 'household_members', 'household_head',
            'is_pwd', 'is_senior', 'is_4ps', 'is_indigent', 'consent_given'
        );

        UPDATE form_fields
        SET section = 'Personal information'
        WHERE name IN ('province', 'city_municipality', 'barangay', 'street_sitio', 'contact_number');

        UPDATE form_fields
        SET sort_order = CASE name
            WHEN 'province' THEN 25
            WHEN 'city_municipality' THEN 26
            WHEN 'barangay' THEN 27
            WHEN 'street_sitio' THEN 28
            WHEN 'contact_number' THEN 29
            ELSE sort_order
        END
        WHERE name IN ('province', 'city_municipality', 'barangay', 'street_sitio', 'contact_number');
    END IF;
END $$;