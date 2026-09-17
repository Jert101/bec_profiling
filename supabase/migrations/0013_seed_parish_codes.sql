-- 0013_seed_parish_codes.sql
-- Seeder: gives every registered parish its own access code.
--
-- Run this in the Supabase SQL Editor AFTER 0012_parish_access_codes.sql.
--
-- For every parish that does not yet have a code, this generates a random
-- 6-digit access code, stores only its hash, and prints the plaintext codes
-- as a result grid so the administrator can save and share them.
--
-- Re-running is safe: parishes that already have a code are left untouched.

set search_path to public, extensions;

create temp table seeded_parish_codes (
  parish_id   bigint,
  parish_name text,
  access_code text
);

do $$
declare
  p         record;
  new_code  text;
begin
  for p in
    select p2.id, p2.name
      from parishes p2
     order by p2.id
  loop
    if not exists (select 1 from parish_codes where parish_id = p.id) then
      -- Random 6-digit code (100000..999999), stored hashed only.
      new_code := lpad(floor(random() * 900000 + 100000)::int::text, 6, '0');
      insert into parish_codes (parish_id, code_hash)
      values (p.id, encode(digest(new_code, 'sha256'), 'hex'));
      insert into seeded_parish_codes (parish_id, parish_name, access_code)
      values (p.id, p.name, new_code);
    end if;
  end loop;
end
$$;

select parish_id, parish_name, access_code
  from seeded_parish_codes
 order by parish_id;

drop table seeded_parish_codes;