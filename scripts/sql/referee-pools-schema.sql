-- Referee Blast tool — pools schema
-- referees.id = bigint, assignors.auth_user_id = uuid

create table if not exists referee_pools (
    id          bigint generated always as identity primary key,
    name        text not null,
    owner_uid   uuid not null,                 -- assignors.auth_user_id (the assignor who owns this pool)
    description text,
    active      boolean not null default true,
    created_at  timestamptz not null default now()
);

create table if not exists pool_members (
    id          bigint generated always as identity primary key,
    pool_id     bigint not null references referee_pools(id) on delete cascade,
    referee_id  bigint not null references referees(id)      on delete cascade,
    created_at  timestamptz not null default now(),
    unique (pool_id, referee_id)
);

create index if not exists idx_referee_pools_owner on referee_pools(owner_uid);
create index if not exists idx_pool_members_pool    on pool_members(pool_id);
create index if not exists idx_pool_members_referee on pool_members(referee_id);

-- Contact/consent columns on referees for blasting (safe if some already exist)
alter table referees add column if not exists email_opt_in boolean not null default true;
alter table referees add column if not exists sms_opt_in   boolean not null default true;
alter table referees add column if not exists unsubscribed_at timestamptz;
