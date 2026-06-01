-- Lock account creation to the single owner email.
--
-- Data isolation is already enforced by RLS on dashboard_state
-- (auth.uid() = user_id for select/insert/update/delete), so the public anon
-- key cannot read other rows. This trigger additionally prevents anyone but
-- the owner from creating an account at all — magic-link sign-in already
-- requires inbox access, and this closes the "stranger signs up with their
-- own email" path at the database level.
--
-- Applied to project nxyvxitykorpswonuyln (Life Dashboard).

create or replace function public.enforce_email_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) <> 'arinmelvin@gmail.com' then
    raise exception 'Sign-ups are restricted on this project.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_allowlist on auth.users;
create trigger enforce_email_allowlist
  before insert on auth.users
  for each row
  execute function public.enforce_email_allowlist();
