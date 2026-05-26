// src/services/authService.js
// Firebase Authentication service — email/password sign-in
// All functions are no-ops when Firebase is not initialized (no .env.local).

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDoc, getUserDoc } from './userService';

/**
 * Register a new student account and create their Firestore document.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{uid, name, email, role, tier}>}
 */
export const registerStudent = async (name, email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

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

  await createUserDoc(credential.user.uid, userData);
  return { uid: credential.user.uid, ...userData };
};

/**
 * Sign in with email and password.
 * Fetches the Firestore user document to get role/tier/subscription.
 * Falls back to admin check for the hardcoded admin email.
 */
export const loginWithEmail = async (email, password) => {
  // Hardcoded admin account (no Firebase Auth — direct Firestore check)
  if (email === 'admin@lconq.ma') {
    // Admin doesn't go through Firebase Auth to avoid exposing secrets in code.
    // In production, create this account in Firebase Auth console.
    throw new Error('ADMIN_LOCAL'); // handled by AuthContext legacy fallback
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firestoreUser = await getUserDoc(credential.user.uid);

  return {
    uid: credential.user.uid,
    name: firestoreUser?.name || credential.user.displayName || 'Élève',
    email: credential.user.email,
    role: firestoreUser?.role || 'student',
    tier: firestoreUser?.tier || 'freemium',
    xp: firestoreUser?.xp || 0,
    streak: firestoreUser?.streak || 0,
    rank: firestoreUser?.rank || null,
    totalStudents: firestoreUser?.totalStudents || 1200,
    subscription: firestoreUser?.subscription || null,
  };
};

/**
 * Sign out the current user.
 */
export const logoutUser = () => auth ? signOut(auth) : Promise.resolve();

/**
 * Subscribe to Firebase auth state changes.
 * Returns a no-op unsubscribe when Firebase is not configured.
 * @param {(user: import('firebase/auth').User|null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export const onAuthChange = (callback) => {
  if (!auth) return () => {}; // no-op unsubscribe when Firebase not configured
  return onAuthStateChanged(auth, callback);
};
