-- Preferences belong to an authenticated user, never to a household.
create table family_private.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  preferences jsonb,
  last_mutation uuid,
  last_expected_revision bigint,
  updated_at timestamptz not null default now()
);
alter table family_private.user_preferences enable row level security;
revoke all on family_private.user_preferences from public, anon, authenticated;

create function family_private.get_preferences() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); result jsonb;
begin
  select jsonb_build_object('revision', revision, 'preferences', preferences) into result
    from family_private.user_preferences where user_id = u;
  return coalesce(result, jsonb_build_object('revision', 0, 'preferences', null));
end $$;

create function family_private.save_preferences(p_expected_revision bigint, p_mutation_id uuid, p_preferences jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); current_row family_private.user_preferences%rowtype; next_revision bigint;
begin
  if p_expected_revision is null or p_expected_revision < 0 or p_mutation_id is null
     or jsonb_typeof(p_preferences) is distinct from 'object' or octet_length(p_preferences::text) > 12000
     or not (p_preferences ?& array['theme','mode','accent','private','month','dismissedHelp'])
     or (select count(*) from jsonb_object_keys(p_preferences)) <> 6
     or jsonb_typeof(p_preferences->'theme') is distinct from 'string'
     or p_preferences->>'theme' not in ('neutral','blue','green','contrast','custom')
     or jsonb_typeof(p_preferences->'mode') is distinct from 'string'
     or p_preferences->>'mode' not in ('system','light','dark')
     or jsonb_typeof(p_preferences->'accent') is distinct from 'string'
     or p_preferences->>'accent' !~ '^#[0-9A-Fa-f]{6}$'
     or jsonb_typeof(p_preferences->'private') is distinct from 'boolean'
     or jsonb_typeof(p_preferences->'month') is distinct from 'string'
     or p_preferences->>'month' !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
     or jsonb_typeof(p_preferences->'dismissedHelp') is distinct from 'array' then
    raise exception 'invalid preferences' using errcode = '22023';
  end if;
  if jsonb_array_length(p_preferences->'dismissedHelp') > 100 or exists (
    select 1 from jsonb_array_elements(p_preferences->'dismissedHelp') item
    where jsonb_typeof(item) <> 'string' or length(item #>> '{}') > 100
  ) then raise exception 'invalid preferences' using errcode = '22023'; end if;

  insert into family_private.user_preferences(user_id) values (u) on conflict do nothing;
  select * into current_row from family_private.user_preferences where user_id = u for update;
  if current_row.last_mutation = p_mutation_id then
    if current_row.preferences <> p_preferences or current_row.last_expected_revision <> p_expected_revision then
      raise exception 'mutation id reused' using errcode = '22023';
    end if;
    return jsonb_build_object('ok', true, 'revision', current_row.revision);
  end if;
  if current_row.revision <> p_expected_revision then
    return jsonb_build_object('ok', false, 'conflict', true);
  end if;
  update family_private.user_preferences set preferences = p_preferences, revision = revision + 1,
    last_mutation = p_mutation_id, last_expected_revision = p_expected_revision, updated_at = now()
    where user_id = u returning revision into next_revision;
  return jsonb_build_object('ok', true, 'revision', next_revision);
end $$;
revoke execute on function family_private.get_preferences(), family_private.save_preferences(bigint, uuid, jsonb) from public, anon;
grant execute on function family_private.get_preferences(), family_private.save_preferences(bigint, uuid, jsonb) to authenticated;
create function public.user_preferences_get() returns jsonb language sql security invoker set search_path = '' as $$ select family_private.get_preferences() $$;
create function public.user_preferences_save(p_expected_revision bigint, p_mutation_id uuid, p_preferences jsonb) returns jsonb language sql security invoker set search_path = '' as $$ select family_private.save_preferences(p_expected_revision, p_mutation_id, p_preferences) $$;
revoke execute on function public.user_preferences_get(), public.user_preferences_save(bigint, uuid, jsonb) from public, anon;
grant execute on function public.user_preferences_get(), public.user_preferences_save(bigint, uuid, jsonb) to authenticated;
