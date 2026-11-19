-- Profiles hold what a user tells us in onboarding. A row exists only after onboarding is finished.

create type public.practice_goal as enum ('ielts', 'free_talk');
create type public.cefr_level as enum ('A2', 'B1', 'B2', 'C1');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  goal public.practice_goal not null,
  level public.cefr_level,
  target_band numeric(2, 1) check (target_band between 1 and 9 and mod(target_band * 2, 1) = 0),
  exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Users see and change only their own profile. Partners' names reach sessions in a later
-- migration through a narrow view, not by widening these policies.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
