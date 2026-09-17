-- 0016_seed_parish_codes_plain.sql
-- Seeder that guarantees every parish has a displayable access code.
--
-- For every parish whose current code has no stored plaintext (e.g. codes
-- seeded by 0013 before the plaintext column existed), a fresh random 6-digit
-- code is generated, stored as both bcrypt hash and plaintext, and printed as
-- a result grid for the administrator.
--
-- Safe to re-run; parishes that already have a visible code are left unchanged.
-- Run AFTER 0015_show_parish_codes.sql.

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
    if not exists (
      select 1 from parish_codes pc
       where pc.parish_id = p.id
         and pc.code_plain is not null
    ) then
      new_code := lpad(floor(random() * 900000 + 100000)::int::text, 6, '0');
      insert into parish_codes (parish_id, code_hash, code_plain)
      values (p.id, crypt(new_code, gen_salt('bf', 10)), new_code)
      on conflict (parish_id)
      do update set code_hash = excluded.code_hash,
                    code_plain = excluded.code_plain;
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