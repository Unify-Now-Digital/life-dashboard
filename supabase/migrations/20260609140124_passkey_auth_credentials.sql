-- Passkey (WebAuthn) sign-in support.
-- user_passkeys gains the material needed to VERIFY assertions server-side
-- (public key + signature counter + transports). Challenges are short-lived
-- and only touched by the Edge Function (service-role), so RLS denies all
-- direct client access.

alter table public.user_passkeys
  add column if not exists public_key text,
  add column if not exists counter bigint not null default 0,
  add column if not exists transports text[];

create unique index if not exists user_passkeys_credential_id_key
  on public.user_passkeys (credential_id);

create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge text not null,
  purpose text not null check (purpose in ('register', 'authenticate')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.webauthn_challenges enable row level security;
-- Intentionally NO policies: only the Edge Function (service-role, which
-- bypasses RLS) reads/writes challenges. Anon/authenticated clients get nothing.
