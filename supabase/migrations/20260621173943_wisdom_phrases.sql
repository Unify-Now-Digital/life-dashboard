-- wisdom_phrases: rotating dashboard quotes. Owner-only, mirrors existing RLS style.
create table if not exists public.wisdom_phrases (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  note        text,                          -- optional elaboration
  category    text not null,                 -- work | drive | people | dating | sales | health
  tags        text[] not null default '{}',  -- e.g. {identity}
  rotation    boolean not null default true, -- false => stored but excluded from the header rotation (dating)
  active      boolean not null default true, -- soft-retire without deleting
  weight      int not null default 1,        -- bump to surface some more often (optional)
  created_at  timestamptz not null default now()
);

alter table public.wisdom_phrases enable row level security;

-- Single-owner app: any authenticated session may read/write its wisdom.
-- (select auth.uid()) form matches the initplan-optimised policies already in this project.
create policy "wisdom read"   on public.wisdom_phrases for select using ((select auth.uid()) is not null);
create policy "wisdom insert" on public.wisdom_phrases for insert with check ((select auth.uid()) is not null);
create policy "wisdom update" on public.wisdom_phrases for update using ((select auth.uid()) is not null);
create policy "wisdom delete" on public.wisdom_phrases for delete using ((select auth.uid()) is not null);
