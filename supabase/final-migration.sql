-- DAY ONE: preserve habit history and prevent deleted habits from reappearing
-- Run this once in Supabase SQL Editor before using the updated cloud sync.

alter table public.habits
  add column if not exists deleted_at timestamptz;

-- Existing rows remain active because deleted_at defaults to NULL.
-- The app now marks deleted habits with deleted_at instead of physically
-- deleting them, so completion history remains attached to the habit.

