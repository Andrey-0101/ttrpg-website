-- Campaign Foundation migration.
--
-- Approved product rules:
-- - exactly one Game Master;
-- - the campaign creator is the Game Master;
-- - game_master_id is immutable;
-- - campaign_members contains Players only;
-- - membership is created only through invitation acceptance.
--
-- Preflight verified on 2026-07-09:
-- - pgcrypto is installed in the extensions schema;
-- - extensions.gen_random_bytes(integer) exists;
-- - extensions.digest(bytea, text) exists.

create extension if not exists pgcrypto with schema extensions;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  game_master_id uuid not null
    references auth.users(id) on delete cascade,
  game_system text not null,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint campaigns_game_system_check
    check (char_length(btrim(game_system)) between 1 and 100),
  constraint campaigns_description_check
    check (description is null or char_length(description) <= 4000),
  constraint campaigns_status_check
    check (status in ('active', 'completed'))
);

create table public.campaign_members (
  campaign_id uuid not null
    references public.campaigns(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table public.campaign_invitations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.campaigns(id) on delete cascade,
  created_by uuid not null
    references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid
    references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint campaign_invitations_expiry_check
    check (expires_at > created_at),
  constraint campaign_invitations_acceptance_check
    check (accepted_by is null or accepted_at is not null),
  constraint campaign_invitations_terminal_state_check
    check (not (accepted_at is not null and revoked_at is not null))
);

create table public.campaign_characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.campaigns(id) on delete cascade,
  character_id uuid not null
    references public.characters(id) on delete cascade,
  linked_by uuid not null
    references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  unlinked_at timestamptz,
  constraint campaign_characters_unlinked_at_check
    check (unlinked_at is null or unlinked_at >= linked_at)
);

create index campaigns_game_master_id_idx
  on public.campaigns(game_master_id);

create index campaign_members_user_id_idx
  on public.campaign_members(user_id);

create index campaign_invitations_campaign_id_idx
  on public.campaign_invitations(campaign_id);

create index campaign_invitations_open_idx
  on public.campaign_invitations(campaign_id, expires_at)
  where accepted_at is null and revoked_at is null;

create index campaign_characters_campaign_id_idx
  on public.campaign_characters(campaign_id);

create index campaign_characters_character_id_idx
  on public.campaign_characters(character_id);

create unique index campaign_characters_one_active_campaign_idx
  on public.campaign_characters(character_id)
  where unlinked_at is null;

create or replace function public.current_user_is_campaign_game_master(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns
    where id = target_campaign_id
      and game_master_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_is_campaign_player(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members
    where campaign_id = target_campaign_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_can_access_campaign(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.current_user_is_campaign_game_master(target_campaign_id)
    or public.current_user_is_campaign_player(target_campaign_id);
$$;

create or replace function public.current_user_can_view_campaign_character(
  target_character_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters as character
    join public.campaign_characters as assignment
      on assignment.character_id = character.id
     and assignment.unlinked_at is null
    join public.campaigns as campaign
      on campaign.id = assignment.campaign_id
    left join public.campaign_members as member
      on member.campaign_id = campaign.id
     and member.user_id = (select auth.uid())
    where character.id = target_character_id
      and character.visibility = 'campaign'
      and character.game_system = campaign.game_system
      and campaign.status = 'active'
      and (
        character.owner_id = campaign.game_master_id
        or exists (
          select 1
          from public.campaign_members as owner_member
          where owner_member.campaign_id = campaign.id
            and owner_member.user_id = character.owner_id
        )
      )
      and (
        campaign.game_master_id = (select auth.uid())
        or member.user_id is not null
      )
  );
$$;

create or replace function public.current_user_can_view_campaign_portrait(
  object_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_owner_id uuid;
  path_character_id uuid;
  owner_candidate text;
  character_candidate text;
begin
  owner_candidate := pg_catalog.split_part(object_name, '/', 1);
  character_candidate := pg_catalog.split_part(object_name, '/', 2);

  if owner_candidate !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or character_candidate !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  path_owner_id := owner_candidate::uuid;
  path_character_id := character_candidate::uuid;

  return exists (
    select 1
    from public.characters as character
    where character.id = path_character_id
      and character.owner_id = path_owner_id
      and public.current_user_can_view_campaign_character(character.id)
  );
exception
  when others then
    return false;
end;
$$;

create or replace function public.enforce_campaign_update_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Campaign ID cannot be changed';
  end if;

  if new.game_master_id is distinct from old.game_master_id then
    raise exception 'Campaign Game Master cannot be changed';
  end if;

  if new.game_system is distinct from old.game_system then
    raise exception 'Campaign game system cannot be changed';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'Campaign creation time cannot be changed';
  end if;

  if old.status = 'completed' then
    raise exception 'Completed campaigns are read-only';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_game_master_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  campaign_game_master_id uuid;
begin
  select game_master_id
  into campaign_game_master_id
  from public.campaigns
  where id = new.campaign_id;

  if campaign_game_master_id is null then
    raise exception 'Campaign does not exist';
  end if;

  if new.user_id = campaign_game_master_id then
    raise exception 'Game Master cannot also be a Player member';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_campaign_invitation_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  campaign_game_master_id uuid;
  campaign_status text;
begin
  select game_master_id, status
  into campaign_game_master_id, campaign_status
  from public.campaigns
  where id = new.campaign_id
  for share;

  if campaign_game_master_id is null then
    raise exception 'Campaign does not exist';
  end if;

  if new.created_by <> campaign_game_master_id then
    raise exception 'Only the campaign Game Master can create invitations';
  end if;

  if tg_op = 'INSERT' and campaign_status <> 'active' then
    raise exception 'Invitations require an active campaign';
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.campaign_id is distinct from old.campaign_id
      or new.created_by is distinct from old.created_by
      or new.token_hash is distinct from old.token_hash
      or new.created_at is distinct from old.created_at
      or new.expires_at is distinct from old.expires_at
    then
      raise exception 'Invitation identity fields cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_campaign_character_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  campaign_status text;
  campaign_game_master_id uuid;
  campaign_game_system text;
  character_owner_id uuid;
  character_visibility text;
  character_game_system text;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.campaign_id is distinct from old.campaign_id
      or new.character_id is distinct from old.character_id
      or new.linked_by is distinct from old.linked_by
      or new.linked_at is distinct from old.linked_at
    then
      raise exception 'Character assignment identity fields cannot be changed';
    end if;

    if old.unlinked_at is not null and new.unlinked_at is distinct from old.unlinked_at then
      raise exception 'An unlinked assignment cannot be reopened or changed';
    end if;

    if old.unlinked_at is null and new.unlinked_at is not null then
      new.unlinked_at := now();
    end if;

    return new;
  end if;

  select status, game_master_id, game_system
  into campaign_status, campaign_game_master_id, campaign_game_system
  from public.campaigns
  where id = new.campaign_id
  for share;

  select owner_id, visibility, game_system
  into character_owner_id, character_visibility, character_game_system
  from public.characters
  where id = new.character_id
  for share;

  if campaign_status is null then
    raise exception 'Campaign does not exist';
  end if;

  if campaign_status <> 'active' then
    raise exception 'Character assignment requires an active campaign';
  end if;

  if character_owner_id is null then
    raise exception 'Character does not exist';
  end if;

  if character_owner_id <> new.linked_by then
    raise exception 'Character assignment must be created by the character owner';
  end if;

  if new.linked_by <> campaign_game_master_id then
    perform 1
    from public.campaign_members
    where campaign_id = new.campaign_id
      and user_id = new.linked_by
    for share;

    if not found then
      raise exception 'Character owner is not a campaign participant';
    end if;
  end if;

  if character_visibility <> 'campaign' then
    raise exception 'Character visibility must be campaign';
  end if;

  if character_game_system <> campaign_game_system then
    raise exception 'Character and campaign game systems must match';
  end if;

  return new;
end;
$$;

create or replace function public.handle_campaign_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status = 'completed' then
    update public.campaign_invitations
    set revoked_at = now()
    where campaign_id = new.id
      and accepted_at is null
      and revoked_at is null;

    update public.campaign_characters
    set unlinked_at = now()
    where campaign_id = new.id
      and unlinked_at is null;
  end if;

  return new;
end;
$$;

create or replace function public.handle_campaign_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.campaign_characters as assignment
  set unlinked_at = now()
  from public.characters as character
  where assignment.character_id = character.id
    and assignment.campaign_id = old.campaign_id
    and assignment.unlinked_at is null
    and character.owner_id = old.user_id;

  return old;
end;
$$;

create or replace function public.handle_character_campaign_eligibility_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.visibility = 'campaign'
    and (
      new.visibility <> 'campaign'
      or new.game_system is distinct from old.game_system
    )
  then
    update public.campaign_characters
    set unlinked_at = now()
    where character_id = new.id
      and unlinked_at is null;
  end if;

  return new;
end;
$$;

create trigger campaigns_enforce_update_rules
before update on public.campaigns
for each row
execute function public.enforce_campaign_update_rules();

create trigger campaigns_handle_completed
after update of status on public.campaigns
for each row
execute function public.handle_campaign_completed();

create trigger campaign_members_prevent_game_master
before insert or update on public.campaign_members
for each row
execute function public.prevent_game_master_membership();

create trigger campaign_members_handle_removed
after delete on public.campaign_members
for each row
execute function public.handle_campaign_member_removed();

create trigger campaign_invitations_enforce_rules
before insert or update on public.campaign_invitations
for each row
execute function public.enforce_campaign_invitation_rules();

create trigger campaign_characters_enforce_rules
before insert or update on public.campaign_characters
for each row
execute function public.enforce_campaign_character_rules();

create trigger characters_handle_campaign_eligibility_removed
after update of visibility, game_system on public.characters
for each row
execute function public.handle_character_campaign_eligibility_removed();

create or replace function public.create_campaign_invitation(
  target_campaign_id uuid
)
returns table (
  invitation_id uuid,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  hashed_token text;
  invitation_expires_at timestamptz;
  campaign_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if not public.current_user_is_campaign_game_master(target_campaign_id) then
    raise exception 'Campaign invitation is not available';
  end if;

  select status
  into campaign_status
  from public.campaigns
  where id = target_campaign_id
  for share;

  if campaign_status is distinct from 'active' then
    raise exception 'Campaign invitation is not available';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  hashed_token := encode(
    extensions.digest(pg_catalog.convert_to(raw_token, 'UTF8'), 'sha256'),
    'hex'
  );
  invitation_expires_at := now() + interval '7 days';

  insert into public.campaign_invitations (
    campaign_id,
    created_by,
    token_hash,
    expires_at
  )
  values (
    target_campaign_id,
    (select auth.uid()),
    hashed_token,
    invitation_expires_at
  )
  returning id, campaign_invitations.expires_at
  into invitation_id, expires_at;

  token := raw_token;
  return next;
end;
$$;

create or replace function public.accept_campaign_invitation(
  raw_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hashed_token text;
  invitation_id uuid;
  target_campaign_id uuid;
  campaign_game_master_id uuid;
  campaign_status text;
  invitation_expires_at timestamptz;
  invitation_accepted_at timestamptz;
  invitation_revoked_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if raw_token is null or char_length(raw_token) < 32 then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  hashed_token := encode(
    extensions.digest(pg_catalog.convert_to(raw_token, 'UTF8'), 'sha256'),
    'hex'
  );

  select invitation.campaign_id
  into target_campaign_id
  from public.campaign_invitations as invitation
  where invitation.token_hash = hashed_token;

  if target_campaign_id is null then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  select campaign.game_master_id, campaign.status
  into campaign_game_master_id, campaign_status
  from public.campaigns as campaign
  where campaign.id = target_campaign_id
  for share;

  if campaign_game_master_id is null then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  select
    invitation.id,
    invitation.expires_at,
    invitation.accepted_at,
    invitation.revoked_at
  into
    invitation_id,
    invitation_expires_at,
    invitation_accepted_at,
    invitation_revoked_at
  from public.campaign_invitations as invitation
  where invitation.token_hash = hashed_token
    and invitation.campaign_id = target_campaign_id
  for update;

  if invitation_id is null
    or campaign_status <> 'active'
    or invitation_expires_at <= now()
    or invitation_accepted_at is not null
    or invitation_revoked_at is not null
    or campaign_game_master_id = (select auth.uid())
    or exists (
      select 1
      from public.campaign_members
      where campaign_id = target_campaign_id
        and user_id = (select auth.uid())
    )
  then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  insert into public.campaign_members (
    campaign_id,
    user_id
  )
  values (
    target_campaign_id,
    (select auth.uid())
  )
  on conflict (campaign_id, user_id) do nothing;

  if not found then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  update public.campaign_invitations
  set
    accepted_at = now(),
    accepted_by = (select auth.uid())
  where id = invitation_id;

  return target_campaign_id;
end;
$$;

create or replace function public.revoke_campaign_invitation(
  target_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
  target_campaign_id uuid;
  campaign_game_master_id uuid;
  invitation_accepted_at timestamptz;
  invitation_revoked_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select campaign_id
  into target_campaign_id
  from public.campaign_invitations
  where id = target_invitation_id;

  if target_campaign_id is null then
    raise exception 'Campaign invitation is not available';
  end if;

  select game_master_id
  into campaign_game_master_id
  from public.campaigns
  where id = target_campaign_id
  for share;

  if campaign_game_master_id is distinct from (select auth.uid()) then
    raise exception 'Campaign invitation is not available';
  end if;

  select id, accepted_at, revoked_at
  into invitation_id, invitation_accepted_at, invitation_revoked_at
  from public.campaign_invitations
  where id = target_invitation_id
    and campaign_id = target_campaign_id
  for update;

  if invitation_id is null
    or invitation_accepted_at is not null
    or invitation_revoked_at is not null
  then
    raise exception 'Campaign invitation is not available';
  end if;

  update public.campaign_invitations
  set revoked_at = now()
  where id = target_invitation_id;
end;
$$;

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_invitations enable row level security;
alter table public.campaign_characters enable row level security;

create policy "Campaign participants can view campaigns"
on public.campaigns
for select
to authenticated
using (public.current_user_can_access_campaign(id));

create policy "Authenticated users can create campaigns as Game Master"
on public.campaigns
for insert
to authenticated
with check (
  game_master_id = (select auth.uid())
  and status = 'active'
);

create policy "Game Master can update active campaign"
on public.campaigns
for update
to authenticated
using (
  public.current_user_is_campaign_game_master(id)
  and status = 'active'
)
with check (
  game_master_id = (select auth.uid())
);

create policy "Game Master can delete campaign"
on public.campaigns
for delete
to authenticated
using (public.current_user_is_campaign_game_master(id));

create policy "Campaign participants can view Player memberships"
on public.campaign_members
for select
to authenticated
using (public.current_user_can_access_campaign(campaign_id));

create policy "Game Master or Player can remove Player membership"
on public.campaign_members
for delete
to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or user_id = (select auth.uid())
);

create policy "Game Master can view campaign invitations"
on public.campaign_invitations
for select
to authenticated
using (public.current_user_is_campaign_game_master(campaign_id));

create policy "Campaign participants can view character assignments"
on public.campaign_characters
for select
to authenticated
using (public.current_user_can_access_campaign(campaign_id));

create policy "Campaign participants can link their own eligible character"
on public.campaign_characters
for insert
to authenticated
with check (
  linked_by = (select auth.uid())
  and unlinked_at is null
  and public.current_user_can_access_campaign(campaign_id)
  and exists (
    select 1
    from public.characters as character
    join public.campaigns as campaign
      on campaign.id = campaign_id
    where character.id = character_id
      and character.owner_id = (select auth.uid())
      and character.visibility = 'campaign'
      and character.game_system = campaign.game_system
      and campaign.status = 'active'
  )
);

create policy "Game Master or character owner can unlink character"
on public.campaign_characters
for update
to authenticated
using (
  linked_by = (select auth.uid())
  or public.current_user_is_campaign_game_master(campaign_id)
)
with check (
  linked_by = (select auth.uid())
  or public.current_user_is_campaign_game_master(campaign_id)
);

create policy "Campaign participants can view shared characters"
on public.characters
for select
to authenticated
using (public.current_user_can_view_campaign_character(id));

create policy "Campaign participants can read shared character portraits"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'character-portraits'
  and public.current_user_can_view_campaign_portrait(name)
);

-- The existing baseline grants broad default privileges to anon/authenticated.
-- Revoke them explicitly before granting the minimum reviewed surface.

revoke all on table public.campaigns
  from anon, authenticated;
revoke all on table public.campaign_members
  from anon, authenticated;
revoke all on table public.campaign_invitations
  from anon, authenticated;
revoke all on table public.campaign_characters
  from anon, authenticated;

revoke all on function public.current_user_is_campaign_game_master(uuid)
  from public, anon, authenticated;
revoke all on function public.current_user_is_campaign_player(uuid)
  from public, anon, authenticated;
revoke all on function public.current_user_can_access_campaign(uuid)
  from public, anon, authenticated;
revoke all on function public.current_user_can_view_campaign_character(uuid)
  from public, anon, authenticated;
revoke all on function public.current_user_can_view_campaign_portrait(text)
  from public, anon, authenticated;
revoke all on function public.enforce_campaign_update_rules()
  from public, anon, authenticated;
revoke all on function public.prevent_game_master_membership()
  from public, anon, authenticated;
revoke all on function public.enforce_campaign_invitation_rules()
  from public, anon, authenticated;
revoke all on function public.enforce_campaign_character_rules()
  from public, anon, authenticated;
revoke all on function public.handle_campaign_completed()
  from public, anon, authenticated;
revoke all on function public.handle_campaign_member_removed()
  from public, anon, authenticated;
revoke all on function public.handle_character_campaign_eligibility_removed()
  from public, anon, authenticated;
revoke all on function public.create_campaign_invitation(uuid)
  from public, anon, authenticated;
revoke all on function public.accept_campaign_invitation(text)
  from public, anon, authenticated;
revoke all on function public.revoke_campaign_invitation(uuid)
  from public, anon, authenticated;

grant execute on function public.current_user_is_campaign_game_master(uuid)
  to authenticated;
grant execute on function public.current_user_is_campaign_player(uuid)
  to authenticated;
grant execute on function public.current_user_can_access_campaign(uuid)
  to authenticated;
grant execute on function public.current_user_can_view_campaign_character(uuid)
  to authenticated;
grant execute on function public.current_user_can_view_campaign_portrait(text)
  to authenticated;
grant execute on function public.create_campaign_invitation(uuid)
  to authenticated;
grant execute on function public.accept_campaign_invitation(text)
  to authenticated;
grant execute on function public.revoke_campaign_invitation(uuid)
  to authenticated;

grant select, insert, update, delete on public.campaigns
  to authenticated;
grant select, delete on public.campaign_members
  to authenticated;
grant select (
  id,
  campaign_id,
  created_by,
  expires_at,
  accepted_at,
  accepted_by,
  revoked_at,
  created_at
) on public.campaign_invitations
  to authenticated;
grant select, insert, update on public.campaign_characters
  to authenticated;

-- No direct INSERT grant/policy exists for campaign_members.
-- No direct INSERT/UPDATE/DELETE grant exists for campaign_invitations.
-- token_hash is not granted through direct table SELECT.
-- Invitation mutations occur only through the reviewed security-definer functions.
