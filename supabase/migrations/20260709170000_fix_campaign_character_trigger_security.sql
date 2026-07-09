-- Allow the campaign-character integrity trigger to inspect and lock
-- protected campaign, membership, and character rows independently of
-- the authenticated caller's row-level policies.
--
-- The function already uses an empty search path, fully qualified object
-- names, and performs its own campaign participation and ownership checks.

alter function public.enforce_campaign_character_rules()
security definer;
