-- Cover campaign FK cascade checks for notes without a session link as well.
create index campaign_note_entries_campaign_idx on public.campaign_note_entries(campaign_id);
