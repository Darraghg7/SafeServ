-- Settings → Analytics: last login per staff member.
--
-- staff_sessions has no "last seen" column — every login (and every venue
-- switch, see switch_staff_venue) inserts a fresh row, so MAX(created_at)
-- per staff_id is the last-login timestamp. staff_sessions itself has no
-- client-readable RLS policy ("no_direct_session_access" FOR ALL USING
-- (false), see 001_initial_schema.sql), so this has to be a SECURITY
-- DEFINER RPC — modelled directly on list_staff_sessions
-- (085_manager_session_revocation.sql).

CREATE OR REPLACE FUNCTION list_staff_last_logins(
  p_session_token UUID
)
RETURNS TABLE (
  staff_id   UUID,
  staff_name TEXT,
  role       TEXT,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_venue_id UUID;
BEGIN
  SELECT ss.venue_id INTO v_venue_id
    FROM staff_sessions ss
    JOIN staff s ON s.id = ss.staff_id
   WHERE ss.token      = p_session_token
     AND ss.expires_at > now()
     AND s.is_active   = true
     AND s.role IN ('manager', 'owner');

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT s.id, s.name, s.role, MAX(sess.created_at) AS last_login
      FROM staff s
      LEFT JOIN staff_sessions sess
        ON sess.staff_id = s.id AND sess.venue_id = v_venue_id
     WHERE s.venue_id = v_venue_id
     GROUP BY s.id, s.name, s.role
     ORDER BY last_login DESC NULLS LAST, s.name;
END;
$$;
