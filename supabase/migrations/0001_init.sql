-- =============================================================================
-- Migration: 0001_init.sql
-- Application: Warung Ozy POS (Supabase PostgreSQL Migration)
-- Description: Creates 8 core POS tables, indices, RLS policies, & stored procedures
-- =============================================================================

-- Enable pgcrypto extension for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLES DEFINITIONS
-- -----------------------------------------------------------------------------

-- 1.1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2. MENU ITEMS (PRODUCTS) TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_path TEXT DEFAULT '',
  barcode TEXT,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT DEFAULT 'Pelanggan Umum',
  order_type TEXT DEFAULT 'retail',
  status TEXT CHECK (status IN ('completed', 'cancelled', 'pending')) DEFAULT 'completed',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT ''
);

-- 1.5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT CHECK (method IN ('cash', 'qris', 'ewallet', 'card')) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reference_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  product_name TEXT,
  delta INTEGER NOT NULL,
  reason TEXT CHECK (reason IN ('sale', 'adjustment_in', 'adjustment_out', 'return', 'initial')) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT CHECK (category IN ('belanja_barang', 'operasional', 'gaji', 'lainnya')) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expense_date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.8. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menu_items_barcode ON menu_items(barcode);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES
-- Note: Warung Ozy is a single-tenant owner-operated app without authentication.
-- Public anon key policies allow full CRUD operations. Keep your Supabase URL & Key private.
-- -----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. ATOMIC STORED PROCEDURES (RPC FUNCTIONS)
-- -----------------------------------------------------------------------------

-- 4.1. CREATE ORDER (Atomic Checkout Transaction)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name TEXT,
  p_order_type TEXT,
  p_items JSONB,
  p_tax_amount NUMERIC,
  p_discount_amount NUMERIC,
  p_notes TEXT,
  p_payment_method TEXT,
  p_payment_amount NUMERIC,
  p_reference_number TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_number TEXT;
  v_subtotal NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_change_amount NUMERIC := 0;
  v_order_id UUID;
  v_payment_id UUID;
  v_item JSONB;
  v_item_id UUID;
  v_prod_name TEXT;
  v_prod_stock INT;
  v_item_qty INT;
  v_item_price NUMERIC;
  v_item_subtotal NUMERIC;
  v_item_notes TEXT;
  v_menu_item_id UUID;
  v_inserted_items JSONB := '[]'::jsonb;
  v_result JSONB;
BEGIN
  -- Generate Order Number (ORD-YYMMDDHHMISS-XXXX)
  v_order_number := 'ORD-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substring(md5(random()::text) from 1 for 4));

  -- Calculate subtotal from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_qty := (v_item->>'quantity')::INT;
    v_item_price := (v_item->>'unit_price')::NUMERIC;
    v_subtotal := v_subtotal + (v_item_qty * v_item_price);
  END LOOP;

  v_total_amount := greatest(0, v_subtotal + COALESCE(p_tax_amount, 0) - COALESCE(p_discount_amount, 0));
  v_change_amount := greatest(0, COALESCE(p_payment_amount, 0) - v_total_amount);

  -- Insert Order Header
  INSERT INTO orders (
    order_number, customer_name, order_type, status,
    subtotal, tax_amount, discount_amount, total_amount, notes, created_at
  ) VALUES (
    v_order_number, COALESCE(NULLIF(p_customer_name, ''), 'Pelanggan Umum'), COALESCE(NULLIF(p_order_type, ''), 'retail'), 'completed',
    v_subtotal, COALESCE(p_tax_amount, 0), COALESCE(p_discount_amount, 0), v_total_amount, COALESCE(p_notes, ''), now()
  ) RETURNING id INTO v_order_id;

  -- Process each Item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::UUID;
    v_item_qty := (v_item->>'quantity')::INT;
    v_item_price := (v_item->>'unit_price')::NUMERIC;
    v_item_subtotal := v_item_qty * v_item_price;
    v_item_notes := COALESCE(v_item->>'notes', '');

    -- Get Product Name & Stock
    SELECT name, stock INTO v_prod_name, v_prod_stock FROM menu_items WHERE id = v_menu_item_id;

    -- Insert Order Item Line
    INSERT INTO order_items (
      order_id, menu_item_id, product_name, quantity, unit_price, subtotal, notes
    ) VALUES (
      v_order_id, v_menu_item_id, COALESCE(v_prod_name, 'Produk'), v_item_qty, v_item_price, v_item_subtotal, v_item_notes
    ) RETURNING id INTO v_item_id;

    v_inserted_items := v_inserted_items || jsonb_build_object(
      'id', v_item_id,
      'order_id', v_order_id,
      'menu_item_id', v_menu_item_id,
      'product_name', v_prod_name,
      'quantity', v_item_qty,
      'unit_price', v_item_price,
      'subtotal', v_item_subtotal,
      'notes', v_item_notes
    );

    -- Deduct product stock
    UPDATE menu_items
    SET stock = greatest(0, stock - v_item_qty)
    WHERE id = v_menu_item_id;

    -- Record stock movement
    INSERT INTO stock_movements (
      product_id, product_name, delta, reason, order_id, created_at
    ) VALUES (
      v_menu_item_id, COALESCE(v_prod_name, 'Produk'), -v_item_qty, 'sale', v_order_id, now()
    );
  END LOOP;

  -- Insert Payment Record
  INSERT INTO payments (
    order_id, method, amount, change_amount, reference_number, created_at
  ) VALUES (
    v_order_id, p_payment_method, COALESCE(p_payment_amount, 0), v_change_amount, COALESCE(p_reference_number, ''), now()
  ) RETURNING id INTO v_payment_id;

  -- Return Result JSON
  v_result := jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'customer_name', COALESCE(NULLIF(p_customer_name, ''), 'Pelanggan Umum'),
    'order_type', COALESCE(NULLIF(p_order_type, ''), 'retail'),
    'status', 'completed',
    'subtotal', v_subtotal,
    'tax_amount', COALESCE(p_tax_amount, 0),
    'discount_amount', COALESCE(p_discount_amount, 0),
    'total_amount', v_total_amount,
    'notes', COALESCE(p_notes, ''),
    'created_at', now(),
    'items', v_inserted_items,
    'payment', jsonb_build_object(
      'id', v_payment_id,
      'order_id', v_order_id,
      'method', p_payment_method,
      'amount', COALESCE(p_payment_amount, 0),
      'change_amount', v_change_amount,
      'reference_number', COALESCE(p_reference_number, ''),
      'created_at', now()
    )
  );

  RETURN v_result;
END;
$$;

-- 4.2. VOID ORDER (Atomic Transaction Cancellation)
CREATE OR REPLACE FUNCTION void_order(
  p_order_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_status TEXT;
  v_item RECORD;
  v_prod_name TEXT;
BEGIN
  -- Check order status
  SELECT status INTO v_order_status FROM orders WHERE id = p_order_id;
  IF v_order_status IS NULL OR v_order_status = 'cancelled' THEN
    RETURN;
  END IF;

  -- Mark order as cancelled
  UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;

  -- Restore stock and record return movement for each item
  FOR v_item IN SELECT menu_item_id, quantity FROM order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.menu_item_id IS NOT NULL THEN
      SELECT name INTO v_prod_name FROM menu_items WHERE id = v_item.menu_item_id;

      -- Restore inventory stock
      UPDATE menu_items
      SET stock = stock + v_item.quantity
      WHERE id = v_item.menu_item_id;

      -- Record stock movement
      INSERT INTO stock_movements (
        product_id, product_name, delta, reason, order_id, created_at
      ) VALUES (
        v_item.menu_item_id, COALESCE(v_prod_name, 'Produk'), v_item.quantity, 'return', p_order_id, now()
      );
    END IF;
  END LOOP;
END;
$$;

-- 4.3. ADJUST STOCK (Atomic Inventory Adjustment)
CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_delta INT,
  p_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prod_name TEXT;
BEGIN
  SELECT name INTO v_prod_name FROM menu_items WHERE id = p_product_id;
  IF v_prod_name IS NULL THEN
    RETURN;
  END IF;

  UPDATE menu_items
  SET stock = greatest(0, stock + p_delta)
  WHERE id = p_product_id;

  INSERT INTO stock_movements (
    product_id, product_name, delta, reason, created_at
  ) VALUES (
    p_product_id, v_prod_name, p_delta, p_reason, now()
  );
END;
$$;
