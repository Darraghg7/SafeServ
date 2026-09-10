-- Restrict a staff member's account to read-only "My Shifts" access.
--
-- Distinct from is_active (which blocks login entirely): a restricted staff
-- member can still sign in, but every route except the rota view redirects
-- them back to it, and the rota view itself hides swap/fix-hours actions.
-- Writes to the staff table go through SECURITY DEFINER RPCs only (see
-- 091_venue_scoped_rls.sql — staff has no client-writable RLS policy), so
-- this follows the same pattern as deactivate_staff_member / reactivate_staff_member.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_restricted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION restrict_staff_member(
  p_session_token UUID,
  p_staff_id      UUID
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_venue_id UUID;
BEGIN
  SELECT ss.venue_id INTO v_venue_id
  FROM staff_sessions ss
  JOIN staff s ON s.id = ss.staff_id
  WHERE ss.token = p_session_token
    AND ss.expires_at > now()
    AND s.role IN ('manager', 'owner')
    AND s.is_active = true;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Only 'staff' role accounts can be restricted — managers/owners never lose nav access this way.
  UPDATE staff SET is_restricted = true
  WHERE id = p_staff_id AND venue_id = v_venue_id AND role = 'staff';
END;
$$;

CREATE OR REPLACE FUNCTION unrestrict_staff_member(
  p_session_token UUID,
  p_staff_id      UUID
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_venue_id UUID;
BEGIN
  SELECT ss.venue_id INTO v_venue_id
  FROM staff_sessions ss
  JOIN staff s ON s.id = ss.staff_id
  WHERE ss.token = p_session_token
    AND ss.expires_at > now()
    AND s.role IN ('manager', 'owner')
    AND s.is_active = true;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE staff SET is_restricted = false
  WHERE id = p_staff_id AND venue_id = v_venue_id;
END;
$$;
