-- Keep every family manageable when an Auth account is removed. Invites can
-- outlive their creator, so deleting a creator must not block account removal.
alter table family_private.invites alter column created_by drop not null;
alter table family_private.invites drop constraint if exists invites_created_by_fkey;
alter table family_private.invites
  add constraint invites_created_by_fkey foreign key (created_by)
  references auth.users(id) on delete set null;

create function family_private.transfer_admin(p_user_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := family_private.require_user();
  f uuid;
  actor_role text;
begin
  select family_id, role into f, actor_role
    from family_private.members where user_id = u;
  if f is null or actor_role <> 'admin' then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  perform 1 from family_private.families where id = f for update;
  select role into actor_role
    from family_private.members where user_id = u and family_id = f;
  if actor_role is distinct from 'admin' then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from family_private.members
    where user_id = p_user_id and family_id = f and user_id <> u
  ) then return false; end if;

  update family_private.members
  set role = case when user_id = p_user_id then 'admin' else 'member' end
  where family_id = f and user_id in (u, p_user_id);
  return true;
end $$;

create function family_private.delete_family() returns boolean
language plpgsql security definer set search_path = '' as $$
declare u uuid := family_private.require_user(); f uuid; actor_role text;
begin
  select family_id, role into f, actor_role
    from family_private.members where user_id = u;
  if f is null or actor_role <> 'admin' then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  perform 1 from family_private.families where id = f for update;
  if not exists (
    select 1 from family_private.members
    where user_id = u and family_id = f and role = 'admin'
  ) then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  delete from family_private.families where id = f;
  return true;
end $$;

revoke execute on function family_private.transfer_admin(uuid), family_private.delete_family()
  from public, anon;
grant execute on function family_private.transfer_admin(uuid), family_private.delete_family()
  to authenticated;

create function public.family_transfer_admin(p_user_id uuid) returns boolean
language sql security invoker set search_path = '' as $$
  select family_private.transfer_admin(p_user_id)
$$;
create function public.family_delete() returns boolean
language sql security invoker set search_path = '' as $$
  select family_private.delete_family()
$$;
revoke execute on function public.family_transfer_admin(uuid), public.family_delete()
  from public, anon;
grant execute on function public.family_transfer_admin(uuid), public.family_delete()
  to authenticated;

-- If the last admin account is deleted, transfer administration to the
-- longest-standing remaining member. Deleting the final member deletes the
-- family row and its shared state instead of leaving an orphaned family.
create function family_private.handle_auth_user_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  f uuid;
  old_role text;
  admin_count integer;
  successor uuid;
begin
  select family_id, role into f, old_role
    from family_private.members where user_id = old.id;
  if f is null then return old; end if;

  perform 1 from family_private.families where id = f for update;
  select role into old_role
    from family_private.members where user_id = old.id and family_id = f;
  if old_role is null then return old; end if;

  select count(*) into admin_count
    from family_private.members where family_id = f and role = 'admin';
  if old_role = 'admin' and admin_count <= 1 then
    select user_id into successor
      from family_private.members
      where family_id = f and user_id <> old.id
      order by joined_at, user_id
      limit 1;
    if successor is null then
      delete from family_private.families where id = f;
    else
      update family_private.members set role = 'admin'
        where family_id = f and user_id = successor;
    end if;
  end if;
  return old;
end $$;
revoke execute on function family_private.handle_auth_user_delete() from public, anon, authenticated;
create trigger family_private_auth_user_delete
before delete on auth.users
for each row execute function family_private.handle_auth_user_delete();
