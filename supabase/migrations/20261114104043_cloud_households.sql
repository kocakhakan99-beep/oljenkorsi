-- A personal household is separate from the existing shared family membership.
-- Keeping it in its own ownership table leaves the legacy one-family RPCs valid.
alter table family_private.families add column household_kind text not null default 'shared'
  check (household_kind in ('personal', 'shared'));
alter table family_private.families add constraint families_id_kind_key unique (id, household_kind);
create table family_private.personal_households (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null unique,
  household_kind text not null default 'personal' check (household_kind = 'personal'),
  foreign key (family_id, household_kind) references family_private.families(id, household_kind) on delete cascade
);
alter table family_private.personal_households enable row level security;
revoke all on family_private.personal_households from public, anon, authenticated;

-- Personal households must never acquire shared-family members or invites.
create function family_private.require_shared_household() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from family_private.families where id = new.family_id and household_kind = 'shared') then
    raise exception 'shared household required' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function family_private.require_shared_household() from public, anon, authenticated;
create trigger cloud_shared_members_only before insert or update of family_id on family_private.members
  for each row execute function family_private.require_shared_household();
create trigger cloud_shared_invites_only before insert or update of family_id on family_private.invites
  for each row execute function family_private.require_shared_household();

create function family_private.ensure_personal_household() returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('oljenkorsi-personal:' || u::text, 0));
  select family_id into f from family_private.personal_households where user_id = u;
  if f is null then
    insert into family_private.families(name, household_kind) values ('Oma talous', 'personal') returning id into f;
    insert into family_private.personal_households(user_id, family_id) values (u, f);
  end if;
  return f;
end $$;

create function family_private.list_households() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name,
    'kind', f.household_kind, 'revision', f.revision) order by f.created_at, f.id), '[]'::jsonb)
  into result from family_private.families f
  where exists (select 1 from family_private.personal_households p where p.family_id = f.id and p.user_id = u)
     or exists (select 1 from family_private.members m where m.family_id = f.id and m.user_id = u);
  return result;
end $$;

create function family_private.get_household(p_household_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); result jsonb;
begin
  select jsonb_build_object('id', f.id, 'name', f.name, 'kind', f.household_kind,
    'revision', f.revision, 'state', f.state, 'updated_at', f.updated_at)
  into result from family_private.families f
  where f.id = p_household_id and (
    exists (select 1 from family_private.personal_households p where p.family_id = f.id and p.user_id = u)
    or exists (select 1 from family_private.members m where m.family_id = f.id and m.user_id = u)
  );
  if result is null then raise exception 'household membership required' using errcode = '42501'; end if;
  return result;
end $$;

revoke execute on function family_private.ensure_personal_household(), family_private.list_households(), family_private.get_household(uuid) from public, anon;
grant execute on function family_private.ensure_personal_household(), family_private.list_households(), family_private.get_household(uuid) to authenticated;
create function public.cloud_ensure_personal() returns uuid language sql security invoker set search_path = '' as $$ select family_private.ensure_personal_household() $$;
create function public.cloud_list_households() returns jsonb language sql security invoker set search_path = '' as $$ select family_private.list_households() $$;
create function public.cloud_get_household(p_household_id uuid) returns jsonb language sql security invoker set search_path = '' as $$ select family_private.get_household(p_household_id) $$;
revoke execute on function public.cloud_ensure_personal(), public.cloud_list_households(), public.cloud_get_household(uuid) from public, anon;
grant execute on function public.cloud_ensure_personal(), public.cloud_list_households(), public.cloud_get_household(uuid) to authenticated;

-- Account deletion removes the private household rather than orphaning it.
create function family_private.delete_personal_household_on_user_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from family_private.families where id = (
    select family_id from family_private.personal_households where user_id = old.id
  );
  return old;
end $$;
revoke execute on function family_private.delete_personal_household_on_user_delete() from public, anon, authenticated;
create trigger cloud_personal_household_user_delete before delete on auth.users
  for each row execute function family_private.delete_personal_household_on_user_delete();

-- Internal write receipts are not reachable through the Data API. The
-- service-only wrapper below requires a validating, authenticated server.
create table family_private.write_receipts (
  family_id uuid not null references family_private.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  expected_revision bigint not null,
  payload_hash bytea not null,
  result_revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (family_id, user_id, mutation_id)
);
create index write_receipts_created_at_idx on family_private.write_receipts(created_at);
alter table family_private.write_receipts enable row level security;
revoke all on family_private.write_receipts from public, anon, authenticated;

-- Internal primitive only: p_user_id must be supplied by a trusted server that
-- has verified the caller. It is not executable by anon or authenticated.
create function family_private.save_idempotent_internal(
  p_user_id uuid, p_family_id uuid, p_expected_revision bigint,
  p_mutation_id uuid, p_state jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  request_hash bytea;
  receipt family_private.write_receipts%rowtype;
  current_revision bigint;
  next_revision bigint;
begin
  if p_user_id is null or p_family_id is null or p_mutation_id is null
     or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'invalid save request' using errcode = '22023';
  end if;
  if jsonb_typeof(p_state) is distinct from 'object'
     or octet_length(p_state::text) > 5000000
     or p_state->>'format' is distinct from 'TaloussuunnitteluFamilyBackup'
     or p_state->'version' is distinct from '1'::jsonb
     or jsonb_typeof(p_state->'backup'->'data') is distinct from 'object' then
    raise exception 'invalid state envelope' using errcode = '22023';
  end if;
  request_hash := extensions.digest(convert_to(p_state::text, 'UTF8'), 'sha256');

  select revision into current_revision from family_private.families
    where id = p_family_id for update;
  if not found or not (
    exists (select 1 from family_private.members where family_id = p_family_id and user_id = p_user_id)
    or exists (select 1 from family_private.personal_households where family_id = p_family_id and user_id = p_user_id)
  ) then
    raise exception 'family membership required' using errcode = '42501';
  end if;

  select * into receipt from family_private.write_receipts
    where family_id = p_family_id and user_id = p_user_id and mutation_id = p_mutation_id;
  if found then
    if receipt.payload_hash <> request_hash or receipt.expected_revision <> p_expected_revision then
      raise exception 'mutation id reused with different request' using errcode = '22023';
    end if;
    return jsonb_build_object('ok', true, 'revision', receipt.result_revision);
  end if;
  if current_revision <> p_expected_revision then
    return jsonb_build_object('ok', false, 'conflict', true);
  end if;
  update family_private.families
    set state = p_state, revision = revision + 1, updated_at = now()
    where id = p_family_id returning revision into next_revision;
  insert into family_private.write_receipts
    (family_id, user_id, mutation_id, expected_revision, payload_hash, result_revision)
    values (p_family_id, p_user_id, p_mutation_id, p_expected_revision, request_hash, next_revision);
  return jsonb_build_object('ok', true, 'revision', next_revision);
end $$;
revoke execute on function family_private.save_idempotent_internal(uuid, uuid, bigint, uuid, jsonb)
  from public, anon, authenticated, service_role;

-- Only a server holding the secret key may call this wrapper. That server must
-- verify the JWT, derive p_user_id from it, and validate the full document.
grant usage on schema family_private to service_role;
grant execute on function family_private.save_idempotent_internal(uuid, uuid, bigint, uuid, jsonb) to service_role;
create function public.cloud_save_validated(
  p_user_id uuid, p_family_id uuid, p_expected_revision bigint,
  p_mutation_id uuid, p_state jsonb
) returns jsonb language sql security invoker set search_path = '' as $$
  select family_private.save_idempotent_internal(p_user_id, p_family_id, p_expected_revision, p_mutation_id, p_state)
$$;
revoke execute on function public.cloud_save_validated(uuid, uuid, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.cloud_save_validated(uuid, uuid, bigint, uuid, jsonb) to service_role;
