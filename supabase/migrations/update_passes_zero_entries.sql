-- ### Block 3 (Description & Config)
-- Database constraint modification altering the passes table to allow passes to be initialized with 0 entries for unpaid draft memberships.

-- Configuration Options:
-- - passes_total_entries_check: updated from > 0 to >= 0

alter table public.passes drop constraint if exists passes_total_entries_check;

alter table public.passes add constraint passes_total_entries_check check (total_entries >= 0);