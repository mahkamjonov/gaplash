-- Practice sessions between two people. The host creates a session and shares its unguessable
-- invite code; the first other person to open the link becomes the guest. The live room's state
-- is stored here, so a refresh or a dropped connection resumes where the pair left off.

create type public.session_mode as enum ('ielts', 'free_talk');
create type public.session_status as enum ('scheduled', 'live', 'completed', 'cancelled');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  guest_id uuid references auth.users (id) on delete set null,
  mode public.session_mode not null,
  status public.session_status not null default 'scheduled',
  scheduled_at timestamptz not null default now(),
  invite_code text not null unique
    default translate(rtrim(encode(uuid_send(gen_random_uuid()), 'base64'), '='), '+/', '-_'),
  room_state jsonb not null default '{}'::jsonb,
  room_version integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_guest_is_not_host check (guest_id is null or guest_id <> host_id),
  constraint sessions_room_state_size check (pg_column_size(room_state) <= 16384)
);

create index sessions_host_id_idx on public.sessions (host_id);
create index sessions_guest_id_idx on public.sessions (guest_id);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;

-- Participants can read their own sessions. There are no write policies: every change goes
-- through the functions below, which check who is calling.
create policy "sessions_select_participant" on public.sessions
  for select to authenticated
  using ((select auth.uid()) = host_id or (select auth.uid()) = guest_id);

create function public.create_session(p_mode public.session_mode, p_scheduled_at timestamptz default null)
returns public.sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions;
begin
  if v_user is null then
    raise exception 'not_signed_in';
  end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'no_profile';
  end if;
  if p_scheduled_at is not null
     and (p_scheduled_at < now() - interval '10 minutes' or p_scheduled_at > now() + interval '90 days') then
    raise exception 'bad_time';
  end if;
  if (
    select count(*) from public.sessions
    where host_id = v_user and status = 'scheduled' and scheduled_at > now() - interval '3 hours'
  ) >= 20 then
    raise exception 'too_many';
  end if;

  insert into public.sessions (host_id, mode, scheduled_at)
  values (v_user, p_mode, coalesce(p_scheduled_at, now()))
  returning * into v_session;

  return v_session;
end;
$$;

-- What the invite page shows before someone joins. Only the host's display name is revealed.
create function public.get_invite(p_code text)
returns table (
  session_id uuid,
  mode public.session_mode,
  status public.session_status,
  scheduled_at timestamptz,
  host_name text,
  is_host boolean,
  is_guest boolean,
  is_full boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.mode,
    s.status,
    s.scheduled_at,
    p.display_name,
    s.host_id = auth.uid(),
    coalesce(s.guest_id = auth.uid(), false),
    s.guest_id is not null and s.guest_id <> auth.uid() and s.host_id <> auth.uid()
  from public.sessions s
  left join public.profiles p on p.id = s.host_id
  where s.invite_code = p_code
    and auth.uid() is not null;
$$;

create function public.join_session(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions;
begin
  if v_user is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_session from public.sessions where invite_code = p_code for update;
  if not found then
    raise exception 'not_found';
  end if;

  if v_session.host_id = v_user or v_session.guest_id = v_user then
    return v_session.id;
  end if;
  if v_session.status in ('completed', 'cancelled') then
    raise exception 'closed';
  end if;
  if v_session.guest_id is not null then
    raise exception 'full';
  end if;
  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'no_profile';
  end if;

  update public.sessions set guest_id = v_user where id = v_session.id;
  return v_session.id;
end;
$$;

-- The caller's sessions with the partner's display name. The invite code is shown to the host only.
create function public.my_sessions()
returns table (
  id uuid,
  mode public.session_mode,
  status public.session_status,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  is_host boolean,
  partner_name text,
  invite_code text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.mode,
    s.status,
    s.scheduled_at,
    s.started_at,
    s.ended_at,
    s.host_id = auth.uid(),
    p.display_name,
    case when s.host_id = auth.uid() then s.invite_code end
  from public.sessions s
  left join public.profiles p
    on p.id = case when s.host_id = auth.uid() then s.guest_id else s.host_id end
  where auth.uid() = s.host_id or auth.uid() = s.guest_id
  order by s.scheduled_at;
$$;

create function public.get_room(p_session_id uuid)
returns table (
  session_id uuid,
  mode public.session_mode,
  status public.session_status,
  scheduled_at timestamptz,
  is_host boolean,
  my_id uuid,
  my_name text,
  partner_id uuid,
  partner_name text,
  invite_code text,
  room_state jsonb,
  room_version integer,
  server_now timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.mode,
    s.status,
    s.scheduled_at,
    s.host_id = auth.uid(),
    auth.uid(),
    me.display_name,
    case when s.host_id = auth.uid() then s.guest_id else s.host_id end,
    partner.display_name,
    case when s.host_id = auth.uid() then s.invite_code end,
    s.room_state,
    s.room_version,
    now()
  from public.sessions s
  left join public.profiles me on me.id = auth.uid()
  left join public.profiles partner
    on partner.id = case when s.host_id = auth.uid() then s.guest_id else s.host_id end
  where s.id = p_session_id
    and (auth.uid() = s.host_id or auth.uid() = s.guest_id);
$$;

-- Saves the room's state if nobody else changed it first. On a version mismatch nothing is
-- written and the current state comes back, so the caller can catch up and try again.
create function public.update_room(
  p_session_id uuid,
  p_expected_version integer,
  p_state jsonb,
  p_status public.session_status default null
)
returns table (
  applied boolean,
  room_version integer,
  room_state jsonb,
  status public.session_status,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := auth.uid();
  v_session public.sessions;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found
     or v_user is null
     or (v_user is distinct from v_session.host_id and v_user is distinct from v_session.guest_id) then
    raise exception 'not_found';
  end if;
  if v_session.status in ('completed', 'cancelled') then
    raise exception 'closed';
  end if;
  if p_status is not null and p_status not in ('live', 'completed') then
    raise exception 'bad_status';
  end if;
  if jsonb_typeof(p_state) is distinct from 'object' then
    raise exception 'bad_state';
  end if;

  if v_session.room_version <> p_expected_version then
    return query select false, v_session.room_version, v_session.room_state, v_session.status, now();
    return;
  end if;

  return query
    with updated as (
      update public.sessions s
      set room_state = p_state,
          room_version = s.room_version + 1,
          status = coalesce(p_status, s.status),
          started_at = case
            when coalesce(p_status, s.status) = 'live' then coalesce(s.started_at, now())
            else s.started_at
          end,
          ended_at = case when p_status = 'completed' then now() else s.ended_at end
      where s.id = p_session_id
      returning s.room_version, s.room_state, s.status
    )
    select true, updated.room_version, updated.room_state, updated.status, now() from updated;
end;
$$;

create function public.cancel_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sessions
  set status = 'cancelled'
  where id = p_session_id and host_id = auth.uid() and status = 'scheduled';
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

-- Supabase grants new functions to signed-out visitors too. These are for signed-in users only.
revoke execute on function public.create_session(public.session_mode, timestamptz) from public, anon;
revoke execute on function public.get_invite(text) from public, anon;
revoke execute on function public.join_session(text) from public, anon;
revoke execute on function public.my_sessions() from public, anon;
revoke execute on function public.get_room(uuid) from public, anon;
revoke execute on function public.update_room(uuid, integer, jsonb, public.session_status) from public, anon;
revoke execute on function public.cancel_session(uuid) from public, anon;

grant execute on function public.create_session(public.session_mode, timestamptz) to authenticated;
grant execute on function public.get_invite(text) to authenticated;
grant execute on function public.join_session(text) to authenticated;
grant execute on function public.my_sessions() to authenticated;
grant execute on function public.get_room(uuid) to authenticated;
grant execute on function public.update_room(uuid, integer, jsonb, public.session_status) to authenticated;
grant execute on function public.cancel_session(uuid) to authenticated;
