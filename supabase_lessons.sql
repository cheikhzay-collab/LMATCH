-- SQL Migration: Add Lessons Table for L'Conq
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.lessons (
  id text PRIMARY KEY,
  title text NOT NULL,
  subject text NOT NULL,
  chapter_number text,
  teacher text,
  phone text,
  schools text[],
  content jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to make script idempotent)
DROP POLICY IF EXISTS "Anyone can view active lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;

-- Create policies
CREATE POLICY "Anyone can view active lessons" ON public.lessons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL USING (public.is_admin());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON public.lessons(is_active);
