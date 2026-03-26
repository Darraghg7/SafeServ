-- Add exceedance reason and follow-up tracking to fridge temperature logs.
-- "Explained" exceedances (delivery, defrost, service access) are logged honestly
-- but do not count against the compliance score.

ALTER TABLE fridge_temperature_logs
  ADD COLUMN IF NOT EXISTS exceedance_reason text
    CHECK (exceedance_reason IS NULL OR exceedance_reason IN
      ('delivery', 'defrost', 'service_access', 'equipment', 'other')),
  ADD COLUMN IF NOT EXISTS follow_up_due_at timestamptz;

COMMENT ON COLUMN fridge_temperature_logs.exceedance_reason IS
  'Reason for an out-of-range reading. delivery/defrost/service_access = explained (no score penalty). equipment/other = corrective action required.';

COMMENT ON COLUMN fridge_temperature_logs.follow_up_due_at IS
  'When a follow-up temperature check is due after an explained exceedance. NULL = no follow-up required.';
