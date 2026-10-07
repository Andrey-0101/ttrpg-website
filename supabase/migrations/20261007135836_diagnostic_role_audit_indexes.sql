-- Administrator audit FKs need indexes without changing role capabilities.
create index system_user_roles_granted_by on public.system_user_roles(granted_by);
create index system_user_roles_revoked_by on public.system_user_roles(revoked_by);
