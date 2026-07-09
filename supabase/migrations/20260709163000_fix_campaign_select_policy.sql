-- Fix campaign INSERT ... RETURNING for the creating Game Master.
-- The Game Master check must use values from the current campaign row.
-- Player access can continue to use the membership helper.

drop policy if exists "Campaign participants can view campaigns"
on public.campaigns;

create policy "Campaign participants can view campaigns"
on public.campaigns
for select
to authenticated
using (
  game_master_id = (select auth.uid())
  or public.current_user_is_campaign_player(id)
);
