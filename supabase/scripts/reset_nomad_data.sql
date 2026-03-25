-- ============================================================================
-- Reset Nomad Bakes data
-- Clears all operational data for venue 00000000-0000-0000-0000-000000000001
-- Preserves: venue row, staff accounts, app_settings (name/email/logo)
-- Run once manually in Supabase SQL Editor — will NOT auto-run again.
-- ============================================================================

DO $$
DECLARE
  v_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- Temperature logs
  DELETE FROM fridge_temperature_logs        WHERE venue_id = v_id;
  DELETE FROM fridges                        WHERE venue_id = v_id;
  DELETE FROM cooking_temp_logs             WHERE venue_id = v_id;
  DELETE FROM hot_holding_logs              WHERE venue_id = v_id;
  DELETE FROM hot_holding_items             WHERE venue_id = v_id;
  DELETE FROM cooling_logs                  WHERE venue_id = v_id;
  DELETE FROM probe_calibrations            WHERE venue_id = v_id;

  -- Deliveries
  DELETE FROM delivery_check_items WHERE check_id IN (
    SELECT id FROM delivery_checks WHERE venue_id = v_id
  );
  DELETE FROM delivery_checks               WHERE venue_id = v_id;

  -- Cleaning
  DELETE FROM cleaning_completions          WHERE venue_id = v_id;
  DELETE FROM cleaning_tasks                WHERE venue_id = v_id;

  -- Opening / closing
  DELETE FROM opening_closing_completions   WHERE venue_id = v_id;
  DELETE FROM opening_closing_checks        WHERE venue_id = v_id;

  -- Tasks
  DELETE FROM task_completions              WHERE venue_id = v_id;
  DELETE FROM task_one_offs                 WHERE venue_id = v_id;
  DELETE FROM task_templates                WHERE venue_id = v_id;

  -- Corrective actions
  DELETE FROM corrective_actions            WHERE venue_id = v_id;

  -- Allergens / food items
  DELETE FROM food_allergens                WHERE venue_id = v_id;
  DELETE FROM food_items                    WHERE venue_id = v_id;

  -- Suppliers
  DELETE FROM supplier_order_items WHERE order_id IN (
    SELECT id FROM supplier_orders WHERE venue_id = v_id
  );
  DELETE FROM supplier_orders               WHERE venue_id = v_id;
  DELETE FROM supplier_items                WHERE venue_id = v_id;
  DELETE FROM suppliers                     WHERE venue_id = v_id;

  -- Pest control
  DELETE FROM pest_control_logs             WHERE venue_id = v_id;

  -- Rota / shifts
  DELETE FROM shift_swaps WHERE shift_id IN (
    SELECT id FROM shifts WHERE venue_id = v_id
  );
  DELETE FROM shifts                        WHERE venue_id = v_id;
  DELETE FROM staff_availability            WHERE venue_id = v_id;
  DELETE FROM time_off_requests             WHERE venue_id = v_id;
  DELETE FROM clock_events                  WHERE venue_id = v_id;

  -- Training
  DELETE FROM training_sign_offs            WHERE venue_id = v_id;
  DELETE FROM staff_training                WHERE venue_id = v_id;

  -- Fitness declarations
  DELETE FROM fitness_declarations          WHERE venue_id = v_id;

  -- Noticeboard
  DELETE FROM noticeboard_posts             WHERE venue_id = v_id;

  -- Waste
  DELETE FROM waste_logs                    WHERE venue_id = v_id;

  -- HACCP / audit (if exists)
  DELETE FROM corrective_actions            WHERE venue_id = v_id;

  -- Dashboard widget preferences (reset to default)
  DELETE FROM dashboard_widgets             WHERE venue_id = v_id;

  -- Venue closures
  DELETE FROM venue_closures                WHERE venue_id = v_id;

  -- Staff sessions (forces re-login)
  DELETE FROM staff_sessions                WHERE venue_id = v_id;

  RAISE NOTICE 'Nomad Bakes data reset complete.';
END $$;
