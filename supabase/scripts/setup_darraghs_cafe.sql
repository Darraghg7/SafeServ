-- ============================================================================
-- Setup: Darragh's Cafe test account
-- Creates venue, owner staff member, and default app settings
-- Run once in Supabase SQL Editor.
-- ============================================================================

DO $$
DECLARE
  v_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN

  -- ── Venue ──────────────────────────────────────────────────────────────────
  INSERT INTO venues (id, name, slug, plan)
  VALUES (v_id, 'Darragh''s Cafe', 'darraghs-cafe', 'pro')
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        plan = EXCLUDED.plan;

  -- ── Owner staff member ─────────────────────────────────────────────────────
  -- PIN: 1234  (change after first login)
  INSERT INTO staff (name, email, pin_hash, role, job_role, venue_id, is_active)
  VALUES (
    'Darragh',
    'darraghguy@yahoo.com',
    crypt('1234', gen_salt('bf')),
    'manager',
    'manager',
    v_id,
    true
  )
  ON CONFLICT DO NOTHING;

  -- ── App settings ───────────────────────────────────────────────────────────
  INSERT INTO app_settings (venue_id, key, value)
  VALUES
    (v_id, 'venue_name',    'Darragh''s Cafe'),
    (v_id, 'manager_email', 'darraghguy@yahoo.com'),
    (v_id, 'logo_url',      '')
  ON CONFLICT (venue_id, key) DO UPDATE
    SET value = EXCLUDED.value;

  RAISE NOTICE 'Darragh''s Cafe created. Venue ID: %, slug: darraghs-cafe, PIN: 1234', v_id;
END $$;
