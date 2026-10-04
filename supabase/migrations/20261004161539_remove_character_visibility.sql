-- Contract: apply in Production ONLY after the exact visibility-free app is
-- READY and active on the canonical domain. Never batch with the expand step.
do $$
begin
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261004161535'
  ) then
    raise exception 'The character assignment authorization transition must be applied first';
  end if;
end;
$$;

-- RESTRICT (no CASCADE) fails closed if an unexpected dependency remains.
-- No character or assignment rows, content, owners or timestamps are rewritten.
alter table public.characters drop constraint characters_visibility_check;
alter table public.characters drop column visibility;
