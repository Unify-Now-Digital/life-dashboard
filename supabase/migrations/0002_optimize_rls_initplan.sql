-- Optimise RLS policies per Supabase advisor 0003_auth_rls_initplan.
--
-- Wrapping auth.uid() in a subquery `(select auth.uid())` lets Postgres
-- evaluate the function once per query instead of once per row. No change
-- in semantics — same `auth.uid() = user_id` check, just better at scale.

-- ===== dashboard_state ======================================================
drop policy "ds own select" on public.dashboard_state;
drop policy "ds own insert" on public.dashboard_state;
drop policy "ds own update" on public.dashboard_state;
drop policy "ds own delete" on public.dashboard_state;

create policy "ds own select" on public.dashboard_state
  for select using ((select auth.uid()) = user_id);
create policy "ds own insert" on public.dashboard_state
  for insert with check ((select auth.uid()) = user_id);
create policy "ds own update" on public.dashboard_state
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ds own delete" on public.dashboard_state
  for delete using ((select auth.uid()) = user_id);

-- ===== user_security ========================================================
drop policy "us own select" on public.user_security;
drop policy "us own insert" on public.user_security;
drop policy "us own update" on public.user_security;
drop policy "us own delete" on public.user_security;

create policy "us own select" on public.user_security
  for select using ((select auth.uid()) = user_id);
create policy "us own insert" on public.user_security
  for insert with check ((select auth.uid()) = user_id);
create policy "us own update" on public.user_security
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "us own delete" on public.user_security
  for delete using ((select auth.uid()) = user_id);

-- ===== user_passkeys ========================================================
drop policy "pk own select" on public.user_passkeys;
drop policy "pk own insert" on public.user_passkeys;
drop policy "pk own update" on public.user_passkeys;
drop policy "pk own delete" on public.user_passkeys;

create policy "pk own select" on public.user_passkeys
  for select using ((select auth.uid()) = user_id);
create policy "pk own insert" on public.user_passkeys
  for insert with check ((select auth.uid()) = user_id);
create policy "pk own update" on public.user_passkeys
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "pk own delete" on public.user_passkeys
  for delete using ((select auth.uid()) = user_id);
