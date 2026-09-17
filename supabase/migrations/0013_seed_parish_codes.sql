-- 0013_seed_parish_codes.sql
-- DEPRECATED — superseded by 0016_seed_parish_codes_plain.sql.
--
-- 0016 generates a fresh, displayable (bcrypt + plaintext) code for every
-- parish and prints them, so there is no need to run this file. If you do run
-- it, it only seeds SHA-256 hashed codes; 0016 will rotate those to bcrypt
-- with stored plaintext on its next run.
--
-- Kept pooling-safe (no temporary tables; pgcrypto schema-qualified).

set search_path to public, extensions;

insert into parish_codes (parish_id, code_hash)
select p.id,
       extensions.encode(extensions.digest(c.code, 'sha256'), 'hex')
  from parishes p
  cross join lateral (
    select lpad(floor(random() * 900000 + 100000)::int::text, 6, '0') as code
  ) c
 where not exists (
   select 1 from parish_codes pc
    where pc.parish_id = p.id
 );