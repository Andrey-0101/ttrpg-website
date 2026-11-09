-- Campaign Overview only. Account emails stay in Auth; video naming is unchanged.
create schema campaign_roster_labels;
revoke all on schema campaign_roster_labels from public, anon, authenticated, service_role;
grant usage on schema campaign_roster_labels to authenticated;

create function campaign_roster_labels.player_roster(target_campaign_id uuid)
returns table (participant_id uuid, display_label text, joined_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  -- Match interface trim() for null, empty and whitespace-only profile names.
  whitespace constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if (select auth.uid()) is null or not public.current_user_can_access_campaign(target_campaign_id) then
    raise exception using errcode = '42501', message = 'campaign_roster_unavailable';
  end if;

  return query
  select member.user_id,
    coalesce(nullif(btrim(profile.display_name, whitespace), ''), nullif(btrim(account.email, whitespace), '')),
    member.joined_at
  from public.campaign_members member
  join auth.users account on account.id = member.user_id
  left join public.profiles profile on profile.id = member.user_id
  where member.campaign_id = target_campaign_id
  order by member.display_order;
end;
$$;
revoke all on function campaign_roster_labels.player_roster(uuid) from public, anon, authenticated, service_role;
grant execute on function campaign_roster_labels.player_roster(uuid) to authenticated;

create function public.get_campaign_roster_players(target_campaign_id uuid)
returns table (participant_id uuid, display_label text, joined_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from campaign_roster_labels.player_roster(target_campaign_id);
$$;
revoke all on function public.get_campaign_roster_players(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_campaign_roster_players(uuid) to authenticated;

comment on function public.get_campaign_roster_players(uuid) is
'Campaign-scoped Overview Player roster: trimmed display_name, otherwise current Auth account email. No global Auth/profile grants or stored email copy.';
