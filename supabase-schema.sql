-- ============================================================
-- WayPoint Supabase Schema
-- ------------------------------------------------------------
-- Run this file ONCE in the Supabase SQL Editor.
--   1. Open https://supabase.com/dashboard/project/ulbfjwoqayhtqxejwuuq
--   2. SQL Editor → New Query → paste this whole file → Run.
--
-- It creates the `universities` and `cities` tables, the indexes
-- needed for fast filtering, and the Row Level Security policies
-- that allow public READ access but block any public WRITE.
--
-- After this finishes, open tools/export-to-sql.html in your
-- browser, click "Generate SQL", copy the output, paste into a
-- new SQL Editor query, and run it — that seeds both tables.
-- ============================================================

-- ============================================================
-- 1. UNIVERSITIES TABLE
-- ============================================================
create table if not exists public.universities (
    id                      text        primary key,
    country                 text        not null check (country in ('USA','UK')),
    display_order           integer     not null default 0,

    -- Scalar display fields
    name                    text        not null,
    short_name              text,
    city_id                 text,
    city_name               text,
    rank                    text,
    tuition                 text,
    hero_image              text,
    overview                text,
    financial_reqs          text,

    -- List / nested fields (kept as JSONB to mirror the existing
    -- nested JavaScript structure exactly).
    quick_facts             jsonb       not null default '[]'::jsonb,
    admission_requirements  jsonb       not null default '[]'::jsonb,
    application_deadlines   jsonb       not null default '[]'::jsonb,
    bachelors               jsonb       not null default '[]'::jsonb,
    masters                 jsonb       not null default '[]'::jsonb,
    scholarships            jsonb       not null default '[]'::jsonb,

    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index if not exists universities_country_idx
    on public.universities (country);

create index if not exists universities_display_order_idx
    on public.universities (display_order);

-- Auto-bump updated_at on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists universities_set_updated_at on public.universities;
create trigger universities_set_updated_at
    before update on public.universities
    for each row execute procedure public.set_updated_at();

-- ============================================================
-- 2. CITIES TABLE
-- ============================================================
create table if not exists public.cities (
    id                  text        primary key,

    name                text        not null,
    state               text,
    layout              text,

    gallery             jsonb       not null default '[]'::jsonb,
    life                jsonb       not null default '[]'::jsonb,
    vibes               text,
    landmarks           text,

    cost_note_top       text,
    cost_note_bottom    text,

    -- Shared / studio budget columns (current data structure)
    rent_shared         text,
    rent_studio         text,
    utils_shared        text,
    utils_studio        text,
    food_shared         text,
    food_studio         text,
    trans_shared        text,
    trans_studio        text,
    ent_shared          text,
    ent_studio          text,
    total_shared        text,
    total_studio        text,

    -- Legacy single-figure columns (present on some UK city entries)
    utils               text,
    food                text,
    trans               text,

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
    before update on public.cities
    for each row execute procedure public.set_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Public role (anon) can SELECT freely but cannot INSERT, UPDATE
-- or DELETE — meaning the publishable key embedded in the browser
-- is safe to ship publicly. Writes can only be done from the
-- Supabase SQL Editor or via the service_role key (which we never
-- put in client code).
-- ============================================================

alter table public.universities enable row level security;
alter table public.cities       enable row level security;

drop policy if exists "Public read universities" on public.universities;
create policy "Public read universities"
    on public.universities
    for select
    to anon
    using (true);

drop policy if exists "Public read cities" on public.cities;
create policy "Public read cities"
    on public.cities
    for select
    to anon
    using (true);

-- ============================================================
-- 4. AUTHENTICATED ROLE (optional)
-- Allow logged-in users the same SELECT access. The website does
-- not currently use auth, but this future-proofs the policies so
-- adding a login flow later does not lock anyone out.
-- ============================================================

drop policy if exists "Authenticated read universities" on public.universities;
create policy "Authenticated read universities"
    on public.universities
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated read cities" on public.cities;
create policy "Authenticated read cities"
    on public.cities
    for select
    to authenticated
    using (true);

-- ============================================================
-- Done. Now open tools/export-to-sql.html to generate the seed
-- INSERT statements from your current hardcoded data files.
-- ============================================================
