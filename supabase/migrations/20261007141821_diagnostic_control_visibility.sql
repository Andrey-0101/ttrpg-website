-- Browser/Realtime receives invalidation fields only, never Auth-session provenance.
revoke select on public.game_room_diagnostic_runs from authenticated;
grant select (id, campaign_id, state, revision) on public.game_room_diagnostic_runs to authenticated;

-- Change only this table's publication entry; preserve every existing published table.
alter publication supabase_realtime drop table public.game_room_diagnostic_runs;
alter publication supabase_realtime add table public.game_room_diagnostic_runs (id, campaign_id, state, revision);
