-- =============================================================
-- Enable realtime streaming on the three app tables.
-- Run in Supabase SQL editor. Safe to re-run — "already a member"
-- errors are harmless (they just mean it was already enabled).
-- =============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
ALTER PUBLICATION supabase_realtime ADD TABLE logs;

-- Verify: should list items, logs, shopping_list (and possibly other tables
-- you have in this database).
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
