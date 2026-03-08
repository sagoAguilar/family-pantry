-- MVP Anonymous Access Migration
-- Run this in the Supabase SQL Editor.
-- Creates a shared "anonymous" family and opens RLS so the anon key
-- can read/write without requiring a logged-in user.

-- ============================================================
-- 1. Insert the shared anonymous family (idempotent)
-- ============================================================
INSERT INTO families (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Anonymous Family')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. inventory_items — drop old auth-based policies, add anon policy
-- ============================================================
DROP POLICY IF EXISTS "Users can view their family inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert items to their family inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update their family inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete their family inventory items" ON inventory_items;

CREATE POLICY "anon_all_inventory" ON inventory_items
  FOR ALL
  TO anon, authenticated
  USING (family_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (family_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ============================================================
-- 3. shopping_list_items — drop old policies, add anon policy
-- ============================================================
DROP POLICY IF EXISTS "Users can view their family shopping list" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can insert items to their family shopping list" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can update their family shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can delete their family shopping list items" ON shopping_list_items;

CREATE POLICY "anon_all_shopping_list" ON shopping_list_items
  FOR ALL
  TO anon, authenticated
  USING (family_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (family_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ============================================================
-- 4. product_barcodes — drop old policies, add anon policy
-- ============================================================
DROP POLICY IF EXISTS "Users can view their family product barcodes" ON product_barcodes;
DROP POLICY IF EXISTS "Users can insert product barcodes for their family" ON product_barcodes;
DROP POLICY IF EXISTS "Users can update their family product barcodes" ON product_barcodes;
DROP POLICY IF EXISTS "Users can delete their family product barcodes" ON product_barcodes;

CREATE POLICY "anon_all_product_barcodes" ON product_barcodes
  FOR ALL
  TO anon, authenticated
  USING (family_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (family_id = '00000000-0000-0000-0000-000000000001'::uuid);
