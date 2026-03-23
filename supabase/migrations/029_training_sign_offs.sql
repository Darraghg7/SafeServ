-- Migration 029: SC6-style training sign-off records with digital signatures
-- Separate from staff_training (certificate tracker) — this is the induction/sign-off workflow

create table if not exists training_sign_offs (
  id                    uuid primary key default gen_random_uuid(),
  venue_id              uuid not null references venues(id) on delete cascade,
  staff_id              uuid not null references staff(id) on delete cascade,
  training_date         date not null,
  trainer_name          text not null,
  topics                text[] not null default '{}',
  notes                 text,
  manager_name          text,
  manager_signature     text,   -- base64 data URL
  staff_acknowledged    boolean not null default false,
  staff_acknowledged_at timestamptz,
  staff_signature       text,   -- base64 data URL
  created_at            timestamptz not null default now()
);

alter table training_sign_offs enable row level security;

create policy "training_sign_offs_all" on training_sign_offs
  for all using (true) with check (true);
