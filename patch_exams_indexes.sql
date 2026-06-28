-- SQL Patch: Optimize Exams Queries
-- Run this in Supabase SQL Editor

-- 1. Index on is_active to speed up active exam filtering
CREATE INDEX IF NOT EXISTS idx_exams_is_active ON public.exams(is_active);

-- 2. Index on is_archived to speed up non-archived filtering
CREATE INDEX IF NOT EXISTS idx_exams_is_archived ON public.exams(is_archived);

-- 3. Composite index for listing active, non-archived exams sorted by date
CREATE INDEX IF NOT EXISTS idx_exams_active_archived_date ON public.exams(is_active, is_archived, date_added DESC);

-- 4. Index on date_added for admin sorting
CREATE INDEX IF NOT EXISTS idx_exams_date_added ON public.exams(date_added DESC);
