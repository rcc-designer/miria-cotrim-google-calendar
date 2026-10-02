create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  source text default 'contact_page',
  created_at timestamp with time zone default now()
);

create table if not exists public.bridal_inquiries (
  id uuid primary key default gen_random_uuid(),
  bride_name text not null,
  email text not null,
  phone text not null,
  event_date date not null,
  event_location text not null,
  service_type text not null,
  details text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text default '',
  duration_minutes integer not null,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 15,
  location_type text not null default 'in_person',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamp with time zone default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  requested_service text not null,
  preferred_date date,
  preferred_time text,
  notes text,
  status text default 'new',
  created_at timestamp with time zone default now()
);

alter table public.booking_requests
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists service_slug text,
  add column if not exists requested_start timestamp with time zone,
  add column if not exists requested_end timestamp with time zone,
  add column if not exists time_zone text default 'America/New_York',
  add column if not exists google_event_id text,
  add column if not exists google_event_link text,
  add column if not exists source text default 'book_page';

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text default 'beauty_list',
  consent boolean default true,
  created_at timestamp with time zone default now()
);

alter table public.contact_messages enable row level security;
alter table public.bridal_inquiries enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.booking_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists bridal_inquiries_created_at_idx
  on public.bridal_inquiries (created_at desc);

create index if not exists services_active_sort_idx
  on public.services (active, sort_order);

create index if not exists availability_rules_lookup_idx
  on public.availability_rules (service_id, active, day_of_week);

create index if not exists blackout_dates_lookup_idx
  on public.blackout_dates (service_id, date);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

create index if not exists booking_requests_status_idx
  on public.booking_requests (status);

create index if not exists booking_requests_requested_start_idx
  on public.booking_requests (requested_start);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

insert into public.services
  (slug, name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, location_type, active, sort_order)
values
  ('bridal-trial', 'Bridal Trial', 'In-person one-on-one bridal preview appointment.', 120, 0, 15, 'in_person', true, 10),
  ('hair-makeup', 'Hair + Makeup', 'In-person one-on-one complete beauty appointment.', 120, 0, 15, 'in_person', true, 20),
  ('hair-treatment', 'Hair Treatment', 'In-person one-on-one hair care appointment.', 60, 0, 15, 'in_person', true, 30),
  ('haircut', 'Haircut', 'In-person one-on-one haircut appointment.', 30, 0, 15, 'in_person', true, 40),
  ('special-events', 'Special Events', 'In-person one-on-one event hair and makeup appointment.', 240, 0, 15, 'in_person', true, 50),
  ('hair-styling', 'Hair Styling', 'In-person one-on-one styling appointment.', 60, 0, 15, 'in_person', true, 60),
  ('makeup', 'Makeup', 'In-person one-on-one makeup appointment.', 60, 0, 15, 'in_person', true, 70),
  ('bridal-consultation', 'Bridal Consultation', 'Ask-invitee consultation before confirming bridal details.', 30, 0, 15, 'ask_invitee', true, 80)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  buffer_before_minutes = excluded.buffer_before_minutes,
  buffer_after_minutes = excluded.buffer_after_minutes,
  location_type = excluded.location_type,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.availability_rules
  (service_id, day_of_week, start_time, end_time, active)
select null, day_of_week, time '09:00', time '17:00', true
from generate_series(0, 6) as day_of_week
where not exists (
  select 1
  from public.availability_rules existing
  where existing.service_id is null
    and existing.day_of_week = day_of_week
    and existing.start_time = time '09:00'
    and existing.end_time = time '17:00'
);
