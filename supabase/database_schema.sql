-- FamilyPantry Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLEANUP (For re-running script)
-- ============================================
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS product_barcodes CASCADE;
DROP TABLE IF EXISTS purchase_history CASCADE;
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS families CASCADE;

DROP FUNCTION IF EXISTS get_auth_family_id();
DROP FUNCTION IF EXISTS update_max_quantity();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- TABLES
-- ============================================

-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  max_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price DECIMAL(10, 2),
  store_name TEXT,
  expiration_date DATE,
  category TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list items
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'units',
  preferred_store TEXT,
  sort_order INTEGER,
  is_checked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase history
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  barcode TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2),
  store_name TEXT,
  purchased_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product barcodes (local cache)
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  size TEXT,
  category TEXT,
  image_url TEXT,
  last_price DECIMAL(10, 2),
  usual_store TEXT,
  times_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, barcode)
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notification_low_stock BOOLEAN DEFAULT TRUE,
  notification_expiring_soon BOOLEAN DEFAULT TRUE,
  notification_time TIME DEFAULT '09:00:00',
  low_stock_threshold DECIMAL(3, 2) DEFAULT 0.20,
  expiration_warning_days INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_inventory_family ON inventory_items(family_id);
CREATE INDEX idx_inventory_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_shopping_list_family ON shopping_list_items(family_id);
CREATE INDEX idx_shopping_list_sort ON shopping_list_items(family_id, sort_order);
CREATE INDEX idx_purchase_history_family ON purchase_history(family_id);
CREATE INDEX idx_product_barcodes_lookup ON product_barcodes(family_id, barcode);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for all tables
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_updated_at BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_barcodes_updated_at BEFORE UPDATE ON product_barcodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-update max_quantity when quantity increases
CREATE OR REPLACE FUNCTION update_max_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity > NEW.max_quantity THEN
    NEW.max_quantity = NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_max_quantity_trigger
BEFORE INSERT OR UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_max_quantity();

-- Function: Get current user's family_id (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION get_auth_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM users WHERE id = auth.uid();
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their family's data

-- Families
CREATE POLICY "Users can view their own family"
ON families FOR SELECT
USING (id = get_auth_family_id());

CREATE POLICY "Users can update their own family"
ON families FOR UPDATE
USING (id = get_auth_family_id());

-- Users
CREATE POLICY "Users can view their family members"
ON users FOR SELECT
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Inventory
CREATE POLICY "Users can view their family's inventory"
ON inventory_items FOR SELECT
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can insert to their family's inventory"
ON inventory_items FOR INSERT
WITH CHECK (family_id = get_auth_family_id());

CREATE POLICY "Users can update their family's inventory"
ON inventory_items FOR UPDATE
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can delete from their family's inventory"
ON inventory_items FOR DELETE
USING (family_id = get_auth_family_id());

-- Shopping List
CREATE POLICY "Users can view their family's shopping list"
ON shopping_list_items FOR SELECT
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can insert to their family's shopping list"
ON shopping_list_items FOR INSERT
WITH CHECK (family_id = get_auth_family_id());

CREATE POLICY "Users can update their family's shopping list"
ON shopping_list_items FOR UPDATE
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can delete from their family's shopping list"
ON shopping_list_items FOR DELETE
USING (family_id = get_auth_family_id());

-- Purchase History
CREATE POLICY "Users can view their family's purchase history"
ON purchase_history FOR SELECT
USING (family_id = get_auth_family_id());

CREATE POLICY "Users can insert to their family's purchase history"
ON purchase_history FOR INSERT
WITH CHECK (family_id = get_auth_family_id());

-- Product Barcodes
CREATE POLICY "Users can view their family's product barcodes"
ON product_barcodes FOR SELECT
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert product barcodes"
ON product_barcodes FOR INSERT
WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update product barcodes"
ON product_barcodes FOR UPDATE
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- User Preferences
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Note: Run this AFTER creating your first user via Supabase Auth
-- Replace 'YOUR_USER_ID' with actual auth.users id

/*
-- Create a test family
INSERT INTO families (name) VALUES ('Test Family') RETURNING id;

-- Link user to family (replace UUIDs with actual values)
INSERT INTO users (id, family_id, name, role)
VALUES ('YOUR_USER_ID', 'FAMILY_ID_FROM_ABOVE', 'Test User', 'admin');

-- Add sample inventory items
INSERT INTO inventory_items (family_id, name, quantity, unit, max_quantity, price, store_name, category)
VALUES 
  ('FAMILY_ID', 'Milk 2%', 2, 'L', 4, 3.49, 'Costco', 'Dairy'),
  ('FAMILY_ID', 'Eggs', 12, 'units', 24, 4.99, 'Walmart', 'Dairy'),
  ('FAMILY_ID', 'Bread', 1, 'loaf', 2, 2.99, 'Bakery', 'Bakery');

-- Add sample shopping list items
INSERT INTO shopping_list_items (family_id, name, quantity, unit, preferred_store, added_by)
VALUES
  ('FAMILY_ID', 'Paper Towels', 1, 'pack', 'Costco', 'YOUR_USER_ID'),
  ('FAMILY_ID', 'Bananas', 6, 'units', 'Walmart', 'YOUR_USER_ID');
*/