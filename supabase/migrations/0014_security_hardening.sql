-- 0014_security_hardening.sql
-- Tier-1 security hardening:
--   1. bcrypt hashing for app_users + parish_codes (pgcrypto crypt/gen_salt).
--      Existing SHA-256 hashes stay valid: they are verified with the legacy
--      path and transparently upgraded to bcrypt the first time each code is
--      used. New/changed codes are always stored as bcrypt.
--   2. Login brute-force lockout: after 5 failed attempts for the same access
--      code within 15 minutes the code is locked until the window passes.
--   3. Same lockout applied to admin-PIN authorisation for changing codes.
--
-- Run AFTER 0012_parish_access_codes.sql (and optionally 0013_seed_parish_codes.sql).

-- ---------- 1. Lockout tracking table ----------
create table if not exists public.login_attempts (
  id           bigint generated always as identity primary key,
  lock_key     text not null,
  attempted_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;

revoke all on public.login_attempts from public;
revoke all on public.login_attempts from anon;
revoke all on public.login_attempts from authenticated;

create index if not exists login_attempts_key_time_idx
  on public.login_attempts (lock_key, attempted_at);

-- ---------- 2. Helpers ----------
-- Compare a PIN against a stored hash that is either bcrypt ('$2a$...') or the
-- legacy hex SHA-256. Never raises for malformed salts.
drop function if exists public.credential_matches(text, text);
create function public.credential_matches(pin text, stored text)
returns boolean
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when pin is null or stored is null then false
    when stored like '$2%' then stored = crypt(pin, stored)
    else stored = encode(digest(pin, 'sha256'), 'hex')
  end;
$$;

-- True when the given key has reached the failure cap in the last 15 minutes.
drop function if exists public.credential_is_locked(text, int);
create function public.credential_is_locked(klock text, max_attempts int default 5)
returns boolean
language sql
stable
set search_path = public, extensions
as $$
  select count(*) >= max_attempts
    from public.login_attempts
   where lock_key = klock
     and attempted_at >= now() - interval '15 minutes';
$$;

-- Record one failed attempt.
drop function if exists public.record_failed_login(text);
create function public.record_failed_login(klock text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.login_attempts (lock_key) values (klock);
end;
$$;

-- Authorise an admin PIN, enforcing the lockout. Returns
-- 'ok' | 'auth_required' | 'locked'. Purges stale attempts, records failures,
-- and resets the counter on success.
drop function if exists public.admin_pin_allowed(text);
create function public.admin_pin_allowed(admin_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  delete from public.login_attempts where attempted_at < now() - interval '15 minutes';

  if credential_is_locked(admin_pin) then
    return 'locked';
  end if;

  select true into ok
    from public.app_users
   where role_key = 'admin'
     and credential_matches(admin_pin, code_hash);

  if ok is distinct from true then
    perform record_failed_login(admin_pin);
    return 'auth_required';
  end if;

  delete from public.login_attempts where lock_key = admin_pin;
  return 'ok';
end;
$$;

-- ---------- 3. Login (bcrypt-aware + lockout + legacy upgrade) ----------
create or replace function public.app_login(pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  found_role    text;
  found_parish  bigint;
  stored_hash   text;
begin
  delete from public.login_attempts where attempted_at < now() - interval '15 minutes';

  if credential_is_locked(pin) then
    return 'locked';
  end if;

  select role_key, code_hash into found_role, stored_hash
    from public.app_users
   where credential_matches(pin, code_hash)
   limit 1;

  if found_role is not null then
    if stored_hash not like '$2%' then
      update public.app_users
         set code_hash = crypt(pin, gen_salt('bf', 10))
       where role_key = found_role;
    end if;
    delete from public.login_attempts where lock_key = pin;
    return found_role;
  end if;

  select parish_id, code_hash into found_parish, stored_hash
    from public.parish_codes
   where credential_matches(pin, code_hash)
   limit 1;

  if found_parish is not null then
    if stored_hash not like '$2%' then
      update public.parish_codes
         set code_hash = crypt(pin, gen_salt('bf', 10))
       where parish_id = found_parish;
    end if;
    delete from public.login_attempts where lock_key = pin;
    return 'parish:' || found_parish;
  end if;

  perform record_failed_login(pin);
  return null;
end;
$$;

grant execute on function public.app_login(text) to anon;

-- ---------- 4. Change a user's access code (bcrypt + admin lockout) ----------
create or replace function public.app_change_code(target_key text, new_pin text, admin_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  autz          text;
  updated_role  text;
begin
  autz := admin_pin_allowed(admin_pin);
  if autz <> 'ok' then
    return autz;   -- 'locked' | 'auth_required'
  end if;

  if new_pin is null or length(btrim(new_pin)) < 1 then
    return 'invalid_pin';
  end if;

  update app_users
     set code_hash = crypt(btrim(new_pin), gen_salt('bf', 10))
   where role_key = target_key
   returning role_key into updated_role;

  if updated_role is null then
    return 'not_found';
  end if;

  return updated_role;
end;
$$;

grant execute on function public.app_change_code(text, text, text) to anon;

-- ---------- 5. Manage parish codes (bcrypt + admin lockout) ----------
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

  insert into parish_codes (parish_id, code_hash)
  values (target, crypt(btrim(new_code), gen_salt('bf', 10)))
  on conflict (parish_id)
  do update set code_hash = excluded.code_hash;

  return 'ok';
end;
$$;

grant execute on function public.parish_code_set(bigint, text, text) to anon;

create or replace function public.parish_code_clear(target bigint, admin_pin text)
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

  delete from parish_codes where parish_id = target;

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

grant execute on function public.parish_code_clear(bigint, text) to anon;