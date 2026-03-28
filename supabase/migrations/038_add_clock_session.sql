-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER function to add a brand-new clock session (missed punch).
-- Previously AddShiftForm was inserting directly into clock_events via the
-- anon key, which bypasses our SECURITY DEFINER safety pattern and allows
-- payload manipulation. This RPC handles the insert safely server-side.
--
-- Returns the id of the new clock_in event so the client can reference it.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_clock_session(
  p_staff_id       uuid,
  p_venue_id       uuid,
  p_clock_in_time  timestamptz,
  p_clock_out_time timestamptz DEFAULT NULL,
  p_break_minutes  integer     DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clock_in_id uuid;
  v_break_mid   timestamptz;
BEGIN
  -- Insert the clock_in event
  INSERT INTO clock_events (staff_id, venue_id, event_type, occurred_at)
  VALUES (p_staff_id, p_venue_id, 'clock_in', p_clock_in_time)
  RETURNING id INTO v_clock_in_id;

  -- Optionally insert clock_out
  IF p_clock_out_time IS NOT NULL THEN
    INSERT INTO clock_events (staff_id, venue_id, event_type, occurred_at)
    VALUES (p_staff_id, p_venue_id, 'clock_out', p_clock_out_time);
  END IF;

  -- Optionally insert break events centred in the shift
  IF p_break_minutes > 0 AND p_clock_out_time IS NOT NULL THEN
    v_break_mid := p_clock_in_time
                 + (p_clock_out_time - p_clock_in_time) / 2;
    INSERT INTO clock_events (staff_id, venue_id, event_type, occurred_at)
    VALUES
      (p_staff_id, p_venue_id, 'break_start',
       v_break_mid - (p_break_minutes * interval '1 minute') / 2),
      (p_staff_id, p_venue_id, 'break_end',
       v_break_mid + (p_break_minutes * interval '1 minute') / 2);
  END IF;

  RETURN v_clock_in_id;
END;
$$;
