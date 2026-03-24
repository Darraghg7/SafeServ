-- Migration 030: Venue closed periods
-- Allows a venue to mark themselves as closed for a date range (e.g. Christmas week)

create table if not exists venue_closures (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint venue_closures_dates_check check (end_date >= start_date)
);

alter table venue_closures enable row level security;

create policy "venue_closures_all" on venue_closures
  for all using (true) with check (true);

create index if not exists idx_venue_closures_venue_dates
  on venue_closures (venue_id, start_date, end_date);
