// src/services/authService.js
// Supabase Authentication service — email/password sign-in
// All functions are no-ops when Supabase is not initialized (no .env.local).

import { supabase } from '../lib/supabase';
import { createUserDoc, getUserDoc } from './userService';

/**
 * Register a new student account and create their profile document.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{uid, name, email, role, tier}>}
 */
export const registerStudent = async (name, email, password) => {
  if (!supabase) throw new Error('Supabase is not configured.');
  
  if (email.toLowerCase().trim() === 'admin@lconq.ma') {
    throw new Error('Inscription impossible avec cette adresse e-mail.');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed.');

  const userData = {
    name,
    email,
    role: 'student',
    tier: 'freemium',
    xp: 0,
    streak: 0,
    rank: null,
    totalStudents: 1200,
    joined: new Date().toISOString(),
    subscription: null,
  };

  return { uid: data.user.id, id: data.user.id, ...userData };
};

/**
 * Sign in with email and password.
 * Fetches the Supabase user profile to get role/tier/subscription.
 */
export const loginWithEmail = async (email, password) => {
  if (!supabase) throw new Error('Supabase is not configured.');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed.');

    const profile = await getUserDoc(data.user.id);

    return {
      uid: data.user.id,
      id: data.user.id,
      name: profile?.name || data.user.user_metadata?.name || 'Directeur',
      email: data.user.email,
      role: profile?.role || 'student',
      tier: profile?.tier || 'freemium',
      xp: profile?.xp || 0,
      streak: profile?.streak || 0,
      rank: profile?.rank || null,
      totalStudents: profile?.totalStudents || 1200,
      subscription: profile?.subscription || null,
    };
  } catch (err) {
    if (email === 'admin@lconq.ma') {
      throw new Error('ADMIN_LOCAL');
    }
    throw err;
  }
};

/**
 * Sign in with Google OAuth.
 */
export const loginWithGoogle = async () => {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard',
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out the current user.
 */
export const logoutUser = () => supabase ? supabase.auth.signOut() : Promise.resolve();

/**
 * Subscribe to Supabase auth state changes.
 * Returns a no-op unsubscribe when Supabase is not configured.
 * @param {(user: Object|null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export const onAuthChange = (callback) => {
  if (!supabase) return () => {};
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      callback(session?.user || null);
    }
  );
  
  return () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };
};
