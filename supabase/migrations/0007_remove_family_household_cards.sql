-- 0007: Remove the "Family" and "Household" cards from the dynamic form.
-- Keeps the underlying residents columns; only the form sections are removed.

DO $$
BEGIN
    IF to_regclass('public.form_fields') IS NOT NULL THEN
        DELETE FROM form_fields
        WHERE name IN ('mother_name', 'father_name', 'household_number', 'household_members', 'household_head');
    END IF;
END $$;