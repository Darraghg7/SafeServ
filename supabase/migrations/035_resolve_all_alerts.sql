-- ─────────────────────────────────────────────────────────────────────────────
-- Extend resolution tracking to all alert-generating tables so managers can
-- mark any failed reading / check as actioned from the EHO audit page.
--
-- corrective_actions already has status='open'/'resolved' — no change needed.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE delivery_checks
  ADD COLUMN IF NOT EXISTS is_resolved  boolean    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz;

ALTER TABLE probe_calibrations
  ADD COLUMN IF NOT EXISTS is_resolved  boolean    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz;

ALTER TABLE staff_training
  ADD COLUMN IF NOT EXISTS is_resolved  boolean    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz;
