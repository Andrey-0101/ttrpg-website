-- Forward-only hardening after local application of the foundation.
alter function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) rename to diagnostic_dispatch_internal;
revoke all on function public.diagnostic_dispatch_internal(uuid,uuid,text,uuid,uuid,jsonb) from public,anon,authenticated,service_role;
create function public.diagnostic_dispatch(actor_id uuid, auth_session_id uuid, operation text,
  target_campaign uuid default null, target_run uuid default null, input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.game_room_diagnostic_clients%rowtype; result jsonb;
begin
  if operation not in ('capability','owner','state','start','stop','owner_heartbeat','export','request_cleanup','join','heartbeat','reserve','accept','final') then raise exception 'malformed_request'; end if;
  if operation in ('reserve','final','join') then
    -- Authentication/context are rechecked before looking at internal registry state.
    perform public.diagnostic_dispatch_internal(actor_id,auth_session_id,'state',target_campaign,target_run,'{}');
    perform 1 from public.game_room_diagnostic_runs where id = target_run for update;
    if operation in ('reserve','final') then
      select * into c from public.game_room_diagnostic_clients
        where id = (input->>'segment')::uuid and run_id = target_run and user_id = actor_id for update;
      if not found or c.epoch <> (input->>'epoch')::integer then raise exception 'segment_fenced'; end if;
      if operation = 'final' and c.state = 'finished' and c.next_sequence = (input->>'next_sequence')::integer then
        return jsonb_build_object('finished',true);
      end if;
      if operation = 'reserve' and not exists(select 1 from public.game_room_diagnostic_chunks where client_id = c.id and sequence = (input->>'sequence')::integer)
        and (input->>'first_record_sequence')::bigint <> c.last_sample_sequence + 1 then raise exception 'sequence_conflict'; end if;
    elsif exists(select 1 from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id and epoch >= 100)
      and not exists(select 1 from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id and instance_id = (input->>'instance')::uuid) then
      raise exception 'segment_limit';
    end if;
  end if;
  result := public.diagnostic_dispatch_internal(actor_id,auth_session_id,operation,target_campaign,target_run,input);
  return result - 'owner_session_hash';
end;
$$;
revoke all on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) to service_role;

-- Delete metadata only after every registered object has a successful Storage API ACK.
-- A failed/missing ACK retains the path for the next bounded cleanup pass.
create function public.diagnostic_cleanup_sweep() returns integer
language plpgsql security definer set search_path = '' as $$
declare total integer;
begin
  with targets as (
    select r.id from public.game_room_diagnostic_runs r where r.state in ('ready','expired','deleted')
      and (r.cleanup_requested_at is not null or r.expires_at <= clock_timestamp())
      and not exists(select 1 from public.game_room_diagnostic_chunks ch where ch.run_id = r.id and ch.state <> 'deleted')
    order by r.completed_at limit 100 for update of r skip locked
  ) delete from public.game_room_diagnostic_runs r using targets where r.id = targets.id;
  get diagnostics total = row_count;
  return total;
end;
$$;
revoke all on function public.diagnostic_cleanup_sweep() from public,anon,authenticated;
grant execute on function public.diagnostic_cleanup_sweep() to service_role;
