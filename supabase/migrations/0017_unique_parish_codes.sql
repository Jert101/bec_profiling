-- 0017_unique_parish_codes.sql
-- Keeps parish access codes unique end-to-end: the admin's set/rotate RPC now
-- reports a friendly 'duplicate' message instead of surfacing a raw DB error
-- when two parishes are given the same code.
--
-- Run AFTER 0016_seed_parish_codes_plain.sql (which also adds the partial
-- unique index this function relies on).

set search_path to public, extensions;

create or replace function public.parish_code_set(target bigint, new_code text, admin_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  autz text;
begin
  autz := admin_pin_allowed(admin_pin);
  if autz <> 'ok' then
    return autz;   -- 'locked' | 'auth_required'
  end if;

  if new_code is null or length(btrim(new_code)) < 6 then
    return 'too_short';
  end if;

  if not exists (select 1 from parishes where id = target) then
    return 'not_found';
  end if;

  begin
    insert into parish_codes (parish_id, code_hash, code_plain)
    values (target,
            extensions.crypt(btrim(new_code), extensions.gen_salt('bf', 10)),
            btrim(new_code))
    on conflict (parish_id)
    do update set code_hash = excluded.code_hash,
                  code_plain = excluded.code_plain;
  exception
    when unique_violation then
      return 'duplicate';
  end;

  return 'ok';
end;
$$;

grant execute on function public.parish_code_set(bigint, text, text) to anon;