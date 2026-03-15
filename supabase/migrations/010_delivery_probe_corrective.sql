-- ============================================================================
-- 010: Delivery Checks, Probe Calibration, Corrective Actions
-- ============================================================================

-- ── Delivery Checks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  items_desc    text,                    -- brief description of items received
  temp_reading  numeric(4,1),            -- temperature in celsius
  temp_pass     boolean DEFAULT true,
  packaging_ok  boolean DEFAULT true,
  use_by_ok     boolean DEFAULT true,
  overall_pass  boolean DEFAULT true,
  photo_url     text,                    -- photo of delivery note
  notes         text,
  checked_by    uuid REFERENCES staff(id),
  checked_at    timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE delivery_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delivery_checks_read  ON delivery_checks;
DROP POLICY IF EXISTS delivery_checks_write ON delivery_checks;
CREATE POLICY delivery_checks_read  ON delivery_checks FOR SELECT USING (true);
CREATE POLICY delivery_checks_write ON delivery_checks FOR ALL    USING (true) WITH CHECK (true);

-- ── Probe Calibrations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS probe_calibrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_name      text NOT NULL DEFAULT 'Probe 1',
  method          text NOT NULL DEFAULT 'ice_water',  -- ice_water | boiling_water
  expected_temp   numeric(4,1) NOT NULL DEFAULT 0.0,
  actual_reading  numeric(4,1) NOT NULL,
  tolerance       numeric(3,1) NOT NULL DEFAULT 1.0,  -- +/- acceptable range
  pass            boolean GENERATED ALWAYS AS (
    abs(actual_reading - expected_temp) <= tolerance
  ) STORED,
  calibrated_by   uuid REFERENCES staff(id),
  calibrated_at   timestamptz DEFAULT now(),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE probe_calibrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS probe_calibrations_read  ON probe_calibrations;
DROP POLICY IF EXISTS probe_calibrations_write ON probe_calibrations;
CREATE POLICY probe_calibrations_read  ON probe_calibrations FOR SELECT USING (true);
CREATE POLICY probe_calibrations_write ON probe_calibrations FOR ALL    USING (true) WITH CHECK (true);

-- ── Corrective Actions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corrective_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text NOT NULL DEFAULT 'other',
    -- temperature, cleaning, delivery, pest, equipment, food_safety, other
  title           text NOT NULL,
  description     text,
  action_taken    text NOT NULL,
  severity        text NOT NULL DEFAULT 'minor',  -- minor | major | critical
  status          text NOT NULL DEFAULT 'open',   -- open | resolved
  reported_by     uuid REFERENCES staff(id),
  resolved_by     uuid REFERENCES staff(id),
  reported_at     timestamptz DEFAULT now(),
  resolved_at     timestamptz,
  linked_type     text,  -- e.g. 'fridge_log', 'delivery_check', 'cleaning'
  linked_id       uuid,  -- FK to the related record
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS corrective_actions_read  ON corrective_actions;
DROP POLICY IF EXISTS corrective_actions_write ON corrective_actions;
CREATE POLICY corrective_actions_read  ON corrective_actions FOR SELECT USING (true);
CREATE POLICY corrective_actions_write ON corrective_actions FOR ALL    USING (true) WITH CHECK (true);
