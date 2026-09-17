-- 0016_seed_parish_codes_plain.sql
-- Rotates EVERY parish to a fresh, guaranteed-unique 6-digit access code,
-- stored as bcrypt hash + plaintext, then prints the full list.
--
-- Runs as a single DO block (one statement) so it is safe under the SQL
-- Editor's pooled connections. A partial unique index on code_plain stops
-- duplicates from ever being stored again.
--
-- Safe to re-run; it simply regenerates the codes each time.

set search_path to public, extensions;

do $$
declare
  p        record;
  new_code text;
  used     boolean;
begin
  for p in
    select id, name
      from parishes
     order by id
  loop
    -- Pick a 6-digit code that no other parish currently uses.
    loop
      new_code := lpad(floor(random() * 900000 + 100000)::int::text, 6, '0');
      select exists(
        select 1 from parish_codes where code_plain = new_code
      ) into used;
      exit when not used;
    end loop;

    update parish_codes
       set code_hash = extensions.crypt(new_code, extensions.gen_salt('bf', 10)),
           code_plain = new_code
     where parish_id = p.id;

    if not found then
      insert into parish_codes (parish_id, code_hash, code_plain)
      values (p.id,
              extensions.crypt(new_code, extensions.gen_salt('bf', 10)),
              new_code);
    end if;
  end loop;
end
$$;

-- Enforce uniqueness going forward (partial index, ignores NULL plaintext).
create unique index if not exists parish_codes_code_plain_uq
  on parish_codes (code_plain)
  where code_plain is not null;

-- Print every parish and its current access code.
select p.id as parish_id,
       p.name as parish_name,
       pc.code_plain as access_code
  from parishes p
  left join parish_codes pc on pc.parish_id = p.id
 order by p.id;