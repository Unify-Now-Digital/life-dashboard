-- Life Dashboard — initial cloud schema.
--
-- Three tables, all keyed on auth.users(id) with RLS so the anon key shipped
-- in the browser bundle can only read/write the signed-in user's own rows.
-- Multi-tenant by design: new users are zero schema work.
--
--   dashboard_state  — single JSONB blob per user. Shape lives in
--                      src/lib/defaultState.js (SCHEMA_VERSION = 4). The
--                      in-app migrate() pipeline handles shape evolution.
--   user_security    — PIN hash + salt + lock-disabled flag. Migrates the
--                      device-local LS_PIN/LS_SALT/LS_DISABLED out of
--                      authLocal.js so the lock follows the account.
--   user_passkeys    — one row per registered WebAuthn credential. Each
--                      device that opts into Face/Touch ID adds a row;
--                      the private key never leaves that device.

-- ===== dashboard_state ======================================================

create table public.dashboard_state (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  state      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state enable row level security;

create policy "ds own select" on public.dashboard_state
  for select using (auth.uid() = user_id);
create policy "ds own insert" on public.dashboard_state
  for insert with check (auth.uid() = user_id);
create policy "ds own update" on public.dashboard_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ds own delete" on public.dashboard_state
  for delete using (auth.uid() = user_id);

-- ===== user_security ========================================================

create table public.user_security (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  pin_hash       text,
  pin_salt       text,
  lock_disabled  boolean     not null default false,
  updated_at     timestamptz not null default now(),
  constraint pin_pair_consistency check ((pin_hash is null) = (pin_salt is null))
);

alter table public.user_security enable row level security;

create policy "us own select" on public.user_security
  for select using (auth.uid() = user_id);
create policy "us own insert" on public.user_security
  for insert with check (auth.uid() = user_id);
create policy "us own update" on public.user_security
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "us own delete" on public.user_security
  for delete using (auth.uid() = user_id);

-- ===== user_passkeys ========================================================

create table public.user_passkeys (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  credential_id  text        not null,
  label          text,
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz
);

create unique index user_passkeys_user_credential_unique
  on public.user_passkeys (user_id, credential_id);
create index user_passkeys_user_id_idx
  on public.user_passkeys (user_id);

alter table public.user_passkeys enable row level security;

create policy "pk own select" on public.user_passkeys
  for select using (auth.uid() = user_id);
create policy "pk own insert" on public.user_passkeys
  for insert with check (auth.uid() = user_id);
create policy "pk own update" on public.user_passkeys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pk own delete" on public.user_passkeys
  for delete using (auth.uid() = user_id);
