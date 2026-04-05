-- ============================================================================
-- 040: Multi-device session improvements
--
-- Problem: 8-hour session expiry logs staff out during normal workdays.
--          Multiple concurrent device logins are already supported at the DB
--          level (one row per device), but short expiry makes it feel broken.
--
-- Changes:
--   1. Extend default session expiry from 8 hours → 30 days
--   2. Update verify_staff_pin_and_create_session to set 30-day expiry
--   3. Add refresh_staff_session — extends an active session by 30 days
--      (called periodically by active clients; keeps sessions alive without
--       requiring a re-login)
--   4. Add additional_venues to venues — records how many extra venues a Pro
--      account signed up for (used for billing intent)
-- ============================================================================

-- 1. Extend the default expiry on new sessions
ALTER TABLE staff_sessions
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

-- 2. Re-create verify_staff_pin_and_create_session with 30-day expiry
--    Multi-device behaviour is preserved:
--      - Only EXPIRED sessions are deleted (not all sessions for this staff member)
--      - Each device login gets its own unique token row
--      - Signing out on one device only invalidates that device's token
CREATE OR REPLACE FUNCTION verify_staff_pin_and_create_session(
  p_staff_id uuid,
  p_pin      text,
  p_venue_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash     text;
  v_token    uuid;
  v_venue_id uuid;
BEGIN
  SELECT pin_hash, venue_id
    INTO v_hash, v_venue_id
    FROM staff
   WHERE id = p_staff_id AND is_active = true;

  IF v_hash IS NULL THEN RETURN NULL; END IF;
  IF crypt(p_pin, v_hash) <> v_hash THEN RETURN NULL; END IF;

  -- Optional: verify the staff member belongs to the given venue
  IF p_venue_id IS NOT NULL AND v_venue_id <> p_venue_id THEN RETURN NULL; END IF;

  -- Prune expired sessions only — valid sessions on other devices are untouched
  DELETE FROM staff_sessions
   WHERE staff_id = p_staff_id AND expires_at < now();

  -- Create a new 30-day session for this device
  INSERT INTO staff_sessions (staff_id, venue_id, expires_at)
  VALUES (p_staff_id, v_venue_id, now() + interval '30 days')
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- 3. Add refresh_staff_session — extends an existing valid session
--    Returns TRUE if the session was found and extended, FALSE if not found/expired.
CREATE OR REPLACE FUNCTION refresh_staff_session(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE staff_sessions
     SET expires_at = now() + interval '30 days'
   WHERE token = p_token AND expires_at > now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- 4. Track additional venues intent on Pro signups
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS additional_venues smallint NOT NULL DEFAULT 0;
