-- Bentley Complex — load its fields, and install the fields RT-code trigger.
--
--   RTVCT017 · venues.id 215 · CA venue 795 · Woodstock · NECONN
--
-- Central Assign lists only two fields there (Grass #775, Turf #776). Tod
-- referees at this venue: there are TWO grass fields and one turf, so CA is
-- short a field, not just us. The second grass has no CA Field ID and gets
-- null — a field number is never invented, that is how the bogus 9000-series
-- got minted.
--
-- ⚠️ Run one statement at a time (Ctrl+Enter), NOT as a script, and NOT
-- wrapped in begin/commit. A wrapper here previously reported success while
-- rolling everything back on a single failure.
--
-- Step 4 is a real SELECT, not a comment — a trailing comment gets executed
-- as a statement and reports "Updated Rows 0", which reads like success.

-- ---------- 1. minting function (idempotent) ----------
create or replace function next_rt_code(p_prefix text, p_state text)
returns text language plpgsql as $fn$
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
end $fn$;

-- ---------- 2. fields trigger (this never ran) ----------
create or replace function fields_set_rt_code()
returns trigger language plpgsql as $fn$
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
end $fn$;

drop trigger if exists trg_fields_rt_code on fields;

create trigger trg_fields_rt_code before insert on fields
  for each row execute function fields_set_rt_code();

-- ---------- 3. the three fields ----------
-- Trigger mints rt_code per row, so each gets its own RTFCT###. Doing this by
-- hand in one UPDATE would give all three the SAME code: next_rt_code() reads
-- max+1 off the table and the statement does not see its own uncommitted rows.
insert into fields (venue_id, "Venue ID", "Field ID", "Field Name", state) values
  (215, 795, 775,  'Grass 1', 'CT'),
  (215, 795, NULL, 'Grass 2', 'CT'),
  (215, 795, 776,  'Turf',    'CT');

-- ---------- 4. verify — expect 3 rows, each with a distinct rt_code ----------
select id, rt_code, "Field Name", "Field ID", "Venue ID", state
  from fields
 where venue_id = 215
 order by "Field Name";
