-- ─────────────────────────────────────────────────────────────────────────────
-- 049_fix_staff_rpcs.sql
-- Fix update_staff_member (add back p_new_pin lost in 041) and
-- create_staff_member (add p_colour). Also create training-files bucket.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop ALL overloaded versions of update_staff_member so we can recreate cleanly
DROP FUNCTION IF EXISTS update_staff_member(uuid, uuid, text, text, text, text, numeric, text, boolean, boolean, text[]);
DROP FUNCTION IF EXISTS update_staff_member(uuid, uuid, text, text, text, text, numeric, numeric, boolean, boolean, text[], boolean, int[], int, text);

CREATE OR REPLACE FUNCTION update_staff_member(
  p_session_token    uuid,
  p_staff_id         uuid,
  p_name             text           DEFAULT NULL,
  p_role             text           DEFAULT NULL,
  p_job_role         text           DEFAULT NULL,
  p_email            text           DEFAULT NULL,
  p_hourly_rate      numeric        DEFAULT NULL,
  p_contracted_hours numeric        DEFAULT NULL,
  p_show_temp_logs   boolean        DEFAULT NULL,
  p_show_allergens   boolean        DEFAULT NULL,
  p_skills           text[]         DEFAULT NULL,
  p_is_under_18      boolean        DEFAULT NULL,
  p_working_days     int[]          DEFAULT NULL,
  p_sort_order       int            DEFAULT NULL,
  p_colour           text           DEFAULT NULL,
  p_new_pin          text           DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
  v_venue uuid;
BEGIN
  SELECT ss.venue_id INTO v_venue
  FROM staff_sessions ss
  JOIN staff s ON s.id = ss.staff_id
  WHERE ss.token = p_session_token
    AND ss.expires_at > now()
    AND s.role IN ('manager', 'owner')
    AND s.is_active = true;

  IF v_venue IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE staff SET
    name             = COALESCE(p_name,             name),
    role             = COALESCE(p_role,             role),
    job_role         = COALESCE(p_job_role,         job_role),
    email            = COALESCE(p_email,            email),
    hourly_rate      = COALESCE(p_hourly_rate,      hourly_rate),
    contracted_hours = COALESCE(p_contracted_hours, contracted_hours),
    show_temp_logs   = COALESCE(p_show_temp_logs,   show_temp_logs),
    show_allergens   = COALESCE(p_show_allergens,   show_allergens),
    skills           = COALESCE(p_skills,           skills),
    is_under_18      = COALESCE(p_is_under_18,      is_under_18),
    working_days     = COALESCE(p_working_days,     working_days),
    sort_order       = COALESCE(p_sort_order,       sort_order),
    colour           = CASE WHEN p_colour IS NOT NULL THEN NULLIF(p_colour, '') ELSE colour END,
    pin_hash         = CASE WHEN p_new_pin IS NOT NULL
                        THEN crypt(p_new_pin, gen_salt('bf'))
                        ELSE pin_hash END
  WHERE id = p_staff_id
    AND venue_id = v_venue;
END;
$$;

-- 2. Drop + recreate create_staff_member with p_colour
DROP FUNCTION IF EXISTS create_staff_member(uuid, text, text, text, text, text, numeric, text[]);

CREATE OR REPLACE FUNCTION create_staff_member(
  p_session_token uuid,
  p_name          text,
  p_job_role      text,
  p_pin           text,
  p_role          text     DEFAULT 'staff',
  p_email         text     DEFAULT NULL,
  p_hourly_rate   numeric  DEFAULT 0,
  p_skills        text[]   DEFAULT '{}',
  p_colour        text     DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
DECLARE
  v_new_id   uuid;
  v_venue_id uuid;
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

  IF p_role NOT IN ('staff', 'manager', 'owner') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  INSERT INTO staff (name, email, pin_hash, role, job_role, hourly_rate, skills, colour, is_active, venue_id)
  VALUES (p_name, p_email, crypt(p_pin, gen_salt('bf')), p_role, p_job_role, p_hourly_rate, p_skills, NULLIF(p_colour, ''), true, v_venue_id)
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$;

-- 3. Create training-files storage bucket (for certificate uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-files', 'training-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload and read training files
DROP POLICY IF EXISTS "training_upload" ON storage.objects;
CREATE POLICY "training_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'training-files');

DROP POLICY IF EXISTS "training_read" ON storage.objects;
CREATE POLICY "training_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'training-files');

DROP POLICY IF EXISTS "training_delete" ON storage.objects;
CREATE POLICY "training_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'training-files');
