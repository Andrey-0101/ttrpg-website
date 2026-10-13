-- Prepared for the separately approved rollout. No literal secret/URL is stored here.
create extension if not exists pg_net with schema extensions;

create function private.enqueue_diagnostic_cleanup() returns bigint
language plpgsql security definer set search_path = '' as $$
declare endpoint text; credential text;
begin
  select decrypted_secret into endpoint from vault.decrypted_secrets where name = 'diagnostic_cleanup_url';
  select decrypted_secret into credential from vault.decrypted_secrets where name = 'diagnostic_cleanup_secret';
  -- Local/Preview databases without explicit operational configuration remain inert.
  if endpoint is null or credential is null then return null; end if;
  if endpoint !~ '^https://[^/?#]+/api/internal/diagnostics/cleanup$' or length(credential) < 43 then
    raise exception 'diagnostic_cleanup_configuration_invalid';
  end if;
  return net.http_post(url := endpoint,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || credential),
    body := '{}'::jsonb, timeout_milliseconds := 30000);
end;
$$;
revoke all on function private.enqueue_diagnostic_cleanup() from public, anon, authenticated, service_role;
select cron.schedule('cleanup-diagnostic-artifacts','*/5 * * * *','select private.enqueue_diagnostic_cleanup();');

-- pg_net queue headers are readable by trusted direct DB-login roles. Keep net
-- outside Data API exposed schemas; do not claim a postgres REVOKE overrides
-- Supabase-owned PUBLIC grants. Rollout preflight must verify these boundaries.
