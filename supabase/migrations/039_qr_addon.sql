-- Add QR table card add-on flag to venues
-- When true, the venue has purchased the QR Code Table Cards add-on (£1/mo)

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS qr_addon boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN venues.qr_addon IS
  'Whether the venue has the QR Table Cards add-on enabled (£1/mo)';
