-- ============================================================
-- Referee Tool venue/field codes  —  RTVCT001 / RTFCT001
-- Run once. Safe to re-run: guarded with IF NOT EXISTS.
-- ============================================================
-- Numbering restarts per state, so the first Massachusetts venue
-- is RTVMA001 rather than continuing CT's sequence.
-- Codes are never reused once retired.

begin;

alter table venues add column if not exists rt_code text;
alter table fields add column if not exists rt_code text;

create unique index if not exists venues_rt_code_uniq on venues (rt_code);
create unique index if not exists fields_rt_code_uniq on fields (rt_code);

-- ---------- minting ----------
create or replace function next_rt_code(p_prefix text, p_state text)
returns text language plpgsql as $$
declare n integer;
begin
  if p_prefix = 'RTV' then
    select coalesce(max(substring(rt_code from 6)::int), 0) + 1 into n
      from venues where rt_code like 'RTV' || p_state || '%';
  else
    select coalesce(max(substring(rt_code from 6)::int), 0) + 1 into n
      from fields where rt_code like 'RTF' || p_state || '%';
  end if;
  return p_prefix || p_state || lpad(n::text, 3, '0');
end $$;

-- ---------- venues: auto-assign on insert ----------
create or replace function venues_set_rt_code()
returns trigger language plpgsql as $$
begin
  if new.rt_code is null then
    new.rt_code := next_rt_code('RTV', coalesce(nullif(trim(new.state), ''), 'CT'));
  end if;
  return new;
end $$;

drop trigger if exists trg_venues_rt_code on venues;
create trigger trg_venues_rt_code before insert on venues
  for each row execute function venues_set_rt_code();

-- ---------- fields: auto-assign, inherit state from parent venue ----------
create or replace function fields_set_rt_code()
returns trigger language plpgsql as $$
declare s text;
begin
  s := nullif(trim(coalesce(new.state, '')), '');
  if s is null and new.venue_id is not null then
    select nullif(trim(coalesce(state, '')), '') into s from venues where id = new.venue_id;
  end if;
  s := coalesce(s, 'CT');
  if new.state is null or trim(new.state) = '' then
    new.state := s;
  end if;
  if new.rt_code is null then
    new.rt_code := next_rt_code('RTF', s);
  end if;
  return new;
end $$;

drop trigger if exists trg_fields_rt_code on fields;
create trigger trg_fields_rt_code before insert on fields
  for each row execute function fields_set_rt_code();

-- ---------- backfill: venues, ordered club then name ----------
with ordered as (
  select id,
         coalesce(nullif(trim(state), ''), 'CT') as st,
         row_number() over (
           partition by coalesce(nullif(trim(state), ''), 'CT')
           order by coalesce(club_name, 'zzz'), coalesce("Venue Name", name, ''), id
         ) as rn
  from venues
  where rt_code is null
)
update venues v
   set rt_code = 'RTV' || o.st || lpad(o.rn::text, 3, '0')
  from ordered o
 where v.id = o.id;

-- ---------- backfill: fields, ordered by parent venue then field name ----------
-- Fields with no venue_id are skipped: they cannot be placed or stated.
with ordered as (
  select f.id,
         coalesce(nullif(trim(f.state), ''), nullif(trim(v.state), ''), 'CT') as st,
         row_number() over (
           partition by coalesce(nullif(trim(f.state), ''), nullif(trim(v.state), ''), 'CT')
           order by v.rt_code, coalesce(f."Field Name", f.name, ''), f.id
         ) as rn
  from fields f
  join venues v on v.id = f.venue_id
  where f.rt_code is null
)
update fields f
   set rt_code = 'RTF' || o.st || lpad(o.rn::text, 3, '0')
  from ordered o
 where f.id = o.id;

commit;

-- ---------- verify ----------
-- select count(*) filter (where rt_code is null) as venues_missing from venues;
-- select count(*) filter (where rt_code is null) as fields_missing from fields;
-- select rt_code, "Venue Name", city, club_name from venues order by rt_code limit 20;
