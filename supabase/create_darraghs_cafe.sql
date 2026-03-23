-- ============================================================================
-- Create "Darragh's Cafe" test venue
--
-- BEFORE RUNNING:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Create a new user with email: darraghguy@yahoo.com
--   3. Copy the UUID of that user
--   4. Replace 'YOUR-AUTH-USER-UUID-HERE' below with that UUID
--
-- Run in Supabase SQL Editor → New Query
-- ============================================================================

DO $$
DECLARE
  v_owner_auth_id  uuid := 'YOUR-AUTH-USER-UUID-HERE'; -- ← paste your Supabase auth user UUID here
  v_venue_id       uuid := gen_random_uuid();
  v_staff_id       uuid;
  v_slug           text := 'darraghs-cafe';
  v_owner_pin      text := '1234';  -- change this before going live
BEGIN

  -- 1. Create the venue
  INSERT INTO venues (id, name, slug, plan, owner_id)
  VALUES (v_venue_id, 'Darragh''s Cafe', v_slug, 'pro', v_owner_auth_id);

  -- 2. Create the owner staff record
  INSERT INTO staff (id, name, role, job_role, pin_hash, venue_id, is_active)
  VALUES (
    gen_random_uuid(),
    'Darragh',
    'owner',
    'foh',
    crypt(v_owner_pin, gen_salt('bf')),
    v_venue_id,
    true
  )
  RETURNING id INTO v_staff_id;

  -- 3. Seed app settings
  INSERT INTO app_settings (venue_id, key, value) VALUES
    (v_venue_id, 'venue_name',    'Darragh''s Cafe'),
    (v_venue_id, 'manager_email', 'darraghguy@yahoo.com'),
    (v_venue_id, 'plan',          'pro'),
    (v_venue_id, 'logo_url',      '');

  -- 4. Link owner_id back to staff (some auth flows use this)
  UPDATE venues SET owner_id = v_owner_auth_id WHERE id = v_venue_id;

  RAISE NOTICE 'Created venue: Darragh''s Cafe';
  RAISE NOTICE 'Venue ID: %', v_venue_id;
  RAISE NOTICE 'Venue slug: %', v_slug;
  RAISE NOTICE 'Login URL: /v/%/login', v_slug;
  RAISE NOTICE 'Owner PIN: %', v_owner_pin;
END $$;
