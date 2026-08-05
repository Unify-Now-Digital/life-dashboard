-- push_subscriptions: Web Push subscriptions for the Spanish "Calma" reminders.
-- Owner-only via RLS; the send-practice-reminder Edge Function reads all rows
-- with the service role (bypassing RLS) to send pushes + stamp last_sent_at.
-- (select auth.uid()) form matches the initplan-optimised policies in this project.
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null,                 -- push service endpoint URL
  p256dh       text not null,                 -- client public key (b64url)
  auth         text not null,                 -- client auth secret (b64url)
  user_agent   text,                          -- which device/browser subscribed
  last_sent_at timestamptz,                   -- per-day dedupe guard in the sender
  created_at   timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "ps read"   on public.push_subscriptions for select using ((select auth.uid()) = user_id);
create policy "ps insert" on public.push_subscriptions for insert with check ((select auth.uid()) = user_id);
create policy "ps update" on public.push_subscriptions for update using ((select auth.uid()) = user_id);
create policy "ps delete" on public.push_subscriptions for delete using ((select auth.uid()) = user_id);
