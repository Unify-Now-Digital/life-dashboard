-- Schedule the hourly trigger for send-practice-reminder (Spanish "Calma").
--
-- HOURLY (not daily) on purpose: the "only at 19:00 Madrid" rule lives in the
-- Edge Function so it's DST-proof, and the per-subscription last_sent_at guard
-- prevents duplicate sends within a day.
--
-- The service-role key is NOT committed here — it's read from Supabase Vault at
-- run time. Before this job can post successfully, store the key once (out of
-- band, e.g. via the SQL editor — keeps the secret out of git):
--
--   select vault.create_secret(
--     '<SERVICE_ROLE_KEY>',
--     'reminder_service_role_key',
--     'Bearer token for the send-practice-reminder cron job'
--   );
--
-- (The function URL embeds only the public project ref, so it's inline below.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: drop a prior definition so re-running the migration is safe.
select cron.unschedule('spanish-reminder-hourly')
where exists (select 1 from cron.job where jobname = 'spanish-reminder-hourly');

select cron.schedule(
  'spanish-reminder-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://nxyvxitykorpswonuyln.functions.supabase.co/send-practice-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'reminder_service_role_key'
      ),
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
