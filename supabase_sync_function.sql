-- SQL Migration: sync_auth_users_to_profiles RPC
-- Run this in Supabase SQL Editor or automatically via MCP
-- Bypasses RLS to safely populate missing profiles for registered auth users.

CREATE OR REPLACE FUNCTION public.sync_auth_users_to_profiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  -- Verify if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  -- Insert missing profiles for all users in auth.users
  INSERT INTO public.profiles (id, name, email, role, tier, xp, streak, total_students, joined)
  SELECT 
    u.id, 
    COALESCE(
      u.raw_user_meta_data->>'name', 
      u.raw_user_meta_data->>'full_name', 
      split_part(u.email, '@', 1), 
      'Élève'
    ), 
    u.email, 
    'student', 
    'freemium', 
    0, 0, 1200, 
    COALESCE(u.created_at, now())
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'synchronized_count', inserted_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_auth_users_to_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_auth_users_to_profiles() TO authenticated;
