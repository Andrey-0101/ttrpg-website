create or replace function public.diagnostic_dispatch(actor_id uuid, auth_session_id uuid, operation text,
  target_campaign uuid default null, target_run uuid default null, input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.game_room_diagnostic_clients%rowtype; result jsonb;
begin
  if operation not in ('capability','owner','state','start','stop','owner_heartbeat','export','request_cleanup','join','heartbeat','reserve','accept','final') then raise exception 'malformed_request'; end if;
  if operation in ('reserve','final','join') then
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
        and ((input->>'first_record_sequence') is null or (input->>'first_record_sequence')::bigint <> c.last_sample_sequence + 1) then raise exception 'sequence_conflict'; end if;
    elsif exists(select 1 from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id and epoch >= 100)
      and not exists(select 1 from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id and instance_id = (input->>'instance')::uuid) then
      raise exception 'segment_limit';
    end if;
  end if;
  begin
    result := public.diagnostic_dispatch_internal(actor_id,auth_session_id,operation,target_campaign,target_run,input);
  exception when raise_exception then
    if operation <> 'reserve' or sqlerrm <> 'run_limit' then raise; end if;
    -- Commit the stop, then report a typed error to the server; raising here would roll it back.
    update public.game_room_diagnostic_runs set state='stopping',stopped_at=clock_timestamp(),
      stop_deadline=clock_timestamp()+interval '30 seconds',stop_reason='quota',partial=true,revision=revision+1
      where id=target_run and state='recording';
    return jsonb_build_object('error','run_limit');
  end;
  if operation in ('stop','state','export','owner','final') then
    update public.game_room_diagnostic_runs r set partial=true
      where r.id=coalesce(target_run,(result->>'id')::uuid) and r.state='ready'
        and not exists(select 1 from public.game_room_diagnostic_chunks where run_id=r.id and state='accepted');
    if operation in ('stop','state','export','owner') and result is not null and result<>'null'::jsonb then
      select to_jsonb(r)-'owner_session_hash' into result from public.game_room_diagnostic_runs r where r.id=(result->>'id')::uuid;
    end if;
  end if;
  return result - 'owner_session_hash';
end;
$$;
revoke all on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) to service_role;
