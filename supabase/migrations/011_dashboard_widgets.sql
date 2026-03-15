-- ============================================================================
-- 011: Dashboard widget preferences per staff member
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  widget_id  text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one entry per staff + widget
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_widgets_staff_widget
  ON dashboard_widgets (staff_id, widget_id);

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_widgets_read  ON dashboard_widgets;
DROP POLICY IF EXISTS dashboard_widgets_write ON dashboard_widgets;
CREATE POLICY dashboard_widgets_read  ON dashboard_widgets FOR SELECT USING (true);
CREATE POLICY dashboard_widgets_write ON dashboard_widgets FOR ALL    USING (true) WITH CHECK (true);
