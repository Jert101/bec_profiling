-- 0016_seed_parish_codes_plain.sql
-- Generates a random 6-digit access code for every parish that does not yet
-- have a displayable one, stores it as bcrypt hash + plaintext, and prints the
-- full code list so the administrator can save and share it.
--
-- Safe to re-run: parishes that already have a visible code are untouched.
-- No temporary tables are used (each statement may run on a different pooled
-- connection in the Supabase SQL Editor, which breaks session temp tables).

set search_path to public, extensions;

-- Generate codes for parishes without a displayable code, and store both the
-- bcrypt hash and the plaintext.
insert into parish_codes (parish_id, code_hash, code_plain)
select p.id,
       extensions.crypt(c.code, extensions.gen_salt('bf', 10)),
       c.code
  from parishes p
  cross join lateral (
    select lpad(floor(random() * 900000 + 100000)::int::text, 6, '0') as code
  ) c
 where not exists (
   select 1 from parish_codes pc
    where pc.parish_id = p.id
      and pc.code_plain is not null
 );

-- Print every parish and its current access code (NULL = not set yet).
select p.id as parish_id,
       p.name as parish_name,
       pc.code_plain as access_code
  from parishes p
  left join parish_codes pc on pc.parish_id = p.id
 order by p.id;