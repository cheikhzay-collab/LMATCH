// src/services/userService.js
// Supabase CRUD for user profiles, progress, mock exam history, and activity
// All functions gracefully return null/empty when supabase is null (no Supabase configured).

import { supabase } from '../lib/supabase';

// Helper to map camelCase fields to snake_case DB columns
const mapProfileToDB = (profile) => ({
  name: profile.name,
  email: profile.email,
  role: profile.role,
  tier: profile.tier,
  xp: profile.xp,
  streak: profile.streak,
  rank: profile.rank,
  total_students: profile.totalStudents,
  joined: profile.joined,
  subscription: profile.subscription,
  phone: profile.phone,
  city: profile.city,
});

// Helper to map snake_case DB columns to camelCase fields
const mapDBToProfile = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    uid: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    tier: row.tier,
    xp: row.xp,
    streak: row.streak,
    rank: row.rank,
    totalStudents: row.total_students,
    joined: row.joined,
    subscription: row.subscription,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    phone: row.phone,
    city: row.city,
  };
};

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create a new user profile in Supabase (called after registration).
 */
export const createUserDoc = async (uid, userData) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: uid,
      ...mapProfileToDB(userData),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] Failed to create or upsert user profile:', error);
    throw error;
  }
};

/**
 * Fetch a user profile by UID.
 * @returns {Promise<Object|null>}
 */
export const getUserDoc = async (uid) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (error) {
    console.error('[Supabase] Failed to fetch user profile:', error);
    return null;
  }
  return mapDBToProfile(data);
};

/**
 * Update specific fields in a user profile.
 */
export const updateUserDoc = async (uid, updates) => {
  if (!supabase) return;
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
  if (updates.totalStudents !== undefined) dbUpdates.total_students = updates.totalStudents;
  if (updates.subscription !== undefined) dbUpdates.subscription = updates.subscription;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', uid);
  if (error) {
    console.error('[Supabase] Failed to update user profile:', error);
    throw error;
  }
};

/**
 * Activate or update a subscription on a user profile.
 */
export const setUserSubscription = async (uid, subscription, tier = 'premium') => {
  if (!supabase) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      tier,
      subscription,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uid);
  if (error) {
    console.error('[Supabase] Failed to set subscription:', error);
    throw error;
  }
};

// ─── Study Progress (SRS cards) ───────────────────────────────────────────────

/**
 * Save/update a single question's SRS progress for a user.
 */
export const saveQuestionProgress = async (uid, questionId, progressData) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id: uid,
      question_id: questionId,
      difficulty: progressData.difficulty,
      stability: progressData.stability,
      repetitions: progressData.repetitions,
      ease_factor: progressData.easeFactor,
      last_review_date: progressData.lastReviewDate,
      next_review_date: progressData.nextReviewDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_id' });
  if (error) {
    console.error('[Supabase] Failed to save progress:', error);
    throw error;
  }
};

/**
 * Fetch all progress cards for a user.
 * @returns {Promise<Record<string, Object>>} — { questionId: progressData }
 */
export const getAllProgress = async (uid) => {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', uid);
  if (error) {
    console.error('[Supabase] Failed to fetch all progress:', error);
    return {};
  }
  const result = {};
  data.forEach((row) => {
    result[row.question_id] = {
      difficulty: row.difficulty,
      stability: row.stability,
      repetitions: row.repetitions,
      easeFactor: row.ease_factor,
      lastReviewDate: row.last_review_date,
      nextReviewDate: row.next_review_date,
    };
  });
  return result;
};

// ─── Mock Exam History ────────────────────────────────────────────────────────

/**
 * Save a mock exam result.
 */
export const saveMockResult = async (uid, result) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('mock_history')
    .insert({
      user_id: uid,
      exam_id: result.examId,
      exam_name: result.examName,
      school: result.school,
      score: result.score,
      max_score: result.maxScore,
      pct: result.pct,
      correct_count: result.correctCount,
      wrong_count: result.wrongCount,
      empty_count: result.emptyCount,
      mode: result.mode,
      date: result.date || new Date().toISOString(),
    });
  if (error) {
    console.error('[Supabase] Failed to save mock result:', error);
    throw error;
  }
};

/**
 * Fetch all mock exam history for a user, sorted by date descending.
 * @returns {Promise<Array>}
 */
export const getMockHistory = async (uid) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('mock_history')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: false });
  if (error) {
    console.error('[Supabase] Failed to fetch mock history:', error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    examId: row.exam_id,
    examName: row.exam_name,
    school: row.school,
    score: row.score,
    maxScore: row.max_score,
    pct: row.pct,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    emptyCount: row.empty_count,
    mode: row.mode,
    date: row.date,
  }));
};

// ─── Daily Activity ───────────────────────────────────────────────────────────

/**
 * Increment the daily activity counter for today.
 */
export const incrementDailyActivity = async (uid) => {
  if (!supabase) return;
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's record to check if it exists
  const { data, error } = await supabase
    .from('activity')
    .select('count')
    .eq('user_id', uid)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to fetch daily activity:', error);
    return;
  }

  const count = data ? (data.count || 0) + 1 : 1;

  const { error: upsertError } = await supabase
    .from('activity')
    .upsert({
      user_id: uid,
      date: today,
      count,
    }, { onConflict: 'user_id,date' });

  if (upsertError) {
    console.error('[Supabase] Failed to increment daily activity:', upsertError);
    throw upsertError;
  }
};

/**
 * Fetch the last N days of activity.
 * @returns {Promise<Record<string, number>>} — { 'YYYY-MM-DD': count }
 */
export const getRecentActivity = async (uid, days = 90) => {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .eq('user_id', uid);
  if (error) {
    console.error('[Supabase] Failed to fetch recent activity:', error);
    return {};
  }
  const result = {};
  data.forEach((row) => {
    result[row.date] = row.count || 0;
  });
  return result;
};

/**
 * Delete a user by UID (Admin only).
 */
export const deleteUser = async (uid) => {
  if (!supabase) return false;
  const { error } = await supabase.rpc('delete_user', { uid });
  if (error) {
    console.error('[Supabase] Failed to delete user:', error);
    return false;
  }
  return true;
};

/**
 * Fetch all registered users from database (Admin only).
 * Uses the get_all_profiles() SECURITY DEFINER RPC to bypass RLS.
 * @returns {Promise<Array>}
 */
export const getAllUsers = async () => {

  if (!supabase) return [];

  // Try RPC first (bypasses RLS — for admin dashboard)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_profiles');
    if (!rpcError && rpcData) {
      return rpcData.map(mapDBToProfile);
    }
  } catch (rpcErr) {
    console.warn('[Supabase] RPC get_all_profiles failed, falling back to direct query:', rpcErr.message);
  }

  // Fallback: direct query (works if authenticated with proper RLS policy)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('joined', { ascending: false });
  if (error) {
    console.error('[Supabase] Failed to fetch all users:', error);
    return [];
  }
  return data.map(mapDBToProfile);
};

/**
 * Fetch the public leaderboard of top 100 students from Supabase.
 * @returns {Promise<Array>}
 */
export const getLeaderboard = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('get_leaderboard');
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[Supabase] RPC get_leaderboard failed, falling back to direct profiles query:', err.message);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('name, xp, streak, tier')
    .order('xp', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Supabase] Failed to fetch leaderboard:', error);
    return [];
  }
  return data;
};

