-- 0011_activity_log.sql
-- Activity log that timestamp-records every action performed in the system.
-- Also registers the "logs" page for admin and moderator role access.

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

-- Give every role access to the new Activity Log page by default.
-- First widen the page CHECK constraint to admit the new page.
alter table public.role_pages drop constraint if exists role_pages_page_check;
alter table public.role_pages
  add constraint role_pages_page_check
  check (page in ('dashboard', 'records', 'stats', 'logs'));

insert into public.role_pages (role, page)
select r.role, 'logs'
from (values ('admin'), ('moderator')) as r(role)
where not exists (
  select 1 from public.role_pages rp
  where rp.role = r.role and rp.page = 'logs'
);