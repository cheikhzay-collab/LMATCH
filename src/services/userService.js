// src/services/userService.js
// Firestore CRUD for user profiles, progress, mock exam history
// All functions gracefully return null/empty when db is null (no Firebase configured).

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create a new user document in Firestore (called after registration).
 */
export const createUserDoc = async (uid, userData) => {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Fetch a user document by UID.
 * @returns {Promise<Object|null>}
 */
export const getUserDoc = async (uid) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
};

/**
 * Update specific fields in a user document.
 */
export const updateUserDoc = async (uid, updates) => {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Activate or update a subscription on a user document.
 */
export const setUserSubscription = async (uid, subscription, tier = 'premium') => {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    tier,
    subscription,
    updatedAt: serverTimestamp(),
  });
};

// ─── Study Progress (SRS cards) ───────────────────────────────────────────────

/**
 * Save/update a single question's SRS progress for a user.
 * Path: users/{uid}/progress/{questionId}
 */
export const saveQuestionProgress = async (uid, questionId, progressData) => {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid, 'progress', questionId),
    { ...progressData, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

/**
 * Fetch all progress cards for a user.
 * @returns {Promise<Record<string, Object>>} — { questionId: progressData }
 */
export const getAllProgress = async (uid) => {
  if (!db) return {};
  const snap = await getDocs(collection(db, 'users', uid, 'progress'));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
};

// ─── Mock Exam History ────────────────────────────────────────────────────────

/**
 * Save a mock exam result.
 * Path: users/{uid}/mockHistory/{auto-id}
 */
export const saveMockResult = async (uid, result) => {
  if (!db) return;
  await addDoc(collection(db, 'users', uid, 'mockHistory'), {
    ...result,
    date: serverTimestamp(),
  });
};

/**
 * Fetch all mock exam history for a user, sorted by date descending.
 * @returns {Promise<Array>}
 */
export const getMockHistory = async (uid) => {
  if (!db) return [];
  const q = query(
    collection(db, 'users', uid, 'mockHistory'),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Daily Activity ───────────────────────────────────────────────────────────

/**
 * Increment the daily activity counter for today.
 * Path: users/{uid}/activity/{YYYY-MM-DD}
 */
export const incrementDailyActivity = async (uid) => {
  if (!db) return;
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'users', uid, 'activity', today);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { count: (snap.data().count || 0) + 1 });
  } else {
    await setDoc(ref, { count: 1, date: today });
  }
};

/**
 * Fetch the last N days of activity.
 * @returns {Promise<Record<string, number>>} — { 'YYYY-MM-DD': count }
 */
export const getRecentActivity = async (uid, days = 90) => {
  if (!db) return {};
  const snap = await getDocs(collection(db, 'users', uid, 'activity'));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data().count || 0; });
  return result;
};
