-- Staff permissions: granular per-staff, per-venue permission grants.
-- Replaces the old show_temp_logs / show_allergens boolean flags with a
-- flexible permission system that supports any number of permission types.

create table if not exists staff_permissions (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references staff(id) on delete cascade not null,
  venue_id uuid references venues(id) on delete cascade not null,
  permission text not null,
  created_at timestamptz default now(),
  unique(staff_id, venue_id, permission)
);

create index if not exists idx_staff_permissions_lookup
  on staff_permissions(staff_id, venue_id);

-- Migrate existing boolean flags into the new permissions table
-- show_temp_logs=true → 'view_temp_logs' + 'log_temps'
insert into staff_permissions (staff_id, venue_id, permission)
select s.id, s.venue_id, 'view_temp_logs'
from staff s where s.show_temp_logs = true and s.role = 'staff'
on conflict do nothing;

insert into staff_permissions (staff_id, venue_id, permission)
select s.id, s.venue_id, 'log_temps'
from staff s where s.show_temp_logs = true and s.role = 'staff'
on conflict do nothing;

-- show_allergens=true → 'manage_allergens'
insert into staff_permissions (staff_id, venue_id, permission)
select s.id, s.venue_id, 'manage_allergens'
from staff s where s.show_allergens = true and s.role = 'staff'
on conflict do nothing;

-- Grant all active staff the default daily permissions
insert into staff_permissions (staff_id, venue_id, permission)
select s.id, s.venue_id, p.permission
from staff s
cross join (values ('manage_cleaning'), ('manage_tasks'), ('manage_opening'), ('log_temps')) as p(permission)
where s.role = 'staff' and s.is_active = true
on conflict do nothing;
