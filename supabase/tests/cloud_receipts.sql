-- Run as database owner in an isolated database after migrations.
begin;
insert into auth.users(id) values ('e0000000-0000-4000-8000-000000000001'), ('e0000000-0000-4000-8000-000000000002');
insert into family_private.families(id, name) values ('e0000000-0000-4000-8000-000000000003', 'test');
insert into family_private.members(user_id, family_id, role) values ('e0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 'admin');
do $$
declare
  a uuid := 'e0000000-0000-4000-8000-000000000001';
  outsider uuid := 'e0000000-0000-4000-8000-000000000002';
  f uuid := 'e0000000-0000-4000-8000-000000000003';
  m uuid := 'e0000000-0000-4000-8000-000000000004';
  m2 uuid := 'e0000000-0000-4000-8000-000000000005';
  payload jsonb := '{"format":"TaloussuunnitteluFamilyBackup","version":1,"backup":{"data":{"test":1}}}';
  result jsonb;
begin
  if has_function_privilege('authenticated', 'family_private.save_idempotent_internal(uuid,uuid,bigint,uuid,jsonb)', 'execute')
     or has_function_privilege('anon', 'family_private.save_idempotent_internal(uuid,uuid,bigint,uuid,jsonb)', 'execute') then
    raise exception 'API roles can execute internal write';
  end if;
  if has_function_privilege('authenticated', 'public.cloud_save_validated(uuid,uuid,bigint,uuid,jsonb)', 'execute')
     or has_function_privilege('anon', 'public.cloud_save_validated(uuid,uuid,bigint,uuid,jsonb)', 'execute')
     or not has_function_privilege('service_role', 'public.cloud_save_validated(uuid,uuid,bigint,uuid,jsonb)', 'execute') then
    raise exception 'invalid cloud save wrapper privileges';
  end if;
  result := family_private.save_idempotent_internal(a, f, 0, m, payload);
  if result <> '{"ok":true,"revision":1}'::jsonb then raise exception 'first write failed'; end if;
  result := family_private.save_idempotent_internal(a, f, 0, m, payload);
  if result <> '{"ok":true,"revision":1}'::jsonb then raise exception 'retry was not idempotent'; end if;
  begin
    perform family_private.save_idempotent_internal(a, f, 0, m, jsonb_set(payload, '{backup,data,test}', '2'));
    raise exception 'mutation ID reuse was accepted';
  exception when invalid_parameter_value then null; end;
  result := family_private.save_idempotent_internal(a, f, 0, m2, payload);
  if result <> '{"ok":false,"conflict":true}'::jsonb then raise exception 'stale revision was accepted'; end if;
  begin
    perform family_private.save_idempotent_internal(outsider, f, 1, m2, payload);
    raise exception 'nonmember was accepted';
  exception when insufficient_privilege then null; end;
  delete from family_private.members where user_id = a;
  begin
    perform family_private.save_idempotent_internal(a, f, 0, m, payload);
    raise exception 'removed member could retry';
  exception when insufficient_privilege then null; end;
  if (select revision from family_private.families where id = f) <> 1 then raise exception 'revision changed unexpectedly'; end if;
end $$;
insert into family_private.families(id, name) values ('e0000000-0000-4000-8000-000000000006', 'service-test');
insert into family_private.members(user_id, family_id, role) values ('e0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000006', 'admin');
set local role service_role;
do $$
declare result jsonb;
begin
  result := public.cloud_save_validated(
    'e0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000006', 0,
    'e0000000-0000-4000-8000-000000000007',
    '{"format":"TaloussuunnitteluFamilyBackup","version":1,"backup":{"data":{}}}'::jsonb
  );
  if result <> '{"ok":true,"revision":1}'::jsonb then raise exception 'service wrapper failed'; end if;
end $$;
reset role;
do $$
declare
  owner_id uuid := 'e0000000-0000-4000-8000-000000000001';
  outsider uuid := 'e0000000-0000-4000-8000-000000000002';
  personal_id uuid;
  result jsonb;
begin
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id)::text, true);
  personal_id := public.cloud_ensure_personal();
  if public.cloud_ensure_personal() <> personal_id then raise exception 'personal household is not idempotent'; end if;
  begin
    insert into family_private.members(user_id, family_id, role) values (outsider, personal_id, 'member');
    raise exception 'personal household accepted a member';
  exception when check_violation then null; end;
  begin
    insert into family_private.invites(family_id, code_hash, created_by, expires_at)
      values (personal_id, decode('01', 'hex'), owner_id, now() + interval '1 hour');
    raise exception 'personal household accepted an invite';
  exception when check_violation then null; end;
  result := public.cloud_get_household(personal_id);
  if result->>'kind' <> 'personal' then raise exception 'personal household not readable'; end if;
  if jsonb_array_length(public.cloud_list_households()) < 2 then raise exception 'shared and personal households not listed'; end if;
  result := family_private.save_idempotent_internal(owner_id, personal_id, 0,
    'e0000000-0000-4000-8000-000000000008',
    '{"format":"TaloussuunnitteluFamilyBackup","version":1,"backup":{"data":{}}}'::jsonb);
  if result <> '{"ok":true,"revision":1}'::jsonb then raise exception 'personal write failed'; end if;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', outsider)::text, true);
  begin
    perform public.cloud_get_household(personal_id);
    raise exception 'outsider read personal household';
  exception when insufficient_privilege then null; end;
  begin
    perform family_private.save_idempotent_internal(outsider, personal_id, 1,
      'e0000000-0000-4000-8000-000000000009',
      '{"format":"TaloussuunnitteluFamilyBackup","version":1,"backup":{"data":{}}}'::jsonb);
    raise exception 'outsider wrote personal household';
  exception when insufficient_privilege then null; end;
  delete from auth.users where id = owner_id;
  if exists (select 1 from family_private.families where id = personal_id) then raise exception 'personal household orphaned'; end if;
end $$;
rollback;
