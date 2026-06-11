-- SQL Schema for L'Conq Supabase — v2 (Secure)
-- Last updated: 2026-05-31
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ⚠️  This is idempotent — safe to re-run.

-- ─── 1. Profiles Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  email text,
  phone text,
  city text,
  role text DEFAULT 'student',
  tier text DEFAULT 'freemium',
  xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  rank integer,
  total_students integer DEFAULT 1200,
  joined timestamp with time zone DEFAULT timezone('utc'::text, now()),
  subscription jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Migration to ensure columns exist on existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  );
END;
$$;

-- Profiles policies (secure, no deprecated auth.role())
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles." ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can do everything on profiles."
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, tier, xp, streak, total_students, joined)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Élève'),
    new.email,
    'student',
    'freemium',
    0, 0, 1200,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Protect role/tier from self-elevation
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF (old.role IS DISTINCT FROM new.role OR old.tier IS DISTINCT FROM new.tier) THEN
    IF NOT public.is_admin() THEN
      new.role := old.role;
      new.tier := old.tier;
    END IF;
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER check_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_profile_update();

-- ─── 2. Config Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read configs." ON public.config;
DROP POLICY IF EXISTS "Admins can write configs." ON public.config;

CREATE POLICY "Anyone can read configs." ON public.config
  FOR SELECT USING (true);

CREATE POLICY "Admins can write configs." ON public.config
  FOR ALL USING (public.is_admin());

-- ─── 3. Exams Table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exams (
  id text PRIMARY KEY,
  name text NOT NULL,
  school text,
  year text,
  tier text,
  questions jsonb,
  pdf_url text,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  date_added timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active and non-archived exams." ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams." ON public.exams;

CREATE POLICY "Anyone can view active and non-archived exams." ON public.exams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage exams." ON public.exams
  FOR ALL USING (public.is_admin());

-- ─── 4. Activation Codes Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activation_codes (
  code text PRIMARY KEY,
  plan_id text,
  is_used boolean DEFAULT false,
  used_by text,
  used_at timestamp with time zone,
  batch_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Authenticated users can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Admins can manage activation codes." ON public.activation_codes;

CREATE POLICY "Authenticated users can select activation codes"
  ON public.activation_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update activation codes"
  ON public.activation_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage activation codes." ON public.activation_codes
  FOR ALL USING (public.is_admin());

-- ─── 5. Progress Table (SRS/FSRS cards) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progress (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  difficulty double precision,
  stability double precision,
  repetitions integer,
  ease_factor double precision,
  last_review_date timestamp with time zone,
  next_review_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own progress." ON public.progress;

CREATE POLICY "Users can manage their own progress." ON public.progress
  FOR ALL USING (auth.uid() = user_id);

-- ─── 6. Mock History Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mock_history (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exam_id text NOT NULL,
  exam_name text,
  school text,
  score integer,
  max_score integer,
  pct double precision,
  correct_count integer,
  wrong_count integer,
  empty_count integer,
  mode text,
  date timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mock_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own mock history." ON public.mock_history;

CREATE POLICY "Users can manage their own mock history." ON public.mock_history
  FOR ALL USING (auth.uid() = user_id);

-- ─── 7. Activity Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer DEFAULT 1,
  UNIQUE(user_id, date)
);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own activity." ON public.activity;

CREATE POLICY "Users can manage their own activity." ON public.activity
  FOR ALL USING (auth.uid() = user_id);

-- ─── 8. Admin RPCs ────────────────────────────────────────────────────────────

-- Get all user profiles (admin only — enforced at DB level)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY joined DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_all_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;

-- Delete a user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  IF uid = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;

-- Get public leaderboard (name, xp, streak, tier) of top 100 students
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  name text,
  xp integer,
  streak integer,
  tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.name, profiles.xp, profiles.streak, profiles.tier
  FROM public.profiles
  ORDER BY profiles.xp DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

