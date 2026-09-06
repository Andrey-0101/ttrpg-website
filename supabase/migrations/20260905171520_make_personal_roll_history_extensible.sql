alter table public.personal_roll_history
  drop constraint personal_roll_history_roller_kind_check,
  drop constraint personal_roll_history_schema_version_check;

alter table public.personal_roll_history
  add constraint personal_roll_history_roller_kind_check
    check (roller_kind ~ '^[a-z][a-z0-9_]{0,63}$'),
  add constraint personal_roll_history_schema_version_check
    check (schema_version > 0);
