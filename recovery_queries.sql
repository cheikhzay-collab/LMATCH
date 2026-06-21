-- ══════════════════════════════════════════════════════════════════
-- L'CONQ — Recovery queries for exams with lost questions
-- Run in: Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. Show all exams with EMPTY or NULL questions ──────────────
-- These are the exams affected by the bug (questions overwritten with [])
SELECT
  id,
  name,
  school,
  year,
  tier,
  updated_at,
  jsonb_array_length(COALESCE(questions, '[]'::jsonb)) AS questions_count
FROM public.exams
WHERE
  questions IS NULL
  OR jsonb_array_length(questions) = 0
ORDER BY updated_at DESC;

-- ─── 2. Show ALL exams with their question count ─────────────────
-- To get a full picture of what's intact vs affected
SELECT
  id,
  name,
  school,
  year,
  tier,
  updated_at,
  jsonb_array_length(COALESCE(questions, '[]'::jsonb)) AS questions_count
FROM public.exams
ORDER BY updated_at DESC;

-- ─── 3. POINT-IN-TIME RECOVERY CHECK ────────────────────────────
-- Only available on Supabase Pro plan.
-- Go to: Dashboard > Settings > Backups > Point in Time Recovery
-- If available, restore to a timestamp BEFORE the accidental save.

-- ─── 4. If you have a CSV backup, re-import via the app ──────────
-- Use Admin > Import CSV feature (AdminAIImport page) to re-add
-- questions to the affected exams.
-- The CSV import uses "merge" or "replace" mode.

-- ─── 5. Emergency: manually restore questions from a known backup ─
-- Replace 'EXAM_ID_HERE' and the JSON array with your actual data
-- UPDATE public.exams
-- SET questions = '[{"id":"q1","question":"...","options":[...],"correct_answer":"A"}]'::jsonb,
--     updated_at = now()
-- WHERE id = 'EXAM_ID_HERE';
