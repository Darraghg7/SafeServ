-- Add working_days (array of day-of-week ints, 1=Mon…7=Sun, empty=all days)
-- and sort_order (for PIN picker ordering) to staff table

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS working_days int[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order    int  NOT NULL DEFAULT 0;

-- Index sort_order so the PIN screen query is fast
CREATE INDEX IF NOT EXISTS idx_staff_sort_order ON staff (venue_id, sort_order, name);
