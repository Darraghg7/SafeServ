-- Migration 009: Fix ALL remaining RLS policies
-- This app uses PIN-based sessions (not Supabase Auth), so auth.role()
-- is always 'anon'. All write policies that check auth.role() = 'authenticated'
-- will always fail. This migration opens them to allow writes from the anon role.
-- Permission enforcement is handled at the application layer.

-- ── fridges ──────────────────────────────────────────────────────────────────
-- Original schema only had SELECT policy. Migration 007 added a write policy
-- but may not have been applied. Drop + recreate to be safe.
DROP POLICY IF EXISTS "fridges_all_write" ON fridges;
CREATE POLICY "fridges_all_write" ON fridges
  FOR ALL USING (true) WITH CHECK (true);

-- ── fridge_temperature_logs ──────────────────────────────────────────────────
-- Fix the manager_modify policy that checks auth.role() = 'authenticated'
DROP POLICY IF EXISTS "fridge_logs_manager_modify" ON fridge_temperature_logs;
DROP POLICY IF EXISTS "fridge_logs_all_write" ON fridge_temperature_logs;
CREATE POLICY "fridge_logs_all_write" ON fridge_temperature_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ── food_items ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "food_items_manager_write" ON food_items;
CREATE POLICY "food_items_all_write" ON food_items
  FOR ALL USING (true) WITH CHECK (true);

-- ── food_allergens ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "food_allergens_manager_write" ON food_allergens;
CREATE POLICY "food_allergens_all_write" ON food_allergens
  FOR ALL USING (true) WITH CHECK (true);

-- ── staff ────────────────────────────────────────────────────────────────────
-- Staff updates (photo, settings) need write access
DROP POLICY IF EXISTS "staff_all_write" ON staff;
CREATE POLICY "staff_all_write" ON staff
  FOR ALL USING (true) WITH CHECK (true);

-- ── clock_events ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clock_events_all_write" ON clock_events;
CREATE POLICY "clock_events_all_write" ON clock_events
  FOR ALL USING (true) WITH CHECK (true);

-- ── staff_training: add category column if missing ───────────────────────────
ALTER TABLE staff_training ADD COLUMN IF NOT EXISTS category TEXT;
