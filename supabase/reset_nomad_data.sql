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
  DELETE FROM task_completions               WHERE venue_id = v_id;
  DELETE FROM task_one_offs                  WHERE venue_id = v_id;
  DELETE FROM task_templates                 WHERE venue_id = v_id;

  -- Opening / closing (completions link through check_id, both have venue_id)
  DELETE FROM opening_closing_completions    WHERE venue_id = v_id;
  DELETE FROM opening_closing_checks         WHERE venue_id = v_id;

  -- Cleaning
  DELETE FROM cleaning_completions           WHERE venue_id = v_id;
  DELETE FROM cleaning_tasks                 WHERE venue_id = v_id;

  -- Temperature & fridge logs
  DELETE FROM fridge_temperature_logs        WHERE venue_id = v_id;
  DELETE FROM fridges                        WHERE venue_id = v_id;

  -- Delivery checks
  DELETE FROM delivery_check_items           WHERE venue_id = v_id;
  DELETE FROM delivery_checks                WHERE venue_id = v_id;

  -- Suppliers & orders
  DELETE FROM supplier_order_items           WHERE venue_id = v_id;
  DELETE FROM supplier_orders                WHERE venue_id = v_id;
  DELETE FROM supplier_items                 WHERE venue_id = v_id;
  DELETE FROM suppliers                      WHERE venue_id = v_id;

  -- Corrective actions
  DELETE FROM corrective_actions             WHERE venue_id = v_id;

  -- Probe calibrations
  DELETE FROM probe_calibrations             WHERE venue_id = v_id;

  -- Waste
  DELETE FROM waste_logs                     WHERE venue_id = v_id;

  -- Training & fitness
  DELETE FROM staff_training                 WHERE venue_id = v_id;
  DELETE FROM fitness_declarations
    WHERE staff_id IN (SELECT id FROM staff WHERE venue_id = v_id);

  -- Time off & shift swaps
  DELETE FROM time_off_requests              WHERE venue_id = v_id;
  DELETE FROM shift_swaps                    WHERE venue_id = v_id;

  -- Rota & clock
  DELETE FROM clock_events                   WHERE venue_id = v_id;
  DELETE FROM shifts                         WHERE venue_id = v_id;
  DELETE FROM staff_availability             WHERE venue_id = v_id;

  -- training_sign_offs (only exists if migration 029 has been run)
  BEGIN
    DELETE FROM training_sign_offs           WHERE venue_id = v_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- noticeboard_posts (only exists if that migration has been run)
  BEGIN
    DELETE FROM noticeboard_posts            WHERE venue_id = v_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  RAISE NOTICE 'Nomad Bakes data cleared. Staff and venue settings preserved.';
END $$;
