-- ═══════════════════════════════════════════════════════════════
-- Smart Store Assistant — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ─── Stores ──────────────────────────────────────────────────────
CREATE TABLE stores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL DEFAULT 'My Store',
  language     TEXT NOT NULL DEFAULT 'ar',     -- 'ar' | 'en'
  currency     TEXT NOT NULL DEFAULT 'JOD',
  dark_mode    BOOLEAN NOT NULL DEFAULT false,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Suppliers ───────────────────────────────────────────────────
CREATE TABLE suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  phone        TEXT,
  notes        TEXT,
  balance_owed NUMERIC(10, 3) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ────────────────────────────────────────────────────
CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  supplier_id          UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL DEFAULT 'General',
  barcode              TEXT,
  description          TEXT,
  notes                TEXT,
  buy_price            NUMERIC(10, 3) NOT NULL DEFAULT 0,
  sell_price           NUMERIC(10, 3) NOT NULL DEFAULT 0,
  total_quantity       INTEGER NOT NULL DEFAULT 0,
  unit_type            TEXT NOT NULL DEFAULT 'piece',
  image_url            TEXT,
  low_stock_threshold  INTEGER,               -- falls back to store setting if null
  is_active            BOOLEAN NOT NULL DEFAULT true,
  last_sold_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Product Batches (FIFO tracking) ─────────────────────────────
CREATE TABLE product_batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id      UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  batch_label   TEXT NOT NULL,   -- A, B, C ...
  quantity      INTEGER NOT NULL DEFAULT 0,
  buy_price     NUMERIC(10, 3),
  expiry_date   DATE,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Daily Sales Summary ─────────────────────────────────────────
-- Lightweight: no per-transaction tracking in MVP.
-- Updated whenever a sale is recorded.
CREATE TABLE daily_sales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  sale_date      DATE NOT NULL,
  total_revenue  NUMERIC(10, 3) NOT NULL DEFAULT 0,
  total_cost     NUMERIC(10, 3) NOT NULL DEFAULT 0,
  total_profit   NUMERIC(10, 3) NOT NULL DEFAULT 0,
  items_sold     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, sale_date)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Every table is locked to the authenticated store owner.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales    ENABLE ROW LEVEL SECURITY;

-- Stores
CREATE POLICY "Owner manages own store"
  ON stores FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Helper: is this store_id owned by the current user?
-- Used as subquery in all other policies.
CREATE POLICY "Access own store suppliers"
  ON suppliers FOR ALL
  USING  (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Access own store products"
  ON products FOR ALL
  USING  (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Access own store batches"
  ON product_batches FOR ALL
  USING  (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Access own store daily sales"
  ON daily_sales FOR ALL
  USING  (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_products_store_id      ON products(store_id);
CREATE INDEX idx_products_barcode       ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_is_active     ON products(store_id, is_active);
CREATE INDEX idx_batches_product_id     ON product_batches(product_id);
CREATE INDEX idx_batches_expiry         ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_batches_store_active   ON product_batches(store_id, is_active);
CREATE INDEX idx_daily_sales_store_date ON daily_sales(store_id, sale_date DESC);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-create a store record when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stores (owner_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at   BEFORE UPDATE ON stores   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- Run these in Supabase Dashboard → Storage → New Bucket
-- OR uncomment and run here if using service role key
-- ═══════════════════════════════════════════════════════════════

-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-scans',  'invoice-scans',  false);
