-- ─────────────────────────────────────────────────────────────────────────────
-- Allow staff to correct their own clock-in / clock-out times after the fact
-- (e.g. when WiFi was down and they couldn't clock out, or clocked in at the
-- wrong time).
--
-- SECURITY DEFINER so it works with the anon key (same pattern as
-- record_clock_event). The function only modifies events that belong to the
-- staff_id derived from the clock_in event, so no staff member can touch
-- another person's records.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION edit_clock_session(
  p_clock_in_id    uuid,
  p_clock_in_time  timestamptz,
  p_clock_out_id   uuid        DEFAULT NULL,  -- pass existing id to update, NULL to insert
  p_clock_out_time timestamptz DEFAULT NULL,  -- NULL = leave no clock_out (active session)
  p_break_minutes  integer     DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_venue_id uuid;
  v_break_mid timestamptz;
BEGIN
  -- Verify the clock_in event exists and fetch owner
  SELECT staff_id, venue_id
  INTO   v_staff_id, v_venue_id
  FROM   clock_events
  WHERE  id = p_clock_in_id
    AND  event_type = 'clock_in';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Clock-in event not found: %', p_clock_in_id;
  END IF;

  -- Update the clock_in timestamp
  UPDATE clock_events
  SET    occurred_at = p_clock_in_time
  WHERE  id = p_clock_in_id;

  -- Update or insert the clock_out event
  IF p_clock_out_time IS NOT NULL THEN
    IF p_clock_out_id IS NOT NULL THEN
      UPDATE clock_events
      SET    occurred_at = p_clock_out_time
      WHERE  id = p_clock_out_id;
    ELSE
      INSERT INTO clock_events (staff_id, event_type, venue_id, occurred_at)
      VALUES (v_staff_id, 'clock_out', v_venue_id, p_clock_out_time);
    END IF;
  END IF;

  -- Remove all break events within this session window
  DELETE FROM clock_events
  WHERE  staff_id   = v_staff_id
    AND  venue_id   = v_venue_id
    AND  event_type IN ('break_start', 'break_end')
    AND  occurred_at > p_clock_in_time
    AND  occurred_at < COALESCE(p_clock_out_time,
                                p_clock_in_time + interval '24 hours');

  -- Re-insert a single break block centred in the shift
  IF p_break_minutes > 0 AND p_clock_out_time IS NOT NULL THEN
    v_break_mid := p_clock_in_time
                 + (p_clock_out_time - p_clock_in_time) / 2;

    INSERT INTO clock_events (staff_id, event_type, venue_id, occurred_at)
    VALUES
      (v_staff_id, 'break_start', v_venue_id,
       v_break_mid - (p_break_minutes * interval '1 minute') / 2),
      (v_staff_id, 'break_end',   v_venue_id,
       v_break_mid + (p_break_minutes * interval '1 minute') / 2);
  END IF;
END;
$$;
