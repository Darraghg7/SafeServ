-- Migration 008: Waste logs, supplier orders, staff photos, push subscriptions

-- Staff photos
ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ── Waste log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waste_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name        TEXT NOT NULL,
  quantity         NUMERIC NOT NULL,
  unit             TEXT NOT NULL CHECK (unit IN ('kg','portions','items','litres')),
  reason           TEXT NOT NULL CHECK (reason IN ('expired','spoiled','preparation','overproduction','other')),
  recorded_by      UUID REFERENCES staff(id),
  recorded_by_name TEXT,
  notes            TEXT,
  recorded_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON waste_logs USING (true) WITH CHECK (true);

-- ── Suppliers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON suppliers USING (true) WITH CHECK (true);

-- ── Supplier orders ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id    UUID REFERENCES suppliers(id),
  supplier_name  TEXT,
  status         TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted','ordered','received')),
  notes          TEXT,
  raised_by      UUID REFERENCES staff(id),
  raised_by_name TEXT,
  ordered_at     TIMESTAMPTZ,
  received_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON supplier_orders USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS supplier_order_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity  TEXT NOT NULL,
  unit      TEXT,
  notes     TEXT
);
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON supplier_order_items USING (true) WITH CHECK (true);

-- ── Push subscriptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID REFERENCES staff(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON push_subscriptions USING (true) WITH CHECK (true);
