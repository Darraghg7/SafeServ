-- ============================================================================
-- 027: Fix suppliers category column + all blocked write policies
-- ============================================================================
-- Migration 025 failed because the suppliers table was created in migration 012
-- without a category column (migration 023's CREATE TABLE IF NOT EXISTS silently
-- skipped it since the table already existed). This migration adds the missing
-- column and re-runs all the fixes from 025 and 026.
--
-- Migration 026 also failed because CREATE POLICY IF NOT EXISTS is not valid
-- PostgreSQL syntax. This migration uses DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================================

-- ── 1. Add missing category column to suppliers ───────────────────────────────
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';

-- Add the check constraint (drop first in case of partial previous run)
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_category_check;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_category_check
  CHECK (category IN ('meat', 'fish', 'dairy', 'produce', 'dry_goods', 'other'));

-- ── 2. Suppliers write policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── 3. Noticeboard write policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "noticeboard_insert" ON noticeboard_posts;
CREATE POLICY "noticeboard_insert" ON noticeboard_posts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "noticeboard_update" ON noticeboard_posts;
CREATE POLICY "noticeboard_update" ON noticeboard_posts
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── 4. Task completions write policy (replaces IF NOT EXISTS syntax) ──────────
DROP POLICY IF EXISTS "task_completions_all_write" ON task_completions;
CREATE POLICY "task_completions_all_write" ON task_completions
  FOR ALL USING (true) WITH CHECK (true);

-- ── 5. Cleaning tasks write policy (may have failed in 026) ──────────────────
DROP POLICY IF EXISTS "cleaning_tasks_manager_write" ON cleaning_tasks;
DROP POLICY IF EXISTS "cleaning_tasks_all_write" ON cleaning_tasks;
CREATE POLICY "cleaning_tasks_all_write" ON cleaning_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- ── 6. Cleaning completions write policy ─────────────────────────────────────
DROP POLICY IF EXISTS "cleaning_completions_all_write" ON cleaning_completions;
CREATE POLICY "cleaning_completions_all_write" ON cleaning_completions
  FOR ALL USING (true) WITH CHECK (true);

-- ── 7. Opening/closing write policies (defensive re-creation) ─────────────────
DROP POLICY IF EXISTS "oc_checks_write" ON opening_closing_checks;
CREATE POLICY "oc_checks_write" ON opening_closing_checks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "oc_comps_write" ON opening_closing_completions;
CREATE POLICY "oc_comps_write" ON opening_closing_completions
  FOR ALL USING (true) WITH CHECK (true);
