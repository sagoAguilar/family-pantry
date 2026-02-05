-- ============================================================================
-- SEED DATA SCRIPT
-- ============================================================================
-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Copy the "User UID" for your user.
-- 3. Replace 'YOUR_USER_ID_HERE' below with that UUID.
-- 4. Run this entire script in the Supabase SQL Editor.
-- ============================================================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

WITH user_input AS (
    -- REPLACE THE UUID BELOW WITH YOUR ACTUAL USER ID
    SELECT 'YOUR_USER_ID_HERE'::uuid AS user_id
),
new_family AS (
    INSERT INTO families (name) 
    VALUES ('My Settings Family') 
    RETURNING id
),
new_user AS (
    INSERT INTO users (id, family_id, name, role)
    SELECT 
        (SELECT user_id FROM user_input),
        (SELECT id FROM new_family),
        'Admin User',
        'admin'
    RETURNING id, family_id
),
inventory AS (
    INSERT INTO inventory_items (family_id, name, quantity, unit, max_quantity, price, store_name, category)
    SELECT 
        (SELECT family_id FROM new_user),
        name, quantity, unit, max_quantity, price, store_name, category
    FROM (VALUES 
        ('Milk 2%', 2.0, 'L', 4.0, 3.49, 'Costco', 'Dairy'),
        ('Eggs', 12.0, 'units', 24.0, 4.99, 'Walmart', 'Dairy'),
        ('Bread', 1.0, 'loaf', 2.0, 2.99, 'Bakery', 'Bakery')
    ) AS t(name, quantity, unit, max_quantity, price, store_name, category)
    RETURNING id
)
INSERT INTO shopping_list_items (family_id, name, quantity, unit, preferred_store, added_by)
SELECT 
    (SELECT family_id FROM new_user),
    name, quantity, unit, preferred_store, 
    (SELECT id FROM new_user)
FROM (VALUES 
    ('Paper Towels', 1.0, 'pack', 'Costco'),
    ('Bananas', 6.0, 'units', 'Walmart')
) AS t(name, quantity, unit, preferred_store)
RETURNING id;
