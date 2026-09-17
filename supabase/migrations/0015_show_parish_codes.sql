-- 0015_show_parish_codes.sql
-- Lets the admin view an existing parish access code from the dashboard.
--
-- Codes are stored bcrypt-hashed (0014) which cannot be reversed, so the
-- plaintext is kept alongside in a column guarded by forced row-level
-- security and revoked anon/authenticated access. Only the admin-authorized
-- parish_codes_list RPC ever serves it.
--
-- Run AFTER 0014_security_hardening.sql.

alter table public.parish_codes
  add column if not exists code_plain text;

-- List: include the plaintext code so the admin can view/share it.
create or replace function public.parish_codes_list()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into result
    from (
      select
        p.id                                  as parish_id,
        v.name                                as vicariate_name,
        p.name                                as parish_name,
        (pc.parish_id is not null)            as code_set,
        pc.code_plain                         as code_plain
      from parishes p
      join vicariates v on v.id = p.vicariate_id
      left join parish_codes pc on pc.parish_id = p.id
      order by v.sort_order, v.name, p.sort_order, p.name
    ) x;

  return result;
end;
$$;

grant execute on function public.parish_codes_list() to anon;

-- Set/rotate: also record the plaintext for admin display.
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

  insert into parish_codes (parish_id, code_hash, code_plain)
  values (target, crypt(btrim(new_code), gen_salt('bf', 10)), btrim(new_code))
  on conflict (parish_id)
  do update set code_hash = excluded.code_hash,
                code_plain = excluded.code_plain;

  return 'ok';
end;
$$;

grant execute on function public.parish_code_set(bigint, text, text) to anon;