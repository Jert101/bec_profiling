-- 0012_parish_access_codes.sql
-- Per-parish access codes: holders of a parish code can only view/manage
-- records belonging to that parish. The global "moderator" role is removed;
-- access is now Admin (everything) + one code per parish.
--
-- This file is self-contained: it also (re-)creates the activity log and
-- refreshes the role_pages constraints, so it can be applied whether or not
-- 0011_activity_log.sql has been run.

-- ---------- 1. Guarantee the activity log exists (idempotent) ----------
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  acted_by text,
  action text not null,
  entity text not null,
  entity_id bigint,
  details jsonb
);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log select open" on public.activity_log;
create policy "activity_log select open"
  on public.activity_log for select
  using (true);

drop policy if exists "activity_log insert open" on public.activity_log;
create policy "activity_log insert open"
  on public.activity_log for insert
  with check (true);

drop policy if exists "activity_log delete open" on public.activity_log;
create policy "activity_log delete open"
  on public.activity_log for delete
  using (true);

create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

create index if not exists activity_log_entity_idx
  on public.activity_log (entity);

create index if not exists activity_log_action_idx
  on public.activity_log (action);

-- ---------- 2. Widen role_pages to admit the parish role ----------
alter table public.role_pages drop constraint if exists role_pages_role_check;
alter table public.role_pages
  add constraint role_pages_role_check
  check (role in ('admin', 'moderator', 'parish'));

alter table public.role_pages drop constraint if exists role_pages_page_check;
alter table public.role_pages
  add constraint role_pages_page_check
  check (page in ('dashboard', 'records', 'stats', 'logs'));

-- ---------- 3. Remove the global moderator ----------
delete from public.role_pages where role = 'moderator';
delete from public.app_users where role_key = 'moderator';

-- ---------- 4. Role default page access ----------
insert into public.role_pages (role, page)
select r.role, p.page
from (values ('admin'), ('parish')) as r(role)
cross join (values ('dashboard'), ('records'), ('stats'), ('logs')) as p(page)
where not exists (
  select 1 from public.role_pages rp
  where rp.role = r.role and rp.page = p.page
);

-- Parish holders only get Records + Stats.
delete from public.role_pages
where role = 'parish' and page in ('dashboard', 'logs');

-- ---------- 5. Residents: bind to a real parish id ----------
alter table residents add column if not exists parish_id bigint references parishes(id) on delete set null;

-- Backfill parish_id from the stored parish name (old records).
update residents r
   set parish_id = (select min(p.id) from parishes p where p.name = r.parish)
 where r.parish_id is null and r.parish is not null;

create index if not exists residents_parish_id_idx on residents (parish_id);

-- ---------- 6. Per-parish access codes table ----------
create table if not exists public.parish_codes (
  parish_id  bigint primary key references parishes(id) on delete cascade,
  code_hash  text not null,          -- hex sha256 of the access code
  created_at timestamptz not null default now()
);

alter table public.parish_codes enable row level security;
alter table public.parish_codes force row level security;

revoke all on public.parish_codes from public;
revoke all on public.parish_codes from anon;
revoke all on public.parish_codes from authenticated;

-- ---------- 7. Login: admin first, then per-parish codes ----------
create or replace function public.app_login(pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  found_role  text;
  found_parish bigint;
begin
  select role_key into found_role
    from app_users
   where code_hash = encode(digest(pin, 'sha256'), 'hex')
   limit 1;

  if found_role is not null then
    return found_role;
  end if;

  select parish_id into found_parish
    from parish_codes
   where code_hash = encode(digest(pin, 'sha256'), 'hex')
   limit 1;

  if found_parish is not null then
    return 'parish:' || found_parish;
  end if;

  return null;
end;
$$;

grant execute on function public.app_login(text) to anon;

-- ---------- 8. Manage parish codes (admin PIN required) ----------
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
        (pc.parish_id is not null)            as code_set
      from parishes p
      join vicariates v on v.id = p.vicariate_id
      left join parish_codes pc on pc.parish_id = p.id
      order by v.sort_order, v.name, p.sort_order, p.name
    ) x;

  return result;
end;
$$;

grant execute on function public.parish_codes_list() to anon;

create or replace function public.parish_code_set(target bigint, new_code text, admin_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform 1 from app_users
   where role_key = 'admin'
     and code_hash = encode(digest(admin_pin, 'sha256'), 'hex');

  if not found then
    return 'auth_required';
  end if;

  if new_code is null or length(btrim(new_code)) < 6 then
    return 'too_short';
  end if;

  if not exists (select 1 from parishes where id = target) then
    return 'not_found';
  end if;

  insert into parish_codes (parish_id, code_hash)
  values (target, encode(digest(btrim(new_code), 'sha256'), 'hex'))
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
begin
  perform 1 from app_users
   where role_key = 'admin'
     and code_hash = encode(digest(admin_pin, 'sha256'), 'hex');

  if not found then
    return 'auth_required';
  end if;

  delete from parish_codes where parish_id = target;

  if not found then
    return 'not_found';
  end if;

  return 'ok';
end;
$$;

grant execute on function public.parish_code_clear(bigint, text) to anon;