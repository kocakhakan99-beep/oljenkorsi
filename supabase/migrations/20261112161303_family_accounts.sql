-- Family data is reachable only through the authenticated, narrowly scoped RPCs below.
create schema if not exists family_private;
revoke all on schema family_private from public, anon, authenticated;
grant usage on schema family_private to authenticated;

create table family_private.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  state jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table family_private.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references family_private.families(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now()
);
create index members_family_id_idx on family_private.members(family_id);
create table family_private.invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references family_private.families(id) on delete cascade,
  code_hash bytea not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz
);
create index invites_family_id_idx on family_private.invites(family_id);
create table family_private.attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table family_private.families enable row level security;
alter table family_private.members enable row level security;
alter table family_private.invites enable row level security;
alter table family_private.attempts enable row level security;
revoke all on all tables in schema family_private from public, anon, authenticated;

create function family_private.require_user() returns uuid
language plpgsql stable security invoker set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  return u;
end $$;

create function family_private.create_family(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid;
begin
  if p_name is null or length(trim(p_name)) not between 1 and 100 then raise exception 'invalid family name'; end if;
  insert into family_private.families(name) values (trim(p_name)) returning id into f;
  insert into family_private.members(user_id, family_id, role) values (u, f, 'admin');
  return f;
end $$;

create function family_private.get_family() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); result jsonb;
begin
  select jsonb_build_object('id', f.id, 'name', f.name, 'role', m.role, 'state', f.state,
      'revision', f.revision, 'updated_at', f.updated_at)
    into result from family_private.members m join family_private.families f on f.id = m.family_id
    where m.user_id = u;
  return result;
end $$;

create function family_private.save_family(p_expected_revision bigint, p_state jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; new_revision bigint;
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 5000000 then
    raise exception 'invalid state';
  end if;
  select family_id into f from family_private.members where user_id = u;
  if f is null then raise exception 'family membership required' using errcode = '42501'; end if;
  perform 1 from family_private.families where id = f for update;
  if not exists (select 1 from family_private.members where user_id = u and family_id = f) then
    raise exception 'family membership required' using errcode = '42501';
  end if;
  update family_private.families set state = p_state, revision = revision + 1, updated_at = now()
    where id = f and revision = p_expected_revision returning revision into new_revision;
  if new_revision is null then return jsonb_build_object('ok', false, 'conflict', true); end if;
  return jsonb_build_object('ok', true, 'revision', new_revision);
end $$;

create function family_private.create_invite() returns text
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; code text;
begin
  select family_id into f from family_private.members where user_id = u and role = 'admin';
  if f is null then raise exception 'administrator required' using errcode = '42501'; end if;
  perform 1 from family_private.families where id = f for update;
  if not exists (select 1 from family_private.members where user_id = u and family_id = f and role = 'admin') then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  -- Bound invite creation even if an authenticated account is abused.
  if (select count(*) from family_private.invites where created_by = u and expires_at > now() - interval '23 hours') >= 20 then
    raise exception 'invite limit reached';
  end if;
  code := encode(extensions.gen_random_bytes(16), 'hex');
  insert into family_private.invites(family_id, code_hash, created_by, expires_at)
    values (f, extensions.digest(code, 'sha256'), u, now() + interval '24 hours');
  return code;
end $$;

create function family_private.join_family(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; n integer;
begin
  insert into family_private.attempts(user_id, window_start, attempts) values (u, now(), 1)
  on conflict (user_id) do update set
    window_start = case when family_private.attempts.window_start < now() - interval '1 hour' then now() else family_private.attempts.window_start end,
    attempts = case when family_private.attempts.window_start < now() - interval '1 hour' then 1 else family_private.attempts.attempts + 1 end
  returning attempts into n;
  if n > 20 or p_code is null or p_code !~ '^[0-9a-fA-F]{32}$' then return false; end if;
  if exists (select 1 from family_private.members where user_id = u) then return false; end if;
  update family_private.invites set used_at = now()
    where code_hash = extensions.digest(lower(p_code), 'sha256') and used_at is null and revoked_at is null and expires_at > now()
    returning family_id into f;
  if f is null then return false; end if;
  insert into family_private.members(user_id, family_id, role) values (u, f, 'member');
  return true;
end $$;

revoke execute on all functions in schema family_private from public, anon;
grant execute on all functions in schema family_private to authenticated;

-- Security-invoker wrappers expose no tables and delegate only to checked functions.
create function public.family_create(p_name text) returns uuid language sql security invoker set search_path = '' as $$ select family_private.create_family(p_name) $$;
create function public.family_get() returns jsonb language sql security invoker set search_path = '' as $$ select family_private.get_family() $$;
create function public.family_save(p_expected_revision bigint, p_state jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select family_private.save_family(p_expected_revision, p_state) $$;
create function public.family_invite() returns text language sql security invoker set search_path = '' as $$ select family_private.create_invite() $$;
create function public.family_join(p_code text) returns boolean language sql security invoker set search_path = '' as $$ select family_private.join_family(p_code) $$;
revoke execute on function public.family_create(text), public.family_get(), public.family_save(bigint, jsonb), public.family_invite(), public.family_join(text) from public, anon;
grant execute on function public.family_create(text), public.family_get(), public.family_save(bigint, jsonb), public.family_invite(), public.family_join(text) to authenticated;

create function family_private.list_members() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; result jsonb;
begin
  select family_id into f from family_private.members where user_id = u;
  if f is null then raise exception 'family membership required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id', user_id, 'role', role, 'joined_at', joined_at) order by joined_at), '[]'::jsonb)
    into result from family_private.members where family_id = f;
  return result;
end $$;
create function family_private.remove_member(p_user_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; actor_role text; target_role text;
begin
  select family_id, role into f, actor_role from family_private.members where user_id = u;
  if f is null then raise exception 'family membership required' using errcode = '42501'; end if;
  perform 1 from family_private.families where id = f for update;
  -- Recheck after obtaining the lock, since membership might have changed while waiting.
  select role into actor_role from family_private.members where user_id = u and family_id = f;
  if actor_role is null or (p_user_id <> u and actor_role <> 'admin') then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  select role into target_role from family_private.members where user_id = p_user_id and family_id = f;
  if target_role is null then return false; end if;
  if target_role = 'admin' and (select count(*) from family_private.members where family_id = f and role = 'admin') <= 1 then
    raise exception 'last administrator cannot leave';
  end if;
  delete from family_private.members where user_id = p_user_id and family_id = f;
  return true;
end $$;
revoke execute on function family_private.list_members(), family_private.remove_member(uuid) from public, anon;
grant execute on function family_private.list_members(), family_private.remove_member(uuid) to authenticated;
create function public.family_members() returns jsonb language sql security invoker set search_path = '' as $$ select family_private.list_members() $$;
create function public.family_remove_member(p_user_id uuid) returns boolean language sql security invoker set search_path = '' as $$ select family_private.remove_member(p_user_id) $$;
revoke execute on function public.family_members(), public.family_remove_member(uuid) from public, anon;
grant execute on function public.family_members(), public.family_remove_member(uuid) to authenticated;
create function family_private.revoke_invites() returns integer
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; n integer;
begin
  select family_id into f from family_private.members where user_id = u and role = 'admin';
  if f is null then raise exception 'administrator required' using errcode = '42501'; end if;
  perform 1 from family_private.families where id = f for update;
  if not exists (select 1 from family_private.members where user_id = u and family_id = f and role = 'admin') then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  update family_private.invites set revoked_at = now() where family_id = f and used_at is null and revoked_at is null;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function family_private.revoke_invites() from public, anon;
grant execute on function family_private.revoke_invites() to authenticated;
create function public.family_revoke_invites() returns integer language sql security invoker set search_path = '' as $$ select family_private.revoke_invites() $$;
revoke execute on function public.family_revoke_invites() from public, anon;
grant execute on function public.family_revoke_invites() to authenticated;
