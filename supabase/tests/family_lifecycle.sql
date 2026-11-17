-- Run as a database owner against an isolated test database after migrations.
-- All synthetic data is rolled back at the end.
begin;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002'),('10000000-0000-0000-0000-000000000003');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select public.family_create('synthetic lifecycle');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
insert into family_private.members(user_id,family_id,role,joined_at) select '10000000-0000-0000-0000-000000000002',family_id,'member',now()-interval '1 day' from family_private.members where user_id='10000000-0000-0000-0000-000000000001';
do $$ begin
 begin perform public.family_delete(); raise exception 'member could delete family'; exception when insufficient_privilege then null; end;
 begin perform public.family_transfer_admin('10000000-0000-0000-0000-000000000003'); raise exception 'member could transfer'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin if public.family_transfer_admin('10000000-0000-0000-0000-000000000003') then raise exception 'outsider accepted'; end if; if not public.family_transfer_admin('10000000-0000-0000-0000-000000000002') then raise exception 'transfer failed'; end if; end $$;
delete from auth.users where id='10000000-0000-0000-0000-000000000002';
do $$ begin if not exists(select 1 from family_private.members where user_id='10000000-0000-0000-0000-000000000001' and role='admin') then raise exception 'successor not promoted'; end if; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin perform public.family_invite(); end $$;
delete from auth.users where id='10000000-0000-0000-0000-000000000001';
do $$ begin if exists(select 1 from family_private.families where name='synthetic lifecycle') then raise exception 'orphan family'; end if; if has_function_privilege('anon','public.family_delete()','execute') then raise exception 'anonymous execute allowed'; end if; end $$;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000004');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select public.family_create('synthetic invite');
insert into family_private.members(user_id,family_id,role) select '10000000-0000-0000-0000-000000000004',family_id,'member' from family_private.members where user_id='10000000-0000-0000-0000-000000000003';
do $$ begin perform public.family_invite(); end $$;
delete from auth.users where id='10000000-0000-0000-0000-000000000003';
do $$ begin if not exists(select 1 from family_private.invites i join family_private.families f on f.id=i.family_id where f.name='synthetic invite' and i.created_by is null) then raise exception 'invite creator not cleared'; end if; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
select public.family_delete();
do $$ begin if exists(select 1 from family_private.families where name='synthetic invite') then raise exception 'family not deleted'; end if; end $$;
rollback;
