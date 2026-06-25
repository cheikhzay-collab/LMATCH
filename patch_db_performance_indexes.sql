-- Run this query in the Supabase Dashboard > SQL Editor
-- This creates three critical performance indexes to optimize:
-- 1. National leaderboard sorting by XP
-- 2. SRS due card retrieval (next review date checks)
-- 3. Mock exam history loading by user and date

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_next_review ON public.progress(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_mock_history_user_date ON public.mock_history(user_id, date DESC);
