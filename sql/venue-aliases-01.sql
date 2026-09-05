-- ============================================================================
-- venue_aliases — the names people actually write for a venue
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Ross's Week 1 sheet says "Sterling Town Hall". Central Assign calls the same
-- ground "Sterling Community Center" (CA 941), and our record carries a THIRD
-- spelling, "Sterling Community School", in its `name` column. All three are one
-- place, and only CA's spelling may ever go into an export file.
--
-- ⚠️ AN ALIAS IS FOR READING, NEVER FOR WRITING. The CA export emits
-- venues."Venue Name" and CA matches on exact string — putting a local nickname
-- anywhere near that path fails the import, the way "Old KHS" and bare field
-- numbers did on 2026-09-05. Aliases resolve an upload and label a dropdown.
-- Nothing else.
-- ============================================================================

create table if not exists public.venue_aliases (
    venue_id   bigint      not null references public.venues (id) on delete cascade,
    alias      text        not null,
    note       text,
    created_at timestamptz not null default now(),
    primary key (venue_id, alias)
);

comment on table public.venue_aliases is
    'Local names for a venue. Used to RESOLVE an upload and to label a dropdown. Never exported.';

alter table public.venue_aliases enable row level security;

drop policy if exists venue_aliases_read on public.venue_aliases;
create policy venue_aliases_read on public.venue_aliases for select using (true);

drop policy if exists venue_aliases_write on public.venue_aliases;
create policy venue_aliases_write on public.venue_aliases for all using (true) with check (true);

insert into public.venue_aliases (venue_id, alias, note)
select v.id, 'Sterling Town Hall', 'What Ross writes on the NECONN schedule; CA calls it Sterling Community Center'
  from public.venues v
 where v."Venue ID" = 941
on conflict (venue_id, alias) do nothing;

select va.alias, v.id, coalesce(nullif(v.name,''), v."Venue Name") as venue,
       v."Venue Name" as ca_name, v."Venue ID" as ca_id
  from public.venue_aliases va
  join public.venues v on v.id = va.venue_id
 order by v.id;
