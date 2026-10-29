-- ============ KIVORA initial schema ============

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'INR',
  onboarded boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  event_type text not null default 'other',
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  timezone text not null default 'Asia/Kolkata',
  venue text,
  location_mode text not null default 'in_person' check (location_mode in ('in_person','online','hybrid')),
  guest_estimate integer,
  capacity integer,
  volunteer_target integer,
  total_budget bigint not null default 0,
  currency text not null default 'INR' check (char_length(currency) = 3 and currency = upper(currency)),
  theme text,
  palette text,
  formality text,
  food_preferences text,
  entertainment text,
  cultural_notes text,
  accessibility_notes text,
  sustainability_notes text,
  priorities text,
  status text not null default 'planning' check (status in ('planning','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- event memberships ----------
create table public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','editor','viewer')),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- vendors ----------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  notes text,
  quote_amount bigint,
  status text not null default 'researching' check (status in ('researching','contacted','quoted','booked','declined')),
  follow_up_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- budget items ----------
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null default 'other',
  description text not null,
  planned_amount bigint not null default 0,
  quoted_amount bigint,
  actual_amount bigint,
  status text not null default 'planned' check (status in ('planned','quoted','partially_paid','paid')),
  vendor_id uuid references public.vendors(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'other',
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  due_date date,
  due_time time,
  assignee_member_id uuid references public.event_members(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  source text not null default 'manual' check (source in ('manual','ai','starter')),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- guests ----------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  group_name text,
  email text,
  phone text,
  invitation_status text not null default 'not_invited' check (invitation_status in ('not_invited','invited')),
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','attending','declined','maybe')),
  rsvp_at timestamptz,
  rsvp_notes text,
  plus_one boolean not null default false,
  dietary_notes text,
  accessibility_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- invitation tokens ----------
create table public.invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  kind text not null default 'guest' check (kind in ('guest','collaborator')),
  role text check (role in ('editor','viewer')),
  token text not null unique,
  revoked boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- ---------- agenda items (run sheet) ----------
create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  day_date date,
  start_time time not null,
  end_time time,
  title text not null,
  location text,
  person text,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- inspiration items ----------
create table public.inspiration_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'decor',
  notes text,
  image_url text,
  source_link text,
  created_at timestamptz not null default now()
);

-- ---------- AI plans ----------
create table public.ai_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  content jsonb not null,
  model text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- activity log ----------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index events_owner_idx on public.events(owner_id);
create index events_start_date_idx on public.events(start_date);
create index event_members_event_idx on public.event_members(event_id);
create index event_members_user_idx on public.event_members(user_id);
create index tasks_event_idx on public.tasks(event_id);
create index tasks_due_idx on public.tasks(event_id, due_date);
create index budget_items_event_idx on public.budget_items(event_id);
create index vendors_event_idx on public.vendors(event_id);
create index guests_event_idx on public.guests(event_id);
create index agenda_event_idx on public.agenda_items(event_id, position);
create index inspiration_user_idx on public.inspiration_items(user_id);
create index inspiration_event_idx on public.inspiration_items(event_id);
create index ai_plans_event_idx on public.ai_plans(event_id, created_at);
create index notifications_user_idx on public.notifications(user_id, read, created_at);
create index activity_event_idx on public.activity_log(event_id, created_at);

-- ---------- helper functions ----------
create or replace function public.kivora_event_role(_event_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.event_members
  where event_id = _event_id and user_id = auth.uid()
$$;

create or replace function public.kivora_can_edit(_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_members
    where event_id = _event_id and user_id = auth.uid() and role in ('owner','editor')
  )
$$;

create or replace function public.kivora_event_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_members (event_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (event_id, user_id) do nothing;
  return new;
end $$;

create trigger on_event_created
after insert on public.events
for each row execute function public.kivora_event_owner_member();

-- ---------- updated_at triggers ----------
create or replace function public.kivora_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger touch_profiles before update on public.profiles
for each row execute function public.kivora_touch_updated_at();
create trigger touch_events before update on public.events
for each row execute function public.kivora_touch_updated_at();
create trigger touch_tasks before update on public.tasks
for each row execute function public.kivora_touch_updated_at();
create trigger touch_budget_items before update on public.budget_items
for each row execute function public.kivora_touch_updated_at();
create trigger touch_vendors before update on public.vendors
for each row execute function public.kivora_touch_updated_at();
create trigger touch_guests before update on public.guests
for each row execute function public.kivora_touch_updated_at();
create trigger touch_agenda_items before update on public.agenda_items
for each row execute function public.kivora_touch_updated_at();

-- ---------- new-user profile trigger ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'planner'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- secure invitation RPCs ----------
create or replace function public.get_rsvp_context(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when t.id is null or t.revoked or t.kind <> 'guest' then null
    else jsonb_build_object(
      'event', jsonb_build_object(
        'name', e.name,
        'event_type', e.event_type,
        'description', e.description,
        'start_date', e.start_date,
        'end_date', e.end_date,
        'start_time', e.start_time,
        'end_time', e.end_time,
        'timezone', e.timezone,
        'venue', e.venue,
        'location_mode', e.location_mode,
        'host', coalesce(p.display_name, 'Your host')
      ),
      'guest', case when g.id is null then null else jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'group_name', g.group_name,
        'rsvp_status', g.rsvp_status,
        'rsvp_notes', g.rsvp_notes,
        'plus_one', g.plus_one
      ) end
    ) end
  from public.invitation_tokens t
  join public.events e on e.id = t.event_id
  left join public.guests g on g.id = t.guest_id
  left join public.profiles p on p.id = e.owner_id
  where t.token = p_token
$$;

create or replace function public.submit_rsvp(
  p_token text,
  p_status text,
  p_plus_one boolean default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.invitation_tokens%rowtype;
  v_guest public.guests%rowtype;
begin
  if p_status not in ('attending','declined','maybe') then
    return jsonb_build_object('ok', false, 'error', 'Please choose attending, maybe, or not attending.');
  end if;

  select * into v_token from public.invitation_tokens
    where token = p_token and not revoked and kind = 'guest';
  if v_token.id is null then
    return jsonb_build_object('ok', false, 'error', 'This invitation link is no longer valid.');
  end if;

  if v_token.guest_id is null then
    return jsonb_build_object('ok', false, 'error', 'This is a general invitation link. Named guests RSVP from their personal link.');
  end if;

  update public.guests set
    rsvp_status = p_status,
    plus_one = coalesce(p_plus_one, plus_one),
    rsvp_notes = coalesce(nullif(p_notes, ''), rsvp_notes),
    rsvp_at = now(),
    invitation_status = 'invited'
  where id = v_token.guest_id
  returning * into v_guest;

  if v_guest.id is null then
    return jsonb_build_object('ok', false, 'error', 'This invitation link is no longer valid.');
  end if;

  update public.invitation_tokens set last_used_at = now() where id = v_token.id;

  insert into public.notifications (user_id, event_id, type, title, body)
  select e.owner_id, e.id, 'rsvp',
    'New RSVP: ' || v_guest.name,
    v_guest.name || ' responded for ' || e.name
  from public.events e where e.id = v_token.event_id;

  insert into public.activity_log (event_id, action, entity_type, entity_id, summary)
  values (v_token.event_id, 'rsvp_submitted', 'guest', v_guest.id, v_guest.name || ' RSVPed ' || p_status);

  return jsonb_build_object('ok', true, 'rsvp_status', p_status);
end $$;

create or replace function public.accept_collaborator_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.invitation_tokens%rowtype;
  v_existing text;
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to accept this invitation.');
  end if;

  select * into v_token from public.invitation_tokens
    where token = p_token and not revoked and kind = 'collaborator';
  if v_token.id is null then
    return jsonb_build_object('ok', false, 'error', 'This collaboration invitation is no longer valid.');
  end if;

  select role into v_existing from public.event_members
    where event_id = v_token.event_id and user_id = v_uid;

  if v_existing is null then
    insert into public.event_members (event_id, user_id, role, invited_by)
    values (v_token.event_id, v_uid, v_token.role, v_token.created_by);
    update public.invitation_tokens set revoked = true, last_used_at = now() where id = v_token.id;

    select coalesce(display_name, 'A collaborator') into v_name from public.profiles where id = v_uid;

    insert into public.notifications (user_id, event_id, type, title, body)
    select e.owner_id, e.id, 'collaborator',
      v_name || ' joined your team',
      v_name || ' accepted an invitation to ' || e.name || ' as ' || v_token.role
    from public.events e where e.id = v_token.event_id;

    insert into public.activity_log (event_id, user_id, action, entity_type, summary)
    values (v_token.event_id, v_uid, 'collaborator_joined', 'member', v_name || ' joined as ' || v_token.role);
  end if;

  return jsonb_build_object('ok', true, 'event_id', v_token.event_id, 'already_member', v_existing is not null);
end $$;

grant execute on function public.get_rsvp_context(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, boolean, text) to anon, authenticated;
grant execute on function public.accept_collaborator_invite(text) to anon, authenticated;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.vendors enable row level security;
alter table public.tasks enable row level security;
alter table public.budget_items enable row level security;
alter table public.guests enable row level security;
alter table public.invitation_tokens enable row level security;
alter table public.agenda_items enable row level security;
alter table public.inspiration_items enable row level security;
alter table public.ai_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;

-- profiles: display names visible to signed-in users; own row editable
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- events
create policy "events_select_members" on public.events
  for select to authenticated
  using (owner_id = auth.uid() or public.kivora_event_role(id) is not null);
create policy "events_insert_own" on public.events
  for insert to authenticated with check (owner_id = auth.uid());
create policy "events_update_editors" on public.events
  for update to authenticated
  using (public.kivora_can_edit(id)) with check (public.kivora_can_edit(id));
create policy "events_delete_owner" on public.events
  for delete to authenticated using (owner_id = auth.uid());

-- event members
create policy "members_select" on public.event_members
  for select to authenticated
  using (user_id = auth.uid() or public.kivora_event_role(event_id) is not null);
create policy "members_insert_editors" on public.event_members
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "members_update_owner" on public.event_members
  for update to authenticated
  using (public.kivora_event_role(event_id) = 'owner')
  with check (public.kivora_event_role(event_id) = 'owner');
create policy "members_delete_owner" on public.event_members
  for delete to authenticated
  using (public.kivora_event_role(event_id) = 'owner');

create policy "vendors_select" on public.vendors
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "vendors_insert" on public.vendors
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "vendors_update" on public.vendors
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "vendors_delete" on public.vendors
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "tasks_select" on public.tasks
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "tasks_insert" on public.tasks
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "tasks_update" on public.tasks
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "tasks_delete" on public.tasks
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "budget_select" on public.budget_items
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "budget_insert" on public.budget_items
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "budget_update" on public.budget_items
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "budget_delete" on public.budget_items
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "guests_select" on public.guests
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "guests_insert" on public.guests
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "guests_update" on public.guests
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "guests_delete" on public.guests
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "invitation_tokens_select" on public.invitation_tokens
  for select to authenticated using (public.kivora_can_edit(event_id));
create policy "invitation_tokens_insert" on public.invitation_tokens
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "invitation_tokens_update" on public.invitation_tokens
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "invitation_tokens_delete" on public.invitation_tokens
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "agenda_select" on public.agenda_items
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "agenda_insert" on public.agenda_items
  for insert to authenticated with check (public.kivora_can_edit(event_id));
create policy "agenda_update" on public.agenda_items
  for update to authenticated using (public.kivora_can_edit(event_id)) with check (public.kivora_can_edit(event_id));
create policy "agenda_delete" on public.agenda_items
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "ai_plans_select" on public.ai_plans
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "ai_plans_insert" on public.ai_plans
  for insert to authenticated with check (public.kivora_can_edit(event_id) and created_by = auth.uid());
create policy "ai_plans_delete" on public.ai_plans
  for delete to authenticated using (public.kivora_can_edit(event_id));

create policy "inspiration_select" on public.inspiration_items
  for select to authenticated
  using (user_id = auth.uid() or (event_id is not null and public.kivora_event_role(event_id) is not null));
create policy "inspiration_insert_own" on public.inspiration_items
  for insert to authenticated with check (user_id = auth.uid());
create policy "inspiration_update_own" on public.inspiration_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "inspiration_delete_own" on public.inspiration_items
  for delete to authenticated using (user_id = auth.uid());

create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

create policy "activity_select" on public.activity_log
  for select to authenticated using (public.kivora_event_role(event_id) is not null);
create policy "activity_insert" on public.activity_log
  for insert to authenticated
  with check (public.kivora_can_edit(event_id) and user_id = auth.uid());

-- ---------- grants ----------
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_members to authenticated;
grant select, insert, update, delete on public.vendors to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.budget_items to authenticated;
grant select, insert, update, delete on public.guests to authenticated;
grant select, insert, update, delete on public.invitation_tokens to authenticated;
grant select, insert, update, delete on public.agenda_items to authenticated;
grant select, insert, update, delete on public.inspiration_items to authenticated;
grant select, insert, update, delete on public.ai_plans to authenticated;
grant select, update, delete on public.notifications to authenticated;
grant select, insert on public.activity_log to authenticated;
grant all on public.profiles, public.events, public.event_members, public.vendors, public.tasks, public.budget_items, public.guests, public.invitation_tokens, public.agenda_items, public.inspiration_items, public.ai_plans, public.notifications, public.activity_log to service_role;
