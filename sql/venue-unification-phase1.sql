-- ============================================================================
-- VENUE UNIFICATION — PHASE 1 (FINAL): junction + ADDITIVE population  (2026-06-23)
-- ============================================================================
-- ⚠️ RUN PHASE 0 (backups) FIRST. Do not run without the _bak_ tables present.
--
-- ADDITIVE ONLY. Builds the new structure ALONGSIDE the old (club_name string +
-- events/tournaments JSONB). Removes nothing, changes no reader. Old world keeps
-- working untouched. Undo everything: `drop table entity_venues;`
-- (The fields.venue_id backfill in step 2 only POPULATES a FK column — also safe.)
--
-- Confirmed against live data 2026-06-23:
--   venues  : id PK, "Venue ID" (CA #, nullable), "Venue Name", address, city,
--             state, zip, club_name (sparse + LOOSELY matched: "RHAM" → "RHAMYS")
--   fields  : id PK, "Field ID" (CA #), "Field Name", "Venue ID" (CA # = parent
--             venue link), venue_id (PK FK — backfilled here)
--   clubs   : id (int), "Club Name"
--   events  : id (int),  venues JSONB = [{name, fields:[...]}]
--   tournaments: id (UUID), venues JSONB = [{name, fields:[...], address}]
-- ============================================================================

-- 1. JUNCTION — every entity dips into venues through this -------------------
create table if not exists entity_venues (
    id          bigint generated always as identity primary key,
    entity_type text   not null check (entity_type in ('club','event','tournament')),
    entity_id   text   not null,                 -- int club/event id OR uuid tournament id, as text
    venue_id    bigint not null,                 -- venues.id (FK omitted; add later once venues.id PK/type confirmed)
    created_at  timestamptz default now(),
    unique (entity_type, entity_id, venue_id)
);
create index if not exists ev_entity_idx on entity_venues (entity_type, entity_id);
create index if not exists ev_venue_idx  on entity_venues (venue_id);

-- 2. NORMALIZE field→venue link: backfill fields.venue_id (PK FK) from CA match
--    Makes ALL existing fields resolvable by FK, not just by CA number.
update fields f
set    venue_id = v.id
from   venues v
where  f."Venue ID" is not null
  and  v."Venue ID" is not null
  and  f."Venue ID" = v."Venue ID"
  and  (f.venue_id is null or f.venue_id <> v.id);

-- 3. CLUBS → venues  (LOOSE match, same as the workstation: "RHAM"⇄"RHAMYS") ---
insert into entity_venues (entity_type, entity_id, venue_id)
select distinct 'club', c.id::text, v.id
from   venues v
join   clubs  c
  on   lower(c."Club Name") like '%' || lower(v.club_name) || '%'
   or  lower(v.club_name)   like '%' || lower(c."Club Name") || '%'
where  coalesce(btrim(v.club_name),'') <> ''
on conflict do nothing;

-- 4. EVENTS  (create missing venues name-only → fields on CA-less venues → link)
insert into venues ("Venue Name", name)                       -- 4a: create missing venues
select distinct elem->>'name', elem->>'name'
from   events e cross join lateral jsonb_array_elements(e.venues) elem
where  jsonb_typeof(e.venues)='array' and coalesce(btrim(elem->>'name'),'') <> ''
  and  not exists (select 1 from venues v where lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name'))
on conflict do nothing;

insert into fields ("Field Name", name, venue_id)             -- 4b: fields, ONLY on CA-less venues
select distinct fld, fld, v.id
from   events e
cross join lateral jsonb_array_elements(e.venues) elem
cross join lateral jsonb_array_elements_text(coalesce(elem->'fields','[]'::jsonb)) fld
join   venues v on lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name')
where  jsonb_typeof(e.venues)='array' and coalesce(btrim(fld),'') <> ''
  and  v."Venue ID" is null                                   -- never touch an existing CA venue's fields
  and  not exists (select 1 from fields f2 where f2.venue_id = v.id and lower(coalesce(f2."Field Name",f2.name)) = lower(fld))
on conflict do nothing;

insert into entity_venues (entity_type, entity_id, venue_id)  -- 4c: link
select distinct 'event', e.id::text, v.id
from   events e cross join lateral jsonb_array_elements(e.venues) elem
join   venues v on lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name')
where  jsonb_typeof(e.venues)='array'
on conflict do nothing;

-- 5. TOURNAMENTS  (venues mostly already exist; same guards) -----------------
insert into venues ("Venue Name", name)                       -- 5a
select distinct elem->>'name', elem->>'name'
from   tournaments t cross join lateral jsonb_array_elements(t.venues) elem
where  jsonb_typeof(t.venues)='array' and coalesce(btrim(elem->>'name'),'') <> ''
  and  not exists (select 1 from venues v where lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name'))
on conflict do nothing;

insert into fields ("Field Name", name, venue_id)             -- 5b: fields, ONLY on CA-less venues
select distinct fld, fld, v.id
from   tournaments t
cross join lateral jsonb_array_elements(t.venues) elem
cross join lateral jsonb_array_elements_text(coalesce(elem->'fields','[]'::jsonb)) fld
join   venues v on lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name')
where  jsonb_typeof(t.venues)='array' and coalesce(btrim(fld),'') <> ''
  and  v."Venue ID" is null
  and  not exists (select 1 from fields f2 where f2.venue_id = v.id and lower(coalesce(f2."Field Name",f2.name)) = lower(fld))
on conflict do nothing;

insert into entity_venues (entity_type, entity_id, venue_id)  -- 5c: link
select distinct 'tournament', t.id::text, v.id
from   tournaments t cross join lateral jsonb_array_elements(t.venues) elem
join   venues v on lower(coalesce(v."Venue Name",v.name)) = lower(elem->>'name')
where  jsonb_typeof(t.venues)='array'
on conflict do nothing;

-- 6. VERIFY  (read-only — paste output back to Ralph) ------------------------
select entity_type, count(*) links, count(distinct entity_id) entities
from entity_venues group by entity_type order by 1;

-- every event/tournament with JSONB venues should now have links (expect 0 rows):
select 'event' typ, e.id::text, e.name from events e
where jsonb_typeof(e.venues)='array' and jsonb_array_length(e.venues)>0
  and not exists (select 1 from entity_venues ev where ev.entity_type='event' and ev.entity_id=e.id::text)
union all
select 'tournament', t.id::text, t.name from tournaments t
where jsonb_typeof(t.venues)='array' and jsonb_array_length(t.venues)>0
  and not exists (select 1 from entity_venues ev where ev.entity_type='tournament' and ev.entity_id=t.id::text);

-- the bug we started from — Ellis Tech should now show a linked venue + its field:
select e.name event, v."Venue Name" venue, v."Venue ID" ca_venue, f."Field Name" field
from entity_venues ev
join events e on e.id::text = ev.entity_id and ev.entity_type='event'
join venues v on v.id = ev.venue_id
left join fields f on f.venue_id = v.id
where e.name ilike '%ellis%';
