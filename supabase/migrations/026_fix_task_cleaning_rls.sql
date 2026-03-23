-- ============================================================================
-- 026: Fix task_templates, task_one_offs, cleaning_tasks RLS write policies
-- ============================================================================
-- These tables were created in migration 002 with write policies that check
-- auth.role() = 'authenticated'. Because this app uses PIN-based sessions
-- (not Supabase Auth), the role is always 'anon', so all writes fail.
-- Migration 009 fixed the same issue for fridges, food_items, staff etc.,
-- but missed these three tables. This migration applies the same fix.
-- ============================================================================

-- ── task_templates ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "task_templates_manager_write" ON task_templates;
CREATE POLICY "task_templates_all_write" ON task_templates
  FOR ALL USING (true) WITH CHECK (true);

-- ── task_one_offs ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "task_one_offs_manager_write" ON task_one_offs;
CREATE POLICY "task_one_offs_all_write" ON task_one_offs
  FOR ALL USING (true) WITH CHECK (true);

-- ── task_completions ──────────────────────────────────────────────────────────
-- Completions are normally written via the complete_task() SECURITY DEFINER
-- RPC, but add a direct write policy as a safety net.
CREATE POLICY IF NOT EXISTS "task_completions_all_write" ON task_completions
  FOR ALL USING (true) WITH CHECK (true);

-- ── cleaning_tasks ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cleaning_tasks_manager_write" ON cleaning_tasks;
CREATE POLICY "cleaning_tasks_all_write" ON cleaning_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- ── cleaning_completions ──────────────────────────────────────────────────────
-- Completions are written via complete_cleaning_task() SECURITY DEFINER RPC,
-- but add direct write policy as safety net.
CREATE POLICY IF NOT EXISTS "cleaning_completions_all_write" ON cleaning_completions
  FOR ALL USING (true) WITH CHECK (true);

-- ── opening_closing_checks ────────────────────────────────────────────────────
-- Defensive re-creation in case the migration 007 policy didn't apply cleanly.
DROP POLICY IF EXISTS "oc_checks_write" ON opening_closing_checks;
CREATE POLICY "oc_checks_write" ON opening_closing_checks
  FOR ALL USING (true) WITH CHECK (true);

-- ── opening_closing_completions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "oc_comps_write" ON opening_closing_completions;
CREATE POLICY "oc_comps_write" ON opening_closing_completions
  FOR ALL USING (true) WITH CHECK (true);
