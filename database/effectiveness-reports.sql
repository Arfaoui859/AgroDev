-- Persist fertilizer/pesticide application effectiveness assessments per user.
-- Apply once in the Supabase SQL Editor for the AgroGrowth project.

create table if not exists public.effectiveness_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists effectiveness_reports_user_created_idx
  on public.effectiveness_reports (user_id, created_at desc);

alter table public.effectiveness_reports enable row level security;

drop policy if exists "Users can read their own effectiveness reports"
  on public.effectiveness_reports;
create policy "Users can read their own effectiveness reports"
  on public.effectiveness_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own effectiveness reports"
  on public.effectiveness_reports;
create policy "Users can insert their own effectiveness reports"
  on public.effectiveness_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.effectiveness_reports to authenticated;
grant all on public.effectiveness_reports to service_role;
