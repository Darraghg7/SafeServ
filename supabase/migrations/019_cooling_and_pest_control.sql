-- ── cooling_logs ──────────────────────────────────────────────────────────────
-- Records food cooling events. UK regs: hot food must reach ≤8°C as quickly as
-- possible (ideally within 90 minutes) to avoid bacterial growth in the danger zone.
CREATE TABLE IF NOT EXISTS cooling_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  food_item      text NOT NULL,
  start_temp     numeric NOT NULL,   -- temperature when cooling began (°C)
  end_temp       numeric NOT NULL,   -- temperature after cooling period (°C)
  target_temp    numeric NOT NULL DEFAULT 8,   -- pass threshold ≤8°C
  cooling_method text NOT NULL DEFAULT 'ambient'
                 CHECK (cooling_method IN ('ambient','ice_bath','blast_chiller','cold_water','other')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  logged_by      uuid,
  logged_by_name text,
  logged_at      timestamptz NOT NULL DEFAULT now(),
  notes          text
);
ALTER TABLE cooling_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue access" ON cooling_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ── pest_control_logs ─────────────────────────────────────────────────────────
-- Records pest sightings, routine inspections, treatments and follow-ups.
-- EHOs expect a documented pest control record even when no activity is found.
CREATE TABLE IF NOT EXISTS pest_control_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  log_type       text NOT NULL
                 CHECK (log_type IN ('inspection','sighting','treatment','follow_up')),
  pest_type      text
                 CHECK (pest_type IN ('rodent','cockroach','fly','ant','bird','other')),
  location       text NOT NULL,
  description    text NOT NULL,
  action_taken   text,
  contractor     text,
  severity       text
                 CHECK (severity IN ('low','medium','high')),
  status         text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','resolved')),
  logged_by      uuid,
  logged_by_name text,
  logged_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pest_control_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue access" ON pest_control_logs
  FOR ALL USING (true) WITH CHECK (true);
