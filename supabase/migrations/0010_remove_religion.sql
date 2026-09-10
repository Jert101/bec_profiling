-- 0010: Remove the religion field from residents.

ALTER TABLE residents
  DROP COLUMN IF EXISTS religion;

DO $$
BEGIN
    IF to_regclass('public.form_fields') IS NOT NULL THEN
        DELETE FROM form_fields WHERE name = 'religion';
    END IF;
END $$;