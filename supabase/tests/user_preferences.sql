-- Run as the database owner in an isolated test database after migrations.
begin;
insert into auth.users(id) values ('f0000000-0000-4000-8000-000000000001'), ('f0000000-0000-4000-8000-000000000002');
do $$
declare
  a uuid := 'f0000000-0000-4000-8000-000000000001';
  b uuid := 'f0000000-0000-4000-8000-000000000002';
  m uuid := 'f0000000-0000-4000-8000-000000000003';
  p jsonb := '{"theme":"blue","mode":"dark","accent":"#17604d","private":true,"month":"2026-11","dismissedHelp":["dashboard-start"]}';
  r jsonb;
begin
  if has_table_privilege('authenticated', 'family_private.user_preferences', 'select')
     or has_function_privilege('anon', 'public.user_preferences_save(bigint,uuid,jsonb)', 'execute') then
    raise exception 'excess privileges';
  end if;
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a)::text, true);
  if public.user_preferences_get()->'preferences' <> 'null'::jsonb then raise exception 'new user not empty'; end if;
  r := public.user_preferences_save(0, m, p);
  if r <> '{"ok":true,"revision":1}'::jsonb then raise exception 'save failed'; end if;
  if public.user_preferences_save(0, m, p) <> r then raise exception 'retry not idempotent'; end if;
  if public.user_preferences_save(0, gen_random_uuid(), p)->>'conflict' <> 'true' then raise exception 'stale write accepted'; end if;
  begin
    perform public.user_preferences_save(0, m, jsonb_set(p, '{theme}', '"green"'));
    raise exception 'mutation id reuse accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.user_preferences_save(1, gen_random_uuid(), p || '{"apiKey":"not-allowed"}'::jsonb);
    raise exception 'unexpected field accepted';
  exception when invalid_parameter_value then null; end;
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', b)::text, true);
  if public.user_preferences_get()->'preferences' <> 'null'::jsonb then raise exception 'user data leaked'; end if;
  perform public.user_preferences_save(0, gen_random_uuid(), jsonb_set(p, '{theme}', '"green"'));
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', a)::text, true);
  if public.user_preferences_get()->'preferences'->>'theme' <> 'blue' then raise exception 'other user modified preferences'; end if;
  delete from auth.users where id = a;
  if exists (select 1 from family_private.user_preferences where user_id = a) then raise exception 'preferences were orphaned'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-4000-8000-000000000002"}', true);
do $$ begin
  if public.user_preferences_get()->'preferences'->>'theme' <> 'green' then raise exception 'authenticated user cannot read own preferences'; end if;
  begin
    perform 1 from family_private.user_preferences;
    raise exception 'authenticated user can read preference table directly';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
