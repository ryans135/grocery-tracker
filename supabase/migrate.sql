-- =============================================================
-- Pantry redesign migration
-- Run this in the Supabase dashboard SQL editor (uses service_role,
-- bypasses RLS). Reversible block at the bottom if you need to roll back.
-- =============================================================

-- 1) New columns on items: added / modified / archived.
--    Keeps existing updated_at column for backward compatibility.
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS added timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false NOT NULL;

-- 2) Backfill timestamps from updated_at for existing rows.
UPDATE items
SET added = COALESCE(added, updated_at, now()),
    modified = COALESCE(modified, updated_at, now())
WHERE added IS NULL OR modified IS NULL;

-- 3) Consolidate categories on items (17 → 10).
UPDATE items SET category = CASE category
  WHEN 'Dairy'              THEN 'Dairy & Eggs'
  WHEN 'Meat & Poultry'     THEN 'Meat & Seafood'
  WHEN 'Eggs'               THEN 'Dairy & Eggs'
  WHEN 'Vegetables'         THEN 'Fresh Produce'
  WHEN 'Fruits'             THEN 'Fresh Produce'
  WHEN 'Snacks'             THEN 'Snacks & Drinks'
  WHEN 'Beverages'          THEN 'Snacks & Drinks'
  WHEN 'Condiments'         THEN 'Pantry'
  WHEN 'Grains & Pasta'     THEN 'Pantry'
  WHEN 'Bread & Bakery'     THEN 'Bakery'
  WHEN 'Canned Goods'       THEN 'Pantry'
  WHEN 'Vitamins & Medicine' THEN 'Health & Beauty'
  WHEN 'Cleaning'           THEN 'Household'
  WHEN 'Self Care'          THEN 'Health & Beauty'
  WHEN 'Make Up'            THEN 'Health & Beauty'
  WHEN 'Others'             THEN 'Other'
  ELSE category
END;

-- 4) Same consolidation on shopping_list.
UPDATE shopping_list SET category = CASE category
  WHEN 'Dairy'              THEN 'Dairy & Eggs'
  WHEN 'Meat & Poultry'     THEN 'Meat & Seafood'
  WHEN 'Eggs'               THEN 'Dairy & Eggs'
  WHEN 'Vegetables'         THEN 'Fresh Produce'
  WHEN 'Fruits'             THEN 'Fresh Produce'
  WHEN 'Snacks'             THEN 'Snacks & Drinks'
  WHEN 'Beverages'          THEN 'Snacks & Drinks'
  WHEN 'Condiments'         THEN 'Pantry'
  WHEN 'Grains & Pasta'     THEN 'Pantry'
  WHEN 'Bread & Bakery'     THEN 'Bakery'
  WHEN 'Canned Goods'       THEN 'Pantry'
  WHEN 'Vitamins & Medicine' THEN 'Health & Beauty'
  WHEN 'Cleaning'           THEN 'Household'
  WHEN 'Self Care'          THEN 'Health & Beauty'
  WHEN 'Make Up'            THEN 'Health & Beauty'
  WHEN 'Others'             THEN 'Other'
  ELSE category
END;

-- 5) Sanity check — list categories now in use across both tables.
--    Anything not in the new set means a stray value to investigate.
SELECT 'items' AS source, category, COUNT(*) FROM items GROUP BY category
UNION ALL
SELECT 'shopping_list', category, COUNT(*) FROM shopping_list GROUP BY category
ORDER BY source, category;


-- =============================================================
-- ROLLBACK (only run if you need to undo):
-- ALTER TABLE items DROP COLUMN IF EXISTS added;
-- ALTER TABLE items DROP COLUMN IF EXISTS modified;
-- ALTER TABLE items DROP COLUMN IF EXISTS archived;
-- (Category remapping is one-way without a snapshot — keep a CSV
--  export before running step 3/4 if you're worried.)
-- =============================================================
