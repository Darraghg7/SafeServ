-- ============================================================================
-- Reset Nomad Bakes operational data
-- Keeps: venues, staff, app_settings, dashboard_widgets, staff_sessions
-- Clears: all food safety records, tasks, training, suppliers, etc.
--
-- Run this in Supabase SQL Editor → New Query
-- ============================================================================

DO $$
DECLARE
  v_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- Tasks
  DELETE FROM task_completions       WHERE venue_id = v_id;
  DELETE FROM task_one_offs          WHERE venue_id = v_id;
  DELETE FROM task_templates         WHERE venue_id = v_id;

  -- Opening / closing
  DELETE FROM opening_closing_completions
    WHERE check_id IN (SELECT id FROM opening_closing_checks WHERE venue_id = v_id);
  DELETE FROM opening_closing_checks WHERE venue_id = v_id;

  -- Cleaning
  DELETE FROM cleaning_completions
    WHERE task_id IN (
      SELECT ct.id FROM cleaning_tasks ct
      JOIN cleaning_schedules cs ON cs.id = ct.schedule_id
      WHERE cs.venue_id = v_id
    );
  DELETE FROM cleaning_tasks
    WHERE schedule_id IN (SELECT id FROM cleaning_schedules WHERE venue_id = v_id);
  DELETE FROM cleaning_schedules     WHERE venue_id = v_id;

  -- Training
  DELETE FROM training_sign_offs     WHERE venue_id = v_id;
  DELETE FROM staff_training         WHERE venue_id = v_id;

  -- Fitness declarations
  DELETE FROM fitness_declarations
    WHERE staff_id IN (SELECT id FROM staff WHERE venue_id = v_id);

  -- Suppliers & noticeboard
  DELETE FROM suppliers              WHERE venue_id = v_id;
  DELETE FROM noticeboard_posts      WHERE venue_id = v_id;

  -- Time off & shift swaps
  DELETE FROM time_off_requests      WHERE venue_id = v_id;
  DELETE FROM shift_swaps            WHERE venue_id = v_id;

  -- Temperature logs
  DELETE FROM temp_logs              WHERE venue_id = v_id;

  -- HACCP / delivery / waste / orders / probe calibrations
  DELETE FROM haccp_logs             WHERE venue_id = v_id;
  DELETE FROM delivery_checks        WHERE venue_id = v_id;
  DELETE FROM waste_logs             WHERE venue_id = v_id;
  DELETE FROM orders                 WHERE venue_id = v_id;
  DELETE FROM probe_calibrations     WHERE venue_id = v_id;

  -- Rota / shifts
  DELETE FROM shifts                 WHERE venue_id = v_id;
  DELETE FROM staff_availability     WHERE staff_id IN (SELECT id FROM staff WHERE venue_id = v_id);

  RAISE NOTICE 'Nomad Bakes data cleared. Staff and venue settings preserved.';
END $$;
